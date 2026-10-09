// GET /api/people — scoped read. Deny-by-default; no client org_id trusted.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { can } from "@/lib/authz";

export async function GET() {
  // Pilot gate: wire session (Better Auth) here. Until DATABASE_URL is set,
  // the UI uses localStorage demo data and this route reports unconfigured.
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        error: "db_not_configured",
        message: "Set DATABASE_URL then redeploy. UI demo data active.",
        // Authz shape enforced once session exists:
        authz: "people:read requires same-org + assigned|group|grant; cross-org → 403",
      },
      { status: 501 }
    );
  }
  // Real path (post-config):
  // const session = await getSession(); if (!session) 401
  // if (!can(session, "people:read", { orgId: session.orgId, ... })) 403 + audit
  // ...scoped Drizzle query with RLS context...
  return NextResponse.json({ data: [] });
}

export async function POST() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        error: "db_not_configured",
        message: "POST /api/people needs DATABASE_URL + session.",
      },
      { status: 501 }
    );
  }
  void can;
  return NextResponse.json({ data: null });
}
