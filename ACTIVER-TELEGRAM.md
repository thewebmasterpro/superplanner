# Guide Simple : Activer les Notifications Telegram

## 📱 Étape 1 : Obtenir votre Bot Token

1. Ouvrez **Telegram**
2. Cherchez **@BotFather**
3. Envoyez le message : `/mybots`
4. Sélectionnez **@Henry_anouar_bot**
5. Cliquez sur **"API Token"**
6. Copiez le token (ressemble à : `123456789:ABC-DEF...`)

---

## 🌐 Méthode 1 : Via Dashboard Supabase (PLUS SIMPLE)

### A. Créer la Edge Function via Dashboard

1. **Allez sur** https://supabase.com/dashboard
2. **Sélectionnez** votre projet "Superplanner"
3. **Cliquez** sur "Edge Functions" dans le menu gauche
4. **Cliquez** sur "Create a new function"
5. **Nom de la fonction** : `send-telegram-notification`
6. **Copiez-collez** le code depuis [`supabase/functions/send-telegram-notification/index.ts`](file:///Users/anouarasrih/clawd/superplanner/supabase/functions/send-telegram-notification/index.ts)
7. **Cliquez** "Deploy function"

### B. Ajouter le Bot Token dans les Secrets

1. Dans le Dashboard Supabase, allez dans **Settings → Edge Functions**
2. Section **"Secrets"**
3. **Ajoutez** un nouveau secret:
   - Name: `TELEGRAM_BOT_TOKEN`
   - Value: Collez votre Bot Token obtenu à l'étape 1
4. **Sauvegardez**

### C. Obtenir l'URL de la Function

Après le déploiement, l'URL sera automatiquement :
```
https://VOTRE_PROJET.supabase.co/functions/v1/send-telegram-notification
```

Remplacez `VOTRE_PROJET` par votre Project Reference (visible dans Settings → General)

---

## 💻 Méthode 2 : Via Terminal (Pour les développeurs)

Si vous préférez la ligne de commande :

### Installation du CLI
```bash
npm install -g supabase
```

### Login
```bash
supabase login
```

### Link au projet
```bash
cd /Users/anouarasrih/clawd/superplanner
supabase link --project-ref VOTRE_PROJECT_REF
```

### Déployer
```bash
supabase secrets set TELEGRAM_BOT_TOKEN=VOTRE_BOT_TOKEN
supabase functions deploy send-telegram-notification
```

---

## ✅ Vérification

Après le déploiement (Méthode 1 OU 2):

1. **Ouvrez l'app** Superplanner
2. Allez dans **Settings → Preferences**
3. Section **"📱 Telegram Notifications"**
4. Envoyez `/start` à @Henry_anouar_bot
5. Le bot vous répond avec votre **Chat ID** (ex: 123456789)
6. **Collez** le Chat ID dans le champ
7. **Activez** "Enable Telegram Notifications"
8. **Cliquez** sur "🧪 Send Test Notification"
9. **Vérifiez** votre Telegram → Vous devriez recevoir un message ! 🎉

---

## 🆘 En Cas de Problème

### Erreur 404
- La fonction n'est pas déployée → Refaites l'étape A

### Erreur "Bot Token not configured"
- Le secret n'est pas défini → Refaites l'étape B

### Pas de message reçu
- Vérifiez que le Chat ID est correct
- Vérifiez que les notifications sont activées
- Vérifiez que vous avez bien envoyé `/start` au bot

---

## 📝 Recommandation

**Utilisez la Méthode 1 (Dashboard)** si :
- ✅ Vous n'êtes pas familier avec le terminal
- ✅ Vous voulez une interface visuelle
- ✅ C'est votre première fois avec Supabase Functions

**Utilisez la Méthode 2 (Terminal)** si :
- ✅ Vous êtes à l'aise avec la ligne de commande
- ✅ Vous voulez automatiser le déploiement
- ✅ Vous développez activement

---

**Quelle méthode préférez-vous ?** Je peux vous guider étape par étape ! 🚀
