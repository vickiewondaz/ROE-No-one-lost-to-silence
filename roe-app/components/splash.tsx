"use client";
// Launch splash — brand moment on first entry per session.
// Layout (per reference): ivory top half with the ROE lockup, full-bleed
// shepherd photograph below, soft blend between them.
// Photo: roe-app/public/splash-shepherd.jpg (portrait, ~1080px wide). Until
// that file exists the splash renders lockup-only — never a broken image.
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Splash() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [photoOk, setPhotoOk] = useState(true);

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout> | undefined;
    let t2: ReturnType<typeof setTimeout> | undefined;
    // Time gate (not session-only): reloads in the same tab kept hiding the
    // splash, so testers thought it was gone. Shows when last seen >15 min ago.
    const KEY = "roe.splashat";
    try {
      const last = Number(localStorage.getItem(KEY) ?? 0);
      if (Date.now() - last < 15 * 60 * 1000) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        localStorage.setItem(KEY, String(Date.now()));
        return;
      }
    } catch {
      return;
    }
    setShow(true);
    t1 = setTimeout(() => setLeaving(true), 1400);
    t2 = setTimeout(() => {
      setShow(false);
      try {
        localStorage.setItem(KEY, String(Date.now()));
      } catch {}
    }, 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!show) return null;
  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-50 flex flex-col bg-[#F8FAF9] transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <Image
          src="/roe-logo.png"
          alt=""
          width={120}
          height={120}
          className="rounded-3xl"
          priority
        />
        <p className="font-mono2 mt-4 text-[11px] uppercase tracking-widest text-[#6B7280]">
          ROE
        </p>
        <p className="font-display mt-1 text-center text-[22px] font-semibold text-[#111827]">
          No one lost to silence.
        </p>
      </div>
      {photoOk && (
        <div className="relative h-[52%] w-full">
          <Image
            src="/splash-shepherd.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-bottom"
            priority
            onError={() => setPhotoOk(false)}
          />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#F8FAF9] to-transparent" />
        </div>
      )}
    </div>
  );
}
