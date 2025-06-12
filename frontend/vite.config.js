import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/trigger': {
        target: import.meta.env.VITE_API_BASE_URL,
        changeOrigin: true,
      },
      '/feedback': {
        target: import.meta.env.VITE_API_BASE_URL,
        changeOrigin: true,
      },
      '/health': {
        target: import.meta.env.VITE_API_BASE_URL,
        changeOrigin: true,
      }
    }
  }
});