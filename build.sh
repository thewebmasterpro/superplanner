#!/bin/bash
# Build script for Hostinger deployment
# This script installs dependencies and builds the Vite frontend

set -e  # Exit on error

echo "📦 Installing root dependencies..."
npm install

echo "📦 Installing client dependencies..."
cd client
npm install

echo "🔨 Building Vite frontend..."
npm run build

echo "📦 Installing server dependencies..."
cd ../server
npm install

cd ..
echo "✅ Build complete! Output in server/public/"
