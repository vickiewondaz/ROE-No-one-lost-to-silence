// PATCH /api/users/[id] — admin edits role/status. Never self, never admin,
// never platform super-admins (except by a super-admin — not exposed here).
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { auditLogs, memberships, platformAdmins } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

const bodySchema = z
  .object({
    role: z.enum(["worker", "group_leader", "member", "care"]).optional(),
    status: z.enum(["active", "suspended"]).optional(),
  })
  .refine((v) => v.role !== undefined || v.status !== undefined, {
    message: "Nothing to update.",
  });

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
  if (ctx.role !== "admin")
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const db = getDb();
  const out = await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(memberships)
      .where(and(eq(memberships.id, id), eq(memberships.orgId, ctx.orgId)))
      .limit(1);
    const m = rows[0];
    if (!m) return null;
    if (m.userId === ctx.userId) return "self" as const;
    const prot = await tx
      .select()
      .from(platformAdmins)
      .where(eq(platformAdmins.userId, m.userId))
      .limit(1);
    if (prot[0]) return "protected" as const;
    const patch: Partial<{ role: typeof m.role; status: string }> = {};
    if (parsed.data.role !== undefined) patch.role = parsed.data.role;
    if (parsed.data.status !== undefined) patch.status = parsed.data.status;
    const [updated] = await tx
      .update(memberships)
      .set(patch)
      .where(eq(memberships.id, id))
      .returning();
    await tx.insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "users:update", ref: id, allowed: true,
    });
    return { membershipId: updated.id, role: updated.role, status: updated.status };
  });
  if (out === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (out === "self")
    return NextResponse.json({ error: "You cannot change your own access." }, { status: 403 });
  if (out === "protected")
    return NextResponse.json({ error: "Platform accounts are managed at platform level." }, { status: 403 });
  return NextResponse.json({ data: out });
}
