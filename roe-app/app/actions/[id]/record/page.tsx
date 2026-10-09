"use client";
// P10–P11 / F05.08–09 Record + Recorded. Live POST, local fallback.
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";
import { loadActions, saveActions, loadPeople, savePeople } from "@/lib/data";

export default function Record({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [channel, setChannel] = useState("WhatsApp");
  const [outcome, setOutcome] = useState("Reached — warm conversation");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [livePerson, setLivePerson] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/actions/${id}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data?.personId) setLivePerson(j.data.personId as string);
      })
      .catch(() => {});
  }, [id]);

  function localSave() {
    const actions = loadActions().map((a) =>
      a.id === id ? { ...a, status: "Completed" as const, outcome } : a
    );
    saveActions(actions);
    const act = loadActions().find((a) => a.id === id);
    if (act) {
      savePeople(
        loadPeople().map((p) =>
          p.id === act.personId
            ? { ...p, journey: "Contacted", lastContact: `Today via ${channel}`, nextAction: "Pursue connection" }
            : p
        )
      );
      sessionStorage.setItem("roe.lastPerson", act.personId);
    }
    sessionStorage.setItem("roe.lastOutcome", `${channel} · ${outcome}${notes ? ` · ${notes}` : ""}`);
    router.push(`/actions/${id}/recorded`);
  }

  async function save() {
    setError("");
    if (livePerson) {
      try {
        const r = await fetch("/api/interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ personId: livePerson, actionId: id, channel, outcome, notes }),
        });
        const j = await r.json().catch(() => null);
        if (r.ok) {
          sessionStorage.setItem("roe.lastOutcome", `${channel} · ${outcome}${notes ? ` · ${notes}` : ""}`);
          sessionStorage.setItem("roe.lastPerson", livePerson);
          router.push(`/actions/${id}/recorded`);
          return;
        }
        if (r.status === 422 && j?.error) {
          setError(j.error);
          return;
        }
      } catch {}
    }
    localSave();
  }

  return (
    <Shell title="Record interaction" back={`/actions/${id}`} tab="actions">
      <div className="flex flex-col gap-4">
        {!livePerson && (
          <p className="rounded-lg bg-[#DBEAFE] p-2 text-[12px] text-[#1E3A8A]">
            Demo data — sign in for live recording.
          </p>
        )}
        <Field label="Channel">
          <select className={inputCls} value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option>WhatsApp</option>
            <option>Call</option>
            <option>Visit</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Outcome (honest — negative allowed)" error={error}>
          <select className={inputCls} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            <option>Reached — warm conversation</option>
            <option>Reached — asked to call back</option>
            <option>No answer</option>
            <option>Declined further contact</option>
            <option>Wrong number</option>
          </select>
        </Field>
        <Field label="Notes" hint="What did they express interest in?">
          <textarea
            className={`${inputCls} min-h-[90px] py-2`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Interested in Young Adults, prefers evenings"
          />
        </Field>
        <Card>
          <p className="text-[13px] text-[#667370]">
            Saving records the interaction. It does not claim a relationship was built.
          </p>
        </Card>
        <PrimaryButton onClick={save}>Save interaction</PrimaryButton>
      </div>
    </Shell>
  );
}
