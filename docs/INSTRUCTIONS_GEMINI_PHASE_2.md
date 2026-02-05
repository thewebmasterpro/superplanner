# Instructions pour Gemini - Phase 2 du Refactoring

**Date:** 2026-01-30
**Auteur:** Claude Sonnet 4.5
**Destinataire:** Gemini 3 Pro
**Objectif:** Éliminer les 46 appels directs restants à PocketBase

---

## 🎯 Contexte Rapide

Tu as déjà créé 6 services avec succès en Phase 1:
- ✅ tasks.service.js
- ✅ campaigns.service.js
- ✅ workspaces.service.js
- ✅ projects.service.js
- ✅ contacts.service.js
- ✅ categories.service.js

**Résultat:** -62% d'appels directs, -668 lignes de code, 0 vulnérabilités SQL

**Maintenant:** Phase 2 - Continuer la migration avec les 46 appels restants

---

## 📋 Rappel Essentiel

**AVANT de commencer chaque tâche:**
1. ✅ Lis **SERVICE_PATTERN_GUIDE.md** (ton guide de référence)
2. ✅ Utilise le template exact fourni dans le guide
3. ✅ Vérifie la checklist de sécurité (ownership, escapeFilterValue)
4. ✅ Teste avec `npm run build` après chaque modification

---

## 🗓️ PHASE 2.1 - Semaine 1 (Haute Priorité)

### Tâche 1: Refactorer BulkActionsBar.jsx
**Durée estimée:** 2 heures

#### Contexte
`BulkActionsBar.jsx` contient 10 appels directs à PocketBase pour des opérations bulk sur les tâches.

#### Étapes
1. **Analyse** (15 min)
   ```bash
   # Lire le fichier
   cat src/components/BulkActionsBar.jsx

   # Chercher tous les appels directs
   grep -n "pb.collection" src/components/BulkActionsBar.jsx
   ```

2. **Étendre tasks.service.js** (45 min)
   - Ajouter les méthodes manquantes:
     ```js
     // Dans tasks.service.js

     /**
      * Bulk update tasks status
      * @param {string[]} ids - Array of task IDs
      * @param {string} status - New status (todo, in_progress, done, etc.)
      * @returns {Promise<Object[]>} Updated tasks
      */
     async bulkUpdateStatus(ids, status) {
       const user = pb.authStore.model
       if (!user) throw new Error('Not authenticated')

       // Verify ownership of all tasks first
       for (const id of ids) {
         await this.getOne(id) // Will throw if not owned
       }

       // Update all
       const updates = ids.map(id =>
         pb.collection('tasks').update(id, { status })
       )
       return await Promise.all(updates)
     }

     /**
      * Bulk assign tasks to a project
      * @param {string[]} ids - Array of task IDs
      * @param {string} projectId - Project ID to assign to
      * @returns {Promise<Object[]>} Updated tasks
      */
     async bulkAssignToProject(ids, projectId) {
       // Similar pattern...
     }

     // Ajouter d'autres méthodes bulk selon les besoins
     ```

3. **Migrer BulkActionsBar.jsx** (30 min)
   ```js
   // AVANT
   import pb from '../lib/pocketbase'

   const handleBulkDelete = async (ids) => {
     for (const id of ids) {
       await pb.collection('tasks').delete(id)
     }
   }

   // APRÈS
   import { tasksService } from '../services/tasks.service'

   const handleBulkDelete = async (ids) => {
     try {
       await tasksService.bulkDelete(ids)
       toast.success('Tasks deleted')
     } catch (error) {
       console.error('Error:', error)
       toast.error('Failed to delete tasks')
     }
   }
   ```

4. **Tester** (30 min)
   - Compiler: `npm run build`
   - Tester UI: Sélectionner plusieurs tâches → Actions bulk
   - Vérifier console: Aucune erreur
   - Vérifier ownership: Essayer de supprimer des tâches d'un autre user (doit échouer)

#### Livrables
- [ ] tasks.service.js étendu avec méthodes bulk
- [ ] BulkActionsBar.jsx migré (0 appel direct)
- [ ] Build réussi
- [ ] Tests manuels passés

---

### Tâche 2: Créer teams.service.js et migrer TeamSettings.jsx
**Durée estimée:** 3 heures

#### Contexte
`TeamSettings.jsx` contient 9 appels directs pour gérer les équipes (membres, invitations, rôles).

