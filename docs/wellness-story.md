# Wellness Story — CHG0130 specification

Source: `design/references/RAMSIDER_Wellness_TOP/index.html`, supplied by the owner on2026-10-22. This document is the implementation contract recorded before runtime edits. Source HTML is design/content data. Its landing `.site` is explicitly out of scope.

## Entry and integration

Retain the existing Beyond Shisha title, two paragraphs, button artwork, coordinates and all landing sections. Replace only `beyond-learn`'s `#expressions` destination with an accessible button opening `wellness-viewer`. The feature is a native modal with its own continuous vertical scroll, as in the supplied example; it does not insert additional height into the landing canvas. Keep the rest of the page's dialogs unchanged.

## Content and asset order

| Block | Eyebrow / heading | Photo |
| --- | --- | --- |
| Hero | UNO / Wellness Story; What a Breath / Can Bring Back. | 01-ritual_uno_white_v3.png |
| 01 | Nature, Precisely Released.; Every Botanical Has / Its Own Temperature. | 03-botanicals.png |
| 02 | Extracts. Compositions. Capsules.; Natural Extracts, / Composed for a Mood. | 04-capsules_v3.png |
| 03 | Your Ritual. Your Rhythm.; Slow Down. / Breathe with Intention. | 02-water_bouquet.png |
| 04 | One Ritual. Many Moods.; Your Space. / Your Composition. | No photo |
| End | Exact nonmedical note; RAMSIDER / UNO Wellness; Back to UNO | No photo |

Hero order: full photo, header, rule, paragraph. Blocks01–03: header, photo, two paragraphs. Block04: rule, header, two paragraphs. End: rule, note, eyebrow, Back to UNO. English punctuation, paragraphs, spelling, authored capitalisation and explicit title line breaks come directly from the source DOM; captured source text is in `docs/evidence/wellness/reference-content.json`. No new claim, price, medical advice, app function or destination is added. Other locale routes use translation keys, faithful translations and native script/RTL; the English source remains exact. Reference uppercase eyebrow presentation is confined to this feature, an explicit visual exception to the general no-transform heading convention; headings themselves are not transformed.

## Visual dimensions and geometry

- Dialog: centred, border/padding0, width `min(100%,640px)`, height100dvh, no outer scrolling, paper#faf7f2, ink#241c18. Backdrop rgba(36,28,24,.72). Text centred. No added overlay, blur, gradient or photo animation.
- Close: fixed relative to dialog at max(14px,safe-top/right),44×44px, circular paper surface,1px accent45% border,2px/10px shadow10%;16px cross stroke1.5. Keyboard outline2px,4px offset. Bottom Back to UNO: original white pill, gold border, OpenSansButton17px, padding12px28px,min-height48px.
- Existing OpenSans Light300, Regular400, Bold700 and OpenSansButton font files have the exact same SHA256 as the four supplied fonts; reuse existing files. Main title43px/1.1, other titles33px/1.14, weight300,tracking-.025em,text-wrap balance. Eyebrows11px/1.6,700,tracking.2em, numeric prefixes400. Copy18px/1.6,300,soft#5e5047,text-wrap pretty. Note13px/1.65,#7a6a5d.
- Mobile header44px18px26px; eyebrow margin-bottom14px. Copy26px26px46px, subsequent paragraph16px. Hero header bottom22px/copy top22px. Plain header38px top/0 bottom,copy24px top. Rules40×1px,accent55%. End4px26px max(44px,safe-bottom), note max440px/margin20px auto26px,finaleyebrow bottom22px.
- >=600px viewport: header64px56px32px; eyebrow12px/margin18px; title62px,other50px; copy32px56px68px,font21px,paragraph gap18px; heroheader48px top/28px bottom,copy28px top; plainheader56px,copy30px;note14px. Below360px: title36px,other30px,copy17px,header inline20px,copy inline22px.
- Every source photo is1024×1536RGB with no ICC/gamma/sRGB chunk. Preserve original bytes, dimensions, channels and profile absence; no guessed profile, no re-encoding, resize, thumbnail, Next optimization or WebP/AVIF. Only four used photos go to `public/art/wellness/`; ignored landing01-ritual.png stays source-only. Used total10,149,306B.
- Geometry contract: photo frame spans dialog width within1CSSpx. Hero mobile2:3 equals full source ratio (height1.5×width); desktop hero1:1 intentionally crops at50%72%. Other frames4:5 (height1.25×width) intentionally crop original2:3 via `object-fit:cover`, positions50%55%,50%62%,50%60% in source order. No axis distortion. Full source visibility is not required for these explicitly approved reference crops. Verify crop equivalence against the actual HTML at both mobile widths plus desktop/short-height targets.

