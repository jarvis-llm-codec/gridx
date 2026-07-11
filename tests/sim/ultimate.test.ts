import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../src/core/config.js';
import { emptyInput, mergeInput } from '../../src/input/inputState.js';
import { createEnemy } from '../../src/sim/enemy.js';
import { equipWeapon } from '../../src/sim/items.js';
import { createWorld, stepWorld } from '../../src/sim/world.js';

const DT = CONFIG.fixedStep;
const ultInput = () => ({ ...emptyInput(), ultimate: true });

describe('secondary-weapon ultimate', () => {
  it('does nothing without a secondary weapon', () => {
    const { world, systems } = createWorld(21);
    const events = stepWorld(world, systems, ultInput(), DT);
    expect(events.some((event) => event.type === 'ultimate-fire')).toBe(false);
    expect(world.player.ultimateCooldown).toBe(0);
    expect(world.ultimateVolley).toBeNull();
    expect(world.ultimateBeam).toBeNull();
  });

  it('fires once and gates on cooldown', () => {
    const { world, systems } = createWorld(22);
    equipWeapon(world.player, 'missile');
    const first = stepWorld(world, systems, ultInput(), DT);
    expect(first.filter((event) => event.type === 'ultimate-fire')).toHaveLength(1);
    expect(world.player.ultimateCooldown).toBe(CONFIG.ultimate.cooldown);
    // Playtest feedback: ultimates must not wobble the floor grid.
    expect(world.impulses).toHaveLength(0);
    const second = stepWorld(world, systems, ultInput(), DT);
    expect(second.some((event) => event.type === 'ultimate-fire')).toBe(false);
    expect(world.player.ultimateCooldown).toBeLessThan(CONFIG.ultimate.cooldown);
  });

  it('fires again once the cooldown has elapsed', () => {
    const { world, systems } = createWorld(26);
    equipWeapon(world.player, 'lightning');
    // stepPlayer decrements the cooldown before the gate runs, so DT*2.5
    // blocks exactly two steps and unlocks on the third.
    world.player.ultimateCooldown = DT * 2.5;
    expect(stepWorld(world, systems, ultInput(), DT).some((event) => event.type === 'ultimate-fire')).toBe(false);
    expect(stepWorld(world, systems, ultInput(), DT).some((event) => event.type === 'ultimate-fire')).toBe(false);
    expect(stepWorld(world, systems, ultInput(), DT).some((event) => event.type === 'ultimate-fire')).toBe(true);
  });

  it('missile storm launches the full volley staggered over time', () => {
    const { world, systems } = createWorld(23);
    equipWeapon(world.player, 'missile');
    stepWorld(world, systems, ultInput(), DT);
    const seen = new Set(world.bullets.filter((bullet) => bullet.kind === 'missile').map((bullet) => bullet.id));
    expect(seen.size).toBe(CONFIG.ultimate.missile.perWave);
    for (let step = 0; step < 40; step += 1) {
      stepWorld(world, systems, emptyInput(), DT);
      for (const bullet of world.bullets) if (bullet.kind === 'missile') seen.add(bullet.id);
    }
    expect(seen.size).toBe(CONFIG.ultimate.missile.count);
    expect(world.ultimateVolley).toBeNull();
  });

  it('tempest chains across the whole arena ignoring the aim cone', () => {
    const { world, systems } = createWorld(24);
    equipWeapon(world.player, 'lightning');
    const ring = [
      { x: 12, z: 0 }, { x: -12, z: 0 }, { x: 0, z: 12 }, { x: 0, z: -12 },
      { x: 9, z: 9 }, { x: -9, z: -9 }, { x: -9, z: 9 }, { x: 9, z: -9 },
    ];
    for (const spot of ring) world.enemies.push(createEnemy('grunt', { x: spot.x, y: 0, z: spot.z }, world));
    const events = stepWorld(world, systems, ultInput(), DT);
    expect(events.some((event) => event.type === 'ultimate-fire')).toBe(true);
    // Grunts die in one tempest hit; enemies behind the aim must die too.
    expect(events.filter((event) => event.type === 'kill')).toHaveLength(ring.length);
    expect(world.pendingLightning).toHaveLength(0);
    expect(world.weaponEffects.some((effect) => effect.kind === 'lightning')).toBe(true);
    // The crackle spark orbits the ship over time instead of one flash.
    expect(world.ultimateTempest).not.toBeNull();
    const lightning = CONFIG.ultimate.lightning;
    const orbitSteps = Math.ceil(
      (lightning.orbitTurns * lightning.ticksPerTurn * lightning.orbitInterval + 0.1) / DT,
    );
    for (let step = 0; step < orbitSteps; step += 1) stepWorld(world, systems, emptyInput(), DT);
    expect(world.ultimateTempest).toBeNull();
  });

  it('overdrive sustains a piercing laser barrage for its duration', () => {
    const { world, systems } = createWorld(25);
    equipWeapon(world.player, 'laser');
    stepWorld(world, systems, ultInput(), DT);
    expect(world.ultimateBeam).not.toBeNull();
    const seen = new Set<number>();
    for (const bullet of world.bullets) {
      if (bullet.kind === 'laser') {
        expect(bullet.pierce).toBe(true);
        seen.add(bullet.id);
      }
    }
    const steps = Math.ceil((CONFIG.ultimate.laser.duration + 0.2) / DT);
    for (let step = 0; step < steps; step += 1) {
      stepWorld(world, systems, emptyInput(), DT);
      for (const bullet of world.bullets) if (bullet.kind === 'laser') seen.add(bullet.id);
    }
    expect(world.ultimateBeam).toBeNull();
    const expected = Math.round(CONFIG.ultimate.laser.duration / CONFIG.ultimate.laser.burstInterval)
      * CONFIG.ultimate.laser.beamsPerBurst;
    expect(seen.size).toBeGreaterThanOrEqual(expected - CONFIG.ultimate.laser.beamsPerBurst * 2);
    expect(seen.size).toBeLessThanOrEqual(expected + CONFIG.ultimate.laser.beamsPerBurst * 2);
  });

  it('input helpers carry the ultimate edge', () => {
    expect(emptyInput().ultimate).toBe(false);
    expect(mergeInput(emptyInput(), { ...emptyInput(), ultimate: true }).ultimate).toBe(true);
    expect(mergeInput({ ...emptyInput(), ultimate: true }, emptyInput()).ultimate).toBe(true);
  });

  it('is deterministic with ultimates in the input stream', () => {
    const run = () => {
      const { world, systems } = createWorld(77);
      equipWeapon(world.player, 'missile');
      for (let step = 0; step < 120; step += 1) {
        const input = step === 10 ? ultInput() : { ...emptyInput(), firing: true, aimX: 1, aimZ: 0 };
        stepWorld(world, systems, input, DT);
      }
      return { rng: world.rng.state(), bullets: world.bullets.length, score: world.player.score };
    };
    expect(run()).toEqual(run());
  });
});
