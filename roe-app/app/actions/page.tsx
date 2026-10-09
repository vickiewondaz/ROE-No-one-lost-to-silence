// P-tabs / F05 — Actions list, live API with local fallback.
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Card, AttentionPill } from "@/components/ui";
import { loadActions, loadPeople, type FollowAction } from "@/lib/data";

interface RemoteAction {
  id: string;
  personId: string;
  personName: string;
  title: string;
  status: string;
  dueLabel: string;
  overdue: boolean;
}

export default function ActionsPage() {
  const [tab, setTab] = useState("Today");
  const [remote, setRemote] = useState<RemoteAction[] | null>(null);
  const [local, setLocal] = useState<FollowAction[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocal(loadActions());
    const m: Record<string, string> = {};
    try {
      for (const p of loadPeople()) m[p.id] = `${p.firstName} ${p.lastName}`;
    } catch {}
    setNames(m);
    fetch(`/api/actions?tab=${tab.toLowerCase()}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data) setRemote(j.data as RemoteAction[]);
      })
      .catch(() => {});
  }, [tab]);

  if (remote) {
    return (
      <Shell title="Actions" tab="actions">
        <Tabs tab={tab} setTab={setTab} />
        <div className="mt-3 flex flex-col gap-2">
          {remote.map((a) => (
            <Link key={a.id} href={`/actions/${a.id}`}>
              <Card>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-semibold">{a.title}</p>
                  {a.overdue && <AttentionPill text="Overdue" />}
                </div>
                <p className="mt-1 text-[13px] text-[#667370]">
                  {a.personName} · Due {a.dueLabel} · {a.status}
                </p>
              </Card>
            </Link>
          ))}
          {remote.length === 0 && <Empty tab={tab} />}
        </div>
      </Shell>
    );
  }

  const list = local.filter((a) =>
    tab === "Overdue" ? a.overdue : tab === "Completed" ? a.status === "Completed" : !a.overdue
  );
  return (
    <Shell title="Actions" tab="actions">
      <Tabs tab={tab} setTab={setTab} />
      <p className="mt-2 rounded-lg bg-[#DBEAFE] p-2 text-[12px] text-[#1E3A8A]">
        Demo data — sign in for live actions.
      </p>
      <div className="mt-2 flex flex-col gap-2">
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
        {list.length === 0 && <Empty tab={tab} />}
      </div>
    </Shell>
  );
}

function Tabs({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
      {["Today", "Overdue", "Upcoming", "Completed"].map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium ${
            tab === t ? "bg-[#0F766E] text-white" : "border border-[#E2E8E6] bg-white text-[#667370]"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function Empty({ tab }: { tab: string }) {
  return (
    <Card>
      <p className="font-medium">Nothing in {tab}.</p>
      <p className="text-[13px] text-[#667370]">
        You&apos;re all caught up.{" "}
        <Link href="/people" className="text-[#0F766E]">View people</Link>
      </p>
    </Card>
  );
}
