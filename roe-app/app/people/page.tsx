// P03 / F03.01 People — Attio directory + SaaS Interface search/filter.
"use client";
import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { Shell, Card, StatusPill, ContactButtons, inputCls } from "@/components/ui";
import { usePeople } from "@/lib/use-people";

const FILTERS = ["All", "New", "Assigned", "Contacted", "Connecting", "Connected"] as const;

export default function PeoplePage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const { people, demo, forbidden } = usePeople();

  const list = people.filter(
    (p) =>
      (filter === "All" || p.journey === filter) &&
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Shell title="People" tab="people">
      {demo && (
        <p className="mb-2 rounded-lg bg-[#DBEAFE] p-2 text-[12px] text-[#1E3A8A]">
          Demo data — sign in with a pilot account for live data.
        </p>
      )}
      {forbidden && (
        <p className="mb-2 rounded-lg bg-[#FEE2E2] p-2 text-[12px] text-[#991B1B]">
          No organisation — ask your administrator to invite you.
        </p>
      )}
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            className={`${inputCls} pl-11`}
            placeholder="Search people"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search people"
          />
        </div>
        <Link
          href="/people/new"
          className="tap-target flex shrink-0 items-center rounded-lg bg-[#0D9488] px-4 text-[14px] font-semibold text-white"
        >
          + Add
        </Link>
      </div>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" role="group" aria-label="Filter by journey stage">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium ${
              filter === f ? "bg-[#0D9488] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-[#6B7280]">
        {list.length} {list.length === 1 ? "person" : "people"}
        {filter !== "All" ? ` · ${filter}` : ""}
        {q.trim() ? ` · matching “${q.trim()}”` : ""}
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {list.map((p) => (
          <Card key={p.id}>
            <Link href={`/people/${p.id}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-[16px] font-semibold">
                  {p.firstName} {p.lastName}
                </p>
                <StatusPill text={p.journey} />
              </div>
              <p className="mt-1 text-[13px] text-[#6B7280]">
                {p.group ?? "No group yet"} · Next: {p.nextAction}
              </p>
            </Link>
            {p.phone && <ContactButtons phone={p.phone} />}
          </Card>
        ))}
        {list.length === 0 && (
          <Card>
            <p className="font-medium">
              {q.trim() ? `No results for “${q.trim()}”.` : `Nobody at “${filter}” yet.`}
            </p>
            <p className="text-[13px] text-[#6B7280]">
              Try another name, clear the filter, or add them as a new person.
            </p>
          </Card>
        )}
      </div>
    </Shell>
  );
}
