# Instructions Gemini - Phase 2.9 (Finalisation)

**Date:** 2026-01-30 17:20
**Objectif:** Éliminer les 11 derniers appels directs PocketBase
**Durée estimée:** 2-3 heures
**Score actuel:** 9/10 - Tu as fait un excellent travail! 🌟

---

## 🎯 Contexte

Tu as réalisé **90% de Phase 2** avec succès!

**Reste à faire:**
- ✅ Créer 1 service (timeTracking.service.js)
- ✅ Migrer 6 fichiers simples

**Appels directs restants:** 11 (hors auth/prayer)

---

## 📋 Checklist des Tâches

### Tâche 1: Créer timeTracking.service.js ⏱️ 1h

**Fichier:** `src/services/timeTracking.service.js`

**Contexte:**
Le fichier `useTimeTracking.js` a 3 appels directs à `pb.collection('task_time_logs')` pour gérer le suivi du temps passé sur les tâches.

**Code à créer:**

```js
/**
 * Time Tracking Service
 *
 * Centralized service for task time tracking operations.
 * Manages time logs for tasks (start, stop, pause, resume).
 *
 * @module services/timeTracking.service
 */

import pb from '../lib/pocketbase'

class TimeTrackingService {
  /**
   * Start tracking time for a task
   *
   * @param {string} taskId - Task ID
   * @param {string} description - Optional description
   * @returns {Promise<Object>} Created time log
   * @throws {Error} If not authenticated
   */
  async startTracking(taskId, description = '') {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    return await pb.collection('task_time_logs').create({
      task_id: taskId,
      user_id: user.id,
      start_time: new Date().toISOString(),
      description: description,
      is_running: true
    })
  }

  /**
   * Stop tracking time for a log
   *
   * @param {string} logId - Time log ID
   * @param {number} duration - Duration in seconds
   * @returns {Promise<Object>} Updated time log
   * @throws {Error} If not authenticated
   */
  async stopTracking(logId, duration) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    return await pb.collection('task_time_logs').update(logId, {
      end_time: new Date().toISOString(),
      duration: duration,
      is_running: false
    })
  }

  /**
   * Get a time log by ID
   *
   * @param {string} logId - Time log ID
   * @returns {Promise<Object>} Time log record
   * @throws {Error} If not authenticated or unauthorized
   */
  async getLogById(logId) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const log = await pb.collection('task_time_logs').getOne(logId)

    // Verify ownership
    if (log.user_id !== user.id) {
      throw new Error('Unauthorized: Cannot access this time log')
    }

    return log
  }

  /**
   * Get all time logs for a task
   *
   * @param {string} taskId - Task ID
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of time logs
   */
  async getLogsForTask(taskId, options = {}) {
    const user = pb.authStore.model
    if (!user) return []

    try {
      const filters = [`task_id = "${taskId}"`, `user_id = "${user.id}"`]

      const queryOptions = {
        filter: filters.join(' && '),
        sort: '-start_time'
      }

      return await pb.collection('task_time_logs').getFullList(queryOptions)
    } catch (error) {
      console.error('❌ Error fetching time logs:', error)
      return []
    }
  }

  /**
   * Get total time spent on a task
   *
   * @param {string} taskId - Task ID
   * @returns {Promise<number>} Total duration in seconds
   */
  async getTotalTimeForTask(taskId) {
    const logs = await this.getLogsForTask(taskId)
    return logs.reduce((total, log) => total + (log.duration || 0), 0)
  }

  /**
   * Pause tracking (optional - if needed)
   *
   * @param {string} logId - Time log ID
   * @returns {Promise<Object>} Updated time log
   */
  async pauseTracking(logId) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    return await pb.collection('task_time_logs').update(logId, {
      is_running: false,
      paused_at: new Date().toISOString()
    })
  }

  /**
   * Resume tracking (optional - if needed)
   *
   * @param {string} logId - Time log ID
   * @returns {Promise<Object>} Updated time log
   */
  async resumeTracking(logId) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    return await pb.collection('task_time_logs').update(logId, {
      is_running: true,
      paused_at: null
    })
  }

  /**
   * Delete a time log
   *
   * @param {string} logId - Time log ID
   * @returns {Promise<void>}
   * @throws {Error} If not authenticated or unauthorized
   */
  async delete(logId) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    // Verify ownership
    const log = await this.getLogById(logId)
    if (log.user_id !== user.id) {
      throw new Error('Unauthorized: Cannot delete this time log')
    }

    return await pb.collection('task_time_logs').delete(logId)
  }
}

export const timeTrackingService = new TimeTrackingService()
```

---

### Tâche 2: Migrer useTimeTracking.js ⏱️ 30 min

**Fichier:** `src/hooks/useTimeTracking.js`

