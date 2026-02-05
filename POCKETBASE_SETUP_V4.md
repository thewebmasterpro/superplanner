# PocketBase Collections Setup pour V4

Ce document contient les instructions détaillées pour créer toutes les collections nécessaires pour la v4 (Super Admin + Gamification) dans PocketBase.

## Accès à PocketBase Admin

1. Ouvrir l'admin panel: `http://127.0.0.1:8090/_/` (dev) ou `https://pb.hagendigital.com/_/` (prod)
2. Se connecter avec vos identifiants admin

## Collections à créer

### 1. user_roles

**Purpose:** Gérer les rôles super admin

**Champs:**
- `user_id` (Relation) - Single, Required
  - Collection: users
  - Display fields: name, email
- `is_super_admin` (Bool) - Default: false
- `created_at` (DateTime) - Auto now add
- `updated_at` (DateTime) - Auto now update

**API Rules:**
- List/View: `@request.auth.id = user_id`
- Create/Update/Delete: Admin only (configurer manuellement)

**Indexes:**
- Index unique sur `user_id`

---

### 2. gamification_points

**Purpose:** Stocker les points, niveau et streak de chaque utilisateur

**Champs:**
- `user_id` (Relation) - Single, Required
  - Collection: users
  - Display fields: name, email
- `points` (Number) - Default: 0, Min: 0
- `total_earned` (Number) - Default: 0, Min: 0
- `total_spent` (Number) - Default: 0, Min: 0
- `level` (Number) - Default: 1, Min: 1
- `streak_days` (Number) - Default: 0, Min: 0
- `last_activity_date` (Date) - Required
- `leaderboard_visible` (Bool) - Default: false
- `created_at` (DateTime) - Auto now add
- `updated_at` (DateTime) - Auto now update

**API Rules:**
- List/View: `@request.auth.id = user_id`
- Create/Update: Via service only (admin or system)

**Indexes:**
- Index unique sur `user_id`
- Index sur `total_earned` (DESC) pour leaderboard
- Index sur `leaderboard_visible`

---

### 3. points_history

**Purpose:** Historique de tous les gains/dépenses de points

**Champs:**
- `user_id` (Relation) - Single, Required
  - Collection: users
- `action_type` (Select) - Required
  - Options: task_completed, challenge_completed, streak_bonus, shop_purchase, daily_login, team_reward
- `points_change` (Number) - Required (positif = gain, négatif = dépense)
- `related_task_id` (Text) - Optional
- `related_challenge_id` (Text) - Optional
- `related_item_id` (Text) - Optional
- `description` (Text) - Required
- `created_at` (DateTime) - Auto now add

**API Rules:**
- List/View: `@request.auth.id = user_id`
- Create: Via service only

**Indexes:**
- Index sur (`user_id`, `created_at` DESC)

---

### 4. challenges

**Purpose:** Définir les challenges disponibles

**Champs:**
- `title` (Text) - Required
- `description` (Editor) - Optional
- `type` (Select) - Required
  - Options: daily, weekly, monthly
- `goal_metric` (Select) - Required
  - Options: tasks_completed, hours_tracked, streak_days
