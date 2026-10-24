# Mobile product-film specification

## Package and language contract

One logical film can have multiple audio-language assets. An asset has a stable film ID, actual BCP47 audio locale, immutable version, source SHA, duration, aspect, master URL, small-MP4 fallback URL and translated audio labels. A source language is not synthesized from page locale. Select the matching supplied audio locale, then a declared fallback such as English; state the actual language visibly. Additional subtitle/audio tracks require a deliberate packaging/build change, not a silent light-player assumption.

Example layout (names configurable, never hardcode one film into the encoder):

```
film-id/language-version/
  master.m3u8
  360p/index.m3u8
  360p/init.mp4
  360p/segment-00000.m4s
  ...other qualities...
  fallback.mp4
```

The master uses `EXT-X-STREAM-INF` entries with measured peak `BANDWIDTH`, average bandwidth, actual CODECS, RESOLUTION and FRAME-RATE. Media playlists use VOD, EXTINF, EXT-X-MAP, independent segment declarations only when verified, and ENDLIST. Relative paths remain inside the package. Clients request a selected rendition's init and timed segments; independent segment files use ordinary HTTP200. BYTERANGE is an alternative, not a requirement.

The build artifact registry lists every expected relative path, size and SHA and the approved archive SHA/bytes. `register.py` binds the PASS validation to the exact encoding receipt, requires all eleven interface labels, activates the supplied audio version and retains previous versions inactive for in-progress sessions. The server selects active assets only; builds still extract inactive versions until explicitly retired after their session-retention policy. Archives contain only listed regular files, no symlinks, absolute paths or traversal. Package validation and integrity checking precede publication. Optional encode.py --reuse-package/--reuse-receipt reuses only byte-verified, same-source/same-profile/same-encoder-recipe segments whose audio packet identity matches the source; a new version must retain this provenance. Explicitly authorized retirement may remove old generated packages/catalog/archive entries after new-package/browser approval; old open tabs then need reload. Never rewrite Git history as routine cleanup. A clean Git/LFS checkout must reproduce delivery without ignored private masters or FFmpeg at build time. Never print signed hydration URLs/headers or credentials. Keep encode logs local and commit sanitized receipts.

## Encoding

Start from the original, not a prior lossy derivative. Inspect FFprobe streams/rotation/color. Typical SDR BT.709 limited-range input can retain BT.709 tags and interpretation; fail on unknown/HDR/rotation until explicitly handled. Preserve source frame rate and full aspect; no upscale. Pixel format/profile must match tested mobile decoders. Use H.264 High with compatible lower renditions and AAC; a capable 4K device does not prove every Android supports that level.

Default experiment: 2-second fMP4 segments, closed aligned GOP, IDR at each segment start, stable timestamps, measured EXTINF and frame-rate-compatible GOP. At25fps this is50frames. Source keyframes at1.2s cannot be relabeled as2s segments. FFmpeg `hls_time` is a target and cuts at keyframes; validate output. Apple recommends6s; compare2s/6s if startup, overhead or quality warrants. Do not add LL-HLS merely for prerecorded VOD.

Initial main-rendition candidates are360p/720p/1080p/1440p/2160p, retained only up to source resolution. Suggested combined average investigation points are0.6/1.8/4/7/14Mbps; actual content quality and peaks decide the outputs. Preserve source AAC-LC packets unchanged in every rendition and fallback; do not tie degraded audio to emergency video quality. Validate all ordered packet hashes against the original with validate.py --source. Account for its real bytes; budget emergency video separately and measure the combined peak. Include an emergency low-rate video when practical and verify≤192kbps peak if claiming Apple's cellular ladder requirement. Do not call a360p-only floor fully conformant. At least one good lower-decoder-level variant is required for fallback coverage.

For static quality use a high-quality constrained VBR encode, measure rather than invent averages, and compare gradients, motion, faces, logos and fine detail. Retain source color interpretation; do not silently full-range a limited-range source. Inspect real frames and VMAF/SSIM where available; metrics alone do not certify perceived quality. A low startup quality must not determine the permanent ceiling.

For HLS `BANDWIDTH`, measure peak segment bitrate using the RFC duration-window definition, including playable audio and container bytes. A very short last segment must not be treated as the only peak candidate or silently removed. Audio/video durations and variant boundaries must remain aligned. Keep source SHA and encoder/version/parameters/actual profiles in the receipt.

## Mobile playback contract

