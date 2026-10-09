// End-to-end pilot smoke: login page → setup gate → signup → session →
// people CRUD → validation/zod → auth gates. Prints PASS/FAIL only.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2] ?? "http://localhost:3104";
const env = {};
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
}
const secret = process.argv[3] ?? env.SETUP_SECRET;
if (!secret) throw new Error("SETUP_SECRET missing");
const email = `smoke-${Date.now()}@grace-pilot.test`;
const password = "SmokePass123!";
let cookie = "";
let pass = 0, fail = 0;

async function req(method, path, body, useCookie = true) {
  const r = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: base, // browsers always send this; Better Auth rejects without it
      ...(useCookie && cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCk =
    typeof r.headers.getSetCookie === "function"
      ? r.headers.getSetCookie()
      : [r.headers.get("set-cookie")].filter(Boolean);
  if (setCk.length)
    cookie = setCk.map((c) => c.split(";")[0]).join("; ");
  let j = null;
  try { j = await r.json(); } catch {}
  return { status: r.status, j };
}
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.log(`FAIL ${name} ${extra}`); }
}
const text = async (p) => (await fetch(base + p)).status;

check("login page 200", (await text("/login")) === 200);
{
  const r = await req("GET", "/api/people", null, false);
  check("anon people → 401", r.status === 401, `got=${r.status}`);
}
{
  const r = await req("POST", "/api/setup", { secret: "wrong", email, password, name: "X" }, false);
  check("setup wrong secret → 404", r.status === 404, `got=${r.status}`);
}
let adminId = "";
{
  const r = await req("POST", "/api/setup", { secret, email, password, name: "Smoke Admin" }, false);
  check("setup creates admin → 201", r.status === 201 && !!r.j?.data?.userId, `got=${r.status}`);
  adminId = r.j?.data?.userId ?? "";
}
{
  const r = await req("POST", "/api/auth/sign-in/email", { email, password }, false);
  check("sign-in works + cookie", r.status === 200 && cookie.length > 0, `got=${r.status}`);
}
let before = -1;
{
  const r = await req("GET", "/api/people");
  before = r.j?.data?.length ?? -1;
  check("authed list → 200 array", r.status === 200 && Array.isArray(r.j?.data), `got=${r.status}`);
}
{
  const r = await req("POST", "/api/people", { firstName: "A", phone: "bad", channel: "Call", consentContact: true });
  check("invalid phone → 422", r.status === 422, `got=${r.status}`);
}
let newId = "";
{
  const r = await req("POST", "/api/people", { firstName: "Smoke", lastName: "Test", phone: "+2348010000001", channel: "WhatsApp", consentContact: true });
  check("create person → 201", r.status === 201 && !!r.j?.data?.id, `got=${r.status}`);
  newId = r.j?.data?.id ?? "";
}
{
  const r = await req("GET", "/api/people");
  check("list grew by 1", r.j?.data?.length === before + 1, `before=${before} now=${r.j?.data?.length}`);
}
{
  const r = await req("GET", `/api/people/${newId}`);
  check("single read → 200 + journey", r.status === 200 && !!r.j?.data?.journey, `got=${r.status}`);
}
{
  const r = await req("GET", `/api/people/00000000-0000-0000-0000-000000000000`);
  check("missing id → 404", r.status === 404, `got=${r.status}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
{
  const r = await req("GET", "/api/me");
  check("me → 200 self", r.status === 200 && !!r.j?.data?.userId, `got=${r.status}`);
}
let adminCookie = cookie;
let actionId = "", action2Id = "";
{
  const r = await req("GET", "/api/users");
  check("users directory → 200", r.status === 200 && Array.isArray(r.j?.data), `got=${r.status}`);
}
{
  const r = await req("POST", "/api/actions", { personId: newId, type: "X", assigneeUserId: "00000000-0000-0000-0000-000000000000", dueAt: "2099-01-01" });
  check("assign outsider → 422", r.status === 422, `got=${r.status}`);
}
{
  const r = await req("POST", "/api/actions", { personId: newId, type: "Welcome call", assigneeUserId: adminId, dueAt: "2000-01-01" });
  check("past due → 422", r.status === 422, `got=${r.status}`);
}
{
  const r = await req("POST", "/api/actions", { personId: newId, type: "Welcome call", assigneeUserId: adminId, dueAt: "2099-01-02" });
  check("assign self → 201", r.status === 201 && !!r.j?.data?.id, `got=${r.status}`);
  actionId = r.j?.data?.id ?? "";
}
{
  const r = await req("POST", "/api/actions", { personId: newId, type: "Second task", assigneeUserId: adminId, dueAt: "2099-01-03" });
  action2Id = r.j?.data?.id ?? "";
  check("second action → 201", r.status === 201, `got=${r.status}`);
}
{
  const r = await req("GET", "/api/actions?tab=all");
  check("actions list contains new", r.status === 200 && (r.j?.data ?? []).some((a) => a.id === actionId), `got=${r.status}`);
}
{
  const r = await req("POST", `/api/actions/${action2Id}/transition`, { to: "Completed" });
  check("complete w/o outcome → 422", r.status === 422, `got=${r.status}`);
}
{
  const r = await req("POST", `/api/actions/${actionId}/transition`, { to: "In Progress" });
  check("start → 200 In Progress", r.status === 200 && r.j?.data?.status === "In Progress", `got=${r.status}`);
}
{
  const r = await req("POST", "/api/interactions", { personId: newId, actionId, channel: "WhatsApp", outcome: "Reached — warm conversation", notes: "smoke" });
  check("record interaction → 201", r.status === 201, `got=${r.status}`);
}
{
  const r = await req("GET", `/api/actions/${actionId}`);
  check("action auto-completed", r.status === 200 && r.j?.data?.status === "Completed", `got=${r.status}`);
}
{
  const r = await req("PATCH", `/api/actions/${action2Id}`, { dueAt: "2099-02-01" });
  check("reschedule → 200", r.status === 200, `got=${r.status}`);
}
{
  const r = await req("GET", "/api/notifications");
  check("assignment notification present", r.status === 200 && (r.j?.data ?? []).some((n) => n.type === "assignment"), `got=${r.status}`);
}
// Invite round-trip (admin cookie active)
let inviteToken = "";
{
  const r = await req("POST", "/api/invites", { email: `invited-${Date.now()}@grace-pilot.test`, role: "worker" });
  check("invite create → 201 + token", r.status === 201 && !!r.j?.data?.token, `got=${r.status}`);
  inviteToken = r.j?.data?.token ?? "";
}
{
  const r = await req("GET", "/api/invites");
  check("invite list contains pending", r.status === 200 && (r.j?.data ?? []).some((i) => i.status === "pending"), `got=${r.status}`);
}
{
  const r = await req("GET", "/api/invites/does-not-exist", null, false);
  check("bogus invite → 404", r.status === 404, `got=${r.status}`);
}
{
  const r = await req("POST", `/api/invites/${inviteToken}`, { name: "Invited Worker", password }, false);
  check("accept invite → 201 worker", r.status === 201 && r.j?.data?.role === "worker", `got=${r.status}`);
}
{
  const r = await req("POST", `/api/invites/${inviteToken}`, { name: "Again", password }, false);
  check("reuse invite → 410", r.status === 410, `got=${r.status}`);
}
// Second user (worker): assignee-only enforcement
{
  const email2 = `smoke2-${Date.now()}@grace-pilot.test`;
  await sleep(2000);
  const s2 = await req("POST", "/api/setup", { secret, email: email2, password, name: "Smoke Two", role: "worker" }, false);
  check("second setup → 201", s2.status === 201, `got=${s2.status}`);
  const savedCookie = cookie;
  cookie = "";
  await sleep(2000);
  const si = await req("POST", "/api/auth/sign-in/email", { email: email2, password }, false);
  check("second sign-in → 200", si.status === 200, `got=${si.status}`);
  const t = await req("POST", `/api/actions/${action2Id}/transition`, { to: "Paused", reason: "x" });
  check("non-assignee non-admin transition → 403", t.status === 403, `got=${t.status}`);
  cookie = savedCookie;
}
console.log(`smoke: pass=${pass} fail=${fail} admin=${adminId ? "created" : "MISSING"}`);
process.exit(fail ? 1 : 0);
