/// <reference lib="webworker" />

const CACHE_NAME = "pulsepy-v2";
const OFFLINE_URL = "/offline";

// Only precache truly public assets — never auth-protected routes
const PRECACHE_URLS = [
  "/offline",
];

/** Routes that require login — never serve from cache */
const AUTH_ROUTES = [
  "/ide",
  "/gamified",
  "/game1",
  "/game2",
  "/game3",
  "/game4",
  "/game5",
  "/profile",
  "/settings",
  "/history",
  "/leaderboard",
  "/duels",
  "/community",
  "/paths",
  "/daily",
  "/progress",
  "/admin",
];

function isAuthRoute(pathname) {
  return AUTH_ROUTES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip API calls — always hit network
  if (url.pathname.startsWith("/api/")) return;

  // Auth-protected routes — always network, never cache navigations
  if (isAuthRoute(url.pathname)) {
    if (request.mode === "navigate") {
      event.respondWith(
        fetch(request).catch(() => caches.match(OFFLINE_URL))
      );
    }
    return;
  }

  // Public navigations: network-first, cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful (200) responses, not redirects
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match(OFFLINE_URL)))
    );
  } else {
    // Static assets: cache-first
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (url.origin === self.location.origin && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
});
