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
- **Prevention:** Keep short, verified, up-to-date handoff facts in [MEMORY.md](MEMORY.md); keep recurring problem → cause → prevention entries here; record every logical change/defect, its solution, verification and approval in [CHANGELOG.md](CHANGELOG.md). Make [AGENTS.md](AGENTS.md) trigger both retrieval and maintenance, and correct stale memory against current files and user instructions.

## Budget context throughout visual development

- **Problem:** Context-efficiency guidance was interpreted as measuring and shrinking only the fresh-session prompt.
- **Cause:** It overlooked working-context growth from repeated code reads, giant reference images, browser screenshots, and command logs during implementation.
- **Prevention:** Keep source images and full logs on disk; inspect the active section through useful crops and bounded output, reuse recorded findings, and rerun affected checks. Preserve the screenshot comparison and every other applicable quality gate.

## Choose one application toolchain before adding skills

- **Problem:** An unrelated build-tool skill remained installed after the project had chosen its application framework.
- **Cause:** An early mixed-stack suggestion was treated as a skill-installation requirement instead of being reconciled with the later framework decision.
- **Prevention:** Resolve framework and toolchain choices first. Install or retain only skills that serve the chosen stack or a required verification gap; remove obsolete skills and their active-document references when a decision changes. Preserve the original brief as a source record.

## Verify every locale against the rendered page

- **Problem:** Early locale routes silently fell back to English for much of the long page, and some longer translated lines exceeded their fixed art slots.
- **Cause:** Translation completeness and fit were inferred from the hero and key presence instead of checked across all story nodes at real viewport widths.
- **Prevention:** Compare every visible story key against the locale dictionaries, then render each locale at phone and tablet widths and inspect text bounds. Keep product names and unverified prices in their approved source form, and recheck the affected locale after shortening or resizing copy.

## Verify every approved control state before settling compact geometry

- **Problem:** The first locale switcher matched the hero but placed the scrolled control too far inward and made the open list about 200 CSS px taller than the approved image; a later keyboard blur handler interrupted touch navigation.
- **Cause:** One placement rule was reused for distinct states, 44px rows were assigned without scaling the approved open panel, and focus behavior was inferred without a WebKit touch check.
- **Prevention:** Map each supplied state to viewport coordinates and compare separate browser screenshots before visual approval. When an image packs many options into a compact panel, record the touch-size tradeoff and test every option near both row edges. Exercise keyboard and touch on the target browser after any focus/blur change, including a selected item and modified clicks. Inspect network activity when opening a list of route links so automatic prefetch does not fetch every destination. Verify locale navigation and scroll restoration in the browser instead of assuming `scroll={false}` preserves position. CHG-0032 records the failed attempts and real checks; controlled Agent Eval is `NOT_RUN`.

## Anchor floating header controls to the same responsive visual line

- **Problem:** The locale capsule sat above the RAMSIDER wordmark and hamburger on desktop even though it aligned on iPhone; the first translucent dropdown draft also let busy page text compete with the language names (CHG-0036/0037).
- **Cause:** The fixed capsule used a viewport-constant `top:12px` while the masthead scaled with the 941px canvas, and the hamburger kept a mobile-only margin at desktop. The first glass treatment relied on white alpha/backdrop blur without checking dense text behind the panel; headless WebKit screenshots showed no visible suppression even with 100px blur. Stronger white scrims erased the artwork; local white backing produced separate halos. The first alignment fix also kept a panel max-height tied to a constant offset, so a 1440×280 window clipped the last options.
- **Prevention:** Define one source-scaled visual center for wordmark, menu bars, and locale control at `scrollY=0`; use the latest customer rule, which now requires the switcher to leave the viewport with the header. Verify the scroll outcome in a real browser, not only the top position. Derive a short-viewport menu's maximum height from the same top position and test access to the last item. Assert the three centers at Pro, Pro Max, narrow/intermediate, and desktop widths; inspect actual screenshots because CSS boxes do not capture all optical differences. Compare the painted vertical centers of the flag and two-letter code in every locale and in WebKit/Chromium: line-box centering missed the desktop drift, `JA` needed a separate optical adjustment, and a threshold-only lift regressed 600px (CHG-0053). Keep a translucent menu readable in LTR and RTL. [EVAL-HEADER](docs/agent-evals.md#eval-header) remains `NOT_RUN`.

