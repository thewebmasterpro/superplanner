# Activer Google OAuth - Guide Rapide

## ✅ C'est déjà dans le code !

Le bouton "Sign in with Google" est **déjà codé** dans votre application ! 🎉

Regardez [client/src/components/LoginSupabase.jsx](client/src/components/LoginSupabase.jsx) ligne 74 :
```javascript
providers={['google']}  // ← Google est déjà configuré !
```

Il vous reste juste à **activer Google dans Supabase Dashboard**.

---

## 🚀 Activation en 5 minutes

### Étape 1: Créer les credentials Google (une seule fois)

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet "Superplanner" (ou utilisez un existant)
3. Menu → **APIs & Services** → **Credentials**
4. **+ Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Name: `Superplanner`

7. **Authorized JavaScript origins** :
   ```
   https://tytayccjnnwixunjazta.supabase.co
   http://localhost:54321
   ```

8. **Authorized redirect URIs** :
   ```
   https://tytayccjnnwixunjazta.supabase.co/auth/v1/callback
   http://localhost:54321/auth/v1/callback
   ```

9. Cliquez **Create**

10. **Copiez vos credentials** :
    - ✅ Client ID
    - ✅ Client secret

---

### Étape 2: Configurer dans Supabase

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Ouvrez votre projet
3. **Authentication** → **Providers** (dans la barre latérale)
4. Trouvez **Google** dans la liste
5. Cliquez sur **Google**

6. **Activez Google** :
   - Toggle "Google enabled" → **ON** (vert)

7. **Collez vos credentials** :
   - Client ID (OAuth): `votre_client_id.apps.googleusercontent.com`
   - Client Secret (OAuth): `GOCSPX-...`

8. Cliquez **Save**

---

### Étape 3: Tester !

#### En local :

```bash
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173)

Vous verrez :
```
🚀 Superplanner
Task Management & CRM

┌─────────────────────────┐
│  Email                  │
│  [email input]          │
│                         │
│  Password               │
│  [password input]       │
│                         │
│  [Sign in]              │
└─────────────────────────┘

┌─────────────────────────┐
│  🔵 Sign in with Google │  ← Voilà ! Le bouton Google
└─────────────────────────┘

Sign in with your email or Google account
```

#### Cliquez sur "Sign in with Google" :

1. Popup Google s'ouvre
2. Sélectionnez votre compte Google
3. **Vous êtes connecté !** 🎉

---

## 🎯 Ce que vous verrez après connexion

Une fois connecté via Google :

```
🚀 Superplanner
Task Management & CRM

👤 votre-email@gmail.com    [Logout]

✅ Connected to Supabase

Tasks
─────
No tasks yet. Create one to get started!
```

---

## 🔍 Vérifier dans Supabase

1. Allez dans **Authentication** → **Users**
2. Vous devriez voir votre utilisateur Google !
3. Provider: `google`
4. Email: Votre email Google

---

## ⚡ Pour la production (Hostinger)

1. Modifiez les **Authorized redirect URIs** dans Google Cloud :
   ```
   https://sp.thewebmaster.pro/auth/v1/callback
   ```
   ⚠️ Utilisez l'URL de **votre domaine Supabase**, pas sp.thewebmaster.pro !

2. Dans Supabase → **Authentication** → **URL Configuration** :
   - Site URL: `https://sp.thewebmaster.pro`
   - Redirect URLs: `https://sp.thewebmaster.pro`

3. Déployez votre code sur Hostinger

4. Testez sur `https://sp.thewebmaster.pro`

---

## 🆘 Dépannage

### "idpiframe_initialization_failed"

**Cause :** Les redirect URIs ne correspondent pas

**Solution :**
1. Vérifiez Google Cloud Console → Credentials
2. Les redirect URIs doivent être **exactement** :
   ```
   https://tytayccjnnwixunjazta.supabase.co/auth/v1/callback
   ```
3. **Pas** `sp.thewebmaster.pro` mais bien l'URL Supabase !

### Le bouton Google n'apparaît pas

**Cause :** Google n'est pas activé dans Supabase

**Solution :**
1. Supabase Dashboard → Authentication → Providers
2. Google → **Enable** (toggle ON)
3. Sauvegardez les credentials

### "Access blocked: This app's request is invalid"

**Cause :** Les Authorized redirect URIs ne sont pas configurés

**Solution :**
1. Google Cloud Console → Credentials
2. Éditez votre OAuth client
3. Ajoutez les redirect URIs (voir Étape 1)

### "Email not authorized"

**Cause :** Votre app Google est en mode "Testing"

**Solution :**
1. Google Cloud Console → OAuth consent screen
2. Ajoutez votre email dans "Test users"
3. Ou publiez l'app (si prêt pour production)

---

## 📝 Récapitulatif

✅ Code déjà fait (le bouton Google est là !)
✅ Il reste juste :
1. Créer les credentials Google (5 min)
2. Les ajouter dans Supabase (2 min)
3. Tester (1 min)

**Total : 8 minutes ! ⏱️**

---

## 🎉 Après activation

Vos utilisateurs pourront :
- ✅ Se connecter avec Google en 2 clics
- ✅ S'inscrire automatiquement (pas besoin de créer un compte)
- ✅ Pas de mot de passe à retenir
- ✅ Sécurité Google (2FA, etc.)

**Super expérience utilisateur !** 🚀
