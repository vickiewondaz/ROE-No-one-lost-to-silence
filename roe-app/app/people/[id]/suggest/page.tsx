"use client";
// P13–P15 / F06.03–05 Suggested → Introduction → Sent. Live API, local fallback.
// Suggestion = possibility, human decides. Intro = handoff, not attendance.
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Shell, Card, Field, PrimaryButton, SecondaryButton, inputCls } from "@/components/ui";
import { loadPeople } from "@/lib/data";

interface Group {
  id: string;
  name: string;
  description: string;
}

// Interest match: groups sharing a word with the person's interests float up
// and get a "why". Never claimed as a match — a suggestion, human decides.
function rankGroups(list: Group[], interests: string): (Group & { why: string | null })[] {
  const words = interests.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2);
  return list
    .map((g) => {
      const hay = `${g.name} ${g.description}`.toLowerCase();
      const hit = words.find((w) => hay.includes(w));
      return { ...g, why: hit ? `Matches interest in “${hit}”` : null };
    })
    .sort((a, b) => Number(b.why !== null) - Number(a.why !== null));
}

export default function Suggest({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [step, setStep] = useState<"suggest" | "intro" | "sent">("suggest");
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [connId, setConnId] = useState<string | null>(null);
  // In-flight introduction adopted from the server (avoids recording a
  // duplicate when re-entering this flow for the same person + group).
  const [adopted, setAdopted] = useState<{ id: string; groupId: string } | null>(null);
  const [error, setError] = useState("");

  let personName = "this person";
  let interests = "general fellowship";
  try {
    const p = loadPeople().find((x) => x.id === id);
    if (p) {
      personName = `${p.firstName} ${p.lastName}`;
      interests = p.interests ?? interests;
    }
  } catch {}

  useEffect(() => {
    fetch("/api/groups", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (Array.isArray(j?.data)) {
          const list = j.data as Group[];
          setGroups(list);
          // Preselect the interest-matched group (or the first) as a starting
          // suggestion — the worker still picks explicitly below.
          setPicked((cur) => cur ?? rankGroups(list, interests)[0]?.id ?? null);
        }
      })
      .catch(() => {});
    // Adopt an in-flight introduction so retrying this flow never records a
    // duplicate. The recorded group wins over the heuristic preselect.
    fetch(`/api/connections?personId=${id}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const list = (j?.data ?? []) as { id: string; groupId: string; status: string }[];
        const open =
          list.find((c) => c.status === "Introduced") ?? list.find((c) => c.status === "Suggested");
        if (open) {
          setConnId(open.id);
          setAdopted({ id: open.id, groupId: open.groupId });
          setPicked(open.groupId);
          if (open.status === "Introduced") setStep("intro");
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const ordered = groups ? rankGroups(groups, interests) : [];
  const suggestion = ordered.find((g) => g.id === picked) ?? null;
  // Typeahead: empty query shows top interest-matched suggestions (max 3),
  // typing filters the full directory by name/description (max 6).
  const needle = q.trim().toLowerCase();
  const shown = needle
    ? ordered
        .filter((g) => `${g.name} ${g.description}`.toLowerCase().includes(needle))
        .slice(0, 6)
    : ordered.slice(0, 3);

  async function beginIntro() {
    setError("");
    if (!suggestion) {
      setError(
        groups === null
          ? "Groups are still loading — wait a moment and try again."
          : "Pick a group above first — type to search, then tap one."
      );
      return;
    }
    // Same person + group already in flight → continue it, don't duplicate it.
    if (adopted && picked === adopted.groupId) {
      setConnId(adopted.id);
      setStep("intro");
      return;
    }
    try {
      const r = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ personId: id, groupId: suggestion.id }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.data?.id) {
        setConnId(j.data.id as string);
        setAdopted({ id: j.data.id as string, groupId: suggestion.id });
        setStep("intro");
        return;
      }
      setError(j?.error ?? "Couldn't record the suggestion.");
    } catch {
      // Never advance silently: without a server record there is nothing to
      // introduce. Fail loud so the worker retries while online.
      setError("Couldn't reach the server — nothing was recorded. Check connection and try again.");
    }
  }

  async function recordIntro() {
    setError("");
    if (!connId) {
      setError("No introduction to record — go back and pick a group first.");
      return;
    }
    try {
      const r = await fetch(`/api/connections/${connId}/introduce`, {
        method: "POST",
        credentials: "same-origin",
      });
      const j = await r.json().catch(() => null);
      if (r.ok) {
        setStep("sent");
        return;
      }
      setError(j?.error ?? "Couldn't record the introduction.");
    } catch {
      setError("Couldn't reach the server — nothing was recorded. Check connection and try again.");
    }
  }

  if (step === "suggest")
    return (
      <Shell title="Suggest a connection" back={`/people/${id}`} tab="people">
        <Card>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#92400E]">
            Possible connections — review needed
          </p>
          <p className="mt-1 text-[14px] text-[#6B7280]">
            {personName} is interested in {interests}. Pick the group, then introduce. A suggestion, not a match — you decide.
          </p>
          {adopted && (
            <p className="mt-1 rounded-lg bg-[#DBEAFE] p-2 text-[13px] text-[#1E3A8A]">
              Continuing the introduction already in flight — pick another group only if this one was wrong.
            </p>
          )}
          {error && <p className="mt-1 text-[13px] font-medium text-[#DC2626]">⚠ {error}</p>}
        </Card>
        <div className="mt-3">
          <Field label="Find the group">
            <div className="relative">
              <Search aria-hidden className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                className={`${inputCls} pl-11`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type a letter or word… e.g. youth"
                aria-label="Search groups"
              />
            </div>
          </Field>
        </div>
        {suggestion && !shown.some((g) => g.id === suggestion.id) && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-[#0D9488] bg-[#CCFBF1]/40 px-3 py-2.5">
            <p className="text-[14px]">
              Selected: <strong>{suggestion.name}</strong>
            </p>
            <button
              type="button"
              onClick={() => setPicked(null)}
              aria-label="Clear selection"
              className="rounded-md px-2 py-1 text-[13px] font-medium text-[#0D9488]"
            >
              ✕ Clear
            </button>
          </div>
        )}
        <p className="font-mono2 mt-3 text-[12px] uppercase tracking-wide text-[#6B7280]">
          {needle ? `Matches (${shown.length})` : "Suggested for them"}
        </p>
        <div className="mt-2 flex max-h-64 flex-col gap-1.5 overflow-y-auto">
          {groups === null && (
            <Card>
              <p className="text-[14px] text-[#6B7280]">Loading groups…</p>
            </Card>
          )}
          {groups !== null && ordered.length === 0 && (
            <Card>
              <p className="text-[14px] text-[#6B7280]">
                No groups yet — ask an admin to create one first.
              </p>
            </Card>
          )}
          {groups !== null && ordered.length > 0 && shown.length === 0 && (
            <Card>
              <p className="text-[14px] text-[#6B7280]">
                No group matches “{q.trim()}” — check the spelling or try a shorter word.
              </p>
            </Card>
          )}
          {shown.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setPicked(g.id)}
              aria-pressed={picked === g.id}
              className={`tap-target rounded-lg border px-3 py-2.5 text-left ${
                picked === g.id
                  ? "border-[#0D9488] bg-[#CCFBF1]/40"
                  : "border-[#E5E7EB] bg-white"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[15px] font-semibold">{g.name}</span>
                {picked === g.id && (
                  <span aria-hidden className="text-[#0D9488]">✓</span>
                )}
              </span>
              {g.description && (
                <span className="mt-0.5 block text-[13px] text-[#6B7280]">{g.description}</span>
              )}
              {g.why && (
                <span className="mt-0.5 block text-[13px] font-medium text-[#0F766E]">{g.why}</span>
              )}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <PrimaryButton onClick={beginIntro}>
            {suggestion ? `Continue with ${suggestion.name}` : "Continue with introduction"}
          </PrimaryButton>
          <SecondaryButton href={`/people/${id}`}>Not now</SecondaryButton>
        </div>
      </Shell>
    );

  if (step === "intro")
    return (
      // Header back goes to the profile (not the suggest route): returning via
      // the route would remount the picker and a retry could record a duplicate.
      <Shell title="Introduction" back={`/people/${id}`} tab="people">
        <Card>
          <p className="font-display font-semibold">
            {personName} → {suggestion ? suggestion.name : "Young Adults"}
          </p>
          <p className="text-[13px] text-[#6B7280]">
            Human handoff. This is not a live WhatsApp API integration — you
            message/introduce, then record it here.
          </p>
          {error && <p className="mt-1 text-[13px] font-medium text-[#DC2626]">⚠ {error}</p>}
        </Card>
        <div className="mt-3 flex flex-col gap-2">
          <PrimaryButton onClick={recordIntro}>Record introduction handoff</PrimaryButton>
          <SecondaryButton onClick={() => setStep("suggest")}>Back</SecondaryButton>
        </div>
      </Shell>
    );

  return (
    <Shell title="Introduction sent" tab="people">
      <Card>
        <p className="font-display text-[18px] font-semibold">✓ Introduction recorded</p>
        <p className="mt-1 text-[14px] text-[#6B7280]">
          Introduction is not attendance. Record what actually happens next.
        </p>
      </Card>
      <div className="mt-3 flex flex-col gap-2">
        <PrimaryButton
          href={connId ? `/people/${id}/participation?conn=${connId}` : `/people/${id}/participation`}
        >
          Record participation outcome →
        </PrimaryButton>
        <SecondaryButton onClick={() => router.push(`/people/${id}`)}>Back to profile</SecondaryButton>
      </div>
    </Shell>
  );
}
