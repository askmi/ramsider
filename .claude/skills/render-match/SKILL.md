---
name: render-match
description: Reproduce a provided design render (photo mockup, screenshot, or exported image) in code with high visual fidelity — matching fonts, colors, spacing, imagery, and animation exactly. Use whenever the user supplies a render/mockup/screenshot and asks to build the site or component to look "exactly like" it. Triggers on tasks involving matching a design image, cloning a mockup, pixel-perfect UI, or "make it match the render."
---

# Render Match

Build UI that reproduces a supplied design render as closely as possible. This is a
measured feedback loop, not a one-shot generation. Do not rely on visual memory —
measure, build, screenshot, compare, correct.

**Note:** This overrides the `frontend-design` skill's push toward "distinctive" design.
When matching a render, fidelity to the render wins over creative direction.

## 1. Extract the ground truth from the render

Read the render image directly. Before writing any code, extract:

- **Colors** — sample exact hex values for background, text, accents, borders, gradients,
  shadows. Note opacity where colors look semi-transparent. Build a token list.
- **Typography** — identify font family (or closest web/Google font), weights, sizes
  (estimate in px relative to known elements), line-height, letter-spacing, casing.
- **Layout & spacing** — grid/columns, margins, padding, gaps, alignment, border-radius,
  element proportions. Measure relative to the image dimensions.
- **Imagery** — which assets are photos vs. CSS. Ask the user for the actual source
  assets (logos, hero images, icons) rather than approximating them.
- **Motion** — any implied animation/transition (hover, entrance, parallax, loops).
  If the render is a still image, ask the user to describe the intended animation.

Write these into a short design-token summary (CSS variables / theme) first, then build
against it. Ask the user for anything ambiguous — exact brand font, real image files,
animation intent — rather than guessing.

## 2. Build against the tokens

Implement using the extracted tokens. Prefer real fonts/assets over lookalikes. Keep the
DOM structure clean so spacing can be tuned precisely.

## 3. Screenshot and compare — the core loop

Render the page and capture it at the **same viewport width as the render** so the
comparison is apples-to-apples.

- Use `chrome-devtools-mcp` (preferred — also gives real render/perf traces) or
  `playwright` to screenshot the running page.

### PerfectPixel-style overlay + quantified diff (preferred)

Instead of eyeballing, measure. This skill bundles a helper that produces a
PerfectPixel-style overlay (the render ghosted at 50% over your screenshot) **and** a
pixel-diff heatmap with a numeric difference percentage.

One-time setup (installs `jimp` locally into the skill's `scripts/`, git-ignored):

```bash
cd .claude/skills/render-match/scripts && npm install
```

Each iteration:

```bash
node .claude/skills/render-match/scripts/pixel-diff.cjs <render.png> <screenshot.png> <outDir>
```

It prints JSON with `diffPercent` and writes `diff.png` (heatmap — where the pixels
differ) and `overlay.png` (alignment check). Read the heatmap to locate the biggest
misaligned regions, and track `diffPercent` across iterations — it should keep dropping.
The screenshot is auto-resized to the render's exact dimensions before comparing.

### Then diff systematically

Using the heatmap to focus attention, compare:
colors → fonts → sizes → spacing → alignment → imagery → motion.
List concrete deltas ("accent is #3B82F6, render is #2563EB"; "heading 28px vs ~34px";
"card gap too tight by ~8px").

## 4. Correct and repeat

Fix the largest visual deltas first, re-screenshot, re-compare. Iterate until differences
are negligible. State remaining known gaps honestly rather than claiming an exact match
when it isn't.

## Checklist before declaring a match
- [ ] Colors sampled from render, not guessed
- [ ] Correct font family + weights (real font, or explicitly-approved substitute)
- [ ] Font sizes / spacing measured against the render, not eyeballed once
- [ ] Real image assets used (requested from user), not placeholders
- [ ] Animations match intended behavior (confirmed with user for still renders)
- [ ] Final screenshot diffed against the render at matching viewport (overlay + `diffPercent` low and no longer improving)
