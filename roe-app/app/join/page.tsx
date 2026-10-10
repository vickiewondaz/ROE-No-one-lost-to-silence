"use client";
// /join — open but guided: find your church → introduce yourself → done.
// No account created here; a coordinator reviews every request.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";

interface Org {
  name: string;
  slug: string;
}

export default function Join() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [q, setQ] = useState("");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch("/api/orgs/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (Array.isArray(j?.data)) setOrgs(j.data as Org[]);
      })
      .catch(() => {});
  }, []);

  const shown = orgs.filter((o) =>
    `${o.name} ${o.slug}`.toLowerCase().includes(q.toLowerCase())
  );
  const chosen = orgs.find((o) => o.slug === slug);

  async function send() {
    setError("");
    if (!slug) return setError("Choose your church first.");
    if (name.trim().length < 2) return setError("Tell us your name.");
    if (!/.+@.+\..+/.test(email.trim())) return setError("Enter a valid email.");
    try {
      const r = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgSlug: slug,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim(),
        }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok) {
        setSent(true);
        return;
      }
      setError(j?.error ?? "Couldn't send it. Try again.");
    } catch {
      setError("Couldn't reach the server.");
    }
  }

  if (sent)
    return (
      <Shell title="Request received">
        <Card>
          <p className="font-display text-[18px] font-semibold">✓ {chosen?.name ?? "Your church"} has it</p>
          <p className="mt-1 text-[14px] text-[#667370]">
            Your coordinator will be in touch — usually within a few days. Nothing
            else to do; no account exists yet, nothing to log into.
          </p>
        </Card>
        <div className="mt-3">
          <PrimaryButton href="/">Back to start →</PrimaryButton>
        </div>
      </Shell>
    );

  return (
    <Shell title="Find your church" back="/">
      <Field label="Search">
        <input
          className={inputCls}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type the name…"
          aria-label="Search churches"
        />
      </Field>
      <div className="mt-2 flex max-h-44 flex-col gap-1.5 overflow-y-auto">
        {shown.map((o) => (
          <button
            key={o.slug}
            type="button"
            onClick={() => setSlug(o.slug)}
            className={`tap-target rounded-lg border px-3 text-left text-[15px] font-medium ${
              slug === o.slug ? "border-[#0F766E] bg-[#CCFBF1]/40" : "border-[#E2E8E6] bg-white"
            }`}
          >
            {o.name}
          </button>
        ))}
        {shown.length === 0 && (
          <p className="text-[13px] text-[#667370]">
            No match — check the spelling, or ask your church whether they use ROE yet.
          </p>
        )}
      </div>
      {chosen && (
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-[14px]">
            Requesting to join <strong>{chosen.name}</strong>
          </p>
          <Field label="Your name">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grace" />
          </Field>
          <Field label="Email">
            <input
              className={inputCls}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.org"
            />
          </Field>
          <Field label="Phone (optional)">
            <input
              className={inputCls}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 …"
              inputMode="tel"
            />
          </Field>
          <Field label="Anything they should know? (optional)" error={error}>
            <textarea
              className={`${inputCls} min-h-[70px] py-2`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. I visited last Sunday"
            />
          </Field>
          <PrimaryButton onClick={send}>Send request</PrimaryButton>
          <Link href="/login" className="text-center text-[13px] text-[#667370]">
            Already have an account? Sign in
          </Link>
        </div>
      )}
    </Shell>
  );
}
