# Interaction and motion QA

Read during stage 4 of [discipline.md](discipline.md). Check real browser behavior, not only that handlers exist. Use Playwright for repeatable flows and inspect screenshots of the resulting states.

Build a scenario list from the controls actually present in the implemented slice. The long reference suggests reservation/configuration CTAs, learn-more and product exploration links, a PRO/GOLD comparison, a film/play control, FAQ accordion, document links, business solutions, a menu, and account/locked content. Their exact destinations and behavior require implementation decisions; do not create inert visual buttons or invent purchase endpoints.

For each control, verify default, hover/focus, active/click, disabled/loading/error where applicable, and the resulting destination or state. Run touch and scroll flows on both iPhone 17 Pro profiles before checking other responsive widths. Check keyboard access and focus order. For scrolling, verify sticky behavior, smoothness, section entry, and background joins. For menus, modals, carousels, galleries, forms, and FAQ, test open/close or advance/back behavior, focus management, and mobile touch interaction. Test RTL direction-sensitive transitions in Arabic.

Animations need temporal checks separate from the motion-disabled layout screenshot. A useful pattern is: capture initial state → scroll or click → capture an early frame → capture a settled frame → verify the final state. Check `prefers-reduced-motion`. Prefer CSS transitions; add Motion or GSAP only when the interaction requires them. Keep transforms/opacity smooth and avoid layout work during scroll.

Record which scenarios ran and their result. Re-run affected scenarios after code review or performance changes. A screenshot of an initial state does not prove an interaction works.
