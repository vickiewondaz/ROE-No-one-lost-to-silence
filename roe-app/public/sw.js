// ROE service worker — app-shell caching with honest boundaries.
// - Static assets + public shells: cache-first (fast loads, offline-capable).
// - Navigations: network-first, cache fallback (fresh shell when online).
// - /api/* : NETWORK ONLY. Session data and member records are never cached.
// Version the cache to retire it cleanly on deploy.
const CACHE = "roe-shell-v1";
const SHELL = ["/", "/login", "/join"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.allSettled(
          SHELL.map((url) =>
            fetch(url, { credentials: "same-origin" }).then((res) => {
              if (res.ok) return cache.put(url, res);
              return null;
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache API traffic — auth-gated member data must not persist.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    // Fresh shell when online; last-good shell when offline.
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then((hit) => hit ?? caches.match("/"))
        )
    );
    return;
  }

  // Static assets: cache-first, refresh in background.
  event.respondWith(
    caches.match(request).then((hit) => {
      const live = fetch(request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return res;
      });
      return hit ?? live;
    })
  );
});
