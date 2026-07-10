import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import type { ParticleState } from '../core/types.js';
import { mapToSphere } from '../math/sphereMapping.js';
import type { WaveImpulse } from '../math/wave.js';
import { sphereParams } from './project.js';

export class ParticleRenderer {
  readonly mesh: THREE.InstancedMesh;
  private readonly max: number;
  private readonly dummy = new THREE.Object3D();
  private readonly color = new THREE.Color();

  constructor(max = CONFIG.particles.maxParticles) {
    this.max = max;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      vertexColors: false,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.mesh = new THREE.InstancedMesh(geometry, material, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
  }

  setImpulses(impulses: WaveImpulse[]): void {
    void impulses;
  }

  update(particles: ParticleState[]): void {
    const count = Math.min(this.max, particles.length);
    for (let index = 0; index < count; index += 1) {
      const particle = particles[index];
      const point = mapToSphere(
        particle.pos.x / CONFIG.worldBounds,
        particle.pos.z / CONFIG.worldBounds,
        sphereParams,
      );
      this.dummy.position.set(point.x, point.y + particle.pos.y, point.z);
      const life = Math.max(0, Math.min(1, particle.life / particle.lifespan));
      const size = particle.size * (0.4 + life * 1.35);
      this.dummy.scale.set(size, size, size);
      this.dummy.rotation.set(particle.life * 3.2, particle.life * 2.1, particle.life * 1.4);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(index, this.dummy.matrix);
      this.color.setHex(particle.color).multiplyScalar(0.5 + life * 1.6);
      this.mesh.setColorAt(index, this.color);
    }
    this.mesh.count = count;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}
