# ROE UI/UX MVP Update v1.1 — AI-included journeys, flows & components
Date: 9 Oct 2026. Supersedes the AI-future notes in UI v1.1.1 / Figma v1.2.1 for DESIGN purposes.
Build rule unchanged: AI slots ship dark; switch-on follows the rollout plan (§8) after the pilot gate. Design everything now, enable in stages — no redesign later.

## 1. MVP journey with AI touchpoints

| Stage | AI assists | Human gate | If AI unavailable |
|---|---|---|---|
| First Contact / Capture | Nothing. Humans welcome humans. | — | — |
| Assign | Nothing. Owner is a human decision. | — | — |
| Personal Follow-Up | **Message draft** (welcome/check-in, warm, ≤60 words) | Worker reviews → Edits → Sends. Never auto-send. | Blank composer (today's behavior) |
| Record Interaction | **Notes summary** into timeline entry | Worker confirms before save | Worker-written entry (today) |
| Understand | **Suggested interests/tags** from notes | Accept / dismiss per tag | Manual entry (today) |
| Connect | **Ranked suggestions** (rule list → AI order + reasons) | Human picks; intro stays manual | Rule list, unranked (today) |
| First Participation | Nothing. Outcomes are witnessed, not generated. | — | — |
| Next Action | **Suggested next step + reason** | Accept / Change | Manual (today) |
| Continued Relationship (Home) | **Attention ranking explained** ("3 need you: 2 overdue, 1 new") — ranks WORK, never people | Informational only | Unranked lists (today) |

## 2. Screen-by-screen deltas (P01–P20 + roles)

- **P04 Create / P05 Created:** no AI. Add nothing.
- **P06 Assign:** no AI. Owner stays human.
- **P07 Profile:** Next Action card gains suggestion variant (§3) when enabled; timeline entries show "AI summary · confirmed" vs "written by worker" provenance line.
- **P10 Record:** notes field gains "Draft summary" only where implemented; composer for follow-up messages gains "Draft" button (P08/P10 context). Draft never sends itself.
- **P12 Journey:** unchanged (facts only; AI never writes history).
- **P13 Suggested:** list becomes ranked-with-reasons when enabled; unranked rule list otherwise. Same cards, added reason lines.
- **P18 Next Action:** suggestion card with reason + [Accept] [Change].
- **P02 Home:** attention section may carry one explanation line ("2 overdue · 1 new, no owner"). No scores, no person judgments — ever.
- **Admin/Platform/Member:** no AI surfaces. Member screens stay human-only (trust). Care/restricted areas show no AI affordance at all.

## 3. Components (new + changed)

**AI/SuggestionCard anatomy (new):**
1. Chip `AI suggestion` (amber, Inter 12/500 + icon) — never "AI decision".
2. Content (Jakarta 16/600 headline or Inter body for drafts).
3. Reason lines ("Suggested because: no group yet · likes music") — always present; a suggestion without reasons is a bug.
4. Actions: [Use] [Edit] [Dismiss] — Edit opens the normal composer prefilled; Dismiss logs dismissal (signal, not punishment).
5. Provenance (mono 12): "draft · reviewed by you" after human action. Provider names NEVER shown to volunteers (they churn); logged in audit only.

**States (all designed, all required before switch-on):**
- Loading: skeleton in the card slot, non-blocking — worker can act without waiting.
- Unavailable/offline/quota: silent rule-based fallback + tiny grey note ("assistant offline — showing standard list"). Never blocks, never loses input.
- Error: inline retry; worker's text preserved verbatim.
- Empty: no suggestion where none is warranted (no filler suggestions to look smart).

## 4. Human-review gates (non-negotiable table)

| AI output | Gate | Forbidden |
|---|---|---|
| Message draft | Send tap by worker | Auto-send, scheduled send |
| Next-action suggestion | Accept/Change tap | Auto-created tasks |
| Summary | Confirm before save | Silent history writes |
| Connection ranking | Human picks | Auto-introductions |
| Anything | — | Spiritual judgments, absence-reason inference, care-data access |

## 5. Data & privacy (the part that decides providers)

- **Same-permissions rule:** AI receives only what the viewing worker is already permitted to see — enforced in the Controller before the adapter, identical authz call as UI reads. Care/restricted content is stripped, not merely hidden.
- **Audit:** every AI call logs model alias + serving decision + prompt-hash + reviewer + accept/edit/dismiss. "Which helper wrote this message?" answerable in seconds.
- **Provider data policy (binding):** member PII goes ONLY to providers with no-training-on-inputs terms, self-hosted models, or zero-retention endpoints (Neon AI Gateway qualifies — verify in writing). **Free-tier routes must be vetted per provider before carrying real member data** — free does not mean private. Default: Qwen self-hosted or zero-retention hosted; everything else allowlisted explicitly.
- **Consent posture:** org-level AI enablement (admin toggle, default OFF at pilot) + plain-language member notice where AI assists ("drafts may be suggested by our assistant, always sent by a person"). No per-message consent theater.
- **Cost guards:** per-org monthly cap + free-first routing (OmniRoute `auto`), cap-hit = graceful disable + admin notice (never a surprise bill to a church).

## 6. Microcopy additions

- Prefer: "AI suggestion", "Suggested next action", "Draft for you to review", "Assistant offline — showing standard list", "Reviewed by you".
- Never: "AI decision", "AI says she is disengaged", "AI diagnosis", provider names, confidence percentages (false precision).

## 7. Figma delta (for the designer)

- New: AI/SuggestionCard (all states), draft composer state, ranked-suggestion variant, offline-note, reviewed-provenance line.
- Updated: P07, P10, P13, P18, P02 (one explanation line). Untouched: everything else.
- Prototype additions: one alternate path per AI surface (accept / edit / dismiss / offline).

## 8. Rollout (staged switch-on, post pilot gate)

- **Stage 0 (now):** slots designed + built dark; adapter tested; no user-facing AI.
- **Stage 1:** drafts + next-action suggestions, workers only, approval mandatory, caps on.
- **Stage 2:** summaries + ranked connections, same gates.
- **Never:** auto-send, judgments, care access, unsupervised anything. Each stage needs its own 2-week pilot read before the next opens.