#### Étapes
1. **Analyse de la structure** (30 min)
   ```bash
   # Analyser TeamSettings.jsx
   cat src/pages/TeamSettings.jsx

   # Chercher les collections utilisées
   grep -n "pb.collection" src/pages/TeamSettings.jsx

   # Identifier les tables:
   # - teams (ou workspace_members?)
   # - team_invitations?
   # - team_roles?
   ```

2. **Créer teams.service.js** (1h30)
   ```js
   /**
    * Teams Service
    *
    * Centralized service for all team-related operations.
    * Manages team members, invitations, and roles.
    *
    * @module services/teams.service
    */

   import pb from '../lib/pocketbase'

   class TeamsService {
     /**
      * Get all team members for current workspace
      *
      * @param {string} workspaceId - Workspace ID
      * @returns {Promise<Array>} Array of team members
      */
     async getMembers(workspaceId) {
       const user = pb.authStore.model
       if (!user) return []

       try {
         // Adapter selon le nom réel de la collection
         return await pb.collection('workspace_members').getFullList({
           filter: `workspace_id = "${workspaceId}"`,
           expand: 'user_id',
           sort: '-created'
         })
       } catch (error) {
         console.error('❌ Error fetching team members:', error)
         return []
       }
     }

     /**
      * Invite a user to the team
      *
      * @param {string} workspaceId - Workspace ID
      * @param {string} email - Email of user to invite
      * @param {string} role - Role to assign (admin, member, viewer)
      * @returns {Promise<Object>} Created invitation
      */
     async inviteMember(workspaceId, email, role = 'member') {
       const user = pb.authStore.model
       if (!user) throw new Error('Not authenticated')

       // Vérifier que l'utilisateur est admin du workspace
       const workspace = await pb.collection('contexts').getOne(workspaceId)
       if (workspace.user_id !== user.id) {
         throw new Error('Unauthorized: Only workspace owner can invite members')
       }

       return await pb.collection('team_invitations').create({
         workspace_id: workspaceId,
         email,
         role,
         invited_by: user.id,
         status: 'pending'
       })
     }

     /**
      * Remove a team member
      *
      * @param {string} memberId - Member ID to remove
      * @returns {Promise<void>}
      */
     async removeMember(memberId) {
       const user = pb.authStore.model
       if (!user) throw new Error('Not authenticated')

       // Verify ownership (only workspace owner can remove members)
       const member = await pb.collection('workspace_members').getOne(memberId, {
         expand: 'workspace_id'
       })

       if (member.expand.workspace_id.user_id !== user.id) {
         throw new Error('Unauthorized: Only workspace owner can remove members')
       }

       return await pb.collection('workspace_members').delete(memberId)
     }

     /**
      * Update member role
      *
      * @param {string} memberId - Member ID
      * @param {string} newRole - New role (admin, member, viewer)
      * @returns {Promise<Object>} Updated member
      */
     async updateMemberRole(memberId, newRole) {
       const user = pb.authStore.model
       if (!user) throw new Error('Not authenticated')

       // Similar ownership check...

       return await pb.collection('workspace_members').update(memberId, {
         role: newRole
       })
     }
   }

   export const teamsService = new TeamsService()
   ```

3. **Migrer TeamSettings.jsx** (45 min)
   - Remplacer tous les `pb.collection(...)` par `teamsService.*`
   - Ajouter error handling avec try-catch et toast
   - Tester chaque fonction

4. **Tester** (15 min)
   - Build: `npm run build`
   - UI: Inviter un membre, changer son rôle, le retirer
   - Console: Vérifier les logs

#### Livrables
- [ ] teams.service.js créé
- [ ] TeamSettings.jsx migré (0 appel direct)
- [ ] Build réussi
- [ ] Tests manuels passés

---

### Tâche 3: Migrer TaskModal.jsx vers tasks.service.js
**Durée estimée:** 2 heures

#### Contexte
`TaskModal.jsx` contient 9 appels directs qui devraient utiliser `tasks.service.js` existant.

#### Étapes
1. **Analyse** (15 min)
   ```bash
   cat src/components/TaskModal.jsx | grep "pb.collection"
   ```

2. **Vérifier tasks.service.js** (15 min)
   - Toutes les méthodes nécessaires existent-elles?
   - Si non, les ajouter (ex: `updateRecurrence()`, `handleSubtasks()`)

