# Deploy Ramsider to GitHub Pages

## Important Note about Next.js and GitHub Pages

GitHub Pages only serves **static HTML files**. Next.js is a full-stack framework that includes:
- Server-side rendering (SSR)
- API routes
- Middleware
- Dynamic routing with internationalization

For GitHub Pages, you need to **export Next.js as a static site**. However, there are some **limitations** to be aware of.

## Option 1: Static Export (Recommended for GitHub Pages)

### Step 1: Update next.config.ts

Add static export configuration:

\`\`\`typescript
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts')

const nextConfig: NextConfig = {
  output: 'export',  // Enable static export
  basePath: '/ramsider',  // Replace 'ramsider' with your repo name
  images: {
    unoptimized: true,  // Required for static export
  },
  trailingSlash: true,  // Recommended for GitHub Pages
}

export default withNextIntl(nextConfig)
\`\`\`

**Important:** Replace `/ramsider` with your actual GitHub repository name!

### Step 2: Update package.json

Add a build script for static export:

\`\`\`json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "export": "next build",
    "start": "next start",
    "deploy": "npm run export && touch out/.nojekyll"
  }
}
\`\`\`

### Step 3: Fix Internationalization Routes

GitHub Pages doesn't support Next.js middleware, so you need to pre-generate all locale pages. Update your app structure to generate static pages for each locale.

Create a script to handle this:

\`\`\`bash
npm run export
\`\`\`

This will create an \`out/\` directory with your static site.

### Step 4: Create GitHub Actions Workflow

Create \`.github/workflows/deploy.yml\`:

\`\`\`yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]  # or 'master' depending on your default branch
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run export

      - name: Add .nojekyll
        run: touch out/.nojekyll

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
\`\`\`

### Step 5: Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save

### Step 6: Push and Deploy

\`\`\`bash
git add .
git commit -m "Configure for GitHub Pages deployment"
git push origin main
\`\`\`

Your site will be available at: \`https://[username].github.io/[repo-name]/\`

---

## Option 2: Alternative Hosting (Better for Next.js)

GitHub Pages has limitations. For a better Next.js experience, consider these alternatives:

### **Vercel (Recommended)** ✅
- **FREE** for personal projects
- **Zero configuration** - just connect your GitHub repo
- Full Next.js support (SSR, API routes, middleware, i18n)
- Automatic deployments on push
- Built by the creators of Next.js

**Deploy to Vercel:**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Import Project"
4. Select your repository
5. Click "Deploy"

Done! Your site will be live at \`https://[project-name].vercel.app\`

### **Netlify** ✅
- FREE tier available
- Good Next.js support
- Similar to Vercel

### **Cloudflare Pages** ✅
- FREE
- Fast CDN
- Good Next.js support

---

## Limitations of GitHub Pages

⚠️ **What won't work:**
- Next.js middleware (language detection, redirects)
- API routes
- Server-side rendering (SSR)
- Dynamic routes with parameters
- Image optimization
- Incremental Static Regeneration (ISR)

✅ **What will work:**
- Static pages
- Client-side navigation
- React components
- CSS/styling
- Pre-rendered content
- Images (unoptimized)

---

## Fixing the Internationalization Issue

Your current setup uses middleware for language detection. For GitHub Pages, you need to:

1. **Pre-generate all locale pages**
2. **Use client-side language detection**
3. **Create explicit routes** for each language

This requires significant refactoring of your routing structure.

---

## Recommended Approach

**For a production site with this level of complexity, I strongly recommend Vercel instead of GitHub Pages.**

**Why Vercel?**
- ✅ FREE for personal/hobby projects
- ✅ Takes 2 minutes to set up
- ✅ Zero configuration needed
- ✅ All Next.js features work
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Perfect for this project

**To deploy to Vercel now:**
1. Push your code to GitHub
2. Go to https://vercel.com
3. Sign in with GitHub
4. Click "Import Project"
5. Select your repository
6. Click "Deploy"

That's it! Your site will be live in ~60 seconds.

---

## Need Help Choosing?

- **Just want to demo quickly?** → Use Vercel (2 minutes)
- **Must use GitHub Pages?** → I can help refactor for static export (1-2 hours of work)
- **Want it to "just work"?** → Use Vercel

Let me know which path you want to take!
