// Connection permission helper: assigned worker/group-leader, admin/senior.
import { and, eq, inArray } from "drizzle-orm";
import { actions, groupMemberships, people } from "@/lib/db/schema";
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
  if (mine.length > 0) return "ok";
  // Group leaders see members of groups they lead.
  if (ctx.role === "group_leader" && (ctx.ledGroupIds ?? []).length > 0) {
    const mem = await tx
      .select({ g: groupMemberships.groupId })
      .from(groupMemberships)
      .where(
        and(
          eq(groupMemberships.personId, personId),
          inArray(groupMemberships.groupId, ctx.ledGroupIds as string[])
        )
      )
      .limit(1);
    if (mem.length > 0) return "ok";
  }
  // Staff see truly-new people (no actions yet) so someone can take ownership.
  // Members never see these (own-row only, above).
  if (["worker", "group_leader", "care"].includes(ctx.role)) {
    const any = await tx
      .select({ a: actions.id })
      .from(actions)
      .where(eq(actions.personId, personId))
      .limit(1);
    if (any.length === 0) return "ok";
  }
  return "denied";
}
