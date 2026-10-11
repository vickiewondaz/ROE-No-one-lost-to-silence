"use client";
// Install prompt: one-tap PWA install where the browser allows it
// (Android Chrome/Edge via beforeinstallprompt), plain guidance elsewhere
// (iPhone: Share → Add to Home Screen). Hidden once installed.
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";

interface PromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export default function PwaInstall() {
  const [deferred, setDeferred] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as PromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {}
    setDeferred(null);
  }

  return (
    <Card>
      <p className="font-display font-semibold">Get the ROE app</p>
      <a
        href="/ROE.apk"
        download="ROE.apk"
        className="mt-1 block text-center text-[13px] font-medium text-[#0D9488]"
      >
        Prefer a file? Download the Android app (.apk) →
      </a>
      {deferred ? (
        <>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Installs in one tap — opens full-screen, works offline for saved pages.
          </p>
          <button
            type="button"
            onClick={install}
            className="tap-target mt-2 w-full rounded-xl bg-[#0D9488] text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#0F766E] active:scale-[0.98]"
          >
            Install app
          </button>
        </>
      ) : (
        <p className="mt-1 text-[13px] text-[#6B7280]">
          {isIos
            ? "On iPhone: tap Share in Safari, then “Add to Home Screen”."
            : "Open this page in Chrome or Edge on Android and the install button appears here."}
        </p>
      )}
    </Card>
  );
}
