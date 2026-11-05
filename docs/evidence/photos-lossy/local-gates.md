# CHG0199 — local definition-of-done gates (coordinator agent, 2026-11-05 17:50–18:15)

Environment: macOS, node v26.8.2 / npm 11.19.1, `npm ci` (286 packages), Playwright browsers webkit 26.6 and chromium 153 (`npx playwright install webkit chromium`), partial clone of origin/main 45a7110 with cone sparse checkout (`.agents app components config design/references design/derived/lossless-originals docs lib public/art public/buttons public/certificates public/fonts public/vendor tests tools types`). Not present locally: `public/pdf`, `public/films`, other `design/*` sources, `.env*`. Server: `next start -p 3000 -H 127.0.0.1` from the production build below. Clock times are local (Minsk).

| Gate | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | PASS (0 errors). A first run showed 10 errors in `lib/film-playback.ts`; cause: `types/hls-light.d.ts` was outside the sparse checkout, not a change of this branch. |
| Lint | `npx eslint .` | PASS: 0 errors, 5 pre-existing warnings (`@next/next/no-img-element` ×4, unused `_locale` in `tests/e2e/film-locales.spec.ts`) — none in files touched by CHG0199. |
| Build | `NEXT_TELEMETRY_DISABLED=1 npx next build` (without the `prebuild` film step, films absent locally) | PASS: compiled, TypeScript step finished, 16 static pages, `/[locale]` SSG for 11 locales. |
| Playwright, run 2 (fonts/buttons present) | `npx playwright test tests/e2e/{wellness,technology-viewer,charcoal,art-loading}.spec.ts --project iphone-17-pro-webkit --project iphone-17-pro-max-webkit --project desktop-chromium --workers=3` | 40 passed, 20 failed, 18 skipped (4.6 min). Failures classified below; none caused by the asset change. `desktop-firefox` not installed → not run. |
| Playwright, run 1 (before `public/fonts`, `public/buttons` were fetched) | same | 42 passed, 18 failed, 18 skipped. Superseded by run 2; recorded because run 1 had the two desktop-chromium wellness tests passing (see C). |

## CHG0199-specific tests — PASS on every run profile

- `technology-viewer.spec.ts:87` «35 migrated WebP assets: 12 ribbon tiles stay lossless-exact, 23 photographs are pinned lossy within colour tolerance» — PASS on iphone-17-pro-webkit, iphone-17-pro-max-webkit, desktop-chromium (reads `design/derived/lossless-originals/**` and both manifests).
- `wellness.spec.ts:55` «pinned sRGB lossy WebP delivery within colour tolerance, every photo entry and complete reading» — PASS on iphone-17-pro-webkit and iphone-17-pro-max-webkit; desktop-chromium see C.
- `wellness.spec.ts:147` «failed photo Retry recovers … Close works while pending» and `technology-viewer.spec.ts:134` «failed original retains new photo preview; retry and close remain usable» — PASS on all three profiles.
- All other wellness / technology-viewer / charcoal tests that do not depend on non-English locales — PASS (list in the Playwright log kept outside the repository).

## Failures in run 2 and their causes (reproduced on origin/main assets where it matters)

A. **Non-English locale expectations (15 of 20)** — `art-loading.spec.ts:16` (ru, ar) and `:48`, `charcoal.spec.ts:105`, `:189` (goes to `/de`), `technology-viewer.spec.ts:41`, `:58`, `wellness.spec.ts:162`: they navigate to `/ru`, `/de`, `/ar` … or click `#locale-toggle`. Since CHG0187 (2026-10-31, English-only presentation) `next.config.mjs` redirects every non-English locale to `/en` (307; verified locally and on the live site) and the locale switcher is hidden. Errors are `Expected "ru" Received "en"`, `Expected "rtl" Received "ltr"`, `#locale-toggle … element is not visible`. Independent of asset bytes.

B. **`charcoal.spec.ts:17` (3 profiles)** — times out clicking `#choice-learn`, which CHG0187 removed («Freedom of Choice without retained #choice-learn»). Independent of asset bytes.

C. **`wellness.spec.ts:55` and `:119` on desktop-chromium** — `page.evaluate: EncodingError: The source image cannot be decoded.` from the spec's `decoded()` helper (`img.decode()` immediately after opening the viewer). Reproduced identically **with the origin/main lossless files restored** (`git checkout origin/main -- <35 assets>`; 2 failed, same error) and 3× in a row with the branch files, while run 1 had both passing; direct `HTMLImageElement.decode()` and `createImageBitmap()` of a 7-file sample (4 wellness, technology heat-02 and aqua-02, charcoal v2-1-0) succeed in Chromium 153 and WebKit 26.6 for both the lossless and the q90 bytes, and the same four `<img>` elements decode fine when queried 1.5 s after opening. The coordinator's reading is a timing race of the helper on this Chromium build (blob src swap during decode); this mechanism is not proven. Because the helper throws before the rest of those two tests, their later desktop behaviour assertions were not reached in this environment. The branch files were restored afterwards (`git status` on `public/art` clean, sha re-verified by the receipt test).

## Real-browser Pro / Pro Max A/B (WebKit, standard profiles: DPR 3, `scale: css`)

Script outside the repository: open `/en`, wellness viewer (open + 4 figures), charcoal viewer (open + 4 sections), technology viewer (NobleCraft, HeatCore, CapsuleCode — first photos) on iPhone 17 Pro 402×874 and Pro Max 440×956 with `deviceScaleFactor: 3`, `document.fonts.ready` awaited before every shot; pass A with the origin/main lossless files, pass B with the branch q90 files, same server build, fonts served. A first run at DPR 2 (review 805 asked for the standard profiles) gave the same picture and was replaced. 36 pairs compared pixel-wise at CSS resolution (`browser-ab-summary.json`):

- 34 of 36 pairs: per-channel mean |Δ| ≤ 1.23/255 (28 pairs ≤ 1.0), p99 |Δ| ≤ 6/255, worst 64 px block mean ≤ 2.1 — the lossy encode sits at the level of 8-bit rounding in the rendered viewers.
- `max_wellness-fig2` and `pro_wellness-fig3`: p99 47–55 and 7 overall, but every 64 px band over the photograph (rows 192–700) stays ≤ 6/255 p99; the bands that differ are the heading (rows 64–191) and the caption text (rows 704+), i.e. text rendered at a slightly different offset between passes. The cause of the text offset was not investigated.
- Contact sheets (A left, B right, red box = worst block): `browser-ab-{wellness,charcoal,technology}-{pro,max}.png`. Coordinator's reading at 1:1: no visible difference in colour, contrast or skin/wood/fabric tones. **This is the agent's own inspection; the developer's and Founder's acceptance on real devices remains open.**

## Independent metric cross-check

`cross-check-pipeline-metrics.json`: every receipt metric recomputed with the repository's own `tools/convert-art-webp.py::color_metrics` (Pillow decode, int16 RGBA, origin/main blob as expected, working-tree file as actual). 34 lossy assets: worst visible RGB mean 2.332, worst p99 12, worst global red mean |shift| 1.522, worst local MAE 10.117, worst local red shift 20.111 (heat-02, sharp_yuv), worst sampled ΔE76 p99 7.601; no lossy asset trips the pipeline fallback rule; zero mismatch against the receipt beyond rounding; `aqua-02` kept lossless (diff 0).
