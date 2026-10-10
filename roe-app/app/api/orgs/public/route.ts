// GET /api/orgs/public — church finder directory. Names + slugs only.
// Churches are public entities; no counts, no people, no PII.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { organisations } from "@/lib/db/schema";

export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const rows = await getDb()
    .select({ name: organisations.name, slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.status, "active"))
    .limit(200);
  return NextResponse.json({ data: rows });
}
