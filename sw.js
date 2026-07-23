/* Stickman Fighter — offline cache voor PWA / “app op beginscherm” */
const CACHE = 'stickfighter-app-v8';
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

const NETWORK_FIRST = ['/health.json', '/LIVE-LINK.txt'];

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

  const netFirst = url.pathname === '/health.json' || url.pathname === '/LIVE-LINK.txt';

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const net = fetch(event.request)
        .then((res) => {
          if (res && res.status === 200 && !netFirst) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      if (netFirst) return net.catch(() => cached);
      return cached || net;
    })
  );
});
