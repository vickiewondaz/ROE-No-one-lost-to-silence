"use client";
// Change password (Better Auth changePassword via [...all] handler).
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";

export default function PasswordPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    if (next.length < 8) return setError("New password needs at least 8 characters.");
    if (next !== confirm) return setError("New passwords don't match.");
    if (next === current) return setError("Pick something different from the current one.");
    setBusy(true);
    try {
      const res = await authClient.changePassword({ currentPassword: current, newPassword: next });
      if (res.error) {
        setError(
          /current|invalid|credential/i.test(res.error.message ?? "")
            ? "Current password is wrong. Try again."
            : "Couldn't change it. Try again."
        );
        return;
      }
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <Shell title="Password" back="/more" tab="more">
        <Card>
          <p className="font-display text-[18px] font-semibold">✓ Changed</p>
          <p className="mt-1 text-[14px] text-[#667370]">
            Use the new password next time you sign in. Other devices stay signed in.
          </p>
        </Card>
      </Shell>
    );

  return (
    <Shell title="Change password" back="/more" tab="more">
      <div className="flex flex-col gap-4">
        <Field label="Current password">
          <input
            className={inputCls}
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
        <Field label="New password" hint="At least 8 characters. Pick something unique.">
          <input
            className={inputCls}
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
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
        <PrimaryButton onClick={submit}>{busy ? "Changing…" : "Change password"}</PrimaryButton>
      </div>
    </Shell>
  );
}
