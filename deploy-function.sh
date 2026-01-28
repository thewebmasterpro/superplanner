#!/bin/bash

# Ensure we are in the project root
cd "$(dirname "$0")"

echo "🚀 Starting Deployment..."

# Check if logged in (this checks if access token exists)
if ! npx supabase projects list > /dev/null 2>&1; then
    echo "⚠️  You need to login first."
    npx supabase login
fi

echo "🔗 Linking to Supabase Project..."
# Force link to ensure we are targeting the right project
# Using the project ID from your setup: tytayccjnnwixunjazta
echo "🔗 Linking to Supabase Project..."
# Force link to ensure we are targeting the right project
npx supabase link --project-ref tytayccjnnwixunjazta --password "ignored-if-logged-in" || echo "⚠️ Link checking..."

echo "📤 Deploying Function 'send-email'..."
# Deploy with --debug to see more info
if npx supabase functions deploy send-email --no-verify-jwt; then
    echo "✅ function deployed successfully."
else
    echo "❌ Deployment Failed. Checking Docker..."
    # Check if docker is issue (common on Mac)
    if ! docker info > /dev/null 2>&1; then
        echo "⛔️  CRITICAL ERROR: Docker is NOT running!"
        echo "    Supabase requires Docker to deploy functions."
        echo "    👉 Please start Docker Desktop and try again."
        exit 1
    fi
    exit 1
fi

echo "📋 Verifying Deployment Status..."
npx supabase functions list

echo "✅ Done! If you see 'send-email' in the list above with status 'active', it worked."
echo "👉 Note: It may take up to a minute for the 404/CORS error to disappear."
