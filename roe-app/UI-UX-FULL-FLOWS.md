# ROE — Full UI/UX Screen Flows (v1, October 2026)

The complete map: screen categories, phases, every user journey, every
screen with its interactions, at mobile and web widths. Companion docs:
`DESIGN-SYSTEM.md` (tokens/components/voice) and `UI-SCREENS-AUTOCLAW.md`
(AutoClaw build order). This file is the *what and how*; those are the
*style and sequence*.

Conventions: screen IDs (S0–S29) match the build pack. Widths: **M** =
mobile 360–480px single column + bottom tab bar; **W** = web ≥1024px left
rail + content ≤672px, identical components. `→` = forward link.

---

# PART A — SCREEN CATEGORIES

| Category | Screens | Job |
|---|---|---|
| C1 Entry (public) | S1 Landing, S2 Welcome back, S3 Forgot→Check email, S4 Choose password→Password set | Route strangers; recover access |
| C2 Newcomer (public) | S5 Find church→Request received, S6 Invitation→Welcome aboard | Join / activate with minimum effort |
| C3 Onboarding | S0 Welcome to {org} (role-aware, once) | Teach the job in 30 seconds |
| C4 Homes (role dashboards) | S7 Worker, S8 Leader, S9 Member, empty Home | Attention-first daily start |
| C5 People loop | S10 People, S11 New person→Person created, S12 Profile, S13 Assign, S14 Next action | Capture → own → plan |
| C6 Follow-up loop | S15 Follow-ups, S16 Action detail, S17 Record→Recorded | See → contact → record honestly |
| C7 Connect loop | S18 Suggest→Introduction→Sent, S19 Participation→Confirmed | Match → handoff → outcome |
| C8 Ownership | S20 More, S21 Change password | Settings, notifications, security |
| C9 Admin console | S22 Administration, S23 Team, S24 Invite someone, S25 Service days, S26 Audit log | Run the community |
| C10 Platform | S27 Platform, S28 Organisation, S29 AI console | Govern organisations (counts only) |

---

# PART B — PHASES

## Phase 0 — Welcoming (no account; S1, S5/S6)
Entry: landing, login, join, invite. Exit: request sent / account active.
Rules: brand warmth, step cues, honest waits, WhatsApp escapes; ask name +
phone only. No dashboard, no data.

## Phase 1 — Onboarding (first session; S0)
Entry: first Home visit post-activation. S0 shows org identity + 3
role-specific bullets + one first-action button + Skip; gated by
`roe.onboarded` flag + role. Exit: Continue/Skip → role home. Newcomers
skip S0 — S5's success state is their orientation.

## Phase 2 — Active flow (role loops; S7–S29)
The seven loops in Part C. Rules: one forward action per screen,
confirmations name the next screen, cycles end at a profile or home, gates
mirror the role matrix (senior ≈ admin; care/member scoped; platform
separate).

## Phase 3 — Belonging (outcome, no screens)
Proven by dashboards: Connected journey, named group, greeted celebration,
next action always set. Any screen that can't point here doesn't ship.

---

# PART C — USER JOURNEYS (end to end)

## J1 Newcomer (stranger → waiting → welcomed)
S1 → S5 (find → introduce → send) → waits (sees 2 steps + ≤2-day wait +
WhatsApp button) → coordinator approves → WhatsApp welcome → invite link →
J2. Branches: no-match (spelling guidance), duplicate request (idempotent
"already received"), phone-only (no email needed).

## J2 Invitee (link → member)
Link → S6 (valid → form → activate → **auto-sign-in**) → S0 orientation →
role home. Branches: bad link (fresh-invite guidance), expired/used
(7-day rule stated), auto-sign-in fails (manual sign-in fallback).

## J3 Member (home → self-service)
S0 → S9 (journey, timeline, celebrations, services, contact edit) → S12
own profile (member-toned, worker controls hidden) → edits sync back to S9.
Empty state → S5. Loop: check journey → update details → see what's on.

## J4 Worker (the daily loop)
S0 → S7 (overdue → today → fresh) → tap person: S12 → Call/WhatsApp (one
tap, under every row) → S16 Start → contact → S17 record (template +
honest outcome, explicit choice) → Recorded → S18 typeahead pick →
Introduction (record handoff) → Sent → S19 outcome → Confirmed → S14 next
→ profile → S7. Capture branch: S10 → S11 → Person created → S13 assign.
Offline branch: any save may land device-only with the amber banner; S18
refuses to advance without a server record.

## J5 Group leader
S0 → S8 (intros needing you → suggest flow; my follow-ups = J4 subset;
my groups) → S18/S19 → people. Escalation: profile reassign back to worker.

## J6 Admin (setup track → daily track → weekly track)
Setup (once): S0 → S22 checklist 0/4 → Organisation profile (logo passes
image check → WhatsApp → welcome) → S25 first service (preview proves
member view) → S24 first invite (copy + role-matched WhatsApp share) →
checklist complete. Daily: amber join banner → S23 (decide → masked token +
Send-via-WhatsApp → Decided history + audit). Weekly: specials + counts +
denied-row review (S26). All destructive taps confirm inline.

