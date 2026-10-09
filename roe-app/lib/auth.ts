// Better Auth — identity only (TRD §4). Authorisation lives in authz.ts.
// Pilot: email+password + organisation membership. No DB hit at build.
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? "roe-pilot-secret-change-me",
  emailAndPassword: { enabled: true, requireEmailVerification: false },
});

export type Session = {
  userId: string;
  orgId: string;
  role: string;
} | null;