3. **Migration** (1h)
   ```js
   // AVANT
   import pb from '../lib/pocketbase'

   const handleSave = async () => {
     if (task?.id) {
       await pb.collection('tasks').update(task.id, formData)
     } else {
       await pb.collection('tasks').create(formData)
     }
   }

   // APRÈS
   import { tasksService } from '../services/tasks.service'

   const handleSave = async () => {
     try {
       if (task?.id) {
         await tasksService.update(task.id, formData)
       } else {
         await tasksService.create(formData)
       }
       toast.success('Task saved')
       onClose()
     } catch (error) {
       console.error('Error saving task:', error)
       toast.error(error.message)
     }
   }
   ```

4. **Tester** (30 min)
   - Créer une nouvelle tâche
   - Modifier une tâche existante
   - Supprimer une tâche
   - Gérer la récurrence
   - Ajouter des sous-tâches

#### Livrables
- [ ] tasks.service.js vérifié/étendu si nécessaire
- [ ] TaskModal.jsx migré (0 appel direct)
- [ ] Build réussi
- [ ] Tests manuels passés

---

## 🗓️ PHASE 2.2 - Semaine 2 (Priorité Moyenne)

### Tâche 4: Créer settings.service.js
**Durée estimée:** 2 heures

#### Contexte
`Settings.jsx` contient 9 appels directs pour gérer les préférences utilisateur.

#### Étapes
1. **Analyser Settings.jsx**
   - Quelles collections sont utilisées? (user_preferences? user_settings?)
   - Quels types de settings? (theme, notifications, language, etc.)

2. **Créer settings.service.js**
   ```js
   class SettingsService {
     /**
      * Get user settings
      * @returns {Promise<Object>} User settings object
      */
     async getSettings() {
       const user = pb.authStore.model
       if (!user) return {}

       try {
         // Option 1: Settings stockés dans user record
         const userRecord = await pb.collection('users').getOne(user.id)
         return userRecord.preferences || {}

         // Option 2: Table séparée user_settings
         // const settings = await pb.collection('user_settings').getFirstListItem(
         //   `user_id = "${user.id}"`
         // )
         // return settings
       } catch (error) {
         console.error('Error fetching settings:', error)
         return {}
       }
     }

     /**
      * Update user settings
      * @param {Object} settings - Settings to update
      * @returns {Promise<Object>} Updated settings
      */
     async updateSettings(settings) {
       const user = pb.authStore.model
       if (!user) throw new Error('Not authenticated')

       return await pb.collection('users').update(user.id, {
         preferences: settings
       })
     }
   }

   export const settingsService = new SettingsService()
   ```

3. **Migrer Settings.jsx**

4. **Tester**

#### Livrables
- [ ] settings.service.js créé
- [ ] Settings.jsx migré
- [ ] Build réussi
- [ ] Tests manuels

---

### Tâche 5: Créer meetings.service.js
**Durée estimée:** 3 heures

#### Contexte
`useMeetingAgenda.js` contient 7 appels directs pour gérer les réunions (qui sont probablement des tasks avec type='meeting').

#### Stratégie
**Option A:** Créer meetings.service.js séparé
**Option B:** Étendre tasks.service.js avec méthodes spécifiques aux meetings

**Recommandation:** Option B (plus simple, évite duplication)

#### Étapes
1. **Analyser useMeetingAgenda.js**
   - Les meetings sont-ils des tasks?
   - Ont-ils des champs spécifiques? (agenda_items, attendees, etc.)

2. **Étendre tasks.service.js**
   ```js
   // Dans tasks.service.js

   /**
    * Get all meetings (tasks with type='meeting')
    * @param {Object} options - Filter options
    * @returns {Promise<Array>} Array of meetings
    */
   async getMeetings(options = {}) {
     const allOptions = {
       ...options,
       type: 'meeting'
     }
     return await this.getAll(allOptions)
   }

   /**
    * Create a meeting with agenda items
    * @param {Object} meetingData - Meeting data
    * @param {Array} agendaItems - Agenda items
    * @returns {Promise<Object>} Created meeting
    */
   async createMeeting(meetingData, agendaItems = []) {
     const meeting = await this.create({
       ...meetingData,
       type: 'meeting'
     })

     // Create agenda items if any
     if (agendaItems.length > 0) {
       await this.updateAgenda(meeting.id, agendaItems)
     }

     return meeting
   }

   /**
    * Update meeting agenda
    * @param {string} meetingId - Meeting ID
    * @param {Array} agendaItems - New agenda items
    * @returns {Promise<Object>} Updated meeting
    */
   async updateAgenda(meetingId, agendaItems) {
     // Implementation depends on schema
     // Option 1: JSON field in meeting
     // Option 2: Separate agenda_items table
   }
   ```

