import type { RNG } from '../math/rng.js';
import type { Vec3 } from '../math/vec3.js';
import type { WaveImpulse } from '../math/wave.js';

export type Vec = Vec3;
export type PlanePoint = Pick<Vec, 'x' | 'z'>;
export type EnemyKind = 'grunt' | 'wanderer' | 'singularity' | 'dodger';
export type BossType = 'mini' | 'big';
export type WeaponType = 'blaster' | 'missile' | 'lightning' | 'laser';
export type WeaponSlot = 'primary' | 'secondary';
export type BulletOwner = 'player' | 'enemy' | 'boss';
export type BulletKind = 'standard' | 'spread' | 'missile' | 'lightning' | 'laser' | 'enemy';
export type ItemKind = 'life' | 'heal' | 'weapon' | 'boost' | 'shield' | 'multiplier';
export type EntityTag = 'player' | 'bullet' | 'enemy' | 'particle' | 'item';

export interface Body {
  readonly id: number;
  readonly tag: EntityTag;
  pos: Vec;
  vel: Vec;
  radius: number;
}

export type WeaponLevels = Record<WeaponType, number>;

export interface PlayerState extends Body {
  tag: 'player';
  hp: number;
  maxHp: number;
  aim: Vec;
  fireCooldown: number;
  fireInterval: number;
  boost: number;
  alive: boolean;
  invuln: number;
  multiplier: number;
  score: number;
  energy: number;
  weaponLevel: number;
  weaponLevels: WeaponLevels;
  primaryWeapon: 'blaster';
  secondaryWeapon: Exclude<WeaponType, 'blaster'> | null;
  weaponCooldowns: Record<WeaponSlot, number>;
  ultimateCooldown: number;
  lives: number;
  shield: number;
  hitCount: number;
}

export interface BulletState extends Body {
  tag: 'bullet';
  owner: BulletOwner;
  kind: BulletKind;
  life: number;
  damage: number;
  spent: boolean;
  pierce: boolean;
  level: number;
  turnRate: number;
  blastRadius: number;
  hitIds: number[];
  prevPos: Vec;
}

export interface EnemyState extends Body {
  tag: 'enemy';
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  score: number;
  behaviorTimer: number;
  phase: number;
  critical: boolean;
  jitter: Vec;
  dead: boolean;
  hitFlash?: number;
}

export interface BossState extends Omit<EnemyState, 'kind'> {
  kind: 'boss';
  bossType: BossType;
  bossNumber: number;
  rageLevel: number;
  speed: number;
  color: number;
  fireCooldown: number;
  fireInterval: number;
  bulletSpeed: number;
  bulletLife: number;
  bulletDamage: number;
  extraBullets: number;
}

export interface ParticleState extends Body {
  tag: 'particle';
  life: number;
  lifespan: number;
  damping: number;
  color: number;
  size: number;
}

export interface ItemState extends Body {
  tag: 'item';
  kind: ItemKind;
  weaponType: Exclude<WeaponType, 'blaster'> | null;
  life: number;
  bob: number;
  color: number;
  dead: boolean;
}

export interface PendingBurst {
  pos: Vec;
  remaining: number;
  color: number;
  perFrame: number;
}

export interface PendingLightning {
  pos: Vec;
  dir: Vec;
  level: number;
  damage: number;
  range: number;
  /** Ultimate override: fixed chain count (default 2 + level). */
  superChains?: number;
  /** Ultimate override: hop-to-hop search range (default 8 + level). */
  chainRange?: number;
  /** Ultimate override: skip the first-arc aim-cone restriction. */
  noCone?: boolean;
}

/** Staggered ultimate missile volley being drained by stepUltimate. */
export interface UltimateVolley {
  remaining: number;
  timer: number;
  level: number;
}

/** Rotating tempest crackle sweep being drained by stepUltimate. */
export interface UltimateTempest {
  remaining: number;
  timer: number;
  base: number;
}

/** Timed ultimate laser barrage being drained by stepUltimate. */
export interface UltimateBeam {
  t: number;
  tick: number;
  level: number;
}

export interface WeaponEffect {
  kind: WeaponType;
  style?: 'bolt' | 'trail' | 'branch' | 'flash';
  from: PlanePoint;
  to: PlanePoint;
  height?: number;
  life: number;
  maxLife: number;
}

export type GameEvent =
  | { type: 'kill'; pos: Vec; kind: EnemyKind; score: number }
  | { type: 'explode'; pos: Vec; radius: number; strength: number; color: number }
  | { type: 'hit-player'; pos: Vec; damage: number }
  | { type: 'revive'; pos: Vec }
  | { type: 'shockwave'; pos: Vec; strength: number }
  | { type: 'spawn'; pos: Vec; kind: EnemyKind }
  | { type: 'game-over'; pos: Vec }
  | { type: 'multiplier-up'; value: number }
  | { type: 'weapon-fire'; pos: Vec; weapon: WeaponType; level: number; slot: WeaponSlot }
  | { type: 'skill'; pos: Vec; radius: number; color: number }
  | { type: 'skill-fire'; pos: Vec }
  | { type: 'pickup'; pos: Vec; kind: ItemKind }
  | { type: 'boss-spawn'; pos: Vec; bossType: BossType; bossNumber: number; rageLevel: number }
  | { type: 'boss-fire'; pos: Vec }
  | { type: 'boss-hit'; pos: Vec }
  | { type: 'boss-dead'; pos: Vec; score: number }
  | { type: 'missile-explode'; pos: Vec; radius: number }
  | { type: 'ultimate-fire'; pos: Vec; weapon: Exclude<WeaponType, 'blaster'> };

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
  events: GameEvent[];
  items: ItemState[];
  boss: BossState | null;
  bossActiveWave: number;
  bossDefeatedWaves: Set<number>;
  spawnState: { timer: number; wave: number; budget: number; toSpawn: number };
  pendingBursts: PendingBurst[];
  pendingLightning: PendingLightning[];
  weaponEffects: WeaponEffect[];
  ultimateVolley: UltimateVolley | null;
  ultimateBeam: UltimateBeam | null;
  ultimateTempest: UltimateTempest | null;
  trauma: number;
  eventWobble: number;
  gameOver: boolean;
  nextId: number;
}
