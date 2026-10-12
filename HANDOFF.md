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
- Live site: `https://roe-pilot.netlify.app` (Netlify project `roe-pilot`, team `vickie2`)
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
- Silent list: leader dashboards (admin/senior + group-leader) show an "N silent"
  strip — people with no contact in 14+ days (from `interactions.date`, fallback
  `people.created_at`; pure helper in `lib/silence.ts`, 5 unit tests). Taps through
  to People with a `Silent` filter chip (`/people#silent`). No migration.
- Care depth: auto-escalation (silent + assigned worker → "Needs a senior"
  section for admin/senior, no cron — derived from contact dates), first-7-days
  3-step checklist on person pages (welcomed/contacted/group, pure helper +
  tests in `lib/person-summary.ts`), one-line worker summary on profiles,
  "App updates" card on More (latest GitHub release + reinstall button),
  release-notes habit (`roe-app/RELEASE_NOTES.md`). Tests 33 green.
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
  rebuilt from the lockup, landing is now splash → auto-forward to sign-in
  (signed-in visitors go straight to /home; first-timers never land on home),
  login has time-aware greeting ("Good morning, welcome to ROE." etc.) +
  typing animated tagline + bare APK button (no writeup), splash with
  15-min time gate. Old square logo fully purged (file deleted, zero references).
- PWA + APK: REBUILT on owner instruction (restart). PWA layer restored
  (manifest/SW/icons/install UI, live + validated in CI). TWA wrapper v1.0.4
  (versionCode 5) rebuilt with the owner's `roe logo flavicon.png` as the app
  icon (margins trimmed, mask-safe fit) + all crash lessons baked in (splash
  @drawable, packaging gate in CI). Release `android-v1.0.4+9` (APK 3.9MB +
  AAB 3.7MB), same package/key/fingerprint. Awaiting owner install confirm.
  History: hand-signed v1 ("package appears to be invalid") → CI TWA v1.0.1–1.0.3
  (v1.0.3 fixed a splash-@mipmap launch crash) → owner still saw a crash dialog
  on tap → full removal → v1.0.4 restart with flavicon icon. Standing lessons:
  splash animated icon must be @drawable; validate packaging in CI.
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

## 🟢 Mobile track: v1.0.4 CONFIRMED WORKING

- Owner confirmed: v1.0.4 installs and OPENS to the ROE home screen.
  (Direct release-asset links must be opened in Chrome — chat-app mini-browsers
  block APK downloads; that was the only "direct link doesn't load" cause.)
- Release `android-v1.0.4+9`: package `app.netlify.roe_pilot.twa`, versionCode 5,
  flavicon icon, same key/fingerprint as assetlinks.

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

- Netlify: project `roe-pilot` linked to GitHub (`main`, base `roe-app/`),
  auto-deploy VERIFIED WORKING (owner re-authorized the GitHub App; test push
  built green and published with the commit attached). Pushes go live by
  themselves again — no CLI token needed.
- Env vars live in Netlify dashboard (DB URLs, secrets, `OMNIROUTE_*`, `ALLOW_SETUP=false`).
- Never commit `.env.local`, `.neon`, `.netlify`, `.apk-work/`, keystores, or any secret value.

## What's next (priority order)

1. **Mobile verified** ✅ v1.0.4 installs + opens. Remaining nicety: confirm
   bar-free launch (no browser URL bar — assetlinks verification can take a few
   hours on-device; if a bar shows, wait + relaunch before touching code).
2. Owner tasks: password self-change, token revocations, HF credits decision.
3. Pilot: recruit pilot community #1 (church, fellowship or faith-based org), 4-week concierge, metrics vs kill bar (>70% owner<24h, >50% contact<7d), price ladder.
4. Build queue: roles depth tail, desktop follow-through, notifications polish, TRD/plan refresh.
5. Gated (do NOT start early): worker-facing AI, care workflows, celebrations auto-send,
   analytics, multi-campus, WhatsApp Business API, Play Store listing ($25 — owner declined all paid routes).
