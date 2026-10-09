# ROE — Implementation Plan v1.0
Based on: PRD v1.0 (8 Oct 2026, consolidated baseline). Fixes gaps in TRD v1.0, UI Design System v1.0, Figma Spec v1.1. Informed by n=12 survey.
Date: 9 Oct 2026 | Repo: vickiewondaz/ROE-No-one-lost-to-silence

> STATUS 9 Oct 2026 (end of day): P0 backend COMPLETE and live — people/actions/interactions/connections/invites/platform APIs, RLS verified, smoke 80/80 + unit 20/20, prod clean with 1 admin. Naming: F-IDs + Prototypes A–H canonical (Figma v1.2.1; P01–P20 references below map 1:1). Hosting: Netlify prod (TRD amendment A1); Vercel kept as fallback. Remaining build: roles polish tail, desktop follow-through, notifications surface (writes exist), docs tidy, pilot recruitment.

## 0. Lock these before code

### 0.1 Canonical journey (PRD §5 is source of truth)
Full MVP (use everywhere):
1 First Contact → 2 Capture & Welcome → 3 Assign → 4 Personal Follow-Up → 5 Record Interaction → 6 Understand → 7 Connect → 8 First Participation → 9 Next Action → 10 Continued Relationship
Shorthand only: Capture → Assign → Follow Up → Connect → Know What Happens Next
FIX UI System §20: replace 5-step `First Contact→Welcome→Follow-Up→Connection→Next Action` with full 10-step + shorthand. Figma §1.4, TRD §1 already correct.

### 0.2 Frame naming fix (Figma §9 vs §17 clash)
- Prototype frames → P01–P20 (Login→…→Updated Home). System frames → F01–F18 (F01 auth, F02 home, F03 people, F04 profile, F05 actions, F06 connections, F08 care FUTURE, F09 celebrations FUTURE, F12 insights FUTURE, F13 AI FUTURE, F17 states, F18 mobile).
- Rename in Figma file pages 05/06/08. Update §17/§18 cross-refs. P19/P20 are state variants of P07/P02, not new pages.

### 0.3 Action state machine (fixes Paused gap)
States: Open → In Progress → Completed | Overdue (system-derived from due_at) | Paused → In Progress (resume). Only assignee + admin can pause/resume with reason. Paused keeps due_at frozen for attention sorting, still shows in Today as Paused. Enforce server-side in TRD §7.2. Add unit tests for all transitions.

### 0.4 Scope locks (stop creep)
P0 ONLY: auth+org, People CRUD, Actions, Interactions (manual WhatsApp handoff), rule-based connection suggest + intro + honest outcome, notifications (assignment/due/overdue/intro/connection), Home attention, search/filters scoped. P1: care, celebrations, re-engagement, member self-service expansion, AI summaries/drafts. P2: WhatsApp Business API, SMS, agents, multi-campus, analytics. Tag all UI §29-30 / Figma future components FUTURE-DO-NOT-BUILD.

### 0.5 Permission matrix (backend enforces, UI only hides)
Default: Assigned/Shared scope. Org-wide search = explicit grant (Admin, Senior Leader). Admin manages users/org but needs explicit scope to see PII/care — no universal access.
| Capability | Admin | Worker | Group Leader | Member | Care(P1) | Senior Leader |
|---|---|---|---|---|---|---|
| Org/users/roles | CRUD | own profile | own profile | own profile | own profile | read org |
| People create/search | create org, search org* | create, search assigned+shared | create in group, search group | own read | as assigned | search org read |
| PII/preferences | only with scope | full if assigned | relevant if group, no care | own | if assigned | operational, no care |
| Actions | admin only | CRUD assigned | CRUD group | complete own | care-linked if assigned | read |
| Interactions | if authorised | if assigned | if group | — | if assigned | read |
| Groups/suggest/intro/confirm | config only | if assigned | if group | view own | — | read |
| Notifications | org+admin | assigned | group | own | care-assigned | aggregate, no PII leak |
| Care Restricted | denied default | denied | denied | own request | if assigned | denied |
*Worker org-wide search off by default.

### 0.6 Data model deltas (TRD §6.2)
Add: GroupMembership(person_id, group_id, role, status), AssignmentHistory(action_id, from_user, to_user, at, reason), keep Connection.status ∈ {Suggested,Introduced,ParticipationRecorded,Confirmed} + outcome_nullable + outcomeHonest flag (allow negative). Relationship table: define as person↔person|group edge with type + source, or drop if unused — do not leave undefined. Consent + CommunicationPreference required at capture (channel opt-in). Retention/deletion: define periods now (e.g. inactive contact purge rules per org) — TRD §6.6 gap.

### 0.7 Non-functional locks
- Offline/low-data: P0 must work on flaky network — optimistic UI + retry + clear failed-save state, no provider dependency (TRD §9). Test on 360px + throttled 3G.
- A11y: WCAG 2.2 AA — add axe-playwright + keyboard-only E2E + focus/contrast checks to TRD §11.
- Ops: backup RPO/RTO, restore test, incident runbook, separate dev/test/prod, migrations via Drizzle, secrets out of repo (TRD §12 gap fill).
- Versioning: all docs header + changelog. Figma v1.1 → note delta vs v1.0.

## 1. Phase 0 — Repo & foundation (wk 1)
- Next.js + TS + Tailwind + shadcn init, ESLint/Prettier, GitHub Actions CI, Vercel preview + prod, Cloudflare DNS.
- Managed Postgres + Drizzle + migrations, Better Auth (sign-in, recovery, sessions, org membership, rate-limit).
- Design tokens from UI/Figga Table 2: teal #0F766E/#115E59/#CCFBF1, amber #D97706, orange #EA580C, blue #2563EB, bg #F8FAF9, text #17201F/#667370, border #E2E8E6. Inter, spacing 4-64, radius 8/10/12/16. Dark tokens reserved, not MVP UI.
- Exit: login works, org isolation stub + 1 RLS policy tested.

