"use client";
// P08–P09 / F05.05–07 Action Detail + In Progress. Live API, local fallback.
// Rule: starting a task must not imply contact happened.
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Shell, Card, PrimaryButton, SecondaryButton } from "@/components/ui";
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

export default function ActionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [remote, setRemote] = useState<RemoteDetail | null>(null);
  const [action, setAction] = useState<FollowAction | undefined>();

  useEffect(() => {
    fetch(`/api/actions/${id}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data) setRemote(j.data as RemoteDetail);
      })
      .catch(() => {});
    try {
      setAction(loadActions().find((a) => a.id === id));
    } catch {}
  }, [id]);

  async function start() {
    try {
      const r = await fetch(`/api/actions/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ to: "In Progress" }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.data) {
        setRemote(j.data as RemoteDetail);
        return;
      }
    } catch {}
    const all = loadActions().map((a) =>
      a.id === id ? { ...a, status: "In Progress" as const } : a
    );
    saveActions(all);
    setAction(all.find((a) => a.id === id));
  }

  if (remote) {
    return (
      <Shell title={remote.title} back="/actions" tab="actions">
        <Card>
          <p className="font-display text-[18px] font-semibold">{remote.title}</p>
          <p className="text-[14px] text-[#667370]">
            {remote.personName} · {remote.personPhone}
          </p>
          <p className="font-mono2 mt-1 text-[12px] text-[#667370]">
            Due {remote.dueLabel} · {remote.status}
          </p>
          <p className="mt-2 rounded-lg bg-[#DBEAFE] p-2 text-[13px] text-[#1E3A8A]">
            Starting records that work began — not that contact occurred.
          </p>
        </Card>
        <div className="mt-3 flex flex-col gap-2">
          {remote.status === "Open" ? (
            <PrimaryButton onClick={start}>Start action</PrimaryButton>
          ) : (
            <PrimaryButton href={`/actions/${remote.id}/record`}>
              Record interaction
            </PrimaryButton>
          )}
          <SecondaryButton href="/actions">Reschedule / back</SecondaryButton>
          <Link href={`/people/${remote.personId}`} className="text-center text-[13px] text-[#667370]">
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
        <p className="font-display text-[18px] font-semibold">{action.title}</p>
        <p className="text-[14px] text-[#667370]">
          {person ? `${person.firstName} ${person.lastName} · ${person.phone}` : ""}
        </p>
        <p className="font-mono2 mt-1 text-[12px] text-[#667370]">
          Due {action.due} · {action.status}
        </p>
        <p className="mt-2 rounded-lg bg-[#DBEAFE] p-2 text-[13px] text-[#1E3A8A]">
          Demo data — sign in for live actions. Starting this task records that
          work began, not contact.
        </p>
      </Card>
      <div className="mt-3 flex flex-col gap-2">
        {action.status === "Open" ? (
          <PrimaryButton onClick={start}>Start action</PrimaryButton>
        ) : (
          <PrimaryButton href={`/actions/${action.id}/record`}>
            Record interaction
          </PrimaryButton>
        )}
        <SecondaryButton href="/actions">Reschedule / back</SecondaryButton>
        <Link href={`/people/${action.personId}`} className="text-center text-[13px] text-[#667370]">
          Open person profile →
        </Link>
      </div>
    </Shell>
  );
}
