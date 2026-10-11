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
  const [missing, setMissing] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const r = await fetch("/api/platform/orgs", { credentials: "same-origin" });
    if (r.status === 401 || r.status === 403) {
      setDenied(true);
      return;
    }
    if (!r.ok) {
      setError("Couldn't load organisations.");
      return;
    }
    const j = await r.json().catch(() => null);
    const found = ((j?.data ?? []) as Org[]).find((o) => o.id === id) ?? null;
    setOrg(found);
    if (!found) setMissing(true);
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
    setBusy(true);
    try {
      const r = await fetch(`/api/platform/orgs/${id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ suspended: next }),
      });
      if (r.ok) {
        setConfirmSuspend(false);
        refresh();
      } else setError("Couldn't change status.");
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
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
          {missing ? (
            <>
              <p className="font-medium">Organisation not found.</p>
              <p className="text-[13px] text-[#6B7280]">
                It may have been removed, or this link is wrong.
              </p>
            </>
          ) : (
            <p className="text-[14px] text-[#6B7280]">Loading…</p>
          )}
          {error && <p className="mt-1 text-[13px] font-medium text-[#DC2626]">⚠ {error}</p>}
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
      <p className="text-[13px] text-[#6B7280]">
        The only path that grants admin. One invite per admin, single-use, 7 days.
      </p>
      <div className="mt-2 flex flex-col gap-3">
        <Field label="Admin email" error={error}>
          <input
            className={inputCls}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.org"
          />
        </Field>
        <PrimaryButton onClick={inviteAdmin}>Create admin invite</PrimaryButton>
        {link && (
          <Card>
            <p className="font-display text-[14px] font-semibold">Admin invite ready — valid 7 days, one use.</p>
            <p className="font-mono2 mt-1 truncate text-[12px] text-[#6B7280]">
              {link.slice(0, 40)}…{link.slice(-8)}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(link)}
                className="tap-target flex-1 rounded-lg border border-[#E5E7EB] text-[14px] font-medium"
              >
                Copy link
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Admin invite for ${org.name}: ${link}`)}`}
                target="_blank"
                rel="noreferrer"
                className="tap-target flex-1 rounded-lg bg-[#0D9488] py-2 text-center text-[14px] font-semibold text-white"
              >
                Share via WhatsApp
              </a>
            </div>
          </Card>
        )}
      </div>
      <h2 className="font-display mt-4 text-[16px] font-semibold">Status</h2>
      <p className="text-[13px] text-[#6B7280]">
        Suspended orgs can't sign in or call the API. Data is preserved. No delete — ever.
      </p>
      <div className="mt-2">
        {org.status === "active" ? (
          !confirmSuspend ? (
            <button
              type="button"
              onClick={() => setConfirmSuspend(true)}
              className="tap-target w-full rounded-lg border border-[#DC2626] text-[14px] font-semibold text-[#DC2626]"
            >
              Suspend organisation
            </button>
          ) : (
            <div className="rounded-xl border border-[#DC2626]/50 bg-[#FEF2F2] p-4">
              <p className="font-display text-[15px] font-semibold text-[#991B1B]">
                Suspend {org.name}?
              </p>
              <p className="mt-1 text-[13px] text-[#991B1B]">
                All {org.users} team members lose access immediately — sign-in and
                API stop. Member data is preserved, and you can reactivate anytime.
              </p>
              {error && <p className="mt-1 text-[13px] font-medium text-[#DC2626]">⚠ {error}</p>}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmSuspend(false)}
                  className="tap-target flex-1 rounded-lg border border-[#E5E7EB] bg-white text-[14px] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => suspend(true)}
                  className="tap-target flex-1 rounded-lg bg-[#DC2626] text-[14px] font-semibold text-white"
                >
                  {busy ? "Suspending…" : "Yes, suspend"}
                </button>
              </div>
            </div>
          )
        ) : (
          <PrimaryButton onClick={() => suspend(false)}>{busy ? "Reactivating…" : "Reactivate organisation"}</PrimaryButton>
        )}
      </div>
    </Shell>
  );
}
