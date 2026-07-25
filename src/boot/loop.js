/* ============================= HOOFDLUS ================================ */
let lastTime = performance.now();
let menuAnimT = 0;
let menuHeroFrame = 0;
let loopIdleFrames = 0;
let menuBgCache = null;
let menuBgCacheKey = '';

function menuHeroPaintSkip() {
  if (save.liteFx) return 2;
  if (Perf.tier >= 2) return 3;
  if (Perf.tier >= 1) return 2;
  return 1;
}

function menuBgCacheInvalidate() {
  menuBgCacheKey = '';
}

function menuBackdropLiteFlags() {
  const lite = save.liteFx || motionReduced() || Perf.tier >= 1;
  return { lite, ultraLite: lite || Perf.tier >= 2 };
}

function ensureMenuBgCache() {
  const { lite, ultraLite } = menuBackdropLiteFlags();
  const key = W + 'x' + H + '@' + DPR + 't' + Perf.tier + (lite ? 'L' : '') + (ultraLite ? 'U' : '');
  if (menuBgCache && menuBgCacheKey === key) return menuBgCache;
  menuBgCacheKey = key;
  if (!menuBgCache) menuBgCache = document.createElement('canvas');
  menuBgCache.width = Math.max(1, Math.floor(W * DPR));
  menuBgCache.height = Math.max(1, Math.floor(H * DPR));
  const c = menuBgCache.getContext('2d');
  if (!c) return null;
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.fillStyle = '#0b0e1a';
  c.fillRect(0, 0, W, H);
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1a1038');
  g.addColorStop(0.45, '#151b33');
  g.addColorStop(1, '#0a0d18');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.save();
  c.translate(W * 0.5, H * 0.28);
  const rays = ultraLite ? 6 : 10;
  for (let i = 0; i < rays; i++) {
    c.rotate(Math.PI / rays);
    c.fillStyle = i % 2 ? 'rgba(255,90,50,.06)' : 'rgba(255,200,60,.05)';
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(W * 0.6, -H * 0.02);
    c.lineTo(W * 0.6, H * 0.02);
    c.closePath();
    c.fill();
  }
  c.restore();
  return menuBgCache;
}

function drawMenuBackdrop(c, t) {
  const { lite, ultraLite } = menuBackdropLiteFlags();
  const cache = ensureMenuBgCache();
  if (cache) {
    c.drawImage(cache, 0, 0, W, H);
  } else {
    c.fillStyle = '#0b0e1a';
    c.fillRect(0, 0, W, H);
  }
  const starN = ultraLite ? 10 : (lite ? 14 : 28);
  for (let i = 0; i < starN; i++) {
    const x = (Math.sin(t * 0.4 + i * 1.7) * 0.5 + 0.5) * W;
    const y = ((i * 47 + t * 22) % (H + 40)) - 20;
    c.globalAlpha = 0.12 + (i % 5) * 0.04;
    c.fillStyle = i % 3 === 0 ? '#7cf5ff' : '#ffd75e';
    c.beginPath();
    c.arc(x, y, 2 + (i % 4), 0, TAU);
    c.fill();
  }
  c.globalAlpha = 0.08;
  c.strokeStyle = '#ffd75e';
  c.lineWidth = 3;
  if (!lite) {
    c.beginPath();
    c.arc(W * 0.5, H * 0.42, 90 + Math.sin(t * 0.8) * 8, 0, TAU);
    c.stroke();
  }
  c.save();
  c.translate(W * 0.5, H * 0.42);
  if (typeof drawJutsuOrb === 'function') {
    drawJutsuOrb(c, 0, 0,
      lite ? 22 : 28 + Math.sin(t * 2) * 4,
      lite ? t * 2 : t * 3,
      'rasengan',
      lite ? 0.55 : 0.85);
  }
  c.restore();
  c.globalAlpha = 1;
}