## J7 Super-admin (govern, never touch member data)
More → S27 (orgs + counts → create with auto-slug) → S28 (first-admin
invite → two-step suspend/reactivate) → S29 fictional AI trials. Dark band
on every screen; 401 walls for everyone else.

---

# PART D — SCREENS & INTERACTIONS

Global interactions (all screens): tab bar / rail switch sections (instant,
active pill moves); header back returns (flow-safe targets only — never a
route that would duplicate a record); buttons show busy text while saving;
errors render inline red with the fix stated; offline failures raise the
amber banner on the landing screen.

## C1 Entry

**S1 Landing.** Elements: logo, mono ROE, 32px H1, promise line, Sign in
(teal → S2), explainer, outlined fellowship finder (→ S5), AI small print,
pipeline footer. Interactions: two buttons only. M: centred column. W:
same column centred page.

**S2 Welcome back.** Brand-wash header + card form (email; password +
Show/Hide) + submit (busy "Signing in…") + inline auth error + Forgot link +
invite-only note. Interactions: submit → Home; error → stay + message;
Forgot → S3. M/W: same card.

**S3/S4.** S3: email → Send → S3-done ("Check your email", 1-hour + spam +
WhatsApp hint). S4 (via email link): two passwords (Show) → Save → S4-done
→ Sign in; expired → "Request a new one" (→ S3).

## C2 Newcomer

**S5.** Step cue ①②; search (live filter); skeleton rows while loading;
org rows (logo/initial, select → Step 2 card); Step 2: name → phone (first,
required) → optional email → optional note → Send (validates inline) →
success (org header + welcome quote + 2 numbered steps + wait time +
WhatsApp deep link + Back to start). Interactions: selecting org advances
step; typing filters; send → success (no account created, ever). M: one
column; W: centred column.

**S6.** States: checking / bad / expired / form (email + human role + name +
password + Show + Activate → auto-sign-in → S0/Home; fallback manual sign
in) / done. Interactions: Activate → Home (one motion).

## C3 Onboarding

**S0 Welcome to {org}.** Once per device (`roe.onboarded` + Skip sets it).
Org header, H1, 3 role bullets, one primary first-action button, Skip link.
Role content: worker (queue/call/record rules → Home); leader (intros →
groups); member (journey/self-service/contact → my journey); admin (setup
4 → checklist); senior=admin; care=worker + restriction note. M/W: centred
card. → role home / S22.

## C4 Homes

**S7 Worker.** Sections in order: admin dark-link (admin/senior) → Needs
attention + overdue cards → Due today → New-needs-owner → Coming up
(actions + celebrations with copy/greet) → Services (5, Today/Tomorrow, ✦
specials) → collapsed Done. Every person row: link + Call/WhatsApp below.
Banners: demo / forbidden / offline (via destinations). Empty: "All clear
🎉". → S12/S16/S25-detail. W: same stack wide.

**S8 Leader.** Intros (tap → S18, status-aware subtext) → My follow-ups
(contact buttons) → My groups' people → Services. → S18/S12.

**S9 Member.** Identity (avatar + human pill) → Where I am (member stepper,
group, next, named contact) → journey timeline (5) → my celebrations →
What's on → View full profile → contact details (view; edit: names/phone/
channel/interests + Save/Cancel + inline errors). Empty Home: join CTA +
coordinator guidance. → S12/S5.

## C5 People loop

**S10 People.** Search + working journey chips (All→Connected) + result
line + green + Add; rows (name, pill, group · next, contact buttons);
per-filter empties. → S11/S12.

**S11 New person → Person created.** First + optional last + phone +
channel select + disclosure note + Save (live → duplicate warning or
created; offline → device-only flag). Created: confirmation + banner +
single Assign push + profile/people links. → S13/S12/S10.

**S12 Profile.** Header (avatar/phone/pill — member-toned for members;
Call/WhatsApp/Next-Action grid workers-only) → stepper → details →
Next-step panel (Plan/Connect workers; reassurance members) → grouped
History → locked pastoral placeholder → Celebrations (view + month/day add).
States: Loading / Restricted-or-not-found / offline banner. → S13/S14/
S15-tab/S18.

**S13 Assign.** Person card (24h rule) → purpose → worker select (defaults
to you, explicit otherwise, human roles) → due → button naming assignee;
"choose who owns it" guard. → profile.

**S14 Next action.** Rest checkbox OR step + due (incl. Sundays) → Save and
finish → profile. Offline-flagged fallback. → profile.

## C6 Follow-up loop

**S15 Follow-ups.** Overdue-first / Today / Upcoming(10) / collapsed Done;
rows with contact buttons; demo banner signed-out. → S16.

**S16 Action detail.** Identity + status + due; Start-vs-Record logic with
"Starting ≠ contact" banner; reschedule grid (Today/Tomorrow/+3/This/Next
Sunday + custom date + Set date); member-directory reassign; saved-note;
Back + Open profile. → S17/S12/S15.

