import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicPath = path.join(__dirname, 'public')

// Startup diagnostics
console.log('🔍 Server startup diagnostics:')
console.log('   Node version:', process.version)
console.log('   Working directory:', process.cwd())
console.log('   __dirname:', __dirname)
console.log('   Public path:', publicPath)
console.log('   PORT:', port)

// Check if public directory exists
if (fs.existsSync(publicPath)) {
  console.log('✅ Public directory exists')
  const files = fs.readdirSync(publicPath)
  console.log('   Files:', files.join(', '))
} else {
  console.error('❌ Public directory NOT found at:', publicPath)
}

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from public directory (Vite build output)
app.use(express.static(publicPath))

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Superplanner',
    version: '1.0.0',
    node: process.version,
    env: process.env.NODE_ENV || 'development'
  })
})

// Root API info
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Superplanner API v1.0.0',
    timestamp: new Date().toISOString(),
    note: 'This app uses Supabase for backend services (auth, database, API)',
    endpoints: {
      health: '/api/health'
    }
  })
})

// Fallback to index.html for Vite SPA (must be last)
app.get('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html')

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath, err => {
      if (err) {
        console.error('Error serving index.html:', err)
        res.status(500).json({ error: 'Could not load page', details: err.message })
      }
    })
  } else {
    console.error('index.html not found at:', indexPath)
    res.status(404).json({
      error: 'Application not found',
      message: 'index.html is missing. Build may have failed.',
      path: indexPath
    })
  }
})

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack)
  res.status(500).json({ error: 'Internal server error', details: err.message })
})

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log('✅ Server started successfully!')
  console.log(`🚀 Superplanner running on http://0.0.0.0:${port}`)
  console.log(`📊 Health check: http://localhost:${port}/api/health`)
  console.log(`🔥 Using Supabase for backend services`)
})

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server failed to start:', err)
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`)
  }
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
