// rng.ts — Deterministic seeded pseudo-random number generator (mulberry32).
// Every game-side randomness MUST draw from an RNG instance so the simulation
// is fully reproducible: same seed + same inputs => same state. This is the
// regression invariant the test suite asserts.

export interface RNG {
  /** Float in [0, 1). */
  next(): number;
  /** Float in [min, max). */
  range(min: number, max: number): number;
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** True with probability p (0..1). */
  chance(p: number): boolean;
  /** Index into `items` using uniform weights (or weights if provided). */
  pick<T>(items: readonly T[]): T;
  /** Sign: -1 or 1 with equal probability. */
  sign(): number;
  /** Unit vector in a random direction on the XZ plane. */
  dir2(): { x: number; z: number };
  /** Create a child RNG deterministically derived from this one (for subsystem isolation). */
  fork(label: number): RNG;
  /** Current raw state (for save/restore in tests). */
  state(): number;
}

const makeRng = (seed: number): RNG => {
  let s = seed >>> 0;

  const next = (): number => {
    // mulberry32
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => {
      const lo = Math.ceil(min);
      const hi = Math.floor(max);
      return lo + Math.floor(next() * (hi - lo + 1));
    },
    chance: (p) => next() < p,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    sign: () => (next() < 0.5 ? -1 : 1),
    dir2: () => {
      const a = next() * Math.PI * 2;
      return { x: Math.cos(a), z: Math.sin(a) };
    },
    fork: (label) => makeRng((seed ^ (label * 0x9e3779b1)) >>> 0),
    state: () => s,
  };
};

/** Create a deterministic RNG from a 32-bit seed. */
export const createRng = (seed: number): RNG => makeRng(seed >>> 0);

/** Hash a string into a 32-bit seed (for human-friendly seed names). */
export const hashSeed = (str: string): number => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};