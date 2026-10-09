// P02 / F02.02 Home — SaaSUI attention-centre + Dribbble card composition.
// Calm Attention language: facts + next step, never judgments.
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Card, AttentionPill, StatusPill } from "@/components/ui";
import { loadPeople, loadActions, type Person } from "@/lib/data";

export default function HomePage() {
  const [people, setPeople] = useState<Person[]>([]);
  useEffect(() => {
    setPeople(loadPeople());
    loadActions();
  }, []);

  const dueToday = loadActionsSafe().filter((a) => !a.overdue);
  const overdue = loadActionsSafe().filter((a) => a.overdue);
  const fresh = people.filter((p) => p.journey === "New" || p.journey === "Assigned");

  return (
    <Shell title="Good morning, David" tab="home">
      <section>
        <h2 className="font-display text-[16px] font-semibold">
          Needs attention
        </h2>
        <div className="mt-2 flex flex-col gap-2">
          {overdue.map((a) => (
            <Card key={a.id}>
              <AttentionPill text="Follow-up overdue" />
              <p className="font-display mt-1 font-semibold">
                {nameOf(a.personId, people)}
              </p>
              <p className="text-[13px] text-[#667370]">
                No outcome recorded yet · Due {a.due}
              </p>
              <Link
                href={`/actions/${a.id}`}
                className="mt-2 block text-center text-[14px] font-semibold text-[#0F766E]"
              >
                View action →
              </Link>
            </Card>
          ))}
          <Card>
            <p className="font-display font-semibold">
              {dueToday.length} follow-ups due today
            </p>
            <p className="text-[13px] text-[#667370]">
              New people needing follow-up · Pending connections
            </p>
            <Link
              href="/actions"
              className="mt-2 block rounded-lg bg-[#0F766E] py-3 text-center text-[15px] font-semibold text-white"
            >
              View today
            </Link>
          </Card>
        </div>
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[16px] font-semibold">
            New people
          </h2>
          <Link href="/people" className="text-[13px] font-medium text-[#0F766E]">
            View all
          </Link>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {people.slice(0, 3).map((p) => (
            <Link key={p.id} href={`/people/${p.id}`}>
              <Card>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-semibold">
                    {p.firstName} {p.lastName}
                  </p>
                  <StatusPill text={p.journey} />
                </div>
                <p className="mt-1 text-[13px] text-[#667370]">
                  Next: {p.nextAction} · {p.assignee}
                </p>
              </Card>
            </Link>
          ))}
          {fresh.length === 0 && (
            <Card>
              <p className="font-medium">You&apos;re all caught up.</p>
              <p className="text-[13px] text-[#667370]">
                New contacts will appear here with an owner.
              </p>
            </Card>
          )}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="font-display text-[16px] font-semibold">
          Recent relationship activity
        </h2>
        <Card>
          <p className="text-[14px]">
            Sarah was contacted via WhatsApp ·{" "}
            <span className="font-mono2 text-[12px] text-[#667370]">
              Today 4:20 PM
            </span>
          </p>
          <p className="mt-1 text-[14px]">
            Sarah introduced to Young Adults ·{" "}
            <span className="font-mono2 text-[12px] text-[#667370]">
              Yesterday
            </span>
          </p>
        </Card>
      </section>
    </Shell>
  );
}

function loadActionsSafe() {
  try {
    return loadActions();
  } catch {
    return [];
  }
}

function nameOf(pid: string, people: Person[]) {
  return (
    people.find((p) => p.id === pid)?.firstName ?? "Someone"
  );
}
