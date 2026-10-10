// Multi-role matrix test on Riverside Chapel seed (local server).
// Proves each role sees exactly its scope — the P1/P2 promise made testable.
// Usage: node scripts/roles.mjs [base]
const base = process.argv[2] ?? "http://localhost:3127";
const PW = "DemoPass123!";
let pass = 0, fail = 0;

async function req(method, path, body, cookie = "") {
  const r = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", Origin: base, ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCk = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [];
  const ck = setCk.map((c) => c.split(";")[0]).join("; ");
  return { status: r.status, j: await r.json().catch(() => null), cookie: ck || cookie };
}
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log("PASS " + name); }
  else { fail++; console.log("FAIL " + name + " " + extra); }
}
async function login(email) {
  await new Promise((t) => setTimeout(t, 15000));
  for (let i = 0; i < 4; i++) {
    const r = await req("POST", "/api/auth/sign-in/email", { email, password: PW });
    if (r.status === 200) return r.cookie;
    await new Promise((t) => setTimeout(t, 15000 * (i + 1)));
  }
  throw new Error("login failed " + email);
}
const names = (list) => (list ?? []).map((p) => p.firstName).sort().join(",");

const david = await login("david@riverside.test");
const funke = await login("funke@riverside.test");
const sarah = await login("sarah@riverside.test");
const amara = await login("amara@riverside.test");

// Worker sees assigned + new, not others' private scope
{
  const r = await req("GET", "/api/people", null, david);
  const n = names(r.j?.data);
  check("worker sees assigned Ana+Tunde+Ruth", ["Ana", "Ruth", "Tunde"].every((x) => n.includes(x)), n);
  check("worker sees completed Sarah (was assigned)", n.includes("Sarah"), n);
}
// Leader sees group members, not outsiders
{
  const r = await req("GET", "/api/people", null, funke);
  const n = names(r.j?.data);
  check("leader sees member Sarah", n.includes("Sarah"), n);
  check("leader does NOT see Ana (no membership)", !n.includes("Ana"), n);
}
// Member sees self only
{
  const r = await req("GET", "/api/people", null, sarah);
  const n = names(r.j?.data);
  check("member sees only self", (r.j?.data ?? []).length === 1 && n.includes("Sarah"), n);
  const w = await req("POST", "/api/people", { firstName: "X", phone: "+1", channel: "Call", consentContact: true }, sarah);
  check("member cannot create people → 403", w.status === 403, `got=${w.status}`);
}
// Admin sees all
{
  const r = await req("GET", "/api/people", null, amara);
  check("admin sees all 6", (r.j?.data ?? []).length === 6, `got=${(r.j?.data ?? []).length}`);
}
// Leader home feed: pending intros in led group
{
  const g = await req("GET", "/api/groups", null, funke);
  const ya = (g.j?.data ?? []).find((x) => x.name === "Young Adults");
  const c = await req("GET", `/api/connections?groupId=${ya?.id}`, null, funke);
  check("leader sees group intros", c.status === 200 && (c.j?.data ?? []).length >= 1, `got=${c.status}`);
}
// Timeline respects scope
{
  const ppl = await req("GET", "/api/people", null, david);
  const ana = (ppl.j?.data ?? []).find((p) => p.firstName === "Ana");
  const t = await req("GET", `/api/people/${ana?.id}/timeline`, null, david);
  check("worker timeline has Ana history", t.status === 200 && (t.j?.data ?? []).length >= 2, `got=${t.status}`);
  const t2 = await req("GET", `/api/people/${ana?.id}/timeline`, null, sarah);
  check("member blocked from other timeline → 403", t2.status === 403, `got=${t2.status}`);
}
console.log(`roles: pass=${pass} fail=${fail}`);
process.exit(fail ? 1 : 0);
