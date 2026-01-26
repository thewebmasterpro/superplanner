# Configuration Supabase pour Superplanner

## 🎉 Pourquoi Supabase ?

Supabase simplifie **tout** :
- ✅ **Authentification complète** (email, Google, etc.) - Prête à l'emploi !
- ✅ **Base de données PostgreSQL** - Puissante et gratuite
- ✅ **API auto-générée** - REST et GraphQL
- ✅ **Row Level Security** - Sécurité intégrée
- ✅ **Temps réel** - Updates en direct (websockets)
- ✅ **Storage** - Pour les fichiers/images

Plus besoin de gérer MySQL, JWT, bcrypt, etc. Supabase fait tout !

---

## Partie 1: Configuration Supabase Dashboard

### Étape 1: Accéder à votre projet

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Votre projet : `https://tytayccjnnwixunjazta.supabase.co`

### Étape 2: Créer les tables de la base de données

1. Dans le dashboard Supabase, allez dans **SQL Editor** (dans la barre latérale)
2. Cliquez sur **+ New query**
3. Copiez-collez tout le contenu du fichier [supabase-schema.sql](supabase-schema.sql)
4. Cliquez sur **Run** (ou Ctrl+Enter)
5. Attendez que toutes les tables soient créées (ça prend quelques secondes)

Vous devriez voir :
```
Success. No rows returned
```

### Étape 3: Vérifier les tables

1. Allez dans **Table Editor** (dans la barre latérale)
2. Vous devriez voir ces tables :
   - `projects`
   - `tasks`
   - `clients`
   - `prayer_schedule`

### Étape 4: Configurer Google OAuth

1. Dans le dashboard Supabase, allez dans **Authentication** → **Providers**

2. Trouvez **Google** dans la liste et cliquez dessus

3. **Activez Google Auth** :
   - Basculez le toggle "Google enabled" sur ON

4. **Configurez les credentials** :
   - Si vous avez déjà créé un projet Google Cloud (étape précédente), utilisez les mêmes credentials
   - Sinon, suivez ce guide rapide :

#### 4a. Créer les credentials Google (si pas déjà fait)

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet "Superplanner" (ou utilisez celui existant)
3. Allez dans **APIs & Services** → **Credentials**
4. **+ Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Name: `Superplanner`

7. **Authorized JavaScript origins** :
   - `https://tytayccjnnwixunjazta.supabase.co`
   - `http://localhost:5173` (pour dev local)

8. **Authorized redirect URIs** :
   - `https://tytayccjnnwixunjazta.supabase.co/auth/v1/callback`
   - `http://localhost:54321/auth/v1/callback` (pour dev local)

9. Cliquez **Create**

10. **Copiez les credentials** :
    - Client ID
    - Client secret

#### 4b. Retour dans Supabase

1. Collez votre **Client ID** dans le champ "Client ID"
2. Collez votre **Client Secret** dans le champ "Client Secret"
3. Cliquez **Save**

### Étape 5: Configurer l'URL de redirection

1. Toujours dans **Authentication** → **URL Configuration**
2. **Site URL** : `https://sp.thewebmaster.pro`
3. **Redirect URLs** : Ajoutez :
   - `https://sp.thewebmaster.pro`
   - `http://localhost:5173` (pour dev local)
4. Cliquez **Save**

### Étape 6: Récupérer vos clés API

1. Allez dans **Settings** → **API**
2. Vous devriez voir :
   - **Project URL** : `https://tytayccjnnwixunjazta.supabase.co` ✅ (déjà configuré)
   - **anon/public key** : `sb_publishable_gYGUDBOk_YLM4d3xh_gJuQ_0jYZMbCK` ✅ (déjà configuré)

Ces clés sont déjà dans votre `.env` ! ✅

---

## Partie 2: Configuration de l'application

### ✅ Déjà fait !

J'ai déjà configuré :
- ✅ Installé `@supabase/supabase-js` et autres packages
- ✅ Créé `client/src/lib/supabase.js` avec la config
- ✅ Créé `client/.env` avec vos clés :
  ```env
  VITE_SUPABASE_URL=https://tytayccjnnwixunjazta.supabase.co
  VITE_SUPABASE_ANON_KEY=sb_publishable_gYGUDBOk_YLM4d3xh_gJuQ_0jYZMbCK
  ```
- ✅ Créé `LoginSupabase.jsx` avec Google OAuth
- ✅ Créé `AppSupabase.jsx` avec gestion des sessions
- ✅ Mis à jour `main.jsx` pour utiliser Supabase

---

## Partie 3: Test en local

### 1. Démarrer le serveur de dev

```bash
npm run dev
```

### 2. Ouvrir l'application

