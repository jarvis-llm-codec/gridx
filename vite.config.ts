/// <reference types="vitest" />
import { defineConfig } from 'vite';

// Single source of truth for both the dev/build bundler (Vite)
// and the test runner (Vitest). Pure simulation modules run in the
// `node` environment (no DOM/WebGL needed); browser-only render code
// is never imported by those tests, so the suite stays headless + fast.
export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: true,
  },
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/render/**'],
    },
  },
});
