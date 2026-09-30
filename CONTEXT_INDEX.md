# Context index

`AGENTS.md` contains the enforceable stage sequence and exit checks. Open only the files for the current stage or question. Do not load the whole index at every step.

For substantive project work, start with the short [MEMORY.md](MEMORY.md) to see verified current state and open dependencies. Search [LESSONS.md](LESSONS.md) for the task's failure mode or area before a similar fix; it is the project's reusable error memory, not a general task log.

[CHANGELOG.md](CHANGELOG.md) is the required change/defect register: search the relevant IDs at discovery/resumption, update during implementation and verification, and close only with technical approval. Read its short rules/template when first using it; retrieve individual records rather than loading the whole journal. MEMORY is current state; LESSONS is reusable prevention; CHANGELOG is history and approval.

**Context budget:** `AGENTS.md` is the always-loaded contract; `MEMORY.md` is a brief state check for substantive work. Open one stage's details when that stage begins, and search a specific section of a large file when possible. During implementation, keep large images/logs on disk and inspect only relevant crops or excerpts; retain small evidence records so later steps do not repeat discovery. Do not preload `PROMPT.txt`, `SUMMARY.txt`, the whole skills catalog, or every document for an ordinary implementation task. The critical browser screenshot → compare → fix → recheck sequence is intentionally repeated at the rule, execution, and final-gate levels.

| Stage in `AGENTS.md` | Read | Purpose |
| --- | --- | --- |
| Every project change | [CHANGELOG.md](CHANGELOG.md) | Defect/change IDs, source → solution → application → verification → approval, reopen history |
| All UI tasks | [docs/discipline.md](docs/discipline.md) | Internal loops, gate evidence, failure routing, final integration |
| 1. Understand | [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md) | Proposition, audiences, factual dependencies, assets, reference interpretation |
| 1. Understand current render | [docs/reference-map.md](docs/reference-map.md) | Observed sections and controls in the supplied long image |
| 2. Implement | [ARCHITECTURE.md](ARCHITECTURE.md) | Stack choice, components, translations, motion |
| 3. Verify pixels | [docs/visual-qa.md](docs/visual-qa.md) | Source-to-viewport calibration, browser capture, visual and pixel comparison, acceptance record |
| 4. Check adaptation | [docs/mobile.md](docs/mobile.md), [docs/interaction-qa.md](docs/interaction-qa.md) | Viewports, safe areas, RTL, scrolling, interaction states |
| 5. Review and optimize | [QUALITY.md](QUALITY.md), [PERFORMANCE.md](PERFORMANCE.md) | Code/a11y review, image delivery, production measurements |
| 6. Report | [docs/definition-of-done.md](docs/definition-of-done.md) | Completion evidence and limitations |
| As needed | [TOOLS.md](TOOLS.md), [LESSONS.md](LESSONS.md) | Tool availability and recurring corrections |

[docs/source-coverage.md](docs/source-coverage.md) audits the complete source line ranges, resolves conflicting examples, records what was corrected, and tracks remaining dependencies. Use it when changing these rules, not on every section implementation.

[docs/agent-evals.md](docs/agent-evals.md) holds regression scenarios for changes to AI instructions and skills. Use it during a harness review or to register a repeatable failure as a case; ordinary page work retrieves only its relevant case/lesson. For a fresh rebuild, read current AGENTS/MEMORY plus relevant CHANGELOG causes, LESSONS and source/mapping artifacts before defining acceptance checks. Keep eval expected answers and held-out grading fixtures outside the evaluated agent's workspace.

[docs/supervision.md](docs/supervision.md) defines the independent auditor's checkpoint handoff for substantive project work. The main agent opens it when starting that workflow; the auditor reads only the current gate's relevant sources and artifacts.

`PROMPT.txt` is the original long brief. `SUMMARY.txt` is a later question-by-question synthesis. They are source records. Where their suggestions differ, `AGENTS.md` and explicit current user direction decide the workflow. Historical app code in Git is not the rebuild specification.
