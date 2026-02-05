# Seed Data - V4 Gamification

**Date:** 2026-02-05

Ce document contient les données initiales pour peupler les collections `challenges` et `shop_items`.

---

## 🎯 Challenges Initiaux

### 1. Daily Challenges (Quotidiens)

#### Early Bird 🌅
```
Collection: challenges
- title: "Early Bird"
- description: "Complète 3 tâches avant midi"
- type: "daily"
- goal_metric: "tasks_completed"
- goal_value: 3
- points_reward: 20
- icon: "Sunrise"
- is_active: true
- start_date: [Date du jour]
- end_date: [Date du jour]
```

#### Task Master ⚡
```
Collection: challenges
- title: "Task Master"
- description: "Complète 5 tâches en une journée"
- type: "daily"
- goal_metric: "tasks_completed"
- goal_value: 5
- points_reward: 30
- icon: "Zap"
- is_active: true
- start_date: [Date du jour]
- end_date: [Date du jour]
```

#### Focused Worker 🎯
```
Collection: challenges
- title: "Focused Worker"
- description: "Accumule 4 heures de time tracking"
- type: "daily"
- goal_metric: "hours_tracked"
- goal_value: 4
- points_reward: 25
- icon: "Target"
- is_active: true
- start_date: [Date du jour]
- end_date: [Date du jour]
```

---

### 2. Weekly Challenges (Hebdomadaires)

#### Productive Week 📈
```
Collection: challenges
- title: "Productive Week"
- description: "Complète 25 tâches cette semaine"
- type: "weekly"
- goal_metric: "tasks_completed"
- goal_value: 25
- points_reward: 100
- icon: "TrendingUp"
- is_active: true
- start_date: [Lundi de la semaine]
- end_date: [Dimanche de la semaine]
```

#### Streak Champion 🔥
```
Collection: challenges
- title: "Streak Champion"
- description: "Maintiens un streak de 7 jours consécutifs"
- type: "weekly"
- goal_metric: "streak_days"
- goal_value: 7
- points_reward: 150
- icon: "Flame"
- is_active: true
- start_date: [Lundi de la semaine]
- end_date: [Dimanche de la semaine]
```

#### Time Warrior ⏰
```
Collection: challenges
- title: "Time Warrior"
- description: "Track 30 heures de travail cette semaine"
- type: "weekly"
- goal_metric: "hours_tracked"
- goal_value: 30
- points_reward: 200
- icon: "Clock"
- is_active: true
- start_date: [Lundi de la semaine]
- end_date: [Dimanche de la semaine]
```

---

### 3. Monthly Challenges (Mensuels)

#### Monthly Master 🏆
```
Collection: challenges
- title: "Monthly Master"
- description: "Complète 100 tâches ce mois-ci"
- type: "monthly"
- goal_metric: "tasks_completed"
- goal_value: 100
- points_reward: 500
- icon: "Trophy"
- is_active: true
- start_date: [1er du mois]
- end_date: [Dernier jour du mois]
```

#### Consistency King 👑
```
Collection: challenges
- title: "Consistency King"
- description: "Maintiens un streak de 30 jours"
- type: "monthly"
- goal_metric: "streak_days"
- goal_value: 30
- points_reward: 1000
- icon: "Crown"
- is_active: true
- start_date: [1er du mois]
- end_date: [Dernier jour du mois]
```

#### Time Master ⌛
```
Collection: challenges
- title: "Time Master"
- description: "Track 120 heures ce mois-ci"
- type: "monthly"
- goal_metric: "hours_tracked"
- goal_value: 120
- points_reward: 800
- icon: "Hourglass"
- is_active: true
- start_date: [1er du mois]
- end_date: [Dernier jour du mois]
```

---

## 🛒 Shop Items Initiaux

### 1. Themes (Thèmes)

#### Dark Ocean Theme 🌊
```
Collection: shop_items
- name: "Dark Ocean"
- description: "Thème sombre avec des accents bleu océan"
- item_type: "theme"
- price: 500
- icon: "Waves"
- config: {
    "primary": "#0ea5e9",
    "secondary": "#0c4a6e",
    "background": "#0f172a"
  }
- is_available: true
```