function paintMenuHeroCanvas(t) {
  const cv = document.getElementById('menuHeroCanvas');
  if (!cv) return;
  const c = cv.getContext('2d');
  if (!c) return;
  const lite = save.liteFx || Perf.tier >= 1;
  const Ws = cv.width;
  const Hs = cv.height;
  c.clearRect(0, 0, Ws, Hs);
  const sky = c.createLinearGradient(0, 0, 0, Hs);
  sky.addColorStop(0, '#2a1848');
  sky.addColorStop(0.55, '#120c20');
  sky.addColorStop(1, '#08060c');
  c.fillStyle = sky;
  c.fillRect(0, 0, Ws, Hs);
  const cx = Ws * 0.5;
  const cy = Hs * 0.38;
  const pulse = 0.92 + Math.sin(t * 2.2) * 0.06;
  c.save();
  c.translate(cx, cy);
  c.scale(pulse, pulse);
  const rays = lite ? (Perf.tier >= 2 ? 6 : 8) : 12;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * TAU + t * 0.15;
    c.strokeStyle = i % 2 ? 'rgba(255,100,60,.25)' : 'rgba(255,220,80,.18)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(Math.cos(a) * Ws * 0.55, Math.sin(a) * Hs * 0.9);
    c.stroke();
  }
  const grd = c.createRadialGradient(0, 0, 0, 0, 0, 72);
  grd.addColorStop(0, '#ffe259');
  grd.addColorStop(1, 'rgba(255,120,40,.15)');
  c.fillStyle = grd;
  c.beginPath();
  c.arc(0, 0, 72, 0, TAU);
  c.fill();
  c.restore();
  c.fillStyle = 'rgba(30,25,45,.9)';
  c.fillRect(0, Hs * 0.72, Ws, Hs * 0.28);
  const bounce = Math.sin(t * 3.5) * 4;
  const drawMenuStick = (x, face, col) => {
    c.save();
    c.translate(x, Hs * 0.78 + bounce * (face > 0 ? 1 : -1));
    c.scale(face, 1);
    c.strokeStyle = col;
    c.lineWidth = 5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, -52);
    c.stroke();
    c.beginPath();
    c.moveTo(0, -52);
    c.lineTo(28, -78);
    c.stroke();
    c.fillStyle = col;
    c.beginPath();
    c.arc(0, -88, 14, 0, TAU);
    c.fill();
    c.fillStyle = '#ffd75e';
    c.beginPath();
    c.arc(32, -72, 10, 0, TAU);
    c.fill();
    c.restore();
  };
  drawMenuStick(Ws * 0.28, 1, '#eef5ff');
  drawMenuStick(Ws * 0.72, -1, '#ff8a9a');
  const vx = Ws * 0.5;
  const vy = Hs * 0.58;
  c.fillStyle = '#c01828';
  c.strokeStyle = '#ffd75e';
  c.lineWidth = 3;
  c.fillRect(vx - 38, vy - 22, 76, 44);
  c.strokeRect(vx - 38, vy - 22, 76, 44);
  c.font = '900 26px "Black Ops One", Bangers, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = '#fff';
  c.fillText('VS', vx, vy + 1);
}

