// POST /api/actions/[id]/transition — TRD §17 machine, persisted.
// Completed requires outcome. Paused requires reason (stored in outcome).
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { actions, auditLogs } from "@/lib/db/schema";
import { actionDTO } from "@/lib/actions";
import { requireSession } from "@/lib/session";
import { canTransition, type ActionStatus } from "@/lib/authz";

const bodySchema = z.object({
  to: z.enum(["Open", "In Progress", "Completed", "Paused"]),
  reason: z.string().trim().max(500).optional().default(""),
  outcome: z.string().trim().max(1000).optional().default(""),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const { id } = await params;
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const { to, reason, outcome } = parsed.data;
  if (to === "Paused" && !reason)
    return NextResponse.json({ error: "Pausing needs a reason." }, { status: 422 });
  if (to === "Completed" && !outcome)
    return NextResponse.json({ error: "Completing needs an outcome." }, { status: 422 });
  const db = getDb();
  const dto = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    await tx.execute(sql`SELECT set_config('app.role', ${ctx.role}, true)`);
    const rows = await tx
      .select()
      .from(actions)
      .where(and(eq(actions.id, id), eq(actions.orgId, ctx.orgId)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    if (!["admin", "senior"].includes(ctx.role) && row.assignee !== ctx.userId) {
      await tx.insert(auditLogs).values({
        orgId: ctx.orgId, actor: ctx.userId, op: "actions:transition", ref: id, allowed: false,
      });
      return "denied" as const;
    }
    if (!canTransition(row.status as ActionStatus, to, { hasOutcome: !!outcome })) {
      return "bad-transition" as const;
    }
    const [updated] = await tx
      .update(actions)
      .set({
        status: to,
        outcome: to === "Paused" ? `Paused: ${reason}` : outcome || row.outcome,
      })
      .where(eq(actions.id, id))
      .returning();
    await tx.insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: `actions:${row.status}->${to}`, ref: id, allowed: true,
    });
    return actionDTO(tx, updated);
  });
  if (dto === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (dto === "denied") return NextResponse.json({ error: "Restricted." }, { status: 403 });
  if (dto === "bad-transition")
    return NextResponse.json({ error: "That status change is not allowed." }, { status: 422 });
  return NextResponse.json({ data: dto });
}
