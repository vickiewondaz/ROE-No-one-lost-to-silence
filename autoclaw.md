# autoclaw.md — ROE Project Briefing (for the AutoClaw agent)

You are building UI screens for ROE ("No one lost to silence"), a mobile-first
web app that helps churches, fellowships and faith-based organisations follow
up with newcomers so nobody is lost to silence. Tone of the product: calm,
warm, honest, human. Never alarming, never flashy.

## Stack & layout

- Next.js 16 + TypeScript + Tailwind CSS + Drizzle ORM + Better Auth +
  Postgres (Neon). Hosted on Netlify.
- App code lives in `roe-app/`: routes in `roe-app/app/`, shared UI in
  `roe-app/components/`, DB schema in `roe-app/lib/db/schema.ts`.
- Every screen is one route folder. Replacement is per-screen, never
  all-or-nothing. The old code stays one git checkout away — work on branches.

## Source-of-truth docs (obey in this order)

1. `roe-app/UI-SCREENS-AUTOCLAW.md` — all 29 screens + S0 onboarding + phases
   (Welcoming → Onboarding → Active flow → Belonging) + admin/platform tracks.
   Build in its §11 order.
2. `roe-app/DESIGN-SYSTEM.md` — tokens, components, voice, accessibility,
   anti-patterns. If a screen disobeys it, fix the screen.
3. `HANDOFF.md` (repo root) — project state, operating commands, role policy:
   `senior` ≈ `admin` for org management; `care`/`member` stay scoped;
   platform stays separate from member data.

## Non-negotiables (rebuilds usually break here — don't)

1. **APIs are frozen.** Screens fetch the same `/api/*` endpoints with the
   same DTO shapes and cookie auth. Restyle freely; never reshape data.
2. **Hidden logic stays.** Session-storage keys (`roe.offlineSaved`,
   `roe.lastOutcome`, `roe.createdNote`, `roe.onboarded`), duplicate-proofing
   on group suggestions, in-flight adoption, validation messages matching the
   server's zod rules (phones: 7–15 digits).
3. **Tones & gates stay.** Member views read human words (Welcome → Matched →
   First hello → Connecting → Belonging; "Follow-up team", never raw enums).
   Staff views keep pipeline language. Dev scaffolding never ships to users.
4. **Honesty stays.** Offline saves say so loudly; destructive/lockout taps
   confirm inline; invite tokens render truncated; no silent fallbacks;
   no pre-picked positive outcomes; no auto-messaging members.
5. **Accessibility stays.** 44px targets, aria labels/pressed states, focus
   rings, input autocomplete/inputMode, never colour-only status.
6. **Responsive both widths.** Mobile 360–480px (single column, bottom tab
   bar) and web ≥1024px (left rail, content ≤672px). Same components, same
   type scale — layout stretches, components don't restyle.

## Before you call a screen done

- Walk its flow links forward AND back at 360px and 1280px.
- Confirm its loading / empty / error / denied / offline states exist.
- Run: `npx tsc --noEmit`, `npm test`, `npm run build` (all inside `roe-app/`).
- Never write test rows to the production database; never print secrets.

## When unsure, ask the human

Role-permission changes, any new paid/AI/WhatsApp integration, and anything
that messages a member automatically are human decisions — stop and ask.
Everything else: build it, prove it, move to the next screen in §11 order.
