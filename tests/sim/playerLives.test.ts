import { describe, expect, it } from 'vitest';
import { damagePlayer } from '../../src/sim/player.js';
import { createWorld } from '../../src/sim/world.js';

describe('player life system', () => {
  it('consumes one life on every third unshielded hit', () => {
    const { world } = createWorld(41);
    world.player.invuln = 0;
    damagePlayer(world.player, 15, world);
    world.player.invuln = 0;
    damagePlayer(world.player, 15, world);
    expect(world.player.lives).toBe(3);
    expect(world.player.hitCount).toBe(2);

    world.player.invuln = 0;
    damagePlayer(world.player, 15, world);
    expect(world.player.lives).toBe(2);
    expect(world.player.hitCount).toBe(0);
    expect(world.player.pos).toEqual({ x: 0, y: 0, z: 0 });
    expect(world.events.some((event) => event.type === 'revive')).toBe(true);
  });
});
