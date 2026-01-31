# Gemini Quick Start - Phase 2

**Date:** 2026-01-30
**Objectif:** Éliminer les 46 appels PocketBase restants

---

## 🎯 Ta Mission

Tu as déjà créé 6 services en Phase 1 avec succès.
**Maintenant:** Créer 7 nouveaux services et migrer 10 fichiers.

**Résultat attendu:** 0 appel direct à PocketBase dans le code.

---

## 📋 Checklist AVANT de Commencer

- [ ] Lis **SERVICE_PATTERN_GUIDE.md** (ton guide de référence)
- [ ] Garde le template sous les yeux
- [ ] N'oublie JAMAIS:
  - ✅ Authentication check: `if (!user) throw new Error('Not authenticated')`
  - ✅ Ownership verification: `await this.getOne(id)` before update/delete
  - ✅ Input escaping: `escapeFilterValue(userInput)`
  - ✅ Singleton export: `export const xService = new XService()`

---

## 🗓️ Planning (3 Semaines)

### Semaine 1 - Haute Priorité
1. **BulkActionsBar.jsx** → Étendre tasks.service.js (2h)
2. **TeamSettings.jsx** → Créer teams.service.js (3h)
3. **TaskModal.jsx** → Utiliser tasks.service.js (2h)

### Semaine 2 - Priorité Moyenne
4. **Settings.jsx** → Créer settings.service.js (2h)
5. **useMeetingAgenda.js** → Étendre tasks.service.js (3h)
6. **useBlockers.js** → Créer blockers.service.js (2h)

### Semaine 3 - Priorité Basse + Finalisation
7. **DataBackupSettings.jsx** → Créer backup.service.js (3h)
8. **TagManager.jsx** → Créer tags.service.js (1.5h)
9. **TaskComments.jsx** → Créer comments.service.js (1.5h)
10. **TaskNotes.jsx** → Créer notes.service.js (1.5h)

**Total:** ~20 heures de travail

---

## 🚀 Comment Démarrer

### Pour chaque tâche:

```bash
# 1. Analyser le fichier
cat src/components/FichierCible.jsx
grep -n "pb.collection" src/components/FichierCible.jsx

# 2. Créer/étendre le service
# → Copie le template de SERVICE_PATTERN_GUIDE.md
# → Remplace [Entity] par ton entité
# → Implémente les méthodes nécessaires

# 3. Migrer le fichier
# → Remplace pb.collection(...) par xService.method()
# → Ajoute try-catch + toast
# → Supprime import pb

# 4. Tester
npm run build
npm run dev
# → Teste manuellement toutes les fonctions
```

---

## 📝 Template Rapide

```js
/**
 * [Entity] Service
 * @module services/[entity].service
 */
import pb from '../lib/pocketbase'

class [Entity]Service {
  async getAll(options = {}) {
    const user = pb.authStore.model
    if (!user) return []

    const filters = this._buildFilters(options, user.id)
    const filterString = filters.join(' && ')

    try {
      const queryOptions = { sort: '-created' }
      if (filterString) queryOptions.filter = filterString

      return await pb.collection('[entities]').getFullList(queryOptions)
    } catch (error) {
      console.error('❌ Error fetching [entities]:', error)
      return []
    }
  }

  async getOne(id) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const record = await pb.collection('[entities]').getOne(id)
    if (record.user_id !== user.id) {
      throw new Error('Unauthorized')
    }
    return record
  }

  async create(data) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const sanitized = this._sanitize(data)
    return await pb.collection('[entities]').create({
      ...sanitized,
      user_id: user.id
    })
  }

  async update(id, updates) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    await this.getOne(id) // Verify ownership
    const sanitized = this._sanitize(updates)
    return await pb.collection('[entities]').update(id, sanitized)
  }

  async delete(id) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    await this.getOne(id) // Verify ownership
    return await pb.collection('[entities]').delete(id)
  }

  _buildFilters(options, userId) {
    const filters = []
    filters.push(`user_id = "${userId}"`)
    // Add more filters...
    return filters
  }

  _sanitize(data) {
    const sanitized = { ...data }
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === '') sanitized[key] = null
    })
    return sanitized
  }
}

export const [entity]Service = new [Entity]Service()
```

---

## ⚠️ Erreurs à Éviter

### ❌ Pas de vérification ownership
```js
async delete(id) {
  return await pb.collection('x').delete(id) // DANGER!
}
```

### ✅ Avec vérification
```js
async delete(id) {
  const user = pb.authStore.model
  if (!user) throw new Error('Not authenticated')

  await this.getOne(id) // Throws if not owned
  return await pb.collection('x').delete(id)
}
```

---

### ❌ SQL injection
```js
const filter = `name ~ "${userInput}"` // DANGER!
```

### ✅ Input escaped
```js
import { escapeFilterValue } from '../lib/filterUtils'
const safe = escapeFilterValue(userInput)
const filter = `name ~ "${safe}"`
```

---

### ❌ Export class
```js
export default XService // WRONG
```

### ✅ Export singleton
```js
export const xService = new XService() // CORRECT
```

---

## 📊 Suivi de Progression

Après chaque tâche, communique:

```
✅ Tâche [N] complétée

Service: [nom].service.js créé/étendu ([X] lignes)
Fichier: [nom].jsx migré
Appels éliminés: [N]
Build: ✅ [temps]
Tests: ✅ [liste des tests]
```

---

## 📚 Documents à Consulter

1. **SERVICE_PATTERN_GUIDE.md** ← Ton guide principal
2. **INSTRUCTIONS_GEMINI_PHASE_2.md** ← Instructions détaillées
3. **ETAT_DES_LIEUX_2026-01-30.md** ← Context projet
4. **Exemples:**
   - tasks.service.js (filtres complexes)
   - campaigns.service.js (ownership checks)
   - workspaces.service.js (CRUD simple)

---

## 🎯 Objectif Final

**Phase 2 terminée =**
- 0 appel direct PocketBase ✅
- 13 services au total ✅
- 100% architecture service layer ✅

---

## 🚀 Commandes Utiles

```bash
# Build
npm run build

# Dev server
npm run dev

# Compter appels directs restants
grep -r "pb.collection" src/ --include="*.jsx" --include="*.js" | wc -l

# Voir les fichiers avec appels directs
grep -r "pb.collection" src/ --include="*.jsx" --include="*.js" | cut -d: -f1 | uniq
```

---

**Prêt? Commence par la Tâche 1 (BulkActionsBar.jsx)! 🚀**

**En cas de doute:** Relis SERVICE_PATTERN_GUIDE.md ou demande de l'aide!
