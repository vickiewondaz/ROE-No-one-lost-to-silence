// Action DTO + scope + due buckets (server only).
import { eq } from "drizzle-orm";
import { actions, people } from "./db/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbTx = any;

export type ActionTab = "today" | "overdue" | "upcoming" | "completed" | "all";

export function startOfToday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function toBucket(dueAt: Date, status: string): Exclude<ActionTab, "all"> {
  if (status === "Completed") return "completed";
  const day = new Date(dueAt);
  day.setUTCHours(0, 0, 0, 0);
  const t = startOfToday().getTime();
  if (day.getTime() < t) return "overdue";
  if (day.getTime() === t) return "today";
  return "upcoming";
}

export function dueLabel(dueAt: Date): string {
  const day = new Date(dueAt);
  day.setUTCHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - startOfToday().getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return day.toLocaleDateString();
}

export async function actionDTO(
  tx: DbTx,
  a: {
    id: string;
    personId: string;
    type: string;
    status: string;
    dueAt: Date;
    outcome: string | null;
  }
) {
  const p = await tx
    .select()
    .from(people)
    .where(eq(people.id, a.personId))
    .limit(1);
  const person = p[0];
  return {
    id: a.id,
    personId: a.personId,
    personName: person ? `${person.firstName} ${person.lastName ?? ""}`.trim() : "Someone",
    personPhone: person?.phone ?? "",
    title: a.type,
    status: a.status,
    due: a.dueAt,
    dueLabel: dueLabel(new Date(a.dueAt)),
    overdue: toBucket(new Date(a.dueAt), a.status) === "overdue",
    bucket: toBucket(new Date(a.dueAt), a.status),
    outcome: a.outcome ?? undefined,
  };
}
