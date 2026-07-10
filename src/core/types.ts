// types.ts — Shared simulation types. Pure data; no Three.js.
// The architecture rule: collision/score/spawn logic must read only these
// generic fields (`radius`, `hp`, `score`, `kind`), never switch on enemy type.

import type { Vec3 } from '../math/vec3.js';
import type { WaveImpulse } from '../math/wave.js';
import type { RNG } from '../math/rng.js';

export type Vec = Vec3;

/** Enemy behavior kind. New kinds are added by extending this union + behaviors map. */
export type EnemyKind = 'grunt' | 'wanderer' | 'singularity' | 'dodger';

export type BossType = 'mini' | 'big';

export type WeaponType = 'blaster' | 'missile' | 'lightning' | 'laser';

/** Bullet ownership + variant. */
export type BulletOwner = 'player' | 'enemy';
export type BulletKind = 'standard' | 'spread' | 'missile' | 'lightning' | 'laser' | 'enemy';

/** Entity tag for broad-phase bookkeeping. */
export type EntityTag = 'player' | 'bullet' | 'enemy' | 'particle' | 'pickup';

/** A body that participates in collision. Generic so collision never switches on type. */
export interface Body {
  readonly id: number;
  readonly tag: EntityTag;
  /** World position (XZ is the play plane). */
  pos: Vec;
  /** Velocity (units/sec). */
  vel: Vec;
  /** Collision radius (XZ circle). */
  radius: number;
}

export interface PlayerState extends Body {
  tag: 'player';
  hp: number;
  maxHp: number;
  /** Current aim direction (XZ, normalized). */
  aim: Vec;
  /** Seconds until next shot allowed. */
  fireCooldown: number;
  fireInterval: number;
  /** Boost (Shift) energy 0..1. */
  boost: number;
  /** True after taking fatal damage; sim stops spawning. */
  alive: boolean;
  /** Invulnerability timer after hit/respawn (sec). */
  invuln: number;
  /** Score multiplier contributed by survival streak (managed by ScoreSystem). */
  multiplier: number;
  /** Total score. */
  score: number;
}

export interface BulletState extends Body {
  tag: 'bullet';
  owner: BulletOwner;
  kind: BulletKind;
  /** Lifespan in seconds. */
  life: number;
  /** Damage dealt on hit. */
  damage: number;
  /** Whether this bullet has already hit something (one-shot). */
  spent: boolean;
}

export interface EnemyState extends Body {
  tag: 'enemy';
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  /** Score awarded on kill (read by ScoreSystem; never switch on kind). */
  score: number;
  /** Behavior-internal timer (dodger dodge cd, singularity charge, etc.). */
  behaviorTimer: number;
  /** Phase for wandering/oscillation. */
  phase: number;
  /** Singularity: when true it has reached critical mass and will explode. */
  critical: boolean;
  /** Per-enemy jitter direction seeded at spawn. */
  jitter: Vec;
  /** Flag set the frame it dies, so renderer/score can react. */
  dead: boolean;
}

export interface ParticleState extends Body {
  tag: 'particle';
  /** Remaining life (sec). */
  life: number;
  /** Total lifespan for fade normalization. */
  lifespan: number;
  /** Velocity damping per second (0..1, 1 = no damping). */
  damping: number;
  /** Neon color as 0xRRGGBB. */
  color: number;
  /** Size of the instanced voxel. */
  size: number;
}

/** Discrete events emitted by the sim step. Renderers/audio subscribe; sim stays pure. */
export type GameEvent =
  | { type: 'kill'; pos: Vec; kind: EnemyKind; score: number }
  | { type: 'explode'; pos: Vec; radius: number; strength: number; color: number }
  | { type: 'hit-player'; pos: Vec; damage: number }
  | { type: 'shockwave'; pos: Vec; strength: number }
  | { type: 'spawn'; pos: Vec; kind: EnemyKind }
  | { type: 'game-over'; pos: Vec }
  | { type: 'multiplier-up'; value: number };

/** Aggregate world state. stepWorld mutates and returns events. */
export interface World {
  seed: number;
  rng: RNG;
  time: number;
  arenaRadius: number;
  player: PlayerState;
  bullets: BulletState[];
  enemies: EnemyState[];
  particles: ParticleState[];
  impulses: WaveImpulse[];
  /** Pending events for the current step (cleared each step). */
  events: GameEvent[];
  /** Global spawn/telegraph state owned by SpawnSystem. */
  spawnState: { timer: number; wave: number; budget: number; toSpawn: number };
  /** Camera trauma managed by CameraShakeSystem (consumed by renderer). */
  trauma: number;
  /** Whether the player has lost (drives game-over). */
  gameOver: boolean;
  /** Next entity id allocator. */
  nextId: number;
}
