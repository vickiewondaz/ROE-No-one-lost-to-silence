// Better Auth HTTP handler (sign-in/out, session). 501 when DB unconfigured.
import { NextResponse } from "next/server";
import { getAuthHandler, authConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const h = authConfigured ? getAuthHandler() : null;
  if (!h)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  return h.GET(req);
}

export async function POST(req: Request) {
  const h = authConfigured ? getAuthHandler() : null;
  if (!h)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  return h.POST(req);
}
