# Technology viewer — separate layers, 2026-10-07

The customer rejected the composite frame. Only this viewer changes; existing CTAs and gallery actions remain. CHG-0062 now separates the photograph title as well.

| Layer | Source and mapping | Implementation |
| --- | --- | --- |
| Black full-screen matte | technology_frame.PNG 954×1649 composition guide | CSS #000, full dynamic viewport; portrait canvas centered on tablet/desktop |
| Metal contour | frame01.png 941×1628, Adobe RGB; central black region x29:912/y31:1600 | Explicit LittleCMS Adobe RGB→sRGB conversion, lossless WebP with exact transparent cutout; x57:897/y159:1490 in reference space |
| Photo | Four original HeatCore PNGs (02–05), only the measured title glyph mask repaired; all other decoded RGB pixels exactly unchanged, full 941×1672 RGB/no ICC | Full PNG compressionLevel 0, Next optimization disabled, no preview; previous decoded photo retained until next decodes |
| Photo title | HeatCore ink x55:488/y127:212, Technology x54:215/y244:275 | Separate semantic TechnologyTitle React h2/SVG text, OpenSans Regular 400, source-coordinate scaling with preserveAspectRatio none to match the existing image fit; descriptor translated in all 11 locales |
| Top label | Swipe for Details, baseline reference y52:97 | Semantic button + translatable HTML in landing OpenSans Regular, approx 48/954 of canvas width |
| Right arrow | technology_frame.PNG x668:696/y49:94 | Standalone exact RGB crop, black pixels transparent; same button as label |
| Indicators | source active x383:412/y111:140, inactive x423:452/y111:140 | Four React buttons from slides, source sprites, one active decoded slide, 24×44px nonoverlapping targets (24px minimum pointer width keeps the row compact) |
| Bottom label | Next Technology, reference y1527 | Semantic OpenSans button + standalone arrow; localized honest next-group placeholder |
| Down arrow | technology_frame.PNG x455:500/y1583:1612 | Standalone exact RGB crop, black pixels transparent |
| Close | New X top-right | Existing 44px semantic close control |

Reference arrows/dots have no ICC tag: decoded RGB retained without guessing a profile. frame01 has Adobe RGB (1998), so use explicit relative colorimetric/BPC sRGB conversion and embed sRGB. Preserve contour RGB/alpha against the converted master, and arrows/dots against their source crops. Compare the contour region in actual DPR3 Pro screenshots to the calibrated source; inspect Pro Max as responsive evidence. HTML font rendering deliberately replaces the raster lettering per customer instruction. All 11 locales, Arabic direction and 320/375/768/1440 widths must fit; 44px primary actions and 24×44px pagination; no target overlap. Existing tap, swipe, keyboard, loading failure, focus and close checks still apply.

Final evidence and limits: [2026-10-07 layer checks](evidence/technology-viewer/layers/checks.md).

## Original photograph delivery correction (CHG-0061, historical baseline)

The user rejected WebP photo delivery. Remove public/art/technology/{02,03,04,05}.webp and lib/technology-previews.json. Copy the four clean tech_01 source PNGs to matching {02,03,04,05}.png byte-for-byte; no _TEXT variants. Use original files for both first render and transition decode; remove the low-resolution background preview. Contour/arrows/dots and all gallery behavior remain. Acceptance: source/public/HTTP SHA-256 equality, image/png MIME, zero .webp photograph or data-preview requests, all four decoded PNGs/screenshots in Pro/Max WebKit, relevant interaction/RTL/adaptation checks, static/build/native review and measured original payload.

## Live photograph title (CHG-0062)

Masters in design/references/tech_01 stay untouched. `node tools/prepare-technology-photos.mjs` generates full-size RGB PNGs from those masters and the four native wall reconstruction patches in design/derived/technology-title. The older byte-copy script is removed so regeneration cannot restore baked labels. A tight per-image glyph mask includes two native pixels of antialiasing guard; 03 preserves vertical groove phase through original-column interpolation and bounded reconstructed fine texture. No whole-photo resize, color/profile change, lossy encoder or tiny preview. Exact background hidden beneath opaque lettering is unavailable and is reconstructed; exact decoded identity is asserted outside the mask, including every product pixel.

Main live type: SVG x46/y209/font112/textLength446, visible OpenSans ink aligned to original x55:488/y127:212. Descriptor x54/y267/font31 and English textLength161, color #975f41 sampled from source. h2 accessible name labels the dialog, SVG lettering is decorative to assistive technology; the heading ignores pointer events so swipes work. The existing source-to-stage fit is preserved at every viewport. [Mapping, native crops, masks and real browser evidence](evidence/technology-viewer/live-title/checks.md).

## Description layer — CHG-0063

The supplied *_TEXT.png files provide copy and source positions, not replacement photographs. TechnologyDescriptions uses semantic headings/paragraphs inside source-coordinate foreignObject blocks, Open Sans Regular400 from the landing font family, matching the navigation labels. Story passes only current-locale description copy; all11locale dictionaries stay on the server. Current decoded slide index controls descriptions. Bottom-left reference folios are omitted per the user; only the four upper indicators show pagination. Pinch zoom is permitted for reading; one-finger gallery gestures, frame, live title and all accepted PNG bytes remain unchanged. Brown live text has a thin white outline for native marble-shadow contrast. See [source map](technology-description-map.md) and [evidence](evidence/technology-viewer/descriptions/checks.md).

## Post-load asynchronous warm-up — CHG-0064, 2026-10-07

After the main page window `load` event (or after hydration if already complete), start all four original PNG requests together with low fetch priority. A retained per-viewer Image/decode-promise cache reuses pending and decoded resources. Early opening starts all four immediately and promotes the first; selecting a slide promotes its request. Failed entries are removed so a later selection can retry; the old decoded slide remains visible until its replacement is ready. No change to files, format, color, dimensions, React text, frame or gestures. Total warm-up payload18,917,696B; no network can guarantee completion before an immediate opening or on a stalled connection.

## iOS browser chrome backing — CHG-0065

The customer suspects Telegram in-app browser on iOS; exact container/build is unknown. The native dialog/backdrop cover the browser content viewport, while Safari may expose underlying document paint beneath transparent toolbars. With #technology-viewer[open], CSS paints html/body black and hides the other direct children of .dialog-controller and their descendants. The rendered viewer is a sibling of main.canvas inside that wrapper, so its native dialog/AX/content stay visible. Visibility preserves layout and scroll; CSS state removal restores landing onX/Escape. No viewportmeta, permanent landingpalette, raster/font, gallerygeometry or asyncdelivery changes. Verifyblackdocumentplane even with dialog/backdroppaint suppressed; emulated mobile screenshots alone cannot prove actualphysicaltoolbarbehavior. KnownWebKit reports https://bugs.webkit.org/show_bug.cgi?id=300965 and https://bugs.webkit.org/show_bug.cgi?id=303167; exactuserOS/build unknown.

## Mobile contour at screen edges — CHG-0067

The founder updated the portrait-phone composition: remove exterior black side gutters. At portrait widths under700CSSpx, frameleft0,width100%; openingleft29/941,width883/941 follows the unmodified contour's exact native cutout. Frame/stage vertical placement, top/bottom controls, original assets and loading stay unchanged. Tablet/desktop and landscape retain prior geometry; the known short-landscape issue remains0066OPEN.
