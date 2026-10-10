"use client";
// P07+P12 / F04 — Person profile, Priority 2: visits, attempts, responses,
// preferences, worker, next steps. Sensitive pastoral notes live elsewhere
// (P1 care) — a locked placeholder marks the boundary, never the content.
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Shell, Card, StatusPill, Avatar, JourneyStepper, SectionHead, inputCls } from "@/components/ui";
import { loadPeople, type Person } from "@/lib/data";

interface ProfileDTO extends Person {
  interests: string;
  group?: string;
}
interface FeedItem {
  at: string;
  kind: string;
  title: string;
  detail: string;
}
interface Milestone {
  id: string;
  type: string;
  month: string;
  day: string;
  notes: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, yest)) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

const KIND_ICON: Record<string, string> = {
  interaction: "✆",
  action: "✓",
  connection: "◍",
};

export default function Profile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [person, setPerson] = useState<ProfileDTO | undefined>();
  const [feed, setFeed] = useState<FeedItem[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[] | null>(null);
  const [mType, setMType] = useState("birthday");
  const [mMonth, setMMonth] = useState("1");
  const [mDay, setMDay] = useState("");
  const [mError, setMError] = useState("");

  useEffect(() => {
    fetch(`/api/people/${id}`)
      .then((r) => {
        if (r.status === 404 || r.status === 403) {
          setMissing(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((j) => {
        if (j?.data) {
          setPerson(j.data as ProfileDTO);
          return;
        }
        try {
          const local = loadPeople().find((p) => p.id === id) as ProfileDTO | undefined;
          if (local) setPerson(local);
          else setMissing(true);
        } catch {
          setMissing(true);
        }
      })
      .catch(() => {
        try {
          const p = loadPeople().find((x) => x.id === id) as ProfileDTO | undefined;
          if (p) setPerson(p);
          else setMissing(true);
        } catch {
          setMissing(true);
        }
      });
    fetch(`/api/people/${id}/timeline`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (Array.isArray(j?.data)) setFeed(j.data as FeedItem[]);
      })
      .catch(() => {});
    fetch(`/api/people/${id}/milestones`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (Array.isArray(j?.data)) setMilestones(j.data as Milestone[]);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (missing && !person)
    return (
      <Shell title="Person" back="/people" tab="people">
        <Card>
          <p className="font-medium">Restricted or not found.</p>
          <p className="text-[13px] text-[#667370]">
            You don't have permission, or the record was removed.
          </p>
        </Card>
      </Shell>
    );
  if (!person)
    return (
      <Shell title="Person" back="/people" tab="people">
        <Card>
          <p className="text-[14px] text-[#667370]">Loading…</p>
        </Card>
      </Shell>
    );

  const grouped = new Map<string, FeedItem[]>();
  for (const e of feed ?? []) {
    const k = dayLabel(e.at);
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(e);
  }

  return (
    <Shell title={`${person.firstName} ${person.lastName}`} back="/people" tab="people">
      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={`${person.firstName} ${person.lastName}`} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-[20px] font-semibold">
              {person.firstName} {person.lastName}
            </p>
            <p className="font-mono2 text-[12px] text-[#667370]">{person.phone}</p>
            <div className="mt-1">
              <StatusPill text={person.journey} />
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <a
            href={`tel:${person.phone}`}
            className="tap-target rounded-lg border border-[#E2E8E6] py-2 text-center text-[14px] font-medium"
          >
            Call
          </a>
          <a
            href={`https://wa.me/${person.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="tap-target rounded-lg border border-[#E2E8E6] py-2 text-center text-[14px] font-medium"
          >
            WhatsApp
          </a>
          <Link
            href={`/people/${person.id}/next`}
            className="tap-target rounded-lg bg-[#0F766E] py-2 text-center text-[14px] font-semibold text-white"
          >
            Next Action
          </Link>
        </div>
      </Card>

      <div className="mt-4">
        <SectionHead title="Journey" />
      </div>
      <Card>
        <JourneyStepper current={person.journey} />
      </Card>

      <div className="mt-4">
        <SectionHead title="Details & preferences" />
      </div>
      <Card>
        <dl className="flex flex-col gap-1.5 text-[14px]">
          <div className="flex justify-between gap-3">
            <dt className="text-[#667370]">Contact</dt>
            <dd className="text-right font-medium">
              {person.channel} · {person.phone}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#667370]">Interests</dt>
            <dd className="text-right font-medium">{person.interests || "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#667370]">Group</dt>
            <dd className="text-right font-medium">{person.group ?? "Not connected yet"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#667370]">Follow-up owner</dt>
            <dd className="text-right font-medium">{person.assignee}</dd>
          </div>
        </dl>
      </Card>

      <div className="mt-4">
        <SectionHead title="Next step" />
      </div>
      <div className="rounded-xl border border-[#D97706]/40 bg-[#FFFBEB] p-4">
        <p className="font-display font-semibold">{person.nextAction}</p>
        <div className="mt-2 flex gap-2">
          <Link
            href={`/people/${person.id}/next`}
            className="tap-target flex-1 rounded-lg bg-[#0F766E] py-2 text-center text-[14px] font-semibold text-white"
          >
            Plan it
          </Link>
          <Link
            href={`/people/${person.id}/suggest`}
            className="tap-target flex-1 rounded-lg border border-[#E2E8E6] bg-white py-2 text-center text-[14px] font-medium"
          >
            Connect
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <SectionHead title="History" count={feed?.length} />
      </div>
      {feed === null ? (
        <Card>
          <div className="flex flex-col gap-1.5 text-[14px] text-[#667370]">
            <p>Today · Welcome follow-up completed</p>
            <p>Yesterday · Introduced to Young Adults</p>
            <p className="text-[12px]">(Sign in for the live timeline.)</p>
          </div>
        </Card>
      ) : feed.length === 0 ? (
        <Card>
          <p className="text-[14px] text-[#667370]">
            No history yet — the first recorded interaction starts this thread.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {[...grouped.entries()].map(([day, items]) => (
            <div key={day}>
              <p className="font-mono2 mb-1 text-[12px] uppercase tracking-wide text-[#667370]">
                {day}
              </p>
              <Card>
                <div className="flex flex-col gap-2">
                  {items.map((e, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span aria-hidden className="text-[#0F766E]">
                        {KIND_ICON[e.kind] ?? "•"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium">{e.title}</p>
                        {e.detail && (
                          <p className="text-[13px] text-[#667370]">{e.detail}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-dashed border-[#E2E8E6] p-4">
        <p className="text-[14px] font-medium">🔒 Pastoral notes — restricted</p>
        <p className="text-[13px] text-[#667370]">
          Sensitive care content lives in a separate restricted workflow (coming
          in a later release) — never in this timeline, never visible here.
        </p>
      </div>

      <div className="mt-4">
        <SectionHead title="Celebrations" count={milestones?.length} />
      </div>
      <Card>
        {milestones === null ? (
          <p className="text-[13px] text-[#667370]">Sign in to see recorded dates.</p>
        ) : milestones.length === 0 ? (
          <p className="text-[13px] text-[#667370]">
            None recorded — birthdays and anniversaries appear here so nobody's day passes unnoticed.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {milestones.map((m) => (
              <p key={m.id} className="text-[14px]">
                🎉 <strong className="capitalize">{m.type}</strong> · {MONTHS[Number(m.month) - 1]} {Number(m.day)}
                {m.notes ? ` · ${m.notes}` : ""}
              </p>
            ))}
          </div>
        )}
        <AddMilestone
          personId={id}
          mType={mType}
          setMType={setMType}
          mMonth={mMonth}
          setMMonth={setMMonth}
          mDay={mDay}
          setMDay={setMDay}
          mError={mError}
          setMError={setMError}
          onSaved={(m: Milestone) => setMilestones((prev) => [...(prev ?? []), m])}
        />
      </Card>
    </Shell>
  );
}

function AddMilestone(props: {
  personId: string;
  mType: string;
  setMType: (v: string) => void;
  mMonth: string;
  setMMonth: (v: string) => void;
  mDay: string;
  setMDay: (v: string) => void;
  mError: string;
  setMError: (v: string) => void;
  onSaved: (m: Milestone) => void;
}) {
  const { personId, mType, setMType, mMonth, setMMonth, mDay, setMDay, mError, setMError, onSaved } = props;
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap-target mt-2 w-full rounded-lg border border-[#E2E8E6] text-[14px] font-medium text-[#0F766E]"
      >
        + Add birthday or anniversary
      </button>
    );
  async function save() {
    setMError("");
    try {
      const r = await fetch(`/api/people/${personId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ type: mType, month: Number(mMonth), day: Number(mDay) }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.data) {
        onSaved(j.data as Milestone);
        setOpen(false);
        setMDay("");
        return;
      }
      setMError(j?.error ?? "Couldn't save it.");
    } catch {
      setMError("Couldn't reach the server.");
    }
  }
  return (
    <div className="mt-2 flex flex-col gap-2 rounded-lg bg-[#F8FAF9] p-3">
      <div className="grid grid-cols-3 gap-2">
        <select className={inputCls} value={mType} onChange={(e) => setMType(e.target.value)} aria-label="Type">
          <option value="birthday">Birthday</option>
          <option value="anniversary">Anniversary</option>
          <option value="milestone">Milestone</option>
        </select>
        <select className={inputCls} value={mMonth} onChange={(e) => setMMonth(e.target.value)} aria-label="Month">
          {MONTHS.map((m, i) => (
            <option key={m} value={String(i + 1)}>
              {m}
            </option>
          ))}
        </select>
        <input
          className={inputCls}
          value={mDay}
          onChange={(e) => setMDay(e.target.value)}
          placeholder="Day"
          inputMode="numeric"
          aria-label="Day"
        />
      </div>
      {mError && <p className="text-[13px] font-medium text-[#DC2626]">⚠ {mError}</p>}
      <p className="text-[12px] text-[#667370]">Month + day only — never ask the year.</p>
      <button
        type="button"
        onClick={save}
        className="tap-target rounded-lg bg-[#0F766E] text-[14px] font-semibold text-white"
      >
        Save date
      </button>
    </div>
  );
}
