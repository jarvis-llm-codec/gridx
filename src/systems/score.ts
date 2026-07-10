// score.ts — Score + multiplier system. Pure, deterministic, reads only EnemyState.score.
// Never switches on enemy kind; reads `enemy.score` and adds player.multiplier.

import type { EnemyState, PlayerState, GameEvent } from '../core/types.js';
import { CONFIG } from '../core/config.js';

export interface ScoreSystemState {
  combo: number; // consecutive kills
  lastKillTime: number; // sim time of last kill
  multiplier: number;
  multiplierPulse: number; // 0..1 animation pulse (decays)
}

export const createScoreSystem = (): ScoreSystemState => ({
  combo: 0,
  lastKillTime: -Infinity,
  multiplier: 1,
  multiplierPulse: 0,
});

/**
 * Record a kill. Returns updated system state + events to emit.
 * Multiplier grows geometric-ish (multiplier *= step, floored) up to cap,
 * resets if combo window expired.
 */
export const recordKill = (
  sys: ScoreSystemState,
  enemy: EnemyState,
  player: PlayerState,
  time: number
): { sys: ScoreSystemState; events: GameEvent[] } => {
  const cfg = CONFIG.score;
  // Combo reset if too much time passed since last kill.
  const within = time - sys.lastKillTime <= cfg.comboWindow;
  const combo = within ? sys.combo + 1 : 1;
  const nextMult = Math.min(cfg.multiplierMax, Math.max(1, Math.floor(combo * cfg.multiplierStep)));
  const gained = enemy.score * sys.multiplier;
  player.score += gained;
  player.multiplier = nextMult;
  const events: GameEvent[] = [{ type: 'kill', pos: enemy.pos, kind: enemy.kind, score: gained }];
  if (nextMult > sys.multiplier) {
    events.push({ type: 'multiplier-up', value: nextMult });
  }
  return {
    sys: {
      combo,
      lastKillTime: time,
      multiplier: nextMult,
      multiplierPulse: 1,
    },
    events,
  };
};

/** Advance the multiplier animation pulse each step. */
export const stepScore = (sys: ScoreSystemState, dt: number): ScoreSystemState => ({
  ...sys,
  multiplierPulse: Math.max(0, sys.multiplierPulse - dt * 2.2),
});

/** Force-reset combo (e.g. on player hit). */
export const resetCombo = (sys: ScoreSystemState): ScoreSystemState => ({
  ...sys,
  combo: 0,
  multiplier: 1,
  lastKillTime: -Infinity,
});