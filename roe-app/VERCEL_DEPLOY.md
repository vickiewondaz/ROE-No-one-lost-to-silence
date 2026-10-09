# ROE — Vercel Deploy Checklist (pilot)
Stack: Next.js 16 + Postgres + Better Auth + Drizzle + RLS. Source: TRD v1.1 §§2/12/13, Implementation Plan §6.

## 0. Preconditions (local, done once)
- [ ] `roe-app/.env.local` created from `.env.example` (local `DATABASE_URL`, random `BETTER_AUTH_SECRET` 32+ chars)
- [ ] Local Postgres running, `roe` DB created, `drizzle/0001_init.sql` applied (tables + RLS)
- [ ] `npm run build` green, `/login` `/home` `/people` return 200 locally
- [ ] 4 RLS negatives verified locally (cross-org read, forged org_id, restricted-care read, AI/session-less read → 0 rows / 403)

## 1. Provision production data (10 min)
- [ ] Create managed Postgres (Vercel Postgres / Neon / Supabase — pick ONE, same region as Vercel project)
- [ ] Save: pooled connection string (app) + direct connection string (migrations). Service-role key stays server-only, never `NEXT_PUBLIC_`
- [ ] Run migrations in order on prod: `drizzle/0000_worried_the_enforcers.sql` (14 tables from `lib/db/schema.ts`), then `drizzle/0001_init.sql` (RLS), then `drizzle/seed.sql` (pilot org + admin + worker + Young Adults). Verify: `\d people` shows `org_id`, RLS enabled (`SELECT relname, relrowsecurity FROM pg_class WHERE relname='people'` → true)
- [ ] Backups on (daily, retain 7d). Record RPO 24h / RTO 4h in pilot runbook

## 2. Vercel project (10 min)
- [ ] `vercel` CLI logged in OR Import GitHub repo `vickiewondaz/ROE-No-one-lost-to-silence`, Root Directory = `roe-app`
- [ ] Framework preset: Next.js. Build command: `npm run build`. Node 20+
- [ ] Env vars (Production + Preview): `DATABASE_URL` (pooled), `BETTER_AUTH_SECRET` (new random, NOT the local one), `BETTER_AUTH_URL` + `NEXT_PUBLIC_APP_URL` (= deployed URL)
- [ ] No secrets in repo. Confirm `git log --all -p | grep BETTER_AUTH_SECRET` empty

## 3. Deploy + migrate check (5 min)
- [ ] Deploy. Build must pass with `cacheComponents:false` (alpha setting in `next.config.ts`)
- [ ] Post-deploy smoke (prod URL): `/login` 200 → sign in → `/home` attention renders → create test person → assign → record → next action → updated profile/home
- [ ] `/api/people` without session → 401/501 (never 200 with rows). With OrgA session, OrgB id → 403 + audit row

## 4. Pilot hardening (before real member data)
- [ ] Invite-only: F01.06/F01.07 disabled; owner-seeded org + admin invites only (Figma v1.2.1 §20.1)
- [ ] F14 capped to 6 screens (Overview/Users/Invite/Roles/Org/Audit). No bulk ops
- [ ] Rate limits on (login 10/min/IP, recovery 5/hr). Error monitoring on (Sentry/Vercel). Structured logs 30d, audit_logs indefinite
- [ ] Restore test: restore backup to staging, verify 1 person + 1 action round-trip
- [ ] 15-min training script + price ladder (2k/5k/10k NGN) ready. Kill bar: owner<24h >70%, interaction<7d >50%

## 5. Rollback
- [ ] Previous Vercel deployment marked Keep. Rollback = Promote previous + verify `/home` 200. DB migrations are additive-only during pilot (no destructive ALTERs)

## Local Postgres quick ref (macOS, keg-only postgresql@16)
```
export PATH="/usr/local/opt/postgresql@16/bin:$PATH"   # keg-only, not symlinked
brew services start postgresql@16
createdb roe
psql roe -f drizzle/0001_init.sql   # after Drizzle table SQL
psql roe -c "SELECT relname FROM pg_class WHERE relrowsecurity AND relname='people';"
```
