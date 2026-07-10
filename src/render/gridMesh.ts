// gridMesh.ts — The wobbling 3D sphere-cap grid. A wireframe sphere whose verts
// deform each frame by the wave impulses + emissive glow scaled by total energy.

import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { sphereParams } from './project.js';
import { mapToSphere } from '../math/sphereMapping.js';
import { waveOffset, totalEnergy, type WaveImpulse } from '../math/wave.js';
import { PALETTE } from '../core/palette.js';

export class GridMesh {
  readonly mesh: THREE.LineSegments;
  private positions: Float32Array;
  private basePositions: Float32Array; // rest sphere positions (pre-wave)
  private material: THREE.LineBasicMaterial;
  private readonly seg: number;

  constructor() {
    this.seg = 48;
    // Build a parametric grid of lines over the cap in (u,v) normalized coords.
    // Lines along u and along v -> two sets of segments.
    const pts: number[] = [];
    const addLine = (u0: number, v0: number, u1: number, v1: number) => {
      const a = capPoint(u0, v0);
      const b = capPoint(u1, v1);
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    };
    const N = this.seg;
    for (let i = 0; i <= N; i++) {
      const u = (i / N) * 2 - 1;
      for (let j = 0; j < N; j++) {
        const v0 = (j / N) * 2 - 1;
        const v1 = ((j + 1) / N) * 2 - 1;
        addLine(u, v0, u, v1);
      }
    }
    for (let j = 0; j <= N; j++) {
      const v = (j / N) * 2 - 1;
      for (let i = 0; i < N; i++) {
        const u0 = (i / N) * 2 - 1;
        const u1 = ((i + 1) / N) * 2 - 1;
        addLine(u0, v, u1, v);
      }
    }
    this.positions = new Float32Array(pts);
    this.basePositions = new Float32Array(pts);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.material = new THREE.LineBasicMaterial({
      color: PALETTE.gridGlow,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    this.mesh = new THREE.LineSegments(geo, this.material);
  }

  /** Deform verts by wave Y; brighten by total energy. */
  update(impulses: WaveImpulse[]): void {
    const pos = this.positions;
    const base = this.basePositions;
    const energy = Math.min(1.6, totalEnergy(impulses));
    // Each vertex: base pos lies on sphere. Find sim (fx,fz) approx via inverse?
    // We stored base as sphere-surface point; convert to sim coords by inverse map.
    for (let i = 0; i < pos.length; i += 3) {
      const bx = base[i];
      const by = base[i + 1];
      const bz = base[i + 2];
      // Inverse to cap coords (u,v): polar = acos(y/r), azim = atan2(z,x)
      const r = sphereParams.radius;
      const polar = Math.acos(Math.max(-1, Math.min(1, by / r)));
      const normP = polar / sphereParams.capHalfAngle;
      const azim = Math.atan2(bz, bx);
      const fx = Math.cos(azim) * normP;
      const fz = Math.sin(azim) * normP;
      // Sim coords
      const sx = fx * CONFIG.worldBounds;
      const sz = fz * CONFIG.worldBounds;
      const wave = waveOffset(impulses, sx, sz);
      // Move along the normal (which is base/r) by wave
      const inv = 1 / r;
      pos[i] = bx + bx * inv * wave;
      pos[i + 1] = by + by * inv * wave;
      pos[i + 2] = bz + bz * inv * wave;
    }
    (this.mesh.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    this.material.opacity = 0.45 + energy * 0.4;
    this.material.color.setHex(energy > 0.01 ? PALETTE.gridGlow : PALETTE.grid);
  }
}

const capPoint = (u: number, v: number): THREE.Vector3 => {
  // u,v in [-1,1]; clamp magnitude to cap.
  const m = Math.hypot(u, v);
  if (m > 1) {
    u /= m;
    v /= m;
  }
  const sp = mapToSphere(u, v, sphereParams);
  return new THREE.Vector3(sp.x, sp.y, sp.z);
};