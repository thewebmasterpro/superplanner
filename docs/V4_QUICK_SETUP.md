# Guide d'Installation Rapide - V4 Gamification

**Temps estimé:** 5 minutes ⚡

---

## 🚀 Import Automatique (RECOMMANDÉ)

### Étape 1: Ouvrir PocketBase Admin

```bash
# Si PocketBase n'est pas démarré
cd /path/to/pocketbase
./pocketbase serve
```

Ouvrir dans le navigateur: `http://127.0.0.1:8090/_/`

### Étape 2: Importer les Collections

1. Dans PocketBase Admin, aller dans **Settings** (icône engrenage en haut à droite)
2. Cliquer sur **Import collections**
3. Sélectionner le fichier: `pocketbase_v4_all_collections.json` (à la racine du projet)
4. Cliquer sur **Review** pour voir les changements
5. Cliquer sur **Confirm import** pour créer les collections

**Résultat:** 10 collections créées en une fois ✅

---

## ✅ Vérification Post-Import

### 1. Vérifier les Collections Créées

Dans PocketBase Admin → **Collections**, vous devriez voir:

- ✅ `gamification_points` (Haute priorité)
- ✅ `points_history` (Haute priorité)
- ✅ `team_rewards` (Déjà existante ou mise à jour)
- ✅ `team_reward_history` (Déjà existante ou mise à jour)
- ✅ `user_roles` (Moyenne priorité)
- ✅ `admin_stats_cache` (Moyenne priorité)
- ✅ `challenges` (Basse priorité)
- ✅ `user_challenges` (Basse priorité)
- ✅ `shop_items` (Basse priorité)
- ✅ `user_purchases` (Basse priorité)

### 2. Vérifier les Types de Champs

**IMPORTANT:** Vérifier que ces champs sont de type **Date** (pas DateTime):

- `gamification_points.last_activity_date` → **Date**
- `team_rewards.start_date` → **Date**
- `team_rewards.end_date` → **Date**
- `challenges.start_date` → **Date**
- `challenges.end_date` → **Date**
- `user_challenges.completed_at` → **Date**
- `user_purchases.purchased_at` → **Date**
- `admin_stats_cache.calculated_at` → **Date**

Si un champ est de type **DateTime** au lieu de **Date**, cliquer sur le champ et changer le type.

### 3. Créer Votre Premier Super Admin

1. Aller dans **Collections** → `user_roles`
2. Cliquer sur **New record**
3. Remplir:
   - `user_id`: Sélectionner votre compte utilisateur
   - `is_super_admin`: ✅ Cocher
4. Cliquer **Create**

**Résultat:** Vous êtes maintenant super admin ✅

---

## 🧪 Test Rapide

### Test 1: Points System (2 minutes)

1. Aller sur l'app SuperPlanner → **Tâches**
2. Créer une nouvelle tâche: "Test gamification V4"
3. Marquer la tâche comme **Done**

**Attendu:**
- ✅ Toast: "Tâche marquée comme terminée! +10 points"
- ✅ Badge en haut à droite mis à jour

4. Aller sur **Gamification** page
5. Vérifier:
   - ✅ Points affichés: 10
   - ✅ Niveau: 1
   - ✅ Historique: 1 entrée "Tâche terminée"

**Si ça fonctionne:** Système de points OK ✅

### Test 2: Team Rewards (2 minutes)

1. Aller sur **Teams**
2. Sélectionner votre équipe
3. Onglet **Récompenses** (si vous êtes owner)
4. Cliquer **Nouvelle récompense**
5. Remplir:
   - Nom: "Test reward"
   - Points: 50
6. Cliquer **Créer**

**Attendu:**
- ✅ Toast: "Récompense créée!"
- ✅ Carte visible dans la liste

7. Cliquer **Attribuer** sur la carte
8. Sélectionner un membre
9. Cliquer **Attribuer**

**Attendu:**
- ✅ Toast: "🎉 50 points attribués!"

10. Aller dans l'onglet **Historique**
11. Vérifier:
    - ✅ Ligne visible avec le nom du membre et +50 pts

**Si ça fonctionne:** Team Rewards OK ✅

