# Seven-film gallery — implementation specification

Status: the seven-film gallery was published under CHG0158; CHG0166 fullscreen/transport correction is locally approved with physical iPhone verification blocked; CHG0167 caption removal is locally verified (2026-10-28). Final records audit and publication are pending. Seven supplied preview photos are present. The original session's design images and subsequent explicit owner corrections govern the visual result.

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

Landscape selection uses the approved large preview on the left and scrollable film list on the right (`/Users/asmirnou/.codex/generated_images/01a168e5-7b27-7e33-8610-49e4243aa2a2/exec-9298f498-e566-4307-847f-b7eca8ff2770.png`). The end state retains the last frame with Replay, Next Film and All Films (`/Users/asmirnou/.codex/generated_images/01a168e5-7b27-7e33-8610-49e4243aa2a2/exec-101ef26b-2e4a-49f9-994b-4b0d1dc5eca7.png`). The corrected playing state uses All Films and position above the picture, and previous-film / play-pause / next-film double-arrow controls together on the left of the bottom bar, followed by seek, volume, gear and fullscreen (`/Users/asmirnou/.codex/generated_images/01a168e5-7b27-7e33-8610-49e4243aa2a2/exec-f144ac97-52b6-4770-825d-e1d91bacad9c.png`). No floating previous/next buttons. Gear menu remains translucent over the video and accessible in fullscreen. Historical full-window iPhone treatment is superseded by CHG0166 (2026-10-28): fullscreen button must use actual element fullscreen where supported and the explicitly user-approved native Apple video player on iPhone without element fullscreen; custom controls remain inline. Rejection/unsupported must report an error rather than silently fill the page. Expanded custom video and phone landscape use proportional cover crop explicitly approved in the recovered history; native fullscreen framing is controlled by Apple. Native system chrome/crop require physical-device evidence, unavailable locally. Transport uses one row at player widths above 560 CSS px and two at narrower widths. Verify contain/cover gesture hit-testing, prefixed/native lifecycle, close/reopen races, gallery focus, settings, List, replay, 11 locales and Arabic, Pro/Max and short/wide sizes; every local media test stays silent.

## Acceptance and work sequence

1. Map `design/video/N/N. preview.jpg` to film N. Record source hashes, dimensions, ICC/alpha in `docs/evidence/video/gallery-poster-inventory.json`; compare lossless and high-quality compressed candidates and preserve aspect and color using artwork-color-pipeline. The untagged sources have unknown intended profile. Poster 1 is 1280×715; 2–7 are 1280×591. Preserve the entire image and its native ratio in both main preview and thumbnails; check frame and image geometry independently in actual Pro, Max and landscape screenshots. Do not stretch or silently crop the wider images.
2. Inspect all source streams, color, rotation, audio and hashes; confirm actual audio language independently of unreliable metadata. Retain masters and existing localized introduction. Encode six new films using mobile-hls-video with aligned approximately 2-second fMP4 segments, original compatible AAC, emergency rendition, useful highest source resolution and small fallback; validate every package and compare decoded frames with sources. Lossy H.264 compression is not mathematically lossless; assess quality rather than promising it.
3. Register versioned packages reproducibly, prove clean-checkout hydration and atomic publication, preserve old versions and existing locale fallback. Adapt preload and playback lifecycle to the selected film without stale requests, unexpected playback or audio.
4. Implement portrait, landscape, playback and ended states against those references. All seven names and posters map to the correct sources. Selection, previous/next, seek, play/pause, settings, fullscreen, close/reopen and replay work; end state requires a deliberate choice. Keep focus, keyboard, labels, touch targets, 11 locales, Arabic RTL and reduced motion usable.
5. Inspect actual Pro 402×874 and Pro Max 440×956 DPR3 screenshots against the reference, then landscape, tablet and desktop. Test real presented frames for all seven, quality changes, segment seeks, constrained networks, error recovery, fullscreen, cleanup and screen transitions. Record physical device limitations separately.
6. Run applicable production build, type/lint/tests, native review, speed/network measurement and independent stage audits. Fix findings and recheck. Update journal and memory; inspect exact staged changes, commit and deploy to origin/main under the owner's explicit authorization; verify the exact deployed commit and all public media.

Open inputs: actual speech/audio language for new sources and preview color intent remain unverified. Historical initial scope failures and their fixes are retained in CHANGELOG. CHG0166/0167 scope and implementation record audits passed; physical iPhone fullscreen chrome and native framing remain blocked by missing hardware. CHG0167 removes every visible audio-language caption in all locales while retaining technical metadata and existing source selection.


## Current fullscreen and caption correction — CHG0166/0167

The older reference images above are source history. CHG0165 already replaced the original end-card actions with centred Replay and a title / List / Close row. The latest owner correction keeps those controls inline, removes audio-language captions everywhere, and explicitly permits native Apple controls in iPhone fullscreen.

| State | Picture and controls | Evidence boundary |
| --- | --- | --- |
| Inline portrait | Complete contain frame; translated custom controls; no audio caption | Real Pro/Max WebKit screenshots and gestures |
| Phone landscape | Approved cover crop fills available page viewport; one transport row when player width exceeds560px | Actual page layout; does not itself suppress Safari chrome |
| Element fullscreen | Standard or prefixed API; cover crop; retained List/settings/custom controls | Real Chromium system mode; Pro/Max custom layout through a labelled adapter |
| iPhone native fullscreen | `video.webkitEnterFullscreen`; Apple controls and OS framing/zoom | API adapter tested; physical Safari chrome and OS framing unavailable |
| Failure / cancellation | No page-size substitute; translated error, retryable native request, guarded unsolicited late callbacks | Native/prefixed/error/close/reopen/retry/real trusted pointer and keyboard regression matrix |

Build8 production/typecheck/scoped lint (0errors,4existing warnings) and native Codex review6 pass. Final targeted browser suite36PASS/48profileSKIP; earlier broad suite140PASS/108SKIP/1old same-task fixture FAIL is retained, corrected fixture passed again. All11locale audio-source checks remain, authored caption labels are absent. Pro402×874 / Max440×956 DPR3 portrait/landscape, Arabic, 320/510/560/561/768/1440 widths, original Evolution at74s, settings/List/replay/focus/close were inspected; the initial bottom capture failed independent location audit (mid-page); corrected17-step scrolls reached Pro13259/14133 and Max14475/15431 with0px end-gap before/after actual footer screenshots. Main and independent /root/audit viewed both; final local integration/records re-audit PASS. Dynamic frames and different reference viewport prevent an aligned pixel-diff claim. Exclude the fading menu in Pro `en-landscape.png` from settled closed-state evidence; clean Evolution images prove that state.

Single isolated cold Chromium402×874DPR3,4Mbps/100ms/CPU4: FCP496ms,LCP708ms,CLS0.000222,JavaScript encoded332418B,scrollp9533.1ms,18 sampled frames>33ms and no errors. Existing static routes and deferred controls boundary remain appropriate; no new runtime network dependency or media encoding is introduced. Field INP, Lighthouse score and physical Safari/Android results are unverified. Full-repository lint still reports37pre-existing errors in unrelated inputs; affected files pass.

Detailed checks/source hashes and current approval status: [fullscreen-correction.json](evidence/video/fullscreen-correction.json). Physical iPhone fullscreen verification remains open under CHG0166. Independent final technical approval and publication are recorded in CHANGELOG.
