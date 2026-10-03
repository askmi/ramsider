# Elements Mapping — typography, buttons and designer icons

This is the **English reference-to-implementation map**, prepared from `design/references/background.png` first, then native-width crops of `background_text.png` (941 × 32,127 px), the supplied TTF files, the button SVG/PNG set, the new `ICON_Kit` PNGs, and representative font specimens. Coordinates below are **source-image positions**, not CSS pixels. At the iPhone 17 Pro width, 1 source px scales to `402/941 ≈ 0.427` CSS px. The earlier font/button mappings are preserved below; the designer icon mapping in the next section supersedes the agent-extracted icon shapes from CHG-0044/0045. The button mapping's [implementation verification](font-button-implementation-2026-09-30.md) records its original browser evidence and raster limits.

## Designer icon mapping — CHG-0049

The twelve supplied PNG files contain **eleven distinct shapes**. `05.png` and `06.png` are byte-identical; the render has one Light & Sound bulb, so `I06` is an inventoried duplicate, not a second page icon. The icon pixels in `background_text.png` occupy exactly the native `ICON_Kit` dimensions at the original coordinates below. Direct alpha compositing each PNG over `background.png` at that coordinate reproduces its composite region with a mean residual below 1 RGB unit per channel (rounding/colour conversion). Use the designer PNG bytes directly, without redrawing, recolouring, stretching, or substituting a glyph.

The customer rejected the former **uniform 28-source-px lift** and then the first individual correction: the technology icons still look too high against the close original crop. This second correction provisionally lowers **six** marks from the previous target by 4–6 source px: I01 +4, I03 +5, I04 +6, I05 +6, I07 +4 and I08 +4. I02 Smart Core stays at 7334 because its current measured icon-to-label gap is the smallest; this six-icon selection was initially provisional, but the customer later explicitly accepted the current icon-to-text distance for the visible result. I09–I12 remain at exact original source Y. That height correction kept all X coordinates fixed; the later non-English horizontal correction below supersedes only that X decision. Native dimensions, live translated labels, feature dividers, connector paths and terminal dots stay fixed. Source Y records the supplied render; target Y is the current UI specification. The kit contains only icons, so connectors and dividers stay separate. Customer acceptance of the vertical distance is recorded in CHG-0049; the later horizontal correction is technically verified without explicit customer acceptance.

| Component ID / role | Designer reference | Original source icon x / y | Native w × h | Target x / y after lift | Page label / planned DOM ID |
| --- | --- | ---: | ---: | ---: | --- |
| **I01** Triple Heat | [01.png](../design/assets/ICON_Kit/01.png) | 172 / 7123 | 21 × 24 | 172 / 7106 | `triple` / `icon-i01` |
| **I02** Smart Core | [02.png](../design/assets/ICON_Kit/02.png) | 169 / 7359 | 24 × 24 | 169 / 7334 | `core` / `icon-i02` |
| **I03** Touch & App | [03.png](../design/assets/ICON_Kit/03.png) | 168 / 7575 | 22 × 30 | 168 / 7561 | `touch` / `icon-i03` |
| **I04** Water Sensor | [04.png](../design/assets/ICON_Kit/04.png) | 170 / 7813 | 19 × 27 | 170 / 7802 | `water` / `icon-i04` |
| **I05** Light & Sound | [05.png](../design/assets/ICON_Kit/05.png) | 711 / 7326 | 28 × 27 | **706 / 7317** | `light` / `icon-i05`; CHG-0055 English axis correction |
| **I06** duplicate bulb | [06.png](../design/assets/ICON_Kit/06.png) | same as I05 | 28 × 27 | **unused**, identical to I05 | no second bulb / no DOM ID |
| **I07** Poly Armor | [07.png](../design/assets/ICON_Kit/07.png) | 714 / 7570 | 19 × 24 | 714 / 7554 | `armor` / `icon-i07` |
| **I08** Flow Guard | [08.png](../design/assets/ICON_Kit/08.png) | 708 / 7819 | 28 × 27 | 708 / 7799 | `flow` / `icon-i08` |
| **I09** Effortless Control | [09.png](../design/assets/ICON_Kit/09.png) | 367 / 5155 | 46 × 54 | 367 / 5155 | `control` / `icon-i09` |
| **I10** Smooth Draw | [10.png](../design/assets/ICON_Kit/10.png) | 361 / 5358 | 65 × 64 | 361 / 5358 | `draw` / `icon-i10` |
| **I11** Desired Intensity | [11.png](../design/assets/ICON_Kit/11.png) | 365 / 5571 | 50 × 49 | 365 / 5571 | `intensity` / `icon-i11` |
| **I12** Consistent Session | [12.png](../design/assets/ICON_Kit/12.png) | 361 / 5778 | 58 × 58 | 361 / 5778 | `consistent` / `icon-i12` |

