// player.ts — Player factory + step. Pure; no Three.js/DOM.

import type { PlayerState, World } from '../core/types.js';
import { CONFIG } from '../core/config.js';
import { vec3, normalize2 } from '../math/vec3.js';
import type { InputState } from '../input/inputState.js';
import { createImpulse } from '../math/wave.js';

let idCounter = 100000;
export const nextPlayerId = () => ++idCounter;

export const createPlayer = (pos = { x: 0, y: 0, z: 0 }): PlayerState => ({
  id: nextPlayerId(),
  tag: 'player',
  pos: { ...pos },
  vel: vec3(),
  radius: CONFIG.player.radius,
  hp: CONFIG.player.maxHp,
  maxHp: CONFIG.player.maxHp,
  aim: { x: 0, y: 0, z: -1 },
  fireCooldown: 0,
  fireInterval: CONFIG.player.fireInterval,
  boost: CONFIG.player.maxBoost,
  alive: true,
  invuln: CONFIG.player.invulnTime,
  multiplier: 1,
  score: 0,
});

/** Step the player given input. Returns new cooldown (does NOT spawn bullets here). */
export const stepPlayer = (player: PlayerState, input: InputState, dt: number, world: World): void => {
  if (!player.alive) return;
  // Aim
  if (input.aimX || input.aimZ) {
    const a = normalize2({ x: input.aimX, y: 0, z: input.aimZ });
    if (a.x || a.z) player.aim = a;
  }
  // Movement with accel + friction
  const p = CONFIG.player;
  const wantBoost = input.boost && player.boost > 0.01;
  const maxSpeed = wantBoost ? p.boostSpeed : p.speed;
  const accel = wantBoost ? p.accel * 1.5 : p.accel;
  let mx = input.moveX;
  let mz = input.moveZ;
  const mlen = Math.hypot(mx, mz);
  if (mlen > 1) {
    mx /= mlen;
    mz /= mlen;
  }
  player.vel.x += mx * accel * dt;
  player.vel.z += mz * accel * dt;
  // Friction toward zero when no input
  if (mlen < 0.01) {
    const f = Math.max(0, 1 - p.friction * dt);
    player.vel.x *= f;
    player.vel.z *= f;
  }
  // Clamp speed
  const sp = Math.hypot(player.vel.x, player.vel.z);
  if (sp > maxSpeed) {
    const s = maxSpeed / sp;
    player.vel.x *= s;
    player.vel.z *= s;
  }
  // Integrate
  player.pos.x += player.vel.x * dt;
  player.pos.z += player.vel.z * dt;
  // Arena clamp (soft wall)
  const edge = world.arenaRadius - player.radius;
  const distC = Math.hypot(player.pos.x, player.pos.z);
  if (distC > edge) {
    const s = edge / distC;
    player.pos.x *= s;
    player.pos.z *= s;
    // Kill outward velocity
    const nx = player.pos.x / edge;
    const nz = player.pos.z / edge;
    const vn = player.vel.x * nx + player.vel.z * nz;
    if (vn > 0) {
      player.vel.x -= vn * nx;
      player.vel.z -= vn * nz;
    }
  }
  // Boost energy
  if (wantBoost) player.boost = Math.max(0, player.boost - p.boostDrain * dt);
  else player.boost = Math.min(p.maxBoost, player.boost + p.boostRegen * dt);
  // Cooldowns
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.invuln = Math.max(0, player.invuln - dt);
};

/** True if the player can fire this frame; consumes cooldown. */
export const tryFire = (player: PlayerState, firing: boolean): boolean => {
  if (!firing || !player.alive) return false;
  if (player.fireCooldown > 0) return false;
  player.fireCooldown = player.fireInterval;
  return true;
};

/** Apply damage to player. Returns true if it died. */
export const damagePlayer = (player: PlayerState, dmg: number, world: World): boolean => {
  if (!player.alive || player.invuln > 0) return false;
  player.hp -= dmg;
  world.events.push({ type: 'hit-player', pos: { ...player.pos }, damage: dmg });
  if (player.hp <= 0) {
    player.hp = 0;
    player.alive = false;
    world.gameOver = true;
    world.events.push({ type: 'explode', pos: { ...player.pos }, radius: 3, strength: 1.4, color: 0x33ddff });
    world.events.push({ type: 'game-over', pos: { ...player.pos } });
    world.impulses.push(createImpulse(player.pos.x, player.pos.z, CONFIG.grid.impulseStrength * 2.5));
    return true;
  }
  player.invuln = CONFIG.player.invulnTime;
  return false;
};