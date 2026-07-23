'use strict';

(function () {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  const btnMenu = document.getElementById('btnInstallApp');
  const btnLabel = document.getElementById('btnInstallLabel');
  const screen = document.getElementById('installScreen');
  const back = document.getElementById('installBack');
  const androidBtn = document.getElementById('installAndroidBtn');
  const iosSteps = document.getElementById('installIosSteps');
  const desktopSteps = document.getElementById('installDesktopSteps');
  const fileNote = document.getElementById('installFileNote');
  const doneMsg = document.getElementById('installDoneMsg');

  let deferredPrompt = null;

  function refreshMenuButton() {
    if (!btnMenu || !btnLabel) return;
    if (isStandalone) {
      btnMenu.classList.add('done');
      btnMenu.disabled = true;
      btnLabel.innerHTML = 'Speelt als app &#10004;<small>Geïnstalleerd vanuit app-lade</small>';
    } else {
      btnMenu.classList.remove('done');
      btnMenu.disabled = false;
      btnLabel.innerHTML = 'Zet in app-lade<small>Één icoon op je beginscherm — tik &amp; speel</small>';
    }
  }

  function showInstallScreen() {
    if (!screen) return;
    if (typeof UI !== 'undefined' && UI.show) UI.show('installScreen');
    else screen.classList.add('active');

    if (doneMsg) doneMsg.style.display = isStandalone ? 'block' : 'none';
    if (androidBtn) androidBtn.style.display = (!isStandalone && deferredPrompt) ? 'flex' : 'none';
    if (iosSteps) iosSteps.style.display = (!isStandalone && isIOS) ? 'block' : 'none';
    if (desktopSteps) desktopSteps.style.display = (!isStandalone && !isIOS && !deferredPrompt) ? 'block' : 'none';
    if (fileNote) fileNote.style.display = (location.protocol === 'file:') ? 'block' : 'none';
  }

  function closeInstallScreen() {
    if (typeof UI !== 'undefined' && UI.goMenu) UI.goMenu();
    else if (screen) screen.classList.remove('active');
  }

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
    });
  }

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
  window.StickInstall = { showInstallScreen, refreshMenuButton, isStandalone };
})();