### Localized technology icon axes — CHG-0049 correction

English uses the target X values above; the customer-reported I05 exception moves its native 28px box from source x711 to x706 so its center is **720**, matching the English `light` label box x640/w160. Every other locale uses the existing translated label boxes in `app/globals.css`: left labels x70/w230 have center **185**; right labels x645/w210 have center **750** (all source px). Set each icon's visual box center to that same axis: `localizedLeftX = labelCenterX − iconWidth/2`. This changes X only, so the accepted icon-to-text vertical gaps and source art remain intact. The following values are the target specification for `lib/icon-map.json` and `components/Story.tsx`; `I06` is an unused duplicate of `I05`.

| Icon ID / label | Translated label axis | Localized icon left X |
| --- | ---: | ---: |
| I01 / `triple` | 185 | 174.5 |
| I02 / `core` | 185 | 173 |
| I03 / `touch` | 185 | 174 |
| I04 / `water` | 185 | 175.5 |
| I05 / `light` | 750 | 736 |
| I07 / `armor` | 750 | 740.5 |
| I08 / `flow` | 750 | 736 |

**Application rule:** `lib/icon-map.json` is the machine-readable copy of I01–I12; `components/Story.tsx` renders the eleven used kit icons by these IDs from `/art/icon-kit/NN.png`. It renders connector-only and divider-only source layers separately, so an old extracted icon cannot remain underneath a kit icon. The kit source files are preserved at their supplied paths; public copies must match their SHA-256 hashes. All icon images are decorative (`alt=""`, `aria-hidden`) beside live localized labels and do not intercept pointer input.

## Identified files and typographic rules

| ID | Source | Evidence and intended use |
| --- | --- | --- |
| **OS-L** | `design/assets/OPEN SAN/static/OpenSans-Light.ttf` or weight 300 of `OpenSans-VariableFont_wdth,wght.ttf` | Open Sans Light. Thin secondary statements and editorial descriptions in the composite. Full-width axis (`wdth=100`); no evidence for Condensed or SemiCondensed on the page. |
| **OS-R** | `design/assets/OPEN SAN/static/OpenSans-Regular.ttf` or weight 400, `wdth=100`, of the variable TTF | Open Sans Regular. Main headings, feature names, FAQ, cards, and project names. The hero headline's shapes match this specimen better than BankGothic or Open Sans Condensed. |
| **OS-BTN** | `design/assets/RAMSIDER_Buttons/Fonts/OpenSans-Regular.ttf` | Open Sans Regular supplied *with the buttons*. `README_RU.txt` explicitly prescribes the text-free button artwork plus this font for multilingual labels. The `With_Text` SVGs have outlined glyphs (`<path>`, no live `<text>`). |
| **BG-R** | `design/assets/BankGothic Regular/BankGothic Regular.ttf` | BankGothic Regular. Square, extended capitals in the PRO/GOLD line signatures, RAMS-GROUP block, and closing `RAMSIDER UNO`. Do **not** apply it to every all-caps label or to the top navigation wordmark. The supplied BankGothic readme names a download site but does not establish an embedding license; confirm rights before publication. |

The Open Sans folders contain Light, Regular, other weights, Condensed, and SemiCondensed, plus a variable file with weight 300–800 and width 75–100. Only full-width Light and Regular are supported by the inspected reference; heavier or narrower variants should be introduced only after a glyph-level comparison. The two Open Sans Regular TTFs are different files, even though both identify as “Open Sans Regular”; use the button package's file when reproducing its outlined labels. The Open Sans assets include SIL OFL 1.1 notices.

**Confidence:** family assignment is high for ordinary Open Sans text, BankGothic's obvious square capitals, and button text (README plus contours). Exact source weight, tracking, and point size are visual estimates where the raster has no font metadata. Treat the weight column as a target to verify against the reference crop, not as Photoshop layer data. `Work-R153.psb` and `fon-.psb` contain “Open Sans” strings; no BankGothic string was found by a simple binary search, which is consistent with some brand lettering having been converted to shapes but does not prove every layer's font.

## Text on the final page

`key` names refer to `lib/story.ts` and `lib/i18n.ts`; keys that occur more than once are disambiguated by Y. A source size is given only where the current `storyNodes` data already records one, and is **not** an independently verified font-size specification. Use Open Sans at normal width unless noted. The structural rule is: primary editorial headings **OS-R/400**, secondary sentences **OS-L/300**, feature/card/FAQ labels **OS-R/400**, outlined brand signatures **BG-R/400**.

