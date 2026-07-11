import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../src/core/config.js';
import { bossHit, makeBoss, stepBoss } from '../../src/sim/boss.js';
import { createWorld } from '../../src/sim/world.js';

describe('boss system', () => {
  it('applies post-third rage scaling', () => {
    const { world } = createWorld(31);
    const boss = makeBoss('mini', world, 4);
    expect(boss.rageLevel).toBe(1);
    expect(boss.hp).toBe(Math.ceil(CONFIG.boss.mini.hp * 1.45));
    expect(boss.extraBullets).toBe(2);
  });

  it('fires and drops the canonical reward set on death', () => {
    const { world, systems } = createWorld(32);
    world.boss = makeBoss('mini', world, 1);
    world.bossActiveWave = 3;
    world.boss.fireCooldown = 0;
    stepBoss(world, CONFIG.fixedStep);
    expect(world.bullets).toHaveLength(10);

    bossHit(world.boss, 9999, world, systems);
    expect(world.boss).toBeNull();
    expect(world.items).toHaveLength(CONFIG.items.bossDropCount);
    // Bosses never drop weapons — regular kills supply those (weight 8).
    expect(world.items.every((item) => item.kind !== 'weapon')).toBe(true);
    expect(systems.spawn.bossIndex).toBe(1);
    expect(systems.spawn.bossTimer).toBe(49.5);
  });
});
