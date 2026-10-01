# Seven technology annotations — source map (CHG-0045)

`design/references/background.png` contains the clean device; `background_text.png` contains the approved gold marks, connector paths, end dots, and words. `tools/extract-technology-icons.mjs` compares the two 941px-wide layers and keeps only changed pixels inside separate icon and connector masks. It excludes the words, which remain localized HTML. Each transparent PNG retains the fine source strokes and line glow without a rectangular background.

| Label | Source form | Source icon pixels, x / y | Connector route | PNG box, x / y / w / h | Live EN label, x / y / w / font |
| --- | --- | --- | --- | --- | --- |
| Triple Heat | Three rising heat strokes | 172–192 / 7123–7146 | Horizontal line and end dot to heater | 165 / 7118 / 240 / 60 | 100 / 7147 / 160 / 36 |
| Smart Core | Fine outlined chip with pins | 169–192 / 7359–7382 | Horizontal line and end dot to circuit board | 165 / 7354 / 210 / 52 | 100 / 7374 / 160 / 36 |
| Touch & App | Finger pressing a touch arc | 168–189 / 7575–7604 | Bent line from label to board; end dot | 165 / 7500 / 265 / 130 | 100 / 7602 / 160 / 36 |
| Water Sensor | Thin drop outline | 170–188 / 7813–7839 | Horizontal line and end dot to water chamber | 165 / 7808 / 260 / 65 | 100 / 7841 / 160 / 36 |
| Light & Sound | Bulb outline with rays | 711–738 / 7326–7352 | Bent route and two terminal dots | 600 / 7321 / 150 / 155 | 640 / 7356 / 160 / 36 |
| Poly Armor | Shield outline with check | 714–732 / 7570–7593 | Bent route and two terminal dots | 595 / 7565 / 152 / 145 | 640 / 7596 / 160 / 36 |
| Flow Guard | Three airflow strokes | 708–735 / 7819–7845 | Two bends to guard and chamber; end dots | 460 / 7814 / 290 / 145 | 640 / 7840 / 160 / 36 |

Source boxes and masks are encoded in the extraction script. Their mapped difference pixels reconstruct the composite over the clean source with zero missing pixels and at most 1/255 channel residual; see `screenshots/actual/technology-icons/source-accuracy.json`. PNGs are decorative (`alt=""`, `aria-hidden`) and ignore pointer events. The live words and technology dialog links retain their existing translation keys and IDs. Reference and actual browser crops are in `screenshots/actual/technology-icons/`.
