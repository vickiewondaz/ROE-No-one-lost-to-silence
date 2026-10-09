// /api/notifications — GET own (unread first), PATCH mark all read.
// No sensitive bodies: type + reference only.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  const db = getDb();
  const rows = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    return tx
      .select()
      .from(notifications)
      .where(and(eq(notifications.orgId, ctx.orgId), eq(notifications.userId, ctx.userId)))
      .orderBy(desc(notifications.readAt))
      .limit(50);
  });
  return NextResponse.json({
    data: rows.map((n) => ({
      id: n.id,
      type: n.type,
      refId: n.refId,
      read: n.readAt !== null,
    })),
  });
}

const patchSchema = z.object({ readAll: z.literal(true) });

export async function PATCH(req: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    await tx
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.orgId, ctx.orgId),
          eq(notifications.userId, ctx.userId),
          isNull(notifications.readAt)
        )
      );
  });
  return NextResponse.json({ data: { read: true } });
}
