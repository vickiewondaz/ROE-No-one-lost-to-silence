"use client";
// P16–P17 / F06.06–07 Participation + Confirmed. Live API, local fallback.
// Honest outcome required; only attended outcomes can be confirmed.
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";
import { loadPeople, savePeople } from "@/lib/data";

const OPTIONS = [
  { label: "Attended — welcomed", result: "attended" },
  { label: "Attended — quiet, follow up", result: "attended" },
  { label: "Did not attend yet", result: "not-attended" },
  { label: "Not interested in this group", result: "not-interested" },
] as const;

export default function Participation({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [outcome, setOutcome] = useState<string>(OPTIONS[0].label);
  const [connId, setConnId] = useState<string | null>(null);
  const [done, setDone] = useState<null | { attended: boolean; text: string }>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/connections?personId=${id}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const list = (j?.data ?? []) as { id: string; status: string }[];
        const open = list.find((c) => c.status === "Introduced" || c.status === "ParticipationRecorded");
        if (open) setConnId(open.id);
      })
      .catch(() => {});
  }, [id]);

  function localSave() {
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
    setDone({ attended: confirmed, text: outcome });
  }

  async function save() {
    setError("");
    const result = OPTIONS.find((o) => o.label === outcome)?.result ?? "not-attended";
    if (connId) {
      try {
        const r1 = await fetch(`/api/connections/${connId}/outcome`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ result }),
        });
        const j1 = await r1.json().catch(() => null);
        if (!r1.ok) {
          setError(j1?.error ?? "Couldn't save the outcome.");
          return;
        }
        if (result === "attended") {
          const r2 = await fetch(`/api/connections/${connId}/confirm`, {
            method: "POST",
            credentials: "same-origin",
          });
          const j2 = await r2.json().catch(() => null);
          if (!r2.ok) {
            setError(j2?.error ?? "Couldn't confirm the connection.");
            return;
          }
        }
        setDone({ attended: result === "attended", text: outcome });
        return;
      } catch {}
    }
    localSave();
  }

  if (done)
    return (
      <Shell title="Connection confirmed">
        <Card>
          <p className="font-display text-[18px] font-semibold">
            {done.attended ? "✓ Connection recorded" : "✓ Outcome recorded"}
          </p>
          <p className="mt-1 text-[14px] text-[#667370]">
            {done.text}.{" "}
            {done.attended
              ? "Participation is recorded — belonging grows over time, not in one visit."
              : "Honest record kept. No penalty, no judgment — set the right next step."}
          </p>
        </Card>
        <div className="mt-3">
          <PrimaryButton href={`/people/${id}/next`}>Create next action →</PrimaryButton>
        </div>
      </Shell>
    );

  return (
    <Shell title="First participation" back={`/people/${id}/suggest`}>
      <div className="flex flex-col gap-4">
        {!connId && (
          <p className="rounded-lg bg-[#DBEAFE] p-2 text-[12px] text-[#1E3A8A]">
            Demo data — sign in and record an introduction first for live tracking.
          </p>
        )}
        <Field label="What happened after the introduction?" error={error}>
          <select className={inputCls} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            {OPTIONS.map((o) => (
              <option key={o.label}>{o.label}</option>
            ))}
          </select>
        </Field>
        <PrimaryButton onClick={save}>Save outcome</PrimaryButton>
      </div>
    </Shell>
  );
}
