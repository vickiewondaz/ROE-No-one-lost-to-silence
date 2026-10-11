// P02 — Home, role-shaped. Priority 1: who needs attention TODAY,
// who is overdue, what is done, what is next. No decorative charts.
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Card, AttentionPill, StatusPill, Avatar, SectionHead, ContactButtons, JourneyStepper, memberJourneyLabel } from "@/components/ui";
import ServicesUpcoming from "@/components/services-upcoming";
import { CelebrateActions } from "@/components/celebrate";
import { loadActions, type Person } from "@/lib/data";
import { usePeople } from "@/lib/use-people";

interface RemoteAction {
  id: string;
  personId: string;
  personName: string;
  personPhone: string;
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
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <Shell title={greeting} tab="home">
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
      {["admin", "senior"].includes(role) && (
        <Link href="/admin" className="mb-3 block rounded-xl bg-[#17201F] p-3 text-white">
          <p className="font-display text-[15px] font-semibold">Administration →</p>
          <p className="font-mono2 text-[12px] text-[#A7B3B0]">team, invitations, audit</p>
        </Link>
      )}

      <SectionHead title="Needs attention" count={overdue.length + today.length + fresh.length} />
      <div className="mt-2 flex flex-col gap-2">
        {overdue.map((a) => (
          <Card key={a.id}>
            <Link href={`/actions/${a.id}`}>
              <div className="flex items-center gap-3">
                <Avatar name={a.personName} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display truncate font-semibold">{a.personName}</p>
                    <AttentionPill text={a.dueLabel} />
                  </div>
                  <p className="text-[13px] text-[#6B7280]">
                    {a.title} · no outcome recorded yet
                  </p>
                </div>
              </div>
            </Link>
            {a.personPhone && <ContactButtons phone={a.personPhone} />}
          </Card>
        ))}
        {overdue.length === 0 && today.length === 0 && fresh.length === 0 && (
          <Card>
            <p className="font-display font-semibold">All clear 🎉</p>
            <p className="text-[13px] text-[#6B7280]">
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
              <Card key={a.id}>
                <Link href={`/actions/${a.id}`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={a.personName} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display truncate font-semibold">{a.personName}</p>
                      <p className="text-[13px] text-[#6B7280]">
                        {a.title} · {a.status}
                      </p>
                    </div>
                    <span aria-hidden className="text-[#0D9488]">→</span>
                  </div>
                </Link>
                {a.personPhone && <ContactButtons phone={a.personPhone} />}
              </Card>
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
              <Card key={p.id}>
                <Link href={`/people/${p.id}`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={`${p.firstName} ${p.lastName}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display truncate font-semibold">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-[13px] text-[#6B7280]">Next: {p.nextAction}</p>
                    </div>
                  </div>
                </Link>
                {p.phone && <ContactButtons phone={p.phone} />}
              </Card>
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
              <Card key={a.id}>
                <Link href={`/actions/${a.id}`}>
                  <p className="text-[14px]">
                    {a.personName} · {a.title}
                  </p>
                  <p className="font-mono2 text-[12px] text-[#6B7280]">{a.dueLabel}</p>
                </Link>
                {a.personPhone && <ContactButtons phone={a.personPhone} />}
              </Card>
            ))}
            {celebrations.map((c) => (
              <Card key={`cel-${c.id}`}>
                <p className="text-[14px]">
                  🎉 <Link href={`/people/${c.personId}`} className="font-semibold text-[#0D9488]">{c.personName}</Link> · {c.label}
                </p>
                <p className="font-mono2 text-[12px] text-[#6B7280]">
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
                  🎉 <Link href={`/people/${c.personId}`} className="font-semibold text-[#0D9488]">{c.personName}</Link> · {c.label}
                </p>
                <p className="font-mono2 text-[12px] text-[#6B7280]">
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

      <ServicesUpcoming />

      {done.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-[14px] font-medium text-[#0D9488]">
            Done ({done.length}) — tap to review
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            {done.slice(0, 5).map((a) => (
              <Card key={a.id}>
                <p className="text-[14px] text-[#6B7280]">
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
          <Link key={i.id} href={`/people/${i.personId}/suggest`}>
            <Card>
              <div className="flex items-center gap-3">
                <Avatar name={i.personName} />
                <div className="min-w-0 flex-1">
                  <p className="font-display truncate font-semibold">{i.personName}</p>
                  <p className="text-[13px] text-[#6B7280]">
                    {i.status === "Suggested" ? "Suggested — review it" : "Introduced — record what happened"}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
        {intros.length === 0 && (
          <Card>
            <p className="text-[14px] text-[#6B7280]">No pending introductions. Your groups are covered.</p>
          </Card>
        )}
      </div>
      <div className="mt-4">
        <SectionHead title="My follow-ups" count={mine.length} />
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {mine.slice(0, 5).map((a) => (
          <Card key={a.id}>
            <Link href={`/actions/${a.id}`}>
              <p className="text-[14px]">
                <strong>{a.personName}</strong> · {a.title} · {a.dueLabel}
              </p>
            </Link>
            {a.personPhone && <ContactButtons phone={a.personPhone} />}
          </Card>
        ))}
      </div>
      <ServicesUpcoming />

      <div className="mt-4">
        <SectionHead title="People in my groups" count={people.length} />
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {people.slice(0, 5).map((p) => (
          <Card key={p.id}>
            <Link href={`/people/${p.id}`}>
              <div className="flex items-center gap-3">
                <Avatar name={`${p.firstName} ${p.lastName}`} />
                <p className="font-display truncate font-semibold">
                  {p.firstName} {p.lastName}
                </p>
                <StatusPill text={p.journey} />
              </div>
            </Link>
            {p.phone && <ContactButtons phone={p.phone} />}
          </Card>
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
          <p className="mt-1 text-[13px] text-[#6B7280]">
            {demo
              ? "Demo view — sign in to see your own journey."
              : "We couldn't find your profile yet — your coordinator creates it when you join."}
          </p>
          {!demo && (
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/join" className="tap-target flex items-center justify-center rounded-lg bg-[#0D9488] px-4 text-[15px] font-semibold text-white">
                Request to join your community →
              </Link>
              <p className="text-center text-[13px] text-[#6B7280]">
                Already invited? Open your invitation link — or ask your coordinator to resend it.
              </p>
            </div>
          )}
        </Card>
      </Shell>
    );
  return <MemberHomeLive person={person} />;
}

function MemberHomeLive({ person }: { person: Person }) {
  const [feed, setFeed] = useState<{ at: string; title: string; detail: string }[] | null>(null);
  const [milestones, setMilestones] = useState<{ id: string; type: string; label: string; date: string; inDays: number }[]>([]);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(person.firstName);
  const [lastName, setLastName] = useState(person.lastName);
  const [phone, setPhone] = useState(person.phone);
  const [channel, setChannel] = useState(person.channel);
  const [interests, setInterests] = useState(person.interests ?? "");
  const [saveNote, setSaveNote] = useState("");

  useEffect(() => {
    fetch(`/api/people/${person.id}/timeline`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (Array.isArray(j?.data)) setFeed(j.data);
      })
      .catch(() => {});
    fetch("/api/milestones/upcoming?days=90", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (Array.isArray(j?.data))
          setMilestones(
            (j.data as unknown as { personId: string; id: string; type: string; label: string; date: string; inDays: number }[]).filter(
              (m) => m.personId === person.id
            )
          );
      })
      .catch(() => {});
  }, [person.id]);

  async function saveContact() {
    setSaveNote("");
    if (firstName.trim().length < 2) {
      setSaveNote("Enter your first name.");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
      setSaveNote("Enter a valid phone number.");
      return;
    }
    try {
      const r = await fetch(`/api/people/${person.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          channel,
          interests: interests.trim(),
        }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok) {
        person.firstName = firstName.trim();
        person.lastName = lastName.trim();
        person.phone = phone.trim();
        person.channel = channel as Person["channel"];
        person.interests = interests.trim();
        setEditing(false);
        setSaveNote("Saved ✓");
        return;
      }
      setSaveNote(j?.error ?? "Couldn't save it.");
    } catch {
      setSaveNote("Couldn't reach the server.");
    }
  }

  return (
    <Shell title={`Hello, ${person.firstName}`} tab="home">
      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={`${person.firstName} ${person.lastName}`} size="lg" />
          <div>
            <p className="font-display text-[18px] font-semibold">
              {person.firstName} {person.lastName}
            </p>
            <StatusPill text={memberJourneyLabel(person.journey)} />
          </div>
        </div>
      </Card>
      <div className="mt-3">
        <SectionHead title="Where I am" />
      </div>
      <Card>
        <JourneyStepper current={person.journey} tone="member" />
        <p className="mt-3 text-[14px]">
          {person.group ? `Connected with ${person.group}` : "Getting connected — your coordinator is arranging introductions."}
        </p>
        <p className="mt-1 text-[13px] text-[#6B7280]">Next: {person.nextAction}</p>
        {person.assignee && person.assignee !== "Unassigned" && (
          <p className="mt-1 text-[13px] text-[#6B7280]">Your contact: {person.assignee}</p>
        )}
      </Card>

      {feed !== null && feed.length > 0 && (
        <>
          <div className="mt-4">
            <SectionHead title="My journey so far" count={feed.length} />
          </div>
          <Card>
            <div className="flex flex-col gap-2">
              {feed.slice(0, 5).map((e, i) => (
                <div key={i}>
                  <p className="text-[14px] font-medium">{e.title}</p>
                  {e.detail && <p className="text-[13px] text-[#6B7280]">{e.detail}</p>}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {milestones.length > 0 && (
        <>
          <div className="mt-4">
            <SectionHead title="Coming up for me" />
          </div>
          {milestones.map((m) => (
            <Card key={m.id}>
              <p className="text-[14px]">🎉 {m.label}</p>
              <p className="font-mono2 text-[12px] text-[#6B7280]">
                {m.inDays === 0 ? "Today!" : `in ${m.inDays}d · ${m.date.slice(5)}`}
              </p>
            </Card>
          ))}
        </>
      )}

      <ServicesUpcoming title="What's on" />

      <Link href={`/people/${person.id}`} className="mt-3 block rounded-lg border border-[#E5E7EB] bg-white py-3 text-center text-[14px] font-medium text-[#0D9488]">
        View my full profile →
      </Link>

      <div className="mt-4">
        <SectionHead title="My contact details" />
      </div>
      <Card>
        {!editing ? (
          <div>
            <p className="text-[14px]">{person.phone} · {person.channel}</p>
            <p className="mt-1 text-[13px] text-[#6B7280]">
              {person.interests ? `Interests: ${person.interests}` : "No interests recorded yet."}
            </p>
            <button
              type="button"
              onClick={() => { setFirstName(person.firstName); setLastName(person.lastName); setPhone(person.phone); setChannel(person.channel); setInterests(person.interests ?? ""); setEditing(true); }}
              className="tap-target mt-2 w-full rounded-lg border border-[#E5E7EB] text-[14px] font-medium text-[#0D9488]"
            >
              Update my details
            </button>
            {saveNote === "Saved ✓" && (
              <p className="mt-1 text-[13px] font-medium text-[#15803D]">Saved ✓</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[14px] font-medium">First name</span>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  className="tap-target w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[16px] outline-none focus:border-[#0D9488]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[14px] font-medium">Last name</span>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  className="tap-target w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[16px] outline-none focus:border-[#0D9488]"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-[14px] font-medium">Phone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                className="tap-target w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[16px] outline-none focus:border-[#0D9488]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[14px] font-medium">Preferred contact</span>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as Person["channel"])}
                className="tap-target w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[16px] outline-none focus:border-[#0D9488]"
              >
                <option>WhatsApp</option>
                <option>Call</option>
                <option>Visit</option>
                <option>Other</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[14px] font-medium">Interests</span>
              <input
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g. Music, Young Adults"
                className="tap-target w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[16px] outline-none focus:border-[#0D9488]"
              />
            </label>
            {saveNote && saveNote !== "Saved ✓" && (
              <p className="text-[13px] font-medium text-[#DC2626]">⚠ {saveNote}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveContact}
                className="tap-target flex-1 rounded-lg bg-[#0D9488] text-[14px] font-semibold text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="tap-target flex-1 rounded-lg border border-[#E5E7EB] text-[14px] font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>
    </Shell>
  );
}
