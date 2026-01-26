# Superplanner 🚀

Task Management & CRM pour Small Business avec authentification Google OAuth

## 🎯 Stack Technique

- **Frontend:** Vite + React
- **Backend:** Supabase (PostgreSQL + Auth + API)
- **Authentification:** Supabase Auth (Email + Google OAuth)
- **Déploiement:** Hostinger

## ✨ Fonctionnalités

- ✅ Authentification Email/Password
- ✅ Connexion Google OAuth (2 clics)
- ✅ Gestion des tâches
- ✅ Gestion des projets
- ✅ Gestion des clients
- ✅ Horaires de prière
- ✅ Row Level Security (chaque utilisateur voit uniquement ses données)
- ✅ API auto-générée
- ✅ Temps réel (updates automatiques)

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

- **[QUICK-START-SUPABASE.md](QUICK-START-SUPABASE.md)** - Démarrage rapide (10 min)
- **[SUPABASE-SETUP.md](SUPABASE-SETUP.md)** - Guide complet de configuration
- **[ACTIVER-GOOGLE-OAUTH.md](ACTIVER-GOOGLE-OAUTH.md)** - Activer Google OAuth
- **[MIGRATION-SUPABASE.md](MIGRATION-SUPABASE.md)** - Détails de la migration vers Supabase

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
