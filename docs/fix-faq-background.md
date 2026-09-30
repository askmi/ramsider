# FAQ background follow-up — CHG-0027 reopened

2026-09-30. User correction overturned the earlier [FAQ flow](fix-faq-flow.md) background approval. The flow and independent icons were working; the surrounding artwork was not.

## Cause and source evidence

The agent used `:has(details[open])` to switch to a central gradient, with the authentic artwork masked to the side gutters. Inter-row gaps and rounded corners exposed the substitute. Both implementation and visual review missed those negative spaces. Responsibility: **AGENT**; the previous technical approval is retained as superseded in CHANGELOG.

Inspected all three supplied Photoshop sources. `fon-.psb` layer35 (descendant1) and `Work-R153.psb` layer35 (descendant19) contain baked FAQ surfaces; the Work base/copy and master smart object also contain cards. No separate card-free matching background layer was found. Inventories and crops are retained in `screenshots/actual/faq-background/`.

## Current implementation

`tools/extract-faq-art.mjs` extracts six lossless full-width row crops from `public/art/09-10.webp`, source Y27147/27326/27505/27683/27861/28037. Each retains the original card, corners and following gap, with four extra source pixels above/below for overlap. Decoded RGBA pixels were checked against all six source crops (`source-crops.txt`). Assets total156,452B and load lazily near FAQ, reusing each URL across slices.

Each closed row renders as one continuous source image. An opened row preserves36px top/bottom caps and extends its98–100px middle behind the answer. Thus existing gaps/corners and other rows keep their source artwork, with no global background change. The opened card also retains its source surface: no flat CSS fill. A tiny adjacent-source-pixel patch masks its baked minus; the live × stays on the summary. This is a source-derived extension for an open state absent from the reference, not a newly supplied design. No extra client JS or nested scroller.

## Evidence

Artifacts in `screenshots/actual/faq-background/` are local and Git-ignored. Preserve them with this workspace.

- Real mobile WebKit402×874 and440×956,DPR3: English/Arabic closed, one, two, close-one and all-open screenshots. Compared clean/composite reference crops, inspected left/center/right gaps, corners, source-surface extension and account join, including enlarged crops. Final visual auditor **PASS** on the source-surface variant.
- Closed-state comparison with the prior browser baseline:0% Pro /0.2214% ProMax at pixelmatch threshold0.15 (`closed-diff.json`); ProMax differences are fractional image-edge rasterization. This regression comparison does not establish pixel equality to the Photoshop reference.
- `check.log`/`checks.json`:16 locale/width cases PASS (all11 locales at402;en/ar440;en375/768/1440), no clipped questions/horizontal overflow, independent icons, native page growth and matching downstream targets.
- Final production Chromium402×874,DPR3,4×CPU, unthrottled localhost: cold FCP/LCP244ms, CLS0, transfer1,188,991B, JS151,430B (unchanged), fonts256,343B; warm LCP60ms. Normal-CPU scroll162frames,p95 17.6ms,none >33ms. Action automation107ms is not INP. Earlier local runs520/612ms are retained as performance-first/second.json; final measurement followed the last code and completed browser suite. No controlled internet benchmark or Lighthouse claim. The six FAQ assets add156,452B near FAQ, not the first viewport.
- `unchanged.mjs` captures untouched rows2–6 before/after opening row1, with pixelmatch threshold0.15. Final ten comparisons range0–2.529% (threshold0.15), primarily fractional clipping/glyph rasterization. Small differences can remain from fractional screenshot clipping/glyph rasterization; this is a secondary signal, not exact screenshot equality or a substitute for corner/gap inspection.
- Native review initially identified flat open surfaces and row joins. Source surfaces were restored and closed rows simplified to a single crop; source bleed covers fractional joins. Final native follow-up `final-review.log`: **no remaining actionable findings**. Final suite **16/16 PASS33.9s**, typecheck/lint/build **PASS**. Code/assets are fingerprinted in `implementation-sha256.json`.

## Internal failures and limits

An initial decorative image inside native `details` was hidden when closed; it was moved to the outer row wrapper. Slice boundaries revealed the page color; four-pixel source bleed fixed them. One audit FAIL used a stale zoom crop from before the bleed fix; current zooms are now regenerated automatically with the screenshots, and the subsequent audit passed. The baseline test then waited for intentionally hidden lazy slices; it now waits only for displayed images, while separate open-state captures load/decode all slices. No failing run counts as a pass.

Technical approval **APPROVED**,2026-09-30: final independent discipline audit PASS after the journal explicitly added missed checks for central/side gaps, rounded corners, untouched rows and account join. User approval **NOT_RECORDED**. CHG-0014/0015/0025 remain open. EVAL-FAQ now requires checking corner/central-gap backgrounds, but controlled Agent Eval remains NOT_RUN.
