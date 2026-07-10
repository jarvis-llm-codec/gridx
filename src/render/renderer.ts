import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CONFIG } from '../core/config.js';
import { PALETTE } from '../core/palette.js';
import type { ItemKind, Vec, World } from '../core/types.js';
import type { WorldSystems } from '../sim/world.js';
import { WEAPON_NAMES } from '../sim/weapons.js';
import { CameraController } from './cameraController.js';
import { EntityRenderer } from './entityRenderer.js';
import { GridMesh } from './gridMesh.js';
import { ParticleRenderer } from './particleRenderer.js';
import { projectBasis, sphereParams } from './project.js';

const ITEM_LABELS: Record<ItemKind, string> = {
  heal: 'HEAL',
  boost: 'BOOST',
  weapon: 'WEAPON',
  life: 'HEART',
  shield: 'SHIELD',
  multiplier: 'MULTIPLIER',
};

const setWorldEventTransform = (group: THREE.Group, eventWobble: number, time: number): void => {
  const amount = Math.max(0, Math.min(1, eventWobble));
  const power = amount * amount;
  group.position.set(
    Math.sin(time * 18) * CONFIG.camera.eventEntityShift * power,
    Math.sin(time * 23 + 1.1) * CONFIG.camera.eventEntityLift * power,
    0,
  );
  group.rotation.z = Math.sin(time * 16 + 0.4) * CONFIG.camera.eventEntityRoll * power;
  group.scale.setScalar(1 + Math.sin(time * 12.5) * CONFIG.camera.eventEntityScale * power);
};

