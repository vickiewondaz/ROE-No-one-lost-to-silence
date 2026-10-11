// P04–P05 / F03.04–05 Create + Created — Mobbin form + confirmation.
// PRD §17: Name + Phone + Channel only required (fixes dirty-capture pain).
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";
import { loadPeople, savePeople } from "@/lib/data";
import { markOfflineSaved } from "@/lib/offline";

export default function NewPerson() {
  const router = useRouter();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState("WhatsApp");
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (first.trim().length < 2) return setError("Enter a first name.");
    if (digits.length < 7 || digits.length > 15)
      return setError("Enter a valid phone number.");
    // Live first (session cookie); fall back to local store only when the
    // network itself failed (offline) or demo mode (signed out). Offline saves
    // are flagged loud — the created page shows "device only, not sent".
    let networkFailed = false;
    try {
      const r = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          firstName: first.trim(),
          lastName: last.trim(),
          phone: phone.trim(),
          channel,
          consentContact: true,
        }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.data?.id) {
        if (j.data.duplicateWarning)
          sessionStorage.setItem("roe.createdNote", j.data.duplicateWarning);
        else sessionStorage.removeItem("roe.createdNote");
        router.push(`/people/${j.data.id}/created`);
        return;
      }
      if (r.status === 422 && j?.error) {
        setError(j.error);
        return;
      }
    } catch {
      networkFailed = true;
    }
    if (networkFailed) markOfflineSaved();
    const people = loadPeople();
    const dup = people.find((p) =>
      p.phone.replace(/\D/g, "").endsWith(digits.slice(-7))
    );
    const id = `p${Date.now()}`;
    savePeople([
      {
        id,
        firstName: first.trim(),
        lastName: last.trim(),
        phone: phone.trim(),
        channel: channel as never,
        journey: "Assigned",
        assignee: "You",
        nextAction: "Assign follow-up",
      },
      ...people,
    ]);
    if (dup)
      sessionStorage.setItem(
        "roe.createdNote",
        `Possible duplicate: ${dup.firstName} ${dup.lastName} (${dup.phone}). Record saved — review when convenient.`
      );
    else sessionStorage.removeItem("roe.createdNote");
    router.push(`/people/${id}/created`);
  }

  return (
    <Shell title="New person" back="/people" tab="people">
      <form onSubmit={save} className="flex flex-col gap-4">
        <Field label="First name" error={error.includes("first") ? error : ""}>
          <input
            className={inputCls}
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            placeholder="e.g. Sarah"
            autoComplete="given-name"
          />
        </Field>
        <Field label="Last name (optional)">
          <input
            className={inputCls}
            value={last}
            onChange={(e) => setLast(e.target.value)}
            placeholder="e.g. Johnson"
            autoComplete="family-name"
          />
        </Field>
        <Field
          label="Phone"
          hint="Digits only check — duplicate warning never blocks save."
          error={error.includes("phone") || error.includes("Phone") ? error : ""}
        >
          <input
            className={inputCls}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234 …"
            inputMode="tel"
          />
        </Field>
        <Field label="Preferred contact method">
          <select
            className={inputCls}
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            <option>WhatsApp</option>
            <option>Call</option>
            <option>Visit</option>
            <option>Other</option>
          </select>
        </Field>
        <Card>
          <p className="text-[13px] text-[#6B7280]">
            Optional later: interests, group, how they connected, notes.
            Progressive disclosure — don&apos;t ask everything now.
          </p>
        </Card>
        <PrimaryButton type="submit">Save person</PrimaryButton>
      </form>
    </Shell>
  );
}
