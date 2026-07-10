// palette.ts — Neon palette. New enemies add a color entry here + renderer geometry.
import type { BossType, BulletKind, EnemyKind, WeaponType } from './types.js';

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
    missile: 0xff7a18,
    lightning: 0xc8f7ff,
    laser: 0x19ffff,
    enemy: 0xff3a4a,
  } as Record<BulletKind, number>,
  weaponColor: {
    blaster: 0x88ffff,
    missile: 0xff7a18,
    lightning: 0xc8f7ff,
    laser: 0xff2bd6,
  } as Record<WeaponType, number>,
  bossPalette: {
    mini: { armor: 0x247cff, joint: 0x071d5c, core: 0x7df9ff },
    big: { armor: 0xff4b1f, joint: 0x521008, core: 0xffd166 },
  } as Record<BossType, { armor: number; joint: number; core: number }>,
  // Particle hue pool for explosions.
  sparkPool: [0xffffff, 0x88ffff, 0xff66cc, 0xffaa22, 0x66ffcc, 0xaa66ff, 0xffffff],
  grid: 0x0044aa,
  gridGlow: 0x33aaff,
  bg: 0x05060f,
  multiplier: 0xffdd33,
} as const;

export const enemyColor = (k: EnemyKind): number => PALETTE.enemyColor[k];
export const bulletColor = (k: BulletKind): number => PALETTE.bulletColor[k];
