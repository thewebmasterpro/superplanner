#!/bin/bash
# Test script to simulate a Telegram message to the Edge Function

PROJECT_REF="tytayccjnnwixunjazta"
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/telegram-bot"
TEST_CHAT_ID="123456789"

echo "🧪 Sending test request to $FUNCTION_URL..."

curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -v \
  -d "{
    \"update_id\": 10000,
    \"message\": {
      \"date\": 1441645532,
      \"chat\": {
        \"last_name\": \"Test\",
        \"id\": $TEST_CHAT_ID,
        \"type\": \"private\",
        \"first_name\": \"Test\",
        \"username\": \"TestUser\"
      },
      \"message_id\": 1365,
      \"from\": {
        \"last_name\": \"Test\",
        \"id\": $TEST_CHAT_ID,
        \"first_name\": \"Test\",
        \"username\": \"TestUser\"
      },
      \"text\": \"/start\"
    }
  }"

echo ""
