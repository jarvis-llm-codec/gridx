// entityRenderer.ts — Renders player + enemies + bullets with high-emissive neon
// geometry. Player is a ship mesh; enemies are kind-keyed shapes; bullets are
// small elongated boxes. Per-kind shape = one entry in the GEOMETRY map.

import * as THREE from 'three';
import { PALETTE, enemyColor, bulletColor } from '../core/palette.js';
import type { BulletState, EnemyState, EnemyKind, PlayerState } from '../core/types.js';
import { projectToScene, projectBasis } from './project.js';
import type { WaveImpulse } from '../math/wave.js';

const makeMat = (hex: number) =>
  new THREE.MeshBasicMaterial({ color: hex, blending: THREE.AdditiveBlending, depthWrite: false });

export class EntityRenderer {
  readonly group: THREE.Group;
  private playerMesh: THREE.Mesh;
  private enemyGeo: Record<EnemyKind, THREE.BufferGeometry>;
  private enemyMats: Record<EnemyKind, THREE.MeshBasicMaterial>;
  private bulletGeo: THREE.BufferGeometry;
  private bulletMat: THREE.MeshBasicMaterial;
  // Reusable instanced meshes per enemy kind (capped counts)
  private enemyInst: Record<EnemyKind, THREE.InstancedMesh>;
  private bulletInst: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();
  private impulses: WaveImpulse[] = [];

  constructor() {
    this.group = new THREE.Group();
    // Player ship: a dart-like shape (octahedron stretched).
    const playerGeo = new THREE.OctahedronGeometry(0.7, 0);
    playerGeo.scale(0.6, 0.5, 1.4);
    this.playerMesh = new THREE.Mesh(playerGeo, makeMat(PALETTE.player));
    this.group.add(this.playerMesh);

    this.enemyGeo = {
      grunt: new THREE.TetrahedronGeometry(0.8, 0),
      wanderer: new THREE.OctahedronGeometry(0.9, 0),
      singularity: new THREE.IcosahedronGeometry(1.4, 0),
      dodger: new THREE.ConeGeometry(0.6, 1.4, 6),
    };
    this.enemyMats = {
      grunt: makeMat(enemyColor('grunt')),
      wanderer: makeMat(enemyColor('wanderer')),
      singularity: makeMat(enemyColor('singularity')),
      dodger: makeMat(enemyColor('dodger')),
    };
    const cap = 80;
    this.enemyInst = {
      grunt: new THREE.InstancedMesh(this.enemyGeo.grunt, this.enemyMats.grunt, cap),
      wanderer: new THREE.InstancedMesh(this.enemyGeo.wanderer, this.enemyMats.wanderer, cap),
      singularity: new THREE.InstancedMesh(this.enemyGeo.singularity, this.enemyMats.singularity, 30),
      dodger: new THREE.InstancedMesh(this.enemyGeo.dodger, this.enemyMats.dodger, cap),
    };
    for (const k of Object.keys(this.enemyInst) as EnemyKind[]) {
      this.enemyInst[k].instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.enemyInst[k].frustumCulled = false;
      this.enemyInst[k].count = 0;
      this.group.add(this.enemyInst[k]);
    }
    this.bulletGeo = new THREE.CapsuleGeometry(0.18, 0.7, 4, 6);
    this.bulletGeo.rotateX(Math.PI / 2);
    this.bulletMat = makeMat(bulletColor('standard'));
    this.bulletInst = new THREE.InstancedMesh(this.bulletGeo, this.bulletMat, 512);
    this.bulletInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bulletInst.frustumCulled = false;
    this.bulletInst.count = 0;
    this.group.add(this.bulletInst);
  }

  setImpulses(imp: WaveImpulse[]): void {
    this.impulses = imp;
  }

  update(player: PlayerState, enemies: EnemyState[], bullets: BulletState[], time: number): void {
    const pos = new THREE.Vector3();
    const fwd = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    // Player
    projectBasis(player.pos.x, player.pos.z, this.impulses, pos, fwd, right, up);
    this.playerMesh.position.copy(pos);
    // Orient ship forward toward aim (aim is in sim XZ; map to scene tangent)
    const aimScene = new THREE.Vector3();
    projectToScene(player.pos.x + player.aim.x, player.pos.z + player.aim.z, this.impulses, aimScene);
    fwd.subVectors(aimScene, pos).normalize();
    const m = new THREE.Matrix4();
    m.lookAt(new THREE.Vector3(), fwd, up);
    this.playerMesh.quaternion.setFromRotationMatrix(m);
    // Pulse on invuln
    const mat = this.playerMesh.material as THREE.MeshBasicMaterial;
    mat.color.setHex(player.invuln > 0 ? 0xffffff : PALETTE.player);

    // Enemies: bucket by kind, set instance matrices.
    const counts: Record<EnemyKind, number> = { grunt: 0, wanderer: 0, singularity: 0, dodger: 0 };
    for (const e of enemies) {
      const i = counts[e.kind]++;
      projectBasis(e.pos.x, e.pos.z, this.impulses, pos, fwd, right, up);
      this.dummy.position.copy(pos);
      const s = e.kind === 'singularity' ? (e.critical ? 1 + Math.sin(time * 20) * 0.2 : 1) : 1;
      this.dummy.scale.setScalar(s);
      // Spin enemies for life
      this.dummy.rotation.set(time * 1.5, time * 1.2, 0);
      this.dummy.updateMatrix();
      this.enemyInst[e.kind].setMatrixAt(i, this.dummy.matrix);
    }
    for (const k of Object.keys(this.enemyInst) as EnemyKind[]) {
      this.enemyInst[k].count = counts[k];
      this.enemyInst[k].instanceMatrix.needsUpdate = true;
    }

    // Bullets
    let bc = 0;
    for (const b of bullets) {
      if (b.owner !== 'player' || b.spent) continue;
      projectBasis(b.pos.x, b.pos.z, this.impulses, pos, fwd, right, up);
      this.dummy.position.copy(pos);
      // Orient bullet along velocity
      const velScene = new THREE.Vector3(b.vel.x, 0, b.vel.z);
      const aimMat = new THREE.Matrix4();
      aimMat.lookAt(new THREE.Vector3(), velScene.clone().normalize(), up);
      this.dummy.quaternion.setFromRotationMatrix(aimMat);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();
      this.bulletInst.setMatrixAt(bc++, this.dummy.matrix);
    }
    this.bulletInst.count = bc;
    this.bulletInst.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.playerMesh.geometry.dispose();
    (this.playerMesh.material as THREE.Material).dispose();
    for (const k of Object.keys(this.enemyGeo) as EnemyKind[]) {
      this.enemyGeo[k].dispose();
      this.enemyMats[k].dispose();
    }
    this.bulletGeo.dispose();
    this.bulletMat.dispose();
  }
}