#### Sunset Theme 🌅
```
Collection: shop_items
- name: "Sunset Theme"
- description: "Thème chaud aux couleurs du coucher de soleil"
- item_type: "theme"
- price: 500
- icon: "Sunrise"
- config: {
    "primary": "#f97316",
    "secondary": "#ea580c",
    "background": "#7c2d12"
  }
- is_available: true
```

#### Forest Green Theme 🌲
```
Collection: shop_items
- name: "Forest Green"
- description: "Thème naturel vert forêt apaisant"
- item_type: "theme"
- price: 500
- icon: "Trees"
- config: {
    "primary": "#22c55e",
    "secondary": "#16a34a",
    "background": "#14532d"
  }
- is_available: true
```

---

### 2. Avatars (Avatars)

#### Golden Star Avatar ⭐
```
Collection: shop_items
- name: "Golden Star"
- description: "Avatar étoile dorée pour les top performers"
- item_type: "avatar"
- price: 200
- icon: "Star"
- config: {
    "border_color": "#fbbf24",
    "glow_effect": true
  }
- is_available: true
```

#### Diamond Avatar 💎
```
Collection: shop_items
- name: "Diamond"
- description: "Avatar diamant rare et prestigieux"
- item_type: "avatar"
- price: 1000
- icon: "Gem"
- config: {
    "border_color": "#60a5fa",
    "glow_effect": true,
    "particle_effect": "sparkle"
  }
- is_available: true
```

#### Fire Avatar 🔥
```
Collection: shop_items
- name: "Fire"
- description: "Avatar enflammé pour les streakers"
- item_type: "avatar"
- price: 300
- icon: "Flame"
- config: {
    "border_color": "#f97316",
    "glow_effect": true,
    "particle_effect": "fire"
  }
- is_available: true
```

---

### 3. Badges (Badges)

#### Productivity Legend Badge 🏆
```
Collection: shop_items
- name: "Productivity Legend"
- description: "Badge légendaire affiché sur votre profil"
- item_type: "badge"
- price: 150
- icon: "Trophy"
- config: {
    "color": "#fbbf24",
    "display_on_profile": true
  }
- is_available: true
```

#### Speed Demon Badge ⚡
```
Collection: shop_items
- name: "Speed Demon"
- description: "Badge pour les compléteurs rapides"
- item_type: "badge"
- price: 100
- icon: "Zap"
- config: {
    "color": "#eab308",
    "display_on_profile": true
  }
- is_available: true
```

#### Team Player Badge 🤝
```
Collection: shop_items
- name: "Team Player"
- description: "Badge pour les meilleurs collaborateurs"
- item_type: "badge"
- price: 200
- icon: "Users"
- config: {
    "color": "#3b82f6",
    "display_on_profile": true
  }
- is_available: true
```

---

### 4. Features (Fonctionnalités)

#### Custom Task Colors 🎨
```
Collection: shop_items
- name: "Custom Task Colors"
- description: "Débloque la personnalisation des couleurs de tâches"
- item_type: "feature"
- price: 300
- icon: "Palette"
- config: {
    "feature_id": "custom_task_colors",
    "permanent": true
  }
- is_available: true
```

#### Priority Tasks Boost 🚀
```
Collection: shop_items
- name: "Priority Tasks Boost"
- description: "Double les points des tâches prioritaires pendant 7 jours"
- item_type: "feature"
- price: 500
- icon: "Rocket"
- config: {
    "feature_id": "priority_boost",
    "duration_days": 7,
    "multiplier": 2
  }
- is_available: true
```

#### Streak Freeze ❄️
```
Collection: shop_items
- name: "Streak Freeze"
- description: "Protège ton streak pendant 1 jour d'inactivité"
- item_type: "feature"
- price: 100
- icon: "Snowflake"
- config: {
    "feature_id": "streak_freeze",
    "duration_days": 1
  }
- is_available: true
```

---

## 📝 Comment Ajouter ces Données

### Méthode 1: Manuellement (Recommandé pour commencer)

