// world.ts — Deterministic simulation core. stepWorld(world, input, dt) is pure
// (no Three.js/DOM), consumes one InputState, mutates world, returns GameEvent[].
// All randomness flows through world.rng (seeded at creation) so the regression
// invariant holds: same seed + same inputs => same state.

import type { World, GameEvent, BulletState, EnemyState } from '../core/types.js';
import { CONFIG } from '../core/config.js';
import { createRng } from '../math/rng.js';
import { createPlayer, stepPlayer, tryFire, damagePlayer } from './player.js';
import { firePlayerBullet, stepBullet, bulletAlive } from './bullet.js';
import { damageEnemy } from './enemy.js';
import { stepEnemyBehavior } from './enemyBehaviors.js';
import { spawnBurst, stepParticle } from './particles.js';
import { createImpulse, advanceImpulses } from '../math/wave.js';
import { stepScore, recordKill, createScoreSystem, type ScoreSystemState, resetCombo } from '../systems/score.js';
import { stepSpawn, advanceWave, createSpawnSystem, type SpawnSystemState } from '../systems/spawn.js';
import { addTrauma, stepCameraShake, createCameraShake, type CameraShakeState } from '../systems/cameraShake.js';
import { spatialHashPairs } from '../physics/collision.js';
import { enemyColor } from '../core/palette.js';

export interface WorldSystems {
  score: ScoreSystemState;
  spawn: SpawnSystemState;
  shake: CameraShakeState;
}

export const createWorld = (seed: number): { world: World; systems: WorldSystems } => {
  const rng = createRng(seed);
  const arenaR = CONFIG.worldBounds;
  const player = createPlayer();
  const world: World = {
    seed,
    rng,
    time: 0,
    arenaRadius: arenaR,
    player,
    bullets: [],
    enemies: [],
    particles: [],
    impulses: [],
    events: [],
    spawnState: { timer: 0, wave: 1, budget: CONFIG.spawn.waveBudgetGrowth, toSpawn: 0 },
    trauma: 0,
    gameOver: false,
    nextId: 1,
  };
  const systems: WorldSystems = {
    score: createScoreSystem(),
    spawn: createSpawnSystem(),
    shake: createCameraShake(seed ^ 0xabc123),
  };
  return { world, systems };
};

const killEnemy = (world: World, systems: WorldSystems, enemy: EnemyState): void => {
  const color = enemyColor(enemy.kind);
  const scoreRes = recordKill(systems.score, enemy, world.player, world.time);
  systems.score = scoreRes.sys;
  world.events.push(...scoreRes.events);
  // Particles scaled by hp (big enemies = big burst)
  const big = enemy.kind === 'singularity';
  spawnBurst(enemy.pos, big ? CONFIG.particles.perBigKill : CONFIG.particles.perKill, color, world);
  // Wave impulse on kill
  world.impulses.push(createImpulse(enemy.pos.x, enemy.pos.z, CONFIG.grid.impulseStrength * (big ? 2 : 1)));
  // Trauma
  systems.shake = addTrauma(systems.shake, big ? 0.7 : 0.18);
  world.trauma = systems.shake.trauma;
  // Wave advance
  systems.spawn.killsThisWave += 1;
  systems.spawn = advanceWave(systems.spawn, systems.spawn.killsThisWave);
  // Singularity chain explosion: damage nearby enemies
  if (enemy.kind === 'singularity') {
    for (const other of world.enemies) {
      if (other === enemy || other.dead) continue;
      const d = Math.hypot(other.pos.x - enemy.pos.x, other.pos.z - enemy.pos.z);
      if (d < CONFIG.enemies.singularity.pullRadius! * 1.2) {
        if (damageEnemy(other, 3)) killEnemy(world, systems, other);
      }
    }
  }
};

/**
 * Advance the world by dt. Pure w.r.t. world + systems; returns the events emitted.
 * The systems object is mutated and also returned via world.events for this step.
 */
