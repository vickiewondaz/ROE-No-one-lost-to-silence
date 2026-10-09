// POST /api/interactions — record call/WhatsApp/visit (P10).
// With actionId: completes the linked action (outcome provided = machine satisfied).
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { dbUuid } from "@/lib/validate";
import { getDb } from "@/lib/db/client";
import { actions, auditLogs, interactions, people } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

const bodySchema = z.object({
  personId: dbUuid,
  actionId: dbUuid.optional(),
  channel: z.enum(["Call", "WhatsApp", "Visit", "Other"]),
  outcome: z.enum([
    "Reached — warm conversation",
    "Reached — asked to call back",
    "No answer",
    "Declined further contact",
    "Wrong number",
  ]),
  notes: z.string().trim().max(1000).optional().default(""),
});

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const v = parsed.data;
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    await tx.execute(sql`SELECT set_config('app.role', ${ctx.role}, true)`);
    const person = await tx
      .select()
      .from(people)
      .where(and(eq(people.id, v.personId), eq(people.orgId, ctx.orgId)))
      .limit(1);
    if (!person[0]) return null;
    // Person authorisation: assigned via any action, admin/senior, or own row.
    const mine = await tx
      .select({ a: actions.id })
      .from(actions)
      .where(and(eq(actions.personId, v.personId), eq(actions.assignee, ctx.userId)))
      .limit(1);
    const own = ctx.role === "member" && person[0].userId === ctx.userId;
    if (!["admin", "senior"].includes(ctx.role) && mine.length === 0 && !own) {
      await tx.insert(auditLogs).values({
        orgId: ctx.orgId, actor: ctx.userId, op: "interactions:create", ref: v.personId, allowed: false,
      });
      return "denied" as const;
    }
    let action = null;
    if (v.actionId) {
      const found = await tx
        .select()
        .from(actions)
        .where(and(eq(actions.id, v.actionId), eq(actions.personId, v.personId), eq(actions.orgId, ctx.orgId)))
        .limit(1);
      if (!found[0]) return "bad-action" as const;
      action = found[0];
    }
    const [row] = await tx
      .insert(interactions)
      .values({
        orgId: ctx.orgId,
        personId: v.personId,
        actionId: v.actionId ?? null,
        channel: v.channel,
        outcome: v.outcome,
        notes: v.notes || null,
      })
      .returning();
    if (action && action.status !== "Completed") {
      await tx
        .update(actions)
        .set({ status: "Completed", outcome: `${v.channel} · ${v.outcome}${v.notes ? ` · ${v.notes}` : ""}` })
        .where(eq(actions.id, action.id));
    }
    await tx.insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "interactions:create", ref: row.id, allowed: true,
    });
    return { interaction: row };
  });
  if (result === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (result === "denied") return NextResponse.json({ error: "Restricted." }, { status: 403 });
  if (result === "bad-action")
    return NextResponse.json({ error: "That action doesn't belong to this person." }, { status: 422 });
  return NextResponse.json({ data: result }, { status: 201 });
}
