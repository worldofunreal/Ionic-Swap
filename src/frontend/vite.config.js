import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import environment from 'vite-plugin-environment';
import dotenv from 'dotenv';

// Load environment variables from multiple possible locations
dotenv.config({ path: '../../.env' });
dotenv.config({ path: '.env' });

export default defineConfig({
  build: {
    emptyOutDir: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
    include: ['buffer', 'process', 'util'],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        implementation: 'sass',  // Explicitly use modern Sass
      },
    },
  },
  resolve: {
    alias: {
      "declarations": fileURLToPath(
        new URL("../declarations", import.meta.url)
      ),
      "buffer": "buffer",
      "process": "process/browser",
      "util": "util",
    },
    dedupe: ['@dfinity/agent'],
  },
  define: {
    // Provide fallback for development
    'process.env.CANISTER_ID_FUSION_HTLC_CANISTER': JSON.stringify(
      process.env.CANISTER_ID_FUSION_HTLC_CANISTER || 'local'
    ),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    global: 'globalThis',
  },
});