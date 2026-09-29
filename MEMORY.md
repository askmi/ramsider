# Ramsider project memory

Durable handoff for work in this repository, across chats and context compactions. Read this short file at the start of substantive project work; follow [AGENTS.md](AGENTS.md) for rules and [CONTEXT_INDEX.md](CONTEXT_INDEX.md) for topic details. [LESSONS.md](LESSONS.md) stores reusable mistakes separately. This file records **state and decisions**, not a transcript or a second instruction set.

## Current state — checked 2026-09-29

- The new product site has **not been scaffolded**. [`package.json`](package.json) contains the Playwright and image-diff toolchain, not app scripts. `npx playwright test --list` found **0 tests in 0 files** on 2026-09-29. Browser QA of the actual site is therefore still pending, not passed.
- The visual source is the pair of 941 × 32,127 PNGs under `design/references/`; relevant fonts, button art, and PSB sources are catalogued in [DESIGN.md](DESIGN.md). The iPhone 17 Pro and Pro Max emulation profiles are configured in [`playwright.config.mjs`](playwright.config.mjs); earlier blank-page viewport checks are recorded in [TOOLS.md](TOOLS.md), not evidence for a built site.
- The agreed application direction is Next.js + React + strict TypeScript, mobile first from the approved render. [ARCHITECTURE.md](ARCHITECTURE.md) owns implementation choices; [PRODUCT.md](PRODUCT.md) owns narrative and factual dependencies. Do not treat this memory summary as a substitute for those files.
- No project Codex hooks are configured. The current context is routed through [AGENTS.md](AGENTS.md) and [CONTEXT_INDEX.md](CONTEXT_INDEX.md); [TOOLS.md](TOOLS.md) records why a hook is deferred until an executable, narrow check exists.
- The tool decision is native Codex capabilities where they meet the gate, with project skills/tools for distinct evidence: built-in browser for quick exploration, Playwright WebKit/DPR 3 for repeatable mobile QA, and native `/review` for code diffs. [TOOLS.md](TOOLS.md) records the distinction and current availability.
- [docs/agent-evals.md](docs/agent-evals.md) defines workflow regression cases for future instruction changes. No agent-run baseline has been executed; the cases are preparation, not proof of compliance.

## Open dependencies

The render does not supply confirmed prices, certificates/files, film media, FAQ answers, account/configurator/checkout services, or final action destinations. See [PRODUCT.md](PRODUCT.md) for the specific claims and flows. Continue independent local implementation; record each unavailable external input without inventing functionality or declaring its gate passed.

## Update rule

Update this file when a **verified** project state, durable decision, or external dependency changes, including during long work before context is lost. Replace stale entries instead of appending a running diary. Date material changes and link to the code, command, screenshot, or document that supports them. Check volatile claims against the current files; current user instructions and evidence win over stale memory. Label assumptions and unverified facts explicitly; keep secrets, private data, generated logs, and temporary task notes out. When a repeatable error or user correction yields a prevention rule, update [LESSONS.md](LESSONS.md) instead. Reconcile any affected topic document so the sources do not contradict each other.
