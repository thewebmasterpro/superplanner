#!/bin/bash
echo "📦 Préparation du commit..."
echo ""

# Vérifier le statut
git status

echo ""
echo "📋 Fichiers à commiter:"
echo "  ✅ Nouveaux composants Supabase"
echo "  ✅ Nouvelle documentation"
echo "  ✅ .gitignore mis à jour"
echo "  ✅ README mis à jour"
echo "  🗑️  Anciens fichiers MySQL supprimés"
echo ""
echo "Voulez-vous continuer ? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo "🚀 Commit en cours..."
    
    git add .
    git commit -m "feat: Migrate to Supabase and cleanup MySQL files

- ✅ Add Supabase authentication (Email + Google OAuth)
- ✅ Create new LoginSupabase and AppSupabase components
- ✅ Add Supabase schema (PostgreSQL with RLS)
- ✅ Remove all MySQL-related files and configs
- ✅ Remove old authentication system
- ✅ Update documentation (QUICK-START, ACTIVER-GOOGLE-OAUTH, etc.)
- ✅ Update README with Supabase stack
- ✅ Update .gitignore to protect .env files

Breaking changes:
- MySQL replaced by Supabase PostgreSQL
- Custom JWT auth replaced by Supabase Auth
- Express routes for auth removed (now handled by Supabase)

Migration time: ~10 minutes
Benefits: Auto-generated API, RLS, real-time, Google OAuth in 2 clicks"
    
    echo ""
    echo "✅ Commit créé !"
    echo ""
    echo "Pour pusher vers GitHub:"
    echo "  git push origin main"
else
    echo "❌ Commit annulé"
fi
