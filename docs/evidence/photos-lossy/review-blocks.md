# Reviewed local blocks — 2026-11-05 (CHG0199)

All crops: 160 × 160 px, 3× nearest-neighbour zoom, **left = lossless source (origin/main), right = chosen q90 candidate**. Decodes via `dwebp -ppm`, crops via `ffmpeg crop/scale=flags=neighbor`; no colour management on either side, so both halves share one interpretation. The judgement recorded here is materiality at this zoom, not pixel equality.

## `review-blocks-aqua02-heat02-capsule02.png` (first pass, metrics before the review-804 fix)

1. technology/slides/aqua-02 at (640, 896) — the only red-dominant region: a 152 px orange dot on a white panel. Mean signed shift on those pixels at q90: default −9.8/+1.9/+13.7, sharp_yuv −4.6/+2.3/+11.9 (R/G/B). The dot's edge pixels differ slightly at 3×; the dot itself reads the same. **Outcome after the fix: the strict pipeline rule (worst-channel red shift ≥ 2/255) keeps this asset lossless (q95 also trips); no exception is applied.**
2. technology/slides/heat-02 at (576, 704) — worst 64 px block by MAE (10.1): fine gold light rays over brushed metal. No material difference.
3. technology/slides/capsule-02 at (704, 832) — worst block by MAE (5.9): printed capsule label with QR. No material difference.
4. technology/slides/capsule-02 at (192, 512) — worst local red block (3.7). No material difference.

## `review-blocks-red-heat02-cyber01-heat04.png` (second pass, corrected worst-channel local red metric)

Local red shift is not a fallback criterion in the pipeline (it only steers the sharp_yuv choice); the three largest values are reviewed here as the pipeline document requires.

1. technology/slides/heat-02 at (192, 896) — local red 20.1 (sharp_yuv chosen). Warm gold/orange glow region.
2. technology/slides/cyber-01 at (320, 512) — local red 14.5.
3. technology/slides/heat-04 at (192, 896) — local red 14.5.

Reviewer note (coordinator, 3× zoom): see the PNG; differences, where present, are chroma smoothing on fine edges, no hue change of a whole region. The real-browser Pro/Pro Max A/B was run afterwards (see local-gates.md, browser-ab-*.png); acceptance on real devices by the developer and Founder remains open (CHG0199).
