// Shared ROE primitives.
// Patterns: Attio (record context hierarchy), Luma (group detail + primary
// action placement), SaaSUI (home/empty states), Mobbin (bottom nav + flows),
// Dribbble (restrained card composition).
import Link from "next/link";
import type { ReactNode } from "react";

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
      <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-[#E2E8E6] bg-white p-4 lg:flex">
        <p className="font-mono2 whitespace-nowrap px-2 text-[11px] uppercase tracking-widest text-[#667370]">
          ROE · No one lost to silence
        </p>
        <div className="mt-3 flex flex-col gap-1">
          <RailLink href="/home" label="Home" icon="⌂" active={tab === "home"} />
          <RailLink href="/people" label="People" icon="◍" active={tab === "people"} />
          <RailLink href="/actions" label="Actions" icon="✓" active={tab === "actions"} />
          <RailLink href="/more" label="More" icon="···" active={tab === "more"} />
        </div>
      </aside>
      <div className="flex min-h-full w-full max-w-[480px] flex-col lg:max-w-2xl">
      <header className="sticky top-0 z-10 border-b border-[#E2E8E6] bg-white/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center gap-3">
          {back && (
            <Link
              href={back}
              className="tap-target flex items-center justify-center rounded-lg border border-[#E2E8E6] px-3 text-sm font-medium"
              aria-label="Back"
            >
              ←
            </Link>
          )}
          <div>
            <p className="font-mono2 text-[11px] uppercase tracking-widest text-[#667370]">
              ROE · No one lost to silence
            </p>
            <h1 className="font-display text-[20px] font-semibold leading-tight">
              {title}
            </h1>
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 pb-28 pt-4 lg:pb-10">{children}</main>
      <nav className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 border-t border-[#E2E8E6] bg-white px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 lg:hidden">
        <div className="grid grid-cols-4 gap-1">
          <Tab href="/home" label="Home" icon="⌂" active={tab === "home"} />
          <Tab href="/people" label="People" icon="◍" active={tab === "people"} />
          <Tab
            href="/actions"
            label="Actions"
            icon="✓"
            active={tab === "actions"}
          />
          <Tab href="/more" label="More" icon="···" active={tab === "more"} />
        </div>
      </nav>
      </div>
    </div>
  );
}

function RailLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium ${
        active ? "bg-[#CCFBF1] text-[#115E59]" : "text-[#667370] hover:bg-[#F8FAF9]"
      }`}
    >
      <span aria-hidden className="w-5 text-center">
        {icon}
      </span>
      {label}
    </Link>
  );
}

function Tab({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`tap-target flex flex-col items-center justify-center gap-0.5 rounded-xl text-[12px] font-medium ${
        active ? "bg-[#CCFBF1] text-[#115E59]" : "text-[#667370]"
      }`}
    >
      <span aria-hidden>{icon}</span>
      {label}
    </Link>
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
    "tap-target flex w-full items-center justify-center rounded-lg bg-[#0F766E] px-4 font-body text-[16px] font-semibold text-white active:bg-[#115E59]";
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
    "tap-target flex w-full items-center justify-center rounded-lg border border-[#E2E8E6] bg-white px-4 text-[14px] font-medium text-[#17201F]";
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
    <div className="rounded-xl border border-[#E2E8E6] bg-white p-4 shadow-[0_1px_2px_rgba(23,32,31,0.04)]">
      {children}
    </div>
  );
}

export function StatusPill({ text }: { text: string }) {  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#CCFBF1] px-2.5 py-1 text-[12px] font-medium text-[#115E59]">
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
      <span className="mb-1 block text-[14px] font-medium">{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-[13px] text-[#667370]">{hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-[13px] font-medium text-[#DC2626]">
          ⚠ {error}
        </span>
      )}
    </label>
  );
}

export const inputCls =
  "tap-target w-full rounded-lg border border-[#E2E8E6] bg-white px-3 text-[16px] outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#CCFBF1]";

// Avatar: initials circle. No photo infra in MVP — consistent everywhere.
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
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#CCFBF1] font-display font-semibold text-[#115E59] ${dims}`}
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
        <span className="ml-2 rounded-full bg-[#0F766E] px-2 py-0.5 text-[12px] font-semibold text-white">
          {count}
        </span>
      )}
    </h2>
  );
}

const JOURNEY_ORDER = ["New", "Assigned", "Contacted", "Connecting", "Connected"];

// JourneyStepper: visual progress through the relationship journey.
// Future stages (Engaged, Belonging) render greyed — direction, not status.
export function JourneyStepper({ current }: { current: string }) {
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
                  ? "bg-[#0F766E] text-white"
                  : i === idx
                    ? "bg-[#0F766E] text-white ring-4 ring-[#CCFBF1]"
                    : "bg-[#E2E8E6] text-[#667370]"
              }`}
            >
              {i < idx ? "✓" : i + 1}
            </span>
            {i < JOURNEY_ORDER.length - 1 && (
              <span className={`h-0.5 flex-1 ${i < idx ? "bg-[#0F766E]" : "bg-[#E2E8E6]"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 flex">
        {JOURNEY_ORDER.map((s, i) => (
          <p
            key={s}
            className={`flex-1 text-[11px] last:flex-none last:pr-0 ${
              i === idx ? "font-semibold text-[#17201F]" : "text-[#667370]"
            }`}
          >
            {s}
          </p>
        ))}
      </div>
    </div>
  );
}
