# ROE — UI Screen Flows for AutoClaw (v1, October 2026)

Build pack: recreate every ROE screen, responsive mobile + web, in the visual
language of the reference set below. Work top-to-bottom: tokens → shell →
flows in order. Each screen lists goal, layout, elements + exact copy, states,
and where it links. Companion doc: `DESIGN-SYSTEM.md` (tokens, components,
voice — obey it everywhere).

## 0. Reference map (what to steal from where)

- **Mobbin (flows + bottom nav):** screen-to-screen motion, 4-tab thumb bar,
  step cues on public flows, one-primary-action screens.
- **Attio (record hierarchy):** profile screens — identity header → journey →
  details → next step → history. People list density + status pills.
- **Luma (groups + primary action placement):** group/suggest cards, the big
  Continue button under a picked option, event-style date rows for services.
- **SaaSUI (home + empty/loading states):** attention-first home sections with
  counts, honest empty states that name the fix, skeleton loaders.
- **SaaS Interface (forms):** labelled fields, hint-under-input, single error
  line, full-width submit.
- **Dribbble (restraint):** calm teal/ivory palette, generous whitespace, no
  decorative charts, no marketing gradients (one soft brand wash on
  "Welcome back" only).

## 1. Global shell (build FIRST — every screen sits in it)

- **Mobile (≤1023px):** content column max 480px centred on ivory `#F8FAF9`;
  sticky white/95 blur header (back arrow ← when present, 11px mono eyebrow
  "ROE · NO ONE LOST TO SILENCE", 20px semibold title, organisation
  logo-or-initial + name at right); bottom fixed 4-tab bar (Home ⌂ · People ◍
  · Actions ✓ · More ···) with safe-area padding; active tab teal pill.
- **Web (≥1024px):** same column becomes max ~672px beside a 240px white
  left rail (brand line + same 4 destinations, active = teal wash); bottom bar
  hidden. Type scale, 44px targets, and spacing unchanged — layout stretches,
  components don't restyle.
- **Rules:** active tab always lit; logged-out/entry screens render the shell
  with no tab lit; dark `#17201F` band + "PLATFORM" eyebrow marks super-admin
  screens only.

## 2. Entry flow (Mobbin-style doorway)

### S1 — Landing (`No one lost to silence.`)
Goal: route three audiences in 5 seconds. Mobile card: centred logo (88px,
rounded), mono "ROE", 32px bold H1, 15px grey promise line ("A warm welcome,
a named person who walks with you, and a clear next step — so every newcomer
becomes family."), teal **Sign in** button, grey explainer (team invited by
admin; invite links open directly), outlined **New here? Find your church or
fellowship →** button, quiet AI-small-print, mono pipeline footer. Web: same
column centred. → S2 / S5.

### S2 — "Welcome back" (login)
Goal: returning team in fast. Brand-wash header (teal-tint gradient, logo,
mono line, 26px H1, "Your people are waiting. Pick up where you left off."),
white card form (Email + Password with Show/Hide), teal submit
("Signing in…" busy), inline auth error ("Wrong email or password…"),
"Forgot password?" link, "invitation is the way in — no public signup" note.
Web: same card centred. → S3 / Home. States: busy, error.

### S3 — "Forgot password" → "Check your email"
Goal: reset without account enumeration. Simple email field + "Send reset
link"; done state confirms ("If the address exists, mail is on its way…
link lasts one hour… WhatsApp is faster anyway."). → S4 via email link.

### S4 — "Choose a new password" → "Password set"
Goal: complete reset. Two password fields (Show toggle), 8-char + match
validation, "Save new password"; done state + Sign in. Expired link gets
"Request a new one".

## 3. Newcomer flow (SaaS Interface forms + SaaSUI states)

### S5 — "Find your church or fellowship" → "Request received"
Goal: phone-first join in 2 steps. **Step cue** (① Find community →
② Introduce yourself). Search field; skeleton pulse rows while loading
("Finding communities…"); church rows with logo-or-initial; empty state names
the fix. Step 2 card shows picked org (logo, name, welcome line) + fields in
order: name → **phone first** ("Your community reaches you here first") →
optional email → optional note → Send. Success: org header, welcome quote,
**2 numbered next steps** (review ≤2 days → personal welcome), green
**Message-on-WhatsApp** button (deep link, name prefilled), Back to start.
States: loading / no-match / field errors / sent. → S1.

