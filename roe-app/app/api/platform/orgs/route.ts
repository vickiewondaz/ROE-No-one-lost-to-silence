// /api/platform/* — super-admin control plane. Counts only, never member PII.
// Suspension enforced in requireSession (org layer), decided here.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { auditLogs, groups, memberships, organisations, people } from "@/lib/db/schema";
import { requirePlatform } from "@/lib/session";

const createOrgSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,40}$/, "Slug: a-z, 0-9, hyphens."),
});

export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requirePlatform();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const db = getDb();
  const orgs = await db.select().from(organisations).orderBy(desc(organisations.createdAt)).limit(200);
  const data = [];
  for (const o of orgs) {
    const [u] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(memberships)
      .where(eq(memberships.orgId, o.id));
    const [p] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(people)
      .where(eq(people.orgId, o.id));
    data.push({ id: o.id, name: o.name, slug: o.slug, status: o.status, users: u?.n ?? 0, people: p?.n ?? 0 });
  }
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requirePlatform();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const parsed = createOrgSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const db = getDb();
  const existing = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, parsed.data.slug))
    .limit(1);
  if (existing[0])
    return NextResponse.json({ error: "That web name is taken." }, { status: 422 });
  const [org] = await db
    .insert(organisations)
    .values({ name: parsed.data.name, slug: parsed.data.slug, status: "active" })
    .returning();
  await db.insert(groups).values({
    orgId: org.id, name: "General Fellowship", description: "Default group for new connections.",
  });
  await db.insert(auditLogs).values({
    orgId: org.id, actor: s.ctx.userId, op: "platform:org-create", ref: org.id, allowed: true,
  });
  return NextResponse.json(
    { data: { id: org.id, name: org.name, slug: org.slug, status: org.status } },
    { status: 201 }
  );
}
