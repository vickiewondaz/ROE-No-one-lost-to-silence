// P01 / F01.01 Sign In — Mobbin login + validation pattern.
import Link from "next/link";
import { PrimaryButton, Field, inputCls } from "@/components/ui";

export default function Login() {
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
      <form className="mt-6 flex flex-col gap-4" action="/home">
        <Field label="Email">
          <input
            className={inputCls}
            type="email"
            required
            placeholder="you@church.org"
            autoComplete="email"
          />
        </Field>
        <Field label="Password">
          <input
            className={inputCls}
            type="password"
            required
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </Field>
        <PrimaryButton type="submit">Sign in</PrimaryButton>
        <Link
          href="/home"
          className="text-center text-[14px] font-medium text-[#0F766E]"
        >
          Forgot password?
        </Link>
        <p className="rounded-lg bg-[#DBEAFE] p-3 text-[13px] text-[#1E3A8A]">
          Demo build: any email signs in. Real auth (Better Auth + org select)
          lands in Week 1 backend gate.
        </p>
      </form>
    </div>
  );
}
