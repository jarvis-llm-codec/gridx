import { CONFIG } from '../core/config.js';
import { enemyColor } from '../core/palette.js';
import type { BossState, BulletState, EnemyState, GameEvent, World } from '../core/types.js';
import type { InputState } from '../input/inputState.js';
import { createRng } from '../math/rng.js';
import { advanceImpulses, createImpulse } from '../math/wave.js';
import { spatialHashPairs } from '../physics/collision.js';
import { addTrauma, createCameraShake, stepCameraShake, type CameraShakeState } from '../systems/cameraShake.js';
import { createScoreSystem, recordKill, resetCombo, stepScore, type ScoreSystemState } from '../systems/score.js';
import { advanceWave, createSpawnSystem, stepSpawn, type SpawnSystemState } from '../systems/spawn.js';
import { bossHit, makeBoss, stepBoss } from './boss.js';
import { bulletAlive, stepBullet } from './bullet.js';
import { damageEnemy } from './enemy.js';
import { stepEnemyBehavior } from './enemyBehaviors.js';
import { dropChanceForWave, makeItem, randomItemKind, stepItems } from './items.js';
import { spawnBurst, stepParticle } from './particles.js';
import { createPlayer, damagePlayer, stepPlayer, tryFire } from './player.js';
import { addWeaponArc, firePlayerWeapons, WEAPON_COLORS } from './weapons.js';

export interface WorldSystems {
  score: ScoreSystemState;
  spawn: SpawnSystemState;
  shake: CameraShakeState;
}

export const createWorld = (seed: number): { world: World; systems: WorldSystems } => {
  const world: World = {
    seed,
    rng: createRng(seed),
    time: 0,
    arenaRadius: CONFIG.worldBounds,
    player: createPlayer(),
    bullets: [],
    enemies: [],
    particles: [],
    impulses: [],
    events: [],
    items: [],
    boss: null,
    bossActiveWave: 0,
    bossDefeatedWaves: new Set(),
    spawnState: { timer: 0, wave: 1, budget: CONFIG.spawn.waveBudgetGrowth, toSpawn: 0 },
    pendingBursts: [],
    pendingLightning: [],
    weaponEffects: [],
    trauma: 0,
    eventWobble: 0,
    gameOver: false,
    nextId: 1,
  };
  return {
    world,
    systems: {
      score: createScoreSystem(),
      spawn: createSpawnSystem(),
      shake: createCameraShake(seed ^ 11256099),
    },
  };
};

export const killEnemy = (world: World, systems: WorldSystems, enemy: EnemyState): void => {
  const scoreResult = recordKill(systems.score, enemy, world.player, world.time);
  systems.score = scoreResult.sys;
  world.events.push(...scoreResult.events);
  world.player.energy = Math.min(CONFIG.player.maxEnergy, world.player.energy + CONFIG.player.energyPerKill);
  const singularity = enemy.kind === 'singularity';
  const shakeGain = { grunt: 0, wanderer: 0.05, dodger: 0.08, singularity: 0.62 }[enemy.kind] || 0;
  spawnBurst(enemy.pos, singularity ? CONFIG.particles.perBigKill : CONFIG.particles.perKill, enemyColor(enemy.kind), world);
  if (singularity) {
    world.impulses.push(createImpulse(enemy.pos.x, enemy.pos.z, CONFIG.grid.impulseStrength * 2, {
      lifespan: 1.45,
      wavelength: 6.5,
      speed: 18,
      eventTier: 'localBlast',
      coupleEntities: true,
    }));
  }
  if (shakeGain > 0) systems.shake = addTrauma(systems.shake, shakeGain);
  world.trauma = systems.shake.trauma;
  systems.spawn.killsThisWave += 1;
  systems.spawn = advanceWave(systems.spawn, systems.spawn.killsThisWave);
  if (world.rng.chance(dropChanceForWave(systems.spawn.wave))) {
    world.items.push(makeItem(randomItemKind(world, systems.spawn.wave), { ...enemy.pos }, world));
  }
  if (singularity) {
    for (const other of world.enemies) {
      if (other === enemy || other.dead) continue;
      if (Math.hypot(other.pos.x - enemy.pos.x, other.pos.z - enemy.pos.z) < CONFIG.enemies.singularity.pullRadius * 1.2) {
        if (damageEnemy(other, 3)) killEnemy(world, systems, other);
      }
    }
  }
};

