# ROE — Session Handoff (read this first in a new session)

> For the human: this file lets a fresh AI session continue the project with
> zero memory of past chats. Everything below was true when written — re-verify
> the 3 checks in "Start here" before trusting anything. No secrets are in this
> file, so it is safe to commit, share, and keep.

## What ROE is (30 seconds)

ROE ("No one lost to silence") is a web app that helps churches, fellowships and
faith-based organisations follow up with
newcomers and members: capture a person → assign a worker → follow up → record
what happened → connect them to a group → always know the next step. Mobile-first,
calm, human tone. Tech: Next.js 16 + TypeScript + Tailwind + Drizzle ORM +
Better Auth + Postgres (Neon), hosted on Netlify. Installable PWA + sideload APK.

## Where things are

- Repo root (this machine): `/Users/mac/Documents/ROE-NO ONE IS LOST TO SILENCE`
- GitHub: `vickiewondaz/ROE-No-one-lost-to-silence`, branch `main`
- App code: `roe-app/` (routes in `app/`, shared UI in `components/`, DB schema in `lib/db/schema.ts`)
- Live site: `https://roe-pilot.netlify.app` (Netlify project `roe-app`, team `vickie2`)
- Database: Neon project `roe-pilot`, branch `production`, PG 18 (23 tables, RLS on)
- Docs: `ROE - *.docx` (PRD/TRD/design), `ROE - IMPLEMENTATION PLAN.md`, `roe-app/RUNBOOK.md`,
  `roe-app/DESIGN-SYSTEM.md`, `roe-app/UI-SCREENS-AUTOCLAW.md`, `roe-app/UI-UX-FULL-FLOWS.md`, `autoclaw.md`
- Vercel project `vickie2/roe-app` exists as FALLBACK ONLY — it has an SSO wall; do not use it for users.
- Android keystore (NEVER in repo): `~/roe-android-key/` (`roe-release.key/.crt/.der`,
  30y self-signed CN=ROE, pkg `app.netlify.roe_pilot.twa`, fp `D093571D…A49E9`).
  Back it up — same key needed for updates + assetlinks.
- APK signing scripts: `roe-app/.apk-work/` (GITIGNORED, local only: `sign_apk.py`,
  `verify`/`recompute`/`extract` helpers, fingerprints). `/tmp` gets wiped
  between turns — never keep work there; use workspace paths.

## Start here (new session: run these 3 first)

1. `git log --oneline -3 && git status --short` — confirm HEAD and a clean tree.
2. `node scripts/neon-migrate.mjs` (in `roe-app/`) — idempotent; expect `verify:` + negatives A/B/C PASS.
3. Fingerprint prod: `GET /api/platform/me` → 200, `POST /api/setup` → 404 (lockdown holding),
   `/api/audit` anon → 401. Any deviation = investigate before building.

## Current state (what works, proven — not claimed)

- Full P0 loop live in code: capture → assign → follow-up → record → connect → next action.
- Plus: invites (hashed, single-use, 7d) + request-to-join with throttles, admin console
  (team/invites/audit/roles/leads), dark platform tier (orgs, first-admin invites, suspend),
  password change + recovery email, celebrations (milestones, upcoming, acknowledge flow),
  notifications, member self-service (own record, incl. names), AI test console (super-admin only),
  service-days calendar (admin-managed, on all dashboards), typeahead group picker
  over the 65-team directory, suspend confirms + masked invite links on both dashboards.
- Visual system: Figma v1 implemented (teal-600 primary, Inter throughout, lucide
  icons, framer-motion page transitions + tab pill, rebuilt primitives in
  `components/ui.tsx` + `components/nav.tsx`).
- Brand: new ROE lockup everywhere (transparent PNG, no white boxes), shepherd
  photography (splash + landing backdrop + login wash), favicon.ico + apple-icon
  rebuilt from the lockup, trimmed landing (lockup + 2 buttons only), splash with
  15-min time gate. Old square logo fully purged (file deleted, zero references).
- PWA live + proven: manifest + 3 icons + SW (shell caching, `/api/*` NEVER cached),
  one-tap install card, offline login renders from cache, zero JS errors.
- APK: `public/ROE.apk` (TWA sideload, 1.4MB) signed v1 via stdlib-only
  `.apk-work/sign_apk.py`; signature mathematically proven valid (independent
  RSA re-verify: recomputed == in-file); assetlinks + fingerprint wired, download
  button in More tab. ⚠️ OPEN: owner reports "package appears to be invalid" on
  install — under investigation (see below).
- Proof: smoke suite `scripts/smoke.mjs` (~120 checks incl. self-service PATCH, org profile, services CRUD);
  unit `npm test` (23 green); roles matrix `scripts/roles.mjs` 10/10 on seeded demo org;
  RLS negatives PASS on every migrate run. `npm run build` green, `tsc` clean.
- Roles: `senior` ≈ `admin` for org management (reads + writes) — admin UI admits
  senior and every API gate honours it; `care`/`member` stay scoped, platform stays separate.
- Prod DB holds: orgs `grace-pilot` + `cac`, 2 users (both the owner: admin + super-admin),
  65-team directory + General Fellowship in grace-pilot, owner WhatsApp set on
  grace-pilot for tap-to-chat tests, zero test residue (cleaned repeatedly).
- AI posture: flagged OFF for users; local OmniRoute gateway + Google/OpenRouter connected
  and tested; Hugging Face token exists but account has zero credits (parked);
  free-pools-only policy, no paid spend without budget-cap code (unbuilt).

## 🔴 Open thread: APK install failure (pick up here)