- Native iPhone HLS avoids an extra JS streaming engine; its ABR and buffer are controlled by the platform. No web API guarantees a6–12s buffer or a specific first rendition. Manifest ordering can guide a conservative start but must be observed on the target OS.
- Engine selection must distinguish actual WebKit from Chrome device emulation: an iPhone/Safari UA alone is insufficient. Test installed Chrome with its iPhone identity and vendor as well as ordinary desktop Chromium; retain the tested native iPhone/iPad path (including iPadOS desktop UA with touch capability). Test desktop Safari separately: it may re-download native HLS on same-element replay despite immutable headers; a tested MSE path uses ordinary HTTP caching and explicit ABR. Emulated WebKit cache results do not establish actual Safari cache behavior. A stall may never emit MediaError: before terminal Retry, exhaust the bounded small-file fallback with play/pause intent and position preserved.
- Android MSE uses pinned hls.js; light is appropriate only for the current muxed-audio/no-DRM/no-HLS-subtitles feature set. Load it only when needed; warming near the CTA is allowed without starting media. Feature/codec detection and an actual error fallback matter more than the phone brand.
- iOS17.1+ MMS can support hls.js, but is optional. Check current AirPlay/source-alternative requirements; do not disable AirPlay just to make detection pass. WKWebView and Android WebView hosts can change gesture/inline/fullscreen behavior; the page does not own host configuration.
- Standard `<video controls playsinline>` handles playback/fullscreen. Call play within valid user activation, catch rejection and expose the native Play action. Resolve late library/session work against the current open generation; closing/destroying or a stale queued close must not release a newly reopened session.
- Start conservatively, use ABR in auto mode, and allow upswitch after bandwidth/buffer evidence. hls.js `startLevel` is not a fixed `currentLevel`. Tune target/cap/back buffer together; default30s/60MB assumptions can buffer most of a short film. Account for one whole segment and requests in flight. Native limits are observed, not enforced in JS.
- Bounded recovery: ordinary network/ABR behavior first; explicit error/retry after exhaustion. Do not replace a slow low-bitrate HLS stream with the original master or create infinite retry/fallback loops. A small progressive fallback covers unsupported media paths and selected fatal errors, with its own final error state. Closing cancels timers, requests and audio.
- Pause optional artwork transfers while a film is active, preserving current site readiness/scroll behavior and resuming on close. Check for shared-resource lifecycle regressions.

## Static delivery

Serve HTTPS versioned complete packages directly from a static CDN. Correct playlist MIME is `application/vnd.apple.mpegurl`; fMP4 init/video uses appropriate MP4 MIME. Verify actual responses, Content-Length, no HTML fallback/redirect, all referenced objects and seek. Long immutable caching is safe only for never-mutated versioned URLs. Keep old versions for in-progress sessions; invalidate by new URL. Next public defaults do not establish long browser caching.

Same-origin Vercel minimizes setup for this project. R2/custom media domain is a lower-egress-cost option at scale, requiring CORS/CSP/cache configuration; r2.dev is not a production endpoint. An ordinary HLS VOD does not need Next Functions, a per-user playlist endpoint, WebSocket or live encoder. State plan/region/traffic assumptions before comparing costs. Use current official pricing rather than recording a permanent price guarantee in this skill.

## Verification and completion

Measure cold click→first decoded frame (requestVideoFrameCallback when available), stalls excluding deliberate pause/seek, buffer, selected quality where observable, bytes/requests, dropped frames, errors, close/reopen and background/foreground recovery. Native Safari does not expose hls.js quality events. Record physical device/OS/engine, network, cache and sample counts; emulated screenshots and synthetic throttling are separate evidence.

Suggested initial target, not a universal guarantee: p95 firstframe≤2s at4Mbps/100ms and≤3s at1Mbps/100ms, no post-start stalls on a stable supported-throughput connection, downswitch when bandwidth falls, useful upswitch after improvement. Include a10→1Mbps change, short outage, seeking, a slow Android, Pro/Max safe areas, RTL/locale labels, fullscreen/rotation and cleanup. Compare against the old MP4 under the same conditions. No connection can sustain a rendition whose delivery requirement exceeds actual bandwidth indefinitely.

Before deployment: inspect actual diff, native code review, applicable type/lint/build, screenshot evidence and production costs/performance. Publish only within user authorization; confirm exact commit, expected deployment targets and public objects/playback. Keep missing hardware checks explicit. A successful HTTP206 or build is not a mobile playback approval.

## Primary references

- [Apple HLS authoring](https://developer.apple.com/streaming/hls-authoring-specification-for-apple-devices.html)
- [RFC8216](https://www.rfc-editor.org/rfc/rfc8216)
- [FFmpeg HLS muxer](https://ffmpeg.org/ffmpeg-formats.html#hls-2)
- [hls.js API](https://github.com/video-dev/hls.js/blob/v1.7.3/docs/API.md) and [README](https://github.com/video-dev/hls.js/blob/v1.7.3/README.md): pinned starting version, recheck on upgrades
- [WebKit MMS](https://webkit.org/blog/14735/webkit-features-in-safari-17-1/)
- [Vercel CDN pricing](https://vercel.com/docs/manage-cdn-usage), [R2 pricing](https://developers.cloudflare.com/r2/pricing/)

Bundler integration: prefer ESM light plus the pinned upstream standalone worker copied from node_modules at build time. A bundler can rewrite closures in an inline UMD worker (observed Firefox ReferenceError); do not assume worker startup succeeds because playback recovers on the main thread. Require zero page/worker errors.

Sources checked2026-10-23; feature support and prices can change.

Reviewed reuse sources: [Media OS ffmpeg-streaming](https://github.com/damionrashford/media-os/blob/main/skills/ffmpeg-streaming/SKILL.md) for packaging concepts and [Framer Labs HLS](https://github.com/fredm00n/framerlabs/blob/main/skills/framer-code-components-overrides/references/hls-video.md) for lifecycle topics (both MIT). No third-party skill code copied. Their fixed frame rates, remote runtime imports and simplistic retries are not this implementation. Upstream FFmpeg/hls.js remain authoritative.
