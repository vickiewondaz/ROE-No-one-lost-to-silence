// /api/join — POST public request (throttled), GET admin pending list.
// Open but guided: anyone may ask; admins decide; abuse is capped.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { auditLogs, joinRequests, organisations } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

// Phone-first: phone required (7–15 digits), email optional.
// At least one contact channel must be present (phone always, email if given).
const requestSchema = z
  .object({
    orgSlug: z.string().trim().toLowerCase().min(2).max(40),
    name: z.string().trim().min(2).max(60),
    email: z
      .string()
      .trim()
      .max(120)
      .optional()
      .default("")
      .refine((v) => v === "" || /.+@.+\..+/.test(v), "Enter a valid email."),
    phone: z.string().trim().max(20).default(""),
    message: z.string().trim().max(500).optional().default(""),
  })
  .refine(
    (v) => v.phone.replace(/\D/g, "").length >= 7 && v.phone.replace(/\D/g, "").length <= 15,
    { message: "Enter a valid phone number.", path: ["phone"] }
  );

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the form." }, { status: 422 });
  const v = parsed.data;
  const db = getDb();
  const org = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, v.orgSlug))
    .limit(1);
  if (!org[0] || org[0].status !== "active")
    return NextResponse.json({ error: "Community not found." }, { status: 404 });
  const dayAgo = new Date(Date.now() - 86400000);
  const emailNorm = v.email.trim().toLowerCase();
  const phoneNorm = v.phone.trim();
  // Duplicate guard: same phone (preferred) or same email within 24h.
  if (phoneNorm) {
    const minePhone = await db
      .select()
      .from(joinRequests)
      .where(
        and(
          eq(joinRequests.orgId, org[0].id),
          eq(joinRequests.phone, phoneNorm),
          eq(joinRequests.status, "pending"),
          gte(joinRequests.createdAt, dayAgo)
        )
      )
      .limit(1);
    if (minePhone[0])
      return NextResponse.json(
        { data: { received: true, note: "Request already received — your coordinator will be in touch." } },
        { status: 200 }
      );
  }
  if (emailNorm) {
    const mine = await db
      .select()
      .from(joinRequests)
      .where(
        and(
          eq(joinRequests.orgId, org[0].id),
          eq(joinRequests.email, emailNorm),
          eq(joinRequests.status, "pending"),
          gte(joinRequests.createdAt, dayAgo)
        )
      )
      .limit(1);
    if (mine[0])
      return NextResponse.json(
        { data: { received: true, note: "Request already received — your coordinator will be in touch." } },
        { status: 200 }
      );
  }
  const orgDay = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(joinRequests)
    .where(and(eq(joinRequests.orgId, org[0].id), gte(joinRequests.createdAt, dayAgo)));
  if ((orgDay[0]?.n ?? 0) >= 20)
    return NextResponse.json({ error: "Too many requests right now. Try tomorrow." }, { status: 429 });
  await db.insert(joinRequests).values({
    orgId: org[0].id,
    name: v.name,
    email: emailNorm || null,
    phone: phoneNorm || null,
    message: v.message || null,
    status: "pending",
  });
  return NextResponse.json(
    { data: { received: true, note: "Request received — your coordinator will be in touch." } },
    { status: 201 }
  );
}

export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  if (!["admin", "senior"].includes(ctx.role)) {
    await getDb().insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "join:list", allowed: false,
    });
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }
  const db = getDb();
  const rows = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    return tx
      .select()
      .from(joinRequests)
      .where(eq(joinRequests.orgId, ctx.orgId))
      .orderBy(desc(joinRequests.createdAt))
      .limit(100);
  });
  return NextResponse.json({
    data: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email ?? "",
      phone: r.phone ?? "",
      message: r.message ?? "",
      status: r.status,
      createdAt: r.createdAt,
    })),
  });
}
