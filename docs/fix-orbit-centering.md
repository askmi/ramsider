# Technology orbit text centering — CHG-0030

## Defect and cause

The user's [Russian defect screenshot](../screenshots/reference/orbit-centering/user-ru-defect.png) shows the two lines in the second technology oval sitting low as a visible group. The initial implementation centered the headline inside the button's flex box while positioning the hint as a separate overlay below it. Earlier button checks covered one-line fit and bounds, but never the combined visible glyphs relative to the oval. The same construction is used by B03 and B07.

The English source composite at `background_text.png` Y~6810 and Y~13182 has a related but distinct hierarchy: the headline near the middle, hint below. The user's correction takes precedence for localized text. The English reference geometry remains unchanged.

On 2026-10-01 the user reported the same low combined text group in English, specifically the second oval. This supersedes the previous decision to exempt English from optical centering; the reference coordinates are retained as historical source evidence, not the final acceptance of text placement.

## Correction

`app/globals.css` moves the label and its adjacent hint up together by 16/941 of the canvas width for non-English locales. This keeps their gap, the oval SVG, button box, touch area and modal wiring fixed. The source-coordinate control IDs are B03 `technology-experience` and B07 `technology-repeat` in [the button map](font-button-map.md).

For English only, a separate selector moves both text layers up 12/941 of the canvas width. Before measuring, their combined DOM-box centers were ~10–12 source px below the ring; afterward B03 is ~1.7 source px above center and B07 ~0.2 source px above center at Pro. Both ring and button boxes are unchanged; non-English selectors and computed styles are unchanged.

## Verification

- Before and final Russian WebKit screenshots at Pro 402×874 and Pro Max 440×956 CSS px, DPR3, for both controls: `screenshots/actual/orbit-centering/{before,final}-ru-{402,440}-{technology-experience,technology-repeat}.png`. Final English control screenshots are `final-en-*`. Pro crops were visually compared with native source crops, and the independent auditor passed the slice's visual gate. The screenshot diff stayed within text pixels; the oval and artwork did not move.
- The RU Pro combined element-rectangle centers are −3.6 and −2.5 source px from the oval centers. A separate browser screenshot test hides the two text nodes, compares painted pixels to identify the visible glyph bounds, and requires those ink centers within 6 source px on Pro and Pro Max. This pixel test, pointer click, Escape close, keyboard Enter open and focus restoration passed 4/4 across Pro/Max WebKit and desktop Chromium/Firefox in `ru-ink-production-final.log`. The element-box reading is a positioning diagnostic, not a substitute for the ink test.
- `locale-matrix.json`: B03/B07 in all 11 locales at 375/402/440/768/1440 widths, 110/110 states pass label/caption order, horizontal fit and ≥44px hit box; localized element-box center offset ≤4.30 source px. The focused production suite `behavior-production.log` passed 12/12. Its earlier parallel dev-server run had three navigation timeouts; a sequential production rerun resolved them. A first RU interaction test incorrectly expected focus after a mobile touch click; it was corrected to separate pointer and keyboard paths.
- Production build, typecheck and lint passed. Production Chromium RU Pro DPR3, 4× CPU, no network throttle: cold LCP 628ms, CLS 0, 152,764B JavaScript transfer; normal-CPU scroll p95 16.9ms and 0/162 frames >33ms. This is not a Lighthouse or INP score. The CSS-only change is below the first viewport and does not alter the route's static rendering mode or JavaScript graph. Native reviews found and prompted fixes for the touch-focus assumption, DOM-only alignment test, lazy-art screenshot race, and standalone QA script robustness. The final scoped review found no actionable defect; the independent auditor passed scope, visual, behavior and review/performance gates. See CHG-0030.

There is no localized source render for a numeric pixel diff. The user screenshot and visible-browser before/after comparison establish the requested optical correction; the English native crop is a composition check, not a numeric target for Russian text.

## English follow-up — 2026-10-01

The user supplied an English defect image for B07. Fresh before/after production/dev WebKit screenshots at Pro 402×874 and Pro Max 440×956/DPR3 for both B03 and B07 are `screenshots/actual/orbit-centering/{before,after}-en-2026-10-01-en-{402,440}-{technology-experience,technology-repeat}.png`. The after B07 crop places the two-line block near the visual center of the ring while keeping the headline above the hint and their spacing intact. The existing screenshot-ink and pointer/keyboard test now runs for English as well as Russian; the focused Pro/Pro Max WebKit and desktop Chromium/Firefox matrix passed 8/8. The earlier note that English must remain at raw source coordinates is superseded by this user correction.
