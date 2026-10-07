# CHG-0068 — CyberMind verification

2026-10-07. Primary verifier: Codex. Independent auditor: discipline_audit.

## Implemented scope

Two clean941×1672 CyberMind photographs, next/down from HeatCore, horizontal two-slide paging, up/Previous to remembered HeatCore selection. Four/two dots reflect the decoded displayed group; stale/pending transitions and focus when removed controls change are covered. Reopen resets HeatCore first. Last-group Next remains an honest placeholder. CyberMind descriptive text/folios are deferred.

Live semantic React title uses landing **Open Sans Regular400**. Source mapping/generation prompt: [CyberMind map](../../../technology-cybermind-map.md), [generation](generation.md). Local generated wall patches are preserved in design/derived/cybermind-title/{01,02}-wall.png; source masters are unchanged.

## Quality and actual visual evidence

- Native941×1672 RGBA01/RGB02 PNG, compressionLevel0/noICC. assets.json and automated source-mask comparison: both images have zero changed channels outside25134/25169 title-mask pixels and zero changed alpha pixels. Hidden wall under opaque lettering is reconstructed, not provably original; every original product/render pixel outside that mask is retained. No lossy encoding, image resize, thumbnails or WebP photo requests.
- Pro402×874/Max440×956 WebKitDPR3 actuals: pro[-max]-slide-{1,2}.png and calibrated original/live title pairs directly inspected. Source-plane inverse resize explicitly uses fit:fill. Source-font shapes intentionally differ because the user requests Open Sans.
- Separate equivalent source-original/delivered WebKit pages: browser-source-rgb.json, four comparisons have RGB0 outside resampling-guard header envelope. Eight final HeatCore actuals have fullRGB0 against accepted CHG-0067 (heatcore-rgb.json).
- New small brown descriptor initially failed native-backing contrast2.76/3.87; thin1.5sourcepx white SVG stroke added only to CyberMind. Brown/white ratio5.212 in contrast.json, actual computed stroke checked across29states. This is scoped glyph evidence, not a complete WCAG certification.

## Behavior and static checks

- browser-tests.log: **68/68** across Pro/Max WebKitDPR3, desktop Chromium/Firefox. Both CTAs, swipe/top/dots/down/up, remembered group, keyboard/RTL, placeholder, X/Escape/focus/scroll restore, nativePNG/source mask/HTTP identity, early opening,2+4 staged requests, pending/decoded cache/offline, failed warm retry, rapid/repeated/reversed delayed group changes and focus after removed dots/Previous.
- integration-final.log: **4/4** shared dialog/CTA/native accessibility integration.
- adaptation.json/log: **29states** including all11locales×Pro/Max,320×700,13Pro390×664/732/844,Arabic390×664,tablet768×1024,844×390landscape. New44pxPrevious stays inside viewport and separate from Next; two dots/no CyberMind descriptions, no overflow or page errors. Existing short-landscape toolbar overlap CHG-0066 remains OPEN; the matrix does not certify full landscape composition.
- typecheck-final.log/lint-final.log: independent exit0. build-final.log:14static routes,exit0. native-review-final.log: native `codex review --uncommitted`,exit0,no actionable findings after pending-group/focus corrections.
- Historical failed QA/native findings and before-fix focus evidence remain alongside final passing logs; no failed attempt is counted PASS. Controlled EVAL-VIEWER agent behavior run remains NOT_RUN.

## Production measurement

measure.mjs against fresh local production build; performance.json/log, corrected actual click capture and observer readiness. Initial flawed measurements retained as performance-attempt-1.*. First-open measure includes browser automation observation after actual click and two paint frames; automation locator travel/setup is recorded separately and excluded. Cached action duration is entirely in-page click/decode/two RAF, not field INP.

| Measurement | Local | Synthetic4Mbps/100ms |
|---|---:|---:|
| FCP / LCP |188 /188ms|328 /328ms|
| CLS |0|0.000222|
| JS transferred |160697B|160697B|
| Scroll frame p95 / >33ms |16.8ms /0|16.7ms /0|
| Cached actions |27.3–33.1ms|29.1–32.8ms|
| Actual click → first decoded image / observed paint |120ms|133ms|

First2 low-priority original requests start after load (local245ms after227ms; synthetic3184ms after3181ms). Remaining4 start on actual viewer opening in parallel. Six retained Image instances, no duplicates/errors. Accepted JS159607B →160697B (+1090B). Full original photos transfer29954230B including headers, of which11034734B native payload is the first pair and18917696B remaining four. On synthetic cold long-scroll connection, first pair finishes36.98sec and all six are observed ready75.44sec from page navigation. Original-quality policy therefore has a material cold-network cost; readiness before immediate opening is conditional. No field web-vital/INP/Lighthouse or hardware Telegram-toolbar claim.

## Gate status and limits

Independent scope, final actual visual, behavior/adaptation and review/performance PASS. Primary scoped technical approval APPROVED on2026-10-07; final record/public audit tracked in CHANGELOG CHG-0068. Physical iOS/Telegram browser chrome CHG-0065 remains APPLIED_UNVERIFIED; inherited short-landscape composition CHG-0066 OPEN. User acceptance of CHG-0067 does not approve this new group. Public exact-SHA delivery evidence follows release.
