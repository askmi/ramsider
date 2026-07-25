# 🚀 Ramsider UNO - Deployment Guide

## Prerequisites
- [ ] Vercel account (sign up at vercel.com)
- [ ] Domain name (optional, can use vercel.app subdomain)
- [ ] Product images ready to upload
- [ ] All translations reviewed and approved

## Step 1: Prepare for Deployment

### 1.1 Replace Placeholder Images
```bash
# Upload your real product images to public/images/products/
# See public/images/IMAGES_README.md for specifications

# Verify all images exist
ls -lh public/images/products/
```

### 1.2 Final Build Test
```bash
# Clean build
rm -rf .next
npm run build

# Check for errors
npm run lint
npm run type-check

# Test production build locally
npm start
```

### 1.3 Update Configuration
```bash
# Create .env.production
cat > .env.production << 'ENVEOF'
NEXT_PUBLIC_SITE_URL=https://ramsider.com
ENVEOF
```

## Step 2: Deploy to Vercel (Recommended)

### Option A: GitHub Integration (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit: Ramsider UNO commerce page"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ramsider.git
git push -u origin main
```

2. **Connect to Vercel**
- Go to vercel.com/new
- Import your GitHub repository
- Vercel auto-detects Next.js configuration
- Click "Deploy"

3. **Configure Environment Variables** (in Vercel Dashboard)
- Add `NEXT_PUBLIC_SITE_URL`
- Save and redeploy

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Step 3: Custom Domain Setup

### 3.1 Add Domain in Vercel
```bash
vercel domains add ramsider.com
vercel domains add www.ramsider.com
```

### 3.2 Configure DNS
Add these records at your domain registrar:

**For apex domain (ramsider.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3.3 Verify SSL
Vercel automatically provisions SSL certificates. Wait 5-10 minutes after DNS propagation.

## Step 4: Post-Deployment Verification

### 4.1 Test All Languages
```bash
# Test each locale URL
curl -I https://ramsider.com/en
curl -I https://ramsider.com/ru
curl -I https://ramsider.com/de
curl -I https://ramsider.com/fr
curl -I https://ramsider.com/es
curl -I https://ramsider.com/it
curl -I https://ramsider.com/tr
curl -I https://ramsider.com/ar
curl -I https://ramsider.com/zh
curl -I https://ramsider.com/ja
curl -I https://ramsider.com/ko
```

### 4.2 Run Lighthouse Audits
```bash
# Install Lighthouse CLI
npm install -g @lhci/cli

# Run audit
lhci autorun --collect.url=https://ramsider.com/en
```

Target scores:
- Performance: 95+ (mobile), 98+ (desktop)
- Accessibility: 100
- Best Practices: 100
- SEO: 100

### 4.3 Test on Real Devices
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (Safari)
- [ ] Desktop (Chrome, Firefox, Safari)

### 4.4 Verify RTL Layout
Visit https://ramsider.com/ar and verify:
- [ ] Text flows right-to-left
- [ ] Layout is mirrored correctly
- [ ] Images are positioned properly
- [ ] Language selector works

## Step 5: Analytics Setup

### 5.1 Vercel Analytics (Recommended)
```bash
npm install @vercel/analytics @vercel/speed-insights
```

Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### 5.2 Google Analytics (Optional)
```bash
npm install @next/third-parties
```

Add to layout and configure with your GA4 ID.

## Step 6: Monitoring & Error Tracking

### 6.1 Sentry Integration
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 6.2 Configure Alerts
Set up alerts for:
- 5xx errors
- High response times (>3s)
- Core Web Vitals issues
- High error rates

## Step 7: SEO Optimization

### 7.1 Submit Sitemaps
```bash
# Generate sitemap (add to next.config.ts)
# Or use next-sitemap package

# Submit to search engines
# - Google Search Console
# - Bing Webmaster Tools
```

### 7.2 Add robots.txt
```bash
cat > public/robots.txt << 'ROBOTS'
User-agent: *
Allow: /

Sitemap: https://ramsider.com/sitemap.xml
ROBOTS
```

### 7.3 Configure Open Graph Images
Add OG images for social sharing:
```bash
# Create OG images (1200x630px)
public/
  og-image.jpg
  og-image-en.jpg
  og-image-ru.jpg
  ...
```

## Step 8: Continuous Integration

### 8.1 GitHub Actions (Optional)
Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run build
```

### 8.2 Automatic Deployments
Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

## Step 9: Performance Monitoring

### 9.1 Set Performance Budgets
Configure in Vercel:
- First Load JS: <200kb
- LCP: <2.5s
- CLS: <0.1

### 9.2 Monitor Core Web Vitals
Check Vercel Analytics dashboard daily for:
- Real user metrics
- Geographic performance
- Device-specific issues

## Step 10: Marketing Launch

### 10.1 Pre-Launch Checklist
- [ ] All product images uploaded
- [ ] All translations reviewed
- [ ] All links functional
- [ ] Forms working (if any)
- [ ] Analytics tracking
- [ ] Social media cards
- [ ] Mobile tested
- [ ] Desktop tested
- [ ] RTL tested
- [ ] Accessibility verified

### 10.2 Launch Checklist
- [ ] Remove "Coming Soon" if applicable
- [ ] Enable all CTAs
- [ ] Announce on social media
- [ ] Email marketing campaign
- [ ] Press release
- [ ] Influencer outreach

## Troubleshooting

### Build Fails
```bash
# Clear caches
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Images Not Loading
- Verify image paths are correct
- Check file extensions match imports
- Ensure images are in `public/` directory

### Translations Missing
- Verify all locale files exist in `public/locales/`
- Check JSON syntax with `npm run build`
- Ensure locale codes match config

### Slow Performance
- Run Lighthouse audit
- Check image sizes (optimize with WebP)
- Enable Vercel Edge Network
- Review bundle size in build output

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **next-intl Docs**: https://next-intl-docs.vercel.app
- **Tailwind Docs**: https://tailwindcss.com/docs

---

**Ready to launch!** 🚀
