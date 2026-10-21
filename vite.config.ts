import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth':        { target: 'http://localhost:8787', changeOrigin: true },
      '/usuarios':    { target: 'http://localhost:8787', changeOrigin: true },
      '/materias':    { target: 'http://localhost:8787', changeOrigin: true },
      '/sesiones':    { target: 'http://localhost:8787', changeOrigin: true },
      '/asistencias': { target: 'http://localhost:8787', changeOrigin: true },
      '/firmas':      { target: 'http://localhost:8787', changeOrigin: true },
      '/reportes':    { target: 'http://localhost:8787', changeOrigin: true },
    },
  },
});
