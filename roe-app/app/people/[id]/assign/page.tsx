"use client";
// P06 / F05.06 Assign — live POST, local fallback. Member directory for assignee.
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";
import { loadPeople, savePeople, loadActions, saveActions } from "@/lib/data";

interface Member {
  id: string;
  name: string;
  role: string;
}

function dueToISO(label: string): string {
  const d = new Date();
  if (label === "Tomorrow") d.setDate(d.getDate() + 1);
  else if (label === "In 3 days") d.setDate(d.getDate() + 3);
  else if (label === "In 7 days") d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export default function Assign({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [worker, setWorker] = useState("You");
  const [workerId, setWorkerId] = useState("");
  const [due, setDue] = useState("In 3 days");
  const [purpose, setPurpose] = useState("Welcome check-in");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data?.length) {
          setMembers(j.data as Member[]);
          setWorkerId((j.data as Member[])[0].id);
        }
      })
      .catch(() => {});
  }, []);

  function localSave() {
    const people = loadPeople().map((p) =>
      p.id === id ? { ...p, assignee: worker, journey: "Assigned" as const, nextAction: purpose } : p
    );
    savePeople(people);
    const actions = loadActions();
    saveActions([
      { id: `a${Date.now()}`, personId: id, title: purpose, status: "Open", due: due.replace("In ", "") },
      ...actions,
    ]);
    router.push(`/people/${id}`);
  }

  async function save() {
    setError("");
    if (members && workerId) {
      try {
        const r = await fetch("/api/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            personId: id,
            type: purpose,
            assigneeUserId: workerId,
            dueAt: dueToISO(due),
          }),
        });
        const j = await r.json().catch(() => null);
        if (r.ok) {
          router.push(`/people/${id}`);
          return;
        }
        if (j?.error) {
          setError(j.error);
          return;
        }
      } catch {}
    }
    localSave();
  }

  let personName = "New person";
  try {
    const p = loadPeople().find((x) => x.id === id);
    if (p) personName = `${p.firstName} ${p.lastName}`;
  } catch {}

  return (
    <Shell title="Assign follow-up" back={`/people/${id}`}>
      <Card>
        <p className="font-display font-semibold">{personName}</p>
        <p className="text-[13px] text-[#667370]">
          Clear owner + due date. No one without an owner for &gt;24h.
        </p>
      </Card>
      <div className="mt-3 flex flex-col gap-4">
        <Field label="Action purpose">
          <select className={inputCls} value={purpose} onChange={(e) => setPurpose(e.target.value)}>
            <option>Welcome check-in</option>
            <option>Call</option>
            <option>WhatsApp follow-up</option>
            <option>Introduce to group</option>
          </select>
        </Field>
        <Field label="Assigned worker" error={error}>
          {members ? (
            <select className={inputCls} value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.role}
                </option>
              ))}
            </select>
          ) : (
            <select className={inputCls} value={worker} onChange={(e) => setWorker(e.target.value)}>
              <option>You</option>
              <option>Grace</option>
              <option>David</option>
            </select>
          )}
        </Field>
        <Field label="Due date">
          <select className={inputCls} value={due} onChange={(e) => setDue(e.target.value)}>
            <option>Today</option>
            <option>Tomorrow</option>
            <option>In 3 days</option>
            <option>In 7 days</option>
          </select>
        </Field>
        <PrimaryButton onClick={save}>Save assignment</PrimaryButton>
      </div>
    </Shell>
  );
}
