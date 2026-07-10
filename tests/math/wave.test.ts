import { describe, it, expect } from 'vitest';
import { createImpulse, advanceImpulses, impulseAmplitude, waveOffset, totalEnergy } from '../../src/math/wave.js';

describe('wave impulses', () => {
  it('impulse amplitude decays to 0 over lifespan', () => {
    const imp = createImpulse(0, 0, 4, { lifespan: 2 });
    expect(impulseAmplitude(imp)).toBeCloseTo(4, 6);
    const mid = { ...imp, age: 1 };
    expect(impulseAmplitude(mid)).toBeLessThan(4);
    const dead = { ...imp, age: 2 };
    expect(impulseAmplitude(dead)).toBe(0);
  });
  it('advanceImpulses prunes dead and ages alive', () => {
    const imps = [createImpulse(0, 0, 3, { lifespan: 1 }), createImpulse(5, 5, 3, { lifespan: 5 })];
    const out = advanceImpulses(imps, 1.5);
    expect(out.length).toBe(1); // first expired
    expect(out[0].age).toBeCloseTo(1.5, 6);
  });
  it('waveOffset at impulse origin starts near 0 (sin(0)=0) and grows then fades', () => {
    const imp = createImpulse(0, 0, 10, { lifespan: 4, wavelength: 8, speed: 100 });
    // At age 0, front=0, ringDist=0 -> phase 0 -> sin(0)=0
    expect(waveOffset([imp], 0, 0)).toBeCloseTo(0, 4);
    // Slightly later, wavefront moves out, origin is behind front => nonzero ring
    const moved = { ...imp, age: 0.2 };
    const y = waveOffset([moved], 0, 0);
    // Could be pos or neg but should be bounded by amplitude
    expect(Math.abs(y)).toBeLessThanOrEqual(impulseAmplitude(moved) + 1e-6);
  });
  it('totalEnergy sums amplitudes', () => {
    const a = createImpulse(0, 0, 3);
    const b = createImpulse(0, 0, 4);
    expect(totalEnergy([a, b])).toBeCloseTo(impulseAmplitude(a) + impulseAmplitude(b), 6);
  });
  it('waveOffset with no impulses is 0', () => {
    expect(waveOffset([], 10, -5)).toBe(0);
  });
});