// POST /api/platform/orgs/[id]/suspend — {suspended: bool}.
// Suspend blocks all org logins/API (requireSession gate); data preserved.
// No delete: deletion is a legal question, not a button.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { auditLogs, organisations } from "@/lib/db/schema";
import { requirePlatform } from "@/lib/session";

const bodySchema = z.object({ suspended: z.boolean() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const { id } = await params;
  const s = await requirePlatform();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const db = getDb();
  const [updated] = await db
    .update(organisations)
    .set({ status: parsed.data.suspended ? "suspended" : "active" })
    .where(eq(organisations.id, id))
    .returning();
  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await db.insert(auditLogs).values({
    orgId: id,
    actor: s.ctx.userId,
    op: parsed.data.suspended ? "platform:org-suspend" : "platform:org-reactivate",
    ref: id,
    allowed: true,
  });
  return NextResponse.json({ data: { id: updated.id, status: updated.status } });
}
