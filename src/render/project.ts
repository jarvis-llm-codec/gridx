import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { mapToSphere, type SphereParams } from '../math/sphereMapping.js';
import { waveOffset, type WaveImpulse } from '../math/wave.js';

export const sphereParams: SphereParams = {
  radius: CONFIG.sphereRadius,
  capHalfAngle: CONFIG.capHalfAngle,
};

export const projectToScene = (
  x: number,
  z: number,
  impulses: WaveImpulse[],
  out: THREE.Vector3,
): THREE.Vector3 => {
  const point = mapToSphere(x / CONFIG.worldBounds, z / CONFIG.worldBounds, sphereParams);
  const displacement = waveOffset(impulses, x, z, true);
  return out.set(
    point.x + point.nx * displacement,
    point.y + point.ny * displacement,
    point.z + point.nz * displacement,
  );
};

export const projectNormal = (x: number, z: number, out: THREE.Vector3): THREE.Vector3 => {
  const point = mapToSphere(x / CONFIG.worldBounds, z / CONFIG.worldBounds, sphereParams);
  return out.set(point.nx, point.ny, point.nz);
};

export const projectBasis = (
  x: number,
  z: number,
  impulses: WaveImpulse[],
  outPosition: THREE.Vector3,
  outForward: THREE.Vector3,
  outRight: THREE.Vector3,
  outUp: THREE.Vector3,
): void => {
  projectToScene(x, z, impulses, outPosition);
  projectNormal(x, z, outUp);
  const current = mapToSphere(x / CONFIG.worldBounds, z / CONFIG.worldBounds, sphereParams);
  const ahead = mapToSphere(x / CONFIG.worldBounds, (z + 0.4) / CONFIG.worldBounds, sphereParams);
  outForward.set(ahead.x - current.x, ahead.y - current.y, ahead.z - current.z).normalize();
  outRight.crossVectors(outUp, outForward).normalize();
  outForward.crossVectors(outRight, outUp).normalize();
};
