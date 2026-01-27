# Telegram Bot Function Setup

Cette documentation explique comment configurer le bot Telegram pour qu'il puisse recevoir des messages et agir sur Superplanner.

## 1. Prérequis

- Le Token du Bot Telegram (dans vos variables d'environnement Supabase).
- L'URL de votre fonction Supabase déployée (`https://<project-ref>.supabase.co/functions/v1/telegram-bot`).

## 2. Configurer le Webhook

Vous devez dire à Telegram d'envoyer les messages vers votre fonction. Exécutez cette commande dans votre terminal (ou navigateur) :

```bash
curl -F "url=https://<VOTRE_PROJET_SUPABASE>.supabase.co/functions/v1/telegram-bot" \
     https://api.telegram.org/bot<VOTRE_TOKEN_TELEGRAM>/setWebhook
```

## 3. Utilisation

1. Assurez-vous d'avoir entré votre **Chat ID** dans les Settings de Superplanner.
2. Envoyez un message au bot : "Penser à sortir les poubelles"
3. Le bot répondra "✅ Tâche ajoutée" et elle apparaîtra dans votre Dashboard.

## 4. Pour aller plus loin (Intelligence Artificielle)

Pour l'instant, le bot ajoute tout texte comme titre de tâche.
Pour qu'il comprenne "demain à 18h", il faudrait intégrer l'API OpenAI ou un parseur de date (ex: chrono-node) dans la fonction Edge.
