import { describe, it, expect } from 'vitest';
import {
  vec3, add3, sub3, scale3, dot3, cross3, len3, lenSq3, dist3, dist2,
  normalize3, normalize2, lerp3, reflect3, rotateY3, perp2, distSq2,
} from '../../src/math/vec3.js';

describe('vec3 arithmetic', () => {
  it('adds/subtracts/scales componentwise', () => {
    expect(add3(vec3(1, 2, 3), vec3(4, 5, 6))).toEqual({ x: 5, y: 7, z: 9 });
    expect(sub3(vec3(4, 5, 6), vec3(1, 2, 3))).toEqual({ x: 3, y: 3, z: 3 });
    expect(scale3(vec3(1, 2, 3), 2)).toEqual({ x: 2, y: 4, z: 6 });
  });
  it('dot and cross products', () => {
    expect(dot3(vec3(1, 0, 0), vec3(0, 1, 0))).toBe(0);
    expect(dot3(vec3(1, 2, 3), vec3(4, 5, 6))).toBe(32);
    expect(cross3(vec3(1, 0, 0), vec3(0, 1, 0))).toEqual({ x: 0, y: 0, z: 1 });
  });
  it('len / lenSq / dist', () => {
    expect(len3(vec3(0, 3, 4))).toBe(5);
    expect(lenSq3(vec3(1, 2, 2))).toBe(9);
    expect(dist3(vec3(0, 0, 0), vec3(3, 0, 4))).toBe(5);
    expect(dist2(vec3(0, 99, 0), vec3(3, -1, 4))).toBe(5); // Y ignored
  });
  it('distSq2 is squared 2D distance and ignores Y', () => {
    expect(distSq2(vec3(0, 99, 0), vec3(3, -1, 4))).toBe(25);
  });
});

describe('vec3 normalize', () => {
  it('normalize3 yields unit vector', () => {
    const n = normalize3(vec3(0, 3, 4));
    expect(len3(n)).toBeCloseTo(1, 10);
  });
  it('normalize3 of zero stays zero', () => {
    expect(normalize3(vec3(0, 0, 0))).toEqual({ x: 0, y: 0, z: 0 });
  });
  // REGRESSION: normalize2 must zero the Y component (aim/move live on XZ plane).
  it('normalize2 zeros Y and keeps XZ unit', () => {
    const n = normalize2(vec3(3, 999, 4));
    expect(n.y).toBe(0);
    expect(Math.hypot(n.x, n.z)).toBeCloseTo(1, 10);
  });
  it('normalize2 of zero stays zero (no NaN)', () => {
    expect(normalize2(vec3(0, 5, 0))).toEqual({ x: 0, y: 0, z: 0 });
  });
});

describe('vec3 helpers', () => {
  it('lerp interpolates', () => {
    expect(lerp3(vec3(0, 0, 0), vec3(10, 20, 30), 0.5)).toEqual({ x: 5, y: 10, z: 15 });
  });
  it('reflect about normal', () => {
    const r = reflect3(vec3(1, -1, 0), vec3(0, 1, 0));
    expect(r).toEqual({ x: 1, y: 1, z: 0 });
  });
  it('rotateY3 rotates XZ by angle (Y preserved)', () => {
    const r = rotateY3(vec3(1, 5, 0), Math.PI / 2);
    expect(r.y).toBe(5);
    expect(r.x).toBeCloseTo(0, 6);
    expect(r.z).toBeCloseTo(1, 6);
  });
  it('perp2 is +90deg XZ perpendicular', () => {
    const p = perp2(vec3(1, 0, 0));
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBe(0);
    expect(p.z).toBeCloseTo(1, 6);
  });
});