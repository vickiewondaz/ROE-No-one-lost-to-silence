// GET /api/users — org member directory for assignment (names only, no emails).
// Allowed: admin, worker, group_leader. Others 403 + audit.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { auditLogs, memberships, users } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  if (!["admin", "worker", "group_leader"].includes(ctx.role)) {
    await getDb().insert(auditLogs).values({
      orgId: ctx.orgId,
      actor: ctx.userId,
      op: "users:list",
      allowed: false,
    });
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }
  const db = getDb();
  const rows = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    const ms = await tx
      .select()
      .from(memberships)
      .where(and(eq(memberships.orgId, ctx.orgId), eq(memberships.status, "active")));
    const out = [];
    for (const m of ms) {
      const u = await tx.select().from(users).where(eq(users.id, m.userId)).limit(1);
      if (u[0]) out.push({ id: u[0].id, name: u[0].name ?? "Team member", role: m.role });
    }
    return out;
  });
  return NextResponse.json({ data: rows });
}
