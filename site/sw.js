/*
 * Service worker: guarda todo el sitio para que funcione sin conexión después de la primera visita.
 * Estrategia "red primero": con internet siempre se ve la versión publicada más reciente;
 * sin internet se usa la copia guardada.
 * __VERSION__ lo reemplaza el workflow de publicación por el commit, así cada versión
 * tiene su propia caché y las anteriores se borran al activarse la nueva.
 */
const VERSION = "__VERSION__";
const CACHE = `mitos-vs-datos-${VERSION}`;

// Rutas relativas a la ubicación de este archivo: funcionan bajo la subruta de GitHub Pages.
const ARCHIVOS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "favicon.svg",
  "css/estilos.css",
  "js/textos.js",
  "js/graficas.js",
  "js/explora.js",
  "js/voz.js",
  "js/juego.js",
  "data/mitos.json",
  "data/explora.json",
  "data/entidades.json",
  "fonts/lexend-latin-400.woff2",
  "fonts/lexend-latin-700.woff2",
  "img/qr.png",
  "img/icono-192.png",
  "img/icono-512.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves
        .filter((k) => k.startsWith("mitos-vs-datos-") && k !== CACHE)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const { request } = evento;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  evento.respondWith(
    fetch(request)
      .then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(CACHE).then((c) => c.put(request, copia));
        }
        return respuesta;
      })
      .catch(async () => {
        // Sin conexión: la copia guardada. Las páginas ignoran parámetros como ?entidad=6.
        const guardada = await caches.match(request, { ignoreSearch: request.mode === "navigate" });
        if (guardada) return guardada;
        if (request.mode === "navigate") return caches.match("index.html");
        return Response.error();
      }),
  );
});
