import { describe, it, expect } from 'vitest';
import { createScoreSystem, recordKill, stepScore, resetCombo } from '../../src/systems/score.js';
import { CONFIG } from '../../src/core/config.js';
import { createEnemy } from '../../src/sim/enemy.js';
import { createWorld } from '../../src/sim/world.js';

const mkPlayer = () => {
  const { world } = createWorld(1);
  return { world, player: world.player };
};

const mkEnemy = (world: ReturnType<typeof createWorld>['world'], kind: Parameters<typeof createEnemy>[0]) =>
  createEnemy(kind, { x: 10, y: 0, z: 10 }, world);

describe('score system', () => {
  it('multiplier grows with combo and resets after window', () => {
    const { world, player } = mkPlayer();
    let sys = createScoreSystem();
    const e = mkEnemy(world, 'grunt');
    const r1 = recordKill(sys, e, player, 0);
    sys = r1.sys;
    expect(sys.combo).toBe(1);
    expect(sys.multiplier).toBeGreaterThanOrEqual(1);
    expect(player.score).toBe(e.score); // first kill at ×1
    // Second kill within window
    const e2 = mkEnemy(world, 'grunt');
    const r2 = recordKill(sys, e2, player, 1.0);
    sys = r2.sys;
    expect(sys.combo).toBe(2);
    // Kills after window reset combo to 1
    const e3 = mkEnemy(world, 'grunt');
    const r3 = recordKill(sys, e3, player, 1.0 + CONFIG.score.comboWindow + 0.5);
    sys = r3.sys;
    expect(sys.combo).toBe(1);
    expect(sys.multiplier).toBe(1);
  });
  it('multiplier is capped', () => {
    const { world, player } = mkPlayer();
    let sys = createScoreSystem();
    for (let i = 0; i < 200; i++) {
      const e = mkEnemy(world, 'grunt');
      const r = recordKill(sys, e, player, i);
      sys = r.sys;
    }
    expect(sys.multiplier).toBeLessThanOrEqual(CONFIG.score.multiplierMax);
  });
  it('score = enemy.score * current multiplier', () => {
    const { world, player } = mkPlayer();
    let sys = createScoreSystem();
    // ramp combo to multiplier 2
    const e1 = mkEnemy(world, 'wanderer'); // score 250
    const r1 = recordKill(sys, e1, player, 0);
    sys = r1.sys;
    const before = player.score;
    const mult = sys.multiplier;
    const e2 = mkEnemy(world, 'wanderer');
    recordKill(sys, e2, player, 0.5);
    expect(player.score - before).toBe(250 * mult);
  });
  it('stepScore decays multiplierPulse to 0', () => {
    let sys = createScoreSystem();
    const { world, player } = mkPlayer();
    const e = mkEnemy(world, 'grunt');
    sys = recordKill(sys, e, player, 0).sys;
    expect(sys.multiplierPulse).toBe(1);
    for (let i = 0; i < 50; i++) sys = stepScore(sys, 0.1);
    expect(sys.multiplierPulse).toBeCloseTo(0, 5);
  });
  it('resetCombo zeroes combo and multiplier', () => {
    let sys = createScoreSystem();
    const { world, player } = mkPlayer();
    const e = mkEnemy(world, 'grunt');
    sys = recordKill(sys, e, player, 0).sys;
    sys = resetCombo(sys);
    expect(sys.combo).toBe(0);
    expect(sys.multiplier).toBe(1);
  });
  it('records kill events', () => {
    const { world, player } = mkPlayer();
    let sys = createScoreSystem();
    const e = mkEnemy(world, 'grunt');
    const r = recordKill(sys, e, player, 0);
    expect(r.events.some((ev) => ev.type === 'kill')).toBe(true);
  });
});