# Deployment Instructions for Telegram Notifications

## 📋 Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Logged into Supabase: `supabase login`
- Your Telegram Bot Token from @BotFather

## 🚀 Deployment Steps

### 1. Get Your Bot Token
1. Open Telegram and search for **@BotFather**
2. Send `/mybots`
3. Select **@Henry_anouar_bot**
4. Click "API Token"
5. Copy the token (format: `123456789:ABC-DEF1ghi2jkl3mno4pqr5stu6vwx`)

### 2. Link Your Supabase Project
```bash
cd /Users/anouarasrih/clawd/superplanner
supabase link --project-ref YOUR_PROJECT_REF
```

To find YOUR_PROJECT_REF:
- Go to https://supabase.com/dashboard
- Select your project
- Copy the Project Reference ID from Settings → General

### 3. Set the Bot Token as a Secret
```bash
supabase secrets set TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
```

Replace `YOUR_BOT_TOKEN_HERE` with your actual Bot Token.

### 4. Deploy the Edge Function
```bash
supabase functions deploy send-telegram-notification
```

### 5. Get the Function URL
After deployment, you'll get a URL like:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-telegram-notification
```

### 6. Update Frontend Configuration
The frontend hook is already configured to use the correct endpoint pattern.
The function will be accessible at:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-telegram-notification
```

## 🧪 Testing

### Test via curl
```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-telegram-notification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "chat_id": "YOUR_CHAT_ID",
    "message": "🧪 Test notification from Superplanner!"
  }'
```

### Test via App
1. Go to Settings → Preferences → Telegram Notifications
2. Enter your Chat ID (get it by sending `/start` to @Henry_anouar_bot)
3. Enable notifications
4. Click "🧪 Send Test Notification"

## 🔐 Security Notes
- ✅ Bot Token is stored securely in Supabase Secrets
- ✅ Never committed to git
- ✅ Only accessible to Edge Function
- ✅ CORS enabled for your frontend

## 📝 Next Steps
After testing, you can:
1. Schedule automatic reminders
2. Add notification triggers for deadlines
3. Configure meeting reminders
