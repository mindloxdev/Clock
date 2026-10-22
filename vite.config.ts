import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

/*
  The built site is served from https://mindloxdev.github.io/Clock/, so the
  production bundle needs that prefix on every asset URL. The dev server stays
  at the root, where a prefix would only get in the way.
*/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Clock/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: { target: 'es2022' },
}));
