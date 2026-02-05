# Collections Restantes - V4 Gamification

**Date:** 2026-02-05
**Statut:** 2/10 collections créées ✅

---

## 📊 Progression

| # | Collection | Statut | Priorité | Nécessaire pour |
|---|------------|--------|----------|-----------------|
| 1 | `user_roles` | ⏳ À créer | 🟡 Moyenne | Interface Super Admin |
| 2 | `gamification_points` | ⏳ À créer | 🔴 Haute | Points, niveaux, streaks |
| 3 | `points_history` | ⏳ À créer | 🔴 Haute | Historique complet |
| 4 | `challenges` | ⏳ À créer | 🟢 Basse | UI Challenges |
| 5 | `user_challenges` | ⏳ À créer | 🟢 Basse | Progression challenges |
| 6 | `shop_items` | ⏳ À créer | 🟢 Basse | Boutique virtuelle |
| 7 | `user_purchases` | ⏳ À créer | 🟢 Basse | Achats boutique |
| 8 | `admin_stats_cache` | ⏳ À créer | 🟡 Moyenne | Performance admin |
| 9 | `team_rewards` | ✅ Créée | - | Récompenses équipe |
| 10 | `team_reward_history` | ✅ Créée | - | Historique récompenses |

---

## 🎯 Ordre de Création Recommandé

### Phase 1: Système de Points (Haute Priorité)

**Objectif:** Rendre fonctionnel le système de points et l'historique

1. `gamification_points` - Stocker points, niveaux, streaks
2. `points_history` - Historique de tous les gains/dépenses

**Bénéfice:**
- Points s'accumulent correctement
- Historique complet visible
- Leaderboards fonctionnels

---

### Phase 2: Administration (Moyenne Priorité)

**Objectif:** Permettre la gestion par super admins

3. `user_roles` - Gérer les super admins
4. `admin_stats_cache` - Cache des statistiques

**Bénéfice:**
- Interface admin réservée
- Statistiques globales rapides

---

### Phase 3: Features Avancées (Basse Priorité)

**Objectif:** Ajouter challenges et boutique

5. `challenges` - Définir challenges disponibles
6. `user_challenges` - Progression utilisateurs
7. `shop_items` - Items boutique
8. `user_purchases` - Achats utilisateurs

**Bénéfice:**
- Gamification complète
- Engagement utilisateurs
- Monétisation interne

---

## 📝 Guide de Création Rapide

### 1. gamification_points ⚡ (HAUTE PRIORITÉ)

**Purpose:** Points, niveaux, et streaks par utilisateur

```
Collection: gamification_points (Base)

Champs:
- user_id (Relation) - Single, Required → users (name, email)
- points (Number) - Default: 0, Min: 0
- total_earned (Number) - Default: 0, Min: 0
- total_spent (Number) - Default: 0, Min: 0
- level (Number) - Default: 1, Min: 1
- streak_days (Number) - Default: 0, Min: 0
- last_activity_date (Date) - Required
- leaderboard_visible (Bool) - Default: false
- created_at (DateTime) - Auto now add
- updated_at (DateTime) - Auto now update

API Rules:
- List/View: @request.auth.id = user_id
- Create/Update: (laisser vide - via service only)

Indexes:
- Unique sur user_id
- Index sur total_earned (DESC)
- Index sur leaderboard_visible
```

**Test après création:**
- Compléter une tâche → vérifier qu'un record est créé automatiquement
- Vérifier que les points s'accumulent dans `total_earned`

---

### 2. points_history ⚡ (HAUTE PRIORITÉ)

**Purpose:** Historique complet de tous les gains/dépenses

```
Collection: points_history (Base)

Champs:
- user_id (Relation) - Single, Required → users
- action_type (Select) - Required
  Options: task_completed, challenge_completed, streak_bonus, shop_purchase, daily_login, team_reward
- points_change (Number) - Required (+ gain, - dépense)
- related_task_id (Text) - Optional
- related_challenge_id (Text) - Optional
- related_item_id (Text) - Optional
- description (Text) - Required
- created_at (DateTime) - Auto now add

API Rules:
- List/View: @request.auth.id = user_id
- Create: (laisser vide - via service only)

Indexes:
- Index sur (user_id, created_at DESC)
```

