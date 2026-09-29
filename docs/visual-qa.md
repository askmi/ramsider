# Visual verification against the supplied render

Read during stage 3 of [discipline.md](discipline.md). The reference is a Photoshop/composited design, **not** a previous browser screenshot. A normal snapshot test against the last website version is insufficient. The verifier must actually inspect the browser screenshot and the target image. DOM positions and CSS rules help diagnose a mismatch but cannot prove visual fidelity.

## Prepare a comparable pair

1. Select a reference crop from `background_text.png` and the same crop from `background.png`. Record native pixel coordinates, target CSS viewport, device scale factor, browser, and scroll position. If mobile and desktop references later appear, keep each as a separate target.
2. Run the app, navigate to the target page, set the viewport, and assert the actual `window.innerWidth`/DPR match the iPhone 17 Pro or Pro Max profile. Check that the page emits a responsive viewport meta tag. Wait for fonts and images to load. Ensure layout-affecting animation has settled. For static comparison, disable motion in a test-only mode; test animations separately.
3. Capture an actual browser screenshot at the same content extent. Keep reference, actual, and diff artifacts together, for example under `screenshots/reference/`, `screenshots/actual/`, and `screenshots/diff/` once the app exists. Use stable filenames with section, viewport, browser, and revision. Avoid stale captures after code changes.
4. Inspect the two **images** side by side or overlaid. Compare element position, width, height, spacing, alignment, type family/size/weight/line-height/tracking, line breaks, color, border/radius, shadow, crop, background position, and responsive composition.

## Calibrate the source to the browser

The supplied design is a **941 px-wide bitmap**, while the primary iPhone 17 Pro emulation width is **402 CSS px** (Pro Max: **440 CSS px**). Do not assume that 941 equals the intended CSS width or that its ratio to either viewport is the device-pixel ratio. For each slice, record at least two stable visual anchors (for example product edges, section boundary, title center), the reference crop coordinates, rendered CSS width/crop, screenshot dimensions, and any scale/offset used. Determine whether the section is full-bleed scaled, cropped, or recomposed at that viewport. If it is uniformly scaled, map coordinates with the measured transform; if it is cropped or responsive, compare the matching visible region and describe the composition difference instead of forcing a whole-image diff.

Keep an untouched source crop. A resampled comparison copy may be made after alignment, using a stated scale and method. Do not stretch each image independently or warp it to make the diff look good. The numeric diff is meaningful only once content, size, viewport, browser/font state, scroll offset, and animation state are comparable. At widths with no supplied reference, run responsive/interaction QA without claiming a pixel match.

## Measure, diagnose, repeat

Use Playwright or a small image-diff script for aligned crops. Save the difference image and a mismatch percentage or similar measure. Apply a configurable tolerance: font antialiasing, subpixels, OS/browser differences, image interpolation, shadows, transforms, and fractional coordinates prevent a reliable 0% target. Passing the numeric threshold is **not** enough; visual inspection must find no material layout/design difference.

Treat a difference as **material** when it is visible at the target screen size or changes reading, choice, or interaction: wrong/missing artwork or text, displaced section/element, incorrect typography or line break, clipped control, color/hierarchy change, a tile seam, or a loading gap. Log the difference and its disposition. A remaining rasterization-only edge difference may be accepted with a stated reason; a low diff percentage cannot excuse a visibly wrong hero, CTA, or section. Do not chase a universal 0% target.

The project command is `npm run visual:diff -- reference.png actual.png diff.png [max-difference-percent]`. It rejects images with different dimensions so a crop or viewport mismatch is fixed before interpreting the percentage. The default maximum is 1%; choose a documented tolerance for each aligned comparison rather than treating 1% as universal. The initial Playwright projects and browser CLI commands are recorded in [`TOOLS.md`](../TOOLS.md). A pass from this command alone never closes the visual gate.

For each mismatch, name its cause before editing: wrong asset/crop, font, geometry, wrapping, missing layer, breakpoint, loading state, or animation. Fix the largest material difference, reload, capture a new screenshot, and compare again. Continue until the section passes. Run the same comparison after refactoring or optimizing images/fonts if appearance could change. Check the full assembled page for joins and cumulative drift. For each finished slice retain a small acceptance record: source coordinates, target viewport, state, screenshot paths, observed differences, fix, and final result. This lets the model resume without repeating inspection and makes the final report auditable.

## Interaction and animation evidence

Static screenshots show only one frame. With motion enabled, exercise relevant scroll, hover, click, menu, modal, carousel, gallery, CTA, and form states. Capture initial, intermediate, and final states; for a scroll-triggered effect, inspect shortly after scrolling and again after it settles. Check the final browser state rather than assuming the event handler ran correctly. Use [interaction-qa.md](interaction-qa.md) for the scenario matrix.

## Report

The final evidence should identify each tested viewport and reference crop, actual screenshot and diff, the material differences fixed, any remaining differences, interactions performed, and relevant console errors. If no matching reference exists at a width, report a responsive check rather than claiming a pixel match. If capture/comparison cannot run, give the exact blocker and do not call the visual task complete.
