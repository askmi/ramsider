# Tools and skill relevance for the Ramsider rebuild

Use this file only when selecting a tool for a stage. The mandatory outcome is a real-browser render, calibrated reference comparison on **iPhone 17 Pro (402 × 874 CSS px)**, responsive inspection of **iPhone 17 Pro Max (440 × 956 CSS px)**, interaction checks, and repair loop before broader device QA. A skill's presence does not mean its workflow ran or passed. The [official OpenAI Skills documentation](https://developers.openai.com/plugins/concepts/skills) describes skills as task-triggered workflows; load only the ones relevant to the current stage.

Choose the native Codex route when it can meet the evidence requirement. Add a project skill or external tool only for a distinct workflow or capability: the built-in browser is useful for quick exploration, Playwright supplies repeatable WebKit/DPR 3 device checks, and native [`/review`](https://learn.chatgpt.com/docs/code-review) supplies dedicated diff review. `/review` is a command, **not** an installed skill or a substitute for visual QA.

## All 9 project-local skills

| Skill | Use for this rebuild |
| --- | --- |
| [pixel-perfect-ui-implementer](.agents/skills/pixel-perfect-ui-implementer/SKILL.md) | **Core.** Implement reference-led slices for both iPhone 17 Pro profiles; compare real browser output. |
| [pixel-perfect-ui-testing](.agents/skills/pixel-perfect-ui-testing/SKILL.md) | **Core.** Capture, inspect, align, diff, fix, and recapture visual states. |
| [playwright](.agents/skills/playwright/SKILL.md) | **Core for repeatable QA.** `@playwright/test` runs the iPhone WebKit/DPR 3 and other browser profiles; the CLI remains available for scripted exploration. Use the built-in browser for quick one-off visual inspection in the desktop app. |
| [vercel-react-best-practices](.agents/skills/vercel-react-best-practices/SKILL.md) | **Targeted performance review.** Apply relevant Next/React rules for data fetching, hydration, bundles, or measured rendering issues; ordinary text/styling edits do not need it. |
| [vercel-composition-patterns](.agents/skills/vercel-composition-patterns/SKILL.md) | **Conditional.** Useful if component APIs/state become complex; avoid premature abstractions on a single landing page. |
| [web-design-guidelines](.agents/skills/web-design-guidelines/SKILL.md) | **Conditional review.** Accessibility/UX code audit after implementation; it discovers relevant UI files itself and needs current guidelines fetched from its source. It is not a pixel-fidelity verifier. |
| [screenshot](.agents/skills/screenshot/SKILL.md) | **Fallback.** Desktop/OS capture when a browser-native screenshot cannot cover the need; Playwright remains the site capture route. |
| [define-goal](.agents/skills/define-goal/SKILL.md) | **Explicit goal requests only.** Ordinary site work does not require Goal Mode or a goal record. |
| [playwright-interactive](.agents/skills/playwright-interactive/SKILL.md) | **Redundant in this session.** Its `js_repl` prerequisite is unavailable, while the built-in browser already provides persistent interactive inspection. Do not weaken sandbox settings merely to invoke it. |

The two [MCP Market implementer](https://mcpmarket.com/tools/skills/pixel-perfect-ui-implementer) and [testing](https://mcpmarket.com/tools/skills/pixel-perfect-ui-testing) listings are third-party skills, not MCP servers or npm packages. The project-local versions are Codex-compatible **adaptations**, not claims that the original Claude-specific instructions run unchanged. They retain the render → implement → screenshot → compare → fix loop without unsupported agent calls or a fixed iteration cap.

The `bencium-innovative-ux-designer` and `frontend-design` project skills were removed at the user's request because their design-generation defaults conflicted with the supplied render. Other skills visible in the Codex catalog (Figma, documents, spreadsheets, Sites, image generation, plugin management, and system setup) are platform capabilities, not part of this repository's nine local skills. They do not enter the Ramsider implementation path unless a later request actually needs their distinct workflow.

## Executable state

| Capability | Checked state |
| --- | --- |
| `@playwright/test` and `@playwright/cli` | Installed locally. [playwright.config.mjs](playwright.config.mjs) defines both iPhone 17 Pro WebKit profiles plus desktop browsers. A 2026-09-29 blank-page probe returned 402 × 874 / 440 × 956 at DPR 3 with a responsive viewport meta tag, and a touch tap dispatched `touchstart`. WebKit launch required sandbox escalation in that probe; treat future sandbox launch failures as environment blockers, not site failures. The rebuilt app and `tests/e2e/site.spec.ts` are present. Latest `npm run test:visual`: 8 tests passed across four browser profiles; see [font/button implementation verification](docs/font-button-implementation-2026-09-30.md). |
| Pixel comparison | [tools/visual-diff.mjs](tools/visual-diff.mjs) uses Sharp and Pixelmatch; earlier identical and changed-image smoke checks passed. Inspect the images too; its percentage is a second signal. |
| Codex in-app Browser | Present in this desktop session. It can inspect and interact with rendered pages, capture screenshots, use DOM locators, and override CSS viewport dimensions for quick responsive feedback. A 2026-09-29 blank-tab probe at 402 × 874 reported DPR 2; this is **not** evidence for the required WebKit/DPR 3 device profile. Use Playwright for repeatable target checks. Full CDP access has not been verified. |
| Codex `/review` | Native app/CLI code-review command, not another skill. For code changes, review the actual uncommitted or branch diff at stage 5; resolve actionable findings and rerun affected checks. If unavailable, report that limitation and perform the manual review in [QUALITY.md](QUALITY.md) without claiming the command ran. |
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

The model and Codex can inspect reference crops directly, edit files, run the project checks, and review Git diffs without another generic design or code-review skill. The [built-in browser](https://learn.chatgpt.com/docs/browser) is the fastest manual inspect/click/screenshot loop when available; it does not save a repeatable WebKit/mobile test suite. Skills here contribute project-specific workflow and routing, not new browser engines or proof that a check passed.

For the first working site, extend the existing Playwright checks before adding another browser framework. [axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) can automate a subset of accessibility checks on real pages; keyboard, screen-reader meaning, and contrast still need review. [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) can track production performance budgets and regressions once a build and CI route exist. For changes to the **agent instructions themselves**, start with the small cases in [docs/agent-evals.md](docs/agent-evals.md) and Codex traces; [Promptfoo](https://github.com/promptfoo/promptfoo) is a possible later runner if repeated eval volume justifies another dependency. None is installed or evidence of a passed check today.

## Hooks and context

No project hook is configured. A `SessionStart` or `UserPromptSubmit` hook that injects these documents would add model-visible context rather than reduce the always-loaded `AGENTS.md`. `PreToolUse` on every command would add overhead without proving UI quality. Keep the current stage-indexed documents and load the implementer/testing skills only at their respective stages. After the app and real tests exist, consider a **silent-on-pass, bounded-on-failure** `Stop` hook only for a fast deterministic check that cannot be enforced more simply by the normal test command or CI. Never use a hook to declare screenshot fidelity from source inspection, parse unstable transcripts as the sole QA record, or loop on an absent test suite. Project hooks require trust review before they run; document and test any future hook before relying on it.

The project [discipline auditor](.codex/agents/discipline_auditor.toml) is a **custom subagent profile** requesting a read-only sandbox and instructing the agent not to edit; the parent's live sandbox overrides may take precedence. It is not a hook or a continuously running monitor. [Its checkpoint protocol](docs/supervision.md) adds independent evidence review at substantive stage gates. Codex currently skips `agent` hook handlers, so adding that handler would not automate supervision. A live watcher that can steer every active turn would need a separate App Server controller and measured benefit beyond this profile; do not claim that such a controller is installed.
