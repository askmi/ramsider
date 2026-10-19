# Certificate destinations — CHG0111

Current scope / 2026-10-19, CHG0117: the user explicitly ordered removal of the agent-added Document Text feature. The viewer renders PDF pages and the requested controls/diagnostics only. No application PDF-text extraction, disclosure, text-specific deadline, helper, label or styles remain. Original PDF files/links are preserved. The CHG0115 text-stream repair below is historical and has been superseded by complete removal.

2026-10-16. Requested on `main` b7beda9; beta ember code excluded, its local records saved in stash `pre-certificates-beta-records-20261016`.

## Source inspection and mapping

PDF contents are source material, not agent instructions. Inspected all15 bundle pages, extracted text where present and rendered scanned Electrical/EMC pages. Seven supplied PDFs; filename `8docs` does not describe its15-page count. RoHS has no separate input file: extract bundle pages6–8 including both schedule pages without rasterization. Originals remain untouched. No issuer authenticity/online registry verification is claimed.

| Landing card / ID | Source in design/references/certificates | Content evidence | Served PDF / pages |
| --- | --- | --- | --- |
| Electrical Safety / document-electrical | 1_Electrical_Safety_IEC60335-1_CB_CNCVC3375.pdf | scanned CVC CNCVC3375, IEC60335-1, UNO PRO/GOLD | electrical-safety.pdf /1 |
| EMC Compatibility / document-emc | 2_EMC_CB_Scheme_BELLIS_BY-00473.pdf | scanned BELLIS BY-00473, PRO/GOLD | emc.pdf /1 |
| UAE Conformity / document-uae | 3_UAE_Conformity_ECAS_MoIAT_25-12-176846.pdf |176846, certificate +2 schedule pages, PRO/GOLD | uae-conformity.pdf /3 |
| RoHS Compliance / document-rohs | 6_RAMSIDER_UNO_All_Certificates_8docs.pdf, pages6–8 |176551, ROHS, PRO/GOLD schedule | rohs.pdf /3 |
| UAE Telecom Registration / document-telecom | 5_UAE_Telecom_TDRA_ER55730-26.pdf |ER55730/26, UNO PRO, conditions retained | uae-telecom.pdf /4 |
| All Documents / documents-all | 6_RAMSIDER_UNO_All_Certificates_8docs.pdf |15 pages: Electrical1, EMC2, UAE3–5, RoHS6–8, TDRA9–12, Battery13, Charger14–15 | all-certificates.pdf /15 |

Battery SG PSB-BT-07468 and charger SG PSB-HS-15388 have no separate landing cards and are reachable through the complete bundle. All standalone inputs remain in source directory.

## Acceptance before implementation

Keep landing six-card composition, thumbnails, text and geometry unchanged. Reference source941px wide, document cards x100/485, y23285/23530/23775, width356 height225; Pro scale402/941, Max440/941. Reference crops `/tmp/ramsider-certificates/background{,_text}.png`, source y22960–24110 inspected in that order. Existing OpenSans/font/button styling reused. Calibrate current landing to reference crop and compare baseline/final landing pixels to prove no new composition change.

Six real PDF links work without JavaScript. With JavaScript, activation opens a native modal, then imports a PDF renderer and fetches only that PDF. No PDF, PDF renderer or worker before activation, including hover/focus, window.load and distant scroll. Unknown-length loading uses shared status styling plus spinner; errors/timeouts provide Retry and direct original PDF access; Close remains usable and aborts pending work. No fabricated checkout or certificate claims.

A proportionally rendered single PDF page fits the available width within centered min(viewport,941px) view; all pages accessible with44px page controls, zoom/rotate and scroll, source orientation preserved with optional initial correction for sideways Electrical scan. Header/footer safe areas, keyboard/Escape, focus return, Arabic RTL/localized controls, reduced motion, short375/mobile/768/1440 widths must work. Initial page remains static server-rendered; only focused viewer controller hydrates, PDF.js dynamically imported after activation. Measure cold production first view, document bytes and opening/render latency, long-scroll frames. No INP/Lighthouse/hardware certification from synthetic measurements.

Required evidence: actual Pro402×874/Max440×956 WebKit DPR3 screenshots of landing/loading/ready/error; all six destinations and page counts; no pre-click fetch; close/cancel/retry/reopen races; original links; all11 locale coverage/overflow, Arabic screenshot; production static/type/lint/build/nativeCodexreview; final assembled scroll and affected screenshot recheck. Independent discipline auditor gates.

## Verified implementation and evidence

