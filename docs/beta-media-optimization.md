# Beta media optimization — CHG0120

## Scope and baseline / 2026-10-20

User explicitly authorizes beta-only work and deployment after merging main. Local main1589623 contains only verified publication records; origin/main remains7f93223. Beta merge eab9337 retains prior35 lossless WebP/ember and imports native PDF/orientation fixes. No main push/promotion.

Inventory:58 public WebP (41 VP8L,17 VP8),41,759,590B;30 PNG,295,922B;112 SVG remain vectors;6 PDFs/27 pages,7,930,057B.35 discrete masters/output hashes, decoded RGBA, dimensions/alpha and ICC match the previously approved manifest exactly.17 existing background/FAQ photographic WebP are color-managed high-quality lossy derivatives, not mathematically lossless; their existing local color thresholds and browser comparisons must be rechecked, not mislabeled. PNG:28 untagged (including the numeric ember mask), one sRGB brand, one AdobeRGB group diamond. Per-role policy: AdobeRGB diamond converts through LittleCMS to sRGB against a color-managed control; brand preserves its existing sRGB pixels; untagged assets preserve existing browser interpretation and decoded RGBA, especially numeric mask channels (no color transform). Full inventories in evidence/beta-media.

Current priority defect: PageMediaGate starts all main artwork after the hero; CharcoalViewer/TechnologyViewer warm35 optional images on window.load, which does not wait for lazy story images/decoding. Ember waits only two story images. Requirement is complete main story media before optional requests. Native PDFs stay on-demand with no preload.

## Plan and acceptance

1. Finish current inventory and baseline production network/screenshots, preserve immutable source hashes and main ref.
2. Convert remaining PNG derivatives to exact lossless WebP from the existing source/profile, retain masters outside public, update active references and old test consumers. Preserve vector SVG and browser favicon. Verify dimensions, complete alpha, ICC and color-managed pixels, including tiny assets and inline seams. Report honest byte increases if metadata makes individual tiny files larger.
3. Introduce a document-scoped main-story decoded-ready signal. All main story image elements, including below-fold icons/FAQ/doc thumbnails, complete before optional background warming. Explicit early modal activation stays usable with the existing loader but defers its image transfer until that barrier; failed story media must remain retryable, not silently mark ready. No PDF prefetch. No SSR request-shared mutable state.
4. Benchmark lossless PDF structure/dedup/JPEG entropy candidates and linearized variants. Retain PDF format/native opening, text/fonts/vector/content, all page boxes/rotations/order/links and ICC. Preserve originals/corrected inputs outside public. Select smaller outputs; validate every page at normal and high zoom with exact render comparison. Never downsample or requantize scans merely to reach a size target.
5. Run real Pro402x874 and Max440x956 DPR3 screenshots/reference comparisons; all affected loading failures/retry/early activation/locale/RTL/adaptation/navigation, native review/type/lint/tests/build and isolated production performance. Measure actual request order and first-page range bytes, not only total file size. Reproduce outputs from masters and verify canonical beta bytes after exact-SHA deployment. Physical iPhone/P3/fieldINP remain explicit limitations.

## PDF research and selection rationale

PDF remains PDF; a ZIP or WebP replacement would break native document behavior. Structural compression and progressive delivery are separate optimizations.

