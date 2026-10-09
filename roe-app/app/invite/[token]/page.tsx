"use client";
// F01.10 Invitation Acceptance → F01.11 Activate (set password) → confirmed.
// Public route (token in URL). Invalid → 404 state, used/expired → 410 state.
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";

export default function AcceptInvite({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [state, setState] = useState<"loading" | "valid" | "bad" | "gone" | "done">("loading");
  const [info, setInfo] = useState<{ email: string; role: string; orgName: string } | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then((r) => {
        if (r.status === 404) {
          setState("bad");
          return null;
        }
        if (r.status === 410) {
          setState("gone");
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((j) => {
        if (j?.data) {
          setInfo(j.data);
          setState("valid");
        } else if (state === "loading") setState("bad");
      })
      .catch(() => setState("bad"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function accept() {
    setError("");
    if (name.trim().length < 2) return setError("Enter your name.");
    if (password.length < 8) return setError("Password needs at least 8 characters.");
    try {
      const r = await fetch(`/api/invites/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), password }),
      });
      const j = await r.json().catch(() => null);
      if (r.status === 201) {
        setState("done");
        return;
      }
      setError(j?.error ?? "Couldn't activate this invitation.");
    } catch {
      setError("Couldn't reach the server.");
    }
  }

  if (state === "loading")
    return (
      <Shell title="Invitation">
        <Card>
          <p className="text-[14px] text-[#667370]">Checking invitation…</p>
        </Card>
      </Shell>
    );
  if (state === "bad")
    return (
      <Shell title="Invitation">
        <Card>
          <p className="font-display font-semibold">Link not recognised.</p>
          <p className="mt-1 text-[14px] text-[#667370]">
            Ask your administrator for a fresh invitation.
          </p>
          <Link href="/login" className="mt-2 block text-[14px] font-medium text-[#0F766E]">
            Go to sign in →
          </Link>
        </Card>
      </Shell>
    );
  if (state === "gone")
    return (
      <Shell title="Invitation">
        <Card>
          <p className="font-display font-semibold">Already used or expired.</p>
          <p className="mt-1 text-[14px] text-[#667370]">
            Invitations are single-use and last 7 days. Ask for a new one.
          </p>
        </Card>
      </Shell>
    );
  if (state === "done")
    return (
      <Shell title="Welcome aboard">
        <Card>
          <p className="font-display text-[18px] font-semibold">✓ Account active</p>
          <p className="mt-1 text-[14px] text-[#667370]">
            {info?.orgName} · {info?.role}. Sign in to start.
          </p>
        </Card>
        <div className="mt-3">
          <PrimaryButton href="/login">Sign in →</PrimaryButton>
        </div>
      </Shell>
    );
  return (
    <Shell title={`Join ${info?.orgName ?? ""}`}>
      <Card>
        <p className="text-[14px]">
          <span className="font-mono2 text-[13px] text-[#667370]">{info?.email}</span>
          {" "}· invited as <strong>{info?.role}</strong>
        </p>
      </Card>
      <div className="mt-3 flex flex-col gap-4">
        <Field label="Your name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grace" />
        </Field>
        <Field label="Set password" hint="At least 8 characters." error={error}>
          <input
            className={inputCls}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        <PrimaryButton onClick={accept}>Activate account</PrimaryButton>
        <button type="button" onClick={() => router.push("/login")} className="text-[13px] text-[#667370]">
          Already have an account? Sign in
        </button>
      </div>
    </Shell>
  );
}
