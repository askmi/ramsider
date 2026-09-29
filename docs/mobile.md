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
