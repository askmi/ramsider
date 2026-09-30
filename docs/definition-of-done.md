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
- [ ] The production build's route output and HTML confirm the intended prerendered shell and request-time segments, where applicable; Server/Client boundaries and cache freshness were checked where affected. Rendering changes were kept only after comparable latency and client-cost measurements and affected visual checks.
- [ ] Performance changes were followed by affected visual comparisons.
- [ ] Changed verified project state, decisions, and blockers were reflected in `MEMORY.md`; reusable corrections were reflected in `LESSONS.md` without recording one-off noise.
- [ ] For substantive work, the discipline auditor examined evidence at applicable gates, including final closeout; findings were fixed and rechecked. If subagents were unavailable, the main agent performed the explicit evidence audit and disclosed the lost independent check.

## Change-log gate (all project changes)

- [ ] Every logical change and discovered defect has a stable [CHANGELOG.md](../CHANGELOG.md) ID, including small edits, intermediate mapping/specification work, and agent-discovered regressions.
- [ ] Each entry states actual versus expected, source/reference, cause, solution and how any mapping was applied, affected files and concrete verification evidence.
- [ ] Each `VERIFIED` entry has dated technical approval naming the verifier and applicable auditor; checks meet the task's relevant gates. “Code changed,” a missing screenshot, a skipped check or a user silence is not technical approval.
- [ ] Failed verdicts and reopen events remain in the history; unresolved defects have open IDs and are not silently bundled into a successful parent fix.
- [ ] Explicit user approval is distinguished from technical approval. Its absence does not block routine authorized work, and no user approval is fabricated.
- [ ] The final response identifies the relevant journal IDs or links; MEMORY and LESSONS stay consistent without duplicating the full event log.

- [ ] Every defect explains responsibility, the observable causal action/decision, missed check and specific prevention; uncertain causes stay explicit and input changes are not misattributed to the user.
- [ ] Reusable prevention links to LESSONS and an eval case with honest execution status. Fix approval, user acceptance and demonstrated behavioral improvement remain separate.

## Final evidence

The model runs all feasible checks itself and keeps per-slice acceptance records; it does not ask the user to perform routine visual QA. The response names tested viewports, reference/actual/diff screenshots, interactions, type/lint/build/test results, performance measurements, remaining material differences, and any unavailable verification. Do not claim pixel-perfect fidelity, WCAG AA compliance, 95+ Lighthouse, “instant” loading, or zero bugs without corresponding evidence. A successful build alone never closes the task.
