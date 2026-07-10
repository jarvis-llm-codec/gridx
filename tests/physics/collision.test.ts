import { describe, it, expect } from 'vitest';
import { circlesOverlap2, bruteForcePairs, spatialHashPairs, SpatialHash } from '../../src/physics/collision.js';
import type { Body } from '../../src/core/types.js';

const body = (id: number, x: number, z: number, r: number, tag: Body['tag'] = 'enemy'): Body => ({
  id, tag, pos: { x, y: 0, z }, vel: { x: 0, y: 0, z: 0 }, radius: r,
});

describe('circlesOverlap2 narrow phase', () => {
  it('overlapping circles', () => {
    expect(circlesOverlap2(body(1, 0, 0, 1), body(2, 1.5, 0, 1))).toBe(true); // r+r=2 > 1.5
  });
  it('tangent circles (touch) count as overlap', () => {
    expect(circlesOverlap2(body(1, 0, 0, 1), body(2, 2, 0, 1))).toBe(true); // 2 == 2
  });
  it('separated circles', () => {
    expect(circlesOverlap2(body(1, 0, 0, 1), body(2, 3, 0, 1))).toBe(false);
  });
  it('ignores Y (XZ-only)', () => {
    expect(circlesOverlap2(body(1, 0, 0, 1), body(2, 1.5, 0, 1))).toBe(true);
  });
});

describe('SpatialHash invariant', () => {
  // REGRESSION: the broad phase MUST return exactly the same pairs as brute force
  // for many randomized layouts (this is the load-bearing accelerator invariant).
  const randomLayouts = (count: number) => {
    let seed = 12345;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    const groups: { A: Body[]; B: Body[]; cell: number }[] = [];
    for (let g = 0; g < count; g++) {
      const nA = 5 + Math.floor(rand() * 8);
      const nB = 5 + Math.floor(rand() * 8);
      const A: Body[] = [];
      const B: Body[] = [];
      for (let i = 0; i < nA; i++) A.push(body(i, rand() * 40 - 20, rand() * 40 - 20, 0.5 + rand() * 2));
      for (let i = 0; i < nB; i++) B.push(body(1000 + i, rand() * 40 - 20, rand() * 40 - 20, 0.5 + rand() * 2));
      groups.push({ A, B, cell: 1 + Math.floor(rand() * 6) });
    }
    return groups;
  };

  it.each(randomLayouts(40))(
    'broad == brute for layout (cell=$cell, |A|=$A.length, |B|=$B.length)',
    ({ A, B, cell }) => {
      const brute = bruteForcePairs(A, B);
      const fast = spatialHashPairs(A, B, cell);
      // Compare by id pairs (order-independent).
      const keyOf = (p: { a: Body; b: Body }) => `${p.a.id}|${p.b.id}`;
      const bk = new Set(brute.map(keyOf));
      const fk = new Set(fast.map(keyOf));
      expect(fk.size).toBe(brute.length);
      expect([...fk].sort()).toEqual([...bk].sort());
    }
  );

  it('SpatialHash candidate query covers bodies larger than cell', () => {
    const h = new SpatialHash(2);
    const big = body(1, 0, 0, 8); // radius 8 spans many cells
    h.insert(big);
    const near = h.queryCandidates(body(2, 0, 0, 0.5));
    expect(near).toContain(big);
  });

  it('no false negatives for bodies spanning multiple cells', () => {
    const A = [body(1, 0, 0, 5)];
    const B = [body(2, 4.5, 0, 0.5)];
    // brute says overlap (5+0.5=5.5 > 4.5)
    expect(bruteForcePairs(A, B).length).toBe(1);
    expect(spatialHashPairs(A, B, 1).length).toBe(1);
  });
});