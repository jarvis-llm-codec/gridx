// project.ts — Bridge pure sim coords -> Three.js scene. Maps arena XZ onto the
// sphere cap and applies wave Y offset. Consumed by grid mesh + entity renderer.

import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { mapToSphere, type SphereParams } from '../math/sphereMapping.js';
import { waveOffset, type WaveImpulse } from '../math/wave.js';

export const sphereParams: SphereParams = {
  radius: CONFIG.sphereRadius,
  capHalfAngle: CONFIG.capHalfAngle,
};

const tmp = new THREE.Vector3();

/**
 * Project a flat sim position (px,pz) onto the sphere surface with wave Y.
 * Writes into `out` and returns it. Also returns the surface normal.
 */
export const projectToScene = (
  px: number,
  pz: number,
  impulses: WaveImpulse[],
  out: THREE.Vector3
): THREE.Vector3 => {
  // Normalize sim coords to [-1,1] cap coords.
  const arenaR = CONFIG.worldBounds;
  const fx = px / arenaR;
  const fz = pz / arenaR;
  const sp = mapToSphere(fx, fz, sphereParams);
  const wave = waveOffset(impulses, px, pz);
  out.set(sp.x, sp.y + wave, sp.z);
  return out;
};

/** Surface normal at a projected point (for orienting entities to the sphere). */
export const projectNormal = (px: number, pz: number, out: THREE.Vector3): THREE.Vector3 => {
  const arenaR = CONFIG.worldBounds;
  const sp = mapToSphere(px / arenaR, pz / arenaR, sphereParams);
  return out.set(sp.nx, sp.ny, sp.nz);
};

/** Tangent basis at a projected point (forward = -Z tangent, right = X tangent). */
export const projectBasis = (
  px: number,
  pz: number,
  impulses: WaveImpulse[],
  outPos: THREE.Vector3,
  outForward: THREE.Vector3,
  outRight: THREE.Vector3,
  outUp: THREE.Vector3
): void => {
  projectToScene(px, pz, impulses, outPos);
  projectNormal(px, pz, outUp);
  // Forward tangent ~ derivative along +z in cap coords
  const arenaR = CONFIG.worldBounds;
  const sp0 = mapToSphere(px / arenaR, pz / arenaR, sphereParams);
  const sp1 = mapToSphere(px / arenaR, (pz + 0.4) / arenaR, sphereParams);
  outForward.set(sp1.x - sp0.x, sp1.y - sp0.y, sp1.z - sp0.z).normalize();
  outRight.crossVectors(outUp, outForward).normalize();
  outForward.crossVectors(outRight, outUp).normalize();
};

void tmp;