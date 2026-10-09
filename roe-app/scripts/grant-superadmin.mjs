// One-time super-admin grant (or revoke). Owner-connection, local only.
// Usage: node scripts/grant-superadmin.mjs <email> [--revoke]
// Prints counts only. The FIRST grant bootstraps the platform tier.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const email = (process.argv[2] ?? "").toLowerCase();
const revoke = process.argv.includes("--revoke");
if (!email || !email.includes("@")) throw new Error("usage: grant-superadmin.mjs <email> [--revoke]");

const env = {};
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const { default: postgres } = await import("postgres");
const sql = postgres(env.DATABASE_URL_UNPOOLED, { ssl: "require", max: 1 });
const users = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
if (!users[0]) throw new Error("no such user: " + email);
if (revoke) {
  const d = await sql`DELETE FROM platform_admins WHERE user_id = ${users[0].id}`;
  console.log("revoked super-admin for " + email + " (rows=" + d.count + ")");
} else {
  await sql`INSERT INTO platform_admins (user_id, granted_by) VALUES (${users[0].id}, ${users[0].id}) ON CONFLICT (user_id) DO NOTHING`;
  console.log("granted super-admin: " + email);
}
await sql.end();
