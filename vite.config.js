import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Vite configuration for Hostinger static deployment
export default defineConfig({
  // Source files are in client folder
  root: 'client',

  plugins: [react()],

  server: {
    port: 5173
  },

  build: {
    // Output to dist in project root (one level up from client)
    outDir: '../dist',
    emptyOutDir: true,
    // Generate source maps for production debugging
    sourcemap: false,
    // Optimize build with esbuild (faster than terser)
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  }
})
