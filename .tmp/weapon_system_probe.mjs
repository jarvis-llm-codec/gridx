import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('geometry_wars_3d_glm5_2.html', 'utf8');
const start = html.indexOf('const fe =');
const end = html.search(/\/\*\*\r?\n \* @license/);
assert(start >= 0 && end > start, 'standalone simulation slice markers missing');

const sim = new Function(
  html.slice(start, end) +
    '\nreturn { fe, PRIMARY_WEAPON, WEAPON_TYPES, WEAPON_DROP_ORDER, WEAPON_NAMES, Zr, Kl, makeItem, makeBoss, bossHit, applyItem, kl, Fb, Wl, resolveLightning, detonateMissile, xc };',
)();

const { world, systems } = sim.Zr(0x51a7);
world.enemies = [];
world.items = [];
world.bullets = [];

assert.equal(sim.PRIMARY_WEAPON, 'blaster');
assert.deepEqual([...sim.WEAPON_TYPES], ['blaster', 'missile', 'lightning', 'laser']);
assert.deepEqual([...sim.WEAPON_DROP_ORDER], ['missile', 'lightning', 'laser']);
assert.equal(sim.fe.player.maxWeaponLevel, 3, 'weapon level cap must be 3');
assert.equal(world.player.primaryWeapon, 'blaster');
assert.equal(world.player.secondaryWeapon, null);
assert.equal(world.player.weaponLevels.blaster, 1);

const totalDropWeight = Object.values(sim.fe.items.dropWeights).reduce((sum, weight) => sum + weight, 0);
const regularWeaponChance = sim.fe.items.dropChance * sim.fe.items.dropWeights.weapon / totalDropWeight;
assert(regularWeaponChance >= 0.07, `regular weapon chance too sparse: ${regularWeaponChance}`);
assert.deepEqual(sim.fe.items.bossWeaponDrops, { mini: 2, big: 3 });

const queued = sim.Zr(0x600d).world;
for (let i = 0; i < 3; i++) queued.items.push(sim.makeItem('weapon', { x: i, y: 0, z: 0 }, queued));
assert.deepEqual(
  queued.items.map((item) => item.weaponType),
  ['missile', 'lightning', 'laser'],
  'simultaneous boss drops must reserve each locked secondary before duplicating',
);

const unlocked = [];
for (const expected of sim.WEAPON_DROP_ORDER) {
  const item = sim.makeItem('weapon', { x: 0, y: 0, z: 0 }, world);
  assert.equal(item.weaponType, expected, 'new secondary pickups must unlock in a guaranteed order');
  unlocked.push(item.weaponType);
  sim.applyItem(world.player, item, world);
  assert.equal(world.player.primaryWeapon, 'blaster', 'special pickup must never replace the basic gun');
  assert.equal(world.player.secondaryWeapon, expected, 'latest special pickup must equip the secondary slot');
  assert.equal(world.player.weaponLevels.blaster, 1, 'basic gun must remain available at baseline level');
}
assert.deepEqual(unlocked, ['missile', 'lightning', 'laser']);

for (const [bossType, guaranteedCount] of [['mini', 2], ['big', 3]]) {
  const dropRun = sim.Zr(bossType === 'mini' ? 0x1111 : 0x2222);
  const boss = sim.makeBoss(bossType, dropRun.world, 1);
  dropRun.world.boss = boss;
  boss.hp = 1;
  sim.bossHit(boss, 1, dropRun.world, dropRun.systems);
  assert.equal(dropRun.world.items.length, sim.fe.items.bossDropCount, `${bossType} boss reward count changed`);
  const guaranteed = dropRun.world.items.slice(0, guaranteedCount);
  assert(guaranteed.every((item) => item.kind === 'weapon'), `${bossType} boss guaranteed secondary drops missing`);
  assert.equal(new Set(guaranteed.map((item) => item.weaponType)).size, guaranteedCount, `${bossType} boss secondaries must be diverse`);
}

