// POST /api/connections/[id]/outcome — record honest participation outcome.
// Introduced → ParticipationRecorded. Negative allowed, never coerced.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { auditLogs, connections } from "@/lib/db/schema";
import { personInScope } from "@/lib/connections";
import { requireSession } from "@/lib/session";

const bodySchema = z.object({
  result: z.enum(["attended", "not-attended", "not-interested"]),
  notes: z.string().trim().max(1000).optional().default(""),
});

const LABEL: Record<string, string> = {
  attended: "Attended",
  "not-attended": "Did not attend",
  "not-interested": "Not interested in this group",
};

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
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
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
        orgId: ctx.orgId, actor: ctx.userId, op: "connections:outcome", ref: id, allowed: false,
      });
      return scope === "missing" ? null : ("denied" as const);
    }
    if (c.status !== "Introduced") return "bad-state" as const;
    const outcome = parsed.data.notes
      ? `${LABEL[parsed.data.result]} — ${parsed.data.notes}`
      : LABEL[parsed.data.result];
    const [updated] = await tx
      .update(connections)
      .set({ status: "ParticipationRecorded", outcome })
      .where(eq(connections.id, id))
      .returning();
    await tx.insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "connections:outcome", ref: id, allowed: true,
    });
    return updated;
  });
  if (row === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (row === "denied") return NextResponse.json({ error: "Restricted." }, { status: 403 });
  if (row === "bad-state")
    return NextResponse.json({ error: "Record the introduction first." }, { status: 422 });
  return NextResponse.json({
    data: { id: row.id, status: row.status, outcome: row.outcome },
  });
}
