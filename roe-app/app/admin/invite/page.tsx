"use client";
// F01.09 Invite Team — admin creates invite; link is copied/sent out-of-band
// (WhatsApp). No email infrastructure in MVP by design.
import { useState } from "react";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";

export default function AdminInvite() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("worker");
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    setError("");
    setLink("");
    setBusy(true);
    try {
      const r = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.data?.token) {
        setLink(`${window.location.origin}/invite/${j.data.token}`);
        setEmail("");
        return;
      }
      setError(j?.error ?? "Couldn't create the invitation.");
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title="Invite someone" back="/admin/users" tab="more">
      <div className="flex flex-col gap-4">
        <Field label="Email">
          <input
            className={inputCls}
            type="email"
            required
            placeholder="worker@church.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Role" hint="Invites can never grant admin.">
          <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="worker">Follow-up Worker</option>
            <option value="group_leader">Group Leader</option>
            <option value="member">Member</option>
            <option value="care">Care Worker (limited)</option>
          </select>
        </Field>
        <Field label="" error={error}>
          <span />
        </Field>
        <PrimaryButton onClick={send}>{busy ? "Creating…" : "Create invitation"}</PrimaryButton>
        {link && (
          <Card>
            <p className="font-display font-semibold">Invitation ready — valid 7 days, one use.</p>
            <p className="font-mono2 mt-1 break-all text-[12px]">{link}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(link)}
                className="tap-target flex-1 rounded-lg border border-[#E2E8E6] text-[14px] font-medium"
              >
                Copy link
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`You're invited to join our follow-up team: ${link}`)}`}
                target="_blank"
                rel="noreferrer"
                className="tap-target flex-1 rounded-lg bg-[#0F766E] py-2 text-center text-[14px] font-semibold text-white"
              >
                Share via WhatsApp
              </a>
            </div>
          </Card>
        )}
      </div>
    </Shell>
  );
}