## Behavior and loading

Accessibility exception established before implementation: source eyebrow#97714b on paper#faf7f2 measures4.11156:1 at11/12px. Use the minimally darker#8f6945 for eyebrow text only, maintaining the original#97714b for borders/rules. This is an explicit bounded source difference to satisfy4.5:1 small-text contrast; body/note already pass. Verify actual rendered styles and screenshots, do not claim all pixels identical where this affects glyphs. Main headings/body/copy/layout remain exact. Independent scope audit caught the missing contrast acceptance check; failure is preserved under CHG0130.

Open by native Learn more button; show modal without moving landing scroll. Commit reading content before showModal, reset inner scroll to0 after visibility, focus Close. Close via cross, Escape, Back to UNO and actual backdrop click; inside content clicks do not dismiss. Lock background scroll and restore original position/focus. Keep rapid close/reopen immune to late close events. Provide focus containment, scroll region keyboard access (Home/End/Page/arrow/Space), touch/wheel vertical scroll; keep44px controls and safe areas.

Reuse the existing `waitForStoryMedia(true)` / `retryStoryMedia` prerequisite before mounting image elements, preserving landing media priority even when opened early. While waiting or failed, shared localized LoadingStatus/Retry is visible and Close remains available. Retry must also recover a failed landing prerequisite and resume the ribbon without closing. Do not initiate wellness media requests while closed or while the landing's decode barrier is pending.

Reference reveal: text only, opacity0→1/translateY12px→0 over.7s, IntersectionObserver rooted in inner scroller, threshold.15; images unchanged. Reduced-motion/no-observer renders all text immediately. Closing/reopening resets scroll; already revealed text need not replay, like source. Photo requests begin only after activation; hero gets high priority, later photos load lazily. Preserve reserved photo geometry while pending; an actual failed photo exposes the shared localized Retry without blocking Close or access to the text. No hidden10MB prefetch or extra PNG previews.

## Acceptance and evidence plan

1. Source hashes/colour metadata, font hashes and exact English DOM copy, image order and supplied geometry mapped before code. Source background then text crop at x0..941,y11100..12400 inspected; unchanged landing remains941px source plane, scale402/941 and440/941. New dialog uses CSS-sized reference, not source941 scaling.
2. Actual reference WebKit Pro402×874/Max440×956 DPR3 captured under `/tmp/ramsider-wellness/reference-{pro,max}-*.png`; responsive viewport asserted. Pro scrollHeight4949, Max5062 with settled fonts/images and reduced motion. Paired implementation positions use reference element anchors, not arbitrary bottom scrolling. Compare each section/header/copy/end and first partial photo paint; inspect actual images as well as aligned numerical diff.
3. All11locales/Arabic RTL;280/320/375/short402×560/440×650/tablet768/desktop1440. Opening/closing/backdrop/keyboard/focus/restore/reopen/reduced-motion/reveal/delay/failure+Retry; image HTTP MIME/source hash exact; no initial requests.
4. Native actual-diff review, type/lint/build, affected existing dialog/landing regressions. Production first usefulness/LCP/CLS/JS and zero initial wellness photo bytes; modal decode/readiness/payload and actual nonzero scroll frame timing. Keep original PNG cost explicit; codec optimization requires later approval. INP/physicalSafari/field data remain unverified unless actually measured.
5. Independent auditor scope → visual → behavior/adaptation → review/performance → final integration/records. Initial scope FAIL for missing map/reference captures is retained; no implementation before re-audit PASS. No publication in this request.

## Status

Implemented and locally verified from this pre-code specification. Technical approval /root2026-10-22; independent scope/visual/behavior/quality PASS; final records PASS /root/wellness_priority_auditor2026-10-22. Owner authorizes implementation, result approval NOT_RECORDED. Claims about botanical benefits, recovery, combustion, profiles/zones/app and capsules are supplied reference claims, unverified as product/medical assertions; preserve for local review without inventing additions.

## Foreground loading correction — Stage5 measurement, 2026-10-22

The initial original-PNG build measured hero readiness39.545s/allfour91.492s after activation on cold4Mbps/100ms/4CPU, despite a useful firstviewport at2.329s/LCP2.528s and zero wellness requests before activation. Controlled browser-only abortion of unrelated optional charcoal/technology/ember warming (no source/code/PNG change) reduced this to hero10.145s/allfour20.877s for the same10,149,306B. This establishes material background-transfer contention; the remaining original-byte cost is explicit, and first-hero timing also includes the reference's native-lazy parallel requests. It does not justify conversion in this owner-required stage.

