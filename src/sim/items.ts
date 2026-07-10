import { CONFIG } from '../core/config.js';
import type { ItemKind, ItemState, PlayerState, WeaponType, World } from '../core/types.js';
import { nextEnemyId } from './enemy.js';
import { PRIMARY_WEAPON, WEAPON_COLORS, WEAPON_DROP_ORDER } from './weapons.js';

export const nextWeaponDrop = (world: World): Exclude<WeaponType, 'blaster'> => {
  const levels = world.player.weaponLevels;
  const reserved = new Set(
    world.items
      .filter((item) => item.kind === 'weapon' && !item.dead)
      .map((item) => item.weaponType)
      .filter((weapon): weapon is Exclude<WeaponType, 'blaster'> => weapon !== null),
  );
  const locked = WEAPON_DROP_ORDER.find((weapon) => !levels[weapon] && !reserved.has(weapon));
  return locked || world.rng.pick(WEAPON_DROP_ORDER);
};

export const randomItemKind = (world: World): ItemKind => {
  const pool = (Object.entries(CONFIG.items.dropWeights) as Array<[ItemKind, number]>)
    .flatMap(([kind, weight]) => Array<ItemKind>(weight).fill(kind));
  return world.rng.pick(pool);
};

export const makeItem = (kind: ItemKind, pos: { x: number; y: number; z: number }, world: World): ItemState => {
  const weaponType = kind === 'weapon' ? nextWeaponDrop(world) : null;
  return {
    id: nextEnemyId(),
    tag: 'item',
    kind,
    weaponType,
    pos: { ...pos },
    vel: { x: 0, y: 0, z: 0 },
    radius: CONFIG.items.radius,
    life: CONFIG.items.lifespan,
    bob: world.rng.next() * Math.PI * 2,
    color: weaponType ? WEAPON_COLORS[weaponType] : CONFIG.items.colors[kind],
    dead: false,
  };
};

export const equipWeapon = (player: PlayerState, weapon: WeaponType | null): void => {
  if (!weapon || weapon === 'blaster' || !WEAPON_DROP_ORDER.includes(weapon)) return;
  player.primaryWeapon = PRIMARY_WEAPON;
  player.weaponLevels[PRIMARY_WEAPON] = 1;
  player.weaponLevels[weapon] = Math.min(CONFIG.player.maxWeaponLevel, (player.weaponLevels[weapon] || 0) + 1);
  player.secondaryWeapon = weapon;
  player.weaponLevel = player.weaponLevels[weapon];
};

export const applyItem = (player: PlayerState, item: ItemState, world: World): void => {
  switch (item.kind) {
    case 'heal':
      if (player.lives < CONFIG.player.maxLives) player.lives += 1;
      else {
        player.hp = Math.min(player.maxHp, player.hp + 30);
        player.invuln = Math.max(player.invuln, CONFIG.player.shieldTime);
      }
      break;
    case 'boost':
      player.boost = CONFIG.player.maxBoost;
      break;
    case 'weapon':
      equipWeapon(player, item.weaponType || nextWeaponDrop(world));
      break;
    case 'life':
      player.lives = Math.min(CONFIG.player.maxLives + 3, player.lives + 1);
      break;
    case 'shield':
      player.invuln = Math.max(player.invuln, CONFIG.player.shieldTime);
      player.shield = CONFIG.player.shieldTime;
      break;
    case 'multiplier':
      player.multiplier = Math.min(CONFIG.score.multiplierMax, player.multiplier + 3);
      player.score += 1000 * player.multiplier;
      break;
  }
};

export const stepItems = (world: World, dt: number): void => {
  for (const item of world.items) {
    item.life -= dt;
    item.bob += dt * 2.6;
    item.pos.x += item.vel.x * dt;
    item.pos.z += item.vel.z * dt;
    item.vel.x *= 0.92;
    item.vel.z *= 0.92;
    if (item.life <= 0) item.dead = true;
  }
  const player = world.player;
  if (player.alive) {
    for (const item of world.items) {
      if (item.dead) continue;
      const deltaX = player.pos.x - item.pos.x;
      const deltaZ = player.pos.z - item.pos.z;
      const distance = Math.hypot(deltaX, deltaZ);
      if (distance <= CONFIG.items.magnetRadius && distance > 0.001) {
        const pull = 1 - distance / CONFIG.items.magnetRadius;
        const magnitude = CONFIG.items.magnetPull * pull * (0.25 + 0.75 * pull);
        item.vel.x += (deltaX / distance) * magnitude * dt;
        item.vel.z += (deltaZ / distance) * magnitude * dt;
      }
      if (distance <= player.radius + item.radius + 0.5) {
        item.dead = true;
        applyItem(player, item, world);
        world.pendingBursts.push({
          pos: { ...item.pos },
          remaining: CONFIG.particles.pickup,
          color: CONFIG.items.colors[item.kind] ?? 0xffffff,
          perFrame: 40,
        });
        world.events.push({ type: 'pickup', pos: { ...item.pos }, kind: item.kind });
      }
    }
  }
  world.items = world.items.filter((item) => !item.dead);
};
