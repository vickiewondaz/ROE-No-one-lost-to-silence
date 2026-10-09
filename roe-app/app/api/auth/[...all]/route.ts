// Better Auth HTTP handler (sign-in/out, session). 501 when DB unconfigured.
import { NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth, authConfigured } from "@/lib/auth";

const handlers = authConfigured ? toNextJsHandler(auth) : null;

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!handlers)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  return handlers.GET(req);
}

export async function POST(req: Request) {
  if (!handlers)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  return handlers.POST(req);
}
