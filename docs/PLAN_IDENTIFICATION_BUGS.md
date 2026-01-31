# Plan d'Identification des Bugs Fonctionnels

**Date:** 2026-01-30
**Objectif:** Identifier et cataloguer tous les bugs fonctionnels avant Phase 3

---

## 🎯 Stratégie d'Identification

### Approche Multi-Niveaux:

1. **Analyse Console** (10 min) - Erreurs JavaScript
2. **Tests Manuels Systématiques** (2-3h) - Tester chaque feature
3. **Analyse des Logs** (30 min) - Erreurs serveur PocketBase
4. **Code Review Critique** (1h) - Points sensibles
5. **Tests Utilisateurs** (optionnel) - Feedback réel

---

## 🔍 NIVEAU 1: Analyse Console (RAPIDE)

### Script de Détection Auto

Créer un fichier: `scripts/check-bugs.js`

```js
#!/usr/bin/env node

/**
 * Script pour identifier les bugs potentiels
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Analyse des bugs potentiels...\n')

// 1. Chercher les console.error non gérés
console.log('1️⃣ Recherche console.error...')
const { execSync } = require('child_process')

try {
  const errors = execSync(
    'grep -r "console.error" src/ --include="*.jsx" --include="*.js" | grep -v "// " | grep -v "//"',
    { encoding: 'utf-8' }
  )
  console.log('   ⚠️ Console.error trouvés:')
  console.log(errors)
} catch (e) {
  console.log('   ✅ Aucun console.error non commenté\n')
}

// 2. Chercher les TODO/FIXME
console.log('2️⃣ Recherche TODO/FIXME...')
try {
  const todos = execSync(
    'grep -rn "TODO\\|FIXME\\|HACK\\|BUG" src/ --include="*.jsx" --include="*.js"',
    { encoding: 'utf-8' }
  )
  console.log('   ⚠️ TODO/FIXME trouvés:')
  console.log(todos)
} catch (e) {
  console.log('   ✅ Aucun TODO/FIXME trouvé\n')
}

// 3. Chercher les try-catch vides
console.log('3️⃣ Recherche try-catch suspects...')
try {
  const emptyCatch = execSync(
    'grep -A 2 "catch" src/ --include="*.jsx" --include="*.js" | grep -B 1 "{}"',
    { encoding: 'utf-8' }
  )
  console.log('   ⚠️ Catch vides trouvés:')
  console.log(emptyCatch)
} catch (e) {
  console.log('   ✅ Pas de catch vide évident\n')
}

// 4. Chercher les appels sans error handling
console.log('4️⃣ Recherche appels async sans try-catch...')
console.log('   ℹ️ Vérification manuelle recommandée\n')

console.log('✅ Analyse terminée!\n')
console.log('📝 Prochaine étape: Tests manuels systématiques')
```

### Commande Rapide:

```bash
# Créer le script
node scripts/check-bugs.js

# OU directement:
# 1. Erreurs console
grep -rn "console.error\|console.warn" src/ --include="*.jsx" --include="*.js"

# 2. TODO/FIXME
grep -rn "TODO\|FIXME\|HACK\|BUG" src/ --include="*.jsx" --include="*.js"

# 3. Appels pb.collection restants (déjà fait: 5)
grep -rn "pb.collection" src/ --include="*.jsx" --include="*.js" --exclude-dir=services
```

---

## 📋 NIVEAU 2: Checklist Tests Manuels Systématiques

### Phase 1: Tests Critiques (30 min)

#### A. Authentification 🔐
- [ ] Login avec email/password
  - [ ] Credentials valides → Dashboard
  - [ ] Credentials invalides → Message erreur
  - [ ] Champs vides → Validation
- [ ] Inscription
  - [ ] Nouveau compte → Success
  - [ ] Email existant → Message erreur
- [ ] Login Google OAuth
  - [ ] Flow complet → Dashboard
- [ ] Logout
  - [ ] Déconnexion → Retour login

**Bugs Potentiels:**
- Token expiration non gérée
- Redirection après login
- Session persistance

---

#### B. Gestion des Tâches ✅
- [ ] **Créer une tâche**
  - [ ] Formulaire vide → Validation
  - [ ] Tâche simple → Créée et visible
  - [ ] Tâche avec tous les champs → Créée correctement
  - [ ] Tâche récurrente → Occurrences futures visibles
- [ ] **Modifier une tâche**
  - [ ] Changer titre → Sauvegardé
  - [ ] Changer status → Mis à jour
  - [ ] Changer dates → Dates correctes
- [ ] **Supprimer une tâche**
  - [ ] Soft delete → Va dans Trash
  - [ ] Restore → Revient dans liste
  - [ ] Hard delete → Supprimé définitivement
