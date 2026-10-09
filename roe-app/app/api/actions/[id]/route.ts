// /api/actions/[id] — GET single, PATCH reschedule/reassign (assignee|admin).
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { actions, assignmentHistory, auditLogs, memberships, notifications } from "@/lib/db/schema";
import { actionDTO } from "@/lib/actions";
import { requireSession } from "@/lib/session";

const patchSchema = z
  .object({
    dueAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    assigneeUserId: z.string().uuid().optional(),
  })
  .refine((v) => v.dueAt !== undefined || v.assigneeUserId !== undefined, {
    message: "Nothing to update.",
  });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const { id } = await params;
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  const db = getDb();
  const dto = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    const rows = await tx
      .select()
      .from(actions)
      .where(and(eq(actions.id, id), eq(actions.orgId, ctx.orgId)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    if (!["admin", "senior"].includes(ctx.role) && row.assignee !== ctx.userId) {
      await tx.insert(auditLogs).values({
        orgId: ctx.orgId, actor: ctx.userId, op: "actions:read", ref: id, allowed: false,
      });
      return "denied" as const;
    }
    return actionDTO(tx, row);
  });
  if (dto === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (dto === "denied") return NextResponse.json({ error: "Restricted." }, { status: 403 });
  return NextResponse.json({ data: dto });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const { id } = await params;
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 422 });
  const v = parsed.data;
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
        orgId: ctx.orgId, actor: ctx.userId, op: "actions:update", ref: id, allowed: false,
      });
      return "denied" as const;
    }
    const patch: Partial<{ dueAt: Date; assignee: string }> = {};
    if (v.dueAt !== undefined) {
      const due = /^\d{4}-\d{2}-\d{2}$/.test(v.dueAt) ? new Date(v.dueAt + "T00:00:00Z") : new Date(v.dueAt);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      if (isNaN(due.getTime()) || due < today) return "bad-due" as const;
      patch.dueAt = due;
    }
    if (v.assigneeUserId !== undefined) {
      const target = await tx
        .select()
        .from(memberships)
        .where(and(eq(memberships.userId, v.assigneeUserId), eq(memberships.orgId, ctx.orgId), eq(memberships.status, "active")))
        .limit(1);
      if (!target[0]) return "bad-assignee" as const;
      patch.assignee = v.assigneeUserId;
    }
    const [updated] = await tx
      .update(actions)
      .set(patch)
      .where(eq(actions.id, id))
      .returning();
    if (v.assigneeUserId !== undefined && v.assigneeUserId !== row.assignee) {
      await tx.insert(assignmentHistory).values({
        actionId: id, fromUser: row.assignee, toUser: v.assigneeUserId, reason: "reassigned",
      });
      await tx.insert(notifications).values({
        orgId: ctx.orgId, userId: v.assigneeUserId, type: "assignment", refId: id,
      });
    }
    await tx.insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "actions:update", ref: id, allowed: true,
    });
    return actionDTO(tx, updated);
  });
  if (dto === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (dto === "denied") return NextResponse.json({ error: "Restricted." }, { status: 403 });
  if (dto === "bad-due")
    return NextResponse.json({ error: "Due date cannot be in the past." }, { status: 422 });
  if (dto === "bad-assignee")
    return NextResponse.json({ error: "Assignee must be an active member of your organisation." }, { status: 422 });
  return NextResponse.json({ data: dto });
}
