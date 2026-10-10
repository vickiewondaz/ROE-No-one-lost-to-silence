// GET /api/milestones/upcoming?days=30 — celebrations ahead, scoped to people
// the caller may see (same gate as the directory). For Home's upcoming row.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { milestones, people } from "@/lib/db/schema";
import { personInScope } from "@/lib/connections";
import { nextOccurrence } from "@/lib/milestones";
import { requireSession } from "@/lib/session";

const LABEL: Record<string, string> = {
  birthday: "Birthday",
  anniversary: "Anniversary",
  milestone: "Milestone",
};

export async function GET(req: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  const days = Math.min(Math.max(Number(new URL(req.url).searchParams.get("days") ?? 30), 1), 90);
  const db = getDb();
  const out = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    const plist = await tx
      .select()
      .from(people)
      .where(eq(people.orgId, ctx.orgId))
      .limit(500);
    const visible = [];
    for (const p of plist) {
      if ((await personInScope(tx, ctx, p.id)) === "ok") visible.push(p);
    }
    const vids = new Set(visible.map((p) => p.id));
    if (!vids.size) return [];
    const all = await tx.select().from(milestones).where(eq(milestones.orgId, ctx.orgId)).limit(500);
    const now = Date.now();
    const items = [];
    for (const m of all) {
      if (!vids.has(m.personId)) continue;
      const when = nextOccurrence(Number(m.month), Number(m.day));
      const diffDays = Math.round((when.getTime() - now) / 86400000);
      if (diffDays < 0 || diffDays > days) continue;
      const person = visible.find((p) => p.id === m.personId);
      items.push({
        personId: m.personId,
        personName: person ? `${person.firstName} ${person.lastName ?? ""}`.trim() : "Someone",
        type: m.type,
        label: LABEL[m.type] ?? "Milestone",
        date: when.toISOString().slice(0, 10),
        inDays: diffDays,
      });
    }
    return items.sort((a, b) => a.inDays - b.inDays).slice(0, 20);
  });
  return NextResponse.json({ data: out });
}