export class Renderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly composer: EffectComposer;
  readonly scene: THREE.Scene;
  readonly camera: CameraController;
  private readonly eventGroup = new THREE.Group();
  private readonly grid: GridMesh;
  private readonly particles: ParticleRenderer;
  private readonly entities: EntityRenderer;
  private readonly bloom: UnrealBloomPass;
  private readonly itemLabelLayer: HTMLDivElement;
  private readonly itemLabels = new Map<number, HTMLSpanElement>();
  private readonly labelPoint = new THREE.Vector3();
  private readonly labelForward = new THREE.Vector3();
  private readonly labelRight = new THREE.Vector3();
  private readonly labelUp = new THREE.Vector3();

  private readonly onResize = () => {
    const parent = this.renderer.domElement.parentElement;
    if (!parent) return;
    this.renderer.setSize(parent.clientWidth, parent.clientHeight);
    this.composer.setSize(parent.clientWidth, parent.clientHeight);
    this.camera.setAspect(parent.clientWidth / parent.clientHeight);
  };

  private readonly onWheel = (event: WheelEvent) => {
    event.preventDefault();
    this.camera.adjustZoom(event.deltaY);
  };

  constructor(container: HTMLElement, seed: number) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(PALETTE.bg, 1);
    container.appendChild(this.renderer.domElement);
    this.itemLabelLayer = document.createElement('div');
    this.itemLabelLayer.id = 'item-label-layer';
    this.itemLabelLayer.setAttribute('aria-hidden', 'true');
    container.appendChild(this.itemLabelLayer);
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(PALETTE.bg, 0.012);
    this.camera = new CameraController(container.clientWidth / container.clientHeight, seed);
    this.scene.add(this.eventGroup);
    this.grid = new GridMesh();
    this.eventGroup.add(this.grid.mesh);
    this.particles = new ParticleRenderer();
    this.eventGroup.add(this.particles.mesh);
    this.entities = new EntityRenderer();
    this.eventGroup.add(this.entities.group);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      1.4,
      0.6,
      0.32,
    );
    this.composer.addPass(this.bloom);
    this.renderer.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('resize', this.onResize);
  }

  private syncItemLabels(items: World['items']): void {
    const active = new Set<number>();
    const width = this.renderer.domElement.clientWidth;
    const height = this.renderer.domElement.clientHeight;
    this.eventGroup.updateWorldMatrix(true, false);
    this.camera.camera.updateMatrixWorld();
    for (const item of items) {
      active.add(item.id);
      let label = this.itemLabels.get(item.id);
      if (!label) {
        label = document.createElement('span');
        label.className = 'item-label';
        label.dataset.itemKind = item.kind;
        label.textContent = item.kind === 'weapon' && item.weaponType
          ? `WEAPON · ${WEAPON_NAMES[item.weaponType]}`
          : ITEM_LABELS[item.kind] || item.kind.toUpperCase();
        label.style.setProperty('--item-color', `#${(item.color ?? 0xffffff).toString(16).padStart(6, '0')}`);
        this.itemLabelLayer.appendChild(label);
        this.itemLabels.set(item.id, label);
      }
      const bob = Math.sin(item.bob) * 0.4 + 0.6;
      projectBasis(
        item.pos.x,
        item.pos.z,
        this.entities.impulses,
        this.labelPoint,
        this.labelForward,
        this.labelRight,
        this.labelUp,
      );
      this.labelPoint.y += 1.75 + bob * 0.35;
      this.eventGroup.localToWorld(this.labelPoint);
      this.labelPoint.project(this.camera.camera);
      const visible = width > 0 && height > 0 && this.labelPoint.z >= -1 && this.labelPoint.z <= 1 &&
        Math.abs(this.labelPoint.x) <= 1.08 && Math.abs(this.labelPoint.y) <= 1.08;
      label.style.display = visible ? 'block' : 'none';
      if (visible) {
        const x = (this.labelPoint.x * 0.5 + 0.5) * width;
        const y = (-this.labelPoint.y * 0.5 + 0.5) * height;
        label.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
        label.style.opacity = String(Math.min(1, Math.max(0, item.life / 1.5)));
      }
    }
    for (const [id, label] of this.itemLabels) {
      if (!active.has(id)) {
        label.remove();
        this.itemLabels.delete(id);
      }
    }
  }

  screenToArenaAim(screenX: number, screenY: number, playerPos: Vec): { x: number; z: number } | null {
    this.camera.camera.updateMatrixWorld();
    this.eventGroup.updateWorldMatrix(true, false);
    const worldOrigin = this.camera.camera.position.clone();
    const worldPoint = new THREE.Vector3(screenX, -screenY, 0.5).unproject(this.camera.camera);
    const worldDirection = worldPoint.sub(worldOrigin).normalize();
    const localOrigin = this.eventGroup.worldToLocal(worldOrigin.clone());
    const localPoint = this.eventGroup.worldToLocal(worldOrigin.clone().add(worldDirection));
    const localDirection = localPoint.sub(localOrigin).normalize();
    const projection = localOrigin.dot(localDirection);
    const constant = localOrigin.lengthSq() - sphereParams.radius * sphereParams.radius;
    const discriminant = projection * projection - constant;
    if (discriminant < 0) return null;
    const root = Math.sqrt(discriminant);
    const near = -projection - root;
    const far = -projection + root;
    const distance = near > 0 ? near : far;
    if (distance <= 0) return null;
    const hit = localOrigin.addScaledVector(localDirection, distance).normalize();
    const theta = Math.acos(Math.max(-1, Math.min(1, hit.y)));
    const radial = Math.min(1, theta / sphereParams.capHalfAngle) * CONFIG.worldBounds;
    const azimuth = Math.atan2(hit.z, hit.x);
    const deltaX = Math.cos(azimuth) * radial - playerPos.x;
    const deltaZ = Math.sin(azimuth) * radial - playerPos.z;
    const length = Math.hypot(deltaX, deltaZ);
    return length > 0.0001 ? { x: deltaX / length, z: deltaZ / length } : null;
  }

  update(world: World, systems: WorldSystems): void {
    this.bloom.strength = 1.4 + systems.score.multiplierPulse * 0.6;
    setWorldEventTransform(this.eventGroup, world.eventWobble, world.time);
    this.grid.update(world.impulses);
    this.particles.setImpulses(world.impulses);
    this.particles.update(world.particles);
    this.entities.setImpulses(world.impulses);
    this.entities.update(
      world.player,
      world.enemies,
      world.bullets,
      world.time,
      world.items,
      world.boss,
      world.eventWobble,
      world.weaponEffects,
    );
    this.camera.trauma = world.trauma;
    this.camera.update(world.player.pos, world.player.vel, world.impulses, world.time, CONFIG.fixedStep, world.eventWobble);
    this.syncItemLabels(world.items);
  }

  render(): void {
    this.composer.render();
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.renderer.domElement.removeEventListener('wheel', this.onWheel);
    this.itemLabels.clear();
    this.itemLabelLayer.remove();
    this.entities.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
