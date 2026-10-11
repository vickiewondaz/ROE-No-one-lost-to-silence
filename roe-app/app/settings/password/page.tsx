"use client";
// Change password (Better Auth changePassword via [...all] handler).
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";

export default function PasswordPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

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
      <Shell title="Change password" back="/more" tab="more">
        <Card>
          <p className="font-display text-[18px] font-semibold">✓ Changed</p>
          <p className="mt-1 text-[14px] text-[#6B7280]">
            Use the new password next time you sign in. Other devices stay signed in.
          </p>
        </Card>
      </Shell>
    );

  return (
    <Shell title="Change password" back="/more" tab="more">
      <div className="flex flex-col gap-4">
        {(
          [
            ["Current password", current, setCurrent, "current-password", undefined],
            ["New password", next, setNext, "new-password", "At least 8 characters. Pick something unique."],
            ["Repeat new password", confirm, setConfirm, "new-password", undefined],
          ] as const
        ).map(([label, value, setValue, auto, hint]) => (
          <Field key={label} label={label} hint={hint} error={label.startsWith("Repeat") ? error : ""}>
            <div className="relative">
              <input
                className={`${inputCls} pr-11`}
                type={showPw ? "text" : "password"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoComplete={auto}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide passwords" : "Show passwords"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] transition-colors hover:text-[#111827]"
              >
                {showPw ? <EyeOff aria-hidden className="h-5 w-5" /> : <Eye aria-hidden className="h-5 w-5" />}
              </button>
            </div>
          </Field>
        ))}
        <PrimaryButton onClick={submit}>{busy ? "Changing…" : "Change password"}</PrimaryButton>
      </div>
    </Shell>
  );
}
