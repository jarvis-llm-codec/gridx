import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = path.join(root, '.tmp', 'reverse');
const url = process.argv[2] || 'http://127.0.0.1:4173/';
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const errors = [];
const watchErrors = (targetPage, label) => {
  targetPage.on('pageerror', (error) => errors.push(`${label} pageerror: ${error.message}`));
  targetPage.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
      errors.push(`${label} console: ${message.text()}`);
    }
  });
  targetPage.on('response', (response) => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      errors.push(`${label} response ${response.status()}: ${response.url()}`);
    }
  });
};
watchErrors(page, 'desktop');

const canvasStats = async (targetPage) => {
  const buffer = await targetPage.locator('canvas').screenshot({ type: 'png' });
  const image = PNG.sync.read(buffer);
  let litPixels = 0;
  let colorTransitions = 0;
  let previous = -1;
  for (let offset = 0; offset < image.data.length; offset += 4) {
    const red = image.data[offset];
    const green = image.data[offset + 1];
    const blue = image.data[offset + 2];
    if (red + green + blue > 54) litPixels += 1;
    const packed = (red << 16) | (green << 8) | blue;
    if (previous >= 0 && packed !== previous) colorTransitions += 1;
    previous = packed;
  }
  return {
    width: image.width,
    height: image.height,
    litPixels,
    litRatio: litPixels / (image.width * image.height),
    colorTransitions,
  };
};

let report;
try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.locator('#gw-start-btn').waitFor({ state: 'visible' });
  await page.locator('canvas').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);
  const menuCanvas = await canvasStats(page);
  if (menuCanvas.litRatio < 0.001 || menuCanvas.colorTransitions < 100) {
    throw new Error(`Canvas appears blank: ${JSON.stringify(menuCanvas)}`);
  }
  await page.screenshot({ path: path.join(evidenceDir, 'smoke-menu.png') });

  await page.locator('#gw-board-btn').click();
  await page.locator('#gw-board').waitFor({ state: 'visible' });
  await page.screenshot({ path: path.join(evidenceDir, 'smoke-leaderboard.png') });
  await page.locator('#gw-board-close').click();
  await page.locator('#gw-start-btn').click();
  await page.waitForFunction(() => getComputedStyle(document.getElementById('overlay')).display === 'none');

  await page.evaluate(() => {
    window.__game.world.player.energy = 100;
  });
  await page.keyboard.press('q');
  await page.waitForTimeout(150);
  const energyAfterNova = await page.evaluate(() => window.__game.world.player.energy);
  if (energyAfterNova >= 20) throw new Error(`NOVA did not consume energy: ${energyAfterNova}`);
  await page.waitForTimeout(2_600);

  await page.evaluate(() => {
    window.__game.systems.spawn.bossTimer = 0;
  });
  await page.waitForFunction(() => Boolean(window.__game.world.boss), null, { timeout: 5_000 });
  await page.locator('#hud-boss').waitFor({ state: 'visible' });
  const bossType = await page.evaluate(() => window.__game.world.boss?.bossType || null);
  await page.screenshot({ path: path.join(evidenceDir, 'smoke-boss.png') });
  const playCanvas = await canvasStats(page);

  await page.evaluate(() => {
    window.__game.world.gameOver = true;
  });
  await page.locator('#gw-gameover').waitFor({ state: 'visible', timeout: 5_000 });
  await page.screenshot({ path: path.join(evidenceDir, 'smoke-gameover.png') });
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  watchErrors(mobilePage, 'mobile');
  await mobilePage.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
  await mobilePage.locator('#gw-start-btn').waitFor({ state: 'visible' });
  await mobilePage.locator('canvas').waitFor({ state: 'visible' });
  await mobilePage.waitForTimeout(500);
  const mobileCanvas = await canvasStats(mobilePage);
  if (mobileCanvas.litRatio < 0.001 || mobileCanvas.colorTransitions < 100) {
    throw new Error(`Mobile canvas appears blank: ${JSON.stringify(mobileCanvas)}`);
  }
  await mobilePage.screenshot({ path: path.join(evidenceDir, 'smoke-mobile-menu.png') });
  await mobilePage.locator('#gw-start-btn').click();
  await mobilePage.waitForFunction(() => getComputedStyle(document.getElementById('overlay')).display === 'none');
  await mobilePage.waitForTimeout(1_500);
  const mobilePlayCanvas = await canvasStats(mobilePage);
  if (mobilePlayCanvas.litRatio < 0.001 || mobilePlayCanvas.colorTransitions < 100) {
    throw new Error(`Mobile play canvas appears blank: ${JSON.stringify(mobilePlayCanvas)}`);
  }
  const mobileLayout = await mobilePage.evaluate(() => {
    const rect = (id) => {
      const bounds = document.getElementById(id).getBoundingClientRect();
      return { top: bounds.top, right: bounds.right, bottom: bounds.bottom, left: bounds.left };
    };
    return {
      scrollY,
      innerHeight,
      hud: rect('hud'),
      bossTimer: rect('hud-bosstimer'),
      helpDisplay: getComputedStyle(document.getElementById('help')).display,
    };
  });
  if (mobileLayout.helpDisplay !== 'none' || mobileLayout.scrollY !== 0 || mobileLayout.hud.top < 0 ||
      mobileLayout.hud.right > 390 || mobileLayout.bossTimer.bottom > mobileLayout.innerHeight) {
    throw new Error(`Mobile layout is out of bounds: ${JSON.stringify(mobileLayout)}`);
  }
  await mobilePage.screenshot({ path: path.join(evidenceDir, 'smoke-mobile-play.png') });
  const touchControls = await mobilePage.locator('#joy-btn, #joy-btn2, #joy-btn3, #joy-btn4').count();
  if (touchControls !== 4) throw new Error(`Expected four touch controls, found ${touchControls}`);
  await mobileContext.close();
  if (errors.length) throw new Error(errors.join('\n'));
  report = {
    status: 'PASS',
    url,
    viewport: { width: 1280, height: 720 },
    checks: {
      menuVisible: true,
      leaderboardVisible: true,
      gameStarted: true,
      novaEnergyConsumed: energyAfterNova,
      bossSpawned: bossType,
      gameOverVisible: true,
      menuCanvas,
      playCanvas,
      mobileCanvas,
      mobilePlayCanvas,
      mobileLayout,
      mobileGameStarted: true,
      touchControls,
      browserErrors: errors,
    },
  };
} finally {
  await browser.close();
}

await writeFile(
  path.join(evidenceDir, 'browser-smoke-report.json'),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8',
);
console.log(`browser-smoke=PASS report=${path.join(evidenceDir, 'browser-smoke-report.json')}`);
