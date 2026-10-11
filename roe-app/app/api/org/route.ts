// GET /api/org — own organisation profile (branding for dashboards).
// PATCH /api/org — admin-only branding update (logo URL, WhatsApp, welcome message).
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { auditLogs, organisations } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

const patchSchema = z.object({
  logoUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .refine((v) => v === undefined || v === "" || /^https:\/\/.+/.test(v), {
      message: "Logo must be an https:// URL.",
    }),
  whatsapp: z
    .string()
    .trim()
    .max(20)
    .optional()
    .refine(
      (v) => {
        if (v === undefined || v === "") return true;
        const digits = v.replace(/\D/g, "");
        return digits.length >= 7 && digits.length <= 15;
      },
      { message: "Enter a valid WhatsApp number." }
    ),
  welcomeMessage: z.string().trim().max(280).optional(),
});

function shape(r: typeof organisations.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    logoUrl: r.logoUrl ?? null,
    whatsapp: r.whatsapp ?? null,
    welcomeMessage: r.welcomeMessage ?? null,
  };
}

export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const rows = await getDb()
    .select()
    .from(organisations)
    .where(eq(organisations.id, s.ctx.orgId))
    .limit(1);
  if (!rows[0]) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ data: shape(rows[0]) });
}

export async function PATCH(req: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  if (!["admin", "senior"].includes(ctx.role)) {
    await getDb().insert(auditLogs).values({
      orgId: ctx.orgId, actor: ctx.userId, op: "org:update", allowed: false,
    });
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the form." }, { status: 422 });
  const v = parsed.data;
  const patch: Partial<typeof organisations.$inferInsert> = {};
  if (v.logoUrl !== undefined) patch.logoUrl = v.logoUrl.trim() || null;
  if (v.whatsapp !== undefined) patch.whatsapp = v.whatsapp.trim() || null;
  if (v.welcomeMessage !== undefined) patch.welcomeMessage = v.welcomeMessage.trim() || null;
  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "Nothing to save." }, { status: 422 });
  const [row] = await getDb()
    .update(organisations)
    .set(patch)
    .where(eq(organisations.id, ctx.orgId))
    .returning();
  await getDb().insert(auditLogs).values({
    orgId: ctx.orgId, actor: ctx.userId, op: "org:update", allowed: true,
  });
  return NextResponse.json({ data: shape(row) });
}
