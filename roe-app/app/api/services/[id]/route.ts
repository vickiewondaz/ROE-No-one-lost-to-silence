// /api/services/[id] — PATCH edit / DELETE remove (admin only).
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { auditLogs, services } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { serviceSchema, shape } from "../route";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const { id } = await params;
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  if (!["admin", "senior"].includes(ctx.role)) {
    await getDb().insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "services:update", allowed: false,
    });
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }
  const parsed = serviceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form." },
      { status: 422 }
    );
  const v = parsed.data;
  const rows = await getDb()
    .update(services)
    .set({
      name: v.name,
      kind: v.kind,
      weekday: v.kind === "weekly" ? v.weekday ?? null : null,
      date: v.kind === "special" ? v.date ?? null : null,
      time: v.time || null,
    })
    .where(and(eq(services.id, id), eq(services.orgId, ctx.orgId)))
    .returning();
  if (!rows[0]) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await getDb().insert(auditLogs).values({
    orgId: ctx.orgId, actor: ctx.userId, op: "services:update", ref: id, allowed: true,
  });
  return NextResponse.json({ data: shape(rows[0]) });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const { id } = await params;
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  if (!["admin", "senior"].includes(ctx.role)) {
    await getDb().insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "services:delete", allowed: false,
    });
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }
  const rows = await getDb()
    .delete(services)
    .where(and(eq(services.id, id), eq(services.orgId, ctx.orgId)))
    .returning({ id: services.id });
  if (!rows[0]) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await getDb().insert(auditLogs).values({
    orgId: ctx.orgId, actor: ctx.userId, op: "services:delete", ref: id, allowed: true,
  });
  return NextResponse.json({ data: { deleted: true } });
}
