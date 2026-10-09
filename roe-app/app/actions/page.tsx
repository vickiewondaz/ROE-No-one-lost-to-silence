// P-tabs / F05 — Actions list: Today | Overdue | Upcoming | Completed.
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Card, AttentionPill } from "@/components/ui";
import { loadActions, loadPeople, type FollowAction } from "@/lib/data";

export default function ActionsPage() {
  const [tab, setTab] = useState("Today");
  const [actions, setActions] = useState<FollowAction[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    setActions(loadActions());
    const m: Record<string, string> = {};
    for (const p of loadPeople()) m[p.id] = `${p.firstName} ${p.lastName}`;
    setNames(m);
  }, []);

  const list = actions.filter((a) =>
    tab === "Overdue"
      ? a.overdue
      : tab === "Completed"
        ? a.status === "Completed"
        : !a.overdue
  );

  return (
    <Shell title="Actions" tab="actions">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {["Today", "Overdue", "Upcoming", "Completed"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium ${
              tab === t
                ? "bg-[#0F766E] text-white"
                : "border border-[#E2E8E6] bg-white text-[#667370]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {list.map((a) => (
          <Link key={a.id} href={`/actions/${a.id}`}>
            <Card>
              <div className="flex items-center justify-between gap-2">
                <p className="font-display font-semibold">{a.title}</p>
                {a.overdue && <AttentionPill text="Overdue" />}
              </div>
              <p className="mt-1 text-[13px] text-[#667370]">
                {names[a.personId] ?? "Someone"} · Due {a.due} · {a.status}
              </p>
              <p className="font-mono2 mt-1 text-[12px] text-[#667370]">
                NEXT: Record interaction
              </p>
            </Card>
          </Link>
        ))}
        {list.length === 0 && (
          <Card>
            <p className="font-medium">Nothing in {tab}.</p>
            <p className="text-[13px] text-[#667370]">
              You&apos;re all caught up.{" "}
              <Link href="/people" className="text-[#0F766E]">
                View people
              </Link>
            </p>
          </Card>
        )}
      </div>
    </Shell>
  );
}
