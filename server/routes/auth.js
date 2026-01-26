import express from 'express'
import bcrypt from 'bcrypt'
import { pool } from '../config/database.js'
import { generateToken } from '../middleware/auth.js'

export const router = express.Router()

/**
 * POST /api/auth/login
 * Login with username and password
 * Returns JWT token
 */
router.post('/login', async (req, res) => {
  let connection
  try {
    const { username, password } = req.body

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      })
    }

    connection = await pool.getConnection()

    // Find user by username
    const [users] = await connection.query(
      'SELECT id, username, email, password_hash, is_active FROM users WHERE username = ?',
      [username]
    )

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      })
    }

    const user = users[0]

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Account disabled',
        message: 'Your account has been disabled'
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      })
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email
    })

    // Return success with token
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * POST /api/auth/verify
 * Verify if JWT token is valid
 * Requires authentication
 */
router.post('/verify', async (req, res) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      valid: false,
      message: 'No token provided'
    })
  }

  const token = authHeader.substring(7)

  try {
    const jwt = await import('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    const decoded = jwt.default.verify(token, JWT_SECRET)

    res.json({
      valid: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email
      }
    })
  } catch (error) {
    res.status(401).json({
      valid: false,
      message: 'Invalid or expired token'
    })
  }
})

/**
 * GET /api/auth/me
 * Get current user info
 * Requires authentication (handled by middleware in index.js)
 */
router.get('/me', async (req, res) => {
  // This route should be protected by authenticate middleware
  if (!req.user && !req.apiKey) {
    return res.status(401).json({
      error: 'Not authenticated'
    })
  }

  if (req.user) {
    // JWT authentication
    res.json({
      user: req.user,
      authMethod: 'jwt'
    })
  } else if (req.apiKey) {
    // API Key authentication
    res.json({
      apiKey: req.apiKey,
      authMethod: 'api_key'
    })
  }
})