export const fireSkill = (world: World, systems: WorldSystems): void => {
  const player = world.player;
  const radius = CONFIG.player.skillRadius;
  world.events.push({ type: 'skill', pos: { ...player.pos }, radius, color: 0x19ffff });
  world.impulses.push(createImpulse(player.pos.x, player.pos.z, CONFIG.grid.impulseStrength * 4));
  world.pendingBursts.push({
    pos: { ...player.pos },
    remaining: CONFIG.particles.perBigKill * 4,
    color: 0x19ffff,
    perFrame: 130,
  });
  for (const enemy of world.enemies) {
    if (enemy.dead) continue;
    if (Math.hypot(enemy.pos.x - player.pos.x, enemy.pos.z - player.pos.z) <= radius + enemy.radius) {
      if (damageEnemy(enemy, CONFIG.player.skillDamage)) killEnemy(world, systems, enemy);
    }
  }
  for (const bullet of world.bullets) {
    if (bullet.owner !== 'player' && Math.hypot(bullet.pos.x - player.pos.x, bullet.pos.z - player.pos.z) <= radius) {
      bullet.spent = true;
    }
  }
  if (world.boss && !world.boss.dead && Math.hypot(world.boss.pos.x - player.pos.x, world.boss.pos.z - player.pos.z) <= radius + world.boss.radius) {
    bossHit(world.boss, CONFIG.player.skillDamage, world, systems);
  }
  systems.shake = addTrauma(systems.shake, 0.8);
  world.trauma = systems.shake.trauma;
};

const resolveLightning = (world: World, systems: WorldSystems): void => {
  for (const shot of world.pendingLightning) {
    const hit = new Set<number>();
    const maxChains = 2 + shot.level;
    let from = { ...shot.pos };
    for (let chain = 0; chain < maxChains; chain += 1) {
      const targets: Array<EnemyState | BossState> = world.enemies.filter((target) => !target.dead && !hit.has(target.id));
      if (world.boss && !world.boss.dead && !hit.has(world.boss.id)) targets.push(world.boss);
      let target: EnemyState | BossState | null = null;
      let best = (chain === 0 ? shot.range : 8 + shot.level) ** 2;
      for (const candidate of targets) {
        const deltaX = candidate.pos.x - from.x;
        const deltaZ = candidate.pos.z - from.z;
        const distanceSquared = deltaX * deltaX + deltaZ * deltaZ;
        if (chain === 0 && (deltaX * shot.dir.x + deltaZ * shot.dir.z) / Math.max(0.001, Math.sqrt(distanceSquared)) < 0.1) continue;
        if (distanceSquared < best) {
          best = distanceSquared;
          target = candidate;
        }
      }
      if (!target) {
        if (chain === 0) {
          addWeaponArc(world, 'lightning', from, { x: from.x + shot.dir.x * 8, z: from.z + shot.dir.z * 8 }, chain);
        }
        break;
      }
      hit.add(target.id);
      addWeaponArc(world, 'lightning', from, target.pos, chain + target.id);
      const damage = shot.damage * Math.max(0.55, 1 - chain * 0.12);
      if (target === world.boss) bossHit(target as BossState, damage * 0.8, world, systems);
      else if (damageEnemy(target as EnemyState, damage)) killEnemy(world, systems, target as EnemyState);
      from = { ...target.pos };
    }
  }
  world.pendingLightning.length = 0;
};

