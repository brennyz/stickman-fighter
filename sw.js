/* Stickman Fighter — offline cache voor PWA / “app op beginscherm” */
const CACHE = 'stickfighter-app-v42';
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

/** Altijd eerst netwerk (verse Pages), offline → cache. */
function isNetworkFirstPath(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/';
  return (
    p.endsWith('/health.json') ||
    p.endsWith('/LIVE-LINK.txt') ||
    p.endsWith('/hosting.json') ||
    p.endsWith('/index.html') ||
    p.endsWith('/game.js') ||
    p.endsWith('/tunnel-check.js') ||
    p.endsWith('/install.js') ||
    p.endsWith('/sw.js') ||
    /\/stickman-fighter\/?$/.test(p) ||
    p === '/' ||
    p.endsWith('/')
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim()).then(() =>
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        for (const c of clients) c.postMessage({ type: 'SF_SW_ACTIVATED', cache: CACHE });
      })
    )
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isDoc = event.request.mode === 'navigate'
    || (event.request.headers.get('accept') || '').includes('text/html');
  const netFirst = isDoc || isNetworkFirstPath(url.pathname);

  event.respondWith((async () => {
    if (netFirst) {
      try {
        const res = await fetch(event.request);
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
        }
        return res;
      } catch (_) {
        const cached = await caches.match(event.request, { ignoreSearch: true });
        if (cached) return cached;
        if (isDoc) {
          const shell = await caches.match('./index.html')
            || await caches.match('index.html')
            || await caches.match('./');
          if (shell) return shell;
        }
        return new Response('Offline — open opnieuw als je net hebt, of speel uit de app-cache.', {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    }

    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const res = await fetch(event.request);
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
      }
      return res;
    } catch (_) {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});
