"use client";
// P11 Recorded confirmation.
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Shell, Card, PrimaryButton } from "@/components/ui";
import OfflineBanner from "@/components/offline-banner";
import { loadActions, loadPeople } from "@/lib/data";

export default function Recorded({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [outcome, setOutcome] = useState("");
  const [personId, setPersonId] = useState("");
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    setOutcome(sessionStorage.getItem("roe.lastOutcome") ?? "Interaction saved.");
    const pid = loadActions().find((a) => a.id === id)?.personId ?? "";
    setPersonId(pid);
    try {
      const p = (loadPeople() as { id: string; journey: string }[]).find((x) => x.id === pid);
      if (p?.journey === "Connected") setConnected(true);
    } catch {}
  }, [id]);

  return (
    <Shell title="Interaction recorded" tab="actions">
      <OfflineBanner />
      <Card>
        <p className="font-display text-[18px] font-semibold">✓ Saved</p>
        <p className="mt-1 text-[14px]">{outcome}</p>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          Record saved — not proof of connection. Continue to the journey.
        </p>
      </Card>
      <div className="mt-3">
        {connected && personId ? (
          <>
            <PrimaryButton href={`/people/${personId}`}>
              Back to profile →
            </PrimaryButton>
            <Link href="/home" className="mt-2 block text-center text-[13px] text-[#6B7280]">
              Back home
            </Link>
          </>
        ) : (
          <>
            <PrimaryButton href={personId ? `/people/${personId}/suggest` : "/home"}>
              Continue to connection →
            </PrimaryButton>
            <Link href="/home" className="mt-2 block text-center text-[13px] text-[#6B7280]">
              Back home
            </Link>
          </>
        )}
      </div>
    </Shell>
  );
}
