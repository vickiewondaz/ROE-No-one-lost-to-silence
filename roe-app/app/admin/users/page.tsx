"use client";
// F14.02 Users depth: role edit, suspend/reactivate, group-lead assignment,
// invite revoke + resend. Never self-edit; never touch platform accounts.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Card, StatusPill, inputCls } from "@/components/ui";

interface Member {
  id: string;
  membershipId: string;
  name: string;
  role: string;
  status: string;
}
interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
}
interface JoinReq {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
}
interface Group {
  id: string;
  name: string;
}

const ROLES = ["worker", "group_leader", "member", "care"];

export default function AdminUsers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [joins, setJoins] = useState<JoinReq[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [leadFor, setLeadFor] = useState<Record<string, string>>({});

  async function refresh() {
    const [u, inv, g, jn] = await Promise.all([
      fetch("/api/users", { credentials: "same-origin" }),
      fetch("/api/invites", { credentials: "same-origin" }),
      fetch("/api/groups", { credentials: "same-origin" }),
      fetch("/api/join", { credentials: "same-origin" }),
    ]);
    if (u.status === 403) {
      setDenied(true);
      return;
    }
    const uj = u.ok ? await u.json() : null;
    const ij = inv.ok ? await inv.json() : null;
    const gj = g.ok ? await g.json() : null;
    const jnj = jn.ok ? await jn.json() : null;
    if (uj?.data) setMembers(uj.data as Member[]);
    if (ij?.data) setInvites(ij.data as Invite[]);
    if (gj?.data) setGroups(gj.data as Group[]);
    if (jnj?.data) setJoins(jnj.data as JoinReq[]);
  }

  useEffect(() => {
    refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patchMember(m: Member, patch: Record<string, string>) {
    setError("");
    try {
      const r = await fetch(`/api/users/${m.membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(patch),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        setError(j?.error ?? "Couldn't update.");
        return;
      }
      refresh();
    } catch {
      setError("Couldn't reach the server.");
    }
  }

  async function revokeInvite(id: string) {
    setError("");
    const r = await fetch(`/api/invites?id=${id}`, { method: "DELETE", credentials: "same-origin" });
    if (r.ok) refresh();
    else setError("Couldn't revoke it.");
  }

  async function assignLead(memberId: string, groupId: string) {
    if (!groupId) return;
    setError("");
    const r = await fetch(`/api/groups/${groupId}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ userId: memberId }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) setError(j?.error ?? "Couldn't assign.");
    else refresh();
  }

  async function decideJoin(id: string, approve: boolean, role = "member") {
    setError("");
    setNote("");
    try {
      const r = await fetch(`/api/join/${id}/${approve ? "approve" : "decline"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: approve ? JSON.stringify({ role }) : undefined,
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        setError(j?.error ?? "Couldn't decide it.");
        return;
      }
      if (approve && j?.data?.token) {
        const link = `${window.location.origin}/invite/${j.data.token}`;
        await navigator.clipboard?.writeText(link).catch(() => {});
        setNote(`Approved — invite link copied, send it via WhatsApp: ${link}`);
      }
      refresh();
    } catch {
      setError("Couldn't reach the server.");
    }
  }

  if (denied)
    return (
      <Shell title="Team" back="/admin" tab="more">
        <Card>
          <p className="font-medium">Restricted.</p>
          <p className="text-[13px] text-[#667370]">Only admins manage the team.</p>
        </Card>
      </Shell>
    );

  return (
    <Shell title="Team" back="/admin" tab="more">
      {error && (
        <p className="mb-2 rounded-lg bg-[#FEE2E2] p-2 text-[13px] font-medium text-[#991B1B]">
          {error}
        </p>
      )}
      {error && (
        <p className="mb-2 rounded-lg bg-[#FEE2E2] p-2 text-[13px] font-medium text-[#991B1B]">
          {error}
        </p>
      )}
      {note && (
        <div className="mb-2 rounded-lg bg-[#DCFCE7] p-2 text-[13px] text-[#15803D]">
          {note}
        </div>
      )}
      <h2 className="font-display text-[16px] font-semibold">Join requests</h2>
      <div className="mt-2 flex flex-col gap-2">
        {joins
          .filter((j) => j.status === "pending")
          .map((j) => (
            <Card key={j.id}>
              <p className="font-display font-semibold">{j.name}</p>
              <p className="font-mono2 text-[12px] text-[#667370]">{j.email}</p>
              {j.phone && <p className="text-[13px] text-[#667370]">{j.phone}</p>}
              {j.message && <p className="mt-1 text-[14px]">“{j.message}”</p>}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => decideJoin(j.id, true)}
                  className="tap-target flex-1 rounded-lg bg-[#0F766E] text-[14px] font-semibold text-white"
                >
                  Approve as member
                </button>
                <button
                  type="button"
                  onClick={() => decideJoin(j.id, false)}
                  className="tap-target flex-1 rounded-lg border border-[#E2E8E6] text-[14px] font-medium"
                >
                  Decline
                </button>
              </div>
            </Card>
          ))}
        {joins.filter((j) => j.status === "pending").length === 0 && (
          <Card>
            <p className="text-[14px] text-[#667370]">No pending requests.</p>
          </Card>
        )}
      </div>
      <h2 className="font-display mt-4 text-[16px] font-semibold">Members · {members.length}</h2>
      <div className="mt-2 flex flex-col gap-2">
        {members.map((m) => (
          <Card key={m.membershipId}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-display font-semibold">{m.name}</p>
              <StatusPill text={`${m.role}${m.status !== "active" ? " · suspended" : ""}`} />
            </div>
            <div className="mt-2 flex gap-2">
              <select
                className={`${inputCls} tap-target`}
                value={m.role}
                onChange={(e) => patchMember(m, { role: e.target.value })}
                aria-label={`Role for ${m.name}`}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  patchMember(m, { status: m.status === "active" ? "suspended" : "active" })
                }
                className="tap-target shrink-0 rounded-lg border border-[#E2E8E6] px-3 text-[13px] font-medium"
              >
                {m.status === "active" ? "Suspend" : "Restore"}
              </button>
            </div>
            {m.role === "group_leader" && (
              <div className="mt-2 flex gap-2">
                <select
                  className={`${inputCls} tap-target`}
                  value={leadFor[m.id] ?? ""}
                  onChange={(e) => setLeadFor({ ...leadFor, [m.id]: e.target.value })}
                  aria-label={`Group for ${m.name} to lead`}
                >
                  <option value="">Lead a group…</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => assignLead(m.id, leadFor[m.id] ?? "")}
                  className="tap-target shrink-0 rounded-lg bg-[#0F766E] px-3 text-[13px] font-semibold text-white"
                >
                  Add
                </button>
              </div>
            )}
          </Card>
        ))}
        {members.length === 0 && (
          <Card>
            <p className="text-[14px] text-[#667370]">No team members yet.</p>
          </Card>
        )}
      </div>
      <h2 className="font-display mt-4 text-[16px] font-semibold">Invitations</h2>
      <div className="mt-2 flex flex-col gap-2">
        {invites.map((i) => (
          <Card key={i.id}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{i.email}</p>
                <p className="text-[13px] text-[#667370]">
                  {i.role} · {i.status}
                </p>
              </div>
              {i.status === "pending" && (
                <button
                  type="button"
                  onClick={() => revokeInvite(i.id)}
                  className="tap-target shrink-0 rounded-lg border border-[#E2E8E6] px-3 text-[13px] font-medium"
                >
                  Revoke
                </button>
              )}
            </div>
          </Card>
        ))}
        {invites.length === 0 && (
          <Card>
            <p className="text-[14px] text-[#667370]">No invitations sent.</p>
          </Card>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Link
          href="/admin/invite"
          className="tap-target flex flex-1 items-center justify-center rounded-lg bg-[#0F766E] text-[15px] font-semibold text-white"
        >
          + Invite someone
        </Link>
        <Link
          href="/admin/audit"
          className="tap-target flex flex-1 items-center justify-center rounded-lg border border-[#E2E8E6] text-[14px] font-medium"
        >
          Audit log
        </Link>
      </div>
    </Shell>
  );
}
