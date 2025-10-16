#!/bin/bash

# Deployment Script for Railway + Vercel
# This script helps automate the deployment process

echo "🚀 Supermarket Inventory System - Deployment Script"
echo "===================================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git repository not initialized!"
    echo "Run: git init"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "⚠️  You have uncommitted changes!"
    echo ""
    read -p "Do you want to commit all changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
    fi
fi

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub"
    echo ""
    echo "🚂 Railway will automatically deploy your backend"
    echo "   Check: https://railway.app"
    echo ""
    echo "▲ To deploy frontend to Vercel, run:"
    echo "   cd frontend && vercel --prod"
else
    echo "❌ Failed to push to GitHub"
    exit 1
fi

echo ""
echo "🎉 Deployment initiated!"
echo ""
echo "Next steps:"
echo "1. Check Railway dashboard for backend deployment status"
echo "2. Deploy frontend: cd frontend && vercel --prod"
echo "3. Update FRONTEND_URL in Railway after Vercel deployment"
echo "4. Test your application!"
