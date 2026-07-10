import { CONFIG } from '../core/config.js';
import type { BossState, BossType, World } from '../core/types.js';
import { createImpulse } from '../math/wave.js';
import { addTrauma } from '../systems/cameraShake.js';
import type { SpawnSystemState } from '../systems/spawn.js';
import { spawnBullet } from './bullet.js';
import { createEnemy } from './enemy.js';
import { makeItem, randomItemKind } from './items.js';

interface BossSystems {
  shake: ReturnType<typeof addTrauma>;
  spawn: SpawnSystemState;
}

export const bossRageForNumber = (bossNumber: number) => {
  const level = Math.max(0, bossNumber - 3);
  return {
    level,
    hpMul: 1 + level * CONFIG.boss.postThirdHpGrowth,
    speedMul: Math.min(1.75, 1 + level * CONFIG.boss.postThirdSpeedGrowth),
    fireMul: Math.max(0.42, 1 - level * CONFIG.boss.postThirdFireAccel),
    bulletSpeedMul: Math.min(1.7, 1 + level * CONFIG.boss.postThirdBulletSpeedGrowth),
    damageAdd: level * CONFIG.boss.postThirdDamageGrowth,
    extraBullets: Math.min(12, level * CONFIG.boss.postThirdExtraBullets),
  };
};

export const bossForWave = (wave: number): BossType | null =>
  wave % 10 === 0 ? 'big' : wave % 10 === CONFIG.boss.miniWave ? 'mini' : null;

export const makeBoss = (type: BossType, world: World, bossNumber = 1): BossState => {
  const config = CONFIG.boss[type];
  const rage = bossRageForNumber(bossNumber);
  const enemy = createEnemy('singularity', { x: 0, y: 0, z: 0 }, world);
  const hp = Math.ceil(config.hp * rage.hpMul);
  return {
    ...enemy,
    kind: 'boss',
    bossType: type,
    bossNumber,
    rageLevel: rage.level,
    radius: config.radius,
    hp,
    maxHp: hp,
    score: Math.round(config.score * (1 + rage.level * 0.25)),
    speed: config.speed * rage.speedMul,
    color: config.color,
    fireCooldown: rage.level > 0 ? Math.min(0.9, config.fireInterval * rage.fireMul) : 1.6,
    fireInterval: config.fireInterval * rage.fireMul,
    bulletSpeed: config.bulletSpeed * rage.bulletSpeedMul,
    bulletLife: config.bulletLife,
    bulletDamage: config.bulletDamage + rage.damageAdd,
    extraBullets: rage.extraBullets,
    phase: 0,
    behaviorTimer: 0,
    dead: false,
  };
};

