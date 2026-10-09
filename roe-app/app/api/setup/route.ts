// POST /api/setup — one-time pilot bootstrap (Figma v1.2.1 §20.1 invite-only).
// Creates the first admin via Better Auth + membership in the seeded org.
// Pilot-only: requires ALLOW_SETUP=true + SETUP_SECRET. Remove after pilot.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { memberships, organisations } from "@/lib/db/schema";

const bodySchema = z.object({
  secret: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(2).max(60),
  orgSlug: z.string().trim().min(2).max(60).default("grace-pilot"),
});

export async function POST(req: Request) {
  if (process.env.ALLOW_SETUP !== "true" || !process.env.SETUP_SECRET)
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.secret !== process.env.SETUP_SECRET)
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  const { email, password, name, orgSlug } = parsed.data;
  const db = getDb();
  const orgs = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, orgSlug))
    .limit(1);
  if (!orgs[0])
    return NextResponse.json({ error: "Org not seeded." }, { status: 422 });
  let created: { user: { id: string } };
  try {
    created = (await auth.api.signUpEmail({
      body: { email, password, name },
      headers: req.headers,
    })) as { user: { id: string } };
    if (!created?.user?.id) throw new Error("signup failed");
  } catch {
    return NextResponse.json(
      { error: "Signup failed (email may already exist)." },
      { status: 422 }
    );
  }
  const existing = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, created.user.id))
    .limit(1);
  if (!existing[0]) {
    await db.insert(memberships).values({
      userId: created.user.id,
      orgId: orgs[0].id,
      role: "admin",
      status: "active",
    });
  }
  return NextResponse.json(
    { data: { userId: created.user.id, orgId: orgs[0].id, role: "admin" } },
    { status: 201 }
  );
}
