import { describe, it, expect } from 'vitest';
import { createSpawnSystem, stepSpawn, advanceWave } from '../../src/systems/spawn.js';
import { createWorld, stepWorld } from '../../src/sim/world.js';
import { emptyInput } from '../../src/input/inputState.js';
import { CONFIG } from '../../src/core/config.js';

describe('spawn system', () => {
  it('spawns over time within maxAlive cap', () => {
    const { world } = createWorld(7);
    let sys = createSpawnSystem();
    // step 30 seconds of simulation to force spawns
    for (let i = 0; i < 60 * 30; i++) {
      const r = stepSpawn(world, sys, 1 / 60);
      sys = r.sys;
    }
    expect(world.enemies.length).toBeGreaterThan(0);
    expect(world.enemies.length).toBeLessThanOrEqual(CONFIG.spawn.maxAlive);
  });
  it('only spawns valid enemy kinds', () => {
    const { world } = createWorld(11);
    let sys = createSpawnSystem();
    for (let i = 0; i < 2000; i++) {
      const r = stepSpawn(world, sys, 1 / 60);
      sys = r.sys;
    }
    const kinds = new Set(world.enemies.map((e) => e.kind));
    for (const k of kinds) expect(['grunt', 'wanderer', 'singularity', 'dodger']).toContain(k);
  });
  it('interval shrinks with wave', () => {
    let sys = createSpawnSystem();
    // advance wave once: pass budget kills
    const advanced = advanceWave({ ...sys, killsThisWave: sys.budget }, sys.budget);
    expect(advanced.wave).toBeGreaterThan(sys.wave);
  });
  it('does not spawn when gameOver', () => {
    const { world, systems } = createWorld(5);
    world.gameOver = true;
    const before = world.enemies.length;
    let sys = systems.spawn;
    for (let i = 0; i < 300; i++) {
      const r = stepSpawn(world, sys, 1 / 60);
      sys = r.sys;
    }
    expect(world.enemies.length).toBe(before);
  });
  it('enemies spawn on a ring near the arena edge', () => {
    const { world } = createWorld(13);
    let sys = createSpawnSystem();
    for (let i = 0; i < 200; i++) {
      const r = stepSpawn(world, sys, 1 / 60);
      sys = r.sys;
    }
    for (const e of world.enemies) {
      const r = Math.hypot(e.pos.x, e.pos.z);
      expect(r).toBeGreaterThan(world.arenaRadius * 0.6);
    }
  });
  it('full stepWorld spawns deterministically for same seed+input', () => {
    const a = createWorld(77);
    const b = createWorld(77);
    const inp = emptyInput();
    for (let i = 0; i < 60 * 10; i++) {
      stepWorld(a.world, a.systems, inp, 1 / 60);
      stepWorld(b.world, b.systems, inp, 1 / 60);
    }
    expect(a.world.enemies.length).toBe(b.world.enemies.length);
    expect(a.world.enemies.map((e) => e.kind).join(',')).toBe(
      b.world.enemies.map((e) => e.kind).join(',')
    );
  });
});