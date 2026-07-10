// config.ts — Tunable game constants. Data-driven so new enemies/weapons are
// added here without touching collision/score/spawn logic.

import type { EnemyKind } from './types.js';

export const CONFIG = {
  // --- Fixed-timestep loop ---
  fixedStep: 1 / 60,
  maxSubsteps: 8,

  // --- Arena (sphere cap) ---
  sphereRadius: 60,
  capHalfAngle: 0.448, // rad; chosen so radius*sin(cap) = worldBounds (26)
  worldBounds: 26, // arena edge radius used for spawn ring & wrap (matches sphereMapping.arenaRadius)

  // --- Player ---
  player: {
    radius: 0.55,
    speed: 16,
    boostSpeed: 26,
    accel: 90,
    friction: 6,
    maxHp: 100,
    fireInterval: 0.09,
    bulletSpeed: 42,
    bulletLife: 1.1,
    bulletDamage: 1,
    bulletRadius: 0.28,
    maxBoost: 1,
    boostDrain: 0.55,
    boostRegen: 0.18,
    invulnTime: 1.6,
  },

  // --- Enemies (data-driven: collision/score only read radius/hp/score) ---
  enemies: {
    grunt: { radius: 0.7, hp: 1, score: 100, speed: 7, spawnWeight: 5 },
    wanderer: { radius: 0.85, hp: 2, score: 250, speed: 9, spawnWeight: 3 },
    singularity: { radius: 1.6, hp: 6, score: 600, speed: 3.5, spawnWeight: 1, pullRadius: 9, explodeTime: 4, pullForce: 26 },
    dodger: { radius: 0.65, hp: 2, score: 400, speed: 11, spawnWeight: 2, dodgeRange: 6, dodgeSpeed: 24, dodgeCooldown: 1.4 },
  } as Record<EnemyKind, {
    radius: number; hp: number; score: number; speed: number; spawnWeight: number;
    pullRadius?: number; explodeTime?: number; pullForce?: number;
    dodgeRange?: number; dodgeSpeed?: number; dodgeCooldown?: number;
  }>,

  // --- Multiplier system ---
  score: {
    multiplierStep: 1.25, // base grows geometric-ish: floor(x * step)
    multiplierMax: 25,
    comboWindow: 3.0, // sec since last kill before combo resets
  },

  // --- Spawn system ---
  spawn: {
    baseInterval: 1.5,
    minInterval: 0.35,
    intervalDecay: 0.94, // per wave
    maxAlive: 60,
    waveBudgetGrowth: 4,
    spawnRingPad: 2,
  },

  // --- Particles ---
  particles: {
    perKill: 26,
    perBigKill: 60,
    maxParticles: 3000,
    lifespan: 1.1,
    damping: 0.92,
    speed: 14,
  },

  // --- Camera shake ---
  camera: {
    fovBase: 62,
    fovBoost: 78,
    fovLambda: 4,
    followLambda: 6,
    traumaDecay: 1.4, // per sec
    shakeAmp: 1.6,
    rollAmp: 0.18,
    shakeLambda: 8,
  },

  // --- Wave grid distortion ---
  grid: {
    waveSpeed: 60,
    waveWavelength: 14,
    impulseLifespan: 2.4,
    impulseStrength: 6,
  },
} as const;

export type Config = typeof CONFIG;