export const stepWorld = (
  world: World,
  systems: WorldSystems,
  input: import('../input/inputState.js').InputState,
  dt: number
): GameEvent[] => {
  world.events = [];
  if (world.gameOver) {
    // Still advance particles/impulses for the death flourish.
    advanceAndPrune(world, dt);
    return world.events;
  }
  world.time += dt;

  // --- Player ---
  stepPlayer(world.player, input, dt, world);
  if (tryFire(world.player, input.firing)) {
    firePlayerBullet(world.player, world);
  }

  // --- Spawn ---
  const spawnRes = stepSpawn(world, systems.spawn, dt);
  systems.spawn = spawnRes.sys;
  world.events.push(...spawnRes.events);

  // --- Enemies ---
  const playerBullets = world.bullets.filter((b) => b.owner === 'player' && !b.spent);
  for (const e of world.enemies) {
    if (e.dead) continue;
    stepEnemyBehavior({ enemy: e, player: world.player, bullets: playerBullets, world, dt });
    // Arena clamp for enemies (keep them in bounds)
    const edge = world.arenaRadius - e.radius;
    const r = Math.hypot(e.pos.x, e.pos.z);
    if (r > edge) {
      const s = edge / r;
      e.pos.x *= s;
      e.pos.z *= s;
    }
    // Singularity auto-explode at end of timer
    if (e.kind === 'singularity' && e.behaviorTimer >= CONFIG.enemies.singularity.explodeTime!) {
      e.dead = true;
      // Damage player if close
      const pd = Math.hypot(world.player.pos.x - e.pos.x, world.player.pos.z - e.pos.z);
      if (pd < CONFIG.enemies.singularity.pullRadius!) {
        damagePlayer(world.player, 25, world);
      }
      killEnemy(world, systems, e);
    }
  }

  // --- Bullets ---
  for (const b of world.bullets) stepBullet(b, dt);

  // --- Collisions (accelerated, identical to brute force) ---
  // player bullets vs enemies
  const liveBullets = world.bullets.filter((b) => b.owner === 'player' && !b.spent && b.life > 0);
  const pairs = spatialHashPairs(liveBullets, world.enemies, 4, (a, b) => {
    // a from groupA (bullets), b from groupB (enemies)
    return a.tag === 'bullet' && b.tag === 'enemy';
  });
  for (const { a, b } of pairs) {
    const bullet = a.tag === 'bullet' ? (a as BulletState) : (b as BulletState);
    const enemy = a.tag === 'enemy' ? (a as EnemyState) : (b as EnemyState);
    if (bullet.spent || enemy.dead) continue;
    bullet.spent = true;
    if (damageEnemy(enemy, bullet.damage)) {
      killEnemy(world, systems, enemy);
    }
  }
  // enemies vs player
  if (world.player.alive) {
    const pPairs = spatialHashPairs([world.player], world.enemies, 4, (a, b) => {
      const en = a.tag === 'enemy' ? a : b;
      return en.tag === 'enemy';
    });
    for (const { a, b } of pPairs) {
      const enemy = a.tag === 'enemy' ? (a as EnemyState) : (b as EnemyState);
      if (enemy.dead) continue;
      // Ramming damage to player
      damagePlayer(world.player, enemy.kind === 'singularity' ? 30 : 15, world);
      // Enemy dies on contact (except singularity which charges)
      if (enemy.kind !== 'singularity') {
        enemy.dead = true;
        killEnemy(world, systems, enemy);
      }
    }
  }
  // Reset combo on player hit handled inside recordKill; on hit, reset multiplier.
  if (world.events.some((e) => e.type === 'hit-player' && world.player.alive)) {
    systems.score = resetCombo(systems.score);
    world.player.multiplier = 1;
  }

  // --- Particles ---
  advanceAndPrune(world, dt);

  // --- Systems step ---
  systems.score = stepScore(systems.score, dt);
  systems.shake = stepCameraShake(systems.shake, dt);
  world.trauma = systems.shake.trauma;

  return world.events;
};

const advanceAndPrune = (world: World, dt: number): void => {
  // Particles
  for (const p of world.particles) stepParticle(p, dt);
  world.particles = world.particles.filter((p) => p.life > 0);
  // Bullets prune
  world.bullets = world.bullets.filter((b) => bulletAlive(b, world.arenaRadius));
  // Enemies prune (dead removed after killEnemy processed)
  world.enemies = world.enemies.filter((e) => !e.dead);
  // Impulses
  world.impulses = advanceImpulses(world.impulses, dt);
};