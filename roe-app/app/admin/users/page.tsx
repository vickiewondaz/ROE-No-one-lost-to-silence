"use client";
// F14.02 Users + invitations (MVP depth: list + invite entry only).
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Card, StatusPill } from "@/components/ui";

interface Member {
  id: string;
  name: string;
  role: string;
}
interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
}

export default function AdminUsers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/users", { credentials: "same-origin" }),
      fetch("/api/invites", { credentials: "same-origin" }),
    ])
      .then(async ([u, inv]) => {
        if (u.status === 403) {
          setDenied(true);
          return;
        }
        const uj = u.ok ? await u.json() : null;
        const ij = inv.ok ? await inv.json() : null;
        if (uj?.data) setMembers(uj.data as Member[]);
        if (ij?.data) setInvites(ij.data as Invite[]);
      })
      .catch(() => {});
  }, []);

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
      <h2 className="font-display text-[16px] font-semibold">Members · {members.length}</h2>
      <div className="mt-2 flex flex-col gap-2">
        {members.map((m) => (
          <Card key={m.id}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-display font-semibold">{m.name}</p>
              <StatusPill text={m.role} />
            </div>
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
            <p className="font-medium">{i.email}</p>
            <p className="text-[13px] text-[#667370]">
              {i.role} · {i.status}
            </p>
          </Card>
        ))}
        {invites.length === 0 && (
          <Card>
            <p className="text-[14px] text-[#667370]">No invitations sent.</p>
          </Card>
        )}
      </div>
      <Link
        href="/admin/invite"
        className="tap-target mt-3 flex items-center justify-center rounded-lg bg-[#0F766E] text-[15px] font-semibold text-white"
      >
        + Invite someone
      </Link>
    </Shell>
  );
}
