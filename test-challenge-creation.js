/**
 * Script de diagnostic pour tester la création de challenges
 * Exécuter avec: node test-challenge-creation.js
 */

import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

async function testChallengeCreation() {
  console.log('🔍 Diagnostic de création de challenge\n')

  try {
    // 1. Authenticate
    console.log('1️⃣ Authentification...')
    const email = 'test@example.com' // Remplacer par votre email de test
    const password = 'testpassword' // Remplacer par votre mot de passe

    const authData = await pb.collection('users').authWithPassword(email, password)
    console.log('✅ Authentifié:', authData.record.email)
    console.log('   User ID:', authData.record.id, '\n')

    // 2. Get user's teams
    console.log('2️⃣ Récupération des équipes...')
    const teams = await pb.collection('team_members').getFullList({
      filter: `user_id = "${authData.record.id}"`,
      expand: 'team_id'
    })

    if (teams.length === 0) {
      console.log('❌ Aucune équipe trouvée pour cet utilisateur\n')
      return
    }

    const teamId = teams[0].team_id
    console.log('✅ Équipe trouvée:', teamId)
    console.log('   Team Name:', teams[0].expand?.team_id?.name, '\n')

    // 3. Check collections info
    console.log('3️⃣ Vérification des collections...')

    // Get teams collection info
    const teamsCollectionList = await pb.collections.getList(1, 100)
    const teamsCollection = teamsCollectionList.items.find(c => c.name === 'teams')
    const usersCollection = teamsCollectionList.items.find(c => c.name === 'users' || c.name === '_pb_users_auth_')
    const challengesCollection = teamsCollectionList.items.find(c => c.name === 'challenges')

    console.log('   Teams collection ID:', teamsCollection?.id || 'NOT FOUND')
    console.log('   Users collection ID:', usersCollection?.id || 'NOT FOUND')
    console.log('   Users collection name:', usersCollection?.name || 'NOT FOUND')
    console.log('   Challenges collection ID:', challengesCollection?.id || 'NOT FOUND', '\n')

    // 4. Check challenge schema
    console.log('4️⃣ Schéma de la collection challenges:')
    if (challengesCollection) {
      const teamIdField = challengesCollection.schema.find(f => f.name === 'team_id')
      const createdByField = challengesCollection.schema.find(f => f.name === 'created_by')

      console.log('   team_id field:', teamIdField ? {
        type: teamIdField.type,
        collectionId: teamIdField.options?.collectionId
      } : 'NOT FOUND')

      console.log('   created_by field:', createdByField ? {
        type: createdByField.type,
        collectionId: createdByField.options?.collectionId
      } : 'NOT FOUND')
      console.log()
    }

    // 5. Test création avec différentes approches
    console.log('5️⃣ Test de création de challenge...\n')

    // Test 1: Création basique
    console.log('   Test 1: Envoi direct des IDs')
    try {
      const challenge1 = await pb.collection('challenges').create({
        title: 'Test Challenge Direct',
        description: 'Test avec IDs directs',
        type: 'daily',
        goal_metric: 'tasks_completed',
        goal_value: 5,
        points_reward: 50,
        icon: 'Target',
        team_id: teamId,
        created_by: authData.record.id,
        is_active: true,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      console.log('   ✅ Challenge créé:', challenge1.id)
      console.log('   team_id:', challenge1.team_id || 'VIDE')
      console.log('   created_by:', challenge1.created_by || 'VIDE')
      console.log()

      // Get with expand
      const challengeExpanded = await pb.collection('challenges').getOne(challenge1.id, {
        expand: 'team_id,created_by'
      })
      console.log('   Avec expand:')
      console.log('   team_id:', challengeExpanded.team_id || 'VIDE')
      console.log('   created_by:', challengeExpanded.created_by || 'VIDE')
      console.log('   expand.team_id:', challengeExpanded.expand?.team_id?.name || 'VIDE')
      console.log('   expand.created_by:', challengeExpanded.expand?.created_by?.email || 'VIDE')
      console.log()
    } catch (error) {
      console.log('   ❌ Erreur Test 1:', error.message)
      console.log('   Data:', error.data)
      console.log()
    }

    // Test 2: Sans team_id ni created_by
    console.log('   Test 2: Sans relations')
    try {
      const challenge2 = await pb.collection('challenges').create({
        title: 'Test Challenge Sans Relations',
        type: 'daily',
        goal_metric: 'tasks_completed',
        goal_value: 5,
        points_reward: 50,
        is_active: true,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      console.log('   ✅ Challenge créé:', challenge2.id)
      console.log('   team_id:', challenge2.team_id || 'VIDE')
      console.log('   created_by:', challenge2.created_by || 'VIDE')
      console.log()

      // Try to update with relations
      console.log('   Test 2b: Update avec relations')
      const updated = await pb.collection('challenges').update(challenge2.id, {
        team_id: teamId,
        created_by: authData.record.id
      })
      console.log('   ✅ Challenge mis à jour')
      console.log('   team_id:', updated.team_id || 'VIDE')
      console.log('   created_by:', updated.created_by || 'VIDE')
      console.log()
    } catch (error) {
      console.log('   ❌ Erreur Test 2:', error.message)
      console.log('   Data:', error.data)
      console.log()
    }

    console.log('✅ Tests terminés')

  } catch (error) {
    console.error('❌ Erreur globale:', error.message)
    console.error('Data:', error.data)
  }
}

testChallengeCreation()
