"use client";
// P08–P09 / F05.05–07 Action Detail + In Progress.
// Rule: starting a task must not imply contact happened.
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Shell, Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { loadActions, saveActions, loadPeople, type FollowAction } from "@/lib/data";

export default function ActionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [action, setAction] = useState<FollowAction | undefined>();

  useEffect(() => {
    setAction(loadActions().find((a) => a.id === id));
  }, [id]);

  function start() {
    const all = loadActions().map((a) =>
      a.id === id ? { ...a, status: "In Progress" as const } : a
    );
    saveActions(all);
    setAction(all.find((a) => a.id === id));
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
          Starting this task records that work began — not that contact
          occurred. Only Record Interaction proves contact.
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
        <Link
          href={`/people/${action.personId}`}
          className="text-center text-[13px] text-[#667370]"
        >
          Open person profile →
        </Link>
      </div>
    </Shell>
  );
}
