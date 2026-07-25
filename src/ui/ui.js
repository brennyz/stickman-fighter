/* ================================= UI ================================== */
function pickVsRosterId(id) {
  try {
    const r = vsRosterEntry(id);
    if (!vsUnlocked(r)) return;
    AudioSys.sfx('select');
    UI.charPreviewHoverId = null;
    if (UI.charPickStep === 1) {
      vsSelect.p1 = id;
      UI.charPickStep = 2;
    } else {
      vsSelect.p2 = id;
    }
    UI.renderCharSelect();
  } catch (err) {
    sfReportError('charPick', err, 'Vechter kiezen mislukt — tik opnieuw');
  }
}

function initCharSelectChrome() {
  if (window.__sfCharChrome) return;
  window.__sfCharChrome = true;
  UI.charSagaFilter = 'all';
  const grid = document.getElementById('charGrid');
  const runPick = (card) => {
    if (!card || card.classList.contains('locked') || !card.dataset.id) return;
    pickVsRosterId(card.dataset.id);
  };
  if (grid) {
    let lastCharPick = 0;
    grid.addEventListener('click', (e) => { runPick(e.target.closest('.char-card')); });
    grid.addEventListener('touchend', (e) => {
      const card = touchEndedOnSelector(e, '.char-card');
      if (!card || card.classList.contains('locked')) return;
      const now = Date.now();
      if (now - lastCharPick < 320) return;
      lastCharPick = now;
      if (e.cancelable) e.preventDefault();
      runPick(card);
    }, { passive: false });
    grid.addEventListener('pointerover', (e) => {
      const card = e.target.closest('.char-card');
      if (!card || !card.dataset.id) return;
      if (UI.charPreviewHoverId === card.dataset.id) return;
      UI.charPreviewHoverId = card.dataset.id;
      grid.querySelectorAll('.char-card.preview-hov').forEach(c => c.classList.remove('preview-hov'));
      if (!card.classList.contains('locked')) card.classList.add('preview-hov');
      else card.classList.add('preview-hov');
      updateCharStatPreview();
    });
    grid.addEventListener('pointerdown', (e) => {
      const card = e.target.closest('.char-card');
      if (!card || !card.dataset.id) return;
      UI.charPreviewHoverId = card.dataset.id;
      grid.querySelectorAll('.char-card.preview-hov').forEach(c => c.classList.remove('preview-hov'));
      card.classList.add('preview-hov');
      updateCharStatPreview();
    });
    grid.addEventListener('pointerleave', (e) => {
      if (e.relatedTarget && grid.contains(e.relatedTarget)) return;
      UI.charPreviewHoverId = null;
      grid.querySelectorAll('.char-card.preview-hov').forEach(c => c.classList.remove('preview-hov'));
      updateCharStatPreview();
    });
  }
  const sagaBar = document.getElementById('charSagaBar');
  if (sagaBar && !sagaBar.dataset.sfSagaBound) {
    sagaBar.dataset.sfSagaBound = '1';
    sagaBar.querySelectorAll('[data-saga]').forEach((btn) => {
      bindPress(btn, () => {
        AudioSys.sfx('select');
        UI.charSagaFilter = btn.dataset.saga || 'all';
        UI.renderCharSelect();
      });
    });
  }
  const sortBtn = document.getElementById('btnCharSort');
  if (sortBtn && !sortBtn.dataset.sfSortBound) {
    sortBtn.dataset.sfSortBound = '1';
    const sortLabels = {
      name: 'naam', tot: 'TOT', str: 'STR', rng: 'RNG', meleeDps: 'mDPS', rangeDps: 'rDPS',
      hp: 'HP', spd: 'SPD', dmg: 'DMG',
    };
    const cycleSort = () => {
      const order = ['name', 'tot', 'str', 'rng', 'meleeDps', 'rangeDps', 'hp', 'spd', 'dmg'];
      const i = order.indexOf(UI.charSortMode || 'name');
      UI.charSortMode = order[(i + 1) % order.length];
      sortBtn.textContent = 'Sort: ' + (sortLabels[UI.charSortMode] || 'naam');
      UI.renderCharSelect();
    };
    bindPress(sortBtn, () => { AudioSys.sfx('select'); cycleSort(); });
    sortBtn.textContent = 'Sort: ' + (sortLabels[UI.charSortMode || 'name'] || 'naam');
  }
  const fightBtn = document.getElementById('btnCharFight');
  bindPress(fightBtn, () => {
    if (!vsSelect.p1 || !vsSelect.p2) return;
    AudioSys.sfx('bell');
    startGame('versus', { p1: vsSelect.p1, p2: vsSelect.p2 });
  });
  const iconRow = document.getElementById('charIconRow');
  if (iconRow && !iconRow.dataset.sfIconBound) {
    iconRow.dataset.sfIconBound = '1';
    let lastIconPick = 0;
    iconRow.addEventListener('click', (e) => {
      const chip = e.target.closest('.char-icon-chip:not(.locked)');
      if (!chip || !chip.dataset.id) return;
      pickVsRosterId(chip.dataset.id);
    });
    iconRow.addEventListener('touchend', (e) => {
      const chip = touchEndedOnSelector(e, '.char-icon-chip');
      if (!chip || chip.classList.contains('locked') || !chip.dataset.id) return;
      const now = Date.now();
      if (now - lastIconPick < 320) return;
      lastIconPick = now;
      if (e.cancelable) e.preventDefault();
      pickVsRosterId(chip.dataset.id);
    }, { passive: false });
  }
  const clashBtn = document.getElementById('btnCharSagaClash');
  bindPress(clashBtn, () => {
    AudioSys.sfx('select');
    const duo = pickSagaIconClash();
    if (!duo) {
      try { UI.toast(t('toast.charSagaUnlock'), 2800); } catch (_) {}
      return;
    }
    vsSelect.p1 = duo.a.id;
    vsSelect.p2 = duo.b.id;
    UI.charPickStep = 2;
    UI.renderCharSelect();
    UI.toast(t('toast.charSagaClash', { a: duo.a.name, b: duo.b.name }), 2600);
  });
}

/** Prestatie-iconen als inline SVG (art-upgrade 4/4) — vervangt emoji. */
const ACH_ICON_SVG = {
  first_win: '<path d="M7 4h10v5a5 5 0 01-10 0z"/><path d="M7 5H4c0 3 1.5 5 3 5M17 5h3c0 3-1.5 5-3 5"/><path d="M12 14v3M8 20h8M10 17h4v3h-4z"/>',
  lv10: '<path d="M12 20V5"/><path d="M6 11l6-6 6 6"/>',
  dex10: '<path d="M12 6c-2-1.5-4.5-2-8-2v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2V4c-3.5 0-6 .5-8 2z"/><path d="M12 6v14"/>',
  dexFull: '<path d="M5 4h11v16H5z"/><path d="M16 6h3v14h-3"/><path d="M8 8h5M8 12h5"/>',
  dex100: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
  dexHalf: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5l-1.6 4-4 1.6 1.6-4z" fill="currentColor"/>',
  dexTiers: '<path d="M12 3l6 5-6 13L6 8z"/><path d="M6 8h12M9 8l3 13M15 8l-3 13"/>',
  dexMythic: '<path d="M12 3l1.8 5.4L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.6z" fill="currentColor"/>',
  train5: '<rect x="6" y="8" width="12" height="10" rx="2"/><path d="M9 8V5.5M15 8V5.5"/><circle cx="9.5" cy="12.5" r="1.2" fill="currentColor"/><circle cx="14.5" cy="12.5" r="1.2" fill="currentColor"/>',
  wall100: '<path d="M4 6h16M4 11h16M4 16h16M4 6v14h16V6M9 6v5M15 11v5M9 16v4"/>',
  combo8: '<path d="M13 3L6 13h5l-2 8 7-10h-5z" fill="currentColor" stroke="none"/>',
  lv50: '<path d="M4 17l1.5-9L9 12l3-6 3 6 3.5-4L20 17z"/><path d="M5 20h14"/>',
  daily7: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M4 10h16M8 4v4M16 4v4"/><path d="M9 15l2 2 4-4"/>',
  vs5: '<circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/>',
  vs_roster: '<circle cx="9" cy="9" r="4"/><rect x="12" y="12" width="8" height="8" rx="2"/>',
  saga_icons: '<path d="M12 3l2 6h6l-5 4 2 6-5-3.6L7 19l2-6-5-4h6z" fill="currentColor" stroke="none"/>',
};
function achIconSvg(id) {
  const body = ACH_ICON_SVG[id] || ACH_ICON_SVG.first_win;
  return '<svg viewBox="0 0 24 24" style="width:1.2em;height:1.2em;vertical-align:-0.24em;margin-right:2px" ' +
    'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
}

/** Mini SVG-vinkje (art-upgrade 4/4) — vervangt ✔-glyphs in lijsten. */
const SVG_CHECK_MINI =
  '<svg viewBox="0 0 24 24" style="width:1em;height:1em;vertical-align:-0.14em" fill="none" ' +
  'stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13l5 5L20 7"/></svg>';

/** Inline SVG-slotje (art-upgrade 2/4) — vervangt 🔒 in level/wapen-lijsten. */
const SVG_LOCK_ICON =
  '<svg viewBox="0 0 24 24" style="width:1.15em;height:1.15em;vertical-align:-0.2em" fill="none" stroke="currentColor" stroke-width="2">' +
  '<rect x="6" y="11" width="12" height="9" rx="2" fill="rgba(0,0,0,.3)"/><path d="M9 11V8a3 3 0 016 0v3"/></svg>';

const MODE_HUB_META = {
  arcade: { badge: 'SOLO', badgeClass: 'badge-solo', title: 'Arcade', sub: 'Snelle sessies · high scores · geen voortgang verlies' },
  collect: { badge: 'COLLECTIE', badgeClass: 'badge-meta', title: 'Verzameling', sub: 'Wapens · dex & ei-pets · stijlen · monsterboek' },
};

function hubForPlayMode(mode) {
  if (mode === 'adventure') return 'adventure';
  if (mode === 'versus') return 'versus';
  if (mode === 'training' || mode === 'wall' || mode === 'coinrun') return 'arcade';
  return null;
}

function hubTileStatLine(hub) {
  switch (hub) {
    case 'adventure': {
      const cur = currentAdvIsland();
      const prog = islandProgress(cur);
      return t('island.progress', {
        cur, name: islandLabel(cur, 'name'), cleared: prog.cleared, total: prog.total,
        unlocked: save.unlocked, max: MAX_LEVEL,
      });
    }
    case 'arcade': {
      const bits = [];
      if (save.trainWins > 0) bits.push(`${save.trainWins} train`);
      if (save.bestWall > 0) bits.push(`muur ${save.bestWall}`);
      const mats = save.stats?.matsCoinBest || 0;
      if (mats > 0) bits.push(`mats ${mats}`);
      const pc = petCoinsBalance();
      if (pc > 0) bits.push(`${pc} pet 🪙`);
      return bits.length ? bits.join(' · ') : t('hub.modes3');
    }
    case 'versus': {
      const w = save.stats?.vsWins || 0;
      const m = save.stats?.vsMatches || 0;
      return m > 0 ? t('hub.vsRecord', { w, m }) : t('hub.fightersLocal');
    }
    case 'collect':
      return `${weaponUnlockedCount()}/${WEAPONS.length} wap · dex ${petTamedCount()} · ${petCoinsBalance()} pet 🪙`;
    default:
      return '';
  }
}

function audioMixStatusLine(inPause) {
  const mPct = volPct(save.musicVol, 0.85);
  const sPct = volPct(save.sfxVol, 1);
  const bits = [];
  if (!save.music) bits.push(t('audio.musicOff'));
  else bits.push(t('audio.musicPct', { pct: mPct }) + (inPause ? ' · BGM ~75%' : ''));
  if (!save.sfx) bits.push(t('audio.sfxOff'));
  else bits.push(t('audio.sfxPct', { pct: sPct }));
  return bits.join(' · ');
}

