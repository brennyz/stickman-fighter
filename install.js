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

  let deferredPrompt = null;
  let refreshing = false;
  let swReg = null;

  function toast(msg, ms) {
    if (typeof UI !== 'undefined' && UI.toast) UI.toast(msg, ms || 3200);
  }

  function markSwUpdateReady(on) {
    window.__sfSwUpdateReady = !!on;
    try {
      if (typeof window.updateNetStatus === 'function') window.updateNetStatus();
    } catch (_) {}
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
          location.reload();
          resolve(true);
        };
        navigator.serviceWorker.addEventListener('controllerchange', onChange, { once: true });
        reg.waiting.postMessage({ type: 'SF_SKIP_WAITING' });
        setTimeout(() => resolve(false), 8000);
      });
    } catch (_) {
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
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              markSwUpdateReady(true);
              toast('Update klaar — tik banner of «Verse versie»', 4500);
            }
          });
        });
      }).catch(() => {});
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
      try { toast('App-cache bijgewerkt', 2200); } catch (_) {}
      markSwUpdateReady(false);
      if (typeof window.updateNetStatus === 'function') window.updateNetStatus();
    });

    navigator.serviceWorker.addEventListener('message', (ev) => {
      const data = ev.data || {};
      if (data.type === 'SF_SW_ACTIVATED' && data.cache) {
        try { sessionStorage.setItem('sf_sw_cache', data.cache); } catch (_) {}
        refreshMenuButton();
        markSwUpdateReady(false);
        if (typeof window.updateNetStatus === 'function') window.updateNetStatus();
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
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (choice.outcome === 'accepted') closeInstallScreen();
    refreshMenuButton();
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
