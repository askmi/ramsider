# Design sources

## Current inventory

| Path | Role | Current observation |
| --- | --- | --- |
| `design/references/background.png` | Clean artwork for implementation | 941 × 32,127 PNG, about 44 MB |
| `design/references/background_text.png` | Composited visual target | 941 × 32,127 PNG, about 44 MB |
| `design/references/fix_RAMSIDER_BUSINESS.png` | Approved supplemental correction to the main render | Adds **RAMSIDER Business** above the second account card subtitle; see [supplemental fix](docs/fix-ramsider-business.md) |
| `design/references/locale-switcher/` | Approved supplemental reference for locale switching | Three user-approved concept renders with country flags: hero, persistent scrolled control, and open 11-language list. This changes the original brief for the switcher only; see [scope and precedence](design/references/locale-switcher/README.md) and [CHG-0029](CHANGELOG.md#chg-0029). The implemented states are recorded in [CHG-0032](CHANGELOG.md#chg-0032). Later direct instructions [CHG-0036](CHANGELOG.md#chg-0036)/[CHG-0037](CHANGELOG.md#chg-0037) supersede the PNG only for translucent gold-rimmed panel material and desktop top-line alignment. |
| `design/assets/OPEN SAN.ZIP` | Candidate Open Sans fonts | Includes variable and static font files |
| `design/assets/BankGothic Regular.zip` | Candidate Bank Gothic font | Includes a regular TTF |
| `design/assets/RAMSIDER_Buttons.zip` | Button and arrow artwork | Contains PNG and SVG variants, including text-free buttons |
| `design/source/fon-.psb`, `Fon+box.psb`, `Work-R153.psb` | Large editable Photoshop sources | Local sources; ignored by Git |

The inspected typeface and button assignments are recorded in [docs/font-button-map.md](docs/font-button-map.md), including source coordinates, evidence, confidence limits, and the distinction between Open Sans wordmarks and BankGothic brand signatures. Exact font sizes/tracking still require browser calibration, and BankGothic embedding rights need confirmation before publication. Keep shipped font weights/subsets small. The visible page sections and controls are mapped in [docs/reference-map.md](docs/reference-map.md); inspect the actual crop before implementing any one of them.

## Implementation interpretation

Inspect the clean background first, then the text composite in manageable crops. Use local image metadata and a small overview to locate sections; keep full source files on disk and load only the active crop at enough resolution to judge its details. For each section record the native crop, section boundary, target viewport, text content/hierarchy, foreground art, controls, likely hover/click behavior, and font evidence. Decide which pixels remain artwork and which become HTML **before** coding. Use the clean image as source material, render text and controls in HTML, and compare the final composition against the text composite. Use button assets for visual surfaces only where they retain accessibility and interaction; text-free artwork is preferable when translated labels need HTML text.

The reference width is 941 px. Record section coordinates from that width before resizing. Calibrate the supplied composition against iPhone 17 Pro (402 CSS px) first, then inspect its responsive treatment on Pro Max (440 CSS px). Preserve alignment between segmented background artwork and HTML overlays. If a source layer is ambiguous, consult the PSB rather than guessing. Do not use the single tall composite as a production page.

The references govern shape, placement, crop, typography, and color. New hover, focus, empty, error, and motion states should extend that visual language without generic gradients, unrelated colors, or arbitrary font substitutions. Preserve polished editorial restraint and deliberate hierarchy. Exact design requirements should be verified in a browser screenshot, not inferred from CSS values. The matching reference screenshot is the target; a prior implementation screenshot is only a regression baseline.

For hover, focus, empty, and motion states absent from the reference, extend the existing Ramsider visual language from neighboring controls and sections. Do not introduce a separate design system or visual direction.