| Source Y | Visible text / translation keys | Font and weight | Notes |
| --- | --- | --- | --- |
| 60 | top `RAMSIDER` wordmark | **OS-R/400**, wide tracking | The reference has conventional Open Sans letter shapes and spaced caps. Current `.wordmark` uses BankGothic; that assignment conflicts with the render. The menu bars are drawn UI, not glyphs. |
| 220–500 | `intro` “Introducing Fograiser.”; `hero` “A New Category of / Ritual Systems.”; `expression` “UNO - Its First Expression.” | `intro`, `expression`: **OS-L/300**; `hero`: **OS-R/400** | Reference source sizes are roughly 30 and 60 px; retain its two-line break. `reserve` is in the button table. |
| 2030–2310 | `fire` “Why Fire / Had to End.”; `fireBody` ash/odor statement | heading **OS-R/400**; body **OS-L/300** | `learn` at Y 2310 is Black_Glass. |
| 3400–3560 | `moment`, `momentBody` | heading **OS-R/400**; body **OS-L/300** | “The Moment, Returned.” / “Less Mess to Manage. More Time to Share.” |
| 4830–5840 | `feeling`, `feelingBody`; `control`, `draw`, `intensity`, `consistent` | heading **OS-R/400**; body **OS-L/300**; four two-line feature labels **OS-R/400** with visible tracking | The feature icons and dividers are shapes, not font characters. `MINI`/device logos in the photographed product are artwork. |
| 6590–6870 | `complexity`, `complexityBody`; `technologies`, `open` | heading **OS-R/400**; body **OS-L/300**; oval CTA **OS-R/400**; “CLICK TO OPEN” **OS-R/400** with wide tracking | The glowing oval is custom art, not a pill from `RAMSIDER_Buttons`. |
| 7120–7830 | `triple`, `core`, `touch`, `water`, `light`, `armor`, `flow` | **OS-R/400** for both main and smaller secondary words | The difference between “Triple” and “Heat”, for example, is size, not a new family; weight 400 is the target from the native crop (medium confidence). Pictograms/connectors need separate art. |
| 8120–8320 | `choice`, `choiceBody` | heading **OS-R/400**; body **OS-L/300** | `learn` at Y 8320 is Ivory. |
| 9770–9880 | `anew`, `anewBody` | heading **OS-R/400**; body **OS-L/300** | “Time to Enjoy Anew.” and three lines about the blend. |
| 11425–12020 | film play mark; `film`; `beyond`, `beyondBody`, `beyondMore` | film label **OS-L/300**; heading **OS-R/400**; two body groups **OS-L/300** | Play triangle is an icon. `learn` at Y 12020 is Ivory. |
| 13210–13275 | repeated `technologies`, `open` | **OS-R/400** | Same glowing oval treatment as Y 6810; not a supplied button variant. |
| 14690–14940 | `expressions`, `choose` | heading **OS-R/400**; subhead **OS-L/300** | `compare` is an Ivory button. |
| 15100 and 16800 | `proLine` “UNO │ PRO LINE”; `goldLine` “UNO │ GOLD LINE” | **BG-R/400**, tracked capitals | Strong match to BankGothic's squared U/O and extended line-label caps. The divider is a rule, not a text glyph. The product's printed names are already inside `background.png`. |
| 15490–16350 | `pro`; `pro1`–`pro5`; `pro1b`–`pro5b` | heading and feature names **OS-R/400**; descriptions **OS-L/300** | `explorePro` is an Ivory button. Do not make the whole two-line feature item Light. |
| 17180–18040 | `gold`; `gold1`–`gold5`; `gold1b`–`gold5b` | heading and feature names **OS-R/400**; descriptions **OS-L/300** | `exploreGold` is an Ivory button. |
| 18255–18555 | `set`, `setBody` | heading **OS-R/400**; body **OS-L/300** | `exploreSet` is Ivory. |
| 19880–21015 | `order` | **OS-R/400** | Two-line editorial heading. |
| 20170–20735 | `step1`, `step2`, `step3` (step titles); `step1b`, `step2b`, `step3b` (explanations); panel numerals `01`–`03` | **OS-R/400** throughout; titles are larger/darker, explanations smaller/muted, numerals gold | The native crop shows one sans construction at these sizes; assignment of weight 400 to the muted explanations is medium confidence and must be checked in the browser. |
| 20560–20860 | `proInitial`, `goldInitial`, `proFinal`, `goldFinal`; `finalPayment` | **OS-R/400** | Smaller regular payment rows; the label “Final Payment” is smaller again. All payment amounts are unverified product claims. `create` at Y 21015 is Ivory. |
| 21280–23200 | `tested`, `testedBody`, `documented`, `documentedBody` | headings **OS-R/400**; secondary lines **OS-L/300** | Both section headings keep the reference's deliberate wraps. |
| 23285–24000 | `electrical`, `emc`, `uae`, `rohs`, `telecom`, `allDocs` | **OS-R/400** | Card titles, including “All Documents.” |
| 23285–24000 | document identifiers (`IEC…`, `CB Scheme…`, `ECAS…`, `UAE RoHS…`, `TDRA…`), `PRO · GOLD`/`UNO PRO`, `allDocsBody` | **OS-R/400** | Fine detail and card subtitle use smaller size/muted color (medium confidence for weight); thumbnails are image artwork. |
| 23285–24000 | `docView`, `allDocsView` | **OS-R/400** | Gold text row with rule and arrow, not a packaged pill. |
| 24250–24420 | `venues`, `venuesBody` | heading **OS-R/400**; body **OS-L/300** | Hospitality intro. |
| 25800–26845 | `mini` “MINI │ STATION”; `hospitalityLabel`; `hospitality`, `hospitalityBody` | `mini` and label **OS-R/400** with tracking; heading **OS-R/400**; body **OS-L/300** | `mini` has ordinary sans glyphs in the crop and should not inherit the BankGothic `.brand` rule. The business CTA is custom outlined artwork. |
| 27000–28422 | `faqTitle`, `faqSubtitle`; `faq1`–`faq6`; `account`, `accountBody`, `venueAccount` | title and FAQ questions **OS-R/400**; subtitle and account detail **OS-L/300**; account title **OS-R/400** | Minus marks, locks, and card surfaces are UI shapes. FAQ answer text is not present in the reference; use readable Open Sans for any approved answer. |
| 28680–29170 | `powered`, `group`, `groupTag`, `groupInvest`, `groupVision` | **BG-R/400** with substantial tracking | Clear BankGothic specimen match across the dark RAMS-GROUP panel. Text colors vary cream and gold. |
| 29290–30572 | `projects` “SELECT A PROJECT”; `projectLabel`, `project1`–`project4`, `project1Body`–`project4Body`, `project2More`, `active`, `projectLink` | **OS-R/400** for every listed key; size/color/tracking establish hierarchy | `projects` is Open Sans, despite the current `brand` class. The small descriptions and uppercase sublines are regular in this target map (medium confidence for the smallest lines); the arrow circles are UI shapes. Fine copy needs its existing accessible detail view at mobile size. |
| 31600–31985 | `final`; `finalBrand`; `finalBody` | closing headline **OS-R/400**; `RAMSIDER UNO` **BankGothic/700** (browser synthetic bold from bundled regular face); body **OS-R/400** visually (verify against crop) | Final `create` is Black_Glass with arrow. `finalBrand` is a separate treatment from the top wordmark. User's later correction requires the heavier closing wordmark. |

