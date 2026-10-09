// Pilot DB bootstrap + RLS verification for Neon (idempotent).
// Usage: node scripts/neon-migrate.mjs
// Reads .env.local itself (DATABASE_URL_UNPOOLED). Prints counts/booleans only — never secrets.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const env = {};
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
  }
  return env;
}

const env = loadEnv();
const url = env.DATABASE_URL_UNPOOLED;
if (!url) throw new Error("DATABASE_URL_UNPOOLED missing in .env.local");
const sql = postgres(url, { ssl: "require", max: 1 });

async function runFile(path) {
  const text = readFileSync(join(root, path), "utf8");
  const strip = (s) =>
    s
      .split("\n")
      .filter((l) => !l.trim().startsWith("--"))
      .join("\n")
      .trim();
  // Split on drizzle breakpoints BEFORE stripping (marker lines start with --);
  // plain-; files are stripped first so ;-in-comments can't fragment statements.
  const chunks = text.includes("--> statement-breakpoint")
    ? text.split("--> statement-breakpoint").map(strip).filter(Boolean)
    : strip(text).split(";").map((s) => s.trim()).filter(Boolean);
  let ok = 0, skipped = 0;
  for (const s of chunks) {
    try {
      await sql.unsafe(s);
      ok++;
    } catch (e) {
      const msg = String(e.message ?? e);
      if (/already exists|duplicate/i.test(msg)) skipped++;
      else throw new Error(`${path}: ${msg.slice(0, 200)}`);
    }
  }
  console.log(`${path}: applied=${ok} already-present=${skipped}`);
}

const ORGA = "11111111-1111-1111-1111-111111111111";
const ORGB = "99999999-9999-9999-9999-999999999999";

// 1. Migrate
await runFile("drizzle/0000_worried_the_enforcers.sql");
await runFile("drizzle/0001_init.sql");
await runFile("drizzle/seed.sql");

// 2. Least-privilege role for negative tests (no password; reached via SET ROLE)
await sql.unsafe(`DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN;
  END IF;
END $$;`);
const [me] = await sql`SELECT session_user AS u`;
await sql.unsafe(`GRANT app_user TO "${me.u}"`);
await sql.unsafe(`GRANT USAGE ON SCHEMA public TO app_user`);
await sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user`);
await sql.unsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user`);
console.log("role app_user: ready");

// 3. Fixtures (owner conn; fixed ids; conflict-safe)
await sql.unsafe(`INSERT INTO people (id, org_id, first_name, last_name, phone, channel, sensitivity)
  VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '${ORGB}', 'Intruder', 'Fixture', '+0000000000', 'Call', 'personal')
  ON CONFLICT (id) DO NOTHING`);
await sql.unsafe(`INSERT INTO people (id, org_id, first_name, last_name, phone, channel, sensitivity)
  VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', '${ORGA}', 'Care', 'Fixture', '+0000000001', 'Call', 'restricted')
  ON CONFLICT (id) DO NOTHING`);
console.log("fixtures: ready");

// 4. Verify: tables + RLS + policies + seed counts
const [tables] = await sql`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`;
const [rls] = await sql`SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity`;
const [pols] = await sql`SELECT count(*)::int AS n FROM pg_policies WHERE schemaname='public'`;
const [orgs] = await sql`SELECT count(*)::int AS n FROM organisations WHERE id=${ORGA}::uuid`;
const [users] = await sql`SELECT count(*)::int AS n FROM users`;
const [groups] = await sql`SELECT count(*)::int AS n FROM groups`;
console.log(`verify: tables=${tables.n} rls_enabled=${rls.n} policies=${pols.n} seed_org=${orgs.n} users=${users.n} groups=${groups.n}`);

// 5. Negatives through app_user (owner bypass does NOT apply after SET ROLE)
const conn = await sql.reserve();
try {
  // A. no context → 0 rows
  await conn`SET ROLE app_user`;
  const [a] = await conn`SELECT count(*)::int AS n FROM people`;
  console.log(`negative A (no context sees 0): ${a.n === 0 ? "PASS" : "FAIL got=" + a.n}`);

  // B. OrgA worker context → OrgB fixture invisible
  await conn`SELECT set_config('app.org_id', ${ORGA}, false)`;
  await conn`SELECT set_config('app.role', 'worker', false)`;
  const [b] = await conn`SELECT count(*)::int AS n FROM people WHERE org_id=${ORGB}::uuid`;
  console.log(`negative B (cross-org sees 0): ${b.n === 0 ? "PASS" : "FAIL got=" + b.n}`);

  // C. worker → restricted invisible; care → visible (assignment checked app-side in authz.ts)
  const [c1] = await conn`SELECT count(*)::int AS n FROM people WHERE sensitivity='restricted'`;
  await conn`SELECT set_config('app.role', 'care', false)`;
  const [c2] = await conn`SELECT count(*)::int AS n FROM people WHERE sensitivity='restricted'`;
  console.log(`negative C (worker restricted 0 / care visible): ${c1.n === 0 && c2.n >= 1 ? "PASS" : "FAIL worker=" + c1.n + " care=" + c2.n}`);
} finally {
  await conn`RESET ROLE`;
  conn.release();
}
// D. forged org_id in body: enforced in code — API/server actions take org from session only (authz.ts + route contract). Covered by code review + TRD §11 test plan; no client org_id is trusted.
console.log("negative D (client org_id never trusted): enforced in authz.ts/route contract — see TRD §11");

await sql.end();
console.log("done");
