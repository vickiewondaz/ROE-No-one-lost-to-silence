// Realistic demo seed: "Riverside Chapel" org with a full relationship story.
// TEST ONLY — wipes + recreates the riverside-chapel org every run.
// All test logins share password DemoPass123! (documented, test org only).
// Usage: node scripts/seed-demo.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const { default: postgres } = await import("postgres");
const sql = postgres(env.DATABASE_URL_UNPOOLED, { ssl: "require", max: 1 });
const ORG = "riverside-chapel";
const PW = "DemoPass123!";

async function auth(path, body, cookie = "") {
  const base = "http://localhost:3127";
  const r = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base, ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });
  const setCk = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [];
  return { status: r.status, json: await r.json().catch(() => null), cookie: setCk.map((c) => c.split(";")[0]).join("; ") };
}

// 0. Clean slate for this org + its test users (idempotent re-runs)
const olds = await sql`SELECT id FROM organisations WHERE slug = ${ORG}`;
for (const o of olds) {
  const id = o.id;
  for (const t of ["notifications","interactions","actions","consents","audit_logs","people","group_memberships","group_leads","connections","invitations","join_requests","groups","memberships"]) {
    await sql.unsafe(`DELETE FROM "${t}" WHERE org_id = '${id}'`);
  }
  await sql`DELETE FROM assignment_history WHERE action_id NOT IN (SELECT id FROM actions)`;
  const us = await sql`SELECT user_id FROM memberships WHERE org_id = ${id}`;
  await sql`DELETE FROM memberships WHERE org_id = ${id}`;
  await sql`DELETE FROM organisations WHERE id = ${id}`;
  void us;
}
console.log("cleaned previous demo org");

// 0b. Remove prior-run test users (same emails) so signups stay idempotent
const stale = await sql`SELECT id FROM users WHERE email LIKE '%@riverside.test'`;
for (const s of stale) {
  await sql`DELETE FROM memberships WHERE user_id = ${s.id}`;
  await sql`DELETE FROM platform_admins WHERE user_id = ${s.id}`;
  await sql`DELETE FROM session WHERE user_id = ${s.id}`;
  await sql`DELETE FROM account WHERE user_id = ${s.id}`;
  await sql`DELETE FROM users WHERE id = ${s.id}`;
}

// 1. Org + groups (via direct insert; org create API is super-only)
const [org] = await sql`INSERT INTO organisations (name, slug, status) VALUES ('Riverside Chapel', ${ORG}, 'active') RETURNING id`;
const gnames = ["Young Adults", "Choir", "Ushering Team"];
const gids = {};
for (const n of gnames) {
  const [g] = await sql`INSERT INTO groups (org_id, name, description) VALUES (${org.id}, ${n}, ${"Meets weekly"}) RETURNING id`;
  gids[n] = g.id;
}

// 2. Users via Better Auth signup against LOCAL server (real password hashes)
async function signup(email, name) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await auth("/api/auth/sign-up/email", { email, password: PW, name });
    if (r.status === 200 || r.status === 201) return r.json.user.id;
    if (r.status !== 429) throw new Error("signup failed " + email + " " + r.status);
    await new Promise((t) => setTimeout(t, 4000 * (attempt + 1)));
  }
  throw new Error("signup rate-limited: " + email);
}
const admin = await signup("amara@riverside.test", "Amara");
const david = await signup("david@riverside.test", "David");
const grace = await signup("grace@riverside.test", "Grace");
const funke = await signup("funke@riverside.test", "Funke");
const sarahUser = await signup("sarah@riverside.test", "Sarah");

// 3. Memberships
async function member(userId, role) {
  await sql`INSERT INTO memberships (user_id, org_id, role, status) VALUES (${userId}, ${org.id}, ${role}, 'active')`;
}
await member(admin, "admin");
await member(david, "worker");
await member(grace, "worker");
await member(funke, "group_leader");
await member(sarahUser, "member");
await sql`INSERT INTO group_leads (org_id, user_id, group_id) VALUES (${org.id}, ${funke}, ${gids["Young Adults"]})`;

