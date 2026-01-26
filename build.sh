#!/bin/bash
# Build script for Hostinger deployment
# This script installs dependencies and builds the Vite frontend

set -e  # Exit on error

echo "📦 Installing all dependencies..."
npm install

echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

echo "🔨 Building Vite frontend..."
npm run build

echo "✅ Build complete! Output in server/public/"
