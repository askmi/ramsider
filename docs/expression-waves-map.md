# Expression waves — source-to-UI map (CHG-0052, superseded by CHG-0059)

## Current Web Overlay and Launch Reuse — 2026-11-01 (CHG0191)

The current runtime asset is `public/art/expression-waves.webp`: 701×401, alpha and embedded profile, 67,220 bytes; SHA-256 `2c4cc6c937304be46d420ef2e441c65fbff026fd117729c9d3a83dac3a70e6f7`. Reuse its bytes and native ratio; the PNG/extraction notes below describe history, not the current runtime path.

The original Compare placement remains x120/y14665/w701. The launch announcement reuses the same URL as decorative art behind the three live lines: x75/y1550/w790, proportional height 451.9 source px; text remains x75/y1730/w790 with shared8sourcepx line gap. The image is aria-hidden, noninteractive and lazy/low priority, with no crop, filter, rotation or asset conversion. Browser validation must inspect central glints against the text and assert native image ratio, scene bounds, equal gaps and unchanged typography. Evidence/approval follow in `docs/evidence/sales-launch/distributor-orbit.json` after verification; no pixel-fidelity claim for a new finished render.

## Historical designer asset — 2026-10-05

`design/references/01_Compare_Overlay.png` is the supplied 701×401 RGBA overlay. It replaces the masked extraction below. The production `public/art/expression-waves.png` is a byte-for-byte copy, placed at source x=120, y=14665 at its native 701-source-pixel width. The PNG has no embedded ICC profile; its color intent is unconfirmed, so no profile assignment or RGB conversion is applied. The overlay stays below live localized text and the B08 control, with lazy loading. `tools/generate-expression-waves.mjs` now validates the source geometry and copies these exact bytes; it does not regenerate the earlier mask.

## Previous reconstruction — historical

Source inspection order: `design/references/background.png`, then `background_text.png`, both at 941 × 32,127. The clean background omits the luminous ornament. The composite includes it, but also bakes in English heading, subtitle, button and UNO wordmark. The page must keep those words and the button as live localized HTML.

| Layer ID | Reference extent in 941px source | Live target | Extraction constraint |
| --- | --- | --- | --- |
| EW-L left rising arc and terminal light | x≈130–360, y≈14670–14880 | decorative image behind `#expressions`, subtitle and B08 | Exclude all heading pixels from the composite |
| EW-R right descending arc and terminal light | x≈650–810, y≈14820–15050 | same decorative image | Exclude the baked B08 surface and label |
| EW-G four short horizontal glints | x≈380–565, y≈14702, 14856, 14916, 15045 | same decorative image | Keep only the glints, not text/button |

Extract the RGB pixels of these masked regions from the composite over the clean image, with transparent pixels elsewhere. Do not redraw the waves or serve the composite as a background. Place the derived `public/art/expression-waves.png` at source x=120, y=14665, width=700 (source CSS scale 402/941 on Pro); keep it noninteractive and hidden from assistive technology. The existing live `expressions` and `choose` text boxes center on source x=470.5. B08 retains its mapped reference center at x=465.5 (about 2 CSS px left of the text axis on Pro), with localized pill widths provided by `lib/button-localized-widths.json`; this small reference offset should not be “corrected” to an arbitrary new position. Verify on real Pro/Pro Max WebKit screenshots against the source crop and check all 11 locales for centered text/button, overflow, visible waves, and clickable B08.

## Applied and checked

`tools/generate-expression-waves.mjs` produces the 700×400 transparent PNG; `components/Story.tsx` places it below live content and lazy-loads it. Real Pro/Pro Max WebKit screenshots, a contact sheet covering all 11 locales, the aligned Pro diff, behavior log and lazy/performance checks are under [expression-wave evidence](evidence/expression-waves/). The 5-source-px B08 center offset is present in the reference.
