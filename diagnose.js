import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

console.log('🔍 Superplanner Diagnostic\n')

// Check .env file
console.log('📄 Environment File:')
if (fs.existsSync('.env')) {
  console.log('   ✅ .env file exists')
  const envContent = fs.readFileSync('.env', 'utf-8')
  console.log('   Contents:')
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key] = line.split('=')
      console.log(`   - ${key}`)
    }
  })
} else {
  console.log('   ❌ .env file NOT found')
}

console.log('\n📋 Environment Variables:')
console.log('   DB_HOST:', process.env.DB_HOST || '(not set)')
console.log('   DB_USER:', process.env.DB_USER || '(not set)')
console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-4) : '(not set)')
console.log('   DB_NAME:', process.env.DB_NAME || '(not set)')
console.log('   DB_PORT:', process.env.DB_PORT || '(not set)')
console.log('   PORT:', process.env.PORT || '(not set)')
console.log('   NODE_ENV:', process.env.NODE_ENV || '(not set)')
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '(set)' : '(not set)')

console.log('\n🎯 Where are you trying to connect?')
console.log('   Production: https://sp.thewebmaster.pro')
console.log('   Local dev: http://localhost:5173')

console.log('\n📝 Next steps:')
console.log('   1. If connecting to HOSTINGER:')
console.log('      - Execute reset-password.sql in phpMyAdmin')
console.log('      - Use: admin / Bonjour2704')
console.log('')
console.log('   2. If connecting LOCALLY:')
console.log('      - Make sure MySQL is running locally')
console.log('      - Create local database: npm run setup-db')
console.log('      - Create admin user locally')
console.log('')
console.log('   3. Start dev server:')
console.log('      npm run dev')
