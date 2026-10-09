// Group leads: POST assign (admin), DELETE remove (admin).
// Who leads what is admin-managed; enforcement lives in person/action scopes.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { auditLogs, groupLeads, groups, memberships } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

const bodySchema = z.object({ userId: z.string().min(1) });

async function adminOnly(): Promise<
  | { route: "nodb" }
  | { route: number; message: string }
  | { ctx: { orgId: string; userId: string } }
> {
  if (!process.env.DATABASE_URL) return { route: "nodb" as const };
  const s = await requireSession();
  if ("error" in s) return { route: s.error, message: s.message };
  if (s.ctx.role !== "admin") {
    await getDb().insert(auditLogs).values({
      orgId: s.ctx.orgId, actor: s.ctx.userId, op: "groups:leads", allowed: false,
    });
    return { route: 403, message: "Not permitted." } as const;
  }
  return { ctx: s.ctx };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const a = await adminOnly();
  if ("route" in a)
    return NextResponse.json(
      { error: a.route === "nodb" ? "db_not_configured" : a.message },
      { status: a.route === "nodb" ? 501 : (a.route as number) }
    );
  const { id } = await params;
  const db = getDb();
  const rows = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${a.ctx.orgId}, true)`);
    return tx.select().from(groupLeads).where(eq(groupLeads.groupId, id)).limit(50);
  });
  return NextResponse.json({ data: rows.map((r) => ({ userId: r.userId, groupId: r.groupId })) });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const a = await adminOnly();
  if ("route" in a)
    return NextResponse.json(
      { error: a.route === "nodb" ? "db_not_configured" : a.message },
      { status: a.route === "nodb" ? 501 : (a.route as number) }
    );
  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const db = getDb();
  const out = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${a.ctx.orgId}, true)`);
    const g = await tx
      .select()
      .from(groups)
      .where(and(eq(groups.id, id), eq(groups.orgId, a.ctx.orgId)))
      .limit(1);
    if (!g[0]) return null;
    const m = await tx
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, parsed.data.userId),
          eq(memberships.orgId, a.ctx.orgId),
          eq(memberships.status, "active")
        )
      )
      .limit(1);
    if (!m[0]) return "bad-user" as const;
    const dup = await tx
      .select()
      .from(groupLeads)
      .where(and(eq(groupLeads.userId, parsed.data.userId), eq(groupLeads.groupId, id)))
      .limit(1);
    if (dup[0]) return "dup" as const;
    await tx.insert(groupLeads).values({ orgId: a.ctx.orgId, userId: parsed.data.userId, groupId: id });
    await tx.insert(auditLogs).values({
      orgId: a.ctx.orgId, actor: a.ctx.userId, op: "groups:lead-assign", ref: id, allowed: true,
    });
    return "ok" as const;
  });
  if (out === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (out === "bad-user")
    return NextResponse.json({ error: "Must be an active member." }, { status: 422 });
  if (out === "dup") return NextResponse.json({ error: "Already a leader here." }, { status: 422 });
  return NextResponse.json({ data: { assigned: true } }, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const a = await adminOnly();
  if ("route" in a)
    return NextResponse.json(
      { error: a.route === "nodb" ? "db_not_configured" : a.message },
      { status: a.route === "nodb" ? 501 : (a.route as number) }
    );
  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${a.ctx.orgId}, true)`);
    const rows = await tx
      .select()
      .from(groupLeads)
      .where(and(eq(groupLeads.userId, parsed.data.userId), eq(groupLeads.groupId, id)));
    for (const r of rows) await tx.delete(groupLeads).where(eq(groupLeads.id, r.id));
    await tx.insert(auditLogs).values({
      orgId: a.ctx.orgId, actor: a.ctx.userId, op: "groups:lead-remove", ref: id, allowed: true,
    });
  });
  return NextResponse.json({ data: { removed: true } });
}