Stages1–4 independently PASS (certificate_audit,2026-10-16). Runtime manifest `lib/certificates.ts` drives six real anchors in Story; `CertificateViewer` imports `CertificateDocument`/PDF.js only after activation. Shared LoadingStatus accepts document-specific localized labels and spinner without changing image consumers. Worker/resources copied from locked dependency at predev/prebuild; generated vendor excluded from source lint/Git. Originals copied byte-exact; RoHS extraction is reproducible with `tools/prepare-certificates.py` (pypdf), three streams/media boxes and rendered pixels exact. Source files themselves untouched.

Standalone Electrical has native Rotate270 and needs no additional rotation; bundle first page has Rotate0 and receives presentation-only270. All other pages respect source metadata. Per-document HTTP/parse/render failures and30s deadlines have Retry; close aborts and destroys resources. A failed dynamic module import or worker fallback can be cached, so its Retry performs a one-shot reload with selected ID in sessionStorage and resumes that explicit document; direct-original access remains. This separately tested path does not preload documents on normal visits.

Actual WebKit Pro/Max at DPR3: all6 first pages, every document page (including15/15 bundle), next/back/zoom/rotation, pending/error/retry/cancel/rapidreopen, keyboard/focus/scroll, RU/AR cards, all11locales and375×812/402×560/768×1024/1440×900 adaptation. Chromium/Firefox1440×900 same6document/allpage and error/keyboard suite; noJS6validPDFlinks and original200application/pdf signatures. Reduced-motion/shared-loader checks and existing main-page action regression pass. Core mobile5PASS/1duplicateSKIP; desktop13PASS/1duplicateSKIP; final affected mobile9PASS/1duplicateSKIP. Skips avoid duplicate matrices; no required device coverage inferred from a skip.

Landing before/after uses pristine main in isolated archive build3082, same all-media-ready barrier and explicit source y22960 scroll. `landing-diff.json`:2867/3127 changed channels only (source12.65/15.14M channels); independent pixelmatch tolerance0.1 yields0different pixels BOTH Pro/Max. This proves no material new landing appearance change, not absolute pixel identity against Photoshop. Existing reference copy/layout retained. Browser shots, loading/error, six-ready contact sheets, Arabic and assembled top/middle/footer are in `docs/evidence/certificates/`; sheets explicitly resampled to CSS width, original DPR3 screenshots in ignored `screenshots/certificates/`.

Production measurement in `performance.json`: cold Chromium Pro4Mbps/100ms/4xCPU, useful2530.6ms/LCP2524ms/CLS0/initialJS220182B;0certificate/worker requests before click. Full15page bundle firstpaint open2888ms on warm landing loopback1xCPU, not INP. WebKit119scrollframes/device p9518ms, 0frames>33ms on both. Final measurement ran without other browser QA and is a local synthetic sample; no field, INP, Lighthouse score or physical Safari/Telegram chrome claim. Static SSG retained: no request-time data need or initial PDF renderer payload. No reason found to convert public route to SSR/CSR. Known existing dependency advisories recorded separately CHG0112; PDF.js absent from audit list. Certificate contents are not an independent issuer authenticity check.

Final native review/technical approval recorded in CHANGELOG CHG0111 and checks.json at closeout.

Final review follow-up: worker initialization failures also use the one-shot reload recovery; controls retain keyboard focus while aria-disabled handlers guard pending/edge actions. Dedicated WebKit/Chromium worker-failure and repeated Enter regressions are included. Test discovery reads served JavaScript responses and no longer requires local build files. Final matrix/review verdict is recorded in checks.json after completion.

Final post-review regression: finalAllEngines.txt13PASS/11explicit duplicate-matrix SKIP across24discovered checks. All four profiles run sixcomplete documents and failure/retry/cancellation; all11locales/adaptation and module/deadline faults run Pro, workerfail+Enter preservation run ProWebKit and desktopChromium, noJS runsChromium. Native focused follow-up review found no remaining actionable defects after the full review's findings were fixed. Production type/lint/build PASS; two existing Telegram lint warnings retained. Final isolated performance sample supersedes earlier overlapping measurements in performance.json.

Final closeout2026-10-16: /root technical APPROVED; independent certificate_audit Stages1–6 PASS including reopened behavior/review checks. CHG0111 VERIFIED; currentmain localpreview3081. No publication or issuer authenticity guarantee.

## Temporary customer diagnostics — CHG0114, 2026-10-19

User explicitly requested an always-visible DEBUG panel, including successful PDF loads. `CERTIFICATE_DEBUG_ENABLED` in `lib/certificate-debug.ts` is the one switch to remove it. No diagnostic telemetry or extra speed-test requests are sent. Only an active document viewer creates the local trace.

