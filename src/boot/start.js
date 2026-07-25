/* ============================ SPELSTART ================================ */
let state = 'menu';

function startGame(mode, opts) {
  opts = opts || {};
  const allowed = { adventure: 1, training: 1, wall: 1, versus: 1, coinrun: 1 };
  if (!allowed[mode]) {
    try { UI.toast('Onbekende modus', 2200); } catch (_) {}
    return;
  }
  window.__sfLoopErr = false;
  try { Input.releaseAll(); } catch (_) {}
  Input.dualMode = false;
  try { dismissTunnelOverlayIfStatic(); } catch (_) {}
  if (mode === 'versus') {
    try {
      opts.p1 = normalizeVsPick(opts.p1 || vsSelect.p1, 'ryu');
      opts.p2 = normalizeVsPick(opts.p2 || vsSelect.p2, 'ken');
    } catch (_) {
      opts.p1 = 'ryu'; opts.p2 = 'ken';
    }
  }
  try {
    game = new Game(mode, opts);
  } catch (err) {
    sfReportError('start/' + mode, err);
    recoverToMenu();
    return;
  }
  if (!game || !game.player) {
    sfReportError('start/' + mode, new Error('game incomplete'));
    recoverToMenu();
    return;
  }
  state = 'play';
  scheduleResize();
  try { AudioSys.setPaused(false); } catch (_) {}
  try { recordLastPlay(mode, opts); } catch (_) {}
  try { applyModeOnboarding(mode, game); } catch (_) {}
  try { UI.show(null); } catch (_) { syncPlayLayer(); }
  try {
    AudioSys.init();
    const modeSting = { adventure: 'modeAdventure', training: 'modeTraining', versus: 'modeVersus', wall: 'modeWall', coinrun: 'modeMats' };
    if (modeSting[mode]) AudioSys.sting(modeSting[mode]);
  } catch (_) {}
  try {
    if (mode === 'training') AudioSys.play('training');
    else if (mode === 'adventure') AudioSys.play(game.level && game.level.boss ? 'boss' : 'battle');
    else if (mode === 'versus') AudioSys.play('versus');
    else if (mode === 'coinrun') AudioSys.play('mats');
    else if (mode === 'wall') AudioSys.play('wall');
    else AudioSys.play('battle');
  } catch (_) {}
}

/** iPad: touchend + click zonder dubbel-vuur (preventDefault stopt ghost-click). */
function bindPress(el, handler) {
  if (!el || el.dataset.sfPressBound) return;
  el.dataset.sfPressBound = '1';
  let last = 0;
  const run = (e) => {
    const now = Date.now();
    if (now - last < 320) return;
    last = now;
    try { handler(e); } catch (err) {
      sfReportError('ui/' + (el.id || 'press'), err, 'Actie mislukt — probeer opnieuw');
    }
  };
  el.addEventListener('click', run);
  el.addEventListener('touchend', (e) => {
    if (!uiTapAllowed()) return;
    const t = e.changedTouches && e.changedTouches[0];
    if (t) {
      try {
        const top = document.elementFromPoint(t.clientX, t.clientY);
        if (top && top !== el && !el.contains(top)) return;
      } catch (_) {}
    }
    if (e.cancelable) e.preventDefault();
    run(e);
  }, { passive: false });
}

