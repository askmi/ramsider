#!/bin/bash

# Fix Vercel Deployment Issues
# This script prepares your project for successful Vercel deployment

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║     FIX VERCEL DEPLOYMENT                              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "Running Vercel deployment fixes..."
echo ""

# Step 1: Check required files
echo "1. Checking required files..."

if [ -f "package.json" ]; then
    success "package.json exists"
else
    error "package.json missing!"
    exit 1
fi

if [ -f "package-lock.json" ]; then
    success "package-lock.json exists"
else
    warning "package-lock.json missing - will regenerate"
    rm -rf node_modules
    npm install
    success "Generated package-lock.json"
fi

if [ -f "next.config.ts" ]; then
    success "next.config.ts exists"
else
    error "next.config.ts missing!"
    exit 1
fi

echo ""

# Step 2: Verify dependencies
echo "2. Verifying dependencies..."

if grep -q '"next":' package.json; then
    success "next is in dependencies"
else
    error "next is missing from dependencies!"
    exit 1
fi

if grep -q '"react":' package.json; then
    success "react is in dependencies"
else
    error "react is missing from dependencies!"
    exit 1
fi

echo ""

# Step 3: Clean install
echo "3. Running clean install..."

rm -rf node_modules .next
success "Cleaned old builds"

npm install
success "Dependencies installed"

echo ""

# Step 4: Test build
echo "4. Testing production build..."

if npm run build; then
    success "Build successful!"
else
    error "Build failed!"
    echo ""
    echo "Please fix the build errors before deploying to Vercel."
    exit 1
fi

echo ""

# Step 5: Git status
echo "5. Checking Git status..."

if git rev-parse --git-dir > /dev/null 2>&1; then
    success "Git repository found"

    # Check if there are uncommitted changes
    if [[ -n $(git status -s) ]]; then
        warning "You have uncommitted changes"
        echo ""
        echo "Files to commit:"
        git status -s
        echo ""
        read -p "Commit and push now? (y/n) " -n 1 -r
        echo ""

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            git commit -m "Fix: Prepare for Vercel deployment"
            git push origin main || git push origin master
            success "Changes committed and pushed!"
        else
            warning "Remember to commit and push before deploying!"
        fi
    else
        success "No uncommitted changes"
    fi
else
    warning "Not a git repository"
fi

echo ""

# Step 6: Summary
echo "╔════════════════════════════════════════════════════════╗"
echo "║     READY FOR VERCEL DEPLOYMENT                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

success "All checks passed!"
echo ""
echo "Next steps:"
echo "  1. Make sure your code is pushed to GitHub"
echo "  2. Go to: https://vercel.com/dashboard"
echo "  3. Click on your project"
echo "  4. Click 'Redeploy' or deploy via CLI:"
echo ""
echo "     vercel --prod --force"
echo ""
echo "Or create a new deployment:"
echo "     vercel --prod"
echo ""

echo "═══════════════════════════════════════════════════════════"
