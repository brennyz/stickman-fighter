/* Stickman Fighter — hardened offline cache (PWA) d8 cyclus 2 */
const CACHE = 'stickfighter-app-v119';
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
  './hosting.json',
  './health.json',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

function offlineFallbackHtml() {
  return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stickman Fighter — offline</title><style>
body{font-family:system-ui,-apple-system,sans-serif;background:#0a0d18;color:#e8f0ff;text-align:center;padding:28px 18px;margin:0}
h1{font-family:Georgia,serif;color:#ffd75e;font-size:1.45rem;margin:0 0 8px}
p{opacity:.88;line-height:1.45;max-width:360px;margin:0 auto 16px}
button{font:inherit;font-weight:800;padding:12px 18px;border-radius:12px;border:none;background:#ffd75e;color:#2a1a00;margin:6px}
.small{font-size:12px;opacity:.65;margin-top:18px}
</style></head><body>
<h1>Offline</h1>
<p>Geen netwerk. Open via je <b>app-icoon</b> (PWA) als je het spel al eens online opende — save blijft lokaal.</p>
<button type="button" onclick="location.reload()">Opnieuw proberen</button>
<p class="small">Cache: ${CACHE}</p>
</body></html>`;
}

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
    p.endsWith('/404.html') ||
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
          const shell = await caches.match('./speel.html', { ignoreSearch: true })
            || await caches.match('./index.html', { ignoreSearch: true })
            || await caches.match('index.html')
            || await caches.match('./');
          if (shell) return shell;
        }
        return new Response(offlineFallbackHtml(), {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    }

    try {
      const cached = await caches.match(event.request, { ignoreSearch: true });
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
