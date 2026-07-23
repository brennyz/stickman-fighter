/* Stickman Fighter — hardened offline cache (PWA) */
const CACHE = 'stickfighter-app-v92';
const ASSETS = [
  './',
  './index.html',
  './ipad.html',
  './android.html',
  './speel.html',
  './404.html',
  './game.js',
  './tunnel-check.js',
  './install.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

function isNetworkFirstPath(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/';
  return (
    p.endsWith('/health.json') ||
    p.endsWith('/LIVE-LINK.txt') ||
    p.endsWith('/manifest.webmanifest') ||
    p.endsWith('/hosting.json') ||
    p.endsWith('/index.html') ||
    p.endsWith('/ipad.html') ||
    p.endsWith('/android.html') ||
    p.endsWith('/speel.html') ||
    p.endsWith('/game.js') ||
    p.endsWith('/tunnel-check.js') ||
    p.endsWith('/install.js') ||
    p.endsWith('/sw.js') ||
    /\/stickman-fighter\/?$/.test(p) ||
    p === '/' ||
    p.endsWith('/')
  );
}

async function precache() {
  const cache = await caches.open(CACHE);
  // Per-asset: één mislukte icon mag install niet breken
  await Promise.all(ASSETS.map(async (url) => {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (res && res.ok) await cache.put(url, res.clone());
    } catch (_) {}
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim()).then(() =>
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        for (const c of clients) {
          try { c.postMessage({ type: 'SF_SW_ACTIVATED', cache: CACHE }); } catch (_) {}
        }
      })
    )
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SF_SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  let url;
  try { url = new URL(event.request.url); } catch (_) { return; }
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
        return new Response('<!DOCTYPE html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><body style="font-family:system-ui;background:#0a0d18;color:#fff;text-align:center;padding:24px"><h1>Offline</h1><p>Geen netwerk — open het spel via je <b>app-icoon</b> (PWA) of probeer opnieuw als je weer online bent.</p></body></html>', {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    }

    try {
      const cached = await caches.match(event.request);
      if (cached) return cached;
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
