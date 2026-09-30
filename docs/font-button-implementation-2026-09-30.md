# Font and button mapping — implementation verification

**Follow-up, 2026-09-30:** CHG-0004 was reopened after the user found German button text wrapping. The current build uses build-time browser measurements and per-locale SVG widths; the historical checks below did not require a single line. See [localized button correction](fix-localized-buttons.md) for the superseding acceptance evidence.

Date: 2026-09-30. Scope: apply [font/button map](font-button-map.md) to the existing React page and verify the assembled result. No publication or commerce activation is part of this change.

## Applied implementation

- All 14 story CTA entries have deterministic IDs and explicit variants in `lib/button-map.json`. Ten pill surfaces are generated from the supplied `Without_Text` SVGs, preserving source radii, gradients, strokes and arrow paths. Their straight middle width is calibrated to the reference. Labels remain localized HTML.
- Original `Arrow_Right.svg` supplies the complete project circle/arrow. Document/hospitality arrows are shared SVG paths; film play has a filled triangle. Custom technology ellipses, film caption and business outline stay separately mapped. Document, account, FAQ, menu and utility controls also have IDs.
- General text uses supplied static Open Sans Light/Regular; pill labels use the button package's Open Sans Regular. BankGothic, wordmark, UNO/PRO/GOLD hierarchy, MINI/STATION and tracking are assigned by the map. Non-Latin script fallbacks remain explicit where required.
- `Story` and shared SVG markup remain server-rendered. Small menu and dialog event boundaries are Client Components; their children are server-rendered. All eleven locale routes remain statically generated. No runtime mapping library, browser font measurement or new dependency was added.

## Visual evidence

Production WebKit at iPhone 17 Pro **402 × 874, DPR 3** and Pro Max **440 × 956, DPR 3**. Fonts were awaited; English full-page screenshots were taken after scrolling and decoding images. Screenshots use CSS resolution while browser layout/rasterization uses DPR 3.

Reference `background_text.png` is resized uniformly from 941 to 402 CSS px (scale 402/941), without translation, then compared in legible corresponding crops. Source button SVG/PNG/Preview evidence was inspected separately. Pro Max is checked as responsive output, because no separate reference exists.

Evidence directory: [`screenshots/actual/font-button-map/`](../screenshots/actual/font-button-map/).

| Evidence | Files | Result |
| --- | --- | --- |
| Assembled Pro comparison | `compare-0.jpg` through `compare-7.jpg` (reference left, actual right) | All eight bands visually inspected after corrections. |
| All mapped story buttons | `buttons-compare-0.jpg`, `buttons-compare-1.jpg` | Geometry, text placement, radii, arrows, surface treatment and custom silhouettes inspected. |
| Actual full pages | `actual-402.png`, `actual-440.png` | Required mobile compositions inspected. |
| Pro Max / Arabic detail | `max-controls.jpg`, `ar-controls.jpg`, `arabic.png` | Responsive spacing, script fallback and direction inspected. |
| Ten tight pill diffs | `diff-sheet.png`, `pixel-diff.json`, `<id>-reference.png`, `<id>-actual.png`, `<id>-diff.png` | Pixelmatch threshold 0.15, anti-alias pixels excluded; diagnostic differences **8.50–12.93%** in tight crops. No invented numerical pass threshold. |

The remaining tight-crop differences are visible around glyphs and rim rendering: source SVG plus live fonts does not equal the composited raster numerically. The earlier FAQ difference disposition was incorrect: the user identified materially duplicated surfaces and drift. The reopened correction is recorded in [FAQ fix](fix-faq-accordion.md). Untouched decorative feature pictograms remain outside this correction. No pixel-perfect equivalence is claimed. The independent discipline auditor passed the affected font/button visual and behavior gate after inspecting the images and supporting measurements.

## Behavior and adaptation

- `matrix.json`: **44 combinations**, eleven locales × widths **375, 402, 440, 768**; actual layout width and DPR verified, no horizontal overflow or clipped story-button label bounds.
- `interactions.json`: all ten pills' expanded 44 CSS px vertical hit areas tested at both edges on both primary devices; an actual tap outside the visible hero surface also opens its modal.
- **24 actions per primary device** exercised across commerce/model/set/film/business/document/account/project controls, including opening modal dialogs and closing with Escape. Arabic PRO action and Escape also passed.
- Final `npm run test:visual`: **8/8 passed** (Pro WebKit, Pro Max WebKit, desktop Chromium, desktop Firefox), including menu keyboard/anchor behavior, FAQ, account, CTA/document/project behavior, overflow and page errors. Reduced-motion layout was used for stable comparisons; hover/focus styles preserve the mapped surface.
- Labels remain semantic/live text; decorative icons are hidden from accessibility names. These checks do not constitute a full screen-reader or WCAG compliance certification.

