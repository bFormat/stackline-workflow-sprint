import { defineConfig } from 'vite';

// Base path is configured to support GitHub Pages project sites where the
// site is served from `/<repo-name>/`. The `BASE_PATH` env var lets the
// pages workflow override it (we set it from the repo slug at deploy time).
const basePath = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base: basePath,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
