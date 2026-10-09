// Lazy DB client — never connects at build time.
// Called only inside API routes / Server Actions at request time.
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let cached: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
  if (cached) return cached;
  const client = postgres(url, { prepare: false });
  cached = drizzle(client, { schema });
  return cached;
}

// Per-transaction tenant context for RLS (TRD §19).
// Usage: await sql`SELECT set_config('app.org_id', ${orgId}, true)`.
export const RLS_CONTEXT_SQL = `-- set per transaction from server session only
-- SELECT set_config('app.org_id', $1, true);
-- SELECT set_config('app.user_id', $2, true);`;
