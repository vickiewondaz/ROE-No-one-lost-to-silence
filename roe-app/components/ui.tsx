// Shared ROE primitives — Figma v1 (Oct 2026).
// Patterns: Attio (record context hierarchy), Luma (group detail + primary
// action placement), SaaSUI (home/empty states), Mobbin (bottom nav + flows),
// Dribbble (restrained card composition).
// Motion lives in ./nav (client); icons are lucide (server-safe).
import Link from "next/link";
import type { ReactNode } from "react";
import { AlertCircle, MessageCircle, Phone } from "lucide-react";
import OrgBrand from "./org-brand";
import { BackButton, BottomNav, PageMotion, RailNav } from "./nav";

export function Shell({
  title,
  back,
  children,
  tab,
}: {
  title: string;
  back?: string;
  children: ReactNode;
  tab?: "home" | "people" | "actions" | "more";
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-col bg-[#F8FAF9] lg:max-w-5xl lg:flex-row">
      {/* Desktop rail (lg+): sidebar navigation, same destinations as bottom nav */}
      <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-[#E5E7EB] bg-white p-4 lg:flex">
        <div className="px-2">
          <OrgBrand compact />
        </div>
        <p className="font-mono2 whitespace-nowrap px-2 text-[11px] uppercase tracking-widest text-[#6B7280]">
          ROE · No one lost to silence
        </p>
        <RailNav active={tab} />
      </aside>
      <div className="flex min-h-full w-full max-w-[480px] flex-col lg:max-w-2xl">
      <header className="sticky top-0 z-10 border-b border-[#E5E7EB] bg-white/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center gap-3">
          {back && <BackButton href={back} />}
          <div className="min-w-0 flex-1">
            <p className="font-mono2 text-[11px] uppercase tracking-widest text-[#6B7280]">
              ROE · No one lost to silence
            </p>
            <h1 className="font-display text-[20px] font-semibold leading-tight">
              {title}
            </h1>
          </div>
          <div className="ml-auto shrink-0">
            <OrgBrand />
          </div>
        </div>
      </header>
      <PageMotion>
        <main className="flex-1 px-4 pb-28 pt-4 lg:pb-10">{children}</main>
      </PageMotion>
      <BottomNav active={tab} />
      </div>
    </div>
  );
}

export function PrimaryButton({
  children,
  href,
  onClick,
  type,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "submit" | "button";
}) {
  const cls =
    "tap-target flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0D9488] px-6 font-body text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#0F766E] active:scale-[0.98] active:bg-[#0F766E] disabled:cursor-not-allowed disabled:opacity-50";
  if (href)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <button type={type ?? "button"} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  href,
  onClick,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const cls =
    "tap-target flex h-12 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-[#0D9488] bg-transparent px-6 text-[15px] font-semibold text-[#0D9488] transition-all duration-200 hover:bg-[#F0FDFA] active:scale-[0.98]";
  if (href)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      {children}
    </div>
  );
}

export function StatusPill({ text }: { text: string }) {  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#CCFBF1] px-2.5 py-1 text-[12px] font-medium text-[#0F766E]">
      <span aria-hidden>●</span> {text}
    </span>
  );
}

export function AttentionPill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[12px] font-medium text-[#92400E]">
      <span aria-hidden>◆</span> {text}
    </span>
  );
}

export function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-medium text-[#6B7280]">{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-[13px] text-[#9CA3AF]">{hint}</span>
      )}
      {error && (
        <span className="mt-1 flex items-center gap-1 text-[13px] font-medium text-[#DC2626]">
          <AlertCircle aria-hidden className="h-3.5 w-3.5 shrink-0" /> {error}
        </span>
      )}
    </label>
  );
}

export const inputCls =
  "tap-target h-12 w-full rounded-xl border-2 border-[#E5E7EB] bg-white px-4 text-[16px] outline-none transition-all duration-200 placeholder:text-[#9CA3AF] focus:border-[#14B8A6] focus:ring-2 focus:ring-[#CCFBF1]";

