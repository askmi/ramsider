# Reusable lessons

This is the repository's **error-prevention memory**, separate from current project state in [MEMORY.md](MEMORY.md). After each user correction or meaningful self-detected failure, identify the root cause and decide whether the mistake could recur. Fix and recheck the current issue either way. Record only reusable **problem → cause → prevention** rules here, linking evidence when available; search the relevant section before similar work. Revise or retire a lesson when evidence changes. Do not add one-off cosmetic feedback, a transcript, or unverified assumptions as global rules.

## Project context must retain the user's operating requirements

- **Problem:** A very short project index omitted mandatory visual, performance, and completion rules from the file the model loads automatically.
- **Cause:** The brief was summarized as background context instead of converted into enforceable working instructions.
- **Prevention:** Keep the main goal, stage sequence, and exit checks in `AGENTS.md`. Put procedures and source detail in indexed files. When revising either, check that every durable user requirement still has an actionable home and that files do not contradict each other.

## Keep the critical verification sequence visible at each decision point

- **Problem:** A context review treated repetition of the visual verification sequence as disposable duplication.
- **Cause:** It optimized for fewer words without distinguishing a repeated completion gate from irrelevant procedural noise.
- **Prevention:** Keep the inspect → implement → browser screenshot → compare → fix → recheck sequence in `AGENTS.md` (standing rule), `docs/discipline.md` (execution gates), and `docs/definition-of-done.md` (final audit). Reduce contradictions and irrelevant tools instead of removing this deliberate reinforcement.

## Separate current project state from reusable error lessons

- **Problem:** `LESSONS.md` alone did not make the current state, decisions, and open dependencies obvious to a future chat.
- **Cause:** A root-cause journal was treated as the whole memory system, though it only records what to avoid repeating.
- **Prevention:** Keep short, verified, up-to-date handoff facts in [MEMORY.md](MEMORY.md); keep recurring problem → cause → prevention entries here. Make [AGENTS.md](AGENTS.md) trigger both retrieval and maintenance, and correct stale memory against current files and user instructions.

## Budget context throughout visual development

- **Problem:** Context-efficiency guidance was interpreted as measuring and shrinking only the fresh-session prompt.
- **Cause:** It overlooked working-context growth from repeated code reads, giant reference images, browser screenshots, and command logs during implementation.
- **Prevention:** Keep source images and full logs on disk; inspect the active section through useful crops and bounded output, reuse recorded findings, and rerun affected checks. Preserve the screenshot comparison and every other applicable quality gate.
