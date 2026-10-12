// ROE opening screen — flash, then sign-in (first-timers never land on home).
// Signed-in visitors go straight to /home.
import Image from "next/image";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Splash from "@/components/splash";
import FirstRunForward from "./forward";

export default async function Entry() {
  let userId: string | undefined;
  try {
    const session = (await auth.api.getSession({
      headers: await headers(),
    })) as { user?: { id: string } } | null;
    userId = session?.user?.id;
  } catch {
    userId = undefined;
  }
  if (userId) redirect("/home");
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
        <FirstRunForward />
      </div>
    </div>
  );
}