function loop(now) {
  requestAnimationFrame(loop);
  try {
    if (!ctx || !canvas) return;
    const hidden = typeof document !== 'undefined' && document.hidden;
    if (hidden) { lastTime = now; return; }
    const idle = Perf.loopIdleMode();
    if (idle) {
      loopIdleFrames++;
      if (loopIdleFrames % 30 !== 0) return;
    } else {
      loopIdleFrames = 0;
    }
    const dtRaw = (now - lastTime) / 1000;
    const dt = idle ? Math.min(dtRaw, 0.25) : Math.min(dtRaw, 0.05);
    if (!(dt >= 0) || dtRaw > 1) { lastTime = now; return; }
    Perf.tick(dt * 1000);
    lastTime = now;
    if (state === 'play' && game) {
      try {
        game.update(dt);
      } catch (updateErr) {
        if (!window.__sfLoopErr) {
          window.__sfLoopErr = true;
          sfReportError('update', updateErr, 'Gevecht onderbroken — terug naar menu');
          recoverToMenu();
          setTimeout(() => { window.__sfLoopErr = false; }, 2000);
        }
        return;
      }
      try { Input.endFrame(); } catch (frameErr) {
        sfReportError('input', frameErr);
      }
    } else if (state === 'pause' && game) {
      try { Input.endFrame(); } catch (frameErr) {
        sfReportError('input', frameErr);
      }
    } else if (Perf.menuLandingVisible()) {
      menuAnimT += dt;
      ensureMenuScreenActive();
      menuHeroFrame++;
      if (menuHeroFrame % menuHeroPaintSkip() === 0) {
        try { paintMenuHeroCanvas(menuAnimT); } catch (_) {}
      }
    }
    if (!Perf.canvasDrawActive()) return;
    if (game && typeof game.draw === 'function' && !Perf.skipHeavyDraw()) {
      try {
        game.draw(ctx);
      } catch (drawErr) {
        if (!window.__sfLoopErr) {
          window.__sfLoopErr = true;
          sfReportError('draw', drawErr, 'Tekenen mislukt — terug naar menu');
          recoverToMenu();
          setTimeout(() => { window.__sfLoopErr = false; }, 2000);
        }
        return;
      }
    } else if (!Perf.skipHeavyDraw()) {
      try {
        drawMenuBackdrop(ctx, menuAnimT);
      } catch (bgErr) {
        if (!window.__sfBgErrLogged) {
          window.__sfBgErrLogged = true;
          console.error('[Stickman] menu-backdrop', bgErr);
        }
        try { ctx.fillStyle = '#0b0e1a'; ctx.fillRect(0, 0, W, H); } catch (_) {}
      }
    }
  } catch (err) {
    console.error(err);
    if (!window.__sfLoopErr) {
      window.__sfLoopErr = true;
      sfReportError('loop', err);
      recoverToMenu();
      setTimeout(() => { window.__sfLoopErr = false; }, 2000);
    }
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (state === 'play') {
      try { Input.releaseAll(); } catch (_) {}
      state = 'pause';
      AudioSys.setPaused(true);
      try { UI.renderPauseToggles(); } catch (_) {}
      UI.show('pauseScreen');
    } else {
      try {
        if (AudioSys.ctx && AudioSys.ctx.state === 'running') AudioSys.ctx.suspend();
      } catch (_) {}
    }
  } else {
    try {
      if (AudioSys.ctx && AudioSys.ctx.state === 'suspended' && (save.music || save.sfx)) {
        AudioSys.ctx.resume();
      }
    } catch (_) {}
    AudioSys.applyVolumes();
  }
});

function isStandalonePwa() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch (_) {
    return false;
  }
}

function swCacheHint() {
  try {
    const c = sessionStorage.getItem('sf_sw_cache');
    if (c) return ' · ' + c.replace('stickfighter-app-v', 'SW v');
  } catch (_) {}
  return typeof SW_CACHE_REV !== 'undefined' ? ' · SW v' + SW_CACHE_REV : '';
}

