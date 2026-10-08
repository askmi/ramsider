# Technology viewer — separate layers, current revision 2026-10-09

## Landing width correction / CHG-0078 — 2026-10-09

The site remains mobile first. The technical viewer uses the same centered `min(viewport width,941px)` canvas as the landing page on every pointer profile. Shared root `--page-max-width` is consumed by both main and native dialog; photos, semantic source coordinates and48sourcepx joins scale inside it. Full-screen black backdrop does not imply viewport-wide photos on a laptop. Earlier viewport-wide descriptions below are historical and superseded by this width contract. The approved64px+safearea header below and original source/loading policies are implemented. New production preview3032.

Pro402×874/Max440×956DPR3 both groups are decoded-pixel identical before/after. Desktop1440×900 lands/viewer/photo share941px and x249.5..1190.5. Geometry/nativebottom tests cover13width-height pairs including941/942boundary,1280/1440/1920,short/narrow/landscape. First suite10PASS/5explicit platformskips/1Firefoxwheel fixtureFAIL; repeated nativewheel cadence repaired and bothdesktoprechecks2PASS. Separate entry/swipe/offline/reopen checks12PASS. Actual sources remain941×1672; no asset, preload or runtime JS change. [Evidence](evidence/technology-viewer/canvas-width/). Primary finaltype/lint/build/native review clean; dated primarytechnicalAPPROVED andindependentStages1/3/4/5PASS; independent finalrecords re-auditPASS aftermissingEVALpreventionrepair; do not infer all-site approval from this scoped correction.

## Approved single-row compact header / CHG-0077 — 2026-10-09

User approved «да в одну строку лучше». The implemented CSS reduces the site's88px header to64px+unchangedsafearea: dots left, navigation18px (16px below361px), Close28px glyph, all original disjoint44px hit targets in one row. Native Telegram/browser toolbar remains external. The application uses the same geometry as the original browser-only candidate. Two-group Pro/Max/desktop real screenshots and Arabic inspected;54locale/width/group geometry cases and11keyboard/navigation/Close cyclesPASS. After implementation allfourPro/Maxbothgroup captures exactlymatchtheapprovedpreview; finalproductionwidthsuite11PASS/5API skips and actualheader54geometry/11keyboardcyclesPASS. [Before/after comparison](evidence/technology-viewer/compact-header/comparison-402.png), [candidate CSS](evidence/technology-viewer/compact-header/candidate.css). Explicit preview approval is recorded; currentproduction3032 contains bothchanges. FinalcoldChromiumProDPR3 useful326.1/2247.2ms,LCP364/2276,CLS0,unchangedJS163586B; livegallerylocalp9516.8ms0>33. Throttledcurrenttrace measuresinitialpageonly, earlierthrottledgallerytrace is historical; noINP/Lighthouse/physicalchromeclaim. DatedprimarytechnicalAPPROVED andindependentStage4/5PASS; independent finalrecordre-auditPASS; firstrecordFAIL andrepair preserved inCHANGELOG.

## Two vertical group ribbons / CHG-0076 — implemented and checked 2026-10-08

User replaces the preceding frame/per-slide model. Ordered HeatCore02–05 and CyberMind01–02 each become a vertical ribbon of untouched full941×1672PNG source planes, scaled uniformly to100%content viewport width. Keep the existing source-coordinate live descriptions; render one group title only on its first plane and remove all folio/callout numbering. No metal contour or bottom controls/inset. Fixed top action, two group dots and Close remain; literal rightward swipe selects CyberMind, leftward returns HeatCore in all locales; vertical pan scrolls only. KeyboardRight/Left selects bounded groups, Up/Down/Page/Home/End scrolls; dot buttons provide an accessible alternative.

Every join overlaps48sourcepx of empty image edges, softly blending only the preceding photo's bottom through a CSSmask over the next photo's top. Text ends at/before1619sourcepx, before the1624blendstart; meaningful artwork and local text coordinates remain intact. No raster conversion, source editing or giant stitched download. Acceptance: zero DOMgap, four visually inspected joins, full viewport image width, native941:1672ratio, complete bottom access, exactlyone h2/group and two stable dots. Existing metadata/source fidelity checks remain valid; no wide-gamut color claim for untagged masters.

