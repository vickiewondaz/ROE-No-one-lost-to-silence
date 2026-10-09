// /api/people/[id] — single profile read (P07/P12/P19).
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { actions, auditLogs, people } from "@/lib/db/schema";
import { personDTO } from "@/lib/people";
import { personInScope } from "@/lib/connections";
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
  const dto = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    await tx.execute(sql`SELECT set_config('app.role', ${ctx.role}, true)`);
    await tx.execute(sql`SELECT set_config('app.user_id', ${ctx.userId}, true)`);
    const rows = await tx
      .select()
      .from(people)
      .where(and(eq(people.id, id), eq(people.orgId, ctx.orgId)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const scope = await personInScope(tx, ctx, id);
    if (scope !== "ok") {
      await tx.insert(auditLogs).values({
        orgId: ctx.orgId, actor: ctx.userId, op: "people:read", ref: id, allowed: false,
      });
      return "denied" as const;
    }
    return personDTO(tx, row);
  });
  if (dto === null)
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (dto === "denied")
    return NextResponse.json({ error: "Restricted." }, { status: 403 });
  return NextResponse.json({ data: dto });
}
