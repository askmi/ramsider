# CHG0134 test contract migration — 2026-10-23

The owner explicitly replaced whole-story readiness, hidden artwork until original decode, concurrent warm-all optional images, old-frame-only slide transitions and black linear loading bars. Tests asserting those policies are retired, not reported as passed/skipped. Git history preserves them.

| Previous coverage | Current replacement |
| --- | --- |
| media-priority.spec.ts all-story/failed-story barrier, optional warm-all | loading-flow.spec.ts bounded queue, optional independence, demanded promotion, no-new-far while foreground active, early click buffering, prehydration failure |
| media-loading.spec.ts hidden full-original page, strict original frontier, eager warm-all, old strip locales | loading-flow.spec.ts inline previews, queue, original decode, stalled/failed preview/original, actual known/unknown chunk stream, reversible native wheel/touch/key/programmatic frontier, no hidden implicit retry, viewport/locale checks; loading-geometry.spec.ts source ratio and five-size ready adaptation |
| loading-shared.spec.ts/media-accessibility.spec.ts black bar/track color and sizing | Same files now assert circular milk disc/blur, reduced motion, unknown total, RTL/live status, localized semantic status, error/Retry contrast and keyboard recovery |
| art-loading.spec.ts missing-original blocks page even with preview | loading-flow.spec.ts preview continues with resistance; missing-preview alone bounds input; art-loading retains language navigation/art availability |
| charcoal.spec.ts warm-all immediately and old ready markers | warm-all contract retired; new shared flow suite covers bounded optional warming, visible composite failures and Retry; existing geometry/copy/focus/reopen/locale tests retain current per-image decoded markers |
| technology-viewer.spec.ts failed next original must retain previous photo index | Failed original now retains selected preview; same test preserves Retry/close. Geometry/source/color/navigation tests retained |

No failed runtime assertion was removed to hide a defect: prior new-contract failures and their fixes remain in CHG0134. Valid framework failure, no-JS/FAQ, language navigation, focus, source fidelity and all-locale checks remain runnable.
