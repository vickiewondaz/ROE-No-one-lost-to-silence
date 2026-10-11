// ROE opening screen — a doorway, not a brochure (Figma §3.2 public entry).
// Entry: team signs in, invitees arrive via links, newcomers request via /join.
import Image from "next/image";
import Link from "next/link";
import Splash from "@/components/splash";

export default function Landing() {
  return (
    <div className="relative min-h-screen w-full bg-[#F8FAF9]">
      {/* Shepherd vista behind the doorway, both widths; veils keep text readable. */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/landing-shepherd.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAF9] via-[#F8FAF9]/80 to-[#F8FAF9]/55 lg:bg-gradient-to-r lg:from-[#F8FAF9] lg:via-[#F8FAF9]/90 lg:to-[#F8FAF9]/25" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-6 pb-10 pt-14 lg:mx-0 lg:max-w-[560px] lg:px-16 lg:pt-20">
      <Splash />
      <div className="flex flex-col items-center text-center">
        <Image
          src="/roe-logo-lockup.jpg"
          alt="ROE — No one lost to silence"
          width={220}
          height={122}
          className="rounded-2xl bg-white object-contain"
          priority
        />
        <p className="font-mono2 mt-4 text-[11px] uppercase tracking-widest text-[#6B7280]">
          ROE
        </p>
        <h1 className="font-display mt-1 text-[32px] font-bold leading-tight">
          No one lost to silence.
        </h1>
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <Link
          href="/login"
          className="tap-target flex h-12 items-center justify-center rounded-xl bg-[#0D9488] text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#0F766E] active:scale-[0.98]"
        >
          Sign in
        </Link>
        <Link
          href="/join"
          className="tap-target flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-[#0D9488] bg-white/80 px-4 py-2 text-center text-[15px] font-semibold leading-snug text-[#0D9488] backdrop-blur transition-all duration-200 hover:bg-[#F0FDFA] active:scale-[0.98]"
        >
          <span>
            New here?
            <br />
            Find your church or
            <br />
            fellowship&nbsp;→
          </span>
        </Link>
      </div>
      </div>
    </div>
  );
}
