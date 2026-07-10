import { describe, it, expect } from 'vitest';
import { stepEnemyBehavior, ALL_KINDS } from '../../src/sim/enemyBehaviors.js';
import { createEnemy } from '../../src/sim/enemy.js';
import { createPlayer } from '../../src/sim/player.js';
import { createWorld } from '../../src/sim/world.js';
import { dist2 } from '../../src/math/vec3.js';
import { CONFIG } from '../../src/core/config.js';

const ctx = (seed: number) => {
  const { world } = createWorld(seed);
  const player = createPlayer();
  world.player = player;
  return { world, player };
};

describe('enemy behaviors', () => {
  it('ALL_KINDS covers every configured kind (exhaustive switch)', () => {
    const configured = Object.keys(CONFIG.enemies);
    expect(ALL_KINDS.sort()).toEqual(configured.sort());
  });
  it('grunt moves toward the player', () => {
    const { world, player } = ctx(1);
    const e = createEnemy('grunt', { x: 20, y: 0, z: 20 }, world);
    const d0 = dist2(e.pos, player.pos);
    for (let i = 0; i < 60; i++) {
      stepEnemyBehavior({ enemy: e, player, bullets: [], world, dt: CONFIG.fixedStep });
    }
    const d1 = dist2(e.pos, player.pos);
    expect(d1).toBeLessThan(d0);
  });
  it('wanderer generally approaches the player', () => {
    const { world, player } = ctx(2);
    const e = createEnemy('wanderer', { x: 25, y: 0, z: 0 }, world);
    const d0 = dist2(e.pos, player.pos);
    for (let i = 0; i < 120; i++) {
      stepEnemyBehavior({ enemy: e, player, bullets: [], world, dt: CONFIG.fixedStep });
    }
    expect(dist2(e.pos, player.pos)).toBeLessThan(d0);
  });
  it('singularity pulls the player when in range', () => {
    const { world, player } = ctx(3);
    const e = createEnemy('singularity', { x: 5, y: 0, z: 0 }, world);
    player.pos = { x: 0, y: 0, z: 0 };
    player.vel = { x: 0, y: 0, z: 0 };
    const pullR = CONFIG.enemies.singularity.pullRadius!;
    const d = dist2(player.pos, e.pos);
    if (d < pullR) {
      stepEnemyBehavior({ enemy: e, player, bullets: [], world, dt: CONFIG.fixedStep });
      expect(Math.hypot(player.vel.x, player.vel.z)).toBeGreaterThan(0);
    }
  });
  it('singularity becomes critical before explodeTime', () => {
    const { world, player } = ctx(4);
    const e = createEnemy('singularity', { x: -10, y: 0, z: -10 }, world);
    const t = CONFIG.enemies.singularity.explodeTime!;
    for (let i = 0; i < Math.ceil((t * 0.66) / CONFIG.fixedStep) + 5; i++) {
      stepEnemyBehavior({ enemy: e, player, bullets: [], world, dt: CONFIG.fixedStep });
    }
    expect(e.critical).toBe(true);
  });
  it('dodger strafes when a player bullet is near', () => {
    const { world, player } = ctx(5);
    const e = createEnemy('dodger', { x: 0, y: 0, z: 10 }, world);
    e.behaviorTimer = 0; // ready to react
    // place a bullet heading toward the enemy along -Z
    const bullet = {
      id: 1, tag: 'bullet' as const,
      pos: { x: 0, y: 0, z: 15 },
      vel: { x: 0, y: 0, z: -30 },
      radius: 0.2, owner: 'player' as const, kind: 'standard' as const,
      life: 5, damage: 1, spent: false, pierce: false, level: 1,
      turnRate: 0, blastRadius: 0, hitIds: [], prevPos: { x: 0, y: 0, z: 15 },
    };
    const d0 = e.pos.x;
    for (let i = 0; i < 6; i++) {
      stepEnemyBehavior({ enemy: e, player, bullets: [bullet], world, dt: CONFIG.fixedStep });
    }
    // dodger should have moved sideways (X changed since bullet comes straight along Z)
    expect(Math.abs(e.pos.x - d0)).toBeGreaterThan(0.001);
  });
});
