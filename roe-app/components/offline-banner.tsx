"use client";
// OfflineBanner — loud amber flag on destination pages when the previous save
// never reached the server. Shown once per flag (takeOfflineSaved consumes it).
import { useEffect, useState } from "react";
import { takeOfflineSaved } from "@/lib/offline";

export default function OfflineBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (takeOfflineSaved()) setShow(true);
  }, []);

  if (!show) return null;
  return (
    <div className="mb-3 rounded-xl border border-[#D97706]/50 bg-[#FFFBEB] p-3">
      <p className="text-[14px] font-semibold text-[#92400E]">
        ⚠ Saved on this device only — not sent
      </p>
      <p className="mt-0.5 text-[13px] text-[#92400E]">
        The connection failed, so your community doesn't have this yet. Reconnect,
        then redo it while online so nothing is lost.
      </p>
    </div>
  );
}
