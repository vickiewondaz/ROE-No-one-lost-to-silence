"use client";
// /join — open but guided: find your community → introduce yourself → done.
// Phone-first: phone required, email optional. No account created here;
// a coordinator reviews every request.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";

interface Org {
  name: string;
  slug: string;
  logoUrl: string | null;
  whatsapp: string | null;
  welcomeMessage: string | null;
}

function waLink(raw: string, text: string): string {
  const digits = raw.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function StepCue({ step }: { step: 1 | 2 }) {
  return (
    <div aria-label={`Step ${step} of 2`} className="mb-3 flex items-center gap-2">
      {[1, 2].map((n) => (
        <div key={n} className="flex flex-1 items-center gap-2">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
              n < step
                ? "bg-[#0D9488] text-white"
                : n === step
                  ? "bg-[#0D9488] text-white ring-4 ring-[#CCFBF1]"
                  : "bg-[#E5E7EB] text-[#6B7280]"
            }`}
          >
            {n < step ? "✓" : n}
          </span>
          <span className={`text-[13px] ${n === step ? "font-semibold" : "text-[#6B7280]"}`}>
            {n === 1 ? "Find community" : "Introduce yourself"}
          </span>
          {n === 1 && <span className="h-0.5 flex-1 bg-[#E5E7EB]" />}
        </div>
      ))}
    </div>
  );
}

export default function Join() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [q, setQ] = useState("");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch("/api/orgs/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (Array.isArray(j?.data)) setOrgs(j.data as Org[]);
      })
      .catch(() => {})
      .finally(() => setLoadingOrgs(false));
  }, []);

  const shown = orgs.filter((o) =>
    `${o.name} ${o.slug}`.toLowerCase().includes(q.toLowerCase())
  );
  const chosen = orgs.find((o) => o.slug === slug);

  async function send() {
    setError("");
    if (!slug) return setError("Choose your community first.");
    if (name.trim().length < 2) return setError("Tell us your name.");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15)
      return setError("Enter a valid phone number so your community can reach you.");
    if (email.trim() !== "" && !/.+@.+\..+/.test(email.trim()))
      return setError("That email doesn't look right — fix it or leave it blank.");
    try {
      const r = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgSlug: slug,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
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
          <div className="flex items-center gap-3">
            {chosen?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={chosen.logoUrl}
                alt={`${chosen?.name ?? "Community"} logo`}
                className="h-12 w-12 rounded-xl border border-[#E5E7EB] object-cover"
              />
            )}
            <div>
              <p className="font-display text-[18px] font-semibold">✓ {chosen?.name ?? "Your community"} has it</p>
              <p className="font-mono2 text-[12px] text-[#6B7280]">Step 2 of 2 · done</p>
            </div>
          </div>
          {chosen?.welcomeMessage && (
            <p className="mt-3 rounded-lg bg-[#CCFBF1]/40 p-3 text-[14px] text-[#0F766E]">
              “{chosen.welcomeMessage}”
            </p>
          )}
          <div className="mt-3 flex flex-col gap-2.5">
            <div className="flex gap-2.5">
              <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0D9488] text-[12px] font-semibold text-white">1</span>
              <p className="text-[14px]">
                <strong>Your coordinator reviews it</strong> — usually within 2 days.
                Nothing else to do; no account exists yet, nothing to log into.
              </p>
            </div>
            <div className="flex gap-2.5">
              <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0D9488] text-[12px] font-semibold text-white">2</span>
              <p className="text-[14px]">
                <strong>A personal welcome</strong> — a call or WhatsApp message from
                someone at {chosen?.name ?? "your community"}, then an invitation to connect.
              </p>
            </div>
          </div>
          {chosen?.whatsapp && (
            <a
              href={waLink(chosen.whatsapp, `Hello ${chosen.name}! I just sent a join request as ${name.trim()}.`)}
              target="_blank"
              rel="noreferrer"
              className="tap-target mt-3 flex items-center justify-center rounded-lg bg-[#0D9488] px-4 text-[15px] font-semibold text-white"
            >
              Message {chosen.name} on WhatsApp →
            </a>
          )}
        </Card>
        <div className="mt-3">
          <PrimaryButton href="/">Back to start →</PrimaryButton>
        </div>
      </Shell>
    );

  const step: 1 | 2 = chosen ? 2 : 1;

  return (
    <Shell title="Find your church or fellowship" back="/">
      <StepCue step={step} />
      <Field label="Search">
        <div className="relative">
          <Search aria-hidden className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            className={`${inputCls} pl-11`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type the name…"
            aria-label="Search communities"
          />
        </div>
      </Field>
      <div className="mt-2 flex max-h-44 flex-col gap-1.5 overflow-y-auto">
        {loadingOrgs && (
          <div aria-label="Loading communities" className="flex flex-col gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[52px] animate-pulse rounded-lg bg-[#E5E7EB]/60" />
            ))}
            <p className="text-[13px] text-[#6B7280]">Finding communities…</p>
          </div>
        )}
        {!loadingOrgs &&
          shown.map((o) => (
            <button
              key={o.slug}
              type="button"
              onClick={() => setSlug(o.slug)}
              aria-pressed={slug === o.slug}
              className={`tap-target flex items-center gap-3 rounded-lg border px-3 text-left ${
                slug === o.slug ? "border-[#0D9488] bg-[#CCFBF1]/40" : "border-[#E5E7EB] bg-white"
              }`}
            >
              {o.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={o.logoUrl}
                  alt=""
                  aria-hidden
                  className="h-9 w-9 shrink-0 rounded-lg border border-[#E5E7EB] object-cover"
                />
              ) : (
                <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#CCFBF1] text-[15px] font-semibold text-[#0F766E]">
                  {o.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="text-[15px] font-medium">{o.name}</span>
            </button>
          ))}
        {!loadingOrgs && shown.length === 0 && (
          <p className="text-[13px] text-[#6B7280]">
            No match — check the spelling, or ask your community whether they use ROE yet.
          </p>
        )}
      </div>
      {chosen && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-[#0D9488]/30 bg-[#CCFBF1]/30 p-3">
            {chosen.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={chosen.logoUrl}
                alt={`${chosen.name} logo`}
                className="h-11 w-11 rounded-xl border border-[#E5E7EB] object-cover"
              />
            ) : (
              <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0D9488] text-[18px] font-semibold text-white">
                {chosen.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <p className="text-[14px]">
                Requesting to join <strong>{chosen.name}</strong>
              </p>
              {chosen.welcomeMessage ? (
                <p className="text-[13px] text-[#6B7280]">“{chosen.welcomeMessage}”</p>
              ) : (
                <p className="font-mono2 text-[12px] text-[#6B7280]">Step 2 of 2 · introduce yourself</p>
              )}
            </div>
          </div>
          <Field label="Your name">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grace" autoComplete="name" />
          </Field>
          <Field
            label="Phone (WhatsApp or call)"
            hint="Your community reaches you here first."
            error={error.toLowerCase().includes("phone") ? error : ""}
          >
            <input
              className={inputCls}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 …"
              inputMode="tel"
              autoComplete="tel"
            />
          </Field>
          <Field
            label="Email (optional)"
            hint="Only if you'd like invitations by email too."
            error={error.toLowerCase().includes("email") ? error : ""}
          >
            <input
              className={inputCls}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.org"
              autoComplete="email"
            />
          </Field>
          <Field
            label="Anything they should know? (optional)"
            error={!error.toLowerCase().includes("phone") && !error.toLowerCase().includes("email") ? error : ""}
          >
            <textarea
              className={`${inputCls} min-h-[70px] py-2`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. I visited last Sunday"
            />
          </Field>
          <PrimaryButton onClick={send}>Send request</PrimaryButton>
          <Link href="/login" className="text-center text-[13px] text-[#6B7280]">
            Already have an account? Sign in
          </Link>
        </div>
      )}
    </Shell>
  );
}
