# iPhone 17 Pro-first and responsive verification

Read during stage 4 of [discipline.md](discipline.md). The **base layout is for iPhone 17 Pro**, with iPhone 17 Pro Max as the second required target. Build the page at those mobile widths before adapting it to other phones, tablets, and desktops. Apple lists the screens as [1206 × 2622 physical pixels for Pro](https://support.apple.com/en-us/125090) and [1320 × 2868 for Pro Max](https://support.apple.com/en-us/125091); at 3×, use **402 × 874** and **440 × 956 CSS px** as reproducible Playwright screen profiles. This is an emulation baseline, not a fixed content-height requirement. Safari browser chrome, keyboard, and safe areas change the visible area; verify those states separately on a real device or simulator when available.

## Viewport order

| Priority | Profile | Purpose |
| --- | --- | --- |
| 1 | iPhone 17 Pro, 402 × 874 CSS px, DPR 3, mobile WebKit/touch | Compose and visually verify each reference-led slice; run critical interactions and production performance checks. |
| 2 | iPhone 17 Pro Max, 440 × 956 CSS px, DPR 3, mobile WebKit/touch | Verify the second target's typography, art crop, section rhythm, controls, safe areas, and long scroll. |
| 3 | Other phones, e.g. 375 × 812, 390 × 844, 430 × 932 | Responsive interpolation and smaller-screen stress; no device-specific layout fork unless the content requires it. |
| 4 | Tablet, e.g. 768 × 1024 and 1024 × 768 | Responsive layout, orientation, crop, and interaction. |
| 5 | Desktop, e.g. 1280 × 800, 1440 × 900, 1920 × 1080 | Complete responsive adaptation, keyboard/pointer behavior, and high-width composition. |

The 941 px-wide reference bitmap is the visual source, not a CSS viewport. Calibrate its crop/scale against the Pro screenshot as described in [visual-qa.md](visual-qa.md). Only call Pro Max or another size a direct pixel match if a comparable reference exists; otherwise report a responsive composition check. Use content-driven breakpoints. The source brief's `640/768/1024/1280/1536` values are examples, not mandatory breakpoints.

Before interpreting any mobile screenshot, assert the page's actual `window.innerWidth` and `window.devicePixelRatio`. With `meta name="viewport" content="width=device-width, initial-scale=1"`, the installed WebKit profiles were verified at 402/440 CSS px and DPR 3. On a blank page without the tag, WebKit reported a 980 px layout viewport; a screenshot from that state is not evidence of the target mobile composition.

At every relevant width, inspect horizontal overflow, overlap, clipping, line breaks, margins, art/product crops, tile seams, and layout jumps. Check menu, CTA, film/play, comparison, FAQ, forms, and sticky behavior when present. Scroll the entire page to find late tiles, gaps, and jank. Long translated strings and alternate scripts must remain usable. Verify `env(safe-area-inset-*)`, `svh`/`dvh`, focus, and touch targets where the actual layout needs them; do not bake the nominal 874/956 screen height into full-screen sections. For Arabic, test RTL text, alignment, and direction-sensitive controls without mirroring photography indiscriminately.

After desktop or shared CSS/font/asset changes, recheck **both** iPhone 17 Pro profiles. A desktop pass cannot close a mobile visual gate.

## Safari initial chrome — CHG-0099, 2026-10-12

The initial user Safari screenshot shows a flat beige status-bar strip; scrolling exposes page artwork there. The root previously supplied `#d3b79f`, the first artwork lived inside `.canvas`, and the viewport used default fit. [WebKit](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) documents the html/body inset backing and cover opt-in; [Safari26 engineering clarification](https://bugs.webkit.org/show_bug.cgi?id=301756) distinguishes browser color extension from page content. The exact iOS version remains unknown.

The local candidate exports `viewportFit: cover`, reuses untouched `00.webp` on root at `min(100vw,941px)` with top-row-average backing `#c4b9b7`, and shifts only masthead/locale/hero copy+CTA by the real top inset. Artwork remains at y0; the modal's black root override removes the image. No theme-color, new raster, client JavaScript or new request is added.

[Checks](evidence/safari-top/checks.json): real WebKit Pro402×874/Max440×956,DPR3 and375/768/1440; source top crops and actual captures viewed. Current original-CSS control at zero inset compares0changed channels on Pro/Max. Positive59px inset is a **synthetic CSS test**, not native chrome evidence: menu/locale y71.17Pro/74.41Max, artwork y0; all11locales no horizontal overflow; EN/AR keyboard, menu/language clicks, scroll-return and modal backing pass. Native focused review/build/type pass; lint2existing warnings. The first locale suite4PASS9SKIP3FAIL is retained: premature keyboard test passes with settled-page input, and route-abort technology-preload access-control reports remain linked CHG0098, so that full suite is not green.

[Cold production performance](evidence/safari-top/performance.json) records the measured conditions; root and DOM reuse one hero request, JS payload unchanged. This candidate remains **APPLIED_UNVERIFIED for native Safari chrome**: Xcode/iOS Simulator unavailable (`xcrun simctl` not found); Playwright screenshots exclude Safari's system UI. It does not prove the customer's initial status-bar image is fixed. Current local preview3060 supersedes the stale3057 preview; no commit/push/deployment requested.
