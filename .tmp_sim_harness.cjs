// Headless harness for geometry_wars_3d_glm5_2.html
// Stubs DOM/window/Three deps enough to load the bundled script and drive the sim.
const fs = require("fs");
const vm = require("vm");

const html = fs.readFileSync(__dirname + "/geometry_wars_3d_glm5_2.html", "utf8");
let js = html.slice(6485, 586580);
// strip auto-bootstrap so we don't construct WebGL renderer
js = js.replace("yg();", "/*yg()*/");

// expose sim internals
js += "\nglobalThis.__sim={fe,Zr,xc,bossHit,fireSkill,Ol,Kl,Bl,bossForWave,makeBoss,stepItems,applyItem,fc,hc,Jr,Lo,ic};\n";

// ---- minimal DOM/window stubs ----
function fakeEl(id) {
  return {
    id, style: {}, classList: { toggle(){}, add(){}, remove(){}, contains(){return false;} },
    textContent: "", appendChild(){}, addEventListener(){}, removeEventListener(){},
    getContext(){ return null; }, getBoundingClientRect(){ return {width:800,height:600,left:0,top:0}; },
    width: 800, height: 600, dataset: {}, setAttribute(){}, removeAttribute(){}, innerHTML: "",
  };
}
const elements = {};
const document = {
  getElementById(id){ return elements[id] || (elements[id] = fakeEl(id)); },
  createElement(t){ return fakeEl(t); },
  createElementNS(_,t){ return fakeEl(t); },
  createTextNode(){ return fakeEl("text"); },
  body: fakeEl("body"),
  documentElement: fakeEl("html"),
  head: fakeEl("head"),
  addEventListener(){}, removeEventListener(){},
  querySelector(){ return null; }, querySelectorAll(){ return []; },
  defaultView: null,
};
const navigator = { userAgent: "node", platform: "node", maxTouchPoints: 0 };
const windowObj = {
  document, navigator,
  performance: { now: () => Date.now(), timing: {} },
  requestAnimationFrame: () => 1,
  cancelAnimationFrame: () => {},
  addEventListener(){}, removeEventListener(){},
  innerWidth: 800, innerHeight: 600,
  devicePixelRatio: 1,
  matchMedia: () => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }),
  location: { href: "http://localhost", hostname: "localhost" },
  AudioContext: function(){ return { createOscillator(){return {connect(){},start(){},stop(){},frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){},value:0},type:""};}, createGain(){return {connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){},value:0}};}, createBiquadFilter(){return {connect(){},frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){},value:0},type:""};}, createBufferSource(){return {connect(){},start(){},stop(){},buffer:null};}, createPanner(){return {connect(){},setPosition(){}};}, createDynamicsCompressor(){return {connect(){},threshold:{value:0}};}, destination:{}, currentTime:0, resume(){}, close(){}, sampleRate:44100, state:"running", decodeAudioData(){return Promise.resolve({});} }; },
  webkitAudioContext: function(){ return this.AudioContext(); },
};
document.defaultView = windowObj;
windowObj.window = windowObj;
windowObj.self = windowObj;
windowObj.globalThis = windowObj;

const sandbox = Object.create(null);
Object.assign(sandbox, windowObj);
sandbox.console = console;
sandbox.Math = Math;
sandbox.Date = Date;
sandbox.JSON = JSON;
sandbox.Promise = Promise;
sandbox.Object = Object;
sandbox.Array = Array;
sandbox.String = String;
sandbox.Number = Number;
sandbox.Boolean = Boolean;
sandbox.RegExp = RegExp;
sandbox.Error = Error;
sandbox.TypeError = TypeError;
sandbox.RangeError = RangeError;
sandbox.Set = Set;
sandbox.Map = Map;
sandbox.WeakMap = WeakMap;
sandbox.WeakSet = WeakSet;
sandbox.Symbol = Symbol;
sandbox.Reflect = Reflect;
sandbox.Proxy = Proxy;
sandbox.Float32Array = Float32Array;
sandbox.Float64Array = Float64Array;
sandbox.Uint8Array = Uint8Array;
sandbox.Uint16Array = Uint16Array;
sandbox.Uint32Array = Uint32Array;
sandbox.Int8Array = Int8Array;
sandbox.Int16Array = Int16Array;
sandbox.Int32Array = Int32Array;
sandbox.ArrayBuffer = ArrayBuffer;
sandbox.DataView = DataView;
sandbox.setTimeout = setTimeout;
sandbox.clearTimeout = clearTimeout;
sandbox.setInterval = () => 0;
sandbox.clearInterval = () => {};
sandbox.globalThis = sandbox;
function NoopCtor(){return {observe(){},disconnect(){},unobserve(){},takeRecords(){return [];}};}
sandbox.MutationObserver=NoopCtor;
sandbox.IntersectionObserver=NoopCtor;
sandbox.ResizeObserver=NoopCtor;
sandbox.HTMLElement=function(){};
sandbox.HTMLCanvasElement=function(){};
sandbox.HTMLImageElement=function(){};
sandbox.WebKitCSSMatrix=function(){return {};};
sandbox.CSS={supports(){return false;}, escape:(s)=>s};
sandbox.URL=sandbox.URL||URL;
sandbox.Blob=sandbox.Blob||function(){};
sandbox.FileReader=sandbox.FileReader||function(){};
sandbox.OffscreenCanvas=sandbox.OffscreenCanvas||function(){return fakeEl("offscreen");};
sandbox.Image=function(){return fakeEl("img");};
sandbox.HTMLVideoElement=function(){};
sandbox.WebGLRenderingContext=function(){};
sandbox.WebGL2RenderingContext=function(){};


