// Connection permission helper: assigned worker/group-leader, admin/senior.
import { and, eq } from "drizzle-orm";
import { actions, people } from "@/lib/db/schema";
import type { AuthCtx } from "@/lib/authz";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbTx = any;

export async function personInScope(
  tx: DbTx,
  ctx: AuthCtx,
  personId: string
): Promise<"ok" | "missing" | "denied"> {
  const rows = await tx
    .select()
    .from(people)
    .where(and(eq(people.id, personId), eq(people.orgId, ctx.orgId)))
    .limit(1);
  const row = rows[0];
  if (!row) return "missing";
  if (["admin", "senior"].includes(ctx.role)) return "ok";
  if (ctx.role === "member") return row.userId === ctx.userId ? "ok" : "denied";
  const mine = await tx
    .select({ a: actions.id })
    .from(actions)
    .where(and(eq(actions.personId, personId), eq(actions.assignee, ctx.userId)))
    .limit(1);
  return mine.length > 0 ? "ok" : "denied";
}
