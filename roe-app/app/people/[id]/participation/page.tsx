"use client";
// P16–P17 / F06.06–07 Participation + Confirmed. Honest outcome required.
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";
import { loadPeople, savePeople } from "@/lib/data";

export default function Participation({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [outcome, setOutcome] = useState("Attended — welcomed");
  const [done, setDone] = useState(false);

  function save() {
    const confirmed = outcome.startsWith("Attended");
    savePeople(
      loadPeople().map((p) =>
        p.id === id
          ? {
              ...p,
              journey: confirmed ? ("Connected" as const) : ("Connecting" as const),
              group: confirmed ? "Young Adults" : p.group,
              nextAction: "Set next action",
            }
          : p
      )
    );
    setDone(true);
  }

  if (done)
    return (
      <Shell title="Connection confirmed">
        <Card>
          <p className="font-display text-[18px] font-semibold">
            {outcome.startsWith("Attended") ? "✓ Connection recorded" : "✓ Outcome recorded"}
          </p>
          <p className="mt-1 text-[14px] text-[#667370]">
            {outcome}. {outcome.startsWith("Attended") ? "Participation is recorded — belonging grows over time, not in one visit." : "Honest record kept. No penalty, no judgment — set the right next step."}
          </p>
        </Card>
        <div className="mt-3">
          <PrimaryButton href={`/people/${id}/next`}>
            Create next action →
          </PrimaryButton>
        </div>
      </Shell>
    );

  return (
    <Shell title="First participation" back={`/people/${id}/suggest`}>
      <div className="flex flex-col gap-4">
        <Field label="What happened after the introduction?">
          <select className={inputCls} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            <option>Attended — welcomed</option>
            <option>Attended — quiet, follow up</option>
            <option>Did not attend yet</option>
            <option>Not interested in this group</option>
          </select>
        </Field>
        <PrimaryButton onClick={save}>Save outcome</PrimaryButton>
      </div>
    </Shell>
  );
}
