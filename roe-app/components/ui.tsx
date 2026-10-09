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
    <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-col bg-[#F8FAF9]">
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
      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>
      <nav className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 border-t border-[#E2E8E6] bg-white px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
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

export function StatusPill({ text }: { text: string }) {
  return (
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
