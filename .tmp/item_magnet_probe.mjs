import { readFileSync } from 'node:fs';
const html = readFileSync('geometry_wars_3d_glm5_2.html', 'utf8');
const radius = Number(html.match(/magnetRadius:\s*([0-9.]+)/)?.[1]);
const pullPower = Number(html.match(/magnetPull:\s*([0-9.]+)/)?.[1]);
if (radius !== 11) throw new Error(`expected magnetRadius 11, got ${radius}`);
if (pullPower !== 36) throw new Error(`expected magnetPull 36, got ${pullPower}`);
if (/const\s+magnetRadius\s*=\s*6\.5/.test(html)) throw new Error('old hard-coded magnet radius remains');
if (/const\s+mag\s*=\s*14\s*\*\s*pull\s*\*\s*pull/.test(html)) throw new Error('old weak pull formula remains');
const accelAt = (dist) => {
  const pull = 1 - dist / radius;
  return dist <= radius && dist > 0.001 ? pullPower * pull * (0.25 + 0.75 * pull) : 0;
};
const farAccel = accelAt(10);
const midAccel = accelAt(5.5);
if (!(farAccel > 0)) throw new Error(`item at dist 10 should now be pulled, got ${farAccel}`);
if (!(midAccel > 10)) throw new Error(`mid-distance pull should be fast, got ${midAccel}`);
console.log(`ITEM_MAGNET_OK radius=${radius} pull=${pullPower} accel10=${farAccel.toFixed(3)} accel5.5=${midAccel.toFixed(3)}`);
