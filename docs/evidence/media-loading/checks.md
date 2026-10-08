> Historical verification before the CHG-0071 retained-view reopening. Current loading policy and new evidence are in [the existing media plan](../../media-loading-plan.md#landing-retained-view-correction--chg-0071-2026-10-08); earlier approvals below retain their original scope/date.

# Media readiness / founder complaint — delivery record, 2026-10-08

Current stage: VERIFIED local delivery. Source, browser checks, native review, production measurements and final independent record audit passed. Earlier failures are preserved.

## Request coverage

| Request | Implemented result | Evidence |
| --- | --- | --- |
| White under the photo | White frame cutout; exterior remains black, same metal source | Pending/ready Pro/Max and short-height screenshots |
| No partially painted photo or orphan text | Download all bytes, decode retained image, reveal photo/title/descriptions together; previous complete frame retained during transition | Streaming25% test, absent pending image/text, SHA256 of delivered Blob equals original file |
| Simple reusable mechanism | `media-resource`, `MediaLoading`, `PageMediaGate`: shared decode, status and ref-count scroll lock; no new dependency | Actual source/native review; native page and viewer browser tests |
| Protect view while required artwork loads | Pending/error viewer input disabled; page visible artwork gate locks scroll and controls; Close/Retry usable | Touch/pointers, keyboard, desktop wheel, unchanged scroll, focus/close/error checks |
| Honest progress | True byte percent for gallery when reliable Content-Length exists; native-page/unknown size indeterminate |25% held response, accessible progressbar/status, all11locale labels |
| Four HeatCore + two CyberMind | First2pergroup after window load; remaining2 HeatCore on opening; successful transfers/decoded DOM elements reused | Request-order/count, identical element and offline six-photo reuse tests |
| Full-width phone contour without squashed photo | Outer frame spans available width and height between controls; exact941×1672 photo/text inside white; source corners/thickness via nine-slice border | Height matrix, screenshot inspection, native photo/arrow/corner ratio and edge assertions |
| Endpoints + reverse swipes | No modulo wrap, no horizontal group jump; dots/touch/keyboard and RTL work | Both endpoint and reverse/group-memory tests |
| Whole-page integration | Sequential actual scroll with readiness checks, every marked source visited, full composition and primary actions |4profile integration log and assembled Pro/Max crop contact sheets |

## Checks and actual failure routing

- Final production build14SSG routes, TypeScript and lint PASS: `build-final.log`, `typecheck-final.log`, `lint-final.log`. Final production runs on3022.
- **Authoritative final acceptance:** `acceptance-complete.log` **160/160 PASS**, exit0:100viewer/loading +40native-page/fallback +4contrast/reduced-motion +16landing/integration checks across the four profiles. Covers original RGB(A)/SHA identity,11locales/RTL,2+2 post-load warming/remaining2onopen, retained-element/offline reuse, pending/error/Retry, scroll/focus locks, endpoints/reverse, no-JS/initial download failure and actual HTTP200 script throw/rejection fallback.
- Earlier `acceptance-accepted.log`132/132, `integration-accepted.log`4/4 and `accessibility-final.log`12/12 are passing intermediate evidence. Final160 includes these behaviors plus added fallback/older FAQ wheel/EN-RU oval consumers.
- Full-page captures in the final run retain **the exact same two SHA256 values** recorded in `assembled-crops.json`: the reviewed Pro/Max contact sheets still map to current full captures. Main directly viewed current Pro ready, Max bootstrap fallback and Firefoxno-JS readable hero in addition to the assembled/pending/responsive captures.
- Adaptation captured at320×568,390×664,844×390,768×1024,1440×900 plus Pro/Max. Source-ratio photo/title composition, fractional nine-slice corners, arrows, full pagination rectangle, viewport edges and no overflow asserted. Final original `customer-partial.png`/`customer-gutters.png` compared to repaired compositions. No pixel-exact claim against a differently sized physical customer browser screenshot.
- Main verifier directly inspected Pro/Max pending/ready, landscape/tablet and `assembled-pro-contact.png`/`assembled-pro-max-contact.png`; final auditor separately inspected required screenshots. Source/public raster bytes were not edited. Existing calibrated source/mask checks remain; viewer delivery preserves HTTP/Blob bytes and decoded RGB(A).
- Partial runs are not approval: early112/116 and92/96 failures exposed disabled-control focus escape, Firefox native old-request decode, and unsafe opener timing. Smooth scroll continued under the lock on Pro Max; canceled at lock boundary and repeated3/3 before broader rerun.
- `firefox-retry-diagnosis.json`: native decode rejected while currentSrc still pointed to the prior failure; replacement load and successful decode followed. Retry now waits for replacement load/error.
- `firefox-open-scroll-gate.json`: scrolling into held art activates inert/page gate; release then one click opens viewer. Exact historical unthrottled missed click was not captured; harness now waits for the actual loading barrier.
- Real HTTP cache test uses a cacheable local server without page routing. Chromium/Firefox prove corrupt bytes retained without a probe request, Retry fetches new valid bytes, reopen makes no new request. Mobile WebKit did not retain this cross-origin probe; its test records that limitation and verifies retry/reuse instead of claiming cache retention.
- Old integration rapid-scroll/all-image await timed out on Pro/Max; original pending URL unconfirmed. Readiness-aware traversal passed4/4 without runtime change (`integration-diagnosis.json`). An initial bad grep discovered zero tests, preserved separately and corrected; zero tests is not a pass.
- Wider153/160 run failed because old FAQ wheel/oval tests issued input before newly visible media was ready, and truncated-image fixture allowed automatic retries to succeed before explicitRetry. Shared test readiness barrier and failure-until-Retry fixture repaired; final160/160 passed. `acceptance-bootstrap-partial.log` retains failures. Initial reduced-motion WebKit capture timeout and sandbox-launch failure are retained in `accessibility-screenshot-failed.log`/`accessibility-sandbox-blocked.log`; neither was counted as a pass.
- Independent Stage4 screenshot audit rejected tablet/desktop dots crossing the frame, although100tests passed. Header/dots now occupy separate44px rows and adaptation checks the full dot rectangle. Main then found flattened arrow sprites in landscape; arrows now keep source aspect. Final132-case run and fresh actuals passed after fractional nine-slice repair.

## Review, boundaries and performance

Native CLI `/review` examines the actual diff including new source/tests. Earlier first1/group suggestion conflicts with the explicit first2/group request; authorized warming stays, payload is reported. Actionable corrupt HTTP-cache Retry P2, metal-frame stretching P1 and no-JS static blanking P2 were fixed and rechecked. A later P1 pre-hydration execution failure was fixed: synchronous ErrorEvent and unhandled rejection now restore native SSR content before hydration, without treating normal image-resource errors as a reason to unlock. Actual HTTP200 throwing/rejecting script fixtures exercise it. Latest `native-review-final.log` exit0 found no actionable regression in the final diff. Failed reviews remain historical evidence, never clean passes.
Story/copy stays server-rendered/SSG, with a small client wrapper around server children for DOM readiness. Gallery state remains client-only. URL cache and shared status/lock helpers avoid parallel implementations and dependencies. No public/source raster file changes; metal rendering uses the unchanged sRGB derivative. Failed resource URL cache bypass is scoped to failures; successful elements retain bytes/decoded pixels.

Final production metrics: `performance.json`, `performance-complete.log` (exit0), reproducible `performance.mjs`. Chromium402×874/DPR3, cold context; local loopback and synthetic4Mbps/100ms network setting/4×CPU. Measured on the final production build after all160browser checks completed, without concurrent test workers.

| Metric | Local, no throttle |4Mbps /4×CPU |
| --- | ---: | ---: |
| First view decoded and interaction gate released |268.3ms |2007.1ms |
| LCP (hero H1 after gate release) |304ms |2044ms |
| CLS |0 |0 |
| JavaScript transfer |163,821B |163,821B |
| Synthetic cached viewer open |122.3ms |146.1ms |
| Largest observed initial long task |none |73ms |

Normal-CPU scroll p9516.7ms,0/159frames>33ms after readiness traversal. No pageerrors. Four warm transfers start only after windowload (throttledload3187ms/start3191ms) and finish by44300ms. Remainingtwo start only on opening around46376ms and finish66036ms. First4original PNGs total**20,493,582B (~20.5MB)**; all6**29,952,430B (~30.0MB)**. A user opening immediately may wait; the loading view remains safe. Retained originals avoid repeated successful transfers and decode; no memory-free or instant-cold claim. INP, physical hardware and Lighthouse scores were not measured. Earlier pre-fallback H1 LCP52/404ms understated useful readiness under an opaque overlay; retained as historical samples, superseded by current visibility-aware measurements.
## Limits and release state

- Browser-owned iOS/Telegram chrome is outside CSS; real hardware/recipient container was not remotely automated. WebKit viewport-height matrix tests the layout mechanism, not toolbar paint on every OS build. CHG-0065 native hardware symptom remains APPLIED_UNVERIFIED.
- CHG-0035 missing favicon remains OPEN: `/favicon.ico`404 triggers existing Next NoFallbackError. `/en`, `/ru`, `/ar`200; absent legacy `.webp`404 is an expected compatibility assertion, not a broken current PNG request.
- Product/certification claims keep existing unverified status; no commerce/backend or founder message is fabricated.
- Local preview3022 was delivered; on2026-10-08 user subsequently authorized commit/push to origin/main and the existing configured branch. Exact commit/remote refs are checked during dispatch; public deployment is not certified by this Git-only step. Existing unrelated `.gitignore`, `background_old.png`, `tools/__pycache__` changes preserved.
- Controlled agent-behavior EVAL-VIEWER remains NOT_RUN; browser regression passes do not prove agent training/improved model behavior.

Technical approval /2026-10-08: Codex primary/root APPROVED scoped0066/0070/0071/0072 as VERIFIED based on the exact final evidence above. Independent final_audit scope, Stage3 visual, Stage4 behavior/integration and Stage5 native review/performance PASS. Independent final_audit Stage6 record re-audit PASS;0066 misplaced approval was corrected and its failed verdict retained. Explicit user acceptance NOT_RECORDED. See CHANGELOG dated approvals and independent-audit.md.
