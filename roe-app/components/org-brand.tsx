"use client";
// OrgBrand — the registered organisation on every dashboard (fetched from
// /api/me). The NAME always shows; the logo joins it when the admin sets one.
// Silent only when signed out or in demo mode. Admin, worker, member: same
// identity, same place, every screen.
import { useEffect, useState } from "react";

export default function OrgBrand({ compact }: { compact?: boolean }) {
  const [brand, setBrand] = useState<{ name: string; logo: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const name = j?.data?.orgName as string | undefined;
        if (name) setBrand({ name, logo: (j?.data?.orgLogo as string | undefined) ?? null });
      })
      .catch(() => {});
  }, []);

  if (!brand) return null;
  const imgCls = compact
    ? "h-7 w-7 rounded-lg border border-[#E5E7EB] object-cover"
    : "h-8 w-8 rounded-lg border border-[#E5E7EB] object-cover";
  const nameCls = compact
    ? "max-w-[140px] truncate text-[13px] font-semibold"
    : "max-w-[180px] truncate text-[13px] font-semibold text-[#111827]";
  return (
    <span className="flex items-center gap-2" title={brand.name}>
      {brand.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logo} alt={`${brand.name} logo`} className={imgCls} />
      ) : (
        <span
          aria-hidden
          className={`flex shrink-0 items-center justify-center rounded-lg bg-[#0D9488] font-display font-semibold text-white ${
            compact ? "h-7 w-7 text-[14px]" : "h-8 w-8 text-[15px]"
          }`}
        >
          {brand.name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className={nameCls}>{brand.name}</span>
    </span>
  );
}
