/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // The site is served from the root of https://janigam.github.io, so the base path is '/'.
  // If you ever move it to a project repo (https://janigam.github.io/portfolio/), set VITE_BASE=/portfolio/ in the build.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  server: { port: 5180, strictPort: true },
  preview: { port: 4180, strictPort: true },
  test: { environment: 'node', globals: true },
});