The text printed on the physical devices, the station drawer, and inside certificate thumbnails is present in **both** PNGs and stays image artwork. The overlay text listed above appears in the composite and is absent from the corresponding clean-background regions. For example, clean/composite image subtraction finds no added text at the hero device badge, but detects the top navigation wordmark, hero text, model-line signatures, RAMS-GROUP text, and closing brand line. Do not add duplicate HTML glyphs over photographed labels; retain accessible product descriptions separately.

## Complete button asset inventory — rechecked 2026-09-30

The initial inventory below is now implemented. All B01–B14 map names are actual DOM IDs; D/F/P/A/Q/M controls also have the named IDs. The selector column remains valid. Calibrated pill placement and type sizes live in `lib/button-map.json`; `lib/story.ts` holds the other text/custom-control placements. Repeated `learn`, `create`, and `technologies` keys must not be used alone as unique button identities.

Source root: `design/assets/RAMSIDER_Buttons/`. [Preview.jpg](../design/assets/RAMSIDER_Buttons/Preview.jpg) shows **5 examples × 3 themes**, not all 15 designs. All **45 design/theme combinations** were visually inspected from their PNGs; all **90 button SVGs and 90 PNGs**, plus the two separate SVG/PNG arrow pairs, were inventoried. Each PNG is exactly 4× its paired SVG width and height. [README_RU.txt](../design/assets/RAMSIDER_Buttons/README_RU.txt) specifies the text-free artwork plus the supplied font for localization.

For every filename stem in the following table, all twelve files exist: `{Ivory,Black_Glass,Clear}/{With_Text,Without_Text}/<stem>.{svg,png}`. This path rule is the exhaustive file mapping; an “unused” entry means present in the asset library but not selected by this page's reference. `With_Text` contains outlined glyphs; `Without_Text` removes those glyphs **but retains any arrow and circle**.

### All 15 designs

Dimensions and radii below are exact **SVG user units**, not final page CSS sizes. SVG outer size includes a nominal 10-unit margin on every side; the body starts at `(10,10)`. Body dimensions describe the rectangle path; the 1.7-unit border extends another 0.85 units around it. All corners have the same radius `h/2`, forming symmetric semicircular ends.

