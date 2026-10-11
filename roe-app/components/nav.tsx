"use client";
// App navigation (client): bottom tabs + desktop rail + back button + page
// transitions. Figma v1: lucide icons, sliding active pill, 44px targets.
// Server components (Shell) import these — never the reverse.
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckSquare, Home, MoreHorizontal, Users } from "lucide-react";
import type { ReactNode } from "react";

export type TabId = "home" | "people" | "actions" | "more";

const TABS: { id: TabId; label: string; href: string; Icon: typeof Home }[] = [
  { id: "home", label: "Home", href: "/home", Icon: Home },
  { id: "people", label: "People", href: "/people", Icon: Users },
  { id: "actions", label: "Actions", href: "/actions", Icon: CheckSquare },
  { id: "more", label: "More", href: "/more", Icon: MoreHorizontal },
];

export function BackButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Back"
      className="tap-target flex items-center justify-center rounded-lg border border-[#E5E7EB] px-3 text-sm font-medium transition active:scale-90"
    >
      <ArrowLeft aria-hidden className="h-5 w-5" />
    </Link>
  );
}

export function BottomNav({ active }: { active?: TabId }) {
  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 border-t border-[#E5E7EB] bg-white px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 lg:hidden">
      <div className="grid grid-cols-4 gap-1">
        {TABS.map(({ id, label, href, Icon }) => {
          const on = active === id;
          return (
            <Link
              key={id}
              href={href}
              aria-current={on ? "page" : undefined}
              className={`tap-target relative flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors ${
                on ? "text-[#0D9488]" : "text-[#6B7280]"
              }`}
            >
              {on && (
                <motion.span
                  layoutId="nav-pill"
                  aria-hidden
                  className="absolute inset-0 rounded-xl bg-[#CCFBF1]"
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              )}
              <Icon aria-hidden className="relative z-10 h-5 w-5" strokeWidth={on ? 2.5 : 2} />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function RailNav({ active }: { active?: TabId }) {
  return (
    <div className="mt-3 flex flex-col gap-1">
      {TABS.map(({ id, label, href, Icon }) => {
        const on = active === id;
        return (
          <Link
            key={id}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-3 text-[14px] font-medium transition-all duration-200 ${
              on ? "bg-[#F0FDFA] text-[#0F766E]" : "text-[#6B7280] hover:bg-[#F8FAF9]"
            }`}
          >
            {on && (
              <motion.span
                layoutId="rail-bar"
                aria-hidden
                className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#0D9488]"
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
              />
            )}
            <Icon aria-hidden className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}

// Page-enter transition (Figma §5: fade + rise 8px, 300ms). Exit transitions
// need router-level presence — enter-only keeps every route independent.
export function PageMotion({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