// ContactButtons: one-tap Call / WhatsApp for field workers.
// Render OUTSIDE any <Link> (never nest links) — rows place these below the card link.
export function ContactButtons({ phone }: { phone: string }) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const btn =
    "tap-target flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white py-2 text-[13px] font-medium text-[#0D9488] transition active:scale-[0.98]";
  return (
    <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
      <a href={`tel:${phone}`} className={btn} aria-label={`Call ${phone}`}>
        <Phone aria-hidden className="h-4 w-4" /> Call
      </a>
      <a
        href={`https://wa.me/${digits}`}
        target="_blank"
        rel="noreferrer"
        className={btn}
        aria-label={`WhatsApp ${phone}`}
      >
        <MessageCircle aria-hidden className="h-4 w-4" /> WhatsApp
      </a>
    </div>
  );
}

// Avatar: initials circle. Teal-600 field, white initials (Figma v1).
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const dims =
    size === "lg" ? "h-14 w-14 text-[20px]" : size === "sm" ? "h-8 w-8 text-[13px]" : "h-10 w-10 text-[15px]";
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#0D9488] font-display font-semibold text-white ${dims}`}
    >
      {initials || "•"}
    </span>
  );
}

// SectionHead: "Title (count)" pattern for attention sections (P1).
export function SectionHead({ title, count }: { title: string; count?: number }) {
  return (
    <h2 className="font-display text-[16px] font-semibold">
      {title}
      {count !== undefined && count > 0 && (
        <span className="ml-2 rounded-full bg-[#0D9488] px-2 py-0.5 text-[12px] font-semibold text-white">
          {count}
        </span>
      )}
    </h2>
  );
}

const JOURNEY_ORDER = ["New", "Assigned", "Contacted", "Connecting", "Connected"];

// JourneyStepper: visual progress through the relationship journey.
// Future stages (Engaged, Belonging) render greyed — direction, not status.
// tone="member" swaps internal pipeline words for human ones so members
// see "Welcome → Matched → First hello → Connecting → Belonging".
const JOURNEY_MEMBER_LABELS = ["Welcome", "Matched", "First hello", "Connecting", "Belonging"];

// Member-facing name for a journey stage ("Contacted" → "First hello").
// Use wherever a member can read their own status pill.
export function memberJourneyLabel(current: string): string {
  const idx = JOURNEY_ORDER.findIndex((s) => s.toLowerCase() === current.toLowerCase());
  return idx >= 0 ? JOURNEY_MEMBER_LABELS[idx] : current;
}

export function JourneyStepper({ current, tone }: { current: string; tone?: "staff" | "member" }) {
  const labels = tone === "member" ? JOURNEY_MEMBER_LABELS : JOURNEY_ORDER;
  const idx = Math.max(
    0,
    JOURNEY_ORDER.findIndex((s) => s.toLowerCase() === current.toLowerCase())
  );
  return (
    <div aria-label={`Journey stage: ${current}`}>
      <div className="flex items-center">
        {JOURNEY_ORDER.map((s, i) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                i < idx
                  ? "bg-[#0D9488] text-white"
                  : i === idx
                    ? "bg-[#0D9488] text-white ring-4 ring-[#CCFBF1]"
                    : "bg-[#E5E7EB] text-[#6B7280]"
              }`}
            >
              {i < idx ? "✓" : i + 1}
            </span>
            {i < JOURNEY_ORDER.length - 1 && (
              <span className={`h-0.5 flex-1 ${i < idx ? "bg-[#0D9488]" : "bg-[#E5E7EB]"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 flex">
        {labels.map((s, i) => (
          <p
            key={s}
            className={`flex-1 text-[11px] last:flex-none last:pr-0 ${
              i === idx ? "font-semibold text-[#111827]" : "text-[#6B7280]"
            }`}
          >
            {s}
          </p>
        ))}
      </div>
    </div>
  );
}
