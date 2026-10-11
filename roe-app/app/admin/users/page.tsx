"use client";
// F14.02 Users depth: role edit, suspend/reactivate, group-lead assignment,
// invite revoke + resend. Never self-edit; never touch platform accounts.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Card, StatusPill, inputCls } from "@/components/ui";
import { roleLabel } from "@/lib/role-label";

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
  const [leads, setLeads] = useState<Record<string, string[]>>({});
  const [loaded, setLoaded] = useState(false);
  const [approvedLink, setApprovedLink] = useState("");
  const [confirming, setConfirming] = useState<
    null | { action: "suspend" | "restore"; member: Member } | { action: "revoke"; id: string; name: string }
  >(null);

  async function refresh() {
    try {
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
    setLoaded(true);
    if (gj?.data) {
      const gl = gj.data as Group[];
      setGroups(gl);
      // Current leads per group (so removals are possible, not just adds).
      const entries = await Promise.all(
        gl.map(async (gr) => {
          try {
            const r = await fetch(`/api/groups/${gr.id}/leads`, { credentials: "same-origin" });
            const j = await r.json().catch(() => null);
            return [gr.id, Array.isArray(j?.data) ? (j.data as { userId: string }[]).map((l) => l.userId) : []] as const;
          } catch {
            return [gr.id, []] as const;
          }
        })
      );
      setLeads(Object.fromEntries(entries));
    }
    if (jnj?.data) setJoins(jnj.data as JoinReq[]);
    } finally {
      setLoaded(true);
    }
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
      setConfirming(null);
      refresh();
    } catch {
      setError("Couldn't reach the server.");
    }
  }

  async function revokeInvite(id: string) {
    setError("");
    setConfirming(null);
    const r = await fetch(`/api/invites?id=${id}`, { method: "DELETE", credentials: "same-origin" });
    if (r.ok) refresh();
    else setError("Couldn't revoke it.");
  }

  async function removeLead(memberId: string, groupId: string) {
    setError("");
    try {
      const r = await fetch(`/api/groups/${groupId}/leads`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ userId: memberId }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) setError(j?.error ?? "Couldn't remove.");
      else refresh();
    } catch {
      setError("Couldn't reach the server.");
    }
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

  const [joinEmail, setJoinEmail] = useState<Record<string, string>>({});

  async function decideJoin(id: string, approve: boolean, role = "member") {
    setError("");
    setNote("");
    const email = (joinEmail[id] ?? "").trim();
    if (approve && !joins.find((j) => j.id === id)?.email && !/.+@.+\..+/.test(email)) {
      setError("This request has no email — type one below to approve, or ask them on WhatsApp first.");
      return;
    }
    try {
      const r = await fetch(`/api/join/${id}/${approve ? "approve" : "decline"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: approve ? JSON.stringify(email ? { role, email } : { role }) : undefined,
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        setError(j?.error ?? "Couldn't decide it.");
        return;
      }
      if (approve && j?.data?.token) {
        const link = `${window.location.origin}/invite/${j.data.token}`;
        await navigator.clipboard?.writeText(link).catch(() => {});
        setApprovedLink(link);
        setNote("Approved — invite link copied. Send it to them on WhatsApp below.");
      } else {
        setApprovedLink("");
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
          <p className="text-[13px] text-[#6B7280]">Only admins manage the team.</p>
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
      {confirming && (
        <div className="mb-2 rounded-xl border border-[#D97706]/50 bg-[#FFFBEB] p-3">
          <p className="text-[14px] font-semibold">
            {confirming.action === "suspend" && `Suspend ${confirming.member.name}? They lose access immediately.`}
            {confirming.action === "restore" && `Restore ${confirming.member.name}? They sign in again right away.`}
            {confirming.action === "revoke" && `Revoke the invite to ${confirming.name}? They won't be able to use that link.`}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="tap-target flex-1 rounded-lg border border-[#E5E7EB] bg-white text-[14px] font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirming.action === "revoke") revokeInvite(confirming.id);
                else
                  patchMember(confirming.member, {
                    status: confirming.action === "suspend" ? "suspended" : "active",
                  });
              }}
              className="tap-target flex-1 rounded-lg bg-[#0D9488] text-[14px] font-semibold text-white"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
      {note && (
        <div className="mb-2 rounded-lg bg-[#DCFCE7] p-2 text-[13px] text-[#15803D]">
          {note}
        </div>
      )}
      {approvedLink && (
        <Card>
          <p className="font-display text-[14px] font-semibold">Invite link ready — valid 7 days, one use.</p>
          <p className="font-mono2 mt-1 truncate text-[12px] text-[#6B7280]">
            {approvedLink.slice(0, 40)}…{approvedLink.slice(-8)}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(approvedLink).catch(() => {})}
              className="tap-target flex-1 rounded-lg border border-[#E5E7EB] text-[14px] font-medium"
            >
              Copy link
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`You're invited — activate your account here: ${approvedLink}`)}`}
              target="_blank"
              rel="noreferrer"
              className="tap-target flex-1 rounded-lg bg-[#0D9488] py-2 text-center text-[14px] font-semibold text-white"
            >
              Send via WhatsApp
            </a>
          </div>
        </Card>
      )}
      <h2 className="font-display mt-4 text-[16px] font-semibold">
        Join requests · {joins.filter((j) => j.status === "pending").length} waiting
      </h2>
      <div className="mt-2 flex flex-col gap-2">
        {joins
          .filter((j) => j.status === "pending")
          .map((j) => (
            <Card key={j.id}>
              <p className="font-display font-semibold">{j.name}</p>
              {j.phone && (
                <p className="text-[14px]">
                  <a href={`https://wa.me/${j.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="font-medium text-[#0D9488]">
                    {j.phone} — WhatsApp →
                  </a>
                </p>
              )}
              {j.email ? (
                <p className="font-mono2 text-[12px] text-[#6B7280]">{j.email}</p>
              ) : (
                <div className="mt-1.5">
                  <p className="text-[12px] text-[#6B7280]">No email — needed to approve. Ask on WhatsApp, or type it:</p>
                  <input
                    value={joinEmail[j.id] ?? ""}
                    onChange={(e) => setJoinEmail((m) => ({ ...m, [j.id]: e.target.value }))}
                    placeholder="name@example.org"
                    type="email"
                    aria-label={`Email for ${j.name}`}
                    className="tap-target mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] outline-none focus:border-[#0D9488]"
                  />
                </div>
              )}
              {j.message && <p className="mt-1 text-[14px]">“{j.message}”</p>}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => decideJoin(j.id, true)}
                  className="tap-target flex-1 rounded-lg bg-[#0D9488] text-[14px] font-semibold text-white"
                >
                  Approve as member
                </button>
                <button
                  type="button"
                  onClick={() => decideJoin(j.id, false)}
                  className="tap-target flex-1 rounded-lg border border-[#E5E7EB] text-[14px] font-medium"
                >
                  Decline
                </button>
              </div>
            </Card>
          ))}
        {!loaded && (
          <Card>
            <p className="text-[14px] text-[#6B7280]">Loading team…</p>
          </Card>
        )}
        {loaded && joins.filter((j) => j.status === "pending").length === 0 && (
          <Card>
            <p className="text-[14px] text-[#6B7280]">No pending requests.</p>
          </Card>
        )}
        {joins.some((j) => j.status !== "pending") && (
          <details className="mt-2">
            <summary className="cursor-pointer text-[14px] font-medium text-[#0D9488]">
              Decided ({joins.filter((j) => j.status !== "pending").length}) — tap to review
            </summary>
            <div className="mt-2 flex flex-col gap-1.5">
              {joins
                .filter((j) => j.status !== "pending")
                .map((j) => (
                  <Card key={j.id}>
                    <p className="text-[14px]">
                      <strong>{j.name}</strong> · {j.status}
                    </p>
                    {(j.phone || j.email) && (
                      <p className="font-mono2 text-[12px] text-[#6B7280]">
                        {[j.phone, j.email].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </Card>
                ))}
            </div>
          </details>
        )}
      </div>
      <h2 className="font-display mt-4 text-[16px] font-semibold">Members · {members.length}</h2>
      <div className="mt-2 flex flex-col gap-2">
        {members.map((m) => (
          <Card key={m.membershipId}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-display font-semibold">{m.name}</p>
              <StatusPill text={`${roleLabel(m.role)}${m.status !== "active" ? " · suspended" : ""}`} />
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
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  setConfirming({
                    action: m.status === "active" ? "suspend" : "restore",
                    member: m,
                  })
                }
                className="tap-target shrink-0 rounded-lg border border-[#E5E7EB] px-3 text-[13px] font-medium"
              >
                {m.status === "active" ? "Suspend" : "Restore"}
              </button>
            </div>
            {m.role === "group_leader" && (
              <>
                {groups.filter((g) => (leads[g.id] ?? []).includes(m.id)).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {groups
                      .filter((g) => (leads[g.id] ?? []).includes(m.id))
                      .map((g) => (
                        <span
                          key={g.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#CCFBF1] px-2.5 py-1 text-[12px] font-medium text-[#0F766E]"
                        >
                          Leads {g.name}
                          <button
                            type="button"
                            onClick={() => removeLead(m.id, g.id)}
                            aria-label={`Remove ${m.name} from leading ${g.name}`}
                            className="rounded-full px-1 font-semibold"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                  </div>
                )}
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
                    className="tap-target shrink-0 rounded-lg bg-[#0D9488] px-3 text-[13px] font-semibold text-white"
                  >
                    Add
                  </button>
                </div>
              </>
            )}
          </Card>
        ))}
        {loaded && members.length === 0 && (
          <Card>
            <p className="text-[14px] text-[#6B7280]">No team members yet.</p>
          </Card>
        )}
      </div>
      <h2 className="font-display mt-4 text-[16px] font-semibold">Invitations · {invites.length}</h2>
      <div className="mt-2 flex flex-col gap-2">
        {invites.map((i) => (
          <Card key={i.id}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{i.email}</p>
                <p className="text-[13px] text-[#6B7280]">
                  {roleLabel(i.role)} · {i.status}
                </p>
              </div>
              {i.status === "pending" && (
                <button
                  type="button"
                  onClick={() => setConfirming({ action: "revoke", id: i.id, name: i.email })}
                  className="tap-target shrink-0 rounded-lg border border-[#E5E7EB] px-3 text-[13px] font-medium"
                >
                  Revoke
                </button>
              )}
            </div>
          </Card>
        ))}
        {loaded && invites.length === 0 && (
          <Card>
            <p className="text-[14px] text-[#6B7280]">No invitations sent.</p>
          </Card>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Link
          href="/admin/invite"
          className="tap-target flex flex-1 items-center justify-center rounded-lg bg-[#0D9488] text-[15px] font-semibold text-white"
        >
          + Invite someone
        </Link>
        <Link
          href="/admin/audit"
          className="tap-target flex flex-1 items-center justify-center rounded-lg border border-[#E5E7EB] text-[14px] font-medium"
        >
          Audit log
        </Link>
      </div>
    </Shell>
  );
}
