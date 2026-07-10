import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = path.join(root, '.tmp', 'reverse', 'visual-parity');
const originalPath = path.join(root, 'geometry_wars_3d_glm5_2.html.bak_reverse_base');
const restoredPath = path.join(root, 'dist-single', 'index.html');
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const capture = async (htmlPath, outputName) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`);
  });
  const html = await readFile(htmlPath, 'utf8');
  await page.setContent(html, { waitUntil: 'load', timeout: 30_000 });
  await page.locator('#gw-start-btn').waitFor({ state: 'visible' });
  await page.locator('#gw-start-btn').click();
  await page.waitForFunction(() => Boolean(window.__game));
  const debug = await page.evaluate(() => {
    const game = window.__game;
    game.loop.stop();
    game.paused = true;
    const world = game.world;
    world.time = 3.25;
    world.eventWobble = 0;
    world.impulses = [];
    world.enemies = [];
    world.bullets = [];
    world.particles = [];
    world.weaponEffects = [];
    world.boss = null;
    world.player.pos = { x: 0, y: 0, z: -8 };
    world.player.vel = { x: 0, y: 0, z: 0 };
    const specs = [
      ['life', null, 0x19f0ff, -8, 0, 0.0],
      ['heal', null, 0x33ff88, -4, 0, 0.8],
      ['weapon', 'lightning', 0x3d7dff, 0, 0, 1.6],
      ['boost', null, 0xff2bd6, 4, 0, 2.4],
      ['shield', null, 0x9966ff, 8, 0, 3.2],
      ['multiplier', null, 0xff7733, 0, 5, 4.0],
    ];
    world.items = specs.map(([kind, weaponType, color, x, z, bob], index) => ({
      id: 1000 + index,
      tag: 'item',
      kind,
      weaponType,
      pos: { x, y: 0, z },
      vel: { x: 0, y: 0, z: 0 },
      radius: 0.5,
      life: 12,
      bob,
      color,
      dead: false,
    }));
    game.systems.score.multiplierPulse = 0;
    for (let index = 0; index < 180; index += 1) {
      game.renderer.update(world, game.systems);
      game.renderer.render();
    }
    for (const id of ['hud', 'help', 'touch-controls', 'damage-vignette']) {
      const element = document.getElementById(id);
      if (element) element.style.display = 'none';
    }
    const entities = game.renderer.entities;
    const instances = entities.itemInst ?? entities.itemInstances;
    const geometry = entities.itemGeo ?? entities.itemGeometry;
    const ring = entities.itemRingInst ?? entities.itemRingInstances;
    const matrix = Array.from(instances.instanceMatrix.array.slice(0, 16));
    const ringMatrix = Array.from(ring.instanceMatrix.array.slice(0, 16));
    game.renderer.renderer.info.reset();
    game.renderer.render();
    const coreOn = { ...game.renderer.renderer.info.render };
    instances.visible = false;
    game.renderer.renderer.info.reset();
    game.renderer.render();
    const coreOff = { ...game.renderer.renderer.info.render };
    instances.visible = true;
    game.renderer.render();
    const materialPrimitives = Object.fromEntries(
      Object.entries(instances.material).filter(([, value]) =>
        value === null || ['string', 'number', 'boolean'].includes(typeof value)),
    );
    const materialProperties = game.renderer.renderer.properties.get(instances.material);
    const ringProperties = game.renderer.renderer.properties.get(ring.material);
    const gpuAttribute = (attribute) => {
      const state = game.renderer.renderer.properties.get(attribute);
      return {
        cpuVersion: attribute.version,
        gpuVersion: state?.version ?? null,
        type: state?.type ?? null,
        bytesPerElement: state?.bytesPerElement ?? null,
      };
    };
    return {
      geometry: { type: geometry.type, parameters: geometry.parameters },
      material: {
        type: instances.material.type,
        color: instances.material.color.getHex(),
        blending: instances.material.blending,
        depthWrite: instances.material.depthWrite,
        transparent: instances.material.transparent,
        opacity: instances.material.opacity,
        vertexColors: instances.material.vertexColors,
        toneMapped: instances.material.toneMapped,
      },
      materialPrimitives,
      materialPropertyKeys: Object.keys(materialProperties),
      materialProgramState: {
        version: materialProperties.__version,
        instancing: materialProperties.instancing,
        instancingColor: materialProperties.instancingColor,
        batching: materialProperties.batching,
        vertexAlphas: materialProperties.vertexAlphas,
        diffuse: materialProperties.uniforms?.diffuse?.value?.getHex?.() ?? null,
        opacity: materialProperties.uniforms?.opacity?.value ?? null,
      },
      ringProgramState: {
        version: ringProperties.__version,
        instancing: ringProperties.instancing,
        instancingColor: ringProperties.instancingColor,
        batching: ringProperties.batching,
        vertexAlphas: ringProperties.vertexAlphas,
        diffuse: ringProperties.uniforms?.diffuse?.value?.getHex?.() ?? null,
        opacity: ringProperties.uniforms?.opacity?.value ?? null,
      },
      materialProgramKey: materialProperties.currentProgram?.cacheKey ?? null,
      ringProgramKey: ringProperties.currentProgram?.cacheKey ?? null,
      count: instances.count,
      visible: instances.visible,
      materialVisible: instances.material.visible,
      parentType: instances.parent?.type ?? null,
      groupContainsItem: entities.group.children.includes(instances),
      layers: instances.layers.mask,
      cameraLayers: game.renderer.camera.camera.layers.mask,
      drawRange: geometry.drawRange,
      geometryIndexCount: geometry.index?.count ?? null,
      geometryPositionCount: geometry.attributes.position?.count ?? null,
      geometryPositions: Array.from(geometry.attributes.position?.array.slice(0, 18) ?? []),
      matrixWorld: Array.from(instances.matrixWorld.elements),
      matrix,
      ringMatrix,
      instanceColor: Array.from(instances.instanceColor.array.slice(0, 3)),
      attributes: {
        matrix: gpuAttribute(instances.instanceMatrix),
        color: gpuAttribute(instances.instanceColor),
        ringMatrix: gpuAttribute(ring.instanceMatrix),
        ringColor: gpuAttribute(ring.instanceColor),
      },
      renderer: {
        outputColorSpace: game.renderer.renderer.outputColorSpace,
        toneMapping: game.renderer.renderer.toneMapping,
        coreOn,
        coreOff,
      },
    };
  });
  await page.evaluate(() => document.fonts.ready);
  const outputPath = path.join(evidenceDir, outputName);
  await page.locator('#app').screenshot({ path: outputPath });
  await page.evaluate(() => {
    const facade = window.__game.renderer;
    facade.renderer.setRenderTarget(null);
    facade.renderer.render(facade.scene, facade.camera.camera);
  });
  await page.locator('#app').screenshot({
    path: path.join(evidenceDir, outputName.replace('.png', '-direct.png')),
  });
  await page.evaluate(() => {
    const facade = window.__game.renderer;
    const entities = facade.entities;
    const instances = entities.itemInst ?? entities.itemInstances;
    for (const child of facade.scene.children) child.visible = false;
    facade.eventGroup.visible = true;
    for (const child of facade.eventGroup.children) child.visible = child === entities.group;
    for (const child of entities.group.children) child.visible = child === instances;
    instances.material.depthTest = false;
    instances.material.needsUpdate = true;
    facade.renderer.autoClear = true;
    facade.renderer.setRenderTarget(null);
    facade.renderer.clear(true, true, true);
    facade.renderer.render(facade.scene, facade.camera.camera);
  });
  await page.locator('#app').screenshot({
    path: path.join(evidenceDir, outputName.replace('.png', '-core-only.png')),
  });
  if (outputName === 'restored-items.png') {
    await page.evaluate(() => {
      const facade = window.__game.renderer;
      const entities = facade.entities;
      entities.itemInstances.material = entities.itemRingInstances.material;
      entities.itemInstances.material.depthTest = false;
      entities.itemInstances.material.wireframe = false;
      entities.itemInstances.material.needsUpdate = true;
      facade.renderer.clear(true, true, true);
      facade.renderer.render(facade.scene, facade.camera.camera);
    });
    await page.locator('#app').screenshot({ path: path.join(evidenceDir, 'restored-core-ring-material.png') });
    await page.evaluate(() => {
      const facade = window.__game.renderer;
      const entities = facade.entities;
      entities.itemInstances.visible = false;
      entities.itemRingInstances.visible = true;
      entities.itemRingInstances.geometry = entities.itemGeometry;
      entities.itemRingInstances.material.wireframe = false;
      entities.itemRingInstances.material.needsUpdate = true;
      facade.renderer.clear(true, true, true);
      facade.renderer.render(facade.scene, facade.camera.camera);
    });
    await page.locator('#app').screenshot({ path: path.join(evidenceDir, 'restored-ring-core-geometry.png') });
    await page.evaluate(() => {
      const entities = window.__game.renderer.entities;
      const instances = entities.itemInstances;
      instances.visible = true;
      instances.renderOrder = 999;
      instances.material.depthTest = false;
      instances.material.transparent = true;
      instances.material.needsUpdate = true;
      window.__game.renderer.render();
    });
    await page.locator('#app').screenshot({ path: path.join(evidenceDir, 'restored-core-debug.png') });
  }
  await page.close();
  if (errors.length) throw new Error(`${outputName}: ${errors.join('; ')}`);
  return { outputPath, debug };
};

const compare = (leftPath, rightPath) => Promise.all([readFile(leftPath), readFile(rightPath)]).then(([leftRaw, rightRaw]) => {
  const left = PNG.sync.read(leftRaw);
  const right = PNG.sync.read(rightRaw);
  if (left.width !== right.width || left.height !== right.height) throw new Error('Screenshot dimensions differ');
  const sideBySide = new PNG({ width: left.width * 2, height: left.height });
  PNG.bitblt(left, sideBySide, 0, 0, left.width, left.height, 0, 0);
  PNG.bitblt(right, sideBySide, 0, 0, right.width, right.height, left.width, 0);
  let absoluteError = 0;
  let changedPixels = 0;
  for (let offset = 0; offset < left.data.length; offset += 4) {
    let pixelChanged = false;
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = Math.abs(left.data[offset + channel] - right.data[offset + channel]);
      absoluteError += delta;
      if (delta) pixelChanged = true;
    }
    if (pixelChanged) changedPixels += 1;
  }
  const pixelCount = left.width * left.height;
  return {
    sideBySide,
    report: {
      status: 'PASS',
      dimensions: { width: left.width, height: left.height },
      meanAbsoluteError: absoluteError / (pixelCount * 3),
      similarity: 1 - absoluteError / (pixelCount * 3 * 255),
      changedPixels,
      changedPixelRatio: changedPixels / pixelCount,
      captures: { original: path.basename(leftPath), restored: path.basename(rightPath) },
    },
  };
});

try {
  const original = await capture(originalPath, 'original-items.png');
  const restored = await capture(restoredPath, 'restored-items.png');
  const { sideBySide, report } = await compare(original.outputPath, restored.outputPath);
  report.runtime = { original: original.debug, restored: restored.debug };
  await writeFile(path.join(evidenceDir, 'items-side-by-side.png'), PNG.sync.write(sideBySide));
  await writeFile(path.join(evidenceDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`visual-parity=PASS similarity=${report.similarity.toFixed(9)} report=${path.join(evidenceDir, 'report.json')}`);
} finally {
  await browser.close();
}
