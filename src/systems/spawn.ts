// spawn.ts — Spawn pacing system. Picks enemy kinds via weighted RNG (from config),
// spawns on a ring near the arena edge. Reads only config weights + radius/score,
// so adding an enemy kind requires only a config entry (no spawn edits).

import type { EnemyKind, World } from '../core/types.js';
import { CONFIG } from '../core/config.js';
import type { RNG } from '../math/rng.js';
import { createEnemy } from '../sim/enemy.js';

export interface SpawnSystemState {
  timer: number;
  wave: number;
  budget: number; // kills needed to advance wave
  killsThisWave: number;
}

export const createSpawnSystem = (): SpawnSystemState => ({
  timer: 0,
  wave: 1,
  budget: CONFIG.spawn.waveBudgetGrowth,
  killsThisWave: 0,
});

const weightedKind = (rng: RNG): EnemyKind => {
  const kinds = Object.keys(CONFIG.enemies) as EnemyKind[];
  let total = 0;
  for (const k of kinds) total += CONFIG.enemies[k].spawnWeight;
  let r = rng.next() * total;
  for (const k of kinds) {
    r -= CONFIG.enemies[k].spawnWeight;
    if (r <= 0) return k;
  }
  return kinds[0];
};

const intervalForWave = (wave: number): number => {
  const cfg = CONFIG.spawn;
  const iv = cfg.baseInterval * Math.pow(cfg.intervalDecay, wave - 1);
  return Math.max(cfg.minInterval, iv);
};

/**
 * Step the spawn system. Spawns enemies on a ring using the world RNG (deterministic).
 * Returns events to emit (spawn telegraphs). Mutates world.enemies.
 */
export const stepSpawn = (
  world: World,
  sys: SpawnSystemState,
  dt: number
): { sys: SpawnSystemState; events: World['events'] } => {
  if (world.gameOver) return { sys, events: [] };
  const cfg = CONFIG.spawn;
  let timer = sys.timer + dt;
  const events: World['events'] = [];
  const edge = world.arenaRadius - cfg.spawnRingPad;
  while (timer >= intervalForWave(sys.wave)) {
    timer -= intervalForWave(sys.wave);
    if (world.enemies.length < cfg.maxAlive) {
      const kind = weightedKind(world.rng);
      const ang = world.rng.next() * Math.PI * 2;
      const r = edge * (0.7 + world.rng.next() * 0.3);
      const pos = { x: Math.cos(ang) * r, y: 0, z: Math.sin(ang) * r };
      const enemy = createEnemy(kind, pos, world);
      world.enemies.push(enemy);
      events.push({ type: 'spawn', pos, kind });
    }
  }
  return { sys: { ...sys, timer }, events };
};

/** Advance wave when enough kills accumulated. */
export const advanceWave = (sys: SpawnSystemState, kills: number): SpawnSystemState => {
  const killsThisWave = kills;
  if (killsThisWave >= sys.budget) {
    return {
      wave: sys.wave + 1,
      budget: sys.wave * CONFIG.spawn.waveBudgetGrowth + CONFIG.spawn.waveBudgetGrowth,
      killsThisWave: 0,
      timer: sys.timer,
    };
  }
  return { ...sys, killsThisWave };
};