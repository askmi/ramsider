#!/bin/bash

# Ramsider Vercel Deployment Script
# This script will help you deploy your Ramsider app to Vercel

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║     RAMSIDER - DEPLOY TO VERCEL                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo "Installing Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI installed!"
    echo ""
fi

# Check login status
echo "Checking Vercel login status..."
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel."
    echo ""
    echo "Opening login in your browser..."
    echo "Please sign in with GitHub (recommended)"
    echo ""
    vercel login
    echo ""
    echo "✅ Logged in successfully!"
else
    VERCEL_USER=$(vercel whoami)
    echo "✅ Already logged in as: $VERCEL_USER"
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "  PRODUCTION BUILD VERIFICATION"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Running production build check first..."
echo ""

# Set production environment
export NODE_ENV=production

# Clean and build
echo "Cleaning previous build..."
rm -rf .next

echo "Building production bundle..."
if npm run build; then
    echo ""
    echo "✅ Production build successful!"
    echo ""
else
    echo ""
    echo "❌ Production build failed!"
    echo ""
    echo "Please fix the errors and try again."
    exit 1
fi

echo "════════════════════════════════════════════════════════"
echo "  DEPLOYING YOUR APP"
echo "════════════════════════════════════════════════════════"
echo ""
echo "This will:"
echo "  1. Upload your optimized code to Vercel"
echo "  2. Use the production build"
echo "  3. Deploy to production URL"
echo ""
echo "Estimated time: 1-2 minutes"
echo ""
read -p "Ready to deploy? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Starting deployment..."
    echo ""

    # Deploy to Vercel in production mode
    vercel --prod

    echo ""
    echo "════════════════════════════════════════════════════════"
    echo "  ✅ DEPLOYMENT COMPLETE!"
    echo "════════════════════════════════════════════════════════"
    echo ""
    echo "Your site is now LIVE! 🎉"
    echo ""
    echo "What to do next:"
    echo "  1. Visit your site URL (shown above)"
    echo "  2. Test all 11 languages"
    echo "  3. Share your link!"
    echo ""
    echo "Useful commands:"
    echo "  vercel          - Deploy preview"
    echo "  vercel --prod   - Deploy to production"
    echo "  vercel ls       - List deployments"
    echo "  vercel open     - Open project in browser"
    echo ""
else
    echo ""
    echo "Deployment cancelled."
    echo ""
    echo "When you're ready, run: ./deploy.sh"
    echo ""
fi
