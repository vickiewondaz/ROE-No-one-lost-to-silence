// P03 / F03.01 People — Attio directory + SaaS Interface search/filter.
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Card, StatusPill, inputCls } from "@/components/ui";
import { loadPeople, type Person } from "@/lib/data";

export default function PeoplePage() {
  const [q, setQ] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  useEffect(() => setPeople(loadPeople()), []);

  const list = people.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Shell title="People" tab="people">
      <div className="flex gap-2">
        <input
          className={inputCls}
          placeholder="Search people"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search people"
        />
        <Link
          href="/people/new"
          className="tap-target flex shrink-0 items-center rounded-lg bg-[#0F766E] px-4 text-[14px] font-semibold text-white"
        >
          + Add
        </Link>
      </div>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {["All", "New", "Assigned", "Contacted", "Connecting"].map((f, i) => (
          <span
            key={f}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium ${
              i === 0 ? "bg-[#0F766E] text-white" : "bg-white text-[#667370] border border-[#E2E8E6]"
            }`}
          >
            {f}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-[#667370]">
        Assigned to me · {list.length} people
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {list.map((p) => (
          <Link key={p.id} href={`/people/${p.id}`}>
            <Card>
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-[16px] font-semibold">
                  {p.firstName} {p.lastName}
                </p>
                <StatusPill text={p.journey} />
              </div>
              <p className="mt-1 text-[13px] text-[#667370]">
                {p.group ?? "No group yet"} · Next: {p.nextAction}
              </p>
            </Card>
          </Link>
        ))}
        {list.length === 0 && (
          <Card>
            <p className="font-medium">No results for “{q}”.</p>
            <p className="text-[13px] text-[#667370]">
              Try another name, or add them as a new person.
            </p>
          </Card>
        )}
      </div>
    </Shell>
  );
}
