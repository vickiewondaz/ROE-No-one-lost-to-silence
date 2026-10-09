"use client";
// P01 / F01.01 Sign In — Mobbin login + validation pattern, live Better Auth.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { PrimaryButton, Field, inputCls } from "@/components/ui";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await authClient.signIn.email({ email, password });
      if (res.error) {
        setError(
          res.error.status === 401
            ? "Wrong email or password. Try again."
            : "Couldn't sign you in. Check connection and try again."
        );
        return;
      }
      router.push("/home");
    } catch {
      setError("Couldn't reach the server. Demo unavailable offline.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-col justify-center bg-[#F8FAF9] px-6">
      <p className="font-mono2 text-[11px] uppercase tracking-widest text-[#667370]">
        ROE · No one lost to silence
      </p>
      <h1 className="font-display mt-1 text-[28px] font-bold leading-tight">
        Welcome back
      </h1>
      <p className="mt-1 text-[14px] text-[#667370]">
        Capture → Assign → Follow Up → Connect → Know What Happens Next
      </p>
      <form className="mt-6 flex flex-col gap-4" onSubmit={submit}>
        <Field label="Email">
          <input
            className={inputCls}
            type="email"
            required
            placeholder="you@church.org"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field
          label="Password"
          error={error}
        >
          <input
            className={inputCls}
            type="password"
            required
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <PrimaryButton type="submit">
          {busy ? "Signing in…" : "Sign in"}
        </PrimaryButton>
        <p className="text-center text-[13px] text-[#667370]">
          Pilot access is invite-only. Ask your administrator for an account.
        </p>
      </form>
    </div>
  );
}
