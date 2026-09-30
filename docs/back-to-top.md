# Back-to-top control — CHG-0028

**Source:** New user request on 2026-09-30. The original render does not contain this control. It is an added feature, not a source mismatch.

## Behavior and design

- A 48 × 48 CSS px rounded-square button appears after the page moves past the greater of 500px or 75% of the viewport height. It is absent at the top, including from the focus order.
- The button stays at the lower-right viewport edge with safe-area offsets. On phones it sits at least 72px above the bottom so it does not cover the final heading or system UI.
- Its dark translucent surface and backdrop filter follow the underlying artwork: sampled WebKit luminance changed from 109→45 on a dark Pro band and 200→64 on a light Pro band; Pro Max palm artwork changed 130→49. White chevron and light border remain readable. The user delegated the exact style choice.
- A click, tap, Enter, or Space focuses the top home link and scrolls to the top. Reduced-motion preference uses instant scrolling. The accessible label is translated for all 11 locales.
- The small Client Component lives outside the clipped story canvas and uses one passive scroll listener with a requestAnimationFrame update. The page story remains server-rendered.

## Verification

- Final WebKit screenshots and matching hidden-button background captures: `screenshots/actual/back-to-top/`. The capture waits for fonts, visible artwork, and two animation frames after each visibility change. All 15 sampled pairs differ in the button region. Tested: English Pro 402 × 874 DPR 3, Pro Max 440 × 956 DPR 3, Arabic Pro, 375 × 812, and 1440 × 900; all 11 translated labels checked.
- `tests/e2e/site.spec.ts`: initial absence, scroll appearance, viewport bounds and touch size, Enter/Space return, focus restoration, reduced motion. Full suite: 20/20 passed on Pro/Pro Max WebKit and desktop Chromium/Firefox. Keyboard-focus screenshot: `screenshots/actual/back-to-top/desktop-focus.png`.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed. Local production measurement at Pro DPR 3: cold LCP 240ms, CLS 0, 151,807 transferred JS bytes (377B above previous measurement), scroll p95 17.5ms with 0/162 frames above 33ms. These are local measurements without network throttling or a Lighthouse score.
- Native review initially found low contrast on the desktop focus ring. A dark outline plus white outer ring was applied and confirmed in the focused browser screenshot. Follow-up native review found no actionable issues. The independent final gate is recorded in CHG-0028.

No reference pixel comparison is claimed for this new control because the original render lacks it. Product publication and user approval remain separate from technical verification.
