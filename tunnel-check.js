'use strict';

/**
 * iPad: no fullscreen block on GitHub Pages / ?ipad=1.
 * loca.lt bookmark stays on the same URL — no auto-redirect to Pages.
 */
(function () {
  const overlay = document.getElementById('tunnelBootOverlay');
  const titleEl = document.getElementById('tunnelBootTitle');
  const detailEl = document.getElementById('tunnelBootDetail');
  const hintEl = document.getElementById('tunnelBootHint');
  const openLinkBtn = document.getElementById('tunnelBootOpenLink');
  const skipBtn = document.getElementById('tunnelBootSkip');
  const retryBtn = document.getElementById('tunnelBootRetry');

  const isPages = /\.github\.io$/i.test(location.hostname)
    || /\.netlify\.app$/i.test(location.hostname);
  const isTunnel = /\.loca\.lt$/i.test(location.hostname);
  const ipadEntry = /[?&]ipad=1\b/.test(location.search);

  let pagesFallback = 'https://brennyz.github.io/stickman-fighter/ipad.html';

  function nukeOverlay() {
    if (!overlay) return;
    overlay.hidden = true;
    overlay.setAttribute('hidden', '');
    overlay.style.cssText = 'display:none!important;pointer-events:none!important;visibility:hidden!important;z-index:-1!important';
    try { overlay.remove(); } catch (_) {}
  }

  function ready() {
    nukeOverlay();
    window.dispatchEvent(new Event('sf:tunnel-ready'));
  }

  function showTunnelWait(msg) {
    if (!overlay || isPages || ipadEntry) return;
    overlay.hidden = false;
    overlay.removeAttribute('hidden');
    overlay.style.cssText = '';
    if (titleEl) titleEl.textContent = 'Stickman Fighter';
    if (detailEl) detailEl.textContent = msg || 'Tunnel controleren…';
    if (hintEl) {
      hintEl.style.display = 'block';
      hintEl.innerHTML = 'Je bookmark blijft: <strong>' + location.host + '/ipad.html</strong><br>' +
        'Thuis: laat <code>./start-local.sh --tunnel</code> draaien. Bij 503: optioneel GitHub Pages (andere bookmark).';
    }
  }

  function showTunnelFail() {
    showTunnelWait('Tunnel even offline — thuis server + tunnel aan?');
    if (openLinkBtn) {
      openLinkBtn.style.display = 'inline-block';
      openLinkBtn.textContent = 'Open GitHub Pages (extra bookmark)';
      openLinkBtn.onclick = () => {
        window.open(pagesFallback, '_blank', 'noopener');
      };
    }
    if (retryBtn) retryBtn.style.display = 'inline-block';
  }

  function bindControls() {
    if (skipBtn) skipBtn.addEventListener('click', ready);
    if (retryBtn) retryBtn.addEventListener('click', () => {
      if (detailEl) detailEl.textContent = 'Opnieuw…';
      runTunnelCheck();
    });
  }

  function loadHostingHint() {
    return fetch('./hosting.json?t=' + Date.now(), { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (j && j.bookmarkPages) pagesFallback = j.bookmarkPages;
        else if (j && j.githubPages) pagesFallback = j.githubPages.replace(/\/?$/, '/ipad.html');
        return j;
      })
      .catch(() => null);
  }

  function runTunnelCheck() {
    showTunnelWait('Tunnel controleren…');
    return fetch('./health.json?t=' + Date.now(), { cache: 'no-store' })
      .then((r) => r.json())
      .then((h) => {
        if (h && h.ok !== false) {
          ready();
          return h;
        }
        throw new Error('tunnel health not ok');
      })
      .catch(() => {
        showTunnelFail();
        return { ok: false };
      });
  }

  bindControls();

  if (isPages || ipadEntry || location.protocol === 'file:') {
    window.sfTunnelBoot = Promise.resolve(ready()).then(() => ({ ok: true, instant: true }));
    nukeOverlay();
    setTimeout(nukeOverlay, 0);
    return;
  }

  if (!isTunnel) {
    window.sfTunnelBoot = loadHostingHint().then(() => ready()).then(() => ({ ok: true, other: true }));
    nukeOverlay();
    return;
  }

  // Fixed loca.lt bookmark — never redirect away from this host
  window.sfTunnelBoot = loadHostingHint()
    .then(() => runTunnelCheck())
    .then((h) => h);
  window.sfTunnelNukeOverlay = nukeOverlay;
})();
