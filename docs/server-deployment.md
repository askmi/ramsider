# VDS hosting and deployment

Verified on 2026-11-18 for CHG0204 through the owner's password-authenticated SSH connection. This file is the maintained server map and runbook; MEMORY.md and CONTEXT_INDEX.md route here. The evidence receipt is [deployment.json](evidence/server-deployment/deployment.json). Credentials, environment values, private keys and authentication sockets must never be stored here.

## Applications and services

| Component | Confirmed location / listener | Service / role |
| --- | --- | --- |
| Ramsider Next.js | `/root/ramsider`; `127.0.0.1:3000` | `ramsider.service`, user root |
| Hospitality static site | `/var/www/hospitality/site` | Nginx static root; 393 files, no symlinks into Ramsider |
| Hospitality partner API | `/srv/ramsider/form`; `127.0.0.1:18080` | `ramsider-form.service`, user ramsider |
| Separate receiver API | `/srv/ramsider/form`; `127.0.0.1:18081` | `ramsider-receiver.service`, user ramsider |
| Shared legacy documents | `/var/www/ramsider-legacy` | Nginx `/pdf/` and `/assets/files/` locations |
| Auxiliary / old directories | `/srv/ramsider/web`, `/srv/ramsider/state` | Not the active Next checkout or Hospitality static root |

Other legacy/admin virtual hosts also exist. They are outside this rollout and must not be repurposed or removed.

Before this deployment, the server checkout is `main` at `f79645de75c9f63ee665e5aaeb5bb6332bca1d8a`. Tracked files are clean. The sole reported untracked file is `/root/ramsider/zzzz-ramsider-next`; preserve it byte-for-byte. It is separate from the active Nginx file, whose real path is `/etc/nginx/sites-available/zzzz-ramsider-next`.

The current process started on November14; that timestamp does not establish a different deployed source commit. The checkout hash, service path and actual HTTP responses are the verified evidence.

## Nginx host routing

Nginx1.26.3 runs as `nginx.service`, unit `/usr/lib/systemd/system/nginx.service`. Its configuration test passes. It includes `/etc/nginx/sites-enabled/*`, alongside hosting-panel and legacy configuration. Never replace the global configuration with only these application blocks.

| Host / entry | HTTP | HTTPS |
| --- | --- | --- |
| `ramsider.com` | 301 to `https://ramsider.com$request_uri`, except ACME challenge | Proxy `/` to `http://127.0.0.1:3000`; special locations below |
| `www.ramsider.com` | Same canonical redirect | 301 to apex, preserving path/query |
| `m.ramsider.com` | 301 to apex, except ACME challenge | 301 to apex, preserving path/query |
| `hospitality.ramsider.com` | 301 to its HTTPS host, except ACME challenge | Static root `/var/www/hospitality/site` |
| Preview on port8088 | Static `/var/www/hospitality/site` | No HTTPS preview block in the inspected file |

Active task files:

- `/etc/nginx/sites-enabled/ramsider-main` is a regular file containing apex/www rules.
- `/etc/nginx/sites-enabled/zzzz-ramsider-next` resolves to `/etc/nginx/sites-available/zzzz-ramsider-next` and redirects the m host.
- `/etc/nginx/sites-enabled/zz_hospitality` resolves to `/etc/nginx/sites-available/hospitality`.
- `/etc/nginx/sites-enabled/hospitality_preview` resolves to `/etc/nginx/sites-available/hospitality_preview`.

On the apex HTTPS host, `/partnership` and its trailing-slash form redirect301 to `https://hospitality.ramsider.com/#enquiry`; `/qr` redirects301 to Hospitality. `/pdf/` and `/assets/files/` are rooted in `/var/www/ramsider-legacy`, rather than Next. ACME challenges are rooted in `/var/www/hospitality/site`.

On Hospitality, exact `/api/partner` proxies to port18080 with forwarded host/client/protocol headers and a32k body limit. `/pdf/` and `/assets/files/` use the shared legacy root; `/b2c/` deliberately returns404. Other paths use `try_files $uri $uri/ =404`. GET `/api/partner` currently returns404; no production form POST or email was sent during inventory.

## TLS and renewal

Public TLS handshakes verify successfully for apex, www, m and Hospitality; the observed negotiated protocol is TLS1.3. Preserve certificates, private-key files, SSL includes and all host bindings. Private-key contents were not read.

| Hosts / SANs | Certificate directory | Not after (UTC) |
| --- | --- | --- |
| `ramsider.com`, `www.ramsider.com` | `/etc/letsencrypt/live/ramsider.com/` | 2027-02-01 07:50:18 |
| `m.ramsider.com` | `/etc/letsencrypt/live/m.ramsider.com/` | 2027-02-01 07:52:57 |
| `hospitality.ramsider.com` | `/etc/letsencrypt/live/hospitality.ramsider.com/` | 2027-01-28 15:12:51 |

