// POST /api/platform/orgs/[id]/admins — invite an admin for an org.
// The ONLY path that may grant `admin` (org-admin invites exclude it).
// Creates the invitation; the invitee activates via the standard accept flow.
export const dynamic = "force-dynamic";

import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { auditLogs, invitations, organisations } from "@/lib/db/schema";
import { requirePlatform } from "@/lib/session";

const bodySchema = z.object({ email: z.string().email() });

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
  const org = await db.select().from(organisations).where(eq(organisations.id, id)).limit(1);
  if (!org[0]) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const token = randomBytes(32).toString("hex");
  const [row] = await db
    .insert(invitations)
    .values({
      orgId: id,
      email: parsed.data.email.toLowerCase(),
      role: "admin",
      tokenHash: createHash("sha256").update(token).digest("hex"),
      invitedBy: s.ctx.userId,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    })
    .returning();
  await db.insert(auditLogs).values({
    orgId: id, actor: s.ctx.userId, op: "platform:admin-invite", ref: row.id, allowed: true,
  });
  return NextResponse.json(
    { data: { id: row.id, email: row.email, role: row.role, token } },
    { status: 201 }
  );
}
