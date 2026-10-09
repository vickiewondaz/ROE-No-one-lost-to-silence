// GET /api/me — caller identity (id, org, role). No PII beyond own row.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { organisations } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  const org = await getDb()
    .select()
    .from(organisations)
    .where(eq(organisations.id, ctx.orgId))
    .limit(1);
  return NextResponse.json({
    data: {
      userId: ctx.userId,
      orgId: ctx.orgId,
      orgName: org[0]?.name ?? "Your organisation",
      role: ctx.role,
    },
  });
}
