// POST /api/milestones/[id]/acknowledge — worker records a personal greeting.
// {channel: Call|WhatsApp|Visit|In person, notes?} → interaction (outcome
// "Celebration acknowledged") + audit. Sending itself stays human, always.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { auditLogs, interactions, milestones } from "@/lib/db/schema";
import { personInScope } from "@/lib/connections";
import { requireSession } from "@/lib/session";

const bodySchema = z.object({
  channel: z.enum(["Call", "WhatsApp", "Visit", "In person"]),
  notes: z.string().trim().max(500).optional().default(""),
});

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
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const db = getDb();
  const row = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    const found = await tx
      .select()
      .from(milestones)
      .where(and(eq(milestones.id, id), eq(milestones.orgId, ctx.orgId)))
      .limit(1);
    const m = found[0];
    if (!m) return null;
    const scope = await personInScope(tx, ctx, m.personId);
    if (scope !== "ok") {
      await tx.insert(auditLogs).values({
        orgId: ctx.orgId, actor: ctx.userId, op: "milestones:acknowledge", ref: id, allowed: false,
      });
      return scope === "missing" ? null : ("denied" as const);
    }
    const [inter] = await tx
      .insert(interactions)
      .values({
        orgId: ctx.orgId,
        personId: m.personId,
        channel: parsed.data.channel === "In person" ? "Visit" : parsed.data.channel,
        outcome: "Celebration acknowledged",
        notes: parsed.data.notes || `${m.type} greeted personally.`,
      })
      .returning();
    await tx.insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "milestones:acknowledge", ref: id, allowed: true,
    });
    return inter;
  });
  if (row === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (row === "denied") return NextResponse.json({ error: "Restricted." }, { status: 403 });
  return NextResponse.json({ data: { id: row.id } }, { status: 201 });
}
