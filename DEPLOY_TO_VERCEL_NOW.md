# Deploy Ramsider to Vercel - Step by Step

## ✅ Prerequisites Complete

- ✅ Vercel CLI installed
- ✅ Project ready for deployment
- ✅ Next.js configuration is correct

---

## Method 1: Deploy via CLI (Recommended)

### Step 1: Login to Vercel

Open your terminal and run:

\`\`\`bash
vercel login
\`\`\`

This will:
1. Open your browser
2. Ask you to sign in (use GitHub, GitLab, or email)
3. Confirm authentication
4. Return to terminal

### Step 2: Deploy

From your project directory, run:

\`\`\`bash
vercel
\`\`\`

The CLI will ask you:

**Q: "Set up and deploy?"**  
→ Answer: `Y` (yes)

**Q: "Which scope?"**  
→ Select your account (use arrow keys, press Enter)

**Q: "Link to existing project?"**  
→ Answer: `N` (no - this is a new project)

**Q: "What's your project's name?"**  
→ Answer: `ramsider` (or press Enter to accept default)

**Q: "In which directory is your code located?"**  
→ Answer: `./` (press Enter)

**Q: "Want to override the settings?"**  
→ Answer: `N` (no - Vercel auto-detects Next.js)

### Step 3: Wait for Deployment

Vercel will:
1. ✅ Upload your code
2. ✅ Install dependencies
3. ✅ Build your Next.js app
4. ✅ Deploy to production
5. ✅ Give you a live URL

**Time:** ~1-2 minutes

### Step 4: Get Your Live URL

After deployment completes, you'll see:

\`\`\`
✅ Deployed to production. Run `vercel --prod` to overwrite later.
🔍 Inspect: https://vercel.com/...
✅ Production: https://ramsider-xxx.vercel.app
\`\`\`

**Your site is LIVE!** 🎉

### Step 5: Deploy Updates (Future)

When you make changes:

\`\`\`bash
git add .
git commit -m "Update site"
git push

# Then deploy to production
vercel --prod
\`\`\`

---

## Method 2: Deploy via Vercel Website

### Step 1: Push to GitHub

Make sure your code is on GitHub:

\`\`\`bash
git add .
git commit -m "Ready for deployment"
git push origin main
\`\`\`

### Step 2: Import to Vercel

1. Go to: [vercel.com/new](https://vercel.com/new)
2. Click **"Continue with GitHub"**
3. Authorize Vercel (if first time)
4. Find and click **"Import"** next to your `ramsider` repository

### Step 3: Configure (Optional)

Vercel auto-detects everything! Just verify:
- ✅ Framework Preset: **Next.js**
- ✅ Build Command: `next build`
- ✅ Output Directory: `.next`
- ✅ Install Command: `npm install`

All these are automatically set!

### Step 4: Deploy

Click **"Deploy"** button.

Vercel will:
1. Clone your repository
2. Install dependencies
3. Build your app
4. Deploy to production

**Time:** ~1-2 minutes

### Step 5: Access Your Site

After deployment:
- You'll see a **"Visit"** button
- Your URL: `https://ramsider-xxx.vercel.app`
- **Automatic deployments** enabled - every push to `main` auto-deploys!

---

## What Gets Deployed?

✅ **Your entire Ramsider site:**
- All 11 languages (en, ru, de, fr, es, it, tr, ar, zh, ja, ko)
- Hero section with UNO product
- Business section
- Stats section  
- Products section (Light, Pro, Gold)
- Features section
- How It Works section
- Testimonial section (LOVED BY EXPERTS)
- Shipping section (SHIPS WORLDWIDE with world map)
- Footer with language selector

✅ **All features work:**
- Language switching
- Image optimization
- Responsive design
- ScrollReveal animations
- Fast loading

---

## After Deployment

### Test Your Site

Visit each language:
- `https://your-site.vercel.app/en` - English
- `https://your-site.vercel.app/ru` - Russian
- `https://your-site.vercel.app/de` - German
- `https://your-site.vercel.app/fr` - French
- `https://your-site.vercel.app/es` - Spanish
- `https://your-site.vercel.app/it` - Italian
- `https://your-site.vercel.app/tr` - Turkish
- `https://your-site.vercel.app/ar` - Arabic
- `https://your-site.vercel.app/zh` - Chinese
- `https://your-site.vercel.app/ja` - Japanese
- `https://your-site.vercel.app/ko` - Korean

### Configure Custom Domain (Optional)

1. Go to your project in [vercel.com](https://vercel.com)
2. Click **Settings** → **Domains**
3. Add your domain (e.g., `ramsider.com`)
4. Update DNS records at your domain provider
5. Wait for DNS propagation (~24 hours max)

### Set Up Automatic Deployments

If you used the website method:
- ✅ Already set up!
- Every push to `main` → auto-deploys
- Every PR → gets preview URL

If you used CLI:
- Connect GitHub in Vercel dashboard
- Enable automatic deployments

---

## Vercel Dashboard Features

Access at: [vercel.com/dashboard](https://vercel.com/dashboard)

**Available features:**
- 📊 Deployment history
- 🔍 Build logs
- 📈 Analytics (page views, performance)
- ⚙️ Settings (domains, environment variables)
- 🔄 Rollback to previous deployments
- 👥 Team management (Pro plan)

---

## Troubleshooting

### Build Failed?

Check the build logs in Vercel dashboard:
1. Go to your project
2. Click on the failed deployment
3. Read the error message
4. Common fixes:
   - Missing dependencies → Add to `package.json`
   - Build errors → Run `npm run build` locally first
   - TypeScript errors → Fix and redeploy

### Site Not Loading?

1. Check deployment status (should be "Ready")
2. Wait 30 seconds after deployment
3. Clear browser cache
4. Try incognito/private mode

### Images Not Showing?

- Check that images are in `/public/images/`
- Verify paths are correct
- Redeploy if needed

---

## Commands Reference

\`\`\`bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# Open project in browser
vercel open

# View logs
vercel logs

# Remove deployment
vercel rm [deployment-url]
\`\`\`

---

## Cost & Limits

**Your FREE plan includes:**
- ✅ 100GB bandwidth/month
- ✅ 6,000 build minutes/month
- ✅ Unlimited deployments
- ✅ Custom domains
- ✅ HTTPS
- ✅ Global CDN

**You're charged only if:**
- You exceed 100GB bandwidth
- You upgrade to Pro ($20/month)

Vercel will warn you before any charges!

---

## Next Steps

After deploying:

1. ✅ **Test your site** - check all languages
2. ✅ **Share your URL** - send to friends/clients
3. ✅ **Monitor analytics** - see your traffic
4. ✅ **Add custom domain** (optional)
5. ✅ **Keep developing** - push updates anytime

---

## Ready to Deploy?

Choose your method:

### Option A: CLI (Quick)
\`\`\`bash
vercel login
vercel
\`\`\`

### Option B: Website (Visual)
Go to: [vercel.com/new](https://vercel.com/new)

---

## Your Deployment Checklist

- [ ] Vercel CLI installed ✅ (already done)
- [ ] Code pushed to GitHub
- [ ] Run `vercel login`
- [ ] Run `vercel` or use website
- [ ] Wait for deployment
- [ ] Test live site
- [ ] Share URL!

🚀 **Your site will be live in ~2 minutes!**
