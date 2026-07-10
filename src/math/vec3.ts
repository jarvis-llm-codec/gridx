// vec3.ts — Pure 3D vector math. No dependencies. Immutable-friendly via mutators on a re-used object.
// Convention: the game's simulation plane is XZ (Y is up/height). The 2D helpers operate on X/Z.

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const vec3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });

export const clone3 = (a: Vec3): Vec3 => ({ x: a.x, y: a.y, z: a.z });

export const add3 = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });

export const sub3 = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

export const scale3 = (a: Vec3, s: number): Vec3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });

export const dot3 = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;

export const cross3 = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

export const len3 = (a: Vec3): number => Math.hypot(a.x, a.y, a.z);

export const lenSq3 = (a: Vec3): number => a.x * a.x + a.y * a.y + a.z * a.z;

export const dist3 = (a: Vec3, b: Vec3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export const dist2 = (a: Vec3, b: Vec3): number => Math.hypot(a.x - b.x, a.z - b.z);

/** Normalize a 3D vector. Returns zero vector if input has zero length. */
export const normalize3 = (a: Vec3): Vec3 => {
  const len = Math.hypot(a.x, a.y, a.z);
  if (len < 1e-9) return { x: 0, y: 0, z: 0 };
  return { x: a.x / len, y: a.y / len, z: a.z / len };
};

/**
 * Normalize the XZ plane component only, leaving Y at 0.
 * Critical for twin-stick: aim/move must live on the ground plane, never bleed Y.
 * Returns zero vector if XZ length is ~0.
 */
export const normalize2 = (a: Vec3): Vec3 => {
  const len = Math.hypot(a.x, a.z);
  if (len < 1e-9) return { x: 0, y: 0, z: 0 };
  return { x: a.x / len, y: 0, z: a.z / len };
};

/** Linear interpolation between two vectors. */
export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: a.z + (b.z - a.z) * t,
});

/** Spherical linear interpolation for smooth rotation-free chase (not true slerp; fine for gameplay). */
export const damp3 = (a: Vec3, b: Vec3, lambda: number, dt: number): Vec3 => {
  const t = 1 - Math.exp(-lambda * dt);
  return lerp3(a, b, t);
};

/** Reflect a direction about a normal. Used for bounce/wrap behaviors. */
export const reflect3 = (dir: Vec3, normal: Vec3): Vec3 => {
  const d = dot3(dir, normal);
  return sub3(dir, scale3(normal, 2 * d));
};

/** Rotate a vector in the XZ plane by `angle` radians (Y preserved). */
export const rotateY3 = (a: Vec3, angle: number): Vec3 => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: a.x * c - a.z * s, y: a.y, z: a.x * s + a.z * c };
};

/** Perpendicular in the XZ plane (rotate +90deg about Y). */
export const perp2 = (a: Vec3): Vec3 => ({ x: -a.z, y: a.y, z: a.x });

/** Squared 2D distance on the XZ plane (avoids sqrt for hot loops). */
export const distSq2 = (a: Vec3, b: Vec3): number => {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
};