// 4. People (some linked to logins)
async function person(p) {
  const [r] = await sql`INSERT INTO people (org_id, user_id, first_name, last_name, phone, channel, interests) VALUES (${org.id}, ${p.userId ?? null}, ${p.first}, ${p.last ?? ""}, ${p.phone}, ${p.channel}, ${p.interests ?? null}) RETURNING id`;
  await sql`INSERT INTO consents (org_id, person_id, type, granted, by_user) VALUES (${org.id}, ${r.id}, 'contact', true, ${admin})`;
  return r.id;
}
const ana = await person({ first: "Ana", last: "Bello", phone: "+2348011000001", channel: "WhatsApp", interests: "Music, Young Adults" });
const tunde = await person({ first: "Tunde", last: "Bakare", phone: "+2348011000002", channel: "Call", interests: "Ushering" });
const mama = await person({ first: "Mama", last: "Nkechi", phone: "+2348011000003", channel: "Visit", interests: "Choir, Welfare" });
const sarah = await person({ first: "Sarah", last: "Johnson", phone: "+2348011000004", channel: "WhatsApp", interests: "Young Adults", userId: sarahUser });
const emeka = await person({ first: "Emeka", last: "Obi", phone: "+2348011000005", channel: "WhatsApp", interests: "Media" });
const ruth = await person({ first: "Ruth", last: "Ade", phone: "+2348011000006", channel: "Call", interests: "Children ministry" });

// 5. Actions across states (due relative to today)
const day = 86400000;
const iso = (off) => new Date(Date.now() + off * day).toISOString().slice(0, 10);
async function action(personId, type, assignee, dueOff, status = "Open", outcome = null) {
  const [r] = await sql`INSERT INTO actions (org_id, person_id, type, assignee, creator, due_at, status, outcome) VALUES (${org.id}, ${personId}, ${type}, ${assignee}, ${admin}, ${iso(dueOff)}, ${status}, ${outcome}) RETURNING id`;
  return r.id;
}
const a1 = await action(ana, "Welcome check-in", david, -2); // overdue
await action(tunde, "Welcome call", david, 0); // today
await action(mama, "Welfare visit", grace, 0, "In Progress"); // today in progress
await action(emeka, "Introduce to media team", grace, 3); // upcoming
await action(ruth, "Welcome call", david, 1); // tomorrow
const doneA = await action(sarah, "Welcome call", david, -5, "Completed", "Reached — warm conversation");

// 6. Interactions (mixed outcomes incl. honest negative)
async function inter(personId, actionId, channel, outcome, notes, daysAgo) {
  await sql`INSERT INTO interactions (org_id, person_id, action_id, date, channel, outcome, notes) VALUES (${org.id}, ${personId}, ${actionId}, ${new Date(Date.now() - daysAgo * day).toISOString()}, ${channel}, ${outcome}, ${notes})`;
}
await inter(ana, a1, "WhatsApp", "No answer", "First attempt, no reply yet.", 2);
await inter(ana, a1, "Call", "Reached — asked to call back", "Evenings work better.", 1);
await inter(sarah, doneA, "WhatsApp", "Reached — warm conversation", "Loves Young Adults, shy at first.", 5);
await inter(mama, null, "Visit", "Reached — warm conversation", "Prayed together, doing well.", 6);
await inter(tunde, null, "Call", "No answer", null, 1);

// 7. Connections across states + memberships
async function conn(personId, groupName, status, outcome = null) {
  const [r] = await sql`INSERT INTO connections (org_id, person_id, group_id, status, outcome) VALUES (${org.id}, ${personId}, ${gids[groupName]}, ${status}, ${outcome}) RETURNING id`;
  return r.id;
}
await conn(sarah, "Young Adults", "Confirmed", "Attended — welcomed");
await sql`INSERT INTO group_memberships (org_id, person_id, group_id, role, status) VALUES (${org.id}, ${sarah}, ${gids["Young Adults"]}, 'member', 'active')`;
await conn(ana, "Young Adults", "Introduced");
await conn(mama, "Choir", "Suggested");

// 8. One pending join request + one assignment notification is created by flows.
await sql`INSERT INTO join_requests (org_id, name, email, phone, message, status) VALUES (${org.id}, 'Prospective Paul', 'paul@example.org', '+2348099999999', 'Visited last Sunday', 'pending')`;

console.log("seeded Riverside Chapel: 6 people, mixed actions/interactions/connections");
console.log("logins (all password DemoPass123!): amara/worker david/worker grace/leader funke/member sarah @riverside.test + admin amara");
await sql.end();
