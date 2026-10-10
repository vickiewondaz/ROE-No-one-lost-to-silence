// POST /api/join/[id]/decline — admin declines. Requester gets no detail
// beyond "the team will be in touch" (kind by default, no public reason).
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { auditLogs, joinRequests } from "@/lib/db/schema";
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
  if (ctx.role !== "admin") {
    await getDb().insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "join:decline", allowed: false,
    });
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }
  const db = getDb();
  const out = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    const found = await tx
      .select()
      .from(joinRequests)
      .where(and(eq(joinRequests.id, id), eq(joinRequests.orgId, ctx.orgId)))
      .limit(1);
    const jr = found[0];
    if (!jr) return null;
    if (jr.status !== "pending") return "settled" as const;
    await tx
      .update(joinRequests)
      .set({ status: "declined", decidedBy: ctx.userId, decidedAt: new Date() })
      .where(eq(joinRequests.id, id));
    await tx.insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "join:decline", ref: id, allowed: true,
    });
    return "ok" as const;
  });
  if (out === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (out === "settled") return NextResponse.json({ error: "Already decided." }, { status: 422 });
  return NextResponse.json({ data: { declined: true } });
}
