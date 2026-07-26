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

let _menuVistaBufA = null;
let _menuVistaBufB = null;

function ensureMenuVistaBuf(w, h) {
  if (!_menuVistaBufA || _menuVistaBufA.width !== w || _menuVistaBufA.height !== h) {
    _menuVistaBufA = document.createElement('canvas');
    _menuVistaBufA.width = w;
    _menuVistaBufA.height = h;
    _menuVistaBufB = document.createElement('canvas');
    _menuVistaBufB.width = w;
    _menuVistaBufB.height = h;
  }
  return { a: _menuVistaBufA, b: _menuVistaBufB };
}

function paintMenuHeroCanvas(t) {
  if (typeof document !== 'undefined' && document.body && document.body.classList.contains('is-playing')) return;
  if (typeof Perf !== 'undefined' && Perf.menuLandingVisible && !Perf.menuLandingVisible()) return;
  const cv = document.getElementById('menuHeroCanvas');
  if (!cv) return;
  const menu = document.getElementById('menuScreen');
  if (menu && !menu.classList.contains('active')) return;
  const c = cv.getContext('2d');
  if (!c) return;
  const lite = save.liteFx || Perf.tier >= 1;
  if (cv.width !== 640 || cv.height !== 280) {
    cv.width = 640;
    cv.height = 280;
  }
  const Ws = cv.width;
  const Hs = cv.height;
  c.clearRect(0, 0, Ws, Hs);

  // Foto-album: kruispunt (4 paden) → eik → steenhuis → open weg
  const VISTAS = [];
  if (typeof drawMenuCrossroadsVista === 'function') VISTAS.push(drawMenuCrossroadsVista);
  if (typeof drawMenuSemi25dVista === 'function') VISTAS.push(drawMenuSemi25dVista);
  if (typeof drawMenuStonehouseVista === 'function') VISTAS.push(drawMenuStonehouseVista);
  if (typeof drawMenuOpenRoadVista === 'function') VISTAS.push(drawMenuOpenRoadVista);
  const N = VISTAS.length;
  const SLOT = motionReduced() ? 12 : 8;
  const FADE = motionReduced() ? 0.01 : 1.35;
  let aFrom = 1;
  let aTo = 0;
  let fromIdx = 0;
  let toIdx = 0;
  if (N > 1) {
    const cycle = SLOT * N;
    const u = ((t % cycle) + cycle) % cycle;
    fromIdx = Math.floor(u / SLOT) % N;
    toIdx = (fromIdx + 1) % N;
    const inSlot = u % SLOT;
    if (inSlot > SLOT - FADE) {
      const f = (inSlot - (SLOT - FADE)) / FADE;
      aFrom = 1 - f;
      aTo = f;
    } else {
      aFrom = 1;
      aTo = 0;
      toIdx = fromIdx;
    }
  }

  let map = { roadY: Hs * 0.82 };
  const drawOne = (fn, ctx) => fn(ctx, Ws, Hs, t, { lite, caption: true }) || map;

  if (N >= 2 && aTo > 0.02 && fromIdx !== toIdx) {
    const buf = ensureMenuVistaBuf(Ws, Hs);
    const ca = buf.a.getContext('2d');
    const cb = buf.b.getContext('2d');
    ca.clearRect(0, 0, Ws, Hs);
    cb.clearRect(0, 0, Ws, Hs);
    const mA = drawOne(VISTAS[fromIdx], ca);
    const mB = drawOne(VISTAS[toIdx], cb);
    c.globalAlpha = aFrom;
    c.drawImage(buf.a, 0, 0);
    c.globalAlpha = aTo;
    c.drawImage(buf.b, 0, 0);
    c.globalAlpha = 1;
    map = aTo > aFrom ? mB : mA;
  } else if (N >= 1) {
    map = drawOne(VISTAS[fromIdx], c);
  } else if (typeof drawLandwegPixelmap === 'function') {
    map = drawLandwegPixelmap(c, Ws, Hs, t, { lite, caption: true, groundY: Hs * 0.58 }) || map;
    map.roadY = (map.groundY || Hs * 0.58) + 8;
  } else {
    const sky = c.createLinearGradient(0, 0, 0, Hs);
    sky.addColorStop(0, '#4ea6e8');
    sky.addColorStop(1, '#c5e0f5');
    c.fillStyle = sky;
    c.fillRect(0, 0, Ws, Hs);
    drawMenuHeroPixelGround(c, Ws, Hs, Hs * 0.62, t);
  }

  // d20 #8 — unifying pixel grondstrip under vistas
  if (typeof drawMenuPixelGroundStrip === 'function') {
    drawMenuPixelGroundStrip(c, Ws, Hs, t);
  }
  const footY = Hs - Math.max(18, Math.round(Hs * 0.09)) + 2;
  const walk = motionReduced() ? 0 : Math.sin(t * 3.2) * 2;
  const stroll = motionReduced() ? 0 : Math.sin(t * 0.55) * (Ws * 0.03);
  const drawTourist = (x, face, col, scale) => {
    const sc = scale || 1;
    c.save();
    c.translate(x + stroll * face, footY + walk * (face > 0 ? 1 : 0.5) - 2);
    c.scale(face * sc, sc);
    c.strokeStyle = col;
    c.lineWidth = 3.5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, -32);
    c.stroke();
    const leg = motionReduced() ? 0 : Math.sin(t * 5 + face) * 6;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(-5, 8 + leg * 0.3);
    c.moveTo(0, 0);
    c.lineTo(5, 8 - leg * 0.3);
    c.stroke();
    c.fillStyle = col;
    c.beginPath();
    c.arc(0, -40, 8, 0, TAU);
    c.fill();
    c.fillStyle = '#b8a878';
    c.beginPath();
    c.arc(11, -24, 4, 0, TAU);
    c.fill();
    c.restore();
  };
  // Muted stickmen — less neon
  drawTourist(Ws * 0.24, 1, '#d0d4da', 0.85);
  drawTourist(Ws * 0.40, -1, '#c09098', 1);
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
        // NOOIT recoverToMenu tijdens live fight (Kets/charge crashte → startscherm)
        try { sfReportError('update', updateErr, 'Hiccup in gevecht — speel door'); } catch (_) {}
        try {
          if (game) {
            game.inputLocked = !!game.over;
            game.ketsbamChargeT = 0;
            game.ketsbamShow = false;
            game.ketsbamBuildT = 0;
            game.ketsbamBuildProg = 0;
          }
        } catch (_) {}
        try { if (typeof Input !== 'undefined') Input.dualMode = false; } catch (_) {}
        return;
      }
      // Mid-fight: herstel wees-pause / verborgen canvas (training rabbit e.d.)
      if (typeof playLayerBroken === 'function' && playLayerBroken()) {
        try { forcePlayCanvasVisible('loop'); } catch (_) {}
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
    // NOOIT menu-blauw (#151b33) tekenen tijdens play/pause — dat IS het "blauwe scherm"
    if (state === 'play') {
      if (game && typeof game.draw === 'function' && !Perf.skipHeavyDraw()) {
        try {
          game.draw(ctx);
        } catch (drawErr) {
          try { sfReportError('draw', drawErr, 'Tekenen hiccup — speel door'); } catch (_) {}
          return;
        }
      } else if (!game) {
        try { ctx.fillStyle = '#0a0d18'; ctx.fillRect(0, 0, W, H); } catch (_) {}
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
    try { sfReportError('loop', err); } catch (_) {}
    // Alleen naar menu als er geen live game meer is
    if (!(state === 'play' && game) && !(state === 'pause' && game)) {
      try { recoverToMenu(); } catch (_) {}
    }
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    try { cancelGambleStart(); } catch (_) {}
    if (state === 'play' && game && !game.over) {
      try { Input.releaseAll(); } catch (_) {}
      state = 'pause';
      AudioSys.setPaused(true);
      try {
        UI.show('pauseScreen');
      } catch (_) { ensureVisibleScreen(); }
    } else {
      try { AudioSys.syncContextPower(); } catch (_) {}
    }
  } else {
    try { AudioSys.syncContextPower(); } catch (_) {}
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
    try { cancelGambleStart(); } catch (_) {}
    try { Input.releaseAll(); } catch (_) {}
    if (state === 'play' && game && !game.over) {
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

/** d20 #20 — pixel splash / laadscherm strip (boot). */
function dismissSplashOverlay() {
  const root = document.getElementById('sfSplash');
  if (!root || root.classList.contains('is-done')) return;
  root.classList.add('is-done');
  root.setAttribute('aria-busy', 'false');
  const calm = typeof motionReduced === 'function' && motionReduced();
  setTimeout(() => {
    try { root.remove(); } catch (_) {
      try { root.style.display = 'none'; } catch (__) {}
    }
  }, calm ? 0 : 380);
}

function paintSplashTargets(t, progress) {
  if (typeof paintSplashStripCanvas !== 'function') return;
  const main = document.getElementById('sfSplashCanvas');
  if (main) paintSplashStripCanvas(main, t, { progress });
  const tunnel = document.getElementById('tunnelBootStrip');
  const ov = document.getElementById('tunnelBootOverlay');
  if (tunnel && ov && !ov.hidden) {
    paintSplashStripCanvas(tunnel, t, { progress, compact: true });
  }
}

function runSplashIntro() {
  if (window.__sfSplashRan) return;
  window.__sfSplashRan = true;
  const root = document.getElementById('sfSplash');
  if (!root) return;
  const fill = document.getElementById('sfSplashFill');
  const bar = document.getElementById('sfSplashBar');
  const sub = document.getElementById('sfSplashSub');
  const calm = typeof motionReduced === 'function' && motionReduced();
  const dur = calm ? 220 : 1050;
  const t0 = performance.now();
  let finished = false;
  const labels = ['Laden…', 'Pixelmap…', 'Arena…', 'Klaar'];

  // First paint immediately so the canvas isn’t blank while CSS shows
  try { paintSplashTargets(0, 0); } catch (_) {}

  const finish = () => {
    if (finished) return;
    finished = true;
    if (fill) fill.style.width = '100%';
    if (bar) bar.setAttribute('aria-valuenow', '100');
    if (sub) sub.textContent = 'Klaar';
    try { paintSplashTargets(dur / 1000, 1); } catch (_) {}
    dismissSplashOverlay();
  };

  const tick = (now) => {
    if (finished) return;
    const u = Math.min(1, (now - t0) / dur);
    const ease = 1 - Math.pow(1 - u, 2.35);
    const pct = Math.round(ease * 100);
    if (fill) fill.style.width = pct + '%';
    if (bar) bar.setAttribute('aria-valuenow', String(pct));
    if (sub) {
      sub.textContent = labels[Math.min(labels.length - 1, Math.floor(u * labels.length))];
    }
    try { paintSplashTargets((now - t0) / 1000, ease); } catch (_) {}
    if (u < 1) requestAnimationFrame(tick);
    else finish();
  };
  requestAnimationFrame(tick);
  // Hard failsafe — never leave splash blocking the menu
  setTimeout(finish, dur + 900);
}

function bootGame() {
  if (window.__sfBooted) return;
  // Stale PWA: nieuwe menu-HTML + oude game.js (classic “UI werkt, avontuur blauw”).
  try {
    const expect = window.__SF_EXPECT_REV;
    if (expect != null && Number(SW_CACHE_REV) !== Number(expect)) {
      if (typeof window.__sfNukeStale === 'function') window.__sfNukeStale('boot-rev');
      else if (typeof window.forceFreshVersion === 'function') window.forceFreshVersion();
      return;
    }
    if (typeof KETSBAM_BUILD_DUR === 'undefined') {
      if (typeof window.__sfNukeStale === 'function') window.__sfNukeStale('boot-kets');
      else if (typeof window.forceFreshVersion === 'function') window.forceFreshVersion();
      return;
    }
  } catch (_) {}
  window.__sfBooted = true;
  safeCall(runSplashIntro, 'splash');
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
    if (applySaveFromBackupRaw()) {
      window.__sfRecoveredBackup = true;
      userToast('Save hersteld uit backup na laadfout', 4800);
    } else {
      save = Object.assign({}, DEFAULT_SAVE);
      try { persistPrimaryOnly(); } catch (_) {}
      userToast('Save kon niet geladen worden — nieuwe voortgang gestart (export backup als je die had)', 4800);
    }
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
      // NOOIT recoverToMenu tijdens play/pause — dat was de adventure
      // 1-tap→menu crash (ReferenceError in Input.onDown → startscherm).
      // Toast alleen; fight blijft staan. Result zonder game mag wel herstellen.
      if (state === 'play' || state === 'pause') return;
      if (state === 'result' && !game) {
        try { recoverToMenu(); } catch (_) {}
      }
    });
    window.addEventListener('unhandledrejection', (ev) => {
      if (window.__sfLoopErr) return;
      const r = ev.reason;
      const err = r instanceof Error ? r : new Error(String(r != null ? r : 'async reject'));
      sfReportError('async', err, 'Actie mislukt — probeer opnieuw');
      if (state === 'play' || state === 'pause') return;
      if (state === 'result' && !game) {
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
  safeCall(() => blackScreenGuard('boot'), 'blackGuard');
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
    get state() { return state; },
    get swRev() { return SW_CACHE_REV; },
    startGame, save, Game, UI, recoverToMenu, syncPlayLayer,
    debug: typeof sfDebugScreen === 'function' ? sfDebugScreen : null,
    fixPlayLayer: () => (typeof sfDebugScreen === 'function' ? sfDebugScreen({ fix: true }) : null),
    goMenu: () => recoverToMenu({ force: true }),
    forcePlay: () => (typeof forcePlayCanvasVisible === 'function' ? forcePlayCanvasVisible('__sf') : null),
  };
  // install.js mag hierop pas herladen: nooit tijdens gevecht, level-keuze of dobbelworp.
  window.__sfSafeToReload = () => {
    try {
      if (state !== 'menu' || game) return false;
      if (typeof gamblePending === 'function' && gamblePending()) return false;
      if (document.body.classList.contains('is-playing')) return false;
      const active = document.querySelector('.screen.active');
      if (active && active.id !== 'menuScreen') return false;
      const menu = document.getElementById('menuScreen');
      return !!(menu && menu.classList.contains('active'));
    } catch (_) {
      return false;
    }
  };
  safeCall(wireSfDebugTools, 'sfDebug');
  safeCall(hardenButtonIcons, 'buttonIcons');

  (function handleLaunchShortcut() {
    try {
      const mode = new URLSearchParams(location.search).get('mode');
      if (!mode) return;
      AudioSys.init();
      setTimeout(() => {
        try {
          if (mode === 'adventure') {
            UI.safeOpen('levelScreen', () => UI.renderLevels());
          } else if (mode === 'training') startGame('training');
          else if (mode === 'versus') {
            UI.charPickStep = 1;
            UI.safeOpen('charSelectScreen', () => UI.renderCharSelect());
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

// d20 #20 — start splash as soon as game.js is live (don’t wait on tunnel)
safeCall(runSplashIntro, 'splashEarly');

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
      // Tijdens dobbel → geen sync/guard die flash of timer weggooit
      if (typeof gamblePending === 'function' && gamblePending()) return;
      if (state === 'play' && game) {
        if (typeof playLayerBroken === 'function' && playLayerBroken()) {
          forcePlayCanvasVisible('uiWatch');
        } else {
          syncPlayLayer();
        }
        blackScreenGuard('uiWatch');
      } else {
        syncPlayLayer();
        blackScreenGuard('uiWatch');
      }
      if (typeof window.sfTunnelNukeOverlay === 'function') window.sfTunnelNukeOverlay();
    } catch (_) {}
  };
  document.addEventListener('touchstart', tick, { passive: true, capture: true });
  document.addEventListener('pointerdown', tick, { passive: true, capture: true });
  setInterval(tick, 1200);
}
bindUiLayerWatch();
