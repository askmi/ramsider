# Assembled page integration — 2026-10-08

Technical verifier: `/root/media_loading`.

`integration-accepted.log`: **4/4 PASS** on the final production build after the no-JavaScript fallback and initial main-visibility guard, WebKit Pro (402×874, DPR3), WebKit Pro Max (440×956, DPR3), Chromium and Firefox (1440×900). The test retains viewport/meta/DPR, horizontal overflow, reference canvas height, full-page screenshot and every original primary action. It now visits each viewport with instant scrolling, waits for the real visible-media barrier, decodes effectively visible images, and confirms every marked source was visited. Expanded FAQ media is also checked. The prior successful run is retained in `integration-delivery.log`.

The earlier timeout is preserved in `integration-final.log`. The old loop replaced smooth-scroll targets every25ms and then awaited all layout-bearing native images, including unvisited or clipped lazy elements. A layout rectangle does not guarantee a native lazy request has started. The exact pending URL was not recorded in that failure. Display-none FAQ slices were already skipped by the old code; they are not a confirmed cause. `integration-diagnosis.json` records this distinction. No runtime defect was reproduced by the corrected traversal.

An initially over-anchored Playwright grep matched no tests; that output is preserved in `integration-delivery-selection.log`. The corrected command used the case title without anchors and ran all four profiles.

`assembled-crops.json` records full screenshot hashes, dimensions, source-to-CSS scales and exact crops. Portable contact sheets:

- `assembled-pro-contact.png`
- `assembled-pro-max-contact.png`

Individual `assembled-{pro,pro-max}-{hero,technology,documents,faq}.png` crops are also saved. Both contact sheets were regenerated from the final integration screenshots and directly inspected on 2026-10-08: the assembled hero, technology entry section, document cards and all six closed FAQ rows contain complete artwork without loading overlays, partial image bands or new clipping. This is an actual-browser composition check; it does not claim a new aligned reference pixel-diff result. Padding in the contact sheets is artifact layout, not a page gap.
