const STATIC_CACHE = "remotesmart-static-v3";
const RUNTIME_CACHE = "remotesmart-runtime-v2";
const API_CACHE = "remotesmart-api-v2";
const OFFLINE_CACHE = "remotesmart-offline-v2";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icon-512.png",
  "/icons.svg",
  "/screenshot-1.png",
  "/offline.html",
  "/courses",
  "/offline",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const validCaches = [STATIC_CACHE, RUNTIME_CACHE, API_CACHE, OFFLINE_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!validCaches.includes(cacheName)) {
            return caches.delete(cacheName); // delete old
          }

          return Promise.resolve();
        })
      )
    )
  );

  self.clients.claim();
});

const networkFirst = async (request, cacheName, fallbackUrl) => {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);

    if (response.ok || response.type === "opaque") {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    if (fallbackUrl) {
      return caches.match(fallbackUrl);
    }

    throw error;
  }
};

const staleWhileRevalidate = async (request, cacheNames) => {
  const names = Array.isArray(cacheNames) ? cacheNames : [cacheNames];
  let cached = null;

  for (const name of names) {
    const cache = await caches.open(name);
    cached = await cache.match(request);
    if (cached) break;
  }

  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.ok || response.type === "opaque") {
        const cache = await caches.open(names[0]);
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, RUNTIME_CACHE, "/offline.html"));
    return;
  }

  if (requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "worker" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(staleWhileRevalidate(request, [RUNTIME_CACHE, OFFLINE_CACHE]));
  }
});
