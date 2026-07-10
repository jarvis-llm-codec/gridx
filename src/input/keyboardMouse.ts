// keyboardMouse.ts — DOM adapter that produces an InputState. Isolated from sim.
// Exposes attach()/detach() and a snapshot() returning a fresh InputState.
// Keyboard = movement (WASD/arrows); mouse = aim + fire; Shift = boost.

import { emptyInput, type InputState } from './inputState.js';

export interface InputAdapter {
  attach(target: HTMLElement): void;
  detach(): void;
  /** Returns the current frame's input (edge flags consumed on read). */
  snapshot(): InputState;
  /** Latest mouse world-ish aim; renderer overrides aim from screen projection. */
  aimFromMouse: boolean;
}

export const createInputAdapter = (): InputAdapter => {
  const keys = new Set<string>();
  let mouseAimX = 0;
  let mouseAimZ = 0;
  let hasMouseAim = false;
  let firing = false;
  let boost = false;
  // Edge flags: set on event, cleared on snapshot read.
  let pauseEdge = false;
  let muteEdge = false;
  let restartEdge = false;
  let attached = false;
  let target: HTMLElement | null = null;

  const onKey = (down: boolean) => (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (down) keys.add(k);
    else keys.delete(k);
    if (down) {
      if (k === 'p') pauseEdge = true;
      if (k === 'm') muteEdge = true;
      if (k === 'r') restartEdge = true;
    }
  };
  const onKeyDown = onKey(true);
  const onKeyUp = onKey(false);

  const onMouseMove = (e: MouseEvent) => {
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // Aim direction = mouse offset from screen center in screen space;
    // renderer maps this to a world aim. We expose XZ in screen axes:
    // screen +X -> world aim X, screen -Y (up) -> world aim -Z (forward).
    mouseAimX = (e.clientX - cx) / (rect.width / 2);
    mouseAimZ = (e.clientY - cy) / (rect.height / 2);
    hasMouseAim = true;
  };
  const onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) firing = true;
  };
  const onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) firing = false;
  };
  const onBlur = () => {
    keys.clear();
    firing = false;
    boost = false;
  };

  const key = (a: string, b: string) => keys.has(a) || keys.has(b);

  const detachImpl = (): void => {
    if (!attached) return;
    attached = false;
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    if (target) {
      target.removeEventListener('mousemove', onMouseMove);
      target.removeEventListener('mousedown', onMouseDown);
    }
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('blur', onBlur);
    target = null;
    keys.clear();
  };

  return {
    aimFromMouse: true,
    attach(t) {
      if (attached) detachImpl();
      target = t;
      attached = true;
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      t.addEventListener('mousemove', onMouseMove);
      t.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('blur', onBlur);
    },
    detach() {
      detachImpl();
    },
    snapshot() {
      const ix = emptyInput();
      // Movement
      let mx = 0;
      let mz = 0;
      if (key('a', 'arrowleft')) mx -= 1;
      if (key('d', 'arrowright')) mx += 1;
      if (key('w', 'arrowup')) mz -= 1;
      if (key('s', 'arrowdown')) mz += 1;
      const mlen = Math.hypot(mx, mz);
      if (mlen > 0.01) {
        ix.moveX = mx / Math.max(1, mlen);
        ix.moveZ = mz / Math.max(1, mlen);
      }
      // Aim: prefer mouse if moved, else fall back to last movement direction.
      if (hasMouseAim && (mouseAimX || mouseAimZ)) {
        const alen = Math.hypot(mouseAimX, mouseAimZ);
        if (alen > 0.001) {
          ix.aimX = mouseAimX / alen;
          ix.aimZ = mouseAimZ / alen;
        }
      } else if (ix.moveX || ix.moveZ) {
        ix.aimX = ix.moveX;
        ix.aimZ = ix.moveZ;
      }
      ix.firing = firing || key(' ', '');
      ix.boost = key('shift', 'shiftleft') || boost;
      ix.pause = pauseEdge;
      ix.mute = muteEdge;
      ix.restart = restartEdge;
      pauseEdge = false;
      muteEdge = false;
      restartEdge = false;
      return ix;
    },
  };
};