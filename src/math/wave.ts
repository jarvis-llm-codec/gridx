// wave.ts — Pure wave-distortion math for the 3D grid.
// The simulation emits "energy" impulses at explosions/spawns; the grid sums
// sine/cosine waves radiating from each impulse, decaying over time + distance.

export interface WaveImpulse {
  /** Origin on the XZ plane. */
  x: number;
  z: number;
  /** Strength: affects amplitude. */
  strength: number;
  /** Age in seconds (counts up). */
  age: number;
  /** Lifespan in seconds; amplitude -> 0 as age -> lifespan. */
  lifespan: number;
  /** Wavelength (units per radial cycle). */
  wavelength: number;
  /** Wave propagation speed (units/sec). */
  speed: number;
}

export const createImpulse = (
  x: number,
  z: number,
  strength: number,
  opts?: Partial<Omit<WaveImpulse, 'x' | 'z' | 'strength' | 'age'>>
): WaveImpulse => ({
  x,
  z,
  strength,
  age: 0,
  lifespan: opts?.lifespan ?? 2.4,
  wavelength: opts?.wavelength ?? 14,
  speed: opts?.speed ?? 60,
});

/** Advance all impulses by dt and prune dead ones (returns new array). */
export const advanceImpulses = (impulses: WaveImpulse[], dt: number): WaveImpulse[] => {
  const out: WaveImpulse[] = [];
  for (const imp of impulses) {
    const age = imp.age + dt;
    if (age >= imp.lifespan) continue;
    out.push({ ...imp, age });
  }
  return out;
};

/** Current amplitude (0..strength) of a single impulse, decaying with age. */
export const impulseAmplitude = (imp: WaveImpulse): number => {
  const life = imp.age / imp.lifespan; // 0..1
  const decay = Math.max(0, 1 - life);
  return imp.strength * decay * decay; // ease-out quad
};

/**
 * Vertical (Y) wave offset at a point (px, pz) given active impulses.
 * Each impulse contributes a sine ring expanding outward at `speed`,
 * amplitude scaled by distance falloff and age decay.
 */
export const waveOffset = (impulses: WaveImpulse[], px: number, pz: number): number => {
  let y = 0;
  for (const imp of impulses) {
    const dx = px - imp.x;
    const dz = pz - imp.z;
    const dist = Math.hypot(dx, dz);
    const front = imp.age * imp.speed; // wavefront radius
    const ringDist = dist - front;
    if (Math.abs(ringDist) > imp.wavelength * 2) continue; // outside ring band
    const phase = (ringDist / imp.wavelength) * Math.PI * 2;
    const ringFade = Math.exp(-(ringDist * ringDist) / (2 * imp.wavelength * imp.wavelength));
    const amp = impulseAmplitude(imp) * ringFade;
    y += Math.sin(phase) * amp;
  }
  return y;
};

/** Aggregated energy scalar (for grid emissive brightness), 0..1+. */
export const totalEnergy = (impulses: WaveImpulse[]): number => {
  let e = 0;
  for (const imp of impulses) e += impulseAmplitude(imp);
  return e;
};