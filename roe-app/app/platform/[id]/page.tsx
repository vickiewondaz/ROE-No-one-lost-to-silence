"use client";
// /platform/[id] — org detail: invite admin (email → link card), suspend/reactivate.
import { use, useEffect, useState } from "react";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";

interface Org {
  id: string;
  name: string;
  slug: string;
  status: string;
  users: number;
  people: number;
}

export default function PlatformOrg({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [org, setOrg] = useState<Org | null>(null);
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);

  async function refresh() {
    const r = await fetch("/api/platform/orgs", { credentials: "same-origin" });
    if (!r.ok) {
      setDenied(true);
      return;
    }
    const j = await r.json().catch(() => null);
    setOrg(((j?.data ?? []) as Org[]).find((o) => o.id === id) ?? null);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function inviteAdmin() {
    setError("");
    setLink("");
    try {
      const r = await fetch(`/api/platform/orgs/${id}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.data?.token) {
        setLink(`${window.location.origin}/invite/${j.data.token}`);
        setEmail("");
        return;
      }
      setError(j?.error ?? "Couldn't create the admin invite.");
    } catch {
      setError("Couldn't reach the server.");
    }
  }

  async function suspend(next: boolean) {
    setError("");
    try {
      const r = await fetch(`/api/platform/orgs/${id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ suspended: next }),
      });
      if (r.ok) refresh();
      else setError("Couldn't change status.");
    } catch {
      setError("Couldn't reach the server.");
    }
  }

  if (denied)
    return (
      <Shell title="Organisation" back="/platform" tab="more">
        <Card>
          <p className="font-medium">Platform only.</p>
        </Card>
      </Shell>
    );
  if (!org)
    return (
      <Shell title="Organisation" back="/platform" tab="more">
        <Card>
          <p className="text-[14px] text-[#667370]">Loading…</p>
        </Card>
      </Shell>
    );

  return (
    <Shell title={org.name} back="/platform" tab="more">
      <div className="rounded-xl bg-[#17201F] p-4 text-white">
        <p className="font-mono2 text-[12px] text-[#A7B3B0]">
          {org.slug} · {org.users} team · {org.people} people records · {org.status}
        </p>
      </div>
      <h2 className="font-display mt-4 text-[16px] font-semibold">Admin invite</h2>
      <p className="text-[13px] text-[#667370]">
        The only path that grants admin. One invite per admin, single-use, 7 days.
      </p>
      <div className="mt-2 flex flex-col gap-3">
        <Field label="Admin email" error={error}>
          <input
            className={inputCls}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pastor@church.org"
          />
        </Field>
        <PrimaryButton onClick={inviteAdmin}>Create admin invite</PrimaryButton>
        {link && (
          <Card>
            <p className="font-mono2 break-all text-[12px]">{link}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(link)}
                className="tap-target flex-1 rounded-lg border border-[#E2E8E6] text-[14px] font-medium"
              >
                Copy link
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Admin invite for ${org.name}: ${link}`)}`}
                target="_blank"
                rel="noreferrer"
                className="tap-target flex-1 rounded-lg bg-[#0F766E] py-2 text-center text-[14px] font-semibold text-white"
              >
                Share via WhatsApp
              </a>
            </div>
          </Card>
        )}
      </div>
      <h2 className="font-display mt-4 text-[16px] font-semibold">Status</h2>
      <p className="text-[13px] text-[#667370]">
        Suspended orgs can't sign in or call the API. Data is preserved. No delete — ever.
      </p>
      <div className="mt-2">
        {org.status === "active" ? (
          <button
            type="button"
            onClick={() => suspend(true)}
            className="tap-target w-full rounded-lg border border-[#DC2626] text-[14px] font-semibold text-[#DC2626]"
          >
            Suspend organisation
          </button>
        ) : (
          <PrimaryButton onClick={() => suspend(false)}>Reactivate organisation</PrimaryButton>
        )}
      </div>
    </Shell>
  );
}
