# ROE — Design System (v3 Figma, October 2026)

Living reference for every screen in the app. If a new screen disobeys this
file, fix the screen — not the file. Source: `components/ui.tsx`,
`components/nav.tsx`, `components/org-brand.tsx`,
`components/offline-banner.tsx`, `components/services-upcoming.tsx`,
`components/celebrate.tsx`, `app/globals.css`. Design refs: Mobbin
(flows/nav), Attio (record hierarchy), Luma (groups), SaaSUI (home/states),
SaaS Interface (forms), Dribbble (restraint). Motion: framer-motion (page
enter + tab pill); icons: lucide-react (server-safe SVGs).

## 1. Principles

1. **Calm, never alarming.** People in crisis read these screens. No red for
   people, no anxiety colours, no stats theater.
2. **Human words, not pipeline words.** Members read "Welcome → Matched →
   First hello → Connecting → Belonging" and "Follow-up team" — never
   `Assigned`, `group_leader`, or UUIDs.
3. **Honest about failure.** Offline saves say so loudly; destructive taps
   confirm; placeholders never pretend to be data.
4. **Thumb-first.** 44px minimum targets, bottom nav, one primary action per
   screen, max width 480px mobile (desktop rail at `lg`).

## 2. Tokens

### Colour

| Token | Hex | Use |
|---|---|---|
| `--color-teal-50` | `#F0FDFA` | Secondary hover wash, rail active bg |
| `--color-teal-100` | `#CCFBF1` | Selected rows, focus rings, active tab pill |
| `--color-teal-500` | `#14B8A6` | Input focus borders |
| `--color-teal-600` | `#0D9488` | Primary buttons/links/active nav, avatar fields |
| `--color-teal-700` | `#0F766E` | Button hover/press, deep text accents, rail text |
| `--color-ivory` | `#F8FAF9` | App background |
| `--color-surface` | `#FFFFFF` | Cards, inputs, nav |
| `--color-ink` | `#111827` | Body text, headings |
| `--color-slate2` | `#6B7280` | Secondary text, field labels, metadata |
| `--color-muted` | `#9CA3AF` | Hints, placeholders, search icons |
| `--color-border` | `#E5E7EB` | Card/input/divider borders |
| success / bg | `#15803D` / `#DCFCE7` | Confirmations, allowed pills, "Saved ✓" |
| error / bg | `#DC2626` / `#FEE2E2` | Errors, denied pills, destructive text |
| warn text / bg / border | `#92400E` / `#FFFBEB` (+`#FEF3C7`) / `#D97706` | Overdue pills, confirm panels, offline banner |
| info text / bg | `#1E3A8A` / `#DBEAFE` | Demo-mode banners only |
| muted-on-dark | `#A7B3B0` | Subtext inside dark bands |
| dark band | `#17201F` | Platform/super-admin surfaces only |

Rules: error red is for **system states and destructive actions**, never for a
person's status. Overdue uses **amber**, not red. Demo banners are always the
blue info pair with the same sentence shape (see §5).

### Typography

- **Display + Body** — Inter (`font-display` + `font-body`, default):
  screen titles (20px semibold in headers, 18px confirmations, 15–16px card
  names), section heads (16px semibold), landing H1 (32px bold), 14–16px
  content, 13px secondary. Buttons 15px semibold, tab labels 11px medium.
- **Mono labels** — system monospace (`font-mono2`): 11–12px uppercase
  eyebrow labels ("ROE · NO ONE LOST TO SILENCE"), metadata (slugs, due
  labels, timestamps), never body copy.

### Shape & touch

- `tap-target`: **min 44×44px** on every button, input, select, row control.
  Buttons/inputs are `h-12` (48px). Press state: `active:scale-[0.98]`
  (200ms); page enter: fade + rise 8px, 300ms ease-out.
- Radius: `rounded-xl` (12px) buttons/inputs/rows, `rounded-2xl` cards and
  panels, `rounded-full` pills/chips/avatars.
- Cards: white, `p-5`, 1px near-black border, shadow
  (`0 1px 3px rgba(0,0,0,0.08)`).
- Header: sticky, white/95 blur, icon back button + eyebrow + title + OrgBrand.
- Nav: 4 tabs with lucide icons (Home · People · Actions · More), bottom bar
  mobile with sliding active pill (spring), left rail on `lg` with active
  side-bar. The active tab is always lit (`tab` prop) — every `Shell` inside
  a section passes it.

## 3. Components

| Component | File | Contract |
|---|---|---|
| `Shell` | `ui.tsx` | `title` (exact on-screen title), optional `back` href, optional `tab`. Renders header + nav + `OrgBrand`. Auth/entry shells omit `tab`. |
| `OrgBrand` | `org-brand.tsx` | Registered organisation on **every** dashboard: name always, logo (or initial tile) beside it. Silent only when signed out / demo. Admin, worker, member see the same identity. |
| `PrimaryButton` / `SecondaryButton` | `ui.tsx` | One primary per screen (teal, 16px semibold, full-width). Secondaries stack full-width, or sit side-by-side in balanced pairs (Copy/Share, Cancel/Confirm, Invite/Audit). |
| `Card` | `ui.tsx` | Default content container (rounded-2xl, p-5). Never nest links inside cards — put the `<Link>` around the text block and action buttons *below* it. |
| `StatusPill` | `ui.tsx` | Teal pill for current state. Members always get `memberJourneyLabel()` text; staff see raw journey. |
| `AttentionPill` | `ui.tsx` | Amber pill for overdue/attention (`◆ label`). |
| `Field` + `inputCls` | `ui.tsx` | Label above input; `hint` (muted, helper) OR `error` (red + icon) below — never both.
  Labels are 13px medium slate. Inputs are h-12 with 2px borders, teal-500
  focus + teal-100 ring, icon slots (search left, Eye/EyeOff right with
  `pr-11`). |