**Appels directs à remplacer (3):**
- Ligne 15: `pb.collection('task_time_logs').create(...)`
- Ligne 43: `pb.collection('task_time_logs').getOne(...)`
- Ligne 49: `pb.collection('task_time_logs').update(...)`

**Instructions:**

1. **Ajouter l'import:**
```js
import { timeTrackingService } from '../services/timeTracking.service'
```

2. **Remplacer la ligne 15 (create):**
```js
// AVANT
const record = await pb.collection('task_time_logs').create({
    task_id: taskId,
    user_id: user.id,
    start_time: new Date().toISOString(),
    description: '',
    is_running: true
})

// APRÈS
const record = await timeTrackingService.startTracking(taskId, '')
```

3. **Remplacer la ligne 43 (getOne):**
```js
// AVANT
const currentLog = await pb.collection('task_time_logs').getOne(taskTimer.activeLogId)

// APRÈS
const currentLog = await timeTrackingService.getLogById(taskTimer.activeLogId)
```

4. **Remplacer la ligne 49 (update):**
```js
// AVANT
await pb.collection('task_time_logs').update(taskTimer.activeLogId, {
    end_time: new Date().toISOString(),
    duration: timeElapsed,
    is_running: false
})

// APRÈS
await timeTrackingService.stopTracking(taskTimer.activeLogId, timeElapsed)
```

5. **Supprimer l'import pb si plus utilisé:**
```js
// Si pb n'est plus utilisé ailleurs dans le fichier, supprimer:
// import pb from '../lib/pocketbase'
```

---

### Tâche 3: Migrer Tasks.jsx ⏱️ 15 min

**Fichier:** `src/pages/Tasks.jsx`

**Appels directs à remplacer (2):**
- Ligne 82: `pb.collection('tags').getFullList(...)`
- Ligne 83: `pb.collection('campaigns').getFullList(...)`

**Instructions:**

1. **Ajouter les imports:**
```js
import { tagsService } from '../services/tags.service'
import { campaignsService } from '../services/campaigns.service'
```

2. **Remplacer les lignes 82-83:**
```js
// AVANT
const [tagsData, campaignsData] = await Promise.all([
    pb.collection('tags').getFullList({ filter: `user_id = "${user.id}"`, sort: 'name' }),
    pb.collection('campaigns').getFullList({ filter: `user_id = "${user.id}"`, sort: 'name' })
])

// APRÈS
const [tagsData, campaignsData] = await Promise.all([
    tagsService.getAll(),
    campaignsService.getAll()
])
```

**Note:** Les services gèrent déjà le filtre `user_id` automatiquement, pas besoin de le passer.

---

### Tâche 4: Migrer Meetings.jsx ⏱️ 15 min

**Fichier:** `src/pages/Meetings.jsx`

**Appels directs à remplacer (2):**
- Ligne 83: `pb.collection('tags').getFullList(...)`
- Ligne 84: `pb.collection('campaigns').getFullList(...)`

**Instructions:** IDENTIQUES à Tasks.jsx

1. **Ajouter les imports:**
```js
import { tagsService } from '../services/tags.service'
import { campaignsService } from '../services/campaigns.service'
```

2. **Remplacer les lignes 83-84:**
```js
// AVANT
const [tagsData, campaignsData] = await Promise.all([
    pb.collection('tags').getFullList({ sort: 'name' }),
    pb.collection('campaigns').getFullList({ sort: 'name' })
])

// APRÈS
const [tagsData, campaignsData] = await Promise.all([
    tagsService.getAll(),
    campaignsService.getAll()
])
```

---

### Tâche 5: Migrer MeetingAgendaManager.jsx ⏱️ 20 min

**Fichier:** `src/components/MeetingAgendaManager.jsx`

**Appels directs à remplacer (2):**
- Ligne ~XX: `pb.collection('tasks').getList(...)`
- Ligne ~XX: `pb.collection('campaigns').getList(...)`

**Instructions:**

1. **Lire le fichier d'abord:**
```bash
cat src/components/MeetingAgendaManager.jsx | grep -n "pb.collection"
```

2. **Identifier le contexte des appels** (probablement dans une fonction de recherche)

3. **Ajouter les imports:**
```js
import { tasksService } from '../services/tasks.service'
import { campaignsService } from '../services/campaigns.service'
```

4. **Remplacer les appels par les services appropriés:**

Si c'est pour une recherche/autocomplete:
```js
// AVANT
const records = await pb.collection('tasks').getList(1, 5, {
    filter: `title ~ "${searchTerm}"`
})

// APRÈS
const allTasks = await tasksService.getAll()
const records = allTasks
    .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 5)
```

**Note:** Si tu as besoin d'une méthode `search()` dans tasksService, ajoute-la au service.