**S17 Record → Recorded.** Channel; outcome opening **unchosen**
(validation forces explicit honest pick); template chips append; on-file
interests hint; notes; honesty note; Save (live / offline-flagged demo).
Recorded: outcome echo + not-proof note + smart next (profile if Connected
else suggest). → S18/profile.

## C7 Connect loop

**S18 Suggest → Introduction → Sent.** Typeahead (empty = top-3
interest-matched with reasons; typing = 6 filtered; persistent chip + ✕;
in-flight notice; duplicate-proof reuse; empty-query vs no-match states) →
Continue names group / Not now. Introduction (profile-safe back): handoff
card + manual-WhatsApp note + Record handoff (+ state-preserving Back).
Sent: "not attendance" + participation push. Offline: fail loud, advance
never. → S19/S12.

**S19 Participation → Confirmed.** Outcome select (2 attended variants /
not-yet / not-interested) + Save (live two-step confirm for attended;
offline-flagged local journey advance, **group never invented**) →
Confirmed (honest copy both ways + offline banner) + next-action push. →
S14.

## C8 Ownership

**S20 More.** Super-admin dark Platform card; admin tinted Administration
card; Change-password link; notifications (named rows → action links,
unread dots, Mark-all-read); production shows nothing else. → admin,
platform, S21.

**S21 Change password.** Current/new/repeat (shared Show), inline rules,
wrong-password-specific error, done state (title constant, other-devices
note). → More.

## C9 Admin console

**S22 Administration (org-titled).** Amber join-waiting banner (count +
deep link, only when >0); setup checklist (Logo/WhatsApp/Welcome/First
service, ✓/○, deep links, collapses at 4/4); counts line; 3 nav buttons;
access note; Organisation profile editor (logo preview + **image-load
check**, WhatsApp, 280-char welcome, save note). → S23/S24/S25.

**S23 Team.** Amber confirm card (suspend/restore/revoke with consequences);
masked-token invite card (truncated + Copy + Send-via-WhatsApp); Join
requests + waiting count (phone-first WhatsApp-tap cards, inline email
capture, Approve/Decline) + collapsed Decided history; Members + count
(human pills, role select, Suspend/Restore via confirm, lead chips with ✕ +
add picker); Invitations + count (human roles, Revoke via confirm);
+Invite / Audit buttons; single error banner; loading-before-empty. → S24/
audit.

**S24 Invite someone.** Email + role (admin never offered) + Create →
result (7-day framing, masked link, Copy, role-matched WhatsApp text). →
delivered link.

**S25 Service days.** Add/edit (name, weekly-day OR date ≥ today, free
time) → Weekly/Specials lists with **next-occurrence previews** and **past
badges** → Edit/Remove-via-confirm (blast radius stated, dashboards update
instantly). → dashboards.

**S26 Audit log.** Framing line, rows (op code, allowed/denied pill,
**person name**, time), empty state. Back to Team.

## C10 Platform

**S27 Platform.** Dark control banner; org rows (name, status pill, slug ·
team · people); AI-test link; New organisation (name → auto-slug, editable,
validation) → detail; loading/empty/denied. → S28/S29.

**S28 Organisation.** Dark stat band; admin invite (email → masked link +
Copy + WhatsApp; "only path that grants admin"); Status (explanation +
**two-step suspend with team count**, reactivate); not-found/denied. →
invite link.

**S29 AI console.** Dark fictional-only banner; kind/name/context (fiction
hint); Generate (busy); result (draft + model + decision); page-level gate
(checking → wall). No member data, no worker surface. → nowhere (terminal).

---

# PART E — GLOBAL INTERACTION PATTERNS

- **Taps:** 44px min, immediate pressed state, busy text on async buttons,
  no double-submit (busy locks).
- **Feedback:** inline errors (red, fix stated) > banners (amber system,
  blue demo, green success notes) > toasts (none — nothing transient).
- **Confirmations:** inline panels naming consequence (destructive/lockout);
  one-tap only for instantly reversible edits.
- **Loading:** skeletons for directories, "Loading…" cards for lists, never
  flash-of-empty (empties render post-load only).
- **Offline:** loud amber device-only banner on destinations; flows without
  local models (suggest) fail with retry wording instead.
- **Secrets:** truncated display + copy/share actions; full tokens never
  render.
- **Nav transitions:** instant section switches; flow backs target
  duplicate-safe screens; terminal states offer secondary exits.

---

# PART F — RESPONSIVE MATRIX (M vs W per category)

- C1–C3: centred narrow column both widths (W adds page gutter only).
- C4–C7: M single stack + bottom tabs; W left rail + ≤672px stack, identical
  cards/buttons/sections (ContactButtons stay paired rows, grids stay put).
- C8: same stacking both widths.
- C9–C10: forms stay single-column at W (readability over spread); lists
  keep card rows; rail replaces tabs; dark bands full column width.
- Never at W: multi-column card grids, hover-only actions, restyled type.
- Acceptance: each Part C journey walked at 360px and 1280px with no
  horizontal scroll, no dead tabs, no silent failures.