## Keep sibling dropdown surfaces and dismissal behavior in sync

- **Problem:** Navigation stayed opaque cream and open after outside click or page scroll while the adjacent locale list used translucent gray glass; the first repair briefly traded away the exact shared material for readability (CHG-0054).
- **Cause:** Navigation and locale panels had separate CSS values and only the locale component handled outside input. The agent first checked each control in isolation, then accepted a visually denser nav surface despite the customer's explicit same-surface requirement; native review caught this drift.
- **Prevention:** Compare computed background, blur, border, shadow and radius of related dropdowns before approving them; preserve the current design reference even if a different material seems easier to read. Test outside pointer, real page scroll, internal panel scroll, Escape, keyboard focus, links and RTL on actual browser profiles. Use subtle foreground text treatment when the shared translucent surface crosses busy artwork. [EVAL-NAV](docs/agent-evals.md#eval-nav) controlled agent run `NOT_RUN`.

## Confirm named project documents before citing them as rules

- **Problem:** A status message presented an unverified document name as a source of development discipline.
- **Cause:** An ambiguous file name from the conversation was repeated before checking the repository.
- **Prevention:** Resolve a named project file with `rg --files` before describing its contents or authority. If absent, identify the applicable existing files and say the named file was not found. CHG-0033 records this correction; the User correction case in `docs/agent-evals.md` is `NOT_RUN` as a controlled agent evaluation.

## Wait for lazy artwork before full-page screenshots

- **Problem:** Firefox browser checks tried to decode an artwork tile before its lazy request was stable; a later isolated test twice rejected `decode()` with `Invalid image request` during a scroll transition.
- **Cause:** Full-page capture and an immediate `decode()` do not guarantee that every lazy image below the fold has entered the loading threshold or retained the same in-flight request.
- **Prevention:** Scroll through the page and poll **every visible tile** for `complete && naturalWidth > 0` before the screenshot or image assertion; waiting for only the first visible tile can leave a blank neighboring tile. When decoding all tiles, wait for each source to load and handle a canceled transient request by checking the image's final loaded state. Keep the first tile eager for LCP.

## Test fast travel and cold reload before approving long artwork delivery

- **Problem:** The long page showed flat beige areas during fast scrolling and reload, then briefly showed the wrong position/art during a locale change (CHG-0042). CHG-0056 briefly repeated the cold distant-scroll gap after switching PNG to WebP because the first version still had no preview; the measured full distant image took 5.43 s on synthetic 4 Mbps.
- **Cause:** The earlier image strategy optimized only the initial hero and marked all distant tiles lazy. Verification scrolled after assets had loaded and did not capture the first frame of a mid-page full-document locale navigation.
- **Prevention:** Exercise a cold load with artwork requests delayed, jump immediately to a distant section, and capture the first frame after a mid-page locale change on Pro, Pro Max and desktop. Preserve a tiny color-managed visual preview for each long tile and request compressed distant tiles in the background without competing with the hero. Test that the preview itself decodes while the full tile is blocked; a CSS URL alone does not prove a painted fallback. Verify the same visible artwork and scroll position before showing a new locale, with bounded waits so a stalled asset cannot trap navigation. Measure LCP, transfer and scroll frames after changing loading priority. EVAL-COLOR remains `NOT_RUN`; a repaired site is not an agent-behavior eval result.

## Preserve readable access to reference-scale fine print

- **Problem:** Source-sized document and project details became too small to read on the Pro viewport; directly enlarging every project line caused overlap with art and neighboring copy.
- **Cause:** The 941 px reference contains fine print that scales to roughly 7 px at 402 CSS px, while the card geometry is fixed by the source artwork.
- **Prevention:** Give compact document text a sensible size floor where the card can reflow, and expose full project copy in a readable keyboard-accessible card detail view when the approved composition cannot hold larger text. Verify both the base screenshot and the expanded state.

## Match every visible control to its promised destination

- **Problem:** Model exploration buttons jumped to the general set section, and a second locked account tile had no hit target.
- **Cause:** Controls were mapped from the reference artwork in batches without checking each label against the resulting action and every repeated tile.
- **Prevention:** Audit each visible CTA and card individually against its label and available product content. Route to relevant detail where it exists; otherwise show a specific, localized availability state. Exercise every repeated control in the browser, including keyboard access.

## Map supplied typography and controls before styling a reference rebuild

- **Problem:** The completed page used the wrong-looking typography and generalized pill buttons despite supplied font and button files.
- **Cause:** Font names were known from the asset inventory, but no per-text/per-CTA map was made from native reference crops and actual font/button specimens; a broad `brand` class and generic button rule then hid distinct treatments.
- **Prevention:** Before styling, identify each supplied font from metadata and specimen glyphs, inspect representative crops across the full render, and record a source-coordinate map assigning family/weight to text roles and exact or custom artwork to each CTA. Separate English outlined button samples from translated live text; compare the implemented Pro screenshot to the same crops before closing visual QA. See [Elements Mapping](docs/elements-mapping.md).

## Inspect every button variant before assigning it

- **Problem:** The first button map omitted exact geometry and HTML identities, described the supplied arrow circle incorrectly, and did not distinguish the downward document arrow.
- **Cause:** Representative preview examples and asset names were treated as enough evidence; the preview contains only five of fifteen designs, and `Without_Text` still contains icons.
- **Prevention:** Inventory every theme/name/text-mode pair, inspect all rendered designs and SVG primitives, record font metadata, radius, frame, highlight, arrow direction and circle presence, then give every page occurrence a stable map name plus a current selector. Mark custom and unused assets explicitly; keep SVG units separate from reference pixels and CSS pixels. Do not infer geometry from filenames or duplicate an icon already included in an asset.

## Bound automated stylesheet edits to complete rules

- **Problem:** Replacing a selector block removed intervening menu, document and FAQ styles; browser tests caught the regression before delivery.
- **Cause:** A substring search matched the selector inside a combined RTL rule before its standalone rule.
- **Prevention:** Use exact, anchored complete-rule edits or a CSS parser; inspect the changed boundaries and run affected interaction/screenshot checks. Never use the first partial selector occurrence as a deletion boundary.

## Verify localized text inside calibrated button surfaces

- **Problem:** Fixed reference-size pills first clipped longer translated labels; the later fix allowed German `Jetzt reservieren` and other CTAs to break into two lines (CHG-0004 reopened). A CSS viewport-size change also affected the custom orbit label height.
- **Cause:** Artwork dimensions, font line boxes and touch coverage were treated as the same dimensions. The agent then treated no clipping as sufficient and explicitly set `white-space:normal;overflow-wrap:anywhere` for all non-English labels while retaining English pill widths.
- **Prevention:** Preserve surface geometry independently of touch coverage. For source-one-line CTAs, measure each localized label in the actual browser font, extend/shorten only the pill's straight SVG middle, and test one visual line, balanced text margins, arrow clearance, canvas bounds and proportions for all 11 locales at Pro/ProMax and representative widths. Inspect real screenshots, including long translations and Arabic. Verify expanded hit regions with actual hit testing and taps, not only DOM rectangle sizes. Never call a locale fix complete merely because text is no longer clipped; EVAL-LOCALE includes this failure class.

## Measure visible glyphs in stacked visual controls

- **Problem:** The Russian technology-orbit headline and hint looked too low as a pair even though the headline's element box was centered and both lines fit inside the oval (CHG-0030).
- **Cause:** The agent treated two separately positioned line boxes as visually centered without comparing the combined painted text to the oval. Earlier locale checks measured fit, not optical position.
- **Prevention:** For artwork-backed controls with multiple text layers, compare actual browser crops with the user's target at Pro and Pro Max. Measure the combined visible glyph bounds relative to the artwork, then check other locales for clipping and spacing. Keep the artwork and hit box fixed when the requested correction concerns text only. A later English report showed that copying the source coordinates was not enough: when the user flags the source-language appearance, measure that language separately too. Browser screenshot differencing can validate glyph ink beyond DOM boxes. Controlled Agent Eval remains `NOT_RUN`.

## Constrain translated text inside fixed reference cards

- **Problem:** Document titles and details overflowed their fixed source-sized cards in longer locales, and footer labels sat above their arrows (CHG-0034).
- **Cause:** The grid text column kept its intrinsic minimum width, long words had no wrap rule, and source-sized headings were reused for longer translations. The full-card action aligned a text line box and SVG by their bottoms instead of by their centers. The earlier checks exercised document dialogs but did not measure each translated field or footer row.
- **Prevention:** Use a shrinkable grid column and explicit wrap behavior in fixed cards, then tune only the locales whose text needs it. Verify all translated title/detail bounds against card and divider, label–arrow spacing and vertical centers, and inspect Pro/Pro Max screenshots. QA scripts must require explicit output stages and fail with a nonzero status on detected defects so baseline evidence is preserved and CI cannot count a failure as a pass.

## Verify modality and the action promised by each label

- **Problem:** “CLICK TO OPEN” and “Compare” only scrolled to page sections, while dimmed non-modal popovers allowed keyboard focus behind them.
- **Cause:** A successful click or visible panel was treated as enough evidence of correct behavior.
- **Prevention:** Assert the promised outcome for each distinct CTA, including repeated controls. Use native modal dialogs for blocking overlays and test Tab/Shift+Tab containment, Escape, close and trigger focus restoration in each supported engine.

## Audit baked control surfaces before adding HTML decoration

- **Problem:** All six FAQ rows had doubled surfaces and minus marks, accumulated vertical drift, and overlapped the account area. The earlier visual review incorrectly called this a small tint difference.
- **Cause:** The clean reference was assumed to contain only scene artwork; its existing FAQ cards/icons were duplicated in CSS, with approximate repeated spacing. Crops were inspected too loosely to distinguish separate contours from rasterization.
- **Prevention:** Inventory the clean artwork at each control, including backgrounds and icons. Choose one owner for each visible layer. Measure every repeated row and its final boundary; compare enlarged reference/actual crops plus the assembled section. Treat visible duplicate contours, drift and overlap as material failures, never as tint or antialiasing. Check expanded states separately, and avoid placing tile boundaries through control surfaces.

## Turn defect causes into testable behavior changes

- **Problem:** A defect log can explain the technical symptom without explaining the agent decision and missed control that allowed it, leaving a new model to repeat the error.
- **Cause:** Fix tracking and successful app tests were treated as sufficient evidence of learning; accountable causal analysis and behavior evaluation were not explicit fields.
- **Prevention:** For each defect record the observable decision/action, mechanism, missed check, responsibility and evidence limits in CHANGELOG. Turn reusable causes into a concrete check before similar work; link a case in [agent-evals](docs/agent-evals.md) and keep NOT_RUN until actually evaluated. Treat changed/missing inputs separately without inventing user fault. New rebuilds inherit the source/mapping/lesson package, while rereading current references. Files change context and workflow; they do not train model weights. See CHG-0023.

## Let non-modal nested content release page scrolling

- **Problem:** Hovering FAQ cards trapped wheel/trackpad scrolling even with all answers closed (CHG-0024).
- **Cause:** The agent used `overscroll-behavior:contain` to confine the answer viewport; previous QA tested visibility and programmatic scrolling but omitted real wheel propagation at boundaries.
- **Prevention:** Keep native scroll chaining for ordinary nested content. Test wheel down/up over closed items, within expanded content, and at both boundaries with distinct gestures. Account for browser gesture latching; programmatic scrollIntoView is not a wheel test. Keep mobile screenshots/touch states distinct from desktop wheel injection when automation does not support mobile wheel. Link EVAL-FAQ; a passing site test alone is not an agent-eval result.

## Verify independent disclosure states and document flow

- **Problem:** Closed FAQ icons changed when another row opened; expanded answers had an internal scrollbar (CHG-0026/0027).
- **Cause:** The agent substituted conventional plus/minus behavior and a fixed answer viewport for the requested interaction. Closed-only visual QA and a scroll-chaining fix did not test the actual expanded experience.
- **Prevention:** Specify and test 0/1/2/all-open states, close one while preserving others, and keyboard activation. Test each row’s own icon. Let answers grow the document and verify downstream artwork, text and targets move by the same delta; do not merely hide an unwanted scrollbar. Check real wheel input over closed and expanded rows. Link EVAL-FAQ; site tests do not count as an agent-run eval.

## Preserve artwork continuity when content grows

- **Problem:** Early natural-flow iterations created full-width background cuts, repeated stretched-strip seams and fractional lines inside cards; these were rejected by visual audit/native review before delivery.
- **Cause:** The agent treated extended artwork as per-row fill and split flat surfaces at fractional pixel boundaries. A container’s own `cqw` size also resolved against the viewport on wide screens; one-sided physical margins shifted RTL cards.
- **Prevention:** Inspect the complete expanded section and final account boundary, using continuous artwork for exposed gutters and one backing surface per open card. Assert source-scaled closed canvas height above its max-width and explicit physical artwork alignment in RTL. Wait for image load/decode and browser paint before captures. Store code snapshots outside compiler globs or with a `.txt` extension: a temporary `.tsx` backup was accidentally compiled during this fix.

## Check the outer pixels of derived artwork

- **Problem:** A thin white line appeared at the right edge of several long background tiles after deployment (CHG-0041).
- **Cause:** The agent exported 941 px tiles without checking that the source's last column had transparent runs. The WebP export flattened those runs to white, and section-centered visual checks missed the outer edge.
- **Prevention:** Before exporting long artwork, scan both outer columns for alpha and unexpected color. Repair transparent edge pixels from adjacent source artwork, then inspect decoded production tiles and real browser screenshots at the top, middle, bottom, and tile joins on mobile and desktop. Keep the reference PNG untouched.

## Compare the background outside every disclosure card

- **Problem:** CHG-0027 passed review/audit but the user found a different background in gaps and rounded corners whenever a question opened.
- **Cause:** The agent masked authentic artwork to the outer gutters while substituting a gradient in the center. Review concentrated on large stripes and card bodies and missed the exposed negative space. The earlier approval was invalid.
- **Prevention:** Inspect left, center and right gaps, all rounded corners and the final account join at native and enlarged browser resolution in0/1/2/all-open states. Compare untouched rows before/after another opens. Use complete source-backed regions rather than masks that expose invented fill. Inspect PSB layers before deriving crops; preserve source provenance. Never give stale intermediate zoom crops to the auditor: regenerate every crop from the final screenshot and retain code fingerprints. EVAL-FAQ includes this requirement; controlled eval remains NOT_RUN.

## Preflight long browser recordings and inspect the exported media

- **Problem:** The first Ramsider demo captures stopped on a nonexistent `#control` selector and a link inside an already closed dialog; a later complete take showed Russian only briefly and recorded a development badge (CHG-0039).
- **Cause:** The agent trusted a narrative click plan without checking exact selectors and modal state before a long take, then used the action log alone as an early success signal. It missed visible recording quality and timing.
- **Prevention:** Preflight every distinct selector and modal transition against the live DOM, give each action a bounded timeout, and record a timestamped action ledger. Measure required language holds and section coverage, then inspect frames from the **exported final file** at the beginning, locale switch, middle, and ending. Confirm encoding/audio tracks and full decode. Treat a capture pass and subjective audio listening as separate checks. [EVAL-DEMO](docs/agent-evals.md#eval-demo) is `NOT_RUN`.

## Check floating controls against both page artwork and outer matte

- **Problem:** The first back-to-top style was faint over a Pro Max image; native review found its keyboard-focus ring weak against the desktop body matte (CHG-0028).
- **Cause:** The initial check emphasized button placement and mobile artwork and did not inspect desktop keyboard focus against the surface outside the centered canvas.
- **Prevention:** For a fixed control, capture light and dark artwork states, the final content edge, and a focused desktop state. Measure or visually check contrast against every surface it can cross. If color follows source artwork, sample the actual rendered glyph footprint at narrow and standard widths, both LTR and RTL, and recheck dynamic sections such as expanded FAQ; a single averaged scanline can miss a dark patch or flash while scrolling (CHG-0046). After hiding a control for background comparison, wait for browser paint and compare RGB pixel regions; an unchanged alpha channel can make an RGBA difference falsely look empty.

## Keep header controls in document flow when instructed

- **Problem:** CHG-0046 left the redesigned locale switcher fixed over the page, oversized, and dynamically white on dark artwork despite the customer's intended quiet, black header control.
- **Cause:** The agent treated “same position in the header” as a viewport position, copied visual size from the supplemental image, and added artwork-dependent contrast behavior. Its browser check asserted the fixed position instead of testing whether the header and switcher leave together.
- **Prevention:** Translate the latest scroll instruction into a top-and-scrolled browser assertion before implementation. Compare visible glyph size against the requested ratio while retaining the hit target; assert constant computed text/chevron color after scroll. Delete obsolete contrast code and tests when the element no longer overlays the long page. [EVAL-HEADER](docs/agent-evals.md#eval-header) is `NOT_RUN`.

## Verify the preview serves the current build

- **Problem:** The user still saw the old locale switcher position and menu surface after CHG-0036/0037 were verified in source and isolated production tests.
- **Cause:** The agent left the user-facing `:3020` production server running an older build. Source-level and separate-server checks did not establish which CSS the open preview actually served.
- **Prevention:** After rebuilding a production preview, restart its server and reload the user's active URL. Check the served CSS fingerprint or computed rule, then capture the actual browser state before reporting the fix. See CHG-0036/0037.

## Treat corrected visual preferences as acceptance criteria

- **Problem:** The locale list remained too opaque and dark despite repeated requests for a light, see-through surface (CHG-0036). An intermediate light alpha 0.64 still looked too solid to the user.
- **Cause:** The agent prioritized name legibility on busy artwork and treated its own visual pass as final before checking the degree of transparency the user actually requested.
- **Prevention:** Record the user's latest material constraint, compare opacity and screenshots of each new candidate against the rejected one on light, amber and dark artwork, then verify names and interactions independently. Supersede old technical approval whenever the user rejects its appearance.

## Use supplied icon shapes instead of Unicode lookalikes

- **Problem:** The published Effortless Control, Smooth Draw, Desired Intensity and Consistent Session marks were tiny substitute glyphs with the wrong shapes, and their three fine dividers were missing (CHG-0044). The adjacent seven technology marks and connector paths had the same problem (CHG-0045). Both were part of the known CHG-0015 residual.
- **Cause:** The agent treated the clean background as the entire decorative source and inserted approximate CSS `content` characters, then accepted a partial visual pass without comparing each pictogram against `background_text.png`.
- **Prevention:** Inventory both clean and composite source layers for every repeated decorative mark in the contiguous section. If the composite contains the approved shape, map each mark, connector and divider to source coordinates and extract only those pixels or use an exact supplied vector. Keep words as live localized text, compare an aligned browser crop against the source on Pro, then inspect Pro Max and RTL. Track any remaining icon set explicitly and finish the complete known set before declaring the broader defect resolved.

## Remap icons when a designer supplies canonical assets

- **Problem:** The previous feature and technology icons were source extractions, but a later designer `ICON_Kit` superseded their shapes. A first 16-source-px lift left Smart Core too close to its label; the uniform 28-source-px lift was rejected as too high and unnecessarily moved four feature icons that were already well placed. The next per-icon correction still left six technology marks visually too high against a customer close crop (CHG-0049).
- **Cause:** The original combined images bundled icon pixels with dividers or connector routes. Replacing only filenames would leave duplicate marks. The agent then used a uniform offset and later minimum bounding-box gaps plus its own screenshot judgment in place of measuring painted icon-to-glyph spacing against a close reference crop. The new kit was a changed input; the inadequate visual calibration was the agent's error.
- **Prevention:** Inventory every new asset and duplicate, build a stable ID → designer file → DOM map before UI edits, verify public hashes, and isolate decorative connectors/dividers from icon shapes. Preserve elements the customer says are correct. Set per-icon target coordinates in the map before implementation; compare **painted contours and text ink** for every pair against the relevant close reference, on real Pro/Pro Max screenshots including RTL. Center each icon on its label axis in **every** locale, including English: preserving original icon X left Light & Sound 2.133 CSS px right of its English label while a lenient 2.2px exception let the defect pass (CHG-0055). When translations move/widen label boxes, assert each translated axis separately; vertical gap and overflow checks alone missed the 10–12 CSS-px German drift. Use positive DOM gap bounds as a supporting overlap check, never as proof of visual equality. If a requested count conflicts with visible elements, clarify the excluded ID and record any provisional choice. [EVAL-MAP](docs/agent-evals.md#eval-map) remains `NOT_RUN` as an agent evaluation.

## Verify color profiles and decoded artwork before approving a format change

- **Problem:** CHG-0047 replaced lossy WebP tiles after the designer reported a color/quality mismatch; the first PNG verification also briefly accepted blank WebKit frames because `complete` and `naturalWidth` were true before paint. CHG-0058 found that `doc-emc.webp` passed a whole-image mean check despite red/blue p99 errors of 29/255 on visible pixels.
- **Cause:** The agent optimized the original artwork into WebP without checking exact RGBA/ICC equivalence or browser color output, then used image network completion as a proxy for decoded pixels. The later converter relied on a global mean and a red mask that did not cover the document mark; local errors were averaged away.
- **Prevention:** For color-critical source art, record pixel and ICC equality for every derived crop and compare a browser screenshot to the color-managed source. Measure visible-pixel high percentiles and local blocks as well as whole-image means; compare a sharper lossy candidate with lossless and choose by both color and bytes. Calibrate automatic fallback thresholds against actual candidates before applying them across a long page: CHG-0058's first local threshold inflated the assets to 33.79 MB. When repairing transparent-edge RGB, assert output alpha against the **original source alpha**, not against an already modified intermediate image; CHG-0056's first WebP attempt copied opaque neighbor alpha and native review caught it. Await `img.decode()` and inspect actual non-text artwork regions before visual approval. Measure transfer and cold-scroll latency after changing formats; record unresolved tradeoffs. Use [artwork-color-pipeline](.agents/skills/artwork-color-pipeline/SKILL.md) when its AGENTS trigger applies. [EVAL-COLOR](docs/agent-evals.md#eval-color) is `NOT_RUN`.

## Keep dormant media outside public deployment assets

- **Problem:** CHG-0057 prepared 46,308,888 bytes of source-exact PNG alternatives for future format selection inside `public/`, even though current pages did not request them; CHG-0058's final native review found the deployment cost.
- **Cause:** The agent treated zero browser requests as sufficient proof that unused files had no production cost. It mentioned the deployment size but did not place the reserve outside the published asset tree.
- **Prevention:** For assets stored only for a later feature, check both network requests **and deployment/package inclusion**. Keep the dormant master/reserve outside `public/` until a delivery feature is implemented and measured. Preserve source hashes when moving it; test that the old public URL returns 404 and current assets still serve. Keep reserve generation independent of the current delivery files so it still works if a WebP must be restored; check parity with active WebP only when available. [EVAL-ASSET-RESERVE](docs/agent-evals.md#eval-asset-reserve) is `NOT_RUN`.

## Check thin text against the actual textured surface

- **Problem:** The light, 300-weight Freedom of Choice subtitle remained hard to read over the warm artwork (CHG-0051).
- **Cause:** The agent reused a general body color chosen to resemble the original render and did not evaluate the small glyphs against the local texture in browser captures. The request for stronger contrast is new customer input; the missed readability check was the agent's omission.
- **Prevention:** For small text laid over image art, compare painted Pro/Pro Max crops and sample the actual background under the text before approval. Scope color changes to the requested component, then verify all translated strings and RTL for overflow. [EVAL-TEXT-CONTRAST](docs/agent-evals.md#eval-text-contrast) is `NOT_RUN`.

## Inventory decorative artwork before rebuilding live copy

- **Problem:** The comparison block had live localized words and a usable button but omitted the luminous oval arcs and glints visible in the approved composite (CHG-0052).
- **Cause:** The agent used the clean background for art and extracted semantic copy from `background_text.png`, then checked the text/button without separately mapping decorative pixels present only in the composite.
- **Prevention:** For each visual slice, compare the clean background and text composite at native resolution; inventory graphics that are neither background nor words. Map masked source extents before extraction, keep baked text/control surfaces out of derived assets, and inspect aligned Pro browser crops plus translated/RTL compositions. Defer below-fold art and verify it decodes on approach. [EVAL-LAYER](docs/agent-evals.md#eval-layer) is `NOT_RUN`.