**Test après création:**
- Compléter une tâche → vérifier qu'un record est créé
- Attribuer une récompense d'équipe → vérifier l'entrée avec `action_type = "team_reward"`
- Vérifier la page Gamification → Historique doit s'afficher

---

### 3. user_roles (MOYENNE PRIORITÉ)

**Purpose:** Gérer les rôles super admin

```
Collection: user_roles (Base)

Champs:
- user_id (Relation) - Single, Required → users (name, email)
- is_super_admin (Bool) - Default: false
- created_at (DateTime) - Auto now add
- updated_at (DateTime) - Auto now update

API Rules:
- List/View: @request.auth.id = user_id
- Create/Update/Delete: (laisser vide - admin only)

Indexes:
- Unique sur user_id
```

**Créer votre premier Super Admin:**
1. Créer un record dans `user_roles`
2. Sélectionner votre utilisateur
3. Cocher `is_super_admin = true`
4. Rafraîchir l'app → Menu "Admin" devrait apparaître

---

### 4. admin_stats_cache (MOYENNE PRIORITÉ)

**Purpose:** Cache des statistiques pour performance

```
Collection: admin_stats_cache (Base)

Champs:
- stat_key (Text) - Required, Unique
- stat_value (JSON) - Required
- calculated_at (DateTime) - Required
- created_at (DateTime) - Auto now add
- updated_at (DateTime) - Auto now update

API Rules:
- List/View: (Super admin only - à configurer manuellement)
- Create/Update: (laisser vide - via service only)

Indexes:
- Unique sur stat_key
```

**Exemples de stats cachées:**
- `total_users_active`
- `points_distributed_today`
- `top_teams_leaderboard`

---

### 5. challenges (BASSE PRIORITÉ)

**Purpose:** Définir les challenges disponibles

```
Collection: challenges (Base)

Champs:
- title (Text) - Required
- description (Editor) - Optional
- type (Select) - Required
  Options: daily, weekly, monthly
- goal_metric (Select) - Required
  Options: tasks_completed, hours_tracked, streak_days
- goal_value (Number) - Required, Min: 1
- points_reward (Number) - Required, Min: 1
- icon (Text) - Optional (emoji ou nom Lucide)
- is_active (Bool) - Default: true
- start_date (Date) - Required
- end_date (Date) - Required
- created_at (DateTime) - Auto now add
- updated_at (DateTime) - Auto now update

API Rules:
- List/View: @request.auth.id != ""
- Create/Update/Delete: (admin only - configurer manuellement)

Indexes:
- Index sur (is_active, end_date)
```

**Seed Data après création:**
Voir `POCKETBASE_SETUP_V4.md` lignes 298-396 pour challenges initiaux:
- Early Bird (3 tâches avant midi)
- Task Master (5 tâches/jour)
- Productive Week (25 tâches/semaine)
- etc.

---

### 6. user_challenges (BASSE PRIORITÉ)

**Purpose:** Progression des challenges par utilisateur

```
Collection: user_challenges (Base)

Champs:
- user_id (Relation) - Single, Required → users
- challenge_id (Relation) - Single, Required → challenges (title)
- progress (Number) - Default: 0, Min: 0
- completed (Bool) - Default: false
- completed_at (DateTime) - Optional
- claimed (Bool) - Default: false
- created_at (DateTime) - Auto now add
- updated_at (DateTime) - Auto now update

API Rules:
- List/View: @request.auth.id = user_id
- Create/Update: (via service only)

Indexes:
- Unique sur (user_id, challenge_id)
- Index sur user_id
```

---

### 7. shop_items (BASSE PRIORITÉ)

**Purpose:** Items de la boutique virtuelle

```
Collection: shop_items (Base)

Champs:
- name (Text) - Required
- description (Editor) - Optional
- item_type (Select) - Required
  Options: theme, avatar, badge, feature
- price (Number) - Required, Min: 1
- icon (Text) - Optional (emoji ou nom icône)
- config (JSON) - Optional
- is_available (Bool) - Default: true
- created_at (DateTime) - Auto now add
- updated_at (DateTime) - Auto now update

API Rules:
- List/View: @request.auth.id != ""
- Create/Update/Delete: (admin only)

Indexes:
- Index sur is_available
- Index sur price
```