Each block uses `fullchain.pem` and `privkey.pem` from its directory and `/etc/letsencrypt/options-ssl-nginx.conf`. `certbot.timer` is enabled and waiting. Public certificate SHA256 fingerprints and verified SANs are recorded in the evidence receipt for before/after comparison. Renewal can legitimately change certificate bytes; do not overwrite a renewed certificate with an old baseline.

## Next runtime and Git access

`/etc/systemd/system/ramsider.service` specifies:

```ini
Type=simple
User=root
WorkingDirectory=/root/ramsider
ExecStart="/root/.nvm/versions/node/v24.22.2/bin/node" /root/ramsider/node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000
Restart=on-failure
RestartSec=5
```

The unit declares NODE_ENV; no `.env*` files were found in the checkout. Do not infer or copy secret environment values. Node/npm are absent from a noninteractive SSH PATH. For build commands, explicitly prepend `/root/.nvm/versions/node/v24.22.2/bin` to PATH; do not modify the system-wide PATH or this working service.

The old Git origin is `git@github.com:askmi/ramsider.git`, but its server-side SSH authentication is rejected. Anonymous HTTPS access to `https://github.com/askmi/ramsider.git` succeeds and reports the expected main SHA. Use that HTTPS remote in the prepared independent clone, without adding credentials, changing SSH settings or modifying the old checkout's origin.

Dependencies and product-film registry match the already verified local source. There are18 approved films comprising4087 files /4,597,305,284 bytes. Only film archives use Git LFS. A fresh checkout may skip LFS smudging and reuse verified existing extracted film files; the normal build script still checks their complete file set and hashes. Do not alter film content, paths or encoding during this rollout.

## Deployment plan

This plan still requires its exact target commit and independent pre-mutation approval. Record the resolved main SHA once; do not silently substitute a moving branch tip.

1. Persist the verified map in Git. If that creates a documentation-only main commit after7464028, verify the complete production-source projection remains identical to the reviewed7464028 code before deploying that exact new SHA.
2. Require the old checkout to remain atf79645d with no tracked changes and only the inventoried untracked backup. Recheck configuration/unit fingerprints and adequate free storage/memory. Initial inventory found approximately68.8GB free disk and7.1GB available memory.
3. Prepare `/root/ramsider-releases/20261118-main` separately; current checkout and its running `.next` remain untouched. Clone the existing Git repository independently, set the new clone's origin to the HTTPS URL, fetch main and verify its exact pinned SHA before checkout. Never run `git reset --hard` or `npm ci` in the live checkout.
4. Run isolated `npm ci --include=dev --no-audit --no-fund`, copy the existing extracted films independently and run the normal production build. Preserve the untracked backup in the prepared checkout. Retain old immutable `.next/static` objects missing from the new build so already-open pages can still fetch their old URLs; fail if the same static URL has different bytes.
5. Start a temporary candidate server on `127.0.0.1:3100`. Verify all three complete English documents, aliases, clause6.3, static resources and Home/up behavior; use a local-only SSH tunnel for Pro/Max browser checks. Do not expose a new public listener or send production form submissions.
6. Only after candidate approval, stop **ramsider.service**, move the old checkout to `/root/ramsider-releases/previous-f79645-20261118`, move the prepared checkout to `/root/ramsider`, then start the same unchanged service. This preserves its absolute WorkingDirectory/ExecStart paths. Expect a brief service restart; never build while production is stopped.
7. Check readiness immediately. On failure, stop Ramsider, move the failed new checkout aside, restore the previous directory to `/root/ramsider`, start the unchanged service and recheck the old baseline. Preserve failure diagnostics in protected ignored storage.
8. Compare before/after Nginx files, unit hashes, certificates, both form services, all Hospitality and legacy file manifests, host redirects and old PDF bytes. Confirm public legal URLs/aliases/FAQ and mobile screenshots. Do not reload/restart Nginx, alter certificates or touch Hospitality for this application deployment.

Run state and protected logs belong under `/root/ramsider-deploy/20261118-main`. These three preparation/backup/state paths were absent at inventory; fail rather than overwrite if they unexpectedly appear. The old checkout and logs must remain available for rollback; do not delete them as deployment cleanup.

## Access for later work

The owner's password is entered directly into normal SSH and is never retained. The desktop app's terminal connector is read-only, and CUA app control was denied. A user-started password SSH ControlMaster in a protected temporary directory supplies the agent's command channel. The channel lasts while that SSH session is open; this runbook is durable repository memory, not permanent authentication or model training. Re-establish authorized access on a later session instead of inventing credentials or bypassing host-key checks.
