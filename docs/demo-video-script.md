# Ramsider UNO demo video — capture and narration

The user requested an English, approximately 90-second demo, recorded from the actual site by Playwright. The delivery is an original arena-style English narration with low-level crowd reactions. The announcers and Tyson/UFC events named by the user are delivery references; this recording uses no third-party broadcast audio or copied voice.

## Snapshot and scope

Record the current local `/en` site at the iPhone 17 Pro viewport (402 × 874, DPR 3). The locale menu's new light surface is technically `CHG-0036 VERIFIED`, with no separate user acceptance recorded; this video documents its current browser state and is not design acceptance. Check the live CSS value and page title immediately before recording. Avoid presenting design copy about prices, certificates, stock, shipping, therapeutic effects, or unfinished services as verified facts.

The page has more than 70 individual links and buttons, including 11 equivalent language choices, 12 menu anchors and seven technology anchors. The 90-second film shows **every distinct interaction family** and every non-duplicate story CTA. Repeated links with the same behavior are compressed into visible rapid sequences. Full click inventory:

| Region | Controls in recording |
| --- | --- |
| Header | menu open, one section navigation, locale open, RU selection and visible Russian copy, EN return |
| Narrative | all 14 mapped story CTAs: `hero-reserve`, `fire-learn`, `choice-learn`, `beyond-learn`, `expressions-compare`, `pro-explore`, `gold-explore`, `set-explore`, `order-create`, `final-create`, `technology-experience`, `technology-repeat`, `film-label`, `hospitality-explore` |
| Film | separate `film-play` control |
| Documents | five individual cards and all-documents card |
| FAQ | all six disclosures |
| Account and group | both account cards, four project cards |
| Navigation | persistent back-to-top control at closing shot |

Unavailable media, commerce and document destinations show the site's real explanatory dialogs. The narration describes those as interface states, not completed transactions or published files.

## Shot and English voice cue plan

The capture script writes actual timestamps and actions to `deliverables/ramsider-demo-capture.json`; these target slots may shift by fractions of a second. The total target is 89 seconds, with a hard limit of 90 seconds. The voice cue text is an original script; pauses in punctuation and intentionally separated syllables make the brand sound like **“Ram… SIDER!”**.

| Time | Visible shot/actions | English narration |
| --- | --- | --- |
| 0–5.2 | Hero, wordmark, menu, reserve dialog | “Ladies and gentlemen! Allow me to introduce the new site for... RAM... SIDER UNO!” |
| 5.2–10 | Language menu, RU page text, back to EN | “One story, many languages. Watch the message change, then return to English.” |
| 10–15 | Fire section, Learn More, moment | “Fire gives way to a new ritual. The journey begins.” |
| 15–18 | Feeling and control | “Shared moments. Precise feeling. Intentional control.” |
| 18–23 | Technology modal, feature link | “The technology panel opens a connected system of features.” |
| 23–27 | Choice, Anew, Learn More | “Choice becomes part of the experience.” |
| 27–32 | Film, Beyond, two film controls and technology repeat | “Even the film controls show their current state. Beyond the device, the ritual expands.” |
| 32–40 | Expressions, comparison, PRO and GOLD actions | “And now, the contenders! UNO PRO... and UNO GOLD! Compare these two expressions.” |
| 40–45 | Complete set | “The complete set shows how the pieces belong together.” |
| 45–50 | Order, Create, Testing | “A made-to-order journey unfolds in three steps. The next action is clearly marked.” |
| 50–59 | Five document cards and all-documents action | “Testing enters the story. Explore the document cards and open each detail view.” |
| 59–65 | Venues, MINI, hospitality action | “For venues, MINI brings the vision into shared spaces.” |
| 65–73 | All six FAQ disclosures | “Six questions unfold before you. Tap to see what is available today.” |
| 73–84 | Two account actions and four RAMS-GROUP projects | “Personal and business paths lead into RAMS-GROUP, with four related projects.” |
| 84–88 | Final section and Create action | “The story closes with one invitation: create your UNO.” |
| 88–89.5 | Back to top and closing hero | “RAM... SIDER!” |

The final mix should keep the voice clearly above cheers, whistles and applause. Crowd sounds are locally generated or voiced originals. Captions follow the cue text.

## Verification

- The browser action log in `deliverables/ramsider-demo-capture.json` reports 93 events, 40/40 distinct expected controls, RU route and translated hero visible from 6.20 to 8.84 seconds, page bottom 13195/13195, return to scrollY 0, and no page/console errors. Independent capture audit passed.
- Pro Max 440 × 956, DPR 3 WebKit screenshots and check live in `screenshots/actual/demo-video/`; `scrollWidth=440`.
- `deliverables/ramsider-uno-demo.mp4` measures 89.50 seconds, H.264 804 × 1748 at 25 fps, AAC stereo at 44.1 kHz, and selectable English mov_text captions. Full FFmpeg decode passed. Actual final frames at 0.1, 6.8, 21, 37, 53, 68, 80 and 88.6 seconds were inspected; first and last hero, Russian translated hero and middle/lower sections are present with no gray video padding or development badge.
- The voice is locally generated speech, not a human recording or an imitation of a named announcer. The output contains all 16 spoken cues, pauses, crowd bed, claps, whistles and original audience whoops; audio stream decoding and level checks passed. The available model interface cannot audition audio, so perceived diction, expressiveness, balance and sync remain unverified by listening.
- The mandatory native `codex review --uncommitted` attempt was rejected by automatic approval review because it could transmit the entire uncommitted repository diff externally. The review gate remains blocked pending explicit authorization; no workaround was used.
