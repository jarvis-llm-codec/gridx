import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { ItemState } from '../../src/core/types.js';
import { EntityRenderer } from '../../src/render/entityRenderer.js';

interface ItemRendererInternals {
  itemGeometry: THREE.OctahedronGeometry;
  itemMaterial: THREE.MeshBasicMaterial;
  itemInstances: THREE.InstancedMesh;
  itemRingGeometry: THREE.CylinderGeometry;
  itemRingMaterial: THREE.MeshBasicMaterial;
  itemRingInstances: THREE.InstancedMesh;
  updateItems(
    items: ItemState[],
    time: number,
    position: THREE.Vector3,
    forward: THREE.Vector3,
    right: THREE.Vector3,
    up: THREE.Vector3,
  ): void;
}

const internals = (renderer: EntityRenderer): ItemRendererInternals =>
  renderer as unknown as ItemRendererInternals;

describe('canonical item rendering', () => {
  it('uses the original geometry and material parameters', () => {
    const renderer = new EntityRenderer();
    const item = internals(renderer);
    expect(item.itemGeometry.parameters).toMatchObject({ radius: 0.5, detail: 0 });
    expect(item.itemMaterial.blending).toBe(THREE.AdditiveBlending);
    expect(item.itemMaterial.depthWrite).toBe(false);
    expect(item.itemMaterial.transparent).toBe(false);
    expect(item.itemMaterial.opacity).toBe(1);
    expect(item.itemRingGeometry.parameters).toMatchObject({
      radiusTop: 0.72,
      radiusBottom: 0.72,
      height: 0.08,
      radialSegments: 16,
      heightSegments: 1,
      openEnded: true,
    });
    expect(item.itemRingMaterial.wireframe).toBe(true);
    expect(item.itemRingMaterial.blending).toBe(THREE.AdditiveBlending);
    expect(item.itemRingMaterial.depthWrite).toBe(false);
    expect(item.itemRingMaterial.transparent).toBe(true);
    expect(item.itemRingMaterial.opacity).toBeCloseTo(0.72, 12);
    renderer.dispose();
  });

  it('matches the original pulse and hides retired high-water slots', () => {
    const renderer = new EntityRenderer();
    const item = internals(renderer);
    const state = {
      id: 1,
      tag: 'item',
      kind: 'heal',
      weaponType: null,
      pos: { x: 0, y: 0, z: 0 },
      vel: { x: 0, y: 0, z: 0 },
      radius: 0.5,
      life: 12,
      bob: 0,
      color: 0x33ff88,
      dead: false,
    } satisfies ItemState;
    const position = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    item.updateItems([state], 2, position, forward, right, up);

    const matrix = new THREE.Matrix4().fromArray(item.itemInstances.instanceMatrix.array, 0);
    const scale = new THREE.Vector3();
    matrix.decompose(new THREE.Vector3(), new THREE.Quaternion(), scale);
    expect(scale.x).toBeCloseTo(0.85, 6);
    expect(item.itemInstances.count).toBe(1);

    item.updateItems([], 2, position, forward, right, up);
    const hidden = new THREE.Matrix4().fromArray(item.itemInstances.instanceMatrix.array, 0);
    const hiddenPosition = new THREE.Vector3();
    const hiddenScale = new THREE.Vector3();
    hidden.decompose(hiddenPosition, new THREE.Quaternion(), hiddenScale);
    expect(item.itemInstances.count).toBe(1);
    expect(item.itemRingInstances.count).toBe(1);
    expect(hiddenPosition.y).toBeCloseTo(-9999, 6);
    expect(hiddenScale.length()).toBeCloseTo(0, 6);
    renderer.dispose();
  });
});
