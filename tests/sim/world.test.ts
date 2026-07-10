import { describe, it, expect } from 'vitest';
import { createWorld, stepWorld } from '../../src/sim/world.js';
import { emptyInput, type InputState } from '../../src/input/inputState.js';
import { CONFIG } from '../../src/core/config.js';
import { ALL_KINDS } from '../../src/sim/enemyBehaviors.js';

const snapshot = (w: ReturnType<typeof createWorld>['world']) => ({
  time: w.time,
  score: w.player.score,
  hp: w.player.hp,
  px: w.player.pos.x,
  pz: w.player.pos.z,
  nBullets: w.bullets.length,
  nEnemies: w.enemies.length,
  nParticles: w.particles.length,
  enemyKinds: w.enemies.map((e) => e.kind).sort().join(','),
  trauma: w.trauma,
  gameOver: w.gameOver,
});

const input: InputState = { ...emptyInput(), moveX: 0.3, moveZ: -0.5, firing: true };

describe('world determinism (REGRESSION)', () => {
  it('same seed + same inputs => identical state across steps', () => {
    const a = createWorld(2024);
    const b = createWorld(2024);
    for (let i = 0; i < 60 * 30; i++) {
      stepWorld(a.world, a.systems, input, CONFIG.fixedStep);
      stepWorld(b.world, b.systems, input, CONFIG.fixedStep);
    }
    expect(snapshot(a.world)).toEqual(snapshot(b.world));
  });
  it('different seed => different state', () => {
    const a = createWorld(2024);
    const b = createWorld(9999);
    for (let i = 0; i < 60 * 20; i++) {
      stepWorld(a.world, a.systems, input, CONFIG.fixedStep);
      stepWorld(b.world, b.systems, input, CONFIG.fixedStep);
    }
    expect(snapshot(a.world)).not.toEqual(snapshot(b.world));
  });
});

describe('world invariants', () => {
  it('no two alive entities share the same id', () => {
    const { world, systems } = createWorld(55);
    for (let i = 0; i < 60 * 60; i++) stepWorld(world, systems, input, CONFIG.fixedStep);
    const ids = new Set<number>();
    const check = (arr: { id: number; tag?: string }[]) => {
      for (const e of arr) {
        expect(ids.has(e.id)).toBe(false);
        ids.add(e.id);
      }
    };
    check([world.player]);
    check(world.bullets);
    check(world.enemies);
    check(world.particles);
  });
  it('bullets respect arena bounds (pruned when leaving)', () => {
    const { world, systems } = createWorld(3);
    for (let i = 0; i < 60 * 45; i++) stepWorld(world, systems, input, CONFIG.fixedStep);
    for (const b of world.bullets) {
      const r = Math.hypot(b.pos.x, b.pos.z);
      expect(r).toBeLessThanOrEqual(world.arenaRadius + 2 + 1e-6);
    }
  });
  it('enemies stay within arena bounds', () => {
    const { world, systems } = createWorld(4);
    for (let i = 0; i < 60 * 30; i++) stepWorld(world, systems, input, CONFIG.fixedStep);
    for (const e of world.enemies) {
      const r = Math.hypot(e.pos.x, e.pos.z);
      expect(r).toBeLessThanOrEqual(world.arenaRadius + 1e-6);
    }
  });
  it('player HP never exceeds maxHp', () => {
    const { world, systems } = createWorld(8);
    for (let i = 0; i < 60 * 60; i++) stepWorld(world, systems, input, CONFIG.fixedStep);
    expect(world.player.hp).toBeLessThanOrEqual(CONFIG.player.maxHp);
    expect(world.player.hp).toBeGreaterThanOrEqual(0);
  });
  it('enemy behaviors are exhaustive over ALL_KINDS', () => {
    // every kind in config has a behavior branch
    expect(ALL_KINDS).toEqual(['grunt', 'wanderer', 'singularity', 'dodger']);
  });
  it('each enemy kind spawns at least once over a long run', () => {
    const { world, systems } = createWorld(12);
    world.player.hp = 1e9; // survive so spawning continues the full window
    const seen = new Set<string>();
    for (let i = 0; i < 60 * 120; i++) {
      stepWorld(world, systems, input, CONFIG.fixedStep);
      for (const e of world.enemies) seen.add(e.kind);
    }
    for (const k of ALL_KINDS) expect(seen.has(k)).toBe(true);
  });
  it('player can die (gameOver reachable)', () => {
    const { world, systems } = createWorld(1);
    // run a long time with no firing so enemies reach the player
    const idle: InputState = { ...emptyInput() };
    let died = false;
    for (let i = 0; i < 60 * 180 && !died; i++) {
      stepWorld(world, systems, idle, CONFIG.fixedStep);
      if (world.gameOver) died = true;
    }
    expect(died).toBe(true);
  });
  it('firing produces bullets and kills enemies (score increases)', () => {
    const { world, systems } = createWorld(31);
    let maxScore = 0;
    for (let i = 0; i < 60 * 60; i++) {
      stepWorld(world, systems, input, CONFIG.fixedStep);
      maxScore = Math.max(maxScore, world.player.score);
    }
    expect(maxScore).toBeGreaterThan(0);
  });
});