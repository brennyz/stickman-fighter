/* Stickman Fighter — hardened offline cache (PWA) d8 cyclus 5 */
const CACHE = 'stickfighter-app-v335';




const ASSETS = [
  './',
  './index.html',
  './ipad.html',
  './android.html',
  './speel.html',
  './404.html',
  './game.js',
  './styles/main.css',
  './tunnel-check.js',
  './install.js',
  './manifest.webmanifest',
  './hosting.json',
  './health.json',
  './LIVE-LINK.txt',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/buttons/chrome/backup.svg',
  './assets/buttons/chrome/back.svg',
  './assets/buttons/chrome/big-touch.svg',
  './assets/buttons/chrome/bonus.svg',
  './assets/buttons/chrome/claim.svg',
  './assets/buttons/chrome/combo.svg',
  './assets/buttons/chrome/contrast.svg',
  './assets/buttons/chrome/dice.svg',
  './assets/buttons/chrome/egg.svg',
  './assets/buttons/chrome/export.svg',
  './assets/buttons/chrome/external.svg',
  './assets/buttons/chrome/fair.svg',
  './assets/buttons/chrome/file.svg',
  './assets/buttons/chrome/haptics.svg',
  './assets/buttons/chrome/help.svg',
  './assets/buttons/chrome/home.svg',
  './assets/buttons/chrome/import.svg',
  './assets/buttons/chrome/install.svg',
  './assets/buttons/chrome/link.svg',
  './assets/buttons/chrome/lite-fx.svg',
  './assets/buttons/chrome/missions.svg',
  './assets/buttons/chrome/music.svg',
  './assets/buttons/chrome/next.svg',
  './assets/buttons/chrome/pause.svg',
  './assets/buttons/chrome/play.svg',
  './assets/buttons/chrome/reduced-motion.svg',
  './assets/buttons/chrome/refresh.svg',
  './assets/buttons/chrome/settings.svg',
  './assets/buttons/chrome/sfx.svg',
  './assets/buttons/chrome/shake.svg',
  './assets/buttons/chrome/skip.svg',
  './assets/buttons/chrome/star.svg',
  './assets/buttons/chrome/swap.svg',
  './assets/buttons/chrome/sync.svg',
  './assets/buttons/chrome/thumb.svg',
  './assets/buttons/chrome/trash.svg',
  './assets/buttons/hub/adventure.svg',
  './assets/buttons/hub/arcade.svg',
  './assets/buttons/hub/collect.svg',
  './assets/buttons/hub/continue.svg',
  './assets/buttons/hub/summons.svg',
  './assets/buttons/hub/versus.svg',
  './assets/buttons/modes/dex.svg',
  './assets/buttons/modes/mats.svg',
  './assets/buttons/modes/pets.svg',
  './assets/buttons/modes/skills.svg',
  './assets/buttons/modes/style.svg',
  './assets/buttons/modes/training.svg',
  './assets/buttons/modes/upgrades.svg',
  './assets/buttons/modes/wall.svg',
  './assets/buttons/modes/weapons.svg',
  './assets/ui/ach-combo8.svg',
  './assets/ui/ach-daily7.svg',
  './assets/ui/ach-dex-full.svg',
  './assets/ui/ach-dex-half.svg',
  './assets/ui/ach-dex-mythic.svg',
  './assets/ui/ach-dex-tiers.svg',
  './assets/ui/ach-dex10.svg',
  './assets/ui/ach-dex100.svg',
  './assets/ui/ach-finisher1.svg',
  './assets/ui/ach-finisher10.svg',
  './assets/ui/ach-finisher50.svg',
  './assets/ui/ach-first-win.svg',
  './assets/ui/ach-lv10.svg',
  './assets/ui/ach-lv50.svg',
  './assets/ui/ach-lv70.svg',
  './assets/ui/ach-saga-icons.svg',
  './assets/ui/ach-streak10.svg',
  './assets/ui/ach-train-combo10.svg',
  './assets/ui/ach-train5.svg',
  './assets/ui/ach-vs-fatality1.svg',
  './assets/ui/ach-vs-roster.svg',
  './assets/ui/ach-vs5.svg',
  './assets/ui/ach-wall100.svg',
  './assets/ui/ach-weapon-master25.svg',
  './assets/ui/ach-zone-weapons10.svg',
  './assets/ui/saga-all.svg',
  './assets/ui/saga-cape.svg',
  './assets/ui/saga-dawn.svg',
  './assets/ui/saga-fighter.svg',
  './assets/ui/saga-ki.svg',
  './assets/ui/saga-scroll.svg',
  './assets/ui/saga-tide.svg',
  './assets/ui/ui-check.svg',
  './assets/ui/ui-coin.svg',
  './assets/ui/ui-lock.svg',
  './assets/ui/ui-warn.svg',
  './assets/ui/island-cyber.svg',
  './assets/ui/island-dojo.svg',
  './assets/ui/island-finale.svg',
  './assets/ui/island-hel.svg',
  './assets/ui/island-landweg.svg',
  './assets/ui/island-nachtmerrie.svg',
  './assets/ui/island-vulkaan.svg'
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
<p class="small">Vaste link: brennyz.github.io/stickman-fighter/speel.html</p>
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
    p.endsWith('/LIVE-LINK.txt') ||
    p.endsWith('/index.html') ||
    p.endsWith('/ipad.html') ||
    p.endsWith('/android.html') ||
    p.endsWith('/speel.html') ||
    p.endsWith('/404.html') ||
    p.endsWith('/game.js') ||
    p.endsWith('/styles/main.css') ||
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

  // Video/audio: never SW-cache — Range requests break mp4 on iOS/Safari
  if (
    event.request.headers.get('range') ||
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url.pathname)
  ) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 504 })));
    return;
  }

  const isDoc = event.request.mode === 'navigate'
    || (event.request.headers.get('accept') || '').includes('text/html');
  const netFirst = isDoc || isNetworkFirstPath(url.pathname);
  const critical = netFirst;
  const fetchInit = critical ? { cache: 'no-store' } : undefined;

  event.respondWith((async () => {
    if (netFirst) {
      try {
        const res = await fetch(event.request, fetchInit);
        if (res && res.status === 200) {
          const forReq = res.clone();
          const forCanon = res.clone();
          caches.open(CACHE).then(async (c) => {
            try { await c.put(event.request, forReq); } catch (_) {}
            // Keep canonical unversioned keys fresh so ignoreSearch offline
            // fallback cannot revive a stale game.js/css from an older put.
            try {
              const path = url.pathname;
              if (path.endsWith('/game.js')) await c.put('./game.js', forCanon);
              else if (path.endsWith('/styles/main.css')) await c.put('./styles/main.css', forCanon);
              else if (path.endsWith('/install.js')) await c.put('./install.js', forCanon);
              else if (path.endsWith('/speel.html')) await c.put('./speel.html', forCanon);
              else if (path.endsWith('/ipad.html')) await c.put('./ipad.html', forCanon);
              else if (path.endsWith('/android.html')) await c.put('./android.html', forCanon);
              else if (path.endsWith('/index.html') || /\/stickman-fighter\/?$/.test(path) || path.endsWith('/')) {
                await c.put('./index.html', forCanon);
              }
            } catch (_) {}
          }).catch(() => {});
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
