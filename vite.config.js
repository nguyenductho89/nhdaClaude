import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        intro: resolve(rootDir, 'intro.html'),
        game: resolve(rootDir, 'game.html'),
        weddingInfo: resolve(rootDir, 'wedding-info.html')
      },
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
});
