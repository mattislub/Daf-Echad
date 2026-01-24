import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Pre-bundle lucide-react to avoid potential runtime import timing issues
    include: ['lucide-react'],
  },
  server: {
    port: 3500,
    proxy: {
      '/api': {
        target: 'http://localhost:3501',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3501,
  },
});
