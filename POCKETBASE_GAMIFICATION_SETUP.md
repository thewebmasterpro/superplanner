# PocketBase - Configuration Gamification

Ce guide explique comment configurer les collections PocketBase pour le système de gamification.

## Collections à Créer

### 1. `gamification_points` (Points et niveaux des utilisateurs)

**Champs:**
- `user_id` (Relation) → users (Single, Required)
- `points` (Number) - Points actuels disponibles (Default: 0)
- `total_earned` (Number) - Total des points gagnés (Default: 0)
- `total_spent` (Number) - Total des points dépensés (Default: 0)
- `level` (Number) - Niveau actuel (Default: 1)
- `streak_days` (Number) - Jours consécutifs d'activité (Default: 0)
- `last_activity_date` (Date) - Dernière activité (Default: NOW)
- `leaderboard_visible` (Bool) - Visible dans le classement (Default: false)

**Règles API:**
- List: `@request.auth.id != ""`
- View: `@request.auth.id != ""`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id != ""`
- Delete: `@request.auth.id = user_id`

**Indexes:**
- Index sur `user_id` (unique)
- Index sur `total_earned` (pour leaderboard)

---

### 2. `points_history` (Historique des points)

**Champs:**
- `user_id` (Relation) → users (Single, Required)
- `action_type` (Text) - Type d'action (ex: "task_completed")
- `points_change` (Number) - Changement de points (+/-)
- `related_task_id` (Relation) → tasks (Single, Optional)
- `related_challenge_id` (Relation) → challenges (Single, Optional)
- `related_item_id` (Relation) → shop_items (Single, Optional)
- `description` (Text) - Description de l'action

**Règles API:**
- List: `@request.auth.id = user_id`
- View: `@request.auth.id = user_id`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id = user_id`
- Delete: `@request.auth.id = user_id`

**Indexes:**
- Index sur `user_id`
- Index sur `created` (pour tri chronologique)

---

### 3. `challenges` (Défis disponibles)

**Champs:**
- `title` (Text) - Titre du défi (Required)
- `description` (Text) - Description détaillée
- `type` (Text) - Type (ex: "daily", "weekly", "special")
- `goal_metric` (Text) - Métrique (ex: "tasks_completed", "points_earned")
- `goal_value` (Number) - Objectif à atteindre (Required)
- `points_reward` (Number) - Récompense en points (Required)
- `is_active` (Bool) - Défi actif (Default: true)
- `start_date` (Date) - Date de début (Default: NOW)
- `end_date` (Date) - Date de fin (Required)

**Règles API:**
- List: `@request.auth.id != ""` (tout le monde peut lire)
- View: `@request.auth.id != ""`
- Create: `@request.auth.role = "admin"` (admin seulement)
- Update: `@request.auth.role = "admin"`
- Delete: `@request.auth.role = "admin"`

**Indexes:**
- Index sur `is_active`
- Index sur `start_date` et `end_date`

---

### 4. `user_challenges` (Progression des utilisateurs)

**Champs:**
- `user_id` (Relation) → users (Single, Required)
- `challenge_id` (Relation) → challenges (Single, Required)
- `progress` (Number) - Progression actuelle (Default: 0)
- `completed` (Bool) - Défi terminé (Default: false)
- `completed_at` (Date) - Date de complétion (Optional)
- `claimed` (Bool) - Récompense réclamée (Default: false)

**Règles API:**
- List: `@request.auth.id = user_id`
- View: `@request.auth.id = user_id`
- Create: `@request.auth.id = user_id`
- Update: `@request.auth.id = user_id`
- Delete: `@request.auth.id = user_id`

**Indexes:**
- Index unique sur (`user_id`, `challenge_id`)
- Index sur `completed`

---

### 5. `shop_items` (Boutique de récompenses)

**Champs:**
- `name` (Text) - Nom de l'objet (Required)
- `description` (Text) - Description
- `price` (Number) - Prix en points (Required)
- `type` (Text) - Type (ex: "theme", "avatar", "feature")
- `is_available` (Bool) - Disponible à l'achat (Default: true)
- `icon` (Text) - Icône ou emoji (Optional)
- `config` (JSON) - Configuration spécifique (Optional)

**Règles API:**
- List: `@request.auth.id != ""`
- View: `@request.auth.id != ""`
- Create: `@request.auth.role = "admin"`
- Update: `@request.auth.role = "admin"`
- Delete: `@request.auth.role = "admin"`

