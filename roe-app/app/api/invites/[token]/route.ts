// /api/invites/[token] — GET validate (public), POST accept (public).
// Accept: creates Better Auth user (forced invite email) + membership with the
// invited role, marks invite single-used. 404 unknown, 410 used/expired.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { auditLogs, invitations, memberships, organisations } from "@/lib/db/schema";
import { hashToken, lookupInvite } from "../route";

const acceptSchema = z.object({
  name: z.string().trim().min(2).max(60),
  password: z.string().min(8).max(128),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const { token } = await params;
  const db = getDb();
  const inv = await lookupInvite(db, token);
  if (!inv) return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  if (inv.state !== "valid")
    return NextResponse.json({ error: "Invite no longer valid." }, { status: 410 });
  const org = await db
    .select()
    .from(organisations)
    .where(eq(organisations.id, inv.orgId))
    .limit(1);
  return NextResponse.json({
    data: { email: inv.email, role: inv.role, orgName: org[0]?.name ?? "Your organisation" },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const { token } = await params;
  const parsed = acceptSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const db = getDb();
  const inv = await lookupInvite(db, token);
  if (!inv) return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  if (inv.state !== "valid")
    return NextResponse.json({ error: "Invite no longer valid." }, { status: 410 });
  let userId: string;
  try {
    const created = (await auth.api.signUpEmail({
      body: { email: inv.email, password: parsed.data.password, name: parsed.data.name },
      headers: req.headers,
    })) as { user: { id: string } };
    if (!created?.user?.id) throw new Error("signup failed");
    userId = created.user.id;
  } catch {
    return NextResponse.json(
      { error: "Could not create account (email may already exist)." },
      { status: 422 }
    );
  }
  await db.insert(memberships).values({
    userId,
    orgId: inv.orgId,
    role: inv.role,
    status: "active",
  });
  await db.update(invitations).set({ acceptedAt: new Date() }).where(eq(invitations.id, inv.id));
  await db.insert(auditLogs).values({
    orgId: inv.orgId, actor: userId, op: "invites:accept", ref: inv.id, allowed: true,
  });
  return NextResponse.json({ data: { userId, role: inv.role } }, { status: 201 });
}
