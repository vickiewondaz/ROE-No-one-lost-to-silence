"use client";
// ServicesUpcoming — "what's on" from the admin-managed organisation calendar.
// Weekly services resolve to their next date; specials show while upcoming.
// Silent when signed out or when the community hasn't listed any services yet.
import { useEffect, useState } from "react";
import { Card, SectionHead } from "@/components/ui";

interface Service {
  id: string;
  name: string;
  kind: string;
  weekday: number | null;
  date: string | null;
  time: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayLabel(d: Date): string {
  const t = startOfToday().getTime();
  const diff = Math.round((d.getTime() - t) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export default function ServicesUpcoming({ title }: { title?: string }) {
  const [items, setItems] = useState<{ id: string; name: string; time: string; when: Date; special: boolean }[] | null>(null);

  useEffect(() => {
    fetch("/api/services", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!Array.isArray(j?.data)) return;
        const today = startOfToday();
        const out: { id: string; name: string; time: string; when: Date; special: boolean }[] = [];
        for (const s of j.data as Service[]) {
          if (s.kind === "special") {
            if (!s.date) continue;
            const d = new Date(s.date + "T00:00:00");
            if (isNaN(d.getTime()) || d < today) continue;
            out.push({ id: s.id, name: s.name, time: s.time ?? "", when: d, special: true });
          } else {
            if (s.weekday === null || s.weekday === undefined) continue;
            const d = new Date(today);
            d.setDate(d.getDate() + ((s.weekday - d.getDay() + 7) % 7));
            out.push({ id: s.id, name: s.name, time: s.time ?? "", when: d, special: false });
          }
        }
        out.sort((a, b) => a.when.getTime() - b.when.getTime());
        setItems(out.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  if (!items || items.length === 0) return null;
  return (
    <>
      <div className="mt-4">
        <SectionHead title={title ?? "Services"} count={items.length} />
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {items.map((it) => (
          <Card key={it.id}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[14px] font-medium">
                {it.special && <span aria-hidden>✦ </span>}{it.name}
              </p>
              <span className="font-mono2 shrink-0 text-[12px] text-[#6B7280]">{dayLabel(it.when)}</span>
            </div>
            {it.time && <p className="mt-0.5 text-[13px] text-[#6B7280]">{it.time}</p>}
          </Card>
        ))}
      </div>
    </>
  );
}
