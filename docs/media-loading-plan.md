# Media readiness and technology viewer — 2026-10-08

**Width follow-up:** the customer subsequently prioritized full photo width without distortion. The current geometry below follows [the width analysis](technology-viewer.md#width-analysis) and [final width evidence](technology-viewer.md#width-verification); the original loading/cache policy is unchanged.

## Request and acceptance map

| Requirement | Implementation target | Evidence required |
| --- | --- | --- |
| No half-loaded image or orphan description text | Initial technology content stays absent until its retained image is downloaded and decoded; transitions retain the complete current frame until replacement is ready | Slow/partial response, actual pending screenshot, no title/descriptions before first decode, complete reveal |
| White behind technology photo | Only frame cutout/stage uses #fff; outer matte stays black and metal asset is unchanged | Empty, pending, failed and ready screenshots |
| Shared loading status and progress | One loading-status component, shared resource readiness helpers and scroll-lock hook; real streamed byte progress for technology images, indeterminate native-page progress where browser byte counts are unavailable | Partial byte percentage when Content-Length exists; indeterminate fallback; accessible labels and retry |
| Freeze current view until required resource is ready | Viewer navigation disabled during pending target (close remains usable); page scroll/input locked only while visible significant artwork is pending | Wheel/touch/keys, repeated input, close/reopen, failure/retry |
| Stage preloading | After main window load, first two photos of each group start asynchronously; opening starts all remaining photos; one retained promise/image per URL across opens/groups | Request order/count and identical decoded image/cache reuse |
| Frame and photograph fill width without squashing | Viewport-wide canvas/metal frame on all pointer profiles; photo/title/descriptions share one proportional941×1672 plane filling100% of the white cutout width. Excess height scrolls inside fixed frame; vertical pan/keyboard scroll content, group buttons change technology | Explicit photo/cutout width equality and source ratio, reachable lower content, fixed controls, pending inner-scroll freeze/reset,390×664/732/844 and Pro/Max plus tablet/desktop/landscape actuals |
| Browse both directions and stop at ends | Clamp horizontal selection to first/last slide, no modulo wrap; arrows/keyboard/touch/dots obey readiness | Both endpoint swipes and reverse motion, AR direction, no group jump |

The frame fills the browser content area available between existing top and bottom controls. The photo fills the entire inner cutout width and preserves its source proportions. When its proportional height exceeds the available height, the photo and its text scroll vertically inside the fixed frame, without side bands. When the complete photo fits, remaining vertical space stays white. Browser-owned status/address bars cannot be covered by webpage CSS. This supersedes CHG-0070's earlier narrow-canvas and height-contained-photo policies.

## Resource inventory

- Technology: four supplied HeatCore PNGs (02–05), two CyberMind PNGs (01–02), original bytes/resolution/color retained. User confirmed four on 2026-10-08; all source inputs are present. Loading policy is driven by group data.
- Landing substantial artwork: main responsive WebP tiles, reused tail tiles, FAQ row art, document thumbnails, expression-wave layer. Keep native eager/preloaded first tile; decode the actual DOM image before revealing. Observe/load upcoming artwork near viewport; only required visible resources hold the view.
- Small decoration: icons, connector/divider sprites, diamond, arrows/dots, SVG button surfaces. They retain existing delivery; do not make the entire long page wait for offscreen decoration. The metal frame is small and can paint while the photo loads.
- No video content or remote document raster viewer currently exists; unavailable-action dialogs remain semantic text.

## Work sequence and gates

1. Inspect current code/assets and user images; create defect log and acceptance map. Independent read-only auditor checks scope.
2. Implement shared readiness/progress/lock and main-page gate, then technology initial/transition loading and exact inner layout. Keep boundaries small and no new dependency.
3. Inspect real Pro/Max and short-window WebKit pending/ready images; compare artwork color/bytes and proportions; fix and recapture.
4. Test slow/error/retry/cache/preload order, input lock, endpoint swipes, close/focus, 11 locales including Arabic, tablet/desktop/landscape and assembled page scroll.
5. Native Codex review on actual diff, type/lint/tests/production build, measured first view/scroll/payload; fix/refactor findings then rerun affected checks.
6. Final independent audit, dated technical approval, CHANGELOG/MEMORY/LESSONS reconciliation and evidence report. Open the final local production preview for user review. No publication is requested in this delivery.
