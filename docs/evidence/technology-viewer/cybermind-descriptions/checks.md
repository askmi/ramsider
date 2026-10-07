# CyberMind descriptions — CHG-0069, 2026-10-07

Scope: both native941×1672 TEXT refs in `design/references/tech_02/`. User asked for remaining text in Open Sans and omission of bottom photo numbering. Source/copy/coordinate map: `docs/technology-cybermind-description-map.md`. Existing clean PNGs/frame and upper indicators retained.

## Actual image comparison

Final real WebKit DPR3 screenshots: [Pro slide1](pro-slide-1.png), [Pro slide2](pro-slide-2.png), [Max slide1](pro-max-slide-1.png), [Max slide2](pro-max-slide-2.png). Primary and independent discipline auditor directly viewed all four beside both TEXT refs. Initial Stage3 FAIL: five callout headings too light and English paragraphs wrapped differently. Added authentic OpenSans Bold700 to callout headings and source English breaks; recaptured all four. Independent Stage3 re-audit PASS: hierarchy, rules, five icon/leader alignments and lower narrative have no material discrepancy; Pro Max has no clipping. Bottom-left source folios absent on both slides; two top indicators retained. Open Sans glyph shapes differ intentionally from reference font.

## Behavior and adaptation

`browser-final.log`: 6/6 Pro/Max WebKit and desktop Chromium targeted passes; both images/title/controls and 11 locales × two CyberMind slides have bounded text, Arabic RTL and no folios. `viewer-suite.log`: 36/36 mobile WebKit passes, including group transition, keyboard/touch, close/focus, delayed/failed image requests and original PNG identity. Initial sandbox WebKit launch aborted; escalated browser run passed. Initial locale-fit test raced pending group decode; added displayed-group barrier and reran 6/6; failure retained in `locale-fit.log`. `git diff --check` pass. Original public CyberMind PNG files unchanged from HEAD; SHA256 01=`7220cf0c4e6fb181661b0e179afbf0de430bf873bdfa4053530e7df6f0e9239a`, 02=`557c74150a94a9e8251728cdacbdca21f346344fb410d2dbc945c4b82988d1cc`.

## Code and speed

Typecheck/lint/build PASS; 14 static routes. Native `codex review --uncommitted` exit0. One P2 suggested `TextBlock.fit()` retain a smaller font on repeat; primary and independent auditor found it false: every fit starts scale1 and writes requested font size/line height before measuring, including font-ready pass. No runtime change was needed. `performance.json`: local production402×874 DPR3 FCP/LCP88ms, CLS0, JS161048B, scroll p9516.7ms/0 frames>33ms; six original PNGs warmed in two then four stages and reused, no page errors. Synthetic4Mbps+100ms LCP328ms, CLS0.000222, first pair ready37.0s/all6 ready75.4s; network-dependent readiness remains an explicit limit. Field INP/Lighthouse/native hardware pinch unavailable, no score claim.

## Approval

Primary Codex technical approval and independent scope/visual/behavior/review-performance gates recorded in CHANGELOG CHG-0069. The input claims (16+ sensors, app exchange, updates and operation) remain unverified product facts in PRODUCT.md; user acceptance NOT_RECORDED. Existing native Telegram toolbar uncertainty CHG-0065 and short-landscape overlap CHG-0066 remain open independently.
