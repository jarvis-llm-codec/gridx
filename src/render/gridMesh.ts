import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { PALETTE } from '../core/palette.js';
import { mapToSphere } from '../math/sphereMapping.js';
import { totalEnergy, waveOffset, type WaveImpulse } from '../math/wave.js';
import { sphereParams } from './project.js';

export class GridMesh {
  readonly mesh: THREE.LineSegments;
  private readonly positions: Float32Array;
  private readonly basePositions: Float32Array;
  private readonly worldX: Float32Array;
  private readonly worldZ: Float32Array;
  private readonly material: THREE.LineBasicMaterial;

  constructor() {
    const segmentCount = 48;
    const points: number[] = [];
    const addLine = (x0: number, z0: number, x1: number, z1: number) => {
      const first = capPoint(x0, z0);
      const second = capPoint(x1, z1);
      points.push(first.x, first.y, first.z, second.x, second.y, second.z);
    };
    for (let row = 0; row <= segmentCount; row += 1) {
      const x = (row / segmentCount) * 2 - 1;
      for (let column = 0; column < segmentCount; column += 1) {
        addLine(x, (column / segmentCount) * 2 - 1, x, ((column + 1) / segmentCount) * 2 - 1);
      }
    }
    for (let column = 0; column <= segmentCount; column += 1) {
      const z = (column / segmentCount) * 2 - 1;
      for (let row = 0; row < segmentCount; row += 1) {
        addLine((row / segmentCount) * 2 - 1, z, ((row + 1) / segmentCount) * 2 - 1, z);
      }
    }
    this.positions = new Float32Array(points);
    this.basePositions = new Float32Array(points);
    const vertexCount = this.basePositions.length / 3;
    this.worldX = new Float32Array(vertexCount);
    this.worldZ = new Float32Array(vertexCount);
    for (let offset = 0, vertex = 0; offset < this.basePositions.length; offset += 3, vertex += 1) {
      const x = this.basePositions[offset];
      const y = this.basePositions[offset + 1];
      const z = this.basePositions[offset + 2];
      const radius = Math.acos(Math.max(-1, Math.min(1, y / sphereParams.radius))) / sphereParams.capHalfAngle;
      const azimuth = Math.atan2(z, x);
      this.worldX[vertex] = Math.cos(azimuth) * radius * CONFIG.worldBounds;
      this.worldZ[vertex] = Math.sin(azimuth) * radius * CONFIG.worldBounds;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.material = new THREE.LineBasicMaterial({
      color: PALETTE.gridGlow,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    this.mesh = new THREE.LineSegments(geometry, this.material);
  }

  update(impulses: WaveImpulse[]): void {
    const inverseRadius = 1 / sphereParams.radius;
    const energy = Math.min(1.6, totalEnergy(impulses));
    for (let offset = 0, vertex = 0; offset < this.positions.length; offset += 3, vertex += 1) {
      const x = this.basePositions[offset];
      const y = this.basePositions[offset + 1];
      const z = this.basePositions[offset + 2];
      const displacement = waveOffset(impulses, this.worldX[vertex], this.worldZ[vertex]);
      this.positions[offset] = x + x * inverseRadius * displacement;
      this.positions[offset + 1] = y + y * inverseRadius * displacement;
      this.positions[offset + 2] = z + z * inverseRadius * displacement;
    }
    (this.mesh.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    this.material.opacity = 0.45 + energy * 0.4;
    this.material.color.setHex(energy > 0.01 ? PALETTE.gridGlow : PALETTE.grid);
  }
}

const capPoint = (x: number, z: number): THREE.Vector3 => {
  const length = Math.hypot(x, z);
  if (length > 1) {
    x /= length;
    z /= length;
  }
  const point = mapToSphere(x, z, sphereParams);
  return new THREE.Vector3(point.x, point.y, point.z);
};
