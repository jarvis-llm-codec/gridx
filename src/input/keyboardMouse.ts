import type { PlanePoint, Vec } from '../core/types.js';
import { emptyInput, type InputState } from './inputState.js';

export type MouseAimResolver = (screenX: number, screenY: number, playerPos: Vec) => PlanePoint | null;

export interface InputAdapter {
  attach(target: HTMLElement): void;
  detach(): void;
  snapshot(playerPos?: Vec): InputState;
  setMouseAimResolver(resolver: MouseAimResolver | null): void;
  aimFromMouse: boolean;
}

interface TouchStick {
  id: number | null;
  originX: number;
  originY: number;
  deltaX: number;
  deltaY: number;
}

export const createInputAdapter = (): InputAdapter => {
  const keys = new Set<string>();
  let mouseAimX = 0;
  let mouseAimZ = 0;
  let hasMouseAim = false;
  let firing = false;
  let pauseEdge = false;
  let muteEdge = false;
  let restartEdge = false;
  let skillEdge = false;
  let ultimateEdge = false;
  let attached = false;
  let target: HTMLElement | null = null;
  let aimResolver: MouseAimResolver | null = null;
  let lastResolvedAim: PlanePoint | null = null;

  const joystickDistance = 70;
  let leftJoystick: HTMLDivElement | null = null;
  let rightJoystick: HTMLDivElement | null = null;
  let leftKnob: HTMLDivElement | null = null;
  let rightKnob: HTMLDivElement | null = null;
  let boostButton: HTMLDivElement | null = null;
  let pauseButton: HTMLDivElement | null = null;
  let restartButton: HTMLDivElement | null = null;
  let skillButton: HTMLDivElement | null = null;
  let ultimateButton: HTMLDivElement | null = null;
  let touchBoost = false;
  const moveTouch: TouchStick = { id: null, originX: 0, originY: 0, deltaX: 0, deltaY: 0 };
  const aimTouch: TouchStick = { id: null, originX: 0, originY: 0, deltaX: 0, deltaY: 0 };

  const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const onKey = (down: boolean) => (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (down) keys.add(key);
    else keys.delete(key);
    if (down) {
      if (key === 'p') pauseEdge = true;
      if (key === 'm') muteEdge = true;
      if (key === 'r') restartEdge = true;
      if (key === 'f' || key === 'q') skillEdge = true;
      if (key === 'e') ultimateEdge = true;
    }
  };
  const onKeyDown = onKey(true);
  const onKeyUp = onKey(false);
  const onMouseMove = (event: MouseEvent) => {
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseAimX = (event.clientX - centerX) / (rect.width / 2);
    mouseAimZ = (event.clientY - centerY) / (rect.height / 2);
    hasMouseAim = true;
  };
  const onMouseDown = (event: MouseEvent) => {
    if (event.button === 0) firing = true;
    if (event.button === 2) ultimateEdge = true;
  };
  const onMouseUp = (event: MouseEvent) => {
    if (event.button === 0) firing = false;
  };
  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault();
  };
  const onBlur = () => {
    keys.clear();
    firing = false;
  };
  const keyDown = (first: string, second: string) => keys.has(first) || keys.has(second);

  const makeJoystick = (): [HTMLDivElement, HTMLDivElement] => {
    const joystick = document.createElement('div');
    joystick.className = 'joy';
    const knob = document.createElement('div');
    knob.className = 'knob';
    joystick.appendChild(knob);
    return [joystick, knob];
  };
  const showJoystick = (joystick: HTMLDivElement, knob: HTMLDivElement, x: number, y: number) => {
    joystick.style.left = `${x}px`;
    joystick.style.top = `${y}px`;
    joystick.classList.add('show');
    knob.style.transform = 'translate(-50%,-50%)';
  };
  const hideJoystick = (joystick: HTMLDivElement, knob: HTMLDivElement) => {
    joystick.classList.remove('show');
    knob.style.transform = 'translate(-50%,-50%)';
  };
  const setKnob = (knob: HTMLDivElement, deltaX: number, deltaY: number) => {
    const x = Math.max(-joystickDistance, Math.min(joystickDistance, deltaX));
    const y = Math.max(-joystickDistance, Math.min(joystickDistance, deltaY));
    knob.style.transform = `translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;
  };

  const onTouchStart = (event: TouchEvent) => {
    if (!target) return;
    const rect = target.getBoundingClientRect();
    for (const touch of event.changedTouches) {
      if ([boostButton, pauseButton, restartButton, skillButton, ultimateButton].includes(touch.target as HTMLDivElement)) continue;
      const horizontal = (touch.clientX - rect.left) / rect.width;
      const stick = horizontal < 0.5 ? moveTouch : aimTouch;
      const joystick = horizontal < 0.5 ? leftJoystick : rightJoystick;
      const knob = horizontal < 0.5 ? leftKnob : rightKnob;
      if (stick.id !== null || !joystick || !knob) continue;
      stick.id = touch.identifier;
      stick.originX = touch.clientX;
      stick.originY = touch.clientY;
      stick.deltaX = 0;
      stick.deltaY = 0;
      showJoystick(joystick, knob, touch.clientX, touch.clientY);
      setKnob(knob, 0, 0);
    }
  };
  const updateTouchStick = (touch: Touch, stick: TouchStick, knob: HTMLDivElement | null) => {
    if (touch.identifier !== stick.id || !knob) return;
    let deltaX = touch.clientX - stick.originX;
    let deltaY = touch.clientY - stick.originY;
    const length = Math.hypot(deltaX, deltaY);
    if (length > joystickDistance) {
      deltaX = (deltaX / length) * joystickDistance;
      deltaY = (deltaY / length) * joystickDistance;
    }
    stick.deltaX = deltaX;
    stick.deltaY = deltaY;
    setKnob(knob, deltaX, deltaY);
  };
  const onTouchMove = (event: TouchEvent) => {
    for (const touch of event.changedTouches) {
      updateTouchStick(touch, moveTouch, leftKnob);
      updateTouchStick(touch, aimTouch, rightKnob);
    }
    event.preventDefault();
  };
  const endTouchStick = (
    touch: Touch,
    stick: TouchStick,
    joystick: HTMLDivElement | null,
    knob: HTMLDivElement | null,
  ) => {
    if (touch.identifier !== stick.id) return;
    stick.id = null;
    stick.deltaX = 0;
    stick.deltaY = 0;
    if (joystick && knob) hideJoystick(joystick, knob);
  };
  const onTouchEnd = (event: TouchEvent) => {
    for (const touch of event.changedTouches) {
      endTouchStick(touch, moveTouch, leftJoystick, leftKnob);
      endTouchStick(touch, aimTouch, rightJoystick, rightKnob);
    }
  };

  const makeButton = (
    id: string,
    text: string,
    onStart: () => void,
    onEnd?: () => void,
  ): HTMLDivElement => {
    const button = document.createElement('div');
    button.id = id;
    button.textContent = text;
    button.addEventListener('touchstart', (event) => {
      onStart();
      event.preventDefault();
      event.stopPropagation();
    }, { passive: false });
    button.addEventListener('touchend', (event) => {
      onEnd?.();
      event.preventDefault();
      event.stopPropagation();
    }, { passive: false });
    return button;
  };

  const detach = (): void => {
    if (attached) {
      attached = false;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (target) {
        target.removeEventListener('mousemove', onMouseMove);
        target.removeEventListener('mousedown', onMouseDown);
        target.removeEventListener('contextmenu', onContextMenu);
        target.removeEventListener('touchstart', onTouchStart);
        target.removeEventListener('touchmove', onTouchMove);
        target.removeEventListener('touchend', onTouchEnd);
        target.removeEventListener('touchcancel', onTouchEnd);
      }
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('blur', onBlur);
      target = null;
      keys.clear();
      moveTouch.id = null;
      aimTouch.id = null;
    }
    for (const element of [leftJoystick, rightJoystick, boostButton, pauseButton, restartButton, skillButton, ultimateButton]) {
      element?.remove();
    }
    leftJoystick = null;
    rightJoystick = null;
    leftKnob = null;
    rightKnob = null;
    boostButton = null;
    pauseButton = null;
    restartButton = null;
    skillButton = null;
    ultimateButton = null;
  };

  return {
    aimFromMouse: true,
    setMouseAimResolver(resolver) {
      aimResolver = resolver;
    },
    attach(element) {
      if (attached) detach();
      target = element;
      attached = true;
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      element.addEventListener('mousemove', onMouseMove);
      element.addEventListener('mousedown', onMouseDown);
      element.addEventListener('contextmenu', onContextMenu);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('blur', onBlur);
      if (isTouchDevice()) {
        [leftJoystick, leftKnob] = makeJoystick();
        [rightJoystick, rightKnob] = makeJoystick();
        document.body.appendChild(leftJoystick);
        document.body.appendChild(rightJoystick);
        boostButton = makeButton('joy-btn', 'BOOST', () => { touchBoost = true; }, () => { touchBoost = false; });
        pauseButton = makeButton('joy-btn2', 'II', () => { pauseEdge = true; });
        restartButton = makeButton('joy-btn3', 'R', () => { restartEdge = true; });
        skillButton = makeButton('joy-btn4', 'BOMB', () => { skillEdge = true; });
        ultimateButton = makeButton('joy-btn5', 'ULT', () => { ultimateEdge = true; });
        document.body.append(boostButton, pauseButton, restartButton, skillButton, ultimateButton);
        element.addEventListener('touchstart', onTouchStart, { passive: false });
        element.addEventListener('touchmove', onTouchMove, { passive: false });
        element.addEventListener('touchend', onTouchEnd, { passive: false });
        element.addEventListener('touchcancel', onTouchEnd, { passive: false });
      }
    },
    detach,
    snapshot(playerPos) {
      const input = emptyInput();
      let moveX = 0;
      let moveZ = 0;
      if (keyDown('a', 'arrowleft')) moveX -= 1;
      if (keyDown('d', 'arrowright')) moveX += 1;
      if (keyDown('w', 'arrowup')) moveZ -= 1;
      if (keyDown('s', 'arrowdown')) moveZ += 1;
      if (moveTouch.id !== null) {
        moveX = moveTouch.deltaX / joystickDistance;
        moveZ = moveTouch.deltaY / joystickDistance;
      }
      const moveLength = Math.hypot(moveX, moveZ);
      if (moveLength > 0.01) {
        input.moveX = moveX / Math.max(1, moveLength);
        input.moveZ = moveZ / Math.max(1, moveLength);
      }
      if (hasMouseAim && (mouseAimX || mouseAimZ)) {
        const resolved = aimResolver && playerPos ? aimResolver(mouseAimX, mouseAimZ, playerPos) : null;
        if (resolved && Number.isFinite(resolved.x) && Number.isFinite(resolved.z)) lastResolvedAim = resolved;
        const mouseAim = lastResolvedAim || (() => {
          const length = Math.hypot(mouseAimX, mouseAimZ);
          return length > 0.001 ? { x: mouseAimX / length, z: mouseAimZ / length } : null;
        })();
        if (mouseAim) {
          input.aimX = mouseAim.x;
          input.aimZ = mouseAim.z;
        }
      } else if (input.moveX || input.moveZ) {
        input.aimX = input.moveX;
        input.aimZ = input.moveZ;
      }
      if (aimTouch.id !== null) {
        const length = Math.hypot(aimTouch.deltaX, aimTouch.deltaY);
        if (length > 0.001) {
          input.aimX = aimTouch.deltaX / length;
          input.aimZ = aimTouch.deltaY / length;
        }
      }
      // Autofire: firing costs nothing, and touchpads can't drag the cursor
      // while the button is held — aiming and firing fought each other there
      // (reddit report: "controls don't work on touchpad laptop").
      const AUTOFIRE = true;
      input.firing = AUTOFIRE || firing || keyDown(' ', '') || aimTouch.id !== null;
      input.boost = keyDown('shift', 'shiftleft') || touchBoost;
      input.pause = pauseEdge;
      input.mute = muteEdge;
      input.restart = restartEdge;
      input.skill = skillEdge;
      input.ultimate = ultimateEdge;
      pauseEdge = false;
      muteEdge = false;
      restartEdge = false;
      skillEdge = false;
      ultimateEdge = false;
      return input;
    },
  };
};
