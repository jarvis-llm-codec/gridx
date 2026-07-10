import { describe, it, expect } from 'vitest';
import { createLoop, runSteps } from '../../src/core/gameLoop.js';
import { CONFIG } from '../../src/core/config.js';

describe('gameLoop', () => {
  it('runSteps calls step exactly N times', () => {
    let n = 0;
    runSteps({ step: () => n++ }, 100, CONFIG.fixedStep);
    expect(n).toBe(100);
  });
  it('createLoop handle has start/stop/running', () => {
    const handle = createLoop(
      {
        step: () => {},
        render: () => false,
        now: () => 0,
      },
      CONFIG.fixedStep,
      CONFIG.maxSubsteps
    );
    expect(handle.running).toBe(false);
    expect(typeof handle.start).toBe('function');
    expect(typeof handle.stop).toBe('function');
    handle.stop();
  });
});