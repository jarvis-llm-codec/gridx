const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "geometry_wars_3d_glm5_2.html");
const defaultOutputPath = path.join(root, "tests", "golden", "original-sim-trajectory.json");
const stepsPerScenario = 3000;
const snapshotInterval = 30;
const seeds = [12345, 24680, 987654321];

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function fakeElement(id) {
  return {
    id,
    style: {},
    classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
    textContent: "",
    value: "",
    innerHTML: "",
    dataset: {},
    width: 800,
    height: 600,
    appendChild() {},
    remove() {},
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    removeAttribute() {},
    getContext() { return null; },
    getBoundingClientRect() { return { width: 800, height: 600, left: 0, top: 0 }; },
  };
}

function createSandbox() {
  const elements = {};
  const document = {
    getElementById(id) { return elements[id] || (elements[id] = fakeElement(id)); },
    createElement(type) { return fakeElement(type); },
    createElementNS(_namespace, type) { return fakeElement(type); },
    createTextNode() { return fakeElement("text"); },
    body: fakeElement("body"),
    documentElement: fakeElement("html"),
    head: fakeElement("head"),
    addEventListener() {},
    removeEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    defaultView: null,
  };
  const navigator = { userAgent: "node", platform: "node", maxTouchPoints: 0 };
  const windowObject = {
    document,
    navigator,
    performance: { now: () => 0, timing: {} },
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
    addEventListener() {},
    removeEventListener() {},
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1,
    matchMedia: () => ({
      matches: false,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
    }),
    location: { href: "http://localhost", hostname: "localhost" },
  };
  document.defaultView = windowObject;

  const sandbox = Object.create(null);
  Object.assign(sandbox, windowObject);
  Object.assign(sandbox, {
    console,
    Math,
    Date,
    JSON,
    Promise,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
    TypeError,
    RangeError,
    Set,
    Map,
    WeakMap,
    WeakSet,
    Symbol,
    Reflect,
    Proxy,
    Float32Array,
    Float64Array,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    Int8Array,
    Int16Array,
    Int32Array,
    ArrayBuffer,
    DataView,
    URL,
    TextDecoder,
    TextEncoder,
    setTimeout,
    clearTimeout,
    setInterval: () => 0,
    clearInterval() {},
    fetch: async () => ({ ok: true, json: async () => [], text: async () => "" }),
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  });

  function NoopObserver() {
    return { observe() {}, disconnect() {}, unobserve() {}, takeRecords() { return []; } };
  }
  Object.assign(sandbox, {
    MutationObserver: NoopObserver,
    IntersectionObserver: NoopObserver,
    ResizeObserver: NoopObserver,
    HTMLElement: function HTMLElement() {},
    HTMLCanvasElement: function HTMLCanvasElement() {},
    HTMLImageElement: function HTMLImageElement() {},
    HTMLVideoElement: function HTMLVideoElement() {},
    WebKitCSSMatrix: function WebKitCSSMatrix() { return {}; },
    WebGLRenderingContext: function WebGLRenderingContext() {},
    WebGL2RenderingContext: function WebGL2RenderingContext() {},
    CSS: { supports() { return false; }, escape: (value) => value },
    Blob: globalThis.Blob || function Blob() {},
    FileReader: function FileReader() {},
    OffscreenCanvas: function OffscreenCanvas() { return fakeElement("offscreen"); },
    Image: function Image() { return fakeElement("img"); },
  });
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  return sandbox;
}

function extractModuleScript(html) {
  const openTag = '<script type="module">';
  const openIndex = html.indexOf(openTag);
  const closeIndex = html.lastIndexOf("</script>");
  if (openIndex < 0 || closeIndex < 0 || closeIndex <= openIndex) {
    throw new Error("Unable to locate canonical module script");
  }
  const body = html.slice(openIndex + openTag.length, closeIndex);
  if (!/\byg\(\);\s*$/.test(body)) {
    throw new Error("Unable to locate the canonical auto-bootstrap call");
  }
  return body.replace(
    /\byg\(\);\s*$/,
    "globalThis.__sim = { fe, Zr, xc };\n",
  );
}

function loadOriginalSimulation(html) {
  const sandbox = createSandbox();
  vm.createContext(sandbox);
  vm.runInContext(extractModuleScript(html), sandbox, {
    filename: "geometry-wars-original.js",
    timeout: 60_000,
  });
  if (!sandbox.__sim) throw new Error("Simulation exports were not installed");
  return sandbox.__sim;
}

function inputForStep(step, scenarioIndex) {
  const moveAngle = step * (0.011 + scenarioIndex * 0.0007) + scenarioIndex * 1.7;
  const aimAngle = step * (0.019 + scenarioIndex * 0.0009) + scenarioIndex * 0.4;
  return {
    moveX: Math.cos(moveAngle),
    moveZ: Math.sin(moveAngle),
    aimX: Math.cos(aimAngle),
    aimZ: Math.sin(aimAngle),
    firing: step % 11 !== 0,
    boost: step % 480 < 72,
    pause: false,
    mute: false,
    restart: false,
    skill: step > 0 && step % 900 === 0,
  };
}

