// sphereMapping.ts — Project flat XZ simulation coordinates onto a sphere cap.
// The arena is the surface of a large sphere; the player roams a cap of it.
// Pure math; the render layer consumes these to deform the grid mesh.

export interface SphereParams {
  /** Sphere radius. */
  radius: number;
  /** Half-angle of the playable cap (radians). Larger = bigger arena. */
  capHalfAngle: number;
}

export interface SphericalPoint {
  /** Position on/above the sphere surface. */
  x: number;
  y: number;
  z: number;
  /** Surface normal at that point. */
  nx: number;
  ny: number;
  nz: number;
}

/**
 * Map a flat (fx, fz) in the arena plane ([-1, 1] normalized by capHalfAngle)
 * onto the sphere surface. fx,fz are first mapped to azimuth/polar angles.
 * Returns world position + surface normal.
 *
 * Convention: the sphere is centered below the arena so the cap pokes "up".
 * North pole of the sphere aligns with +Y. The playable cap is around the north pole.
 */
export const mapToSphere = (
  fx: number, // normalized arena x in [-1, 1]
  fz: number, // normalized arena z in [-1, 1]
  p: SphereParams
): SphericalPoint => {
  // distance in normalized plane -> polar angle from north pole
  const r = Math.min(1, Math.hypot(fx, fz));
  const polar = r * p.capHalfAngle; // 0 at center, capHalfAngle at edge
  // azimuth from flat coords
  const azim = Math.atan2(fz, fx);
  const sinP = Math.sin(polar);
  const cosP = Math.cos(polar);
  const cosA = Math.cos(azim);
  const sinA = Math.sin(azim);
  const x = p.radius * sinP * cosA;
  const z = p.radius * sinP * sinA;
  const y = p.radius * cosP;
  // outward normal = normalized position
  const inv = 1 / p.radius;
  return { x, y, z, nx: x * inv, ny: y * inv, nz: z * inv };
};

/**
 * Inverse: given a surface point on the sphere (from sphere center), return the
 * normalized arena coords (fx, fz) in [-1, 1]. Useful for wrapping entities that
 * drift over the cap edge back into range.
 */
export const projectFromSphere = (
  sx: number,
  sy: number,
  sz: number,
  p: SphereParams
): { fx: number; fz: number } => {
  const r = Math.hypot(sx, sy, sz);
  if (r < 1e-9) return { fx: 0, fz: 0 };
  const polar = Math.acos(Math.max(-1, Math.min(1, sy / r)));
  const normP = polar / p.capHalfAngle; // 0..1 within cap
  if (normP < 1e-9) return { fx: 0, fz: 0 };
  const azim = Math.atan2(sz, sx);
  return { fx: Math.cos(azim) * normP, fz: Math.sin(azim) * normP };
};

/** The world-space radius of the arena edge (for spawn ring + boundary). */
export const arenaRadius = (p: SphereParams): number => p.radius * Math.sin(p.capHalfAngle);