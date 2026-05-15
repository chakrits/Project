import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  base: '/tools/mock-server/',
  server: {
    port: 5173,
    proxy: {
      '/mock-api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/api/mock-server': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