| Method | Evidence and suitability |
| --- | --- |
| QPDF structure/Flate/object streams | Lossless reorganization compresses streams and objects without resampling images. Object streams require PDF1.5+. Benchmark as baseline. [Official CLI](https://qpdf.readthedocs.io/en/latest/cli.html#optimizing-file-size) |
| pypdf object deduplication | Remove duplicate/unreferenced objects before writing; particularly relevant to repeated resources in UAE schedules and extracted RoHS. Preserve document semantics and verify renders. [Official guide](https://pypdf.readthedocs.io/en/stable/user/file-size.html) |
| pikepdf/QPDF deterministic linearization | Enables first-page delivery before full download in compliant viewers, usually with slight total-size overhead. Preserve higher versions; compare linearized/smallest candidates. Deterministic IDs permit reproducible output. [Save API](https://pikepdf.readthedocs.io/en/stable/api/main.html#pikepdf.Pdf.save) |
| JPEG entropy optimization | jpegtran -copy all -optimize changes entropy coding without requantization; preserve markers/ICC and verify decoded image bytes/pixels. Do not use arithmetic/progressive/crop/rotate or grayscale transforms. [libjpeg-turbo manual](https://raw.githubusercontent.com/libjpeg-turbo/libjpeg-turbo/main/doc/usage.txt) |
| Ghostscript presets | /screen,/ebook,/prepress alter multiple properties and are not a quality-preserving default. Not selected for certificates when exact rendering can be retained by structural methods. [Official controls](https://ghostscript.readthedocs.io/en/latest/VectorDevices.html#controls-and-features-specific-to-postscript-and-pdf-input) |
| HTTP byte ranges | Check Accept-Ranges plus actual206/Content-Range and exact sliced bytes on beta; linearization is useful only with real viewer/server behavior. [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests) |

Use the existing PDF/artwork skills plus a project-specific reproducible optimization tool and this runbook rather than an unrelated generic skill. Versions/commands/candidate measurements and verification receipts are recorded alongside the outputs. No remote upload of source documents is needed.

## Results

Asset/PDF fidelity and reproducibility verified below. Runtime behavior, final performance and publication gates are recorded separately as completed; a codec/size claim alone never supplies approval.

## Reproduction contract

Use Python with `tools/pdf-optimization-requirements.txt` and official `cwebp`1.6.0 / `jpegtran`3.1.4.1. On this workstation the isolated interpreter is `/tmp/ramsider-beta-media/venv/bin/python`; that temporary environment is not part of deployment. Run `python tools/optimize-small-images.py` and `python tools/optimize-certificates.py` with the pinned dependencies. Both tools preserve originals outside `public/`, bind inputs to baseline SHA256, and reject changed masters rather than silently assuming a profile/source. The four seam inputs are additionally bound to their JSON SHA/count. Updated inputs require a reviewed inventory and fresh full fidelity gates.

Finish **all** conversion/reproduction writes before starting a server/browser/performance observation. Do not regenerate served assets during a browser run. Old source-preparation scripts may recreate PNG/unoptimized PDF intermediates; follow them with this beta pipeline and reverify receipts, color, native opening and ranges before publishing. `docs/evidence/certificates/assets.json` describes current optimized derivatives; original/incremental orientation evidence remains historical and describes the reserved corrected master, not an unchanged optimized byte prefix.

Repeated generation verifies all83 WebP, six PDF and inline-join JSON SHA256 identically (90 outputs). Store PNG masters only in design/derived reserves, never dormant under public. SVG stays vector; the browser favicon remains its native ICO format. No blanket quality setting or conversion of vectors is implied.

## Verified file results

| PDF | Before B | Beta B | Reduction |
| --- | ---: | ---: | ---: |
| All Certificates | 3,781,872 | 2,635,678 | 30.3% |
| Electrical Safety | 140,057 | 135,288 | 3.4% |
| EMC | 634,866 | 541,229 | 14.7% |
| RoHS | 1,600,374 | 1,060,192 | 33.8% |
| UAE Conformity | 1,398,556 | 719,638 | 48.5% |
| UAE Telecom | 374,332 | 306,362 | 18.2% |
| **Total** | **7,930,057** | **5,398,387** | **31.93%** |

All six selected outputs are linearized. Content/text/page boxes/rotation/link fingerprints remain exact; all27 normal150dpi and7 critical300dpi rendered page pairs are pixel-identical. Root and independent auditor viewed contact sheets and detailed renders. First bundle page remains upright. Lossless structure/dedup/Flate9 and JPEG entropy rewriting change bytes but preserve rendering; no image downsampling, requantization or color conversion. `/E` first-page section ends at141455B for the bundle (5.4% of its total), not a guarantee that every native viewer fetches only that amount. All six local servers returned actual206 exact first65536B slices; production transport must be checked separately.

Public raster inventory is now83WebP:66losslessVP8L and17existing q95 photographicVP8, plus four inline lossless seams. The 26 newly converted active PNG preserve full RGBA/alpha/dimensions/ICC against their per-role controls; 4unused legacy PNG and one unused frame are reserved outside public. New small-image source295922B becomes184698B (includes removing unused controls);16 microassets individually grow37–459B with ICC overhead while aggregate payload shrinks. Do not describe the17 retained q95 photographs as mathematically lossless. All112SVG remain vectors; ICO remains native favicon.

Browser evidence:56/56 optional PNG-control/WebP screenshot pairs exact on Pro/Max across four charcoal sections/bottom and all23 photos, with native ratio/width assertions. Main story sweep:84 screenshot pairs,42 newly converted-control pairs exact,42 full managed-background-control pairs max mean channel error1.082/255 (existing lossy art); decoded local/percentile/alpha color checks separately pass. Root inspected both assembled-page and all-photo contact sheets. This establishes no material new appearance drift under WebKit emulation, not universal physical display/Photoshop-intent parity.

## Production behavior and performance

Final normal/failure matrix:150unique phonePASS28intentionalprofileSKIP, plus57desktopPASS7SKIP on Chromium/Firefox. Complete baseline matrix and affected reruns are recorded in browser-checks.json; failed attempts are retained in CHG0120. All14 priority cases pass on Pro/Max: held HTTP, held decode after HTTP finishes, actual503/mainRetry, both open-modal Retry paths including automatic recovery of all12charcoaltiles, and recovered-bootstrap hydration with both HERO and08 held through modal activation. Bootstrap fallback tracks prerequisite completion without reinstating the visual/input guard disabled for native readability. Existing noJS/static fallback and native PDF clicks/Enter/modifier paths remain tested.11locales/Arabic,320–1440widths and short phone heights are covered by affected suites; native touch-only skips are not physical-device evidence.

Isolated final production Chromium402×874DPR3, cold4Mbps/100ms and4×CPU throttling: hero useful2532.7ms, LCP2668ms, CLS0, script transfer212460B, main-story image transfer6441112B. Entire story decoded at14671.1ms; first optional image request14674.2ms (after prerequisite). No PDF requests before activation.119scripted scroll intervals: p9516.8ms,2over33ms,121distinct measured scroll positions from0to12000CSSpx. Single synthetic sample, no fieldINP/Lighthouse or codec-attributed causal improvement claim. Eleven locale pages remain static prerenders; no request-time data/freshness requirement warrants switching to SSR or adding client rendering. Existing small interaction boundaries retained; no PDF renderer/worker dependency.

PDF/asset validation, native review, independent audit and exact-SHA canonical deployment are separate receipts. Physical iPhone/Safari/P3 display and browser-native PDF save/zoom UI remain outside headless emulation evidence.
