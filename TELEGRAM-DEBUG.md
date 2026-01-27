# Debug: Telegram Notification Errors

## Current Status
User reports: "Failed to send notification: Failed to send Telegram notification"

## Potential Issues

### 1. Bot Token Not Configured
**Check:** Supabase Dashboard → Settings → Edge Functions → Secrets
- **TELEGRAM_BOT_TOKEN** must be present
- Format: `123456789:ABC-DEF...`

### 2. Function Not Redeployed
**Check:** Edge Functions → send-telegram-notification
- Version should be 2 or 3 (not 1)
- If still version 1, code changes weren't deployed

### 3. Wrong Chat ID
- Chat ID must be numeric (ex: 123456789)
- Get it by sending `/start` to @Henry_anouar_bot

### 4. Telegram API Error
Common errors:
- "Chat not found" → Wrong Chat ID or user didn't /start the bot
- "Unauthorized" → Bot Token incorrect
- "Bad Request" → Malformed message

## Debug Steps

### Via Supabase Dashboard
1. **Edge Functions** → **send-telegram-notification** → **Logs**
2. Click on latest failed POST request
3. Copy the full error message

### Via Browser Console
```javascript
const chatId = 'YOUR_CHAT_ID';

fetch('https://tytayccjnnwixunjazta.supabase.co/functions/v1/send-telegram-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: chatId,
    message: '🧪 Test'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## Next Steps
Need detailed error from logs or console test to proceed.
