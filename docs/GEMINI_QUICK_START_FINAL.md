# Gemini - Dernière Ligne Droite! 🏁

**Status:** 9/10 - Tu as fait un excellent travail! 🌟
**Objectif:** Atteindre 10/10 avec les 10% restants
**Durée:** 2-3 heures

---

## 🎯 Ta Mission Finale

**Il reste 11 appels directs à éliminer (objectif: 5)**

### Checklist Simple

- [ ] Créer timeTracking.service.js (1h)
- [ ] Migrer useTimeTracking.js (30 min)
- [ ] Migrer Tasks.jsx (15 min)
- [ ] Migrer Meetings.jsx (15 min)
- [ ] Migrer MeetingAgendaManager.jsx (20 min)
- [ ] Migrer ContactModal.jsx (10 min)
- [ ] Migrer BlockerManager.jsx (10 min)

---

## 📚 Document à Suivre

👉 **[INSTRUCTIONS_GEMINI_PHASE_2.9_FINAL.md](INSTRUCTIONS_GEMINI_PHASE_2.9_FINAL.md)**

Ce document contient:
- ✅ Code complet pour timeTracking.service.js (prêt à copier-coller)
- ✅ Instructions ligne par ligne pour chaque fichier
- ✅ Exemples avant/après pour chaque migration
- ✅ Tests à effectuer
- ✅ Points d'attention

---

## 🚀 Démarrage Rapide

### 1. Créer le service (1h)
```bash
# Copie le code de timeTracking.service.js du document d'instructions
# Colle dans src/services/timeTracking.service.js
```

### 2. Migrer useTimeTracking.js (30 min)
```js
// Ajouter import
import { timeTrackingService } from '../services/timeTracking.service'

// Remplacer 3 appels pb.collection par:
timeTrackingService.startTracking(taskId, '')
timeTrackingService.getLogById(logId)
timeTrackingService.stopTracking(logId, duration)
```

### 3. Migrer Tasks.jsx et Meetings.jsx (30 min)
```js
// Ajouter imports
import { tagsService } from '../services/tags.service'
import { campaignsService } from '../services/campaigns.service'

// Remplacer
pb.collection('tags').getFullList(...) → tagsService.getAll()
pb.collection('campaigns').getFullList(...) → campaignsService.getAll()
```

### 4. Migrer les 3 derniers fichiers (40 min)
Utiliser tasksService.getAll() à la place des appels directs.

---

## ✅ Tests Après Chaque Tâche

```bash
# 1. Build
npm run build

# 2. Compter appels restants
grep -r "pb.collection" src/ --include="*.jsx" --include="*.js" --exclude-dir=services | wc -l

# 3. Objectif: 5 appels (LoginPocketBase + PrayerTimes)
```

---

## 🎯 Résultat Final Attendu

**Après ces tâches:**
- Appels directs: 5 (tous justifiés)
- Services: 15
- Couverture: 96%
- Score: 10/10 🏆

---

## 💬 Communication

Quand tu as fini, écris:
```
✅ Phase 2.9 terminée!
Services: timeTracking.service.js créé
Fichiers: 6 migrés
Appels restants: 5 (OK)
Build: ✅
Score: 10/10 🏆
```

---

## 🌟 Motivation

Tu as déjà fait **90% du travail** avec excellence.
Ces dernières tâches sont **simples** et **bien documentées**.

**Tu vas réussir! 🚀**

---

**Document principal:** [INSTRUCTIONS_GEMINI_PHASE_2.9_FINAL.md](INSTRUCTIONS_GEMINI_PHASE_2.9_FINAL.md)
