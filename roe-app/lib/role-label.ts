// Human role names — never show raw enum strings ("group_leader") to users.
export const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  worker: "Follow-up team",
  group_leader: "Group leader",
  member: "Member",
  care: "Care team",
  senior: "Senior leader",
};

export function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
}
