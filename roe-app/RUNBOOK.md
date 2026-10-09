# ROE — Pilot Runbook
Live: https://roe-pilot.netlify.app · DB: Neon `roe-pilot` / branch `production`.
Source of truth for recovery: this file + `scripts/neon-migrate.mjs`.

## 1. Daily glance (2 min)
- Open `/login` → prod responds 200. Sign in as admin → Home loads, no demo banner.
- Neon dashboard → project health green, storage/quota sane.

## 2. First admin / new org admin
- First admin: `POST /api/setup` (needs `ALLOW_SETUP=true` + `SETUP_SECRET` env, then redeploy; disable right after).
- Any later admin: super-admin → `/platform` → org → invite admin → WhatsApp link → activate. Never re-enable setup.

## 3. Suspend an organisation
`/platform` → org → Suspend (members get 403 with message, data preserved) → Reactivate to restore. No delete path exists on purpose.

## 4. Rotate secrets
- **DB password:** `neon api /projects/<id>/branches/<bid>/roles/roe_owner/reset_password -X POST`
  (response holds the new password — capture programmatically, never print),
  then update `.env.local` + Vercel/Netlify `DATABASE_URL*` vars, redeploy, re-run migrate script to prove it.
- **BETTER_AUTH_SECRET / SETUP_SECRET:** fresh random → env vars → redeploy.
- **Agent tokens** (Netlify/Vercel/Neon MCP keys in chat): revoke at source, mint new on demand.

## 5. Backup & restore (tested 9 Oct 2026)
- Backups: Neon automatic daily snapshots (free tier: 7d history). RPO 24h / RTO 4h pilot target.
- Restore test procedure (copy-on-write, zero downtime, instant):
  `neon branches create --name restore-test` → verify tables + spot-check rows →
  `neon branches delete restore-test`. Last test: 20 tables + full data readable.
- Real restore: `neon branches restore <target> <source>[@timestamp]` per CLI help. Practice on a scratch branch first, never on production directly.

## 6. Kill switches (in priority order)
1. `ALLOW_SETUP=false` + redeploy — kills self-service account creation.
2. Suspend org (`/platform`) — freezes one church, preserves data.
3. Revoke agent/integration tokens at source.
4. Vercel/Netlify: rollback to previous deployment (both keep history).

## 7. Break-glass (super-admin lost)
Direct DB owner connection (`DATABASE_URL_UNPOOLED` server-side only):
`node scripts/grant-superadmin.mjs <email>` (or `--revoke`). Every grant is a row in `platform_admins` — auditable.

## 8. Incident notes
- Never paste secrets into chat. If one lands here: rotate at source immediately (see §4).
- RLS negatives: `node scripts/neon-migrate.mjs` runs A/B/C on every apply.
- Full app proof: `node scripts/smoke.mjs <url> [setup-secret]` (80 checks local).
- Dep posture: prod `npm audit` clean; dev-only eslint-chain highs tracked, not shipped.
