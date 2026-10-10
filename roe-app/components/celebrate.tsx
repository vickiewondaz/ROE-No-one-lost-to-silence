// Celebration actions: warm template text (copy) + mark-greeted (record).
// The human always sends. Templates are starters, never auto-sent.
"use client";
import { useState } from "react";

export function celebrationText(type: string, name: string): string {
  const first = name.split(" ")[0] || "friend";
  if (type === "anniversary")
    return `Happy anniversary, ${first}! Your church family celebrates with you today — wishing you many more years of joy together.`;
  if (type === "milestone")
    return `Congratulations, ${first}! We're cheering you on today and thanking God for this milestone with you.`;
  return `Happy birthday, ${first}! Your church family is thinking of you today — wishing you joy, health, and every blessing in the year ahead.`;
}

const CHANNELS = ["WhatsApp", "Call", "Visit", "In person"];

export function CelebrateActions({
  milestoneId,
  personName,
  type,
  onDone,
}: {
  milestoneId: string;
  personName: string;
  type: string;
  onDone?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [picking, setPicking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const text = celebrationText(type, personName);

  async function greet(channel: string) {
    setError("");
    try {
      const r = await fetch(`/api/milestones/${milestoneId}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ channel, notes: "Greeted personally." }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok) {
        setSaved(true);
        setPicking(false);
        onDone?.();
        return;
      }
      setError(j?.error ?? "Couldn't record it.");
    } catch {
      setError("Couldn't reach the server.");
    }
  }

  if (saved)
    return <p className="text-[13px] font-medium text-[#15803D]">✓ Greeted — recorded in history.</p>;

  return (
    <div className="mt-2 rounded-lg bg-[#F8FAF9] p-2.5">
      <p className="text-[13px] italic text-[#17201F]">“{text}”</p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(text).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="tap-target flex-1 rounded-lg border border-[#E2E8E6] bg-white text-[13px] font-medium"
        >
          {copied ? "Copied ✓" : "Copy text"}
        </button>
        {!picking ? (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="tap-target flex-1 rounded-lg bg-[#0F766E] text-[13px] font-semibold text-white"
          >
            Mark greeted ✓
          </button>
        ) : (
          <div className="flex flex-1 gap-1">
            {CHANNELS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => greet(c)}
                className="tap-target flex-1 rounded-lg bg-[#0F766E] text-[11px] font-semibold text-white"
              >
                {c === "In person" ? "In-person" : c}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-[12px] font-medium text-[#DC2626]">⚠ {error}</p>}
      <p className="mt-1 text-[11px] text-[#667370]">
        Personalize first, then send it yourself — nothing sends automatically.
      </p>
    </div>
  );
}
