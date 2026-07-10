import { describe, it, expect } from 'vitest';
import { mapToSphere, projectFromSphere, arenaRadius, type SphereParams } from '../../src/math/sphereMapping.js';

const P: SphereParams = { radius: 60, capHalfAngle: 0.62 };

describe('sphereMapping', () => {
  it('center maps to sphere north pole (top)', () => {
    const sp = mapToSphere(0, 0, P);
    expect(sp.x).toBeCloseTo(0, 8);
    expect(sp.z).toBeCloseTo(0, 8);
    expect(sp.y).toBeCloseTo(P.radius, 6);
    // normal = position normalized
    expect(sp.ny).toBeCloseTo(1, 6);
  });
  it('unit fx maps to cap edge (polar = capHalfAngle)', () => {
    const sp = mapToSphere(1, 0, P);
    expect(sp.y).toBeCloseTo(P.radius * Math.cos(P.capHalfAngle), 5);
    expect(sp.x).toBeCloseTo(P.radius * Math.sin(P.capHalfAngle), 5);
  });
  it('radius clamps beyond-cap coords to the edge', () => {
    const outside = mapToSphere(2, 0, P);
    expect(Math.hypot(outside.x, outside.z)).toBeCloseTo(arenaRadius(P), 5);
  });
  it('inverse round-trips a surface point to its normalized coords', () => {
    const sp = mapToSphere(0.4, -0.3, P);
    const back = projectFromSphere(sp.x, sp.y, sp.z, P);
    expect(back.fx).toBeCloseTo(0.4, 4);
    expect(back.fz).toBeCloseTo(-0.3, 4);
  });
  it('arenaRadius = radius * sin(capHalfAngle)', () => {
    expect(arenaRadius(P)).toBeCloseTo(P.radius * Math.sin(P.capHalfAngle), 6);
  });
});