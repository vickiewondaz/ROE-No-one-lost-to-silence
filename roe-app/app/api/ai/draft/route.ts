// POST /api/ai/draft — super-admin-only AI test console backend.
// Kinds: welcome | next-action | summarize. Returns draft + serving decision.
// Everything is audited. No member data should be pasted here during testing —
// use fictional cases (e.g. "Ana"). Worker-facing surfaces stay flagged OFF.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { auditLogs } from "@/lib/db/schema";
import { omniChat, welcomeMessagePrompt } from "@/lib/ai/omniroute";
import { requirePlatform } from "@/lib/session";

const bodySchema = z.object({
  kind: z.enum(["welcome", "next-action", "summarize"]),
  firstName: z.string().trim().min(1).max(40).default("Friend"),
  context: z.string().trim().max(500).default(""),
});

function promptFor(kind: string, firstName: string, context: string) {
  if (kind === "welcome") return welcomeMessagePrompt(firstName, context || "first visit");
  if (kind === "next-action")
    return [
      {
        role: "user" as const,
        content: `A church follow-up worker recorded this about newcomer ${firstName}: "${context}". Suggest ONE concrete next action (under 25 words) plus one line starting with "Because: " explaining it from recorded facts only. Never judge the person or guess why they were away.`,
      },
    ];
  return [
    {
      role: "user" as const,
      content: `Summarize these follow-up notes about newcomer ${firstName} into 2 short factual lines for a church worker handover: "${context}". Facts only, no judgments, no invented details.`,
    },
  ];
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requirePlatform();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const { kind, firstName, context } = parsed.data;
  try {
    const r = await omniChat(promptFor(kind, firstName, context));
    await getDb()
      .insert(auditLogs)
      .values({
        orgId: null,
        actor: s.ctx.userId,
        op: `ai:draft:${kind}`,
        ref: r.decision.slice(0, 120),
        allowed: true,
      });
    return NextResponse.json({
      data: { draft: r.text, decision: r.decision, model: r.model, kind },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Assistant unavailable — try again. Nothing was recorded." },
      { status: 502 }
    );
  }
}
