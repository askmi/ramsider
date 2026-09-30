# FAQ wheel scroll chaining — CHG-0024, 2026-09-30

**Historical report:** CHG-0026/0027 subsequently replace the inner answer viewport with natural document flow and independent −/× icons. See [current FAQ flow evidence](fix-faq-flow.md). The earlier checks below describe their historical implementation.

## Defect and cause

Pointer over a closed FAQ card stopped document scrolling. The agent introduced `overscroll-behavior:contain` on the fixed-height, internally scrollable `.faq-stack` during the earlier FAQ repair. That blocked wheel propagation to the page, including when all answers were closed. There is no hover CSS change causing this. Previous tests opened questions and used keyboard/scrollIntoView, but did not exercise real wheel input and boundary chaining. This is an agent implementation and verification error, related to CHG-0011.

## Fix

Removed that containment declaration; native `auto` scroll chaining applies. Closed rows allow page scrolling. Expanded answers retain their inner scroll range; a new gesture at the top/bottom boundary continues on the page. No JavaScript wheel interception, layout, font, artwork or answer-copy change was added. Firefox can retain an active wheel transaction on its initial target; the regression test separates gestures at boundaries rather than treating a still-active transaction as a new gesture.

## Evidence

Artifacts: `screenshots/actual/faq-scroll/` (local, Git-ignored).

- Before fix, Chromium `before-test.log` records actual document delta 0 under a closed card. Initial browser launch was sandbox-blocked and rerun with permission; this was not counted as reproduction. An initial test-positioning race with smooth scrolling was corrected with instant positioning before the real wheel input.
- `tests/e2e/site.spec.ts` adds real wheel checks in both directions over each of six closed questions, then inner scrolling and both open-container boundaries, in English and Arabic.
- **Input limitation:** Playwright mobile WebKit rejects `mouse.wheel`. The wheel-only describe uses desktop input at the configured viewports/DPR: WebKit402×874 and440×956 DPR3; Chromium/Firefox1440×900. Existing mobile visual, tap and keyboard tests remain genuine mobile WebKit. No physical trackpad or mobile touch-swipe claim is made.
- First expanded-boundary Firefox check failed while the preceding transaction remained active. Explicit separation between gestures fixed the test; no further application change was necessary. Initial results are retained in `first-tests.log`, `wheel-tests.log`; `firefox-wheel.log` passed.
- Real mobile WebKit captures before/after include English and Arabic, Pro402×874 and ProMax440×956 DPR3, closed/open-first/open-last/all-open states. All 16 image pairs have identical decoded pixels (`visual-unchanged.json`). Clean/composite reference crops were inspected, along with actual Pro/Max and Arabic states. Six-row spacing, account separation, keyboard open/close and account action passed in four locale/device cases (`after-checks.json`). This proves no appearance regression from the CSS change, not exact raster equality with the design render.
- Typecheck, lint and production build passed; final browser suite passed 16/16 in29.2s (`final-tests.log`). Initial native review reported P1 unsupported mobile wheel and P2 Firefox transaction reliability; both were fixed as described above and rechecked. Final focused native `codex review` matched the corrected patch/current files and reported no actionable regression (`final-review.log`). No rendering strategy or JS payload changed.
- Production localhost Chromium402×874 DPR3,4×CPU: cold FCP/LCP240ms, CLS0; transferred1,187,994B including151,430B JavaScript. Normal-CPU long-scroll162frames, p95 17.5ms, none above33ms. No network throttling, INP or Lighthouse measurement; native hardware trackpad latency not measured. See `performance.json`.

Previously open outer artwork seam CHG-0014 and feature pictograms CHG-0015 are unaffected.

Independent discipline auditor: scope, visual, behavior, performance and final closeout **PASS** (2026-09-30). CHG-0024 technically approved; user acceptance remains not recorded.
