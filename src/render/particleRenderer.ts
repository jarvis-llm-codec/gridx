// particleRenderer.ts — Hyper particle engine as a single InstancedMesh.
// Each particle = one cube instance with per-instance color + fade via opacity.

import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import type { ParticleState } from '../core/types.js';
import { projectToScene } from './project.js';
import type { WaveImpulse } from '../math/wave.js';

export class ParticleRenderer {
  readonly mesh: THREE.InstancedMesh;
  private readonly max: number;
  private dummy = new THREE.Object3D();
  private color = new THREE.Color();
  private impulses: WaveImpulse[] = [];

  constructor(max = CONFIG.particles.maxParticles) {
    this.max = max;
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({
      vertexColors: false,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    // per-instance color
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
  }

  setImpulses(imp: WaveImpulse[]): void {
    this.impulses = imp;
  }

  /** Sync instanced transforms/colors from the sim particle list. */
  update(particles: ParticleState[]): void {
    const n = Math.min(this.max, particles.length);
    const tmp = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const p = particles[i];
      projectToScene(p.pos.x, p.pos.z, this.impulses, tmp);
      this.dummy.position.set(tmp.x, tmp.y + p.pos.y, tmp.z);
      const lifeFrac = Math.max(0, Math.min(1, p.life / p.lifespan));
      const s = p.size * (0.5 + lifeFrac * 0.8);
      this.dummy.scale.set(s, s, s);
      this.dummy.rotation.set(p.life * 2, p.life * 1.3, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      this.color.setHex(p.color);
      // Fade by life: scale color toward black (additive => fade out)
      const fade = lifeFrac;
      this.color.multiplyScalar(fade);
      this.mesh.setColorAt(i, this.color);
    }
    // Hide extras by scaling 0
    for (let i = n; i < this.mesh.count; i++) {
      this.dummy.position.set(0, -9999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.count = Math.max(this.mesh.count, n);
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}