function updateNetStatus(ev) {
  const el = document.getElementById('netStatus');
  if (!el) return;
  const off = typeof navigator.onLine === 'boolean' && !navigator.onLine;
  const swReady = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
  const standalone = isStandalonePwa();
  const swUpdate = !!window.__sfSwUpdateReady;
  try {
    document.body.classList.toggle('sf-offline', off);
    document.body.classList.toggle('sf-sw-ready', swReady);
    document.body.classList.toggle('sf-sw-update', swUpdate);
  } catch (_) {}

  const paintUpdateBanner = () => {
    el.hidden = false;
    el.classList.remove('online-flash', 'sw-pending', 'offline-ready');
    el.classList.add('sw-update');
    el.setAttribute('role', 'button');
    if ('tabIndex' in el) el.tabIndex = 0;
    el.textContent = 'Update klaar — tik om te laden · of «Verse versie»';
  };

  if (swUpdate && navigator.onLine !== false) {
    paintUpdateBanner();
    return;
  }

  el.removeAttribute && el.removeAttribute('role');
  if ('tabIndex' in el) el.tabIndex = -1;

  if (off) {
    el.hidden = false;
    el.classList.remove('online-flash', 'sw-pending', 'sw-update');
    if (state === 'play') {
      el.textContent = standalone
        ? 'Offline — speelt uit app-cache · save blijft lokaal'
        : 'Offline — uit cache · «Zet in app-lade» = altijd spelen';
    } else {
      el.textContent = swReady
        ? 'Offline — menu & save uit cache' + swCacheHint()
        : 'Offline — open 1× online voor volledige PWA-cache';
    }
    if (ev && ev.type === 'offline') {
      try { UI.toast('Offline — voortgang blijft op dit apparaat', 3000); } catch (_) {}
    }
    return;
  }
  if (ev && ev.type === 'online') {
    el.hidden = false;
    el.classList.remove('sw-pending', 'sw-update');
    el.classList.add('online-flash');
    el.textContent = 'Weer online — HTML/game via netwerk bij volgende load';
    try { UI.toast('Weer online', 2200); } catch (_) {}
    if ('serviceWorker' in navigator) {
      try { navigator.serviceWorker.ready.then((reg) => reg.update()); } catch (_) {}
    }
    setTimeout(() => {
      if (navigator.onLine && !window.__sfSwUpdateReady) {
        el.hidden = true;
        el.classList.remove('online-flash');
        el.textContent = '';
      }
    }, 3200);
    return;
  }
  if (!swReady && location.protocol !== 'file:' && 'serviceWorker' in navigator && !/[?&](ipad|nosw)=1\b/.test(location.search)) {
    el.hidden = false;
    el.classList.add('sw-pending');
    el.classList.remove('online-flash', 'sw-update', 'offline-ready');
    el.textContent = 'Cache laden… — daarna ook offline spelen';
    return;
  }
  if (swReady && 'caches' in window && !window.__sfOfflineReadyShown) {
    Promise.all([
      caches.match('./game.js', { ignoreSearch: true }),
      caches.match('./index.html', { ignoreSearch: true }),
      caches.match('./styles/main.css', { ignoreSearch: true }),
    ]).then(([js, html, css]) => {
      if (!js || !html || !css || window.__sfOfflineReadyShown) return;
      window.__sfOfflineReadyShown = 1;
        const el2 = document.getElementById('netStatus');
        if (!el2 || window.__sfSwUpdateReady || !navigator.onLine) return;
        el2.hidden = false;
        el2.classList.remove('sw-pending', 'sw-update');
        el2.classList.add('offline-ready');
        const ver = typeof APP_VERSION !== 'undefined' ? APP_VERSION : '';
        el2.textContent = ver ? `Offline-klaar · v${ver} in cache${swCacheHint()}` : 'Offline-klaar — app opgeslagen';
        setTimeout(() => {
          if (!window.__sfSwUpdateReady && navigator.onLine && el2.classList.contains('offline-ready')) {
            el2.hidden = true;
            el2.classList.remove('offline-ready');
            el2.textContent = '';
          }
        }, 4500);
    }).catch(() => {});
  }
  el.hidden = true;
  el.classList.remove('online-flash', 'sw-pending', 'sw-update', 'offline-ready');
  el.textContent = '';
}
window.addEventListener('online', updateNetStatus);
window.addEventListener('offline', updateNetStatus);
window.addEventListener('pageshow', (ev) => {
  if (ev.persisted) {
    try { Input.releaseAll(); } catch (_) {}
    if (state === 'play' && game) {
      state = 'pause';
      try { AudioSys.setPaused(true); } catch (_) {}
      try { UI.renderPauseToggles(); UI.show('pauseScreen'); } catch (_) {}
    }
    scheduleResize();
  }
  updateNetStatus(ev);
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') updateNetStatus();
});
window.updateNetStatus = updateNetStatus;