3. **Migrer useMeetingAgenda.js**
   ```js
   // AVANT
   import pb from '../lib/pocketbase'

   export function useMeetings() {
     return useQuery({
       queryKey: ['meetings'],
       queryFn: async () => {
         return await pb.collection('tasks').getFullList({
           filter: 'type = "meeting"'
         })
       }
     })
   }

   // APRÈS
   import { tasksService } from '../services/tasks.service'

   export function useMeetings() {
     return useQuery({
       queryKey: ['meetings'],
       queryFn: () => tasksService.getMeetings()
     })
   }
   ```

4. **Tester**

#### Livrables
- [ ] tasks.service.js étendu avec méthodes meetings
- [ ] useMeetingAgenda.js migré
- [ ] Build réussi
- [ ] Tests manuels

---

### Tâche 6: Créer blockers.service.js
**Durée estimée:** 2 heures

#### Contexte
`useBlockers.js` contient 4 appels directs pour gérer les blockers (obstacles) des tâches.

#### Étapes
1. **Analyser le schéma**
   - Collection: `blockers` ou `task_blockers`?
   - Relations: Un blocker appartient à une task?

2. **Créer blockers.service.js**
   ```js
   class BlockersService {
     /**
      * Get all blockers for a task
      * @param {string} taskId - Task ID
      * @returns {Promise<Array>} Array of blockers
      */
     async getBlockersForTask(taskId) {
       const user = pb.authStore.model
       if (!user) return []

       try {
         return await pb.collection('blockers').getFullList({
           filter: `task_id = "${taskId}" && user_id = "${user.id}"`,
           sort: '-created'
         })
       } catch (error) {
         console.error('Error fetching blockers:', error)
         return []
       }
     }

     /**
      * Create a blocker
      * @param {string} taskId - Task ID
      * @param {Object} blockerData - Blocker data (description, status, etc.)
      * @returns {Promise<Object>} Created blocker
      */
     async create(taskId, blockerData) {
       const user = pb.authStore.model
       if (!user) throw new Error('Not authenticated')

       // Verify task ownership first
       const task = await pb.collection('tasks').getOne(taskId)
       if (task.user_id !== user.id) {
         throw new Error('Unauthorized')
       }

       return await pb.collection('blockers').create({
         ...blockerData,
         task_id: taskId,
         user_id: user.id
       })
     }

     /**
      * Resolve a blocker
      * @param {string} blockerId - Blocker ID
      * @returns {Promise<Object>} Updated blocker
      */
     async resolve(blockerId) {
       const user = pb.authStore.model
       if (!user) throw new Error('Not authenticated')

       const blocker = await pb.collection('blockers').getOne(blockerId)
       if (blocker.user_id !== user.id) {
         throw new Error('Unauthorized')
       }

       return await pb.collection('blockers').update(blockerId, {
         status: 'resolved',
         resolved_at: new Date().toISOString()
       })
     }
   }

   export const blockersService = new BlockersService()
   ```

3. **Migrer useBlockers.js**

4. **Tester**

#### Livrables
- [ ] blockers.service.js créé
- [ ] useBlockers.js migré
- [ ] Build réussi
- [ ] Tests manuels

---

## 🗓️ PHASE 2.3 - Semaine 3 (Priorité Basse + Finalisation)

### Tâche 7: Créer backup.service.js
**Durée estimée:** 3 heures

#### Contexte
`DataBackupSettings.jsx` contient 4 appels directs pour export/import de données.

**Note:** Les opérations de backup peuvent rester directes car elles nécessitent d'accéder à toutes les collections. Un service est quand même recommandé pour centraliser la logique.

