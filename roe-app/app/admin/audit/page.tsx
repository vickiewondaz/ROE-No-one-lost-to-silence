"use client";
// F14.15 Audit log (read-only): who did what, allowed or denied, when.
import { useEffect, useState } from "react";
import { Shell, Card } from "@/components/ui";

interface Entry {
  op: string;
  actor: string;
  ref: string | null;
  allowed: boolean;
  at: string;
}

export default function AuditPage() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    fetch("/api/audit", { credentials: "same-origin" })
      .then((r) => {
        if (r.status === 403) {
          setDenied(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((j) => {
        if (Array.isArray(j?.data)) setRows(j.data as Entry[]);
      })
      .catch(() => {});
  }, []);

  if (denied)
    return (
      <Shell title="Audit log" back="/admin/users" tab="more">
        <Card>
          <p className="font-medium">Restricted.</p>
        </Card>
      </Shell>
    );

  return (
    <Shell title="Audit log" back="/admin/users" tab="more">
      <p className="text-[13px] text-[#667370]">
        Newest first. Denied attempts are the interesting rows — they prove the walls hold.
      </p>
      <div className="mt-2 flex flex-col gap-1.5">
        {rows.map((r, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono2 text-[13px]">{r.op}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${
                  r.allowed ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEE2E2] text-[#DC2626]"
                }`}
              >
                {r.allowed ? "allowed" : "denied"}
              </span>
            </div>
            <p className="mt-0.5 font-mono2 text-[12px] text-[#667370]">
              {r.actor} · {new Date(r.at).toLocaleString()}
            </p>
          </Card>
        ))}
        {rows.length === 0 && (
          <Card>
            <p className="text-[14px] text-[#667370]">No events yet.</p>
          </Card>
        )}
      </div>
    </Shell>
  );
}
