"use client";
// P13–P15 / F06.03–05 Suggested → Introduction → Sent.
// Luma group-detail hierarchy. Suggestion = possibility, human decides.
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { loadPeople } from "@/lib/data";

export default function Suggest({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [step, setStep] = useState<"suggest" | "intro" | "sent">("suggest");
  let personName = "this person";
  let interests = "general fellowship";
  try {
    const p = loadPeople().find((x) => x.id === id);
    if (p) {
      personName = `${p.firstName} ${p.lastName}`;
      interests = p.interests ?? interests;
    }
  } catch {}

  if (step === "suggest")
    return (
      <Shell title="Suggested connection" back={`/people/${id}`}>
        <Card>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#92400E]">
            Possible connection — review needed
          </p>
          <p className="font-display mt-1 text-[18px] font-semibold">
            Young Adults Fellowship
          </p>
          <p className="mt-1 text-[14px] text-[#667370]">
            {personName} is interested in {interests}. Meets Fridays 6pm · 40
            members · Leader: Grace.
          </p>
          <p className="mt-1 text-[13px] text-[#667370]">
            A suggestion, not a match. You decide.
          </p>
        </Card>
        <div className="mt-3 flex flex-col gap-2">
          <PrimaryButton onClick={() => setStep("intro")}>
            Continue with introduction
          </PrimaryButton>
          <SecondaryButton href={`/people/${id}`}>
            Dismiss / choose another
          </SecondaryButton>
        </div>
      </Shell>
    );

  if (step === "intro")
    return (
      <Shell title="Introduction" back={`/people/${id}/suggest`}>
        <Card>
          <p className="font-display font-semibold">
            {personName} → Young Adults
          </p>
          <p className="text-[13px] text-[#667370]">
            Human handoff. This is not a live WhatsApp API integration — you
            message/introduce, then record it here.
          </p>
        </Card>
        <div className="mt-3 flex flex-col gap-2">
          <PrimaryButton onClick={() => setStep("sent")}>
            Record introduction handoff
          </PrimaryButton>
          <SecondaryButton onClick={() => setStep("suggest")}>
            Back
          </SecondaryButton>
        </div>
      </Shell>
    );

  return (
    <Shell title="Introduction sent">
      <Card>
        <p className="font-display text-[18px] font-semibold">
          ✓ Introduction recorded
        </p>
        <p className="mt-1 text-[14px] text-[#667370]">
          Introduction is not attendance. Record what actually happens next.
        </p>
      </Card>
      <div className="mt-3 flex flex-col gap-2">
        <PrimaryButton href={`/people/${id}/participation`}>
          Record participation outcome →
        </PrimaryButton>
        <SecondaryButton onClick={() => router.push(`/people/${id}`)}>
          Back to profile
        </SecondaryButton>
      </div>
    </Shell>
  );
}
