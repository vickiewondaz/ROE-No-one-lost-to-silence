"use client";
// App updates: sideload users never learn updates exist, so the More screen
// carries its own update check against the latest GitHub release.
import { useState } from "react";
import { Card } from "@/components/ui";
import { ApkDownloadButton } from "@/components/pwa-install";

type State = "idle" | "checking" | "done" | "failed";

export default function AppUpdate() {
  const [state, setState] = useState<State>("idle");
  const [tag, setTag] = useState("");
  const [date, setDate] = useState("");

  async function check() {
    setState("checking");
    try {
      const r = await fetch(
        "https://api.github.com/repos/vickiewondaz/ROE-No-one-lost-to-silence/releases/latest"
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setTag(String(j.tag_name ?? ""));
      setDate(
        j.published_at
          ? new Date(j.published_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : ""
      );
      setState("done");
    } catch {
      setState("failed");
    }
  }

  return (
    <Card>
      <p className="font-display font-semibold">App updates</p>
      {state === "done" ? (
        <>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Latest release{tag ? `: ${tag}` : ""}{date ? ` · ${date}` : ""}. If this
            phone runs an older one, grab it below.
          </p>
          <div className="mt-2">
            <ApkDownloadButton />
          </div>
          <button
            type="button"
            onClick={check}
            className="mt-2 w-full text-center text-[13px] font-medium text-[#0D9488]"
          >
            Check again
          </button>
        </>
      ) : state === "failed" ? (
        <>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Couldn't reach GitHub. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={check}
            className="tap-target mt-2 w-full rounded-xl border-[1.5px] border-[#0D9488] bg-white/80 text-[14px] font-semibold text-[#0D9488]"
          >
            Retry
          </button>
        </>
      ) : (
        <>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            See whether a newer app release exists.
          </p>
          <button
            type="button"
            onClick={check}
            disabled={state === "checking"}
            className="tap-target mt-2 w-full rounded-xl bg-[#0D9488] text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#0F766E] active:scale-[0.98] disabled:opacity-60"
          >
            {state === "checking" ? "Checking…" : "Check for updates"}
          </button>
        </>
      )}
    </Card>
  );
}
