"use client";
// F02.05 Home / Administrator (MVP depth): org tasks, not member PII.
// Admin manages access — no default visibility into personal follow-ups.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Card } from "@/components/ui";

export default function AdminHome() {
  const [me, setMe] = useState<{ orgName?: string; role?: string } | null>(null);
  const [denied, setDenied] = useState(false);
  const [counts, setCounts] = useState<{ users: number; pending: number } | null>(null);

  useEffect(() => {
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => {
        if (r.status === 403 || r.status === 401) {
          setDenied(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((j) => {
        if (!j?.data) return;
        if (!["admin", "senior"].includes(j.data.role)) {
          setDenied(true);
          return;
        }
        setMe(j.data);
        Promise.all([
          fetch("/api/users", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)),
          fetch("/api/invites", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)),
        ]).then(([u, inv]) => {
          setCounts({
            users: Array.isArray(u?.data) ? u.data.length : 0,
            pending: Array.isArray(inv?.data)
              ? inv.data.filter((i: { status: string }) => i.status === "pending").length
              : 0,
          });
        });
      })
      .catch(() => {});
  }, []);

  if (denied)
    return (
      <Shell title="Administration" back="/more" tab="more">
        <Card>
          <p className="font-medium">Restricted.</p>
          <p className="text-[13px] text-[#667370]">
            Organisation administration is for admins. Your follow-up work is under Home.
          </p>
        </Card>
      </Shell>
    );

  return (
    <Shell title={me?.orgName ?? "Administration"} back="/more" tab="more">
      <Card>
        <p className="font-display font-semibold">Organisation tasks</p>
        <p className="text-[13px] text-[#667370]">
          {counts ? `${counts.users} team members · ${counts.pending} pending invites` : "Loading…"}
        </p>
      </Card>
      <div className="mt-3 flex flex-col gap-2">
        <Link href="/admin/users" className="tap-target rounded-lg bg-[#0F766E] py-3 text-center text-[15px] font-semibold text-white">
          Team & invitations
        </Link>
        <Link href="/admin/invite" className="tap-target rounded-lg border border-[#E2E8E6] bg-white py-3 text-center text-[14px] font-medium">
          Invite someone
        </Link>
      </div>
      <p className="mt-3 text-[13px] text-[#667370]">
        Admins manage access. Personal follow-up records stay with their workers.
      </p>
    </Shell>
  );
}
