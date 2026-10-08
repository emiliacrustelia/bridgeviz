import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so the build works under https://<user>.github.io/bridgeviz/
  base: './',
  // mapbox-gl alone is ~1.8 MB minified; that's expected.
  build: { chunkSizeWarningLimit: 2000 },
});