### S6 — "Invitation" / "Join {org}" / "Welcome aboard"
Goal: link → member in one motion. States: Checking… / "Link not
recognised." / "Already used or expired." (7-day single-use rule stated) /
form (email + human role label e.g. "Follow-up team", name, password with
Show, Activate) / done ("✓ Account active", auto-sign-in straight to Home,
manual Sign in fallback). → Home.

## 4. Home dashboards (SaaSUI attention-first)

### S7 — Worker home ("Good morning/afternoon/evening" by clock)
Goal: today's work, top to bottom. Admin dark-link card (admins/seniors);
"Needs attention" count + overdue cards (avatar, name, amber due pill,
"no outcome recorded yet", **Call/WhatsApp buttons under every card**);
"Due today"; "New — needs an owner"; "Coming up" (next actions + 🎉
celebrations with copy/greet actions); "Services" (next 5, Today/Tomorrow
labels, ✦ specials); collapsed "Done — tap to review". "All clear 🎉" empty
state. Demo/forbidden banners when applicable. → profile/action/service
screens. Web: same stack in wide column.

### S8 — "Group leader" home
Goal: introductions + my people. "Introductions needing you" (status-aware
subtext, tap → suggest flow), "My follow-ups" (with contact buttons),
"People in my groups" (with contact buttons), Services. → S15/S11.

### S9 — "Hello, {name}" (member home)
Goal: a home worth opening. Identity card (avatar, **human journey pill**),
"Where I am" (member-tone stepper: Welcome→Matched→First hello→Connecting→
Belonging, group line, next step, named contact), "My journey so far"
(timeline, 5), "Coming up for me" (celebrations), "What's on" (services),
"View my full profile →", "My contact details" (view + inline edit: names,
phone, channel, interests, Save/Cancel). Empty state ("Home"): join-request
CTA + coordinator guidance. → S11.

## 5. People loop (Attio density + hierarchy)

