// POST /api/connections/[id]/confirm — ParticipationRecorded → Confirmed.
// Only when the recorded outcome was attendance. Joins the person to the group.
// Participation is recorded; belonging grows over time.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { auditLogs, connections, groupMemberships } from "@/lib/db/schema";
import { personInScope } from "@/lib/connections";
import { requireSession } from "@/lib/session";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const { id } = await params;
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  if (ctx.role === "member")
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  const db = getDb();
  const row = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    const found = await tx
      .select()
      .from(connections)
      .where(and(eq(connections.id, id), eq(connections.orgId, ctx.orgId)))
      .limit(1);
    const c = found[0];
    if (!c) return null;
    const scope = await personInScope(tx, ctx, c.personId);
    if (scope !== "ok") {
      await tx.insert(auditLogs).values({
        orgId: ctx.orgId, actor: ctx.userId, op: "connections:confirm", ref: id, allowed: false,
      });
      return scope === "missing" ? null : ("denied" as const);
    }
    if (c.status !== "ParticipationRecorded") return "bad-state" as const;
    if (!c.outcome?.startsWith("Attended")) return "not-attended" as const;
    const [updated] = await tx
      .update(connections)
      .set({ status: "Confirmed" })
      .where(eq(connections.id, id))
      .returning();
    const existing = await tx
      .select()
      .from(groupMemberships)
      .where(and(eq(groupMemberships.personId, c.personId), eq(groupMemberships.groupId, c.groupId)))
      .limit(1);
    if (!existing[0]) {
      await tx.insert(groupMemberships).values({
        orgId: ctx.orgId, personId: c.personId, groupId: c.groupId, role: "member", status: "active",
      });
    }
    await tx.insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "connections:confirm", ref: id, allowed: true,
    });
    return updated;
  });
  if (row === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (row === "denied") return NextResponse.json({ error: "Restricted." }, { status: 403 });
  if (row === "bad-state")
    return NextResponse.json({ error: "Record a participation outcome first." }, { status: 422 });
  if (row === "not-attended")
    return NextResponse.json(
      { error: "Only an attended outcome can be confirmed. The honest record stands." },
      { status: 422 }
    );
  return NextResponse.json({ data: { id: row.id, status: row.status } });
}
