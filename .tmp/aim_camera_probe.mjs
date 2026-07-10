import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';

const html = readFileSync('geometry_wars_3d_glm5_2.html', 'utf8');
assert(html.includes('setMouseAimResolver((x, y, playerPos) => this.renderer.screenToArenaAim(x, y, playerPos))'));
assert(html.includes('this.input.snapshot(this.world.player.pos)'));
assert(html.includes('new R(ndcX, -ndcY, 0.5).unproject(this.camera.camera)'));
assert(html.includes('this.eventGroup.worldToLocal(worldOrigin.clone())'));
assert(html.includes('this.renderer.domElement.addEventListener("wheel", this.onWheel, { passive: !1 })'));
assert(html.includes('zoomMin: 0.78') && html.includes('zoomMax: 1.38'));
assert(!html.includes('new R(e.x, 0, e.z).normalize().multiplyScalar(16)'), 'player-radial camera offset returned');
assert(html.includes('shakeGain = { grunt: 0, wanderer: 0.05, dodger: 0.08, singularity: 0.62 }'));
assert(html.includes('id="damage-vignette"') && html.includes('this.flashDamage()'));
assert(html.includes('enemyBulletTrailInst') && html.includes('itemRingInst'));

const radius = 60;
const capHalfAngle = 0.448;
const worldBounds = 26;
const mapToSphere = (x, z) => {
  const radial = Math.min(1, Math.hypot(x / worldBounds, z / worldBounds));
  const angle = radial * capHalfAngle;
  const azimuth = Math.atan2(z, x);
  return new THREE.Vector3(
    radius * Math.sin(angle) * Math.cos(azimuth),
    radius * Math.cos(angle),
    radius * Math.sin(angle) * Math.sin(azimuth),
  );
};
const aimFromNdc = (ndcX, ndcY, player, camera, group) => {
  camera.updateMatrixWorld();
  group.updateWorldMatrix(true, false);
  const worldOrigin = camera.position.clone();
  const worldPoint = new THREE.Vector3(ndcX, -ndcY, 0.5).unproject(camera);
  const worldDir = worldPoint.sub(worldOrigin).normalize();
  const localOrigin = group.worldToLocal(worldOrigin.clone());
  const localPoint = group.worldToLocal(worldOrigin.clone().add(worldDir));
  const localDir = localPoint.sub(localOrigin).normalize();
  const b = localOrigin.dot(localDir);
  const c = localOrigin.lengthSq() - radius * radius;
  const disc = b * b - c;
  assert(disc >= 0, 'ray missed sphere');
  const root = Math.sqrt(disc);
  const near = -b - root;
  const far = -b + root;
  const distance = near > 0 ? near : far;
  assert(distance > 0);
  const hit = localOrigin.addScaledVector(localDir, distance).normalize();
  const theta = Math.acos(THREE.MathUtils.clamp(hit.y, -1, 1));
  const radial = Math.min(1, theta / capHalfAngle) * worldBounds;
  const azimuth = Math.atan2(hit.z, hit.x);
  const target = { x: Math.cos(azimuth) * radial, z: Math.sin(azimuth) * radial };
  const dx = target.x - player.x;
  const dz = target.z - player.z;
  const len = Math.hypot(dx, dz);
  return { x: dx / len, z: dz / len, target };
};

const group = new THREE.Group();
group.position.set(0.18, -0.09, 0.04);
group.rotation.z = 0.012;
group.scale.setScalar(1.015);
group.updateWorldMatrix(true, false);
const player = { x: -7.25, z: 4.5 };
const playerWorld = group.localToWorld(mapToSphere(player.x, player.z));
const camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.1, 600);
camera.position.copy(playerWorld).add(new THREE.Vector3(0, 34, 30));
camera.lookAt(playerWorld);
camera.updateProjectionMatrix();
camera.updateMatrixWorld();

for (const target of [
  { x: 8, z: -5 },
  { x: 18, z: 9 },
  { x: -15, z: -8 },
]) {
  const targetWorld = group.localToWorld(mapToSphere(target.x, target.z));
  const projected = targetWorld.clone().project(camera);
  const recovered = aimFromNdc(projected.x, -projected.y, player, camera, group);
  assert(Math.abs(recovered.target.x - target.x) < 1e-6, `x round-trip failed: ${JSON.stringify({ target, recovered })}`);
  assert(Math.abs(recovered.target.z - target.z) < 1e-6, `z round-trip failed: ${JSON.stringify({ target, recovered })}`);
  const expected = new THREE.Vector2(target.x - player.x, target.z - player.z).normalize();
  assert(Math.abs(recovered.x - expected.x) < 1e-6);
  assert(Math.abs(recovered.z - expected.y) < 1e-6);
}

console.log('AIM_CAMERA_ROUNDTRIP_OK fixedOffset zoom=[0.78,1.38]');
