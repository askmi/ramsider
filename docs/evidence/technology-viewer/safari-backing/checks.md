# CHG-0065 — iOS browser document backing

2026-10-07. User screenshot is iPhone13Pro, probably Telegram in-app browser; exact iOS/container build unknown. Fix changes three CSS rules only: black root/body while viewer open, hide its siblings and descendants inside rendered DialogController wrapper. Original PNG bytes, frame, text, geometry and asynchronous warm-up unchanged. CSS state clears synchronously on close.

## Browser and visual evidence

- Production build on local3021. Configured Pro402×874 and Max440×956 mobile WebKit DPR3; Chromium/Firefox1440×900.
- Viewer44/44 and integration4/4 PASS; original asset/hash/decode checks, both triggers, interactive slides/dots, touch/keyboard, loading/retry/offline/cache, Arabic and focus tested.
- Black document plane even when native modal/backdrop paint is deliberately suppressed, including expanded FAQ icons with explicit visibility. Close restores colors, page height, scroll and focus.
- Eight accepted Pro/Max screenshots unchanged, every decoded RGB channel equal (`visual-diff.json`); actual images inspected by primary and independent auditor.
- iPhone13Pro emulation390×664/732/844, open viewport resizing,844×390 landscape, Arabic390×664, tablet768×1024: document backing/allfour slides/X/focus/overflow/console PASS (`mobile-checks.json`). These viewport heights model content space, not native browser chrome.
- CHG-0066 OPEN: inherited short-landscape top label wraps across frame; no landscape-fidelity claim. Geometry untouched by this fix.

## Code and performance

Build/typecheck/lint pass. Initial wrapper selector failed backing test4/4; corrected against rendered ancestry. Initial typecheck failed TS2339 on injected style Node.remove; explicit HTMLStyleElement annotation corrected and typecheck rechecked independently. Failed evidence retained, not counted as approval. Native review found no actionable regression; final review tracked separately.

Local production Chromium mobile profile: FCP/LCP76ms, CLS0, JS159607B, scrollp9516.8ms/0frames>33ms. Original photo requests start112ms after load101ms;18,918,896B transfer; cached switch23–34ms. Local observations only; previous synthetic slow-network evidence remains in async-warm and no95+Lighthouse claim.

## Native limitation and approval

No physical iPhone / Telegram iOS browser / Safari / installed simctl available. Actual address-toolbar appearance cannot be certified from content emulation. CHG-0065 is APPLIED_UNVERIFIED for the reported native symptom; scoped document correction has primary technical approval. Independent scoped visual PASS; other audit gates recorded in CHANGELOG. User acceptance NOT_RECORDED. Controlled EVAL-VIEWER agent run NOT_RUN.
