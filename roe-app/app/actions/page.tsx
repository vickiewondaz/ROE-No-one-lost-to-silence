// F05 Actions — Priority 1: overdue first, today, upcoming, done collapsed.
// Rows: who (avatar) + what + when + next. No charts, no stats theater.
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Card, AttentionPill, Avatar, SectionHead } from "@/components/ui";
import { loadActions, loadPeople, type FollowAction } from "@/lib/data";

interface RemoteAction {
  id: string;
  personId: string;
  personName: string;
  title: string;
  status: string;
  dueLabel: string;
  bucket: string;
}

function Row({ a }: { a: { id: string; personName: string; title: string; dueLabel: string; overdue?: boolean; status: string } }) {
  return (
    <Link href={`/actions/${a.id}`}>
      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={a.personName} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display truncate font-semibold">{a.personName}</p>
              {a.overdue ? (
                <AttentionPill text={a.dueLabel} />
              ) : (
                <span className="font-mono2 shrink-0 text-[12px] text-[#667370]">{a.dueLabel}</span>
              )}
            </div>
            <p className="truncate text-[13px] text-[#667370]">
              {a.title} · next: record interaction
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function ActionsPage() {
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
    fetch("/api/actions?tab=all", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (Array.isArray(j?.data)) setRemote(j.data as RemoteAction[]);
      })
      .catch(() => {});
  }, []);

  if (remote) {
    const overdue = remote.filter((a) => a.bucket === "overdue");
    const today = remote.filter((a) => a.bucket === "today");
    const upcoming = remote.filter((a) => a.bucket === "upcoming");
    const done = remote.filter((a) => a.bucket === "completed");
    return (
      <Shell title="Follow-ups" tab="actions">
        <SectionHead title="Overdue — first" count={overdue.length} />
        <div className="mt-2 flex flex-col gap-2">
          {overdue.map((a) => (
            <Row key={a.id} a={{ ...a, overdue: true }} />
          ))}
          {overdue.length === 0 && (
            <p className="text-[13px] text-[#667370]">Nothing overdue. 🎉</p>
          )}
        </div>
        <div className="mt-4">
          <SectionHead title="Due today" count={today.length} />
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {today.map((a) => (
            <Row key={a.id} a={a} />
          ))}
          {today.length === 0 && <p className="text-[13px] text-[#667370]">Today is clear.</p>}
        </div>
        <div className="mt-4">
          <SectionHead title="Upcoming" count={upcoming.length} />
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {upcoming.slice(0, 10).map((a) => (
            <Row key={a.id} a={a} />
          ))}
        </div>
        {done.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-[14px] font-medium text-[#0F766E]">
              Completed ({done.length})
            </summary>
            <div className="mt-2 flex flex-col gap-2">
              {done.slice(0, 10).map((a) => (
                <Row key={a.id} a={a} />
              ))}
            </div>
          </details>
        )}
      </Shell>
    );
  }

  const list = local.filter((a) => !a.overdue);
  const od = local.filter((a) => a.overdue);
  return (
    <Shell title="Follow-ups" tab="actions">
      <p className="mb-2 rounded-lg bg-[#DBEAFE] p-2 text-[12px] text-[#1E3A8A]">
        Demo data — sign in for live follow-ups.
      </p>
      <SectionHead title="Overdue — first" count={od.length} />
      <div className="mt-2 flex flex-col gap-2">
        {od.map((a) => (
          <Row
            key={a.id}
            a={{ id: a.id, personName: names[a.personId] ?? "Someone", title: a.title, dueLabel: a.due, overdue: true, status: a.status }}
          />
        ))}
      </div>
      <div className="mt-4">
        <SectionHead title="Due today" count={list.length} />
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {list.map((a) => (
          <Row
            key={a.id}
            a={{ id: a.id, personName: names[a.personId] ?? "Someone", title: a.title, dueLabel: a.due, status: a.status }}
          />
        ))}
        {list.length === 0 && <Empty />}
      </div>
    </Shell>
  );
}

function Empty() {
  return (
    <Card>
      <p className="font-medium">Nothing due.</p>
      <p className="text-[13px] text-[#667370]">
        You're all caught up. <Link href="/people" className="text-[#0F766E]">View people</Link>
      </p>
    </Card>
  );
}
