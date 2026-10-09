// Better Auth — identity only (TRD §4). Authorisation lives in authz.ts.
// Lazy init: importing this module NEVER connects. First use builds the
// instance; missing/invalid DATABASE_URL yields null (routes answer 501).
// This keeps `next build` green with or without env configured.
import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { toNextJsHandler } from "better-auth/next-js";
import { getDb } from "./db/client";
import { users, session, account, verification } from "./db/schema";

type Instance =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any;
let instance: Instance = null;
let attempted = false;

function getInstance(): Instance | null {
  if (!attempted) {
    attempted = true;
    try {
      if (!process.env.DATABASE_URL) return null;
      const db = getDb(); // throws on invalid URL → caught below
      instance = betterAuth({
        secret: process.env.BETTER_AUTH_SECRET ?? "roe-pilot-secret-change-me",
        emailAndPassword: { enabled: true, requireEmailVerification: false },
        database: drizzleAdapter(db, {
          provider: "pg",
          schema: { user: users, session, account, verification },
        }),
        advanced: { database: { generateId: () => randomUUID() } },
      });
    } catch {
      instance = null;
    }
  }
  return instance;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any[];

export const auth = {
  api: {
    getSession: (...args: AnyArgs) => {
      const i = getInstance();
      if (!i) return Promise.resolve(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (i.api.getSession as any)(...args);
    },
    signUpEmail: (...args: AnyArgs) => {
      const i = getInstance();
      if (!i) return Promise.reject(new Error("auth_not_configured"));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (i.api.signUpEmail as any)(...args);
    },
  },
};

export function getAuthHandler() {
  const i = getInstance();
  return i ? toNextJsHandler(i) : null;
}

export const authConfigured = !!process.env.DATABASE_URL;
