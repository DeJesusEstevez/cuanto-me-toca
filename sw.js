/* ============================================================
   ¿Cuánto Me Toca? — Service Worker
   Estrategia: cache-first para el app shell (uso offline).
   Sube el número de versión del caché al cambiar archivos.
   ============================================================ */

const CACHE = "cuanto-me-toca-v1";

/* App shell: todo lo necesario para abrir la app sin internet. */
const APP_SHELL = [
  ".",
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "favicon.svg",
  "icon.svg"
];

/* Instalación: precachea el app shell. */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/* Activación: limpia cachés de versiones anteriores. */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(
        claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))
      ))
      .then(() => self.clients.claim())
  );
});

/* Fetch: cache-first para estáticos del mismo origen; red para el resto. */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Solo manejamos GET del mismo origen.
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cacheado) => {
      if (cacheado) return cacheado;
      return fetch(req)
        .then((resp) => {
          // Guarda una copia de los estáticos que se vayan pidiendo.
          const copia = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copia));
          return resp;
        })
        .catch(() => {
          // Si falla la red y es una navegación, devuelve el index cacheado.
          if (req.mode === "navigate") return caches.match("index.html");
        });
    })
  );
});
