import { describe, it, expect } from 'vitest';
import { createCameraShake, addTrauma, stepCameraShake, shakeTransform } from '../../src/systems/cameraShake.js';

describe('cameraShake', () => {
  it('addTrauma clamps to 1', () => {
    let s = createCameraShake(1);
    s = addTrauma(s, 0.5);
    expect(s.trauma).toBeCloseTo(0.5, 6);
    s = addTrauma(s, 2);
    expect(s.trauma).toBe(1);
  });
  it('stepCameraShake decays toward 0', () => {
    let s = addTrauma(createCameraShake(1), 1);
    for (let i = 0; i < 200; i++) s = stepCameraShake(s, 0.05);
    expect(s.trauma).toBeCloseTo(0, 3);
  });
  it('shakeTransform is zero when trauma is zero', () => {
    const s = createCameraShake(1);
    const t = shakeTransform(s, 1.5);
    expect(t.x).toBeCloseTo(0, 6);
    expect(t.y).toBeCloseTo(0, 6);
    expect(t.z).toBeCloseTo(0, 6);
    expect(t.roll).toBeCloseTo(0, 6);
  });
  it('shakeTransform is non-zero when trauma > 0', () => {
    const s = addTrauma(createCameraShake(1), 1);
    const t = shakeTransform(s, 1.5);
    // amplitude = trauma^2 * shakeAmp, nonzero
    expect(Math.abs(t.x) + Math.abs(t.y)).toBeGreaterThan(0);
  });
});