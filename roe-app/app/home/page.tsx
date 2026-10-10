// P02 — Home, role-shaped. Priority 1: who needs attention TODAY,
// who is overdue, what is done, what is next. No decorative charts.
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Card, AttentionPill, StatusPill, Avatar, SectionHead } from "@/components/ui";
import { CelebrateActions } from "@/components/celebrate";
import { loadActions, type Person } from "@/lib/data";
import { usePeople } from "@/lib/use-people";

interface RemoteAction {
  id: string;
  personId: string;
  personName: string;
  title: string;
  status: string;
  dueLabel: string;
  bucket: string;
}
interface Intro {
  id: string;
  personId: string;
  personName: string;
  status: string;
}

export default function HomePage() {
  const { people, demo, forbidden, live } = usePeople();
  const [role, setRole] = useState<string>("worker");
  const [actions, setActions] = useState<RemoteAction[] | null>(null);
  const [intros, setIntros] = useState<Intro[]>([]);
  const [myPerson, setMyPerson] = useState<Person | null>(null);
  const [celebrations, setCelebrations] = useState<{ id: string; personId: string; personName: string; type: string; label: string; date: string; inDays: number }[]>([]);

  useEffect(() => {
    loadActions();
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then(async (j) => {
        const r = (j?.data?.role ?? "worker") as string;
        setRole(r);
        if (r === "group_leader") {
          const g = await fetch("/api/groups", { credentials: "same-origin" }).then((x) =>
            x.ok ? x.json() : null
          );
          const all: Intro[] = [];
          for (const grp of (g?.data ?? []).slice(0, 10) as { id: string }[]) {
            const c = await fetch(`/api/connections?groupId=${grp.id}`, {
              credentials: "same-origin",
            }).then((x) => (x.ok ? x.json() : null));
            for (const it of (c?.data ?? []) as Intro[]) {
              if (it.status === "Suggested" || it.status === "Introduced") all.push(it);
            }
          }
          setIntros(all.slice(0, 10));
        }
      })
      .catch(() => {});
    fetch("/api/actions?tab=all", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (Array.isArray(j?.data)) setActions(j.data as RemoteAction[]);
      })
      .catch(() => {});
    fetch("/api/milestones/upcoming?days=14", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (Array.isArray(j?.data)) setCelebrations(j.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (role === "member" && people.length > 0) setMyPerson(people[0]);
  }, [role, people]);

  if (role === "member" && (myPerson || !live)) return <MemberHome person={myPerson} demo={demo} />;
  if (role === "group_leader" && live) return <LeaderHome people={people} actions={actions ?? []} intros={intros} />;

  const overdue = (actions ?? []).filter((a) => a.bucket === "overdue");
  const today = (actions ?? []).filter((a) => a.bucket === "today");
  const upcoming = (actions ?? []).filter((a) => a.bucket === "upcoming").slice(0, 3);
  const done = (actions ?? []).filter((a) => a.bucket === "completed");
  const fresh = people.filter((p) => p.journey === "New" || p.journey === "Assigned").slice(0, 3);

  return (
    <Shell title="Good morning" tab="home">
      {demo && (
        <p className="mb-3 rounded-lg bg-[#DBEAFE] p-2 text-[12px] text-[#1E3A8A]">
          Demo data — sign in with a pilot account for live data.
        </p>
      )}
      {forbidden && (
        <p className="mb-3 rounded-lg bg-[#FEE2E2] p-2 text-[12px] text-[#991B1B]">
          No organisation — ask your administrator to invite you.
        </p>
      )}
      {role === "admin" && (
        <Link href="/admin" className="mb-3 block rounded-xl bg-[#17201F] p-3 text-white">
          <p className="font-display text-[15px] font-semibold">Administration →</p>
          <p className="font-mono2 text-[12px] text-[#A7B3B0]">team, invitations, audit</p>
        </Link>
      )}

      <SectionHead title="Needs attention" count={overdue.length + today.length + fresh.length} />
      <div className="mt-2 flex flex-col gap-2">
        {overdue.map((a) => (
          <Link key={a.id} href={`/actions/${a.id}`}>
            <Card>
              <div className="flex items-center gap-3">
                <Avatar name={a.personName} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display truncate font-semibold">{a.personName}</p>
                    <AttentionPill text={a.dueLabel} />
                  </div>
                  <p className="text-[13px] text-[#667370]">
                    {a.title} · no outcome recorded yet
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
        {overdue.length === 0 && today.length === 0 && fresh.length === 0 && (
          <Card>
            <p className="font-display font-semibold">All clear 🎉</p>
            <p className="text-[13px] text-[#667370]">
              Nothing overdue, nothing due, no one waiting for an owner.
            </p>
          </Card>
        )}
      </div>

      {today.length > 0 && (
        <>
          <div className="mt-4">
            <SectionHead title="Due today" count={today.length} />
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {today.map((a) => (
              <Link key={a.id} href={`/actions/${a.id}`}>
                <Card>
                  <div className="flex items-center gap-3">
                    <Avatar name={a.personName} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display truncate font-semibold">{a.personName}</p>
                      <p className="text-[13px] text-[#667370]">
                        {a.title} · {a.status}
                      </p>
                    </div>
                    <span aria-hidden className="text-[#0F766E]">→</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {fresh.length > 0 && (
        <>
          <div className="mt-4">
            <SectionHead title="New — needs an owner" count={fresh.length} />
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {fresh.map((p) => (
              <Link key={p.id} href={`/people/${p.id}`}>
                <Card>
                  <div className="flex items-center gap-3">
                    <Avatar name={`${p.firstName} ${p.lastName}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display truncate font-semibold">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-[13px] text-[#667370]">Next: {p.nextAction}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <div className="mt-4">
            <SectionHead title="Coming up" />
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {upcoming.map((a) => (
              <Link key={a.id} href={`/actions/${a.id}`}>
                <Card>
                  <p className="text-[14px]">
                    {a.personName} · {a.title}
                  </p>
                  <p className="font-mono2 text-[12px] text-[#667370]">{a.dueLabel}</p>
                </Card>
              </Link>
            ))}
            {celebrations.map((c) => (
              <Card key={`cel-${c.id}`}>
                <p className="text-[14px]">
                  🎉 <Link href={`/people/${c.personId}`} className="font-semibold text-[#0F766E]">{c.personName}</Link> · {c.label}
                </p>
                <p className="font-mono2 text-[12px] text-[#667370]">
                  {c.inDays === 0 ? "Today!" : `in ${c.inDays}d · ${c.date.slice(5)}`}
                </p>
                <CelebrateActions
                  milestoneId={c.id}
                  personName={c.personName}
                  type={c.type}
                  onDone={() => setCelebrations((prev) => prev.filter((x) => x.id !== c.id))}
                />
              </Card>
            ))}
          </div>
        </>
      )}
      {upcoming.length === 0 && celebrations.length > 0 && (
        <>
          <div className="mt-4">
            <SectionHead title="Coming up" count={celebrations.length} />
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {celebrations.map((c) => (
              <Card key={`cel-${c.id}`}>
                <p className="text-[14px]">
                  🎉 <Link href={`/people/${c.personId}`} className="font-semibold text-[#0F766E]">{c.personName}</Link> · {c.label}
                </p>
                <p className="font-mono2 text-[12px] text-[#667370]">
                  {c.inDays === 0 ? "Today!" : `in ${c.inDays}d · ${c.date.slice(5)}`}
                </p>
                <CelebrateActions
                  milestoneId={c.id}
                  personName={c.personName}
                  type={c.type}
                  onDone={() => setCelebrations((prev) => prev.filter((x) => x.id !== c.id))}
                />
              </Card>
            ))}
          </div>
        </>
      )}

      {done.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-[14px] font-medium text-[#0F766E]">
            Done ({done.length}) — tap to review
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            {done.slice(0, 5).map((a) => (
              <Card key={a.id}>
                <p className="text-[14px] text-[#667370]">
                  ✓ {a.personName} · {a.title}
                </p>
              </Card>
            ))}
          </div>
        </details>
      )}
    </Shell>
  );
}

function LeaderHome({ people, actions, intros }: { people: Person[]; actions: RemoteAction[]; intros: Intro[] }) {
  const mine = actions.filter((a) => a.bucket === "today" || a.bucket === "overdue");
  return (
    <Shell title="Group leader" tab="home">
      <SectionHead title="Introductions needing you" count={intros.length} />
      <div className="mt-2 flex flex-col gap-2">
        {intros.map((i) => (
          <Link key={i.id} href={`/people/${i.personId}`}>
            <Card>
              <div className="flex items-center gap-3">
                <Avatar name={i.personName} />
                <div className="min-w-0 flex-1">
                  <p className="font-display truncate font-semibold">{i.personName}</p>
                  <p className="text-[13px] text-[#667370]">
                    {i.status === "Suggested" ? "Suggested — review it" : "Introduced — record what happened"}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
        {intros.length === 0 && (
          <Card>
            <p className="text-[14px] text-[#667370]">No pending introductions. Your groups are covered.</p>
          </Card>
        )}
      </div>
      <div className="mt-4">
        <SectionHead title="My follow-ups" count={mine.length} />
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {mine.slice(0, 5).map((a) => (
          <Link key={a.id} href={`/actions/${a.id}`}>
            <Card>
              <p className="text-[14px]">
                <strong>{a.personName}</strong> · {a.title} · {a.dueLabel}
              </p>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-4">
        <SectionHead title="People in my groups" count={people.length} />
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {people.slice(0, 5).map((p) => (
          <Link key={p.id} href={`/people/${p.id}`}>
            <Card>
              <div className="flex items-center gap-3">
                <Avatar name={`${p.firstName} ${p.lastName}`} />
                <p className="font-display truncate font-semibold">
                  {p.firstName} {p.lastName}
                </p>
                <StatusPill text={p.journey} />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Shell>
  );
}

function MemberHome({ person, demo }: { person: Person | null; demo: boolean }) {
  if (!person)
    return (
      <Shell title="Home" tab="home">
        <Card>
          <p className="font-display font-semibold">Welcome 🌿</p>
          <p className="text-[13px] text-[#667370]">
            {demo ? "Demo view — sign in to see your own journey." : "Your profile will appear here once your coordinator sets it up."}
          </p>
        </Card>
      </Shell>
    );
  return (
    <Shell title={`Hello, ${person.firstName}`} tab="home">
      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={`${person.firstName} ${person.lastName}`} size="lg" />
          <div>
            <p className="font-display text-[18px] font-semibold">
              {person.firstName} {person.lastName}
            </p>
            <StatusPill text={person.journey} />
          </div>
        </div>
      </Card>
      <div className="mt-3">
        <SectionHead title="Where I am" />
      </div>
      <Card>
        <p className="text-[14px]">
          {person.group ? `Connected with ${person.group}` : "Getting connected — your coordinator is arranging introductions."}
        </p>
        <p className="mt-1 text-[13px] text-[#667370]">Next: {person.nextAction}</p>
        {person.assignee && person.assignee !== "Unassigned" && (
          <p className="mt-1 text-[13px] text-[#667370]">Your contact: {person.assignee}</p>
        )}
      </Card>
      <Link href={`/people/${person.id}`} className="mt-3 block rounded-lg border border-[#E2E8E6] bg-white py-3 text-center text-[14px] font-medium text-[#0F766E]">
        View my profile →
      </Link>
    </Shell>
  );
}
