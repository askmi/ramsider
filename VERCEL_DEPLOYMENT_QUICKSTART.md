# Deploy to Vercel (Recommended) - 2 Minute Guide

## Why Vercel?

✅ **FREE** for personal projects  
✅ **Zero configuration** - works out of the box  
✅ **Full Next.js support** (they created Next.js!)  
✅ **All features work** - i18n, middleware, image optimization  
✅ **Automatic deployments** on every push  
✅ **Global CDN** - fast worldwide  
✅ **Custom domains** supported (optional)  

## Step 1: Push Your Code to GitHub

If you haven't already:

\`\`\`bash
git add .
git commit -m "Prepare for deployment"
git push origin main
\`\`\`

## Step 2: Deploy to Vercel

### Option A: Via Website (Easiest)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your repositories
4. Click **"Import"** next to your `ramsider` repository
5. Click **"Deploy"** (keep all default settings)

That's it! ⚡

Your site will be live at: `https://ramsider.vercel.app` (or similar)

### Option B: Via CLI

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
\`\`\`

## Step 3: Configure (Optional)

Vercel auto-detects Next.js and uses the right settings. No configuration needed!

But if you want custom settings, create `vercel.json`:

\`\`\`json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
\`\`\`

## What Happens After Deployment?

- ✅ Site goes live immediately
- ✅ HTTPS enabled automatically
- ✅ All 11 languages work
- ✅ Image optimization works
- ✅ Middleware works (language detection)
- ✅ Every push deploys automatically

## Your URLs

**Production:** `https://[your-project].vercel.app`  
**Preview:** Every PR gets its own preview URL  

## Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Domains**
3. Add your custom domain (like `ramsider.com`)
4. Follow DNS instructions
5. Done!

## Environment Variables (If Needed)

If you need to add environment variables:

1. Go to **Settings** → **Environment Variables**
2. Add your variables
3. Redeploy

## Monitoring & Analytics

Vercel provides:
- Build logs
- Runtime logs
- Performance analytics (free tier)
- Traffic stats

## Cost

**Free Forever** tier includes:
- Unlimited deployments
- 100GB bandwidth/month
- 6,000 build minutes/month
- Automatic HTTPS
- Global CDN

More than enough for most projects!

## Troubleshooting

If build fails:
1. Check the build logs in Vercel Dashboard
2. Make sure `npm run build` works locally
3. Check that all dependencies are in `package.json`

## Automatic Deployments

Once connected:
- Push to `main` branch → auto-deploys to production
- Push to other branches → creates preview deployments
- Pull requests → get unique preview URLs

## Comparison: GitHub Pages vs Vercel

| Feature | GitHub Pages | Vercel |
|---------|--------------|---------|
| Cost | Free | Free |
| Setup Time | 1-2 hours | 2 minutes |
| Next.js Support | Partial (static only) | Full |
| Middleware | ❌ No | ✅ Yes |
| i18n Routes | ❌ Needs refactoring | ✅ Works |
| Image Optimization | ❌ No | ✅ Yes |
| API Routes | ❌ No | ✅ Yes |
| Custom Domains | ✅ Yes | ✅ Yes |
| HTTPS | ✅ Yes | ✅ Yes |
| Build Time | ~3-5 min | ~1-2 min |
| Auto Deploy | ✅ Yes (with Actions) | ✅ Yes |

## Next Steps

After deploying:

1. **Test all languages** - click through each locale
2. **Test on mobile** - check responsive design
3. **Share your URL** - send to friends/clients
4. **Set up custom domain** (optional)
5. **Monitor analytics** in Vercel dashboard

## Your Deployment URL

After deploying, your site will be at:

\`\`\`
https://ramsider.vercel.app
\`\`\`

Or whatever name Vercel generates. You can change it in Settings.

## Questions?

- **Deployment failed?** Check build logs in Vercel
- **Want custom domain?** Add it in Settings → Domains
- **Need help?** Vercel has great docs at [vercel.com/docs](https://vercel.com/docs)

---

## Ready to Deploy?

1. Visit [vercel.com/new](https://vercel.com/new)
2. Connect GitHub
3. Import your repository
4. Click Deploy
5. Done! 🚀

Your site will be live in ~60 seconds.