export const stepBoss = (world: World, dt: number): void => {
  const boss = world.boss;
  if (!boss || boss.dead) return;
  const player = world.player;
  boss.phase += dt;
  boss.behaviorTimer += dt;
  boss.fireCooldown -= dt;
  boss.hitFlash = Math.max(0, (boss.hitFlash || 0) - dt);
  const toPlayer = { x: player.pos.x - boss.pos.x, z: player.pos.z - boss.pos.z };
  const distance = Math.hypot(toPlayer.x, toPlayer.z) || 1;
  const tangent = { x: -toPlayer.z / distance, z: toPlayer.x / distance };
  let velocityX = (toPlayer.x / distance) * 0.4 + tangent.x * 0.8;
  let velocityZ = (toPlayer.z / distance) * 0.4 + tangent.z * 0.8;
  if (distance < 8) {
    velocityX = -toPlayer.x / distance;
    velocityZ = -toPlayer.z / distance;
  }
  boss.pos.x += velocityX * boss.speed * dt;
  boss.pos.z += velocityZ * boss.speed * dt;
  const edge = world.arenaRadius - boss.radius;
  const radius = Math.hypot(boss.pos.x, boss.pos.z);
  if (radius > edge) {
    boss.pos.x *= edge / radius;
    boss.pos.z *= edge / radius;
  }
  if (boss.fireCooldown > 0) return;
  boss.fireCooldown = boss.fireInterval;
  const aimed = { x: toPlayer.x / distance, z: toPlayer.z / distance };
  const bulletCount = (boss.bossType === 'big' ? 14 : 10) + (boss.extraBullets || 0);
  if (boss.bossType === 'big' && Math.floor(boss.behaviorTimer) % 2 === 0) {
    const lanes = Math.min(7, 3 + Math.floor((boss.extraBullets || 0) / 2));
    const middle = (lanes - 1) / 2;
    for (let lane = 0; lane < lanes; lane += 1) {
      const angle = (lane - middle) * 0.16;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      const direction = { x: aimed.x * cosine - aimed.z * sine, z: aimed.x * sine + aimed.z * cosine };
      spawnBullet('boss', { x: boss.pos.x, y: 0, z: boss.pos.z }, direction, world, {
        kind: 'enemy', speed: boss.bulletSpeed, life: boss.bulletLife, damage: boss.bulletDamage, radius: 0.34,
      });
    }
  } else {
    const offset = boss.phase * 0.6;
    for (let index = 0; index < bulletCount; index += 1) {
      const angle = (index / bulletCount) * Math.PI * 2 + offset;
      spawnBullet('boss', { x: boss.pos.x, y: 0, z: boss.pos.z }, { x: Math.cos(angle), z: Math.sin(angle) }, world, {
        kind: 'enemy', speed: boss.bulletSpeed, life: boss.bulletLife, damage: boss.bulletDamage, radius: 0.32,
      });
    }
  }
  world.events.push({ type: 'boss-fire', pos: { ...boss.pos } });
};

export const bossHit = (boss: BossState | null, damage: number, world: World, systems: BossSystems): void => {
  if (!boss || boss.dead) return;
  boss.hp -= damage;
  boss.hitFlash = 0.14;
  world.events.push({ type: 'boss-hit', pos: { ...boss.pos } });
  if (boss.hp > 0) return;
  boss.hp = 0;
  boss.dead = true;
  world.player.score += boss.score;
  world.player.energy = CONFIG.player.maxEnergy;
  world.pendingBursts.push({ pos: { ...boss.pos }, remaining: CONFIG.particles.perBigKill * 6, color: boss.color, perFrame: 130 });
  world.impulses.push(createImpulse(boss.pos.x, boss.pos.z, CONFIG.grid.impulseStrength * 4, {
    lifespan: 3,
    wavelength: 18,
    speed: 46,
    eventTier: 'death',
    coupleEntities: true,
  }));
  systems.shake = addTrauma(systems.shake, 1);
  world.trauma = 1;
  world.eventWobble = 1;
  world.events.push({ type: 'boss-dead', pos: { ...boss.pos }, score: boss.score });
  const guaranteedWeapons = CONFIG.items.bossWeaponDrops[boss.bossType] || 0;
  for (let index = 0; index < CONFIG.items.bossDropCount; index += 1) {
    const angle = world.rng.next() * Math.PI * 2;
    const radius = world.rng.range(0, 3);
    const kind = index < guaranteedWeapons ? 'weapon' : randomItemKind(world);
    world.items.push(makeItem(kind, {
      x: boss.pos.x + Math.cos(angle) * radius,
      y: 0,
      z: boss.pos.z + Math.sin(angle) * radius,
    }, world));
  }
  if (world.bossActiveWave) world.bossDefeatedWaves.add(world.bossActiveWave);
  systems.spawn.bossIndex = (systems.spawn.bossIndex || 0) + 1;
  const defeated = systems.spawn.bossIndex || 0;
  const spike = Math.max(0, defeated - 2);
  const minimum = spike > 0 ? CONFIG.boss.postThirdIntervalMin : CONFIG.boss.intervalMin;
  const nextInterval = Math.max(
    minimum,
    CONFIG.boss.interval - defeated * 2.5 - spike * CONFIG.boss.postThirdIntervalCut,
  );
  systems.spawn.bossTimer = nextInterval;
  systems.spawn.bossTimerMax = nextInterval;
  world.boss = null;
  world.bossActiveWave = 0;
};
