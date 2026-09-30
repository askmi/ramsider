# Locale switcher — implementation and verification, 2026-09-30

The [2026-10-01 follow-up](locale-switcher-follow-up-2026-10-01.md) records later user instructions and the current panel material/desktop header alignment. The original evidence below describes the first implementation cycle; current screenshots at the same paths were recaptured during the follow-up.

The [approved supplement](../design/references/locale-switcher/README.md) governs this control only. The original long render still governs product art and page copy. The three required states are the hero control beside the hamburger, its persistent position near the viewport edge while scrolling, and the open list of eleven country flags and language names.

## Mapping and visual result

The approved `03-open-menu-flags.png` has an interior frame about 878 px wide. At the 402 CSS px iPhone 17 Pro baseline, its approximate scale is 0.458. The open panel maps to x≈249–392 and y≈56–346. The production WebKit screenshot places it at x≈249–393 and y≈54–351. The chip remains about 82 px from the right edge in the hero and 16 px from the edge after scrolling. The Pro Max uses the same relationship responsively; no separate pixel reference exists for it.

Production browser images: [Pro hero](../screenshots/actual/locale-switcher/hero-iphone-17-pro-webkit.png), [Pro open](../screenshots/actual/locale-switcher/open-iphone-17-pro-webkit.png), [Pro scrolled](../screenshots/actual/locale-switcher/scrolled-iphone-17-pro-webkit.png), [Pro Max hero](../screenshots/actual/locale-switcher/hero-iphone-17-pro-max-webkit.png), [Pro Max open](../screenshots/actual/locale-switcher/open-iphone-17-pro-max-webkit.png), [Pro Max scrolled](../screenshots/actual/locale-switcher/scrolled-iphone-17-pro-max-webkit.png). The independent auditor inspected reference and actual images, failed the first two open-panel iterations, then passed the corrected visual gate. A full-image pixel diff is not meaningful because the approved AI images change the underlying product photography and typography; the control geometry was compared directly.

Arabic RTL production images: [Pro hero](../screenshots/actual/locale-switcher/arabic-hero-iphone-17-pro-webkit.png), [Pro open](../screenshots/actual/locale-switcher/arabic-open-iphone-17-pro-webkit.png), [Pro scrolled](../screenshots/actual/locale-switcher/arabic-scrolled-iphone-17-pro-webkit.png), [Pro Max open](../screenshots/actual/locale-switcher/arabic-open-iphone-17-pro-max-webkit.png). The panel mirrors to the left of the image while the Arabic hero text remains on the right; the native-script list and selected check are legible. The scrolled capture waits for the artwork tile to decode.

The trigger has a 44 px hit area. To show all eleven choices at once at the approved panel height, rows are 26 px high and about 130 px wide. This is denser than the preferred large touch target; on short screens, the panel scrolls inside the available height. Real WebKit taps 3 px from the top and bottom of every row selected the intended locale in all 22 cases. This does not prove human finger precision in the field.

## Behavior and adaptation

- Eleven routes show the corresponding flag/code and exactly one selected option. The names remain in their own scripts; Arabic has an RTL page and mirrored placement.
- The menu supports Enter/Space, Arrow Up/Down, Home/End, Escape with focus return, outside click, and Tab departure. Opening the locale list closes the site menu. Selecting the current locale closes the list without reloading it and returns keyboard focus to the trigger. Modified clicks keep their native link semantics without writing a stale scroll position.
- Changing locale preserves the reading position on the long page in tested EN→RU navigation. The selector remains available through scrolling, including after the header leaves view.
- WebKit Pro and Pro Max assert 402/440 CSS px and DPR 3. Responsive Chromium checks covered EN and Arabic at 320, 375, 768 and 1440 px without horizontal overflow or a clipped panel. A 320×280 viewport could scroll the list to Korean and navigate successfully.
- Final production Playwright suite on the current shared source: 49 passed, 15 intentional project-specific skips across both WebKit phones, desktop Chromium, and desktop Firefox. TypeScript, ESLint and isolated Next.js Turbopack production build passed. The build statically prerendered all eleven locale routes. The independent behavior gate is recorded in CHG-0032. A Chromium request check confirms opening the list does not prefetch the other ten routes. [Raw browser log](../screenshots/actual/locale-switcher/logs/playwright-final.log), [build](../screenshots/actual/locale-switcher/logs/build-final.log), [typecheck](../screenshots/actual/locale-switcher/logs/typecheck-final.log), [lint](../screenshots/actual/locale-switcher/logs/lint-final.log).

## Production performance

The [final raw measurement](../screenshots/actual/locale-switcher/logs/performance-final.json) on the current production build used Chromium at 402×874, DPR 3, local loopback, with fonts and first artwork decoded: FCP/LCP 268 ms, TTFB 69.9 ms, CLS 0. Initial resource transfer was 1,165,767 B: 160,157 B scripts, 726,077 B images and 256,343 B fonts. Ten programmatic toggle mutations had a 0.4 ms median and 21.4 ms maximum. A 160-frame programmatic long scroll had 16.7 ms median/p95 intervals and no frame over 33 ms. These are local synthetic observations, not a Lighthouse score or field INP, and loopback timings do not establish network performance.

The component is a small Client Component; the story and eleven locale routes remain server-rendered/static. No new image files or runtime package dependencies were added for the switcher. Flags use platform emoji, so their exact rendering follows the user's OS.

The first broad native review found a separate document-card defect (CHG-0034), which another task is resolving. The focused native review found three switcher issues: lost focus on repeat selection, modified-click state, and unnecessary locale prefetch. They were corrected, and its final pass found no new actionable issue. The reviewer sandbox could not launch browser checks; the production suite above supplies those results.

The server log also exposed an unrelated missing `/favicon.ico` request (404), tracked as open CHG-0035. Locale route requests answered 200 and isolated locale tests did not add server errors; the favicon request itself reproduced the Next.js `NoFallbackError` log entry.
