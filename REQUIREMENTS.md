# Ramsider UNO Commerce Page - Technical Requirements

## Project Overview
High-performance, mobile-first Next.js commerce page for Ramsider UNO luxury electronic hookah devices. Target: blazing-fast performance with pixel-perfect design matching provided renders.

## Design Philosophy: REFINED LUXURY MINIMALISM

### Core Aesthetic
Editorial-style commerce experience elevating premium product through restraint, precision, and sophisticated visual language. Luxury watch/automotive brand approach where every pixel serves a purpose.

### Memory Hook
The glowing purple water chamber - entire page architecturally organized around this striking visual element.

### Distinctive Choice
Serif display font for tech product (unexpected) + refined minimalism = repositions from "gadget" to "objet d'art"

## Typography Strategy

### Primary Fonts
- **Display**: Playfair Display (serif - unexpected for tech, memorable) OR Sporting Grotesque (ultra-refined sans)
- **Body**: Inter with optical sizing OR Apfel Grotezk (refined European feel)

### Hierarchy
- Hero headlines: 80-120px desktop, 48-64px mobile
- Section headers: 36-48px
- Body: 16-18px, line-height 1.6-1.8
- Weight contrast: 300 light vs 700 bold (no middle ground)

## Color Palette

```css
--ramsider-white: #FAFAFA       /* Soft white, not pure */
--ramsider-black: #0A0A0A       /* Rich black, not #000 */
--ramsider-purple: #C026D3      /* Vibrant magenta accent */
--ramsider-purple-glow: #E879F9 /* Glow effects */
--ramsider-gray: #A1A1A1        /* Subtle text */
--ramsider-border: #E5E5E5      /* Minimal dividers */
```

**Purple Usage**: Structural element tied to product's illuminated water chamber, not decorative gradient.

## Spatial Composition

- **Asymmetric balance**: Product right, copy left
- **Generous spacing**: 120-200px vertical between sections (desktop)
- **Grid-breaking moments**: Purple-lit product chamber breaks containment
- **Mobile-first flow**: Careful vertical rhythm

## Motion & Interaction

### Scroll-Triggered Reveals
- Hero text: Staggered word-by-word fade-up (100ms animation-delay increments)
- Product versions: Sequential slide-in from left
- Feature cards: Parallax images, text fade at 70% visible
- Stats counter: Animate numbers on viewport enter

### Micro-Interactions
- CTA buttons: Purple glow expands on hover (box-shadow transition)
- Language selector: Smooth dropdown, flag fade-in
- Product cards: Subtle lift + shadow intensifies on hover

### Performance Approach
CSS-first with Intersection Observer + CSS classes. No heavy animation libraries for core interactions.

## Backgrounds & Atmosphere