Keep allsix post-windowload low-priority asynchronous resources, shared transfer/cache and retained actualdecoded images. Start group resource waits in parallel; reveal each complete ribbon atomically once all its own photos decode. Aggregate reliable byte progress, otherwise indeterminate. Pending/error retains old complete ribbon, freezes scroll/navigation and leaves Close/Retry available. Commit new group at top. Test two required WebKitDPR3phones, short heights, mini320/375,landscape768/1440,11locales with RTL,keyboard/nativepan/wheel,delays/corruptresponses/retry/offline,landing assembly and production performance. Native review required; unavailable is explicit, never passed. VERIFIED /2026-10-08, dated primary technical approval and independent corrected Stage6 ribbon_final_records PASS. Evidence in [ribbon artifacts](evidence/technology-viewer/ribbons/). User accepted this preview on2026-10-08 («отлично») and authorized commit/push.

Current measurements and limits:

- WebKit Pro402×874 and ProMax440×956, DPR3: all six source-local bodies, eight join captures, initial/bottom states and final assembled hero/technology/documents/FAQ screenshots inspected. Source-local Pro comparison preserves descriptions; tolerant raw body diff0–2.844% after masking deliberately removed titles/indices and blended margins. Fractional source-plane bounds differ by at most3devicepx; common-height crops only, no warp. ProMax is responsive inspection, not an independent reference match. Final capture waits actual images/fonts plus ten animation frames after scroll; the first immediate assembled capture showed intermittent missing main artwork, recovered without runtime changes after paint settlement. This does not close the separately reproduced pending-artwork defect.
- Three ribbon suites on four profiles:65PASS/5explicit API/platformSKIP, then2/2Firefox rechecks after correcting half-pixel tolerance and bounded native-wheel event fixture. All67applicable cases have passing evidence; the earlier broader147PASS/10SKIP/7FAIL run is not a full pass. Initial keyboard focus escape was fixed with explicit Tab/ShiftTab boundaries; full cycles now pass. Keyboard, actual Chromium touch, desktop native wheel, nine viewport sizes and all eleven locales/Arabic covered.
- Type/lint/build PASS,14static routes. Native Codex CLI review of the actual uncommitted diff found no actionable defect. Its sandbox blocked fresh browser launches; primary browser checks supply the separate evidence. Independent ribbon_audit scope/visual/behavior PASS, ribbon_closeout_audit review/performance PASS and corrected ribbon_final_records final record/integration PASS; actual checkpoints recorded in CHANGELOG.
- Isolated production Chromium402×874DPR3: useful first view350.9ms loopback/2247.7ms at4Mbps100ms RTT setting+4×CPU; LCP388/2280ms; CLS0; transferred JS163586B. Cached ribbon open63/156.5ms is synthetic latency, not INP. Main/ribbon scroll p95≤16.8ms,0/159intervals>33ms each condition;0pageerrors. Existing six original PNGs total29952430B; at4Mbps full warm completion74.54s after navigation, HeatCore complete71.39s versus first photo71.38s. This preserves the requested payload/preload policy rather than promising immediate cold gallery opening. All-original delivery is unchanged; no codec or rendering-mode optimization justified for this request. Initial transfer snapshot precedes warm completion in the throttled run; do not confuse it with total eventual payload. See performance.json and build-final.log. No Lighthouse, field INP, physical Safari/Telegram chrome or blanket WCAG certification.
- CHG0071 remains REOPENED: untouchedHEAD baseline independently reproduces missing retained main artwork in the artificially held04.webp WebKit check (baselineProPASS/MaxFAIL,currentProFAIL/MaxPASS). Cause UNKNOWN; no main-loading fix in this viewer delivery. Evidence baseline-runtime.json verifies47source/config files againstHEAD; baseline uses framework webpack because temporary dependency symlink is incompatible with Turbopack. Historical11media evidence images restored byte-for-byte, current failures copied into ribbon artifacts. CHG0065physical chrome and CHG0035favicon remain unverified outside this scope.

Everything below this paragraph is historical mapping/evidence for the pre-ribbon viewer. CHG0076 supersedes all frame, slide-number, per-slide title, bottom-control, vertical-group-swipe and RTL-direction policies below; their original approvals apply only to those earlier states. The CHG0071 retained-main approval below is historical and explicitly reopened as described above.

## Historical readiness and geometry / CHG-0070–0072

**2026-10-08 vertical fit-band correction:** the frame height is now the smaller of available height and proportional full-width photo height plus metal borders, centered in the existing control gap. All six loaded photos meet all four inner-frame edges at 393×852, Pro402×874 and Max440×956, with zero inner scroll and a maximum measured edge gap of0.015625 CSSpx. Shorter windows retain accessible inner overflow. Source proportions, photo/text alignment and metal corners are preserved. VERIFIED; scope/visual/behavior/review-performance/final-record independent audits PASS, dated primary technical approval in CHG-0070. Previous failures remain in CHG-0070.

