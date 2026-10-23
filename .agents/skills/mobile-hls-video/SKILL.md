---
name: mobile-hls-video
description: Prepare, integrate and verify adaptive HLS product films and localized versions for mobile websites using FFmpeg, native iPhone playback and hls.js on Android. Use for new source videos, encoding changes, manifests, playback, buffering and delivery; not for video generation or editing the film narrative.
---

# Mobile HLS Video

Deliver a fast first moving frame and the highest sustainable useful quality on mobile, with reusable preparation and honest network/device evidence. Use existing site controls and a standard streaming engine; do not implement an ABR/MSE decoder from scratch.

Read [the specification](references/specification.md) before preparing or integrating a film. It covers asset/language registration, encoding, manifests, delivery and the mobile paths. The repository's `docs/product-film.md` holds project measurements and history; consult only the relevant current section. Keep this skill generic across films and source languages.

Requirements: Python 3.11+, FFmpeg/FFprobe with libx264 and AAC; scripts use only the Python standard library. Install a missing encoder only within the current task authorization.

## Workflow

1. Inspect the immutable source with FFprobe; record SHA, duration, dimensions, frame rate, codecs, rotation, color primaries/transfer/matrix/range and actual audio language. Do not infer HDR/SDR or language from the UI locale. Resolve unsupported color/rotation explicitly instead of guessing. Preserve the master.
2. Use `scripts/encode.py --help`. Prepare H.264/AAC fMP4 HLS VOD in a fresh versioned directory, normally 2-second segments. Preserve frame rate, aspect, audio identity and color interpretation; align closed GOP/IDR/timestamps across qualities. Encoder caps are starting candidates, never quality guarantees. Supply a tiny emergency quality for poor connectivity and test its measured peak; retain a small progressive MP4 fallback instead of the master.
3. Use `scripts/validate.py --help` on the generated package. Verify every referenced object, durations, sample/segment boundaries, codec declarations, real peak/average bandwidth, output checksums and decodability. View real decoded frames, compare against the source and measure quality, startup and stalls. If a candidate sacrifices important detail, raise bitrate or revise the ladder and repeat the affected checks.
4. Use `scripts/register.py --help` with the exact PASS validation receipt and truthful labels. Register the complete versioned film with its actual audio locale and translated label. Select an exact locale film where supplied, otherwise an explicitly labeled existing fallback. Never invent translations/audio. Publish all objects atomically before switching catalog references. A master playlist lists qualities; each media playlist lists timed segments/init data. This is not a per-second array of arbitrary byte slices.
5. Prefer the known native HLS path on iPhone. On Android use a pinned hls.js light build when MSE/codecs are supported, otherwise a tested native path or the small MP4. Do not trust `canPlayType` alone. Preserve play gesture, fullscreen, safe areas, retry, close/reopen race safety and source cleanup. No media requests before intent; library warming may be separate. Do not hide playback rejection behind endless loading.
6. Use static HTTPS CDN delivery with correct MIME/cache and CORS when cross-origin. No Next media proxy or per-view encoder. Build from verified prepared artifacts, never re-encode on each deployment. See repository preparation command and artifact receipt; fail a build rather than publish LFS pointer text, missing objects or an incomplete version.
7. Validate mobile first: actual iPhone/Android where accessible; Pro402×874/Max440×956 DPR3 screenshots for this project; constrained-network cold starts, stalls, quality up/down, seek, fullscreen/rotation, interruptions, errors and resource cleanup. Emulation is not physical-device proof. Record exact conditions and unavailable checks. Run applicable repository review/build gates before a user-authorized deployment, then verify that exact commit and public objects/playback.

## Important boundaries

- Segment duration, forward buffer and startup delay are separate. A 6–12-second desired buffer is not a mandatory startup wait or a strict native Safari cap. hls.js needs both buffer target and cap tuning, with segment/in-flight overshoot measured.
- ABR selects pre-encoded files on the client; it cannot make a 46Mbps source fit a 4Mbps connection. Begin conservatively, then permit quality to rise. Consider measured throughput, buffer, viewport/DPR/fullscreen and decoder health; never permanently pin low quality to make a test pass.
- No promise of instantaneous start under every connection, zero stalls during outages, mathematical losslessness after lossy encoding, Apple compliance or real-phone success without corresponding evidence.
- Light builds omit alternate audio/subtitles/DRM and some capabilities. Reassess the build if those are requested. Interface translations and audio tracks are separate.
- Existing user authorization governs scope and publication. The skill does not authorize uploads, channel/account actions, purchases or deployments on its own.

After each delivery, retain an encoding/package receipt, actual verification results and relevant source version. Update reusable prevention only for demonstrated mistakes; keep one film's incident narrative out of the core skill.
