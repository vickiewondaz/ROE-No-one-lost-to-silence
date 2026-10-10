// POST /api/join/[id]/approve — admin approves with a role → mints a standard
// invitation (same hashed/single-use/7d rules). Returns the link to forward.
export const dynamic = "force-dynamic";

import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { auditLogs, invitations, joinRequests, organisations } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

const bodySchema = z.object({
  role: z.enum(["worker", "group_leader", "member", "care"]).default("member"),
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
  if (ctx.role !== "admin") {
    await getDb().insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "join:approve", allowed: false,
    });
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const db = getDb();
  const out = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    const found = await tx
      .select()
      .from(joinRequests)
      .where(and(eq(joinRequests.id, id), eq(joinRequests.orgId, ctx.orgId)))
      .limit(1);
    const jr = found[0];
    if (!jr) return null;
    if (jr.status !== "pending") return "settled" as const;
    const token = randomBytes(32).toString("hex");
    const [inv] = await tx
      .insert(invitations)
      .values({
        orgId: ctx.orgId,
        email: jr.email,
        role: parsed.data.role,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        invitedBy: ctx.userId,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      })
      .returning();
    await tx
      .update(joinRequests)
      .set({ status: "approved", decidedBy: ctx.userId, decidedAt: new Date(), inviteId: inv.id })
      .where(eq(joinRequests.id, id));
    await tx.insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "join:approve", ref: id, allowed: true,
    });
    return { token, inviteId: inv.id, email: jr.email, role: parsed.data.role };
  });
  if (out === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (out === "settled")
    return NextResponse.json({ error: "Already decided." }, { status: 422 });
  // Best-effort approval email (WhatsApp forward stays primary).
  {
    const base = new URL(req.url).origin;
    const { inviteEmail, sendEmail } = await import("@/lib/email");
    const org = await getDb()
      .select()
      .from(organisations)
      .where(eq(organisations.id, ctx.orgId))
      .limit(1);
    const { subject, html } = inviteEmail(
      org[0]?.name ?? "Your church",
      out.role,
      `${base}/invite/${out.token}`
    );
    void sendEmail(out.email, subject, html);
  }
  return NextResponse.json({ data: out }, { status: 201 });
}
