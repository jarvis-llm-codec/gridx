import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../src/core/config.js';

describe('canonical configuration', () => {
  it('preserves the restored weapon, item, boss, and performance values', () => {
    expect(CONFIG).toMatchObject({
      fixedStep: 1 / 60,
      worldBounds: 26,
      player: {
        maxLives: 3,
        maxEnergy: 100,
        energyRegen: 8,
        skillCost: 100,
        skillDamage: 12,
        skillRadius: 14,
        maxWeaponLevel: 3,
        weapons: {
          blaster: { interval: 0.09, damage: 1 },
          missile: { interval: 0.48, damage: 4.5, blastRadius: 2.6, turnRate: 5.4 },
          lightning: { interval: 0.38, damage: 1.8, range: 17 },
          laser: { interval: 0.22, damage: 1.65 },
        },
      },
      spawn: { maxAlive: 60, maxAlivePerWave: 4, maxAliveCap: 140 },
      particles: { perKill: 64, perBigKill: 150, maxParticles: 5000 },
      grid: { impulseStrength: 6, maxImpulses: 20 },
      items: {
        dropChance: 0.3,
        bossDropCount: 6,
        bossWeaponDrops: { mini: 2, big: 3 },
        magnetRadius: 11,
        magnetPull: 36,
      },
      boss: {
        firstDelay: 42,
        interval: 52,
        intervalMin: 38,
        postThirdIntervalCut: 5,
        postThirdIntervalMin: 26,
        postThirdHpGrowth: 0.45,
        postThirdExtraBullets: 2,
        mini: { hp: 70, score: 5000 },
        big: { hp: 260, score: 25000 },
      },
    });
  });
});
