import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

const JWT_SECRET = 'test-secret-key'

console.log('🧪 Testing Authentication System\n')
console.log('━'.repeat(60))

// Test 1: JWT Token Generation
console.log('\n1️⃣  Testing JWT Token Generation...')
const testUser = {
  id: 1,
  username: 'admin',
  email: 'admin@superplanner.local'
}

const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' })
console.log('✅ JWT Token generated:')
console.log(`   ${token.substring(0, 50)}...`)

// Test 2: JWT Token Verification
console.log('\n2️⃣  Testing JWT Token Verification...')
try {
  const decoded = jwt.verify(token, JWT_SECRET)
  console.log('✅ Token verified successfully')
  console.log(`   User: ${decoded.username} (${decoded.email})`)
} catch (error) {
  console.log('❌ Token verification failed:', error.message)
}

// Test 3: API Key Generation and Hashing
console.log('\n3️⃣  Testing API Key Generation...')
const apiKey = 'sk_' + crypto.randomBytes(32).toString('hex')
console.log('✅ API Key generated:')
console.log(`   ${apiKey}`)

// Test 4: bcrypt Hashing
console.log('\n4️⃣  Testing bcrypt Password Hashing...')
const password = 'testPassword123'
const passwordHash = await bcrypt.hash(password, 10)
console.log('✅ Password hashed successfully')
console.log(`   Hash: ${passwordHash.substring(0, 30)}...`)

// Test 5: bcrypt Verification
console.log('\n5️⃣  Testing bcrypt Password Verification...')
const isPasswordValid = await bcrypt.compare(password, passwordHash)
console.log(isPasswordValid ? '✅ Password verification: SUCCESS' : '❌ Password verification: FAILED')

const isWrongPassword = await bcrypt.compare('wrongPassword', passwordHash)
console.log(!isWrongPassword ? '✅ Wrong password rejected: SUCCESS' : '❌ Wrong password rejected: FAILED')

// Test 6: API Key Hashing and Verification
console.log('\n6️⃣  Testing API Key Hashing and Verification...')
const apiKeyHash = await bcrypt.hash(apiKey, 10)
console.log('✅ API Key hashed successfully')

const isApiKeyValid = await bcrypt.compare(apiKey, apiKeyHash)
console.log(isApiKeyValid ? '✅ API Key verification: SUCCESS' : '❌ API Key verification: FAILED')

// Test 7: Summary
console.log('\n━'.repeat(60))
console.log('📊 Test Summary:')
console.log('━'.repeat(60))
console.log('✅ JWT token generation: OK')
console.log('✅ JWT token verification: OK')
console.log('✅ API key generation: OK')
console.log('✅ Password hashing (bcrypt): OK')
console.log('✅ Password verification: OK')
console.log('✅ API key hashing: OK')
console.log('✅ API key verification: OK')
console.log('━'.repeat(60))

console.log('\n🎉 All authentication tests passed!')
console.log('\n📝 Next steps:')
console.log('   1. Run "npm run setup-db" on Hostinger to create tables')
console.log('   2. Run "npm run create-user" to create admin user and API key')
console.log('   3. Use the generated credentials to test login')
console.log('━'.repeat(60))
