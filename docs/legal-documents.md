# English legal documents — CHG0203

## Scope and acceptance (2026-11-18)

The current owner authorizes publishing the supplied English Privacy, Terms of Sale v2 and Delivery texts. The later lawyer correction excludes Privacy_RU; it supersedes the package README's Russian publication instruction. Publication authorization is given; result acceptance remains pending. The source's internal dates and wording prevail over dates mentioned in the message. Existing footer contact restrictions do not authorize removing contact details from these explicitly supplied legal documents.

| Input | Canonical route | Compatibility route | Required integration |
| --- | --- | --- | --- |
| `design/для_Александра_документы_сайта_20261116/Privacy_EN.txt` | `/en/privacy` | `/privacy` → canonical | Footer link |
| `design/для_Александра_документы_сайта_20261116/Terms_EN_v2.txt` | `/en/terms` | `/terms` → canonical | Footer and FAQ link to `/en/terms#6.3` |
| `design/для_Александра_документы_сайта_20261116/Delivery_EN.txt` | `/en/delivery` | `/delivery` → canonical | Footer link |

Do not import, serve or link Privacy_RU. Existing presentation-mode locale redirects can continue to lead to English, including `/ru/privacy`; no Russian policy will be published. Links on every locale footer point to the same English documents and identify their language. No commerce or cookie functionality is added from statements in the legal copy.

Preserve every source line and its order; decode the Terms file's literal `&quot;` as typographic serialization, without raw HTML injection. Use semantic headings, paragraphs and an accessible Privacy purpose/data/legal-ground table. Clause IDs are their source numbers (especially `6.3`). Compare normalized article text to all source text, including table cells, to detect any omissions or rewrites.

Use static Server Components and committed source-exact EN text files; no request-time file dependency or legal-content client bundle. The shared footer gets semantic document navigation using existing type/color/44px link styles. New reading pages use Open Sans, the existing warm background palette, readable 16px+ body copy and responsive spacing; there is no supplied legal-page render. Source render footer contains no legal links or company footer; extend the existing approved company footer and preserve the landing above it. Source width 941 → baseline 402 (scale 402/941); Pro Max 440 is a responsive target. Inspected clean footer then text footer crops under `screenshots/legal-documents/2026-11-18/`.

## Plan and checks

1. Save existing beta records, switch to main and fetch/fast-forward remote main (completed: beta `f0a703b`, local main `df85ef2`, origin main `f79645d`; main has prior records-only checkpoint).
2. Capture production baseline footer/FAQ, implement canonical routes, aliases, footer and FAQ links. Retain source hashes and scope mapping here.
3. Production WebKit Pro 402×874 DPR3 screenshots first, then Max 440×956 DPR3; inspect article top/table/clause/footer and landing footer. Verify source-text parity, exact clause landing, actual link navigation, HTML language, responsive viewport and no horizontal overflow. Compare unchanged landing footer fields against the baseline and inspected reference; additions have no pixel target.
4. Verify 320px, tablet and desktop, keyboard/focus, every locale footer key and Arabic RTL via compiled local fixture where presentation redirects prevent direct access. No RU text/links. Check console and HTTP failures.
5. Native actual-diff review, scoped lint, typecheck, production build and relevant browser tests; record cold production timing/bytes/LCP/CLS and scroll frames as lab observations, without field/physical claims.
6. Independent audit at applicable gates; update journal/memory; commit exact reviewed files, push origin/main, check exact-SHA deployment and actual ramsider.com addresses. Vercel success alone cannot prove the nginx/systemd VDS deployment. Inspect authenticated SSH access without disclosing credentials; no nginx changes.

## Verification

Final local evidence is collected in `docs/evidence/legal-documents/verification.json`. Final build6/types/scopedlint pass; legal10PASS6ownershipSKIP, unique company17PASS3SKIP (two failed viewport-Retry cases repaired and focused4PASS), native full review4 and follow-up5 CLEAN. Actual Pro/Max document/FAQ/table/footer screenshots, eleven compiled-locale footers, keyboard,320/375/768/1024/1920 reading widths and280/320/375/768/1440 company widths checked. Final144px geometry removes4px empty-paper edge at280px+safe70, preserves raster ratio and clears full dock. Root viewed36assembled main positions and stablePro/MaxRTL dock images; endgap0/0.5CSSpx, errors/overflow/unready0. Independent /root/audit finalGate3/4 andGate5 PASS_LOCAL on2026-11-18; earlier152px verdict remains historical. Independent Gate6 LOCAL_PREPUSH PASS (19stagedpaths/13source+40artifacthashes exact); publication pending. Complete source text/routes unchanged. The deployment route/access must be established; historical CHG0200 VDS authentication was denied. Do not claim public publication until the actual domain serves the new text and links.

Source copies in `lib/legal-documents.json` retain all UTF-8 text bytes, including original final-newline behavior. Original SHA-256: Privacy `7538bc028c24ad8b68306b5d720d43143fa01ac42c875fb012d3a0ce10a1cf84` (15,991B), Terms `406cfe95239d247ee9a927246f07bf3b527372ae8a4e724d8872fbc978a88d71` (31,505B), Delivery `252c1487f756bd70b49a16d60613a34300594ec23f7e40b69e1c7d8d2e9d5673` (5,630B). Tests pin those hashes and compare all rendered article text to the approved copy; they do not require the untracked source package on a fresh checkout. Source Terms14.4 mentions Arabic, while this delivery explicitly publishes EN only; preserve the authorized text rather than inventing an Arabic version. Existing underlying commerce claims remain source statements, not new backend behavior.


Final measured lab (cold context perroute, configured4Mbps/100ms/CPU4 Chromium ProDPR3): Privacy/Terms/Delivery LCP376/316/308ms, CLS0, JavaScript148,545B each; resource transfer figures exclude navigation HTML reported separately. Main LCP1260ms, CLS0.0009706, scroll p95frame16.8ms/max383.3ms; attribution to this change not established and no field/physical smoothness claim. Retain earlier main366.7ms outlier. Static rendering gives readable source text without JavaScript; no data freshness/request-time rendering need or measured reason to add client rendering.

No exact aligned pixel diff applies to the added legal page/footer navigation because no matching legal render exists. Existing company text/x/width/height remains baseline-exact, and inspected reference footer composition above the addition is preserved. Readability, focus, native table semantics, contrast of dark text on light paper and link targets were checked; no full WCAG/screen-reader certification is claimed. Global unrelated lint remains known CHG0181; scoped affected-source lint passes.
