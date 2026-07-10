import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('geometry_wars_3d_glm5_2.html', 'utf8');
const scriptStart = html.indexOf('<script type="module">');
const scriptEnd = html.lastIndexOf('</script>');
if (scriptStart < 0 || scriptEnd < 0) throw new Error('module script not found');
const script = html.slice(scriptStart + '<script type="module">'.length, scriptEnd);
const start = script.indexOf('const fe =');
const end = script.indexOf('function yg()');
if (start < 0 || end < 0) throw new Error('expected script boundaries not found');
const testModule = script.slice(start, end) + '\nexport { fe, Zr, xc, stepBoss, bossHit, bossRageForNumber };\n';
writeFileSync('.tmp/boss_spike_module.mjs', testModule, 'utf8');

const { Zr, xc, stepBoss, bossHit, bossRageForNumber } = await import('./boss_spike_module.mjs?' + Date.now());
const { world, systems } = Zr(777);
const input = { moveX: 0, moveZ: 0, aimX: 1, aimZ: 0, firing: false, boost: false, skill: false };
const rows = [];
for (let expected = 1; expected <= 8; expected++) {
  systems.spawn.bossTimer = 0;
  xc(world, systems, input, 1 / 60);
  if (!world.boss) throw new Error('boss did not spawn #' + expected);
  const b = world.boss;
  b.fireCooldown = 0;
  const bulletsBefore = world.bullets.length;
  stepBoss(world, systems, 1 / 60);
  const bulletsFired = world.bullets.length - bulletsBefore;
  bossHit(b, b.maxHp + 9999, world, systems);
  rows.push({
    n: expected,
    type: b.bossType,
    rage: b.rageLevel,
    hp: b.maxHp,
    fireInterval: Number(b.fireInterval.toFixed(3)),
    bulletSpeed: Number(b.bulletSpeed.toFixed(2)),
    damage: b.bulletDamage,
    bulletsFired,
    nextTimer: Number(systems.spawn.bossTimer.toFixed(2))
  });
}
const bad = [];
for (const row of rows) {
  if (row.n <= 3 && row.rage !== 0) bad.push('pre-third boss has rage: #' + row.n);
  if (row.n >= 4 && row.rage !== row.n - 3) bad.push('wrong rage level for #' + row.n);
}
if (!(rows[3].hp > rows[0].hp && rows[3].fireInterval < rows[0].fireInterval && rows[3].bulletsFired > rows[0].bulletsFired)) {
  bad.push('boss #4 did not spike over boss #1');
}
if (!(rows[5].hp > rows[2].hp && rows[5].fireInterval < rows[2].fireInterval && rows[5].bulletsFired > rows[2].bulletsFired)) {
  bad.push('boss #6 did not spike over boss #3 big boss');
}
if (!(rows[2].nextTimer < rows[1].nextTimer && rows[4].nextTimer <= 32.1 && rows[5].nextTimer <= 26.1)) {
  bad.push('post-third boss interval did not collapse as expected');
}
if (bad.length) throw new Error(bad.join('; ') + '\n' + JSON.stringify(rows, null, 2));
console.table(rows);
console.log('BOSS_SPIKE_PROBE_OK');
