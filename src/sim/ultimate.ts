// ultimate.ts — Secondary-weapon ultimates (one button, time cooldown).
// missile → MISSILE STORM: staggered 360° volley of 20 homing missiles.
// lightning → TEMPEST: full-arena multi-shot chain lightning (no aim cone).
// laser → OVERDRIVE: timed barrage of piercing beam fans tracking the aim.
// Pure sim: spawns bullets / pendingLightning / effects only; damage rides
// the existing collision + resolveLightning paths in world.ts.
import { CONFIG } from '../core/config.js';
import type { PlayerState, World } from '../core/types.js';
import { addTrauma } from '../systems/cameraShake.js';
import { spawnBullet } from './bullet.js';
import { addWeaponArc, WEAPON_COLORS } from './weapons.js';
import type { WorldSystems } from './world.js';

const aimAngle = (player: PlayerState): number => Math.atan2(player.aim.z, player.aim.x);

const muzzleAt = (player: PlayerState, angle: number, reach: number) => ({
  x: player.pos.x + Math.cos(angle) * reach,
  y: 0,
  z: player.pos.z + Math.sin(angle) * reach,
});

export const canFireUltimate = (player: PlayerState): boolean =>
  player.alive && player.secondaryWeapon !== null && player.ultimateCooldown <= 0;

/** Activate the equipped secondary's ultimate. Caller gates via canFireUltimate. */
export const fireUltimate = (world: World, systems: WorldSystems): void => {
  const player = world.player;
  const weapon = player.secondaryWeapon;
  if (!weapon) return;
  const level = Math.max(1, Math.min(CONFIG.player.maxWeaponLevel, player.weaponLevels[weapon] || 1));
  player.ultimateCooldown = CONFIG.ultimate.cooldown;

  if (weapon === 'missile') {
    world.ultimateVolley = { remaining: CONFIG.ultimate.missile.count, timer: 0, level };
  } else if (weapon === 'lightning') {
    const cfg = CONFIG.ultimate.lightning;
    const base = aimAngle(player);
    for (let shot = 0; shot < cfg.shots; shot += 1) {
      const angle = base + (shot / cfg.shots) * Math.PI * 2;
      const dir = { x: Math.cos(angle), y: 0, z: Math.sin(angle) };
      world.pendingLightning.push({
        pos: muzzleAt(player, angle, player.radius + 0.28),
        dir,
        level,
        damage: (CONFIG.player.weapons.lightning.damage + (level - 1) * 0.65) * cfg.damageMul,
        range: cfg.range,
        superChains: cfg.chains,
        chainRange: cfg.chainRange,
        noCone: true,
      });
    }
    // Visual crackle: a rotating sweep drained by stepUltimate — bolts walk
    // the full circle over time instead of flashing once ("펑" complaint).
    world.ultimateTempest = { remaining: cfg.sweepBolts, timer: 0, base };
  } else {
    world.ultimateBeam = { t: CONFIG.ultimate.laser.duration, tick: 0, level };
  }

  // No grid impulse on purpose — the floor stays calm during ultimates
  // (playtest feedback: the wobble read as noise, not spectacle).
  world.events.push({ type: 'ultimate-fire', pos: { ...player.pos }, weapon });
  world.pendingBursts.push({
    pos: { ...player.pos },
    remaining: CONFIG.particles.perBigKill * 2,
    color: WEAPON_COLORS[weapon],
    perFrame: 100,
  });
  systems.shake = addTrauma(systems.shake, 0.7);
  world.trauma = systems.shake.trauma;
};

