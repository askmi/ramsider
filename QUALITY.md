# Quality review after implementation

Read during stage 5 of [docs/discipline.md](docs/discipline.md). “Clean code” means the page remains understandable and changeable without undermining reference fidelity. Do a deliberate review/refactor pass **after** implementation and browser QA; then repeat visual and interaction checks touched by the refactor.

For code changes, invoke Codex's native `/review` on the changed diff before delivery; in the CLI use its equivalent review command. Read the findings, fix actionable defects, and rerun the checks each fix could affect. Record an unavailable review as blocked and perform the code review below without claiming `/review` ran. `/review` is a Codex command, not a separate project skill; its clean result alone does not pass the visual, behavior, accessibility, or performance gates.

## Code review questions

- Does each section have one clear responsibility? Are component boundaries aligned with the visible composition and behavior?
- Is reuse justified by repetition? Are there duplicate chunks, oversized components, tiny unnecessary wrappers, boolean-prop mazes, or deeply coupled state?
- Are state and browser APIs limited to the interactive components that need them? Are Server/Client boundaries correct, with no unnecessary hydration?
- Is each route's static, request-time server, or client rendering choice justified by actual content freshness and behavior? Did an accidental request API or fetch turn stable content dynamic, or did a broad `use client` boundary inflate the bundle?
- Are data fetching, caching/revalidation, streaming/loading, and error states correct for the installed Next.js version? Are requests parallel where independent, private data isolated, and server-to-client props small?
- Does server code read from its actual data source instead of making an unnecessary HTTP call to this app's own route handler?
- Are props/types strict and clear? Can a human developer understand naming, file organization, and data flow without reverse engineering generated patterns?
- Are design tokens, asset paths, translations, and responsive rules consistent? Is obsolete code removed?
- Are dependency and animation-library additions necessary for observable behavior?
- Are metadata, route semantics, and production behavior complete without one-off wrappers, duplicate data pipelines, or framework features added without a measured need?

## Accessibility and behavior review

Use semantic `section`, `article`, `nav`, heading, link, and button elements. Check labels and accessible names, keyboard order, focus visibility, screen reader meaning, touch targets, reduced motion, and WCAG AA contrast (4.5:1 for normal text where applicable). Verify Arabic RTL layout and interaction direction. Test loading, disabled, empty, and error states when the implemented feature has them. Do not substitute a painted button for a real control.

## Checks and exit

Run strict TypeScript, lint, meaningful relevant tests, and a production build when the scaffold provides them. Inspect browser console errors. A clean build is necessary but cannot prove the rendered page matches the Photoshop target. Finish with the affected real-browser screenshot comparison and interaction checks. Do not add tests that merely mirror trivial implementation details; keep Playwright focused on user-visible behavior and visual evidence.
