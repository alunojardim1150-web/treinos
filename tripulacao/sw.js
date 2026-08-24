const CACHE_NAME = 'taf-f45-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './assets/f45-banner.jpg',
  './assets/f45-icon-32.png',
  './assets/f45-icon-180.png',
  './assets/f45-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// só intercepta GET do mesmo domínio (shell do app) — chamadas à API do
// jsonbin (log de acessos/progresso) e fontes externas seguem direto pra rede,
// sem cache, pra não servir dado desatualizado nem quebrar CORS.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
