// GET /api/people/[id]/timeline — P2 relationship history: visits, attempts,
// responses, preferences snapshot, worker, next steps. One chronological feed.
// Sensitive pastoral notes live elsewhere (P1 care); this feed is factual.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { actions, auditLogs, connections, groups, interactions } from "@/lib/db/schema";
import { personInScope } from "@/lib/connections";
import { requireSession } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "db_not_configured" }, { status: 501 });
  const { id } = await params;
  const s = await requireSession();
  if ("error" in s) return NextResponse.json({ error: s.message }, { status: s.error });
  const { ctx } = s;
  const db = getDb();
  const feed = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    const scope = await personInScope(tx, ctx, id);
    if (scope === "missing") return null;
    if (scope !== "ok") {
      await tx.insert(auditLogs).values({
        orgId: ctx.orgId, actor: ctx.userId, op: "timeline:read", ref: id, allowed: false,
      });
      return "denied" as const;
    }
    const inter = await tx
      .select()
      .from(interactions)
      .where(eq(interactions.personId, id))
      .orderBy(desc(interactions.date))
      .limit(30);
    const acts = await tx
      .select()
      .from(actions)
      .where(eq(actions.personId, id))
      .orderBy(desc(actions.dueAt))
      .limit(30);
    const conns = await tx
      .select({ conn: connections, groupName: groups.name })
      .from(connections)
      .leftJoin(groups, eq(groups.id, connections.groupId))
      .where(eq(connections.personId, id))
      .limit(30);
    type Ev = { at: string; kind: string; title: string; detail: string };
    const evs: Ev[] = [];
    for (const i of inter)
      evs.push({
        at: new Date(i.date).toISOString(),
        kind: "interaction",
        title: `${i.channel} — ${i.outcome}`,
        detail: i.notes ?? "",
      });
    for (const a of acts)
      evs.push({
        at: new Date(a.dueAt).toISOString(),
        kind: "action",
        title: `${a.type} — ${a.status}`,
        detail: a.outcome ?? "",
      });
    for (const c of conns) {
      const row = c as unknown as { conn: typeof connections.$inferSelect; groupName: string | null };
      evs.push({
        at: new Date().toISOString(),
        kind: "connection",
        title: `${row.groupName ?? "Group"} — ${row.conn.status}`,
        detail: row.conn.outcome ?? "",
      });
    }
    evs.sort((a, b) => (a.at < b.at ? 1 : -1));
    return evs.slice(0, 40);
  });
  if (feed === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (feed === "denied") return NextResponse.json({ error: "Restricted." }, { status: 403 });
  return NextResponse.json({ data: feed });
}
