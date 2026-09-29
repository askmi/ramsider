# Architecture for the new application

Read during stage 2 of [docs/discipline.md](docs/discipline.md). There is no app scaffold yet. At setup choose current compatible stable Next.js + React + strict TypeScript versions and verify APIs against the documentation for those installed versions. Use Next.js for routing, metadata, image delivery, rendering, and its own development/build commands. Document real versions and commands after installation. Treat the current [Next.js production guide](https://nextjs.org/docs/app/guides/production-checklist) and version-matched official API docs as the authority; consult only the relevant category of the project [React/Next performance skill](.agents/skills/vercel-react-best-practices/SKILL.md) when an implementation or measurement calls for it.

## Page composition and component responsibility

Use [docs/reference-map.md](docs/reference-map.md) to plan actual sections before writing components. Plausible boundaries are hero, ritual/problem story, technology, choice/blends, film/lifestyle, PRO/GOLD comparison and details, set, ordering, testing/documents, hospitality, FAQ, brand ecosystem, and closing CTA. These are a planning map; crop the reference at native size before fixing exact boundaries or copy.

Separate page-specific sections from genuinely reusable controls. A section owns its composition and text placement; shared controls own common interaction and styling. Keep APIs explicit, avoid boolean-prop proliferation and speculative abstractions. Review component size, naming, state ownership, duplicate markup, and whether a shared component actually has more than one use. Avoid one enormous page component and excessive micro-components alike.

Use Server Components for display content, data access, and server-only code. Put browser APIs, event handlers, and interactive state into the smallest necessary Client Components; a Client Component can still contribute HTML on the first server render, so it is not synonymous with client-only rendering. Keep providers and `use client` boundaries deep enough that unrelated sections do not enter the client bundle. Avoid fetch waterfalls and unnecessary server-to-client serialization. Prefer stable CSS layout over JS positioning for the visual overlays. Add code splitting only where it reduces initial work without causing visible gaps. Ensure the rendered page includes a responsive viewport meta tag (`width=device-width, initial-scale=1` or the framework's equivalent); mobile WebKit otherwise may lay it out at 980 CSS px despite a 402 px emulated screen.

## Choose rendering per route and section

Choose **when HTML is produced** separately from the Server/Client Component boundary. For stable public product and editorial content, start with static prerendering/SSG so the initial response contains useful HTML without request-time data work. Use revalidation or a suitable cache when content changes and freshness permits it. Use request-time server rendering/SSR for genuinely request-dependent or personalized content; keep stable sections static or cached where the installed Next.js version and deployment support it. Use client-side rendering/CSR only for browser-dependent or user-interactive parts that cannot provide meaningful server HTML. Do not convert the public page into a client-only shell to implement a small widget.

Check actual route output and caching behavior in the production build; data access, request APIs, or configuration can change whether a route is prerendered. Place expensive dynamic work behind focused loading/streaming boundaries only when it improves a measured user path. Choose the simplest supported strategy that preserves correct data freshness, SEO, accessibility, and interaction behavior. Do not activate every framework feature, cache private data across users, or add abstractions for imagined future flows. [PERFORMANCE.md](PERFORMANCE.md) defines the measurement and re-evaluation gate.

## Styles, localization, motion

Choose either CSS Modules or Tailwind with CSS variables for a coherent token system. Derive typography, colors, spacing, section heights, and backgrounds from the reference; do not use generic defaults. Make iPhone 17 Pro the base style, verify Pro Max, then add responsive adaptations for other devices. Keep clean artwork aligned with HTML overlays at a comparable viewport.

Use one key-based translation schema for `en`, `ru`, `de`, `fr`, `es`, `it`, `tr`, `ar`, `zh`, `ja`, and `ko`. Check that every visible string has a key and every locale has the key. Test long translations and different scripts. Arabic must set the correct language/direction and mirror only direction-sensitive layout and behavior, preserving deliberate artwork.

Use CSS transitions for simple motion, Motion for coordinated React animation when needed, and GSAP only for complex sequences that simpler tools cannot express. Respect reduced-motion preferences. Keep animation behavior tests separate from static screenshot comparison.

## Update after scaffold

Record actual routes, page/component tree, translation files, image pipeline, scripts, and runtime dependencies here once they exist. Do not copy the deleted app's structure, claims, or commands as if they were current. Review the code with [QUALITY.md](QUALITY.md) before completion and rerun visual QA after structural refactors.