| Asset stem | Exact packaged text | SVG outer W×H | Body W×H; radius | Label size | Icon in both text variants | Page assignment |
| --- | --- | --- | --- | --- | --- | --- |
| `Compare` | Compare | 439×102 | 419×82; r=41 | 25 | Right, no circle | B08 · Ivory; live label differs |
| `Create_UNO` | Create Your UNO | 415×102 | 395×82; r=41 | 25 | Right, no circle | B12 · Ivory |
| `Explore_Features` | Explore Features | 373×102 | 353×82; r=41 | 25 | None | Unused; B03/B07 are glowing ovals |
| `Explore_GOLD` | Explore GOLD | 336×102 | 316×82; r=41 | 25 | Right, no circle | B10 · Ivory |
| `Explore_Hospitality` | Explore Hospitality | 468×120 | 448×100; r=50 | 28 | Right, no circle | Unused; B13 is a rectangular outline |
| `Explore_PRO` | Explore PRO | 336×102 | 316×82; r=41 | 25 | Right, no circle | B09 · Ivory |
| `Explore_Set` | Explore the Set | 359×102 | 339×82; r=41 | 25 | Right, no circle | B11 · Ivory |
| `Final_Create_UNO` | Create Your UNO | 411×94 | 391×74; r=37 | 25 | Right, no circle | B14 · Black_Glass |
| `Learn_More` | Learn More | 224×92 | 204×72; r=36 | 25 | None | B02 · Black_Glass; B04/B06 · Ivory |
| `Learn_More_Arrow` | Learn More | 285×92 | 265×72; r=36 | 25 | Right, no circle | Unused; all three Learn more controls have no arrow |
| `Reserve_Now` | Reserve Now | 233×92 | 213×72; r=36 | 25 | None | B01 · Black_Glass |
| `Reserve_Now_Circle` | Reserve Now | 292×92 | 272×72; r=36 | 25 | Right, inside circle | Unused; hero has no circle or arrow |
| `View_All_Documents` | View All Documents | 426×98 | 406×78; r=39 | 25 | Right, no circle | Unused pill; D06 is a card row |
| `View_Document` | View Document | 345×98 | 325×78; r=39 | 25 | Right, no circle | Unused pill; D01–D05 are card rows |
| `View_Documents` | View Documents | 373×98 | 353×78; r=39 | 25 | Down, no circle | Unused; no downward document pill in reference |

### Themes, frame, highlight and text

| Theme | Body gradient: top / 52% / bottom | Body opacity | Label fill | Embedded arrow stroke |
| --- | --- | --- | --- | --- |
| `Ivory` | `#f8f6f0` / `#e9e6df` / `#f5f2eb` | 1 | `#39332b` | `#b28a46` |
| `Black_Glass` | `#393935` / `#151612` / `#22231e` | 0.94 | `#f3ebd7` | `#e1c484` |
| `Clear` | `#ffffff` / `#f3ede3` / `#ffffff` | 0.10 | `#514334` | `#b28a46` |

Shared frame: vertical gold gradient at 0/25/50/75/100% = `#bf9147`, `#f1d59b`, `#c39a53`, `#e1bc76`, `#a87935`; stroke **1.7**. Inner rectangle starts at `(12.5,12.5)`, has body width/height minus 5 and radius minus 2.5; stroke `#fff4d7`, opacity **0.25**, width **0.65**. Highlight is vertically symmetric across the width: white opacity **0.32** at top, fading to zero by **42%** height. No displaced outer drop shadow or SVG filter is present. Clear retains the gold rim, inner rim and highlight; it is not completely empty fill.

**Button font:** [Fonts/OpenSans-Regular.ttf](../design/assets/RAMSIDER_Buttons/Fonts/OpenSans-Regular.ttf), family **Open Sans**, style **Regular**, OS/2 weight **400**, version **3.003**, units-per-em **2048**. This is `OS-BTN` in the typography table. Outlined label transforms establish the exact package font sizes: `0.01220703125 × 2048 = 25`; Hospitality uses `0.013671875 × 2048 = 28`. These package sizes are not the calibrated raster-reference text sizes: the page render uses different label/body proportions in some places. Keep that distinction when matching the page. The outlined paths also preserve each English label's placement and baseline; inspect the paired `With_Text` specimen rather than assuming a shared text X coordinate. Render translated HTML labels using the package font, regular style/weight, and reserve space for the embedded icon. Preserve reference casing: **“Reserve now” / “Learn more”** on the page versus “Reserve Now” / “Learn More” in the package. CSS now registers `OpenSansButton` from `public/fonts/opensans-button.ttf`, copied from the package. General Light and Regular use the supplied static faces; the old variable font is no longer requested.

### Exact arrow construction

