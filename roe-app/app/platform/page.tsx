"use client";
// /platform — control plane. Deliberately NOT community-styled: dark slate,
// "PLATFORM" labelling everywhere, counts only, zero member data on screen.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";

interface Org {
  id: string;
  name: string;
  slug: string;
  status: string;
  users: number;
  people: number;
}

export default function Platform() {
  const router = useRouter();
  const [denied, setDenied] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");

  function onName(v: string) {
    setName(v);
    // Draft the web name from the organisation name until the human edits it.
    if (!slugTouched) {
      setSlug(
        v
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40)
      );
    }
  }

  async function refresh() {
    try {
      const r = await fetch("/api/platform/orgs", { credentials: "same-origin" });
      if (r.status === 403 || r.status === 401) {
        setDenied(true);
        return;
      }
      const j = await r.json().catch(() => null);
      if (Array.isArray(j?.data)) setOrgs(j.data as Org[]);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    fetch("/api/platform/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j?.data?.isSuperAdmin) setDenied(true);
        else refresh();
      })
      .catch(() => setDenied(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create() {
    setError("");
    try {
      const r = await fetch("/api/platform/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: name.trim(), slug: slug.trim().toLowerCase() }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.data?.id) {
        setName("");
        setSlug("");
        setSlugTouched(false);
        router.push(`/platform/${j.data.id}`);
        return;
      }
      setError(j?.error ?? "Couldn't create it.");
    } catch {
      setError("Couldn't reach the server.");
    }
  }

  if (denied)
    return (
      <Shell title="Platform" back="/more" tab="more">
        <Card>
          <p className="font-medium">Platform only.</p>
          <p className="text-[13px] text-[#6B7280]">
            This area governs organisations, not people. It is not for community teams.
          </p>
        </Card>
      </Shell>
    );

  return (
    <Shell title="Platform" back="/more" tab="more">
      <div className="rounded-xl bg-[#17201F] p-4 text-white">
        <p className="font-mono2 text-[11px] uppercase tracking-widest text-[#A7B3B0]">
          Platform · all organisations
        </p>
        <p className="font-display text-[18px] font-semibold">Control plane — counts only, never member data.</p>
      </div>
      <h2 className="font-display mt-4 text-[16px] font-semibold">Organisations · {orgs.length}</h2>
      {!loaded && (
        <Card>
          <p className="text-[14px] text-[#6B7280]">Loading organisations…</p>
        </Card>
      )}
      {loaded && orgs.length === 0 && (
        <Card>
          <p className="text-[14px] text-[#6B7280]">
            No organisations yet — create the first one below, then invite its admin.
          </p>
        </Card>
      )}
      <div className="mt-2 flex flex-col gap-2">
        {orgs.map((o) => (
          <Link key={o.id} href={`/platform/${o.id}`}>
            <Card>
              <div className="flex items-center justify-between gap-2">
                <p className="font-display font-semibold">{o.name}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                    o.status === "active" ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEE2E2] text-[#DC2626]"
                  }`}
                >
                  {o.status}
                </span>
              </div>
              <p className="font-mono2 mt-1 text-[12px] text-[#6B7280]">
                {o.slug} · {o.users} team · {o.people} people records
              </p>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Link href="/platform/ai-test" className="tap-target rounded-lg border border-[#E5E7EB] bg-white py-3 text-center text-[14px] font-medium">
          AI test console →
        </Link>
      </div>
      <h2 className="font-display mt-4 text-[16px] font-semibold">New organisation</h2>      <div className="mt-2 flex flex-col gap-3">
        <Field label="Organisation name" hint="A church, fellowship or faith-based organisation.">
          <input className={inputCls} value={name} onChange={(e) => onName(e.target.value)} placeholder="e.g. Riverside Chapel" />
        </Field>
        <Field label="Web name (slug)" hint="Drafted from the name — edit if you like. Lowercase letters, numbers, hyphens." error={error}>
          <input
            className={inputCls}
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="e.g. riverside-chapel"
          />
        </Field>
        <PrimaryButton onClick={create}>Create organisation → invite its admin next</PrimaryButton>
      </div>
    </Shell>
  );
}
