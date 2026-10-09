// GET /api/audit — admin reads recent security/permission events (own org).
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { auditLogs, users } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  if (ctx.role !== "admin")
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  const db = getDb();
  const rows = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    return tx
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.orgId, ctx.orgId))
      .orderBy(desc(auditLogs.at))
      .limit(100);
  });
  const actors = new Map<string, string>();
  for (const r of rows) {
    if (r.actor && !actors.has(r.actor)) {
      const u = await db.select().from(users).where(eq(users.id, r.actor)).limit(1);
      actors.set(r.actor, u[0]?.email ?? "unknown");
    }
  }
  return NextResponse.json({
    data: rows.map((r) => ({
      op: r.op,
      actor: r.actor ? actors.get(r.actor) : "system",
      ref: r.ref,
      allowed: r.allowed,
      at: r.at,
    })),
  });
}
