// cameraController.ts — Smooth chase + dynamic FOV + trauma shake. Three.js.

import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { shakeTransform, type CameraShakeState } from '../systems/cameraShake.js';
import { projectToScene } from './project.js';
import type { WaveImpulse } from '../math/wave.js';

export class CameraController {
  readonly camera: THREE.PerspectiveCamera;
  private pos = new THREE.Vector3(0, 30, 30);
  private look = new THREE.Vector3();
  private fov = CONFIG.camera.fovBase;
  private shakeState: CameraShakeState;

  constructor(aspect: number, seed: number) {
    this.camera = new THREE.PerspectiveCamera(CONFIG.camera.fovBase, aspect, 0.1, 600);
    this.shakeState = { trauma: 0, seed };
    this.pos.set(0, 34, 30);
    this.camera.position.copy(this.pos);
    this.camera.lookAt(0, 0, 0);
  }

  setAspect(a: number): void {
    this.camera.aspect = a;
    this.camera.updateProjectionMatrix();
  }

  get trauma(): number {
    return this.shakeState.trauma;
  }
  set trauma(v: number) {
    this.shakeState.trauma = v;
  }

  /** Step: chase player projected onto sphere, dynamic FOV from speed, shake. */
  update(
    playerPos: { x: number; y: number; z: number },
    playerVel: { x: number; y: number; z: number },
    impulses: WaveImpulse[],
    time: number,
    dt: number
  ): void {
    const targetPos = new THREE.Vector3();
    projectToScene(playerPos.x, playerPos.z, impulses, targetPos);
    // Camera hovers above-behind the player along the +Z hemisphere tangent.
    const speed = Math.hypot(playerVel.x, playerVel.z);
    const behind = new THREE.Vector3(playerPos.x, 0, playerPos.z).normalize().multiplyScalar(16);
    const wantPos = new THREE.Vector3(
      targetPos.x + behind.x,
      targetPos.y + 34,
      targetPos.z + 30 + behind.z
    );
    // Exponential follow
    const t = 1 - Math.exp(-6 * dt);
    this.pos.lerp(wantPos, t);
    // Dynamic FOV by speed
    const wantFov = THREE.MathUtils.lerp(CONFIG.camera.fovBase, CONFIG.camera.fovBoost, Math.min(1, speed / 26));
    this.fov += (wantFov - this.fov) * (1 - Math.exp(-4 * dt));
    this.camera.fov = this.fov;
    this.camera.updateProjectionMatrix();
    // Look at player
    this.look.lerp(targetPos, t);
    // Shake
    this.shakeState.trauma = this.trauma; // synced from world each frame externally
    const sh = shakeTransform(this.shakeState, time);
    this.camera.position.set(this.pos.x + sh.x, this.pos.y + sh.y, this.pos.z + sh.z);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.look.x + sh.x, this.look.y + sh.y, this.look.z + sh.z);
    this.camera.rotateZ(sh.roll);
  }
}
