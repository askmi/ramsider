# Design sources

## Current inventory

| Path | Role | Current observation |
| --- | --- | --- |
| `design/references/32х32_B.png`, `32х32_W.png` | Approved favicon / header brand mark (CHG0107) | 32×32 opaque Adobe RGB PNG masters; lossless sRGB web derivatives: B inside `app/favicon.ico`, W at `public/art/brand-mark-white.webp`; unchanged originals |
| `design/references/background.png` | Clean artwork for implementation | 941 × 32,127 PNG, about 44 MB |
| `design/references/background_text.png` | Composited visual target | 941 × 32,127 PNG, about 44 MB |
| `design/references/fix_RAMSIDER_BUSINESS.png` | Approved supplemental correction to the main render | Adds **RAMSIDER Business** above the second account card subtitle; see [supplemental fix](docs/fix-ramsider-business.md) |
| `design/references/locale-switcher/` | Approved supplemental reference for locale switching | The current JPG and the user's latest correction govern the closed header control: small flag/code, black text and chevron, scrolling away with the header. The 11-language list retains its translucent gold-rimmed panel. See [scope and precedence](design/references/locale-switcher/README.md) and [CHG-0046](CHANGELOG.md#chg-0046); the previous PNG concepts are archived. |
| `design/assets/OPEN SAN.ZIP` | Candidate Open Sans fonts | Includes variable and static font files |
| `design/assets/BankGothic Regular.zip` | Candidate Bank Gothic font | Includes a regular TTF |
| `design/assets/RAMSIDER_Buttons.zip` | Button and arrow artwork | Contains PNG and SVG variants, including text-free buttons |
| `design/source/fon-.psb`, `Fon+box.psb`, `Work-R153.psb` | Large editable Photoshop sources | Local sources; ignored by Git |

The inspected typeface, button, and designer icon assignments are recorded in [Elements Mapping](docs/elements-mapping.md), including source coordinates, evidence, confidence limits, and the distinction between Open Sans wordmarks and BankGothic brand signatures. Exact font sizes/tracking still require browser calibration, and BankGothic embedding rights need confirmation before publication. Keep shipped font weights/subsets small. The visible page sections and controls are mapped in [docs/reference-map.md](docs/reference-map.md); inspect the actual crop before implementing any one of them.

## Implementation interpretation

Inspect the clean background first, then the text composite in manageable crops. Use local image metadata and a small overview to locate sections; keep full source files on disk and load only the active crop at enough resolution to judge its details. For each section record the native crop, section boundary, target viewport, text content/hierarchy, foreground art, controls, likely hover/click behavior, and font evidence. Decide which pixels remain artwork and which become HTML **before** coding. Use the clean image as source material, render text and controls in HTML, and compare the final composition against the text composite. Use button assets for visual surfaces only where they retain accessibility and interaction; text-free artwork is preferable when translated labels need HTML text.

The reference width is 941 px. Record section coordinates from that width before resizing. Calibrate the supplied composition against iPhone 17 Pro (402 CSS px) first, then inspect its responsive treatment on Pro Max (440 CSS px). Preserve alignment between segmented background artwork and HTML overlays. If a source layer is ambiguous, consult the PSB rather than guessing. Do not use the single tall composite as a production page.

The references govern shape, placement, crop, typography, and color. New hover, focus, empty, error, and motion states should extend that visual language without generic gradients, unrelated colors, or arbitrary font substitutions. Preserve polished editorial restraint and deliberate hierarchy. Exact design requirements should be verified in a browser screenshot, not inferred from CSS values. The matching reference screenshot is the target; a prior implementation screenshot is only a regression baseline.

For hover, focus, empty, and motion states absent from the reference, extend the existing Ramsider visual language from neighboring controls and sections. Do not introduce a separate design system or visual direction.


## Heading typography contract — CHG0108, 2026-10-15

Apply PRODUCT.md's authored English Title Case (minor words such as `to`/`the` lowercase within phrases), natural translated case, and official brand/acronym exceptions. Raster capitals are not the editorial casing authority. Store correct case in translation keys; never implement this with CSS `text-transform:capitalize/uppercase` or a generic runtime title-case function.

For all four charcoal headings, use the shared `--editorial-heading-size` responsive token anchored to the landing `#fire`:58/941 of the actual canvas width, OpenSans400, line-height1.2. Measured baseline at402px is24.777895px, at440px27.120085px; at desktop, both canvases cap941px. Preserve the existing main heading geometry. Validate actual computed font size for every h2 against #fire at each named width, then inspect real screenshots for wrap, rhythm, body/footer reflow and contrast. Source/native-image scale equality cannot establish text-size equality across941/1080 source planes.
