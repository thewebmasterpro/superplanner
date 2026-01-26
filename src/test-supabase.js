// Test de connexion Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tytayccjnnwixunjazta.supabase.co'
const supabaseKey = 'sb_publishable_gYGUDBOk_YLM4d3xh_gJuQ_0jYZMbCK'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Test de connexion à Supabase...')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseKey.substring(0, 20) + '...')

  try {
    // Test de connexion basique
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('❌ Erreur:', error.message)
    } else {
      console.log('✅ Connexion réussie à Supabase!')
      console.log('Session:', data.session ? 'Connecté' : 'Non connecté')
    }

    // Test de lecture des tables
    console.log('\n📊 Test de lecture des tables...')
    const { data: tables, error: tablesError } = await supabase
      .from('tasks')
      .select('count')
      .limit(1)

    if (tablesError) {
      console.error('❌ Erreur lecture tables:', tablesError.message)
      if (tablesError.code === 'PGRST301') {
        console.log('⚠️  La table "tasks" n\'existe pas encore.')
        console.log('👉 Exécutez supabase-schema.sql dans Supabase Dashboard')
      }
    } else {
      console.log('✅ Tables accessibles!')
    }

  } catch (err) {
    console.error('❌ Erreur de connexion:', err.message)
  }
}

testConnection()