- `goal_value` (Number) - Required, Min: 1
- `points_reward` (Number) - Required, Min: 1
- `icon` (Text) - Optional (emoji ou nom d'icône Lucide)
- `is_active` (Bool) - Default: true
- `start_date` (Date) - Required
- `end_date` (Date) - Required
- `created_at` (DateTime) - Auto now add
- `updated_at` (DateTime) - Auto now update

**API Rules:**
- List/View: Authenticated users
- Create/Update/Delete: Admin only

**Indexes:**
- Index sur (`is_active`, `end_date`)

---

### 5. user_challenges

**Purpose:** Progression des challenges par utilisateur

**Champs:**
- `user_id` (Relation) - Single, Required
  - Collection: users
- `challenge_id` (Relation) - Single, Required
  - Collection: challenges
  - Display fields: title
- `progress` (Number) - Default: 0, Min: 0
- `completed` (Bool) - Default: false
- `completed_at` (DateTime) - Optional
- `claimed` (Bool) - Default: false
- `created_at` (DateTime) - Auto now add
- `updated_at` (DateTime) - Auto now update

**API Rules:**
- List/View: `@request.auth.id = user_id`
- Create/Update: Via service only

**Indexes:**
- Index unique sur (`user_id`, `challenge_id`)
- Index sur `user_id`

---

### 6. shop_items

**Purpose:** Items disponibles dans la boutique virtuelle

**Champs:**
- `name` (Text) - Required
- `description` (Editor) - Optional
- `item_type` (Select) - Required
  - Options: theme, avatar, badge, feature
- `price` (Number) - Required, Min: 1
- `icon` (Text) - Optional (emoji ou nom d'icône)
- `config` (JSON) - Optional (configuration spécifique à l'item)
- `is_available` (Bool) - Default: true
- `created_at` (DateTime) - Auto now add
- `updated_at` (DateTime) - Auto now update

**API Rules:**
- List/View: Authenticated users (filter: `is_available = true`)
- Create/Update/Delete: Admin only

**Indexes:**
- Index sur `is_available`
- Index sur `price`

---

### 7. user_purchases

**Purpose:** Items achetés par les utilisateurs

**Champs:**
- `user_id` (Relation) - Single, Required
  - Collection: users
- `item_id` (Relation) - Single, Required
  - Collection: shop_items
  - Display fields: name
- `purchased_at` (DateTime) - Required
- `is_active` (Bool) - Default: true
- `created_at` (DateTime) - Auto now add

**API Rules:**
- List/View: `@request.auth.id = user_id`
- Create: Via service only

**Indexes:**
- Index sur `user_id`
- Index sur (`user_id`, `item_id`)

---

### 8. admin_stats_cache

**Purpose:** Cache des statistiques admin pour performance

**Champs:**
- `stat_key` (Text) - Required, Unique
- `stat_value` (JSON) - Required
- `calculated_at` (DateTime) - Required
- `created_at` (DateTime) - Auto now add
- `updated_at` (DateTime) - Auto now update

**API Rules:**
- List/View: Super admin only
- Create/Update: Via service only

**Indexes:**
- Index unique sur `stat_key`

---

### 9. team_rewards

**Purpose:** Récompenses créées par les chefs d'équipe

**Champs:**
- `team_id` (Relation) - Single, Required
  - Collection: teams
  - Display fields: name
- `name` (Text) - Required
- `description` (Text) - Optional
- `points` (Number) - Required, Min: 1
- `start_date` (Date) - Optional
- `end_date` (Date) - Optional
- `created_by` (Relation) - Single, Required
  - Collection: users
  - Display fields: name, email
- `created_at` (DateTime) - Auto now add
- `updated_at` (DateTime) - Auto now update

⚠️ **Note:** On utilise `created_at` et `updated_at` (pas les champs système `created`/`updated`) pour plus de clarté et cohérence avec les autres collections du projet.

**API Rules:**
- **List/View**: `@request.auth.id != ""`
  - Tous les utilisateurs authentifiés peuvent lire (filtrage fait côté frontend/service)
- **Create**: `@request.auth.id != ""`
  - Utilisateurs authentifiés peuvent créer (validation "owner only" faite dans gamification.service.js)
- **Update**: `@request.auth.id != "" && team_id.owner_id = @request.auth.id`
  - Seuls les propriétaires peuvent modifier
- **Delete**: `@request.auth.id != "" && team_id.owner_id = @request.auth.id`
  - Seuls les propriétaires peuvent supprimer

⚠️ **Note importante**: La validation "seuls les propriétaires peuvent créer" est faite dans `gamification.service.js:createTeamReward()` car PocketBase v0.20+ ne supporte pas `@request.data` dans les règles de création.

**Indexes:**
- Index sur `team_id`
- Index sur `created_by`

---

### 10. team_reward_history

**Purpose:** Historique de distribution des récompenses d'équipe

**Champs:**
- `team_id` (Relation) - Single, Required
  - Collection: teams
  - Display fields: name
- `reward_id` (Relation) - Single, Required
  - Collection: team_rewards
  - Display fields: name
- `member_id` (Relation) - Single, Required
  - Collection: users
  - Display fields: name, email
- `awarded_by` (Relation) - Single, Required
  - Collection: users
  - Display fields: name, email
- `points` (Number) - Required, Min: 1
- `reason` (Text) - Optional
- `created_at` (DateTime) - Auto now add

**API Rules:**
- **List/View**: `@request.auth.id != "" && @collection.team_members.team_id = team_id && @collection.team_members.user_id = @request.auth.id`
  - Les membres peuvent voir l'historique des récompenses de leur équipe
- **Create**: `@request.auth.id != "" && @request.auth.id = @request.data.awarded_by && @collection.teams.id ?= @request.data.team_id && @collection.teams.owner_id ?= @request.auth.id`
  - Seuls les propriétaires peuvent enregistrer des distributions
- **Update/Delete**: Laisser vide (admin only)
  - Aucun utilisateur ne peut modifier ou supprimer l'historique

**Indexes:**
- Index sur (`team_id`, `created_at` DESC)
- Index sur `member_id`
- Index sur `reward_id`

---

## Étapes de création

Pour chaque collection:

1. Aller dans "Collections" → "New collection"
2. Choisir "Base collection"
3. Nommer la collection (nom exact comme ci-dessus)
4. Ajouter tous les champs avec leurs types et configurations
5. Configurer les API Rules
6. Créer les indexes recommandés
7. Sauvegarder

## Seed Data (Initial Challenges)

Après avoir créé les collections, ajouter ces challenges initiaux via l'admin panel:

### Challenges Quotidiens:

```json
{
  "title": "Early Bird",
  "description": "Compléter 3 tâches avant midi",
  "type": "daily",
  "goal_metric": "tasks_completed",
  "goal_value": 3,
  "points_reward": 30,
  "icon": "☀️",
  "is_active": true,
  "start_date": "2024-01-01",
  "end_date": "2099-12-31"
}
```

```json
{
  "title": "Task Master",
  "description": "Compléter 5 tâches aujourd'hui",
  "type": "daily",
  "goal_metric": "tasks_completed",
  "goal_value": 5,
  "points_reward": 50,
  "icon": "🎯",
  "is_active": true,
  "start_date": "2024-01-01",
  "end_date": "2099-12-31"
}
```

```json
{
  "title": "Priority Focus",
  "description": "Compléter 2 tâches haute priorité",
  "type": "daily",
  "goal_metric": "tasks_completed",
  "goal_value": 2,
  "points_reward": 40,
  "icon": "🔥",
  "is_active": true,
  "start_date": "2024-01-01",
  "end_date": "2099-12-31"
}
```

### Challenges Hebdomadaires:

```json
{
  "title": "Productive Week",
  "description": "Compléter 25 tâches cette semaine",
  "type": "weekly",
  "goal_metric": "tasks_completed",
  "goal_value": 25,
  "points_reward": 200,
  "icon": "📈",
  "is_active": true,
  "start_date": "2024-01-01",
  "end_date": "2099-12-31"
}
```

```json
{
  "title": "Streak Keeper",
  "description": "Maintenir un streak de 7 jours",
  "type": "weekly",
  "goal_metric": "streak_days",
  "goal_value": 7,
  "points_reward": 150,
  "icon": "⚡",
  "is_active": true,
  "start_date": "2024-01-01",
  "end_date": "2099-12-31"
}
```

### Challenges Mensuels:

```json
{
  "title": "Task Marathon",
  "description": "Compléter 100 tâches ce mois",
  "type": "monthly",
  "goal_metric": "tasks_completed",
  "goal_value": 100,
  "points_reward": 500,
  "icon": "🏆",
  "is_active": true,
  "start_date": "2024-01-01",
  "end_date": "2099-12-31"
}
```

## Seed Data (Shop Items)

Ajouter ces items initiaux dans le shop:

```json
{
  "name": "Thème Dark Ocean",
  "description": "Thème sombre avec des teintes bleues océan",
  "item_type": "theme",
  "price": 100,
  "icon": "🌊",
  "config": {"theme_name": "dark-ocean"},
  "is_available": true
}
```

```json
{
  "name": "Thème Sunset",
  "description": "Thème chaleureux aux couleurs du coucher de soleil",
  "item_type": "theme",
  "price": 150,
  "icon": "🌅",
  "config": {"theme_name": "sunset"},
  "is_available": true
}
```

```json
{
  "name": "Avatar Étoile",
  "description": "Avatar avec icône étoile",
  "item_type": "avatar",
  "price": 50,
  "icon": "⭐",
  "config": {"avatar_icon": "star"},
  "is_available": true
}
```

```json
{
  "name": "Badge Productivité",
  "description": "Badge à afficher sur votre profil",
  "item_type": "badge",
  "price": 200,
  "icon": "🏅",
  "config": {"badge_title": "Maître de la Productivité"},
  "is_available": true
}
```

## Créer votre premier Super Admin

Après création des collections:

1. Créer un utilisateur normal via l'app
2. Aller dans la collection `user_roles` dans PocketBase admin
3. Créer un nouveau record:
   - `user_id`: Sélectionner votre utilisateur
   - `is_super_admin`: Cocher true
4. Sauvegarder

Votre utilisateur aura maintenant accès au panneau admin!

## Vérification

Après setup:
1. Rafraîchir votre app
2. Compléter une tâche → vérifier qu'un record est créé dans `points_history`
3. Vérifier que `gamification_points` est créé automatiquement
4. Si super admin, vérifier que le menu "Admin" apparaît
5. Si chef d'équipe, créer une récompense → vérifier qu'un record est créé dans `team_rewards`
6. Attribuer une récompense → vérifier les records dans `team_reward_history` et `points_history`

## Troubleshooting

**Erreur "Collection not found":**
- Vérifier que le nom de la collection est exactement comme spécifié (sensible à la casse)
- Vérifier que les relations pointent vers les bonnes collections

**Erreur de permissions:**
- Vérifier les API Rules pour chaque collection
- S'assurer que les utilisateurs authentifiés peuvent lire leur propres données

**Points non attribués:**
- Vérifier que le hook dans tasks.service.js fonctionne
- Vérifier les logs de console pour les erreurs
- Vérifier que gamification.service.js peut accéder aux collections
