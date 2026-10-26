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
  "imprimible.html",
  "guia.html",
  "manifest.webmanifest",
  "favicon.svg",
  "css/estilos.css",
  "css/imprimible.css",
  "js/datos.js",
  "js/textos.js",
  "js/graficas.js",
  "js/explora.js",
  "js/voz.js",
  "js/personal.js",
  "js/caso.js",
  "js/juego.js",
  "js/imprimible.js",
  "data/mitos.json",
  "data/explora.json",
  "data/entidades.json",
  "data/entidad/6/mitos.json",
  "data/entidad/0/personal.json",
  "data/entidad/6/personal.json",
  "data/entidad/6/municipios.json",
  "data/entidad/24/mitos.json",
  "data/entidad/24/personal.json",
  "data/entidad/24/municipios.json",
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

  // Las páginas se guardan sin parámetros (?entidad=6 usa el mismo HTML): una sola copia por página,
  // así nunca se sirve una versión vieja guardada con otro parámetro.
  const url = new URL(request.url);
  const clave = request.mode === "navigate" ? url.origin + url.pathname : request;

  evento.respondWith(
    fetch(request)
      .then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(CACHE).then((c) => c.put(clave, copia));
        }
        return respuesta;
      })
      .catch(async () => {
        // Sin conexión: la copia guardada.
        const guardada = await caches.match(clave);
        if (guardada) return guardada;
        if (request.mode === "navigate") return caches.match("index.html");
        return Response.error();
      }),
  );
});