- [ ] **Filtres**
  - [ ] Par workspace → Filtre correct
  - [ ] Par status → Filtre correct
  - [ ] Par priority → Filtre correct
  - [ ] Par date → Filtre correct

**Bugs Potentiels:**
- Dates timezone issues
- Récurrence broken
- Filtres ne marchent pas
- Soft delete non fonctionnel

---

#### C. Calendrier 📅
- [ ] **Affichage**
  - [ ] Vue mois → Tâches affichées
  - [ ] Vue semaine → Tâches affichées
  - [ ] Vue jour → Tâches affichées
- [ ] **Interactions**
  - [ ] Cliquer tâche → Modal ouverture
  - [ ] Drag & drop tâche → Déplacement
  - [ ] Cliquer slot vide → Création tâche
- [ ] **Prayer Times**
  - [ ] Horaires affichés correctement
  - [ ] Couleur différente
  - [ ] Non modifiables

**Bugs Potentiels:**
- Tâches manquantes dans calendrier
- Drag & drop broken
- Dates incorrectes (timezone)
- Test event encore visible

---

#### D. Time Tracking ⏱️
- [ ] **Start tracking**
  - [ ] Démarrer → Timer visible
  - [ ] Log créé dans DB
- [ ] **Stop tracking**
  - [ ] Arrêter → Durée enregistrée
  - [ ] Log mis à jour
- [ ] **Affichage temps**
  - [ ] Total temps par tâche
  - [ ] Historique des logs

**Bugs Potentiels:**
- Timer ne démarre pas
- Durée incorrecte
- Logs perdus

---

### Phase 2: Tests Secondaires (1h)

#### E. Campaigns 📊
- [ ] Créer campaign
- [ ] Modifier campaign
- [ ] Supprimer campaign
- [ ] Stats affichées correctement
- [ ] Gantt chart fonctionne

#### F. Contacts 👥
- [ ] Créer contact
- [ ] Modifier contact
- [ ] Supprimer contact
- [ ] Relations context (many-to-many)
- [ ] Timeline activités

#### G. Projects 🎯
- [ ] Créer projet
- [ ] Assigner tâches à projet
- [ ] Filtrer tâches par projet
- [ ] Archive projet

#### H. Teams 👥
- [ ] Inviter membre
- [ ] Changer rôle membre
- [ ] Retirer membre
- [ ] Liste membres correcte

#### I. Settings ⚙️
- [ ] Modifier préférences
- [ ] Prayer location
- [ ] Thème (dark/light)
- [ ] Sauvegarde des settings

#### J. Backup/Restore 💾
- [ ] Export données → JSON téléchargé
- [ ] Import données → Données restaurées
- [ ] Validation format

---

### Phase 3: Tests Edge Cases (1h)

#### K. Cas Limites
- [ ] **Champs vides**
  - [ ] Créer tâche sans titre
  - [ ] Dates invalides
  - [ ] Champs requis manquants
- [ ] **Gros volumes**
  - [ ] 100+ tâches → Performance OK
  - [ ] Filtres avec gros volumes
  - [ ] Pagination
- [ ] **Concurrence**
  - [ ] Modifier même tâche 2 onglets
  - [ ] Supprimer puis modifier
- [ ] **Offline**
  - [ ] Couper connexion → Message erreur
  - [ ] Reconnexion → Sync data

---

## 🔧 NIVEAU 3: Démarrage Mode Debug

### Setup pour Identifier Bugs:

1. **Ouvrir DevTools**
```bash
npm run dev
# Ouvrir http://localhost:5173
# F12 → Console
```

2. **Activer Verbose Logging**

Modifier temporairement les services pour logger:

```js
// Exemple: src/services/tasks.service.js
async getAll(options = {}) {
  console.log('🔍 [TasksService] getAll called with:', options)

  try {
    const result = await pb.collection('tasks').getFullList(...)
    console.log('✅ [TasksService] getAll result:', result.length, 'tasks')
    return result
  } catch (error) {
    console.error('❌ [TasksService] getAll error:', error)
    throw error
  }
}
```

3. **Activer React DevTools**
```bash
# Installer extension Chrome/Firefox
# React Developer Tools
```

---

## 📊 NIVEAU 4: Template de Rapport Bug

### Créer: `BUGS_FOUND.md`

```markdown
# Bugs Identifiés - SuperPlanner

**Date:** 2026-01-30
**Testeur:** [Nom]

---

## 🔴 Bugs Critiques (Bloquants)

### BUG-001: [Titre court]
**Priorité:** 🔴 CRITIQUE
**Module:** Tasks
**Description:** Impossible de créer une tâche avec date récurrente
**Reproduction:**
1. Ouvrir modal création tâche
2. Sélectionner "Récurrence: Hebdomadaire"
3. Cliquer "Créer"
4. → Erreur: "Failed to create task"

**Erreur Console:**
```
Error: Invalid recurrence pattern
  at tasksService.create (tasks.service.js:89)
