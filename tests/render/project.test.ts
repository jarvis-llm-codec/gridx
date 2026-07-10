import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createImpulse } from '../../src/math/wave.js';
import { projectToScene } from '../../src/render/project.js';

describe('scene projection', () => {
  it('moves entities only for impulses that opt into coupling', () => {
    const base = projectToScene(3, 0, [], new THREE.Vector3()).clone();
    const ordinary = projectToScene(
      3,
      0,
      [createImpulse(0, 0, 4)],
      new THREE.Vector3(),
    );
    const coupled = projectToScene(
      3,
      0,
      [createImpulse(0, 0, 4, { coupleEntities: true })],
      new THREE.Vector3(),
    );
    expect(ordinary.distanceTo(base)).toBeLessThan(1e-12);
    expect(coupled.distanceTo(base)).toBeGreaterThan(0.01);
  });
});