const UI = {
  screens: ['menuScreen', 'modeHubScreen', 'levelScreen', 'gambleScreen', 'weaponScreen', 'petScreen', 'styleScreen', 'settingsScreen', 'missionsScreen', 'charSelectScreen', 'dexScreen', 'helpScreen', 'installScreen', 'resultScreen', 'pauseScreen'],
  modeHubId: 'arcade',
  charPickStep: 1,
  charSagaFilter: 'all',
  charSortMode: 'name',
  charPreviewHoverId: null,
  dexRarityFilter: 'all',
  achFilter: 'all',
  petTab: 'dex',
  advIslandPick: 0,
  lastResult: null,
  pauseSubDefault: 'Rasengan klaar — moto! · voortgang blijft op dit apparaat',

  activeScreen() {
    return this.screens.find(sid => document.getElementById(sid)?.classList.contains('active')) || null;
  },

  BACK_LABELS: {},

  syncBackLabels() {
    const active = this.activeScreen();
    if (!active || active === 'charSelectScreen') return;
    const el = document.getElementById(active);
    if (!el) return;
    const back = el.querySelector('.back-btn[data-back], .back-btn[data-back-gamble], #installBack');
    if (!back) return;
    const label = this.BACK_LABELS[active];
    if (label) back.textContent = label;
  },

  resetInnerScrolls(screenEl) {
    if (!screenEl) return;
    const scrollables = screenEl.querySelectorAll(
      '.char-grid-scroll, .menu-landing-scroll, .mode-hub-body, .island-bar, .grid, #weaponList, [data-scroll-reset]'
    );
    scrollables.forEach((el) => {
      try {
        el.scrollTop = 0;
        el.scrollLeft = 0;
      } catch (_) {}
    });
  },

  refreshPauseSubtitle() {
    const sub = document.querySelector('#pauseScreen .subtitle');
    const vsRestart = document.getElementById('pauseVsRestart');
    if (vsRestart) {
      vsRestart.style.display = (game?.mode === 'versus' && (state === 'play' || state === 'pause')) ? 'flex' : 'none';
    }
    if (!sub) return;
    if (game?.mode === 'versus' && game.p2) {
      const a = vsRosterEntry(game.p1Pick).name;
      const b = vsRosterEntry(game.p2Pick).name;
      let tag = '';
      if (game.roundsP1 === 1 && game.roundsP2 === 1) tag = ' · beslissende ronde';
      else if (game.roundsP1 === 1 || game.roundsP2 === 1) tag = ' · match point';
      sub.textContent = `2P ${game.roundsP1}-${game.roundsP2} · ronde ${game.round} · ${a} vs ${b}${tag}`;
    } else {
      sub.textContent = this.pauseSubDefault;
    }
  },

  show(id) {
    try {
      for (const s of this.screens) {
        const scr = document.getElementById(s);
        if (scr) scr.classList.remove('active');
      }
      if (id) {
        const el = document.getElementById(id);
        if (el) {
          el.classList.add('active');
          requestAnimationFrame(() => {
            try {
              el.scrollTop = 0;
              this.resetInnerScrolls(el);
              this.syncBackLabels();
            } catch (_) {}
          });
        }
        if (id === 'pauseScreen') {
          this.refreshPauseSubtitle();
          this.renderPauseToggles();
        }
        if (id === 'helpScreen') this.renderHelp();
        if (id === 'levelScreen') {
          if (!this.advIslandPick) this.advIslandPick = currentAdvIsland();
          applyIslandOnboarding();
        }
      } else if (game?.mode === 'versus') {
        this.refreshPauseSubtitle();
      }
      const pauseBtn = document.getElementById('pauseBtn');
      if (pauseBtn) pauseBtn.classList.toggle('show', !id && !!game && state !== 'result');
    } catch (err) {
      sfReportError('UI.show/' + (id || 'play'), err, 'Schermwissel mislukt — terug naar menu');
      try { this.goMenu(); } catch (_) {}
    }
    syncPlayLayer();
  },

  renderHelp() {
    const host = document.getElementById('helpModeChips');
    const islHost = document.getElementById('helpIslandBlock');
    if (islHost) {
      const cur = currentAdvIsland();
      const cap = adventureWeaponCap();
      const rows = ADVENTURE_ISLANDS.map((isl) => {
        const prog = islandProgress(isl.id);
        const ok = islandUnlocked(isl.id);
        const wCap = ISLAND_WEAPON_CAPS[isl.id - 1];
        const pct = Math.round(prog.cleared / prog.total * 100);
        return `<div class="help-island-row${cur === isl.id ? ' cur' : ''}${ok ? '' : ' locked'}">` +
          `<span class="help-island-ico" style="color:${isl.accent}">${isl.icon}</span>` +
          `<div class="help-island-body"><b>${islandLabel(isl.id, 'name')}</b> · ${islandLabel(isl.id, 'sub')}` +
          `<div class="help-island-sub">${ok
            ? t('ui.helpIslandProg', { cleared: prog.cleared, total: prog.total, stars: prog.stars, maxStars: prog.maxStars, cap: wCap })
            : t('ui.helpIslandLocked', { lv: isl.id * LEVELS_PER_ISLAND })}</div>` +
          `<div class="island-prog-track"><i style="width:${pct}%;background:${isl.accent}"></i></div></div></div>`;
      }).join('');
      islHost.innerHTML =
        `<div class="step-card help-island-card">` +
        `<b>${t('ui.helpIslandTitle')}</b> — ${t('ui.helpIslandIntro', { cap, cur })}` +
        `<div class="help-island-grid">${rows}</div>` +
        `<div style="margin-top:10px;opacity:.88;line-height:1.45">${t('ui.helpMasterBuff')}</div></div>`;
    }
    if (!host) return;
    const touch = IS_TOUCH ? t('ui.helpTouch') : t('ui.helpKeyboard');
    const prog = onboardingProgress();
    const next = nextUntriedMode();
    const modes = [
      { id: 'adventure', label: t('modes.adventure'), tip: t('ui.modeAdventure') },
      { id: 'training', label: t('modes.training'), tip: t('ui.modeTraining') },
      { id: 'wall', label: t('modes.wall'), tip: t('ui.modeWall') },
      { id: 'versus', label: t('modes.versus'), tip: t('ui.modeVersus') },
      { id: 'coinrun', label: t('modes.coinrun'), tip: t('ui.modeCoinrun') },
    ];
    let html = `<div style="font-size:12px;opacity:.85;margin-bottom:8px">${t('ui.helpOnboardHead', { seen: prog.seen, total: prog.total })}</div>`;
    if (next) {
      html += `<div class="step-card" style="margin:6px 0;padding:10px 12px;border-color:rgba(124,245,255,.45)">` +
        `<b>${t('ui.helpTryNext', { mode: next.label })}</b>` +
        `<div style="opacity:.88;margin-top:4px">${t('ui.helpTrySub')}</div></div>`;
    }
    html += modes.map((m) => {
      const seen = modeOnboardingSeen(m.id);
      const highlight = next && next.id === m.id ? ' border-color:rgba(124,245,255,.5)' : '';
      return `<div class="step-card" style="margin:6px 0;padding:10px 12px${highlight}">` +
        `<b>${m.label}</b>${seen ? ` <span style="color:#7cfc8a;font-size:11px">${t('ui.helpHintSeen')}</span>` : ` <span style="color:#ffd75e;font-size:11px">${t('ui.helpHintNot')}</span>`}` +
        `<div style="opacity:.88;margin-top:4px">${m.tip} · ${touch}</div></div>`;
    }).join('');
    host.innerHTML = html;
  },

  syncTouchClass() {
    document.body.classList.toggle('big-touch', save.bigTouch !== false);
    refreshA11yUi();
  },

  goBack() {
    try {
      AudioSys.sfx('select');
      const active = this.screens.find(sid => document.getElementById(sid)?.classList.contains('active'));
      if (active === 'charSelectScreen' && this.charPickStep === 2) {
        this.charPickStep = 1;
        this.renderCharSelect();
        requestAnimationFrame(() => {
          try {
            this.resetInnerScrolls(document.getElementById('charSelectScreen'));
            this.syncBackLabels();
          } catch (_) {}
        });
        return;
      }
      if (active === 'pauseScreen' && game) {
        state = 'play';
        AudioSys.setPaused(false);
        if (save.music && AudioSys.desiredSong) AudioSys.play(AudioSys.desiredSong);
        this.show(null);
        return;
      }
      if (active === 'gambleScreen') {
        this.show('levelScreen');
        return;
      }
      if (active === 'modeHubScreen') {
        this.show('menuScreen');
        return;
      }
      if (active === 'levelScreen') {
        this.show('menuScreen');
        return;
      }
      if (active === 'charSelectScreen') {
        this.show('menuScreen');
        return;
      }
      if (active === 'weaponScreen' || active === 'petScreen' || active === 'styleScreen' || active === 'dexScreen') {
        this.openModeHub('collect');
        return;
      }
      if (active === 'missionsScreen' || active === 'settingsScreen' || active === 'helpScreen' || active === 'installScreen') {
        this.show('menuScreen');
        return;
      }
      if (active === 'resultScreen') {
        this.goMenu();
        return;
      }
      this.goMenu();
    } catch (err) {
      sfReportError('goBack', err, 'Menu-navigatie mislukt — terug naar hoofdmenu');
      this.goMenu();
    }
  },

  toast(msg, ms) {
    const host = document.getElementById('toastHost');
    if (!host) return;
    if (this._toastHide) {
      clearTimeout(this._toastHide);
      this._toastHide = null;
    }
    if (typeof host.replaceChildren === 'function') host.replaceChildren();
    else host.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    host.appendChild(el);
    this._toastHide = setTimeout(() => {
      el.remove();
      this._toastHide = null;
    }, ms || 2800);
  },

  goMenu() {
    try {
      game = null;
      state = 'menu';
      window.__sfLoopErr = false;
      try { Input.releaseAll(); } catch (_) {}
      Input.dualMode = false;
      Input.layout(W, H);
      this.charPickStep = 1;
      this.syncTouchClass();
      this.renderMenu();
      this.show('menuScreen');
      requestAnimationFrame(() => {
        try { this.resetInnerScrolls(document.getElementById('menuScreen')); } catch (_) {}
      });
      AudioSys.setPaused(false);
      playMenuBgm(true);
      scheduleResize();
      if (window.StickInstall) window.StickInstall.refreshMenuButton();
    } catch (err) {
      sfReportError('goMenu', err, 'Kon menu niet openen — herlaad de pagina');
      game = null;
      state = 'menu';
      window.__sfLoopErr = false;
      syncPlayLayer();
    }
  },

  renderCharSelect() {
    initCharSelectChrome();
    this.charPickStep = this.charPickStep || 1;
    const filter = this.charSagaFilter || 'all';
    if (this.charPreviewHoverId) {
      const h = vsRosterEntry(this.charPreviewHoverId);
      if (!vsUnlocked(h) || (filter !== 'all' && (h.saga || 'scroll') !== filter)) {
        this.charPreviewHoverId = null;
      }
    }
    const sagaMeta = vsSagaMeta(filter);
    const stepEl = document.getElementById('charPickStep');
    const stepBadge = document.getElementById('charPickStepBadge');
    if (stepEl) {
      stepEl.textContent = this.charPickStep === 1 ? t('ui.charSub1') : t('ui.charSub2');
    }
    if (stepBadge) {
      stepBadge.textContent = this.charPickStep === 1 ? t('ui.charStep1') : t('ui.charStep2');
    }
    const blurbEl = document.getElementById('charSagaBlurb');
    if (blurbEl) blurbEl.textContent = filter === 'all'
      ? t('ui.charBlurbAll')
      : sagaMeta.blurb;
    const sagaBar = document.getElementById('charSagaBar');
    if (sagaBar) {
      sagaBar.querySelectorAll('[data-saga]').forEach((btn) => {
        const sid = btn.dataset.saga || 'all';
        btn.classList.toggle('active', sid === filter);
        const c = vsSagaUnlockedCounts(sid);
        let badge = btn.querySelector('.saga-count');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'saga-count';
          btn.appendChild(badge);
        }
        badge.textContent = ` (${c.unlocked}/${c.total})`;
      });
    }
    const grid = document.getElementById('charGrid');
    if (!grid) return;
    const p1Lbl = document.getElementById('charP1Label');
    const p2Lbl = document.getElementById('charP2Label');
    const e1 = vsRosterEntry(vsSelect.p1);
    const e2 = vsRosterEntry(vsSelect.p2);
    if (p1Lbl) {
      p1Lbl.textContent = 'P1: ' + e1.name;
      p1Lbl.classList.toggle('active', this.charPickStep === 1);
    }
    if (p2Lbl) {
      p2Lbl.textContent = 'P2: ' + e2.name;
      p2Lbl.classList.toggle('active', this.charPickStep === 2);
    }
    const statEl = document.getElementById('charStatPreview');
    if (statEl) updateCharStatPreview();
    this.renderCharIconRow();
    grid.innerHTML = '';
    const rosterBase = filter === 'all'
      ? VS_ROSTER
      : VS_ROSTER.filter(r => (r.saga || 'scroll') === filter);
    const roster = sortVsRoster(rosterBase, UI.charSortMode || 'name');
    if (!roster.length) {
      const empty = document.createElement('div');
      empty.className = 'char-grid-empty';
      empty.textContent = t('ui.charEmpty');
      grid.appendChild(empty);
    }
    for (const r of roster) {
      const ok = vsUnlocked(r);
      const el = document.createElement('div');
      const sel1 = vsSelect.p1 === r.id;
      const sel2 = vsSelect.p2 === r.id;
      const focus = ok && ((this.charPickStep === 1 && !sel1) || (this.charPickStep === 2 && !sel2));
      const isFeatured = VS_FEATURED_IDS.includes(r.id) || r.featured;
      el.className = 'char-card' + (ok ? '' : ' locked') + (isFeatured ? ' saga-icon featured' : '') + (sel1 ? ' p1sel' : '') + (sel2 ? ' p2sel' : '') +
        (focus ? ' pick-hint' : '') + (this.charPreviewHoverId === r.id ? ' preview-hov' : '');
      el.dataset.id = r.id;
      el.setAttribute('role', 'button');
      if (ok) el.setAttribute('aria-label', r.name + ', ' + rosterFlair(r));
      const cv = document.createElement('canvas');
      cv.width = 80; cv.height = 80;
      const cc = cv.getContext('2d');
      cc.translate(40, 62); cc.scale(0.95, 0.95);
      const prev = buildVsFighter(r, 0, 1);
      prev.draw(cc);
      el.appendChild(cv);
      const saga = vsSagaMeta(r.saga || 'scroll');
      const badge = document.createElement('div');
      badge.className = 'char-saga';
      badge.textContent = saga.label.replace('-saga', '');
      el.appendChild(badge);
      const cap = document.createElement('div');
      cap.className = 'char-name';
      cap.textContent = r.name;
      el.appendChild(cap);
      const tag = document.createElement('div');
      tag.className = 'char-tag';
      tag.textContent = ok ? r.tag : t('ui.charLocked');
      el.appendChild(tag);
      const flair = document.createElement('div');
      flair.className = 'char-flair';
      flair.textContent = ok ? rosterFlair(r) : vsUnlockHint(r);
      el.appendChild(flair);
      if (ok) {
        const mini = document.createElement('div');
        mini.className = 'char-mini-stat';
        const st = vsFighterStats(r);
        mini.textContent = `STR ${st.str} · RNG ${st.rng} · mDPS ${st.meleeDps} · rDPS ${st.rangeDps}`;
        el.appendChild(mini);
      }
      grid.appendChild(el);
    }
    requestAnimationFrame(() => {
      const hint = grid.querySelector('.char-card.pick-hint:not(.locked)');
      const pick = hint || grid.querySelector(
        this.charPickStep === 1 ? '.char-card.p1sel' : '.char-card.p2sel'
      );
      if (pick) pick.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    const fightBtn = document.getElementById('btnCharFight');
    if (fightBtn) fightBtn.disabled = !(vsSelect.p1 && vsSelect.p2);
    const backBtn = document.getElementById('charSelectBack');
    if (backBtn) {
      backBtn.textContent = this.charPickStep === 2 ? t('ui.charBackP1') : t('ui.charBackMenu');
    }
    const backP = document.getElementById('charPickBackP1');
    if (backP) {
      backP.style.display = this.charPickStep === 2 ? 'flex' : 'none';
      if (!backP.dataset.bound) {
        backP.dataset.bound = '1';
        bindPress(backP, () => {
          AudioSys.sfx('select');
          this.charPickStep = 1;
          this.renderCharSelect();
          requestAnimationFrame(() => {
            try { this.resetInnerScrolls(document.getElementById('charSelectScreen')); } catch (_) {}
          });
        });
      }
    }
    const bindPickPill = (id, step) => {
      const pill = document.getElementById(id);
      if (!pill || pill.dataset.bound) return;
      pill.dataset.bound = '1';
      bindPress(pill, () => {
        AudioSys.sfx('select');
        this.charPickStep = step;
        this.renderCharSelect();
      });
    };
    bindPickPill('charP1Label', 1);
    bindPickPill('charP2Label', 2);
    const swapBtn = document.getElementById('btnCharSwap');
    if (swapBtn && !swapBtn.dataset.bound) {
      swapBtn.dataset.bound = '1';
      bindPress(swapBtn, () => {
        AudioSys.sfx('select');
        const t = vsSelect.p1;
        vsSelect.p1 = vsSelect.p2;
        vsSelect.p2 = t;
        this.renderCharSelect();
        UI.toast(t('toast.charSwap'), 1800);
      });
    }
    const rnd = document.getElementById('btnCharRandom');
    if (rnd && !rnd.dataset.bound) {
      rnd.dataset.bound = '1';
      bindPress(rnd, () => {
        AudioSys.sfx('select');
        const pool = pickCharPoolFiltered();
        if (pool.length < 2) {
          UI.toast(t('toast.charNotEnough'), 2400);
          return;
        }
        const a = choice(pool);
        let b = choice(pool);
        for (let i = 0; i < 8 && b.id === a.id; i++) b = choice(pool);
        vsSelect.p1 = a.id;
        vsSelect.p2 = b.id;
        this.charPickStep = 2;
        this.charPreviewHoverId = null;
        this.renderCharSelect();
        const sa = vsFighterStats(a);
        const sb = vsFighterStats(b);
        UI.toast(t('toast.charRandom', {
          a: a.name, b: b.name, hp1: sa.hp, hp2: sb.hp, tot1: vsOverallRating(sa), tot2: vsOverallRating(sb),
        }), 2800);
      });
    }
    const rndFair = document.getElementById('btnCharRandomFair');
    if (rndFair && !rndFair.dataset.bound) {
      rndFair.dataset.bound = '1';
      bindPress(rndFair, () => {
        AudioSys.sfx('select');
        const duo = pickBalancedRandomDuo();
        if (!duo) {
          UI.toast(t('toast.charNotEnough'), 2400);
          return;
        }
        vsSelect.p1 = duo.a.id;
        vsSelect.p2 = duo.b.id;
        this.charPickStep = 2;
        this.charPreviewHoverId = null;
        this.renderCharSelect();
        const sa = vsFighterStats(duo.a);
        const sb = vsFighterStats(duo.b);
        const diff = duo.ratingDiff != null ? duo.ratingDiff : Math.abs(vsOverallRating(sa) - vsOverallRating(sb));
        UI.toast(t('toast.charFair', { a: duo.a.name, b: duo.b.name, diff }), 3000);
      });
    }
  },

  renderCharIconRow() {
    const row = document.getElementById('charIconRow');
    if (!row) return;
    row.innerHTML = '';
    const label = document.createElement('div');
    label.className = 'char-icon-row-title';
    label.textContent = t('ui.charBig5Title');
    row.appendChild(label);
    const hint = document.createElement('div');
    hint.className = 'char-icon-row-hint';
    hint.textContent = t('ui.charBig5Hint');
    row.appendChild(hint);
    const strip = document.createElement('div');
    strip.className = 'char-icon-strip';
    for (const id of VS_FEATURED_IDS) {
      const r = vsRosterEntry(id);
      const ok = vsUnlocked(r);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'char-icon-chip' + (ok ? '' : ' locked') +
        (vsSelect.p1 === id ? ' p1sel' : '') + (vsSelect.p2 === id ? ' p2sel' : '');
      chip.dataset.id = id;
      const cv = document.createElement('canvas');
      cv.width = 56; cv.height = 56;
      const cc = cv.getContext('2d');
      cc.translate(28, 44); cc.scale(0.82, 0.82);
      buildVsFighter(r, 0, 1).draw(cc);
      chip.appendChild(cv);
      const cap = document.createElement('span');
      cap.className = 'char-icon-name';
      cap.textContent = r.name;
      chip.appendChild(cap);
      if (ok) {
        const st = vsFighterStats(r);
        const stat = document.createElement('span');
        stat.className = 'char-icon-stat';
        stat.textContent = `STR${st.str} RNG${st.rng}`;
        chip.appendChild(stat);
      }
      strip.appendChild(chip);
    }
    row.appendChild(strip);
  },

  openModeHub(id) {
    if (!MODE_HUB_META[id]) return;
    this.modeHubId = id;
    this.renderModeHub();
    this.show('modeHubScreen');
  },

  renderModeHub() {
    const meta = MODE_HUB_META[this.modeHubId];
    if (!meta) return;
    const badge = document.getElementById('modeHubBadge');
    const title = document.getElementById('modeHubTitle');
    const sub = document.getElementById('modeHubSub');
    const stepEl = document.getElementById('modeHubStep');
    const isArcade = this.modeHubId === 'arcade';
    if (badge) {
      badge.textContent = t(isArcade ? 'hub.solo' : 'hub.collection');
      badge.className = 'menu-badge ' + meta.badgeClass;
    }
    if (title) title.textContent = t(isArcade ? 'hub.arcadeTitle' : 'hub.collectTitle');
    if (sub) sub.textContent = t(isArcade ? 'hub.arcadeSub' : 'hub.collectSub');
    if (stepEl) stepEl.textContent = t('hub.step');
    document.querySelectorAll('[data-hub-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.hubPanel !== this.modeHubId;
    });
    const setStat = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt || '';
    };
    if (this.modeHubId === 'arcade') {
      setStat('hubStatTraining', (() => {
        const rec = save.stats.trainMaxCombo || 0;
        if (save.trainWins > 0) return `${save.trainWins} wins${rec ? ` · record ×${rec}` : ''}`;
        if (rec > 0) return `Record combo ×${rec}`;
        return 'Nog niet gespeeld';
      })());
      setStat('hubStatWall', save.bestWall > 0 ? `Record ${save.bestWall}` : 'Nog geen score');
      const mats = save.stats?.matsCoinBest || 0;
      const pc = petCoinsBalance();
      setStat('hubStatMats', mats > 0 || pc > 0
        ? `Best ${mats} munten${pc > 0 ? ` · ${pc} pet 🪙` : ''}`
        : 'Munten → pet coins');
    } else if (this.modeHubId === 'collect') {
      setStat('hubStatWeapons', `${weaponUnlockedCount()}/${WEAPONS.length} vrij`);
      const petsN = petTamedCount();
      const eggsN = eggOwnedCount();
      const pc = petCoinsBalance();
      setStat('hubStatPets', eggsN > 0 || petsN > 0 || pc > 0
        ? `dex ${petsN}/${PET_ROSTER.length} · ${pc} 🪙 · ei ${eggsN}/${EGG_ROSTER.length}`
        : `${PET_ROSTER.length} dex · Mats → pet coins`);
      const stylesN = STYLES.filter(s => styleUnlocked(s)).length;
      setStat('hubStatStyle', `${stylesN}/${STYLES.length} outfits`);
      setStat('hubStatDex', `${dexCount()}/${SPECIES_ORDER.length} · +max HP`);
    }
  },

  renderMenu() {
    this.syncTouchClass();
    const need = xpNeed(save.lvl);
    const w = weaponById(save.weapon);
    const st = styleById(save.style || 'classic');
    const pct = Math.round(save.xp / need * 100);
    ensureDaily();
    const readyClaim = claimableDailyTasks().length;
    const bonusReady = save.daily.tasks.every(t => t.claimed) && !save.daily.dayBonusClaimed;
    const missAlert = readyClaim > 0 || bonusReady;
    const profileEl = document.getElementById('menuProfileBar');
    if (profileEl) {
      profileEl.innerHTML =
        `<span class="prof-row"><b>Lv ${save.lvl}</b><span>${weaponLabel(w)}</span><span style="color:${st.accent}">${styleLabel(st)}</span></span>` +
        `<span style="display:block;margin-top:3px;opacity:.82;font-size:11px">${adventureProgressLine()}</span>` +
        `<span class="prof-xp" aria-hidden="true"><span style="width:${pct}%"></span></span>` +
        `<span class="prof-foot">${save.xp}/${need} XP${missAlert ? ' · ' + t('ui.menuMissionReady') : ''}</span>`;
      profileEl.classList.toggle('has-alert', missAlert);
    }
    const statsEl = document.getElementById('menuStats');
    if (statsEl) statsEl.textContent = '';
    const cont = document.getElementById('btnContinue');
    const lp = save.lastPlay;
    const featHub = lp?.mode ? hubForPlayMode(lp.mode) : null;
    if (cont) {
      if (lp && lp.mode) {
        const labels = {
          adventure: t('modes.adventure') + ` Lv ${lp.level || 1}`,
          training: t('modes.training'), wall: t('modes.wall'), versus: t('modes.versus'), coinrun: t('modes.coinrun'),
        };
        cont.style.display = 'flex';
        cont.querySelector('div').innerHTML =
          `${t('menu.continue')}<small>${labels[lp.mode] || lp.mode}</small>`;
      } else cont.style.display = 'none';
    }
    document.querySelectorAll('[data-hub]').forEach((el) => {
      el.classList.toggle('hub-tile-featured', el.dataset.hub === featHub);
    });
    document.querySelectorAll('[data-hub-stat]').forEach((el) => {
      el.textContent = hubTileStatLine(el.dataset.hubStat);
    });
    document.getElementById('togMusic').classList.toggle('off', !save.music);
    document.getElementById('togSfx').classList.toggle('off', !save.sfx);
    const verLine = document.getElementById('menuVerLine');
    if (verLine) verLine.textContent = 'v' + APP_VERSION + ' · arcade · SW v' + SW_CACHE_REV;
    const missEl = document.getElementById('menuDailyHint');
    const hubHintEl = document.getElementById('menuHubHint');
    const dailyLine = dailyStatusLine();
    if (missEl) missEl.textContent = dailyLine;
    const tipEl = document.getElementById('menuTipLine');
    let hintLine = dailyLine;
    if (tipEl) {
      const prog = onboardingProgress();
      const next = nextUntriedMode();
      if (next) {
        tipEl.textContent = t('ui.menuFirstMinuteNext', { seen: prog.seen, total: prog.total, next: next.label });
        hintLine = tipEl.textContent;
      } else if (prog.seen < prog.total) {
        tipEl.textContent = t('ui.menuFirstMinutePartial', { seen: prog.seen, total: prog.total });
        hintLine = tipEl.textContent;
      } else {
        const i = Math.floor(Date.now() / 8000);
        tipEl.textContent = menuTipAt(i);
        hintLine = tipEl.textContent;
      }
    }
    if (hubHintEl) hubHintEl.textContent = hintLine;
    const missBtn = document.getElementById('btnMissions');
    const missLbl = document.getElementById('btnMissionsLbl');
    if (missBtn) {
      missBtn.classList.toggle('tog-alert', missAlert);
      if (missLbl) {
        if (readyClaim > 0) missLbl.textContent = `+${dailyUnclaimedXp()} XP`;
        else if (bonusReady) missLbl.textContent = t('menu.dayBonus');
        else missLbl.textContent = t('menu.missions');
      }
    }
    const playLinkEl = document.getElementById('menuPlayLink');
    if (playLinkEl) {
      if (location.hostname.endsWith('.github.io')) {
        playLinkEl.textContent = '✓ GitHub Pages — Deel link (Android + iPad)';
      } else if (!playLinkEl.dataset.loaded) {
        playLinkEl.dataset.loaded = '1';
        loadHostingBundle().then(({ hosting }) => {
          const u = pickStablePlayUrl(hosting);
          if (u) {
            playLinkEl.innerHTML =
              `Deel met vrienden: <a href="${u}" style="color:#7cf5ff;font-weight:800">${u.replace(/^https:\/\//, '')}</a>`;
          }
        }).catch(() => {});
      }
    }
  },

  renderMissions() {
    ensureDaily();
    const dailyHost = document.getElementById('dailyList');
    const achHost = document.getElementById('achList');
    if (!dailyHost || !achHost) return;
    const tasks = save.daily.tasks;
    const readyN = tasks.filter(t => t.done && !t.claimed).length;
    const claimedN = tasks.filter(t => t.claimed).length;
    const doneN = tasks.filter(t => t.done).length;
    let nextUpId = null;
    let nextUpPct = -1;
    for (const t of tasks) {
      if (t.done || t.claimed) continue;
      const def = dailyDef(t.id);
      if (!def) continue;
      const pct = t.progress / def.goal;
      if (pct > nextUpPct) { nextUpPct = pct; nextUpId = t.id; }
    }
    const sub = document.getElementById('missionsSub');
    const step = dailyFlowStep();
    if (sub) {
      const streak = dailyStreakLine();
      if (step === 0) {
        sub.textContent = streak
          ? t('missionsUi.subDayDoneStreak', { streak })
          : t('missionsUi.subDayDone');
      } else {
        const pending = dailyUnclaimedXp();
        const base = step === 2
          ? t('missionsUi.subStep2', { xp: pending })
          : (step === 3
            ? t('missionsUi.subStep3')
            : t('missionsUi.subStep1', { xp: dailyPotentialXp() }));
        sub.textContent = streak ? `${base} · ${streak}` : base;
      }
    }
    const flowHost = document.getElementById('missionsFlowBar');
    if (flowHost) {
      flowHost.innerHTML = dailyFlowBarHtml(step);
    }
    const sum = document.getElementById('missionsSummary');
    if (sum) {
      sum.style.display = 'block';
      const bonusLeft = !save.daily.dayBonusClaimed;
      const streak = dailyStreakLine();
      sum.innerHTML = t('missionsUi.summaryDone', { done: doneN, claimed: claimedN }) +
        (readyN ? ` · <b style="color:#ffd75e">${t('missionsUi.summaryReady', { n: readyN })}</b>` : '') +
        (bonusLeft
          ? (claimedN === 3
            ? ` · <b style="color:#7cfc8a">${t('missionsUi.summaryBonusReady')}</b>`
            : ` · ${claimedN === 2 ? t('missionsUi.summaryBonusAfter1') : t('missionsUi.summaryBonusAfterN', { n: 3 - claimedN })}`)
          : ` · dagbonus ${SVG_CHECK_MINI}`) +
        (streak ? ` · <b style="color:#7cf5ff">${streak}</b>` : '') +
        ` · ${t('missionsUi.summaryMax', { xp: dailyPotentialXp() })}`;
    }
    const claimAll = document.getElementById('dailyClaimAllBtn');
    if (claimAll) {
      claimAll.style.display = readyN >= 1 ? 'flex' : 'none';
      const lab = claimAll.querySelector('div');
      if (lab) {
        const xpSum = claimableDailyTasks().reduce((n, t) => n + (dailyDef(t.id)?.xp || 0), 0);
        const afterClaim = 3 - claimedN - readyN;
        lab.innerHTML = t('missionsUi.claimAllBtn') + `<small>+${xpSum} XP` +
          (afterClaim > 0
            ? (afterClaim === 1
              ? ` · ${t('missionsUi.claimAllAfter1')}`
              : ` · ${t('missionsUi.claimAllAfterN', { n: afterClaim })}`)
            : ` · ${t('missionsUi.claimAllThenBonus')}`) +
          '</small>';
      }
    }
    dailyHost.innerHTML = '';
    for (const task of tasks) {
      const def = dailyDef(task.id);
      if (!def) continue;
      const el = document.createElement('div');
      const claimable = task.done && !task.claimed;
      const isNextUp = !task.done && !task.claimed && task.id === nextUpId;
      el.className = 'step-card mission-card' +
        (claimable ? ' claimable' : '') +
        (task.claimed ? ' claimed' : '') +
        (isNextUp ? ' next-up' : '');
      const pct = Math.min(100, Math.round(task.progress / def.goal * 100));
      let status;
      if (task.claimed) status = `<span style="color:#7cfc8a">${SVG_CHECK_MINI} ${t('missionsUi.dailyClaimed')}</span>`;
      else if (task.done) status = `<span style="color:#ffd75e">${t('missionsUi.dailyReady')}</span>`;
      else status = `<span style="opacity:.85">${t('missionsUi.dailyProgress', { cur: task.progress, goal: def.goal })}</span>`;
      const playHint = dailyHint(def.id);
      const playTarget = DAILY_PLAY_TARGETS[def.id];
      const remainder = dailyTaskRemainderText(task, def);
      const modePill = playTarget
        ? `<span class="mission-mode-pill">${dailyModeLabel(playTarget.mode)}</span> `
        : '';
      el.innerHTML = `${modePill}<b>${dailyText(def.id)}</b>${isNextUp ? ` <span class="next-up-tag">${t('missionsUi.dailyNextUp')}</span>` : ''}<br>${status}` +
        (remainder && !task.done ? `<div style="color:#7cf5ff;font-size:12px;margin-top:4px;font-weight:700">${remainder}</div>` : '') +
        (playHint && !task.done ? `<div style="opacity:.75;font-size:12px;margin-top:4px">${playHint}</div>` : '') +
        `<div style="opacity:.8;font-size:13px;margin-top:4px">${t('missionsUi.dailyReward', { xp: def.xp })}</div>` +
        `<div class="xpline" style="margin-top:8px"><div style="width:${pct}%"></div></div>`;
      if (claimable) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn claim-btn';
        btn.textContent = t('missionsUi.dailyClaimBtn', { xp: def.xp });
        btn.addEventListener('click', () => safeUiAction(() => {
          AudioSys.sfx('select');
          claimDailyTask(task.id);
        }, 'claimDaily/' + task.id, 'Claim mislukt — probeer opnieuw'));
        el.appendChild(btn);
      } else if (!task.done && playTarget) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn mission-play-btn';
        btn.textContent = t('missionsUi.dailyPlayBtn', { mode: dailyModeLabel(playTarget.mode) });
        btn.addEventListener('click', () => safeUiAction(() => goDailyPlayTarget(task.id), 'dailyPlay/' + task.id, 'Kon modus niet openen'));
        el.appendChild(btn);
      }
      dailyHost.appendChild(el);
    }
    const bonusBtn = document.getElementById('dailyBonusBtn');
    if (bonusBtn) {
      const ready = claimedN === 3 && !save.daily.dayBonusClaimed;
      const label = bonusBtn.querySelector('div');
      if (save.daily.dayBonusClaimed) {
        bonusBtn.style.display = 'flex';
        bonusBtn.disabled = true;
        bonusBtn.classList.add('done');
        if (label) label.innerHTML = t('missionsUi.bonusClaimed') + `<small>${t('missionsUi.bonusTomorrow')}</small>`;
      } else {
        bonusBtn.classList.remove('done');
        bonusBtn.style.display = 'flex';
        bonusBtn.disabled = !ready;
        bonusBtn.style.opacity = ready ? '1' : '0.45';
        if (label) {
          label.innerHTML = ready
            ? t('missionsUi.bonusClaimBtn') + `<small>${t('missionsUi.bonusTap')}</small>`
            : t('missionsUi.bonusNeed') + `<small>${(3 - claimedN) === 1 ? t('missionsUi.bonusNeed1') : t('missionsUi.bonusNeedN', { n: 3 - claimedN })}</small>`;
        }
      }
    }
    const achSum = document.getElementById('achSummary');
    const gotN = Object.keys(save.achievements).length;
    const nearN = ACHIEVEMENTS.filter(a => !save.achievements[a.id] && achievementProgressFrac(a) >= 0.5).length;
    if (achSum) {
      achSum.textContent = t('missionsUi.achSummary', { got: gotN, total: ACHIEVEMENTS.length }) +
        (nearN ? ` · ${t('missionsUi.achNear', { n: nearN })}` : '');
    }
    const achFilterHost = document.getElementById('achFilterBar');
    if (achFilterHost) {
      const cur = this.achFilter || 'all';
      const mk = (id, label) =>
        `<button type="button" class="dex-filter-btn${cur === id ? ' active' : ''}" data-ach-filter="${id}">${label}</button>`;
      achFilterHost.innerHTML =
        mk('all', t('missionsUi.filterAll')) + mk('near', t('missionsUi.filterNear')) +
        mk('open', t('missionsUi.filterOpen')) + mk('done', t('missionsUi.filterDone'));
      if (!achFilterHost.dataset.bound) {
        achFilterHost.dataset.bound = '1';
        achFilterHost.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-ach-filter]');
          if (!btn) return;
          AudioSys.sfx('select');
          UI.achFilter = btn.dataset.achFilter || 'all';
          UI.renderMissions();
        });
      }
    }
    achHost.innerHTML = '';
    const today = todayKey();
    const achSortKey = (ach) => {
      const got = save.achievements[ach.id];
      if (got === today) return [0, 0, ach.name];
      if (!got) {
        const p = achievementProgressFrac(ach);
        if (p >= 0.5) return [1, -p, ach.name];
        if (p > 0) return [2, -p, ach.name];
        return [3, 0, ach.name];
      }
      return [4, got, ach.name];
    };
    const sortedAch = [...ACHIEVEMENTS].sort((a, b) => {
      const ka = achSortKey(a);
      const kb = achSortKey(b);
      for (let i = 0; i < 3; i++) {
        if (ka[i] < kb[i]) return -1;
        if (ka[i] > kb[i]) return 1;
      }
      return 0;
    });
    for (const ach of sortedAch) {
      const got = save.achievements[ach.id];
      const frac = achievementProgressFrac(ach);
      const filter = this.achFilter || 'all';
      if (filter === 'near' && (got || frac < 0.5)) continue;
      if (filter === 'open' && got) continue;
      if (filter === 'done' && !got) continue;
      const el = document.createElement('div');
      const isNew = got === today;
      const near = !got && frac >= 0.5;
      el.className = 'card' + (got ? '' : ' locked') + (isNew ? ' ach-card new' : '') + (near ? ' ach-near' : '');
      el.style.borderColor = got ? (isNew ? '#7cf5ff' : '#ffd75e') : undefined;
      const pct = Math.min(100, Math.round(frac * 100));
      const progBar = got ? '' : `<div class="xpline" style="margin-top:6px;height:5px"><div style="width:${pct}%"></div></div>`;
      el.innerHTML = `<div class="cname">${achIconSvg(ach.id)} ${achLabel(ach, 'name')}${isNew ? ' · ' + t('missionsUi.badgeNew') : ''}${near ? ' · ' + t('missionsUi.badgeNear') : ''}</div>` +
        `<div class="cinfo">${achLabel(ach, 'desc')}${got ? ` · ${SVG_CHECK_MINI} ` + got : (() => {
          const hint = achievementProgressHint(ach);
          return hint ? ' · ' + hint : ' · ' + t('missionsUi.stillOpen');
        })()}</div>${progBar}`;
      achHost.appendChild(el);
    }
  },

  renderHosting() {
    const linkEl = document.getElementById('hostingLink');
    const hintEl = document.getElementById('hostingHint');
    const curEl = document.getElementById('hostingCurrent');
    const badgeEl = document.getElementById('hostingHostBadge');
    const openBtn = document.getElementById('btnOpenPlayLink');
    if (!linkEl) return;
    loadHostingBundle()
      .then(({ hosting, liveUrl }) => {
        const stable = withShareRevParam(
          canonicalPagesPlayUrl(hosting) || (!isTunnelHostUrl(liveUrl) && liveUrl) || headLiveFromPage(),
          (hosting && hosting.shareCacheRev) || SW_CACHE_REV,
        );
        const short = (u) => String(u || '').replace(/^https:\/\//, '');
        if (stable && !isTunnelHostUrl(stable)) {
          linkEl.innerHTML =
            `<div style="opacity:.8;margin-bottom:4px">Vaste speel-link (GitHub Pages) — deel deze</div>` +
            `<a href="${stable}" style="color:#7cf5ff;font-weight:800" rel="noopener">${short(stable)}</a>`;
        } else {
          linkEl.textContent = withShareRevParam('https://brennyz.github.io/stickman-fighter/speel.html', SW_CACHE_REV);
        }
        const kind = playHostKind();
        if (badgeEl) {
          const labels = {
            pages: 'GitHub Pages — stabiele deel-link',
            tunnel: 'Tunnel (dev) — deel nooit deze URL',
            netlify: 'Netlify — export save bij URL-wissel',
            local: 'Lokaal — deel GitHub Pages met vrienden',
            file: 'Lokaal bestand — deel GitHub Pages',
            other: 'Online host',
          };
          const colors = {
            pages: '#6ee06e',
            tunnel: '#ffb86a',
            netlify: '#7cf5ff',
            local: '#a8b8e8',
            file: '#a8b8e8',
            other: '#cfe0ff',
          };
          badgeEl.innerHTML =
            `<span style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;color:${colors[kind] || '#cfe0ff'};background:rgba(0,0,0,.28);border:1px solid ${colors[kind] || '#cfe0ff'}55">Speel via: ${labels[kind] || kind}</span>`;
        }
        if (openBtn) {
          openBtn.classList.toggle('tog-alert', kind === 'tunnel');
          const lab = openBtn.querySelector('div');
          if (lab) {
            lab.innerHTML = kind === 'tunnel'
              ? 'Open GitHub Pages (deel-link)<small>Tunnel is alleen thuis-dev</small>'
              : 'Open vaste link<small>speel.html op GitHub Pages</small>';
          }
        }
        const onTunnel = onTunnelHost();
        if (curEl) {
          // Tunnel-URL nooit tonen op Pages — voorkomt per ongeluk delen met vrienden
          if (onTunnel && location.protocol !== 'file:') {
            curEl.style.display = 'block';
            curEl.textContent =
              'Dev-sessie (niet delen): ' + location.href.split('?')[0].split('#')[0] +
              ' · Deel alleen de Pages-link hierboven';
          } else {
            curEl.style.display = 'none';
            curEl.textContent = '';
          }
        }
        let hint = hosting.stableHint || '';
        if (!hint) {
          if (stable && String(stable).includes('github.io')) {
            hint = 'Primair: GitHub Pages — bookmark speel.html (Safari → Delen → Zet op beginscherm). Tunnel is alleen thuis-dev.';
          } else if (location.hostname.endsWith('.github.io')) hint = 'Je speelt via GitHub Pages — deel speel.html met vrienden.';
          else if (location.hostname.endsWith('.netlify.app')) hint = 'Netlify-host — export save bij URL-wissel.';
          else hint = 'Gebruik de vaste Pages-link hierboven; tunnel nooit als deel-link.';
        }
        if (onTunnel) {
          hint += ' Tunnel offline/503? Open de vaste GitHub Pages-link (primair).';
        }
        if (hosting.netlifyUrl && hosting.netlifyReadyAfter) {
          hint += ` Netlify (${hosting.netlifyUrl}) kan Forbidden geven tot ~${hosting.netlifyReadyAfter}.`;
        }
        if (hintEl) hintEl.textContent = hint;
      })
      .catch(() => {
        linkEl.textContent = 'https://brennyz.github.io/stickman-fighter/speel.html';
        if (hintEl) hintEl.textContent = 'Primair: GitHub Pages speel.html — export save bij URL-wissel.';
      });
  },

  renderLevels() {
    const bar = document.getElementById('levelIslandBar');
    const info = document.getElementById('levelIslandInfo');
    const grid = document.getElementById('levelGrid');
    if (!grid) return;
    const pick = this.advIslandPick || currentAdvIsland();
    this.advIslandPick = pick;
    if (bar) {
      bar.innerHTML = '';
      for (const isl of ADVENTURE_ISLANDS) {
        const ok = islandUnlocked(isl.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'island-tab' + (pick === isl.id ? ' active' : '') + (ok ? '' : ' locked');
        btn.style.setProperty('--isl-accent', isl.accent);
        const prog = islandProgress(isl.id);
        const pct = Math.round(prog.cleared / prog.total * 100);
        btn.innerHTML = `<span class="island-tab-ico">${isl.icon}</span>` +
          `<span class="island-tab-n">${isl.id}</span><span class="island-tab-name">${isl.name}</span>` +
          `<span class="island-prog-track island-tab-prog"><i style="width:${pct}%;background:${isl.accent}"></i></span>` +
          (ok ? '' : `<span class="island-tab-lock">${SVG_LOCK_ICON}</span>`);
        btn.title = ok ? `${isl.name} · ${isl.sub}` : `Versla baas Lv ${isl.id * LEVELS_PER_ISLAND} om te openen`;
        if (ok) {
          btn.addEventListener('click', () => safeUiAction(() => {
            AudioSys.sfx('select');
            UI.advIslandPick = isl.id;
            UI.renderLevels();
          }, 'pickIsland/' + isl.id, 'Eiland kiezen mislukt'));
        }
        bar.appendChild(btn);
      }
    }
    const islMeta = ADVENTURE_ISLANDS[pick - 1] || ADVENTURE_ISLANDS[0];
    const range = islandLevelRange(pick);
    const wCap = adventureWeaponCapForLevel(range.start);
    const prog = islandProgress(pick);
    const pct = Math.round(prog.cleared / prog.total * 100);
    if (info) {
      const mb = save.advMasterBuff;
      info.innerHTML =
        `<div class="island-info-head">` +
        `<span class="island-info-ico">${islMeta.icon}</span>` +
        `<div class="island-info-text">` +
        `<b style="color:${islMeta.accent}">${islMeta.name}</b> · ${islMeta.sub}` +
        `<div class="island-info-sub">Skill gate: wapens tot Lv <b>${wCap}</b> · ${prog.cleared}/${prog.total} levels · ${prog.stars}★` +
        (pick < 5 ? ` · baas Lv ${pick * LEVELS_PER_ISLAND} → volgend eiland` : '') +
        `</div></div></div>` +
        `<div class="island-prog-track island-info-prog"><i style="width:${pct}%;background:${islMeta.accent}"></i></div>` +
        (() => {
          const onboard = adventureIslandHintLine();
          const mbLine = mb && mb >= range.start && mb <= range.end
            ? `<span class="island-info-chip master">Meester-buff Lv ${mb} · +20%</span>`
            : '';
          const chips = [
            onboard ? `<span class="island-info-chip onboard">${onboard}</span>` : '',
            mbLine,
          ].filter(Boolean).join('');
          return chips ? `<div class="island-info-chips">${chips}</div>` : '';
        })();
    }
    grid.innerHTML = '';
    for (let n = range.start; n <= range.end; n++) {
      const el = document.createElement('div');
      const boss = !!BOSS_AT[n];
      const locked = n > save.unlocked;
      const infoLv = buildLevel(n);
      const rar = rarityOf(infoLv.rarityCap);
      const fails = advFailCount(n);
      el.className = 'lvl' + (boss ? ' boss' : '') + (locked ? ' locked' : '') + (n < save.unlocked ? ' cleared' : '') +
        (!locked && n === save.unlocked ? ' lvl-current' : '') +
        (save.advMasterBuff === n ? ' master-buff' : '');
      el.style.boxShadow = locked ? 'none' : `0 5px 0 rgba(0,0,0,.35), 0 0 0 2px ${rar.color}55`;
      const waveStrip = infoLv.waves.map((_, wi) => {
        const isBossPip = boss && wi === infoLv.waves.length - 1;
        return `<i class="lvl-wave-dot${isBossPip ? ' boss' : ''}"></i>`;
      }).join('');
      el.innerHTML = locked
        ? SVG_LOCK_ICON
        : `${n}${boss ? `<small>${t('ui.boss')}</small>` : `<small style="color:${rar.color}">${rarityLabel(infoLv.rarityCap)}</small>`}` +
          `<span class="lvl-wave-strip" aria-hidden="true">${waveStrip}</span>` +
          (save.stars[n] ? `<span class="lvl-stars">${'★'.repeat(save.stars[n])}</span>` : '') +
          (fails > 0 && !locked ? `<span class="lvl-fails">${fails}/5</span>` : '') +
          (save.advMasterBuff === n ? '<span class="lvl-master">+20%</span>' : '');
      if (!locked) {
        const best = save.stars[n] || 0;
        let tip = `${infoLv.waves.length} golven · ${starHintLine()}`;
        if (boss) tip += pick * LEVELS_PER_ISLAND === n ? ' · eiland-baas — opent volgend eiland' : ' · tussendoor-baas';
        if (best > 0) tip += ` · jouw ${'★'.repeat(best)}${'☆'.repeat(3 - best)}`;
        if (fails > 0) tip += ` · ${fails}× verloren${fails >= 5 ? ' · Meester-buff actief' : ''}`;
        tip += ' · Tik = Gooi & start · Lang = zonder gok';
        el.title = tip;
        let holdT = null;
        let holdSkip = false;
        el.addEventListener('pointerdown', () => {
          holdSkip = false;
          holdT = setTimeout(() => {
            holdT = null;
            if (!uiTapAllowed()) return;
            holdSkip = true;
            safeUiAction(() => {
              AudioSys.sfx('select');
              pendingAdvLevel = n;
              lastGambleRoll = null;
              startAdventureFromGamble(true);
              try { UI.toast(t('toast.skipGamble'), 1400); } catch (_) {}
            }, 'skipGamble/' + n, 'Start mislukt');
          }, 520);
        }, { passive: true });
        const cancelHold = () => { if (holdT) { clearTimeout(holdT); holdT = null; } };
        el.addEventListener('pointerup', cancelHold);
        el.addEventListener('pointercancel', cancelHold);
        el.addEventListener('click', () => {
          if (holdSkip) { holdSkip = false; return; }
          if (!uiTapAllowed()) return;
          safeUiAction(() => gokGooiStartLevel(n), 'gokStart/' + n, 'Level starten mislukt');
        });
      }
      grid.appendChild(el);
    }
  },

  renderGamble(levelN) {
    const head = document.getElementById('gambleHead');
    const diceRow = document.getElementById('gambleDiceRow');
    const sumLine = document.getElementById('gambleSumLine');
    const outEl = document.getElementById('gambleOutcome');
    if (head) head.textContent = t('ui.gambleHead', { island: islandLabel(islandFromLevel(levelN), 'name'), level: levelN });
    const ctx = document.getElementById('gambleIslandCtx');
    if (ctx) {
      const cap = adventureWeaponCapForLevel(levelN);
      ctx.textContent = t('ui.gambleCtx', { cap });
    }
    const g = lastGambleRoll;
    const face = (d) => ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][d - 1] || '?';
    if (g && diceRow) {
      diceRow.textContent = `${face(g.d1)} ${face(g.d2)}`;
      if (sumLine) sumLine.textContent = t('ui.gambleSumRoll', { d1: g.d1, d2: g.d2, sum: g.sum });
    } else {
      if (diceRow) diceRow.textContent = '? ?';
      if (sumLine) sumLine.textContent = t('ui.gambleSumDefault');
    }
    if (outEl) {
      if (!g) outEl.textContent = t('ui.gamblePreview');
      else {
        outEl.textContent = gambleOutcomeLabelFromKey(g);
        const col = g.outcome === 'superBoss' || g.outcome === 'miniBoss' ? '#ffb0b8'
          : (g.outcome === 'superAlly' || g.outcome === 'ally') ? (GAMBLE_ALLIES[g.allyId]?.color || '#7cf5ff') : '#8fa3d9';
        outEl.style.color = col;
      }
    }
  },

  renderWeapons() {
    const sumEl = document.getElementById('weaponSummary');
    if (sumEl) {
      const unlocked = weaponUnlockedCount();
      const advUsable = weaponAdventureUsableCount();
      const br = weaponRarityBreakdown();
      const tierChips = Object.keys(RARITIES).map(rid => {
        const rar = RARITIES[rid];
        const n = br[rid] || 0;
        if (!n) return '';
        return `<span class="rar-pill" style="color:${rar.color};border-color:${rar.color};margin:2px">${rarityLabel(rid)} ${n}</span>`;
      }).filter(Boolean).join(' ');
      sumEl.style.display = 'block';
      sumEl.innerHTML =
        `Verzameld <b>${unlocked}/${WEAPONS.length}</b> · avontuur <b>${advUsable}</b> bruikbaar` +
        ` · actief <b>${weaponLabel(save.weapon)}</b>` +
        ` · eiland-skill gate: Lv <b>${adventureWeaponCap()}</b>` +
        ((save.stats.weaponFinishers || 0) > 0 ? ` · finishers <b>${save.stats.weaponFinishers}</b>` : '') +
        (tierChips ? `<div style="margin-top:6px;line-height:1.7">${tierChips}</div>` : '');
    }
    const mastEl = document.getElementById('weaponMasteryStrip');
    if (mastEl) {
      const top = weaponMasteryTopList(3);
      if (!top.length) {
        mastEl.style.display = 'none';
        mastEl.innerHTML = '';
      } else {
        mastEl.style.display = 'block';
        mastEl.innerHTML = '<div style="font-size:12px;opacity:.85;margin-bottom:6px">Top stijl-meesterschap</div>' +
          top.map(e =>
            `<span class="rar-pill" style="color:${e.tier.color};border-color:${e.tier.color};margin:2px 4px 2px 0">` +
            `${e.name} · ${e.tier.name} · ${e.finishers}×</span>`
          ).join('') +
          '<div style="font-size:11px;opacity:.65;margin-top:6px">Tiers: Leerling → Virtuoos (3) → Meester (10) → Legende (25)</div>';
      }
    }
    const list = document.getElementById('weaponList');
    list.innerHTML = '';
    for (const base of WEAPONS) {
      const w = applySummonTier(base);
      const lvlLocked = !weaponUnlockedByLevel(base);
      const islandLocked = weaponSkillGated(base);
      const locked = lvlLocked;
      const rar = rarityOf(w.rarity);
      const el = document.createElement('div');
      el.className = 'card rar-' + w.rarity + (save.weapon === w.id ? ' sel' : '') +
        (locked ? ' locked' : '') + (islandLocked && !lvlLocked ? ' island-gated' : '');
      el.style.borderColor = rar.color + (save.weapon === w.id ? '' : '66');
      if (w.summoned) el.style.boxShadow = `0 0 14px ${rar.glow}`;
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const cc = cv.getContext('2d');
      cc.translate(10, 40); cc.rotate(-0.6);
      if (w.id === 'vuist') {
        cc.strokeStyle = '#f2f5ff'; cc.lineWidth = 5; cc.lineCap = 'round';
        cc.beginPath(); cc.moveTo(2, 8); cc.lineTo(24, -6); cc.stroke();
        cc.fillStyle = '#f2f5ff'; cc.beginPath(); cc.arc(28, -9, 7, 0, TAU); cc.fill();
      } else drawWeaponShape(cc, w.id, 0.2);
      el.appendChild(cv);
      const info = document.createElement('div');
      const summonBadge = w.summoned
        ? ` <span class="rar-pill" style="color:${rar.color};border-color:${rar.color}">✦ Summon</span>`
        : '';
      const statLine = w.summoned
        ? `${weaponDesc(w)} · schade x${base.dmg} → <b style="color:${rar.color}">x${w.dmg}</b> · bereik ${w.range} · snelheid x${w.speed}`
        : `${weaponDesc(w)} · schade x${w.dmg} · bereik ${w.range} · snelheid x${w.speed}`;
      const labels = weaponMoveLabels(w.id);
      const mast = (save.weaponMastery || {})[w.id];
      const finCount = mast && mast.finishers ? mast.finishers : 0;
      const tier = finCount > 0 ? weaponMasteryTier(w.id) : null;
      const tierBadge = tier && finCount >= 3
        ? ` <span class="rar-pill" style="color:${tier.color};border-color:${tier.color}">${tier.name}</span>`
        : '';
      const mastLine = finCount ? ` · ${finCount}× finisher` : '';
      const moveLine = labels
        ? `① ${labels[0]} · ② ${labels[1]} · ③ ${labels[2]} finisher${mastLine}`
        : (isThrowWeapon(w.id) ? 'Werp-projectiel — geen melee-combo' : '');
      info.innerHTML = `<div class="cname">${weaponLabel(w)} <span class="rar-pill" style="color:${rar.color};border-color:${rar.color}">${rarityLabel(w.rarity)}</span>${summonBadge}${tierBadge}</div>
        <div class="cinfo">${statLine}</div>` +
        (moveLine ? `<div class="cinfo" style="opacity:.78;font-size:12px;margin-top:3px">${moveLine}</div>` : '');
      el.appendChild(info);
      const right = document.createElement('div');
      right.className = 'right';
      right.innerHTML = lvlLocked
        ? `${SVG_LOCK_ICON} Lv ${base.unlock}`
        : (islandLocked
          ? `Avontuur Lv ${base.unlock}`
          : (save.weapon === w.id ? '&#10004; gekozen' : 'kies'));
      el.appendChild(right);
      if (!locked) el.addEventListener('click', () => {
        if (!uiTapAllowed()) return;
        safeUiAction(() => {
          save.weapon = w.id;
          if (!persistOrToast('wapen')) return;
          AudioSys.sfx('select');
          try { AudioSys.sfx(weaponSwingSfx(w.id)); } catch (_) {}
          if (islandLocked) UI.toast(t('toast.weaponIslandCap', { cap: adventureWeaponCap() }), 2800);
          this.renderWeapons();
        }, 'pickWeapon/' + w.id, 'Wapen kiezen mislukt');
      });
      list.appendChild(el);
    }
  },

  renderDex() {
    const sumEl = document.getElementById('dexSummary');
    if (sumEl) {
      const totalHp = dexHpBonus();
      const kills = dexTotalKills();
      const br = dexRarityBreakdown();
      const tierChips = Object.keys(RARITIES).map(rid => {
        const rar = RARITIES[rid];
        const n = br[rid] || 0;
        if (!n) return '';
        return `<span class="rar-pill" style="color:${rar.color};border-color:${rar.color};margin:2px">${rarityLabel(rid)} ${n}</span>`;
      }).filter(Boolean).join(' ');
      const cosmetic = dexCosmeticProgressLines();
      const cosmeticHtml = cosmetic.length
        ? `<div class="dex-cosmetic-row">${cosmetic.map(c => {
            const pct = Math.min(100, Math.round(c.cur / c.goal * 100));
            return `<div class="dex-cosmetic-chip"><b>${c.name}</b> ${c.cur}/${c.goal} ${c.label}` +
              `<div class="xpline" style="margin-top:5px;height:6px"><div style="width:${pct}%"></div></div></div>`;
          }).join('')}</div>`
        : '';
      sumEl.style.display = 'block';
      sumEl.innerHTML =
        `Boek <b>${dexCount()}/${SPECIES_ORDER.length}</b> · kills <b>${kills}</b> · bonus max HP <b>+${totalHp}</b>` +
        ` · rariteiten <b>${dexRarityTierCount()}/6</b>` +
        `<div class="dex-mini-row">${dexMiniStat('HP', totalHp, SPECIES_ORDER.length * 25, '#6ee06e')}` +
        `${dexMiniStat('Kills', kills, 150, '#ffd75e')}</div>` +
        (tierChips ? `<div style="margin-top:6px;line-height:1.7">${tierChips}</div>` : '') +
        cosmeticHtml +
        dexNextAchievementHtml();
    }
    const bindFilterBar = (host, attr, stateKey, mkButtons) => {
      if (!host) return;
      host.innerHTML = mkButtons();
      if (host.dataset.bound) return;
      host.dataset.bound = '1';
      host.addEventListener('click', (e) => {
        const btn = e.target.closest(`[${attr}]`);
        if (!btn) return;
        AudioSys.sfx('select');
        UI[stateKey] = btn.getAttribute(attr) || 'all';
        UI.renderDex();
      });
    };
    const rarityTotals = dexRarityTotals();
    bindFilterBar(document.getElementById('dexFilterBar'), 'data-dex-filter', 'dexRarityFilter', () => {
      const cur = this.dexRarityFilter || 'all';
      const mk = (id, label, color) =>
        `<button type="button" class="dex-filter-btn${cur === id ? ' active' : ''}" data-dex-filter="${id}"` +
        (color ? ` style="--dex-filter-color:${color}"` : '') + `>${label}</button>`;
      return mk('all', `Alle ${dexCount()}/${SPECIES_ORDER.length}`) +
        Object.keys(RARITIES).map(rid => {
          const rar = RARITIES[rid];
          const n = (dexRarityBreakdown()[rid] || 0);
          const tot = rarityTotals[rid] || 0;
          return mk(rid, `${rarityLabel(rid)} ${n}/${tot}`, rar.color);
        }).join('');
    });
    bindFilterBar(document.getElementById('dexTypeFilterBar'), 'data-dex-type-filter', 'dexTypeFilter', () => {
      const cur = this.dexTypeFilter || 'all';
      const mk = (id, label) =>
        `<button type="button" class="dex-filter-btn${cur === id ? ' active' : ''}" data-dex-type-filter="${id}">${label}</button>`;
      const types = [];
      const seen = new Set();
      for (const id of SPECIES_ORDER) {
        const t = SPECIES[id].type;
        if (!seen.has(t)) { seen.add(t); types.push(t); }
      }
      return mk('all', 'Alle types') +
        types.map(t => mk(t, MONSTER_TYPE_LABEL[t] || t)).join('');
    });
    bindFilterBar(document.getElementById('dexSortBar'), 'data-dex-sort', 'dexSortKey', () => {
      const cur = this.dexSortKey || 'book';
      const mk = (id, label) =>
        `<button type="button" class="dex-filter-btn${cur === id ? ' active' : ''}" data-dex-sort="${id}">${label}</button>`;
      return mk('book', 'Boek') + mk('rarity', 'Rariteit') + mk('unlock', 'Unlock Lv') + mk('kills', 'Kills');
    });
    const list = document.getElementById('dexList');
    list.innerHTML = '';
    const filter = this.dexRarityFilter || 'all';
    const typeFilter = this.dexTypeFilter || 'all';
    const sortKey = this.dexSortKey || 'book';
    const topKillId = dexTopKillId();
    for (const id of dexSortedIds(filter, typeFilter, sortKey)) {
      const sp = SPECIES[id];
      const kills = save.dex[id] || 0;
      const rar = rarityOf(sp.rarity);
      const unlockLv = UNLOCK_AT[id];
      const canMeet = !kills && unlockLv != null && unlockLv <= save.unlocked;
      const el = document.createElement('div');
      el.className = 'card' + (kills ? '' : ' locked') + (canMeet ? ' dex-available' : '');
      el.style.borderColor = kills ? rar.color : (canMeet ? '#7cf5ff88' : undefined);
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const cc = cv.getContext('2d');
      cc.translate(32, 36);
      const sc = 22 / sp.size;
      cc.scale(sc, sc);
      if (kills) drawMonsterArt(cc, sp, sp.size, 1.3, false, false);
      else {
        cc.globalAlpha = 0.9;
        drawMonsterArt(cc, Object.assign({}, sp, { c1: '#20242e', c2: '#14161e' }), sp.size, 1.3, false, false);
      }
      el.appendChild(cv);
      const info = document.createElement('div');
      const hpB = rarityHpBonus(sp.rarity);
      const typeLbl = MONSTER_TYPE_LABEL[sp.type] || sp.type;
      const statRow = kills
        ? `<div class="dex-mini-row">${dexMiniStat('HP', sp.hp, DEX_REF_STATS.hp, '#6ee06e')}` +
          `${dexMiniStat('ATK', sp.dmg, DEX_REF_STATS.dmg, '#ff7a4d')}` +
          `${dexMiniStat('SPD', sp.speed, DEX_REF_STATS.speed, '#7cf5ff')}</div>`
        : '';
      const lockHint = kills
        ? ''
        : (canMeet
          ? `<div style="color:#7cf5ff;font-size:12px;margin-top:4px">Verschijnt in avontuur · unlock Lv ${unlockLv}</div>`
          : (unlockLv != null
            ? `<div style="opacity:.72;font-size:12px;margin-top:4px">Unlock Lv ${unlockLv}</div>`
            : ''));
      const petLine = PET_BY_SPECIES[id]
        ? `<div style="font-size:12px;margin-top:4px;color:${isPetTamed(PET_BY_SPECIES[id].id) ? '#7cf5ff' : '#8fa3d9'}">${petProgressLine(id)}</div>`
        : '';
      info.innerHTML = `<div class="cname">${kills ? sp.name : '???'} ${kills ? `<span class="rar-pill" style="color:${rar.color};border-color:${rar.color}">${rarityLabel(sp.rarity)}</span>` : ''}${id === topKillId ? ` <span class="rar-pill" style="color:#ffd75e;border-color:#ffd75e">${t('ui.topHunter')}</span>` : ''}</div>
        <div class="cinfo">${kills ? `${typeLbl} · basis HP ${sp.hp} · dmg ${sp.dmg} · spd ${sp.speed} · ${sp.xp} XP · Lv ${unlockLv || '?'}` : 'Nog niet verslagen'}</div>${lockHint}${petLine}${statRow}`;
      el.appendChild(info);
      const right = document.createElement('div');
      right.className = 'right';
      right.style.color = rar.color;
      right.innerHTML = kills ? `${kills}x verslagen<br>+${hpB} max HP` : (canMeet ? 'Speel avontuur' : '');
      el.appendChild(right);
      list.appendChild(el);
    }
  },

  renderPets() {
    const tab = this.petTab || 'dex';
    const bar = document.getElementById('petTabBar');
    if (bar) {
      bar.innerHTML =
        `<button type="button" class="dex-filter-btn${tab === 'dex' ? ' active' : ''}" data-pet-tab="dex">Dex · ${petTamedCount()}/${PET_ROSTER.length}</button>` +
        `<button type="button" class="dex-filter-btn${tab === 'egg' ? ' active' : ''}" data-pet-tab="egg">Ei arcade · ${eggOwnedCount()}/${EGG_ROSTER.length}</button>`;
      if (!bar.dataset.bound) {
        bar.dataset.bound = '1';
        bar.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-pet-tab]');
          if (!btn) return;
          AudioSys.sfx('select');
          UI.petTab = btn.getAttribute('data-pet-tab') || 'dex';
          UI.renderPets();
        });
      }
    }
    const dexPanel = document.getElementById('petDexPanel');
    const eggPanel = document.getElementById('petEggPanel');
    if (dexPanel) dexPanel.style.display = tab === 'dex' ? '' : 'none';
    if (eggPanel) eggPanel.style.display = tab === 'egg' ? '' : 'none';
    if (tab === 'egg') {
      this.renderEggPets();
      return;
    }
    this.renderDexPets();
  },

  renderDexPets() {
    const sumEl = document.getElementById('petSummary');
    if (sumEl) {
      const tamed = petTamedCount();
      const active = activePetDef();
      const wallet = petCoinsBalance();
      sumEl.style.display = 'block';
      sumEl.innerHTML =
        `Getemd <b>${tamed}/${PET_ROSTER.length}</b> · actief <b>${active ? SPECIES[active.speciesId].name : 'geen'}</b>` +
        ` · <b>${wallet} pet coins</b>` +
        `<div style="margin-top:6px;font-size:12px;opacity:.85">Speel <b>Mats</b> voor pet coins (2 gouden munten = 1 🪙). Koop pets hier, of tem via kills in het monsterboek. Pets volgen je in avontuur & training.</div>`;
    }
    const list = document.getElementById('petList');
    if (!list) return;
    list.innerHTML = '';
    for (const def of PET_ROSTER) {
      const sp = SPECIES[def.speciesId];
      if (!sp) continue;
      const rar = rarityOf(sp.rarity);
      const kills = save.dex[def.speciesId] || 0;
      const need = petKillNeed(def.speciesId);
      const tamed = isPetTamed(def.id);
      const active = save.activePet === def.id;
      const cost = petCoinCost(def.id);
      const canBuy = canBuyPetWithCoins(def.id);
      const el = document.createElement('div');
      el.className = 'card' + (tamed ? '' : ' locked') + (active ? ' sel' : '') + (canBuy ? ' dex-available' : '');
      el.style.borderColor = tamed ? rar.color : undefined;
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const cc = cv.getContext('2d');
      cc.translate(32, 38);
      cc.scale(0.55, 0.55);
      if (tamed) drawMonsterArt(cc, sp, sp.size, 1.2, false, false);
      else {
        cc.globalAlpha = 0.45;
        drawMonsterArt(cc, Object.assign({}, sp, { c1: '#20242e', c2: '#14161e' }), sp.size, 1.2, false, false);
      }
      el.appendChild(cv);
      const info = document.createElement('div');
      const badge = active ? ' <span class="rar-pill" style="color:#7cf5ff;border-color:#7cf5ff">ACTIEF</span>' : '';
      info.innerHTML = `<div class="cname">${sp.name} <span class="rar-pill" style="color:${rar.color};border-color:${rar.color}">${rarityLabel(sp.rarity)}</span>${badge}</div>` +
        `<div class="cinfo">${def.perk}</div>` +
        `<div class="cinfo" style="opacity:.78;font-size:12px;margin-top:3px">${tamed
          ? 'Getemd · assist in avontuur'
          : (canBuy
            ? `Kopen: ${cost} pet coins`
            : `Temmen: ${Math.min(kills, need)}/${need} kills · of ${cost} 🪙`)}</div>`;
      el.appendChild(info);
      const right = document.createElement('div');
      right.className = 'right';
      if (tamed) {
        right.innerHTML = active ? '&#10004; actief' : 'uitrusten';
      } else if (canBuy) {
        right.innerHTML = `kopen<br>${cost} 🪙`;
        right.style.color = '#ff9ad5';
      } else {
        right.textContent = kills > 0 ? `${need - kills} kills` : `${cost} 🪙`;
        right.style.opacity = '0.7';
      }
      el.appendChild(right);
      if (tamed) {
        el.addEventListener('click', () => {
          if (!uiTapAllowed()) return;
          safeUiAction(() => {
            if (active) {
              equipPet(null);
              UI.toast(t('toast.petNone'), 1400);
            } else {
              equipPet(def.id);
              AudioSys.sfx('select');
              UI.toast(t('toast.petFollow', { name: sp.name }), 2200);
            }
            this.renderPets();
          }, 'equipPet/' + def.id, 'Pet kiezen mislukt');
        });
      } else if (canBuy) {
        el.addEventListener('click', () => {
          if (!uiTapAllowed()) return;
          safeUiAction(() => {
            const res = buyPetWithCoins(def.id);
            if (!res) {
              UI.toast(t('toast.petNoCoins'), 1800);
              return;
            }
            AudioSys.sfx('summon');
            UI.toast(t('toast.petBought', { name: sp.name }), 2600);
            this.renderPets();
          }, 'buyPet/' + def.id, 'Pet kopen mislukt');
        });
      }
      list.appendChild(el);
    }
  },

  renderEggPets() {
    ensureEggDaily();
    const sum = eggProgressSummary();
    const sumEl = document.getElementById('eggSummary');
    if (sumEl) {
      sumEl.style.display = 'block';
      sumEl.innerHTML =
        `Verzameld <b>${sum.owned}/${sum.total}</b> · actief <b>${sum.activeName}</b> · <b>${sum.daily}</b>` +
        `<div style="margin-top:6px;font-size:12px;opacity:.85">Cosmetisch — geen combat-boost. 1 dag-ei + bonus-ei na je eerste avontuur-win vandaag.</div>`;
    }
    const crackBtn = document.getElementById('eggCrackBtn');
    if (crackBtn) {
      const ready = canCrackDailyEgg();
      crackBtn.style.display = ready ? '' : 'none';
      crackBtn.innerHTML =
        `<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><ellipse cx="12" cy="13" rx="7" ry="9" fill="#ffd75e" opacity=".35"/><path d="M8 10c2-3 6-3 8 0"/></svg></span>` +
        `<div>Dag-ei openen<small>Gratis arcade-pull · vandaag</small></div>`;
      if (!crackBtn.dataset.bound) {
        crackBtn.dataset.bound = '1';
        crackBtn.addEventListener('click', () => {
          if (!uiTapAllowed()) return;
          safeUiAction(() => {
            const res = crackDailyEgg();
            if (!res) {
              UI.toast(t('toast.eggAlreadyOpened'), 2200);
              return;
            }
            try { AudioSys.sfx('diceRoll'); } catch (_) {}
            const rar = rarityOf(res.def.rarity);
            UI.toast(res.duplicate
              ? t('toast.eggDuplicateUi', { name: res.def.name })
              : t('toast.eggHatch', { name: res.def.name, rarity: rarityLabel(res.def.rarity) }), 3600);
            this.renderPets();
            this.renderMenu();
          }, 'crackDailyEgg', 'Ei openen mislukt');
        });
      }
    }
    const list = document.getElementById('eggList');
    if (!list) return;
    list.innerHTML = '';
    for (const def of EGG_ROSTER) {
      const rar = rarityOf(def.rarity);
      const owned = isEggOwned(def.id);
      const active = save.activeEggPet === def.id;
      const el = document.createElement('div');
      el.className = 'card' + (owned ? '' : ' locked') + (active ? ' sel' : '');
      el.style.borderColor = owned ? rar.color : undefined;
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const cc = cv.getContext('2d');
      cc.translate(32, 36);
      drawEggPetArt(cc, def, 18, 1.1, 0, 0, !owned);
      el.appendChild(cv);
      const info = document.createElement('div');
      const badge = active ? ' <span class="rar-pill" style="color:#ffd75e;border-color:#ffd75e">ACTIEF</span>' : '';
      info.innerHTML = `<div class="cname">${def.name} <span class="rar-pill" style="color:${rar.color};border-color:${rar.color}">${rarityLabel(def.rarity)}</span>${badge}</div>` +
        `<div class="cinfo">${def.perk}</div>` +
        `<div class="cinfo" style="opacity:.78;font-size:12px;margin-top:3px">${owned ? 'Cosmetisch metgezel' : 'Nog niet uitgekomen'}</div>`;
      el.appendChild(info);
      const right = document.createElement('div');
      right.className = 'right';
      if (owned) {
        right.innerHTML = active ? '&#10004; actief' : 'uitrusten';
      } else {
        right.textContent = '???';
        right.style.opacity = '0.7';
      }
      el.appendChild(right);
      if (owned) {
        el.addEventListener('click', () => {
          if (!uiTapAllowed()) return;
          safeUiAction(() => {
            if (active) {
              equipEggPet(null);
              UI.toast(t('toast.eggNone'), 1400);
            } else {
              equipEggPet(def.id);
              AudioSys.sfx('select');
              UI.toast(t('toast.eggFloat', { name: def.name }), 2200);
            }
            this.renderPets();
          }, 'equipEggPet/' + def.id, 'Ei-pet kiezen mislukt');
        });
      }
      list.appendChild(el);
    }
  },

  renderStyle() {
    const sumEl = document.getElementById('styleSummary');
    if (sumEl) {
      const unlocked = STYLES.filter(s => styleUnlocked(s)).length;
      const active = styleById(save.style || 'classic');
      sumEl.style.display = 'block';
      sumEl.innerHTML =
        `Outfits <b>${unlocked}/${STYLES.length}</b> · actief <b>${styleLabel(active)}</b>` +
        `<div style="margin-top:6px;font-size:12px;opacity:.85">Elke stijl heeft een eigen bonus — hover of lees de tooltip. Cosmetisch + lichte combat-perks.</div>`;
    }
    const grid = document.getElementById('styleGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (const st of STYLES) {
      const ok = styleUnlocked(st);
      const el = document.createElement('div');
      el.className = 'style-card' + (save.style === st.id ? ' sel' : '') + (ok ? '' : ' locked');
      el.style.borderColor = ok ? st.accent + '88' : '';
      el.title = styleLabel(st, 'tooltip') || styleLabel(st, 'hint') || styleLabel(st);
      const cv = document.createElement('canvas');
      cv.width = 72; cv.height = 72;
      const cc = cv.getContext('2d');
      cc.translate(36, 58); cc.scale(0.85, 0.85);
      const preview = new Fighter({ isPlayer: true, x: 0, y: 0, color: st.body, style: st, scale: 0.9 });
      preview.animT = 0.4;
      preview.draw(cc);
      el.appendChild(cv);
      const cap = document.createElement('div');
      cap.style.fontSize = '13px';
      cap.style.color = st.accent;
      cap.textContent = styleLabel(st);
      el.appendChild(cap);
      const bonus = document.createElement('div');
      bonus.style.fontSize = '11px';
      bonus.style.fontWeight = '800';
      bonus.style.color = ok ? '#7cf5ff' : '#8fa3d9';
      bonus.style.marginTop = '3px';
      bonus.textContent = styleCombatLine(st);
      bonus.style.opacity = ok ? '1' : '0.55';
      el.appendChild(bonus);
      const tip = document.createElement('div');
      tip.style.fontSize = '10px';
      tip.style.opacity = '0.72';
      tip.style.marginTop = '4px';
      tip.style.lineHeight = '1.35';
      tip.textContent = styleLabel(st, 'tooltip') || styleLabel(st, 'hint');
      el.appendChild(tip);
      const sub = document.createElement('div');
      sub.style.fontSize = '11px';
      sub.style.fontWeight = '600';
      sub.style.opacity = '0.75';
      sub.style.marginTop = '4px';
      sub.textContent = ok ? (save.style === st.id ? t('ui.styleActive') : t('ui.stylePick'))
        : (styleSkillGated(st) ? t('ui.styleIslandGate', { lvl: st.needLvl }) : styleLabel(st, 'hint'));
      el.appendChild(sub);
      if (ok) {
        el.addEventListener('click', () => {
          if (!uiTapAllowed()) return;
          safeUiAction(() => {
            save.style = st.id;
            if (!persistOrToast('stijl')) return;
            AudioSys.sfx('select');
            this.renderStyle();
            this.renderMenu();
            UI.toast(t('toast.styleEquipped', { name: styleLabel(st) }), 2200);
          }, 'pickStyle/' + st.id, 'Stijl kiezen mislukt');
        });
      }
      grid.appendChild(el);
    }
  },

  renderSettings() {
    renderLangSwitch();
    const verEl = document.getElementById('setAppVersion');
    if (verEl) {
      const fps = Perf.emaMs > 0 ? Math.round(1000 / Perf.emaMs) : 0;
      const perfNote = save.liteFx
        ? 'Lite FX'
        : (Perf.tier >= 2 ? `adaptief zwaar · ~${fps} fps` : Perf.tier >= 1 ? `adaptief · ~${fps} fps` : `vloeiend · ~${fps} fps`);
      verEl.textContent = `v${APP_VERSION} · SW v${SW_CACHE_REV} · ${perfNote}`;
    }
    const perfEl = document.getElementById('setPerfLine');
    if (perfEl) {
      const p = perfFxSummary();
      perfEl.textContent =
        `Perf tier ${p.tier} · DPR ${p.dpr.toFixed(2)}/${p.maxDpr} · ~${p.fps} fps · ` +
        `FX cap ${p.caps.particles} deeltjes / ${p.caps.floaters} floaters`;
    }
    const healthEl = document.getElementById('saveHealthLine');
    if (healthEl) {
      const h = saveHealthSummary();
      const sizeLine = (h.primaryBytes || h.backupBytes)
        ? ` · ~${formatSaveBytes(h.primaryBytes || h.backupBytes)}`
        : '';
      let statusPrimary = h.primaryCorrupt
        ? '⚠ Hoofd-save corrupt'
        : (h.primaryValid ? `${SVG_CHECK_MINI} Save OK` : (h.primaryOk ? '⚠ Save onleesbaar' : '⚠ Geen primary save'));
      if (h.drift && h.backupOk) {
        statusPrimary += h.driftDetail
          ? ` · ${h.driftDetail} — tik Herstel backup`
          : ' · hoofd/backup verschillen — tik Herstel backup';
      }
      if (h.backupCorrupt && h.backupOk === false && h.primaryValid) {
        statusPrimary += ' · backup corrupt (hoofd OK)';
      }
      let healthHtml =
        `<b>Lv ${h.lvl}</b> · unlock ${h.unlocked} · boek ${h.dex} · kills ${h.kills}` +
        (h.summons ? ` · ✦ ${h.summons} summon` : '') +
        (h.pets ? ` · pet ${h.pets}` : '') +
        (h.eggs ? ` · ei ${h.eggs}` : '') +
        `${sizeLine}<br>` +
        statusPrimary +
        (h.backupOk ? ` · ${SVG_CHECK_MINI} Backup (Lv ${h.backupLvl})` : ' · ⚠ Geen backup');
      if (h.drift && h.backupOk) {
        healthHtml += `<br><span style="opacity:.85;color:#ffd75e">Drift: ${h.driftDetail || 'hoofd ≠ backup'} — Herstel backup óf Sync backup</span>`;
      }
      if (h.saveAgeDays != null && h.saveAgeDays >= 14) {
        healthHtml += `<br><span style="opacity:.75;color:#ffb0b8">Laatste save ${h.saveAgeDays} dagen geleden — export als vangnet</span>`;
      }
      if (h.stampAt) {
        let stampLabel = '';
        try {
          const d = new Date(h.stampAt);
          if (!Number.isNaN(d.getTime())) {
            stampLabel = d.toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' });
          }
        } catch (_) {}
        if (stampLabel) {
          healthHtml += `<br><span style="opacity:.7">Laatst opgeslagen: ${stampLabel}</span>`;
        }
      }
      healthEl.innerHTML = healthHtml +
        `<br><span style="opacity:.75">Export schema v${h.exportSchema || SAVE_EXPORT_SCHEMA} · keys vast: ${SAVE_KEY} + backup (niet hernoemen)</span>`;
    }
    const exportHint = document.getElementById('saveExportHint');
    if (exportHint) {
      exportHint.textContent = `Export bevat: ${saveExportSummaryLine()} · key ${SAVE_KEY}`;
    }
    bindSavePortPreview();
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    const mPct = volPct(save.musicVol, 0.85);
    const sPct = volPct(save.sfxVol, 1);
    setVal('setMusicVol', mPct);
    setVal('setSfxVol', sPct);
    const lblM = document.getElementById('setMusicVolLbl');
    const lblS = document.getElementById('setSfxVolLbl');
    if (lblM) lblM.textContent = mPct + '%';
    if (lblS) lblS.textContent = sPct + '%';
    ['setShake', 'setHaptics', 'setComboHud', 'setBigTouch', 'setReducedMotion', 'setLiteFx', 'setHighContrast'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      const keys = ['shake', 'haptics', 'comboHud', 'bigTouch', 'reducedMotion', 'liteFx', 'highContrast'];
      const key = keys[i];
      let off = save[key] === false;
      if (key === 'reducedMotion') off = !save.reducedMotion && !systemPrefersReducedMotion();
      if (key === 'highContrast') off = !save.highContrast && !systemPrefersMoreContrast();
      el.classList.toggle('off', off);
    });
    document.getElementById('togMusic')?.classList.toggle('off', !save.music);
    document.getElementById('togSfx')?.classList.toggle('off', !save.sfx);
    const audioEl = document.getElementById('settingsAudioStatus');
    if (audioEl) {
      const base = audioMixStatusLine(state === 'pause');
      let sampleLine = t('settings.sfxSamplesLoad');
      if (AudioSys._samplesReady) sampleLine = t('settings.sfxSamplesOn') + ` (${AudioSys._sampleCount})`;
      else if (AudioSys._sampleLoadStarted && !AudioSys._sampleCount) sampleLine = t('settings.sfxSamplesOff');
      audioEl.textContent = base + ' · ' + sampleLine;
    }
    const a11yEl = document.getElementById('a11yStatusLine');
    if (a11yEl) a11yEl.textContent = a11yStatusText();
  },

  renderPauseToggles() {
    const togM = document.getElementById('pauseTogMusic');
    const togS = document.getElementById('pauseTogSfx');
    togM?.classList.toggle('off', !save.music);
    togS?.classList.toggle('off', !save.sfx);
    if (togM) togM.setAttribute('aria-pressed', save.music ? 'true' : 'false');
    if (togS) togS.setAttribute('aria-pressed', save.sfx ? 'true' : 'false');
    document.getElementById('togMusic')?.classList.toggle('off', !save.music);
    document.getElementById('togSfx')?.classList.toggle('off', !save.sfx);
    const pm = document.getElementById('pauseMusicVol');
    const ps = document.getElementById('pauseSfxVol');
    const pmL = document.getElementById('pauseMusicVolLbl');
    const psL = document.getElementById('pauseSfxVolLbl');
    const mPct = volPct(save.musicVol, 0.85);
    const sPct = volPct(save.sfxVol, 1);
    if (pm && document.activeElement !== pm) pm.value = String(mPct);
    if (ps && document.activeElement !== ps) ps.value = String(sPct);
    if (pmL) pmL.textContent = mPct + '%';
    if (psL) psL.textContent = sPct + '%';
    const statusEl = document.getElementById('pauseAudioStatus');
    if (statusEl) {
      let line = audioMixStatusLine(true);
      if (typeof navigator.onLine === 'boolean' && !navigator.onLine) {
        line += ' · Offline — save op dit apparaat';
      }
      statusEl.textContent = line;
    }
  },

  showResult(win, data) {
    this.lastResult = data;
    state = 'result';
    scheduleResize();
    document.getElementById('pauseBtn').classList.remove('show');
    const title = document.getElementById('resTitle');
    title.textContent = data.title;
    title.className = 'bigres ' + (win ? 'win' : 'lose');
    document.getElementById('resDetail').textContent = data.detail;
    document.getElementById('resXp').textContent = t('result.xp', {
      xp: data.xp, lvl: save.lvl, cur: save.xp, need: xpNeed(save.lvl),
    });
    const tipEl = document.getElementById('resTip');
    if (tipEl) tipEl.textContent = data.tip || '';
    const starsEl = document.getElementById('resStars');
    if (starsEl) {
      const n = win && data.stars ? data.stars : 0;
      starsEl.textContent = n ? '★'.repeat(n) + '☆'.repeat(3 - n) : '';
    }
    const nextBtn = document.getElementById('resNext');
    if (nextBtn) {
      nextBtn.style.display = (win && data.mode === 'adventure' && data.level < MAX_LEVEL) ? 'flex' : 'none';
    }
    const again = document.getElementById('resAgain');
    if (again) {
      const label = again.querySelector('div');
      if (label) {
        if (data.mode === 'versus') label.innerHTML = t('result.rematch') + '<small>' + t('result.rematchSub') + '</small>';
        else if (data.mode === 'training') label.innerHTML = t('result.again') + '<small>vs RabbitRobot</small>';
        else label.textContent = t('result.again');
      }
    }
    this.show('resultScreen');
    AudioSys.setPaused(false);
    playMenuBgm(true);
    AudioSys.applyVolumes();
  },
};

