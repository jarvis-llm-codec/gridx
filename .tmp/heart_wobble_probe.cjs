const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('geometry_wars_3d_glm5_2.html', 'utf8');
const qrMatch = html.match(/qr = \(i, e, t\) => \{([\s\S]*?)\r?\n  \};\r?\nconst PRIMARY_WEAPON/);
const loMatch = html.match(/Lo = (\(i, e, t, n\) => \(\{[\s\S]*?\n  \}\)),\r?\n  Ul/);
const doMatch = html.match(/Do = (\(i\) => \{[\s\S]*?\n  \}),\r?\n  Uo/);
const uoMatch = html.match(/Uo = (\(i, e, t, n = !1\) => \{[\s\S]*?\n  \}),\r?\n  Il/);
const wsMatch = html.match(/const ws=(\(i,e,t,n\)=>\{.*?\}),pg=/);
assert(qrMatch, 'qr damage handler not found');
assert(loMatch && doMatch && uoMatch && wsMatch, 'coupled ripple helpers not found');

const context = {
  Math,
  fe: {
    worldBounds: 48,
    player: { shieldTime: 1.4 },
    particles: { hitPlayer: 26 },
    grid: { impulseStrength: 6 },
  },
  Pn: { radius: 90, capHalfAngle: 0.7 },
  Li: (i, e, t) => {
    const angle = Math.min(1, Math.hypot(i, e)) * t.capHalfAngle;
    const azimuth = Math.atan2(e, i);
    const sin = Math.sin(angle);
    const x = t.radius * sin * Math.cos(azimuth);
    const z = t.radius * sin * Math.sin(azimuth);
    const y = t.radius * Math.cos(angle);
    return { x, y, z, nx: x / t.radius, ny: y / t.radius, nz: z / t.radius };
  },
  ic: () => {},
  result: null,
};
vm.createContext(context);
vm.runInContext(
  `const Lo = ${loMatch[1]}; const Do = ${doMatch[1]}; const Uo = ${uoMatch[1]}; const ws = ${wsMatch[1]}; this.helpers = { Lo, Uo, ws };`,
  context,
);
vm.runInContext(`const qr = (i, e, t) => {${qrMatch[1]}\n}; this.result = qr;`, context);

const player = {
  alive: true,
  invuln: 0,
  pos: { x: 7.25, y: 0, z: -4.5 },
  vel: { x: 3, y: 0, z: -2 },
  hitCount: 2,
  lives: 3,
  hp: 100,
  maxHp: 100,
  weaponLevel: 2,
  weaponLevels: { blaster: 1, missile: 2, lightning: 0, laser: 0 },
  primaryWeapon: 'blaster',
  secondaryWeapon: 'missile',
  shield: 0,
};
const world = { events: [], impulses: [], eventWobble: 0, gameOver: false };
assert.equal(context.result(player, 25, world), true);
assert.deepStrictEqual(JSON.parse(JSON.stringify(player.pos)), { x: 7.25, y: 0, z: -4.5 });
assert.deepStrictEqual(JSON.parse(JSON.stringify(player.vel)), { x: 0, y: 0, z: 0 });
assert.equal(player.lives, 2);
assert.equal(player.hitCount, 0);
assert.equal(world.eventWobble, 0.72);
const revive = world.events.find((e) => e.type === 'revive');
assert(revive, 'revive event missing');
assert.deepStrictEqual(JSON.parse(JSON.stringify(revive.pos)), { x: 7.25, y: 0, z: -4.5 });
const impulse = world.impulses.at(-1);
assert.equal(impulse.x, 7.25);
assert.equal(impulse.z, -4.5);
assert.equal(impulse.strength, 12);
assert.equal(impulse.coupleEntities, true, 'heart-loss ripple must carry entities');

const regular = context.helpers.Lo(0, 0, 3, { speed: 8, wavelength: 14 });
const coupled = context.helpers.Lo(0, 0, 3, { speed: 8, wavelength: 14, coupleEntities: true });
regular.age = coupled.age = 0.25;
const regularGrid = context.helpers.Uo([regular], 6, 0);
const regularEntity = context.helpers.Uo([regular], 6, 0, true);
const coupledGrid = context.helpers.Uo([coupled], 6, 0);
const coupledEntity = context.helpers.Uo([coupled], 6, 0, true);
assert(Math.abs(regularGrid) > 0.01, 'ordinary ripple should still deform the grid');
assert.equal(regularEntity, 0, 'ordinary ripple must remain grid-only');
assert(Math.abs(coupledGrid) > 0.01, 'death ripple should deform the grid');
assert(Math.abs(coupledGrid - coupledEntity) < 1e-12, 'death ripple samples must match for grid and entities');

const mapped = { set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } };
context.helpers.ws(6, 0, [coupled], mapped);
const base = context.Li(6 / context.fe.worldBounds, 0, context.Pn);
assert(Math.abs(mapped.x - (base.x + base.nx * coupledGrid)) < 1e-12);
assert(Math.abs(mapped.y - (base.y + base.ny * coupledGrid)) < 1e-12);
assert(Math.abs(mapped.z - (base.z + base.nz * coupledGrid)) < 1e-12);

const gridClass = html.slice(html.indexOf('class mg {'), html.indexOf('const Ro ='));
const entityClass = html.slice(html.indexOf('class _g {'), html.indexOf('class vg {'));
assert(!gridClass.includes('this.mesh.position.set('), 'grid still owns a separate rigid transform');
assert(!entityClass.includes('this.group.position.set('), 'entities still own a separate rigid transform');
assert(html.includes('this.scene.add(this.eventGroup)'), 'shared event group missing from scene');
assert(html.includes('this.eventGroup.add(this.grid.mesh)'), 'grid not parented to shared event group');
assert(html.includes('this.eventGroup.add(this.particles.mesh)'), 'particles not parented to shared event group');
assert(html.includes('this.eventGroup.add(this.entities.group)'), 'entities not parented to shared event group');
assert(html.includes('setWorldEventTransform(this.eventGroup, e.eventWobble, e.time)'), 'shared transform not updated');
assert.equal((html.match(/coupleEntities: !0/g) || []).length, 4, 'only self-destruct, heart-loss, player-death, and boss-death ripples should be coupled');
assert(html.includes('eventTier: "heart"'), 'heart-loss ripple tier missing');
assert(html.includes('eventTier: "localBlast"'), 'self-destruct local ripple tier missing');
assert.equal((html.match(/eventTier: "death"/g) || []).length, 2, 'player/boss death tiers missing');
assert(html.includes('fe.grid.impulseStrength * 1.5)))'), 'ordinary player-hit ripple was changed');
console.log('HEART_POSITION_AND_GROUND_SYNC_OK');
