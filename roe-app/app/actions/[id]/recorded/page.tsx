"use client";
// P11 Recorded confirmation.
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Shell, Card, PrimaryButton } from "@/components/ui";
import { loadActions } from "@/lib/data";

export default function Recorded({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [outcome, setOutcome] = useState("");
  const [personId, setPersonId] = useState("");
  useEffect(() => {
    setOutcome(sessionStorage.getItem("roe.lastOutcome") ?? "Interaction saved.");
    setPersonId(loadActions().find((a) => a.id === id)?.personId ?? "");
  }, [id]);

  return (
    <Shell title="Interaction recorded" tab="actions">
      <Card>
        <p className="font-display text-[18px] font-semibold">✓ Saved</p>
        <p className="mt-1 text-[14px]">{outcome}</p>
        <p className="mt-1 text-[13px] text-[#667370]">
          Record saved — not proof of connection. Continue to the journey.
        </p>
      </Card>
      <div className="mt-3">
        <PrimaryButton href={personId ? `/people/${personId}/suggest` : "/home"}>
          Continue to connection →
        </PrimaryButton>
        <Link href="/home" className="mt-2 block text-center text-[13px] text-[#667370]">
          Back home
        </Link>
      </div>
    </Shell>
  );
}
