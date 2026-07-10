import { CONFIG } from '../core/config.js';
import type { BulletKind, BulletOwner, BulletState, PlayerState, World } from '../core/types.js';

let idCounter = 200000;
export const nextBulletId = () => ++idCounter;

export interface BulletOptions {
  kind?: BulletKind;
  speed?: number;
  life?: number;
  damage?: number;
  radius?: number;
  pierce?: boolean;
  level?: number;
  turnRate?: number;
  blastRadius?: number;
}

export const spawnBullet = (
  owner: BulletOwner,
  pos: { x: number; y: number; z: number },
  dir: { x: number; y?: number; z: number },
  world: World,
  options: BulletOptions = {},
): BulletState => {
  const speed = options.speed ?? CONFIG.player.bulletSpeed;
  const bullet: BulletState = {
    id: nextBulletId(),
    tag: 'bullet',
    pos: { ...pos },
    vel: { x: dir.x * speed, y: 0, z: dir.z * speed },
    radius: options.radius ?? CONFIG.player.bulletRadius,
    owner,
    kind: options.kind ?? 'standard',
    life: options.life ?? CONFIG.player.bulletLife,
    damage: options.damage ?? CONFIG.player.bulletDamage,
    spent: false,
    pierce: options.pierce ?? false,
    level: options.level ?? 1,
    turnRate: options.turnRate ?? 0,
    blastRadius: options.blastRadius ?? 0,
    hitIds: [],
    prevPos: { ...pos },
  };
  world.bullets.push(bullet);
  return bullet;
};

export const firePlayerBullet = (player: PlayerState, world: World): void => {
  const dir = player.aim;
  const muzzle = {
    x: player.pos.x + dir.x * (player.radius + 0.2),
    y: 0,
    z: player.pos.z + dir.z * (player.radius + 0.2),
  };
  spawnBullet('player', muzzle, dir, world);
};

export const stepBullet = (bullet: BulletState, dt: number, world?: World): void => {
  bullet.prevPos = { ...bullet.pos };
  if (world && bullet.kind === 'missile' && bullet.owner === 'player') {
    const targets = world.enemies.filter((enemy) => !enemy.dead) as Array<typeof world.enemies[number] | NonNullable<World['boss']>>;
    if (world.boss && !world.boss.dead) targets.push(world.boss);
    let target: (typeof targets)[number] | null = null;
    let best = 15 * 15;
    for (const candidate of targets) {
      const dx = candidate.pos.x - bullet.pos.x;
      const dz = candidate.pos.z - bullet.pos.z;
      const distanceSquared = dx * dx + dz * dz;
      if (distanceSquared < best) {
        best = distanceSquared;
        target = candidate;
      }
    }
    if (target) {
      const dx = target.pos.x - bullet.pos.x;
      const dz = target.pos.z - bullet.pos.z;
      const length = Math.hypot(dx, dz) || 1;
      const speed = Math.hypot(bullet.vel.x, bullet.vel.z);
      const turn = Math.min(1, (bullet.turnRate || 5) * dt);
      const nextX = (bullet.vel.x / Math.max(0.001, speed)) * (1 - turn) + (dx / length) * turn;
      const nextZ = (bullet.vel.z / Math.max(0.001, speed)) * (1 - turn) + (dz / length) * turn;
      const nextLength = Math.hypot(nextX, nextZ) || 1;
      bullet.vel.x = (nextX / nextLength) * speed;
      bullet.vel.z = (nextZ / nextLength) * speed;
    }
  }
  bullet.pos.x += bullet.vel.x * dt;
  bullet.pos.z += bullet.vel.z * dt;
  bullet.life -= dt;
};

export const bulletAlive = (bullet: BulletState, arenaRadius: number): boolean =>
  !bullet.spent && bullet.life > 0 && Math.hypot(bullet.pos.x, bullet.pos.z) <= arenaRadius + 2;
