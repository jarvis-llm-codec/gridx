// particles.ts — Hyper particle engine (pure data). The render layer turns these
// into a single InstancedMesh; the sim only manages velocity/life/color.

import type { ParticleState, World } from '../core/types.js';
import { CONFIG } from '../core/config.js';
import { PALETTE } from '../core/palette.js';

let idCounter = 400000;
export const nextParticleId = () => ++idCounter;

export const spawnBurst = (
  pos: { x: number; y: number; z: number },
  count: number,
  color: number,
  world: World,
  opts?: { speed?: number; lifespan?: number; size?: number; spreadY?: number }
): void => {
  const cfg = CONFIG.particles;
  if (world.particles.length > cfg.maxParticles) return;
  const speed = opts?.speed ?? cfg.speed;
  const lifespan = opts?.lifespan ?? cfg.lifespan;
  const size = opts?.size ?? 0.16;
  const spreadY = opts?.spreadY ?? 0.35;
  for (let i = 0; i < count; i++) {
    if (world.particles.length >= cfg.maxParticles) break;
    const ang = world.rng.next() * Math.PI * 2;
    const sp = speed * (0.4 + world.rng.next() * 0.6);
    const yv = (world.rng.next() - 0.5) * 2 * speed * spreadY;
    const col = world.rng.chance(0.5) ? color : world.rng.pick(PALETTE.sparkPool);
    world.particles.push({
      id: nextParticleId(),
      tag: 'particle',
      pos: { ...pos },
      vel: { x: Math.cos(ang) * sp, y: yv, z: Math.sin(ang) * sp },
      radius: size,
      life: lifespan * (0.5 + world.rng.next() * 0.5),
      lifespan,
      damping: cfg.damping,
      color: col,
      size,
    });
  }
};

export const stepParticle = (p: ParticleState, dt: number): void => {
  const d = Math.pow(p.damping, dt * 60);
  p.vel.x *= d;
  p.vel.y *= d;
  p.vel.z *= d;
  // slight gravity so voxels settle
  p.vel.y -= 9 * dt * 0.3;
  p.pos.x += p.vel.x * dt;
  p.pos.y += p.vel.y * dt;
  p.pos.z += p.vel.z * dt;
  p.life -= dt;
};