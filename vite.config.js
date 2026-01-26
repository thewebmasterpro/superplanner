import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Vite configuration for Hostinger deployment
// This config allows Hostinger to detect Vite as the framework
export default defineConfig({
  // Use client folder as root for sources
  root: path.resolve(__dirname, 'client'),

  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },

  build: {
    // Output to server/public for Express to serve
    outDir: path.resolve(__dirname, 'server/public'),
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
