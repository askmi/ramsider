# Original PNG artwork reserve

These 22 files are **not used by the current site**. They are ready for a future, separately tested image-format selection feature. The live page continues to use `public/art/*.webp`.

Regenerate with `python3 tools/slice-background-png.py` from the repository root. The script crops the current `design/references/background.png` (11 main tiles and six FAQ rows) and `design/references/background_text.png` (five document thumbnails). It preserves each crop's original RGBA pixels and Adobe RGB (1998) ICC bytes, including the transparent right edge and the source overlap rows. It does not convert the color profile or edit the source images. `manifest.json` records source hashes, coordinates, dimensions, output hashes, and sizes; the script checks decoded pixels and ICC on every run, and matching active WebP dimensions when those files exist. Missing WebP files do not prevent rebuilding the source-exact PNG reserve.

This folder is outside `public/`, so its 46,308,888 PNG bytes do not become public assets in the current deployment. Future format selection must first publish or serve the chosen PNGs, then account for network conditions, caching, correct browser color management, performance, and the same Pro/Pro Max visual and seam checks before turning them on.
