# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

---

# ⭐ TOP-PRIORITY INSTRUCTIONS (override everything below)

## GOALS
- **MAIN AUDIENCE is the small mobile screen.** Design mobile-device-first: media queries, adaptive + responsive UI. Verify mobile before anything else.
- **Pixel- and shape-perfect match to `renders/`** — the render is the ground truth for every UI/UX decision.
- **Image placement, aspect ratio, fonts — everything must match the renders exactly**, not approximately.
- **Create a modern look & feel** using the available skills and plugins (see list at bottom).
- **Write clean React** — follow current best practices and patterns.
- **Spend fewer tokens** — never read trash/cache files; use this file as the index (see token-discipline section).
- **Clean up redundant/unused code** as you go.

## MAIN RULE — verify against the real screen, always
When given any task to change or fix a UI component (placement, styles, spacing, images, etc.):
1. Make the change.
2. **ALWAYS capture the actual rendered screen and compare it to the target render** (use the screenshot/browser skills below, or create a small skill/script if it gets it done more efficiently).
3. **NEVER say "done" until you have verified the real on-screen result** matches the render.
4. Remove unused code

**ALWAYS REMEMBER: the single focus is to follow `renders/` design UI/UX exactly.**

## Beat the generic defaults (only in space the render doesn't pin down)
By default AI frontends converge on "slop": Inter/Roboto, purple-gradient-on-white, no motion, flat solid backgrounds, timid evenly-spread palettes. **The render always overrides this** — where a render specifies a font, color, ratio, or placement, match it exactly (even Inter, which is this project's deliberate body face). But for anything the renders *don't* dictate — new sections, motion, hover/empty/error states, background atmosphere — make deliberate, non-default choices:
- **Motion:** one orchestrated page-load / scroll reveal (the `ScrollReveal` stagger) beats scattered micro-interactions.
- **Color:** dominant `ramsider` tone + a sharp `purple` accent, not a timid even spread.
- **Type contrast:** use weight extremes and large size jumps (already the hero pattern: `font-light` 9xl display vs small tracked-out labels).
- **Backgrounds:** layered gradients/atmosphere (see hero's radial `purple-glow`) over flat fills.
- Don't re-converge on the *next* safe default either — pick what fits this luxury-device subject.

---

## ⛔ Read this first — token discipline

Don't burn tokens on generated/cache files — **never read these**:

- `node_modules/`, `.next/`, `*.tsbuildinfo`, `package-lock.json`, `public/locales/*.json` (huge; grep for a key instead of reading whole files)
- Any `*.png` capture at repo root — regenerate a fresh screenshot rather than reading a stale one.

Root has been cleaned of the old deploy/status doc clutter; if throwaway `*_FIXED.md` / `DEPLOY_*` / `VERCEL_*` files reappear, treat them as noise, not truth. The **code and the `renders/`** are the only sources of truth.

To orient, read only: this file, the component you're touching, its sibling in `components/`, and the matching `renders/*.jpg`. That's it.

## 🎯 The one rule that matters: match `renders/` exactly

This is a **pixel-fidelity rebuild** of four supplied design renders. The renders are the spec — not your taste, not "best practices," not what looks modern in the abstract.

- `renders/01.jpg` → Hero
- `renders/02.jpg` → Products / "CHOOSE YOUR UNO"
- `renders/03.jpg`, `renders/04.jpg` → remaining sections

Before changing any visual (spacing, image placement, type size, weight, tracking, color, layout order), **look at the relevant render** and reproduce what's there. Fonts, image positions, and proportions must match the render, not approximate it. Use the `render-match` skill when building a section to a render.

**MOBILE IS THE PRIMARY AUDIENCE.** Design and verify mobile first, always. Tailwind here is mobile-first: unprefixed classes = mobile, `sm:`/`lg:`/`xl:` layer up. Every section is authored small-screen-first (see `HeroSection`: base sizes, then `sm:`/`lg:` overrides). Check the mobile render/layout before the desktop one. Verify with the **`chrome-devtools-mcp`** skill — drive a live browser at a mobile viewport (~390px) and screenshot to compare against the render.

**Fonts are settled — do not reintroduce serifs.** `FONTS.txt` documents that the renders use clean geometric **sans-serif** throughout (Playfair/serif was a prior mistake). Display = `Work_Sans` (`--font-display`, `font-display`), body = `Inter` (`--font-body`, `font-body`), both via `next/font/google` in `lib/fonts.ts`. Headings use wide tracking (`tracking-extra-wide` = 0.2em, `tracking-ultra-wide` = 0.3em).

## Commands

```bash
npm run dev          # dev server (Next 15)
npm run build        # production build
npm run start        # serve production build
npm run lint         # eslint (next lint)
npm run type-check   # tsc --noEmit — run before considering a change done
npm run format       # prettier + tailwind class sorting
```

Visual verification (the MAIN RULE): run the dev server, then use the **`chrome-devtools-mcp`** skill to load the page at a mobile viewport and screenshot it against `renders/*.jpg`. There is **no test suite** — verification is visual (against renders) plus `type-check` + `lint`.

## Architecture

Single marketing/commerce page, statically generated per locale.

- **Routing / i18n:** `next-intl` with `localePrefix: 'always'`. Every route is `/[locale]/...`. The only page is `app/(commerce)/[locale]/page.tsx`; `layout.tsx` wraps it in `NextIntlClientProvider`, sets `<html lang dir>` (RTL for Arabic), and loads the fonts. `middleware.ts` redirects to a locale prefix. **`params` is a `Promise`** in this Next version — `await params` before reading `locale` (see page/layout).
- **11 locales, config-driven:** `lib/i18n/config.ts` is the source of truth (`locales`, `defaultLocale`, `localeNames`, `localeFlags`, `rtlLocales = ['ar']`). `lib/i18n/request.ts` loads messages from `public/locales/<locale>.json`. **All user-facing copy lives in those JSON files** and is read via `useTranslations('<namespace>')` — never hardcode strings in a section. If you add copy, add the key to **all 11** JSON files. Some values contain HTML and are rendered with `dangerouslySetInnerHTML` (e.g. hero `productName`, `description`).
- **Page composition:** `page.tsx` renders `Header` + `<main className="pt-[153px]">` (offset for the fixed header) containing the sections in fixed order (Hero → Business → Stats → Products → Features → HowItWorks → Testimonial → Shipping → Footer). One file per section in `components/sections/`.
- **UI primitives:** `components/ui/` — `Button` (variant `primary`/`secondary`), `Card`, `Badge`, `LanguageSelector`, `ScrollReveal` (wraps content with a `delay` prop for staggered fade-up on scroll; sections stagger children with `delay={0,100,200,...}`).
- **Images:** all product/feature art is in `public/images/products/` (`*-pure.png` = transparent cutouts, `*.webp` = full). Always use `next/image` with `fill` + `sizes` + `object-contain`, `priority` only for above-the-fold hero. Match placement to the render.
- **Styling:** Tailwind only. Brand tokens live in `tailwind.config.ts` under `colors.ramsider` (`white #FAFAFA`, `black #0A0A0A`, `purple #C026D3`, `purple-glow #E879F9`, `gray #A1A1A1`, `border #E5E5E5`) — **use these tokens, not raw hex**. Custom animations (`fade-up`, `glow-pulse`, etc.) and extra spacing steps are also defined there. Global base styles + the `bg-gradient-radial` utility are in `app/globals.css`. Merge classes with `cn()` from `lib/utils.ts`; format prices with `formatPrice()`.

### CSS specificity caution
When adjusting section spacing, watch for competing selectors (e.g. a `.section`-type class vs. an element/`.cta` class) that cancel each other's padding/margins. Prefer utility classes on the element over broad type selectors.

## Code style

- Server Components by default; add `'use client'` only when a component needs interactivity/hooks (`ScrollReveal`, `LanguageSelector`). Keep sections as server components where possible.
- TypeScript throughout; import via the `@/*` alias (maps to repo root). Functional React, named exports for sections/primitives.
- Match the existing section's structure and class idiom rather than introducing a new pattern.

## Skills & plugins available for this repo

Reach for these instead of improvising:

- **`render-match`** — reproduce a supplied render in code with high visual fidelity (the core workflow here).
- **`frontend-design`**, **`design:design-critique`**, **`design:design-system`**, **`design:accessibility-review`**, **`design:ux-copy`**, **`web-design-guidelines`**, **`ui-theme-designer:*`**, **`bencium-*-ux-designer`** — design direction, critique, tokens, a11y, and interface copy.
- **`modern-web-guidance:modern-web-guidance`**, **`vercel-react-best-practices`**, **`vercel-composition-patterns`** — modern React/Next patterns (remember AGENTS.md: verify against `node_modules/next/dist/docs/`, not memory).
- **`chrome-devtools-mcp:*`** (`chrome-devtools`, `debug-optimize-lcp`, `a11y-debugging`), **`verify`** — drive a browser to check the built page, LCP, and mobile layout against renders.
- **`deploy-to-vercel`** / **`code-review`** / **`security-review`** — deploy and review flows.
