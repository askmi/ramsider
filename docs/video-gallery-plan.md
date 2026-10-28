# Seven-film gallery — implementation specification

Status: implemented and locally verified, 2026-10-28; final records audit and deployment pending. Seven supplied preview photos are present. The original session's design images remain the visual reference.

## Mapping

| Order | Display title | Source | Duration | Video |
| --- | --- | --- | --- | --- |
| 1 | Ramsider Uno (Product Introduction) | `design/video/1/english ramsider uno (product introduction).mp4` | 60.04 s | 3840×2160, 25 fps |
| 2 | Pure Gold | `design/video/2/2. PURE GOLD.mp4` | 22.88 s | 3840×2160, 25 fps |
| 3 | Evolution | `design/video/3/3. EVOLUTION.mp4` | 113.64 s | 1920×1080, 25 fps |
| 4 | Our Style | `design/video/4/4. OUR STYLE.mp4` | 38.40 s | 3840×2160, 25 fps |
| 5 | DIY Madness | `design/video/5/5. DIY MADNESS.mp4` | 126.08 s | 3840×2160, 25 fps |
| 6 | Copycats | `design/video/6/6. COPYCATS.mp4` | 82.36 s | 3840×2160, 25 fps |
| 7 | Inside Ramsider | `design/video/7/7. INSIDE RAMSIDER.mp4` | 60.98 s | 3840×2160, 24000/1001 fps |

Names follow the requested capitalization; keep official brand casing. Folder 1 also contains German, Russian and Spanish-named versions. Stream language tags are unreliable (all say English), so establish actual audio language and retain existing verified catalog behavior. Do not upscale film 3 or change film 7's frame rate. Source metadata and hashes: `docs/evidence/video/gallery-source-inventory.json`.

## Approved design and states

The portrait reference is the image attached to the owner's landscape follow-up in the original “Добавить стандартный видеоплеер” session: a dark rounded UNO Films dialog, a large horizontal selected poster with play, title and position, and a horizontal thumbnail strip with a gold selection outline. Reference file: `/var/folders/zz/rg7fqt550kq6vr4fn6b2h7vw0000gn/T/codex-clipboard-0b1d90e3-104c-4249-aa4b-d27170b913f9.png`.

Landscape selection uses the approved large preview on the left and scrollable film list on the right (`/Users/asmirnou/.codex/generated_images/01a168e5-7b27-7e33-8610-49e4243aa2a2/exec-9298f498-e566-4307-847f-b7eca8ff2770.png`). The end state retains the last frame with Replay, Next Film and All Films (`/Users/asmirnou/.codex/generated_images/01a168e5-7b27-7e33-8610-49e4243aa2a2/exec-101ef26b-2e4a-49f9-994b-4b0d1dc5eca7.png`). The corrected playing state uses All Films and position above the picture, and previous-film / play-pause / next-film double-arrow controls together on the left of the bottom bar, followed by seek, volume, gear and fullscreen (`/Users/asmirnou/.codex/generated_images/01a168e5-7b27-7e33-8610-49e4243aa2a2/exec-f144ac97-52b6-4770-825d-e1d91bacad9c.png`). No floating previous/next buttons. Gear menu remains translucent over the video and accessible in fullscreen. Full-window iPhone treatment was discussed and accepted in the session; verify its original control and available platform behavior.

## Acceptance and work sequence

1. Map `design/video/N/N. preview.jpg` to film N. Record source hashes, dimensions, ICC/alpha in `docs/evidence/video/gallery-poster-inventory.json`; compare lossless and high-quality compressed candidates and preserve aspect and color using artwork-color-pipeline. The untagged sources have unknown intended profile. Poster 1 is 1280×715; 2–7 are 1280×591. Preserve the entire image and its native ratio in both main preview and thumbnails; check frame and image geometry independently in actual Pro, Max and landscape screenshots. Do not stretch or silently crop the wider images.
2. Inspect all source streams, color, rotation, audio and hashes; confirm actual audio language independently of unreliable metadata. Retain masters and existing localized introduction. Encode six new films using mobile-hls-video with aligned approximately 2-second fMP4 segments, original compatible AAC, emergency rendition, useful highest source resolution and small fallback; validate every package and compare decoded frames with sources. Lossy H.264 compression is not mathematically lossless; assess quality rather than promising it.
3. Register versioned packages reproducibly, prove clean-checkout hydration and atomic publication, preserve old versions and existing locale fallback. Adapt preload and playback lifecycle to the selected film without stale requests, unexpected playback or audio.
4. Implement portrait, landscape, playback and ended states against those references. All seven names and posters map to the correct sources. Selection, previous/next, seek, play/pause, settings, fullscreen, close/reopen and replay work; end state requires a deliberate choice. Keep focus, keyboard, labels, touch targets, 11 locales, Arabic RTL and reduced motion usable.
5. Inspect actual Pro 402×874 and Pro Max 440×956 DPR3 screenshots against the reference, then landscape, tablet and desktop. Test real presented frames for all seven, quality changes, segment seeks, constrained networks, error recovery, fullscreen, cleanup and screen transitions. Record physical device limitations separately.
6. Run applicable production build, type/lint/tests, native review, speed/network measurement and independent stage audits. Fix findings and recheck. Update journal and memory; inspect exact staged changes, commit and deploy to origin/main under the owner's explicit authorization; verify the exact deployed commit and all public media.

Open inputs: actual speech/audio language for new sources and preview color intent remain unverified. Scope audit initially failed pending complete evidence and mapping; do not claim implementation or technical approval.
