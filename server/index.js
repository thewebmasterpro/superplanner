import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { router as taskRouter } from './routes/tasks.js'
import { router as healthRouter } from './routes/health.js'

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

// API Routes
app.use('/api/tasks', taskRouter)
app.use('/api/health', healthRouter)

// Root API info
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Superplanner API v1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      tasks: '/api/tasks',
      health: '/api/health'
    }
  })
})

// Fallback to index.html for Vite SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), err => {
    if (err) {
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
  console.log(`🚀 Superplanner API running on http://0.0.0.0:${port}`)
  console.log(`📊 API docs: http://localhost:${port}/api`)
})