sim.applyItem(world.player, { kind: 'weapon', weaponType: 'missile' }, world);
sim.applyItem(world.player, { kind: 'weapon', weaponType: 'missile' }, world);
sim.applyItem(world.player, { kind: 'weapon', weaponType: 'missile' }, world);
assert.equal(world.player.weaponLevels.missile, 3, 'duplicate secondary pickup must cap at level 3');
assert.equal(world.player.primaryWeapon, 'blaster');
assert.equal(world.player.secondaryWeapon, 'missile');

const fireWithSecondaryAtLevel3 = (weapon) => {
  world.bullets.length = 0;
  world.pendingLightning.length = 0;
  world.weaponEffects.length = 0;
  world.events.length = 0;
  world.player.primaryWeapon = weapon; // deliberately corrupt legacy state; kl must repair it
  world.player.secondaryWeapon = weapon;
  world.player.weaponLevels[weapon] = 3;
  world.player.weaponCooldowns.primary = 0;
  world.player.weaponCooldowns.secondary = 0;
  sim.kl(world.player, world);
  assert.equal(world.player.primaryWeapon, 'blaster', 'fire path must restore the permanent basic gun');
  assert(world.events.some((event) => event.type === 'weapon-fire' && event.weapon === 'blaster' && event.slot === 'primary'));
  assert(world.events.some((event) => event.type === 'weapon-fire' && event.weapon === weapon && event.slot === 'secondary'));
  assert(world.bullets.some((bullet) => bullet.kind === 'standard'), 'basic gun must fire alongside every secondary');
  return { bullets: [...world.bullets], lightning: [...world.pendingLightning], effects: [...world.weaponEffects] };
};

world.player.secondaryWeapon = null;
world.player.primaryWeapon = 'laser';
world.player.weaponCooldowns.primary = 0;
world.player.weaponCooldowns.secondary = 0;
world.bullets.length = 0;
world.events.length = 0;
sim.kl(world.player, world);
assert.equal(world.player.primaryWeapon, 'blaster');
assert.equal(world.bullets.filter((bullet) => bullet.kind === 'standard').length, 1, 'basic gun must fire even without a secondary');

const missileVolley = fireWithSecondaryAtLevel3('missile').bullets.filter((bullet) => bullet.kind === 'missile');
assert.equal(missileVolley.length, 2, 'L3 missile must fire a twin volley');
assert(missileVolley.every((bullet) => bullet.turnRate > 0 && bullet.blastRadius > 0));
const lightningVolley = fireWithSecondaryAtLevel3('lightning');
assert.equal(lightningVolley.lightning.length, 1, 'lightning must queue one instant chain');
const laserVolley = fireWithSecondaryAtLevel3('laser').bullets.filter((bullet) => bullet.kind === 'laser');
assert.equal(laserVolley.length, 1);
assert.equal(laserVolley[0].pierce, true);

world.enemies = [sim.Kl('grunt', { x: 8, y: 0, z: 0 }, world)];
world.enemies[0].hp = world.enemies[0].maxHp = 20;
const homing = sim.Fb('player', { x: 0, y: 0, z: 0 }, { x: 0, z: -1 }, world, {
  kind: 'missile', speed: 20, life: 3, damage: 5, turnRate: 7, blastRadius: 3,
});
sim.Wl(homing, 1 / 30, world);
assert(homing.vel.x > 0, 'missile must steer toward the nearest target');

