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
    // TEMPEST: sustained straight searing streams, drained in stepUltimate.
    world.ultimateTempest = { t: CONFIG.ultimate.lightning.duration, tick: 0, level };
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
    tempest.t -= dt;
    tempest.tick -= dt;
    while (tempest.tick <= 0 && tempest.t > 0 && player.alive) {
      const base = aimAngle(player);
      const spread = (cfg.spreadDeg * Math.PI) / 180;
      const tickIndex = Math.round((cfg.duration - tempest.t) / cfg.interval);
      for (let stream = 0; stream < cfg.streams; stream += 1) {
        const angle = base + (stream - (cfg.streams - 1) / 2) * spread;
        const dir = { x: Math.cos(angle), z: Math.sin(angle) };
        const muzzle = muzzleAt(player, angle, player.radius + 0.3);
        const tip = { x: muzzle.x + dir.x * cfg.length, z: muzzle.z + dir.z * cfg.length };
        // Long bolts every tick: overlapping 0.24s lifetimes flicker like a
        // held-down arc welder; damage rides the pendingSears queue.
        addWeaponArc(world, 'lightning', { x: muzzle.x, z: muzzle.z }, tip, tickIndex * 11 + stream * 5 + 3);
        world.pendingSears.push({
          from: { x: muzzle.x, z: muzzle.z },
          to: tip,
          damage: cfg.damage,
          width: cfg.width,
        });
      }
      world.events.push({
        type: 'weapon-fire',
        pos: { ...player.pos },
        weapon: 'lightning',
        level: tempest.level,
        slot: 'secondary',
      });
      tempest.tick += cfg.interval;
    }
    if (tempest.t <= 0) world.ultimateTempest = null;
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
