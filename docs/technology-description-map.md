# Technology descriptions — CHG-0063, 2026-10-07

## Contract

Use the supplied `design/references/tech_01/*_TEXT.png` as text/position references and accepted current `public/art/technology/02–05.png` as unchanged artwork. Clean→TEXT pixel subtraction confirms added text and rules; the image geometry/background/product matches, with no need to swap photographs. Existing live HeatCore/Technology title is retained once.

Typeface: **Open Sans Regular**, weight 400, CSS `OpenSans`, source `design/assets/OPEN SAN/static/OpenSans-Regular.ttf`, shipped `public/fonts/opensans-regular.ttf`; same family/weight as Swipe/Next. Calibrate the new font's painted ink to source coordinates, keep reference line breaks and hierarchy in English. Translations use the same box and natural wrapping with proportionate fit; Arabic RTL.

Source plane 941×1672 scales with the accepted photograph, including the existing independent X/Y fit. Semantic HTML blocks inside source-positioned SVG foreignObject keep the same geometry without ResizeObserver; a bounded layout effect fits translated copy within its native box. Live headings and paragraphs remain available to screen readers; decorative rules and phone status are hidden from assistive technology rather than exposed as actual service state. Keep text pointer-transparent for gallery gestures; permit native pinch zoom for reading. Bottom-left source folios are explicitly ignored and omitted under the latest user correction; only the existing four upper indicators show the current photo.

## Units and geometry (native reference ink coordinates)

| Slide | Unit | Reference ink/baseline region | Initial type target |
| --- | --- | --- | --- |
| 02 | Headline | x56, y344 and402, width~686 | 48px /58 line, black |
| 02 | Upper callout | index x56/y710, title x94/y710; temp x94/y742; body x56/y774/802 | 22px /28; brown index/temp, black title/body |
| 02 | Grill callout | index x56/y839, title x96/y839; body x56/y873/901/929 | 22px /28 |
| 02 | Lower callout | index x56/y979, title x96/y979; temp x96/y1011; body x56/y1043/1071 | 22px /28 |
| 02 | Footer label/rule/body | x56/y1332; rule x56:877/y1381; body x56/y1411/1453 | 26px label; 29px /42 body; 1px gray rule |
| 03 | Eyebrow | x56/y1132 | 26px /32, brown, tracked |
| 03 | Headline | x56/y1188/1246 | 48px /58 black |
| 03 | Rule/body | rule y1324; body x56/y1359/1401/1443/1485 | 29px /42 |
| 04 | Phone diagram | RAMSIDER x132/y522,96% x251/y529; HEATING CURVE x130/y595; UPPER x81/y645, GRILL x81/y815, LOWER x81/y979 | 14–15px; white/cyan; wordmark tracking |
| 04 | Diagram right labels | UPPER x868/y857, GRILL x872/y956, LOWER x867/y1070 | 16px, tracked black |
| 04 | Eyebrow/headline | x56/y1247; heading x56/y1296 | 26px brown tracked /48px black |
| 04 | Rule/body | rule y1371; body x56/y1399/1441/1483/1525 | 29px /42 |
| 04 | Workflow | x56/y1589 | 17px tracked, three separate segments/slashes |
| 05 | Eyebrow | x56/y1242 | 26px brown tracked |
| 05 | Headline | x56/y1284/1339 | 48px /55 |
| 05 | Rule/body | rule y1408; body x56/y1428/1465/1502/1539/1576 | 29px /37 |
| all | Folio | x64/y1631 | Omitted by user request, not rendered |

## Exact English copy

**02**

THREE HEATERS.\nONE CONTINUOUS BALANCE.

01 UPPER HEAT · 0–280°C · Maintains the primary\nsession temperature.

02 GRILL MODE · Adds focused\nintensity precisely\nwhen needed.

03 LOWER HEAT · 0–160°C · Gradually preheats the\nblend from below.

Precision heating architecture

Three independently controlled heaters shape and maintain\nthe selected profile, directing heat precisely where it is needed.

**03**

ACTIVE AIR SAILS

EXCESS HEAT.\nCONTINUOUSLY RELEASED.

Twin aluminium air sails draw excess heat away from the capsule\nchamber and lower heater. Continuous passive release keeps\nthe blend stable, predictable and protected from overheating\nthroughout the session.

**04**

RAMSIDER · 96% · HEATING CURVE · UPPER · GRILL · LOWER

PROGRAMMABLE HEAT PROFILES

POWER, SHAPED OVER TIME.

HeatCore uses linear and interval algorithms to control how\npower changes throughout the session. Build and refine the\nheating profile in the RAMSIDER app, then manage the active\nsession directly from UNO’s touch display.

CREATE IN APP / CONTROL ON UNO / REFINE THE PROFILE

**05**

PRECISION SURFACE ENGINEERING

GOLD FOR PURITY.\nTITANIUM NITRIDE FOR HEAT.

HeatCore is offered in two engineered PVD finishes.\nFull-surface 24K gold gives the Gold edition a clean, precise\nexpression of taste and a distinctly noble character.\nTitanium nitride equips the PRO edition for high-temperature\nstability under frequent, sustained use.

## Acceptance and product truth

Compare all four real decoded Pro 402×874 DPR3 images to source TEXT composition, with equivalent stage mapping; inspect Pro Max440×956 DPR3 responsively. Ignore deliberately replaced font glyph shapes/ignored source folio and existing approved title, compare mapped placements/line breaks/rules/product landmarks. Native 04 phone labels must be included because clean photo lacks them, not duplicated over physical printing. Current PNG hashes/bytes stay equal to the previous accepted live-title delivery.

Test each slide's semantic copy synchronized with decoded image/active indicator, both CTAs, keyboard/touch/RTL/retry/failure/close/focus; all eleven locale texts fit, representative 320/375/768/1440 widths and zoom. Type/lint/build/native review and production JS/network/LCP/CLS/sample scroll. Technical temperatures/materials/24K/PVD/heating algorithms/app assertions remain designer copy UNVERIFIED for publication; status tracked in PRODUCT.md. Evidence: `docs/evidence/technology-viewer/descriptions/`.

## Final calibration

OpenSans400 painted ink uses headline50/50.5/51/49.5px, original English line-height58/58/58/55px; footer body28/27.5/29/28.5px with42/42/42/37px lines to preserve original line breaks in the new font. Blocks use source-space y offsets calibrated to actual ink (see paired source/Pro crops in descriptions evidence). Core brown remains #975f41; a1.5native-px white stroke painted behind brown glyph fill improves contrast across marble shadows without changing the PNG. At Pro this is under0.55CSSpx total stroke width.
