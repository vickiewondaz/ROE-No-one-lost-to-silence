// POST /api/actions/transition — TRD §17 machine enforced server-side.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { canTransition } from "@/lib/authz";

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "db_not_configured", message: "Transition needs DATABASE_URL + session." },
      { status: 501 }
    );
  }
  const body = (await req.json().catch(() => null)) as {
    from?: "Open" | "In Progress" | "Completed" | "Paused";
    to?: "Open" | "In Progress" | "Completed" | "Paused";
    hasOutcome?: boolean;
  } | null;
  if (!body?.from || !body?.to)
    return NextResponse.json({ error: "bad_request" }, { status: 422 });
  if (!canTransition(body.from, body.to, { hasOutcome: body.hasOutcome }))
    return NextResponse.json(
      { error: "invalid_transition", message: `${body.from} → ${body.to} denied` },
      { status: 422 }
    );
  return NextResponse.json({ data: { ok: true } });
}
