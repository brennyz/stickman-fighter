'use strict';

/**
 * iPad-first: never block taps with a fullscreen overlay.
 */
(function () {
  const overlay = document.getElementById('tunnelBootOverlay');

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

  // Boot instantly — no tunnel wait
  window.sfTunnelBoot = Promise.resolve(ready()).then(() => ({ ok: true, instant: true }));
  window.sfTunnelNukeOverlay = nukeOverlay;

  nukeOverlay();
  setTimeout(nukeOverlay, 0);
  setTimeout(nukeOverlay, 200);
  setInterval(nukeOverlay, 1000);

  const skipBtn = document.getElementById('tunnelBootSkip');
  const retryBtn = document.getElementById('tunnelBootRetry');
  if (skipBtn) skipBtn.addEventListener('click', ready);
  if (retryBtn) retryBtn.addEventListener('click', ready);
})();
