import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { PALETTE, bulletColor, enemyColor } from '../core/palette.js';
import type {
  BossState,
  BulletState,
  EnemyKind,
  EnemyState,
  ItemState,
  PlayerState,
  WeaponEffect,
} from '../core/types.js';
import type { WaveImpulse } from '../math/wave.js';
import { WEAPON_COLORS } from '../sim/weapons.js';
import { projectBasis, projectToScene } from './project.js';

const makeMaterial = (color: number, opacity = 1) => new THREE.MeshBasicMaterial({
  color,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: opacity < 1,
  opacity,
});

interface BossVisual {
  pos: { x: number; z: number };
  radius: number;
  bossType: BossState['bossType'];
  phase: number;
  hp: number;
  maxHp: number;
  fireCooldown: number;
  fireInterval: number;
  hitFlash: number;
}

export class EntityRenderer {
  readonly group = new THREE.Group();
  impulses: WaveImpulse[] = [];
  private readonly playerMesh: THREE.Mesh;
  private readonly enemyGeometry: Record<EnemyKind, THREE.BufferGeometry>;
  private readonly enemyMaterials: Record<EnemyKind, THREE.MeshBasicMaterial>;
  private readonly enemyInstances: Record<EnemyKind, THREE.InstancedMesh>;
  private readonly bulletGeometry: THREE.BufferGeometry;
  private readonly bulletMaterial: THREE.MeshBasicMaterial;
  private readonly bulletInstances: THREE.InstancedMesh;
  private readonly enemyBulletGeometry: THREE.BufferGeometry;
  private readonly enemyBulletMaterial: THREE.MeshBasicMaterial;
  private readonly enemyBulletTrailMaterial: THREE.MeshBasicMaterial;
  private readonly enemyBulletInstances: THREE.InstancedMesh;
  private readonly enemyBulletTrailInstances: THREE.InstancedMesh;
  private readonly effectGeometry: THREE.BufferGeometry;
  private readonly effectMaterial: THREE.MeshBasicMaterial;
  private readonly effectInstances: THREE.InstancedMesh;
  private readonly itemGeometry: THREE.BufferGeometry;
  private readonly itemMaterial: THREE.MeshBasicMaterial;
  private readonly itemInstances: THREE.InstancedMesh;
  private readonly itemRingGeometry: THREE.BufferGeometry;
  private readonly itemRingMaterial: THREE.MeshBasicMaterial;
  private readonly itemRingInstances: THREE.InstancedMesh;
  private readonly bossGroup = new THREE.Group();
  private readonly bossParts: THREE.Mesh[] = [];
  private readonly bossArmorMaterial = makeMaterial(0xffffff);
  private readonly bossJointMaterial = makeMaterial(0x35134d, 0.82);
  private readonly bossCoreMaterial = makeMaterial(0xfff1a8);
  private readonly dummy = new THREE.Object3D();
  private readonly color = new THREE.Color();
  private lastBossVisual: BossVisual | null = null;

