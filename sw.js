const CACHE = "fitnesscut-v24";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./lib/fitness-math.js",
  "./app.js",
  "./icon.svg",
  "./og-image.png",
  "./manifest.json",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", e => {
  if (e.data && e.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (!e.request.url.startsWith("http")) return;

  const isSameOrigin = new URL(e.request.url).origin === self.location.origin;

  if (isSameOrigin) {
    // Network-First para assets locales
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.ok) {
            const copia = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copia));
          }
          return res;
        })
        .catch(() => {
          // Offline: el HTML solo se sirve como fallback de navegaciones;
          // para el resto de peticiones, solo la copia exacta en caché
          // (evita devolver index.html con MIME incorrecto para JS/CSS).
          if (e.request.mode === "navigate") {
            return caches.match(e.request).then(c => c || caches.match("./index.html"));
          }
          return caches.match(e.request);
        })
    );
  } else {
    // Cache-First para recursos externos (CDN)
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached ||
        fetch(e.request).then(res => {
          if (res && res.ok) {
            const copia = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copia));
          }
          return res;
        })
      )
    );
  }
});
