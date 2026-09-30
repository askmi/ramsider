# Ramsider UNO verification — prior baseline, 2026-09-30

**Historical baseline before the font/button mapping correction.** Current UI, modal behavior, native review and measurement evidence are in [font/button implementation verification](font-button-implementation-2026-09-30.md). Full-page screenshot filenames are reused by the test suite and now show that later implementation.

This records the continuation of the existing uncommitted implementation. The build is local; product claims and commerce dependencies in [PRODUCT.md](../PRODUCT.md) remain unapproved for publication.

## Visual and browser evidence

- Baseline: iPhone 17 Pro, 402 × 874 CSS px at DPR 3 in WebKit. The full capture is `screenshots/actual/full-iphone-17-pro-webkit.png`. It was compared with aligned crops from `design/references/background_text.png`; the technology anchors, order panels, hospitality CTA, documents, and project cards were inspected and corrected. Minor glyph and glow differences remain. The discipline auditor passed the assembled visual gate.
- Second target: iPhone 17 Pro Max, 440 × 956 CSS px at DPR 3 in WebKit, captured at `screenshots/actual/full-iphone-17-pro-max-webkit.png`. It has no direct reference, so it was checked as a responsive composition. The four-profile Playwright suite also ran at 1440 × 900 in Chromium and Firefox; all four tests passed.
- A separate WebKit matrix checked `en`, `ru`, `de`, `fr`, `es`, `it`, `tr`, `ar`, `zh`, `ja`, and `ko` at 375, 402, 440, and 768 CSS px: 44 cases, zero page-width or technology-caption overflow findings. Arabic RTL, reduced motion, keyboard menu toggling and Escape, anchor navigation, reserve, model and set details, document and project details, both account tiles, and FAQ were exercised. The final browser suite had no page errors. The discipline auditor passed behavior/adaptation.
- `screenshots/actual/state-*-iphone-17-pro.png` contains the inspected styled document, project, PRO, set, venue-account, and Russian technology states. Project and document details open in readable popovers while the static cards retain the supplied composition.

## Code and production checks

- `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:visual`, and `git diff --check` passed. The build reports `/` as static and eleven `/[locale]` paths as SSG. The final native `codex review --uncommitted` reported no actionable finding; its own sandbox could not bind port 3000, so browser checks used the main session's production server.
- On a 402 × 874 DPR 3 Chromium profile using the local production server, CDP was configured for 150 ms latency, 1.6 Mbps and 4× CPU throttling. Cold local-server TTFB was 19 ms, FCP/LCP 800 ms, and CLS 0.00023. The low loopback TTFB suggests the network latency may not have applied to localhost; these are local synthetic timings, not field or reliably throttled-network results. Total resource transfer was about 775 kB: 151 kB scripts, 140 kB images, and 360 kB fonts. Warm FCP/LCP was 244 ms with zero CLS. A 161-frame long scroll at normal CPU had 16.7 ms median, 18.5 ms p95, and no frame above 33 ms. INP and a Lighthouse score were not measured; no score claim is made.
- Static public content remains prerendered; only the menu interaction hydrates a Client Component. The first artwork tile is eager and preloaded. The source 44 MB reference PNGs are not served by the site.

## External dependencies

Approved prices, certificates/files, film media, confirmed FAQ answers, account/configurator/checkout services, business/project destinations, and claim approval are absent from the supplied materials. Local controls show explicit availability states and do not take payment or invent destinations. These facts need owner confirmation before publication or live commerce.
