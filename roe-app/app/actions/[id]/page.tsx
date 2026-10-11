"use client";
// P08–P09 / F05.05–07 Task detail. Priority 3: every task shows its OWNER and
// clear STATUS; reschedule/reassign in one tap. Starting ≠ contact.
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Shell, Card, PrimaryButton, SecondaryButton, Avatar, StatusPill, Field, inputCls } from "@/components/ui";
import { loadActions, saveActions, loadPeople, type FollowAction } from "@/lib/data";

interface RemoteDetail {
  id: string;
  personId: string;
  personName: string;
  personPhone: string;
  title: string;
  status: string;
  dueLabel: string;
}
interface Member {
  id: string;
  name: string;
}

// Service rhythm: Sundays are the anchor day. "This Sunday" = upcoming Sunday
// (today if already Sunday); "Next Sunday" = the one after.
function dueISO(label: string): string {
  const d = new Date();
  if (label === "Tomorrow") d.setDate(d.getDate() + 1);
  else if (label === "+3 days") d.setDate(d.getDate() + 3);
  else if (label === "This Sunday") d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  else if (label === "Next Sunday") d.setDate(d.getDate() + ((7 - d.getDay()) % 7) + 7);
  return d.toISOString().slice(0, 10);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ActionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [remote, setRemote] = useState<RemoteDetail | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [assignee, setAssignee] = useState("");
  const [note, setNote] = useState("");
  const [customDue, setCustomDue] = useState("");
  const [action, setAction] = useState<FollowAction | undefined>();

  async function refresh() {
    const r = await fetch(`/api/actions/${id}`, { credentials: "same-origin" });
    const j = await r.json().catch(() => null);
    if (r.ok && j?.data) setRemote(j.data as RemoteDetail);
  }

  useEffect(() => {
    refresh().catch(() => {});
    fetch("/api/users", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (Array.isArray(j?.data)) setMembers(j.data as Member[]);
      })
      .catch(() => {});
    try {
      setAction(loadActions().find((a) => a.id === id));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function mutate(path: string, body: object, okMsg: string) {
    try {
      const r = await fetch(path, {
        method: path.endsWith("transition") ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.data) {
        setRemote(j.data as RemoteDetail);
        setNote(okMsg);
        return;
      }
      setNote(j?.error ?? "Couldn't save it.");
    } catch {
      setNote("Couldn't reach the server.");
    }
  }

  if (remote) {
    return (
      <Shell title={remote.title} back="/actions" tab="actions">
        <Card>
          <div className="flex items-center gap-3">
            <Avatar name={remote.personName} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[18px] font-semibold">{remote.title}</p>
              <p className="truncate text-[14px] text-[#6B7280]">
                {remote.personName} · {remote.personPhone}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusPill text={remote.status} />
                <span className="font-mono2 text-[12px] text-[#6B7280]">due {remote.dueLabel}</span>
              </div>
            </div>
          </div>
          <p className="mt-2 rounded-lg bg-[#DBEAFE] p-2 text-[13px] text-[#1E3A8A]">
            Starting records that work began — only Record Interaction proves contact.
          </p>
        </Card>

        {remote.status === "Open" ? (
          <div className="mt-3">
            <PrimaryButton onClick={() => mutate(`/api/actions/${id}/transition`, { to: "In Progress" }, "Started ✓")}>
              Start action
            </PrimaryButton>
          </div>
        ) : remote.status !== "Completed" ? (
          <div className="mt-3">
            <PrimaryButton href={`/actions/${id}/record`}>Record interaction</PrimaryButton>
          </div>
        ) : (
          <Card>
            <p className="text-[14px] text-[#6B7280]">Completed ✓ — see the journey for what comes next.</p>
          </Card>
        )}

        {remote.status !== "Completed" && (
          <>
            <div className="mt-4">
              <p className="font-display text-[15px] font-semibold">Reschedule</p>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {["Today", "Tomorrow", "+3 days", "This Sunday", "Next Sunday"].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => mutate(`/api/actions/${id}`, { dueAt: dueISO(label) }, `Moved to ${label} ✓`)}
                  className="tap-target rounded-lg border border-[#E5E7EB] bg-white text-[13px] font-medium"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="date"
                value={customDue}
                min={todayISO()}
                onChange={(e) => setCustomDue(e.target.value)}
                aria-label="Pick a date"
                className="tap-target min-w-0 flex-1 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] outline-none focus:border-[#0D9488]"
              />
              <button
                type="button"
                disabled={!customDue}
                onClick={() => mutate(`/api/actions/${id}`, { dueAt: customDue }, "Moved ✓")}
                className="tap-target shrink-0 rounded-lg bg-[#0D9488] px-4 text-[14px] font-semibold text-white disabled:opacity-40"
              >
                Set date
              </button>
            </div>
            {members && members.length > 0 && (
              <>
                <div className="mt-4">
                  <p className="font-display text-[15px] font-semibold">Reassign</p>
                </div>
                <Field label="Owner">
                  <select className={inputCls} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                    <option value="">Keep current owner…</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </Field>
                {assignee && (
                  <div className="mt-2">
                    <PrimaryButton
                      onClick={() => {
                        mutate(`/api/actions/${id}`, { assigneeUserId: assignee }, "Reassigned ✓");
                        setAssignee("");
                      }}
                    >
                      Hand over
                    </PrimaryButton>
                  </div>
                )}
              </>
            )}
          </>
        )}
        {note && (
          <p className="mt-3 rounded-lg bg-[#DCFCE7] p-2 text-[13px] font-medium text-[#15803D]">{note}</p>
        )}
        <div className="mt-3 flex flex-col gap-2">
          <SecondaryButton href="/actions">Back to follow-ups</SecondaryButton>
          <Link href={`/people/${remote.personId}`} className="text-center text-[13px] text-[#6B7280]">
            Open person profile →
          </Link>
        </div>
      </Shell>
    );
  }

  if (!action)
    return (
      <Shell title="Action" back="/actions" tab="actions">
        <Card>
          <p className="font-medium">Action not found or restricted.</p>
        </Card>
      </Shell>
    );

  const person = (() => {
    try {
      return loadPeople().find((p) => p.id === action.personId);
    } catch {
      return undefined;
    }
  })();

  return (
    <Shell title={action.title} back="/actions" tab="actions">
      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={person ? `${person.firstName} ${person.lastName}` : "?"} />
          <div>
            <p className="font-display text-[18px] font-semibold">{action.title}</p>
            <p className="text-[14px] text-[#6B7280]">
              {person ? `${person.firstName} ${person.lastName}` : ""} · Due {action.due} · {action.status}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[13px] text-[#6B7280]">
          Demo data — sign in for live actions with reschedule and handover.
        </p>
      </Card>
      <div className="mt-3 flex flex-col gap-2">
        {action.status === "Open" ? (
          <PrimaryButton
            onClick={() => {
              const all = loadActions().map((a) =>
                a.id === id ? { ...a, status: "In Progress" as const } : a
              );
              saveActions(all);
              setAction(all.find((a) => a.id === id));
            }}
          >
            Start action
          </PrimaryButton>
        ) : (
          <PrimaryButton href={`/actions/${action.id}/record`}>Record interaction</PrimaryButton>
        )}
        <SecondaryButton href="/actions">Back to follow-ups</SecondaryButton>
      </div>
    </Shell>
  );
}
