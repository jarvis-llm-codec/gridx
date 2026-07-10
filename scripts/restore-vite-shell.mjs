import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'geometry_wars_3d_glm5_2.html');
const outputPath = path.join(root, 'index.html');
const source = await readFile(sourcePath, 'utf8');
const openTag = '<script type="module">';
const openIndex = source.indexOf(openTag);
const closeIndex = source.lastIndexOf('</script>');
if (openIndex < 0 || closeIndex < 0 || closeIndex <= openIndex) {
  throw new Error('Unable to locate canonical module script');
}
const output = `${source.slice(0, openIndex)}<script type="module" src="/src/main.ts"></script>${source.slice(closeIndex + '</script>'.length)}`;
await writeFile(outputPath, output, 'utf8');
console.log(`restored ${path.relative(root, outputPath)} from canonical shell`);
