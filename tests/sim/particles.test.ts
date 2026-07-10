import { describe, it, expect } from 'vitest';
import { spawnBurst, stepParticle } from '../../src/sim/particles.js';
import { createWorld } from '../../src/sim/world.js';
import { CONFIG } from '../../src/core/config.js';

describe('particles', () => {
  it('spawnBurst adds particles up to maxParticles', () => {
    const { world } = createWorld(1);
    const before = world.particles.length;
    spawnBurst({ x: 0, y: 0, z: 0 }, 50, 0xff00ff, world);
    expect(world.particles.length).toBe(before + 50);
  });
  it('never exceeds maxParticles cap', () => {
    const { world } = createWorld(2);
    // spam far over cap
    for (let i = 0; i < 50; i++) spawnBurst({ x: 0, y: 0, z: 0 }, 1000, 0xffffff, world);
    expect(world.particles.length).toBeLessThanOrEqual(CONFIG.particles.maxParticles);
  });
  it('particles have outward velocity (nonzero speed) and finite life', () => {
    const { world } = createWorld(3);
    spawnBurst({ x: 0, y: 0, z: 0 }, 30, 0x00ffff, world);
    let moving = 0;
    for (const p of world.particles) {
      if (Math.hypot(p.vel.x, p.vel.y, p.vel.z) > 0.01) moving++;
      expect(p.life).toBeGreaterThan(0);
      expect(p.life).toBeLessThanOrEqual(p.lifespan);
    }
    expect(moving).toBe(30);
  });
  it('stepParticle decrements life and moves position', () => {
    const { world } = createWorld(4);
    spawnBurst({ x: 0, y: 0, z: 0 }, 1, 0xffffff, world);
    const p = world.particles[0];
    const life0 = p.life;
    stepParticle(p, 0.1);
    expect(p.life).toBeLessThan(life0);
    // position changed (velocity integrated)
    expect(Math.hypot(p.pos.x, p.pos.y, p.pos.z)).toBeGreaterThan(0);
  });
});