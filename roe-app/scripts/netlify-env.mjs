// One-time: push env vars to linked Netlify site (production context).
// Values travel via argv (CLI stdin mode is broken in v27); never printed.
// Prints ONLY key names + the fresh SETUP_SECRET (needed for handover curl).
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const local = {};
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) local[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const freshSetup = randomBytes(32).toString("hex");
const freshAuth = randomBytes(32).toString("hex");

const vars = {
  DATABASE_URL: local.DATABASE_URL,
  DATABASE_URL_UNPOOLED: local.DATABASE_URL_UNPOOLED,
  NEON_BRANCH: local.NEON_BRANCH,
  BETTER_AUTH_SECRET: freshAuth,
  ALLOW_SETUP: "true",
  SETUP_SECRET: freshSetup,
};
const run = (args) =>
  execFileSync("netlify", args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
for (const [k, v] of Object.entries(vars)) {
  if (!v) throw new Error(`missing value for ${k}`);
  run(["env:set", k, v, "-c", "production"]);
  console.log(`env ${k}: production set`);
}
console.log(`HANDOVER_SETUP_SECRET=${freshSetup}`);
