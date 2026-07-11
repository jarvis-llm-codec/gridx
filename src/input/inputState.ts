// inputState.ts — Pure input descriptor consumed by the sim. No DOM types.
// The sim never imports the DOM adapter; tests construct an InputState directly.

export interface InputState {
  /** Movement intent on the XZ plane (-1..1 each). */
  moveX: number;
  moveZ: number;
  /** Aim direction on the XZ plane (normalized, or zero if no aim). */
  aimX: number;
  aimZ: number;
  /** Firing held. */
  firing: boolean;
  /** Boost held. */
  boost: boolean;
  /** Pause toggled this frame (edge). */
  pause: boolean;
  /** Mute toggled this frame (edge). */
  mute: boolean;
  /** Restart requested this frame (edge). */
  restart: boolean;
  skill: boolean;
  /** Secondary-weapon ultimate requested this frame (edge). */
  ultimate: boolean;
}

export const emptyInput = (): InputState => ({
  moveX: 0,
  moveZ: 0,
  aimX: 0,
  aimZ: 0,
  firing: false,
  boost: false,
  pause: false,
  mute: false,
  restart: false,
  skill: false,
  ultimate: false,
});

/** Merge two inputs (latter wins on edges, max on continuous). Used for multi-source input. */
export const mergeInput = (a: InputState, b: InputState): InputState => ({
  moveX: Math.max(-1, Math.min(1, a.moveX + b.moveX)),
  moveZ: Math.max(-1, Math.min(1, a.moveZ + b.moveZ)),
  aimX: b.aimX || a.aimX ? b.aimX || a.aimX : 0,
  aimZ: b.aimZ || a.aimZ ? b.aimZ || a.aimZ : 0,
  firing: a.firing || b.firing,
  boost: a.boost || b.boost,
  pause: a.pause || b.pause,
  mute: a.mute || b.mute,
  restart: a.restart || b.restart,
  skill: a.skill || b.skill,
  ultimate: a.ultimate || b.ultimate,
});
