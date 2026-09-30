# Supplemental render fix: RAMSIDER Business

User-approved addition, 2026-09-30.

**Attached reference:** [`design/references/fix_RAMSIDER_BUSINESS.png`](../design/references/fix_RAMSIDER_BUSINESS.png).

This screenshot supplements the main `background_text.png` render: it adds **RAMSIDER Business** to the second dark account card below FAQ, above “Your venue, team and ecosystem.” The heading is absent from the original main render. For this element, the supplemental screenshot takes precedence. The original reference files are preserved.

## Mapping

- Card: `#account-venue`; new live-text element: `#business-account-title`.
- Translation key: `businessAccount`. The branded product name remains **RAMSIDER Business** in every locale; the existing subtitle stays localized.
- Reference coordinates: x112, y28366, width700; Open Sans Regular 400, 32 source px, warm ivory `#f1e1cb`, matching the adjacent “My RAMSIDER” heading.
- The button's accessible name includes the new title and localized subtitle. Existing account dialog behavior is retained.
- At Pro, source coordinates scale by 402/941; at Pro Max, by 440/941. The supplied supplemental screenshot is a cropped 929 × 757 image, so its crop origin is not treated as the whole-page origin.

## Verification

- Production WebKit screenshots inspected against the supplemental image: [Pro 402 × 874](../screenshots/actual/ramsider-business-fix/en-402.png), [Pro Max 440 × 956](../screenshots/actual/ramsider-business-fix/en-440.png), both DPR 3; [Arabic Pro](../screenshots/actual/ramsider-business-fix/ar-402.png). The new heading matches the adjacent heading's hierarchy and sits above its subtitle without overlap. No numerical pixel-equivalence claim for the cropped supplemental image.
- 15 locale/width checks passed: all 11 locales at 402 plus English at 440/375/768/1440. No new title clipping, subtitle overlap or horizontal page overflow. Account dialog opens and Escape closes in all 15 cases.
- Typecheck, lint, production build and `git diff --check` passed. Native review of the exact task patch found no actionable defect; `change.patch` and `review.log` are retained with the screenshots. This is a small text addition; no independent agent or new permanent test was needed.
- Local production measurement (Chromium Pro, 4× CPU, unthrottled loopback): cold LCP 236 ms, warm 60 ms, CLS 0. JS 151,430 B and fonts 256,343 B, unchanged from the preceding build; total cold transfer 1,187,680 B. Scroll p95 17.6 ms, no frames over 33 ms. Automation action latency 88.6 ms is not INP; no Lighthouse claim.
- Evidence directory: [`screenshots/actual/ramsider-business-fix/`](../screenshots/actual/ramsider-business-fix/). Earlier font/button verification remains the baseline for unaffected page regions.

This is an approved new addition absent from the main render, rather than a newly discovered omission from that render; the supplemental-source precedence is recorded here and in `DESIGN.md`.