**Indexes:**
- Index sur `is_available`
- Index sur `price`

---

### 6. `user_purchases` (Achats des utilisateurs)

**Champs:**
- `user_id` (Relation) → users (Single, Required)
- `item_id` (Relation) → shop_items (Single, Required)
- `purchased_at` (Date) - Date d'achat (Default: NOW)
- `is_active` (Bool) - Objet actif/équipé (Default: false)

**Règles API:**
- List: `@request.auth.id = user_id`
- View: `@request.auth.id = user_id`
- Create: `@request.auth.id = user_id`
- Update: `@request.auth.id = user_id`
- Delete: `@request.auth.id = user_id`

**Indexes:**
- Index sur (`user_id`, `item_id`)
- Index sur `is_active`

---

## 🚀 Étapes de Configuration

### Option A: Interface Admin PocketBase (Recommandé)

1. **Ouvrir PocketBase Admin** à https://pb.hagendigital.com/_/

2. **Créer chaque collection** en suivant les spécifications ci-dessus

3. **Configurer les règles d'accès** pour chaque collection

4. **Créer les indexes** pour optimiser les performances

5. **Tester** en créant quelques données de test

### Option B: Import JSON (Rapide)

1. Créer un fichier JSON avec la structure des collections
2. Utiliser l'import dans PocketBase Admin
3. Ajuster les règles si nécessaire

---

## 📝 Données de Test (Optionnel)

### Créer quelques challenges de test:

**Challenge 1: "Première Tâche"**
```json
{
  "title": "Compléter votre première tâche",
  "description": "Marquez une tâche comme terminée",
  "type": "tutorial",
  "goal_metric": "tasks_completed",
  "goal_value": 1,
  "points_reward": 50,
  "is_active": true,
  "start_date": "2026-02-01 00:00:00",
  "end_date": "2026-12-31 23:59:59"
}
```

**Challenge 2: "Super Productif"**
```json
{
  "title": "Complétez 10 tâches",
  "description": "Terminez 10 tâches pour gagner 200 points",
  "type": "weekly",
  "goal_metric": "tasks_completed",
  "goal_value": 10,
  "points_reward": 200,
  "is_active": true,
  "start_date": "2026-02-01 00:00:00",
  "end_date": "2026-12-31 23:59:59"
}
```

### Créer quelques items de boutique:

**Item 1: "Thème Sombre Premium"**
```json
{
  "name": "Thème Sombre Premium",
  "description": "Un thème sombre élégant avec des couleurs personnalisées",
  "price": 500,
  "type": "theme",
  "is_available": true,
  "icon": "🎨"
}
```

**Item 2: "Avatar Doré"**
```json
{
  "name": "Avatar Doré",
  "description": "Affichez votre prestige avec un avatar doré",
  "price": 1000,
  "type": "avatar",
  "is_available": true,
  "icon": "👑"
}
```

---

## ✅ Vérification

Après configuration, vérifier que:

1. ✅ Les 6 collections sont créées
2. ✅ Les règles d'accès sont correctes
3. ✅ Les indexes sont en place
4. ✅ Les relations fonctionnent (user_id → users, etc.)
5. ✅ Quelques données de test existent

---

## 🔧 Troubleshooting

**Erreur "Collection not found":**
- Vérifier que toutes les collections sont créées
- Vérifier l'orthographe exacte des noms

**Erreur "Unauthorized":**
- Vérifier les règles d'accès API
- S'assurer que l'utilisateur est authentifié

**Erreur de relation:**
- Vérifier que les champs de relation pointent vers les bonnes collections
- Vérifier que les IDs existent

---

## 📊 Utilisation

Une fois configuré, le système de gamification:

1. **Attribution automatique de points** lors de la complétion de tâches
2. **Calcul automatique des niveaux** (1 niveau = 100 points)
3. **Système de streaks** pour les connexions quotidiennes
4. **Challenges actifs** disponibles pour tous les utilisateurs
5. **Boutique** pour dépenser les points gagnés
6. **Leaderboard** pour la compétition (opt-in)

---

## 🎯 Prochaines Étapes

Après avoir configuré PocketBase:

1. Tester la création d'une tâche et vérifier que les points sont attribués
2. Créer quelques challenges pour vos utilisateurs
3. Ajouter des items dans la boutique
4. Personnaliser les récompenses selon vos besoins

**Questions?** Consulte [gamification.service.js](src/services/gamification.service.js) pour voir comment le système fonctionne.
