"use client";
// P07+P12+P19 / F04.01+F04.02 — Person Profile: Attio detail hierarchy +
// Luma context. Human Context Card + Relationship Thread patterns.
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Shell, Card, StatusPill } from "@/components/ui";
import { loadPeople, type Person } from "@/lib/data";

export default function Profile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [person, setPerson] = useState<Person | undefined>();
  useEffect(() => {
    setPerson(loadPeople().find((p) => p.id === id));
  }, [id]);

  if (!person)
    return (
      <Shell title="Person" back="/people" tab="people">
        <Card>
          <p className="font-medium">Restricted or not found.</p>
          <p className="text-[13px] text-[#667370]">
            You don&apos;t have permission, or the record was removed.
          </p>
        </Card>
      </Shell>
    );

  return (
    <Shell
      title={`${person.firstName} ${person.lastName}`}
      back="/people"
      tab="people"
    >
      {/* Header — Call | WhatsApp | Next Action */}
      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-display text-[20px] font-semibold">
              {person.firstName} {person.lastName}
            </p>
            <p className="font-mono2 text-[12px] text-[#667370]">
              {person.phone}
            </p>
          </div>
          <StatusPill text={person.journey} />
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
        <p className="mt-2 text-[13px] text-[#667370]">
          Assigned: {person.assignee} · Prefers {person.channel}
        </p>
      </Card>

      {/* Next Action — core pattern */}
      <div className="mt-3 rounded-xl border border-[#D97706]/40 bg-[#FFFBEB] p-4">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#92400E]">
          Next action
        </p>
        <p className="font-display font-semibold">{person.nextAction}</p>
        <p className="text-[13px] text-[#667370]">
          Suggested because: {person.interests ?? "new contact"} · no confirmed
          connection yet
        </p>
      </div>

      {/* Relationship Thread — vertical mobile */}
      <h2 className="font-display mt-4 text-[16px] font-semibold">
        Relationship thread
      </h2>
      <div className="mt-2 flex flex-col gap-0">
        {[
          ["●", "First contact recorded", "Done"],
          ["●", `Follow-up assigned to ${person.assignee}`, "Done"],
          ["◐", person.lastContact ?? "No interaction recorded yet", "Current"],
          ["○", "Introduction → participation → confirmed", "Upcoming"],
        ].map(([dot, text, state], i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="text-[#0F766E]">{dot}</span>
              {i < 3 && <span className="w-px flex-1 bg-[#E2E8E6]" />}
            </div>
            <div className="pb-4">
              <p className="text-[14px] font-medium">{text}</p>
              <p className="font-mono2 text-[12px] text-[#667370]">{state}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[13px] text-[#667370]">
        Thread shows recorded facts only. It never invents a successful outcome.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href={`/people/${person.id}/suggest`}
          className="tap-target rounded-lg border border-[#E2E8E6] bg-white py-3 text-center text-[14px] font-semibold text-[#0F766E]"
        >
          Suggested connection
        </Link>
        <Link
          href={`/actions`}
          className="tap-target rounded-lg border border-[#E2E8E6] bg-white py-3 text-center text-[14px] font-medium"
        >
          View actions
        </Link>
      </div>
    </Shell>
  );
}
