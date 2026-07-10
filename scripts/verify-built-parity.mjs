import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, '.tmp', 'reverse', 'parity-build');
const outputPath = path.join(outputDir, 'sim.mjs');
const goldenPath = path.join(root, 'tests', 'golden', 'original-sim-trajectory.json');
const reportPath = path.join(root, '.tmp', 'reverse', 'built-parity-report.json');

await build({
  root,
  configFile: false,
  logLevel: 'warn',
  build: {
    target: 'es2020',
    outDir: outputDir,
    emptyOutDir: true,
    minify: true,
    lib: {
      entry: path.join(root, 'src', 'sim', 'world.ts'),
      formats: ['es'],
      fileName: () => 'sim.mjs',
    },
  },
});

const simulation = await import(`${pathToFileURL(outputPath).href}?t=${Date.now()}`);
const golden = JSON.parse(await readFile(goldenPath, 'utf8'));

const inputForStep = (step, scenarioIndex) => {
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
};

const countBy = (items, field, knownValues) => {
  const counts = Object.fromEntries(knownValues.map((value) => [value, 0]));
  for (const item of items) counts[item[field]] = (counts[item[field]] || 0) + 1;
  return counts;
};

const snapshot = (step, world, systems, eventCounts) => {
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
        'kind',
        ['grunt', 'wanderer', 'singularity', 'dodger', 'boss'],
      ),
      items: world.items.length,
      itemsByKind: countBy(
        world.items.filter((item) => !item.dead),
        'kind',
        ['life', 'heal', 'weapon', 'boost', 'shield', 'multiplier'],
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
};

const compare = (actual, expected, location = 'root') => {
  if (typeof actual === 'number' && typeof expected === 'number') {
    if (Math.abs(actual - expected) > 1e-9) {
      throw new Error(`${location}: ${actual} != ${expected}`);
    }
    return;
  }
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) throw new Error(`${location}.length: ${actual.length} != ${expected.length}`);
    actual.forEach((value, index) => compare(value, expected[index], `${location}[${index}]`));
    return;
  }
  if (actual && expected && typeof actual === 'object' && typeof expected === 'object') {
    const actualKeys = Object.keys(actual).sort();
    const expectedKeys = Object.keys(expected).sort();
    if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
      throw new Error(`${location}.keys: ${JSON.stringify(actualKeys)} != ${JSON.stringify(expectedKeys)}`);
    }
    for (const key of expectedKeys) compare(actual[key], expected[key], `${location}.${key}`);
    return;
  }
  if (actual !== expected) throw new Error(`${location}: ${String(actual)} != ${String(expected)}`);
};

for (let scenarioIndex = 0; scenarioIndex < golden.scenarios.length; scenarioIndex += 1) {
  const expectedScenario = golden.scenarios[scenarioIndex];
  const { world, systems } = simulation.createWorld(expectedScenario.seed);
  const eventCounts = {};
  const actualSnapshots = [snapshot(0, world, systems, eventCounts)];
  for (let step = 1; step <= expectedScenario.steps; step += 1) {
    const events = simulation.stepWorld(world, systems, inputForStep(step, scenarioIndex), 1 / 60);
    for (const event of events) eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
    if (step % golden.snapshotInterval === 0 || step === expectedScenario.steps) {
      actualSnapshots.push(snapshot(step, world, systems, eventCounts));
    }
  }
  compare(actualSnapshots, expectedScenario.snapshots, `seed(${expectedScenario.seed})`);
}

const report = {
  status: 'PASS',
  tolerance: 1e-9,
  bundle: path.relative(root, outputPath),
  golden: path.relative(root, goldenPath),
  scenarios: golden.scenarios.map((scenario) => ({
    seed: scenario.seed,
    steps: scenario.steps,
    snapshots: scenario.snapshots.length,
  })),
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`built-parity=PASS report=${reportPath}`);
