import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

// Balance changes are legitimate post-restoration evolution: re-baseline with
//   UPDATE_GOLDEN=1 npx vitest run tests/parity/simulationParity.test.ts
const UPDATE_GOLDEN = process.env.UPDATE_GOLDEN === '1';
const GOLDEN_PATH = resolve(process.cwd(), 'tests/golden/original-sim-trajectory.json');
const regenerated: Array<{ seed: number; steps: number; snapshots: unknown[] }> = [];
import type { InputState } from '../../src/input/inputState.js';
import { createWorld, stepWorld } from '../../src/sim/world.js';

const golden = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/golden/original-sim-trajectory.json'), 'utf8'),
) as {
  scenarios: Array<{ seed: number; steps: number; snapshots: unknown[] }>;
  snapshotInterval: number;
};

const inputForStep = (step: number, scenarioIndex: number): InputState => {
  const moveAngle = step * (0.011 + scenarioIndex * 0.0007) + scenarioIndex * 1.7;
  const aimAngle = step * (0.019 + scenarioIndex * 0.0009) + scenarioIndex * 0.4;
  return {
    moveX: Math.cos(moveAngle),
    moveZ: Math.sin(moveAngle),
    aimX: Math.cos(aimAngle),
    aimZ: Math.sin(aimAngle),
    firing: step % 11 !== 0,
    boost: step % 480 < 72,
    pause: false,
    mute: false,
    restart: false,
    skill: step > 0 && step % 900 === 0,
    // Never pressed in the golden scenario — keeps the baseline valid while
    // the ultimate feature exists only behind this input edge.
    ultimate: false,
  };
};

const countBy = <T extends Record<K, PropertyKey>, K extends keyof T>(
  items: T[],
  field: K,
  knownValues: PropertyKey[],
): Record<PropertyKey, number> => {
  const counts: Record<PropertyKey, number> = Object.fromEntries(knownValues.map((value) => [value, 0]));
  for (const item of items) counts[item[field]] = (counts[item[field]] || 0) + 1;
  return counts;
};

const snapshot = (
  step: number,
  world: ReturnType<typeof createWorld>['world'],
  systems: ReturnType<typeof createWorld>['systems'],
  eventCounts: Record<string, number>,
) => {
  const player = world.player;
  const boss = world.boss && !world.boss.dead ? world.boss : null;
  return {
    step,
    time: world.time,
    player: {
      pos: { ...player.pos },
      vel: { ...player.vel },
      aim: { ...player.aim },
      hp: player.hp,
      alive: player.alive,
      lives: player.lives,
      energy: player.energy,
      boost: player.boost,
      score: player.score,
      multiplier: player.multiplier,
      invuln: player.invuln,
      shield: player.shield,
      hitCount: player.hitCount,
      primaryWeapon: player.primaryWeapon,
      secondaryWeapon: player.secondaryWeapon,
      weaponLevels: { ...player.weaponLevels },
    },
    counts: {
      bullets: world.bullets.length,
      enemies: world.enemies.length,
      enemiesByKind: countBy(
        world.enemies.filter((enemy) => !enemy.dead),
        'kind',
        ['grunt', 'wanderer', 'singularity', 'dodger', 'boss'],
      ),
      items: world.items.length,
      itemsByKind: countBy(
        world.items.filter((item) => !item.dead),
        'kind',
        ['life', 'heal', 'weapon', 'boost', 'shield', 'multiplier'],
      ),
      particles: world.particles.length,
      impulses: world.impulses.length,
      pendingBursts: world.pendingBursts.length,
      weaponEffects: world.weaponEffects.length,
    },
    boss: boss
      ? {
          bossType: boss.bossType,
          bossNumber: boss.bossNumber,
          rageLevel: boss.rageLevel,
          hp: boss.hp,
          maxHp: boss.maxHp,
          pos: { ...boss.pos },
          fireCooldown: boss.fireCooldown,
        }
      : null,
    spawn: {
      wave: systems.spawn.wave,
      timer: systems.spawn.timer,
      budget: systems.spawn.budget,
      killsThisWave: systems.spawn.killsThisWave,
      bossTimer: systems.spawn.bossTimer,
      bossTimerMax: systems.spawn.bossTimerMax,
      bossIndex: systems.spawn.bossIndex,
    },
    bossActiveWave: world.bossActiveWave,
    bossDefeatedWaves: [...world.bossDefeatedWaves].sort((a, b) => a - b),
    gameOver: world.gameOver,
    rngState: world.rng.state(),
    eventCounts: { ...eventCounts },
  };
};

const compare = (actual: unknown, expected: unknown, path = 'root'): void => {
  if (typeof actual === 'number' && typeof expected === 'number') {
    if (Math.abs(actual - expected) > 1e-9) {
      throw new Error(`${path}: ${actual} != ${expected} (delta ${Math.abs(actual - expected)})`);
    }
    return;
  }
  if (Array.isArray(actual) && Array.isArray(expected)) {
    expect(actual.length, `${path}.length`).toBe(expected.length);
    actual.forEach((value, index) => compare(value, expected[index], `${path}[${index}]`));
    return;
  }
  if (actual && expected && typeof actual === 'object' && typeof expected === 'object') {
    const actualRecord = actual as Record<string, unknown>;
    const expectedRecord = expected as Record<string, unknown>;
    expect(Object.keys(actualRecord).sort(), `${path}.keys`).toEqual(Object.keys(expectedRecord).sort());
    for (const key of Object.keys(expectedRecord)) compare(actualRecord[key], expectedRecord[key], `${path}.${key}`);
    return;
  }
  expect(actual, path).toBe(expected);
};

describe('canonical simulation trajectory', () => {
  it.each(golden.scenarios.map((scenario, index) => ({ ...scenario, index })))(
    'matches seed $seed for $steps steps',
    ({ seed, steps, snapshots: expectedSnapshots, index }) => {
      const { world, systems } = createWorld(seed);
      const eventCounts: Record<string, number> = {};
      const actualSnapshots = [snapshot(0, world, systems, eventCounts)];
      for (let step = 1; step <= steps; step += 1) {
        const events = stepWorld(world, systems, inputForStep(step, index), 1 / 60);
        for (const event of events) eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
        if (step % golden.snapshotInterval === 0 || step === steps) {
          actualSnapshots.push(snapshot(step, world, systems, eventCounts));
        }
      }
      if (UPDATE_GOLDEN) {
        regenerated.push({ seed, steps, snapshots: actualSnapshots });
        return;
      }
      compare(actualSnapshots, expectedSnapshots, `seed(${seed})`);
    },
  );

  afterAll(() => {
    if (!UPDATE_GOLDEN || regenerated.length === 0) return;
    writeFileSync(
      GOLDEN_PATH,
      `${JSON.stringify({ scenarios: regenerated, snapshotInterval: golden.snapshotInterval }, null, 1)}\n`,
      'utf8',
    );
  });
});
