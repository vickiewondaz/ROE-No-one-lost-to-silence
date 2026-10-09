// ROE authorisation layer — deny-by-default (TRD §5, PRD App. B).
// Pure function: no DB, no I/O. Every protected route MUST call this
// server-side. UI hiding is never enforcement.

export type Role =
  | "admin"
  | "worker"
  | "group_leader"
  | "member"
  | "care"
  | "senior";

export interface RecordCtx {
  orgId: string;
  assignee?: string;
  groupId?: string;
  sensitivity?: "personal" | "restricted";
  ownerId?: string;
}

export interface AuthCtx {
  userId: string;
  orgId: string;
  role: Role;
  /** person ids assigned to caller, group ids they lead, own person id */
  assignedPersonIds?: string[];
  ledGroupIds?: string[];
  ownPersonId?: string;
}

export type Op =
  | "people:create"
  | "people:read"
  | "people:update"
  | "actions:create"
  | "actions:transition"
  | "interactions:create"
  | "connections:write"
  | "notifications:read"
  | "care:read";

export function can(
  auth: AuthCtx,
  op: Op,
  rec?: RecordCtx & { personId?: string }
): boolean {
  // 1. cross-org → always deny (TRD Ex. A)
  if (rec && rec.orgId !== auth.orgId) return false;

  // 2. restricted care → only explicitly assigned care role (TRD Ex. C)
  if (rec?.sensitivity === "restricted") {
    if (op === "care:read" && auth.role === "care") {
      return !!(
        rec.personId && auth.assignedPersonIds?.includes(rec.personId)
      );
    }
    if (auth.role === "member" && rec.ownerId === auth.ownPersonId) return true;
    return false;
  }

  const assigned =
    !!rec?.personId && !!auth.assignedPersonIds?.includes(rec.personId);
  const inLedGroup =
    !!rec?.groupId && !!auth.ledGroupIds?.includes(rec.groupId);
  const own = !!rec?.ownerId && rec.ownerId === auth.ownPersonId;

  switch (op) {
    case "people:create":
      return ["admin", "worker", "group_leader", "care"].includes(auth.role);
    case "people:read":
      if (auth.role === "admin" || auth.role === "senior") return true;
      if (auth.role === "member") return own;
      return assigned || inLedGroup;
    case "people:update":
      if (auth.role === "member") return own;
      return assigned || inLedGroup || auth.role === "admin";
    case "actions:create":
      return ["admin", "worker", "group_leader"].includes(auth.role);
    case "actions:transition":
      return ["admin", "worker", "group_leader"].includes(auth.role);
    case "interactions:create":
      if (auth.role === "member") return false;
      return assigned || inLedGroup || auth.role === "admin";
    case "connections:write":
      return (
        auth.role === "worker" ||
        auth.role === "group_leader" ||
        auth.role === "admin"
      );
    case "notifications:read":
      return own || auth.userId === rec?.ownerId;
    case "care:read":
      return false; // MVP: denied unless §restricted branch above (P1)
    default:
      return false;
  }
}

// Action state machine (TRD §17) — server-side only.
export type ActionStatus = "Open" | "In Progress" | "Completed" | "Paused";
export function canTransition(
  from: ActionStatus,
  to: ActionStatus,
  opts?: { hasOutcome?: boolean }
): boolean {
  if (from === "Open" && to === "In Progress") return true;
  if (from === "In Progress" && to === "Completed")
    return !!opts?.hasOutcome;
  if ((from === "Open" || from === "In Progress") && to === "Paused")
    return true;
  if (from === "Paused" && to === "In Progress") return true;
  return false;
}
