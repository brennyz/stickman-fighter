'use strict';

(function () {
  const overlay = document.getElementById('tunnelBootOverlay');
  const titleEl = document.getElementById('tunnelBootTitle');
  const detailEl = document.getElementById('tunnelBootDetail');
  const retryBtn = document.getElementById('tunnelBootRetry');
  const skipBtn = document.getElementById('tunnelBootSkip');
  const openLinkBtn = document.getElementById('tunnelBootOpenLink');
  const hintEl = document.getElementById('tunnelBootHint');
  const STABLE_TUNNEL = 'https://stickfighter-ipad-b75e.loca.lt';

  const LT_HEADERS = { 'Bypass-Tunnel-Reminder': 'true' };

  function show(msg, detail) {
    if (!overlay) return;
    overlay.hidden = false;
    overlay.setAttribute('aria-busy', 'true');
    if (titleEl) titleEl.textContent = msg;
    if (detailEl) detailEl.textContent = detail || '';
    if (hintEl && location.hostname.endsWith('.loca.lt')) hintEl.style.display = 'block';
    if (retryBtn) retryBtn.style.display = 'none';
    if (openLinkBtn) openLinkBtn.style.display = 'none';
  }

  function showRetry(msg, detail, liveUrl) {
    show(msg, detail);
    if (retryBtn) retryBtn.style.display = 'flex';
    if (overlay) overlay.setAttribute('aria-busy', 'false');
    if (openLinkBtn && liveUrl) {
      openLinkBtn.style.display = 'inline-block';
      openLinkBtn.dataset.href = liveUrl;
      openLinkBtn.textContent = 'Open nieuwe link';
    }
  }

  function hide() {
    if (!overlay) return;
    overlay.hidden = true;
    overlay.setAttribute('aria-busy', 'false');
  }

  function parseLiveUrl(text) {
    if (!text) return '';
    const line = text.split('\n').find((l) => l.startsWith('https://'));
    return line ? line.trim() : '';
  }

  async function fetchLiveUrl() {
    const r = await fetch('./LIVE-LINK.txt?t=' + Date.now(), { cache: 'no-store', headers: LT_HEADERS });
    if (!r.ok) throw new Error('link');
    return parseLiveUrl(await r.text());
  }

  async function fetchHealth() {
    const r = await fetch('./health.json?t=' + Date.now(), { cache: 'no-store', headers: LT_HEADERS });
    if (!r.ok) throw new Error('health');
    return r.json();
  }

  async function fetchHosting() {
    const r = await fetch('./hosting.json?t=' + Date.now(), { cache: 'no-store', headers: LT_HEADERS });
    if (!r.ok) throw new Error('hosting');
    return r.json();
  }

  function hostnameOf(url) {
    try {
      return new URL(url).hostname;
    } catch (_) {
      return '';
    }
  }

  function isTunnelHost(h) {
    return !!h && (h.endsWith('.trycloudflare.com') || h.endsWith('.loca.lt') || h.endsWith('.cloudflare.com'));
  }

  function isStaticHost(h) {
    return !!h && (h.endsWith('.github.io') || h.endsWith('.netlify.app'));
  }

  function isLocalDev(h) {
    return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local');
  }

  function redirectIfNewHost(liveUrl) {
    if (!liveUrl || location.protocol === 'file:') return false;
    const liveHost = hostnameOf(liveUrl);
    if (!liveHost || liveHost === location.hostname) return false;
    show('Nieuwe tunnel-link…', 'Je oude bookmark gaf 503 — doorsturen naar:\n' + liveUrl);
    const base = liveUrl.replace(/\/$/, '');
    window.location.replace(base + location.pathname + location.search + location.hash);
    return true;
  }

  function pickTunnelUrl(hosting, liveUrl, health) {
    const candidates = [
      liveUrl,
      health && health.ok !== false && health.url,
      hosting && hosting.tunnel,
      STABLE_TUNNEL,
    ].filter(Boolean);
    for (const u of candidates) {
      if (isTunnelHost(hostnameOf(u))) return u;
    }
    return liveUrl || (health && health.url) || (hosting && hosting.tunnel) || '';
  }

  async function pageLooksBroken() {
    try {
      const r = await fetch('./index.html?t=' + Date.now(), { cache: 'no-store', headers: LT_HEADERS });
      if (!r.ok) return true;
      const t = (await r.text()).slice(0, 400);
      return /503\s*-\s*Tunnel Unavailable/i.test(t);
    } catch (_) {
      return true;
    }
  }

  function ready() {
    hide();
    if (overlay) {
      overlay.style.pointerEvents = 'none';
      overlay.setAttribute('hidden', '');
    }
    window.dispatchEvent(new Event('sf:tunnel-ready'));
  }

  async function runCheck() {
    if (location.protocol === 'file:') {
      ready();
      return { ok: true, offline: true };
    }

    const here = location.hostname;

    // GitHub Pages / Netlify: direct spelen, nooit overlay blokkeren
    if (isStaticHost(here) || isLocalDev(here)) {
      ready();
      return { ok: true, static: isStaticHost(here), local: isLocalDev(here) };
    }

    let hosting = null;
    try {
      hosting = await fetchHosting();
    } catch (_) {}

    const stable = hosting && hosting.stable;
    if (stable && hostnameOf(stable) === here) {
      ready();
      return { ok: true, stable: true };
    }

    if (hosting && hosting.forceStable && stable && isStaticHost(hostnameOf(stable))) {
      if (redirectIfNewHost(stable)) return new Promise(() => {});
    }

    // Op een werkende tunnel: speel meteen — geen lange wacht
    if (isTunnelHost(here)) {
      const quickBroken = await pageLooksBroken();
      if (!quickBroken) {
        try {
          const probe = await fetch('./game.js?t=' + Date.now(), { cache: 'no-store', headers: LT_HEADERS });
          if (probe.ok) {
            ready();
            return { ok: true, fast: true };
          }
        } catch (_) {}
      }
    }

    show('Verbinding controleren…', 'Tunnel en server worden gecontroleerd.');

    let liveUrl = '';
    let health = null;
    try {
      liveUrl = await fetchLiveUrl();
    } catch (_) {}
    try {
      health = await fetchHealth();
    } catch (_) {}

    const tunnelGo = pickTunnelUrl(hosting, liveUrl, health);
    if (isTunnelHost(here) && tunnelGo && hostnameOf(tunnelGo) !== here) {
      if (redirectIfNewHost(tunnelGo)) return new Promise(() => {});
    }

    const broken = isTunnelHost(here) ? await pageLooksBroken() : false;

    if (!broken && health && health.ok === true) {
      const url = pickTunnelUrl(hosting, liveUrl, health);
      if (url) {
        try {
          localStorage.setItem('sf_live_url', url);
        } catch (_) {}
      }
      ready();
      return { ok: true, url };
    }

    for (let attempt = 1; attempt <= 10; attempt++) {
      show(
        broken ? 'Tunnel herstarten…' : 'Verbinding controleren…',
        broken
          ? 'Even wachten — server herstelt de verbinding…'
          : attempt < 10
            ? `Controleren (${attempt}/10)…`
            : 'Nog even geduld…'
      );
      if (broken) {
        try {
          await fetch('./health.json?heal=' + Date.now(), { cache: 'no-store' });
        } catch (_) {}
      }
      await new Promise((r) => setTimeout(r, 800 + attempt * 400));
      try {
        liveUrl = await fetchLiveUrl();
      } catch (_) {}
      try {
        health = await fetchHealth();
      } catch (_) {}

      const go = pickTunnelUrl(hosting, liveUrl, health);
      if (isTunnelHost(here) && go && hostnameOf(go) !== here) {
        if (redirectIfNewHost(go)) return new Promise(() => {});
      }

      const stillBroken = isTunnelHost(here) ? await pageLooksBroken() : false;
      if (!stillBroken && health && health.ok === true) {
        if (go) {
          try {
            localStorage.setItem('sf_live_url', go);
          } catch (_) {}
        }
        ready();
        return { ok: true, url: go };
      }
    }

    let hint = liveUrl || STABLE_TUNNEL;
    try {
      hint = hint || localStorage.getItem('sf_live_url') || (hosting && hosting.tunnel) || STABLE_TUNNEL;
    } catch (_) {
      hint = hint || STABLE_TUNNEL;
    }

    if (isTunnelHost(here)) {
      try {
        const probe = await fetch('./game.js?t=' + Date.now(), { cache: 'no-store', headers: LT_HEADERS });
        if (probe.ok) {
          ready();
          return { ok: true, degraded: true };
        }
      } catch (_) {}
      showRetry(
        '503 — tunnel verlopen',
        (hint
          ? 'Oude bookmark werkt niet meer.\n\nNieuwe link:\n' + hint + '\n\nTik «Open nieuwe link» of wacht en tik Opnieuw.'
          : 'Localtunnel is even weg. Tik Opnieuw over ~1 minuut.') +
          (hosting && hosting.netlifyUrl
            ? '\n\nNetlify (' + hosting.netlifyUrl + ') kan Forbidden geven tot credits terug zijn — gebruik tunnel of GitHub Pages.'
            : ''),
        hint
      );
      if (skipBtn) skipBtn.style.display = 'inline-block';
    } else {
      showRetry(
        'Geen tunnel-link',
        hint ? 'Open in Safari:\n' + hint : 'Wacht even en tik Opnieuw.',
        hint
      );
    }
    throw new Error('tunnel-unavailable');
  }

  function boot() {
    return runCheck();
  }

  window.sfTunnelBoot = boot();

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      if (skipBtn) skipBtn.style.display = 'none';
      if (openLinkBtn) openLinkBtn.style.display = 'none';
      window.sfTunnelBoot = boot();
      window.sfTunnelBoot.catch(() => {});
    });
  }
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      ready();
    });
  }
  if (openLinkBtn) {
    openLinkBtn.addEventListener('click', () => {
      const u = openLinkBtn.dataset.href;
      if (u) window.location.href = u;
    });
  }
})();
