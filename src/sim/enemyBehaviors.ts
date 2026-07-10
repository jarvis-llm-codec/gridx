// enemyBehaviors.ts — Vector-math AI for each EnemyKind. Pure; reads world RNG.
// Adding a new behavior = add one `case` here + a config entry. Collision/score
// are untouched because they only read radius/hp/score.

import type { EnemyState, EnemyKind, PlayerState, BulletState, World } from '../core/types.js';
import { CONFIG } from '../core/config.js';
import { sub3, normalize2, len3, dist2 } from '../math/vec3.js';

export interface BehaviorCtx {
  enemy: EnemyState;
  player: PlayerState;
  bullets: BulletState[]; // player bullets (for dodger)
  world: World;
  dt: number;
}

const steer = (e: EnemyState, dir: { x: number; z: number }, speed: number, dt: number): void => {
  e.vel.x = dir.x * speed;
  e.vel.z = dir.z * speed;
  e.pos.x += e.vel.x * dt;
  e.pos.z += e.vel.z * dt;
};

// grunt: head straight for the player.
const behaviorGrunt = (ctx: BehaviorCtx): void => {
  const { enemy, player, dt } = ctx;
  const d = sub3(player.pos, enemy.pos);
  const n = normalize2(d);
  steer(enemy, { x: n.x, z: n.z }, CONFIG.enemies.grunt.speed, dt);
};

// wanderer: seek the player but weave sinusoidally (perp offset).
const behaviorWanderer = (ctx: BehaviorCtx): void => {
  const { enemy, player, dt } = ctx;
  const d = sub3(player.pos, enemy.pos);
  const n = normalize2(d);
  enemy.phase += dt * 3;
  const perp = { x: -n.z, z: n.x };
  const wave = Math.sin(enemy.phase + enemy.jitter.x) * 0.5;
  const dir = { x: n.x + perp.x * wave, z: n.z + perp.z * wave };
  const m = Math.hypot(dir.x, dir.z) || 1;
  steer(enemy, { x: dir.x / m, z: dir.z / m }, CONFIG.enemies.wanderer.speed, dt);
};

// singularity: drift slowly, pull player + bullets inward, then explode after timer.
const behaviorSingularity = (ctx: BehaviorCtx): void => {
  const { enemy, player, bullets, world, dt } = ctx;
  const cfg = CONFIG.enemies.singularity;
  // Slow drift toward player
  const d = sub3(player.pos, enemy.pos);
  const n = normalize2(d);
  steer(enemy, { x: n.x * 0.5, z: n.z * 0.5 }, cfg.speed, dt);
  // Pull entities within radius toward enemy (affects player + bullets).
  const pullR = cfg.pullRadius!;
  const pullF = cfg.pullForce!;
  if (dist2(player.pos, enemy.pos) < pullR) {
    const to = sub3(enemy.pos, player.pos);
    const pl = normalize2(to);
    const dist = len3(to);
    const f = pullF * (1 - dist / pullR);
    player.vel.x += pl.x * f * dt;
    player.vel.z += pl.z * f * dt;
  }
  for (const b of bullets) {
    if (b.owner !== 'player' || b.spent) continue;
    if (dist2(b.pos, enemy.pos) < pullR) {
      const to = sub3(enemy.pos, b.pos);
      const bl = normalize2(to);
      b.vel.x += bl.x * pullF * 0.3 * dt;
      b.vel.z += bl.z * pullF * 0.3 * dt;
    }
  }
  // Charge timer -> critical -> explode (world step handles explosion damage).
  enemy.behaviorTimer += dt;
  if (!enemy.critical && enemy.behaviorTimer >= cfg.explodeTime! * 0.66) {
    enemy.critical = true;
    world.events.push({ type: 'shockwave', pos: { ...enemy.pos }, strength: 0.6 });
  }
};

// dodger: approach but strafe-dodge when a player bullet is near.
const behaviorDodger = (ctx: BehaviorCtx): void => {
  const { enemy, player, bullets, dt } = ctx;
  const cfg = CONFIG.enemies.dodger;
  // Base seek
  const d = sub3(player.pos, enemy.pos);
  const n = normalize2(d);
  // Check incoming bullets within range
  enemy.behaviorTimer -= dt;
  let dodgeDir = { x: 0, z: 0 };
  let dodging = false;
  if (enemy.behaviorTimer <= 0) {
    for (const b of bullets) {
      if (b.owner !== 'player' || b.spent) continue;
      const dd = dist2(b.pos, enemy.pos);
      if (dd < cfg.dodgeRange!) {
        // Dodge perpendicular to bullet velocity
        const bv = normalize2(b.vel);
        dodgeDir = { x: -bv.z, z: bv.x };
        // Pick the side away from bullet's path correction (sign by jitter)
        if (enemy.jitter.x < 0) {
          dodgeDir = { x: bv.z, z: -bv.x };
        }
        dodging = true;
        break;
      }
    }
  }
  if (dodging) {
    steer(enemy, dodgeDir, cfg.dodgeSpeed!, dt);
    enemy.behaviorTimer = cfg.dodgeCooldown!;
  } else {
    steer(enemy, { x: n.x, z: n.z }, cfg.speed, dt);
  }
};

export const stepEnemyBehavior = (ctx: BehaviorCtx): void => {
  switch (ctx.enemy.kind) {
    case 'grunt':
      return behaviorGrunt(ctx);
    case 'wanderer':
      return behaviorWanderer(ctx);
    case 'singularity':
      return behaviorSingularity(ctx);
    case 'dodger':
      return behaviorDodger(ctx);
  }
};

/** List of all kinds — used by tests to assert behaviors are exhaustive. */
export const ALL_KINDS: EnemyKind[] = ['grunt', 'wanderer', 'singularity', 'dodger'];