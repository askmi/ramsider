# Architecture for the new application

Read during stage 2 of [docs/discipline.md](docs/discipline.md). There is no app scaffold yet. At setup choose current compatible stable Next.js + React + strict TypeScript versions and verify APIs in the installed docs. The early source text says “Vite + Next.js”; its later conclusion chooses Next.js for SEO, metadata, routing, images, and server rendering. Do not add Vite to a Next.js app. Document real versions and commands after installation.

## Page composition and component responsibility

Use [docs/reference-map.md](docs/reference-map.md) to plan actual sections before writing components. Plausible boundaries are hero, ritual/problem story, technology, choice/blends, film/lifestyle, PRO/GOLD comparison and details, set, ordering, testing/documents, hospitality, FAQ, brand ecosystem, and closing CTA. These are a planning map; crop the reference at native size before fixing exact boundaries or copy.

Separate page-specific sections from genuinely reusable controls. A section owns its composition and text placement; shared controls own common interaction and styling. Keep APIs explicit, avoid boolean-prop proliferation and speculative abstractions. Review component size, naming, state ownership, duplicate markup, and whether a shared component actually has more than one use. Avoid one enormous page component and excessive micro-components alike.

Use Server Components/static rendering for display content and initial HTML. Put browser APIs and interactive state into the smallest necessary Client Components. Keep data fetching, translations, and media-loading decisions from forcing unrelated sections to hydrate. Prefer stable CSS layout over JS positioning for the visual overlays. Add code splitting only where it reduces initial work without causing visible gaps. Ensure the rendered page includes a responsive viewport meta tag (`width=device-width, initial-scale=1` or the framework's equivalent); mobile WebKit otherwise may lay it out at 980 CSS px despite a 402 px emulated screen.

## Styles, localization, motion

Choose either CSS Modules or Tailwind with CSS variables for a coherent token system. Derive typography, colors, spacing, section heights, and backgrounds from the reference; do not use generic defaults. Make iPhone 17 Pro the base style, verify Pro Max, then add responsive adaptations for other devices. Keep clean artwork aligned with HTML overlays at a comparable viewport.

Use one key-based translation schema for `en`, `ru`, `de`, `fr`, `es`, `it`, `tr`, `ar`, `zh`, `ja`, and `ko`. Check that every visible string has a key and every locale has the key. Test long translations and different scripts. Arabic must set the correct language/direction and mirror only direction-sensitive layout and behavior, preserving deliberate artwork.

Use CSS transitions for simple motion, Motion for coordinated React animation when needed, and GSAP only for complex sequences that simpler tools cannot express. Respect reduced-motion preferences. Keep animation behavior tests separate from static screenshot comparison.

## Update after scaffold

Record actual routes, page/component tree, translation files, image pipeline, scripts, and runtime dependencies here once they exist. Do not copy the deleted app's structure, claims, or commands as if they were current. Review the code with [QUALITY.md](QUALITY.md) before completion and rerun visual QA after structural refactors.
