
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


## 🌐 Localization

### Implementation
Uses `next-intl` v3.x with Next.js App Router for seamless internationalization.

### RTL Support
Arabic language includes full RTL (right-to-left) layout with mirrored animations and proper text alignment.

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

## 📸 Image Requirements


## 🚢 Deployment

## Commands

```bash
npm run dev          # dev server (Next 15)
npm run build        # production build
npm run start        # serve production build
npm run lint         # eslint (next lint)
npm run type-check   # tsc --noEmit — run before considering a change done
npm run format       # prettier + tailwind class sorting

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

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## 🔗 Links

- **Website**: https://ramsider.com
- **Email**: info@ramsider.com
- **Instagram**: [@ramsider](https://instagram.com/ramsider)
- **YouTube**: [Ramsider Official](https://youtube.com/@ramsider)

---

**Built with Next.js 15 | Optimized for Performance | Mobile-First Design**