### S10 — "People"
Goal: find anyone fast. Search + **working** journey chips (All/New/Assigned/
Contacted/Connecting/**Connected**, counts in result line), green + Add
button, rows (name, journey pill, group · next step, contact buttons), smart
empty states per filter. → S11/S12.

### S11 — "New person" → "Person created"
Goal: 3-field capture, zero friction. First + optional last name, phone,
preferred-contact select, progressive-disclosure note, Save. Created:
"✓ Record saved" (+ duplicate warning / **offline banner** when device-only),
single push → Assign, plus View profile / Back to people. → S13/S10.

### S12 — Person profile ("{First Last}")
Goal: Attio-style record. Header (avatar, phone, journey pill — member-toned
for members; Call/WhatsApp/Next-Action buttons **workers only**), Journey
stepper, Details & preferences (contact/interests/group/owner), Next-step
panel (Plan it / Connect — workers; reassurance card — members), History
grouped Today/Yesterday/date, locked pastoral-notes placeholder, Celebrations
(add month+day, never year). States: Loading / Restricted-or-not-found /
offline banner. → S13/S14/S15/S16/S17.

### S13 — "Assign follow-up"
Goal: clear owner + due date. Person card ("No one without an owner >24h"),
purpose select, worker select (**defaults to you**, "Choose a worker…"
otherwise, human role labels), due select, button naming the assignee
("Assign to Grace"), "choose who owns it" guard. → profile.

### S14 — "Next action"
Goal: every relationship shows a next step or explicit rest. Checkbox rest
option; step + due selects (Tomorrow/3/7 days/**This/Next Sunday**);
"Save and finish → profile". → profile.

## 6. Follow-up loop (Mobbin flow discipline)

### S15 — "Follow-ups"
Goal: overdue-first queue. Sections Overdue-first / Due today / Upcoming
(10) / collapsed Completed; rows (avatar, name, amber-or-grey due, static
next hint, contact buttons). Demo banner when signed out. → S16.

### S16 — Action detail ("{action title}")
Goal: owner + status + one-tap manage. Header (avatar, title, person · phone,
status pill, due), "Starting ≠ contact" banner; Open → Start, else big
**Record interaction** (or Completed note); Reschedule grid (Today/Tomorrow/
+3/This Sunday/Next Sunday + custom date picker + Set date); Reassign
(member directory); inline saved-note; Back to follow-ups + Open profile. → 
S17.

### S17 — "Record interaction" → "Interaction recorded"
Goal: honest record in under a minute. Channel select; **Outcome select
opening unchosen** ("Choose what happened…", negatives allowed); one-tap
note-template chips + "On file: interested in X" hint; notes box; honesty
note ("Saving records the interaction…"). Recorded: outcome echo + "not
proof of connection" + smart next step (**profile if already Connected**,
else Continue to connection). → S18 or profile.

## 7. Connect loop (Luma-style picking)

### S18 — "Suggest a connection" → "Introduction" → "Introduction sent"
Goal: human-decided group match. **Typeahead**: search field ("Type a letter
or word…"), top-3 interest-matched suggestions with "Matches interest in X"
reasons when empty, 6 filtered matches when typing, persistent selection chip
with ✕ Clear, in-flight notice ("Continuing the introduction already in
flight") with duplicate-proofing; Continue names the group; Not now exits.
Introduction: person → group card, WhatsApp-is-manual note, Record handoff
(+ in-page Back preserving state). Sent: "Introduction is not attendance" +
Record-participation push. → S19.

### S19 — "First participation" → "Connection confirmed"
Goal: honest outcome only. Outcome select (attended-welcomed / attended-quiet
/ not-yet / not-interested), Save; Confirmed screen (celebrates honestly,
"no penalty, no judgment") + Create-next-action push + offline banner. → S14.

## 8. Ownership (More + account)

### S20 — "More"
Goal: settings + notifications, zero scaffolding. Super-admin dark Platform
card (super-admins), admin tinted Administration card (admins/seniors),
Change-password link, Notifications list (type-named rows → linked action,
"●" unread, Mark-all-read), **no prototype content in production**. → admin
screens / S21.

### S21 — "Change password"
Goal: self-serve security. Current/new/repeat (shared Show toggle), inline
rules (8+, match, differ), wrong-password-specific error, done state
("Other devices stay signed in"). Title stays "Change password" throughout.

## 9. Admin console (organisation owners)

### S22 — "Administration" (titled with org name)
Goal: org health at a glance. Amber banner when join requests wait (count +
deep link); setup checklist card (Logo/WhatsApp/Welcome/First-service with
✓/○ and deep links) until complete; counts line (team · invites ·
join-requests); three nav buttons (Team & invitations / Invite someone /
Service days & specials); access note; **Organisation profile** editor (logo
preview + URL-with-image-check, WhatsApp, 280-char welcome, save
confirmation). → S23/S24/S25.

### S23 — "Team"
Goal: the daily admin queue. Amber confirm card for suspend/restore/revoke
(naming person + consequence); masked-token invite card (truncated link +
Copy + Send-via-WhatsApp); "Join requests · N waiting" (phone-first cards,
tap-to-WhatsApp, inline email capture for phone-only, Approve/Decline) +
collapsed Decided history; "Members · N" (human role pills, role select,
Suspend/Restore via confirm, lead chips with ✕ + add-a-lead picker);
"Invitations · N" (human roles, Revoke via confirm); +Invite / Audit-log
buttons; single error banner; loading state before empties. → S24/audit.

### S24 — "Invite someone"
Goal: mint + hand over an invite in one screen. Email + role select (admin
never offered), Create; result card (7-day one-use framing, masked link,
Copy, **role-matched** WhatsApp share text). → delivered link.

### S25 — "Service days"
Goal: own the community calendar. Add/edit form (name, weekly-day-select OR
date-with-today-min, free time, validation); Weekly + Specials lists with
**next-occurrence preview** ("→ next: Sunday — this is what members see") and
**past badges** on over specials; Edit/Remove (remove confirms with blast
radius). Changes reflect on dashboards instantly. → dashboards.

### S26 — "Audit log"
Goal: legible accountability. "Newest first — denied rows prove the walls
hold" framing; rows (human op code, allowed/denied pill, **person name**,
timestamp); empty state. Back to Team.

## 10. Platform (super-admin, dark-banded, counts only)

### S27 — "Platform"
Goal: all organisations, zero member data. Dark control-plane banner; org
rows (name, status pill, slug · team count · people count); AI-test link;
"New organisation" (name → **auto-drafted slug**, editable, validation) →
lands on detail. Loading/empty states. → S28/console.

### S28 — "{Org name}" (organisation detail)
Goal: onboard or freeze one org. Dark stat band; Admin-invite (email →
masked link + Copy + WhatsApp share; "the only path that grants admin");
Status (suspend explanation, **two-step suspend naming team count and
instant lockout**, reactivate); not-found + denied states. → invite link.

### S29 — "AI test console"
Goal: safe AI trials on **fictional** cases only. Dark fictional-only banner;
kind/name/context fields ("Keep it fictional" hint); Generate; result card
(draft + model + decision, "review as if you would send it"); page-level
super-admin gate (checking → wall). Never touches member data or screens.

## 11. AutoClaw build order

1. Tokens + `Shell` + nav + primitives (buttons, Card, pills, Field, Avatar,
   SectionHead) — S1 static to prove them.
2. Entry (S1–S4) then newcomer (S5–S6) — public, unauthenticated.
3. First-run onboarding (S0) — role-aware, gated by flag (see §12).
4. Homes (S7–S9) with all section/empty/role variants.
5. People loop (S10–S14), follow-up loop (S15–S17), connect loop (S18–S19).
6. Ownership (S20–S21), admin console (S22–S26), platform (S27–S29).
7. Cross-cutting pass last: offline banners, confirms, loading/empty/denied
   states, Show/Hide everywhere, member-vs-staff tones, responsive rail.

## 12. Phases & user-flow system (read before building)

Every user moves through four phases. Build screens phase by phase; nobody
should land in Phase 3 without passing Phase 1.

### Phase 0 — Welcoming (no account)
Screens: S1 → S5/S6. The stranger phase. Goals: trust in 5 seconds, lowest
possible effort to raise a hand. Ends when: join request sent (newcomer) or
invitation accepted (invitee). Design duties: brand warmth, step cues,
honest waiting-times, WhatsApp escape hatches everywhere. No data beyond
name + phone is ever asked here.

### Phase 1 — Onboarding (first session, role-aware) ⭐ NEW SCREEN
**S0 — "Welcome to {org}" (first-run orientation).** Shown once, on first
Home visit after activation (gate: `roe.onboarded` flag in localStorage +
role from `/api/me`; "Skip tour" sets the flag immediately).
Goal: every role understands their job in 30 seconds, then takes one real
first action. Layout: org logo/name header, 24px H1 "Welcome to {org},
{firstName}", three plain-language bullets **per role**, one primary button
to the role's first action, Skip link. Never a carousel, never more than
one screen.
- Worker bullets: "1 · Your people wait on Home — overdue first. 2 · One tap
  calls or messages. 3 · Record honestly; negative counts too." Button:
  "See today's follow-ups →" (Home). Ref: SaaSUI first-run checklists.
- Group leader bullets: "1 · Introductions need your yes. 2 · Your groups
  live on Home. 3 · Record what actually happened." Button: "Meet your
  groups →".
- Member bullets: "1 · This is your journey — watch it grow. 2 · Keep your
  details fresh. 3 · Your contact walks with you." Button: "View my
  journey →".
- Admin bullets: "1 · Set up logo, WhatsApp, welcome line. 2 · List your
  service days. 3 · Invite your team, review join requests." Button:
  "Open setup checklist →" (Administration). Ref: SaaS Interface setup
  wizards (single screen, not a wizard).
- Senior: admin bullets. Care: worker bullets + "sensitive rows stay
  restricted."
States: role load delay (skeleton line) / Skip / Continue. Mobile: centred
card; web: centred card in wide column. → role home (S7/S8/S9) or S22.
**Newcomer onboarding needs no extra screen** — S5's success state (2 steps
+ wait time + WhatsApp button) IS the newcomer orientation.

### Phase 2 — Active flow (role loops)
The user-flow system — each role's loop, with entry screen, loop screens,
and exit:

| Role | Entry | Loop | Exit / escalation |
|---|---|---|---|
| Newcomer | S1 → S5 | Request → wait → welcome message → invite link | Becomes invitee → member |
| Invitee | Link → S6 | Activate → auto-sign-in → S0 orientation | Becomes team/member |
| Member | S0 → S9 | Journey → celebrations → self-service → services | Stays; profile is the record |
| Worker | S0 → S7 | S10 capture → S13 assign → S15 queue → S16 detail → S17 record → S18 suggest → S19 outcome → S14 next → repeat | Escalate person to care/admin via reassign |
| Group leader | S0 → S8 | Intros → suggest → participation → people | Hand back to worker via profile |
| Admin | S0 → S22 | Join queue → invites/team → services → profile → audit | Invite super-admin path only via Platform |
| Super-admin | More → S27 | Orgs → onboard/freeze → AI console (fictional) | Never touches member data |

Loop rules for AutoClaw: every loop screen has exactly one forward action;
every confirmation names its next screen; no loop traps (each cycle ends at
a profile or home); role gates mirror the matrix (`senior` ≈ `admin` for
management; `care`/`member` stay scoped; platform stays separate).

### Admin & platform tracks (dashboards inside the phases)
Admins move on two tracks — build both, in this order:

**Setup track (Phase 1, first day — S0 admin → S22 → done).**
S0's "Open setup checklist →" lands on S22, where the checklist reads 0/4.
Each item deep-links to its editor and ticks live: Organisation profile
(logo passes the image check → WhatsApp → welcome line) → S25 first weekly
service (with next-occurrence preview proving what members will see) → S24
first team invite (copy + role-matched WhatsApp share) → checklist 4/4,
which collapses into a quiet "Setup complete 🎉" line. Nothing else on S22
demands attention until setup is done — the join banner only appears when
requests actually wait. Ref: SaaS Interface setup wizards, single-screen
spirit (checklist, not a wizard).

**Daily track (Phase 2 — S22 banner → S23 → WhatsApp → audit).**
Amber "N join requests waiting" banner → S23 phone-first cards (tap-to-chat,
inline email capture, Approve-as-member/Decline) → masked-token card + Send
via WhatsApp → decision lands in collapsed Decided history + audit trail.
Suspend/restore/revoke and service edits all pass their confirm panels.
Acceptance: a full approve-to-WhatsApp run takes under a minute, one-handed.

**Weekly track (Phase 2 — S25 + S23).** Add specials (vigil, Easter, carol
night) with past badges pruning the old; skim Members/Invitations
counts; read denied rows in S26. No new screens — same editors, calmer pace.

**Platform track (super-admin only — S27 → S28 → AI console).**
Create flow: name → auto-drafted slug → lands on S28 → first-admin invite
(masked link + WhatsApp share) → activation elsewhere. Freeze flow:
two-step suspend (blast radius stated) → reactivate. AI console stays
fictional-only behind its gate. Platform never shows member data, at either
width — dark band present on every screen of this track.

### Phase 3 — Belonging (the outcome, not a screen)
No UI to build — this phase is what the dashboards prove: Connected journey,
named group, upcoming celebration greeted, next action always set. If a
screen can't point to one of those four, it doesn't belong in Phase 2.
Acceptance for the whole pack: walk each role's column end-to-end at 360px
and 1280px without backtracking, dead ends, or silent failures.

Responsive acceptance per screen: 360px mobile (single column, bottom nav,
44px targets, no horizontal scroll) and 1280px web (left rail, content
≤672px, identical components); shared-element screenshots at both widths
before sign-off.
