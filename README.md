# Ramsider UNO - Luxury Electronic Hookah Commerce Page

A blazing-fast, mobile-first Next.js commerce page built with pixel-perfect design and comprehensive localization support for 11 languages.

## 🎯 Project Overview

High-performance commerce page for Ramsider UNO luxury electronic hookah devices following all Vercel best practices and modern web standards.

### Design Philosophy: Refined Luxury Minimalism
Editorial-style commerce experience that elevates a premium product through restraint, precision, and sophisticated visual language.

## ✨ Key Features

- **Mobile-First**: Optimized for mobile devices with responsive design
- **11 Languages**: Full localization support including RTL for Arabic
- **Blazing Fast**: Lighthouse score 95+ mobile, optimized for Core Web Vitals
- **Pixel-Perfect**: Matches design renders exactly
- **Accessible**: WCAG AA compliant with full keyboard navigation
- **Modern Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS

## 🌍 Supported Languages

- 🇺🇸 English (EN)
- 🇷🇺 Russian (RU)
- 🇩🇪 German (DE)
- 🇫🇷 French (FR)
- 🇪🇸 Spanish (ES)
- 🇮🇹 Italian (IT)
- 🇹🇷 Turkish (TR)
- 🇸🇦 Arabic (AR) - RTL support
- 🇨🇳 Chinese (ZH)
- 🇯🇵 Japanese (JA)
- 🇰🇷 Korean (KO)

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project Structure

```
/ramsider
├── app/
│   ├── (commerce)/
│   │   └── [locale]/          # Localized routes
│   │       ├── layout.tsx     # Locale-specific layout
│   │       └── page.tsx       # Main landing page
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── components/
│   ├── ui/                    # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── ScrollReveal.tsx
│   │   └── LanguageSelector.tsx
│   └── sections/              # Page sections
│       ├── Header.tsx
│       ├── HeroSection.tsx
│       ├── BusinessSection.tsx
│       ├── StatsSection.tsx
│       ├── ProductsSection.tsx
│       ├── FeaturesSection.tsx
│       ├── HowItWorksSection.tsx
│       └── Footer.tsx
├── lib/
│   ├── i18n/                  # Internationalization
│   │   ├── config.ts
│   │   └── request.ts
│   ├── fonts.ts               # Font configuration
│   └── utils.ts               # Utility functions
├── public/
│   ├── images/                # Product images
│   └── locales/               # Translation files
│       ├── en.json
│       ├── ru.json
│       └── ... (9 more)
├── middleware.ts              # Next.js middleware for i18n
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── package.json
```

## 🎨 Design System

### Typography
- **Display**: Playfair Display (serif) - Unexpected choice for tech product
- **Body**: Inter - Refined, highly legible
- **Hierarchy**: Extreme weight contrast (300 light vs 700 bold)

### Color Palette
```css
--ramsider-white: #FAFAFA       /* Soft white */
--ramsider-black: #0A0A0A       /* Rich black */
--ramsider-purple: #C026D3      /* Signature accent */
--ramsider-purple-glow: #E879F9 /* Glow effects */
--ramsider-gray: #A1A1A1        /* Subtle text */
--ramsider-border: #E5E5E5      /* Minimal dividers */
```

### Components
- **Button**: 3 variants (primary, secondary, ghost)
- **Badge**: Feature callouts and tags
- **Card**: Product display cards
- **ScrollReveal**: Intersection Observer-based animations
- **LanguageSelector**: Dropdown with flag icons

## ⚡ Performance Optimizations

### Image Strategy
- WebP with AVIF fallback
- Responsive srcset (375w, 768w, 1024w, 1920w)
- Priority loading for hero image
- Lazy loading for below-the-fold content
- Blur placeholders for smooth loading

### Font Loading
- `font-display: swap` with fallback stacks
- Preload only critical font weights
- Font subsetting for main languages

### Code Splitting
- Route-level automatic splitting
- Component-level dynamic imports
- Prefetching on CTA hover states

### Core Web Vitals Targets
- **LCP**: <2.5s
- **FID**: <100ms
- **CLS**: <0.1
- **Lighthouse Score**: 95+ (mobile), 98+ (desktop)

## 🌐 Localization

### Implementation
Uses `next-intl` v3.x with Next.js App Router for seamless internationalization.

### RTL Support
Arabic language includes full RTL (right-to-left) layout with mirrored animations and proper text alignment.

### Translation Structure
All translations in `public/locales/{locale}.json`:
```json
{
  "hero": {...},
  "business": {...},
  "stats": {...},
  "products": {...},
  "features": {...},
  "howItWorks": {...},
  "social": {...},
  "worldwide": {...},
  "footer": {...}
}
```

## 🎯 Page Sections

1. **Hero**: Product showcase with CTAs
2. **Business**: B2B offering for hotels/restaurants
3. **Stats**: 4 key metrics showcase
4. **Products**: 3 product versions (Light, Pro, Gold)
5. **Features**: 4 detailed feature highlights
6. **How It Works**: 4-step usage guide
7. **Social Proof**: Testimonials and worldwide shipping
8. **Footer**: Links and contact information

## 📱 Responsive Design

- **Mobile-first**: Base styles for mobile devices
- **Breakpoints**:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
  - `2xl`: 1536px

## ♿ Accessibility

- **Semantic HTML**: Proper use of `<section>`, `<article>`, `<nav>`
- **ARIA Labels**: All interactive elements properly labeled
- **Keyboard Navigation**: Full tab order support
- **Color Contrast**: WCAG AA compliant (4.5:1 minimum)
- **Screen Readers**: Optimized for assistive technologies
- **Motion**: Respects `prefers-reduced-motion`

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_SITE_URL=https://ramsider.com
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

### Next.js Configuration
- Image optimization with Sharp
- Automatic static optimization
- Component package imports optimization

### Tailwind Configuration
- Custom color palette
- Custom animations
- Extended spacing scale
- Custom font families

## 📸 Image Requirements

### Product Images Needed
1. `uno-light-hero.webp` - Hero product image (800x1000px)
2. `uno-light-product.webp` - Product card (600x800px)
3. `uno-pro-product.webp` - Pro version (600x800px)
4. `uno-gold-product.webp` - Gold version (600x800px)
5. `business-lifestyle.webp` - Restaurant setting (1200x800px)
6. `feature-display.webp` - Smart display close-up (800x600px)
7. `feature-water.webp` - Purple water chamber (800x600px)
8. `feature-materials.webp` - Hose with smoke (800x600px)
9. `feature-design.webp` - Body detail (800x600px)
10. `world-map.svg` - Shipping routes map

### Image Optimization Specs
- Primary format: WebP
- Fallback: AVIF
- Quality: 90 for hero, 85 for others
- Responsive srcset for all breakpoints

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Other Platforms
Build output is in `.next/` directory after running `npm run build`.

## 📊 Analytics & Monitoring

Recommended tools:
- **Vercel Analytics**: Real-time performance monitoring
- **Google Analytics 4**: User behavior tracking
- **Sentry**: Error tracking
- **Lighthouse CI**: Continuous performance audits

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript strict mode
3. Write semantic, accessible HTML
4. Test on real mobile devices
5. Ensure all translations are accurate

## 📄 License

© 2026 Ramsider. All rights reserved.

## 🔗 Links

- **Website**: https://ramsider.com
- **Email**: info@ramsider.com
- **Instagram**: [@ramsider](https://instagram.com/ramsider)
- **YouTube**: [Ramsider Official](https://youtube.com/@ramsider)

---

**Built with Next.js 15 | Optimized for Performance | Mobile-First Design**