- Symptom (owner's phone): "App not installed as package appears to be invalid".
- Ruled OUT so far: manifest is healthy (minSdk 24, target 36, versionCode 1, no
  testOnly, correct package, parsed with corrected AXML layout — ns/name are
  32-bit, attrs at +36); Digest-Manifest matches; manifest section digests
  verified by script self-check; ZIP opens cleanly (454 entries, stdlib writer);
  RSA signature byte-proven valid by independent recompute (`recomputed == in-file`).
- Known verifier quirk (DO NOT chase again): openssl CLI `cms -verify` (both
  LibreSSL 3.3 and cellar openssl 4) rejects the signature — LibreSSL can't even
  verify its OWN output here, and Node `crypto.verify` ACCEPTS ours. Trust Node + math.
- Still to check: (1) ask owner for exact Android version + confirm the download
  completed (~1.4MB) + Play Protect wording — truncated downloads and Play Protect
  blocks are the most common real-world causes; (2) per-section SF digest recheck
  script crashed on an IndexError before finishing — rerun it fixed; (3) if device
  rejects a proven-valid v1 package, add APK Signature Scheme v2 block next.
- Re-sign flow: PWABuilder cloud package → `.apk-work/sign_apk.py IN OUT KEY DER`
  → verify via Node `crypto.verify` on extracted sat/sig (77B/256B — NOT 79B;
  the 79B slice was the bug that burned a whole session) → copy to `public/ROE.apk`.

## Secrets map (names only — values live in env, never in chat/files)

- `.env.local` (gitignored): `DATABASE_URL` (pooled, owner), `DATABASE_URL_UNPOOLED`
  (direct, owner — migrations/smoke), `BETTER_AUTH_SECRET`, `SETUP_SECRET` (dead:
  `ALLOW_SETUP=false` on prod, verified 404), `RESEND_API_KEY`, `OMNIROUTE_*` (local dev).
- `~/roe-android-key/roe-release.key` — the Android signing key. Never in repo,
  never in chat, back it up off-machine.
- Live credentials the owner holds: Netlify/Neon/Vercel logins, Resend/OpenRouter/Gemini/HF keys.
- Standing rule: NEVER print a secret value. Verify by lengths/status codes, rotate at
  source if one lands in chat, prefer dashboard/CLI flows that avoid display.
- Past incidents (closed): DB password printed once → rotated via API; quoted `.env.local`
  values broke a deploy → parsers hardened + hash checks; stale `next start` on squatted
  ports served old code twice → always `lsof`-check ports before trusting a test.

## Operating commands (roe-app/)

- `npm run build` / `npx tsc --noEmit` / `npm test` (vitest)
- `node scripts/neon-migrate.mjs` — apply migrations + RLS + seed check + negatives (idempotent)
- `node scripts/smoke.mjs <base-url> [setup-secret]` — full API proof (needs ALLOW_SETUP=true
  on target for setup tests; lock down + redeploy + re-verify after)
- `node scripts/roles.mjs <base>` — 4-role matrix on Riverside seed (`node scripts/seed-demo.mjs`)
- `node scripts/shot.mjs <base> [roles]` — Playwright screenshots to `screenshots/`
  (`scripts/shot-responsive.mjs` for mobile+desktop + overflow check, no auth)
- Start servers with `nohup ... &` (plain `&` dies); kill by port via `lsof -ti:PORT`.
  If `pkill -f "next start"` leaves a PID behind, `kill <pid>` it directly.
- Shell gotchas on this Mac: PATH often loses node — prefix
  `export PATH="/Users/mac/.local/bin:$PATH"`; `~/jdk17` never installed (sudo
  blocked, 179MB download crawled) — portable JDK path abandoned in favour of
  PWABuilder cloud + stdlib signing; `pip install` needs `--break-system-packages`
  and PyPI is slow — prefer stdlib + macOS openssl + Node crypto (all present).
- Better Auth endpoints: sign-in `/api/auth/sign-in/email`, signup `/api/auth/sign-up/email`,
  reset request `/api/auth/request-password-reset` (NOT forget-password), change `resetPassword`
  client call. Sign-in rate-limits bite rapid test logins — pace with sleeps, save cookies.
- Seed fixture UUIDs (all-4s etc.) are legal Postgres but fail zod `.uuid()` — use `dbUuid`
  from `lib/validate.ts` for id fields, always.
- AXML parsing (if ever needed again): string pool standard; element node header is
  8 (chunk) + 8 (line+comment) then ns/name as **32-bit**, attrs at +36, 20B each.

## Deploys (no CLI tokens survive — user revokes them)

- Netlify: needs fresh `NETLIFY_AUTH_TOKEN` (user pastes) OR dashboard Trigger deploy.
  After deploy: remote smoke → lockdown verify → clean test rows → confirm.
- Env vars live in Netlify dashboard (DB URLs, secrets, `OMNIROUTE_*`, `ALLOW_SETUP=false`).
- Never commit `.env.local`, `.neon`, `.netlify`, `.apk-work/`, keystores, or any secret value.

## What's next (priority order)

1. **APK install failure** (above) → fix → re-sign → commit → deploy → owner re-downloads
   from `https://roe-pilot.netlify.app/ROE.apk` → confirm installs → bar-free check via assetlinks.
2. Owner tasks: password self-change, token revocations, HF credits decision.
3. Pilot: recruit pilot community #1 (church, fellowship or faith-based org), 4-week concierge, metrics vs kill bar (>70% owner<24h, >50% contact<7d), price ladder.
4. Build queue: roles depth tail, desktop follow-through, notifications polish, TRD/plan refresh.
5. Gated (do NOT start early): worker-facing AI, care workflows, celebrations auto-send,
   analytics, multi-campus, WhatsApp Business API, Play Store listing ($25 — owner declined all paid routes).
