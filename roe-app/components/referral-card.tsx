"use client";
// Referral seed: shown at the win moment (person connected to a group).
// Pastor-to-pastor growth, inside the product. Native share where supported,
// clipboard fallback, plus WhatsApp (how the news really travels).
import { useState } from "react";
import { Share2 } from "lucide-react";
import { Card } from "@/components/ui";
import { buildShareText, buildWhatsAppUrl } from "@/lib/share";

export default function ReferralCard({
  personName,
  churchName,
}: {
  personName: string;
  churchName?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const text = buildShareText(churchName);

  async function share() {
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as Navigator & { share: (d: { text: string }) => Promise<void> }).share({
          text,
        });
        return;
      }
      throw new Error("no native share");
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {}
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <Share2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[#0D9488]" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-semibold">
            {personName} found their place.
          </p>
          <p className="mt-0.5 text-[13px] text-[#6B7280]">
            Know another pastor who loses newcomers? Pass it on.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={share}
              className="tap-target flex flex-1 items-center justify-center rounded-xl bg-[#0D9488] px-4 text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[#0F766E] active:scale-[0.98]"
            >
              {copied ? "Copied!" : "Share ROE"}
            </button>
            <a
              href={buildWhatsAppUrl(text)}
              target="_blank"
              rel="noreferrer"
              className="tap-target flex flex-1 items-center justify-center rounded-xl border-[1.5px] border-[#0D9488] bg-white/80 px-4 text-[14px] font-semibold text-[#0D9488] transition-all duration-200 hover:bg-[#F0FDFA] active:scale-[0.98]"
            >
              WhatsApp →
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
