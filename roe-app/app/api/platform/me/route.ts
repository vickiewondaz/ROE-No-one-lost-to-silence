// GET /api/platform/me — {isSuperAdmin}. Gates the /platform section in UI.
// Server re-checks on every platform call; this is display-only.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requirePlatform } from "@/lib/session";

export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requirePlatform();
  if ("error" in s) return NextResponse.json({ data: { isSuperAdmin: false } });
  return NextResponse.json({ data: { isSuperAdmin: true, userId: s.ctx.userId } });
}
