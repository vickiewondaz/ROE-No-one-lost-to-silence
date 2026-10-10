// /api/invites — POST create (admin), GET list (admin).
// Invite-only pilot: roles worker|group_leader|member|care (never admin).
// Token: 32 random bytes, SHA-256 stored, single-use, 7d expiry.
// Delivery is out-of-band (admin copies link / WhatsApp) — no email infra in MVP.
export const dynamic = "force-dynamic";

import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { auditLogs, invitations, organisations } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

const createSchema = z.object({
  email: z.string().email(),
  role: z.enum(["worker", "group_leader", "member", "care"]),
});

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  if (ctx.role !== "admin") {
    await getDb().insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "invites:create", allowed: false,
    });
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  const db = getDb();
  const [row] = await db
    .insert(invitations)
    .values({
      orgId: ctx.orgId,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      tokenHash: hashToken(token),
      invitedBy: ctx.userId,
      expiresAt,
    })
    .returning();
  await db.insert(auditLogs).values({
    orgId: ctx.orgId, actor: ctx.userId, op: "invites:create", ref: row.id, allowed: true,
  });
  // Best-effort email (WhatsApp link stays primary). Never blocks the invite.
  {
    const base = new URL(req.url).origin;
    const { inviteEmail } = await import("@/lib/email");
    const { sendEmail } = await import("@/lib/email");
    const org = await db
      .select()
      .from(organisations)
      .where(eq(organisations.id, ctx.orgId))
      .limit(1);
    const { subject, html } = inviteEmail(
      org[0]?.name ?? "Your church",
      row.role,
      `${base}/invite/${token}`
    );
    void sendEmail(row.email, subject, html);
  }
  return NextResponse.json(
    { data: { id: row.id, email: row.email, role: row.role, expiresAt, token } },
    { status: 201 }
  );
}

export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  if (ctx.role !== "admin")
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  const db = getDb();
  const rows = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    return tx
      .select()
      .from(invitations)
      .where(eq(invitations.orgId, ctx.orgId))
      .orderBy(desc(invitations.createdAt))
      .limit(100);
  });
  const now = Date.now();
  return NextResponse.json({
    data: rows.map((r) => ({
      id: r.id,
      email: r.email,
      role: r.role,
      status: r.acceptedAt ? "accepted" : r.expiresAt.getTime() < now ? "expired" : "pending",
      expiresAt: r.expiresAt,
    })),
  });
}

// DELETE /api/invites?id= — admin revokes a PENDING invite (accepted = history).
export async function DELETE(req: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  if (ctx.role !== "admin")
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const db = getDb();
  const out = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    const rows = await tx
      .select()
      .from(invitations)
      .where(and(eq(invitations.id, id), eq(invitations.orgId, ctx.orgId)))
      .limit(1);
    const inv = rows[0];
    if (!inv) return null;
    if (inv.acceptedAt) return "used" as const;
    await tx.delete(invitations).where(eq(invitations.id, id));
    await tx.insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "invites:revoke", ref: id, allowed: true,
    });
    return "ok" as const;
  });
  if (out === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (out === "used")
    return NextResponse.json({ error: "Accepted invitations are history and stay." }, { status: 422 });
  return NextResponse.json({ data: { revoked: true } });
}

export async function lookupInvite(db: ReturnType<typeof getDb>, token: string) {  const rows = await db
    .select()
    .from(invitations)
    .where(eq(invitations.tokenHash, hashToken(token)))
    .limit(1);
  const inv = rows[0];
  if (!inv) return null;
  if (inv.acceptedAt) return { ...inv, state: "used" as const };
  if (inv.expiresAt.getTime() < Date.now()) return { ...inv, state: "expired" as const };
  return { ...inv, state: "valid" as const };
}
