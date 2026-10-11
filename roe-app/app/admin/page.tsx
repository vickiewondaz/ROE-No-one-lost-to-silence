"use client";
// F02.05 Home / Administrator (MVP depth): org tasks, not member PII.
// Admin manages access — no default visibility into personal follow-ups.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";

export default function AdminHome() {
  const [me, setMe] = useState<{ orgName?: string; role?: string } | null>(null);
  const [denied, setDenied] = useState(false);
  const [counts, setCounts] = useState<{ users: number; pending: number; joins: number } | null>(null);
  const [brand, setBrand] = useState<{ logoUrl: string | null; whatsapp: string | null; welcomeMessage: string | null } | null>(null);
  const [serviceCount, setServiceCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => {
        if (r.status === 403 || r.status === 401) {
          setDenied(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((j) => {
        if (!j?.data) return;
        if (!["admin", "senior"].includes(j.data.role)) {
          setDenied(true);
          return;
        }
        setMe(j.data);
        Promise.all([
          fetch("/api/users", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)),
          fetch("/api/invites", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)),
          fetch("/api/join", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)),
          fetch("/api/org", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)),
          fetch("/api/services", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)),
        ]).then(([u, inv, jn, org, svc]) => {
          setCounts({
            users: Array.isArray(u?.data) ? u.data.length : 0,
            pending: Array.isArray(inv?.data)
              ? inv.data.filter((i: { status: string }) => i.status === "pending").length
              : 0,
            joins: Array.isArray(jn?.data)
              ? jn.data.filter((x: { status: string }) => x.status === "pending").length
              : 0,
          });
          if (org?.data) {
            setBrand({
              logoUrl: org.data.logoUrl ?? null,
              whatsapp: org.data.whatsapp ?? null,
              welcomeMessage: org.data.welcomeMessage ?? null,
            });
          }
          if (Array.isArray(svc?.data)) setServiceCount(svc.data.length);
        });
      })
      .catch(() => {});
  }, []);

  if (denied)
    return (
      <Shell title="Administration" back="/more" tab="more">
        <Card>
          <p className="font-medium">Restricted.</p>
          <p className="text-[13px] text-[#6B7280]">
            Organisation administration is for admins. Your follow-up work is under Home.
          </p>
        </Card>
      </Shell>
    );

  const setupSteps = brand
    ? [
        { label: "Logo", done: !!brand.logoUrl },
        { label: "WhatsApp number", done: !!brand.whatsapp },
        { label: "Welcome line", done: !!brand.welcomeMessage },
        { label: "First service day", done: (serviceCount ?? 0) > 0 },
      ]
    : null;
  const setupDone = setupSteps?.filter((s) => s.done).length ?? 0;

  return (
    <Shell title={me?.orgName ?? "Administration"} back="/more" tab="more">
      {counts !== null && counts.joins > 0 && (
        <Link
          href="/admin/users"
          className="mb-3 block rounded-xl border border-[#D97706]/50 bg-[#FFFBEB] p-3"
        >
          <p className="font-display text-[15px] font-semibold text-[#92400E]">
            {counts.joins} join request{counts.joins === 1 ? "" : "s"} waiting
          </p>
          <p className="text-[13px] text-[#92400E]">
            Newcomers are waiting for a decision — review them now →
          </p>
        </Link>
      )}
      {setupSteps !== null && setupDone < setupSteps.length && (
        <div className="mb-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
          <p className="font-display text-[15px] font-semibold">
            Organisation setup · {setupDone} of {setupSteps.length}
          </p>
          <div className="mt-1.5 flex flex-col gap-1">
            {setupSteps.map((s) => (
              <p key={s.label} className="text-[13px] text-[#6B7280]">
                {s.done ? "✓" : "○"} {s.label}
                {!s.done && s.label === "First service day" && (
                  <>
                    {" — "}<Link href="/admin/services" className="font-medium text-[#0D9488]">add one →</Link>
                  </>
                )}
                {!s.done && s.label !== "First service day" && (
                  <>
                    {" — "}<span className="text-[#111827]">fill it below ↓</span>
                  </>
                )}
              </p>
            ))}
          </div>
        </div>
      )}
      <Card>
        <p className="font-display font-semibold">Organisation tasks</p>
        <p className="text-[13px] text-[#6B7280]">
          {counts ? `${counts.users} team members · ${counts.pending} pending invites · ${counts.joins} join requests waiting` : "Loading…"}
        </p>
      </Card>
      <div className="mt-3 flex flex-col gap-2">
        <Link href="/admin/users" className="tap-target rounded-lg bg-[#0D9488] py-3 text-center text-[15px] font-semibold text-white">
          Team & invitations
        </Link>
        <Link href="/admin/invite" className="tap-target rounded-lg border border-[#E5E7EB] bg-white py-3 text-center text-[14px] font-medium">
          Invite someone
        </Link>
        <Link href="/admin/services" className="tap-target rounded-lg border border-[#E5E7EB] bg-white py-3 text-center text-[14px] font-medium">
          Service days & specials
        </Link>
      </div>
      <p className="mt-3 text-[13px] text-[#6B7280]">
        Admins manage access. Personal follow-up records stay with their workers.
      </p>
      <OrgProfile />
    </Shell>
  );
}

