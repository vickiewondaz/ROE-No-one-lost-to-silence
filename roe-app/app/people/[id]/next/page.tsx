"use client";
// P18 / F05.10 Next Action — live POST when signed in, local fallback.
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";
import { loadPeople, savePeople, loadActions, saveActions } from "@/lib/data";

export default function Next({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [title, setTitle] = useState("Check in next week");
  const [due, setDue] = useState("In 7 days");
  const [none, setNone] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data?.userId) setMyId(j.data.userId as string);
      })
      .catch(() => {});
  }, []);

  function localSave() {
    if (!none) {
      saveActions([
        { id: `a${Date.now()}`, personId: id, title, status: "Open", due: due.replace("In ", "") },
        ...loadActions(),
      ]);
    }
    savePeople(
      loadPeople().map((p) =>
        p.id === id ? { ...p, nextAction: none ? "No further action — resting" : `${title} · ${due}` } : p
      )
    );
    router.push(`/people/${id}`);
  }

  async function save() {
    if (!none && myId) {
      try {
        const d = new Date();
        if (due === "Tomorrow") d.setDate(d.getDate() + 1);
        else if (due === "In 3 days") d.setDate(d.getDate() + 3);
        else d.setDate(d.getDate() + 7);
        const r = await fetch("/api/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            personId: id,
            type: title,
            assigneeUserId: myId,
            dueAt: d.toISOString().slice(0, 10),
          }),
        });
        if (r.ok) {
          router.push(`/people/${id}`);
          return;
        }
      } catch {}
    }
    localSave();
  }

  return (
    <Shell title="Next action" back={`/people/${id}`}>
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={none} onChange={(e) => setNone(e.target.checked)} className="h-5 w-5 accent-[#0F766E]" />
          No further action needed right now
        </label>
        {!none && (
          <>
            <Field label="Next step">
              <select className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)}>
                <option>Check in next week</option>
                <option>Invite to midweek fellowship</option>
                <option>Introduce to volunteer team</option>
                <option>Call to listen</option>
              </select>
            </Field>
            <Field label="Due">
              <select className={inputCls} value={due} onChange={(e) => setDue(e.target.value)}>
                <option>Tomorrow</option>
                <option>In 3 days</option>
                <option>In 7 days</option>
              </select>
            </Field>
          </>
        )}
        <Card>
          <p className="text-[13px] text-[#667370]">
            Every important relationship shows a next step — or an explicit rest.
          </p>
        </Card>
        <PrimaryButton onClick={save}>Save and finish → profile</PrimaryButton>
      </div>
    </Shell>
  );
}
