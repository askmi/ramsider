# Technology descriptions — CHG-0063, 2026-10-07

## Delivered scope

- Typeface **Open Sans Regular (400)**, CSS `OpenSans`, same landing font family; Regular400 matches Swipe/Next and landing headings (secondary landing paragraphs use Light300). [Source/position/copy map](../../../technology-description-map.md).
- All description units from the four TEXT references: headings, paragraphs, three heater callouts/ranges, phone/diagram words, workflow; bottom-left source folios are omitted per the latest user correction. Semantic HTML headings/paragraphs in React follow the accepted941×1672 source plane and current decoded slide. All11locale keys; only the current locale is serialized by Server Story. Translations have layout checks, without a native-language editorial certification.
- Accepted public PNGs/source masters/frame/live title are unchanged. The suite verifies masterSHA, accepted deliverySHA, HTTP/public byte identity, exactRGB outside prior authorized title masks, full941×1672 RGB/noICC PNG. No new encoding, conversion, resize or tiny preview.

## Actual visual evidence

- Final Pro402×874 DPR3: [1](pro-slide-1.png), [2](pro-slide-2.png), [3](pro-slide-3.png), [4](pro-slide-4.png). Final Max440×956 DPR3: [1](pro-max-slide-1.png), [2](pro-max-slide-2.png), [3](pro-max-slide-3.png), [4](pro-max-slide-4.png). Real WebKit after font/image decode.
- Source TEXT/actual Pro crop pairs, source at left and actual at right: [1](comparison-slide-1.png), [2](comparison-slide-2.png), [3](comparison-slide-3.png), [4](comparison-slide-4.png). Equivalent source geometry; deliberate new OpenSans glyph shapes/ignored source folio/accepted separate title excluded from an exact glyph-match claim. English line breaks, hierarchy, rules, callout endpoints and phone/device labels inspected.
- [Browser RGB comparison](browser-pixel-comparison.json): **0 changed pixels/maxRGB error0 outside the new description regions in all8** against accepted CHG0062 captures. Original product/frame/title/controls remain identical outside those regions. No claim about exact original font shapes.
- Initial reference-brown typography failed local contrast over marble shadows (minimum04~1.02,05~1.87,02~3.62,03~4.25); independent Stage3 FAIL recorded. Final same brown#975f41 has a1.5native-px white stroke painted behind fill, under0.55CSSpx total stroke width at Pro. [Limited contrast check](contrast.json): brown-to-outline5.212:1; unoutlined black minimum4.789, phonewhite20.748/cyan11.583. Final mobile captions inspected after recapture. [Actual browser styles](browser-styles.json) confirm stroke/paint-order in WebKit/Chromium.

## Behavior, adaptation and checks

- [Production viewer suite](browser-tests.log): **28/28 PASS**, Pro/Max WebKit and desktopChromium/Firefox. Includes all4English copy/font/box-fit captures, untouchedPNG hashes/HTTP, both CTAopeners, fouractive dots, topadvance, keyboard, RTL/touch pointers, X/Escape/focus, delayed/failed load with descriptions matching the visible decoded slide and edge-exiting swipe.
- [Production integration](integration.log): **4/4 PASS**, both technology entry points and native dialog focus containment/restoration. Initial invocation accidentally used default3000/broadgrep,7/8 with unrelated loadtimeout; discarded as production evidence and repeated the affected scopedcase on explicit3021.
- [Adaptation](adaptation.json): **26/26 cases /104 description states PASS**: all11locales at375/768 plusEN/AR320/1440. No box overflow, source geometry/controls intact, OpenSans CSS family, ArabicRTL. [AR](ar-375-slide-1.png) and [RU](ru-375-slide-1.png) inspected with all4locale screenshots retained.
- CUA native accessibility tree exposes HeatCoreh2, currenth3, callouth4 and all paragraphs in reading order. Decorative status/rules hidden from assistive tech. Actual viewport permits zoom (`width=device-width, initial-scale=1`), artworktouch-action `pinch-zoom`; one-finger gestures tested. Physical-device native pinch and screen-reader session were not available; no hardware or fullWCAG certification claim.
- [Typecheck](typecheck.log), [lint](lint.log), [build](build.log) PASS;14static routes. Initial missing new Story prop caught by typecheck and fixed before browser verification. Native reviews found no functional regression; [final pre-record review](native-review-final.log) requested dated journal closure, resolved by the dated primary approval in CHG0063; [delivery review](native-review-delivery.log) found no actionable regression after journal closure.

## Production measurement

[Single unthrottled local Chromium sample](performance.json),402×874 DPR3, production3021: FCP/LCP100ms, TTFB29.5ms, CLS0, JS159,398B (+1,401B vs accepted title baseline),0initial technology requests, viewerdecodedready150ms. Scroll120frames,p9517.8ms,0>33ms; no pageerrors. First originalPNGtransfer4,729,724B;18,917,696B full four-photo payload unchanged under original-only policy. No fieldINP, Lighthouse or slow-network score claim. Static route/current-locale server serialization retained; no measured reason to add request-time rendering or further client splitting.

## Approval and limitations

Primary technical approval **APPROVED** on2026-10-07 (Codex primary verifier). Independent scope, final visual, behavior/adaptation and code-review/performance gates **PASS** on2026-10-07. Native delivery review after dated journal closure: no actionable regression. Independent final staged record audit **PASS** on2026-10-07. User acceptance of this new description stage NOT_RECORDED; prior title/photo work received preliminary acceptance separately. Supplied product/material/temperature/algorithm statements remain designer copy with publication truth tracked in PRODUCT.md. Next group retains the accepted honest placeholder; no changes to landing composition.

Latest user correction excludes source page numbering; the prior real1–4/4 implementation was removed before delivery. Final captures/tests recheck absence and preserve upper active indicators.
