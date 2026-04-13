import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    base: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      // Increase chunk size warning limit slightly to reduce noise while we implement proper splitting
      chunkSizeWarningLimit: 1000,
    }
  };
});