const detonateMissile = (world: World, systems: WorldSystems, missile: BulletState): void => {
  if (missile.spent) return;
  missile.spent = true;
  const radius = missile.blastRadius || 2.6;
  for (const enemy of world.enemies) {
    if (enemy.dead) continue;
    const distance = Math.hypot(enemy.pos.x - missile.pos.x, enemy.pos.z - missile.pos.z);
    if (distance <= radius + enemy.radius) {
      const damage = missile.damage * Math.max(0.35, 1 - distance / (radius + enemy.radius));
      if (damageEnemy(enemy, damage)) killEnemy(world, systems, enemy);
    }
  }
  const boss = world.boss;
  if (boss && !boss.dead) {
    const distance = Math.hypot(boss.pos.x - missile.pos.x, boss.pos.z - missile.pos.z);
    if (distance <= radius + boss.radius) {
      bossHit(boss, missile.damage * Math.max(0.3, 1 - distance / (radius + boss.radius)), world, systems);
    }
  }
  world.pendingBursts.push({ pos: { ...missile.pos }, remaining: 34, color: WEAPON_COLORS.missile, perFrame: 34 });
  world.events.push({ type: 'missile-explode', pos: { ...missile.pos }, radius });
  for (let ray = 0; ray < 8; ray += 1) {
    const angle = (ray / 8) * Math.PI * 2;
    addWeaponArc(world, 'missile', missile.pos, {
      x: missile.pos.x + Math.cos(angle) * radius,
      z: missile.pos.z + Math.sin(angle) * radius,
    }, ray);
  }
};

