/* Stickman Fighter — offline cache voor PWA / “app op beginscherm” */
const CACHE = 'stickfighter-app-v33';
const ASSETS = [
  './',
  './index.html',
  './game.js',
  './tunnel-check.js',
  './install.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

const NETWORK_FIRST = ['/health.json', '/LIVE-LINK.txt', '/hosting.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const netFirst = url.pathname === '/health.json' || url.pathname === '/LIVE-LINK.txt'
    || url.pathname === '/hosting.json';

  event.respondWith(
    (async () => {
      const isDoc = event.request.mode === 'navigate'
        || (event.request.headers.get('accept') || '').includes('text/html');
      const netFirstDoc = isDoc || netFirst;
      if (netFirstDoc) {
        try {
          const res = await fetch(event.request);
          if (res && res.status === 200 && !netFirst) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy));
          }
          return res;
        } catch (e) {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          throw e;
        }
      }
      const cached = await caches.match(event.request);
      if (cached) return cached;
      const res = await fetch(event.request);
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy));
      }
      return res;
    })()
  );
});
