import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

describe('canonical Vite shell', () => {
  it('loads the restored TypeScript entry point', () => {
    expect(html).toContain('<script type="module" src="/src/main.ts"></script>');
  });

  it.each([
    'app',
    'hud-energy-fill',
    'hud-primary',
    'hud-secondary',
    'hud-lives',
    'hud-boss-fill',
    'hud-bosstimer-fill',
    'damage-vignette',
    'gw-menu',
    'gw-gameover',
    'gw-board-list',
  ])('contains #%s', (id) => {
    expect(html).toContain(`id="${id}"`);
  });
});
