// collision.ts — Broad/narrow phase collision for circle bodies on the XZ plane.
// INVARIANT: SpatialHash is only an accelerator; narrow phase ALWAYS uses
// circlesOverlap2, so the broad phase can never change a result, only skip pairs.
// The regression test asserts SpatialHash output == brute force for many layouts.

import type { Body } from '../core/types.js';

export interface CollisionPair {
  a: Body;
  b: Body;
}

/** Narrow-phase test: do two XZ circles overlap? */
export const circlesOverlap2 = (a: Body, b: Body): boolean => {
  const r = a.radius + b.radius;
  // Compare squared distances (sqrt-free hot path).
  const dx = a.pos.x - b.pos.x;
  const dz = a.pos.z - b.pos.z;
  return dx * dx + dz * dz <= r * r;
};

/**
 * Brute-force all-pairs collision. O(n*m). The reference implementation the
 * accelerator must match exactly. Used both by tests and as a fallback.
 */
export const bruteForcePairs = (
  groupA: readonly Body[],
  groupB: readonly Body[],
  filter?: (a: Body, b: Body) => boolean
): CollisionPair[] => {
  const out: CollisionPair[] = [];
  for (const a of groupA) {
    for (const b of groupB) {
      if (a === b) continue;
      if (filter && !filter(a, b)) continue;
      if (circlesOverlap2(a, b)) out.push({ a, b });
    }
  }
  return out;
};

/**
 * SpatialHash broad phase. Cell size MUST be >= the largest query radius so a
 * single body never spans more than its own + 8 neighbor cells. We use a per-
 * body cell radius = ceil(radius/cell) and scan the square of cells covering
 * both bodies' extents when querying, guaranteeing no missed overlaps.
 */
export class SpatialHash {
  readonly cell: number;
  private buckets = new Map<number, Body[]>();

  constructor(cellSize: number) {
    if (cellSize <= 0) throw new Error('cellSize must be > 0');
    this.cell = cellSize;
  }

  private key(cx: number, cz: number): number {
    // Cantor-ish pairing into a single int (cells can be negative).
    const x = cx >= 0 ? cx * 2 : cx * -2 - 1;
    const z = cz >= 0 ? cz * 2 : cz * -2 - 1;
    return ((x + z) * (x + z + 1)) / 2 + z;
  }

  clear(): void {
    this.buckets.clear();
  }

  insert(body: Body): void {
    const reach = Math.max(0, Math.ceil(body.radius / this.cell));
    const bx = Math.floor(body.pos.x / this.cell);
    const bz = Math.floor(body.pos.z / this.cell);
    // Insert into every cell the body's circle covers (so a query scanning the
    // same cells finds it). This guarantees the accelerator misses nothing.
    for (let dx = -reach; dx <= reach; dx++) {
      for (let dz = -reach; dz <= reach; dz++) {
        const k = this.key(bx + dx, bz + dz);
        let list = this.buckets.get(k);
        if (!list) {
          list = [];
          this.buckets.set(k, list);
        }
        list.push(body);
      }
    }
  }

  /** Candidate bodies near `query` (may include duplicates spanning cells). */
  queryCandidates(query: Body): Body[] {
    const reach = Math.max(0, Math.ceil(query.radius / this.cell));
    const qx = Math.floor(query.pos.x / this.cell);
    const qz = Math.floor(query.pos.z / this.cell);
    const seen = new Set<Body>();
    const out: Body[] = [];
    for (let dx = -reach; dx <= reach; dx++) {
      for (let dz = -reach; dz <= reach; dz++) {
        const list = this.buckets.get(this.key(qx + dx, qz + dz));
        if (!list) continue;
        for (const b of list) {
          if (!seen.has(b)) {
            seen.add(b);
            out.push(b);
          }
        }
      }
    }
    return out;
  }
}

/**
 * Accelerated cross-group collision. Returns pairs (a from groupA, b from groupB)
 * whose circles overlap. Result is IDENTICAL to bruteForcePairs (asserted in tests).
 */
export const spatialHashPairs = (
  groupA: readonly Body[],
  groupB: readonly Body[],
  cellSize: number,
  filter?: (a: Body, b: Body) => boolean
): CollisionPair[] => {
  // Build the hash from the smaller group to minimize inserts.
  const [small, large] = groupA.length <= groupB.length ? [groupA, groupB] : [groupB, groupA];
  const hash = new SpatialHash(cellSize);
  for (const b of large) hash.insert(b);
  const out: CollisionPair[] = [];
  const seen = new Set<number>();
  for (const a of small) {
    const cands = hash.queryCandidates(a);
    for (const b of cands) {
      if (a === b) continue;
      // Pair ordering must match bruteForcePairs semantics: a from groupA, b from groupB.
      const inA = groupA.includes(a) ? a : b;
      const inB = inA === a ? b : a;
      // Dedup the same (a,b) discovered from both sides.
      const k = inA.id < inB.id ? inA.id * 100003 + inB.id : inB.id * 100003 + inA.id;
      if (seen.has(k)) continue;
      if (filter && !filter(inA as Body, inB as Body)) continue;
      if (circlesOverlap2(inA as Body, inB as Body)) {
        seen.add(k);
        out.push({ a: inA as Body, b: inB as Body });
      }
    }
  }
  return out;
};