# Definition of done for a visual product task

The user's requested gate is strict: **do not say “done” when an applicable item has not been performed and passed.** Continue the internal fix/recheck loop within the same request. If an external blocker prevents a required check, state the blocker and the narrower result actually verified; do not present that check or the whole visual task as complete. Use only relevant items for a non-UI task.

## Implementation and engineering

- [ ] The whole requested scope is implemented and integrated; per-slice passes are followed by an assembled-page check and necessary cleanup.
- [ ] Every visible control has an identified, useful destination or state; factual copy, prices, certificates, media, and transaction behavior have an approved source. Missing external inputs are identified instead of replaced with fabricated functionality.
- [ ] Visible strings use translation keys with complete locale key coverage; layouts with longer text and Arabic RTL have been inspected where affected.
- [ ] Strict TypeScript passes.
- [ ] Lint passes.
- [ ] Relevant automated tests pass; a runner that discovers zero tests is not counted as a pass.
- [ ] A production build passes and the app starts.
- [ ] For code changes, native Codex `/review` (or its CLI equivalent) examined the actual diff; actionable findings were fixed or justified and affected checks rerun. If unavailable, the missing review is reported explicitly.
- [ ] Architecture and component boundaries have been reviewed: responsibilities, reuse, duplication, component size, state, props, and Server/Client split.
- [ ] Unused code and unnecessary dependencies introduced by the work are removed.
- [ ] Refactoring changes were followed by affected visual and behavior checks.

## Rendered visual result

- [ ] The target page opens in a real browser.
- [ ] The browser console contains no relevant errors.
- [ ] The relevant reference crop/screenshot and implementation screenshot were captured at a comparable viewport and state.
- [ ] The 941 px source-to-CSS viewport mapping and crop alignment were recorded; source and actual screenshots are tied to the implemented revision.
- [ ] The verifier inspected the **images**, not only DOM/CSS data, and compared geometry, typography, colors, crop, and background placement.
- [ ] A tolerant aligned pixel diff was reviewed where practical; no 0% requirement was invented.
- [ ] Material visual differences were fixed and the screenshot comparison was repeated after fixes.
- [ ] iPhone 17 Pro and Pro Max were inspected, including the assembled page; other phone, tablet, and desktop widths relevant to the change show no overflow, clipping, bad wrapping/crop, seams, or layout jumps. Only a viewport with a comparable reference is claimed as a pixel match.

## User behavior and speed

- [ ] Required clicks, hover, scroll, menu, modal, carousel, form, CTA, sticky, and navigation scenarios were exercised where present.
- [ ] Keyboard, screen reader meaning, RTL where affected, touch targets, and reduced-motion behavior were checked.
- [ ] Relevant animation intermediate and final states were checked with motion enabled, separately from stable layout screenshots.
- [ ] The production mobile build's initial loading, asset/JS transfer, LCP, CLS, shifts, scrolling, and interaction latency were measured when affected; INP was measured from representative interactions or marked unavailable; meaningful regressions were fixed.
- [ ] Performance changes were followed by affected visual comparisons.
- [ ] Changed verified project state, decisions, and blockers were reflected in `MEMORY.md`; reusable corrections were reflected in `LESSONS.md` without recording one-off noise.

## Final evidence

The model runs all feasible checks itself and keeps per-slice acceptance records; it does not ask the user to perform routine visual QA. The response names tested viewports, reference/actual/diff screenshots, interactions, type/lint/build/test results, performance measurements, remaining material differences, and any unavailable verification. Do not claim pixel-perfect fidelity, WCAG AA compliance, 95+ Lighthouse, “instant” loading, or zero bugs without corresponding evidence. A successful build alone never closes the task.