vm.createContext(sandbox);
try {
  vm.runInContext(js, sandbox, { filename: "game.js", timeout: 60000 });
} catch (e) {
  console.log("LOAD ERROR:", e && e.stack || e);
  process.exit(1);
}

const S = sandbox.__sim;
if (!S) { console.log("NO __sim exported"); process.exit(1); }
console.log("sim loaded OK. fe keys:", Object.keys(S.fe).slice(0,8).join(","));

// Build a world+systems
const { world: w, systems: sys } = S.Zr(12345);
console.log("world built. wave=", sys.spawn.wave, "arena=", w.arenaRadius, "energy=", w.player.energy, "lives=", w.player.lives);

// jump to a boss wave directly
sys.spawn.wave = 3; // mini boss wave (wave%10 === miniWave(3))
const dt = 1/60;
const input = { moveX:0, moveZ:0, aimX:0, aimZ:-1, firing:false, boost:false, pause:false, mute:false, restart:false, skill:false };

// step until a boss spawns
let bossSpawned = false;
for (let i=0;i<600 && !bossSpawned;i++){
  S.xc(w, sys, input, dt);
  if (w.boss) { bossSpawned=true; console.log("boss spawned at step",i,"wave",sys.spawn.wave,"bossType",w.boss.bossType,"hp",w.boss.hp,"pos",JSON.stringify(w.boss.pos)); }
}
if (!bossSpawned){ console.log("boss never spawned. bossForWave(3)=",S.bossForWave(3)); }

// now kill the boss: set player adjacent to boss, fire bullets, loop until boss dead -> watch for throw
if (w.boss){
  w.player.pos = { x: w.boss.pos.x, y:0, z: w.boss.pos.z };
  let killed=false, lastErr=null;
  for (let i=0;i<2000 && !killed;i++){
    input.firing = true;
    try {
      S.xc(w, sys, input, dt);
    } catch(e){ lastErr = e; break; }
    if (!w.boss || w.boss.dead){ killed=true; console.log("boss dead at step",i,"events tail:", w.events.map(e=>e.type).slice(-6).join(",")); }
  }
  console.log("killed:", killed, "lastErr:", lastErr && (lastErr.stack||lastErr.message||lastErr));
  console.log("after death -> wave:", sys.spawn.wave, "boss:", w.boss, "energy:", w.player.energy, "lives:", w.player.lives, "items:", w.items.length);
  // continue stepping to see if it freezes (no throw) or throws later
  let postErr=null, steps=0;
  for (let i=0;i<600;i++){ try{ S.xc(w,sys,input,dt); steps++; }catch(e){ postErr=e; break; } }
  console.log("post-death steps ok:", steps, "err:", postErr && (postErr.stack||postErr.message));
  console.log("final wave:", sys.spawn.wave, "enemies:", w.enemies.length, "energy:", w.player.energy.toFixed(1));
}

// Now test the SKILL path: refill energy, fire skill, check deplete + throw
const w2 = S.Zr(99999);
w2.world; const sys2 = w2.systems, ww = w2.world;
ww.player.energy = S.fe.player.maxEnergy;
const inp2 = { moveX:0,moveZ:0,aimX:0,aimZ:-1,firing:false,boost:false,pause:false,mute:false,restart:false,skill:true };
let err2=null;
try { S.xc(ww, sys2, inp2, dt); } catch(e){ err2=e; }
console.log("SKILL test: energy after=", ww.player.energy, "events:", ww.events.map(e=>e.type).join(","), "err:", err2 && (err2.stack||err2.message));