function wireNetStatusTap() {
  const el = document.getElementById('netStatus');
  if (!el || el.dataset.sfNetTap) return;
  el.dataset.sfNetTap = '1';
  const run = () => {
    if (!window.__sfSwUpdateReady) return;
    safeAsync(runVersionUpdateWithSavePrompt(), 'swUpdateTap', t('versionUpdate.fail'));
  };
  el.addEventListener('click', run);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); }
  });
}

function bootGame() {
  if (window.__sfBooted) return;
  window.__sfBooted = true;
  initUiTapScrollGuard();
  try {
    const hadCorruptPrimary = saveStorageDiagnostics().primaryCorrupt;
    const beforeSave = Object.assign({}, save);
    save = sanitizeSave(save || Object.assign({}, DEFAULT_SAVE));
    const repairNotes = saveSanitizeNotes(beforeSave, save);
    persist();
    if (repairNotes.length && !hadCorruptPrimary && !window.__sfRecoveredBackup) {
      userToast('Save gerepareerd: ' + repairNotes.slice(0, 2).join(' · '), 4200);
    }
    if (hadCorruptPrimary && !window.__sfRecoveredBackup) {
      userToast('Corrupte hoofd-save overschreven — export blijft je vangnet bij URL-wissel', 4500);
    }
  } catch (err) {
    console.error('[Stickman] save sanitize', err);
    save = Object.assign({}, DEFAULT_SAVE);
    try { persist(); } catch (_) {}
    userToast('Save kon niet geladen worden — nieuwe voortgang gestart (export backup als je die had)', 4800);
  }
  safeCall(() => dismissTunnelOverlayIfStatic(), 'overlay');
  safeCall(() => { if (typeof window.sfTunnelNukeOverlay === 'function') window.sfTunnelNukeOverlay(); }, 'nuke');
  safeCall(syncPlayLayer, 'syncPlay');
  safeCall(resize, 'resize');
  safeCall(() => initLang(), 'i18n');
  safeCall(() => UI.renderMenu(), 'menu');
  safeCall(ensureDaily, 'daily');
  safeCall(checkAchievements, 'ach');
  safeCall(updateNetStatus, 'net');
  safeCall(wireNetStatusTap, 'netTap');
  safeCall(() => UI.syncTouchClass(), 'touch');
  safeCall(maybeWelcomeToast, 'welcome');
  safeCall(maybeOfferVersionUpdateSave, 'versionRestore');
  if (!window.__sfGlobalErr) {
    window.__sfGlobalErr = true;
    window.addEventListener('error', (ev) => {
      if (window.__sfLoopErr) return;
      const err = ev.error || new Error(ev.message || 'unknown');
      sfReportError('window', err);
      if (state === 'play' || state === 'pause' || state === 'result') {
        try { recoverToMenu(); } catch (_) {}
      }
    });
    window.addEventListener('unhandledrejection', (ev) => {
      if (window.__sfLoopErr) return;
      const r = ev.reason;
      const err = r instanceof Error ? r : new Error(String(r != null ? r : 'async reject'));
      sfReportError('async', err, 'Actie mislukt — probeer opnieuw');
      if (state === 'play' || state === 'pause' || state === 'result') {
        try { recoverToMenu(); } catch (_) {}
      }
    });
  }
  try {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMq = () => refreshA11yUi();
    if (mq.addEventListener) mq.addEventListener('change', onMq);
    else if (mq.addListener) mq.addListener(onMq);
    const mqC = window.matchMedia('(prefers-contrast: more)');
    if (mqC.addEventListener) mqC.addEventListener('change', onMq);
    else if (mqC.addListener) mqC.addListener(onMq);
  } catch (_) {}
  if (window.__sfRecoveredBackup) {
    window.__sfRecoveredBackup = false;
    safeCall(() => UI.toast('Save hersteld uit backup — je voortgang is veilig', 4200), 'toast');
  }
  AudioSys.desiredSong = 'menu';
  safeCall(() => { if (typeof AudioSys.applyVolumes === 'function') AudioSys.applyVolumes(); }, 'vol');
  safeCall(() => {
    AudioSys.init();
    setTimeout(() => { try { AudioSys.sting('title'); } catch (_) {} }, 520);
  }, 'titleSting');
  requestAnimationFrame(loop);
  if (state === 'menu') safeCall(() => UI.show('menuScreen'), 'showMenu');
  setTimeout(() => {
    try {
      const hub = document.querySelector('[data-hub]');
      if (hub && !hub.dataset.sfPressBound) {
        userToast('Oude cache — menu reageert niet. Tik «Verse versie» in de dock.', 6500);
        document.getElementById('btnVerseVersie')?.classList.add('sw-update');
      }
    } catch (_) {}
  }, 900);
  if (!window.__sfTipTimer) {
    window.__sfTipTimer = setInterval(() => {
      if (state !== 'menu') return;
      if (!Perf.menuLandingVisible()) return;
      safeCall(() => UI.renderMenu(), 'menuTick');
    }, 12000);
  }
  window.__sf = {
    get game() { return game; },
    get version() { return APP_VERSION; },
    startGame, save, Game, UI, recoverToMenu, syncPlayLayer,
  };

  (function handleLaunchShortcut() {
    try {
      const mode = new URLSearchParams(location.search).get('mode');
      if (!mode) return;
      AudioSys.init();
      setTimeout(() => {
        try {
          if (mode === 'adventure') {
            UI.renderLevels();
            UI.show('levelScreen');
          } else if (mode === 'training') startGame('training');
          else if (mode === 'versus') {
            UI.charPickStep = 1;
            UI.renderCharSelect();
            UI.show('charSelectScreen');
          } else if (mode === 'wall') startGame('wall');
          else if (mode === 'coinrun') startGame('coinrun');
        } catch (err) {
          sfReportError('shortcut/' + mode, err);
          recoverToMenu();
        }
      }, 120);
    } catch (_) {}
  })();
}