  constructor() {
    const playerGeometry = new THREE.OctahedronGeometry(0.7, 0);
    playerGeometry.scale(0.6, 0.5, 1.4);
    this.playerMesh = new THREE.Mesh(playerGeometry, makeMaterial(PALETTE.player));
    this.group.add(this.playerMesh);

    this.enemyGeometry = {
      grunt: new THREE.TetrahedronGeometry(0.8, 0),
      wanderer: new THREE.OctahedronGeometry(0.9, 0),
      singularity: new THREE.IcosahedronGeometry(1.4, 0),
      dodger: new THREE.ConeGeometry(0.6, 1.4, 6),
    };
    this.enemyMaterials = {
      grunt: makeMaterial(enemyColor('grunt')),
      wanderer: makeMaterial(enemyColor('wanderer')),
      singularity: makeMaterial(enemyColor('singularity')),
      dodger: makeMaterial(enemyColor('dodger')),
    };
    this.enemyInstances = {
      grunt: this.makeInstances(this.enemyGeometry.grunt, this.enemyMaterials.grunt, 80),
      wanderer: this.makeInstances(this.enemyGeometry.wanderer, this.enemyMaterials.wanderer, 80),
      singularity: this.makeInstances(this.enemyGeometry.singularity, this.enemyMaterials.singularity, 30),
      dodger: this.makeInstances(this.enemyGeometry.dodger, this.enemyMaterials.dodger, 80),
    };
    for (const kind of Object.keys(this.enemyInstances) as EnemyKind[]) this.group.add(this.enemyInstances[kind]);

    this.bulletGeometry = new THREE.CapsuleGeometry(0.18, 0.7, 4, 6);
    this.bulletGeometry.rotateX(Math.PI / 2);
    this.bulletMaterial = makeMaterial(0xffffff);
    this.bulletInstances = this.makeInstances(this.bulletGeometry, this.bulletMaterial, 512);
    this.group.add(this.bulletInstances);

    this.enemyBulletGeometry = new THREE.CapsuleGeometry(0.24, 0.6, 5, 6);
    this.enemyBulletGeometry.rotateX(Math.PI / 2);
    this.enemyBulletMaterial = makeMaterial(0xff243f);
    this.enemyBulletTrailMaterial = makeMaterial(0xff6a24, 0.28);
    this.enemyBulletInstances = this.makeInstances(this.enemyBulletGeometry, this.enemyBulletMaterial, 512);
    this.enemyBulletTrailInstances = this.makeInstances(this.enemyBulletGeometry, this.enemyBulletTrailMaterial, 512);
    this.group.add(this.enemyBulletTrailInstances, this.enemyBulletInstances);

    this.effectGeometry = new THREE.CapsuleGeometry(0.055, 0.055, 1, 6);
    this.effectMaterial = makeMaterial(0xffffff, 0.88);
    this.effectInstances = this.makeInstances(this.effectGeometry, this.effectMaterial, 1024);
    this.group.add(this.effectInstances);

    this.itemGeometry = new THREE.OctahedronGeometry(0.5, 0);
    this.itemMaterial = makeMaterial(0xffffff);
    this.itemInstances = this.makeInstances(this.itemGeometry, this.itemMaterial, 128);
    this.itemRingGeometry = new THREE.CylinderGeometry(0.72, 0.72, 0.08, 16, 1, true);
    this.itemRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.72,
    });
    this.itemRingInstances = this.makeInstances(this.itemRingGeometry, this.itemRingMaterial, 128);
    this.group.add(this.itemInstances, this.itemRingInstances);

    this.buildBoss();
    this.bossGroup.visible = false;
    this.group.add(this.bossGroup);
  }

  private makeInstances(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    count: number,
  ): THREE.InstancedMesh {
    const instances = new THREE.InstancedMesh(geometry, material, count);
    instances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instances.frustumCulled = false;
    instances.count = 0;
    return instances;
  }

  private addBossPart(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: [number, number, number],
    scale: [number, number, number],
  ): THREE.Mesh {
    const part = new THREE.Mesh(geometry, material);
    part.position.set(...position);
    part.scale.set(...scale);
    part.userData.basePosition = position;
    part.userData.baseScale = scale;
    this.bossGroup.add(part);
    this.bossParts.push(part);
    return part;
  }

  private buildBoss(): void {
    const armor = new THREE.TetrahedronGeometry(1, 0);
    const joint = new THREE.IcosahedronGeometry(1, 0);
    const head = new THREE.OctahedronGeometry(1, 0);
    this.addBossPart(armor, this.bossArmorMaterial, [0, 1.25, 0], [0.86, 1.18, 0.72]);
    this.addBossPart(joint, this.bossCoreMaterial, [0, 1.28, 0.72], [0.42, 0.42, 0.42]);
    this.addBossPart(head, this.bossArmorMaterial, [0, 2.58, 0], [0.58, 0.62, 0.58]);
    this.addBossPart(armor, this.bossArmorMaterial, [-1.08, 1.82, 0], [0.64, 0.56, 0.68]);
    this.addBossPart(armor, this.bossArmorMaterial, [1.08, 1.82, 0], [0.64, 0.56, 0.68]);
    this.addBossPart(joint, this.bossJointMaterial, [-1.38, 1.02, 0], [0.38, 0.72, 0.38]);
    this.addBossPart(joint, this.bossJointMaterial, [1.38, 1.02, 0], [0.38, 0.72, 0.38]);
    this.addBossPart(armor, this.bossArmorMaterial, [-1.45, 0.22, 0.06], [0.58, 0.52, 0.62]);
    this.addBossPart(armor, this.bossArmorMaterial, [1.45, 0.22, 0.06], [0.58, 0.52, 0.62]);
  }

  setImpulses(impulses: WaveImpulse[]): void {
    this.impulses = impulses;
  }

  update(
    player: PlayerState,
    enemies: EnemyState[],
    bullets: BulletState[],
    time: number,
    items: ItemState[] = [],
    boss: BossState | null = null,
    eventWobble = 0,
    weaponEffects: WeaponEffect[] = [],
  ): void {
    const position = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    projectBasis(player.pos.x, player.pos.z, this.impulses, position, forward, right, up);
    this.playerMesh.position.copy(position);
    const aimPosition = new THREE.Vector3();
    projectToScene(player.pos.x + player.aim.x, player.pos.z + player.aim.z, this.impulses, aimPosition);
    forward.subVectors(aimPosition, position).normalize();
    const playerMatrix = new THREE.Matrix4().lookAt(new THREE.Vector3(), forward, up);
    this.playerMesh.quaternion.setFromRotationMatrix(playerMatrix);
    (this.playerMesh.material as THREE.MeshBasicMaterial).color.setHex(player.invuln > 0 ? 0xffffff : PALETTE.player);

    const enemyCounts: Record<EnemyKind, number> = { grunt: 0, wanderer: 0, singularity: 0, dodger: 0 };
    for (const enemy of enemies) {
      const index = enemyCounts[enemy.kind]++;
      projectBasis(enemy.pos.x, enemy.pos.z, this.impulses, position, forward, right, up);
      this.dummy.position.copy(position);
      const critical = enemy.kind === 'singularity' && enemy.critical ? 1 + Math.sin(time * 20) * 0.2 : 1;
      const hit = (enemy.hitFlash || 0) > 0 ? 1 + Math.sin(((enemy.hitFlash || 0) / 0.14) * Math.PI) * 0.16 : 1;
      this.dummy.scale.setScalar(critical * hit);
      this.dummy.rotation.set(time * 1.5, time * 1.2, 0);
      this.dummy.updateMatrix();
      this.enemyInstances[enemy.kind].setMatrixAt(index, this.dummy.matrix);
      this.color.setHex((enemy.hitFlash || 0) > 0 ? 0xff8a33 : enemyColor(enemy.kind));
      this.enemyInstances[enemy.kind].setColorAt(index, this.color);
    }
    for (const kind of Object.keys(this.enemyInstances) as EnemyKind[]) {
      this.enemyInstances[kind].count = enemyCounts[kind];
      this.enemyInstances[kind].instanceMatrix.needsUpdate = true;
      if (this.enemyInstances[kind].instanceColor) this.enemyInstances[kind].instanceColor!.needsUpdate = true;
    }

    let playerBulletCount = 0;
    let enemyBulletCount = 0;
    for (const bullet of bullets) {
      if (bullet.spent) continue;
      projectBasis(bullet.pos.x, bullet.pos.z, this.impulses, position, forward, right, up);
      this.dummy.position.copy(position);
      const velocity = new THREE.Vector3(bullet.vel.x, 0, bullet.vel.z).normalize();
      this.dummy.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(), velocity, up));
      if (bullet.owner === 'player') {
        this.dummy.scale.set(
          bullet.kind === 'missile' ? 1.45 : bullet.kind === 'spread' ? 0.72 : 1,
          bullet.kind === 'missile' ? 1.25 : 1,
          bullet.kind === 'laser' ? 3.2 : bullet.kind === 'missile' ? 1.8 : 1,
        );
        this.dummy.updateMatrix();
        this.bulletInstances.setMatrixAt(playerBulletCount, this.dummy.matrix);
        this.color.setHex(bulletColor(bullet.kind));
        this.bulletInstances.setColorAt(playerBulletCount++, this.color);
      } else {
        this.dummy.scale.set(0.72, 0.72, 1.15);
        this.dummy.updateMatrix();
        this.enemyBulletInstances.setMatrixAt(enemyBulletCount, this.dummy.matrix);
        this.dummy.scale.set(1.35, 1.35, 1.75);
        this.dummy.updateMatrix();
        this.enemyBulletTrailInstances.setMatrixAt(enemyBulletCount++, this.dummy.matrix);
      }
    }
    this.bulletInstances.count = playerBulletCount;
    this.bulletInstances.instanceMatrix.needsUpdate = true;
    if (this.bulletInstances.instanceColor) this.bulletInstances.instanceColor.needsUpdate = true;
    this.enemyBulletInstances.count = enemyBulletCount;
    this.enemyBulletTrailInstances.count = enemyBulletCount;
    this.enemyBulletInstances.instanceMatrix.needsUpdate = true;
    this.enemyBulletTrailInstances.instanceMatrix.needsUpdate = true;

    this.updateEffects(bullets, weaponEffects, position, forward, right, up);
    this.updateItems(items, time, position, forward, right, up);
    this.updateBoss(boss, eventWobble, time, position, forward, right, up);
  }

  private updateEffects(
    bullets: BulletState[],
    effects: WeaponEffect[],
    first: THREE.Vector3,
    forward: THREE.Vector3,
    right: THREE.Vector3,
    up: THREE.Vector3,
  ): void {
    let count = 0;
    const second = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const vertical = new THREE.Vector3(0, 1, 0);
    const draw = (
      from: { x: number; z: number },
      to: { x: number; z: number },
      color: number,
      width: number,
      fade = 1,
      height = 0,
    ) => {
      if (count >= 1024) return;
      projectBasis(from.x, from.z, this.impulses, first, forward, right, up);
      projectBasis(to.x, to.z, this.impulses, second, forward, right, up);
      first.y += height;
      second.y += height;
      direction.subVectors(second, first);
      const length = direction.length();
      if (length < 0.001) return;
      this.dummy.position.copy(first).add(second).multiplyScalar(0.5);
      this.dummy.quaternion.setFromUnitVectors(vertical, direction.normalize());
      this.dummy.scale.set(width, length, width);
      this.dummy.updateMatrix();
      this.effectInstances.setMatrixAt(count, this.dummy.matrix);
      this.color.setHex(color).multiplyScalar(Math.max(0.12, fade));
      this.effectInstances.setColorAt(count++, this.color);
    };
    for (const bullet of bullets) {
      if (bullet.owner !== 'player' || bullet.spent || bullet.kind !== 'missile') continue;
      draw(
        { x: bullet.prevPos.x - bullet.vel.x * 0.018, z: bullet.prevPos.z - bullet.vel.z * 0.018 },
        bullet.pos,
        WEAPON_COLORS.missile,
        1.5,
        0.88,
      );
    }
    for (const effect of effects) {
      const fade = effect.life / Math.max(0.001, effect.maxLife || effect.life);
      if (effect.kind === 'lightning') {
        const style = effect.style || 'bolt';
        const height = effect.height ?? 0.72;
        draw(effect.from, effect.to, 0x246bff, style === 'bolt' ? 5.6 : style === 'branch' ? 3.35 : 4.3, fade * 0.5, height);
        draw(effect.from, effect.to, 0x69dcff, style === 'bolt' ? 3.1 : style === 'branch' ? 1.85 : 2.45, Math.max(0.42, fade), height + 0.018);
        draw(effect.from, effect.to, 0xffffff, style === 'bolt' ? 1.22 : style === 'branch' ? 0.72 : 1.02, Math.max(0.72, fade), height + 0.036);
      } else {
        draw(effect.from, effect.to, effect.kind === 'laser' ? WEAPON_COLORS.laser : WEAPON_COLORS.missile, effect.kind === 'laser' ? 1.25 : 1.05, fade);
      }
    }
    this.effectInstances.count = count;
    this.effectInstances.instanceMatrix.needsUpdate = true;
    if (this.effectInstances.instanceColor) this.effectInstances.instanceColor.needsUpdate = true;
  }

  private updateItems(
    items: ItemState[],
    time: number,
    position: THREE.Vector3,
    forward: THREE.Vector3,
    right: THREE.Vector3,
    up: THREE.Vector3,
  ): void {
    let count = 0;
    for (const item of items) {
      const bob = Math.sin(item.bob) * 0.4 + 0.6;
      projectBasis(item.pos.x, item.pos.z, this.impulses, position, forward, right, up);
      this.dummy.position.set(position.x, position.y + 0.5 + bob * 0.4, position.z);
      this.dummy.rotation.set(time * 1.5 + item.bob, time * 1.1, 0);
      this.dummy.scale.setScalar(0.7 + bob * 0.25);
      this.dummy.updateMatrix();
      this.itemInstances.setMatrixAt(count, this.dummy.matrix);
      this.color.setHex(item.color);
      this.itemInstances.setColorAt(count, this.color);
      this.dummy.rotation.set(Math.PI / 2, time * 1.6 + item.bob, 0);
      this.dummy.scale.setScalar(0.95 + bob * 0.18);
      this.dummy.updateMatrix();
      this.itemRingInstances.setMatrixAt(count, this.dummy.matrix);
      this.itemRingInstances.setColorAt(count, this.color);
      count += 1;
    }
    this.itemInstances.count = count;
    this.itemRingInstances.count = count;
    this.itemInstances.instanceMatrix.needsUpdate = true;
    this.itemRingInstances.instanceMatrix.needsUpdate = true;
    if (this.itemInstances.instanceColor) this.itemInstances.instanceColor.needsUpdate = true;
    if (this.itemRingInstances.instanceColor) this.itemRingInstances.instanceColor.needsUpdate = true;
  }

  private updateBoss(
    boss: BossState | null,
    eventWobble: number,
    time: number,
    position: THREE.Vector3,
    forward: THREE.Vector3,
    right: THREE.Vector3,
    up: THREE.Vector3,
  ): void {
    const eventAmount = Math.max(0, Math.min(1, eventWobble));
    if (boss && !boss.dead) {
      this.lastBossVisual = {
        pos: { x: boss.pos.x, z: boss.pos.z },
        radius: boss.radius,
        bossType: boss.bossType,
        phase: boss.phase,
        hp: boss.hp,
        maxHp: boss.maxHp,
        fireCooldown: boss.fireCooldown,
        fireInterval: boss.fireInterval,
        hitFlash: boss.hitFlash || 0,
      };
    }
    const visual = boss && !boss.dead ? this.lastBossVisual : eventAmount > 0 ? this.lastBossVisual : null;
    if (!visual) {
      this.bossGroup.visible = false;
      this.lastBossVisual = null;
      return;
    }
    const deathEcho = !boss || boss.dead;
    const phase = visual.phase || time;
    const hpRatio = Math.max(0, Math.min(1, visual.hp / Math.max(1, visual.maxHp)));
    const charge = deathEcho ? 0 : 1 - Math.max(0, Math.min(1, visual.fireCooldown / Math.max(0.01, visual.fireInterval)));
    const scale = CONFIG.boss.mini.radius * 0.55 * (visual.bossType === 'big' ? Math.cbrt(2) : 1);
    projectBasis(visual.pos.x, visual.pos.z, this.impulses, position, forward, right, up);
    this.bossGroup.visible = true;
    this.bossGroup.position.copy(position);
    this.bossGroup.rotation.set(Math.sin(phase * 3.4) * 0.035, phase * 0.16, -Math.sin(phase * 3.4) * 0.045);
    this.bossGroup.scale.setScalar(scale * (deathEcho ? 0.92 + eventAmount * 0.08 : 1));
    for (let index = 0; index < this.bossParts.length; index += 1) {
      const part = this.bossParts[index];
      part.position.fromArray(part.userData.basePosition as number[]);
      part.scale.fromArray(part.userData.baseScale as number[]);
      part.rotation.set(0, phase * (0.12 + index * 0.015), Math.sin(phase * 2 + index) * 0.08);
      if (deathEcho) {
        const progress = 1 - eventAmount;
        const side = index % 2 === 0 ? -1 : 1;
        part.position.x += side * progress * (1 + index * 0.12);
        part.position.y += progress * (index * 0.16) - progress * progress * 2.2;
        part.rotation.x += progress * 4.2;
        part.scale.multiplyScalar(1 + progress * 0.16);
      }
    }
    this.bossParts[1].scale.multiplyScalar(1 + charge * 0.5 + (1 - hpRatio) * 0.22);
    const palette = PALETTE.bossPalette[visual.bossType];
    const flash = visual.hitFlash > 0;
    const alpha = (visual.bossType === 'big' ? 1 : 0.94) * (deathEcho ? eventAmount : 1);
    this.bossArmorMaterial.color.setHex(flash ? 0xffffff : palette.armor);
    this.bossJointMaterial.color.setHex(flash ? 0xffffff : palette.joint);
    this.bossCoreMaterial.color.setHex(flash ? 0xffffff : palette.core);
    this.bossArmorMaterial.opacity = alpha;
    this.bossJointMaterial.opacity = alpha * 0.78;
    this.bossCoreMaterial.opacity = alpha * (0.82 + charge * 0.18);
  }

  dispose(): void {
    this.playerMesh.geometry.dispose();
    (this.playerMesh.material as THREE.Material).dispose();
    for (const kind of Object.keys(this.enemyGeometry) as EnemyKind[]) {
      this.enemyGeometry[kind].dispose();
      this.enemyMaterials[kind].dispose();
    }
    this.bulletGeometry.dispose();
    this.bulletMaterial.dispose();
    this.enemyBulletGeometry.dispose();
    this.enemyBulletMaterial.dispose();
    this.enemyBulletTrailMaterial.dispose();
    this.effectGeometry.dispose();
    this.effectMaterial.dispose();
    this.itemGeometry.dispose();
    this.itemMaterial.dispose();
    this.itemRingGeometry.dispose();
    this.itemRingMaterial.dispose();
    this.bossArmorMaterial.dispose();
    this.bossJointMaterial.dispose();
    this.bossCoreMaterial.dispose();
    for (const part of this.bossParts) part.geometry.dispose();
  }
}
