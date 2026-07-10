import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const html = readFileSync(new URL('../geometry_wars_3d_glm5_2.html', import.meta.url), 'utf8');
const start = html.indexOf('const fe =');
const end = html.search(/\/\*\*\r?\n \* @license/);
if (start < 0 || end < 0) throw new Error('slice markers not found');
const code = html.slice(start, end);
const api = new Function(code + '\nreturn {fe,Zr,xc,makeItem,Jr,stepItems,fireSkill,fs,ic,Lo,Ul,Uo};')();
const { fe, Zr, xc, makeItem, Lo, Uo } = api;

function stressPickup(count, kind='weapon') {
  const { world, systems } = Zr(1234);
  world.player.pos.x = 0; world.player.pos.z = 0;
  world.player.alive = true;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = (i % 8) * 0.06;
    world.items.push(makeItem(kind, { x: Math.cos(a) * r, y: 0, z: Math.sin(a) * r }, world));
  }
  const before = performance.now();
  const events = xc(world, systems, {moveX:0,moveZ:0,aimX:0,aimZ:-1,firing:false,boost:false,skill:false,pause:false,mute:false,restart:false}, 1/60);
  const ms = performance.now() - before;
  return { count, kind, ms, items: world.items.length, particles: world.particles.length, bursts: world.pendingBursts.length, events: events.filter(e=>e.type==='pickup').length, weaponLevel: world.player.weaponLevel, lives: world.player.lives };
}

function impulseCost(count, samples=9408) {
  const imps = [];
  for (let i=0;i<count;i++) imps.push(Lo(Math.cos(i)*2, Math.sin(i)*2, fe.grid.impulseStrength, {lifespan:2.4}));
  const coords = new Float32Array(samples*2);
  for (let i=0;i<samples;i++) { coords[i*2] = ((i%97)/97*2-1)*fe.worldBounds; coords[i*2+1] = ((i%89)/89*2-1)*fe.worldBounds; }
  const t0 = performance.now();
  let acc=0;
  for (let i=0;i<samples;i++) acc += Uo(imps, coords[i*2], coords[i*2+1]);
  return { impulses: count, samples, ms: performance.now()-t0, acc: Number(acc.toFixed(3)) };
}

const results = [];
for (const k of ['weapon','life','shield','boost','heal','multiplier']) results.push(stressPickup(1,k));
for (const c of [6,30,128,512,2000]) results.push(stressPickup(c,'weapon'));
console.log(JSON.stringify({pickup: results, impulse: [0,5,10,20,48].map(c=>impulseCost(c))}, null, 2));
