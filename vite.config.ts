import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Garante compatibilidade caso alguma lib tente acessar process.env
    'process.env': {}
  }
});