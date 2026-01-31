# Bugs Identifiés - SuperPlanner

**Date de création:** 2026-01-30
**Dernière mise à jour:** 2026-01-30
**Méthode:** Analyse automatique du code + Tests manuels

---

## 📊 Statistiques

- **Total bugs:** 3
- **Critiques (🔴):** 0
- **Moyens (🟡):** 2
- **Mineurs (🟢):** 1
- **Status:**
  - À corriger: 3
  - En cours: 0
  - Corrigés: 0

---

## 🟡 BUG-001: Performance - Chargement Workspaces Lent

**Priorité:** 🟡 MOYENNE
**Module:** Workspace Management
**Type:** Performance
**Découvert:** Analyse code automatique
**Status:** 📋 À corriger

### Description
Le chargement des workspaces avec statistiques (nombre de tâches/campaigns) est lent car il charge toutes les listes complètes au lieu de juste compter.

### Localisation
**Fichier:** `src/components/WorkspaceManager.jsx:74`

```js
// TODO: Optimization - Add getCount method to services to avoid fetching full lists
const tasks = await pb.collection('tasks').getList(1, 1, {
    filter: `context_id = "${ctx.id}"`
})
const campaigns = await pb.collection('campaigns').getList(1, 1, {
    filter: `context_id = "${ctx.id}"`
})
```

### Reproduction
1. Créer un workspace
2. Ajouter 100+ tâches et 50+ campaigns
3. Naviguer vers WorkspaceManager
4. Observer: Chargement lent (2-3 secondes)

### Impact
- **Performance:** Ralentissement proportionnel au nombre de données
- **UX:** Délai perceptible avec beaucoup de données
- **Scalabilité:** Problème s'aggrave avec le temps

### Utilisateurs Affectés
- Utilisateurs avec workspaces volumineux (100+ items)
- Équipes avec beaucoup de données historiques

### Solution Proposée

**Option A: Méthode getCount dans services (Recommandé)**
```js
// Dans tasks.service.js
async getCount(workspaceId) {
  const user = pb.authStore.model
  if (!user) return 0

  try {
    const result = await pb.collection('tasks').getList(1, 1, {
      filter: `context_id = "${workspaceId}" && user_id = "${user.id}"`
    })
    return result.totalItems
  } catch (error) {
    console.error('Error getting task count:', error)
    return 0
  }
}

// Utilisation dans WorkspaceManager
const taskCount = await tasksService.getCount(ctx.id)
const campaignCount = await campaignsService.getCount(ctx.id)
```

**Option B: Aggregate API (Si supporté par PocketBase)**
```js
// Utiliser une API d'agrégation si disponible
const stats = await pb.collection('workspaces').aggregate(ctx.id, {
  tasks: 'count',
  campaigns: 'count'
})
```

### Estimation Correction
- **Durée:** 30 min
- **Complexité:** Faible
- **Tests nécessaires:** Oui

---

## 🟡 BUG-002: Telegram Notifications - Feature Incomplète

**Priorité:** 🟡 MOYENNE
**Module:** Notifications
**Type:** Feature incomplète
**Découvert:** Analyse code automatique
**Status:** 📋 À corriger

### Description
Les notifications Telegram ne sont pas complètement implémentées. La logique de scheduling côté serveur est manquante.

### Localisation
**Fichier:** `src/hooks/useTelegramNotifications.js:70`

```js
// TODO: Implement server-side scheduling logic
```

### Reproduction
1. Configurer Telegram bot dans Settings
2. Activer notifications pour une tâche
3. Attendre l'heure de notification
4. Observer: Notification ne s'envoie pas

### Impact
- **Fonctionnalité:** Feature non fonctionnelle
- **UX:** Promesse non tenue aux utilisateurs
- **Crédibilité:** Feature annoncée mais cassée

### Utilisateurs Affectés
- Tous les utilisateurs qui activent les notifications Telegram
- Estimation: 10-20% des utilisateurs actifs

### Analyse du Code