/** Drain staggered volley / timed barrage state each fixed step. */
export const stepUltimate = (world: World, dt: number): void => {
  const player = world.player;

  const volley = world.ultimateVolley;
  if (volley) {
    const cfg = CONFIG.ultimate.missile;
    volley.timer -= dt;
    while (volley.timer <= 0 && volley.remaining > 0) {
      const wave = Math.min(cfg.perWave, volley.remaining);
      const launched = cfg.count - volley.remaining;
      for (let index = 0; index < wave; index += 1) {
        const angle = aimAngle(player) + ((launched + index) / cfg.count) * Math.PI * 2;
        const dir = { x: Math.cos(angle), y: 0, z: Math.sin(angle) };
        spawnBullet('player', muzzleAt(player, angle, player.radius + 0.4), dir, world, {
          kind: 'missile',
          speed: cfg.speed + world.rng.range(-1.5, 1.5),
          life: cfg.life,
          damage: (CONFIG.player.weapons.missile.damage + volley.level * 0.9) * cfg.damageMul,
          radius: 0.36,
          turnRate: cfg.turnRate,
          blastRadius: cfg.blastRadius,
          level: volley.level,
        });
      }
      volley.remaining -= wave;
      volley.timer += cfg.waveInterval;
    }
    if (volley.remaining <= 0) world.ultimateVolley = null;
  }

  const tempest = world.ultimateTempest;
  if (tempest) {
    const cfg = CONFIG.ultimate.lightning;
    const armSpan = (Math.PI * 2) / cfg.arms;
    const edgeRadius = world.arenaRadius - 0.5;
    tempest.timer -= dt;
    while (tempest.timer <= 0 && tempest.remaining > 0) {
      const index = cfg.sweepBolts - tempest.remaining;
      const progress = index / cfg.sweepBolts;
      for (let arm = 0; arm < cfg.arms; arm += 1) {
        const angle = tempest.base + (progress + arm) * armSpan;
        const dirX = Math.cos(angle);
        const dirZ = Math.sin(angle);
        const along = player.pos.x * dirX + player.pos.z * dirZ;
        const reach = -along + Math.sqrt(Math.max(0,
          along * along + edgeRadius * edgeRadius - (player.pos.x ** 2 + player.pos.z ** 2)));
        const tip = { x: player.pos.x + dirX * reach, z: player.pos.z + dirZ * reach };
        addWeaponArc(world, 'lightning', { x: player.pos.x, z: player.pos.z }, tip, index * 7 + arm * 13 + 3);
        world.pendingBursts.push({
          pos: { x: tip.x, y: 0, z: tip.z },
          remaining: cfg.sparkPerBolt,
          color: WEAPON_COLORS.lightning,
          perFrame: cfg.sparkPerBolt,
        });
      }
      tempest.remaining -= 1;
      tempest.timer += cfg.sweepInterval;
    }
    if (tempest.remaining <= 0) world.ultimateTempest = null;
  }

  const beam = world.ultimateBeam;
  if (beam) {
    const cfg = CONFIG.ultimate.laser;
    beam.t -= dt;
    beam.tick -= dt;
    while (beam.tick <= 0 && beam.t > 0 && player.alive) {
      const base = aimAngle(player);
      const spread = (cfg.spreadDeg * Math.PI) / 180;
      for (let index = 0; index < cfg.beamsPerBurst; index += 1) {
        const angle = base + (index - (cfg.beamsPerBurst - 1) / 2) * spread;
        const dir = { x: Math.cos(angle), y: 0, z: Math.sin(angle) };
        const muzzle = muzzleAt(player, angle, player.radius + 0.28);
        spawnBullet('player', muzzle, dir, world, {
          kind: 'laser',
          speed: cfg.speed,
          life: cfg.life,
          damage: (CONFIG.player.weapons.laser.damage + beam.level * 0.5) * cfg.damageMul,
          radius: 0.46,
          pierce: true,
          level: beam.level,
        });
        world.weaponEffects.push({
          kind: 'laser',
          from: { x: muzzle.x, z: muzzle.z },
          to: { x: muzzle.x + dir.x * (12 + beam.level * 2), z: muzzle.z + dir.z * (12 + beam.level * 2) },
          life: 0.09,
          maxLife: 0.09,
        });
      }
      beam.tick += cfg.burstInterval;
    }
    if (beam.t <= 0) world.ultimateBeam = null;
  }
};
