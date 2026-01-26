import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Simple Vite configuration for static deployment
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js', '@supabase/auth-ui-react']
        }
      }
    }
  }
})
