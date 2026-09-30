# Product and experience brief

## What the supplied design presents

RAMSIDER introduces **Fograiser** as “a new category of ritual systems”; **UNO** is its first expression. The page presents a premium, electronically controlled alternative to a coal-heated shisha ritual. Its promise in the render is a repeatable, lower-friction shared experience: less preparation and mess, deliberate heat and draw, choice of blends/capsules, and a product meant to be seen as well as used. This is the design's *positioning*, not independent proof of the technical or health claims in its copy. Do not reduce the visible story to a generic “electronic hookah” storefront or substitute a different creative concept.

The design addresses at least two audiences. A personal buyer needs to understand the ritual, compare UNO PRO and GOLD, see the set and ordering path, inspect supporting documents, then create or reserve an UNO. A hospitality buyer needs to understand venue use, the MINI station and service ecosystem, then explore business solutions. The RAMS-GROUP section broadens the brand story; it does not replace the UNO purchase path. The long editorial scroll is the main storytelling format, with repeated actions placed where a user has enough context to choose.

## Narrative and user decisions

| Part of the page | Question it answers | Visible action or state to implement |
| --- | --- | --- |
| Hero and “Why Fire Had to End” | What is Fograiser UNO, and why change the familiar ritual? | Menu; “Reserve now”; “Learn more.” |
| Experience, controls, capsule and film | How does it feel, work, and fit social or sensory use? | Technology exploration; blend detail; film playback only if media exists. |
| UNO PRO and GOLD | Which expression is right for me? | Compare variants; explore PRO and GOLD. |
| Complete set and made-to-order path | What is included, and how do I obtain one? | Explore the set; configure, confirm, ship explanation; “Create Your UNO.” |
| Testing and documents | What backs the quality and safety story? | Individual document links and all-documents view, contingent on real files. |
| Hospitality | Can a venue use this as a supported system? | “Explore Business Solutions.” |
| FAQ, account, RAMS-GROUP, close | What else should I know, and what can I do next? | FAQ disclosure; account/locked states only if backed by a real route; project links; final create CTA. |

See [docs/reference-map.md](docs/reference-map.md) for observed copy, controls, and approximate image bands. Before implementation, transcribe exact wording from native-resolution crops and identify each action's destination or state. A visible control must have a useful, accessible result; if its destination or media is absent, record the dependency and avoid a dead button masquerading as completed functionality.

## Required experience

- **Visual direction:** preserve the supplied warm stone, gold, dark text, product photography, type hierarchy, generous space, and full-page pacing. The clean artwork supplies images; semantic HTML supplies selectable, translatable text and controls. Do not impose an unrelated skill's aesthetic defaults.
- **Mobile first:** design the base composition for iPhone 17 Pro (402 × 874 CSS px) and verify iPhone 17 Pro Max (440 × 956 CSS px), both at DPR 3. Adapt responsively to other phones, tablets, and desktops with fluid typography and crops, safe-area awareness, and a smooth long scroll. The 941 px source bitmap is not automatically a 941 CSS-pixel viewport; calibrate it before claiming visual equivalence.
- **Accessibility:** semantic structure; meaningful names and headings; keyboard, touch, visible focus, screen-reader behavior; appropriate contrast and reduced motion. Verify the interactions and states that exist.
- **Localization:** `en`, `ru`, `de`, `fr`, `es`, `it`, `tr`, `ar`, `zh`, `ja`, `ko`, with a shared key schema. Check line length and typography in every script; Arabic needs RTL layout and direction-sensitive behavior. The English render is the visual source, not a license to hardcode English text into images or components.
- **Fast first view:** show hero art, primary message, and action quickly. Segment and compress the giant background assets, prioritize the first segment, prefetch later segments near view, reserve their layout space, and verify no seams or pop-in. See [PERFORMANCE.md](PERFORMANCE.md).

## Factual and functional dependencies

The render shows PRO/GOLD features, a three-step payment schedule (PRO $599 then $400; GOLD $999 then $1,000), testing/certification cards, shipping/support FAQ prompts, and account tiles. These are **observations in the design**. Reproduce the visible wording in the local visual rebuild, but record factual claims as unverified until content approval. Before publishing a transactional flow or asserting regulated/technical facts as approved, confirm current prices/currency/payment terms, shipping and support policy, product specifications, the actual certificates and files, and whether the shown account and configurator exist. Do not fabricate PDF links, checkout endpoints, film media, FAQ answers, or hospitality contact routes. The same applies to implied wellness benefits: do not invent therapeutic claims.

The repository now has the rebuilt static application and a visual-testing toolchain, but no confirmed service endpoints. The implementation can proceed with the static narrative and verified local interactions while unresolved destinations remain tracked as dependencies; it cannot call a simulated commerce path complete. Current user direction and approved product data take precedence over older copy from `PROMPT.txt`, `SUMMARY.txt`, or the deleted site.
