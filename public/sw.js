// PocketShift PWA Service Worker - with Background Sync, Periodic Sync, Push
const CACHE = "pocketshift-v4";
const SYNC_TAG = "pocketshift-sync";
const PERIODIC_SYNC_TAG = "pocketshift-periodic";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();

  // Register Periodic Background Sync (Chrome only)
  if ("periodicSync" in self.registration) {
    self.registration.periodicSync
      .register(PERIODIC_SYNC_TAG, { minInterval: 24 * 60 * 60 * 1000 })
      .catch(() => {});
  }
});

// Background Sync - notify clients to process pending mutations
self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG || event.tag === PERIODIC_SYNC_TAG) {
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "BACKGROUND_SYNC", tag: event.tag }));
      })
    );
  }
});

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json?.() || {};
  const title = data.title || "PocketShift";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag || "pocketshift",
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((res) => {
          const clone = res.clone();
          if (res.ok) caches.open(CACHE).then((c) => c.put(request, clone));
          return res;
        })
      )
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          if (res.ok) caches.open(CACHE).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  event.respondWith(fetch(request));
});
