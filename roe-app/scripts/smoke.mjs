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
  const gl = await req("GET", "/api/groups");
  const anyGroupId = ((gl.j?.data ?? []).find((g) => g.name === "Young Adults") ?? (gl.j?.data ?? [])[0])?.id ?? "";
  // NOTE: seeded fixture ids (4444…/9999…) are valid Postgres uuid but not
  // RFC-4122 variants, so zod .uuid() rejects them on write paths. Reads list
  // them fine; writes below use a freshly created group (proper uuid).
  const sg = await req("POST", "/api/connections", { personId: newId, groupId: anyGroupId });
  check("unassigned worker suggest → 403", sg.status === 403, `got=${sg.status}`);
  cookie = savedCookie;
}
// Connections flow (admin cookie active)
let yaGroupId = "", connId = "", conn2Id = "", testGroupId = "";
{
  const r = await req("GET", "/api/groups");
  const list = r.j?.data ?? [];
  yaGroupId = (list.find((g) => g.name === "Young Adults") ?? list[0])?.id ?? "";
  check("groups list → Young Adults", r.status === 200 && !!yaGroupId, `got=${r.status}`);
}
{
  const r = await req("POST", "/api/groups", { name: "Test Choir" });
  check("group create (admin) → 201", r.status === 201, `got=${r.status}`);
  testGroupId = r.j?.data?.id ?? "";
}
{
  const r = await req("POST", "/api/connections", { personId: newId, groupId: testGroupId });
  check("suggest → 201", r.status === 201 && !!r.j?.data?.id, `got=${r.status}`);
  connId = r.j?.data?.id ?? "";
}
{
  const r = await req("POST", `/api/connections/${connId}/introduce`);
  check("introduce → 200", r.status === 200, `got=${r.status}`);
}
{
  const r = await req("POST", `/api/connections/${connId}/introduce`);
  check("re-introduce → 422", r.status === 422, `got=${r.status}`);
}
{
  const r = await req("POST", `/api/connections/${connId}/outcome`, { result: "not-attended" });
  check("outcome not-attended → 200", r.status === 200, `got=${r.status}`);
}
{
  const r = await req("POST", `/api/connections/${connId}/confirm`);
  check("confirm w/o attendance → 422", r.status === 422, `got=${r.status}`);
}
{
  const s = await req("POST", "/api/connections", { personId: newId, groupId: yaGroupId });
  conn2Id = s.j?.data?.id ?? "";
  await req("POST", `/api/connections/${conn2Id}/introduce`);
  const o = await req("POST", `/api/connections/${conn2Id}/outcome`, { result: "attended", notes: "warm welcome" });
  check("outcome attended → 200", o.status === 200, `got=${o.status}`);
  const c = await req("POST", `/api/connections/${conn2Id}/confirm`);
  check("confirm attended → 200", c.status === 200, `got=${c.status}`);
}
{
  const r = await req("GET", `/api/connections?personId=${newId}`);
  check("connection list has confirmed", r.status === 200 && (r.j?.data ?? []).some((c) => c.status === "Confirmed"), `got=${r.status}`);
}
// Password change (admin)
{
  const r = await req("POST", "/api/auth/change-password", { currentPassword: "WrongPass000!", newPassword: "NewSmokePass456!" });
  check("wrong current → 4xx", r.status >= 400 && r.status < 500, `got=${r.status}`);
}
{
  const r = await req("POST", "/api/auth/change-password", { currentPassword: password, newPassword: "NewSmokePass456!" });
  check("change password → 200", r.status === 200, `got=${r.status}`);
}
{
  cookie = "";
  await sleep(2000);
  const bad = await req("POST", "/api/auth/sign-in/email", { email, password }, false);
  check("old password dead → 4xx", bad.status >= 400, `got=${bad.status}`);
  await sleep(2000);
  const good = await req("POST", "/api/auth/sign-in/email", { email, password: "NewSmokePass456!" }, false);
  check("new password works → 200", good.status === 200, `got=${good.status}`);
}
import { execFileSync } from "node:child_process";

