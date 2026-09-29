# Quality review after implementation

Read during stage 5 of [docs/discipline.md](docs/discipline.md). “Clean code” means the page remains understandable and changeable without undermining reference fidelity. Do a deliberate review/refactor pass **after** implementation and browser QA; then repeat visual and interaction checks touched by the refactor.

## Code review questions

- Does each section have one clear responsibility? Are component boundaries aligned with the visible composition and behavior?
- Is reuse justified by repetition? Are there duplicate chunks, oversized components, tiny unnecessary wrappers, boolean-prop mazes, or deeply coupled state?
- Are state and browser APIs limited to the interactive components that need them? Are Server/Client boundaries correct, with no unnecessary hydration?
- Are props/types strict and clear? Can a human developer understand naming, file organization, and data flow without reverse engineering generated patterns?
- Are design tokens, asset paths, translations, and responsive rules consistent? Is obsolete code removed?
- Are dependency and animation-library additions necessary for observable behavior?

## Accessibility and behavior review

Use semantic `section`, `article`, `nav`, heading, link, and button elements. Check labels and accessible names, keyboard order, focus visibility, screen reader meaning, touch targets, reduced motion, and WCAG AA contrast (4.5:1 for normal text where applicable). Verify Arabic RTL layout and interaction direction. Test loading, disabled, empty, and error states when the implemented feature has them. Do not substitute a painted button for a real control.

## Checks and exit

Run strict TypeScript, lint, meaningful relevant tests, and a production build when the scaffold provides them. Inspect browser console errors. A clean build is necessary but cannot prove the rendered page matches the Photoshop target. Finish with the affected real-browser screenshot comparison and interaction checks. Do not add tests that merely mirror trivial implementation details; keep Playwright focused on user-visible behavior and visual evidence.
