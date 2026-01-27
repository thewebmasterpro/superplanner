#!/bin/bash

# Configuration
PROJECT_ID="tytayccjnnwixunjazta" # Found from previous context
FUNCTION_NAME="telegram-bot"
Current_Dir=$(pwd)

echo "🤖 Telegram Webhook Setup for Superplanner"
echo "----------------------------------------"
echo "This script connects your Telegram Bot to your Supabase Edge Function."
echo ""

# 1. Get Authentication
echo "🔑 We need your Telegram Bot Token."
echo "   (It looks like: 123456789:ABC-DEF...)"
read -p "   Paste Token here: " BOT_TOKEN

if [ -z "$BOT_TOKEN" ]; then
    echo "❌ Error: Token cannot be empty."
    exit 1
fi

# 2. Construct URL
WEBHOOK_URL="https://${PROJECT_ID}.supabase.co/functions/v1/${FUNCTION_NAME}"
echo ""
echo "🔗 Target URL: $WEBHOOK_URL"

# 3. Call Telegram API
echo "🚀 Setting webhook..."
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d "{\"url\": \"$WEBHOOK_URL\"}")

echo ""
echo "📩 Telegram Response:"
echo "$RESPONSE"
echo ""

# 4. Check result
if [[ "$RESPONSE" == *"\"ok\":true"* ]]; then
    echo "✅ SUCCESS! Your bot is now linked to Superplanner."
    echo "   Try sending /start to your bot in Telegram."
else
    echo "❌ FAILED. Please check your token and try again."
fi
