# Ramsider UNO: Video Playback Audit Specification

**Agent-to-agent handoff · 2026-10-25 · CHG0147**

## 1. Audit target and authority

This document describes the implementation present on **`main`, commit `d4a94eb418c396f0a091c1cfbe6f317307c40a9e`**, in `askmi/ramsider`. It is a current-state specification for independent review, not a proposal or a claim that all desired outcomes are achieved. The documentation itself is a subsequent working-tree addition. Use that commit as the runtime baseline; inspect newer diffs before transferring these conclusions to another revision.

The user requested preserving Beta, switching to main and preparing this audit handoff. Beta was saved as **`569fcb1084aa7e1760c6e762e51db5eeceb9ca10`**, pushed to `origin/beta`. Its two remaining tracked edits were documentation of the confirmed preorder-preview scope, not video runtime changes. Both exact-SHA Vercel deployments succeeded: [Beta production](https://vercel.com/askmi-6282s-projects/ramsider-beta/Dd34EMKgeiyC5UV5k6gBQ55oLy9q) and [main-project preview](https://vercel.com/askmi-6282s-projects/ramsider/36ma8qypEQqzFc49NWW3fN257k1o). No Beta-to-main merge occurred. This task does not publish a new main deployment.

Source code and package identities take precedence over this prose. Historical receipts below record particular runs; they are not a fresh certification of current production or physical phones. The reusable [mobile HLS skill](../.agents/skills/mobile-hls-video/SKILL.md) and its [preparation specification](../.agents/skills/mobile-hls-video/references/specification.md) guide future films. [Product-film history](product-film.md), [CHANGELOG](../CHANGELOG.md) and [MEMORY](../MEMORY.md) include superseded designs: do not treat an earlier “no service worker/custom ABR” description as the present state.

### Intended outcome and present limits

- Mobile product films should start without downloading a large master, adapt image quality to available delivery capacity and retain original encoded sound at every quality.
- First three **2-second** 360p media segments are optionally warmed after the hero/fonts/paint. Foreground playback never waits for optional preparation.
- iPhone/iPad use native HLS; other supported browsers use hls.js and the browser's media APIs. A 720p MP4 is the last delivery fallback.
- **Instant start is not established.** Latest retained public single trials were **1,330 ms native / 822 ms MSE** from Watch to first frame. No field p95, physical-phone guarantee, guaranteed upshift time, or zero-stall guarantee exists.
- Only six startup media objects are explicitly persisted. Full-film offline storage and “watch once, always zero network afterwards” are not implemented.

## 2. Vocabulary and technology boundaries

| Term | Meaning in this solution |
| --- | --- |
| Codec | Algorithm encoding picture or sound. Picture uses H.264/AVC; sound uses AAC-LC. |
| Container | Structure holding encoded tracks and timing. We use fragmented MP4 for HLS and ordinary MP4 for fallback. |
| HLS VOD | HTTP Live Streaming for an already finished film. Text playlists reference short media files; VOD has an explicit end. HLS is delivery, not compression. |
| Master playlist | `master.m3u8`: available image qualities, codecs, dimensions and measured bandwidth declarations. |
| Media playlist | Each quality's `index.m3u8`: initialization object and ordered segment URIs with durations. There is no separate one-second index file. |
| Segment / init | `.m4s` contains timed compressed picture **and sound**; `init.mp4` supplies track/decoder configuration. Individual media fragments generally need that init to decode. |
| Rendition / rung | One encoded image resolution. There are six; each includes the same original AAC packet sequence. |
| ABR | Adaptive bitrate selection: the native engine or hls.js chooses subsequent segments using bandwidth/buffer/device constraints. It does not improve already encoded pictures. |
| MSE | Media Source Extensions: browser API into which hls.js appends media. Native video controls and decoding remain the browser's. |
| Worker | Background JavaScript execution. The hls.js worker processes media; the separate service worker intercepts narrowly selected HTTP cache requests. They have different jobs. |
| HTTP Range | A request for bytes within an object, usually answered `206`. HLS temporal segmentation works even with whole-object `200` responses. `206` alone does not prove good streaming. |
| Bitrate / bytes | Bits delivered per second versus storage size. Eight bits = one byte. Tables use decimal kB/MB and Mbit/s; MiB means 1,048,576 bytes. |
| GOP / IDR | Group of pictures / independently decodable keyframe. Aligned closed GOPs allow switching renditions at segment boundaries. |
| CRF / preset / VBV | x264 quality target / encoder search-effort setting / rate-control buffer constraints. CRF is not a fixed bitrate or a universal perceptual-quality score. |
| SHA-256 | Content fingerprint used to bind package, registry and receipts. It is not encryption. |

There is no YouTube player, AV1, HEVC, VP9, DRM, separate audio rendition, subtitle track, custom Next video proxy, or server-side per-view transcoding in this implementation. hls.js's upstream ABR is retained with a small cache-sample adapter; we did not implement a new streaming protocol or complete ABR algorithm. AV1 could be a future additional picture encoding, but is not necessary to read this package and has no current compatibility/quality evidence here.

## 3. Repository map

All paths are relative to the repository root; links resolve from this document.

| Responsibility | Source and entry points |
| --- | --- |
| Server-side film selection and compact startup plan | [lib/product-film-catalog.ts](../lib/product-film-catalog.ts), `selectProductFilm` |
| Approved package objects, hashes, audio labels | [config/product-films.json](../config/product-films.json) |
| Watch controls and film placement | [components/Story.tsx](../components/Story.tsx), `film-play`, `ProductFilm`, `selectProductFilm` |
| Native dialog and foreground gesture | [components/DialogController.tsx](../components/DialogController.tsx), delegated `showModal` → `playProductFilm` |
| Film DOM, feedback and React lifecycle | [components/ProductFilm.tsx](../components/ProductFilm.tsx), `ProductFilm` |
| Native/MSE selection, ABR parameters, recovery, cleanup | [lib/film-playback.ts](../lib/film-playback.ts), `nativeHls`, `warmFilmEngine`, `playProductFilm`, `releaseFilm` |
| Cache-hit throughput filtering | [lib/film-cache-abr.ts](../lib/film-cache-abr.ts), `filmCacheAbr` |
| Optional startup producer | [lib/film-preload.ts](../lib/film-preload.ts), `prepareFilmStart`, `stopFilmPreload`, `controlPage` |
| Narrow read-through service worker | [public/film-start-sw.js](../public/film-start-sw.js) |
| UI translations and layout | [lib/product-film.ts](../lib/product-film.ts), [app/globals.css](../app/globals.css), `.product-film*` |
| Artwork connection cooperation | [lib/media-resource.ts](../lib/media-resource.ts), `suspendImageTransfers`; [components/PageMediaGate.tsx](../components/PageMediaGate.tsx) |
| Encoder, package validator, catalog writer | [encode.py](../.agents/skills/mobile-hls-video/scripts/encode.py), [validate.py](../.agents/skills/mobile-hls-video/scripts/validate.py), [register.py](../.agents/skills/mobile-hls-video/scripts/register.py) |
| Build-time LFS hydration/extraction and worker generation | [tools/prepare-product-film.mjs](../tools/prepare-product-film.mjs) |
| Static delivery headers | [next.config.mjs](../next.config.mjs) |
| Dependency identities / build hooks | [package.json](../package.json), [package-lock.json](../package-lock.json), [.gitattributes](../.gitattributes) |
| Repeatable checks | [product-film.spec.ts](../tests/e2e/product-film.spec.ts), [film-prefetch.spec.ts](../tests/e2e/film-prefetch.spec.ts), [film-cache-abr.spec.ts](../tests/e2e/film-cache-abr.spec.ts), [silent-media.ts](../tests/e2e/silent-media.ts), [playwright.config.mjs](../playwright.config.mjs) |

Resolved lockfile versions: **Next.js 16.2.11, React/react-dom 19.2.8, hls.js 1.7.3, @playwright/test 1.63.0**. hls.js is pinned exactly; Next/React package declarations use caret ranges, so use the lockfile. The light ESM build is dynamically imported. The standalone worker comes from the installed hls.js distribution; license: [hls-1.7.3-LICENSE.txt](../public/vendor/hls-1.7.3-LICENSE.txt).

## 4. Active asset, package structure and real sizes

There is currently **one active film/audio asset**: `uno-introduction`, English, `en-v3`. All eleven interface locales select a matching active audio locale if available; otherwise they truthfully label the English fallback. Translating the dialog does not translate the recording. Interface locales: en, ru, de, fr, es, it, tr, ar, zh, ja, ko; Arabic uses RTL dialog direction while video controls remain LTR.

Master: **60.04 seconds, 3840×2160, 25 fps, H.264 High, yuv420p, square pixels, SDR BT.709 limited range; AAC-LC 48 kHz stereo**. Original local source: **344,657,039 bytes** (~344.7 MB), ~45.924 Mbit/s aggregate. It is a preserved private input, not the public playback URL or a clean-clone dependency for building the prepared package.

Public base: `/films/uno-introduction/en-v3/`.

```text
master.m3u8
fallback.mp4
144p/   index.m3u8, init.mp4, segment-00000.m4s ... segment-00030.m4s
360p/   same structure
720p/   same structure
1080p/  same structure
1440p/  same structure
2160p/  same structure
```

Each rendition has **30 full segments of 2.00 seconds plus one 0.04-second video tail**: 31 media segments, not 30. AAC packet boundaries are not exactly two seconds; audio/video timeline tolerances are checked separately. Total package: **200 registered files** = master + fallback + 6×(playlist + init + 31 segments).

The following numbers come from [v3 measured metrics](evidence/video/hls-audio-v3-metrics.json) and the [encoding receipt](evidence/video/hls-encoding-en-v3.json), not estimates. **Each size column labelled “2 s” refers to one full 2-second segment containing picture, sound and fragment overhead; the tiny tail is excluded from that mean.** Whole-rendition sizes include its playlist/init/tail. Every rendition covers the same complete 60.04-second film.

| Picture | Dimensions | Mean one 2 s segment | Largest one 2 s segment | Complete 60.04 s rendition | Mean / declared peak, picture+audio |
| --- | --- | ---: | ---: | ---: | ---: |
| 144p emergency | 256×144 | 39.38 kB | 47.22 kB | 1.185 MB | 0.158 / 0.189 Mbit/s |
| 360p startup | 640×360 | 150.76 kB | 210.38 kB | 4.527 MB | 0.603 / 0.842 Mbit/s |
| 720p | 1280×720 | 472.22 kB | 649.46 kB | 14.172 MB | 1.888 / 2.598 Mbit/s |
| 1080p | 1920×1080 | 1,056.34 kB | 1,391.24 kB | 31.696 MB | 4.223 / 5.565 Mbit/s |
| 1440p | 2560×1440 | 1,870.85 kB | 2,408.01 kB | 56.133 MB | 7.479 / 9.632 Mbit/s |
| 2160p / 4K | 3840×2160 | 3,363.41 kB | 4,442.71 kB | 100.911 MB | 13.445 / 17.771 Mbit/s |

Fallback: **14,183,648 bytes**, 720p H.264/AAC MP4, remuxed from that rendition with metadata moved to the front (`+faststart`); not a second lossy encode. All-rendition archive: **222,965,760 bytes** (~223 MB, including tar overhead). A viewer normally downloads selected portions/renditions, not the whole archive or all qualities; switching/retries can duplicate some time intervals.

## 5. Encoding and sound-preservation contract

### Actual recipe

The [v3 receipt](evidence/video/hls-encoding-en-v3.json) records FFmpeg **9.0.2**, `libx264`, `preset=slow`, six threads, 2-second segments, GOP=50 frames at 25 fps. v3 **re-encoded the emergency 144p picture** and reused the five already verified higher renditions byte-for-byte from v2. It did not re-encode everything again.

| Rung | x264 CRF | Video `maxrate` | VBV `bufsize` | Actual H.264 level from codec string |
| --- | ---: | ---: | ---: | --- |
| 144p | 30 | 28 kbit/s | 56 kbit | 1.2 |
| 360p | 19 | 550 kbit/s | 1,100 kbit | 3.0 |
| 720p | 18 | 2,000 kbit/s | 4,000 kbit | 3.1 |
| 1080p | 18 | 4,500 kbit/s | 9,000 kbit | 4.1, 4 reference frames requested |
| 1440p | 18 | 8,000 kbit/s | 16,000 kbit | 5.0 |
| 2160p | 17 | 14,000 kbit/s | 28,000 kbit | 5.1 |

`maxrate` constrains picture rate control over a VBV window; it is **not** an exact maximum file size or total picture+audio peak. Master bandwidth declarations are calculated from actual muxed segment bytes after encoding. `slow` spends more encoder work searching for efficient coding; it does not slow playback and does not make the picture lossless. Scaling and H.264 encoding are lossy; picture quality has no universal “no loss” guarantee.

The command builder explicitly maps one source picture and audio stream, strips unrelated metadata, scales with Lanczos to an even width preserving aspect ratio, sets SAR=1, yuv420p, H.264 High, BT.709 limited range. It uses `-g 50 -keyint_min 50 -sc_threshold 0` and x264 `keyint=50:min-keyint=50:scenecut=0:open-gop=0`, with matching color parameters. Output flags: `-f hls -hls_segment_type fmp4 -hls_time 2 -hls_playlist_type vod -hls_flags independent_segments`, `init.mp4`, numbered `.m4s` files.

Input guards reject missing audio, non-AAC-LC audio, unsupported/undeclared color/range, non-square pixels, rotation requiring resolution, a mismatch between average and nominal frame-rate metadata, and nonaligned segment timing. The frame-rate check is a heuristic, not exhaustive inspection proving every source packet has constant duration. They select only profiles no larger in height than the source, refuse `audioKbps` overrides and existing output/archive versions. These are recipe constraints, not universal FFmpeg limits. Future HDR, other codecs/frame rates/orientations require an explicit adapted recipe and new evidence.

Reuse requires both package and receipt, identical source SHA, segment timing, encoder version string, preset/threads/GOP, complete file set, size and SHA for every object; each reused profile must match and its AAC identity must match the source. Do not mutate a published version. A new encoding gets a new directory/archive/version.

### Why sound no longer degrades with lower picture quality

Every rung uses **`-c:a copy`**: existing compressed AAC packets are copied, not decoded and re-encoded at a lower audio bitrate. There is **no separate audio playlist/download**. Sound travels with the picture in each `.m4s`; switching image quality also switches to another muxed file with the same encoded audio sequence.

Original AAC payload: **2,817 packets, 949,239 bytes across the full film**, approximately **126.48 kbit/s over 60.04 seconds** (~31.62 kB per two seconds on average, payload only). Ordered packet-payload hash identity:

```text
4381d9e87a59b3259e00cf40bc6d808f29a8ba43eaaa73ea5a1acf9a9ebbf3e2
```

This is SHA-256 of the newline-joined ordered ffprobe packet data hashes, **not** SHA of the AAC file or concatenated raw payload. The validator compares count, total bytes and this digest against the original for **all six renditions and fallback**. It also checks timeline alignment and decoding. This preserves the original AAC's existing fidelity; it does not restore information already lost when the master was encoded and does not prevent audible network/decode interruptions.

Previously the 144p emergency rendition used ~48 kbit/s re-encoded audio. That could sound worse when native ABR selected it; the customer's exact session and audio symptom were not captured, so this is a confirmed quality inconsistency, not proof of the historical session's sole cause. Current v3 removes that inconsistency by saving almost exclusively on the emergency **picture**. Sound now imposes a real bandwidth floor: a sustained connection below the combined emergency requirement can still stall.

### Manifest and package validation

Master uses HLS version 7, independent-segments, actual `CODECS`, dimensions, fps, peak and average muxed bandwidth; 360p is listed first as a conservative startup candidate. Peak calculation examines contiguous segment windows of 0.5–1.5 target durations; average = total segment bytes×8 / total declared duration. Media playlists have `EXT-X-MAP`, `EXTINF`, VOD and `ENDLIST`.

The [validator](../.agents/skills/mobile-hls-video/scripts/validate.py) binds to the receipt and checks the exact regular-file graph, all sizes/hashes, archive content, references confined to the package, actual codecs/resolution/fps/levels/color, bandwidth arithmetic, aligned rendition boundaries, keyframe timestamps and **actual IDR NAL at every segment's start**, full FFmpeg decode, AAC identity/timeline and fast-start mobile fallback. Timing checks tolerate <120 ms at track bounds/gaps; fallback total-duration tolerance is <150 ms. This is package/decode validation, not a subjective quality or browser approval. [v3 package validation](evidence/video/hls-package-validation-v3.json) is the retained PASS; its receipt hash must still match.

### Registering a validated language/version

[register.py](../.agents/skills/mobile-hls-video/scripts/register.py) consumes the encoding receipt, validation JSON, all eleven translated truthful audio labels, safe relative delivery/archive paths and public repository identity. It requires validation status PASS bound to the exact encoding-receipt SHA, rejects silently changing the registry repository, and records source identity, dimensions/duration, file sizes/hashes and archive identity. It does not upload the archive or independently enforce subjective-quality, browser or physical-device approval: those remain separate release gates.

The immutable identity is film ID + actual audio locale + version. Re-registering exactly the same entry is idempotent; changing that identity's bytes/metadata is rejected. Other identities cannot reuse its delivery directory or archive path. A new version deactivates older entries for the same film/audio pair but retains them in the registry. The writer creates a `.tmp` file and replaces the registry. Retirement/cleanup is therefore an explicit subsequent action; selection uses active assets, whereas build preparation still processes retained inactive assets. New language audio must be a real supplied recording, source-validated and labelled, rather than inferred from interface locale.

## 6. Storage, clean build and HTTP delivery

Prepared archive: `design/derived/product-films/uno-introduction-en-v3.tar`, tracked via Git LFS. Git stores a pointer; Git LFS stores the large object. Source master remains preserved locally; retired generated packages were removed from the active tree without rewriting Git history. Removing a tracked LFS pointer does not guarantee deletion of historic remote LFS objects or reclaim billing/storage.

[Build preparation](../tools/prepare-product-film.mjs) runs before `next build`:

1. Read the approved registry and validate safe paths and language labels. Require one active version per film/audio pair.
2. If `public/films/<directory>` already has exactly the approved file count and every size/SHA, reuse it. Otherwise obtain the archive locally or through the public GitHub LFS batch API. `--from-lfs` forces remote archive verification even when local data exists.
3. Stream the LFS body into a unique partial file, bound size, calculate SHA, rename only after exact validation. Signed download URLs and headers are not logged. This build currently depends on anonymous public LFS availability/quota; no secret is needed.
4. Require archive listing equal registry, regular files only, safe paths; extract to staging, verify every extracted object/count, replace destination with backup/rollback. A valid destination is not mutated by a forced remote proof.
5. Copy upstream worker at the old immutable URL and generate `/vendor/hls-worker-1.7.3-runtime.js` by removing **only the terminal optional source-map comment**, preserving executable prefix. Expected trailer mismatch fails the build. Retain the old URL unchanged.

The helper loops all registered assets, not only active ones; retaining inactive assets would still have build/storage cost. Current registry has only the single v3 asset. Public package and generated workers are derived outputs, not hundreds of hand-maintained Git blobs.

Next/Vercel serve ordinary static objects from `public/films`. No request-time Next endpoint slices the master or invokes FFmpeg. `next.config.mjs` sets versioned film/worker objects to `public, max-age=31536000, immutable`, m3u8 MIME `application/vnd.apple.mpegurl`, m4s MIME `video/mp4`; service-worker script uses `no-cache` for update checks. Same-origin delivery needs no special CORS configuration. Actual provider headers/Range behavior must be measured, not inferred from configuration alone.

Immutable URL discipline is essential: changing bytes under `en-v3` can leave stale CDN/browser data. New bytes require a new version and registry entry. Cache headers permit reuse; they do not force browser retention or guarantee offline availability. LFS traffic happens during build; end-user film traffic is served by the deployment/CDN. No current cost/load benchmark or provider-plan financial estimate is established here.

## 7. Foreground playback: gesture, engine and recovery

### Open and close sequence

The server selects the film and passes a compact asset to `ProductFilm`; it does not serialize the full 200-file integrity list to the client. The `<video>` has native `controls`, `playsInline`, `preload="none"`, dimensions and `data-src`/`data-fallback`, **no `src` before intent**. Optional background fetches are separate from video autoplay.

Both Watch controls target `product-film`. Delegated click opens native `<dialog>`, records opener and calls `playProductFilm` directly in the gesture handler. Play cancels optional preload, releases any prior session, suspends managed artwork readers, creates a guarded session and starts source/engine loading. The shared dynamic engine import is reused; failed imports reset the promise. Closing/unmount pauses, removes src, calls `load()`, destroys hls.js, clears timers/listeners and releases image-reader suspension. A queued close event cannot destroy an immediately reopened dialog. Focus returns to the recorded opener.

`ProductFilm` localizes idle/loading/ready/blocked/error feedback and Retry. Fullscreen is the browser's native video control; the UI asks the user to rotate the phone. It does **not** programmatically lock orientation or promise automatic fullscreen. Production audio is ordinary unmuted media; silent output is a QA-only policy.

### Engine selection

`nativeHls` requires HLS `canPlayType`, iOS identity (including MacIntel with >1 touch point for iPad desktop identity), AppleWebKit and compatible Apple/iOS-browser vendor/UA; rejects Chrome/Chromium/Android/desktop-Edge identity. This keeps actual iPhone/iPad native playback while avoiding Chrome's simulated iPhone UA being mistaken for Apple native HLS. It is a heuristic, with ongoing engine/UA compatibility risk.

| Platform path | Current behavior |
| --- | --- |
| iPhone/iPad matching heuristic | Assign master directly to native video. Safari/WebKit controls buffer and ABR; hls.js tuning below does not apply. |
| Android / Chrome / desktop Safari with MSE | Lazy `hls.js/light`, `Engine.isSupported()`, attach media and load HLS. Desktop Safari uses this to improve observed replay behavior. |
| Unsupported MSE/native route or exhausted HLS failure | Try the small 720p MP4 once. This fallback has no adaptive quality. |

### Exact hls.js overrides

Unspecified settings retain **hls.js 1.7.3** defaults; inspect that pinned upstream implementation when auditing derived behavior.

| Setting | Value / intent |
| --- | --- |
| `abrController` | `filmCacheAbr(Engine)` subclass of upstream controller |
| `abrEwmaDefaultEstimate` | 1,100,000 bit/s if preload state is ready; otherwise 500,000 bit/s; a prior, not measured link speed |
| `autoStartLoad` | false; on `MANIFEST_PARSED`, select first level height ≥360, then `startLoad(0)` |
| `workerPath` | `/vendor/hls-worker-1.7.3-runtime.js` |
| `lowLatencyMode` | false; ordinary completed VOD |
| `maxBufferLength` / `maxMaxBufferLength` | 6 / 8 seconds; library targets, not exact hard guarantees |
| `backBufferLength` | 6 seconds; replay can require reloading evicted media |
| `maxBufferSize` | 12×1024×1024 bytes; hls.js buffer policy input, not entire-process RAM cap |
| `capLevelToPlayerSize` / `capLevelOnFPSDrop` | true / true; connection speed alone does not justify 4K |
| `abrBandWidthFactor` / `abrBandWidthUpFactor` | 0.85 / 0.80 safety factors |
| `abrEwmaFastVoD` / `abrEwmaSlowVoD` | 0.5 / 1; EWMA estimator response parameters |
| Fragment policy | TTFB 8,000 ms, load 15,000 ms; timeout and error retries each max 2, 500 ms delay, 1,500 ms max delay |
| Manifest policy | TTFB 6,000 ms, load 8,000 ms; timeout and error retries each max 1, 500 ms delay, 1,000 ms max delay |

ABR selects future segment requests, considering buffer and measured transport. A 2-second segment is **not** “one request exactly every two seconds”; the engine fetches ahead and may request/retry/switch overlapping content. Upshift waits for useful measurements and appropriate buffer/size/FPS conditions. Already buffered lower-quality frames may play before higher quality arrives. There is no custom guaranteed upshift deadline or quality selector.

### Recovery and lifecycle limits

A 15-second watchdog covers startup and waiting/stalled-seek conditions without requiring a MediaError. Repeated waiting notifications do not keep extending the same timer. Hidden pages clear it; visible active intent with insufficient readyState rearms it. A genuine user pause clears intent; source changes preserve it. `NotAllowedError` produces a manual-Play hint and clears the watchdog rather than waiting forever.

After hls.js internal retries, a fatal fragment network error gets one additional restart after 1,000 ms at current time. Other fatal errors or the watchdog trigger MP4 fallback. Fallback preserves time on metadata, clamps near duration end and respects paused/play intent; it is bounded to one source change. Exhausted fallback gives localized error/Retry. A late HLS import cannot overwrite an already selected fallback. Native ABR failures use the same outer watchdog/native-error fallback path; it cannot repair arbitrary browser decoder bugs or a disconnected link. The 720p fallback can itself be too large for a very weak connection.

Managed artwork transfer suspension pauses JS reader consumption/queue pumping and resumes on release. It does not abort every browser/CDN transfer or create a dedicated physical network channel; existing buffers/network activity may continue. Video and preloading share the user's connection with the page and other traffic.

## 8. Optional preload, service worker and ABR cache safety

### Background producer

`prepareFilmStart` waits for `document.fonts.ready`, ready native hero, two animation frames, then idle callback (timeout 1,500 ms) or 250 ms fallback. It runs only visible/unfrozen and does not join page-readiness promises. Its allowlisted plan must have six files, positive integer sizes and total ≤1 MiB:

| Object | Encoded media duration | Body bytes |
| --- | --- | ---: |
| `master.m3u8` | metadata | 937 |
| `360p/index.m3u8` | metadata | 1,283 |
| `360p/init.mp4` | decoder metadata | 1,394 |
| `360p/segment-00000.m4s` | first 2 s | 134,771 |
| `360p/segment-00001.m4s` | next 2 s | 149,574 |
| `360p/segment-00002.m4s` | next 2 s | 152,472 |
| **Total** | **first 6 s + metadata** | **440,431** |

It first obtains control by root `/film-start-sw.js` (`updateViaCache:none`, activation/controller wait ≤8 s). Then media producer and engine warming can proceed in parallel. In `film-start-v1`, it prunes entries outside the selected six URLs, skips matching Content-Length entries, sequentially low-priority fetches missing files using AbortSignal and `X-Film-Preload:1`, requires status 200 and actual decoded body size, strips stale transfer/content-encoding headers and stores complete 200 responses. It does **not** rehash SHA-256 in the browser. Reuse checks cached Content-Length, not full byte integrity.

On MSE the same producer warms both dynamic library and the ordinary HTTP cache for the worker (`force-cache`, low priority, abortable). Worker size **118,194 decoded bytes**, ~42,994 compressed wire bytes in the retained public run, **in addition to media and library requests**. Native path loads no hls.js worker. Near-CTA IntersectionObserver with 600 px margin can warm the library separately, without worker fetch when no signal is supplied. Library/worker settlement is awaited before background `ready`; optional failures are swallowed so ready is not a guarantee that every optional engine warm succeeded.

Play/unmount/nonpersisted navigation aborts and stops the optional producer; it never blocks Watch. Hidden aborts can resume when visible. BFCache pagehide freezes/cancels and pageshow resumes. Storage/registration/fetch failure terminates this attempt without changing playback UI. Cache eviction/quota/private mode fall back to ordinary network. The six-file bound applies to this producer; concurrent tabs/assets can race pruning and are not an atomic origin-wide storage-budget guarantee.

### Service-worker serving rules

The root-scoped worker claims clients but handles only same-origin allowlisted startup paths, no query, GET/HEAD. `X-Film-Preload` and `If-Range` bypass it. It does not cache HTML, arbitrary requests, subsequent segments or complete films. Activation deletes only obsolete `film-start-*` caches, retaining unrelated names.

On cached status-200 body: add `Accept-Ranges:bytes` and `X-Film-Cache:hit`; full GET returns 200, HEAD has no body. Single numeric, open-ended and suffix byte ranges are sliced to 206 with correct selected body length/Content-Range. Unsafe integers, reversed/unsatisfiable ranges return 416 with `bytes */size`. Unsupported/malformed/multipart syntax delegates to network. HEAD with Range follows the implementation's same 206 path without a body; independent HTTP standards review is welcome, not claimed complete. Miss/storage error delegates to fetch. `If-Range` validators and other HTTP conditional behavior are not synthesized locally.

### Cache-aware throughput sampling

`filmCacheAbr` marks fragments whose XHR/Response has `X-Film-Cache:hit` and excludes their `FRAG_BUFFERED` throughput sample from upstream estimation: reading local bytes must not imply a fast internet link and provoke an unjustified HD request. It still calls upstream `onFragLoaded` for load/timer/level bookkeeping, including upstream TTFB sampling; it does not exclude every cache-derived estimator input. A later non-hit load of the same fragment removes its WeakSet mark so real-network throughput sampling resumes.

This adapter depends on protected upstream controller methods and event contracts, hence the exact hls.js pin and focused test. Native Safari's internal ABR cannot use this adapter; preloaded 360p may or may not be its chosen rendition. Regular HTTP-cache hits outside the marked service-worker startup path are not classified by this adapter. Those are audit boundaries, not proven defects.

## 9. Evidence: what was actually verified

Runtime evidence below is **historical, mainly 2026-10-24**, anchored to the receipts and their commits/source hashes. This document-only task does not rerun media, browser, build or performance suites. A successful provider deployment is distinct from playback approval. Raw local `/tmp` logs and ignored screenshots referenced by old receipts may be unavailable in a clean clone; committed JSON summaries remain inspectable and new runs can generate fresh evidence.

| Question | Retained evidence | What it supports / limit |
| --- | --- | --- |
| Current package, original AAC and decoder graph | [v3 encoding](evidence/video/hls-encoding-en-v3.json), [validation](evidence/video/hls-package-validation-v3.json), [metrics](evidence/video/hls-audio-v3-metrics.json), [guards](evidence/video/hls-audio-v3-guards.json) | Six rungs+fallback original packet identity, full decode, file integrity; no subjective listening proof. Negative low-audio replacement rejected even after metadata/hash updates. |
| Public package and clean hydration | [audio-v3 publication](evidence/video/hls-audio-v3-publication.json), [remote hydration](evidence/video/hls-audio-v3-remote-hydration.json), [clean build](evidence/video/hls-audio-v3-cleanbuild.json) | Recorded 6310c28 publication, all 200 public objects exact, remote LFS and no-original/encoder clean build. Not today's complete CDN recrawl. |
| Latest preload/runtime approval | [prefetch verification](evidence/video/prefetch-verification.json), [publication](evidence/video/prefetch-publication.json) | Worker followup 2ffecd7; exact 13 recorded source hashes still match this main snapshot. Historical affected suite **27 PASS / 17 explicit SKIP**, type/lint/build PASS, native review CLEAN; inherited unrelated lint warning retained. Other suites have distinct counts/scopes; do not add them as unique tests. |
| Public startup and reuse | [public browser](evidence/video/prefetch-public-browser.json), [worker consumption](evidence/video/prefetch-worker-consumption.json), [cache consumption](evidence/video/prefetch-cache-consumption.json) | Six objects/440,431 B before intent, no pre-intent autoplay, six cache hits, play >8 s/seek >26 s/cleanup/no errors; MSE worker warm then zero post-click transfer; native no worker. Public first frames 1,330/822 ms, single emulated trials. |
| Aggregate 1→8 Mbit/s at film time 20 s | [streamed 1 Mbps](evidence/video/prefetch-adaptation-streaming-1mbps.json) | Native+MSE full film with no post-start stalls by recorded event criterion; first frame 240/328 ms; cached startup, 100 ms headers, aggregate film-body cap, artwork excluded. Native stayed 360p: no upshift demonstrated. |
| Aggregate 0.25→8 Mbit/s Android identity | [streamed 0.25 Mbps](evidence/video/prefetch-adaptation-streaming-0.25mbps.json) | Chromium 402×874 DPR3, full film/no post-start stalls, first 615 ms; 360→144 at 8.07 s, restored link at 20 s→360 at 30.09 s→720 at 34.07 s. One emulation run, not physical Android or iPhone13/Belarus measurement. |
| Invalid earlier throttling method | [whole-response diagnostic](evidence/video/prefetch-adaptation-0.25mbps.json) | Delaying an entire response primarily distorts TTFB, not streamed throughput. Not valid proof of bandwidth adaptation. Prefer streamed aggregate receipts above. |
| Desktop Safari replays | [native network](evidence/video/hls-incident-real-safari-network.json), [MSE replay3](evidence/video/hls-incident-real-safari-mse-replay3.json), [replay4](evidence/video/hls-incident-real-safari-mse-replay4.json) | Actual Mac native replay refetched 31 segments/~4.53 MB; later MSE third/fourth replays had 0 wire. Does not prove all repeated views or same behavior on iPhone; owner's precise fourth-play failure cause remains unknown. |
| Appearance and first viewport cost | [visual comparison](evidence/video/prefetch-visual.json), [worker performance](evidence/video/prefetch-worker-performance.json) | Pro 402×874 and Max 440×956 DPR3 closed-player screenshots viewed/0 RGBA change against prior approved version. One cold Chromium 4 Mbps/100 ms/4×CPU sample: LCP500 ms, FCP484 ms, CLS0.000222, JSassets378,583 B (includes worker fetch), media442,204 wire B, scroll p95 16.7 ms. Not physical/field INP/Lighthouse95 or a causal improvement proof. |

Every local automated playback must use **muted=true and volume=0 before Play** ([helper](../tests/e2e/silent-media.ts)); never disturb the shared computer. These silent tests cannot establish unmuted autoplay policy or subjective sound quality. FFmpeg `-f null -` decoding writes no audible output.

**Known audit tooling gap CHG0148:** [tools/measure-product-film.mjs](../tools/measure-product-film.mjs) is a legacy executable benchmark without the silent helper/init wrapper at this snapshot. Do not run it as written on the shared computer; it was not run in this handoff. Add equivalent test-only mute initialization before any future run. Historical receipts from other silent probes do not make that script silent.

## 10. Independent audit procedure

### A. Establish identity, without changing production

From a clean checkout of the stated main revision, inspect `git status`, `git rev-parse HEAD` and the source fingerprints in §12. This document and its verification receipt are working-tree handoff additions and therefore are not expected inside the runtime baseline commit. Use `npm ci` for lockfile versions. No master upload, credentials or deployment write is required for code review.

The following check reads registry/receipt metadata and hashes available prepared objects. If the derived package is absent, it reports the need for preparation rather than silently treating files as verified:

```sh
python3 - <<'PY'
import hashlib, json
from pathlib import Path
registry = json.loads(Path('config/product-films.json').read_text())
asset = next(a for a in registry['assets'] if a['active'] and a['id'] == 'uno-introduction' and a['audioLocale'] == 'en')
receipt = json.loads(Path('docs/evidence/video/hls-encoding-en-v3.json').read_text())
validation = json.loads(Path('docs/evidence/video/hls-package-validation-v3.json').read_text())
assert validation['status'] == 'PASS'
assert hashlib.sha256(Path('docs/evidence/video/hls-encoding-en-v3.json').read_bytes()).hexdigest() == validation['receiptSHA256']
assert asset['files'] == receipt['files'] and len(asset['files']) == 200
root = Path('public/films') / asset['directory']
if not root.is_dir():
    raise SystemExit('Prepared package absent: npm ci, then node tools/prepare-product-film.mjs; rerun this check')
assert {str(p.relative_to(root)) for p in root.rglob('*') if p.is_file()} == {f['path'] for f in asset['files']}
for f in asset['files']:
    p = root / f['path']
    assert not p.is_symlink() and p.resolve().is_relative_to(root.resolve())
    assert p.stat().st_size == f['bytes'] and hashlib.sha256(p.read_bytes()).hexdigest() == f['sha256'], f['path']
print('PASS: exact receipt binding and 200 prepared objects')
PY
```

`node tools/prepare-product-film.mjs` or `npm run build` hydrates derived files and may download ~223 MB through public LFS if absent. It needs installed dependencies and system tar, not FFmpeg/the original. `node tools/prepare-product-film.mjs --from-lfs` separately exercises anonymous remote availability/identity and consumes a new LFS download. These mutate local derived outputs only; don't use forced hydration unless that check is needed. Don't print signed LFS URLs/headers.

### B. Source-dependent encoding validation

Full source-copy proof requires the original private master matching source SHA below, FFmpeg+FFprobe and the prepared package. An external reviewer without that master can independently check archive/object SHA, decode, timing and compare copied tracks against the recorded packet identity, but **cannot independently establish identity to an unavailable original**. `validate.py` intentionally fails source-copy validation without `--source`; don't represent a skipped source check as full validation.

With the approved master available locally:

```sh
python3 .agents/skills/mobile-hls-video/scripts/validate.py \
  --source "$FILM_MASTER_PATH" \
  --package public/films/uno-introduction/en-v3 \
  --receipt docs/evidence/video/hls-encoding-en-v3.json \
  --archive design/derived/product-films/uno-introduction-en-v3.tar \
  --max-emergency-peak-kbps 192 \
  --output /tmp/uno-audit-package-validation.json
```

Set `FILM_MASTER_PATH` to an approved local file; this is not a request to upload it. Re-encoding is unnecessary for an implementation audit. If reproduction is desired, inspect `encode.py --help` and use a **fresh version/output root/archive/receipt**, not published en-v3. Current v3's identical reuse additionally needs the exact verified old package/receipt and encoder; those retired inputs need not exist in a clean checkout. A fresh full encode with different FFmpeg/x264 builds is not promised byte-identical.

### C. Silent functional and delivery checks

After a successful production build, start `npm run start -- --port 3180` in a separate terminal, then run the existing silent suites:

```sh
BASE_URL=http://127.0.0.1:3180 npx playwright test \
  tests/e2e/product-film.spec.ts \
  tests/e2e/film-prefetch.spec.ts \
  tests/e2e/film-cache-abr.spec.ts
```

Configured owners include iPhone Pro/Max WebKit, desktop Chromium/Firefox; skips are explicit ownership/API limits, not successes. Installed Playwright browsers are prerequisites. `product-film.spec.ts` blocks service workers so injected network faults reach routes; **it alone cannot verify production cache interception**. `film-prefetch.spec.ts` enables the actual worker/cache integration. `film-cache-abr.spec.ts` owns the adapter bookkeeping/reused-fragment contract once in Chromium. Do not remove mute initialization to “better simulate” a phone on this shared machine.

Inspect startup six-object cache/decoded lengths, cached full/Range/HEAD and network bypass/416, no pre-intent src/autoplay/fourth segment, Watch while warmup/registration/worker pending, denied storage, eviction, hidden/BFCache/unmount abort/resume, close/reopen, errors/retry, seek/pause/resume/fallback, late import, iPad identity, desktop Safari MSE, all locale labels/RTL/landscape and native controls. Measure the **actual first presented frame**, stalls after initial startup, delivered bitrate, requests and byte transfer; `playing` alone is not the first frame.

For public delivery use an exact deployment URL/SHA, verify master/segment/fallback MIME, cache headers, full body SHA and representative valid/invalid ranges. A few range responses or no console errors are insufficient for full playback approval. Repeat constrained runs with aggregate streamed body limits, latency and a recovery phase; distinguish cold, six-object warm, repeat-session and repeat-Play cases. Set mute/volume0 before any custom browser probe. Capture direct evidence from physical iPhone/Android separately if available, including actual OS/browser/network conditions; emulator screenshots/UA do not supply it.

## 11. Priority questions for the external model

Report severity, exact file/function/line, observed evidence, reproduction, user impact and the smallest justified correction. Separate confirmed defects from hypotheses and missing evidence. Review independently rather than accepting previous PASS labels.

1. **Startup:** why do latest public warm starts still take ~0.8–1.3 seconds? Separate cache/controller timing, engine/worker readiness, native buffering, decode, event scheduling and network. Cause remains not fully isolated; no zero-delay promise.
2. **iPhone quality recovery:** verify real iPhone Safari under fluctuating/weak links, not just hls.js. Forced 360p MSE startup/cache may overrun an extremely weak link; native may choose another rendition. Does current ladder balance picture acceptability, sound floor, recovery and stall risk? There are no 240p/480p intermediate rungs.
3. **Audio:** verify all packet identities/timing and actual audible playback on an appropriate separate device/environment if authorized; original AAC identity does not prove uninterrupted output. Customer's exact historical symptom is unknown.
4. **ABR adapter:** inspect pinned hls.js protected APIs and what upstream loaded/buffered/TTFB samples do; cached HTTP responses without the marker and native ABR remain outside this filter. Check upswitch safety/size/FPS behavior, overlapping loads and stale fragment identity.
5. **Preload/cache:** worker/controller races, same-length corrupt/stale entries, multi-tab prune races, quota/eviction, version transitions, BFCache, hidden pending registration, duplicate optional requests and foreground fairness. No global storage lock or persistence guarantee.
6. **Range/HTTP:** verify service-worker single-range parsing and byte correctness, HEAD semantics, malformed/multipart/conditional bypass and actual Next/Vercel static behavior. Earlier CHG0136 recorded a Next invalid-Range 500 vs416 issue; do not assume the narrow startup worker fixes unhandled static/fallback paths.
7. **Fallback:** 15-second waiting budget, one network restart, late-engine guard, pause/time preservation and 720p fallback suitability on a link that could only sustain144p. Automatic fallback trades ABR for compatibility.
8. **Cost/performance:** do all six qualities through4K and duplicated AAC/fallback justify ~223MB prepared storage/build-LFS download for a mobile-first minute? Evaluate actual viewport/DPR selection, decode/memory/thermal behavior, page warmup bytes and real-device first-render cost. No current cost/scale/field-performance study.
9. **Reproducibility:** exact receipt/package/source/worker binding, tar/hydration path/type guards, immutable version rules, dependency upgrade failures and the legacy nonsilent benchmark gap. Private masters must not be needed merely to deploy the approved prepared package.
10. **Product/accessibility:** real-device fullscreen/rotation, keyboard/focus/error feedback, autoplay with real audio, slow-link interaction, reduced motion/RTL and screen readers. No subtitle/caption track exists; no blanket WCAG or browser-support certification is claimed.

## 12. Identity appendix

- Original master SHA-256: `71891983591abac3e44a076bf58a031ec8d6aa070a2e1acf046d3bb58c44bf25`.
- Prepared tar SHA-256: `75a1c6fb228a091e34d93f0337313677a44b87ace565e2785fa27774343b4aeb` (222,965,760 bytes).
- Fallback SHA-256: `84f90715a4c86b3d3e1d358f707e4c13eb73c78031c2074235ec9c07eb7a5e01` (14,183,648 bytes).
- Runtime publication carrying the current video preload/worker implementation: `2ffecd782ab47701158ab5aec121e08b13db5675`, documented in the retained publication receipt. Audit baseline main SHA is later `d4a94eb…`; the following 13 source hashes agree with the historical final-verification receipt. Other file fingerprints are provided in the companion handoff verification receipt.

| Source | SHA-256 |
| --- | --- |
| `lib/film-preload.ts` | `f89fd7de698efa6f6c05821c83c78fe46084cc4d76fd24315546da06969551c0` |
| `lib/film-cache-abr.ts` | `70e991bbf3192984e90135a2bca76c4f353cfebebf323a18bfe75aa3b710f24e` |
| `lib/film-playback.ts` | `fd61bc2e8796f012db65c91ca1f39ce65cc36690b3ef55516a147414a63e3a5f` |
| `lib/product-film-catalog.ts` | `deea7dd011fc5c63196d6bfb30481ddb2d8dd94ac349db0256161c6b4519b141` |
| `components/ProductFilm.tsx` | `7f38a17cb55db694a0d6ba0a4a231b59b45608ea3054a858f7258c81cfebd3c6` |
| `public/film-start-sw.js` | `16180758b6422920376aa241089fb8511df19876f8dfeef6e9dd563dd2481257` |
| `next.config.mjs` | `9c81bc527707a5a27377140429d3e770fa407bec0a4ccf7aa8190e59a89bf1e9` |
| `tests/e2e/film-prefetch.spec.ts` | `dff762b075acd58ad9a39d295b26a1a03a3790b49c14e2809fa88a627dbba1f0` |
| `tests/e2e/film-cache-abr.spec.ts` | `62ce000ba11c1a0679db9b521f4b84f04bb32605646423b8492ce7a10b2b483c` |
| `tests/e2e/product-film.spec.ts` | `6d497d6030a2c45ee4d2549a9443b095dcf156c8ed0c79c19e7f1241eb6db588` |
| `tests/e2e/silent-media.ts` | `793957850b149ffae3e1d769dfbb2da6668b95f01d14c7813a565e237fe9a802` |
| `.agents/skills/mobile-hls-video/SKILL.md` | `6b3c0796eacd5806fbb1c413bedc1dab826d4f8221727640d2d1cda72596d904` |
| `.agents/skills/mobile-hls-video/references/specification.md` | `7b6125525f4f95df7c9e42844eefc618ac89e1d842da1275cde722e3333addb1` |

**Handoff approval scope:** documentation/source/evidence traceability only. See CHG0147 and [handoff verification](evidence/video/audit-handoff-verification.json) for current checks and independent approval. Runtime results above retain their original dates and limits.
