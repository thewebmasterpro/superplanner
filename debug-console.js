// Copie-colle ce code dans la console de ton navigateur pour diagnostiquer:

(async function() {
  console.log('🔍 === DIAGNOSTIC CHALLENGES ===')

  // Get PocketBase instance
  const pb = window.pb || (await import('./src/lib/pocketbase.js')).default

  console.log('1️⃣ Utilisateur connecté:')
  console.log('   ID:', pb.authStore.model?.id)
  console.log('   Email:', pb.authStore.model?.email)

  console.log('\n2️⃣ Tous les challenges dans la base:')
  const allChallenges = await pb.collection('challenges').getFullList({
    expand: 'team_id,created_by'
  })
  console.log('   Total:', allChallenges.length)
  allChallenges.forEach((c, i) => {
    console.log(`   Challenge ${i+1}:`, {
      id: c.id,
      title: c.title,
      team_id: c.team_id,
      created_by: c.created_by,
      team_name: c.expand?.team_id?.name,
      creator_email: c.expand?.created_by?.email
    })
  })

  console.log('\n3️⃣ Collections info:')
  const collections = await pb.collections.getList(1, 100)
  const teamsCol = collections.items.find(c => c.name === 'teams')
  const usersCol = collections.items.find(c => c.name === 'users' || c.name === '_pb_users_auth_')
  const challengesCol = collections.items.find(c => c.name === 'challenges')

  console.log('   teams collection ID:', teamsCol?.id)
  console.log('   users collection ID:', usersCol?.id)
  console.log('   users collection name:', usersCol?.name)

  console.log('\n4️⃣ Schema du champ team_id:')
  const teamIdField = challengesCol?.schema?.find(f => f.name === 'team_id')
  console.log('   Type:', teamIdField?.type)
  console.log('   collectionId:', teamIdField?.options?.collectionId)

  console.log('\n5️⃣ Schema du champ created_by:')
  const createdByField = challengesCol?.schema?.find(f => f.name === 'created_by')
  console.log('   Type:', createdByField?.type)
  console.log('   collectionId:', createdByField?.options?.collectionId)

  console.log('\n✅ Diagnostic terminé')
})()
