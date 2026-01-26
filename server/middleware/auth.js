import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { pool } from '../config/database.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * Middleware to authenticate requests using JWT or API Key
 * Supports two authentication methods:
 * 1. JWT Token: Authorization: Bearer <jwt_token>
 * 2. API Key: Authorization: Bearer <api_key>
 */
export const authenticate = async (req, res, next) => {
  let connection
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid JWT token or API key'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Try JWT first
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.user = decoded
      req.authMethod = 'jwt'
      return next()
    } catch (jwtError) {
      // JWT verification failed, try API key
    }

    // Try API key
    if (token.startsWith('sk_')) {
      connection = await pool.getConnection()

      // Get all active API keys
      const [apiKeys] = await connection.query(`
        SELECT id, key_hash, name, is_active, expires_at
        FROM api_keys
        WHERE is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
      `)

      // Check each key hash
      for (const apiKey of apiKeys) {
        const isValid = await bcrypt.compare(token, apiKey.key_hash)

        if (isValid) {
          // Update last_used_at
          await connection.query(`
            UPDATE api_keys SET last_used_at = NOW() WHERE id = ?
          `, [apiKey.id])

          req.apiKey = {
            id: apiKey.id,
            name: apiKey.name
          }
          req.authMethod = 'api_key'

          connection.release()
          return next()
        }
      }

      connection.release()
    }

    // Neither JWT nor API key worked
    return res.status(401).json({
      error: 'Invalid authentication',
      message: 'The provided token or API key is invalid or expired'
    })

  } catch (error) {
    if (connection) connection.release()
    console.error('Authentication error:', error)
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred during authentication'
    })
  }
}

/**
 * Generate JWT token for a user
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  )
}

/**
 * Optional middleware to allow anonymous access but decode token if present
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)

    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.user = decoded
      req.authMethod = 'jwt'
    } catch (error) {
      // Token invalid but we allow anonymous access
    }
  }

  next()
}