bindPress(document.getElementById('btnAdventure'), () => {
  AudioSys.init(); AudioSys.sfx('select'); UI.renderLevels(); UI.show('levelScreen');
});
document.querySelectorAll('[data-hub]').forEach((el) => {
  bindPress(el, () => {
    AudioSys.init(); AudioSys.sfx('select');
    const hub = el.dataset.hub;
    if (hub === 'adventure') {
      UI.renderLevels();
      UI.show('levelScreen');
    } else if (hub === 'versus') {
      UI.charPickStep = 1;
      UI.renderCharSelect();
      UI.show('charSelectScreen');
    } else {
      UI.openModeHub(hub);
    }
  });
});
bindPress(document.getElementById('menuProfileBar'), () => {
  AudioSys.init(); AudioSys.sfx('select');
  UI.renderMissions();
  UI.show('missionsScreen');
});
bindPress(document.getElementById('btnGambleGooiStart'), () => gokGooiStartFromScreen());
bindPress(document.getElementById('btnGambleSkip'), () => {
  AudioSys.sfx('select');
  startAdventureFromGamble(true);
});
document.querySelectorAll('[data-back-gamble]').forEach((b) => {
  bindPress(b, () => { AudioSys.sfx('select'); UI.show('levelScreen'); });
});
const btnContinue = document.getElementById('btnContinue');
bindPress(btnContinue, () => {
  AudioSys.init(); AudioSys.sfx('select');
  try {
    if (!resumeLastPlay()) userToast('Nog geen sessie — kies een modus', 2400);
  } catch (err) {
    sfReportError('resume', err, 'Verder spelen mislukt — kies een modus');
  }
});
bindPress(document.getElementById('btnTraining'), () => {
  AudioSys.init(); AudioSys.sfx('select'); startGame('training');
});
const btnVersus = document.getElementById('btnVersus');
bindPress(btnVersus, () => {
  AudioSys.init(); AudioSys.sfx('select');
  UI.charPickStep = 1;
  UI.renderCharSelect();
  UI.show('charSelectScreen');
});
const charPickBackP1 = document.getElementById('charPickBackP1');
bindPress(charPickBackP1, () => {
  AudioSys.sfx('select');
  UI.charPickStep = 1;
  UI.renderCharSelect();
});
bindPress(document.getElementById('btnWall'), () => {
  AudioSys.init(); AudioSys.sfx('select'); startGame('wall');
});
const btnMatsCoins = document.getElementById('btnMatsCoins');
bindPress(btnMatsCoins, () => {
  AudioSys.init(); AudioSys.sfx('select'); startGame('coinrun');
});
bindPress(document.getElementById('btnWeapons'), () => {
  AudioSys.init(); AudioSys.sfx('select'); UI.renderWeapons(); UI.show('weaponScreen');
});
bindPress(document.getElementById('btnPets'), () => {
  AudioSys.init(); AudioSys.sfx('select'); UI.renderPets(); UI.show('petScreen');
});
bindPress(document.getElementById('btnDex'), () => {
  AudioSys.init(); AudioSys.sfx('select'); UI.renderDex(); UI.show('dexScreen');
});
const btnStyle = document.getElementById('btnStyle');
bindPress(btnStyle, () => {
  AudioSys.init(); AudioSys.sfx('select'); UI.renderStyle(); UI.show('styleScreen');
});
const btnSettings = document.getElementById('btnSettings');
bindPress(btnSettings, () => {
  AudioSys.init(); AudioSys.sfx('select'); UI.renderSettings(); UI.renderHosting(); UI.show('settingsScreen');
});
const btnMissions = document.getElementById('btnMissions');
bindPress(btnMissions, () => {
  AudioSys.init(); AudioSys.sfx('select');
  UI.renderMissions();
  UI.show('missionsScreen');
  if (!save.missionsIntroSeen) {
    save.missionsIntroSeen = true;
    persist();
    setTimeout(() => UI.toast('Missies: Speel → claim XP → dagbonus — licht, geen grind', 4000), 280);
    return;
  }
  const n = claimableDailyTasks().length;
  if (n > 0) {
    setTimeout(() => UI.toast(n === 1 ? '1 missie klaar om te claimen' : `${n} missies klaar om te claimen`, 2600), 200);
  } else if (save.daily && save.daily.tasks.every(t => t.claimed) && !save.daily.dayBonusClaimed) {
    setTimeout(() => UI.toast('Dagbonus +80 XP staat klaar', 2600), 200);
  }
});
const dailyClaimAllBtn = document.getElementById('dailyClaimAllBtn');
if (dailyClaimAllBtn) dailyClaimAllBtn.addEventListener('click', () => {
  try {
    AudioSys.init(); AudioSys.sfx('select'); claimAllDailyReady();
  } catch (err) {
    sfReportError('claimAll', err, 'Claim mislukt — probeer opnieuw');
  }
});
const dailyBonusBtn = document.getElementById('dailyBonusBtn');
if (dailyBonusBtn) dailyBonusBtn.addEventListener('click', () => {
  try {
    AudioSys.sfx('select'); claimDailyDayBonus();
  } catch (err) {
    sfReportError('dayBonus', err, 'Dagbonus mislukt — probeer opnieuw');
  }
});
const btnCopyLink = document.getElementById('btnCopyLink');
if (btnCopyLink) btnCopyLink.addEventListener('click', () => copyPlayLink());
const btnOpenPlayLink = document.getElementById('btnOpenPlayLink');
if (btnOpenPlayLink) btnOpenPlayLink.addEventListener('click', () => {
  AudioSys.sfx('select');
  safeAsync((async () => {
    const url = await resolveSharePlayUrl();
    if (url) window.open(url, '_blank', 'noopener');
    else userToast('Geen speel-link gevonden — zie Instellingen', 2800);
  })(), 'openPlayLink', 'Link openen mislukt');
});
const btnExportSave = document.getElementById('btnExportSave');
if (btnExportSave) btnExportSave.addEventListener('click', () => {
  safeAsync((async () => {
    const ta = document.getElementById('savePortText');
    const json = exportSaveJson();
    if (ta) { ta.value = json; ta.focus(); ta.select(); }
    let clipped = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(json);
        clipped = true;
      }
    } catch (_) {}
    AudioSys.sfx('select');
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportSaveFilename();
      a.click();
      URL.revokeObjectURL(url);
    } catch (_) {}
    UI.toast(clipped
      ? `Save gekopieerd + download · ${saveExportSummaryLine()} (~${formatSaveBytes(json.length)})`
      : `Save in vak + download · ${saveExportSummaryLine()} (~${formatSaveBytes(json.length)})`, 3600);
    UI.renderSettings();
  })(), 'exportSave', 'Export mislukt — kopieer JSON handmatig uit het vak');
});
const btnImportSave = document.getElementById('btnImportSave');
if (btnImportSave) btnImportSave.addEventListener('click', () => {
  const ta = document.getElementById('savePortText');
  const previewEl = document.getElementById('saveImportPreview');
  if (!ta || !ta.value.trim()) {
    UI.toast('Plak eerst een save-JSON in het vak', 2600);
    return;
  }
  try {
    const { save: next, meta, warnings } = previewImportSave(ta.value);
    if (!window.__sfImportConfirm) {
      window.__sfImportConfirm = true;
      updateSaveImportPreview(ta.value);
      UI.toast('Import-preview — tik Import nogmaals om te laden', 3600);
      setTimeout(() => { window.__sfImportConfirm = false; }, 8000);
      return;
    }
    window.__sfImportConfirm = false;
    if (previewEl) { previewEl.style.display = 'none'; previewEl.textContent = ''; }
    importSaveJson(ta.value);
    AudioSys.sfx('win');
  } catch (e) {
    window.__sfImportConfirm = false;
    if (previewEl) { previewEl.style.display = 'none'; previewEl.textContent = ''; }
    UI.toast((e && e.message) ? e.message : 'Ongeldige save — controleer JSON', 3200);
  }
});
function bindSettingsControls() {
  const syncVolMute = (key) => {
    if (key === 'musicVol') {
      if ((Number(save.musicVol) || 0) <= 0.001 && save.music) AudioSys.setMusicOn(false);
      else if ((Number(save.musicVol) || 0) > 0.001 && !save.music) AudioSys.setMusicOn(true);
    } else if (key === 'sfxVol') {
      if ((Number(save.sfxVol) || 0) <= 0.001 && save.sfx) AudioSys.setSfxOn(false);
      else if ((Number(save.sfxVol) || 0) > 0.001 && !save.sfx) AudioSys.setSfxOn(true);
    }
  };
  const onVol = (id, lblId, key) => {
    const el = document.getElementById(id);
    if (!el || el.dataset.bound) return;
    el.dataset.bound = '1';
    const applyVol = () => {
      save[key] = clamp(el.value / 100, 0, 1);
      syncVolMute(key);
      persist();
      const pctStr = Math.round(save[key] * 100) + '%';
      const lbl = document.getElementById(lblId);
      if (lbl) lbl.textContent = pctStr;
      const pairs = key === 'musicVol'
        ? [['setMusicVol', 'setMusicVolLbl'], ['pauseMusicVol', 'pauseMusicVolLbl']]
        : [['setSfxVol', 'setSfxVolLbl'], ['pauseSfxVol', 'pauseSfxVolLbl']];
      for (const [sid, lid] of pairs) {
        if (sid === id) continue;
        const sib = document.getElementById(sid);
        const sibL = document.getElementById(lid);
        if (sib && document.activeElement !== sib) sib.value = Math.round(save[key] * 100);
        if (sibL) sibL.textContent = pctStr;
      }
      AudioSys.applyVolumes();
      if (state === 'pause') UI.renderPauseToggles();
      else if (UI.screens.includes('settingsScreen') && document.getElementById('settingsScreen')?.classList.contains('active')) {
        UI.renderSettings();
      }
    };
    el.addEventListener('input', applyVol);
    if (key === 'sfxVol') {
      el.addEventListener('change', () => {
        if (save.sfx && (Number(save.sfxVol) || 0) > 0.01) AudioSys.sfx('select');
      });
    }
  };
  onVol('setMusicVol', 'setMusicVolLbl', 'musicVol');
  onVol('setSfxVol', 'setSfxVolLbl', 'sfxVol');
  onVol('pauseMusicVol', 'pauseMusicVolLbl', 'musicVol');
  onVol('pauseSfxVol', 'pauseSfxVolLbl', 'sfxVol');
  const toggles = [
    ['setShake', 'shake'], ['setHaptics', 'haptics'], ['setComboHud', 'comboHud'],
    ['setBigTouch', 'bigTouch'], ['setReducedMotion', 'reducedMotion'],
    ['setLiteFx', 'liteFx'], ['setHighContrast', 'highContrast'],
  ];
  for (const [id, key] of toggles) {
    const el = document.getElementById(id);
    if (!el || el.dataset.bound) continue;
    el.dataset.bound = '1';
    el.addEventListener('click', () => {
      if (save[key] !== false) save[key] = false;
      else save[key] = true;
      if (key === 'reducedMotion' && save.reducedMotion) save.shake = false;
      if (key === 'liteFx') { Perf.reset(); lastResizeKey = ''; try { SceneryArt.clearCache(); } catch (_) {} scheduleResize(); AudioSys.applyVolumes(); }
      if (key === 'reducedMotion' || key === 'highContrast') refreshA11yUi();
      persist();
      UI.renderSettings();
      UI.syncTouchClass();
      relayoutTouchPads();
      if (key === 'bigTouch') scheduleResize();
      AudioSys.sfx('select');
      haptic(8);
    });
  }
}
const btnRestoreBackup = document.getElementById('btnRestoreBackup');
if (btnRestoreBackup) btnRestoreBackup.addEventListener('click', () => {
  safeUiAction(() => {
    AudioSys.sfx('select');
    if (!window.__sfBackupConfirm) {
      const h = saveHealthSummary();
      if (!h.backupOk) {
        UI.toast('Geen backup gevonden op dit apparaat', 3000);
        return;
      }
      window.__sfBackupConfirm = true;
      const driftHint = h.driftDetail || (h.drift ? ' (hoofd en backup verschillen)' : '');
      UI.toast(`Backup Lv ${h.backupLvl}${driftHint} — tik nogmaals om te herstellen`, 4500);
      setTimeout(() => { window.__sfBackupConfirm = false; }, 6000);
      return;
    }
    window.__sfBackupConfirm = false;
    if (restoreSaveFromBackup()) {
      UI.toast('Backup teruggezet — save + backup synchroon', 3000);
      UI.renderSettings();
    } else UI.toast('Backup herstellen mislukt — export save als je die hebt', 3200);
  }, 'restoreBackup', 'Backup herstellen mislukt');
});
const btnSyncBackup = document.getElementById('btnSyncBackup');
if (btnSyncBackup) btnSyncBackup.addEventListener('click', () => {
  safeUiAction(() => {
    AudioSys.sfx('select');
    if (!window.__sfSyncBackupConfirm) {
      window.__sfSyncBackupConfirm = true;
      UI.toast('Sync overschrijft backup met hoofd-save — tik nogmaals', 3800);
      setTimeout(() => { window.__sfSyncBackupConfirm = false; }, 5000);
      return;
    }
    window.__sfSyncBackupConfirm = false;
    if (syncBackupFromPrimary()) {
      UI.toast('Backup gesynchroniseerd met hoofd-save', 2800);
      UI.renderSettings();
    } else UI.toast('Sync mislukt — export save als vangnet', 3200);
  }, 'syncBackup', 'Backup sync mislukt');
});
const btnClearSave = document.getElementById('btnClearSave');
if (btnClearSave) btnClearSave.addEventListener('click', () => {
  safeUiAction(() => {
    if (!window.__sfClearConfirm) {
      window.__sfClearConfirm = true;
      UI.toast('Nogmaals tikken = voortgang wissen (backup blijft)', 3500);
      setTimeout(() => { window.__sfClearConfirm = false; }, 4000);
      return;
    }
    window.__sfClearConfirm = false;
    try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
    save = sanitizeSave(Object.assign({}, DEFAULT_SAVE));
    if (!persistOrToast('nieuwe start')) return;
    AudioSys.sfx('lose');
    UI.renderMenu();
    UI.toast('Nieuwe start — backup staat nog in Instellingen', 4000);
  }, 'clearSave', 'Reset mislukt — probeer opnieuw');
});
bindSettingsControls();
const btnHelp = document.getElementById('btnHelp');
bindPress(btnHelp, () => {
  AudioSys.init(); AudioSys.sfx('select');
  UI.renderHelp();
  UI.show('helpScreen');
});
function runForceFreshVersion() {
  AudioSys.init();
  AudioSys.sfx('select');
  const go = () => {
    if (typeof window.forceFreshVersion === 'function') return window.forceFreshVersion();
    const u = new URL(location.href);
    u.searchParams.set('fresh', String(Date.now()));
    location.replace(u.toString());
    return Promise.resolve();
  };
  safeAsync(go(), 'forceFresh', 'Cache legen mislukt — sluit tab en open opnieuw');
}
bindPress(document.getElementById('btnVerseVersie'), runForceFreshVersion);
bindPress(document.getElementById('btnForceFresh'), runForceFreshVersion);
const btnIslandHelp = document.getElementById('btnIslandHelp');
bindPress(btnIslandHelp, () => {
  AudioSys.sfx('select');
  UI.renderHelp();
  UI.show('helpScreen');
});
const helpOk = document.getElementById('helpOk');
bindPress(helpOk, () => { AudioSys.sfx('select'); UI.goMenu(); });
const btnGuvve = document.getElementById('btnGuvve');
if (btnGuvve) {
  const guvveLines = [
    'Guvvedukkie zegt: Vecht lekker door, koppie!',
    'Guvvedukkie: Bitte — pak RabbitRobot bij de oren! 🦆',
    'Guvvedukkie: Combo’s zijn lekker, net als koek. Hm.',
    'Guvvedukkie: Zet me in je app-lade… oh wacht, ik ben al hier.',
    'Guvvedukkie: QUAK — dat was mijn speciale aanval.',
  ];
  bindPress(btnGuvve, () => {
    AudioSys.init();
    AudioSys.sfx('bonus');
    UI.toast(choice(guvveLines), 3200);
  });
}
for (const b of document.querySelectorAll('[data-back]')) {
  bindPress(b, () => { UI.goBack(); });
}
for (const b of document.querySelectorAll('[data-back-home]')) {
  bindPress(b, () => { AudioSys.sfx('select'); UI.goMenu(); });
}
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const sub = UI.screens.some(sid => sid !== 'menuScreen' && document.getElementById(sid)?.classList.contains('active'));
  if (sub) { e.preventDefault(); UI.goBack(); }
});
bindPress(document.getElementById('togMusic'), () => {
  AudioSys.init();
  AudioSys.setMusicOn(!save.music);
  if (save.music) playMenuBgm(false);
  UI.renderMenu();
});
bindPress(document.getElementById('togSfx'), () => {
  AudioSys.init();
  AudioSys.setSfxOn(!save.sfx);
  AudioSys.sfx('select');
  UI.renderMenu();
});
const btnSharePlay = document.getElementById('btnSharePlay');
bindPress(btnSharePlay, () => {
  AudioSys.init(); AudioSys.sfx('select'); sharePlayLink();
});
bindPress(document.getElementById('pauseBtn'), () => {
  if (state === 'play') {
    try { Input.releaseAll(); } catch (_) {}
    state = 'pause';
    AudioSys.setPaused(true);
    UI.renderPauseToggles();
    UI.show('pauseScreen');
  }
});
const pauseTogMusic = document.getElementById('pauseTogMusic');
bindPress(pauseTogMusic, () => {
  AudioSys.init();
  AudioSys.setMusicOn(!save.music);
  // Mid-fight pause: keep battle/boss song — don't force menu BGM
  if (save.music && state === 'pause' && AudioSys.desiredSong) {
    AudioSys.play(AudioSys.desiredSong);
  } else if (save.music && state !== 'play' && state !== 'pause') {
    playMenuBgm(false);
  }
  UI.renderPauseToggles();
  AudioSys.sfx('select');
});
const pauseTogSfx = document.getElementById('pauseTogSfx');
bindPress(pauseTogSfx, () => {
  AudioSys.init();
  AudioSys.setSfxOn(!save.sfx);
  UI.renderPauseToggles();
  AudioSys.sfx('select');
});
bindPress(document.getElementById('pauseResume'), () => {
  state = 'play';
  AudioSys.setPaused(false);
  if (save.music && AudioSys.desiredSong) AudioSys.play(AudioSys.desiredSong);
  UI.show(null);
});
bindPress(document.getElementById('pauseQuit'), () => { UI.goMenu(); });
const pauseVsRestart = document.getElementById('pauseVsRestart');
if (pauseVsRestart) {
  bindPress(pauseVsRestart, () => {
    if (!game || game.mode !== 'versus') return;
    if (state !== 'play' && state !== 'pause') return;
    AudioSys.sfx('select');
    const p1 = game.p1Pick || vsSelect.p1;
    const p2 = game.p2Pick || vsSelect.p2;
    vsSelect.p1 = p1;
    vsSelect.p2 = p2;
    state = 'play';
    AudioSys.setPaused(false);
    UI.toast(`Herstart · ${vsRosterEntry(p1).name} vs ${vsRosterEntry(p2).name}`, 2400);
    startGame('versus', { p1, p2 });
  });
}
bindPress(document.getElementById('resAgain'), () => {
  const d = UI.lastResult;
  if (!d || !d.mode) return;
  AudioSys.sfx('select');
  if (d.mode === 'adventure') gokGooiStartLevel(d.level);
  else if (d.mode === 'versus') {
    const p1 = d.p1 || vsSelect.p1;
    const p2 = d.p2 || vsSelect.p2;
    vsSelect.p1 = p1;
    vsSelect.p2 = p2;
    UI.toast(`Rematch · ${vsRosterEntry(p1).name} vs ${vsRosterEntry(p2).name}`, 2600);
    startGame('versus', { p1, p2 });
  }
  else startGame(d.mode);
});
bindPress(document.getElementById('resNext'), () => {
  const d = UI.lastResult;
  if (!d || d.mode !== 'adventure' || !d.win) return;
  AudioSys.sfx('select');
  gokGooiStartLevel(Math.min(MAX_LEVEL, d.level + 1));
});
bindPress(document.getElementById('resMenu'), () => { UI.goMenu(); });

