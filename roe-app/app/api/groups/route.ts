// /api/groups — GET list (any authed member), POST create (admin: config only).
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { auditLogs, groups } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().default(""),
});

export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  const db = getDb();
  const rows = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    return tx.select().from(groups).where(eq(groups.orgId, ctx.orgId)).limit(200);
  });
  return NextResponse.json({
    data: rows.map((g) => ({ id: g.id, name: g.name, description: g.description ?? "" })),
  });
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  if (ctx.role !== "admin") {
    await getDb().insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "groups:create", allowed: false,
    });
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const [row] = await getDb()
    .insert(groups)
    .values({ orgId: ctx.orgId, name: parsed.data.name, description: parsed.data.description || null })
    .returning();
  return NextResponse.json(
    { data: { id: row.id, name: row.name, description: row.description ?? "" } },
    { status: 201 }
  );
}
