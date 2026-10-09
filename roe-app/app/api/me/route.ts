// GET /api/me — caller identity (id, org, role). No PII beyond own row.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";

export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  return NextResponse.json({
    data: { userId: ctx.userId, orgId: ctx.orgId, role: ctx.role },
  });
}
