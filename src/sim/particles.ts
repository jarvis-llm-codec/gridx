import { CONFIG } from '../core/config.js';
import { PALETTE } from '../core/palette.js';
import type { ParticleState, World } from '../core/types.js';

let idCounter = 400000;
export const nextParticleId = () => ++idCounter;

export const spawnBurst = (
  pos: { x: number; y: number; z: number },
  count: number,
  color: number,
  world: World,
): void => {
  const config = CONFIG.particles;
  if (world.particles.length > config.maxParticles) return;
  for (let index = 0; index < count && world.particles.length < config.maxParticles; index += 1) {
    const tier = world.rng.next();
    const angle = world.rng.next() * Math.PI * 2;
    const baseColor = world.rng.chance(0.62) ? color : world.rng.pick(PALETTE.sparkPool);
    let radius: number;
    let life: number;
    let speed: number;
    let velocityY: number;
    let particleColor: number;
    if (tier < 0.16) {
      radius = 0.3 + world.rng.next() * 0.18;
      life = config.lifespan * (0.35 + world.rng.next() * 0.25);
      speed = config.speed * (0.9 + world.rng.next() * 0.6);
      velocityY = (world.rng.next() - 0.5) * 2 * config.speed * 0.5;
      particleColor = world.rng.chance(0.7) ? 0xffffff : baseColor;
    } else if (tier < 0.6) {
      radius = 0.1 + world.rng.next() * 0.08;
      life = config.lifespan * (0.55 + world.rng.next() * 0.5);
      speed = config.speed * (0.7 + world.rng.next() * 0.9);
      velocityY = (world.rng.next() - 0.4) * 2 * config.speed * 0.4;
      particleColor = baseColor;
    } else {
      radius = 0.14 + world.rng.next() * 0.1;
      life = config.lifespan * (0.8 + world.rng.next() * 0.7);
      speed = config.speed * (0.2 + world.rng.next() * 0.45);
      velocityY = (world.rng.next() - 0.5) * 2 * config.speed * 0.25;
      particleColor = baseColor;
    }
    world.particles.push({
      id: nextParticleId(),
      tag: 'particle',
      pos: { ...pos },
      vel: { x: Math.cos(angle) * speed, y: velocityY, z: Math.sin(angle) * speed },
      radius,
      life,
      lifespan: life,
      damping: config.damping,
      color: particleColor,
      size: radius,
    });
  }
};

export const stepParticle = (particle: ParticleState, dt: number): void => {
  const damping = Math.pow(particle.damping, dt * 60);
  particle.vel.x *= damping;
  particle.vel.y *= damping;
  particle.vel.z *= damping;
  particle.vel.y -= 9 * dt * 0.3;
  particle.pos.x += particle.vel.x * dt;
  particle.pos.y += particle.vel.y * dt;
  particle.pos.z += particle.vel.z * dt;
  particle.life -= dt;
};
