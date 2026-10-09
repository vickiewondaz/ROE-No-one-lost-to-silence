// Better Auth — identity only (TRD §4). Authorisation lives in authz.ts.
// Lazy: safe to import at build time without DATABASE_URL (routes return 501).
import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db/client";
import { users, session, account, verification } from "./db/schema";

function createAuth() {
  if (!process.env.DATABASE_URL) return null;
  const db = getDb();
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET ?? "roe-pilot-secret-change-me",
    emailAndPassword: { enabled: true, requireEmailVerification: false },
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user: users, session, account, verification },
    }),
    advanced: { database: { generateId: () => randomUUID() } },
  });
}

const configured = createAuth();

// Build-safe stub: same call shape, throws only when actually used.
export const auth =
  configured ??
  ({
    api: {
      getSession: async () => null,
      signUpEmail: async () => {
        throw new Error("auth_not_configured");
      },
    },
  } as unknown as NonNullable<ReturnType<typeof createAuth>>);

export const authConfigured = configured !== null;
