// Minimal service worker for offline caching of read views.
// Strategy: cache-first for static; stale-while-revalidate for HN proxy URLs.
// FRAGILE: interaction with Next.js cache headers — verify in offline mode.

const CACHE = "hnr-v2";
const STATIC = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Don't cache authed paths or API routes — always go network.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/threads") ||
    url.pathname.startsWith("/favorites") ||
    url.pathname.startsWith("/upvoted") ||
    url.pathname.startsWith("/submitted") ||
    url.pathname.startsWith("/submit")
  )
    return;

  // Stale-while-revalidate for HTML pages.
  if (url.origin === location.origin) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res?.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      }),
    );
  }
});
