// /api/services — GET own community's service days (any signed-in member),
// POST add one (admin only). The community calendar: weekly services + specials.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { auditLogs, services } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

export const serviceSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    kind: z.enum(["weekly", "special"]).default("weekly"),
    weekday: z.number().int().min(0).max(6).optional(),
    date: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
      .optional(),
    time: z.string().trim().max(20).optional().default(""),
  })
  .refine((v) => (v.kind === "weekly" ? v.weekday !== undefined : !!v.date), {
    message: "Weekly needs a day; special needs a date.",
  });

export function shape(r: typeof services.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind,
    weekday: r.weekday,
    date: r.date,
    time: r.time ?? "",
  };
}

export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const rows = await getDb()
    .select()
    .from(services)
    .where(eq(services.orgId, s.ctx.orgId))
    .orderBy(asc(services.name))
    .limit(200);
  return NextResponse.json({ data: rows.map(shape) });
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  if (!["admin", "senior"].includes(ctx.role)) {
    await getDb().insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "services:create", allowed: false,
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
  const [row] = await getDb()
    .insert(services)
    .values({
      orgId: ctx.orgId,
      name: v.name,
      kind: v.kind,
      weekday: v.kind === "weekly" ? v.weekday ?? null : null,
      date: v.kind === "special" ? v.date ?? null : null,
      time: v.time || null,
    })
    .returning();
  await getDb().insert(auditLogs).values({
    orgId: ctx.orgId, actor: ctx.userId, op: "services:create", ref: row.id, allowed: true,
  });
  return NextResponse.json({ data: shape(row) }, { status: 201 });
}
