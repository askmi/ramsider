---
name: pixel-perfect-ui-implementer
description: Implement or revise Ramsider UI from the supplied renders for iPhone 17 Pro and Pro Max, then verify the real browser output. Use for visual page or component work in this project.
---

# Pixel-perfect UI implementer

Follow the repository `AGENTS.md` and the stage gates in `docs/discipline.md`. This skill handles render-led UI implementation, not an unrelated frontend redesign.

When sizing or adapting a raster photograph, load [artwork-color-pipeline](../artwork-color-pipeline/SKILL.md) and apply its geometry contract, including CSS-only changes. Define photo-width, source-ratio and complete-content acceptance separately from frame-width acceptance before implementation.

1. Inspect the clean `background.png`, then `background_text.png`, and the relevant font, button, and Photoshop assets. Work from a native-resolution crop. Identify section boundaries, artwork layers, text, controls, and responsive behavior before coding. Use `DESIGN.md` and `docs/reference-map.md`.
2. Build one visual slice for iPhone 17 Pro first (402 × 874 CSS px, DPR 3), then check iPhone 17 Pro Max (440 × 956). Preserve artwork; implement text and interactive controls as semantic, translatable HTML. Keep React/Next component boundaries clear.
3. Open the actual page in mobile WebKit at both target viewports. Calibrate the 941 px source and compare the iPhone 17 Pro screenshot **image** against the matching reference crop. Inspect Pro Max composition as a responsive target; perform a numerical diff there only if a comparable Pro Max reference exists. Name, fix, and recheck material differences until the visual gate passes. Use `docs/visual-qa.md`.
4. Adapt responsively to other phones, tablets, and desktops; check required interactions and representative widths. Review code, measure production performance, and rerun affected visual checks. Use the repository's indexed QA and completion files.

Never claim completion based only on source inspection, a passing build, or a numerical pixel score. Report the screenshots, viewports, interaction results, remaining differences, and unavailable checks.
