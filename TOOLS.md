# Tools and skill relevance for the Ramsider rebuild

Use this file only when selecting a tool for a stage. The mandatory outcome is a real-browser render, calibrated reference comparison on **iPhone 17 Pro (402 × 874 CSS px)**, responsive inspection of **iPhone 17 Pro Max (440 × 956 CSS px)**, interaction checks, and repair loop before broader device QA. A skill's presence does not mean its workflow ran or passed. The [official OpenAI Skills documentation](https://developers.openai.com/plugins/concepts/skills) describes skills as task-triggered workflows; load only the ones relevant to the current stage.

## All 10 project-local skills

| Skill | Use for this rebuild |
| --- | --- |
| [pixel-perfect-ui-implementer](.agents/skills/pixel-perfect-ui-implementer/SKILL.md) | **Core.** Implement reference-led slices for both iPhone 17 Pro profiles; compare real browser output. |
| [pixel-perfect-ui-testing](.agents/skills/pixel-perfect-ui-testing/SKILL.md) | **Core.** Capture, inspect, align, diff, fix, and recapture visual states. |
| [playwright](.agents/skills/playwright/SKILL.md) | **Core.** CLI for exploratory browser work; installed `@playwright/test` for repeatable scenarios. The project-local wrapper path is valid. |
| [vercel-react-best-practices](.agents/skills/vercel-react-best-practices/SKILL.md) | **Targeted performance review.** Apply relevant Next/React rules for data fetching, hydration, bundles, or measured rendering issues; ordinary text/styling edits do not need it. |
| [vercel-composition-patterns](.agents/skills/vercel-composition-patterns/SKILL.md) | **Conditional.** Useful if component APIs/state become complex; avoid premature abstractions on a single landing page. |
| [web-design-guidelines](.agents/skills/web-design-guidelines/SKILL.md) | **Conditional review.** Accessibility/UX code audit after implementation; it discovers relevant UI files itself and needs current guidelines fetched from its source. It is not a pixel-fidelity verifier. |
| [screenshot](.agents/skills/screenshot/SKILL.md) | **Fallback.** Desktop/OS capture when a browser-native screenshot cannot cover the need; Playwright remains the site capture route. |
| [define-goal](.agents/skills/define-goal/SKILL.md) | **Explicit goal requests only.** Ordinary site work does not require Goal Mode or a goal record. |
| [playwright-interactive](.agents/skills/playwright-interactive/SKILL.md) | **Unavailable in this session.** Requires `js_repl` and an unsandboxed session; do not weaken sandbox settings merely to use it. CLI/test runner cover its purpose. Its future mobile example now uses the Pro profile. |
| [vite](.agents/skills/vite/SKILL.md) | **Out of scope.** The chosen app stack is Next.js; do not add Vite to it. |

The two [MCP Market implementer](https://mcpmarket.com/tools/skills/pixel-perfect-ui-implementer) and [testing](https://mcpmarket.com/tools/skills/pixel-perfect-ui-testing) listings are third-party skills, not MCP servers or npm packages. The project-local versions are Codex-compatible **adaptations**, not claims that the original Claude-specific instructions run unchanged. They retain the render → implement → screenshot → compare → fix loop without unsupported agent calls or a fixed iteration cap.

The `bencium-innovative-ux-designer` and `frontend-design` project skills were removed at the user's request because their design-generation defaults conflicted with the supplied render. Other skills visible in the Codex catalog (Figma, documents, spreadsheets, Sites, image generation, plugin management, and system setup) are platform capabilities, not part of this repository's ten local skills. They do not enter the Ramsider implementation path unless a later request actually needs their distinct workflow.

## Executable state

| Capability | Checked state |
| --- | --- |
| `@playwright/test` and `@playwright/cli` | Installed locally. `npx` exists and the project-local CLI wrapper responds to `--help`. [playwright.config.mjs](playwright.config.mjs) defines both iPhone 17 Pro WebKit profiles plus desktop browsers. Both WebKit profiles were launched and returned 402 × 874 / 440 × 956 at DPR 3 with a responsive viewport meta tag. **There is no rebuilt app or `tests/e2e` suite yet:** `npm run test:visual` names a runner, not a completed visual test. Create and run real tests with the app. |
| Pixel comparison | [tools/visual-diff.mjs](tools/visual-diff.mjs) uses Sharp and Pixelmatch; earlier identical and changed-image smoke checks passed. Inspect the images too; its percentage is a second signal. |
| Codex in-app Browser | Present in this session for visual inspection; CDP access has not been separately verified. |
| App/model modes | `GPT-6 Sol`, Goal Mode, and Developer Mode are session settings, not npm dependencies or skill installations. Check before claiming they are active. |

```sh
# From the repository root, after a site is running:
bash .agents/skills/playwright/scripts/playwright_cli.sh open http://127.0.0.1:3000
bash .agents/skills/playwright/scripts/playwright_cli.sh snapshot
bash .agents/skills/playwright/scripts/playwright_cli.sh screenshot
npm run test:visual
npm run visual:diff -- screenshots/reference/section.png screenshots/actual/section.png screenshots/diff/section.png 1
```

Use [docs/visual-qa.md](docs/visual-qa.md) for image alignment and recapture, and [docs/mobile.md](docs/mobile.md) for the target/responsive viewport order. The old site's screenshot is a regression baseline at most; the supplied render is the visual target. `PROMPT.txt` also mentions optional frontend-visualqa, mobile-responsive-qa, frontend-code-review, UI Verify, Storybook/Chromatic, Motion/GSAP, and Puppeteer. Add any of them only when an actual gap calls for it; they are not needed to start the absent app.

For the first working site, extend the existing Playwright checks before adding another browser framework. [axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) can automate a subset of accessibility checks on real pages; keyboard, screen-reader meaning, and contrast still need review. [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) can track production performance budgets and regressions once a build and CI route exist. For changes to the **agent instructions themselves**, start with the small cases in [docs/agent-evals.md](docs/agent-evals.md) and Codex traces; [Promptfoo](https://github.com/promptfoo/promptfoo) is a possible later runner if repeated eval volume justifies another dependency. None is installed or evidence of a passed check today.

## Hooks and context

No project hook is configured. A `SessionStart` or `UserPromptSubmit` hook that injects these documents would add model-visible context rather than reduce the always-loaded `AGENTS.md`. `PreToolUse` on every command would add overhead without proving UI quality. Keep the current stage-indexed documents and load the implementer/testing skills only at their respective stages. After the app and real tests exist, consider a **silent-on-pass, bounded-on-failure** `Stop` hook only for a fast deterministic check that cannot be enforced more simply by the normal test command or CI. Never use a hook to declare screenshot fidelity from source inspection, parse unstable transcripts as the sole QA record, or loop on an absent test suite. Project hooks require trust review before they run; document and test any future hook before relying on it.
