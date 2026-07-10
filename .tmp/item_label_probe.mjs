import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('geometry_wars_3d_glm5_2.html', 'utf8');
const start = html.indexOf('const fe =');
const end = html.search(/\/\*\*\r?\n \* @license/);
assert(start >= 0 && end > start, 'standalone module slice markers missing');
const { fe } = new Function(html.slice(start, end) + '\nreturn { fe };')();
const labelSource = html.match(/const ITEM_LABELS = Object\.freeze\((\{[\s\S]*?\})\),\r?\n\s+Zn/);
assert(labelSource, 'item label dictionary missing');
const ITEM_LABELS = new Function(`return (${labelSource[1]});`)();

const expected = {
  heal: 'HEAL',
  boost: 'BOOST',
  weapon: 'WEAPON',
  life: 'HEART',
  shield: 'SHIELD',
  multiplier: 'MULTIPLIER',
};
assert.deepEqual(ITEM_LABELS, expected, 'English item label copy changed');
assert.deepEqual(
  Object.keys(ITEM_LABELS).sort(),
  Object.keys(fe.items.colors).sort(),
  'every droppable item kind must have a label',
);

assert(html.includes('#item-label-layer') && html.includes('.item-label {'), 'item label overlay styling missing');
assert(html.includes('this.itemLabelLayer.setAttribute("aria-hidden", "true")'), 'decorative labels must stay out of the accessibility tree');
const syncBlock = html.match(/  syncItemLabels\(items\) \{([\s\S]*?)\r?\n  \}\r?\n  screenToArenaAim/);
assert(syncBlock, 'item label sync method missing');
const sync = syncBlock[1];
assert(sync.includes('this.itemLabels.get(item.id)'), 'labels are not keyed to stable item ids');
assert(sync.includes('hr(') && sync.includes('this.entities.impulses'), 'labels do not sample the same curved/wobbling surface as items');
assert(sync.includes('this.eventGroup.localToWorld(this.itemLabelPoint)'), 'event-group transform is not applied to labels');
assert(sync.includes('this.itemLabelPoint.project(this.camera.camera)'), 'labels are not projected through the live camera');
assert(sync.includes('label.style.transform = `translate3d('), 'projected screen position is not applied');
assert(sync.includes('if (!active.has(id))') && sync.includes('label.remove()'), 'collected/expired label cleanup missing');
assert(
  /this\.camera\.update\([\s\S]*?this\.syncItemLabels\(e\.items\)/.test(html),
  'labels must sync after the current frame camera update',
);
assert(html.includes('this.itemLabels.clear()') && html.includes('this.itemLabelLayer.remove()'), 'renderer disposal leaks label DOM');

console.log(`ITEM_LABELS_OK kinds=${Object.values(ITEM_LABELS).join(',')}`);
