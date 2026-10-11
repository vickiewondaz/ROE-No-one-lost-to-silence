// Offline-save flag (client only): distinguishes "server unreachable, saved on
// this device only" from demo mode (signed out). Workers must never believe
// the community has a record that only exists in their pocket browser.
"use client";

const KEY = "roe.offlineSaved";

export function markOfflineSaved() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {}
}

export function takeOfflineSaved(): boolean {
  try {
    if (sessionStorage.getItem(KEY)) {
      sessionStorage.removeItem(KEY);
      return true;
    }
  } catch {}
  return false;
}
