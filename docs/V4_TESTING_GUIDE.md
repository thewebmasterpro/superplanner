# Guide de Test - V4 Gamification System

**Date:** 2026-02-05
**Version:** v1.2.0
**Statut:** Team Rewards implémenté ✅

---

## 📋 Pré-requis

Avant de commencer les tests, assurez-vous d'avoir:

1. ✅ Code V4 committé (commit `ce5a24a`)
2. ⏳ Collections PocketBase créées (voir instructions ci-dessous)
3. ⏳ Au moins une équipe créée avec vous comme propriétaire
4. ⏳ Au moins un autre membre dans votre équipe

---

## 🗄️ Étape 1: Créer les Collections dans PocketBase

### Option A: Création Manuelle (Recommandé pour comprendre)

#### Collection `team_rewards`

1. Ouvrir PocketBase Admin: `http://127.0.0.1:8090/_/`
2. Collections → New collection → Base collection
3. Nom: `team_rewards`
4. Ajouter les champs:

   | Nom | Type | Config |
   |-----|------|--------|
   | `team_id` | Relation | Single, Required, Collection: teams, Display: name |
   | `name` | Text | Required |
   | `description` | Text | Optional |
   | `points` | Number | Required, Min: 1 |
   | `start_date` | **Date** | Optional |
   | `end_date` | **Date** | Optional |
   | `created_by` | Relation | Single, Required, Collection: users, Display: name, email |
   | `created_at` | DateTime | Required, Default: `@now` |
   | `updated_at` | DateTime | Required, Default: `@now` |

5. API Rules:
   - **List/View**: `@request.auth.id != ""`
   - **Create**: `@request.auth.id != ""`
   - **Update**: `@request.auth.id != "" && team_id.owner_id = @request.auth.id`
   - **Delete**: `@request.auth.id != "" && team_id.owner_id = @request.auth.id`

6. Indexes:
   - Index sur `team_id`
   - Index sur `created_by`

7. Sauvegarder

#### Collection `team_reward_history`

1. Collections → New collection → Base collection
2. Nom: `team_reward_history`
3. Ajouter les champs:

   | Nom | Type | Config |
   |-----|------|--------|
   | `team_id` | Relation | Single, Required, Collection: teams, Display: name |
   | `reward_id` | Relation | Single, Required, Collection: team_rewards, Display: name |
   | `member_id` | Relation | Single, Required, Collection: users, Display: name, email |
   | `awarded_by` | Relation | Single, Required, Collection: users, Display: name, email |
   | `points` | Number | Required, Min: 1 |
   | `reason` | Text | Optional |
   | `created_at` | DateTime | Required, Default: `@now` |

4. API Rules:
   - **List/View**: `@request.auth.id != "" && @collection.team_members.team_id = team_id && @collection.team_members.user_id = @request.auth.id`
   - **Create**: `@request.auth.id != ""`
   - **Update/Delete**: Laisser vide (admin only)

5. Indexes:
   - Index sur (`team_id`, `created_at` DESC)
   - Index sur `member_id`
   - Index sur `reward_id`

6. Sauvegarder

### Option B: Import JSON (Plus rapide)

1. Ouvrir PocketBase Admin: `http://127.0.0.1:8090/_/`
2. Settings → Import collections
3. Uploader le fichier `pocketbase_gamification_collections.json`
4. Vérifier et confirmer l'import
5. ⚠️ **Attention**: Vérifier que les champs `start_date` et `end_date` sont bien de type **Date** (pas DateTime)

---

## 🧪 Étape 2: Tests des Récompenses d'Équipe

### Test 1: Créer une Récompense Simple ✅

**Objectif:** Vérifier la création basique

1. Aller sur la page **Teams**
2. Sélectionner votre équipe
3. Cliquer sur l'onglet **Récompenses** (bouton pill avec icône cadeau)
4. Cliquer sur **Nouvelle récompense**
5. Remplir:
   - Nom: `Meilleur contributeur`
   - Description: `Pour excellence au travail`
   - Points: `100`
   - Laisser les dates vides
6. Cliquer **Créer**

**Résultat attendu:**
- ✅ Toast de succès: "Récompense créée!"
- ✅ La carte apparaît dans la liste
- ✅ Console log: `🎁 [TeamRewards] Reward created successfully`
- ✅ Vérifier dans PocketBase: record créé dans `team_rewards`