| Icon | Source geometry and treatment | Assignment |
| --- | --- | --- |
| Standard embedded right arrow | Open stroked path, horizontal shaft **24** units, two 45° head segments with **9×9** offsets; total centerline bounds **24×18**. Stroke **2.2**, rounded caps/joins, no fill. Vertically centered at body H/2 + 10. Tip is 20 units inside the body right edge. Colors are theme-specific above. | All arrow pills except the reserve circle and downward documents variant. It is already in `Without_Text`; do not add a second arrow or replace it with the font glyph `→`. |
| `Reserve_Now_Circle` | Circle center `(250,46)`, radius **30**, rim-gradient stroke **1.4**. Arrow shaft from `(238,46)` to `(262,46)`, head through `(253,37)` and `(253,55)`, stroke **2.2**. | Library variant only; not hero Reserve now. |
| `View_Documents` | Same standard arrow rotated **90° around (331,49)**, pointing down. | Library variant only. Do not confuse with singular `View_Document`. |
| `Arrow_Right.svg` / `.png` | **56×56** SVG / **224×224** PNG. **Includes circle** centered `(28,28)`, r=**24**, stroke `#b99154`, width **1.5**. Arrow path `M18 28H38M29 19L38 28L29 37`, stroke `#b18a4e`, width **2.2**, rounded caps/joins, no fill. | P01–P04 project arrow circles: use the complete icon; reference size/placement still needs calibration. The former map incorrectly said the circle was separate. |
| `Arrow_Down.svg` / `.png` | Same 56×56 / 224×224 circle. Arrow path `M28 18V38M19 29L28 38L37 29`, same colors/strokes. | No confirmed matching page control; do not substitute for menu bars, FAQ minus, locks or play. |

### Mapping to the existing page buttons

`Bxx` names identify the 14 `style: 'button'` entries in [lib/story.ts](../lib/story.ts), rendered by `OverlayNode` in [components/Story.tsx](../components/Story.tsx). Y records the **initial source-coordinate placement before browser calibration** in that file (941-wide composition), not measured CSS Y or an assertion of pixel alignment. Theme/file paths in this table are relative to the source root; use `.png` at the same path only as the paired raster alternative. All selected pill surfaces use their existing embedded arrow if present.

| Map ID / stable name | Y; current HTML selector | Reference text / translation key | Selected surface and required appearance | Current action |
| --- | --- | --- | --- | --- |
| **B01 `hero-reserve`** | 500; `.key-reserve` | Reserve now · `reserve` | `Black_Glass/Without_Text/Reserve_Now.svg`; dark translucent pill, r36, warm ivory text, **no arrow/circle**. | `unavailable-commerce` modal dialog |
| **B02 `fire-learn`** | 2310; `.key-learn[href="#moment"]` | Learn more · `learn` | `Black_Glass/Without_Text/Learn_More.svg`; dark pill, r36, warm ivory text, **no arrow**. | `#moment` |
| **B03 `technology-experience`** | 6810; `#technology-experience` | Experience UNO Technologies · `technologies`; CLICK TO OPEN · `open` | Custom thin glowing elliptical orbit, white Open Sans Regular text; separate small tracked instruction. **No matching package pill.** Existing `/art/tech-ring.svg` is an implementation asset, not one of the supplied button files. | `unavailable-technology` modal with seven source-feature links |
| **B04 `choice-learn`** | 8320; `.key-learn[href="#anew"]` | Learn more · `learn` | `Ivory/Without_Text/Learn_More.svg`; ivory pill, r36, dark text, **no arrow**. | `#anew` |
| **B05 `film-label`** | 11600; `.key-film` | Watch UNO Films · `film` | Custom white Open Sans Light caption, no pill/background, no inline arrow or triangle; play circle is F01 below. | `unavailable-film` modal dialog |
| **B06 `beyond-learn`** | 12020; `.key-learn[href="#expressions"]` | Learn more · `learn` | `Ivory/Without_Text/Learn_More.svg`; ivory pill, r36, dark text, **no arrow**. | `#expressions` |
| **B07 `technology-repeat`** | 13210; `#technology-repeat` | Experience UNO Technologies · `technologies`; CLICK TO OPEN · `open` | Same custom orbit family as B03, reference-specific size; no package pill. | `unavailable-technology` modal |
| **B08 `expressions-compare`** | 14940; `.key-compare` | Compare PRO & GOLD · `compare` | `Ivory/Without_Text/Compare.svg`; ivory pill, r41, dark **full reference label**, gold right arrow. Package text says only “Compare”; it must not replace this label. | `unavailable-compare` PRO/GOLD comparison modal |
| **B09 `pro-explore`** | 16350; `.key-explorePro` | Explore PRO · `explorePro` | `Ivory/Without_Text/Explore_PRO.svg`; ivory pill, r41, dark text, gold right arrow. | `unavailable-pro` modal dialog |
| **B10 `gold-explore`** | 18040; `.key-exploreGold` | Explore GOLD · `exploreGold` | `Ivory/Without_Text/Explore_GOLD.svg`; ivory pill, r41, dark text, gold right arrow. | `unavailable-gold` modal dialog |
| **B11 `set-explore`** | 18555; `.key-exploreSet` | Explore the Set · `exploreSet` | `Ivory/Without_Text/Explore_Set.svg`; ivory pill, r41, dark text, gold right arrow. | `unavailable-set` modal dialog |
| **B12 `order-create`** | 21015; `#order-create` | Create Your UNO · `create` | `Ivory/Without_Text/Create_UNO.svg`; ivory pill, r41, dark text, gold right arrow. | `unavailable-commerce` modal dialog |
| **B13 `hospitality-explore`** | 26845; `.key-business` | Explore Business Solutions · `business` | Custom transparent **rectangular outline with small equal corner radii**, brown text and gold right arrow. `Explore_Hospitality` is a different label and pill silhouette; no exact packaged surface. Exact custom radius/color require raster calibration, not r50 from that pill. | `unavailable-business` modal dialog |
| **B14 `final-create`** | 31985; `#final-create` | Create Your UNO · `create` | `Black_Glass/Without_Text/Final_Create_UNO.svg`; dark translucent pill, **r37**, warm ivory text, light gold right arrow. Different aspect ratio from B12. | `unavailable-commerce` modal dialog |

