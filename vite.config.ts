/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Single source of truth for both the dev/build bundler (Vite)
// and the test runner (Vitest). Pure simulation modules run in the
// `node` environment (no DOM/WebGL needed); browser-only render code
// is never imported by those tests, so the suite stays headless + fast.
export default defineConfig(({ mode }) => {
  const singleFile = mode === 'single';
  return {
    root: '.',
    base: './',
    plugins: singleFile ? [viteSingleFile()] : [],
    build: {
      outDir: singleFile ? 'dist-single' : 'dist',
      target: 'es2020',
      sourcemap: !singleFile,
      emptyOutDir: true,
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
  };
});
