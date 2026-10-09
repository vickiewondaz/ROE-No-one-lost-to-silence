"use client";
// P06 / F05.06 Assign — full-screen form on mobile (modal would cramp).
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shell,
  Card,
  Field,
  PrimaryButton,
  inputCls,
} from "@/components/ui";
import { loadPeople, savePeople, loadActions, saveActions } from "@/lib/data";

export default function Assign({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [worker, setWorker] = useState("You");
  const [due, setDue] = useState("In 3 days");
  const [purpose, setPurpose] = useState("Welcome check-in");

  function save() {
    const people = loadPeople().map((p) =>
      p.id === id
        ? { ...p, assignee: worker, journey: "Assigned" as const, nextAction: purpose }
        : p
    );
    savePeople(people);
    const actions = loadActions();
    saveActions([
      {
        id: `a${Date.now()}`,
        personId: id,
        title: purpose,
        status: "Open",
        due: due.replace("In ", ""),
      },
      ...actions,
    ]);
    router.push(`/people/${id}`);
  }

  const person = loadPeopleSafe().find((p) => p.id === id);

  return (
    <Shell title="Assign follow-up" back={`/people/${id}`}>
      <Card>
        <p className="font-display font-semibold">
          {person ? `${person.firstName} ${person.lastName}` : "New person"}
        </p>
        <p className="text-[13px] text-[#667370]">
          Clear owner + due date. No one without an owner for &gt;24h.
        </p>
      </Card>
      <div className="mt-3 flex flex-col gap-4">
        <Field label="Action purpose">
          <select
            className={inputCls}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          >
            <option>Welcome check-in</option>
            <option>Call</option>
            <option>WhatsApp follow-up</option>
            <option>Introduce to group</option>
          </select>
        </Field>
        <Field label="Assigned worker">
          <select
            className={inputCls}
            value={worker}
            onChange={(e) => setWorker(e.target.value)}
          >
            <option>You</option>
            <option>Grace</option>
            <option>David</option>
          </select>
        </Field>
        <Field label="Due date">
          <select
            className={inputCls}
            value={due}
            onChange={(e) => setDue(e.target.value)}
          >
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

function loadPeopleSafe() {
  try {
    return loadPeople();
  } catch {
    return [];
  }
}