- **Primary**: Clean white with subtle noise texture (2% opacity)
- **CTA sections**: Deep black (#0A0A0A) with purple gradient mesh
- **Depth**: Layered shadows on product images (0 8px 32px rgba(0,0,0,0.12))
- **Purple glow**: CSS blur filter on pseudo-elements behind water chamber sections

## Performance Targets (Mobile-First)

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: <2.5s
- **FID (First Input Delay)**: <100ms
- **CLS (Cumulative Layout Shift)**: <0.1
- **Time to Interactive**: <3.5s on 4G
- **Lighthouse Score**: 95+ mobile, 98+ desktop

### Implementation Strategy

1. **Critical CSS**: Inline above-the-fold styles
2. **Image Optimization**:
   - WebP with AVIF fallback
   - Responsive srcset (375w, 768w, 1024w, 1920w)
   - Priority loading hero image only
   - Lazy load everything below fold
3. **Font Loading**:
   - `font-display: swap` with fallback stack
   - Preload only critical font weights
   - Subset fonts to Latin + Cyrillic for main languages
4. **Code Splitting**: Route-level + component-level dynamic imports
5. **Prefetching**: Intelligent prefetch on CTA hover states

### Animation Performance
- Use `transform` and `opacity` only (GPU-accelerated)
- `will-change` on hover states only
- Intersection Observer with 10% threshold
- `requestAnimationFrame` for scroll-linked effects
- Disable animations on `prefers-reduced-motion`

## Next.js Architecture (Vercel Best Practices)

```
/app
  /(commerce)
    /[locale]
      /page.tsx          # Main landing page
      /layout.tsx        # I18n provider
  /api
    /preview/route.ts    # Draft mode for CMS
/components
  /ui                    # Shadcn-style primitives
  /sections              # Page sections as compounds
  /product               # Product-specific components
/lib
  /i18n                  # next-intl configuration
  /fonts                 # Font definitions
  /utils                 # Helpers
/public
  /images
    /products            # Optimized product shots
  /locales
    /en.json
    /ru.json
    ... (11 languages)
```

### Key Next.js Patterns
- **App Router** with RSC (React Server Components)
- **Parallel Routes** for language switcher modal
- **Streaming SSR** for below-fold content
- **Metadata API** for perfect SEO per locale
- **Image Component** with fill + object-fit for product shots

## Localization Architecture (CRITICAL)

### Supported Languages (11 Total)
EN (English), RU (Russian), DE (German), FR (French), ES (Spanish), IT (Italian), TR (Turkish), AR (Arabic - RTL!), 中文 (Chinese), JA (Japanese), KO (Korean)

### Implementation
`next-intl` v3.x with App Router

```typescript
// Locale configuration
locales: ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko']
defaultLocale: 'en'
localeDetection: false  // Explicit selection only
```

### Translation Structure
```json
{
  "hero": {
    "productName": "UNO",
    "tagline": "Luxury Electronic Hookah",
    "description": "Redesigned Shisha Experience.",
    "priceFrom": "FROM",
    "shipping": "Worldwide Shipping",
    "cta": { "preOrder": "PRE-ORDER NOW", ... }
  },
  "products": {
    "sectionTitle": "CHOOSE YOUR UNO",
    "subtitle": "Three versions. One elevated experience.",
    ...
  },
  ...
}
```

### RTL Handling (Arabic)
```css
[dir="rtl"] {
  .hero-content { text-align: right; }
  .product-grid { direction: rtl; }
  /* Mirror animations */
}
```

## Component Architecture (Reusable Structure)

### Compound Component Pattern

```typescript
<ProductShowcase>
  <ProductShowcase.Header />
  <ProductShowcase.Image priority={boolean} />
  <ProductShowcase.Content>
    <ProductShowcase.Title />
    <ProductShowcase.Description />
    <ProductShowcase.Price />
    <ProductShowcase.Actions />
  </ProductShowcase.Content>
</ProductShowcase>
```

**Benefits**:
- Flexible composition
- Consistent styling via shared context
- Easy mobile vs desktop rearrangement
- Localization handled at component level

### Primitive UI Components (Shadcn Approach)
- `<Button>` - 3 variants (primary, secondary, ghost)
- `<Badge>` - Feature callouts
- `<Card>` - Product version cards
- `<LanguageSelector>` - Dropdown with flags
- `<ScrollReveal>` - Animation wrapper

## Content Structure (From Renders)

### Section 1: Hero
- Logo (top left)
- Language selector (top right) + hamburger menu
- Full language bar with flag icons
- Hero title: "UNO" + tagline + description
- Pricing "FROM $700"
- "Worldwide Shipping"
- CTAs: "PRE-ORDER NOW", "FOR BUSINESS", "WATCH VIDEO"
- Product image (right side, purple chamber glowing)

### Section 2: Business
- "RAMSIDER FOR BUSINESS" purple badge
- Headline: "A complete shisha service system for hotels, restaurants and premium lounges."
- CTAs: "EXPLORE BUSINESS SOLUTIONS", "REQUEST A PRESENTATION"
- Lifestyle image (devices in restaurant/bar setting)

### Section 3: Stats Showcase
4 icon + stat + label cards:
- Shield icon: "250,000+ SESSIONS TESTED"
- Gear icon: "8+ YEARS OF DEVELOPMENT"
- Globe icon: "WORLDWIDE SHIPPING"
- Heartbeat icon: "SMART ELECTRONIC HOOKAH"

### Section 4: Product Versions
- "CHOOSE YOUR UNO" header
- Subtitle: "Three versions. One elevated experience."
- 3 product cards (vertical scroll mobile):
  
  **UNO LIGHT**
  - Price: 700 $
  - Product image with purple glow
  - "PRE-ORDER" button
  
  **UNO PRO**
  - Price: 1000 $
  - Product image with purple glow
  - "PRE-ORDER" button
  
  **UNO GOLD**
  - Price: 2000 $
  - Product image with purple glow (gold base)
  - "PRE-ORDER" button

- Bottom trust badges:
  - Shield: "SECURE CHECKOUT"
  - Badge: "2 YEARS WARRANTY"
  - Return: "30 DAY RETURNS"

### Section 5: Features ("PERFECTION IN EVERY DETAIL")
Header: "PERFECTION IN EVERY DETAIL"
Subtitle: "UNO combines advanced technology, smart control and refined design for the purest shisha experience."

4 features (each with large detail photo):

**01 - SMART DISPLAY**
- Image: Close-up of black oval display showing "13" and "READY TO HEAT"
- Description: "Full control in your hands. Real-time session, heat level and battery status."

**02 - WATER COOLING**
- Image: Glowing purple water chamber with bubbles
- Description: "Smoother. Cleaner. Better. Advanced water cooling system for the perfect draw."

**03 - PREMIUM MATERIALS**
- Image: Close-up of hookah hose with smoke
- Description: "Crafted with precision. High-quality materials for durability and luxury."

**04 - PRECISION DESIGN**
- Image: White body detail with "RAMSIDER" branding and air vents
- Description: "Details that matter. Sleek lines, perfect balance and iconic design."

Stats bar (repeated)
CTA card: "READY TO ELEVATE YOUR EXPERIENCE?" with trust badges

### Section 6: How It Works
"HOW UNO WORKS"

4 steps with icon + description:

**1 - INSERT CAPSULE**
- Icon: Capsule outline
- Description: "Insert your favorite shisha capsule into UNO."

**2 - PRESS START**
- Icon: Play button
- Description: "Press the button and UNO begins to heat."

**3 - READY IN MINUTES**
- Icon: Clock
- Description: "In just a few minutes, UNO is ready to deliver the perfect draw."

**4 - ENJOY**
- Icon: Smoke cloud
- Description: "Sit back, relax and enjoy the ultimate shisha experience."

Dark CTA card with purple atmosphere:
"READY TO ELEVATE YOUR EXPERIENCE?"
"Choose your UNO and place a pre-order."
"PRE-ORDER NOW" button
Trust badges: SECURE CHECKOUT | 2 YEARS WARRANTY | 30 DAY RETURNS

### Section 7: Social Proof
**LOVED BY EXPERTS**
- Testimonial: "Ramsider UNO is in a league of its own. A true game changer in the shisha world."
- 5 purple stars
- "— Smoke Magazine"
- Product image (right side)

**SHIPS WORLDWIDE**
- Globe icon with purple accent
- "We deliver to over 80 countries."
- World map with purple shipping route lines

### Section 8: Footer
- "RAMSIDER" logo (center)
- Social icons: Instagram, YouTube, Telegram
- Links: "Support | Privacy Policy | Terms & Conditions"
- Email: info@ramsider.com
- Copyright: "© Ramsider. All rights reserved."

## Image Requirements

### Product Images Needed
1. **uno-light-hero.webp** - Full device, purple glow, white body (800x1000px)
2. **uno-light-product.webp** - Product card version (600x800px)
3. **uno-pro-product.webp** - Pro version (600x800px)
4. **uno-gold-product.webp** - Gold version with gold base (600x800px)
5. **business-lifestyle.webp** - Restaurant/bar setting (1200x800px)
6. **feature-display.webp** - Smart display close-up (800x600px)
7. **feature-water.webp** - Purple water chamber glowing (800x600px)
8. **feature-materials.webp** - Hose with smoke (800x600px)
9. **feature-design.webp** - Body detail with vents (800x600px)
10. **world-map.svg** - Shipping routes map

### Image Optimization
- Primary format: WebP
- Fallback: AVIF for modern browsers
- Responsive srcset: 375w, 768w, 1024w, 1920w
- Quality: 90 for hero, 85 for below-fold
- Lazy loading: All except hero
- Blur placeholders: Generate low-quality image previews

## Accessibility Requirements

- **Semantic HTML**: `<section>`, `<article>`, `<nav>`, `<header>`, `<footer>`
- **ARIA Labels**: All icon buttons, language selector, decorative images
- **Keyboard Navigation**: Full tab order, visible focus states
- **Color Contrast**: 
  - WCAG AAA on body text (7:1 ratio)
  - WCAG AA on large text (4.5:1 ratio)
- **Alt Text**: 
  - Descriptive for product images
  - Empty string for decorative elements
- **RTL Support**: Proper `dir` attribute, mirrored layouts for Arabic
- **Screen Reader**: Announce price changes, CTA states, section transitions
- **Motion**: Respect `prefers-reduced-motion`

## Implementation Checklist

### Phase 1: Setup & Architecture ✓
- [ ] Initialize Next.js 15 with App Router
- [ ] Configure TypeScript + ESLint + Prettier
- [ ] Set up Tailwind CSS with custom design tokens
- [ ] Install `next-intl` for localization
- [ ] Configure font loading strategy
- [ ] Create component library structure
- [ ] Set up image optimization pipeline

### Phase 2: Design System & Primitives ✓
- [ ] Define CSS custom properties (color palette, spacing, typography)
- [ ] Create Button component (primary, secondary, ghost variants)
- [ ] Create Badge component
- [ ] Create Card component
- [ ] Create LanguageSelector with flag icons
- [ ] Create ScrollReveal animation wrapper
- [ ] Build responsive layout containers

### Phase 3: Compound Components ✓
- [ ] ProductShowcase compound component
- [ ] FeatureCard component
- [ ] StatCard component (icon + number + label)
- [ ] ProductVersionCard component
- [ ] TrustBadge component
- [ ] CTASection component
- [ ] TestimonialCard component

### Phase 4: Page Sections (Mobile-First) ✓
- [ ] Header with logo + language selector + hamburger
- [ ] Hero section (copy left, product right)
- [ ] Business section with CTAs
- [ ] Stats showcase (4 cards)
- [ ] Product versions section (3 cards, vertical mobile)
- [ ] Features section (4 detail cards)
- [ ] How It Works (4 steps)
- [ ] Social proof section (testimonial + shipping)
- [ ] Footer with links and social icons

### Phase 5: Interactions & Animations ✓
- [ ] Implement scroll-triggered reveals (Intersection Observer)
- [ ] Add hover states with purple glow effects
- [ ] Create smooth section transitions
- [ ] Add parallax effects on feature images
- [ ] Implement animated stat counters
- [ ] Add "Watch Video" modal functionality
- [ ] Create smooth language switcher
- [ ] Implement mobile menu animation

### Phase 6: Localization ✓
- [ ] Create translation files for 11 languages:
  - [ ] English (en.json)
  - [ ] Russian (ru.json)
  - [ ] German (de.json)
  - [ ] French (fr.json)
  - [ ] Spanish (es.json)
  - [ ] Italian (it.json)
  - [ ] Turkish (tr.json)
  - [ ] Arabic (ar.json) - RTL
  - [ ] Chinese (zh.json)
  - [ ] Japanese (ja.json)
  - [ ] Korean (ko.json)
- [ ] Implement RTL layout for Arabic
- [ ] Test CJK font rendering
- [ ] Verify no text overflow issues
- [ ] Test language switcher functionality

### Phase 7: Performance Optimization ✓
- [ ] Optimize all images (WebP + AVIF, responsive srcset)
- [ ] Implement lazy loading strategy
- [ ] Generate blur placeholders for images
- [ ] Inline critical CSS
- [ ] Configure font subsetting
- [ ] Set up prefetching on CTA hover
- [ ] Minimize bundle size (code splitting)
- [ ] Run Lighthouse audits (target: 95+ mobile)
- [ ] Test on real 4G network (target: LCP <2.5s)

### Phase 8: Testing & Validation ✓
- [ ] Visual regression testing (pixel-perfect match to renders)
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Mobile device testing (iOS Safari, Chrome Android)
- [ ] RTL layout validation (Arabic)
- [ ] Accessibility audit (WCAG AA compliance)
- [ ] Performance audit (Core Web Vitals)
- [ ] SEO validation (meta tags, structured data)
- [ ] Form validation (email capture if applicable)

## Success Metrics

### Performance
- ✅ Lighthouse score: 95+ (mobile), 98+ (desktop)
- ✅ LCP: <2s on 4G
- ✅ Bundle size: <200kb initial load
- ✅ 60fps animations throughout

### Design Quality
- ✅ Pixel-perfect match to renders (<2px variance)
- ✅ Smooth scroll animations
- ✅ Zero CLS (cumulative layout shift)
- ✅ Consistent purple glow effects

### Localization
- ✅ All 11 languages functional
- ✅ RTL layout correct (Arabic)
- ✅ No text overflow in any language
- ✅ CJK fonts render correctly

### Accessibility
- ✅ WCAG AA compliant
- ✅ Keyboard navigation works
- ✅ Screen reader friendly
- ✅ Color contrast passes

## Technology Stack

### Core
- **Framework**: Next.js 15 (App Router)
- **React**: 19.x
- **TypeScript**: 5.x
- **Node**: 20.x LTS

### Styling
- **Tailwind CSS**: 4.x
- **CSS Modules**: For component-scoped styles
- **PostCSS**: Autoprefixer, nested selectors

### Localization
- **next-intl**: 3.x (App Router support)

### Performance
- **Sharp**: Image optimization
- **next/image**: Responsive images
- **next/font**: Font optimization

### Development
- **ESLint**: Next.js config + Tailwind plugin
- **Prettier**: Code formatting
- **TypeScript**: Strict mode

### Deployment
- **Vercel**: Edge network deployment
- **Git**: Version control

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SITE_URL=https://ramsider.com
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

## Browser Support

### Target Browsers
- Chrome/Edge: Last 2 versions
- Safari: Last 2 versions
- Firefox: Last 2 versions
- iOS Safari: Last 2 versions
- Chrome Android: Last 2 versions

### Progressive Enhancement
- Core experience works without JavaScript
- Animations enhance but aren't required
- Graceful degradation for older browsers

## Why This Architecture Works

1. **Mobile-First**: 80% of users on mobile get optimized experience
2. **Performance**: Every decision optimized for speed (RSC, image optimization, code splitting)
3. **Scalability**: Compound components make it easy to add new products/sections
4. **Localization**: next-intl handles complex i18n including RTL
5. **Maintainability**: Clear separation of concerns, reusable primitives
6. **SEO**: Metadata API + RSC = perfect search engine indexing
7. **Accessibility**: Built-in from day one, not added later

## Design Principles Applied

1. **Restraint Over Excess**: Minimal color palette, generous whitespace
2. **Purpose Over Decoration**: Every animation guides or reinforces
3. **Context Over Generic**: Purple tied to physical product feature
4. **Performance Is UX**: Fast load = elevated brand perception
5. **Details Matter**: Pixel-perfect execution reinforces luxury positioning

---

**Ready to build a commerce experience that's unforgettable.**
