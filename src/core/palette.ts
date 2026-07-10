// palette.ts — Neon palette. New enemies add a color entry here + renderer geometry.
import type { EnemyKind, BulletKind } from './types.js';

/** Map a 0xRRGGBB int to a normalized [r,g,b] 0..1 array. */
export const rgb = (hex: number): [number, number, number] => [
  ((hex >> 16) & 0xff) / 255,
  ((hex >> 8) & 0xff) / 255,
  (hex & 0xff) / 255,
];

export const PALETTE = {
  player: 0x33ddff,
  playerBullet: 0x88ffff,
  enemyBullet: 0xff5577,
  // One color per enemy kind (must cover every EnemyKind union member).
  enemyColor: {
    grunt: 0xff2266,
    wanderer: 0xffaa22,
    singularity: 0xaa44ff,
    dodger: 0x44ff99,
  } as Record<EnemyKind, number>,
  bulletColor: {
    standard: 0x88ffff,
    spread: 0x66ffcc,
  } as Record<BulletKind, number>,
  // Particle hue pool for explosions.
  sparkPool: [0xffffff, 0x88ffff, 0xff66cc, 0xffaa22, 0x66ffcc, 0xaa66ff, 0xffffff],
  grid: 0x0044aa,
  gridGlow: 0x33aaff,
  bg: 0x05060f,
  multiplier: 0xffdd33,
} as const;

export const enemyColor = (k: EnemyKind): number => PALETTE.enemyColor[k];
export const bulletColor = (k: BulletKind): number => PALETTE.bulletColor[k];