// Platform round-trip (local DB owner via grant script)
{
  const m0 = await req("GET", "/api/platform/me");
  check("non-super platform/me → false", m0.status === 200 && m0.j?.data?.isSuperAdmin === false, `got=${m0.status}`);
  const g0 = await req("GET", "/api/platform/orgs");
  check("non-super orgs → 403", g0.status === 403, `got=${g0.status}`);
  execFileSync("node", ["scripts/grant-superadmin.mjs", email], { stdio: "ignore" });
  const m1 = await req("GET", "/api/platform/me");
  check("granted platform/me → true", m1.status === 200 && m1.j?.data?.isSuperAdmin === true, `got=${m1.status}`);
}
let newOrgId = "";
{
  const slug = `smoke-church-${Date.now()}`;
  const r = await req("POST", "/api/platform/orgs", { name: "Smoke Church", slug });
  check("org create → 201", r.status === 201 && !!r.j?.data?.id, `got=${r.status}`);
  newOrgId = r.j?.data?.id ?? "";
}
let orgAdminToken = "";
const orgEmail = `orgadmin-${Date.now()}@grace-pilot.test`;
{
  const r = await req("POST", `/api/platform/orgs/${newOrgId}/admins`, { email: orgEmail });
  check("first-admin invite → 201", r.status === 201 && !!r.j?.data?.token, `got=${r.status}`);
  orgAdminToken = r.j?.data?.token ?? "";
}
{
  const r = await req("POST", `/api/invites/${orgAdminToken}`, { name: "Org Admin", password }, false);
  check("accept admin invite → 201 admin", r.status === 201 && r.j?.data?.role === "admin", `got=${r.status}`);
}
let orgCookie = "";
{
  cookie = "";
  await sleep(2000);
  const si = await req("POST", "/api/auth/sign-in/email", { email: orgEmail, password }, false);
  check("org admin sign-in → 200", si.status === 200, `got=${si.status}`);
  orgCookie = cookie;
  const me = await req("GET", "/api/me");
  check("org admin me → own org", me.status === 200 && me.j?.data?.orgId === newOrgId, `got=${me.status}`);
}
{
  // Suspend gate: org API dies for members, platform untouched, then restore.
  cookie = "";
  await sleep(2000);
  await req("POST", "/api/auth/sign-in/email", { email, password: "NewSmokePass456!" }, false);
  const s = await req("POST", `/api/platform/orgs/${newOrgId}/suspend`, { suspended: true });
  check("suspend → 200", s.status === 200, `got=${s.status}`);
  cookie = orgCookie;
  const blocked = await req("GET", "/api/me");
  check("suspended org me → 403", blocked.status === 403, `got=${blocked.status}`);
  // Fresh invite on suspended org (super can still administer) → accept blocked.
  cookie = "";
  await sleep(2000);
  await req("POST", "/api/auth/sign-in/email", { email, password: "NewSmokePass456!" }, false);
  const inv4 = await req("POST", `/api/platform/orgs/${newOrgId}/admins`, { email: `late-${Date.now()}@t.co` });
  const lateToken = inv4.j?.data?.token ?? "";
  check("invite on suspended org → 201 (administering still works)", inv4.status === 201, `got=${inv4.status}`);
  const late = await req("POST", `/api/invites/${lateToken}`, { name: "Late", password }, false);
  check("accept into suspended org → 403", late.status === 403, `got=${late.status}`);
  const re = await req("POST", `/api/platform/orgs/${newOrgId}/suspend`, { suspended: false });
  check("reactivate → 200", re.status === 200, `got=${re.status}`);
  cookie = orgCookie;
  const back = await req("GET", "/api/me");
  check("reactivated org me → 200", back.status === 200, `got=${back.status}`);
}
console.log(`smoke: pass=${pass} fail=${fail} admin=${adminId ? "created" : "MISSING"}`);
process.exit(fail ? 1 : 0);
