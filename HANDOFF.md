# ROE — Session Handoff (read this first in a new session)

> For the human: this file lets a fresh AI session continue the project with
> zero memory of past chats. Everything below was true when written — re-verify
> the 3 checks in "Start here" before trusting anything. No secrets are in this
> file, so it is safe to commit, share, and keep.

## What ROE is (30 seconds)

ROE ("No one lost to silence") is a web app that helps churches follow up with
newcomers and members: capture a person → assign a worker → follow up → record
what happened → connect them to a group → always know the next step. Mobile-first,
calm, human tone. Tech: Next.js 16 + TypeScript + Tailwind + Drizzle ORM +
Better Auth + Postgres (Neon), hosted on Netlify.

## Where things are

- Repo root (this machine): `/Users/mac/Documents/ROE-NO ONE IS LOST TO SILENCE`
- GitHub: `vickiewondaz/ROE-No-one-lost-to-silence`, branch `main` (clean, in sync)
- App code: `roe-app/` (routes in `app/`, shared UI in `components/`, DB schema in `lib/db/schema.ts`)
- Live site: `https://roe-pilot.netlify.app` (Netlify project `roe-app`, team `vickie2`)
- Database: Neon project `roe-pilot`, branch `production`, PG 18 (22 tables, RLS on)
- Docs: `ROE - *.docx` (PRD/TRD/design), `ROE - IMPLEMENTATION PLAN.md`, `roe-app/RUNBOOK.md`
- Vercel project `vickie2/roe-app` exists as FALLBACK ONLY — it has an SSO wall; do not use it for users.

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
  notifications, member self-service (own record), AI test console (super-admin only).
- Proof: smoke suite `scripts/smoke.mjs` (~102 checks, all green locally and on prod);
  unit `npm test` (20+ green); roles matrix `scripts/roles.mjs` 10/10 on seeded demo org;
  RLS negatives PASS on every migrate run. `npm run build` green, `tsc` clean.
- Prod DB holds: orgs `grace-pilot` + `cac`, 2 users (both the owner: admin + super-admin),
  Young Adults + General Fellowship groups, zero test residue (cleaned repeatedly).
- AI posture: flagged OFF for users; local OmniRoute gateway + Google/OpenRouter connected
  and tested; Hugging Face token exists but account has zero credits (parked);
  free-pools-only policy, no paid spend without budget-cap code (unbuilt).

## Secrets map (names only — values live in env, never in chat/files)

- `.env.local` (gitignored): `DATABASE_URL` (pooled, owner), `DATABASE_URL_UNPOOLED`
  (direct, owner — migrations/smoke), `BETTER_AUTH_SECRET`, `SETUP_SECRET` (dead:
  `ALLOW_SETUP=false` on prod, verified 404), `RESEND_API_KEY`, `OMNIROUTE_*` (local dev).
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
- Start servers with `nohup ... &` (plain `&` dies); kill by port via `lsof -ti:PORT`.
- Better Auth endpoints: sign-in `/api/auth/sign-in/email`, signup `/api/auth/sign-up/email`,
  reset request `/api/auth/request-password-reset` (NOT forget-password), change `resetPassword`
  client call. Sign-in rate-limits bite rapid test logins — pace with sleeps, save cookies.
- Seed fixture UUIDs (all-4s etc.) are legal Postgres but fail zod `.uuid()` — use `dbUuid`
  from `lib/validate.ts` for id fields, always.

## Deploys (no CLI tokens survive — user revokes them)

- Netlify: needs fresh `NETLIFY_AUTH_TOKEN` (user pastes) OR dashboard Trigger deploy.
  After deploy: remote smoke → lockdown verify → clean test rows → confirm.
- Env vars live in Netlify dashboard (DB URLs, secrets, `OMNIROUTE_*`, `ALLOW_SETUP=false`).
- Never commit `.env.local`, `.neon`, `.netlify`, or any secret value.

## What's next (priority order)

1. Prod deploy catch-up (dashboard trigger) → verify → clean.
2. Owner tasks: password self-change, token revocations, HF credits decision.
3. Pilot: recruit church #1, 4-week concierge, metrics vs kill bar (>70% owner<24h, >50% contact<7d), price ladder.
4. Build queue: roles depth tail, desktop follow-through, notifications polish, TRD/plan refresh.
5. Gated (do NOT start early): worker-facing AI, care workflows, celebrations auto-send,
   analytics, multi-campus, WhatsApp Business API.
