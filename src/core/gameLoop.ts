// gameLoop.ts — Fixed-timestep game loop with accumulator. Renderer-agnostic.
// The loop owns only timing; the sim step + render callback are injected (DI),
// so the loop is trivially unit-testable with a fake clock.

export interface LoopCallbacks {
  step(dt: number): void;
  /** Returns whether to keep running (false stops the loop). */
  render(alpha: number): boolean;
  /** Wall-clock seconds since some epoch (defaults to performance.now). */
  now?(): number;
}

export interface LoopHandle {
  start(): void;
  stop(): void;
  running: boolean;
}

export const createLoop = (
  cb: LoopCallbacks,
  fixedStep: number,
  maxSubsteps: number
): LoopHandle => {
  let rafId = 0;
  let acc = 0;
  let last = 0;
  let running = false;
  const now = cb.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));

  const frame = () => {
    if (!running) return;
    const t = now() / 1000;
    if (last === 0) last = t;
    let dt = t - last;
    last = t;
    // Clamp huge frame gaps (tab switch) so we don't spiral.
    if (dt > 0.25) dt = 0.25;
    acc += dt;
    let steps = 0;
    while (acc >= fixedStep && steps < maxSubsteps) {
      cb.step(fixedStep);
      acc -= fixedStep;
      steps++;
    }
    // Drop residual if we hit the substep cap (avoid spiral of death).
    if (steps === maxSubsteps) acc = 0;
    const alpha = acc / fixedStep;
    const keepGoing = cb.render(alpha);
    if (!keepGoing) {
      stop();
      return;
    }
    rafId = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running) return;
    running = true;
    last = 0;
    acc = 0;
    rafId = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  };

  return { start, stop, get running() { return running; } };
};

/**
 * Headless stepper for tests / deterministic simulation: runs `steps` fixed
 * steps calling cb.step each time. No rAF, no wall clock.
 */
export const runSteps = (cb: Pick<LoopCallbacks, 'step'>, steps: number, fixedStep: number): void => {
  for (let i = 0; i < steps; i++) cb.step(fixedStep);
};