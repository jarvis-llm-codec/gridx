import { describe, it, expect } from 'vitest';
import { createRng, hashSeed } from '../../src/math/rng.js';

describe('rng determinism', () => {
  it('same seed => identical sequence', () => {
    const a = createRng(12345);
    const b = createRng(12345);
    for (let i = 0; i < 1000; i++) {
      expect(a.next()).toBe(b.next());
    }
  });
  it('different seed => different sequence', () => {
    const a = createRng(1);
    const b = createRng(2);
    let diff = 0;
    for (let i = 0; i < 100; i++) if (a.next() !== b.next()) diff++;
    expect(diff).toBeGreaterThan(50);
  });
  it('next is in [0,1)', () => {
    const r = createRng(7);
    for (let i = 0; i < 10000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('range and int bounds', () => {
    const r = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = r.range(5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(10);
      const n = r.int(3, 6);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(6);
    }
  });
  it('pick returns an element of the array', () => {
    const r = createRng(99);
    const items = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) expect(items).toContain(r.pick(items));
  });
  it('sign is -1 or 1', () => {
    const r = createRng(3);
    for (let i = 0; i < 100; i++) expect([-1, 1]).toContain(r.sign());
  });
  it('dir2 is unit on XZ', () => {
    const r = createRng(11);
    for (let i = 0; i < 50; i++) {
      const d = r.dir2();
      expect(Math.hypot(d.x, d.z)).toBeCloseTo(1, 8);
    }
  });
  it('fork is deterministic given parent seed + label', () => {
    const a = createRng(100).fork(1);
    const b = createRng(100).fork(1);
    expect(a.state()).toBe(b.state());
    const c = createRng(100).fork(2);
    expect(a.state()).not.toBe(c.state());
  });
  it('hashSeed is stable', () => {
    expect(hashSeed('geometry-wars')).toBe(hashSeed('geometry-wars'));
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
  });
});