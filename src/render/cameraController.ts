import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import type { WaveImpulse } from '../math/wave.js';
import { shakeTransform, type CameraShakeState } from '../systems/cameraShake.js';
import { projectToScene } from './project.js';

export class CameraController {
  readonly camera: THREE.PerspectiveCamera;
  private readonly position = new THREE.Vector3(0, 30, 30);
  private readonly look = new THREE.Vector3();
  private shakeState: CameraShakeState;
  private zoom = 1;
  private zoomTarget = 1;

  constructor(aspect: number, seed: number) {
    this.camera = new THREE.PerspectiveCamera(CONFIG.camera.fovBase, aspect, 0.1, 600);
    this.shakeState = { trauma: 0, seed };
    this.position.set(0, 34, 30);
    this.camera.position.copy(this.position);
    this.camera.lookAt(0, 0, 0);
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  adjustZoom(deltaY: number): void {
    this.zoomTarget = Math.max(
      CONFIG.camera.zoomMin,
      Math.min(CONFIG.camera.zoomMax, this.zoomTarget * Math.exp(deltaY * CONFIG.camera.zoomWheelSpeed)),
    );
  }

  get trauma(): number {
    return this.shakeState.trauma;
  }

  set trauma(value: number) {
    this.shakeState.trauma = value;
  }

  update(
    playerPos: { x: number; y: number; z: number },
    _playerVel: { x: number; y: number; z: number },
    impulses: WaveImpulse[],
    time: number,
    dt: number,
    eventWobble = 0,
  ): void {
    const target = new THREE.Vector3();
    projectToScene(playerPos.x, playerPos.z, impulses, target);
    this.zoom += (this.zoomTarget - this.zoom) * (1 - Math.exp(-CONFIG.camera.zoomLambda * dt));
    const follow = 1 - Math.exp(-6 * dt);
    const desired = new THREE.Vector3(target.x, target.y + 34 * this.zoom, target.z + 30 * this.zoom);
    this.position.lerp(desired, follow);
    this.look.lerp(target, follow);
    const shake = shakeTransform(this.shakeState, time);
    const amount = Math.max(0, Math.min(1, eventWobble));
    const power = amount * amount;
    const wobbleX = Math.sin(time * 18) * CONFIG.camera.eventWobbleShift * power;
    const wobbleY = Math.sin(time * 23 + 1.1) * CONFIG.camera.eventWobbleShift * 0.55 * power;
    const roll = Math.sin(time * 16 + 0.4) * CONFIG.camera.eventWobbleRoll * power;
    this.camera.position.set(
      this.position.x + shake.x + wobbleX,
      this.position.y + shake.y + wobbleY,
      this.position.z + shake.z,
    );
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.look.x + shake.x, this.look.y + shake.y, this.look.z + shake.z);
    this.camera.rotateZ(roll);
    this.camera.fov = CONFIG.camera.fovBase + Math.sin(time * 12.5) * CONFIG.camera.eventWobbleFov * power;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }
}
