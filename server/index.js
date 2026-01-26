import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from public directory (Vite build output)
app.use(express.static(path.join(__dirname, 'public')))

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Superplanner',
    version: '1.0.0'
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
  res.sendFile(path.join(__dirname, 'public', 'index.html'), err => {
    if (err) {
      console.error('Error serving index.html:', err)
      res.status(500).json({ error: 'Could not load page' })
    }
  })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Superplanner running on http://0.0.0.0:${port}`)
  console.log(`📊 Health check: http://localhost:${port}/api/health`)
  console.log(`🔥 Using Supabase for backend services`)
})
