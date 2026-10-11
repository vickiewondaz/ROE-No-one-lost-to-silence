// /api/people/[id] — single profile read (P07/P12/P19).
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { actions, auditLogs, people } from "@/lib/db/schema";
import { personDTO } from "@/lib/people";
import { personInScope } from "@/lib/connections";
import { requireSession } from "@/lib/session";

const patchSchema = z.object({
  firstName: z.string().trim().min(2).max(60).optional(),
  lastName: z.string().trim().max(60).optional(),
  phone: z.string().trim().max(20).optional(),
  channel: z.enum(["Call", "WhatsApp", "Visit", "Other"]).optional(),
  interests: z.string().trim().max(300).optional(),
});

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

// PATCH — member self-service + worker updates on in-scope rows.
// Members may only touch their own linked row (enforced by personInScope);
// editable fields are contact-level only (phone/channel/interests).
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
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the form." }, { status: 422 });
  const v = parsed.data;
  if (v.phone !== undefined) {
    const digits = v.phone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15)
      return NextResponse.json({ error: "Enter a valid phone number." }, { status: 422 });
  }
  if (Object.keys(v).length === 0)
    return NextResponse.json({ error: "Nothing to save." }, { status: 422 });
  const db = getDb();
  const out = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    await tx.execute(sql`SELECT set_config('app.role', ${ctx.role}, true)`);
    await tx.execute(sql`SELECT set_config('app.user_id', ${ctx.userId}, true)`);
    const scope = await personInScope(tx, ctx, id);
    if (scope !== "ok") return scope;
    const patch: Partial<typeof people.$inferInsert> = {};
    if (v.firstName !== undefined) patch.firstName = v.firstName.trim();
    if (v.lastName !== undefined) patch.lastName = v.lastName.trim();
    if (v.phone !== undefined) patch.phone = v.phone.trim();
    if (v.channel !== undefined) patch.channel = v.channel;
    if (v.interests !== undefined) patch.interests = v.interests.trim() || null;
    const rows = await tx
      .update(people)
      .set(patch)
      .where(and(eq(people.id, id), eq(people.orgId, ctx.orgId)))
      .returning();
    const row = rows[0];
    if (!row) return "missing" as const;
    return personDTO(tx, row);
  });
  if (out === "denied") {
    await getDb().insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "people:update", ref: id, allowed: false,
    });
    return NextResponse.json({ error: "Restricted." }, { status: 403 });
  }
  if (out === "missing" || out === null)
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  await getDb().insert(auditLogs).values({
    orgId: ctx.orgId, actor: ctx.userId, op: "people:update", ref: id, allowed: true,
  });
  return NextResponse.json({ data: out });
}
