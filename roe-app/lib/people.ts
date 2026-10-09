// Person DTO: derived journey + context (server only, run inside RLS tx).
// Journey is derived from activity (PRD v1.1) — never a stored status.
import { desc, eq } from "drizzle-orm";
import { actions, connections, groups, groupMemberships, interactions, users } from "./db/schema";

export type Journey = "New" | "Assigned" | "Contacted" | "Connecting" | "Connected";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbTx = any;

export async function personDTO(
  tx: DbTx,
  p: {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string;
    channel: "Call" | "WhatsApp" | "Visit" | "Other";
    interests: string | null;
  }
) {
  const acts = await tx
    .select()
    .from(actions)
    .where(eq(actions.personId, p.id))
    .orderBy(desc(actions.dueAt));
  const inter = await tx
    .select()
    .from(interactions)
    .where(eq(interactions.personId, p.id))
    .orderBy(desc(interactions.date))
    .limit(1);
  const conns = await tx
    .select()
    .from(connections)
    .where(eq(connections.personId, p.id));
  const mems = await tx
    .select({ name: groups.name })
    .from(groupMemberships)
    .innerJoin(groups, eq(groups.id, groupMemberships.groupId))
    .where(eq(groupMemberships.personId, p.id))
    .limit(1);

  const open = acts.find((a: { status: string }) => a.status !== "Completed");
  const confirmed = conns.some(
    (c: { status: string }) => c.status === "Confirmed"
  );
  const suggested = conns.length > 0;
  let journey: Journey = "New";
  if (confirmed) journey = "Connected";
  else if (suggested) journey = "Connecting";
  else if (inter.length > 0) journey = "Contacted";
  else if (open) journey = "Assigned";

  let assignee = "Unassigned";
  if (open) {
    const u = await tx
      .select()
      .from(users)
      .where(eq(users.id, open.assignee))
      .limit(1);
    assignee = u[0]?.name ?? "Assigned worker";
  }
  return {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName ?? "",
    phone: p.phone,
    channel: p.channel,
    interests: p.interests ?? "",
    journey,
    assignee,
    nextAction: open ? open.type : journey === "New" ? "Assign follow-up" : "Set next action",
    lastContact: inter[0]
      ? `${new Date(inter[0].date).toLocaleDateString()} via ${inter[0].channel}`
      : undefined,
    group: mems[0]?.name,
  };
}
