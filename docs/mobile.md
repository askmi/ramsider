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

## Safari initial chrome — CHG-0099, corrected 2026-10-13

The user's latest physical Safari screenshot rejects the prior candidate: the gray system strip still contrasts with the hero's varying top row. The earlier root artwork/cover candidate was APPLIED_UNVERIFIED for native chrome, never a certified physical fix. [WebKit's cover/safe-area explanation](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) documents html/body fallback; [Safari26 engineer clarification](https://bugs.webkit.org/show_bug.cgi?id=301756#c2) distinguishes solid color extension near fixed/sticky edges from actual page content. Merely putting an image on html or adding cover does not certify that native Safari will extend that image. Exact user iOS/version remains unknown.

Corrective page candidate uses `--hero-chrome-bg:#c4b7b4` from the shipped sRGB hero's center top pixel, explicitly on root/body. An absolute, noninteractive mobile-only `art::before` layer starts with the same solid color for4px then fades to the unchanged photo over `clamp(32px,120/941*100cqw,56px)`. This intentionally harmonizes the page boundary with a possible solid-color system extension. No photo stretching, crop, raster conversion, added image/JavaScript, sticky header or theme-color trick. Original hero/root image bytes and source geometry stay unchanged. Cover and safe controls remain; desktop keeps its existing `#bda48c` body matte and no feather. Black modal root/body/image-none override still applies, close restores the candidate.

Current evidence: [edge checks](evidence/safari-top/corrected-edge-checks.json), [modal restoration](evidence/safari-top/corrected-edge-modal.json), [performance](evidence/safari-top/corrected-edge-performance.json). Ready WebKit Pro402×874/Max440×956,DPR3 images inspected against current CHG0107 baseline: first3CSSrows exactly match backing196/183/180;0RGBchanges below first56px, desktop wholeviewport0. Header/icon/font/control geometry unchanged; safe24/59 shifts are synthetic CSS tests, not native UI. Widths375/768/1440,11locale/Arabic/menu/language/keyboard/scroll-return and blackmodal/close checked; eager hero requested once, SHA/ICC/full-ratio preserved. Existing assembled mobile4checksPASS.

Overall CHG0099 remains **APPLIED_UNVERIFIED**: native Safari after correction, initial→scroll→return still **BLOCKED** because xcrun simctl is unavailable/Xcode absent. Playwright content screenshots exclude status/address bars; no physical fix or exact Safari tint is claimed. User's supplied image is physical before evidence, not an after image. Local preview3068 contains the page candidate; no push requested. Earlier evidence in this directory and prior failed locale tests remain historical, not a claim of full native approval.

Publication of the existing page candidate authorized2026-10-14; physical Safari after remains BLOCKED. Git/deployment outcome recorded separately in the journal.
