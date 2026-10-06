# Technology viewer — separate layers, 2026-10-07

The customer rejected the composite frame. Only this viewer changes; HeatCore slides, existing CTAs and gallery actions remain.

| Layer | Source and mapping | Implementation |
| --- | --- | --- |
| Black full-screen matte | technology_frame.PNG 954×1649 composition guide | CSS #000, full dynamic viewport; portrait canvas centered on tablet/desktop |
| Metal contour | frame01.png 941×1628, Adobe RGB; central black region x29:912/y31:1600 | Explicit LittleCMS Adobe RGB→sRGB conversion, lossless WebP with exact transparent cutout; x57:897/y159:1490 in reference space |
| Photo | Existing four clean HeatCore WebPs | Under contour, mapped to its exact opening; decoded transitions unchanged |
| Top label | Swipe for Details, baseline reference y52:97 | Semantic button + translatable HTML in landing OpenSans Regular, approx 48/954 of canvas width |
| Right arrow | technology_frame.PNG x668:696/y49:94 | Standalone exact RGB crop, black pixels transparent; same button as label |
| Indicators | source active x383:412/y111:140, inactive x423:452/y111:140 | Four React buttons from slides, source sprites, one active decoded slide, 24×44px nonoverlapping targets (24px minimum pointer width keeps the row compact) |
| Bottom label | Next Technology, reference y1527 | Semantic OpenSans button + standalone arrow; localized honest next-group placeholder |
| Down arrow | technology_frame.PNG x455:500/y1583:1612 | Standalone exact RGB crop, black pixels transparent |
| Close | New X top-right | Existing 44px semantic close control |

Reference arrows/dots have no ICC tag: decoded RGB retained without guessing a profile. frame01 has Adobe RGB (1998), so use explicit relative colorimetric/BPC sRGB conversion and embed sRGB. Preserve contour RGB/alpha against the converted master, and arrows/dots against their source crops. Compare the contour region in actual DPR3 Pro screenshots to the calibrated source; inspect Pro Max as responsive evidence. HTML font rendering deliberately replaces the raster lettering per customer instruction. All 11 locales, Arabic direction and 320/375/768/1440 widths must fit; 44px primary actions and 24×44px pagination; no target overlap. Existing tap, swipe, keyboard, loading failure, focus and close checks still apply.

Final evidence and limits: [2026-10-07 layer checks](evidence/technology-viewer/layers/checks.md).
