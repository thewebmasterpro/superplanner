import mysql from 'mysql2/promise'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'superplanner',
  port: process.env.DB_PORT || 3306
}

async function createUser() {
  let connection
  try {
    console.log('🔗 Connecting to database...')
    connection = await mysql.createConnection(dbConfig)

    // Check if user already exists
    const [existingUsers] = await connection.query('SELECT id FROM users LIMIT 1')

    if (existingUsers.length > 0) {
      console.log('⚠️  User already exists. Skipping user creation.')
      console.log('📝 Creating API key for ClaudeBot...')

      // Generate API key
      const apiKey = 'sk_' + crypto.randomBytes(32).toString('hex')
      const keyHash = await bcrypt.hash(apiKey, 10)

      await connection.query(`
        INSERT INTO api_keys (key_hash, name, description, is_active)
        VALUES (?, ?, ?, true)
      `, [keyHash, 'ClaudeBot', 'API key for Claude Code agent'])

      console.log('\n✅ API Key created!')
      console.log('━'.repeat(60))
      console.log('🔑 API Key for ClaudeBot:')
      console.log(`   ${apiKey}`)
      console.log('━'.repeat(60))
      console.log('⚠️  Save this key securely - it won\'t be shown again!')
      console.log('   Use it in HTTP headers: Authorization: Bearer <api_key>')
      console.log('━'.repeat(60))

      await connection.end()
      process.exit(0)
    }

    // Create default user
    const username = 'admin'
    const email = 'admin@superplanner.local'
    const password = crypto.randomBytes(16).toString('hex') // Generate random password

    const passwordHash = await bcrypt.hash(password, 10)

    await connection.query(`
      INSERT INTO users (username, email, password_hash, is_active)
      VALUES (?, ?, ?, true)
    `, [username, email, passwordHash])

    console.log('✅ User created successfully!')
    console.log('━'.repeat(60))
    console.log('👤 Your credentials:')
    console.log(`   Username: ${username}`)
    console.log(`   Password: ${password}`)
    console.log('━'.repeat(60))
    console.log('⚠️  Please save these credentials securely!')
    console.log('   You can change the password after first login.')
    console.log('━'.repeat(60))

    // Generate API key for ClaudeBot
    const apiKey = 'sk_' + crypto.randomBytes(32).toString('hex')
    const keyHash = await bcrypt.hash(apiKey, 10)

    await connection.query(`
      INSERT INTO api_keys (key_hash, name, description, is_active)
      VALUES (?, ?, ?, true)
    `, [keyHash, 'ClaudeBot', 'API key for Claude Code agent'])

    console.log('\n✅ API Key created!')
    console.log('━'.repeat(60))
    console.log('🔑 API Key for ClaudeBot:')
    console.log(`   ${apiKey}`)
    console.log('━'.repeat(60))
    console.log('⚠️  Save this key securely - it won\'t be shown again!')
    console.log('   Use it in HTTP headers: Authorization: Bearer <api_key>')
    console.log('━'.repeat(60))

    await connection.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    if (connection) await connection.end()
    process.exit(1)
  }
}

createUser()
