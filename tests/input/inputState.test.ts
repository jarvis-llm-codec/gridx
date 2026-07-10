import { describe, expect, it } from 'vitest';
import { createInputAdapter } from '../../src/input/keyboardMouse.js';
import { emptyInput, mergeInput } from '../../src/input/inputState.js';

describe('input state', () => {
  it('includes an edge-triggered NOVA skill flag', () => {
    expect(emptyInput()).toMatchObject({ skill: false });
    expect(mergeInput(emptyInput(), { ...emptyInput(), skill: true }).skill).toBe(true);
  });

  it('exposes the canonical mouse aim resolver contract', () => {
    const adapter = createInputAdapter();
    adapter.setMouseAimResolver(() => ({ x: 1, z: 0 }));
    expect(adapter.snapshot({ x: 0, y: 0, z: 0 })).toEqual(emptyInput());
    adapter.detach();
  });
});
