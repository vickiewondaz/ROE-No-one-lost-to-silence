// /api/connections — GET ?personId= (scoped), POST suggest {personId, groupId}.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { dbUuid } from "@/lib/validate";
import { getDb } from "@/lib/db/client";
import { auditLogs, connections, groups, people } from "@/lib/db/schema";
import { personInScope } from "@/lib/connections";
import { requireSession } from "@/lib/session";

const suggestSchema = z.object({
  personId: dbUuid,
  groupId: dbUuid,
});

export async function GET(req: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  const q = new URL(req.url).searchParams;
  const personId = q.get("personId") ?? "";
  const groupId = q.get("groupId") ?? "";
  const db = getDb();
  // Group-scoped pending intros (Group Leader home). Leaders see only groups
  // they lead; admin/senior see all. People data itself stays scoped per row.
  if (groupId) {
    if (!["admin", "senior"].includes(ctx.role) && !(ctx.ledGroupIds ?? []).includes(groupId))
      return NextResponse.json({ error: "Restricted." }, { status: 403 });
    const rows = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
      return tx
        .select({ conn: connections, personName: people.firstName, personPhone: people.phone })
        .from(connections)
        .innerJoin(people, eq(people.id, connections.personId))
        .where(and(eq(connections.groupId, groupId), eq(connections.orgId, ctx.orgId)))
        .orderBy(desc(connections.at))
        .limit(50);
    });
    return NextResponse.json({
      data: rows.map((r) => ({
        id: r.conn.id,
        personId: r.conn.personId,
        personName: r.personName,
        status: r.conn.status,
        outcome: r.conn.outcome ?? undefined,
      })),
    });
  }
  const rows = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    const scope = await personInScope(tx, ctx, personId);
    if (scope === "missing") return null;
    if (scope === "denied") return "denied" as const;
    return tx.select().from(connections).where(eq(connections.personId, personId)).limit(50);
  });
  if (rows === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (rows === "denied") return NextResponse.json({ error: "Restricted." }, { status: 403 });
  return NextResponse.json({
    data: rows.map((c) => ({
      id: c.id, personId: c.personId, groupId: c.groupId,
      status: c.status, outcome: c.outcome ?? undefined,
    })),
  });
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  if (ctx.role === "member")
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  const parsed = suggestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const { personId, groupId } = parsed.data;
  const db = getDb();
  const row = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    await tx.execute(sql`SELECT set_config('app.role', ${ctx.role}, true)`);
    const scope = await personInScope(tx, ctx, personId);
    if (scope === "missing") return null;
    if (scope === "denied") {
      await tx.insert(auditLogs).values({
        orgId: ctx.orgId, actor: ctx.userId, op: "connections:suggest", ref: personId, allowed: false,
      });
      return "denied" as const;
    }
    const g = await tx
      .select()
      .from(groups)
      .where(and(eq(groups.id, groupId), eq(groups.orgId, ctx.orgId)))
      .limit(1);
    if (!g[0]) return null;
    const [created] = await tx
      .insert(connections)
      .values({ orgId: ctx.orgId, personId, groupId, status: "Suggested" })
      .returning();
    await tx.insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "connections:suggest", ref: created.id, allowed: true,
    });
    return created;
  });
  if (row === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (row === "denied") return NextResponse.json({ error: "Restricted." }, { status: 403 });
  return NextResponse.json(
    { data: { id: row.id, personId, groupId, status: row.status } },
    { status: 201 }
  );
}
