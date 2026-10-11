// ROE opening screen — a doorway, not a brochure (Figma §3.2 public entry).
// Entry: team signs in, invitees arrive via links, newcomers request via /join.
import Image from "next/image";
import Link from "next/link";

export default function Landing() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-col bg-[#F8FAF9] px-6 pb-10 pt-14">
      <div className="flex flex-col items-center text-center">
        <Image
          src="/roe-logo.png"
          alt="ROE logo"
          width={88}
          height={88}
          className="rounded-2xl"
          priority
        />
        <p className="font-mono2 mt-4 text-[11px] uppercase tracking-widest text-[#6B7280]">
          ROE
        </p>
        <h1 className="font-display mt-1 text-[32px] font-bold leading-tight">
          No one lost to silence.
        </h1>
        <p className="mt-2 max-w-[320px] text-[15px] leading-relaxed text-[#6B7280]">
          A warm welcome, a named person who walks with you, and a clear next
          step — so every newcomer becomes family.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <Link
          href="/login"
          className="tap-target flex items-center justify-center rounded-lg bg-[#0D9488] text-[16px] font-semibold text-white"
        >
          Sign in
        </Link>
        <p className="text-center text-[13px] text-[#6B7280]">
          On the follow-up team? Your administrator sends the way in.
          <br />
          Have an invitation link? It opens directly — no account needed until
          you activate.
        </p>
        <Link
          href="/join"
          className="tap-target flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[15px] font-semibold text-[#0D9488]"
        >
          New here? Find your church or fellowship →
        </Link>
      </div>

      <p className="mt-6 max-w-[320px] text-center text-[13px] leading-relaxed text-[#6B7280]">
        Quiet intelligence works in the background so your team never drops a
        thread — but people do the caring, always.
      </p>
      <p className="font-mono2 mt-auto pt-8 text-center text-[11px] text-[#6B7280]">
        Capture → Assign → Follow Up → Connect → Know What Happens Next
      </p>
    </div>
  );
}
