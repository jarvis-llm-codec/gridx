// cameraShake.ts — Trauma-based 3D camera shake. Pure scalar system; the renderer
// reads `trauma` and applies shake. Trauma decays; events add trauma.

import { CONFIG } from '../core/config.js';

export interface CameraShakeState {
  trauma: number; // 0..1
  seed: number; // for noise phase
}

export const createCameraShake = (seed: number): CameraShakeState => ({
  trauma: 0,
  seed,
});

/** Add trauma (clamped to 1). Used by sim on explosions/hits. */
export const addTrauma = (s: CameraShakeState, amount: number): CameraShakeState => ({
  ...s,
  trauma: Math.min(1, s.trauma + amount),
});

/** Decay trauma each step. */
export const stepCameraShake = (s: CameraShakeState, dt: number): CameraShakeState => ({
  ...s,
  trauma: Math.max(0, s.trauma - dt * CONFIG.camera.traumaDecay),
});

/**
 * Compute shake offset/roll for a given time. Trauma^2 mapping gives a punchy
 * feel (Spector-style). Returns translation + roll; renderer applies them.
 */
export const shakeTransform = (s: CameraShakeState, t: number): {
  x: number; y: number; z: number; roll: number;
} => {
  const amp = s.trauma * s.trauma * CONFIG.camera.shakeAmp;
  const seed = s.seed;
  // Pseudo-noise from sine at incommensurate frequencies + per-seed phase.
  const n1 = Math.sin(t * CONFIG.camera.shakeLambda + seed) +
    Math.sin(t * CONFIG.camera.shakeLambda * 1.7 + seed * 1.3) * 0.5;
  const n2 = Math.sin(t * (CONFIG.camera.shakeLambda + 3.3) + seed * 2.1) +
    Math.sin(t * (CONFIG.camera.shakeLambda + 5.1) + seed * 3.7) * 0.5;
  const n3 = Math.sin(t * (CONFIG.camera.shakeLambda + 2.1) + seed * 5.2);
  return {
    x: n1 * amp,
    y: n2 * amp * 0.6,
    z: n3 * amp * 0.4,
    roll: n1 * s.trauma * CONFIG.camera.rollAmp,
  };
};