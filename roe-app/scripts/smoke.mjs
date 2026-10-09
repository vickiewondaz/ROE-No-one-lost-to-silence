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
console.log(`smoke: pass=${pass} fail=${fail} admin=${adminId ? "created" : "MISSING"}`);
process.exit(fail ? 1 : 0);
