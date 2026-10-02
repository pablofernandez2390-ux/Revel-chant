/* Revelador de chantas: caché para abrir sin conexión.
   Guarda la app y la librería de Excel; nunca toca tus datos (viven en el navegador). */
const CACHE = 'revelador-v1';
const CORE = ['./manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mine = url.origin === self.location.origin;
  const xlsx = url.hostname === 'cdnjs.cloudflare.com';
  if (!mine && !xlsx) return; // precios.uy, Open Food Facts, etc.: directo a la red
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const red = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || red; // abre al instante; se actualiza por detrás
    })
  );
});
