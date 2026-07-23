'use strict';

(function () {
  const overlay = document.getElementById('tunnelBootOverlay');
  const titleEl = document.getElementById('tunnelBootTitle');
  const detailEl = document.getElementById('tunnelBootDetail');
  const retryBtn = document.getElementById('tunnelBootRetry');

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

  function redirectIfNewHost(liveUrl) {
    if (!liveUrl || location.protocol === 'file:') return false;
    let liveHost;
    try {
      liveHost = new URL(liveUrl).hostname;
    } catch (_) {
      return false;
    }
    if (liveHost === location.hostname) return false;
    show('Nieuwe tunnel-link…', 'Je wordt doorgestuurd naar de actieve server.');
    const base = liveUrl.replace(/\/$/, '');
    window.location.replace(base + location.pathname + location.search + location.hash);
    return true;
  }

  function isStaticHost() {
    const h = location.hostname;
    return h.endsWith('.github.io') || h.endsWith('.netlify.app');
  }

  function hostMatchesStable(stableUrl) {
    if (!stableUrl) return false;
    try {
      return new URL(stableUrl).hostname === location.hostname;
    } catch (_) {
      return false;
    }
  }

  async function runCheck() {
    if (location.protocol === 'file:') {
      hide();
      return { ok: true, offline: true };
    }

    let hosting = null;
    try {
      hosting = await fetchHosting();
    } catch (_) {}

    if (isStaticHost() || hostMatchesStable(hosting && hosting.stable)) {
      hide();
      window.dispatchEvent(new Event('sf:tunnel-ready'));
      return { ok: true, static: true };
    }

    show('Verbinding controleren…', 'Tunnel en server worden gecontroleerd.');

    let liveUrl = '';
    try {
      liveUrl = await fetchLiveUrl();
    } catch (_) {}

    const preferred = (hosting && hosting.stable) || liveUrl || (hosting && hosting.tunnel) || '';
    if (redirectIfNewHost(preferred)) {
      return new Promise(() => {});
    }
    if (redirectIfNewHost(liveUrl)) {
      return new Promise(() => {});
    }

    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        if (!liveUrl) liveUrl = await fetchLiveUrl();
        const go = (hosting && hosting.stable) || liveUrl;
        if (redirectIfNewHost(go)) return new Promise(() => {});

        const health = await fetchHealth();
        if (health && (health.ok || health.static)) {
          const url = health.url || liveUrl || (hosting && hosting.tunnel) || '';
          if (url) {
            try {
              localStorage.setItem('sf_live_url', url);
            } catch (_) {}
          }
          hide();
          window.dispatchEvent(new Event('sf:tunnel-ready'));
          return { ok: true, url };
        }
      } catch (_) {}

      show(
        'Verbinding controleren…',
        attempt < 6 ? `Opnieuw (${attempt}/6)…` : 'Nog even geduld…'
      );
      await new Promise((r) => setTimeout(r, 1200 + attempt * 400));
    }

    let hint = '';
    try {
      hint = localStorage.getItem('sf_live_url') || liveUrl || '';
    } catch (_) {
      hint = liveUrl;
    }
    showRetry(
      'Tunnel nog niet bereikbaar',
      hint
        ? 'Open de nieuwste link in Safari:\n' + hint
        : 'De server herstelt de tunnel. Tik op Opnieuw over een paar seconden.'
    );
    throw new Error('tunnel-unavailable');
  }

  function boot() {
    return runCheck();
  }

  window.sfTunnelBoot = boot();

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      window.sfTunnelBoot = boot();
      window.sfTunnelBoot.catch(() => {});
    });
  }
})();
