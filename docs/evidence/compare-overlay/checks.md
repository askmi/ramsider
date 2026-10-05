# Designer comparison overlay checks — 2026-10-05

- `node tools/generate-expression-waves.mjs`: copied the 701×401 RGBA designer PNG unchanged. `asset.json` records identical source/output SHA-256, size, alpha distribution, and absent ICC.
- WebKit DPR 3 captures on iPhone 17 Pro (402×874), Pro Max (440×956), and Pro Arabic are `pro.png`, `max.png`, and `pro-ar.png`; `browser.json` records natural dimensions, CSS geometry, and no horizontal overflow. The images were inspected with the live headings and B08 above the translucent art. The 11-locale B08 test passed on Pro and Pro Max. An initial parallel Pro Max run hit a navigation-time DOM detach; its single-profile rerun passed.
- On Pro WebKit the first viewport requested the overlay zero times; scrolling to it requested it once. The image retains `loading="lazy"` and weighs 100,829 bytes.
- `npm run typecheck` [output](typecheck.log), `npm run lint` [output](lint.log), and `npm run build` [output](build.log) passed; the build generated 14 static routes. The [production browser output](production-browser.log) shows both Pro and Pro Max WebKit tests passing on `:3020` (all 11 locales and Arabic B08 per test). The page and asset returned HTTP 200; the asset response was 100,829 bytes.
- Native `codex review --uncommitted` [output](native-review.log) exited 0 and reported no actionable regression. The unrelated user backup and Python cache were excluded from its Git status input without changing repository files.

The supplied PNG is untagged, so exact Photoshop color intent and wide-gamut behavior were not verified. Its bytes were preserved without profile assignment or conversion.