**Seed Data:**
Voir `POCKETBASE_SETUP_V4.md` lignes 398-448 pour items initiaux:
- Thèmes: Dark Ocean, Sunset
- Avatars: Étoile
- Badges: Productivité

---

### 8. user_purchases (BASSE PRIORITÉ)

**Purpose:** Items achetés par les utilisateurs

```
Collection: user_purchases (Base)

Champs:
- user_id (Relation) - Single, Required → users
- item_id (Relation) - Single, Required → shop_items (name)
- purchased_at (DateTime) - Required
- is_active (Bool) - Default: true
- created_at (DateTime) - Auto now add

API Rules:
- List/View: @request.auth.id = user_id
- Create: (via service only)

Indexes:
- Index sur user_id
- Index sur (user_id, item_id)
```

---

## 🚀 Script de Création Rapide

### Méthode 1: Manuelle (30 minutes)

1. Ouvrir PocketBase Admin
2. Suivre les instructions ci-dessus pour chaque collection
3. Créer dans l'ordre: 1 → 2 → 3 → 4 → etc.

### Méthode 2: Import JSON (10 minutes)

1. Utiliser `pocketbase_gamification_collections.json`
2. Settings → Import collections
3. ⚠️ Attention: Vérifier que l'import a bien créé toutes les collections
4. Vérifier les types de champs (Date vs DateTime)

### Méthode 3: CLI (Advanced)

Si PocketBase supporte les migrations CLI:
```bash
# À implémenter si nécessaire
pocketbase migrate create gamification_v4
```

---

## ✅ Checklist Création

### Phase 1: Points System (FAIRE EN PREMIER)
- [ ] `gamification_points` créée
- [ ] `points_history` créée
- [ ] Test: Compléter une tâche → points ajoutés
- [ ] Test: Attribuer reward → historique créé
- [ ] Test: Page Gamification affiche historique complet

### Phase 2: Administration
- [ ] `user_roles` créée
- [ ] Votre compte marqué comme super admin
- [ ] `admin_stats_cache` créée
- [ ] Test: Menu "Admin" visible

### Phase 3: Features Avancées
- [ ] `challenges` créée
- [ ] Seed data challenges ajoutée
- [ ] `user_challenges` créée
- [ ] `shop_items` créée
- [ ] Seed data shop ajoutée
- [ ] `user_purchases` créée

---

## 🎯 Après Création Complète

**Une fois toutes les collections créées:**

1. **Tester le flow complet:**
   - Compléter une tâche → points ajoutés
   - Voir points sur page Gamification
   - Voir niveau augmenter
   - Voir leaderboard

2. **Implémenter UI Challenges:**
   - Afficher challenges actifs
   - Progression en temps réel
   - Claim rewards

3. **Implémenter UI Shop:**
   - Catalogue d'items
   - Système d'achat
   - Application des items achetés

4. **Créer Interface Admin:**
   - Dashboard statistiques
   - Gestion challenges
   - Gestion shop items
   - Vue globale utilisateurs

---

## 📊 Impact Estimé

**Avec Phase 1 seulement (2 collections):**
- Points fonctionnels ✅
- Historique complet ✅
- Leaderboards ✅
- 70% de la gamification utilisable

**Avec Phases 1 + 2 (4 collections):**
- + Interface admin ✅
- + Statistiques globales ✅
- 85% de la gamification utilisable

**Avec toutes les phases (8 collections):**
- + Challenges quotidiens/hebdomadaires ✅
- + Boutique virtuelle ✅
- 100% de la gamification complète ✅

---

## 💡 Recommandation

**Pour tester rapidement:**
Créer seulement Phase 1 (2 collections) pour valider le système de base.

**Pour V4 complète:**
Créer toutes les collections en une session (30 min).

**Pour production:**
Créer toutes + seed data + super admin configuré.

---

**Prêt à créer les collections? 🚀**

Voir guide détaillé: `POCKETBASE_SETUP_V4.md`
