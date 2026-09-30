# Independent FAQ icons and document flow — CHG-0026/0027

**2026-09-30 follow-up:** the initial background approval below was overturned by user evidence. Side-only artwork plus a central gradient changed gaps/corners on expansion. [Background correction](fix-faq-background.md) is the current solution; the following first-pass evidence remains historical.

2026-09-30. Supersedes the expanded-state layout in [initial FAQ correction](fix-faq-accordion.md) and [wheel correction](fix-faq-scroll.md).

## Defects and cause

The agent used conventional plus/minus signs with a shared `:has(details[open])` state, although the user requires closed **−**, open **×**, independently for each question. The fixed-height answer viewport was chosen to preserve the original absolute-coordinate canvas. Removing scroll containment in CHG-0024 restored propagation but left an internal scrollbar. Both defects are agent implementation/verification failures: closed screenshots and isolated opening checks did not cover the actual 0/1/2/all-open experience.

## Applied correction

- Independent native `details`, each summary opens/closes only its own answer. Closed cards keep their source minus; open cards show ×. Mouse, keyboard and native disclosure semantics are retained.
- Source Y27147–28207 becomes a natural-height grid row between the prefix and suffix. Answers increase document height; all suffix artwork, localized text and action targets move together. No fixed FAQ viewport, inner scroll range, wheel handler or extra client JavaScript.
- A child spacer preserves source geometry even when the desktop canvas stops at941px. Both physical margins preserve artwork alignment in RTL.
- Original closed artwork stays continuous. Expanded side gutters reuse one continuous source image stretched over the added answer height; individual source crops are restricted to still-closed cards. One flat backing per open card prevents fractional summary/answer seams. This adapts an expanded state absent from the supplied reference; it is not a claim that an open-state design exists.
- Later artwork remains lazy. An early CSS-background approach eagerly loaded an extra406KB; the final image-based closed background restores the prior first-viewport transfer. The artwork request is shared when the section becomes visible.

## Verification

Local artifacts: `screenshots/actual/faq-flow/` (Git-ignored; preserve alongside the workspace for future audit). `change.patch` records the precise task delta; `implementation-sha256.json` identifies the verified code.

- Real mobile WebKit **402×874** and **440×956**, DPR3: inspected English and Arabic screenshots for closed, one, two, close-one and all-open states. Clean/composite source crops from the previous FAQ correction were reused as reference evidence. Closed screenshot difference from the previously corrected page: **0.1034% Pro, 0% Pro Max** at pixelmatch threshold0.15 (`closed-diff.json`); this is a regression comparison, not proof of exact equality to the original design.
- `checks.json`: **16 locale/width cases PASS** — all11 locales at402px, English/Arabic at440px, English at375/768/1440px. No horizontal overflow, clipped question text or inner FAQ range. Account/final section displacement matches FAQ growth; project modal target remains reachable.
- `tests/e2e/site.spec.ts`: **16/16 PASS,36.6s** (`final-tests.log`), mobile WebKit Pro/Max and desktop Chromium/Firefox. Checks source-scaled closed canvas height, independent icons, multiple answers, close-by-cross, Space/Enter, downstream geometry, account/project actions, focus/dialog behavior and real wheel up/down over all six closed and expanded rows in English/Arabic.
- WebKit wheel tests use desktop input at the mobile viewport/DPR because Playwright mobile WebKit does not support wheel injection. Separate mobile screenshot/interaction tests remain mobile. No physical trackpad or touch-swipe latency measurement is claimed.
- Typecheck, lint and production build PASS (`typecheck.log`, `lint.log`, `build.log`). All11 locale pages remain statically generated; no client-boundary change was needed.
- Production Chromium402×874 DPR3,4×CPU, unthrottled localhost: cold FCP/LCP248ms, CLS0, transfer1,188,026B (JS151,430B, fonts256,343B); warm LCP60ms/CLS0. Normal-CPU scroll162frames, p95 17.6ms, none >33ms. Action automation106ms includes Playwright overhead and is **not INP**. No Lighthouse or internet-network claim (`performance.json`).

## Failed iterations retained

A `.tsx` source backup was accidentally included by TypeScript and renamed `.txt`. A container querying its own `cqw` caused excess desktop height; a child spacer and height assertion fixed it. RTL alignment needed both physical margins. Capture readiness needed lazy-image load/decode and a paint wait. Visual audit rejected a flat full-width backdrop; a subsequent native review and audit rejected stretched3px gap strips causing repeated seams. Those strip assets were removed. A continuous side backdrop and whole-card backing removed the visible artifacts; final visual auditor **PASS** after viewing the actual screenshots.

## Approval and limits

Final focused native `codex review` completed without actionable findings (`verified-review.log`), covering the exact task diff/current implementation and final screenshots. Independent visual, behavior/adaptation and static/build/performance audit: **PASS**. Final independent journal/document closeout: **PASS**,2026-09-30. Main agent technical approval: **APPROVED**; CHG-0026/0027 **VERIFIED**. Final checks confirmed27 unique journal IDs,14 required fields per record, local links/status consistency and unchanged implementation fingerprints. User acceptance: **NOT_RECORDED**. Product answers remain unconfirmed in supplied materials; existing localized explanatory copy is unchanged. Pre-existing outer artwork seam CHG-0014, feature pictograms CHG-0015 and cursor-overlay investigation CHG-0025 remain open and are not closed by this fix. Agent Eval EVAL-FAQ now includes the new requirements, but remains **NOT_RUN** as a controlled agent-behavior evaluation.
