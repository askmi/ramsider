# Reviewed local blocks — 2026-11-05

`review-blocks-aqua02-heat02-capsule02.png`: four 160×160 px crops, 3× nearest-neighbour zoom, **left = current lossless source, right = chosen q90 candidate**. Rows:

1. technology/slides/aqua-02 at (640, 896) — the only red-dominant region (152 px orange dot). The global mean red-shift rule fired on these 152 pixels (default −9.8/13.7, sharp_yuv −4.6/11.9); the tool now applies that rule only when red-dominant pixels are ≥ 0.1 % of the image and records `red_rule: skipped` for this asset. Visually identical at 3×.
2. technology/slides/heat-02 at (576, 704) — worst 64 px block, local MAE 10.1 (fine gold light rays over brushed metal). No visible difference.
3. technology/slides/capsule-02 at (704, 832) — worst block, MAE 5.9 (printed capsule label with QR). No visible difference.
4. technology/slides/capsule-02 at (192, 512) — worst local red block, 3.7. No visible difference.

Crops were produced with `dwebp -ppm` decodes and `ffmpeg crop/scale=flags=neighbor`; no colour management is applied to either side, so both halves share the same interpretation.
