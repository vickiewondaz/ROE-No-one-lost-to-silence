// GET /api/orgs/public — community finder directory.
// Public branding only (name/slug/logo/WhatsApp/welcome); no counts, no people, no PII.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { organisations } from "@/lib/db/schema";

export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const rows = await getDb()
    .select({
      name: organisations.name,
      slug: organisations.slug,
      logoUrl: organisations.logoUrl,
      whatsapp: organisations.whatsapp,
      welcomeMessage: organisations.welcomeMessage,
    })
    .from(organisations)
    .where(eq(organisations.status, "active"))
    .limit(200);
  return NextResponse.json({
    data: rows.map((r) => ({
      name: r.name,
      slug: r.slug,
      logoUrl: r.logoUrl ?? null,
      whatsapp: r.whatsapp ?? null,
      welcomeMessage: r.welcomeMessage ?? null,
    })),
  });
}
