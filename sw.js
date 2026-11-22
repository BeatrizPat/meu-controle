
const CACHE = "meu-controle-v3";

const FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg"
];

// Instala a nova versão e baixa os arquivos atualizados.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => {
        const requests = FILES.map(
          (file) => new Request(file, { cache: "reload" })
        );
        return cache.addAll(requests);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativa a nova versão e remove somente caches antigos do aplicativo.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) =>
              key.startsWith("meu-controle-") && key !== CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Busca os arquivos no cache e mantém o funcionamento offline.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => {
              cache.put(event.request, copy);
            });
          }
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
