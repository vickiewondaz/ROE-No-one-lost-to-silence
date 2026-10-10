// Daily celebration reminders (6am WAT): milestones due in the next 2 days
// notify the person's open-action assignees, else the org admins. No mass
// sends, no auto-messages — a human still greets and records. Dedupe: skip
// when an unread reminder exists or a greeting was recorded in the last 30d.
// Fully opted-out persons (all channels) are skipped.
import type { Config } from "@netlify/functions";
import postgres from "postgres";

export default async () => {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) {
    console.log("celebration-reminders: no DB url, skipping");
    return new Response("skipped", { status: 200 });
  }
  const sql = postgres(url, { ssl: "require", max: 1 });
  try {
    const targets: { month: string; day: string }[] = [];
    for (let off = 0; off <= 2; off++) {
      const d = new Date(Date.now() + off * 86400000);
      targets.push({
        month: String(d.getUTCMonth() + 1).padStart(2, "0"),
        day: String(d.getUTCDate()).padStart(2, "0"),
      });
    }
    const orgs = await sql`SELECT id FROM organisations WHERE status = 'active'`;
    let created = 0;
    for (const o of orgs) {
      const ms = await sql`SELECT * FROM milestones WHERE org_id = ${o.id}`;
      for (const m of ms) {
        if (!targets.some((t) => t.month === m.month && t.day === m.day)) continue;
        const prefs = await sql`SELECT opt_in FROM communication_preferences WHERE person_id = ${m.person_id}`;
        if (prefs.length > 0 && prefs.every((p) => !p.opt_in)) continue;
        const existing = await sql`SELECT id FROM notifications WHERE org_id = ${o.id} AND ref_id = ${m.id} AND read_at IS NULL LIMIT 1`;
        if (existing.length > 0) continue;
        const greeted = await sql`SELECT id FROM interactions WHERE person_id = ${m.person_id} AND outcome = 'Celebration acknowledged' AND date > NOW() - INTERVAL '30 days' LIMIT 1`;
        if (greeted.length > 0) continue;
        const owners = await sql`SELECT DISTINCT assignee AS uid FROM actions WHERE person_id = ${m.person_id} AND status <> 'Completed'`;
        let recipients = owners.map((r) => r.uid);
        if (!recipients.length) {
          const admins = await sql`SELECT user_id AS uid FROM memberships WHERE org_id = ${o.id} AND role = 'admin' AND status = 'active'`;
          recipients = admins.map((r) => r.uid);
        }
        for (const uid of recipients) {
          await sql`INSERT INTO notifications (org_id, user_id, type, ref_id) VALUES (${o.id}, ${uid}, 'celebration', ${m.id})`;
          created++;
        }
      }
    }
    console.log(`celebration-reminders: created=${created}`);
    return new Response(JSON.stringify({ created }), { status: 200 });
  } finally {
    await sql.end();
  }
};

export const config: Config = { schedule: "0 5 * * *" };