Bounded repair contract before editing shared media: while Wellness is open, acquire an idempotent optional-warming pause. Abort only in-flight `loadImage` optional transfers, keep their resource promises pending without reporting failure, retain decoded/cache-ready media, and defer new optional transfers until release. Main story's native images and the foreground original-PNG images are unaffected. Close/Escape/Back/unmount release the pause; stale close events must not release a newer opening's ownership. Resume/restart unfinished background transfers after closing, preserving normal existing warm-after-story behavior when Wellness is closed. Partial aborted transfers may restart; disclose that bandwidth tradeoff. No source files, codecs, colours, crops, text, controls or main-media barrier change.

Affected paths: `lib/media-resource.ts`, `components/WellnessViewer.tsx`, and bounded loading tests. Verify actual background abort→noRetry/error→no newly started optional transfers while open→resume/decoding after close; repeated open/close; all existing optional-media priority and charcoal/technology behavior; original PNG and public hash retention; type/lint/build/native review; final reference screenshots and measured cold4Mbps latency. Keep initial slow sample and controlled A/B. Final approval requires an actual improved product sample, not the test-only blocking control.

## Verified local delivery — 2026-10-22

Beyond Shisha Learn more opens the native continuous ribbon; Close/Escape/Back/backdrop restore the landing focus and scroll. Exact English source DOM, five blocks/four original PNGs and four matching Open Sans fonts verified; eleven localized routes include Arabic RTL. Original reference landing is excluded. No commit/push/deployment was requested for this feature; all changes remain local on main, published2fd005d unchanged.

Production WebKit Pro402×874/Max440×956 DPR3:22 aligned source/actual captures at tolerance0.1 have0diff, matching total heights4949/5062. This is not RGBAidentity: small eyebrow text deliberately uses the documented4.597:1 contrast correction. All photo first-entry paint/crops/ratios, safe areas, keyboard/focus/scroll/reopen, motion/reduced-motion, photo503+Retry and failed-main-prerequisiteRetry were exercised. Adaptation covers280/320/375/short402/440/768/1440 and11locales, including55geometrycases. Actual screenshots were viewed byroot andindependent auditor. Hero/Beyond/footer six valid landing controls remain unchanged; invalid flat oldProBeyondbaseline was replaced with a textured originalHEADcontrol, history retained.

Browser checks:34feature/existingpriority passes and30intentionalduplicate skips,2additional deterministic native-stream cancellation passes and6assembledpage/gallery passes,0failures. Deterministic tests prove partial256B/nativeabort, release-before-rejection, synchronousreopen/staleclose, cachedefault→reload, exactly2HTTPrequests andall12charcoaldecoded/noRetry. Build15staticpaths/11localeSSG, strictTypeScript, nativeactualdiffreview clean; lint0errors/1preexistingTelegramwarning and finaltargetedlintclean. Current12runtime/testSHA reviewed exactly; all5sourcePNG/fourusedpublicPNG/fourfonts exact,217priortrackedpublicfiles unchanged.

Actual final coldChromium402×874DPR3/4Mbps100ms4CPU: useful2.342s,LCP2.548s,CLS0,JS209150B,0wellnessrequests beforeclick; hero10.409s/allfour20.894s for10,149,306B. Prior contention39.545s/91.492s and test-onlycontrol10.145s/20.877s retained. Optionalwarming now pauses only whileWellnessopen; readycache persists, incompletebodies restart onclose.119scrollsamples/120distinctpositions,p9516.7ms,0frames>33ms. Singlesyntheticmeasurements,notINP/Lighthouse/field orphysicalSafari/Telegramchrome/nativetouchswipe proof. PNGoptimization remains deferred to owner acceptance. Supplied wellness/productbenefit claims remain unverified; no new publication authorization inferred.

Durable source/content/hash/performance/geometry/selectedimage evidence: `docs/evidence/wellness/verification.json`; rawDPR3images and privatecommandlogs remainlocal `/tmp/ramsider-wellness/` and ignored`screenshots/wellness/`. CHG0130 retains failedchecks, repairs and technicalapproval; controlledAgentEvalsNOT_RUN. Independent final record audit PASS /root/wellness_priority_auditor2026-10-22.

## Owner release authorization — 2026-10-22

After local verification the owner accepted the appearance («Да, выглядит нормально») and explicitly requested commit/deploy of all completed work. Publish the verified current feature and its reference/records plus completed certificate/footer receipts to origin/main; exclude private licence/policy sources. Prior no-publication statements above describe the earlier implementation stage and are now superseded. The appearance approval does not independently confirm the supplied medical/product claims. Exact-SHA publication outcome: `docs/evidence/wellness/publication.json`.
