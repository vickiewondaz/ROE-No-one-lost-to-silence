"use client";
// Set a new password from a reset link (?token= is read by Better Auth;
// our email links carry /reset/[token]).
import { use, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";

export default function Reset({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    if (password.length < 8) return setError("At least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    try {
      const res = await authClient.resetPassword({ newPassword: password, token });
      if (res.error) {
        setError("This link is invalid or expired. Request a fresh one.");
        return;
      }
      setDone(true);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <Shell title="Password set">
        <Card>
          <p className="font-display text-[18px] font-semibold">✓ Done — sign in with the new one</p>
        </Card>
        <div className="mt-3">
          <PrimaryButton href="/login">Sign in →</PrimaryButton>
        </div>
      </Shell>
    );

  return (
    <Shell title="Choose a new password" back="/login">
      <div className="flex flex-col gap-4">
        <Field label="New password">
          <input
            className={inputCls}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Repeat new password" error={error}>
          <input
            className={inputCls}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        <PrimaryButton onClick={submit}>{busy ? "Saving…" : "Save new password"}</PrimaryButton>
        <Link href="/forgot" className="text-center text-[13px] text-[#667370]">
          Link expired? Request a new one
        </Link>
      </div>
    </Shell>
  );
}