Allez sur [http://localhost:5173](http://localhost:5173)

### 3. Tester la connexion

Vous devriez voir la page de login avec :
- **Formulaire email/password** (pour créer un compte)
- **Bouton "Sign in with Google"**

**Test 1: Email/Password**
1. Entrez votre email et un mot de passe
2. Cliquez "Sign up" (ou "Sign in" si compte existe)
3. Vérifiez votre email (Supabase envoie un email de confirmation)
4. Cliquez sur le lien de confirmation
5. Vous êtes connecté !

**Test 2: Google**
1. Cliquez sur "Sign in with Google"
2. Sélectionnez votre compte Google
3. Vous êtes automatiquement connecté !

### 4. Vérifier dans Supabase

Allez dans **Authentication** → **Users** dans le dashboard Supabase.
Vous devriez voir votre utilisateur !

---

## Partie 4: Déploiement sur Hostinger

### Option A: Via Git (recommandé)

```bash
# Sur votre machine locale
git add .
git commit -m "feat: Migrate to Supabase"
git push origin main
```

Sur Hostinger, l'application se redéploiera automatiquement.

### Option B: Build et Upload manuel

```bash
# Build du client
cd client
npm install
npm run build
cd ..
```

Uploadez sur Hostinger :
- `server/` (si vous gardez le serveur Express, sinon pas nécessaire)
- `client/dist/` → vers le dossier public de Hostinger
- `client/.env` avec les clés Supabase

### Configuration sur Hostinger

1. **Créez `client/.env` sur Hostinger** :
   ```env
   VITE_SUPABASE_URL=https://tytayccjnnwixunjazta.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_gYGUDBOk_YLM4d3xh_gJuQ_0jYZMbCK
   ```

2. **Configurez l'URL de production dans Supabase** :
   - Retournez dans Supabase → **Authentication** → **URL Configuration**
   - Ajoutez `https://sp.thewebmaster.pro` dans **Redirect URLs**

3. **Redémarrez l'application** (si nécessaire)

---

## Partie 5: Fonctionnalités Supabase

### Authentification

Supabase gère automatiquement :
- ✅ Sessions (JWT tokens)
- ✅ Refresh tokens
- ✅ Email verification
- ✅ Password reset
- ✅ Google OAuth (et autres providers)
- ✅ Magic links (connexion sans mot de passe)

### Sécurité (Row Level Security)

Chaque utilisateur voit **uniquement ses propres données** :
- Ses projets
- Ses tâches
- Ses clients

Grâce aux policies RLS configurées dans `supabase-schema.sql` !

### API en temps réel

Vous pouvez activer les updates en temps réel :

```javascript
// S'abonner aux changements de tâches
supabase
  .channel('tasks')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
    console.log('Change received!', payload)
    // Mettre à jour l'interface
  })
  .subscribe()
```

### Storage (optionnel)

Pour uploader des fichiers :

```javascript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar1.png', file)
```

---

## Dépannage

### Erreur: "Invalid Supabase URL"

→ Vérifiez que `client/.env` contient bien :
```env
VITE_SUPABASE_URL=https://tytayccjnnwixunjazta.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_gYGUDBOk_YLM4d3xh_gJuQ_0jYZMbCK
```

### Erreur: "Google sign in failed"

→ Vérifiez dans Supabase :
1. **Authentication** → **Providers** → Google est activé
2. Les redirect URIs sont correctes
3. Les credentials Google sont valides

### Erreur: "Failed to fetch"

→ Vérifiez que les tables sont bien créées dans Supabase :
1. **SQL Editor** → Ré-exécutez `supabase-schema.sql`
2. **Table Editor** → Vérifiez que les tables existent

### L'utilisateur ne peut pas voir ses données

→ Vérifiez que Row Level Security (RLS) est bien configuré :
1. **Authentication** → **Policies**
2. Vérifiez que les policies existent pour chaque table

---

## Avantages vs MySQL + Custom Auth

| Fonctionnalité | Avant (MySQL) | Maintenant (Supabase) |
|----------------|---------------|----------------------|
| Setup auth | 2-3 heures | 5 minutes ✅ |
| Google OAuth | Config complexe | 2 clics ✅ |
| Email verification | À coder | Inclus ✅ |
| Password reset | À coder | Inclus ✅ |
| Session management | JWT custom | Automatique ✅ |
| Database hosting | À configurer | Hébergé ✅ |
| API REST | À créer | Auto-générée ✅ |
| Sécurité | À implémenter | RLS intégré ✅ |
| Temps réel | WebSocket custom | Intégré ✅ |
| Coût | Hostinger DB | **Gratuit** jusqu'à 50k users ✅ |

---

## 🎉 Résultat final

Une fois tout configuré :
1. Allez sur [https://sp.thewebmaster.pro](https://sp.thewebmaster.pro)
2. Cliquez sur **"Sign in with Google"**
3. Connectez-vous en 2 clics
4. C'est tout ! 🚀

Pas de mot de passe à retenir, authentification sécurisée par Google, données protégées par RLS.

---

## Prochaines étapes (optionnel)

1. **Ajouter d'autres providers** (GitHub, Facebook, etc.)
2. **Activer le temps réel** pour les updates automatiques
3. **Ajouter le storage** pour les images/fichiers
4. **Créer des fonctions serverless** (Edge Functions)
5. **Dashboard analytics** avec Supabase

Tout est inclus dans Supabase ! 🎉
