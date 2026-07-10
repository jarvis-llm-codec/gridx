import { CONFIG } from '../core/config.js';
import type { PlayerState, WeaponEffect, WeaponSlot, WeaponType, World } from '../core/types.js';
import { spawnBullet, type BulletOptions } from './bullet.js';

export const PRIMARY_WEAPON = 'blaster' as const;
export const WEAPON_TYPES = Object.freeze<WeaponType[]>([PRIMARY_WEAPON, 'missile', 'lightning', 'laser']);
export const WEAPON_DROP_ORDER = Object.freeze<Array<Exclude<WeaponType, 'blaster'>>>(['missile', 'lightning', 'laser']);
export const WEAPON_NAMES = Object.freeze<Record<WeaponType, string>>({
  blaster: 'BLASTER',
  missile: 'MISSILE',
  lightning: 'LIGHTNING',
  laser: 'LASER',
});
export const WEAPON_COLORS = Object.freeze<Record<WeaponType, number>>({
  blaster: 0x88ffff,
  missile: 0xff7a18,
  lightning: 0xc8f7ff,
  laser: 0xff2bd6,
});

const rotatedDirection = (dir: { x: number; z: number }, angle: number): { x: number; z: number } => {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return { x: dir.x * cosine - dir.z * sine, z: dir.x * sine + dir.z * cosine };
};

export const fireWeaponSlot = (
  player: PlayerState,
  world: World,
  weapon: WeaponType | null,
  slot: WeaponSlot,
): boolean => {
  if (!weapon || player.weaponCooldowns[slot] > 0) return false;
  const level = Math.max(1, Math.min(CONFIG.player.maxWeaponLevel, player.weaponLevels[weapon] || 1));
  const direction = player.aim;
  const side = slot === 'primary' ? -0.18 : 0.18;
  const perpendicularX = -direction.z;
  const perpendicularZ = direction.x;
  const muzzle = {
    x: player.pos.x + direction.x * (player.radius + 0.28) + perpendicularX * side,
    y: 0,
    z: player.pos.z + direction.z * (player.radius + 0.28) + perpendicularZ * side,
  };
  const spawn = (shotDirection: { x: number; z: number }, options: BulletOptions = {}) =>
    spawnBullet('player', muzzle, shotDirection, world, { level, ...options });

  const interval = CONFIG.player.weapons[weapon].interval;
  player.weaponCooldowns[slot] = interval * (slot === 'secondary' ? 1.12 : 1) * (1 - (level - 1) * 0.08);
  if (weapon === 'blaster') {
    const config = CONFIG.player.weapons.blaster;
    for (let index = 0; index < level; index += 1) {
      const offset = (index - (level - 1) / 2) * 0.24;
      spawnBullet(
        'player',
        { x: muzzle.x + perpendicularX * offset, y: 0, z: muzzle.z + perpendicularZ * offset },
        direction,
        world,
        { kind: 'standard', damage: config.damage * (1 + (level - 1) * 0.12), level },
      );
    }
  } else if (weapon === 'missile') {
    const config = CONFIG.player.weapons.missile;
    const count = level === 3 ? 2 : 1;
    for (let index = 0; index < count; index += 1) {
      spawn(rotatedDirection(direction, (index - (count - 1) / 2) * 0.16), {
        kind: 'missile',
        speed: 18 + level * 1.5,
        life: 3.1,
        damage: config.damage + level * 0.9,
        radius: 0.36,
        turnRate: config.turnRate + level * 0.8,
        blastRadius: config.blastRadius + level * 0.25,
      });
    }
  } else if (weapon === 'lightning') {
    const config = CONFIG.player.weapons.lightning;
    world.pendingLightning.push({
      pos: { ...muzzle },
      dir: { ...direction },
      level,
      damage: config.damage + (level - 1) * 0.65,
      range: config.range + level,
    });
  } else {
    const config = CONFIG.player.weapons.laser;
    spawn(direction, {
      kind: 'laser',
      speed: 72,
      life: 0.72 + level * 0.08,
      damage: config.damage + level * 0.5,
      radius: 0.42 + level * 0.04,
      pierce: true,
    });
    world.weaponEffects.push({
      kind: 'laser',
      from: { ...muzzle },
      to: { x: muzzle.x + direction.x * (9 + level * 2), z: muzzle.z + direction.z * (9 + level * 2) },
      life: 0.09,
      maxLife: 0.09,
    });
  }
  world.events.push({ type: 'weapon-fire', pos: { ...muzzle }, weapon, level, slot });
  return true;
};

