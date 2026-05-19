import { defineConfig } from 'vite';

// Use relative base so the built site works under GitHub Pages project paths.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    host: true,
  },
});