const tunnelReady = window.sfTunnelBoot || Promise.resolve();
tunnelReady.then(bootGame).catch(() => { try { bootGame(); } catch (_) {} });
window.addEventListener('sf:tunnel-ready', bootGame);

function reportAppError(label) {
  if (window.__sfReportedErr) return;
  window.__sfReportedErr = true;
  console.error(label);
  try {
    if (typeof UI !== 'undefined' && UI.toast) UI.toast('Er ging iets mis — opgeslagen voortgang is veilig', 4000);
  } catch (_) {}
}
window.addEventListener('error', (e) => {
  if (window.__sfGlobalErr) return;
  reportAppError(e.message || 'error');
});
window.addEventListener('unhandledrejection', (e) => {
  if (window.__sfGlobalErr) return;
  reportAppError(String(e.reason || 'promise'));
});

/** Houd canvas/menu-laag schoon op iPad (geen synthetische clicks — bindPress doet touch). */
function bindUiLayerWatch() {
  const tick = () => {
    try {
      syncPlayLayer();
      ensureMenuScreenActive();
      if (typeof window.sfTunnelNukeOverlay === 'function') window.sfTunnelNukeOverlay();
    } catch (_) {}
  };
  document.addEventListener('touchstart', tick, { passive: true, capture: true });
  document.addEventListener('pointerdown', tick, { passive: true, capture: true });
  setInterval(tick, 8000);
}
bindUiLayerWatch();
