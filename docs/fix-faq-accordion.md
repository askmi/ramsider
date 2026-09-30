# FAQ accordion correction — 2026-09-30

**Historical report:** CHG-0026/0027 subsequently replace the inner answer viewport with natural document flow and independent −/× icons. See [current FAQ flow evidence](fix-faq-flow.md). The earlier checks below describe their historical implementation.

## Defect and source

User reported doubled and vertically displaced FAQ cards under “The Details, Made Clear. / Before You Choose.” The controls are FAQ accordion items, implemented with semantic `details` / `summary`.

The clean `design/references/background.png` already contains all six rounded card surfaces **and their gold minus marks**. The previous implementation added another fill, shadow and minus, used a narrower box, and repeated an approximate step that drifted downward. This was a material defect; the earlier description as a small tint difference was incorrect. `background_text.png` remains the visual authority for the closed English state.

## Correction

- Closed HTML rows have no fill or shadow; only live localized question text is added to the source artwork. HTML symbols are hidden while all items are closed.
- Row bounds are measured independently in 941 px source coordinates: x61, width829; tops **27147, 27326, 27505, 27683, 27861, 28037**; heights **172, 171, 171, 171, 170, 170**. Gaps are **7, 8, 7, 7, 6** source px, not an approximate repeated 14 px gap.
- Questions use supplied Open Sans Regular, 34 source px, a calibrated baseline and x111 text inset. FAQ heading/subtitle coordinates were aligned to the composite as well.
- Closed Arabic rows reserve a right gutter for the baked minus; expanded rows use a live direction-aware indicator.
- Native accordion expansion stays within the same 1060-source-pixel viewport. A single opaque backing masks the fixed artwork only while an answer is open, then one set of HTML cards flows and scrolls within that viewport. Answers remain readable and account cards are not displaced or covered. No open-state reference was supplied.
- A visible image join crossed the fifth card. `public/art/09-10.webp` now contains source crop `(0,25200,941,30800)`, WebP quality90/method6, replacing the two separately rendered tiles in the image list. Eleven active tiles preserve total source height32127; first-viewport image loading is unchanged. The originals are retained.

## Evidence

Evidence is stored in `screenshots/actual/faq-fix/`. Pro uses 402 × 874, Pro Max440 × 956, both WebKit/DPR3. Fonts and the affected artwork were awaited. `comparison-402.png` places the uniformly resized composite on the left and actual browser crop on the right. Crop source span is Y26890–28530. `faq-reference.png`, `faq-actual.png`, `diff.png` focus on the six rows.

The aligned six-row diagnostic diff is **3.627%** at threshold0.15 with anti-alias pixels excluded; it is predominantly text rasterization. This is supporting evidence, not a numerical completion threshold. No pixel-perfect or full WCAG claim is made. The added “RAMSIDER Business” title follows its separately approved supplemental reference.

## Final verification

- **16 locale/width cases passed:** eleven locales at 402; English and Arabic at 440; English at 375, 768 and 1440. All six rows were exercised with pointer, Enter and Space; answers, multi-open scrolling, visible focus, icon gutters and account access were checked. `checks.json` records no clipping, overflow, row overlap or account obstruction.
- English Pro/Pro Max closed/open states and Arabic Pro/Pro Max closed/open states were viewed. Independent auditor passed the reopened visual/behavior gate only after the duplicated surfaces, internal tile seam and RTL icon overlap were fixed.
- **12/12** tests passed in 17.1s across Pro WebKit, Pro Max WebKit, desktop Chromium and Firefox. Full-page screenshots were recaptured after scrolling/decoding artwork; affected integration boundaries were also inspected.
- `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` passed. Eleven locale routes remain SSG. Focused native `codex review` inspected the exact task patch and affected files: **no actionable bug introduced by the diff**. The reviewer did not rerun browser tests; browser evidence is from the main session.
- Local production Chromium at 402×874/DPR3, 4× CPU, unthrottled loopback: cold FCP172ms/LCP272ms, warm LCP64ms, CLS0. Cold transfer1,187,994B; JS151,430B and fonts256,343B unchanged. Normal-CPU scroll162frames, p95 16.9ms, no frame over33ms. Automated action84ms includes Playwright overhead and is not INP. No Lighthouse score is claimed.
- The combined lazy artwork is397KiB versus about251KiB for its two predecessors, trading about146KiB below the fold for better rendering and no internal FAQ join. Initial viewport transfer/JS remains effectively unchanged.
- Artifacts include `comparison-402.png`, `en-402-closed.png`, `en-440-closed.png`, `ar-402-closed.png`, `ar-440-closed.png`, corresponding `open-0`, `open-5`, `all-open` captures, `checks.json`, `diff.json`, `review.log`, `performance.json`, the actual task `change.patch` and `implementation-sha256.json`.

## Remaining boundary

The FAQ's double surfaces, drift, duplicate symbols and internal image seam are fixed. A thin **pre-existing** image boundary at source Y25200, above this FAQ section, remains; `outer-join-baseline.png` compares the prior image on the left with the current image on the right and shows that same line. It is not a new regression or a claimed fix in this FAQ task. The final source Y30800 join was also inspected. Glyph rasterization differs slightly from the PNG; unsupported FAQ answers still use the localized availability text rather than invented product facts.

The prior font/button report's FAQ acceptance is explicitly superseded by this correction. `LESSONS.md` records the root cause and the rule to treat doubled contours, drift and overlap as material failures.

Independent discipline auditor final closeout: **PASS** after inspecting final artifacts, review results and reconciled documentation. No implementation changes followed this pass.
