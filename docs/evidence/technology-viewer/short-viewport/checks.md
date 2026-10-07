# CHG-0070 — short Safari viewport, 2026-10-07

User evidence: iPhone 13 Pro with expanded Telegram/Safari chrome showed the HeatCore artwork compressed vertically; the companion iPhone 13 screenshot with compact chrome retained its intended proportions.

## Cause and correction

The gallery assigned width from `100vw` and height from `100dvh` independently. At 390×664 CSS px before the fix, WebKit rendered the artwork stage at aspect ratio 0.70850, versus source 941/1672 = 0.56280; its frame rendered at 0.72770, versus 941/1628 = 0.57799. At the same width and 844px height the mismatch was small. `object-fit:fill` and the SVG layout made the distortion visible across the photo, frame and text. The primary agent's prior 13 Pro checks measured edges and image identity, but missed aspect changes at a second browser-chrome height.

The mobile portrait canvas now has width `min(100vw, 100dvh × 0.4667)`. This uses one scale for the entire composition. Short windows get black side space; normal Pro/Pro Max windows retain full width. Artwork files are unchanged.

## Verification

- `before-390x664.png` reproduces the reported deformation. `after-390x664.png`, `after-cybermind-390x664.png`, and `after-320x568.png` were opened and visually inspected: photo/frame/text proportions are coherent, and the controls remain visible.
- Production WebKit DPR3 aspect test PASS at 320×568, 375×667, 390×664/732/844, 402×874, 440×956. The test waits for fonts and artwork decoding, compares rendered stage/frame ratios against source within 0.02, checks Next Technology placement, navigates to CyberMind and closes the viewer. See `aspect-test-final.log`.
- Existing mobile WebKit gallery suite PASS 38/38 (`viewer-suite.log`), including interaction and locale cases. Pro and Pro Max description tests PASS 2/2 (`baseline-visual.log`); their new production screenshots were inspected for composition and clipping. The old description screenshot set predates other changes, so no RGB diff is claimed.
- Typecheck, lint and production build PASS (`typecheck-final.log`, `lint.log`, `build.log`). An initial typecheck ran concurrently with build and encountered the generated `.next/types/routes.js` race; the sequential rerun passed. Native Codex review final exit 0 with no actionable findings (`native-review-final.log`). Its initial P2 about screenshot readiness was repaired by awaiting image decode and rerunning the focused test.
- Local production Chromium 402×874 DPR3 sample: LCP 344ms, CLS 0, JS transfer 161048 bytes, scroll frame p95 16.7ms with 0/159 frames over 33ms (`performance.log`). This is a local sample, not a Lighthouse score or real-device field measurement.

Independent read-only `final_audit` directly inspected the six principal screenshots and logged scope/visual/behavior/review-performance PASS; see CHG-0070 for technical approval. Hardware Safari/Telegram chrome was not controlled directly; WebKit's height-change matrix reproduces the layout mechanism. The side space in a short window is the intended fit tradeoff. Remote deployment is checked separately after push.