| `Avatar` | `ui.tsx` | Initials circle, teal-600 field with white initials. `sm/md/lg`. No photos in MVP. |
| `SectionHead` | `ui.tsx` | `Title` + optional teal count badge (`Title (N)` pattern). |
| `JourneyStepper` | `ui.tsx` | 5 dots + connector line. Staff tone: New→Assigned→Contacted→Connecting→Connected. Member tone (`tone="member"`): Welcome→Matched→First hello→Connecting→Belonging. `memberJourneyLabel()` for pills. |
| `ContactButtons` | `ui.tsx` | One-tap Call / WhatsApp pair. **Always outside any `<Link>`** (stopPropagation included). Shown on worker list rows; hidden in member-own views. |
| `OfflineBanner` | `offline-banner.tsx` | Amber "Saved on this device only — not sent" panel. Rendered on every destination reachable by an offline fallback (Person created, Interaction recorded, profile, Connection confirmed). Shown once per flag. |
| `ServicesUpcoming` | `services-upcoming.tsx` | "Services" (staff) / "What's on" (members): next 5 occurrences, Today/Tomorrow/date labels, `✦` for specials. Null when signed out or calendar empty. |
| `CelebrateActions` | `celebrate.tsx` | Copy-text + Mark-greeted (channel pick) + recorded state. Human always sends; nothing auto-sends. Templates say "faith community", never "church family". |

## 4. Patterns

- **Confirmations** end in exactly one next step: Person created → Assign;
  Interaction recorded → connection (or profile if already Connected);
  Introduction sent → participation → Connection confirmed → Next action.
  Terminal states keep secondary/back links, never dead ends.
- **Destructive or lockout taps confirm inline** (amber/red panel, named
  consequence, Cancel/Confirm): suspend/unsuspend, revoke, remove service,
  org suspend. Reversible one-tap edits (role change, lead add) don't.
- **Secrets never display.** Invite tokens render truncated (`first40…last8`)
  with Copy + WhatsApp-share actions.
- **Loading before empty.** Lists show `Loading…` first; "No … yet" only after
  data arrives. Skeletons for directory pickers; empty states name the fix
  ("check spelling", "ask an admin", "add your Sunday service").
- **Typeaheads, not long lists.** Church finder + group picker: empty query
  shows top interest-matched suggestions (3), typing filters name+description
  (6), selection persists as a chip with ✕ Clear. Interest hits get a
  "Matches interest in X" reason line.
- **Step cues** for multi-step public flows (`Step N of 2`, dots + labels).
- **Platform dark band** (`#17201F` header card + "PLATFORM" eyebrow) marks
  super-admin territory; those screens show counts only, never member data.
- **Prototype/dev aids never ship.** `NODE_ENV !== "production"` gates the
  More-page prototype index; no TODO copy reaches users.

## 5. Voice

- **Audience words:** newcomers read *community* ("Find your church or
  fellowship", "your community"); admins read *organisation* ("Organisation
  profile", "Organisation tasks"); platform reads *organisations, never people*.
- **Roles:** Follow-up team · Group leader · Member · Care team ·
  Administrator · Senior leader. Raw enum strings never render.
- **Errors:** `Couldn't <verb> it.` + `Couldn't reach the server.` (+ `Check
  connection and try again.` where retry helps). Validation states the fix
  ("Choose your community first", "Enter a valid phone number").
  Offline failures add *"…nothing was recorded."*
- **Phones:** 7–15 digits everywhere, one message. WhatsApp keeps its own label.
- **Dates:** relative first (Today/Tomorrow/Next Sunday), then weekday + date.
  Sundays are the scheduling anchor ("This/Next Sunday" + custom date).
- **No defaults that lie.** Outcome pickers open unchosen; assign defaults to
  *you* and names the assignee; group pickers reuse in-flight records instead
  of duplicating them.

## 6. Accessibility (non-negotiable)

44px targets · visible focus ring · `aria-pressed` on all toggle/select
buttons · `aria-label` on icon-only controls (backs, ✕ clears, Show/Hide,
date pickers) · `role="group"` + label on option groups · form inputs carry
`autoComplete`/`inputMode` · status text never colour-only (pills pair colour
+ words) · decorative art `aria-hidden`.

## 7. Anti-patterns (blocked in review)

Nested `<a>` tags · silent local saves · raw roles/journeys/UUIDs to members ·
full tokens on screen · red for people · pre-picked positive outcomes ·
dead filter chips · flash-of-empty lists · shipping dev scaffolding ·
auto-messaging members · marketing broadcasts.