```

**Impact:** Utilisateurs ne peuvent pas créer tâches récurrentes
**Solution Proposée:** Vérifier validation recurrence pattern

---

## 🟡 Bugs Moyens (Gênants)

### BUG-002: [Titre]
...

---

## 🟢 Bugs Mineurs (Cosmétiques)

### BUG-003: [Titre]
...

---

## 📊 Statistiques

- Total bugs: XX
- Critiques: XX (XX%)
- Moyens: XX (XX%)
- Mineurs: XX (XX%)

Modules les plus affectés:
1. Tasks: XX bugs
2. Calendar: XX bugs
3. ...
```

---

## 🚀 NIVEAU 5: Outils Automatisés

### A. Installer Sentry (Error Tracking)

```bash
npm install @sentry/react
```

```js
// src/main.jsx
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "development",
  tracesSampleRate: 1.0,
})
```

**Bénéfice:** Capture automatique de toutes les erreurs

---

### B. Installer React Error Boundary

```js
// src/components/ErrorBoundary.jsx
import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔴 ErrorBoundary caught:', error, errorInfo)
    // Envoyer à Sentry
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h1>Something went wrong</h1>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
          <button onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
```

---

### C. Logger Centralisé

```js
// src/lib/logger.js
class Logger {
  error(message, context = {}) {
    console.error(`❌ [ERROR] ${message}`, context)
    // Envoyer à Sentry
    if (window.Sentry) {
      window.Sentry.captureException(new Error(message), { extra: context })
    }
  }

  warn(message, context = {}) {
    console.warn(`⚠️ [WARN] ${message}`, context)
  }

  info(message, context = {}) {
    console.info(`ℹ️ [INFO] ${message}`, context)
  }

  debug(message, context = {}) {
    if (import.meta.env.DEV) {
      console.debug(`🔍 [DEBUG] ${message}`, context)
    }
  }
}

export const logger = new Logger()
```

**Usage dans services:**
```js
import { logger } from '../lib/logger'

async getAll() {
  try {
    // ...
  } catch (error) {
    logger.error('Failed to fetch tasks', { error, userId: user.id })
    throw error
  }
}
```

---

## 📋 Plan d'Action Immédiat

### Option A: Tests Manuels Complets (2-3h)
1. ✅ Suivre la checklist Phase 1 (30 min)
2. ✅ Suivre la checklist Phase 2 (1h)
3. ✅ Noter tous les bugs dans BUGS_FOUND.md
4. ✅ Prioriser les bugs
5. ✅ Créer issues GitHub (optionnel)

### Option B: Setup Monitoring d'Abord (1h)
1. ✅ Installer Sentry (20 min)
2. ✅ Installer Error Boundary (20 min)
3. ✅ Ajouter logger centralisé (20 min)
4. ✅ Tester → Les erreurs remontent auto

### Option C: Combo (Recommandé) (3-4h)
1. ✅ Setup monitoring (1h)
2. ✅ Tests manuels avec monitoring actif (2h)
3. ✅ Analyser erreurs capturées (30 min)
4. ✅ Créer rapport final (30 min)

---

## 🎯 Résultat Attendu

À la fin, tu auras:
- ✅ Liste complète des bugs (BUGS_FOUND.md)
- ✅ Bugs priorisés (Critique/Moyen/Mineur)
- ✅ Système de monitoring en place
- ✅ Visibilité sur la santé de l'app
- ✅ Plan d'action pour corriger

---

## 💡 Recommandation

**Commence par Option C (Combo):**

1. **Maintenant:** Setup monitoring (1h)
   - Installe Sentry + Error Boundary
   - Ça capture les erreurs automatiquement

2. **Ensuite:** Tests manuels (2h)
   - Suis la checklist systématiquement
   - Note chaque bug trouvé

3. **Après:** Analyse & Priorisation (1h)
   - Regarde les erreurs Sentry
   - Crée BUGS_FOUND.md
   - Priorise les corrections

4. **Enfin:** Phase "Bug Fixing" (variable)
   - Corrige bugs critiques d'abord
   - Puis moyens, puis mineurs

---

**Veux-tu que je:**
1. **Crée le script d'analyse** check-bugs.js?
2. **Setup Sentry + Error Boundary** maintenant?
3. **Génère la checklist** dans un fichier séparé?
4. **Lance les tests manuels** avec toi (je guide)?

Quelle approche préfères-tu? 🎯