---

### Tâche 6: Migrer ContactModal.jsx ⏱️ 10 min

**Fichier:** `src/components/ContactModal.jsx`

**Appel direct à remplacer (1):**
- Ligne ~XX: `pb.collection('tasks').getList(...)`

**Instructions:**

1. **Lire le fichier:**
```bash
cat src/components/ContactModal.jsx | grep -n "pb.collection"
```

2. **Ajouter l'import:**
```js
import { tasksService } from '../services/tasks.service'
```

3. **Remplacer l'appel direct:**
```js
// AVANT
const records = await pb.collection('tasks').getList(1, 20, {
    filter: `...`
})

// APRÈS
const allTasks = await tasksService.getAll()
// Filtrer selon besoin
const records = allTasks.slice(0, 20)
```

---

### Tâche 7: Migrer BlockerManager.jsx ⏱️ 10 min

**Fichier:** `src/components/BlockerManager.jsx`

**Appel direct à remplacer (1):**
- Ligne ~XX: `pb.collection('tasks').getList(...)`

**Instructions:** SIMILAIRE à ContactModal.jsx

1. **Lire le fichier:**
```bash
cat src/components/BlockerManager.jsx | grep -n "pb.collection"
```

2. **Ajouter l'import:**
```js
import { tasksService } from '../services/tasks.service'
```

3. **Remplacer l'appel direct par tasksService.getAll()**

---

## ✅ Checklist Finale

Après avoir terminé toutes les tâches:

- [ ] **timeTracking.service.js créé** (1h)
- [ ] **useTimeTracking.js migré** (30 min)
- [ ] **Tasks.jsx migré** (15 min)
- [ ] **Meetings.jsx migré** (15 min)
- [ ] **MeetingAgendaManager.jsx migré** (20 min)
- [ ] **ContactModal.jsx migré** (10 min)
- [ ] **BlockerManager.jsx migré** (10 min)

---

## 🧪 Tests à Effectuer

Après chaque migration:

1. **Build:**
```bash
npm run build
```

2. **Compter les appels directs restants:**
```bash
grep -r "pb.collection" src/ --include="*.jsx" --include="*.js" --exclude-dir=services | wc -l
```

**Objectif:** 5 appels (LoginPocketBase x4, PrayerTimes x1)

3. **Test manuel UI:**
- Démarrer: `npm run dev`
- Tester le time tracking (démarrer/arrêter timer)
- Tester la page Tasks (filtres tags/campaigns)
- Tester la page Meetings (filtres tags/campaigns)
- Tester les modals (agenda, contact, blocker)

---

## 📊 Résultat Attendu

### Avant (Actuel)
- Appels directs: 16 (11 à migrer + 5 OK)
- Services: 14
- Score: 9/10

### Après (Objectif)
- Appels directs: 5 (tous OK - auth + prayer)
- Services: 15
- Score: 10/10 🏆

---

## 🚨 Points d'Attention

### 1. timeTracking.service.js
- ✅ Vérifie que les champs correspondent au schéma PocketBase
- ✅ Ajoute ownership checks dans getLogById()
- ✅ Gère les erreurs avec try-catch

### 2. Migration getList() vs getAll()
Certains appels utilisent `getList(1, 5, ...)` pour pagination/limite:
```js
// Si le code utilise getList() pour limiter les résultats:
pb.collection('tasks').getList(1, 5, { filter: '...' })

// Après migration, filtrer manuellement:
const allTasks = await tasksService.getAll()
const limitedTasks = allTasks.slice(0, 5)
```

### 3. Error Handling
Toujours ajouter try-catch + toast:
```js
try {
  const result = await timeTrackingService.startTracking(taskId)
  toast.success('Tracking started')
} catch (error) {
  console.error('Error:', error)
  toast.error(error.message || 'Failed to start tracking')
}
```

---

## 💬 Communication

Après avoir terminé, communique:

```
✅ Phase 2.9 complétée!

Services créés: timeTracking.service.js (XXX lignes)
Fichiers migrés: 6 fichiers (useTimeTracking, Tasks, Meetings, etc.)
Appels directs restants: 5 (tous OK - auth + prayer)

Build: ✅ 2.XXs
Tests: ✅ Time tracking testé, filtres testés, modals testés

Résultat final:
- 15 services
- 5 appels directs (tous justifiés)
- 96% couverture service layer
- Score: 10/10 🏆
```

---

## 🎯 Tu es Presque au 10/10!

Tu as déjà fait un excellent travail avec 9/10.
Ces dernières tâches sont simples et te mèneront à la perfection!

**Bonne chance! 🚀**

---

**Rappel:** En cas de doute, consulte SERVICE_PATTERN_GUIDE.md pour le template!
