// MORE tab + prototype index (all 20 frames for review).
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Card } from "@/components/ui";

const FRAMES: [string, string][] = [
  ["P01 Login", "/login"],
  ["P02 Home", "/home"],
  ["P03 People", "/people"],
  ["P04 Create Person", "/people/new"],
  ["P05 Person Created (after save)", "/people/sarah/created"],
  ["P06 Assign (Sarah)", "/people/sarah/assign"],
  ["P07 Profile (Sarah)", "/people/sarah"],
  ["P08 Action Detail (a1)", "/actions/a1"],
  ["P09 In Progress (tap Start)", "/actions/a1"],
  ["P10 Record (from detail)", "/actions/a1/record"],
  ["P11 Recorded", "/actions/a1/recorded"],
  ["P12 Journey (in Profile thread)", "/people/sarah"],
  ["P13 Suggested", "/people/sarah/suggest"],
  ["P14–P15 Intro/Sent (Continue)", "/people/sarah/suggest"],
  ["P16–P17 Participation/Confirmed", "/people/sarah/participation"],
  ["P18 Next Action", "/people/sarah/next"],
  ["P19 Updated Profile", "/people/sarah"],
  ["P20 Updated Home", "/home"],
];

export default function More() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data && ["admin", "senior"].includes(j.data.role)) setIsAdmin(true);
      })
      .catch(() => {});
  }, []);
  return (
    <Shell title="More" tab="more">
      {isAdmin && (
        <Link
          href="/admin"
          className="mb-3 block rounded-xl border border-[#0F766E]/40 bg-[#CCFBF1]/40 p-4"
        >
          <p className="font-display font-semibold text-[#115E59]">Administration →</p>
          <p className="text-[13px] text-[#667370]">Team, invitations, organisation</p>
        </Link>
      )}
      <Card>
        <p className="font-display font-semibold">Connections · Care (P1) · Insights (P2)</p>
        <p className="text-[13px] text-[#667370]">
          MVP shows Connections via People flow. Care, celebrations, AI, admin
          depth are future — tagged, not built.
        </p>
      </Card>
      <Link
        href="/settings/password"
        className="mt-2 block rounded-lg border border-[#E2E8E6] bg-white px-3 py-2.5 text-[14px] font-medium text-[#0F766E]"
      >
        Change password →
      </Link>
      <h2 className="font-display mt-4 text-[16px] font-semibold">
        Prototype index — all 20 frames
      </h2>
      <div className="mt-2 flex flex-col gap-1.5">
        {FRAMES.map(([label, href]) => (
          <Link
            key={label}
            href={href}
            className="rounded-lg border border-[#E2E8E6] bg-white px-3 py-2.5 text-[14px] font-medium text-[#0F766E]"
          >
            {label} →
          </Link>
        ))}
      </div>
      <p className="mt-3 font-mono2 text-[12px] text-[#667370]">
        Refs: Mobbin flows · Attio IA · Luma groups · SaaSUI home/states ·
        SaaS Interface forms · Dribbble polish
      </p>
    </Shell>
  );
}
