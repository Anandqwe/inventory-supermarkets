# PowerShell Deployment Script for Railway + Vercel
# This script helps automate the deployment process

Write-Host "🚀 Supermarket Inventory System - Deployment Script" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "❌ Git repository not initialized!" -ForegroundColor Red
    Write-Host "Run: git init" -ForegroundColor Yellow
    exit 1
}

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  You have uncommitted changes!" -ForegroundColor Yellow
    Write-Host ""
    $commit = Read-Host "Do you want to commit all changes? (y/n)"
    if ($commit -eq "y" -or $commit -eq "Y") {
        git add .
        $commitMsg = Read-Host "Enter commit message"
        git commit -m $commitMsg
    }
}

# Push to GitHub
Write-Host ""
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to GitHub" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚂 Railway will automatically deploy your backend" -ForegroundColor Cyan
    Write-Host "   Check: https://railway.app" -ForegroundColor White
    Write-Host ""
    Write-Host "▲ To deploy frontend to Vercel, run:" -ForegroundColor Cyan
    Write-Host "   cd frontend" -ForegroundColor White
    Write-Host "   vercel --prod" -ForegroundColor White
} else {
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Deployment initiated!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check Railway dashboard for backend deployment status" -ForegroundColor White
Write-Host "2. Deploy frontend: cd frontend && vercel --prod" -ForegroundColor White
Write-Host "3. Update FRONTEND_URL in Railway after Vercel deployment" -ForegroundColor White
Write-Host "4. Test your application!" -ForegroundColor White