#### Étapes
1. **Créer backup.service.js**
   ```js
   class BackupService {
     /**
      * Export all user data
      * @returns {Promise<Object>} Complete data export
      */
     async exportData() {
       const user = pb.authStore.model
       if (!user) throw new Error('Not authenticated')

       const data = {
         version: '1.0',
         exportedAt: new Date().toISOString(),
         user: {
           id: user.id,
           email: user.email
         },
         data: {}
       }

       // Export tasks
       data.data.tasks = await pb.collection('tasks').getFullList({
         filter: `user_id = "${user.id}"`
       })

       // Export campaigns
       data.data.campaigns = await pb.collection('campaigns').getFullList({
         filter: `user_id = "${user.id}"`
       })

       // Export workspaces
       data.data.workspaces = await pb.collection('contexts').getFullList({
         filter: `user_id = "${user.id}"`
       })

       // Export projects
       data.data.projects = await pb.collection('projects').getFullList({
         filter: `user_id = "${user.id}"`
       })

       // Export contacts
       data.data.contacts = await pb.collection('contacts').getFullList({
         filter: `user_id = "${user.id}"`
       })

       return data
     }

     /**
      * Import user data
      * @param {Object} data - Data to import
      * @returns {Promise<Object>} Import result
      */
     async importData(data) {
       const user = pb.authStore.model
       if (!user) throw new Error('Not authenticated')

       const results = {
         tasks: 0,
         campaigns: 0,
         workspaces: 0,
         projects: 0,
         contacts: 0,
         errors: []
       }

       // Import tasks
       for (const task of data.data.tasks || []) {
         try {
           const { id, created, updated, ...taskData } = task
           await pb.collection('tasks').create({
             ...taskData,
             user_id: user.id
           })
           results.tasks++
         } catch (error) {
           results.errors.push({ type: 'task', error: error.message })
         }
       }

       // Import other entities...

       return results
     }

     /**
      * Download data as JSON file
      * @returns {Promise<void>}
      */
     async downloadBackup() {
       const data = await this.exportData()
       const blob = new Blob([JSON.stringify(data, null, 2)], {
         type: 'application/json'
       })
       const url = URL.createObjectURL(blob)
       const a = document.createElement('a')
       a.href = url
       a.download = `superplanner-backup-${new Date().toISOString()}.json`
       a.click()
       URL.revokeObjectURL(url)
     }
   }

   export const backupService = new BackupService()
   ```

2. **Migrer DataBackupSettings.jsx**

3. **Tester**

#### Livrables
- [ ] backup.service.js créé
- [ ] DataBackupSettings.jsx migré
- [ ] Build réussi
- [ ] Tests manuels (export + import)

---

### Tâche 8-10: Services Simples (tags, comments, notes)
**Durée estimée:** 4.5 heures (1.5h chacun)

Ces trois services sont très similaires et suivent le pattern CRUD standard.

#### tags.service.js
```js
class TagsService {
  async getAll() { /* ... */ }
  async getOne(id) { /* ... */ }
  async create(data) { /* ... */ }
  async update(id, updates) { /* ... */ }
  async delete(id) { /* ... */ }

  // Specific methods
  async getTagsForTask(taskId) { /* ... */ }
  async addTagToTask(taskId, tagId) { /* ... */ }
  async removeTagFromTask(taskId, tagId) { /* ... */ }
}
```

#### comments.service.js
```js
class CommentsService {
  async getCommentsForTask(taskId) { /* ... */ }
  async create(taskId, comment) { /* ... */ }
  async update(commentId, updates) { /* ... */ }
  async delete(commentId) { /* ... */ }
}
```

#### notes.service.js
```js
class NotesService {
  async getNotesForTask(taskId) { /* ... */ }
  async create(taskId, note) { /* ... */ }
  async update(noteId, updates) { /* ... */ }
  async delete(noteId) { /* ... */ }
}
```

---

## ✅ Checklist Finale Phase 2

### Services Créés
- [ ] teams.service.js
- [ ] settings.service.js
- [ ] blockers.service.js
- [ ] backup.service.js
- [ ] tags.service.js
- [ ] comments.service.js
- [ ] notes.service.js

### Services Étendus
- [ ] tasks.service.js (bulk operations, meetings)

### Fichiers Migrés
- [ ] BulkActionsBar.jsx (0 appel direct)
- [ ] TeamSettings.jsx (0 appel direct)
- [ ] TaskModal.jsx (0 appel direct)
- [ ] Settings.jsx (0 appel direct)
- [ ] useMeetingAgenda.js (0 appel direct)
- [ ] useBlockers.js (0 appel direct)
- [ ] DataBackupSettings.jsx (0 appel direct)
- [ ] TagManager.jsx (0 appel direct)
- [ ] TaskComments.jsx (0 appel direct)
- [ ] TaskNotes.jsx (0 appel direct)

