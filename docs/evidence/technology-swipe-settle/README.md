# CHG-0106 motion correction evidence — 2026-10-13

`browser.json`, `performance.json`, `checks.json` describe the first .94→1/140ms attempt, rejected by the user as imperceptible. They are historical evidence, not approval of current motion.

Current correction: `corrected-browser.json`, `corrected-performance.json`, `corrected-checks.json`; permanent painted-frame regression `tests/e2e/technology-transition.spec.ts`. No image-source edits or typography/icon optimization.

Ignored local screenshots: `screenshots/technology-swipe-settle/corrected-{pro,max}-{photo,group,scrolled-group}-{old,zero,mid,end}.png`, corrected hero/Capsule2/Arabic. Actual IAB unpaused sequence `iab-live-{0..19}.png`, montage `iab-live-comparison.png`: old frame0, mixed frame4, settled frame8 onward. Native View Transitions unavailable on that surface; implementation uses ordinary WAAPI.

Pausing an actual animation supplies deterministic pixel endpoints on WebKit. Six t0 planes equal previous rendered viewport byte-for-byte; six midpoints match alpha compositing within1.5/255 mean RGB error and differ from both endpoints. Pro/Max settled hero/Capsule2 each equal original pre-typography baseline (0 changed channels). Root and independent auditor inspected actual images.

Historical failures are in CHANGELOG: first effect rejected; transient planes interfered with settled-test selectors; initial temporal Buffer recursive matcher timed out; CyberMind 11-locale matrix needed120s after explicit settling barriers. All affected final reruns pass. Initial perf harness waited whole-page load rather than first useful DOM, then closed-state assertion preceded queued close event; final measurement uses DOMContentLoaded and waits snapshot removal.

Physical Safari, INP, Lighthouse and controlled agent-behavior evaluation are not claimed. No commit or push performed.