world.pendingLightning = [{ pos: { x: 0, y: 0, z: 0 }, dir: { x: 1, z: 0 }, level: 3, damage: 2.5, range: 20 }];
world.weaponEffects.length = 0;
const hpBeforeLightning = world.enemies[0].hp;
sim.resolveLightning(world, systems);
assert(world.enemies[0].hp < hpBeforeLightning, 'chain lightning must damage a target');
const lightningFx = world.weaponEffects.filter((effect) => effect.kind === 'lightning');
assert(lightningFx.length >= 17, `lightning needs a dense bolt/branch/flash silhouette, got ${lightningFx.length} segments`);
const mainBoltFx = lightningFx.filter((effect) => effect.style === 'bolt');
assert(mainBoltFx.length >= 8, 'thick main lightning bolt is under-segmented');
const lateralOffsets = mainBoltFx.slice(0, -1).map((effect) => Math.abs(effect.to.z));
const directionFlips = mainBoltFx.slice(1, -1).reduce((count, effect, index) => {
  const previous = mainBoltFx[index].to.z;
  return count + (Math.sign(previous) !== 0 && Math.sign(effect.to.z) !== 0 && Math.sign(previous) !== Math.sign(effect.to.z) ? 1 : 0);
}, 0);
assert(Math.max(...lateralOffsets) >= 0.75, `lightning lateral deviation is too straight: ${Math.max(...lateralOffsets)}`);
assert(directionFlips >= 2, `lightning needs repeated electric zig-zag direction changes: ${directionFlips}`);
assert(lightningFx.filter((effect) => effect.style === 'branch').length >= 4, 'forked electric branches missing');
assert.equal(lightningFx.filter((effect) => effect.style === 'flash').length, 5, 'impact flash rays missing');
assert(lightningFx.every((effect) => effect.height >= 0.6), 'lightning must sit above the arena instead of being hidden by the floor');
assert(lightningFx.some((effect) => effect.maxLife >= 0.24), 'main discharge lifetime is too short to read');
assert.equal(world.pendingLightning.length, 0);

world.enemies[0].hp = 20;
const blast = sim.Fb('player', { x: 7.5, y: 0, z: 0 }, { x: 1, z: 0 }, world, {
  kind: 'missile', speed: 0, life: 1, damage: 6, blastRadius: 3,
});
const hpBeforeBlast = world.enemies[0].hp;
sim.detonateMissile(world, systems, blast);
assert.equal(blast.spent, true);
assert(world.enemies[0].hp < hpBeforeBlast, 'missile blast must apply radial damage');
assert(world.weaponEffects.some((effect) => effect.kind === 'missile'), 'missile explosion spokes missing');

assert(html.includes('this.weaponFxInst = new $n'), 'pooled weapon effect renderer missing');
assert(html.includes('haloWidth = style === "bolt" ? 5.6') && html.includes('bodyWidth = style === "bolt" ? 3.1') && html.includes('coreWidth = style === "bolt" ? 1.22') && html.includes('0x246bff') && html.includes('0x69dcff') && html.includes('0xffffff'), 'extra-thick three-layer lightning corona/body/core renderer missing');
assert(html.includes('fxA.y += height') && html.includes('fxB.y += height'), 'weapon effect height offset missing');
assert(html.includes('thunder.frequency.setValueAtTime(310') && html.includes('noiseDuration = isLightning ? 0.14'), 'heavy electric crack audio layer missing');
assert(html.includes('this.lastFireByWeapon[e]') && !html.includes('s - this.lastFire < 0.06'), 'special weapon audio must not be suppressed by same-frame blaster fire');
assert(html.includes('bullet.kind !== "missile"') && html.includes('WEAPON_COLORS.missile'), 'orange missile trail renderer missing');
assert(html.includes('u.hitIds.includes(h.id)') && html.includes('b.hitIds.includes(boss.id)'), 'piercing duplicate-hit guard missing');
assert(html.includes('MAIN BLASTER · ALWAYS') && html.includes('SUB ${WEAPON_NAMES[secondary]}'), 'permanent-primary HUD contract missing');
assert(html.includes('WEAPON · ${WEAPON_NAMES[item.weaponType]}'), 'weapon subtype label missing');

console.log(`WEAPON_SYSTEM_OK regularWeaponChance=${(regularWeaponChance * 100).toFixed(2)}% bossGuarantees=mini2+big3 basic=always secondaries=missile+lightning+laser levels=3`);
