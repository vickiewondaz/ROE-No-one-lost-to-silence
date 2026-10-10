"use client";
// Forgot password: request a reset link. Always confirms (anti-enumeration:
// valid and unknown emails see the same message).
import { useState } from "react";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {}
    setDone(true);
    setBusy(false);
  }

  if (done)
    return (
      <Shell title="Check your email" back="/login">
        <Card>
          <p className="font-display text-[18px] font-semibold">✓ If the address exists, mail is on its way</p>
          <p className="mt-1 text-[14px] text-[#667370]">
            The link lasts one hour. Nothing arrives? Check spam, or ask your
            administrator — WhatsApp is faster anyway.
          </p>
        </Card>
      </Shell>
    );

  return (
    <Shell title="Forgot password" back="/login">
      <div className="flex flex-col gap-4">
        <Field label="Email">
          <input
            className={inputCls}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@church.org"
            autoComplete="email"
          />
        </Field>
        <PrimaryButton onClick={submit}>{busy ? "Sending…" : "Send reset link"}</PrimaryButton>
      </div>
    </Shell>
  );
}