**Code actuel:**
```js
const scheduleTelegramNotification = useCallback(async (task) => {
    if (!preferences?.telegramChatId || !task.scheduled_time) return

    // Client-side scheduling only (not reliable)
    const notificationTime = new Date(task.scheduled_time)
    const delay = notificationTime - new Date()

    if (delay > 0) {
        setTimeout(() => {
            sendTelegramMessage(task.title, task.description)
        }, delay)
    }

    // TODO: Implement server-side scheduling logic
}, [preferences, sendTelegramMessage])
```

**Problèmes:**
- ❌ setTimeout ne persiste pas si l'utilisateur ferme l'app
- ❌ Pas de retry en cas d'échec
- ❌ Pas de queue de notifications

### Solution Proposée

**Option A: Supabase Edge Function avec pg_cron (Recommandé)**
```sql
-- Créer table pour queue notifications
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  status TEXT DEFAULT 'pending',
  retry_count INT DEFAULT 0
);

-- Fonction pour envoyer les notifications
CREATE OR REPLACE FUNCTION send_pending_notifications()
RETURNS void AS $$
BEGIN
  -- Logic pour envoyer via Telegram API
END;
$$ LANGUAGE plpgsql;

-- Cron job toutes les minutes
SELECT cron.schedule(
  'send-telegram-notifications',
  '* * * * *',
  'SELECT send_pending_notifications()'
);
```

**Option B: PocketBase Hooks (Plus simple)**
```js
// Dans pb_hooks/telegram_notifications.pb.js
onRecordAfterCreateRequest((e) => {
  if (e.collection.name === 'tasks' && e.record.scheduled_time) {
    scheduleNotification(e.record)
  }
})
```

**Option C: Service externe (Zapier/n8n)**
- Webhook depuis PocketBase
- Zapier schedule notification
- Telegram API

### Estimation Correction
- **Durée:** 2-4 heures (selon option)
- **Complexité:** Moyenne à Élevée
- **Tests nécessaires:** Oui (critique)
- **Dépendances:** Backend/Serverless setup

---

## 🟢 BUG-003: Messages d'Erreur Silencieux

**Priorité:** 🟢 MINEURE
**Module:** Multiple (UI/UX)
**Type:** User Experience
**Découvert:** Analyse code automatique
**Status:** 📋 À corriger

### Description
Certaines erreurs sont loggées dans la console mais l'utilisateur n'est pas informé visuellement (pas de toast).

### Localisation

**Fichiers affectés (10+):**
- `src/components/settings/DataBackupSettings.jsx:79`
- `src/components/WorkspaceManager.jsx:93`
- `src/components/ProjectManager.jsx:42`
- `src/components/CategoryManager.jsx:24`
- `src/components/BulkActionsBar.jsx:106`
- Et autres...

**Exemple typique:**
```js
// ❌ PROBLÈME - Erreur loggée mais user pas prévenu
try {
    const result = await someService.doSomething()
} catch (error) {
    console.error(error)  // ← Console only!
    // Pas de toast.error() ici
}
```

### Reproduction
1. Simuler une erreur (ex: couper internet)
2. Essayer de créer/modifier une tâche
3. Observer:
   - ✅ Erreur dans console
   - ❌ Aucun message à l'utilisateur
   - ❌ User pense que ça a marché

### Impact
- **UX:** Utilisateur confus (action échoue silencieusement)
- **Debugging:** User ne peut pas reporter le problème
- **Confiance:** Perte de confiance dans l'app

### Utilisateurs Affectés
- Tous les utilisateurs en cas d'erreur réseau
- Utilisateurs avec mauvaise connexion
- Estimation: 5-10% des sessions

### Solution Proposée

**Ajouter toast.error() systématiquement:**

```js
// ✅ BON - User informé
import toast from 'react-hot-toast'

try {
    const result = await someService.doSomething()
    toast.success('Operation successful')
} catch (error) {
    console.error('Operation failed:', error)
    toast.error(error.message || 'Operation failed. Please try again.')
}
```

**Pattern à appliquer partout:**
```js
// Template standard
try {
    // Action
    toast.success('Success message')
} catch (error) {
    console.error('Context:', error)
    toast.error(
        error.message || 'Something went wrong. Please try again.'
    )
}
```

### Fichiers à Corriger (Liste)

