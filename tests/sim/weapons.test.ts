import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world.js';
import { equipWeapon } from '../../src/sim/items.js';
import { firePlayerWeapons } from '../../src/sim/weapons.js';

describe('weapon system', () => {
  it('always fires the blaster and adds the equipped secondary weapon', () => {
    const { world } = createWorld(11);
    firePlayerWeapons(world.player, world);
    expect(world.bullets.map((bullet) => bullet.kind)).toEqual(['standard']);

    world.player.weaponCooldowns.primary = 0;
    world.player.weaponCooldowns.secondary = 0;
    equipWeapon(world.player, 'missile');
    firePlayerWeapons(world.player, world);
    expect(world.player.primaryWeapon).toBe('blaster');
    expect(world.player.secondaryWeapon).toBe('missile');
    expect(world.bullets.map((bullet) => bullet.kind)).toEqual(['standard', 'standard', 'missile']);
  });

  it('fires two missiles at level three without replacing the blaster', () => {
    const { world } = createWorld(12);
    equipWeapon(world.player, 'missile');
    equipWeapon(world.player, 'missile');
    equipWeapon(world.player, 'missile');
    firePlayerWeapons(world.player, world);
    expect(world.player.weaponLevels.missile).toBe(3);
    expect(world.bullets.filter((bullet) => bullet.kind === 'standard')).toHaveLength(1);
    expect(world.bullets.filter((bullet) => bullet.kind === 'missile')).toHaveLength(2);
  });
});
