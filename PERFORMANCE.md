# Performance is part of product correctness

Read during implementation and stage 5 of [docs/discipline.md](docs/discipline.md). The target is an immediate-feeling, smooth long page on iPhone 17 Pro and Pro Max. A visually correct section that introduces unnecessary wait, blocking work, layout shifts, or interaction lag has not passed. Preserve approved visual quality while minimizing runtime cost. The 95+ mobile Lighthouse goal is a measured target, never an assumed result.

## The 32,127-pixel background

`background.png` and `background_text.png` are each about 44 MB. The latter is a reference only. Do not serve either entire PNG as a single production background. Start with the clean artwork, split it at natural section boundaries or into tiles, and test compressed modern formats and responsive widths. Preserve crop, color, sharpness, and overlay alignment at target device pixel ratios. Compare boundaries pixel by pixel and while scrolling; there must be no seams, blank bands, late pop-in, or visible quality drop.

Make the first visible artwork ready immediately; load later sections before they enter view. Reserve their layout space so the long page cannot jump. Measure payload, decode cost, memory pressure, and scrolling behavior. Choose the simplest segmented delivery that meets the visual and speed gates; splitting alone does not guarantee improvement.

## Rendering and asset priority

1. Prioritize the first viewport: background/hero, primary typography, CTA, and first controls. Do not lazy-load the LCP image. Preload only assets proven critical; excessive preloading competes with the hero.
2. Prefer static/server-rendered HTML for content, using Client Components only for actual interaction. Stream slower sections with Suspense when it helps first render. Do not block initial rendering on far-below-fold data or media.
3. Use correctly dimensioned responsive images (`next/image` where appropriate), efficient modern formats and quality, and phone-sized resources for phones. Lazy-load later images, video, optional components, and third-party scripts. Provide still-image fallbacks for deferred video.
4. Use `next/font` or optimized self-hosted fonts. Ship only the used families, weights, and subsets; reserve metrics to avoid text reflow. Prevent image, font, and animation layout shifts.
5. Keep the client bundle and hydration small. Prefer CSS/native browser behavior; avoid render-blocking dependencies, oversized state, expensive effects, and unnecessary React renders. Use dynamic imports, `React.lazy`, transitions, deferred values, and View Transitions only where supported and where measurement shows benefit.
6. Animate transform and opacity rather than layout properties. Keep scroll and input responsive while background work occurs. Use caching, CDN/static delivery, production minification/compression, and framework caching where appropriate.

## Production measurement gate

Run a production build, not only a dev server, at the primary mobile viewport. Inspect browser network, console, and performance traces. Record transferred asset and JavaScript bytes, critical request order, LCP, CLS, image/font flashes, scroll/animation smoothness, and interaction latency. Measure INP only from a representative interaction session or field data; do not report a synthetic page-load number as INP. Test cold initial navigation and a representative long scroll. Fix meaningful regressions, then measure again and repeat affected visual comparisons. Report real measurements and conditions; never claim a score or “instant” experience without evidence.
