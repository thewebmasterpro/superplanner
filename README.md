# Superplanner 🚀

Task Management & CRM pour Small Business avec authentification Google OAuth

## 🎯 Stack Technique

- **Frontend:** Vite + React
- **Backend:** Supabase (PostgreSQL + Auth + API)
- **Authentification:** Supabase Auth (Email + Google OAuth)
- **Déploiement:** Hostinger

## ✨ Fonctionnalités

### Core Features
- ✅ Authentification Email/Password
- ✅ Connexion Google OAuth (2 clics)
- ✅ Gestion des tâches avec statuts et priorités
- ✅ Gestion des projets et campagnes
- ✅ Gestion des clients (CRM)
- ✅ Time tracking avec timer intégré
- ✅ Réunions et planification d'équipe
- ✅ Commentaires et notes sur les tâches
- ✅ Workspaces et catégories
- ✅ Row Level Security (chaque utilisateur voit uniquement ses données)
- ✅ API auto-générée
- ✅ Temps réel (updates automatiques)

### 🎮 V4 Gamification System (NEW - v1.2.0)
- ✅ **Système de points et niveaux** - Gagnez des points en complétant des tâches
- ✅ **Streaks quotidiennes** - Maintenez votre productivité jour après jour
- ✅ **Leaderboards** - Compétition individuelle et par équipe
- ✅ **Team Rewards** - Les leaders d'équipe peuvent récompenser les membres
- ✅ **Historique complet** - Tracking détaillé de tous les gains/dépenses
- 🔄 **Challenges** - Défis quotidiens, hebdomadaires, mensuels (bientôt)
- 🔄 **Boutique virtuelle** - Thèmes, avatars, badges, features (bientôt)
- 🔄 **Interface Super Admin** - Dashboard et gestion globale (bientôt)

## 🚀 Démarrage Rapide

### 1. Installation

```bash
# Cloner le repo
git clone https://github.com/thewebmasterpro/superplanner.git
cd superplanner

# Installer les dépendances
npm install
cd client && npm install && cd ..
```

### 2. Configuration Supabase

1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Copiez vos clés API (Project URL + anon key)
4. Créez `client/.env` :
   ```env
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_anon_key
   ```

5. Créez les tables :
   - Allez dans **SQL Editor** dans Supabase Dashboard
   - Copiez-collez le contenu de [supabase-schema.sql](supabase-schema.sql)
   - Exécutez (Ctrl+Enter)

### 3. Activer Google OAuth (optionnel)

Voir [ACTIVER-GOOGLE-OAUTH.md](ACTIVER-GOOGLE-OAUTH.md) pour les instructions détaillées (5 min)

### 4. Lancer en développement

```bash
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173)

## 📚 Documentation

### Setup de Base
- **[QUICK-START-SUPABASE.md](QUICK-START-SUPABASE.md)** - Démarrage rapide (10 min)
- **[SUPABASE-SETUP.md](SUPABASE-SETUP.md)** - Guide complet de configuration
- **[ACTIVER-GOOGLE-OAUTH.md](ACTIVER-GOOGLE-OAUTH.md)** - Activer Google OAuth
- **[MIGRATION-SUPABASE.md](MIGRATION-SUPABASE.md)** - Détails de la migration vers Supabase

### 🎮 V4 Gamification (v1.2.0)
- **[docs/V4_INDEX.md](docs/V4_INDEX.md)** - Index complet de la documentation V4 📖
- **[docs/V4_QUICK_SETUP.md](docs/V4_QUICK_SETUP.md)** - Installation rapide (5 min) ⚡
- **[docs/V4_TESTING_GUIDE.md](docs/V4_TESTING_GUIDE.md)** - Guide de tests détaillé 🧪
- **[docs/V4_SEED_DATA.md](docs/V4_SEED_DATA.md)** - Données initiales (challenges, shop) 🌱
- **[docs/POCKETBASE_SETUP_V4.md](docs/POCKETBASE_SETUP_V4.md)** - Schéma complet PocketBase 📋
- **[pocketbase_v4_all_collections.json](pocketbase_v4_all_collections.json)** - Import automatique des 10 collections 📦

### Autres
- **[CHANGELOG.md](CHANGELOG.md)** - Historique des versions
- **[docs/ROADMAP_PHASES_SUIVANTES.md](docs/ROADMAP_PHASES_SUIVANTES.md)** - Roadmap du projet

## 🏗️ Structure du Projet

```
superplanner/
├── client/                 # Frontend Vite + React
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginSupabase.jsx    # Page de connexion
│   │   │   └── Login.css
│   │   ├── lib/
│   │   │   └── supabase.js          # Config Supabase
│   │   ├── AppSupabase.jsx          # App principale
│   │   └── main.jsx
│   ├── .env                 # Variables d'environnement
│   └── package.json
├── supabase-schema.sql     # Schema de la base de données
└── package.json
```

## 🔒 Sécurité

- ✅ Row Level Security (RLS) activé
- ✅ Chaque utilisateur voit uniquement ses propres données
- ✅ Authentification sécurisée par Supabase
- ✅ Tokens JWT gérés automatiquement
- ✅ Variables d'environnement (.env) jamais commitées

## 🚀 Déploiement

### Hostinger

```bash
# Build du client
cd client
npm run build
cd ..

# Déployer les fichiers
# - client/dist/ → vers public_html sur Hostinger
# - Configurer client/.env sur le serveur
```

Voir [SUPABASE-SETUP.md](SUPABASE-SETUP.md) pour les instructions détaillées.

## 🔄 API (via Supabase)

Supabase génère automatiquement une API REST :

```javascript
// Créer une tâche
const { data, error } = await supabase
  .from('tasks')
  .insert({ title: 'Ma tâche', status: 'todo' })

// Lire les tâches
const { data, error } = await supabase
  .from('tasks')
  .select('*')
```

Pas besoin de créer des routes Express ! 🎉

## 📊 Base de données

### Tables

- **projects** - Projets de l'utilisateur
- **tasks** - Tâches liées aux projets
- **clients** - Clients CRM
- **prayer_schedule** - Horaires de prière (public)

Toutes les tables ont Row Level Security activé.

## 👨‍💻 Auteur

**Anouar** - [thewebmaster.pro](https://thewebmaster.pro)

---

**Démarrage rapide :** Consultez [QUICK-START-SUPABASE.md](QUICK-START-SUPABASE.md) pour être opérationnel en 10 minutes ! ⚡
