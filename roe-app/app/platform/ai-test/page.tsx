"use client";
// /platform test console — try the assistant against FICTIONAL cases only.
// Super-admin only. Nothing here touches member data or worker screens.
import { useState } from "react";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";

export default function AiTest() {
  const [kind, setKind] = useState("welcome");
  const [firstName, setFirstName] = useState("Ana");
  const [context, setContext] = useState("first visit, likes music");
  const [result, setResult] = useState<{ draft: string; decision: string; model: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setError("");
    setResult(null);
    setBusy(true);
    try {
      const r = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ kind, firstName, context }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.data) {
        setResult(j.data);
        return;
      }
      setError(j?.error ?? "Couldn't reach the assistant.");
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title="AI test console" back="/platform" tab="more">
      <div className="rounded-xl bg-[#17201F] p-4 text-white">
        <p className="font-mono2 text-[11px] uppercase tracking-widest text-[#A7B3B0]">
          Platform · fictional cases only
        </p>
        <p className="font-display text-[16px] font-semibold">
          Try drafts here. Nothing reaches workers or members.
        </p>
      </div>
      <div className="mt-3 flex flex-col gap-4">
        <Field label="Kind">
          <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="welcome">Welcome message</option>
            <option value="next-action">Next-action suggestion</option>
            <option value="summarize">Notes summary</option>
          </select>
        </Field>
        <Field label="First name (fictional)">
          <input
            className={inputCls}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Ana"
          />
        </Field>
        <Field label="Context" hint="Keep it fictional — no real member details." error={error}>
          <textarea
            className={`${inputCls} min-h-[80px] py-2`}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="first visit, likes music"
          />
        </Field>
        <PrimaryButton onClick={run}>{busy ? "Asking…" : "Generate draft"}</PrimaryButton>
        {result && (
          <Card>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#92400E]">
              AI suggestion — review as if you would send it
            </p>
            <p className="mt-1 whitespace-pre-wrap text-[15px]">{result.draft}</p>
            <p className="font-mono2 mt-2 text-[12px] text-[#667370]">
              via {result.model} · {result.decision}
            </p>
          </Card>
        )}
      </div>
    </Shell>
  );
}
