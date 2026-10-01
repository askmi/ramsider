# Four feature icons — source mapping (CHG-0044)

The source is `design/references/background_text.png` at 941 × 32,127. Its clean pair, `background.png`, contains no icons or dividers in this section. `tools/extract-feature-icons.mjs` keeps only pixels that differ in the icon and divider bands; it excludes the words. The resulting transparent PNGs retain the source's exact gold strokes and anti-aliasing without a rectangular background patch. `components/Story.tsx` places each image by source coordinates and keeps the translated labels as HTML.

| Label key | Source icon bounds (x / y) | Source divider bounds | Asset and placement (x / y / w / h) | Live label y / font source px |
| --- | --- | --- | --- | --- |
| `control` | 367–412 / 5155–5208 | 342–437 / 5300–5301 | `feature-control.png`, 340 / 5150 / 100 / 154 | 5214 / 29 |
| `draw` | 361–425 / 5358–5421 | 342–437 / 5508–5509 | `feature-draw.png`, 340 / 5352 / 100 / 161 | 5423 / 29 |
| `intensity` | 365–414 / 5571–5619 | 342–437 / 5717–5718 | `feature-intensity.png`, 340 / 5565 / 100 / 158 | 5629 / 29 |
| `consistent` | 361–418 / 5778–5835 | none | `feature-consistent.png`, 350 / 5772 / 80 / 70 | 5840 / 29 |

The source icons are, respectively, three slider lines with staggered stems; three flowing curved lines; four separate ascending bars; and a thin circular ring. The old Unicode substitutions `☷`, `≋`, `▥`, `○` are removed. Each image has empty alt text and `aria-hidden`; the adjacent localized label supplies the meaning.

Aligned source and production Pro WebKit captures, plus Pro Max, Arabic Pro and desktop captures, are preserved in `screenshots/actual/feature-icons/`. Reconstruction of each icon/divider band over the clean source has zero missing changed pixels and a maximum channel residual of 1/255. The four PNGs total 9,106 bytes. The focused browser test, 44-state locale/width matrix, build/type/lint logs and one-run performance sample are in the same folder and recorded in CHG-0044. Other technology pictograms remain open under CHG-0015.
