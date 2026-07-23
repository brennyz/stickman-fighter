'use strict';

(function () {
  const overlay = document.getElementById('tunnelBootOverlay');
  const titleEl = document.getElementById('tunnelBootTitle');
  const detailEl = document.getElementById('tunnelBootDetail');
  const retryBtn = document.getElementById('tunnelBootRetry');
  const skipBtn = document.getElementById('tunnelBootSkip');

  function show(msg, detail) {
    if (!overlay) return;
    overlay.hidden = false;
    overlay.setAttribute('aria-busy', 'true');
    if (titleEl) titleEl.textContent = msg;
    if (detailEl) detailEl.textContent = detail || '';
    if (retryBtn) retryBtn.style.display = 'none';
  }

  function showRetry(msg, detail) {
    show(msg, detail);
    if (retryBtn) retryBtn.style.display = 'flex';
    if (overlay) overlay.setAttribute('aria-busy', 'false');
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
    const r = await fetch('./LIVE-LINK.txt?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('link');
    return parseLiveUrl(await r.text());
  }

  async function fetchHealth() {
    const r = await fetch('./health.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('health');
    return r.json();
  }

  async function fetchHosting() {
    const r = await fetch('./hosting.json?t=' + Date.now(), { cache: 'no-store' });
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
    show('Nieuwe tunnel-link…', 'Je wordt doorgestuurd naar de actieve server.');
    const base = liveUrl.replace(/\/$/, '');
    window.location.replace(base + location.pathname + location.search + location.hash);
    return true;
  }

  /** Alleen Cloudflare-tunnel URLs — nooit GitHub/Netlify stable hier. */
  function pickTunnelUrl(hosting, liveUrl, health) {
    const candidates = [
      liveUrl,
      health && health.url,
      hosting && hosting.tunnel,
    ].filter(Boolean);
    for (const u of candidates) {
      if (isTunnelHost(hostnameOf(u))) return u;
    }
    return liveUrl || (health && health.url) || (hosting && hosting.tunnel) || '';
  }

  function ready() {
    hide();
    window.dispatchEvent(new Event('sf:tunnel-ready'));
  }

  async function runCheck() {
    if (location.protocol === 'file:') {
      hide();
      return { ok: true, offline: true };
    }

    const here = location.hostname;

    if (isLocalDev(here)) {
      ready();
      return { ok: true, local: true };
    }

    let hosting = null;
    try {
      hosting = await fetchHosting();
    } catch (_) {}

    if (isStaticHost(here)) {
      ready();
      return { ok: true, static: true };
    }

    const stable = hosting && hosting.stable;
    if (stable && hostnameOf(stable) === here) {
      ready();
      return { ok: true, stable: true };
    }

    // Optioneel: vaste GitHub/Netlify URL (alleen als expliciet aan)
    if (hosting && hosting.forceStable && stable && isStaticHost(hostnameOf(stable))) {
      if (redirectIfNewHost(stable)) return new Promise(() => {});
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
    if (isTunnelHost(here) && tunnelGo) {
      if (redirectIfNewHost(tunnelGo)) return new Promise(() => {});
    }

    if (health && (health.ok || health.static)) {
      const url = pickTunnelUrl(hosting, liveUrl, health);
      if (url) {
        try {
          localStorage.setItem('sf_live_url', url);
        } catch (_) {}
      }
      ready();
      return { ok: true, url };
    }

    for (let attempt = 1; attempt <= 8; attempt++) {
      show(
        'Verbinding controleren…',
        attempt < 8
          ? `Tunnel opstarten (${attempt}/8)…`
          : 'Nog even geduld — server herstelt tunnel…'
      );
      await new Promise((r) => setTimeout(r, 900 + attempt * 350));
      try {
        liveUrl = await fetchLiveUrl();
      } catch (_) {}
      try {
        health = await fetchHealth();
      } catch (_) {}

      const go = pickTunnelUrl(hosting, liveUrl, health);
      if (isTunnelHost(here) && go && redirectIfNewHost(go)) {
        return new Promise(() => {});
      }

      if (health && (health.ok || health.static)) {
        if (go) {
          try {
            localStorage.setItem('sf_live_url', go);
          } catch (_) {}
        }
        ready();
        return { ok: true, url: go };
      }
    }

    let hint = '';
    try {
      hint = localStorage.getItem('sf_live_url') || liveUrl || (hosting && hosting.tunnel) || '';
    } catch (_) {
      hint = liveUrl;
    }
    if (isTunnelHost(here)) {
      try {
        const probe = await fetch('./index.html?t=' + Date.now(), { cache: 'no-store' });
        if (probe.ok) {
          ready();
          return { ok: true, degraded: true };
        }
      } catch (_) {}
      showRetry(
        'Verbinding traag',
        hint
          ? 'Safari op iPad:\n' + hint + '\n\nOf tik «Toch starten» als de pagina al laadt.'
          : 'Tik Opnieuw of «Toch starten».'
      );
      if (skipBtn) skipBtn.style.display = 'inline-block';
    } else {
      showRetry(
        'Geen tunnel-link',
        hint ? 'Open in Safari:\n' + hint : 'Wacht even en tik Opnieuw.'
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
      window.sfTunnelBoot = boot();
      window.sfTunnelBoot.catch(() => {});
    });
  }
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      ready();
    });
  }
})();