### Test 3: Leaderboard (30 secondes)

1. Aller sur **Gamification** page
2. Vérifier la section **Leaderboard**
3. Vous devriez vous voir dans la liste avec vos points

**Si ça fonctionne:** Leaderboard OK ✅

---

## 🐛 Troubleshooting Express

### Erreur: "Collection not found"

**Cause:** L'import n'a pas créé toutes les collections

**Solution:**
1. Vérifier dans PocketBase Admin → Collections
2. Si des collections manquent, réimporter le JSON
3. Ou créer manuellement les collections manquantes (voir `V4_REMAINING_COLLECTIONS.md`)

### Erreur 400 lors d'un test

**Cause possible 1:** Champs Date vs DateTime

**Solution:** Vérifier que tous les champs date sont de type **Date** (voir section Vérification ci-dessus)

**Cause possible 2:** API Rules trop restrictives

**Solution:**
1. Aller dans la collection concernée → **API rules**
2. Vérifier que les règles correspondent à celles du JSON
3. Pour `gamification_points` et `points_history`, les règles Create/Update/Delete doivent être vides (service only)

### Les points ne s'accumulent pas

**Diagnostic:**
1. Ouvrir la console du navigateur (F12)
2. Compléter une tâche
3. Chercher les logs avec "gamification" ou "points"
4. Noter les erreurs

**Solutions courantes:**
- Collection `gamification_points` n'existe pas → réimporter JSON
- Collection `points_history` n'existe pas → réimporter JSON
- Erreur 400 → vérifier types de champs

### Le badge de points ne s'affiche pas

**Cause:** Le composant `GamificationBadge` n'est peut-être pas importé

**Solution:**
1. Vérifier que [src/components/GamificationBadge.jsx](../src/components/GamificationBadge.jsx) existe
2. Vérifier qu'il est importé dans le layout ([src/layouts/DashboardLayoutV3.jsx](../src/layouts/DashboardLayoutV3.jsx))
3. Rafraîchir la page

---

## 📋 Checklist Complète

Cocher au fur et à mesure:

### Installation
- [ ] PocketBase démarré
- [ ] Fichier `pocketbase_v4_all_collections.json` trouvé
- [ ] Import réussi (10 collections)
- [ ] Types de champs vérifiés (Date vs DateTime)
- [ ] Super admin créé dans `user_roles`

### Tests
- [ ] Test 1: Points system ✅
- [ ] Test 2: Team rewards ✅
- [ ] Test 3: Leaderboard ✅
- [ ] Pas d'erreurs dans la console

### Prochaines Étapes
- [ ] Créer des challenges initiaux (optionnel)
- [ ] Créer des items de boutique (optionnel)
- [ ] Tester avec plusieurs utilisateurs
- [ ] Documenter les règles de points pour votre équipe

---

## 🎉 Félicitations!

Si tous les tests passent, votre système de gamification V4 est **100% fonctionnel** ✅

### Ce qui fonctionne maintenant:
- ✅ Système de points et niveaux
- ✅ Historique complet
- ✅ Leaderboards (individuel & équipe)
- ✅ Récompenses d'équipe
- ✅ Streaks quotidiennes
- ✅ Infrastructure pour challenges et boutique

### Prochaines Features à Implémenter:
1. **UI Challenges** (affichage, progression, claim)
2. **UI Shop** (catalogue, achat, application des items)
3. **Interface Super Admin** (dashboard, gestion)
4. **Notifications** (toast pour level up, challenges complétés)

---

## 📚 Documentation Complète

Pour plus de détails:
- [V4_TESTING_GUIDE.md](./V4_TESTING_GUIDE.md) - Guide de tests détaillé
- [V4_REMAINING_COLLECTIONS.md](./V4_REMAINING_COLLECTIONS.md) - Détails sur chaque collection
- [POCKETBASE_SETUP_V4.md](./POCKETBASE_SETUP_V4.md) - Setup complet avec seed data

---

**Temps total écoulé:** ~5 minutes ⚡

**Questions ou problèmes?** Voir [V4_TESTING_GUIDE.md](./V4_TESTING_GUIDE.md) section Troubleshooting.
