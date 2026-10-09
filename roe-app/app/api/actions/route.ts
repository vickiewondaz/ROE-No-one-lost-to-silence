// /api/actions — GET scoped list (?tab=today|overdue|upcoming|completed|all),
// POST create+assign (person, type, assignee, due, notes).
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { actions, assignmentHistory, auditLogs, memberships, notifications, people } from "@/lib/db/schema";
import { actionDTO, toBucket, type ActionTab } from "@/lib/actions";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/authz";

const createSchema = z.object({
  personId: z.string().uuid(),
  type: z.string().trim().min(2).max(80),
  assigneeUserId: z.string().uuid(),
  dueAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  notes: z.string().trim().max(1000).optional().default(""),
});

function parseDue(raw: string): Date | null {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(raw + "T00:00:00Z") : new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  const tab = (new URL(req.url).searchParams.get("tab") ?? "today") as ActionTab;
  const db = getDb();
  const rows = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    await tx.execute(sql`SELECT set_config('app.role', ${ctx.role}, true)`);
    let list = await tx
      .select()
      .from(actions)
      .where(eq(actions.orgId, ctx.orgId))
      .orderBy(asc(actions.dueAt))
      .limit(500);
    if (!["admin", "senior"].includes(ctx.role))
      list = list.filter((a) => a.assignee === ctx.userId);
    if (tab !== "all") list = list.filter((a) => toBucket(new Date(a.dueAt), a.status) === tab);
    return Promise.all(list.map((a) => actionDTO(tx, a)));
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  if (!can(ctx, "actions:create", { orgId: ctx.orgId })) {
    await getDb().insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "actions:create", allowed: false,
    });
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 422 });
  const v = parsed.data;
  const due = parseDue(v.dueAt);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (!due || due < today)
    return NextResponse.json({ error: "Due date cannot be in the past." }, { status: 422 });
  const db = getDb();
  const dto = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    await tx.execute(sql`SELECT set_config('app.role', ${ctx.role}, true)`);
    const person = await tx
      .select()
      .from(people)
      .where(and(eq(people.id, v.personId), eq(people.orgId, ctx.orgId)))
      .limit(1);
    if (!person[0]) return null;
    const target = await tx
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, v.assigneeUserId), eq(memberships.orgId, ctx.orgId), eq(memberships.status, "active")))
      .limit(1);
    if (!target[0]) return "bad-assignee" as const;
    const [row] = await tx
      .insert(actions)
      .values({
        orgId: ctx.orgId,
        personId: v.personId,
        type: v.type,
        assignee: v.assigneeUserId,
        creator: ctx.userId,
        dueAt: due,
        status: "Open",
        outcome: v.notes || null,
      })
      .returning();
    await tx.insert(assignmentHistory).values({
      actionId: row.id, fromUser: null, toUser: v.assigneeUserId, reason: "created",
    });
    await tx.insert(notifications).values({
      orgId: ctx.orgId, userId: v.assigneeUserId, type: "assignment", refId: row.id,
    });
    await tx.insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "actions:create", ref: row.id, allowed: true,
    });
    return actionDTO(tx, row);
  });
  if (dto === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (dto === "bad-assignee")
    return NextResponse.json({ error: "Assignee must be an active member of your organisation." }, { status: 422 });
  return NextResponse.json({ data: dto }, { status: 201 });
}