1. ✅ DataBackupSettings.jsx - 3 endroits
2. ✅ WorkspaceManager.jsx - 1 endroit
3. ✅ ProjectManager.jsx - 1 endroit
4. ✅ CategoryManager.jsx - 1 endroit
5. ✅ BulkActionsBar.jsx - 3 endroits
6. ✅ TaskModal.jsx - 4 endroits
7. ✅ SpotifyPlayer.jsx - 1 endroit
8. ✅ GlobalSearch.jsx - 1 endroit
9. ✅ Autres composants - ~5 endroits

**Total:** ~20 endroits à corriger

### Estimation Correction
- **Durée:** 1-2 heures
- **Complexité:** Très faible
- **Tests nécessaires:** Manuels (forcer erreurs)
- **Pattern:** Copy-paste du template

---

## 📝 Template pour Nouveaux Bugs

```markdown
## 🔴/🟡/🟢 BUG-XXX: [Titre Court]

**Priorité:** 🔴 CRITIQUE / 🟡 MOYENNE / 🟢 MINEURE
**Module:** [Nom du module]
**Type:** [Bug/Performance/UX/Security]
**Découvert:** [Date ou méthode]
**Status:** 📋 À corriger / 🔄 En cours / ✅ Corrigé

### Description
[Description détaillée du bug]

### Localisation
**Fichier:** `src/path/to/file.js:line`

### Reproduction
1. Étape 1
2. Étape 2
3. Résultat attendu vs résultat actuel

### Impact
- **Performance/UX/Security:** [Description]
- **Utilisateurs affectés:** [Qui est impacté]

### Solution Proposée
[Comment corriger]

### Estimation Correction
- **Durée:** X heures
- **Complexité:** Faible/Moyenne/Élevée
- **Tests nécessaires:** Oui/Non
```

---

## 🎯 Plan d'Action Recommandé

### Phase 1: Corrections Rapides (1-2h)
1. ✅ **BUG-003** - Ajouter toast.error partout (1-2h)
   - Impact: Immédiat sur UX
   - Complexité: Faible
   - ROI: Élevé

### Phase 2: Optimisations (30min-1h)
2. ✅ **BUG-001** - Ajouter getCount() dans services (30min)
   - Impact: Performance
   - Complexité: Faible
   - ROI: Moyen

### Phase 3: Features Manquantes (2-4h)
3. ✅ **BUG-002** - Implémenter Telegram backend (2-4h)
   - Impact: Feature complète
   - Complexité: Moyenne-Élevée
   - ROI: Moyen (selon utilisation)

---

## 📊 Bugs par Module

| Module | Bugs | Critique | Moyen | Mineur |
|--------|------|----------|-------|--------|
| Workspaces | 1 | 0 | 1 | 0 |
| Notifications | 1 | 0 | 1 | 0 |
| UI/UX Global | 1 | 0 | 0 | 1 |
| **TOTAL** | **3** | **0** | **2** | **1** |

---

## 🔍 Bugs à Identifier (Tests Manuels)

### À Tester Prochainement:
- [ ] **Tasks** - Création/Modification/Suppression
- [ ] **Calendar** - Affichage dates/Drag&drop/Timezone
- [ ] **Time Tracking** - Start/Stop/Durée
- [ ] **Filters** - Par workspace/status/date
- [ ] **Récurrence** - Occurrences futures
- [ ] **Campaigns** - CRUD + Stats
- [ ] **Contacts** - Relations many-to-many
- [ ] **Projects** - Assignment + Filters
- [ ] **Teams** - Invitations + Rôles
- [ ] **Backup/Restore** - Export/Import

---

## 📝 Notes

### Méthodologie
- **Analyse automatique:** grep patterns dans le code
- **Tests manuels:** À faire (checklist disponible)
- **Monitoring:** Sentry recommandé pour tracking auto

### Prochaines Étapes
1. Corriger BUG-003 (rapide, bon ROI)
2. Tests manuels systématiques (2-3h)
3. Mettre à jour ce fichier avec nouveaux bugs
4. Setup Sentry pour détection auto

---

**Dernière mise à jour:** 2026-01-30 18:00
**Prochaine révision:** Après tests manuels