## Native review corrections

The first native review found four P2 issues. All were fixed and checked:

1. Both technology CTAs now open a localized seven-feature selector with links to the corresponding source labels.
2. Compare now opens a PRO/GOLD table using the existing translated model details.
3. Menu section links now have at least 44 CSS px touch height.
4. All panels now use native modal `dialog` semantics. Tab/Shift+Tab containment, Escape, close actions and trigger focus restoration pass in WebKit, Chromium and Firefox.

New open-state images are `technology-{en,ar}-{402,440}.png` and `comparison-{en,ar}-{402,440}.png` in the evidence directory. The main verifier inspected these states on both devices and Arabic; the 44-case matrix also checked dialog horizontal bounds. Closed Pro/Pro Max full-page screenshots are pixel-identical to the preceding accepted font/button build; tight diffs were regenerated and retain the same results. Menu and dialog designs have no supplied open-state reference.

## Engineering checks

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed. |
| `npm run build` | Passed; all 11 locales prerendered. |
| Production startup | Passed on local port 3000. |
| Final `npm run test:visual` | 8 passed, 14.8 s. |
| Native `codex review --uncommitted` | Completed after the four corrections: no actionable defect found. Log: `native-review-final.log` in the evidence directory. |
| Architecture/performance | Static routes retained with small menu/dialog event boundaries; source-to-SVG generation runs outside the browser. |

Native review runs in its own sandbox and could not bind/connect to a local server there. The real browser evidence above comes from the main session's running production server; that limitation does not count as a browser-test result from review.

## Production measurements

`performance.json` records local Chromium, 402 × 874, DPR 3. CPU slowed 4× for cold/warm load; local network unthrottled. These are synthetic local timings, not public-mobile-network results. Transfer amounts include HTTP overhead reported by Resource Timing.

| Metric | Cold | Warm |
| --- | ---: | ---: |
| TTFB | 7.4 ms | 4.3 ms |
| FCP / LCP | 220 / 220 ms | 100 / 100 ms |
| CLS | 0 | 0 |
| Transfer | 1,187,514 B | 20,796 B |
| JavaScript transfer | 151,430 B | 0 B |
| Font transfer | 256,343 B | 0 B |
| Long tasks | 2 | 0 |

Normal-CPU long scroll: **162 frames**, median **16.6 ms**, p95 **17.6 ms**, **0 frames over 33 ms**. Hero action automation latency: **90.0 ms**, including Playwright overhead, **not INP**. Font requests confirm the four intended font faces; the former variable Open Sans file is no longer requested. The dialog boundary added 178 transferred JavaScript bytes versus the preceding font/button build (151,252 → 151,430 B); no route-rendering change was justified by these measurements. Cold means a fresh browser cache; the production server was already warm. No Lighthouse score or representative INP measurement is established.

## Independent final closeout

Discipline auditor: **PASS** for review/performance and final integration. The auditor inspected the final native review log, corrected actions/dialog code, new English/Arabic states, comparison images, matrix/interaction/performance artifacts and reconciled documentation. No further implementation changes followed this pass.

## Reproduction and boundaries

- Run `python3 tools/generate-buttons.py` after changing pill geometry/source assignments, then the package check/build/test commands above.
- Diagnostic scripts `check.mjs`, `interaction.mjs`, `performance.mjs`, `diff.mjs`, `compare.py` are retained beside the screenshots. They currently use this workspace and `/tmp/ramsider-button-map` paths; they are an evidence record rather than a portable new test suite.
- The report describes the current uncommitted workspace, tied to `implementation-sha256.json` in the evidence directory; existing user work is preserved. Source/render/map and implementation files are the authorities for this change.
- Product endpoints/media/certificates, translation editorial approval and BankGothic publication rights remain as recorded in `PRODUCT.md` and the mapping. Local dialogs do not establish unavailable services.
