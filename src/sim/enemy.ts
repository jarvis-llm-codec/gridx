// enemy.ts — Enemy factory. Stats come from CONFIG (data-driven), so collision/
// score/spawn never switch on kind. New enemy kind = add config entry + behavior.

import type { EnemyState, EnemyKind, World } from '../core/types.js';
import { CONFIG } from '../core/config.js';
import { vec3 } from '../math/vec3.js';

let idCounter = 300000;
export const nextEnemyId = () => ++idCounter;

export const createEnemy = (kind: EnemyKind, pos: { x: number; y: number; z: number }, world: World): EnemyState => {
  const cfg = CONFIG.enemies[kind];
  return {
    id: nextEnemyId(),
    tag: 'enemy',
    pos: { ...pos },
    vel: vec3(),
    radius: cfg.radius,
    hp: cfg.hp,
    maxHp: cfg.hp,
    score: cfg.score,
    kind,
    behaviorTimer: world.rng.range(0, 2),
    phase: world.rng.next() * Math.PI * 2,
    critical: false,
    jitter: { x: world.rng.sign(), y: 0, z: world.rng.sign() },
    dead: false,
  };
};

/** Apply damage to enemy. Returns true if it died this call. */
export const damageEnemy = (e: EnemyState, dmg: number): boolean => {
  e.hp -= dmg;
  if (e.hp <= 0) {
    e.hp = 0;
    e.dead = true;
    return true;
  }
  return false;
};