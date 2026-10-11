"use client";
// F01.10 Invitation Acceptance → F01.11 Activate (set password) → confirmed.
// Public route (token in URL). Invalid → 404 state, used/expired → 410 state.
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { roleLabel } from "@/lib/role-label";

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
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
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
    setBusy(true);
    try {
      const r = await fetch(`/api/invites/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), password }),
      });
      const j = await r.json().catch(() => null);
      if (r.status === 201) {
        // Auto-sign-in: the password was just set, so sign in directly
        // and land on Home — no manual second login.
        try {
          if (info?.email) {
            const res = await authClient.signIn.email({ email: info.email, password });
            if (!res.error) {
              router.push("/home");
              return;
            }
          }
        } catch {
          // fall through to the manual-sign-in state
        }
        setState("done");
        return;
      }
      setError(j?.error ?? "Couldn't activate this invitation.");
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading")
    return (
      <Shell title="Invitation">
        <Card>
          <p className="text-[14px] text-[#6B7280]">Checking invitation…</p>
        </Card>
      </Shell>
    );
  if (state === "bad")
    return (
      <Shell title="Invitation">
        <Card>
          <p className="font-display font-semibold">Link not recognised.</p>
          <p className="mt-1 text-[14px] text-[#6B7280]">
            Ask your administrator for a fresh invitation.
          </p>
          <Link href="/login" className="mt-2 block text-[14px] font-medium text-[#0D9488]">
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
          <p className="mt-1 text-[14px] text-[#6B7280]">
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
          <p className="mt-1 text-[14px] text-[#6B7280]">
            {info?.orgName} · {roleLabel(info?.role ?? "")}. Sign in to start.
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
          <span className="font-mono2 text-[13px] text-[#6B7280]">{info?.email}</span>
          {" "}· invited as <strong>{roleLabel(info?.role ?? "")}</strong>
        </p>
      </Card>
      <div className="mt-3 flex flex-col gap-4">
        <Field label="Your name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grace" autoComplete="name" />
        </Field>
        <Field label="Set password" hint="At least 8 characters." error={error}>
          <div className="relative">
            <input
              className={`${inputCls} pr-11`}
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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
        <PrimaryButton onClick={accept}>{busy ? "Activating…" : "Activate account"}</PrimaryButton>
        <button type="button" onClick={() => router.push("/login")} className="text-[13px] text-[#6B7280]">
          Already have an account? Sign in
        </button>
      </div>
    </Shell>
  );
}
