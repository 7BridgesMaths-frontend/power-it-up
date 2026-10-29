import { defineConfig } from 'vite';
import path from 'path';
import { createBuildId, versionedBuild } from './vite/versionedBuild';

export default defineConfig(({ command }) => {
  const buildId = createBuildId();
  const versionDir = `v-${buildId}`;
  const isBuild = command === 'build';

  return {
    base: './', // 👈 importante para build en subcarpetas

    publicDir: isBuild ? false : 'public',

    plugins: [versionedBuild({ buildId, versionDir })],

    build: {
      assetsDir: versionDir,
    },

    server: {
      port: 8080,
    },

    resolve: {
      alias: {
        '@config': path.resolve(__dirname, 'src/config/config.js'),
        '@core': path.resolve(__dirname, 'src/core'),
        '@game': path.resolve(__dirname, 'src/game'),
        '@ui': path.resolve(__dirname, 'src/ui'),
        '@features': path.resolve(__dirname, 'src/features'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@constants': path.resolve(__dirname, 'src/constants')
      }
    }
  };
});