**En cas d'erreur:**
- 404: Collection n'existe pas → créer la collection
- 400: Champ manquant ou invalide → vérifier les champs
- 403: Permissions → vérifier que vous êtes owner de l'équipe

---

### Test 2: Créer une Récompense avec Dates 📅

**Objectif:** Vérifier le support des dates

1. Cliquer sur **Nouvelle récompense**
2. Remplir:
   - Nom: `Challenge du mois`
   - Points: `200`
   - Date de début: `01/02/2026`
   - Date de fin: `28/02/2026`
3. Cliquer **Créer**

**Résultat attendu:**
- ✅ Récompense créée avec succès
- ✅ Dates affichées sur la carte avec icône calendrier: `01/02/2026 → 28/02/2026`

**Test de validation:**
4. Essayer de créer une récompense avec date de fin avant date de début
5. Résultat: Toast d'erreur "La date de fin doit être après la date de début"

---

### Test 3: Attribuer une Récompense 🎁

**Objectif:** Vérifier l'attribution et les points

1. Sur une carte de récompense, cliquer **Attribuer**
2. Sélectionner un membre dans la liste
3. Ajouter une raison (optionnel): `Excellent travail sur le projet X`
4. Cliquer **Attribuer**

**Résultat attendu:**
- ✅ Toast: `🎉 100 points attribués!` (ou le nombre de points de la récompense)
- ✅ Console logs détaillés
- ✅ Vérifier dans PocketBase:
  - Record dans `team_reward_history`
  - Record dans `points_history` avec `action_type = "team_reward"`
  - Record créé/mis à jour dans `gamification_points` pour le membre

**Points à vérifier:**
- Le membre a reçu les points
- La raison est enregistrée
- L'historique est visible

---

### Test 4: Voir l'Historique 📜

**Objectif:** Vérifier l'affichage de l'historique

1. Cliquer sur l'onglet **Historique** (bouton pill avec icône horloge)
2. Vérifier le tableau d'historique

**Résultat attendu:**
- ✅ Tableau avec colonnes: Date, Récompense, Membre, Points, Raison
- ✅ Badge violet pour les points: `+100 pts`
- ✅ Membre et raison affichés correctement
- ✅ Date au format français: `05/02/2026`

**Console logs:**
- `🔄 [TeamRewardsManager] Data loaded: { rewards: X, members: Y, history: Z }`

---

### Test 5: Supprimer une Récompense 🗑️

**Objectif:** Vérifier la suppression

1. Sur une carte de récompense, cliquer sur l'icône **poubelle** (en haut à droite)
2. Confirmer dans la popup: `Êtes-vous sûr de vouloir supprimer la récompense "Meilleur contributeur" ?`
3. Cliquer **OK**

**Résultat attendu:**
- ✅ Toast: "Récompense supprimée!"
- ✅ La carte disparaît de la liste
- ✅ Console log: `🎁 [TeamRewards] Reward deleted successfully`
- ✅ Vérifier dans PocketBase: record supprimé de `team_rewards`

**Note:** L'historique des attributions reste intact (on ne supprime jamais l'historique)

---

### Test 6: Permissions - Membre Simple ⛔

**Objectif:** Vérifier que seuls les owners peuvent gérer

1. Se connecter avec un compte membre (non-owner)
2. Aller sur Teams → sélectionner l'équipe
3. Observer: **Pas d'onglet Récompenses visible**

**Résultat attendu:**
- ✅ Seul l'onglet "Membres" est visible pour les membres simples
- ✅ Les owners voient "Membres", "Récompenses", "Paramètres"

---

## 🎯 Étape 3: Tests d'Intégration Gamification

### Test 7: Vérifier les Points dans Gamification Page 📊

1. Aller sur la page **Gamification**
2. Vérifier la section **Historique**

**Résultat attendu:**
- ✅ Les récompenses d'équipe apparaissent avec:
  - Fond violet clair: `bg-purple-500/5`
  - Badge "Équipe": `bg-purple-500/20 text-purple-400`
  - Icône Gift au lieu de TrendingUp
  - Description préfixée: `Récompense d'équipe: [nom]`