**2026-10-08 width correction:** user prioritizes full photograph width without distortion. The new proportional-width implementation is applied; final technical closure is recorded in CHG-0070 and [width evidence](#width-verification). The initial contained-height revision below is superseded where noted.

There are **four HeatCore and two CyberMind** photographs. Latest CHG0071 preload revision: after window load asynchronously fetch all six at low priority, without blocking the landing; opening reuses existing requests/decoded resources and cold active selection uses auto priority. Main resources start asynchronously at high priority after first-block decode, regardless of scrolling. URL resources retain one in-flight transfer and one decoded DOM image. Initial photo/title/descriptions appear together only after complete transfer and decode; transitions keep the old complete frame until replacement is ready. Byte progress uses reliable Content-Length; otherwise the shared bar is indeterminate. Pending/error navigation stays locked, Close remains available, Retry reloads failed HTTP-cache entries. Successful images are reused across swipes/groups/reopening, including offline navigation after all six finish.

The contour spans the content viewport width on phone, tablet and hover desktop. Its height fits the complete proportional photo when space permits and otherwise uses the available height between toolbar/footer. Unchanged metal artwork uses nine-slice borders (top31/right29/bottom28/left29 source pixels), preserving corner proportions and width-based thickness. The white cutout follows those borders. Photo, title and descriptions share one941×1672 plane at100% cutout width with proportional height. The native inner viewport scrolls excess height when needed. No white fit bands and no distorted/cropped source composition; short screens access the bottom by scrolling. Metal/Close/pagination/group buttons remain fixed. During pending/error, inner scrolling and gestures freeze at the old complete frame; decoded commits reset top. Vertical pan and Arrow/Page/Home/End/Space scroll content; group switching uses Next/Previous buttons. Horizontal swipes/keys stop at endpoints, reverse and honor Arabic RTL. Header and pagination each have44px rows, source-ratio arrows and capped dots. The older narrow desktop portrait policy and height-containment are superseded.

Current correction evidence is in [vertical-bands](evidence/technology-viewer/width-analysis/vertical-bands/): final affected production suite115PASS/5explicit platform skips (`behavior-serial.log`), clean native review, build/type/lint, and isolated performance. Cold useful first view348.8ms loopback /2253.1ms at4Mbps100ms4×CPU; LCP128/2284ms,CLS0,JS164687B. Inner/main scroll p9516.7/16.8ms,0/159 intervals>33ms in both conditions. Cached gallery open130/185.2ms is synthetic, not INP. All six originals remain29952430B. No Lighthouse or physical Safari claim. [Apple iPhone18Pro/Max specifications](https://www.apple.com/ie/iphone-18-pro/specs/) list the same1206×2622/1320×2868 display resolutions as the tested geometry; DPR3 viewport emulation is a geometry proxy, not hardware/browser-chrome certification.

Landing uses the same status/scroll lock and actual-element decode helper for substantial visible artwork. All marked main images warm in the background after first-block decode; offscreen work does not hide a ready viewport. Native document height stops downward entry before incomplete blocks, upward movement remains available, and the bottom progress/Retry strip preserves ready artwork. Only the initial no-ready-content state uses the full-page guard. With JavaScript disabled, or an initial framework download/execution failure before hydration, native server-rendered artwork/text/FAQ remain readable; post-hydration runtime failures are not certified. See [acceptance plan](media-loading-plan.md) and [delivery evidence](evidence/media-loading/checks.md). Historical source mappings below remain; their old geometry/preload policies are superseded by this revision.

The customer rejected the composite frame. Only this viewer changes; existing CTAs and gallery actions remain. CHG-0062 now separates the photograph title as well.

| Layer | Source and mapping | Implementation |
| --- | --- | --- |
| Black full-screen matte | technology_frame.PNG 954×1649 composition guide | CSS #000, full dynamic viewport; portrait canvas centered on tablet/desktop |
| Metal contour | frame01.png 941×1628, Adobe RGB; central black region x29:912/y31:1600 | Explicit LittleCMS Adobe RGB→sRGB conversion, lossless WebP with exact transparent cutout; x57:897/y159:1490 in reference space |
| Photo | Four original HeatCore PNGs (02–05), only the measured title glyph mask repaired; all other decoded RGB pixels exactly unchanged, full 941×1672 RGB/no ICC | Full PNG compressionLevel 0, Next optimization disabled, no preview; previous decoded photo retained until next decodes |
| Photo title | HeatCore ink x55:488/y127:212, Technology x54:215/y244:275 | Separate semantic TechnologyTitle React h2/SVG text, OpenSans Regular 400, source-coordinate scaling with preserveAspectRatio none to match the existing image fit; descriptor translated in all 11 locales |
| Top label | Swipe for Details, baseline reference y52:97 | Semantic button + translatable HTML in landing OpenSans Regular, approx 48/954 of canvas width |
| Right arrow | technology_frame.PNG x668:696/y49:94 | Standalone exact RGB crop, black pixels transparent; same button as label |
| Indicators | source active x383:412/y111:140, inactive x423:452/y111:140 | Four React buttons from slides, source sprites, one active decoded slide, 24×44px nonoverlapping targets (24px minimum pointer width keeps the row compact) |
| Bottom label | Next Technology, reference y1527 | Semantic OpenSans button + standalone arrow; localized honest next-group placeholder |
| Down arrow | technology_frame.PNG x455:500/y1583:1612 | Standalone exact RGB crop, black pixels transparent |
| Close | New X top-right | Existing 44px semantic close control |

Reference arrows/dots have no ICC tag: decoded RGB retained without guessing a profile. frame01 has Adobe RGB (1998), so use explicit relative colorimetric/BPC sRGB conversion and embed sRGB. Preserve contour RGB/alpha against the converted master, and arrows/dots against their source crops. Compare the contour region in actual DPR3 Pro screenshots to the calibrated source; inspect Pro Max as responsive evidence. HTML font rendering deliberately replaces the raster lettering per customer instruction. All 11 locales, Arabic direction and 320/375/768/1440 widths must fit; 44px primary actions and 24×44px pagination; no target overlap. Existing tap, swipe, keyboard, loading failure, focus and close checks still apply.

Final evidence and limits: [2026-10-07 layer checks](evidence/technology-viewer/layers/checks.md).

## Original photograph delivery correction (CHG-0061, historical baseline)

The user rejected WebP photo delivery. Remove public/art/technology/{02,03,04,05}.webp and lib/technology-previews.json. Copy the four clean tech_01 source PNGs to matching {02,03,04,05}.png byte-for-byte; no _TEXT variants. Use original files for both first render and transition decode; remove the low-resolution background preview. Contour/arrows/dots and all gallery behavior remain. Acceptance: source/public/HTTP SHA-256 equality, image/png MIME, zero .webp photograph or data-preview requests, all four decoded PNGs/screenshots in Pro/Max WebKit, relevant interaction/RTL/adaptation checks, static/build/native review and measured original payload.

## Live photograph title (CHG-0062)

Masters in design/references/tech_01 stay untouched. `node tools/prepare-technology-photos.mjs` generates full-size RGB PNGs from those masters and the four native wall reconstruction patches in design/derived/technology-title. The older byte-copy script is removed so regeneration cannot restore baked labels. A tight per-image glyph mask includes two native pixels of antialiasing guard; 03 preserves vertical groove phase through original-column interpolation and bounded reconstructed fine texture. No whole-photo resize, color/profile change, lossy encoder or tiny preview. Exact background hidden beneath opaque lettering is unavailable and is reconstructed; exact decoded identity is asserted outside the mask, including every product pixel.

Main live type: SVG x46/y209/font112/textLength446, visible OpenSans ink aligned to original x55:488/y127:212. Descriptor x54/y267/font31 and English textLength161, color #975f41 sampled from source. h2 accessible name labels the dialog, SVG lettering is decorative to assistive technology; the heading ignores pointer events so swipes work. The existing source-to-stage fit is preserved at every viewport. [Mapping, native crops, masks and real browser evidence](evidence/technology-viewer/live-title/checks.md).

## Description layer — CHG-0063

The supplied *_TEXT.png files provide copy and source positions, not replacement photographs. TechnologyDescriptions uses semantic headings/paragraphs inside source-coordinate foreignObject blocks, Open Sans Regular400 from the landing font family, matching the navigation labels. Story passes only current-locale description copy; all11locale dictionaries stay on the server. Current decoded slide index controls descriptions. Bottom-left reference folios are omitted per the user; only the four upper indicators show pagination. Pinch zoom is permitted for reading; one-finger gallery gestures, frame, live title and all accepted PNG bytes remain unchanged. Brown live text has a thin white outline for native marble-shadow contrast. See [source map](technology-description-map.md) and [evidence](evidence/technology-viewer/descriptions/checks.md).

## Post-load asynchronous warm-up — CHG-0064, 2026-10-07

After the main page window `load` event (or after hydration if already complete), start all four original PNG requests together with low fetch priority. A retained per-viewer Image/decode-promise cache reuses pending and decoded resources. Early opening starts all four immediately and promotes the first; selecting a slide promotes its request. Failed entries are removed so a later selection can retry; the old decoded slide remains visible until its replacement is ready. No change to files, format, color, dimensions, React text, frame or gestures. Total warm-up payload18,917,696B; no network can guarantee completion before an immediate opening or on a stalled connection.

## iOS browser chrome backing — CHG-0065

The customer suspects Telegram in-app browser on iOS; exact container/build is unknown. The native dialog/backdrop cover the browser content viewport, while Safari may expose underlying document paint beneath transparent toolbars. With #technology-viewer[open], CSS paints html/body black and hides the other direct children of .dialog-controller and their descendants. The rendered viewer is a sibling of main.canvas inside that wrapper, so its native dialog/AX/content stay visible. Visibility preserves layout and scroll; CSS state removal restores landing onX/Escape. No viewportmeta, permanent landingpalette, raster/font, gallerygeometry or asyncdelivery changes. Verifyblackdocumentplane even with dialog/backdroppaint suppressed; emulated mobile screenshots alone cannot prove actualphysicaltoolbarbehavior. KnownWebKit reports https://bugs.webkit.org/show_bug.cgi?id=300965 and https://bugs.webkit.org/show_bug.cgi?id=303167; exactuserOS/build unknown.

## Mobile contour at screen edges — CHG-0067

The founder updated the portrait-phone composition: remove exterior black side gutters. At portrait widths under700CSSpx, frameleft0,width100%; openingleft29/941,width883/941 follows the unmodified contour's exact native cutout. Frame/stage vertical placement, top/bottom controls, original assets and loading stay unchanged. Tablet/desktop and landscape retain prior geometry; the known short-landscape issue remains0066OPEN.

## CyberMind second group / CHG-0068, 2026-10-07

Two clean CyberMind photographs now follow HeatCore via down/Next. Horizontal paging and interactive dots follow the displayed group (four for HeatCore, two for CyberMind). Up/Previous returns to the remembered HeatCore photograph; reopening resets to HeatCore first. Last-group Next retains the coming-soon placeholder. CyberMind has only a live title at this stage, no descriptive copy or folios. [Source and state map](technology-cybermind-map.md).

The live CyberMind heading and Technology descriptor use **Open Sans Regular 400**, CSS family OpenSans, the landing/navigation face. Source coordinates: main x46/baseline209/font112/textLength500; descriptor x54/baseline267/font31/textLength161 in English, source brown #975f41 with a thin1.5sourcepx white stroke for marble contrast. Its semantic h2 labels the dialog. Tight title-glyph removal changes only25134/25169 native pixels; every decoded RGB(A) channel outside those masks, all alpha values, dimensions and product pixels remain exact. Native source masters are retained. The original wall hidden under lettering is locally reconstructed.

**Historical CHG-0068 policy, superseded by CHG-0071 above:** first photograph of each group (two total) starts at low priority after window load/already-complete hydration; opening starts the remaining four originals in parallel in the background. Selected photographs receive high priority. Six URL-keyed pending/decoded Image promises are retained across swipes, groups and close/reopen; failures evict and retry. Early opening starts the necessary requests immediately; readiness on a cold connection depends on transfer completion. Full-size compressionLevel0 PNGs remain original-resolution, without WebP, thumbnails, profile conversion or whole-image resampling. [Verification](evidence/technology-viewer/cybermind/checks.md).

<a id="width-analysis"></a>
## Technology photo width — CHG-0070, 2026-10-08

### Scope and finding

This section preserves the requested analysis before implementation (no runtime changes in that analysis stage). The subsequent width-priority implementation is recorded below. Prior technical approvals remain historical for their actual acceptance scopes; analysis audit PASS.

All six original photographs are 941×1672 (aspect 0.5628). At the reported comparison, `app/globals.css` gave the photo/live-copy plane `width:min(100%,100cqh * 941 / 1672)`. It fits by height whenever the white cutout is wider than that ratio. The metal contour fills its target width; the photograph does not. This causes the reported white side bands, independently of download readiness.

The primary agent approved the contour-width/aspect checks without a separate image-width requirement. This specification and verification omission belongs to the agent. The user's screen reveals it; it is not caused by new photo inputs or the phone model.

### Evidence and geometry

- Directly inspected user screenshot `codex-clipboard-b3327bd7-ad4b-41aa-8eb6-32b9377c0711.png` (1228×1672 pixels); CSS viewport/DPR cannot be inferred reliably from that attachment alone.
- Earlier read-only local browser observation at 615×849 CSS px, DPR2: inner stage577.0859×654.4375, content368.3125×654.4297. Image fills63.8% of inner width, leaving about104.38px on each side. Width-fit needs1025.40px height, about370.96px beyond the stage.
- Existing actual WebKit capture `evidence/media-loading/ready-390x664.png` also shows inner side bands; independently inspected by the discipline auditor.
- PNG header dimensions and calculated matrix: [geometry.json](evidence/technology-viewer/width-analysis/geometry.json). Calculated rows below assume current full-width mobile/coarse canvas and zero safe-area insets; they are not new browser test results. Hover desktop's centered portrait canvas is a separate policy.

| CSS viewport | Inner width × height | Width-fit photo height | Extra vertical content |
| --- | --- | --- | --- |
| Pro402×874 | 377.22×692.79 | 670.26 | 0 |
| Max440×956 | 412.88×772.41 | 733.62 | 0 |
| Short390×664 | 365.96×483.55 | 650.25 | 166.71 |
| Wide615×849 | 577.09×654.44 | 1025.40 | 370.96 |
| Landscape844×390 | 791.98×181.08 | 1407.21 | 1226.13 |

Scaling uniformly preserves the source ratio. If source and viewport ratios differ, unchanged fixed artwork cannot simultaneously fill both axes, show every pixel at once and avoid scrolling. Browser chrome changes available height even on the same phone; adaptation must use available geometry rather than phone names.

### Options and recommended policy

1. **Contain:** undistorted, entire composition visible, but side bands. Current result rejected.
2. **Cover:** undistorted and fills both axes, but crops meaningful content. Descriptions include callouts around y703–1096 and footers reaching y1604/1619; other slides include baked diagram/phone leader art. Photo/title/descriptions share one coordinate plane. Blanket cover is unsafe without per-slide critical-region mapping.
3. **Width-fit plus internal vertical scroll:** simplest complete-content solution using unchanged artwork. Photo/title/descriptions share one proportional scale, filling the entire white cutout width. Only when height is insufficient, the cutout scrolls vertically; the metal contour, Close and controls stay fixed. Normal Pro/Max need no scroll under these assumptions. Landscape is accessible but requires substantial scroll, so compact responsive composition is a possible later product improvement.
4. **Responsive recomposition:** if every caption/detail must remain visible simultaneously without scrolling, separate and map title, scene/product, callouts and body for all six slides; arrange them for available aspect and locale. Live text alone cannot reflow the baked artwork. Requires per-slide safe regions/alignment and new visual acceptance. This is a larger composition change, not a generic object-fit fix. Source-layer sufficiency remains to be assessed before implementation.

Recommend option3 as the minimal robust next implementation. It satisfies width, proportions and access to all content; it explicitly trades simultaneous all-content visibility for scrolling on short windows. If all-at-once/no-scroll is mandatory, choose option4 instead.

### Proposed interaction and verification contract

- Image plane width equals inner frame width (≤1CSSpx tolerance), aspect equals941/1672, photo and overlays stay aligned. No exterior page overflow; source/photo quality and white loading backing preserved.
- Native vertical gesture scrolls content; change technology groups with explicit Next/Previous buttons. Do not combine boundary scrolling and automatic group switching. Horizontal swipes stay bounded and reversible; vertical keyboard input follows the scrolling policy, with accessible group controls retained.
- Background page remains locked. Pending resource/decode state freezes internal scroll as well as navigation; Close/Retry remain usable. Reset inner scroll to top on each committed new slide, rather than during a pending request.
- Verify six slides, both primary profiles,390×664/732/844,320×568,615×849, landscape/tablet/desktop, eleven locales/RTL, real touch/wheel/keyboard, both scroll boundaries and changed browser heights. Inspect actual screenshots of top and bottom content, source alignment and frame corners; ensure every meaningful label remains reachable.
- Reuse current media lifecycle/cache. Rerun affected loading tests, static checks, native review, production visual/behavior/performance gates and independent audit after implementation. Earlier160 passing tests do not certify this new width/scroll contract.

### Analysis approval

2026-10-08: Codex primary/root APPROVED the analysis only after six PNG-header checks, source CSS/overlay/gesture inspection, supplied screenshot inspection, earlier live DOM and repeatable geometry assertions. Independent read-only `aspect_analysis_audit` scope/evidence/record PASS after directly inspecting the user screenshot and existing ready-390x664.png, source mappings, dimensions, calculations and affected records. git diff --check PASS. CHG-0070 remains OPEN; no implemented UI approval, native code-review/build/browser re-verification claim in this documentation-only analysis stage. User acceptance NOT_RECORDED; EVAL-VIEWER controlled run NOT_RUN.

### Subsequent implementation — user width priority, 2026-10-08

Implemented option3 after the user reiterated “на всю ширину но без искажения”. The frame also fills hover-desktop viewport width; the earlier centered desktop restriction is removed. All original raster bytes stay unchanged. Photo/title/copy fill the inner width with one source ratio; native internal scrolling exposes excess height, fixed controls stay usable, pending/error freezes scroll and decoded commits reset top. Vertical group swipes are replaced by existing buttons; keyboard scroll and localized instructions are consistent. Removed unused prior vertical-swipe copy. See [final checks](#width-verification) and [CHG-0070](../CHANGELOG.md#chg-0070). Primary implementation approval and independent Stage1/3/4/5 PASS are recorded in final checks. Independent width_closeout_audit corrected-record Stage6 PASS after repairing the stale plan paragraph; CHG0070 VERIFIED / 2026-10-08. User acceptance NOT_RECORDED. Analysis and earlier failed test evidence above remain historical.

<a id="width-verification"></a>
## Full photo width without distortion — CHG-0070

This width approval is historical for its tested preload policy. The later CHG0071 main/all-six priority correction is specified in the current section above and media-loading-plan.md.

Raw artifacts named below remain in [the existing width evidence directory](evidence/technology-viewer/width-analysis/). This record and the preceding analysis were consolidated here under CHG-0073; prior verification verdicts are unchanged.

2026-10-08. Production preview: http://127.0.0.1:3022/en. VERIFIED locally; primary technical approval and independent Stage1/3/4/5/6 PASS. Historical analysis, failed runs and previous approvals are preserved.

### Result and mapping

The metal frame fills the viewport width on all tested pointer profiles. Inside it, one source plane at941×1672 fills100% of the white cutout width. Photo, title and all captions share that proportional scale. When height is insufficient, native vertical scrolling exposes the lower content; metal, Close, pagination and group controls remain fixed. No source photo crop, conversion or replacement. Vertical pan/keyboard scroll content; existing buttons change technology groups. Horizontal gestures remain bounded and reverse in Arabic.

White backing and the fixed loading indicator remain. Pending/error freezes inner scroll including queued movement; downloaded-and-decoded commits reset top. Original first2/group-after-load/remainder-on-open retained-resource policy is unchanged. Removed obsolete vertical-group-swipe translations/type; no added dependency or per-frame React state.

### Final checks

| Gate | Result | Evidence |
| --- | --- | --- |
| Scope/analysis | PASS, independent aspect_analysis_audit | width analysis, geometry.json, CHG-0070 |
| Pro/Max visual | PASS, primary and independent Stage3 | pro/max contact sheets; actual baseline, six-slide, short top/bottom, landscape/desktop PNGs |
| Final affected production suite | 119 PASS,5 explicit platform skips | acceptance-final.log;124 discovered cases |
| Final assembled page/dialog integration | 8/8 PASS | integration-after-cleanup.log |
| Width/ratio/source alignment/content access | 192 image cases across4profiles,6slides,8viewports; exact inner width | *-width-matrix.json |
| Localized composition | 264 fit/reachability states:11locales×6slides×4profiles | acceptance-final.log; Arabic short/native screenshots |
| Native input | Chromium touch EN/RTL vertical/horizontal/pending; Chromium/Firefox wheel; all-profile keyboard/reset/error | technology-width.spec.ts and final log/native-touch*.png |
| Existing media behavior | Original PNG/source/HTTP pixel identity, true25% progress, corrupt200 retry, retained decode/offline/preload/bounded endpoints | existing viewer/loading tests in final log |
| Native actual-diff review | Clean, CLI exit0, no actionable findings | native-review-final.log; previous clean reviews retained |
| Production/type/lint | PASS after cleanup;14 generated static pages | build-after-cleanup.log, typecheck-final.log, lint-final.log |
| Independent behavior/adaptation | Stage4 PASS, width_closeout_audit | Final tests, integration, actual Arabic touch/pending screenshots |
| Independent review/performance | Stage5 PASS, width_closeout_audit | Final native review/static checks/performance/assembly |
| Document consistency/whitespace | Stage6 re-audit PASS, width_closeout_audit; git diff --check PASS | CHG-0070/current mappings/memory/lessons |

Primary profiles: WebKit402×874 and440×956, DPR3. Other sizes:320×568,375×667,390×664/732/844,615×849,844×390,768×1024,1440×900. The five intentional skips are mobile desktop-wheel cases (2) and native Chromium touch protocol on WebKit/Firefox (3); native WebKit hardware swipe/chrome is not claimed. Synthetic pointer tests are reported separately from the actual Chromium touch protocol. Original-quality/raster delivery checks reused the unchanged source mapping; CSS-only geometry does not change pixels or ICC.

### Visual comparison and assembled page

Baseline Pro/Max source-plane appearance remains the approved composition. Aligned baseline-comparison.json differences0.4463%/0.4222% are confined to the explicit keyboard-focus outline on the inner region, as directly inspected in pro-baseline-diff.png; this is not a permanent border. Short-window upper/lower captures show full-width artwork and reachable details rather than fit side bands. Adapted sizes have no matching new designer reference, so no whole-image pixel-match claim.

Eight assembled hero/technology/documents/FAQ crops are raw-pixel identical to the prior approved local captures: assembled-pixel-comparison.json; assembled-contact-sheet.png directly inspected. Max whole PNG SHA also matches. Pro whole PNG SHA differs; equality is claimed for the eight measured crops only, not its whole file. Current assembly capture passed console/viewport/artwork checks.

Read-only in-app preview observation after final cleanup:397×836 CSS px, DPR2; cutout and photograph both372.5234375px wide; rendered ratio0.562803928 versus source0.562799043. Actual preview directly inspected: no side bands or distortion. The browser screenshot is an emulated/content observation, not physical Safari toolbar proof.

### Width-revision performance (historical preload policy)

This approved width sample predates the all-six background preload and retained-main correction. Current measurements are in [the media plan](media-loading-plan.md#current-verification-and-performance).

Cold Chromium402×874 DPR3. performance.mjs/performance.json/performance.log; measurements after final cleanup:

| Measurement | Local loopback | 4Mbps/100ms network setting,4×CPU |
| --- | --- | --- |
| Useful first view | 264.2ms | 2023.1ms |
| LCP | 296ms | 2068ms |
| CLS | 0 | 0 |
| JS transferred | 164317B | 164317B |
| Cached actual click to ready+paint | 111.1ms | 154.3ms |
| Inner scroll p95 interval | 16.7ms | 16.7ms |
| Inner intervals >33ms | 0/159 | 0/159 |
| Main long scroll p95 | 16.7ms,0/159 >33ms | Not resampled |
| Page errors | 0 | 0 |

SSG routes/server main and small client gallery boundaries retained: no new request-time data or rendering bottleneck warrants a rendering-strategy change. JS increase versus prior media revision is496B. Original media payload remains20,493,582B for first4 /29,952,430B for all6. Under throttling warm starts after load at~3.171s and finishes~44.275s; remainder starts only at open~46.397s and ends~66.046s. These large original PNG costs are unchanged and explicit; image optimization was previously deferred by the user. Cached latency is synthetic, not measured INP. No Lighthouse, field speed, WCAG or physical iOS claim.

### Failure history and boundaries

- Prior full-width-contour/contained-photo approval missed the independent picture-width requirement; CHG-0070 reopened, primary responsibility recorded.
- Stage3 initially lacked application journal records despite valid visual proof; record repaired before independent PASS.
- integration-attempt-1.log4PASS/4FAIL: old IMG/src frame assertion after nine-slice DIV. locale-integration-attempt-2.log9PASS/3 skips/4FAIL: missing offscreen media/decode barriers and stale retained-image src checks. Corrected the integration test, final8/8PASS on fresh production. No runtime defect is claimed from those stale assertions.
- Independent Stage6 records initially FAIL: media-loading-plan retained a short-window height-containment paragraph after its header/table changed. Primary missed rereading the complete affected narrative; corrected it to full inner width/proportional height/native overflow scroll. Runtime evidence remains valid; width_closeout_audit corrected-record re-audit Stage6 PASS.
- Physical Telegram/Safari chrome CHG-0065 remains APPLIED_UNVERIFIED; favicon0035 and other unrelated open IDs unchanged. Branch unchanged; unrelated user files preserved. This delivery is local; no new commit/push/public-deployment assertion.
- User acceptance NOT_RECORDED; controlled EVAL-VIEWER NOT_RUN. Product browser passes do not establish improved agent behavior/model training.

### Technical approval

2026-10-08: Codex primary/root APPROVED implemented width/ratio/scroll/loading/gesture/integration and static/native/performance checks using the final evidence above. Independent aspect_analysis_audit Stage1/Stage3 PASS and width_closeout_audit Stage4/Stage5 PASS. Independent width_closeout_audit corrected-record re-audit Stage6 PASS after the preserved Stage6 FAIL; no material record discrepancy remains. CHG-0070 VERIFIED for the local width implementation. User acceptance NOT_RECORDED; controlled EVAL-VIEWER NOT_RUN.