## 2. Phase 1 — People + Assign + Home attention (wk 2-3)
Backend: Organisation, User, Role, Person, Action, AssignmentHistory, AuditLog. Server authz middleware (identity→org→role→operation→relationship→sensitivity), deny-by-default, IDOR guards, tenant check on every query.
Frontend mobile-first 390×844: P01 Login, P02 Home (Needs attention/Today/New/Pending/Upcoming), P03 People list + search + filters (New/Assigned/Contacted/Connecting/Connected), P04 Create (Name+Phone+Channel required only, progressive rest, duplicate + phone validation), P05 Created confirm (record saved ≠ relationship built), P06 Assign (person context + purpose + worker + due + notes, full-screen on mobile), P07 Profile overview (Human Context Card + Thread stub).
Reminders: due/overdue derivation + in-app list. No paid messaging.
Exit: Login→Create→Assign→Home updates E2E green.

## 3. Phase 2 — Follow-up + Record + Next Action (wk 4-5)
Backend: Interaction (person, date, channel Call/WhatsApp/Visit, outcome, notes, action_link, next_action), Action transitions (§0.3), Notifications (assignment/due/overdue).
Frontend: P08 Action detail, P09 In Progress (must not imply contact), P10 Record (sticky save, validation), P11 Recorded confirm (saved ≠ built), P18 Next Action (owner+due, allow none — do not manufacture tasks), P19 updated Profile, P20 updated Home (completed leaves open list, next appears).
WhatsApp handoff: deep link → talk → return → log. Log failure state if provider down.
Exit: full `Login→Create→Assign→Record→Next Action` E2E + negative authz tests.

## 4. Phase 3 — Connect journey (wk 6-7)
Backend: Group, Connection with 4 distinct states, Participation outcome (allow negative/pending, never coerce positive).
Frontend: P12 Journey Thread vertical (Completed/Current/Upcoming/Unconfirmed), P13 Suggested (rule-based from interests, labelled possibility), P14 Introduction handoff, P15 Sent (intro ≠ attendance), P16 First Participation form, P17 Confirmed (participation ≠ belonging).
Microcopy enforced: prefer “Follow-up due / No outcome recorded yet / Introduction recorded / Suggested connection”, ban “Failed/Inactive/Spiritually weak/High-risk/Disloyal/Lost”.
Exit: 20-frame click path P01→P20 navigable, alternate paths (validation error, no results, save fail, reschedule, no connection, pending outcome, restricted, empty home) present.

## 5. Phase 4 — Roles + states + responsive (wk 8)
Group Leader view (group-scoped home/people/actions/intros), Admin view (users/roles/org/audit, no default PII), Member limited (own record + prefs). Care/Senior screens stubbed FUTURE only.
Desktop/tablet adaptation from mobile components (sidebar + context panel, no dense tables on mobile), drawers/modals, toasts/alerts, permission-restricted component (never flash sensitive then hide).
A11y + motion (150-300ms, reduced-motion), touch 44px, persistent labels, safe areas.
Exit: role matrix E2E (Ex. A cross-org denied, B assigned conditional, C care denied), axe clean on P01-P12.

## 6. Phase 5 — Hardening + pilot ready (wk 9-10)
Security: HTTPS, sessions, server authz everywhere incl. jobs/AI stubs, RLS policies per table, input validation, rate-limit, secrets, backups + restore test, dep audit, OWASP/NIST + NDPR review. AI Controller stubbed behind flag (auth→context→authz→minimal fetch→adapter→validate→human review) with Qwen/Gemma adapter interface only — no MVP AI features enabled.
Testing: Vitest (rules/transitions/perms), RTL (forms/loading/error), integration (isolation/auth), Playwright E2E primary + alternates, security negatives (manipulated IDs, unauth read/write, scope bypass, AI over-reach, secret leak). All must show denial, not just success.
Docs: pilot runbook, training 15-min script, incident process, RPO/RTO, migration log.
Pilot entry bar: §0 + Phases 1-4 E2E green, RLS + authz negatives green, 390/768/1280/1440 no overflow on core flows.

## 7. Pilot (wk 11-14, concierge + app)
3 churches (50-100, 101-250, 250-500), 1 owner + 1 pastor each. Weekly Due/Overdue lists from app, Fri outcome check. Metrics: % owner <24h (target >70%), % interaction <7d with outcome+next (target >50%), capture <2min + phone valid >80%, overdue shrink WoW. Price ladder test (e.g. NGN 2k/5k/10k/mo) + annual vs monthly. Kill: miss both lead metrics or capture stays dirty → fix process/forms before P1.

## 8. Backlog order (build in this order)
Tokens→Auth/Org→Create Person→Assign→Home→Action detail→Record→Next Action→Journey Thread→Suggest→Intro→Outcome→Confirm→Roles→States→Responsive→Security negatives→Pilot. Do not start care/celebrations/AI/API/analytics before pilot pass.

## 9. Team & cadence
1 full-stack + 1 design/QA part-time can do wk1-10. Daily: authz + RLS check on every PR. Weekly: demo P-frames on device + throttled network. Definition of done per story: mobile frame + desktop reuse + empty/loading/error/restricted + permission test + audit log where relevant.

PRD §14 North Star (Meaningful Follow-Up Completion Rate) + TRD §13 acceptance gate pilot. Wider vision (care, celebrations, re-engagement, belonging) stays P1/P2.
