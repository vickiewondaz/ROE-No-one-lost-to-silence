"use client";
// P01 / F01.01 Sign In — warm doorway: brand wash, card form, clear errors.
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { PrimaryButton, Field, inputCls } from "@/components/ui";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
            ? "Wrong email or password. Check both and try again."
            : "Couldn't sign you in. Check connection and try again."
        );
        return;
      }
      router.push("/home");
    } catch {
      setError("Couldn't reach the server. Check connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-col bg-[#F8FAF9]">
      <div className="bg-gradient-to-b from-[#E0F2FE] to-[#F0FDFA] px-6 pb-6 pt-10 text-center">
        <Image
          src="/roe-logo.png"
          alt="ROE logo"
          width={64}
          height={64}
          className="mx-auto rounded-2xl"
          priority
        />
        <p className="font-mono2 mt-3 text-[11px] uppercase tracking-widest text-[#6B7280]">
          ROE · No one lost to silence
        </p>
        <h1 className="font-display mt-1 text-[26px] font-bold leading-tight">
          Welcome back
        </h1>
        <p className="mt-1 text-[14px] text-[#6B7280]">
          Your people are waiting. Pick up where you left off.
        </p>
      </div>
      <form
        className="mx-4 -mt-2 flex flex-col gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_12px_rgba(15,118,110,0.08)]"
        onSubmit={submit}
      >
        <Field label="Email">
          <input
            className={inputCls}
            type="email"
            required
            placeholder="you@example.org"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" error={error}>
          <div className="relative">
            <input
              className={`${inputCls} pr-11`}
              type={showPw ? "text" : "password"}
              required
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] transition-colors hover:text-[#111827]"
            >
              {showPw ? <EyeOff aria-hidden className="h-5 w-5" /> : <Eye aria-hidden className="h-5 w-5" />}
            </button>
          </div>
        </Field>
        <PrimaryButton type="submit">{busy ? "Signing in…" : "Sign in"}</PrimaryButton>
      </form>
      <div className="px-6 pb-8 pt-4 text-center">
        <a href="/forgot" className="text-[14px] font-medium text-[#0D9488]">
          Forgot password?
        </a>
        <p className="mt-2 text-[13px] text-[#6B7280]">
          New here? Your coordinator's invitation is the way in — there is no
          public signup.
        </p>
      </div>
    </div>
  );
}