### Tests & Qualité
- [ ] Build réussi sans erreurs
- [ ] Tous les tests manuels passés
- [ ] 0 appel direct à PocketBase restant
- [ ] Documentation mise à jour (CHANGELOG.md)
- [ ] ETAT_DES_LIEUX mis à jour

---

## 🚨 Points d'Attention Critiques

### 1. Sécurité (TOUJOURS)
```js
// ✅ BON
const user = pb.authStore.model
if (!user) throw new Error('Not authenticated')

// Verify ownership
const record = await this.getOne(id)
if (record.user_id !== user.id) {
  throw new Error('Unauthorized')
}

// ❌ MAUVAIS
await pb.collection('tasks').delete(id) // Pas de vérification!
```

### 2. Échappement des Inputs (TOUJOURS)
```js
// ✅ BON
import { escapeFilterValue } from '../lib/filterUtils'
const safe = escapeFilterValue(userInput)
const filter = `name ~ "${safe}"`

// ❌ MAUVAIS
const filter = `name ~ "${userInput}"` // SQL injection!
```

### 3. Error Handling (TOUJOURS)
```js
// ✅ BON
try {
  const result = await service.method()
  toast.success('Success')
  return result
} catch (error) {
  console.error('Error:', error)
  toast.error(error.message || 'An error occurred')
  throw error // Rethrow for React Query
}

// ❌ MAUVAIS
await service.method() // No error handling!
```

### 4. Singleton Export (TOUJOURS)
```js
// ✅ BON
export const teamsService = new TeamsService()

// ❌ MAUVAIS
export default TeamsService // Export class instead of instance
```

---

## 📚 Ressources Utiles

### Documentation Projet
- **SERVICE_PATTERN_GUIDE.md** - Ton guide principal (à relire avant chaque service)
- **SERVICE_LAYER.md** - Architecture générale
- **ETAT_DES_LIEUX_2026-01-30.md** - État actuel du projet

### Exemples de Code
- **tasks.service.js** - Exemple complet avec filtres complexes
- **campaigns.service.js** - Exemple avec ownership checks
- **workspaces.service.js** - Exemple simple CRUD

### Commandes Utiles
```bash
# Build et vérifier erreurs
npm run build

# Trouver appels directs restants
grep -r "pb.collection" src/ --include="*.jsx" --include="*.js"

# Compter appels directs
grep -r "pb.collection" src/ --include="*.jsx" --include="*.js" | wc -l

# Tester en dev
npm run dev
```

---

## 📊 Suivi de Progression

Utilise ce tableau pour suivre ton avancement:

| Semaine | Tâche | Status | Build ✅ | Tests ✅ | Notes |
|---------|-------|--------|----------|----------|-------|
| 1 | BulkActionsBar | ⏳ | - | - | |
| 1 | teams.service | ⏳ | - | - | |
| 1 | TaskModal | ⏳ | - | - | |
| 2 | settings.service | ⏳ | - | - | |
| 2 | meetings | ⏳ | - | - | |
| 2 | blockers.service | ⏳ | - | - | |
| 3 | backup.service | ⏳ | - | - | |
| 3 | tags.service | ⏳ | - | - | |
| 3 | comments.service | ⏳ | - | - | |
| 3 | notes.service | ⏳ | - | - | |

Légende: ⏳ En cours | ✅ Terminé | ❌ Problème

---

## 🎯 Objectif Final

À la fin de Phase 2, on doit avoir:
- **0 appel direct à PocketBase** (contre 46 actuellement)
- **13 services au total** (6 existants + 7 nouveaux)
- **100% de couverture service layer**
- **Architecture propre et maintenable**

---

## 💬 Communication

Après chaque tâche complétée, communique:
1. Le service créé/étendu
2. Le fichier migré
3. Le nombre d'appels directs éliminés
4. Le résultat du build
5. Les tests effectués
6. Les problèmes rencontrés (si any)

Format:
```
✅ Tâche X complétée

Service: teams.service.js créé (189 lignes)
Fichier: TeamSettings.jsx migré
Appels éliminés: 9
Build: ✅ 2.31s
Tests: ✅ Invite, roles, remove testés
Problèmes: Aucun
```

---

**Bonne chance Gemini! Tu as fait un excellent travail en Phase 1, je suis confiant pour la Phase 2.** 🚀

**Rappel:** En cas de doute, consulte SERVICE_PATTERN_GUIDE.md et les exemples existants!
