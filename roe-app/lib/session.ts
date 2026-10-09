// Session → org/role resolution (server only). Single-org pilot: first active membership wins.
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { getDb } from "./db/client";
import { memberships, actions, organisations, platformAdmins } from "./db/schema";
import type { AuthCtx, Role } from "./authz";

export async function requireSession(): Promise<
  { ctx: AuthCtx } | { error: 401 | 403; message: string }
> {
  let userId: string | undefined;
  try {
    const session = (await auth.api.getSession({
      headers: await headers(),
    })) as { user?: { id: string } } | null;
    userId = session?.user?.id;
  } catch {
    return { error: 401, message: "Sign in required." };
  }
  if (!userId) return { error: 401, message: "Sign in required." };
  const db = getDb();
  const rows = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId));
  const m = rows.find((r) => r.status === "active") ?? rows[0];
  if (!m)
    return {
      error: 403,
      message: "No organisation — ask your administrator to invite you.",
    };
  const org = await db
    .select()
    .from(organisations)
    .where(eq(organisations.id, m.orgId))
    .limit(1);
  if (!org[0] || org[0].status !== "active")
    return {
      error: 403,
      message: "This organisation is suspended. Contact platform support.",
    };
  const assigned = await db
    .select({ personId: actions.personId })
    .from(actions)
    .where(eq(actions.assignee, userId))
    .catch(() => [] as { personId: string }[]);
  return {
    ctx: {
      userId,
      orgId: m.orgId,
      role: m.role as Role,
      assignedPersonIds: assigned.map((a) => a.personId),
    },
  };
}

export interface PlatformCtx {
  userId: string;
}

// Platform gate: super-admin only. No org context by design — platform powers
// never leak into org views, and platform screens never show member data.
export async function requirePlatform(): Promise<
  { ctx: PlatformCtx } | { error: 401 | 403; message: string }
> {
  let userId: string | undefined;
  try {
    const session = (await auth.api.getSession({
      headers: await headers(),
    })) as { user?: { id: string } } | null;
    userId = session?.user?.id;
  } catch {
    return { error: 401, message: "Sign in required." };
  }
  if (!userId) return { error: 401, message: "Sign in required." };
  const rows = await getDb()
    .select()
    .from(platformAdmins)
    .where(eq(platformAdmins.userId, userId))
    .limit(1);
  if (!rows[0]) return { error: 403, message: "Platform only." };
  return { ctx: { userId } };
}
