# CHG-0067 — full-width mobile portrait contour

2026-10-07. Founder updated the mobile composition: metal reaches the screen side boundaries; remove only exterior black side strips. Original composite is a guide, with this explicit horizontal change superseding its inset. CSS override is limited to portrait widths below700CSSpx. Tablet/desktop/landscape retain accepted geometry.

## Source mapping

Frame941×1628, nontransparent outeredge x0..940, openingx29:912. Frameleft0/width100%; photo stageleft29/941,width883/941. Vertical top9.64221%/height80.71559% retained with its existing stage mapping. No source assets, encoding, profiles, PNG bytes, frame art, font files or loading changes. CSS-only, artwork conversion pipeline N/A.

## Actual browser evidence

- WebKit Pro402×874 andMax440×956 DPR3, allfour slides captured. Primary inspects actual composition and cutout seams; saved customer screenshot and source-contour references support comparison.
-48viewer and4shared-dialog integration tests PASS, including meaningful frame bounds/metaledgepixel check, inner opening alignment, bothentrypoints/swipes/taps/dots/keyboard/close/focus/RTL/retry/cache/placeholder/backing and unchanged originalPNG hashes. Baseline frame-boundary test fails before override, retained in before.log.
-390×664/732/844 portrait content heights, live resizing,Arabic390×664,768×1024 tablet and844×390 landscape documentbehavior checked; no overflow/pageerrors. Landscape retains known separate0066issue.
-Eight Pro/Max top/bottom regions unchanged, decoded RGB0 versus0065 (controls-diff.json). This does not claim the newly widened frame/photo is identical to old screenshots.
-Secondary source-contour comparison: MAE1.02Pro/1.49Max,p9923/33. Thin-edge differences reflect rounded fractionalverticalplacement and Sharp/browser resampling; direct source/actual seam inspection is the visual criterion, not RGB0 or automatic threshold approval.

## Code and speed

Typecheck/lint/production build each exit0;14static routes. Native review reports no actionable regression. Local production measurement FCP/LCP116ms,CLS0,JS159607B unchanged,scrollp9516.7ms/0frames>33ms,cached switching30.8–34.1ms. Four originalPNG starts156.8ms after load139.5ms. Local measurements only, no fieldINP or Lighthouse95claim.

## Limits

Native Telegram/iPhone chrome unavailable, unrelated0065 symptom remainsAPPLIED_UNVERIFIED. Short landscape0066OPEN. Scope here is the newly requested mobile portrait frame boundary. Explicit customer acceptance NOT_RECORDED. Controlled EVAL-VIEWER NOT_RUN; existing source-plane/seam lessons retrieved and applied. Updated design input is not classified as a new agent defect. Independent gates and dated technical approval are recorded in CHANGELOG.

## Dated technical approval

2026-10-07: Codex primary verifier APPROVED for the scoped portrait boundary change. Independent discipline_audit scope, actual visual, behavior/adaptation and code/review/performance gates PASS after direct artifact inspection. Final staged record audit and exact-SHA public verification follow in CHANGELOG. Separate native-browser and short-landscape limitations above remain.

## Public release

Runtime bc20c4efffa492258c79b3be0bd91f4f908883b1, Vercel Production–ramsider6909034211 success; exact remote main/feature SHA confirmed. Canonical demo checked on13Pro390×664,Pro402×874,Max440×956 WebKitDPR3: allfour actual PNG response bodies byte-identical, contour/cutout bounds, black document backing and close restoration PASS, no errors. Eight Pro/Max public full screenshots have0changedRGB channels versus new approved local actuals. Primary directly viewed public13Pro actual. public-checks.json/log and deployment/statuses.json record proof. Public first-attempt5s cold image readiness assertion failed; retained log, no PASS inferred. Bounded real response/body barrier rerun exit0 with no runtime change; existing lesson/eval protocol extended, controlled run NOT_RUN. This checks warm navigation, while the production viewer suite separately covers delayed/failed cold requests. Independent release audit follows in journal.

2026-10-07 independent discipline_audit public release PASS after actual public13Pro/Pro/Max images, PNG hashes/bytes, RGB0 and exact deployment/status inspection. Native final delivery review exit0/no actionable regression.
