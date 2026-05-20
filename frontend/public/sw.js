// Gurme Enginar — minimal service worker
// Strategy: network-first for API, cache-first for static shell.

const CACHE = "gurme-enginar-v1";
const SHELL = ["/", "/panel", "/favicon.svg", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Always go to network for API/data
  if (url.pathname.startsWith("/api/")) return;
  // Cache-first for shell
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => cached))
  );
});

// Listen for messages from the main app to show notifications
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "notify") {
    const { title, body, tag, icon } = data;
    self.registration.showNotification(title || "Gurme Enginar", {
      body: body || "",
      tag: tag || "alert",
      icon: icon || "/favicon.svg",
      badge: "/favicon.svg",
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 400],
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/panel");
    })
  );
});
