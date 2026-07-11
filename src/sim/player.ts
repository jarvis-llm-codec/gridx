import { CONFIG } from '../core/config.js';
import type { PlayerState, WeaponType, World } from '../core/types.js';
import type { InputState } from '../input/inputState.js';
import { normalize2, vec3 } from '../math/vec3.js';
import { createImpulse } from '../math/wave.js';
import { spawnBurst } from './particles.js';

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
  fireInterval: 0.045,
  boost: CONFIG.player.maxBoost,
  alive: true,
  invuln: CONFIG.player.invulnTime,
  multiplier: 1,
  score: 0,
  energy: 0,
  weaponLevel: 1,
  weaponLevels: { blaster: 1, missile: 0, lightning: 0, laser: 0 },
  primaryWeapon: 'blaster',
  secondaryWeapon: null,
  weaponCooldowns: { primary: 0, secondary: 0 },
  ultimateCooldown: 0,
  lives: CONFIG.player.maxLives,
  shield: 0,
  hitCount: 0,
});

export const stepPlayer = (player: PlayerState, input: InputState, dt: number, world: World): void => {
  if (!player.alive) return;
  if (input.aimX || input.aimZ) {
    const aim = normalize2({ x: input.aimX, y: 0, z: input.aimZ });
    if (aim.x || aim.z) player.aim = aim;
  }
  const config = CONFIG.player;
  const boosting = input.boost && player.boost > 0.01;
  const maxSpeed = boosting ? config.boostSpeed : config.speed;
  const acceleration = boosting ? config.accel * 1.5 : config.accel;
  let moveX = input.moveX;
  let moveZ = input.moveZ;
  const moveLength = Math.hypot(moveX, moveZ);
  if (moveLength > 1) {
    moveX /= moveLength;
    moveZ /= moveLength;
  }
  player.vel.x += moveX * acceleration * dt;
  player.vel.z += moveZ * acceleration * dt;
  if (moveLength < 0.01) {
    const friction = Math.max(0, 1 - config.friction * dt);
    player.vel.x *= friction;
    player.vel.z *= friction;
  }
  const speed = Math.hypot(player.vel.x, player.vel.z);
  if (speed > maxSpeed) {
    const scale = maxSpeed / speed;
    player.vel.x *= scale;
    player.vel.z *= scale;
  }
  player.pos.x += player.vel.x * dt;
  player.pos.z += player.vel.z * dt;
  const edge = world.arenaRadius - player.radius;
  const distance = Math.hypot(player.pos.x, player.pos.z);
  if (distance > edge) {
    const scale = edge / distance;
    player.pos.x *= scale;
    player.pos.z *= scale;
    const normalX = player.pos.x / edge;
    const normalZ = player.pos.z / edge;
    const outwardVelocity = player.vel.x * normalX + player.vel.z * normalZ;
    if (outwardVelocity > 0) {
      player.vel.x -= outwardVelocity * normalX;
      player.vel.z -= outwardVelocity * normalZ;
    }
  }
  player.boost = boosting
    ? Math.max(0, player.boost - config.boostDrain * dt)
    : Math.min(config.maxBoost, player.boost + config.boostRegen * dt);
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.weaponCooldowns.primary = Math.max(0, player.weaponCooldowns.primary - dt);
  player.weaponCooldowns.secondary = Math.max(0, player.weaponCooldowns.secondary - dt);
  player.ultimateCooldown = Math.max(0, player.ultimateCooldown - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  player.energy = Math.min(config.maxEnergy, player.energy + config.energyRegen * dt);
  player.shield = Math.max(0, player.shield - dt);
};

export const tryFire = (player: PlayerState, firing: boolean): boolean => {
  if (!firing || !player.alive || player.fireCooldown > 0) return false;
  player.fireCooldown = player.fireInterval;
  return true;
};

export const damagePlayer = (player: PlayerState, damage: number, world: World): boolean => {
  if (!player.alive || player.invuln > 0) return false;
  world.events.push({ type: 'hit-player', pos: { ...player.pos }, damage });
  spawnBurst(player.pos, CONFIG.particles.hitPlayer, 0xff3a4a, world);

  const killPlayer = (): void => {
    player.hp = 0;
    player.alive = false;
    player.hitCount = 0;
    world.gameOver = true;
    world.eventWobble = Math.max(world.eventWobble || 0, 1);
    world.events.push({ type: 'explode', pos: { ...player.pos }, radius: 3, strength: 1.4, color: 0x33ddff });
    world.events.push({ type: 'game-over', pos: { ...player.pos } });
    world.impulses.push(createImpulse(player.pos.x, player.pos.z, CONFIG.grid.impulseStrength * 3.2, {
      lifespan: 2.8,
      wavelength: 16,
      speed: 48,
      eventTier: 'death',
      coupleEntities: true,
    }));
  };

  if (player.lives <= 0) {
    killPlayer();
    return true;
  }
  player.hitCount = (player.hitCount || 0) + 1;
  if (player.hitCount < 3) {
    player.hp = player.maxHp;
    player.alive = true;
    player.invuln = CONFIG.player.shieldTime;
    player.shield = CONFIG.player.shieldTime;
    world.impulses.push(createImpulse(player.pos.x, player.pos.z, CONFIG.grid.impulseStrength * 1.5));
    return true;
  }

  player.hitCount = 0;
  player.lives -= 1;
  world.eventWobble = Math.max(world.eventWobble || 0, 0.72);
  player.hp = player.maxHp;
  player.alive = true;
  player.invuln = CONFIG.player.shieldTime;
  player.shield = CONFIG.player.shieldTime;
  for (const weapon of Object.keys(player.weaponLevels) as WeaponType[]) {
    if (player.weaponLevels[weapon] > 0) {
      player.weaponLevels[weapon] = Math.max(1, player.weaponLevels[weapon] - 1);
    }
  }
  player.weaponLevel = Math.max(
    player.weaponLevels[player.primaryWeapon],
    player.secondaryWeapon ? player.weaponLevels[player.secondaryWeapon] : 0,
  );
  player.vel = { x: 0, y: 0, z: 0 };
  world.events.push({ type: 'revive', pos: { ...player.pos } });
  world.impulses.push(createImpulse(player.pos.x, player.pos.z, CONFIG.grid.impulseStrength * 2, {
    eventTier: 'heart',
    coupleEntities: true,
  }));
  if (player.lives <= 0) {
    killPlayer();
    return true;
  }
  return true;
};
