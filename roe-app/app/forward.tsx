"use client";
// First-run forward: the splash plays, then first-timers land on sign-in —
// never straight on home. Fallback link covers no-JS/reduced-motion.
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FirstRunForward() {
  const router = useRouter();
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => router.replace("/login"), reduced ? 600 : 1900);
    return () => clearTimeout(t);
  }, [router]);
  return (
    <div className="flex flex-col items-center text-center">
      <Image
        src="/roe-logo-lockup.png"
        alt="ROE — No one lost to silence"
        width={220}
        height={122}
        className="object-contain"
        priority
      />
      <Link
        href="/login"
        className="mt-8 text-[15px] font-semibold text-[#0D9488]"
      >
        Continue to sign in →
      </Link>
    </div>
  );
}
