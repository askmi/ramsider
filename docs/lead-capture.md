# UNO Launch Enquiries — Google Workspace SMTP

The selected interface has two purposes: **Launch Updates** (email required) and **Request a Call** (phone required). Email updates are optional and unchecked for a callback. Existing launch announcements retain November 20, 2026. Joining is not a purchase or device reservation; no discount or response deadline is promised.

All enquiries go from and to **support@ramsider.com**, using Google Workspace SMTP (`smtp.gmail.com`, port 587, required STARTTLS). Subjects identify the website entrypoint and purpose, for example `[RAMSIDER Website · Reserve Now] Callback Request`. The plain-text body includes contact details, source, time, request reference, and explicit email permission. A callback without email permission must not be added to marketing mailings.

## Private Configuration

Dmitry or Timofey must create an app password for **support@ramsider.com** with two-step verification enabled, then enter it directly in the main site's Vercel project as **GOOGLE_SMTP_APP_PASSWORD**. Do not paste it into chat, source, screenshots or logs. No `NEXT_PUBLIC_` prefix. Do not reuse the Hospitality site's `partners@` password.

The user authorized production publication on October 31, 2026 with the interface visible before SMTP is configured. Capture UI is enabled by default. Without the app password, submitting shows a temporary-unavailability message with support@ramsider.com, retains entered values, and never claims success. **LEAD_CAPTURE_ENABLED=false** is an optional explicit kill-switch for both UI and API; changing the UI flag requires a fresh build/deployment.

The user selected same-browser protection on October 31, 2026. **LEAD_CAPTURE_ONCE_POLICY** defaults to `browser` when unset; it may also be explicitly set to `browser` in the main site's Vercel project. This is the approved configuration value; remote configuration has not been verified. It covers the limited protection below, not one submission per contact worldwide.

## Repeated Submissions

The browser prevents simultaneous submissions, remembers an accepted purpose using non-contact boolean flags, and preserves an unresolved marker before sending. Lost responses/reloads require a manual delivery check instead of inviting a blind resend. No email or phone is stored in localStorage. A person using another browser/device, clearing storage, or making simultaneous requests across server instances is not covered by a durable ledger.

The server has bounded process-local contact/purpose deduplication and rate limits only. A stable SMTP Message-ID is not a provider idempotency guarantee. Permanent contact-wide deduplication needs shared durable storage; Google SMTP alone cannot supply it.

## Delivery Acceptance After Private SMTP Configuration

1. Configure the secret privately and set **LEAD_CAPTURE_ONCE_POLICY=browser** (the user-approved policy). The visible no-SMTP fallback may be published now as explicitly requested; verify delivery after configuring the secret.
2. Build a restricted test deployment with capture enabled; use synthetic contacts controlled by the team. Until SMTP is configured, the public form displays the unavailable fallback.
3. Verify a Launch Updates enquiry and a phone-only Callback Request reach the support inbox, with correct source/purpose, consent text and Reply-To behavior. Verify rejection never displays success. SMTP acceptance is distinct from inbox delivery.
4. Verify duplicate clicks, reload/reopen, and the selected repeat policy on the deployed build; record actual results. Publication of the unavailable fallback is separately authorized.

No real Google SMTP authentication, send, or inbox receipt has yet been verified. Local intercepted UI acknowledgements and injected mail-adapter tests are fixtures, not delivery proof. No newsletters, confirmation emails, CRM or automated orders are implemented. The support team manages enquiries and removal requests; marketing campaigns require a separate process that honors consent and unsubscribe requests.
