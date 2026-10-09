// ROE opening screen — a doorway, not a brochure (Figma §3.2 public entry).
// No public signup: team signs in, invitees arrive via invitation links.
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
        <p className="font-mono2 mt-4 text-[11px] uppercase tracking-widest text-[#667370]">
          ROE
        </p>
        <h1 className="font-display mt-1 text-[32px] font-bold leading-tight">
          No one lost to silence.
        </h1>
        <p className="mt-2 max-w-[320px] text-[15px] leading-relaxed text-[#667370]">
          An AI companion that helps new converts and young members grow and
          become family.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <Link
          href="/login"
          className="tap-target flex items-center justify-center rounded-lg bg-[#0F766E] text-[16px] font-semibold text-white"
        >
          Sign in
        </Link>
        <p className="text-center text-[13px] text-[#667370]">
          On the follow-up team? Your administrator sends the way in.
          <br />
          Have an invitation link? It opens directly — no account needed until
          you activate.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {[
          ["Every newcomer gets an owner", "Capture → assign, within a day."],
          ["Every follow-up has a next action", "Record what happened, know what's next."],
          ["Nobody disappears into silence", "Attention lists, honest outcomes, real connections."],
        ].map(([title, sub]) => (
          <div
            key={title}
            className="flex gap-3 rounded-xl border border-[#E2E8E6] bg-white p-4"
          >
            <span aria-hidden className="mt-0.5 text-[#0F766E]">
              ●
            </span>
            <div>
              <p className="font-display text-[15px] font-semibold">{title}</p>
              <p className="text-[13px] text-[#667370]">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="font-mono2 mt-auto pt-8 text-center text-[11px] text-[#667370]">
        Capture → Assign → Follow Up → Connect → Know What Happens Next
      </p>
    </div>
  );
}