**Filtrage:**
3. Vérifier que le filtre fonctionne (si implémenté)
4. Les récompenses d'équipe sont identifiables par `reason.startsWith('Récompense d\'équipe:')`

---

### Test 8: Points Awarded on Task Completion ✅

**Objectif:** Vérifier l'intégration avec tasks.service.js

1. Aller sur **Tâches**
2. Créer une tâche: "Tester la gamification"
3. Marquer la tâche comme **Done**

**Résultat attendu:**
- ✅ Toast avec points: "Tâche marquée comme terminée! +10 points"
- ✅ Dans Gamification page: nouveau record dans l'historique
  - Type: `task_completed`
  - Points: `+10 pts`
  - Badge vert

**Console logs:**
- `gamificationService.awardPoints()` appelé
- Points ajoutés au total de l'utilisateur

---

## 🐛 Troubleshooting

### Erreur: "Collection not found"

**Cause:** La collection `team_rewards` ou `team_reward_history` n'existe pas

**Solution:**
1. Vérifier dans PocketBase Admin → Collections
2. Créer la collection manquante selon les instructions ci-dessus
3. Vérifier le nom exact (sensible à la casse)

---

### Erreur: "Only team leaders can create rewards"

**Cause:** L'utilisateur connecté n'est pas owner de l'équipe

**Solution:**
1. Vérifier le rôle dans PocketBase: `team_members` → role = "owner"
2. Ou changer de compte / créer une nouvelle équipe où vous êtes owner

---

### Erreur 400: "Bad Request" lors de la création

**Cause possible 1:** Champs manquants ou invalides

**Solution:**
- Vérifier que tous les champs requis sont présents dans la collection
- Vérifier les types de champs (Date vs DateTime)

**Cause possible 2:** Problème de sorting avec `created`

**Solution:**
- Le code utilise `sort: '-created_at'` (custom field)
- Vérifier que le champ `created_at` existe et est de type DateTime avec `@now`

---

### Les récompenses n'apparaissent pas après création

**Diagnostic:**
1. Ouvrir la console du navigateur
2. Chercher les logs avec emoji 🎁
3. Vérifier les erreurs

**Solutions courantes:**
- Rafraîchir la page
- Vérifier les API Rules dans PocketBase
- Vérifier que `getTeamRewards()` retourne bien des données

---

### Les dates ne s'affichent pas

**Cause:** Champs `start_date` ou `end_date` ne sont pas de type Date

**Solution:**
1. Dans PocketBase Admin → `team_rewards` collection
2. Vérifier que `start_date` et `end_date` sont de type **Date** (pas Text, pas DateTime)
3. Re-créer les champs si nécessaire

---

## ✅ Checklist Complète

Cocher au fur et à mesure:

- [ ] Collections PocketBase créées
  - [ ] `team_rewards` avec champs start_date et end_date (Date)
  - [ ] `team_reward_history`
- [ ] Test 1: Créer récompense simple ✅
- [ ] Test 2: Créer récompense avec dates ✅
- [ ] Test 3: Attribuer récompense ✅
- [ ] Test 4: Voir l'historique ✅
- [ ] Test 5: Supprimer récompense ✅
- [ ] Test 6: Permissions membre simple ✅
- [ ] Test 7: Points dans Gamification page ✅
- [ ] Test 8: Points sur task completion ✅
- [ ] Vérification PocketBase records
- [ ] Pas d'erreurs dans la console

---

## 📊 Résultats Attendus

**Si tous les tests passent:**
- ✅ Système de récompenses d'équipe fonctionnel
- ✅ Attribution de points correcte
- ✅ Historique précis et filtré
- ✅ Permissions respectées
- ✅ Dates gérées correctement
- ✅ Suppression sécurisée

**Prochaines étapes après tests OK:**
1. Créer les 8 collections restantes pour V4 complète
2. Implémenter UI des Challenges
3. Implémenter UI du Shop
4. Créer interface Super Admin

---

## 🎓 Notes Techniques

### Architecture Service Layer
- Tous les appels PocketBase passent par `gamificationService`
- Validation métier dans le service (ex: vérifier role owner)
- Logs détaillés avec emojis pour debugging

### Sorting Custom Fields
- `sort: '-created_at'` au lieu de `sort: '-created'`
- Collections SuperPlanner utilisent `created_at` custom pour cohérence
- PocketBase system fields: `created`, `updated` (non utilisés ici)

### API Rules Adaptation
- PocketBase v0.20+ ne supporte pas `@request.data` dans Create rules
- Validation "owner only" faite dans `createTeamReward()` côté service
- Update/Delete rules utilisent `team_id.owner_id` pour vérifier ownership

---

**Happy Testing! 🚀**