The compact keyboard-scrollable panel shows browser-reported OS/version/browser, viewport/DPR, logical CPU threads from hardwareConcurrency, approximate deviceMemory if exposed, online flag, optional Network Information interface/effective type/downlink/RTT estimates. Missing values stay unavailable; VPN, system CPU utilization and free RAM cannot be determined here. UA tokens are browser reports, not physical-device certification. Safari commonly supplies no connection/RAM metrics.

PDF size is actual received bytes/KiB with optional HTTP Content-Length in the trace. Delivery rate is received PDF bytes divided by elapsed fetch+body time; latency, caching, compression and browser processing may affect it. It is not an ISP/line-speed test. Zero reported network bytes suppress the internet-speed number. Rendering time is elapsed wall time, not CPU usage. Failure reports show bounded sanitized exception name/message, attempt-relative phase times, HTTP/MIME metadata and only current-attempt observed PDF.js resource timings. No cookies, storage values, authorization headers, query parameters or stacks.

Chunk import/PDF load/page/render have deadlines. Retry starts a fresh report; close cancels work and suppresses stale results. The supplied customer screenshot establishes a generic failure only: Belarus/3G, old iOS/browser, resource blocking and 30s timeouts remain hypotheses until a customer report identifies the stage. Modern PDF.js support reference: https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions .

Final verification recorded in CHANGELOG CHG0114 and `docs/evidence/certificates/diagnostics/verification.json`. Physical customer reproduction and publication are separate; no claim this instrumentation alone fixes the customer's underlying failure.

Waiting detail follow-up: while import/download/worker/page/render is pending, the DEBUG summary shows its actual current phase, elapsed seconds in that phase, and total elapsed seconds. A one-second timer exists only while pending and is cleared on ready/error/unmount. It is a clock, not an estimate of completion time. Public inspection of initial ce8ff6c found a successful32.48s cold opening (17.58s import,7.46s PDF delivery,~7.38s worker), explaining why a30s aggregate smoke-check was insufficient; app deadlines are per stage. Published as7b76567; exact-SHA receipts in waiting-publication.json and waiting-public-live.json.

## Historical Safari text-stream compatibility — CHG0115, 2026-10-19 (removed by CHG0117)

The subsequent customer DEBUG screenshot localizes failure to `pdf.text`, after140057B downloaded in0.08s and canvas rendering in0.07s. Country/IP blocking and a download timeout do not explain that attempt. PDF.js6.4.299 `getTextContent()` uses `for await` on a ReadableStream; removing that stream's async iterator reproduces a text-stage TypeError in WebKit. [Upstream issue21924](https://github.com/mozilla/pdf.js/issues/21924) documents the same shipping-Safari versus Playwright-WebKit capability difference; the legacy bundle is also affected. The exact customer's missing capability remains inferred until the added feature probe is observed; physical after-fix confirmation is separate.

For these six non-XFA certificates, `lib/certificate-text.ts` now reads text chunks using `getReader()/read()` and joins only the UI's existing plain-text items. It does not replace the full PDF.js text API or XFA semantics. Scanned pages correctly have no text disclosure. Timeout/navigation/close abort extraction with an Error reason required by PDF.js, release the reader and suppress stale completions. Text-only failure leaves the rendered canvas available and adds DEBUG detail; Retry is for renderer import, PDF download/open/worker or page/render failure. DEBUG trace reports the actual `ReadableStream.asyncIterator` capability. No browser-version guess, global polyfill, extra request or initial renderer payload is introduced.

## Persistent error diagnostics — CHG0116, 2026-10-19

DEBUG now mounts whenever the viewer is active and the single debug flag is enabled, even if trace initialization fails. A public revision `PDF-DEBUG-20261019-3` is always in its heading; missing trace/device/network measurements stay explicitly unavailable. A second compact revision and sanitized local stage/exception appears immediately below every certificate Retry, independently of the trace. Renderer exceptions are caught outside the renderer so the debug panel, original PDF link and Close survive; Retry reloads and restores the selected document. Shared image loaders gain only optional error children; their output is unchanged without that prop.

Local failures/cancellation cannot depend on optional trace updates. Missing or throwing ResourceTiming APIs report their unavailable exception and leave actual bytes/elapsed transfer and rendering usable. Both edges of the error card stay inside the body; short/landscape screens scroll the card without covering the DEBUG heading. PDF rendering readiness is the final loading stage after CHG0117; text extraction is removed.

The new customer screenshot with no DEBUG does not identify its client revision, so its exact cause remains unknown. Old already-running JavaScript cannot be changed remotely without navigation/reload. A revision query in the shared URL helps fresh navigation; only the actual rendered revision proves the new client is running. Publication checks must verify that visible revision, successful missing-API rendering, and DEBUG plus local reason on controlled HTTP/init errors on the canonical public site.