1. Ouvrir PocketBase Admin: `http://127.0.0.1:8090/_/`
2. Aller dans **Collections** → `challenges`
3. Pour chaque challenge ci-dessus:
   - Cliquer **New record**
   - Copier les valeurs depuis ce document
   - Ajuster les dates selon le contexte (aujourd'hui, cette semaine, ce mois)
   - Cliquer **Create**

4. Répéter pour **Collections** → `shop_items`

### Méthode 2: Via API (Advanced)

Si tu veux automatiser l'insertion:

```javascript
// Example: scripts/seed-challenges.js
import pb from '../src/lib/pocketbase.js'

const challenges = [
  {
    title: "Early Bird",
    description: "Complète 3 tâches avant midi",
    type: "daily",
    goal_metric: "tasks_completed",
    goal_value: 3,
    points_reward: 20,
    icon: "Sunrise",
    is_active: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  },
  // ... autres challenges
]

async function seedChallenges() {
  for (const challenge of challenges) {
    try {
      await pb.collection('challenges').create(challenge)
      console.log(`✅ Challenge créé: ${challenge.title}`)
    } catch (error) {
      console.error(`❌ Erreur pour ${challenge.title}:`, error)
    }
  }
}

seedChallenges()
```

### Méthode 3: Import CSV (Quick)

Créer un CSV et l'importer dans PocketBase:

```csv
title,description,type,goal_metric,goal_value,points_reward,icon,is_active,start_date,end_date
"Early Bird","Complète 3 tâches avant midi","daily","tasks_completed",3,20,"Sunrise",true,2026-02-05,2026-02-05
"Task Master","Complète 5 tâches en une journée","daily","tasks_completed",5,30,"Zap",true,2026-02-05,2026-02-05
...
```

---

## 🎯 Priorité d'Ajout

### Phase 1: Seed Minimum (10 minutes)
- 2 challenges daily
- 1 challenge weekly
- 3 shop items (1 theme, 1 avatar, 1 badge)

**Bénéfice:** System testable immédiatement

### Phase 2: Seed Complet (20 minutes)
- Tous les challenges (9 au total)
- Tous les shop items (12 au total)

**Bénéfice:** Expérience utilisateur complète

---

## ✅ Checklist Seed Data

- [ ] **Challenges Daily** (3)
  - [ ] Early Bird
  - [ ] Task Master
  - [ ] Focused Worker

- [ ] **Challenges Weekly** (3)
  - [ ] Productive Week
  - [ ] Streak Champion
  - [ ] Time Warrior

- [ ] **Challenges Monthly** (3)
  - [ ] Monthly Master
  - [ ] Consistency King
  - [ ] Time Master

- [ ] **Shop Themes** (3)
  - [ ] Dark Ocean
  - [ ] Sunset
  - [ ] Forest Green

- [ ] **Shop Avatars** (3)
  - [ ] Golden Star
  - [ ] Diamond
  - [ ] Fire

- [ ] **Shop Badges** (3)
  - [ ] Productivity Legend
  - [ ] Speed Demon
  - [ ] Team Player

- [ ] **Shop Features** (3)
  - [ ] Custom Task Colors
  - [ ] Priority Tasks Boost
  - [ ] Streak Freeze

---

## 📊 Valeurs Recommandées

### Points Rewards

| Type Challenge | Durée | Points Min | Points Max |
|---------------|-------|------------|------------|
| Daily | 1 jour | 20 | 50 |
| Weekly | 7 jours | 100 | 250 |
| Monthly | 30 jours | 500 | 1500 |

### Shop Prices

| Type Item | Prix Min | Prix Max | Exemple |
|-----------|----------|----------|---------|
| Theme | 300 | 1000 | 500 pts |
| Avatar | 100 | 1500 | 300 pts |
| Badge | 50 | 500 | 150 pts |
| Feature (temporaire) | 100 | 500 | 200 pts |
| Feature (permanent) | 500 | 2000 | 1000 pts |

---

**Prêt à peupler ta base?** 🚀

Ces données initiales permettront de tester tout le système de gamification V4 de bout en bout.
