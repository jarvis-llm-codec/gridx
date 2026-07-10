import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'dist-single', 'index.html');
const html = await readFile(outputPath, 'utf8');
const info = await stat(outputPath);
const failures = [];
if (/<script\b[^>]*\bsrc=/i.test(html)) failures.push('external script reference');
if (/<link\b[^>]*rel=["']stylesheet["'][^>]*href=/i.test(html)) failures.push('external stylesheet reference');
if (/\/?assets\//i.test(html)) failures.push('assets directory reference');
if (!/<script\b[^>]*>[\s\S]{100000,}<\/script>/i.test(html)) failures.push('missing inlined application bundle');
if (failures.length) throw new Error(`Single-file verification failed: ${failures.join(', ')}`);
console.log(`single-file=PASS bytes=${info.size} path=${outputPath}`);
