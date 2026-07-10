// bullet.ts — Bullet factory + step. Pure.

import type { BulletState, PlayerState, World } from '../core/types.js';
import { CONFIG } from '../core/config.js';

let idCounter = 200000;
export const nextBulletId = () => ++idCounter;

export const spawnBullet = (
  owner: 'player' | 'enemy',
  pos: { x: number; y: number; z: number },
  dir: { x: number; y: number; z: number },
  world: World,
  opts?: { kind?: 'standard' | 'spread'; speed?: number; life?: number; damage?: number; radius?: number }
): BulletState => {
  const kind = opts?.kind ?? 'standard';
  const speed = opts?.speed ?? (owner === 'player' ? CONFIG.player.bulletSpeed : CONFIG.enemies.dodger.dodgeSpeed ?? 20);
  const life = opts?.life ?? CONFIG.player.bulletLife;
  const damage = opts?.damage ?? CONFIG.player.bulletDamage;
  const radius = opts?.radius ?? CONFIG.player.bulletRadius;
  const b: BulletState = {
    id: nextBulletId(),
    tag: 'bullet',
    pos: { ...pos },
    vel: { x: dir.x * speed, y: 0, z: dir.z * speed },
    radius,
    owner,
    kind,
    life,
    damage,
    spent: false,
  };
  world.bullets.push(b);
  return b;
};

/** Player fires toward current aim; one bullet (+ optional spread). */
export const firePlayerBullet = (player: PlayerState, world: World): void => {
  const dir = player.aim;
  const muzzle = { x: player.pos.x + dir.x * (player.radius + 0.2), y: 0, z: player.pos.z + dir.z * (player.radius + 0.2) };
  spawnBullet('player', muzzle, dir, world);
};

export const stepBullet = (b: BulletState, dt: number): void => {
  b.pos.x += b.vel.x * dt;
  b.pos.z += b.vel.z * dt;
  b.life -= dt;
};

export const bulletAlive = (b: BulletState, arenaRadius: number): boolean => {
  if (b.spent || b.life <= 0) return false;
  const r = Math.hypot(b.pos.x, b.pos.z);
  return r <= arenaRadius + 2;
};