export const firePlayerWeapons = (player: PlayerState, world: World): void => {
  player.primaryWeapon = PRIMARY_WEAPON;
  fireWeaponSlot(player, world, PRIMARY_WEAPON, 'primary');
  fireWeaponSlot(
    player,
    world,
    player.secondaryWeapon && WEAPON_DROP_ORDER.includes(player.secondaryWeapon) ? player.secondaryWeapon : null,
    'secondary',
  );
};

export const addWeaponArc = (
  world: World,
  kind: 'lightning' | 'missile',
  from: { x: number; z: number },
  to: { x: number; z: number },
  seed = 0,
): void => {
  const isLightning = kind === 'lightning';
  const deltaX = to.x - from.x;
  const deltaZ = to.z - from.z;
  const length = Math.hypot(deltaX, deltaZ) || 1;
  const segments = isLightning ? Math.max(8, Math.min(14, Math.ceil(length * 0.85))) : 1;
  const forwardX = deltaX / length;
  const forwardZ = deltaZ / length;
  const perpendicularX = -forwardZ;
  const perpendicularZ = forwardX;
  const boltLife = 0.24;
  let previous = { ...from };
  for (let step = 1; step <= segments; step += 1) {
    const progress = step / segments;
    const taper = Math.sin(Math.PI * progress);
    const broadKick = Math.sin((seed + step * 0.73) * 12.9898 + world.time * 31.7) * 0.9;
    const sharpJitter = Math.sin((seed * 1.91 - step * 2.37) * 5.398 + world.time * 47.1) * 0.42;
    const electricNoise = broadKick + sharpJitter;
    const crossSign = step % 2 === 0 ? 1 : -1;
    const edge = step === segments
      ? 0
      : (crossSign * (0.82 + Math.abs(electricNoise) * 0.32) + electricNoise * 0.22) * taper;
    const next = {
      x: from.x + deltaX * progress + perpendicularX * edge,
      z: from.z + deltaZ * progress + perpendicularZ * edge,
    };
    world.weaponEffects.push({
      kind,
      style: isLightning ? 'bolt' : 'trail',
      from: previous,
      to: next,
      height: isLightning ? 0.72 : 0,
      life: isLightning ? boltLife : 0.12,
      maxLife: isLightning ? boltLife : 0.12,
    });
    if (isLightning && step < segments - 1 && step % 3 === 0) {
      const branchNoise = Math.sin((seed + step * 3.17) * 19.19);
      const branchSide = branchNoise < 0 ? -1 : 1;
      const branchLength = 1.15 + Math.abs(branchNoise) * 1.35;
      const branchMid = {
        x: next.x + forwardX * branchLength * 0.28 + perpendicularX * branchSide * branchLength * 0.42,
        z: next.z + forwardZ * branchLength * 0.28 + perpendicularZ * branchSide * branchLength * 0.42,
      };
      const branchTip = {
        x: next.x + forwardX * branchLength * 0.48 + perpendicularX * branchSide * branchLength,
        z: next.z + forwardZ * branchLength * 0.48 + perpendicularZ * branchSide * branchLength,
      };
      const branches: WeaponEffect[] = [
        { kind, style: 'branch', from: { ...next }, to: branchMid, height: 0.68, life: 0.19, maxLife: 0.19 },
        { kind, style: 'branch', from: branchMid, to: branchTip, height: 0.61, life: 0.16, maxLife: 0.16 },
      ];
      world.weaponEffects.push(...branches);
    }
    previous = next;
  }
  if (isLightning) {
    for (let ray = 0; ray < 5; ray += 1) {
      const angle = ray * Math.PI * 0.4 + seed * 0.31;
      const radius = 0.72 + (ray % 2) * 0.38;
      world.weaponEffects.push({
        kind,
        style: 'flash',
        from: { ...to },
        to: { x: to.x + Math.cos(angle) * radius, z: to.z + Math.sin(angle) * radius },
        height: 0.76,
        life: 0.13,
        maxLife: 0.13,
      });
    }
  }
};
