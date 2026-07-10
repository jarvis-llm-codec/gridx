// renderer.ts — Three.js renderer + EffectComposer + UnrealBloomPass.
// Owns scene/camera/grid/particles/entities and exposes update(world).

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CONFIG } from '../core/config.js';
import { PALETTE } from '../core/palette.js';
import { GridMesh } from './gridMesh.js';
import { ParticleRenderer } from './particleRenderer.js';
import { EntityRenderer } from './entityRenderer.js';
import { CameraController } from './cameraController.js';
import type { WorldSystems } from '../sim/world.js';
import type { World } from '../core/types.js';

export interface RenderState {
  impulses: import('../math/wave.js').WaveImpulse[];
}

export class Renderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly composer: EffectComposer;
  readonly scene: THREE.Scene;
  readonly camera: CameraController;
  private grid: GridMesh;
  private particles: ParticleRenderer;
  private entities: EntityRenderer;
  private bloom: UnrealBloomPass;

  constructor(container: HTMLElement, seed: number) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(PALETTE.bg, 1);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(PALETTE.bg, 0.012);

    this.camera = new CameraController(container.clientWidth / container.clientHeight, seed);
    this.grid = new GridMesh();
    this.scene.add(this.grid.mesh);
    this.particles = new ParticleRenderer();
    this.scene.add(this.particles.mesh);
    this.entities = new EntityRenderer();
    this.scene.add(this.entities.group);

    // Composer + bloom
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      1.4, // strength
      0.6, // radius
      0.0 // threshold
    );
    this.composer.addPass(this.bloom);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    const el = this.renderer.domElement.parentElement;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.camera.setAspect(w / h);
  };

  /** Sync all render objects from the world + systems. */
  update(world: World, systems: WorldSystems): void {
    this.bloom.strength = 1.4 + systems.score.multiplierPulse * 0.6;
    this.grid.update(world.impulses);
    this.particles.setImpulses(world.impulses);
    this.particles.update(world.particles);
    this.entities.setImpulses(world.impulses);
    this.entities.update(world.player, world.enemies, world.bullets, world.time);
    this.camera.trauma = world.trauma;
    this.camera.update(world.player.pos, world.player.vel, world.impulses, world.time, CONFIG.fixedStep);
  }

  render(): void {
    this.composer.render();
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.entities.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}