function OrgProfile() {
  const [logoUrl, setLogoUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/org", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data) {
          setLogoUrl(j.data.logoUrl ?? "");
          setWhatsapp(j.data.whatsapp ?? "");
          setWelcomeMessage(j.data.welcomeMessage ?? "");
          setLoaded(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!loaded) return null;

  function logoLoads(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      const timer = setTimeout(() => resolve(false), 8000);
      img.onload = () => {
        clearTimeout(timer);
        resolve(true);
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(false);
      };
      img.src = url;
    });
  }

  async function save() {
    setNote("");
    const logo = logoUrl.trim();
    if (logo && !/^https:\/\/.+/.test(logo)) {
      setNote("Logo must be an https:// address.");
      return;
    }
    setSaving(true);
    if (logo && !(await logoLoads(logo))) {
      setNote("That address didn't load as an image — check the link (file-sharing pages like Drive don't work; use a direct image address) and try again.");
      setSaving(false);
      return;
    }
    try {
      const r = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ logoUrl, whatsapp, welcomeMessage }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.data) {
        setLogoUrl(j.data.logoUrl ?? "");
        setWhatsapp(j.data.whatsapp ?? "");
        setWelcomeMessage(j.data.welcomeMessage ?? "");
        setNote("Saved ✓ — your logo now appears on dashboards and the join page.");
        return;
      }
      setNote(j?.error ?? "Couldn't save it.");
    } catch {
      setNote("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4">
      <Card>
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Organisation logo preview"
              className="h-12 w-12 rounded-xl border border-[#E5E7EB] object-cover"
            />
          ) : (
            <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#CCFBF1] text-[20px] font-semibold text-[#0F766E]">
              ✦
            </span>
          )}
          <div>
            <p className="font-display font-semibold">Organisation profile</p>
            <p className="text-[13px] text-[#6B7280]">
              Logo, WhatsApp contact, and welcome line — shown on dashboards and the join page.
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-4">
          <Field label="Logo URL (https)" hint="Paste a direct image address (ends in .png/.jpg). File-sharing pages don't work — the image is checked before saving.">
            <input
              className={inputCls}
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…/logo.png"
              inputMode="url"
            />
          </Field>
          <Field label="WhatsApp number" hint="Newcomers see a “Message us on WhatsApp” button after requesting to join.">
            <input
              className={inputCls}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+234 …"
              inputMode="tel"
            />
          </Field>
          <Field label="Welcome line (optional)" hint="One warm sentence, max 280 characters.">
            <textarea
              className={`${inputCls} min-h-[60px] py-2`}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value.slice(0, 280))}
              placeholder="e.g. We're so glad you found us — come as you are."
            />
          </Field>
          <PrimaryButton onClick={save}>{saving ? "Saving…" : "Save organisation profile"}</PrimaryButton>
          {note && (
            <p className={`text-[13px] font-medium ${note.startsWith("Saved") ? "text-[#15803D]" : "text-[#DC2626]"}`}>
              {note.startsWith("Saved") ? note : `⚠ ${note}`}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
