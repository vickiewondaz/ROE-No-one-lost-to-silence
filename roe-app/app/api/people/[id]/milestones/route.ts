// /api/people/[id]/milestones — GET list, POST add. Same gate as the person.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { auditLogs, milestones } from "@/lib/db/schema";
import { personInScope } from "@/lib/connections";
import { milestoneSchema } from "@/lib/milestones";
import { requireSession } from "@/lib/session";

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
  const rows = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    const scope = await personInScope(tx, ctx, id);
    if (scope === "missing") return null;
    if (scope !== "ok") return "denied" as const;
    return tx.select().from(milestones).where(eq(milestones.personId, id)).limit(20);
  });
  if (rows === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (rows === "denied") return NextResponse.json({ error: "Restricted." }, { status: 403 });
  return NextResponse.json({
    data: rows.map((m) => ({ id: m.id, type: m.type, month: m.month, day: m.day, notes: m.notes ?? "" })),
  });
}

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
  if (ctx.role === "member")
    return NextResponse.json({ error: "Ask your coordinator to record it." }, { status: 403 });
  const parsed = milestoneSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 422 });
  const db = getDb();
  const row = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    const scope = await personInScope(tx, ctx, id);
    if (scope === "missing") return null;
    if (scope !== "ok") {
      await tx.insert(auditLogs).values({
        orgId: ctx.orgId, actor: ctx.userId, op: "milestones:create", ref: id, allowed: false,
      });
      return "denied" as const;
    }
    const [created] = await tx
      .insert(milestones)
      .values({
        orgId: ctx.orgId,
        personId: id,
        type: parsed.data.type,
        month: String(parsed.data.month).padStart(2, "0"),
        day: String(parsed.data.day).padStart(2, "0"),
        notes: parsed.data.notes || null,
      })
      .returning();
    await tx.insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "milestones:create", ref: created.id, allowed: true,
    });
    return created;
  });
  if (row === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (row === "denied") return NextResponse.json({ error: "Restricted." }, { status: 403 });
  return NextResponse.json(
    { data: { id: row.id, type: row.type, month: row.month, day: row.day } },
    { status: 201 }
  );
}
