'use strict';

(function () {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  const btnMenu = document.getElementById('btnInstallApp');
  const btnLabel = document.getElementById('btnInstallLabel');
  const screen = document.getElementById('installScreen');
  const back = document.getElementById('installBack');
  const androidBtn = document.getElementById('installAndroidBtn');
  const androidSteps = document.getElementById('installAndroidSteps');
  const iosSteps = document.getElementById('installIosSteps');
  const desktopSteps = document.getElementById('installDesktopSteps');
  const fileNote = document.getElementById('installFileNote');
  const doneMsg = document.getElementById('installDoneMsg');
  const cacheStatus = document.getElementById('installCacheStatus');

  let deferredPrompt = null;
  let refreshing = false;
  let swReg = null;
  let pendingReload = null;

  function toast(msg, ms) {
    if (typeof UI !== 'undefined' && UI.toast) UI.toast(msg, ms || 3200);
  }

  function markSwUpdateReady(on) {
    window.__sfSwUpdateReady = !!on;
    try {
      if (typeof window.updateNetStatus === 'function') window.updateNetStatus();
    } catch (_) {}
  }

  function refreshInstallCacheLine() {
    if (!cacheStatus) return;
    const swOk = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
    let line = swOk
      ? 'Offline-cache actief — speel ook zonder netwerk'
      : 'Offline-cache: open 1× online na installatie';
    const finish = () => {
      try {
        const c = sessionStorage.getItem('sf_sw_cache');
        if (c) line += ' · ' + c.replace('stickfighter-app-v', 'SW v');
      } catch (_) {}
      cacheStatus.textContent = line;
    };
    if (swOk && 'caches' in window) {
      Promise.all([
        caches.match('./game.js', { ignoreSearch: true }),
        caches.match('./index.html', { ignoreSearch: true }),
        caches.match('./styles/main.css', { ignoreSearch: true }),
      ]).then(([js, html, css]) => {
        if (js && html && css) line = 'Offline-shell compleet — JS, menu & CSS in cache';
        else if (swOk) line = 'Cache laden… — even online blijven voor volledige shell';
        finish();
      }).catch(finish);
      return;
    }
    finish();
  }

  function refreshMenuButton() {
    if (!btnMenu || !btnLabel) return;
    if (isStandalone) {
      btnMenu.classList.add('done');
      btnMenu.disabled = true;
      const offlineOk = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
      btnLabel.innerHTML = offlineOk
        ? 'Speelt als app &#10004;<small>Offline-cache actief — save blijft lokaal</small>'
        : 'Speelt als app &#10004;<small>Geïnstalleerd vanuit app-lade</small>';
    } else {
      btnMenu.classList.remove('done');
      btnMenu.disabled = false;
      btnLabel.innerHTML = 'Zet in app-lade<small>Één icoon · werkt ook offline na 1× online openen</small>';
    }
    refreshInstallCacheLine();
  }

  function showInstallScreen() {
    if (!screen) return;
    if (typeof UI !== 'undefined' && UI.show) UI.show('installScreen');
    else screen.classList.add('active');

    if (doneMsg) doneMsg.style.display = isStandalone ? 'block' : 'none';
    if (androidBtn) androidBtn.style.display = (!isStandalone && deferredPrompt) ? 'flex' : 'none';
    if (androidSteps) androidSteps.style.display = (!isStandalone && isAndroid && !deferredPrompt) ? 'block' : 'none';
    if (iosSteps) iosSteps.style.display = (!isStandalone && isIOS) ? 'block' : 'none';
    if (desktopSteps) desktopSteps.style.display = (!isStandalone && !isIOS && !isAndroid && !deferredPrompt) ? 'block' : 'none';
    if (fileNote) fileNote.style.display = (location.protocol === 'file:') ? 'block' : 'none';
    refreshInstallCacheLine();
  }

  function closeInstallScreen() {
    if (typeof UI !== 'undefined' && UI.goMenu) UI.goMenu();
    else if (screen) screen.classList.remove('active');
  }

  async function applySwUpdate() {
    if (!('serviceWorker' in navigator)) return false;
    try {
      const reg = swReg || await navigator.serviceWorker.ready;
      if (!reg || !reg.waiting) return false;
      markSwUpdateReady(true);
      return new Promise((resolve) => {
        const onChange = () => {
          refreshing = true;
          reloadWhenIdle('applySwUpdate');
          resolve(true);
        };
        navigator.serviceWorker.addEventListener('controllerchange', onChange, { once: true });
        reg.waiting.postMessage({ type: 'SF_SKIP_WAITING' });
        setTimeout(() => {
          toast('Update duurt lang — tik «Verse versie» in Instellingen', 3600);
          resolve(false);
        }, 8000);
      });
    } catch (_) {
      toast('Update mislukt — tik «Verse versie»', 3200);
      return false;
    }
  }

  async function nukeSwAndReload() {
    try {
      if (navigator.serviceWorker) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if (window.caches && caches.keys) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (_) {}
    try {
      const u = new URL(location.href);
      u.searchParams.set('fresh', String(Date.now()));
      location.replace(u.toString());
    } catch (_) {
      location.reload();
    }
  }

  async function forceFreshVersion() {
    const soft = await applySwUpdate();
    if (!soft) await nukeSwAndReload();
  }

  /** Midden in een gevecht nooit herladen — dat gooit je naar het startscherm. */
  function busyPlaying() {
    try {
      if (document.body.classList.contains('is-playing')) return true;
      const s = window.__sf && window.__sf.state;
      if (s === 'play' || s === 'pause') return true;
    } catch (_) {}
    return false;
  }

  /**
   * Alleen herladen als de geladen game.js écht ouder is dan de HTML verwacht.
   * Anders pakt de nieuwe cache gewoon bij de volgende start — herladen tijdens
   * spelen of tijdens level kiezen (dobbelstenen!) gooit je naar het startscherm.
   */
  function needsFreshJs() {
    try {
      const expect = window.__SF_EXPECT_REV;
      if (expect == null) return false;
      const loaded = window.__sf && window.__sf.swRev;
      if (loaded == null) return false;
      return Number(loaded) !== Number(expect);
    } catch (_) {
      return false;
    }
  }

  /** Veilig moment: rustig op de menu-landing, geen gevecht of level-flow bezig. */
  function safeToReload() {
    if (busyPlaying()) return false;
    try {
      if (typeof window.__sfSafeToReload === 'function') return !!window.__sfSafeToReload();
      return document.body.classList.contains('menu-hub-live');
    } catch (_) {
      return false;
    }
  }

  function reloadWhenIdle(reason) {
    if (pendingReload) return;
    pendingReload = reason || 'sw';
    let waited = 0;
    const tryReload = () => {
      if (!pendingReload) return;
      if (!safeToReload()) {
        if (waited < 180000) {
          waited += 2000;
          setTimeout(tryReload, 2000);
          return;
        }
        // Niet forceren midden in flow — banner blijft, user tikt «Verse versie».
        pendingReload = null;
        refreshing = false;
        markSwUpdateReady(true);
        try { toast('Update klaar — tik «Verse versie» als je in het menu bent', 4500); } catch (_) {}
        return;
      }
      pendingReload = null;
      location.reload();
    };
    setTimeout(tryReload, 200);
  }

  function trackWaitingWorker(reg) {
    if (reg && reg.waiting && navigator.serviceWorker.controller) {
      markSwUpdateReady(true);
      toast('Update klaar — tik banner of «Verse versie»', 4200);
    }
  }

  function wireServiceWorker() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    const skipSw = /[?&]ipad=1\b/.test(location.search) || /[?&]nosw=1\b/.test(location.search);
    if (skipSw) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      }).catch(() => {});
      return;
    }
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then((reg) => {
        swReg = reg;
        refreshMenuButton();
        trackWaitingWorker(reg);
        try { reg.update(); } catch (_) {}
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state !== 'installed' || !navigator.serviceWorker.controller) return;
            markSwUpdateReady(true);
            // Auto-apply (nieuwe UI + oude JS = kapot avontuur), maar niet midden
            // in een gevecht of level-keuze: activeren triggert controllerchange.
            let waited = 0;
            const apply = () => {
              if (!safeToReload()) {
                if (waited < 180000) {
                  waited += 2000;
                  setTimeout(apply, 2000);
                  return;
                }
                toast('Update klaar — tik banner of «Verse versie»', 4500);
                return;
              }
              try { nw.postMessage({ type: 'SF_SKIP_WAITING' }); }
              catch (_) { toast('Update klaar — tik banner of «Verse versie»', 4500); }
            };
            apply();
          });
        });
      }).catch(() => {
        toast('Offline-cache niet beschikbaar — speel 1× online', 3600);
      });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !navigator.onLine) return;
      try {
        (swReg || navigator.serviceWorker.ready).then((reg) => {
          swReg = reg;
          reg.update();
          trackWaitingWorker(reg);
        });
      } catch (_) {}
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      markSwUpdateReady(false);
      if (typeof window.updateNetStatus === 'function') window.updateNetStatus();
      if (!needsFreshJs()) {
        // Cache is bij; de draaiende game.js is al de juiste versie.
        try { toast('App-cache bijgewerkt', 2000); } catch (_) {}
        return;
      }
      // Oude in-memory game.js terwijl HTML/UI al nieuw is → wél verversen,
      // maar pas op een rustig moment in het menu.
      try { toast('Update klaar — laadt zodra je in het menu bent', 3200); } catch (_) {}
      reloadWhenIdle('controllerchange');
    });

    navigator.serviceWorker.addEventListener('message', (ev) => {
      const data = ev.data || {};
      if (data.type === 'SF_SW_ACTIVATED' && data.cache) {
        try { sessionStorage.setItem('sf_sw_cache', data.cache); } catch (_) {}
        refreshMenuButton();
        markSwUpdateReady(false);
        if (typeof window.updateNetStatus === 'function') window.updateNetStatus();
        refreshInstallCacheLine();
      }
    });
  }

  wireServiceWorker();

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (androidBtn) androidBtn.style.display = 'flex';
    refreshMenuButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    refreshMenuButton();
    if (doneMsg) doneMsg.style.display = 'block';
    toast('In app-lade gezet — open via het icoon', 3600);
  });

  async function triggerNativeInstall() {
    if (!deferredPrompt) {
      showInstallScreen();
      return;
    }
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (choice.outcome === 'accepted') closeInstallScreen();
      refreshMenuButton();
    } catch (_) {
      toast('Installatie mislukt — volg stappen op het scherm', 3200);
      showInstallScreen();
    }
  }

  if (btnMenu) {
    btnMenu.addEventListener('click', () => {
      if (isStandalone) return;
      if (typeof AudioSys !== 'undefined') { AudioSys.init(); AudioSys.sfx('select'); }
      if (deferredPrompt) triggerNativeInstall();
      else showInstallScreen();
    });
  }

  if (androidBtn) {
    androidBtn.addEventListener('click', () => {
      if (typeof AudioSys !== 'undefined') AudioSys.sfx('select');
      triggerNativeInstall();
    });
  }

  if (back) back.addEventListener('click', () => {
    if (typeof AudioSys !== 'undefined') AudioSys.sfx('select');
    closeInstallScreen();
  });

  refreshMenuButton();
  window.StickInstall = {
    showInstallScreen,
    refreshMenuButton,
    isStandalone,
    applySwUpdate,
    nukeSwAndReload,
    forceFreshVersion,
  };
  window.applySwUpdate = applySwUpdate;
  window.nukeSwAndReload = nukeSwAndReload;
  window.forceFreshVersion = forceFreshVersion;
})();