function countBy(items, field, knownValues) {
  const counts = Object.fromEntries(knownValues.map((value) => [value, 0]));
  for (const item of items) {
    const value = item[field];
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

function snapshot(step, world, systems, eventCounts) {
  const player = world.player;
  const boss = world.boss && !world.boss.dead ? world.boss : null;
  return {
    step,
    time: world.time,
    player: {
      pos: { ...player.pos },
      vel: { ...player.vel },
      aim: { ...player.aim },
      hp: player.hp,
      alive: player.alive,
      lives: player.lives,
      energy: player.energy,
      boost: player.boost,
      score: player.score,
      multiplier: player.multiplier,
      invuln: player.invuln,
      shield: player.shield,
      hitCount: player.hitCount,
      primaryWeapon: player.primaryWeapon,
      secondaryWeapon: player.secondaryWeapon,
      weaponLevels: { ...player.weaponLevels },
    },
    counts: {
      bullets: world.bullets.length,
      enemies: world.enemies.length,
      enemiesByKind: countBy(
        world.enemies.filter((enemy) => !enemy.dead),
        "kind",
        ["grunt", "wanderer", "singularity", "dodger", "boss"],
      ),
      items: world.items.length,
      itemsByKind: countBy(
        world.items.filter((item) => !item.dead),
        "kind",
        ["life", "heal", "weapon", "boost", "shield", "multiplier"],
      ),
      particles: world.particles.length,
      impulses: world.impulses.length,
      pendingBursts: world.pendingBursts.length,
      weaponEffects: world.weaponEffects.length,
    },
    boss: boss
      ? {
          bossType: boss.bossType,
          bossNumber: boss.bossNumber,
          rageLevel: boss.rageLevel,
          hp: boss.hp,
          maxHp: boss.maxHp,
          pos: { ...boss.pos },
          fireCooldown: boss.fireCooldown,
        }
      : null,
    spawn: {
      wave: systems.spawn.wave,
      timer: systems.spawn.timer,
      budget: systems.spawn.budget,
      killsThisWave: systems.spawn.killsThisWave,
      bossTimer: systems.spawn.bossTimer,
      bossTimerMax: systems.spawn.bossTimerMax,
      bossIndex: systems.spawn.bossIndex,
    },
    bossActiveWave: world.bossActiveWave,
    bossDefeatedWaves: [...world.bossDefeatedWaves].sort((a, b) => a - b),
    gameOver: world.gameOver,
    rngState: world.rng.state(),
    eventCounts: { ...eventCounts },
  };
}

function runScenario(sim, seed, scenarioIndex) {
  const { world, systems } = sim.Zr(seed);
  const dt = sim.fe.fixedStep;
  const eventCounts = {};
  const snapshots = [snapshot(0, world, systems, eventCounts)];

  for (let step = 1; step <= stepsPerScenario; step += 1) {
    const events = sim.xc(world, systems, inputForStep(step, scenarioIndex), dt);
    for (const event of events) eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
    if (step % snapshotInterval === 0 || step === stepsPerScenario) {
      snapshots.push(snapshot(step, world, systems, eventCounts));
    }
  }

  return { seed, steps: stepsPerScenario, snapshots };
}

function generateGolden(html) {
  const sim = loadOriginalSimulation(html);
  return {
    formatVersion: 1,
    source: path.basename(sourcePath),
    sourceSha256: sha256(Buffer.from(html, "utf8")),
    fixedStep: sim.fe.fixedStep,
    snapshotInterval,
    inputProfile: "deterministic-lissajous-v1",
    scenarios: seeds.map((seed, index) => runScenario(sim, seed, index)),
  };
}

function parseArgs(argv) {
  const outputIndex = argv.indexOf("--output");
  const verifyIndex = argv.indexOf("--verify");
  return {
    outputPath: outputIndex >= 0 ? path.resolve(argv[outputIndex + 1]) : defaultOutputPath,
    verifyPath: verifyIndex >= 0 ? path.resolve(argv[verifyIndex + 1]) : null,
  };
}

const { outputPath, verifyPath } = parseArgs(process.argv.slice(2));
const html = fs.readFileSync(sourcePath, "utf8");
const first = generateGolden(html);
const second = generateGolden(html);
assert.deepStrictEqual(second, first, "Original simulation is not deterministic");

if (verifyPath) {
  const expected = JSON.parse(fs.readFileSync(verifyPath, "utf8"));
  assert.deepStrictEqual(first, expected, `Golden trajectory mismatch: ${verifyPath}`);
  console.log(`determinism=PASS golden=PASS scenarios=${seeds.length} steps=${stepsPerScenario}`);
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(first, null, 2)}\n`, "utf8");
  console.log(`determinism=PASS wrote=${outputPath} scenarios=${seeds.length} steps=${stepsPerScenario}`);
}
