# Async technology warm-up — CHG-0064, 2026-10-07

## Scope and method

User requests all four accepted original PNGs asynchronously after the main page loads. `TechnologyViewer` starts four low-priority Image/decode promises in one post-window-load task, including hydration after readyState complete. A retained per-instance cache reuses pending/decoded images. Early opening starts the same cache immediately and promotes slide1; selection promotes its target. Failed entries are evicted, enabling retry without skipping a slide. An already visible decoded slide stays until the selected image is ready. No asset encoding, color/profile, dimensions, source, CSS or copy changes.

## Checks

- [Production viewer suite](browser-tests.log):40/40 PASS on Pro402×874/DPR3 and Max440×956/DPR3 WebKit, desktop Chromium/Firefox. Held hero proves zero requests before window load; holding every photo response proves all4 start independently before opening. Early opening before load is checked. Retained decoded resources work offline for all4 selections/reopening; exactly4 preloader Image instances remain. Original accepted delivery SHA/master SHA/HTTP equality and RGB outside authorized title masks pass; PNG941×1672 RGB, noICC, no photoWebP.
- [Strengthened recovery](recovery-tests.log):4/4 PASS after adding failed user selection, verifying unchanged decoded photo/description/active dot, then retrying the same image. [Integration](integration.log):4/4 PASS for both entry points and keyboard focus containment/restoration.
- Eight final actuals: [Pro1](pro-slide-1.png),[2](pro-slide-2.png),[3](pro-slide-3.png),[4](pro-slide-4.png); [Max1](pro-max-slide-1.png),[2](pro-max-slide-2.png),[3](pro-max-slide-3.png),[4](pro-max-slide-4.png). [Full browser RGB comparison](visual-diff.json):0 changed channels/max error0 against all8 accepted CHG0063 captures. Primary inspected Pro1/Max4; independent auditor directly viewed all8 and passed Stage3.
- [Typecheck](typecheck.log),[lint](lint.log),[build](build.log):PASS;14 static routes. [Native review](native-review.log):no actionable code/test defect. Later strengthened recovery tests also pass; no runtime code changed after production build.
- User's existing local IAB tab3021 was reloaded and gallery opened; live semantic caption/header/4dots/X observed. No visual layout or locale keys change; prior all11locale layout evidence remains applicable, affected Arabic controls retested in current suite.

## Performance and tradeoff

[Reproducible measurement](measure.mjs), run from repo root with Node; [results](performance.json). Chromium402×874 DPR3 production3021. Single samples, no fieldINP/Lighthouse or physical-device guarantee.

| Sample | FCP/LCP | window load | CLS | Scroll p95 | >33ms frames |
| --- | --- | --- | --- | --- | --- |
| Local warmed |120ms|153.6ms|0|16.7ms|0|
|4Mbps +100ms warmed|340ms|3187ms|0.000222|16.7ms|0|
|4Mbps +100ms warm-up disabled control|336ms|3177.5ms|0.000222|16.8ms|0|

Control intercepts only detached preloader Image assignments to omit their downloads; page code and landing requests remain the same. In the constrained warmed sample, four requests start3192.0–3192.2ms (after load), complete52749–52758ms while cold scrolling also requests landing art. All4 original files total18,917,696B, HTTP transfer18,918,896B. Parallel requests shorten the user-triggered wait after warm-up, but contend for post-load bandwidth and cannot promise readiness before an immediate opening on slow/stalled connections. That payload/quality tradeoff is explicitly user requested. FCP/LCP and scroll samples show no material initial-render or frame-time regression. ReadyMs is sampled after the scrolling task and image/decode wait, not a measured first-decode timestamp; use responseEnd for transfer completion. Cached switching including two painted frames: local18.4–34ms, constrained24.6–34ms. JS159,607B (+209B vsCHG0063); pageerrors0. First-view photos start only after load; prior 0initialtechrequest policy is superseded.

## Approval

Codex primary verifier technical approval APPROVED on2026-10-07. Independent scope, visualStage3, behavior/adaptationStage4 and review/performanceStage5 PASS after reading actual evidence. Independent final staged record audit PASS; [final native review](native-review-final.log) including strengthened recovery tests found no actionable regression. Commit/deployment verification follows. User acceptance NOT_RECORDED.

## Public delivery

Runtime commit4454538ed0800e7d0f8dfaf9ea4d0ea985f98313 pushed to main and feature branch; Vercel Production–ramsider deployment6904565764 success. Canonical https://ramsider-main.vercel.app/en [live checks](public-demo-checks.json): Pro/Max DPR3 all4PNG byte/hash identity, post-window-load requests before dialog opens, eightfullRGB actualcomparisons0changedchannels against the corresponding portable localcaptures, controls/captions/folioabsence/errors0 PASS. Independent public release audit PASS on2026-10-07. First temporaryinspector importfailedlocalpackageinternalpath; correctedpackageexports resolution and repeatedrealchecks; failedattempt excluded. Publication record closure is documentation only; main runtime remains4454538.
