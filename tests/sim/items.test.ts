import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world.js';
import { applyItem, makeItem, nextWeaponDrop } from '../../src/sim/items.js';

describe('item system', () => {
  it('reserves undiscovered weapon drops in canonical order', () => {
    const { world } = createWorld(21);
    expect(nextWeaponDrop(world)).toBe('missile');
    const missile = makeItem('weapon', { x: 1, y: 0, z: 1 }, world);
    world.items.push(missile);
    expect(missile.weaponType).toBe('missile');
    expect(nextWeaponDrop(world)).toBe('lightning');
  });

  it('equips a secondary weapon while preserving the baseline blaster', () => {
    const { world } = createWorld(22);
    const item = makeItem('weapon', { x: 0, y: 0, z: 0 }, world);
    applyItem(world.player, item, world);
    expect(world.player.primaryWeapon).toBe('blaster');
    expect(world.player.weaponLevels.blaster).toBe(1);
    expect(world.player.secondaryWeapon).toBe('missile');
  });
});
