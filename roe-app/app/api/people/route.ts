// /api/people — GET scoped list, POST create (PRD §17 validation).
// Org always comes from the session. Client org_id is never trusted.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { actions, auditLogs, consents, people } from "@/lib/db/schema";
import { personDTO } from "@/lib/people";
import { personInScope } from "@/lib/connections";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/authz";

const createSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().max(60).optional().default(""),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9][0-9 ()-]{6,18}$/, "Enter a valid phone."),
  channel: z.enum(["Call", "WhatsApp", "Visit", "Other"]),
  interests: z.string().trim().max(280).optional().default(""),
  consentContact: z.literal(true, {
    message: "Contact consent is required.",
  }),
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
    await tx.execute(sql`SELECT set_config('app.role', ${ctx.role}, true)`);
    await tx.execute(sql`SELECT set_config('app.user_id', ${ctx.userId}, true)`);
    let list = await tx
      .select()
      .from(people)
      .where(eq(people.orgId, ctx.orgId))
      .orderBy(asc(people.firstName))
      .limit(500);
    // Single shared scope gate (assigned, group-led, admin, own). One check
    // per person; pilot scale makes the N+1 acceptable (indexed lookups).
    const visible = [];
    for (const p of list) {
      if ((await personInScope(tx, ctx, p.id)) === "ok") visible.push(p);
    }
    list = visible;
    return Promise.all(list.map((p) => personDTO(tx, p)));
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  if (!can(ctx, "people:create", { orgId: ctx.orgId })) {
    await getDb().insert(auditLogs).values({
      orgId: ctx.orgId,
      actor: ctx.userId,
      op: "people:create",
      allowed: false,
    });
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 422 }
    );
  const v = parsed.data;
  const db = getDb();
  const dto = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    await tx.execute(sql`SELECT set_config('app.role', ${ctx.role}, true)`);
    await tx.execute(sql`SELECT set_config('app.user_id', ${ctx.userId}, true)`);
    const digits = v.phone.replace(/\D/g, "");
    const dup = await tx
      .select({ id: people.id, firstName: people.firstName, phone: people.phone })
      .from(people)
      .where(eq(people.orgId, ctx.orgId))
      .limit(200);
    const possibleDup = dup.find((d) =>
      d.phone.replace(/\D/g, "").endsWith(digits.slice(-7))
    );
    const [row] = await tx
      .insert(people)
      .values({
        orgId: ctx.orgId,
        firstName: v.firstName,
        lastName: v.lastName,
        phone: v.phone,
        channel: v.channel,
        interests: v.interests || null,
      })
      .returning();
    await tx.insert(consents).values({
      orgId: ctx.orgId,
      personId: row.id,
      type: "contact",
      granted: true,
      byUser: ctx.userId,
    });
    await tx.insert(auditLogs).values({
      orgId: ctx.orgId,
      actor: ctx.userId,
      op: "people:create",
      ref: row.id,
      allowed: true,
    });
    const full = await personDTO(tx, row);
    return { ...full, duplicateWarning: possibleDup
      ? `Possible duplicate: ${possibleDup.firstName} (${possibleDup.phone}).`
      : undefined };
  });
  return NextResponse.json({ data: dto }, { status: 201 });
}
