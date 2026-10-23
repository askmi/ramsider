# CHG0134 — Preview-first loading implementation

Implementation authorized 2026-10-23. VERIFIED locally2026-10-23. Independent scope/preview, ready visual/geometry, behavior/adaptation, review/performance and final record gates passed. The earlier research-only status and obsolete all-story barriers are historical.

## Delivered behavior

- All63 substantial raster blocks/slides have inline blurred previews, including main hero and every optional section/technology group. No extra preview HTTP request. Initial HTML must still arrive and the browser must decode it.
- Existing final artwork90files is unchanged byte-for-byte. Tiny derivatives are generated from PNG masters with delivery sRGB ICC, controlled decoded color/alpha and no source mutation.
- A shared deduplicated queue admits at most3 managed transfers, at most1 near and1 far job. No new far original starts while foreground demand is active. Existing transfers finish without restart; visibility/selection owns priority, and Close demotes abandoned demand. Native preloaded hero is a separate early request.
- With preview: progressively resisted forward scroll/paced technical navigation while original loads. Ready content retains native movement. Reverse/Close remain usable. With neither preview nor original: frosted72px milk circle rotates clockwise and forward motion is bounded. Real byte progress shrinks it; unknown total retains radius until decoded completion. Reduced motion removes spin/inertia. Failure offers localized Retry.
- All originals are decoded before detail replacement; source aspect/reading position preserved. Closed optional sections do not eagerly fetch all originals. Early prehydration CTA input is replayed once listeners are ready.

## Asset costs

63 preview files total118,122B (115.35KiB), including pinned ICC. Individual files792–5,254B. First Wellness preview1,956B. Data URLs sum159,013 characters before HTML/RSC duplication and compression. These bytes are additional to any originals eventually viewed, not original-file savings.

## Evidence

- [Preview export receipt](preview-export.json):63 actual exports, PNG/source/delivery hashes, decoded control, ICC/alpha.
- [Verification receipt](verification.json):90 unchanged original hashes, runtime hashes, gates and limitations.
- [Ready comparison](ready-comparison.json):Pro/Max Wellness/technology exact in captured ready views; main/charcoal small glyph-antialias differences visually reviewed. Geometry and source art unchanged.
- [Assembled traversal](assembled-browser.json):Pro/Max whole-page traversal; [coverage migration](coverage-migration.md) distinguishes retired opposite-policy tests from valid retained regressions.
- Actual screenshots under `screenshots/loading-flow/`: ready/pending/failed, known streamed progress, shared EN/AR/reduced-motion, Pro/Max, short/tablet/desktop, technology bottom access.

## Performance and verification

Production Chromium402×874 DPR3, cold cache. Baseline is GitHEAD with the same current4 Wellness WebPs; both builds use Turbopack. Optional view opened4s after navigation; preview/final readiness sampled per animation frame. One synthetic trial per condition; after4Mbps repeated alone to exclude possible compiler overlap, earlier trial retained. These figures are not field guarantees.

| Condition / measurement | Before | After |
| --- | ---: | ---: |
| 4Mbps /100ms /4×CPU, main LCP | 2,404ms | 948ms |
| Same, FCP | 356ms | 576ms |
| Same, first Wellness preview/ready photo after click | 16,488.7ms | 7.5ms |
| Same, first Wellness full original after click | 16,488.7ms | 5,687.9ms |
| Same, completed transferred bytes at first full Wellness image | 8,765,843B | 3,352,743B |
| Same, completed JavaScript bytes | 218,958B | 219,347B |
| Same, CLS | 0 | 0.000222 |
| Same, scroll frame p95,119frames | 16.8ms | 16.8ms |
| Loopback, main LCP | 528ms | 128ms |
| Loopback, first Wellness preview/ready photo | 62.2ms | 1.7ms |
| Loopback, first full Wellness photo | 62.3ms | 88.4ms |

The added inline previews increase compressed HTML from164,963B to229,849B; this run shows220ms slower slow-network FCP while main LCP is1,456ms earlier. On a fast local connection the new full photo is26.1ms later; preview is already available. Completed-byte totals above are measured at different times when the first optional original becomes ready, not total eventual payload savings. Existing originals retain their full cost. Frame samples over33ms: baseline2/new3; too few samples to infer a smoothness improvement. No additional runtime optimization justified from this isolated noise.

[Raw performance receipt](performance.json), [preceding trial](performance-replay.json). Main runtime build/type/lint passed; native reviews fixed all actionable findings with scoped clean rereviews. Core75PASS/9explicitSKIP, admission affected36PASS/2SKIP plus4engine lane recheckPASS, ready5size adaptation1PASS. Retained regression53PASS/10explicitSKIP plus corrected narrowRetry1PASS; historical fixture failures preserved in CHG0134. [Check receipt](checks.json) distinguishes scopes/skips and recovery. Independent behaviorGate4 and review/performanceGate5 PASS /root/loading_final_auditor2026-10-23; prior scope/previewPASS /root/loading_research_auditor and readyGate3PASS /root/loading_delivery_auditor. Full technical approval /root2026-10-23 for actual implementation/checks; final recordGate6 PASS /root/loading_final_auditor2026-10-23. No physical Safari/Telegram chrome, field INP or Lighthouse score is claimed. Product QA does not certify improved agent behavior; controlled EVAL-VIEWER remains NOT_RUN. User result approval NOT_RECORDED. Implementation-stage checks did not publish; owner subsequently authorized publication below.

## Publication authorization — 2026-10-23

Owner now explicitly requests deployment. Verified CHG0134 plus its existing CHG0133 lossless asset dependencies are authorized for origin/main. Exact commit and both known deployment targets will be recorded in [publication receipt](publication.json). Prior no-publication statements describe the implementation stage.
