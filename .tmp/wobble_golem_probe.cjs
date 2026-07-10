const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('geometry_wars_3d_glm5_2.html', 'utf8');
const killBlock = html.match(/fs = \(i, e, t\) => \{([\s\S]*?)\r?\n  \},\r?\n  xc =/);
const damageBlock = html.match(/qr = \(i, e, t\) => \{([\s\S]*?)\r?\n  \};\r?\nconst PRIMARY_WEAPON/);
const bossRenderBlock = html.match(/\/\/ boss: cache a render-only snapshot([\s\S]*?)\r?\n  \}\r?\n  dispose\(\)/);
assert(killBlock, 'enemy kill handler not found');
assert(damageBlock, 'player damage handler not found');
assert(bossRenderBlock, 'boss render block not found');

const kill = killBlock[1];
assert.equal((kill.match(/i\.impulses\.push/g) || []).length, 1, 'enemy kill handler should create only the singularity ripple');
assert(kill.includes('r &&') && kill.includes('eventTier: "localBlast"'), 'singularity ripple is not gated/local');
assert(kill.includes('wavelength: 6.5') && kill.includes('speed: 18'), 'local blast should stay compact');
assert(kill.includes('coupleEntities: !0'), 'nearby entities must follow the self-destruct ripple');
assert(!kill.includes('fe.grid.impulseStrength * (r ? 2 : 1)'), 'legacy every-enemy floor ripple returned');
assert(!kill.includes('fe.grid.impulseStrength * 1)'), 'small-enemy floor ripple returned');

const damage = damageBlock[1];
assert(damage.includes('eventTier: "heart"') && damage.includes('eventWobble || 0, 0.72'), 'heart-loss medium tier missing');
assert(damage.includes('eventTier: "death"') && damage.includes('eventWobble || 0, 1'), 'player-death maximum tier missing');
assert(html.includes('eventTier: "death"') && html.includes('world.eventWobble = 1'), 'boss-death maximum tier missing');
assert(/i\.gameOver\)\)[\s\S]{0,260}eventWobble[\s\S]{0,120}eventWobbleDecay/.test(html), 'game-over wobble must decay');

for (const name of ['torso', 'core', 'head', 'shoulder-l', 'arm-r', 'fist-l', 'crown-r', 'shard-l']) {
  assert(html.includes(`addBossPart("${name}"`), `missing geometric golem part: ${name}`);
}
const bossRender = bossRenderBlock[1];
for (const marker of ['armorOpen', 'charge =', 'hitFlash', 'stride =', 'deathProgress', 'userData.scatter']) {
  assert(html.includes(marker), `missing golem animation marker: ${marker}`);
}
assert(bossRender.includes('this.bossGroup.visible = !0'), 'golem hierarchy is not rendered');
assert(bossRender.includes('this.bossPartList'), 'golem death breakup does not animate all parts');
const resetIndex = bossRender.indexOf('part.scale.set(...part.userData.baseScale)');
const breakupIndex = bossRender.indexOf('part.scale.multiplyScalar(1 + deathProgress * 0.16)');
assert(resetIndex >= 0, 'boss parts are not reset to authored scale before reuse');
assert(breakupIndex > resetIndex, 'death breakup must run only after per-frame boss-part reset');
assert(bossRender.includes('part.position.set(...part.userData.basePosition)') && bossRender.includes('part.rotation.set(0, 0, 0)'), 'boss part position/rotation reset missing');
assert(!html.includes('this.bossMesh = new It'), 'legacy single-sphere boss returned');
assert(html.includes('b.hitFlash = 0.14'), 'boss hit reaction state missing');

assert(html.includes('size = fe.boss.mini.radius * 0.55 * (renderBoss.bossType === "big" ? Math.cbrt(2) : 1)'), 'mega visual mass is not capped near twice the mini boss');
assert(html.includes('mini: { armor: 0x247cff, joint: 0x071d5c, core: 0x7df9ff }'), 'mini boss blue palette missing');
assert(html.includes('big: { armor: 0xff4b1f, joint: 0x521008, core: 0xffd166 }'), 'mega boss magma palette missing');
assert(bossRender.includes('Xt.bossPalette[renderBoss.bossType]'), 'boss-type palette is not wired into the renderer');
assert(bossRender.includes('palette.armor') && bossRender.includes('palette.joint') && bossRender.includes('palette.core'), 'boss palette channels are not applied to every material');

console.log('WOBBLE_TIERS_GOLEM_SIZE_AND_PALETTES_OK');
