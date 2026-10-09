"use client";
// P13–P15 / F06.03–05 Suggested → Introduction → Sent. Live API, local fallback.
// Suggestion = possibility, human decides. Intro = handoff, not attendance.
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { loadPeople } from "@/lib/data";

interface Group {
  id: string;
  name: string;
  description: string;
}

export default function Suggest({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [step, setStep] = useState<"suggest" | "intro" | "sent">("suggest");
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [connId, setConnId] = useState<string | null>(null);
  const [error, setError] = useState("");

  let personName = "this person";
  let interests = "general fellowship";
  try {
    const p = loadPeople().find((x) => x.id === id);
    if (p) {
      personName = `${p.firstName} ${p.lastName}`;
      interests = p.interests ?? interests;
    }
  } catch {}

  useEffect(() => {
    fetch("/api/groups", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (Array.isArray(j?.data)) setGroups(j.data as Group[]);
      })
      .catch(() => {});
  }, []);

  const suggestion = groups?.[0] ?? null;

  async function beginIntro() {
    setError("");
    if (!suggestion) {
      setStep("intro");
      return;
    }
    try {
      const r = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ personId: id, groupId: suggestion.id }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.data?.id) {
        setConnId(j.data.id as string);
        setStep("intro");
        return;
      }
      setError(j?.error ?? "Couldn't record the suggestion.");
    } catch {
      setStep("intro");
    }
  }

  async function recordIntro() {
    setError("");
    if (!connId) {
      setStep("sent");
      return;
    }
    try {
      const r = await fetch(`/api/connections/${connId}/introduce`, {
        method: "POST",
        credentials: "same-origin",
      });
      const j = await r.json().catch(() => null);
      if (r.ok) {
        setStep("sent");
        return;
      }
      setError(j?.error ?? "Couldn't record the introduction.");
    } catch {
      setStep("sent");
    }
  }

  if (step === "suggest")
    return (
      <Shell title="Suggested connection" back={`/people/${id}`}>
        <Card>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#92400E]">
            Possible connection — review needed
          </p>
          <p className="font-display mt-1 text-[18px] font-semibold">
            {suggestion ? suggestion.name : "Young Adults Fellowship"}
          </p>
          <p className="mt-1 text-[14px] text-[#667370]">
            {personName} is interested in {interests}.
            {suggestion?.description ? ` ${suggestion.description}.` : " Meets Fridays 6pm · Leader: Grace."}
          </p>
          <p className="mt-1 text-[13px] text-[#667370]">A suggestion, not a match. You decide.</p>
          {error && <p className="mt-1 text-[13px] font-medium text-[#DC2626]">⚠ {error}</p>}
        </Card>
        <div className="mt-3 flex flex-col gap-2">
          <PrimaryButton onClick={beginIntro}>Continue with introduction</PrimaryButton>
          <SecondaryButton href={`/people/${id}`}>Dismiss / choose another</SecondaryButton>
        </div>
      </Shell>
    );

  if (step === "intro")
    return (
      <Shell title="Introduction" back={`/people/${id}/suggest`}>
        <Card>
          <p className="font-display font-semibold">
            {personName} → {suggestion ? suggestion.name : "Young Adults"}
          </p>
          <p className="text-[13px] text-[#667370]">
            Human handoff. This is not a live WhatsApp API integration — you
            message/introduce, then record it here.
          </p>
          {error && <p className="mt-1 text-[13px] font-medium text-[#DC2626]">⚠ {error}</p>}
        </Card>
        <div className="mt-3 flex flex-col gap-2">
          <PrimaryButton onClick={recordIntro}>Record introduction handoff</PrimaryButton>
          <SecondaryButton onClick={() => setStep("suggest")}>Back</SecondaryButton>
        </div>
      </Shell>
    );

  return (
    <Shell title="Introduction sent">
      <Card>
        <p className="font-display text-[18px] font-semibold">✓ Introduction recorded</p>
        <p className="mt-1 text-[14px] text-[#667370]">
          Introduction is not attendance. Record what actually happens next.
        </p>
      </Card>
      <div className="mt-3 flex flex-col gap-2">
        <PrimaryButton
          href={connId ? `/people/${id}/participation?conn=${connId}` : `/people/${id}/participation`}
        >
          Record participation outcome →
        </PrimaryButton>
        <SecondaryButton onClick={() => router.push(`/people/${id}`)}>Back to profile</SecondaryButton>
      </div>
    </Shell>
  );
}
