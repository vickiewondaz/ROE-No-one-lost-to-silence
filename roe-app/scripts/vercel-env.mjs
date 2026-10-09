// One-time: push env vars to the linked Vercel project (stdin, never argv).
// Prints ONLY key names + the fresh SETUP_SECRET (needed for handover curl).
// BETTER_AUTH_SECRET is generated fresh and never printed.
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
for (const [k, v] of Object.entries(vars)) {
  if (!v) throw new Error(`missing value for ${k}`);
  for (const e of ["production", "preview"]) {
    execFileSync("vercel", ["env", "add", k, e], {
      input: v,
      cwd: root,
      stdio: ["pipe", "pipe", "pipe"],
    });
  }
  console.log(`env ${k}: production+preview set`);
}
console.log(`HANDOVER_SETUP_SECRET=${freshSetup}`);