export const stepWorld = (world: World, systems: WorldSystems, input: InputState, dt: number): GameEvent[] => {
  world.events = [];
  if (world.gameOver) {
    advanceAndPrune(world, dt);
    world.eventWobble = Math.max(0, (world.eventWobble || 0) - dt * CONFIG.camera.eventWobbleDecay);
    return world.events;
  }
  world.time += dt;
  stepPlayer(world.player, input, dt, world);
  if (tryFire(world.player, input.firing)) firePlayerWeapons(world.player, world);
  if (input.skill && world.player.alive && world.player.energy >= CONFIG.player.skillCost) {
    world.player.energy -= CONFIG.player.skillCost;
    fireSkill(world, systems);
    world.events.push({ type: 'skill-fire', pos: { ...world.player.pos } });
  }

  const spawnResult = stepSpawn(world, systems.spawn, dt);
  systems.spawn = spawnResult.sys;
  world.events.push(...spawnResult.events);
  if (!world.boss) {
    systems.spawn.bossTimer = Math.max(0, systems.spawn.bossTimer - dt);
    if (systems.spawn.bossTimer <= 0) {
      const bossNumber = (systems.spawn.bossIndex || 0) + 1;
      const bossType = systems.spawn.bossIndex % 3 === 2 ? 'big' : 'mini';
      world.boss = makeBoss(bossType, world, bossNumber);
      world.bossActiveWave = systems.spawn.wave;
      systems.spawn.bossTimer = CONFIG.boss.interval;
      world.events.push({
        type: 'boss-spawn',
        pos: { ...world.boss.pos },
        bossType,
        bossNumber,
        rageLevel: world.boss.rageLevel,
      });
    }
  }
  if (world.boss && !world.boss.dead) stepBoss(world, dt);

  const playerBullets = world.bullets.filter((bullet) => bullet.owner === 'player' && !bullet.spent);
  for (const enemy of world.enemies) {
    if (enemy.dead) continue;
    enemy.hitFlash = Math.max(0, (enemy.hitFlash || 0) - dt);
    stepEnemyBehavior({ enemy, player: world.player, bullets: playerBullets, world, dt });
    const edge = world.arenaRadius - enemy.radius;
    const radius = Math.hypot(enemy.pos.x, enemy.pos.z);
    if (radius > edge) {
      const scale = edge / radius;
      enemy.pos.x *= scale;
      enemy.pos.z *= scale;
    }
    if (enemy.kind === 'singularity' && enemy.behaviorTimer >= CONFIG.enemies.singularity.explodeTime) {
      enemy.dead = true;
      if (Math.hypot(world.player.pos.x - enemy.pos.x, world.player.pos.z - enemy.pos.z) < CONFIG.enemies.singularity.pullRadius) {
        damagePlayer(world.player, 25, world);
      }
      killEnemy(world, systems, enemy);
    }
  }

  for (const bullet of world.bullets) stepBullet(bullet, dt, world);
  resolveLightning(world, systems);
  for (const missile of world.bullets) {
    if (missile.kind === 'missile' && missile.owner === 'player' && !missile.spent && missile.life <= 0) {
      detonateMissile(world, systems, missile);
    }
  }

  const liveBullets = world.bullets.filter((bullet) => bullet.owner === 'player' && !bullet.spent && bullet.life > 0);
  const pairs = spatialHashPairs(liveBullets, world.enemies, 4, (a, b) => a.tag === 'bullet' && b.tag === 'enemy');
  for (const { a, b } of pairs) {
    const bullet = (a.tag === 'bullet' ? a : b) as BulletState;
    const enemy = (a.tag === 'enemy' ? a : b) as EnemyState;
    if (bullet.spent || enemy.dead || bullet.hitIds.includes(enemy.id)) continue;
    bullet.hitIds.push(enemy.id);
    if (bullet.kind === 'missile') detonateMissile(world, systems, bullet);
    else {
      if (!bullet.pierce) bullet.spent = true;
      if (damageEnemy(enemy, bullet.damage)) killEnemy(world, systems, enemy);
    }
  }

  if (world.boss && !world.boss.dead) {
    const boss = world.boss;
    for (const bullet of world.bullets) {
      if (bullet.owner !== 'player' || bullet.spent || bullet.life <= 0 || bullet.hitIds.includes(boss.id)) continue;
      if (boss.dead) break;
      if (Math.hypot(bullet.pos.x - boss.pos.x, bullet.pos.z - boss.pos.z) <= bullet.radius + boss.radius) {
        bullet.hitIds.push(boss.id);
        if (bullet.kind === 'missile') detonateMissile(world, systems, bullet);
        else {
          if (!bullet.pierce) bullet.spent = true;
          bossHit(boss, bullet.damage, world, systems);
        }
      }
    }
  }

  if (world.player.alive) {
    for (const bullet of world.bullets) {
      if (bullet.owner === 'player' || bullet.spent || bullet.life <= 0) continue;
      if (Math.hypot(bullet.pos.x - world.player.pos.x, bullet.pos.z - world.player.pos.z) <= bullet.radius + world.player.radius) {
        bullet.spent = true;
        damagePlayer(world.player, bullet.damage, world);
      }
    }
  }

  if (world.player.alive) {
    const playerPairs = spatialHashPairs([world.player], world.enemies, 4, (a, b) =>
      (a.tag === 'enemy' ? a : b).tag === 'enemy');
    for (const { a, b } of playerPairs) {
      const enemy = (a.tag === 'enemy' ? a : b) as EnemyState;
      if (enemy.dead) continue;
      damagePlayer(world.player, enemy.kind === 'singularity' ? 30 : 15, world);
      if (enemy.kind !== 'singularity') {
        enemy.dead = true;
        killEnemy(world, systems, enemy);
      }
    }
    if (world.boss && !world.boss.dead &&
      Math.hypot(world.boss.pos.x - world.player.pos.x, world.boss.pos.z - world.player.pos.z) <= world.boss.radius + world.player.radius) {
      damagePlayer(world.player, 22, world);
    }
  }

  stepItems(world, dt);
  if (world.events.some((event) => event.type === 'hit-player' && world.player.alive)) {
    systems.score = resetCombo(systems.score);
    world.player.multiplier = 1;
  }
  advanceAndPrune(world, dt);
  systems.score = stepScore(systems.score, dt);
  systems.shake = stepCameraShake(systems.shake, dt);
  world.trauma = systems.shake.trauma;
  world.eventWobble = Math.max(0, (world.eventWobble || 0) - dt * CONFIG.camera.eventWobbleDecay);
  return world.events;
};

const advanceAndPrune = (world: World, dt: number): void => {
  for (const particle of world.particles) stepParticle(particle, dt);
  if (world.pendingBursts.length) {
    const kept = [];
    let budget = 150;
    for (const burst of world.pendingBursts) {
      const count = Math.min(burst.perFrame, burst.remaining, budget);
      if (count > 0) {
        spawnBurst(burst.pos, count, burst.color, world);
        burst.remaining -= count;
        budget -= count;
      }
      if (burst.remaining > 0) kept.push(burst);
    }
    world.pendingBursts = kept;
  }
  for (const effect of world.weaponEffects) effect.life -= dt;
  world.weaponEffects = world.weaponEffects.filter((effect) => effect.life > 0);
  world.particles = world.particles.filter((particle) => particle.life > 0);
  world.bullets = world.bullets.filter((bullet) => bulletAlive(bullet, world.arenaRadius));
  world.enemies = world.enemies.filter((enemy) => !enemy.dead);
  world.impulses = advanceImpulses(world.impulses, dt);
};
