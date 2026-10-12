// Person-level helpers: first-week checklist + one-line worker summary.
// Pure functions — safe to unit-test. Beginner-proof by design.
import type { ContactDates } from "./silence";

export interface FirstWeekStep {
  key: "welcomed" | "contacted" | "group";
  label: string;
  done: boolean;
}

export interface FirstWeekInput extends ContactDates {
  interactionCount: number;
  hasGroup: boolean;
}

/** Show the newcomer's 3-step checklist while they are in their first 7 days. */
export function firstWeekChecklist(
  p: FirstWeekInput,
  now: Date = new Date()
): { show: boolean; steps: FirstWeekStep[] } {
  const created = p.createdAt ? new Date(p.createdAt) : null;
  const ageDays =
    created && !Number.isNaN(created.getTime())
      ? Math.floor((now.getTime() - created.getTime()) / 86_400_000)
      : null;
  const steps: FirstWeekStep[] = [
    { key: "welcomed", label: "Welcomed — first hello logged", done: p.interactionCount >= 1 },
    { key: "contacted", label: "Contacted again — follow-up call or visit", done: p.interactionCount >= 2 },
    { key: "group", label: "Invited to a group", done: p.hasGroup },
  ];
  return { show: ageDays !== null && ageDays <= 7, steps };
}

/** One auto-written paragraph so any worker picks up a relationship in seconds. */
export function summarizePerson(
  p: { firstName: string; lastContact?: string | null; interests?: string | null },
  interactionCount: number,
  group?: string | null
): string {
  const parts = [
    interactionCount === 0
      ? "no check-ins yet"
      : `${interactionCount} check-in${interactionCount === 1 ? "" : "s"}`,
  ];
  if (p.lastContact) parts.push(`last contact ${p.lastContact}`);
  if (p.interests) parts.push(`likes ${p.interests}`);
  if (group) parts.push(`in ${group}`);
  return `${p.firstName} — ${parts.join(", ")}.`;
}
