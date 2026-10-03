# Background artwork color and delivery — 2026-10-04

## Why the earlier WebP changed color

The current `design/references/background.png` is a 941 × 32,127 RGBA export tagged **Adobe RGB (1998)**. The archived WebP files were lossy VP8 and had no ICC tag. The archive is now deleted. Losing the profile can change how the same channel numbers are interpreted; lossy VP8 also changes decoded RGB, particularly around saturated color and fine edges. The reported “−6 red” was a useful symptom, not a universal correction to apply to every pixel.

## Current production method

Run `python3 tools/convert-art-webp.py` from the repository root. The converter:

1. Crops the **current** Photoshop PNG exports using the established 11 main, six FAQ, and five document coordinates and the two-row tile overlap. No WebP is derived from a previous WebP.
2. Uses LittleCMS to transform Adobe RGB to sRGB with relative colorimetric intent and black point compensation, retaining source alpha exactly. For fully transparent rightmost pixels beside opaque artwork, it only aligns invisible RGB with the neighbor; it does not make them opaque. The browser join and outer-edge checks watch for the historic white line.
3. Encodes two sRGB lossy candidates with `cwebp -q 95 -m 6 -alpha_q 100 -metadata icc`: default and `-sharp_yuv`. It checks decoded alpha/ICC, visible-pixel RGB mean/p99, local 64px errors, red/orange shift, and sampled CIE Lab ΔE76 p99. It selects `-sharp_yuv` only where measured color improves with at most 20% more bytes and no p99 regression. A visible RGB mean ≥3/255, p99 >15/255 or mean red shift ≥2/255 triggers `-lossless -exact`. All five small document thumbnails use lossless WebP; the earlier lossy `doc-emc` had a local red/blue p99 error of 29/255. Local metrics are reviewed with browser crops even when they do not trigger automatic fallback.
4. Makes 118-pixel-wide, ICC-tagged previews for below-fold main and FAQ segments. Their compressed image bytes total roughly 60 KB and are inlined as data URLs through Next Image placeholders. Next removes each preview after the full file decodes, preserving transparent source pixels. The hero has no preview and remains eager/preloaded.
5. Writes all source hashes, crop coordinates, encodings, bytes, and RGB measurements to [color-metrics.json](evidence/art-webp/color-metrics.json).

The 22 full WebPs total **6,278,036 bytes**, versus 5,664,838 bytes before the CHG-0058 quality pass. A freshly color-converted sRGB PNG version totals **50,120,753 bytes**. The hero stays about **248 KB** versus **3,194,801 bytes** for the previous PNG hero. All five document thumbnails are now exactly lossless relative to the color-managed sRGB intermediate; no manual RGB compensation is used. The separate original PNG reserve remains Adobe RGB and source-exact.

The repeatable project rule is [artwork-color-pipeline](../.agents/skills/artwork-color-pipeline/SKILL.md), triggered by `AGENTS.md` whenever Photoshop/raster references are added, cropped, converted, or delivered differently.

## Reserved original PNG option

The future-use `design/derived/original-png/` directory contains 22 source-exact PNG crops (46,308,888 bytes) with unchanged RGBA pixels and Adobe RGB ICC from the current references. `python3 tools/slice-background-png.py` regenerates and checks them; its `manifest.json` records crop boxes and hashes. They are not referenced by the current page. Because the folder is outside `public/`, the current deployment does not carry those bytes. Publishing or serving them is part of the future format-selection feature. A future network-based format selector needs its own browser color, cache, performance, and layout checks before activation.

## Verification and limits

`tools/check-art-browser.mjs` regenerates temporary, color-managed PNG controls from the current source, serves them to WebKit only during comparison, and saves Pro and Pro Max screen pairs at hero, first join, middle, FAQ, and footer positions. See [comparison.json](evidence/art-webp/browser/comparison.json). This comparison tests browser-painted output at DPR 3 with the same HTML and CSS. Local maximum pixel errors at fine edges can exceed a global mean, so screenshots and section joins must also be inspected visually.

`tools/measure-art-webp.mjs` samples a cold Chromium iPhone 17 Pro profile on a synthetic 4 Mbps / 100 ms network. It records hero paint, preview paint, full distant artwork paint, LCP/CLS observations, and transferred bytes in [performance.json](evidence/art-webp/performance.json). It is a local synthetic sample, not a field-user speed or Lighthouse score.

The standard Pro WebKit target is the supplied clean/reference render at 402 × 874 CSS px; Pro Max is a responsive check at 440 × 956. Design overlays remain HTML and independent of artwork conversion. Photoshop soft proofing and a calibrated display remain appropriate for final editorial color judgment. sRGB cannot reproduce colors outside its gamut; if the designer identifies a specific out-of-gamut color that must be preserved on wide-gamut screens, test a separately tagged Display P3 variant with an sRGB fallback rather than editing the red channel globally.

## Other industry options

| Method | Useful when | Tradeoff |
| --- | --- | --- |
| Responsive width variants with `<picture>`/`srcset` | The layout displays a smaller bitmap than the source on different devices | More files and crop QA; this page already displays the 941-pixel artwork at smaller CSS widths, so device-pixel needs should be measured before resampling |
| Lossless WebP or optimized PNG | Logos, flat color, certificates, or a localized region fails lossy QA | More bytes; used here for four thumbnails |
| Higher-quality lossy WebP | Photographic art tolerates small measured error | VP8's 4:2:0 chroma coding can still alter saturated fine detail |
| AVIF or JPEG XL candidate | A browser matrix and measured quality/decoding advantage justify it | Requires separate color, alpha, browser and decode tests; small files alone are insufficient |
| Art-directed layers and CSS/SVG text | Product imagery, gradients, copy and controls can be separated without changing composition | More positioning work; this site already keeps copy and controls as HTML |
| Segmented lazy loading plus previews | A very tall story needs a quick first view and stable fast scrolling | Crop joins and transient preview quality need explicit browser checks |
| CDN image transformations | Many widths or dynamic assets need automatic delivery | The service must preserve/convert ICC correctly and must be checked against the master |

Sources: [Adobe web color conversion](https://helpx.adobe.com/photoshop/desktop/adjust-color/color-profiles/manage-documents-colors-for-online-viewing.html), [Google WebP FAQ](https://developers.google.com/speed/webp/faq), [Google `cwebp` reference](https://developers.google.com/speed/webp/docs/cwebp), [WebP container ICC specification](https://developers.google.com/speed/webp/docs/riff_container), [Next Image placeholders](https://nextjs.org/docs/app/api-reference/components/image), [responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images).