For B03/B07, the Russian defect correction [CHG-0030](../CHANGELOG.md#chg-0030) shifts both localized text layers up by 16 source px to center their combined visible ink within the oval. English source coordinates, each ring and its hit box stay fixed. The two text lines remain separate mapped nodes (`technologies` and `open`).

For a body of source width `w` rendered at CSS width `W`, preserve its artwork aspect ratio using scale `W/w`; outer SVG width is `(w+20) × scale` and its visible body starts 10 scaled units inside it. At the reference-to-Pro page scale, one reference pixel is `402/941` CSS px (Pro Max `440/941`), but **package SVG units and reference pixels are separate coordinate systems**. Calibrate each visible body against its reference crop before assigning CSS dimensions. Do not distort a pill or its arrow using independent X/Y scaling. Keep the touch target large enough separately from the visible surface.

### Document cards and separate action controls

Document Y below is the card top from `DocumentCards`, not the baseline of its bottom action row. Each D01–D06 action is gold/brown Open Sans Regular text plus a right arrow along the bottom of a translucent rounded **card**. These are **not standalone pills**, including the All Documents card. The standalone `Arrow_Right` includes a circle and therefore is not an exact document-row icon; use a separately calibrated open right-arrow path. Card radii are not package pill radii.

| Map ID / name | Current selector | Reference association / key | Surface/icon mapping |
| --- | --- | --- | --- |
| **D01 `document-electrical`** | `.doc-card button[popovertarget="doc-detail-electrical"]` | Y23285, Electrical Safety; `docView` = View Document | Custom card row; `View_Document` package pill unused. |
| **D02 `document-emc`** | `.doc-card button[popovertarget="doc-detail-emc"]` | Y23285, EMC Compatibility; `docView` | Same custom card row. |
| **D03 `document-uae`** | `.doc-card button[popovertarget="doc-detail-uae"]` | Y23530, UAE Conformity; `docView` | Same custom card row. |
| **D04 `document-rohs`** | `.doc-card button[popovertarget="doc-detail-rohs"]` | Y23530, RoHS Compliance; `docView` | Same custom card row. |
| **D05 `document-telecom`** | `.doc-card button[popovertarget="doc-detail-telecom"]` | Y23775, UAE Telecom Registration; `docView` | Same custom card row. |
| **D06 `documents-all`** | `.doc-card--all button` | Y23775, All Documents; `allDocsView` = View All Documents | Same custom card row; `View_All_Documents` and down-arrow `View_Documents` pills unused. |
| **F01 `film-play`** | `.film-play` | Y11425; accessible name `film` | Custom glowing circular ring with filled right-facing triangle, no shaft; neither supplied arrow icon matches. |
| **P01 `project-ramsider`** | `.project-hit[popovertarget="project-detail-1"]` | Row Y29586; `project1`, `projectLink` | `Arrow_Right.svg` complete circle/arrow; adjacent “PROJECT PAGE · VIDEO” live text. |
| **P02 `project-ramsmobile`** | `.project-hit[popovertarget="project-detail-2"]` | Row Y29908; `project2`, `projectLink` | Same complete `Arrow_Right.svg`. |
| **P03 `project-ramswear`** | `.project-hit[popovertarget="project-detail-3"]` | Row Y30248; `project3`, `projectLink` | Same complete `Arrow_Right.svg`. |
| **P04 `project-ramsfood`** | `.project-hit[popovertarget="project-detail-4"]` | Row Y30572; `project4`, `projectLink` | Same complete `Arrow_Right.svg`. |
| **A01 `account-personal`** | `.account-hit` first occurrence | Y28230; `account` / `accountBody` | Custom dark card and lock artwork; no package pill/icon. |
| **A02 `account-venue`** | `.account-hit` second occurrence | Y28350; `businessAccount` / `venueAccount` | Supplemental `fix_RAMSIDER_BUSINESS.png` adds “RAMSIDER Business” above the subtitle. Custom dark card and lock artwork; no package pill/icon. |
| **Q01 `faq-preorder`** | `.faq-stack details:nth-child(1) > summary` | `faq1` | Light rounded row and gold minus already baked into clean artwork; closed HTML summary is transparent and supplies only live text (Open Sans Regular, 34 source px). See [FAQ correction](fix-faq-accordion.md). |
| **Q02 `faq-set`** | `.faq-stack details:nth-child(2) > summary` | `faq2` | Same FAQ treatment. |
| **Q03 `faq-shipping`** | `.faq-stack details:nth-child(3) > summary` | `faq3` | Same FAQ treatment. |
| **Q04 `faq-tracking`** | `.faq-stack details:nth-child(4) > summary` | `faq4` | Same FAQ treatment. |
| **Q05 `faq-support`** | `.faq-stack details:nth-child(5) > summary` | `faq5` | Same FAQ treatment. |
| **Q06 `faq-venue`** | `.faq-stack details:nth-child(6) > summary` | `faq6` | Same FAQ treatment. |
| **M01 `navigation-toggle`** | `.menu > summary` | Top navigation; `menu` | Custom two horizontal bars; no package pill/icon. |

Utility controls outside the supplied closed-page reference also have deterministic names: `home-link` = `.wordmark`; `navigation-<section>` = `.menu nav > a[href="#<section>"]` for moment/technology/choice/expressions/pro/gold/set/order/documents/hospitality/faq/final; `locale-<locale>` = `.locale-links a[hreflang="<locale>"]` for all 11 locale codes. Modal close buttons are named `close-<target>` and located by `button[popovertargetaction="hide"][popovertarget="<target>"]`, including each unavailable/model/set/document/project target. Trigger attributes are handled by `DialogController` to open native modal dialogs; these are not non-modal popovers. Their open-state designs have no supplied reference or confirmed library assignment. The project “ACTIVE” badge is a status span, not a button.

### Applied implementation

- `lib/button-map.json` explicitly binds each B ID to its variant and calibrated reference geometry. `OverlayNode` renders semantic links/buttons and live localized text; an unmapped button fails the build rather than falling back to an arbitrary pill.
- `tools/generate-buttons.py` derives the ten selected pill surfaces from the supplied text-free SVGs. It adjusts only the straight middle width and the arrow's X position, preserving source height, corner radii, arrow path, gradients and strokes; each result is uniformly scaled to the reference body. Re-run this script after changing pill geometry. The reference and package have different aspect ratios; these are documented derivatives, not independently stretched PNGs.
- Pill arrows remain embedded in the surfaces. The project icon is the complete supplied `Arrow_Right.svg`. Document rows and hospitality use an open SVG path; play uses a filled SVG triangle. All labels remain HTML and use translation keys.
- Font roles are assigned per the table. Open Sans Regular is used for the top wordmark and MINI/STATION; BankGothic for the mapped signatures. UNO versus PRO/GOLD LINE and MINI versus STATION have separate sizes and a drawn divider. The closing label is centered in its available text area.
- English visible pills preserve the calibrated reference size; localized pills expand or contract their straight middle to fit each one-line translation with balanced padding and arrow clearance while preserving source caps, gradient, stroke and arrow. An independently tested pseudo-element provides at least 44 CSS px vertical touch coverage. Arabic mirrors directional artwork. Custom orbit/card/outline silhouettes remain distinct. This supersedes the earlier rule that allowed long translations to wrap (CHG-0004 reopened by the user's German screenshot).

### Mapping validation and implementation boundary

Verified: clean reference crops before composited crops; original Preview; all 45 rendered variants; all 92 SVG/PNG dimensions; each supplied variant's body/arrow/font metadata; current `storyNodes`, `OverlayNode`, `DocumentCards`, `Faq`, `Menus`, project/account controls and close controls. All 14 story-button entries have individual names, including repeated translation keys. The map distinguishes selected assets, unused assets, and custom controls.

The specification has been applied and browser-tested; see [implementation verification](font-button-implementation-2026-09-30.md). The original inventory's file/font/geometry measurements remain valid. Product endpoints remain as recorded in `PRODUCT.md`: local dialogs/anchors do not establish checkout, certificate downloads or film availability.

## Implementation limits

The English PNG is the typography reference. Button labels for Arabic, Chinese, Japanese and Korean use small bundled Noto Sans subsets in the page and width calibrator, so their measured widths do not depend on system font availability. The tested locale matrix verifies bounds and interaction, not native editorial approval of translations. The selected SVG package's rim/glyph rendering and the raster reference are not numerically identical; the verification record retains the tight-crop differences instead of claiming pixel-perfect equivalence. BankGothic publication rights and product facts remain unverified as before.
