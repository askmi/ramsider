---
name: pixel-perfect-ui-testing
description: Verify Ramsider UI on iPhone 17 Pro against the supplied render, then inspect Pro Max responsive output with real Playwright screenshots. Use aligned pixel diffs only where references are comparable.
---

# Pixel-perfect UI testing

Follow `AGENTS.md`, `docs/visual-qa.md`, and the completion gate in `docs/definition-of-done.md`. This is the Codex-compatible project skill for the render → screenshot → compare → fix loop.

1. Run the application in Playwright on iPhone 17 Pro (402 × 874 CSS px) and Pro Max (440 × 956), both mobile WebKit at DPR 3. Assert actual `window.innerWidth`/DPR and a responsive viewport meta tag before capturing at matching scroll positions and stable font/image states. Inspect the Pro screenshot **image** alongside the calibrated crop from `design/references/background_text.png`; inspect Pro Max for responsive fidelity. Do not claim Pro Max pixel equivalence without a comparable Pro Max reference.
2. When images align, run `npm run visual:diff -- reference.png actual.png diff.png [max-difference-percent]`. Read the JSON result and inspect `diff.png`. The percentage is a second signal; antialiasing and browser differences mean 0% is not required. Material visual discrepancies still fail even when the numeric threshold passes.
3. Identify and fix the cause, recapture, and compare again. Check mobile and desktop adaptation, required interactions, and console errors. Re-run affected visual checks after refactoring or performance work.

The CLI and browser test runner are installed in the project. Browser tests belong under `tests/e2e/`; `playwright.config.mjs` defines iPhone 17 Pro/Pro Max WebKit and desktop Chromium/Firefox projects. The app is not scaffolded yet, so actual site tests are added as sections are built. Never claim that this skill verified an app that does not yet exist.
