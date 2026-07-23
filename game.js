'use strict';
/* =========================================================================
   STICKMAN FIGHTER — Monster Arena
   Stickman-vechtgame voor iPad (touch) en desktop (toetsenbord).
   Modi: Avontuur (50 levels), Training vs RabbitRobot, Versus 2P, Muur.
   Audio (sfx + bgm) is procedureel via Web Audio — rechtenvrij.
   ========================================================================= */

const TAU = Math.PI * 2;
const FX_CAP = { particles: 140, floaters: 28, projectiles: 48, banners: 5, afterimages: 12 };
const Perf = {
  tier: 0,
  emaMs: 16.7,
  frames: 0,
  tick(frameMs) {
    this.emaMs = this.emaMs * 0.9 + frameMs * 0.1;
    this.frames++;
    if (save.liteFx) {
      if (this.tier !== 1) { this.tier = 1; scheduleResize(); }
      return;
    }
    if (this.frames % 40 !== 0) return;
    const prev = this.tier;
    if (this.emaMs > 24) this.tier = Math.min(2, this.tier + 1);
    else if (this.emaMs < 17.5 && this.tier > 0) this.tier -= 1;
    if (prev !== this.tier) scheduleResize();
  },
  reset() { this.tier = 0; this.emaMs = 16.7; this.frames = 0; },
};
function fxCaps() {
  let mul = 1;
  if (save.liteFx) mul = 0.55;
  else if (Perf.tier >= 2) mul = 0.42;
  else if (Perf.tier >= 1) mul = 0.68;
  if (typeof motionReduced === 'function' && motionReduced()) mul *= 0.62;
  const floor = { particles: 24, floaters: 8, projectiles: 16, banners: 2, afterimages: 4 };
  const out = {};
  for (const k of Object.keys(FX_CAP)) {
    out[k] = Math.max(floor[k] || 2, Math.floor(FX_CAP[k] * mul));
  }
  return out;
}
function maxCanvasDpr() {
  const rm = typeof motionReduced === 'function' && motionReduced();
  if (save.liteFx || rm) return 1.25;
  if (Perf.tier >= 2) return 1;
  if (Perf.tier >= 1) return 1.35;
  return 2;
}
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const choice = arr => arr[Math.floor(Math.random() * arr.length)];

/* ============================== OPSLAG ================================= */
const SAVE_KEY = 'stickfighter_save_v1';
const SAVE_BACKUP_KEY = 'stickfighter_save_backup_v1';
const APP_VERSION = '1.9.7';
const DEFAULT_SAVE = { lvl: 1, xp: 0, unlocked: 1, weapon: 'vuist', dex: {},
  bestWall: 0, trainWins: 0, music: true, sfx: true, style: 'classic', stars: {},
  musicVol: 0.85, sfxVol: 1, shake: true, haptics: true, comboHud: true, bigTouch: true,
  reducedMotion: false, liteFx: false, highContrast: false, lastPlay: null, tipsSeen: {},
  stats: { kills: 0, advWins: 0, wallBestRun: 0, maxCombo: 0, pickups: 0, bossKills: 0, vsMatches: 0, vsWins: 0 },
  achievements: {}, daily: null, vsPlayedIds: [] };
const MAX_LEVEL = 50;
let save = loadSave();

function loadSave() {
  const parsed = readSaveJson(localStorage.getItem(SAVE_KEY));
  if (parsed) return parsed;
  const backup = readSaveJson(localStorage.getItem(SAVE_BACKUP_KEY));
  if (backup) {
    window.__sfRecoveredBackup = true;
    return backup;
  }
  return Object.assign({}, DEFAULT_SAVE);
}

function readSaveJson(raw) {
  try {
    if (!raw || raw.length > 200000) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const merged = Object.assign({}, DEFAULT_SAVE, parsed);
    merged.stats = Object.assign({}, DEFAULT_SAVE.stats, parsed.stats || {});
    merged.achievements = Object.assign({}, parsed.achievements || {});
    merged.stars = Object.assign({}, parsed.stars || {});
    merged.dex = Object.assign({}, parsed.dex || {});
    return merged;
  } catch (e) {
    return null;
  }
}

function persist() {
  try {
    if (!save || typeof save !== 'object') return false;
    const json = JSON.stringify(save);
    if (json.length > 180000) {
      if (!window.__sfPersistWarn) {
        window.__sfPersistWarn = true;
        try { UI.toast('Save bijna te groot — export in Instellingen', 4800); } catch (_) {}
      }
    }
    localStorage.setItem(SAVE_KEY, json);
    try { localStorage.setItem(SAVE_BACKUP_KEY, json); } catch (_) {}
    return true;
  } catch (e) {
    try { localStorage.setItem(SAVE_BACKUP_KEY, JSON.stringify(save)); } catch (_) {}
    if (!window.__sfPersistWarn) {
      window.__sfPersistWarn = true;
      try {
        if (typeof UI !== 'undefined' && UI.toast) {
          UI.toast('Opslaan mislukt — export save in Instellingen', 5200);
        }
      } catch (_) {}
    }
    return false;
  }
}

function safeCall(fn, label) {
  try { return fn(); } catch (err) {
    console.error('[Stickman]', label || 'safeCall', err);
    return undefined;
  }
}

function restoreSaveFromBackup() {
  const backup = readSaveJson(localStorage.getItem(SAVE_BACKUP_KEY));
  if (!backup) return false;
  save = sanitizeSave(backup);
  persist();
  checkAchievements();
  UI.renderMenu();
  if (UI.renderMissions) UI.renderMissions();
  return true;
}

/** Corrupte / gemanipuleerde saves veilig maken (localStorage + import). */
function sanitizeSave(s) {
  // Literal max — nooit TDZ op MAX_LEVEL (anders crashen alle click-handlers)
  const maxLevel = 50;
  const out = Object.assign({}, DEFAULT_SAVE, s);
  delete out._exportMeta;
  out.lvl = clamp(Math.floor(Number(out.lvl) || 1), 1, 500);
  out.xp = clamp(Math.floor(Number(out.xp) || 0), 0, 999999);
  out.unlocked = clamp(Math.floor(Number(out.unlocked) || 1), 1, maxLevel);
  out.trainWins = clamp(Math.floor(Number(out.trainWins) || 0), 0, 9999);
  out.bestWall = clamp(Math.floor(Number(out.bestWall) || 0), 0, 999999);
  out.musicVol = clamp(Number(out.musicVol), 0, 1);
  out.sfxVol = clamp(Number(out.sfxVol), 0, 1);
  out.music = out.music !== false;
  out.sfx = out.sfx !== false;
  out.shake = out.shake !== false;
  out.haptics = out.haptics !== false;
  out.comboHud = out.comboHud !== false;
  out.bigTouch = out.bigTouch !== false;
  out.reducedMotion = !!out.reducedMotion;
  out.liteFx = !!out.liteFx;
  out.highContrast = !!out.highContrast;
  out.tipsSeen = (out.tipsSeen && typeof out.tipsSeen === 'object') ? out.tipsSeen : {};
  if (out.lastPlay && typeof out.lastPlay === 'object') {
    const lp = out.lastPlay;
    if (!['adventure', 'training', 'wall', 'versus'].includes(lp.mode)) out.lastPlay = null;
    else {
      out.lastPlay = {
        mode: lp.mode,
        level: clamp(Math.floor(Number(lp.level) || 1), 1, maxLevel),
        p1: typeof lp.p1 === 'string' ? lp.p1.slice(0, 24) : undefined,
        p2: typeof lp.p2 === 'string' ? lp.p2.slice(0, 24) : undefined,
      };
    }
  } else out.lastPlay = null;
  if (!WEAPONS.some(w => w.id === out.weapon)) out.weapon = 'vuist';
  const stPick = STYLES.find(st => st.id === out.style) || STYLES[0];
  let styleOk = stPick.id === 'classic';
  if (stPick.needLvl && out.lvl >= stPick.needLvl) styleOk = true;
  if (stPick.needTrain && out.trainWins >= stPick.needTrain) styleOk = true;
  if (stPick.needDex && Object.keys(out.dex).length >= stPick.needDex) styleOk = true;
  if (!styleOk) out.style = 'classic';

  const cleanStars = {};
  for (const [k, v] of Object.entries(out.stars || {})) {
    const n = parseInt(k, 10);
    if (n >= 1 && n <= maxLevel) cleanStars[n] = clamp(Math.floor(Number(v) || 0), 0, 3);
  }
  out.stars = cleanStars;

  // Bewaar kill-counts (Jager-prestatie); clamp corrupte waarden — nooit hard op 1 zetten
  const cleanDex = {};
  for (const [k, v] of Object.entries(out.dex || {})) {
    if (!SPECIES[k]) continue;
    const n = Math.floor(Number(v) || 0);
    if (n > 0) cleanDex[k] = clamp(n, 1, 999999);
  }
  out.dex = cleanDex;

  out.stats = Object.assign({}, DEFAULT_SAVE.stats, out.stats || {});
  for (const key of Object.keys(DEFAULT_SAVE.stats)) {
    out.stats[key] = clamp(Math.floor(Number(out.stats[key]) || 0), 0, 9999999);
  }

  const cleanAch = {};
  for (const [k, v] of Object.entries(out.achievements || {})) {
    if (ACHIEVEMENTS.some(a => a.id === k) && typeof v === 'string') cleanAch[k] = v.slice(0, 32);
  }
  out.achievements = cleanAch;

  if (out.daily && typeof out.daily === 'object') {
    const dk = typeof out.daily.date === 'string' ? out.daily.date.slice(0, 10) : todayKey();
    const tasks = Array.isArray(out.daily.tasks) ? out.daily.tasks : [];
    out.daily = {
      date: dk,
      tasks: tasks.filter(t => t && dailyDef(t.id)).map(t => ({
        id: t.id,
        progress: clamp(Math.floor(Number(t.progress) || 0), 0, 99999),
        done: !!t.done,
        claimed: !!t.claimed,
      })).slice(0, 5),
      dayBonusClaimed: !!out.daily.dayBonusClaimed,
    };
  } else {
    out.daily = null;
  }
  if (!Array.isArray(out.vsPlayedIds)) out.vsPlayedIds = [];
  out.vsPlayedIds = out.vsPlayedIds.filter(id => typeof id === 'string' && VS_ROSTER.some(r => r.id === id)).slice(0, 32);
  return out;
}
function haptic(ms) {
  if (!save.haptics) return;
  try { if (navigator.vibrate) navigator.vibrate(ms || 14); } catch (e) {}
}

const PICKUP_TYPES = ['heal', 'rage', 'chakra', 'shield'];
const PICKUP_META = {
  heal:   { color: '#6ee06e', label: '+HP' },
  rage:   { color: '#ff7a4d', label: 'RAGE' },
  chakra: { color: '#7cf5ff', label: 'CHAKRA' },
  shield: { color: '#9fd8ff', label: 'SCHILD' },
};

/* ===================== DAGELIJKSE MISSIES & PRESTATIES ================= */
const DAILY_DEFS = [
  { id: 'kills12', type: 'kills', goal: 12, xp: 45, text: 'Versla 12 monsters' },
  { id: 'advwin', type: 'advWin', goal: 1, xp: 55, text: 'Win 1 avontuur-level' },
  { id: 'wall35', type: 'wallBricks', goal: 35, xp: 40, text: 'Sloop 35 muurstenen' },
  { id: 'trainwin', type: 'trainWin', goal: 1, xp: 60, text: 'Win training vs Robot' },
  { id: 'combo5', type: 'comboReach', goal: 5, xp: 35, text: 'Bereik combo ×5' },
  { id: 'pick3', type: 'pickups', goal: 3, xp: 30, text: 'Pak 3 power-ups' },
  { id: 'boss1', type: 'bossKill', goal: 1, xp: 50, text: 'Versla 1 baas-monster' },
];
const ACHIEVEMENTS = [
  { id: 'first_win', name: 'Eerste triomf', desc: 'Win je eerste level', icon: '🏆',
    test: s => s.stats.advWins >= 1 },
  { id: 'lv10', name: 'Groeiende ninja', desc: 'Bereik vechter Lv 10', icon: '⬆️',
    test: s => s.lvl >= 10 },
  { id: 'dex10', name: 'Monsterkenner', desc: '10 soorten in monsterboek', icon: '📖',
    test: s => Object.keys(s.dex).length >= 10 },
  { id: 'dexFull', name: 'Encyclopedie', desc: 'Alle monster-soorten ontdekt', icon: '📚',
    test: s => Object.keys(s.dex).length >= SPECIES_ORDER.length },
  { id: 'dex100', name: 'Jager', desc: '100 monster-kills geregistreerd', icon: '🎯',
    test: s => {
      let n = 0;
      for (const v of Object.values(s.dex || {})) n += v || 0;
      return n >= 100;
    } },
  { id: 'train5', name: 'Robotbreker', desc: '5× training gewonnen', icon: '🤖',
    test: s => s.trainWins >= 5 },
  { id: 'wall100', name: 'Sloper', desc: 'Muurrecord 100+', icon: '🧱',
    test: s => s.bestWall >= 100 },
  { id: 'combo8', name: 'Combo-koning', desc: 'Combo ×8 bereikt', icon: '⚡',
    test: s => s.stats.maxCombo >= 8 },
  { id: 'lv50', name: 'Legende', desc: 'Unlock level 50', icon: '👑',
    test: s => s.unlocked >= 50 },
  { id: 'daily7', name: 'Vastberaden', desc: '7 dagen dagbonus geclaimd', icon: '📅',
    test: s => (s.stats.dailyBonusCount || 0) >= 7 },
  { id: 'vs5', name: 'Duelist', desc: '5× 2-speler duel gespeeld', icon: '🥊',
    test: s => (s.stats.vsMatches || 0) >= 5 },
  { id: 'vs_roster', name: 'Vol roster', desc: 'Speel met 10+ verschillende vechters (2P)', icon: '🎭',
    test: s => (s.vsPlayedIds || []).length >= 10 },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function ensureDaily() {
  const dk = todayKey();
  if (!save.daily || save.daily.date !== dk) {
    const order = [...DAILY_DEFS].sort((a, b) => {
      const h = (s) => { let x = 0; for (let i = 0; i < s.length; i++) x = (x * 33 + s.charCodeAt(i)) | 0; return x; };
      return h(dk + a.id) - h(dk + b.id);
    });
    save.daily = {
      date: dk,
      tasks: order.slice(0, 3).map(d => ({ id: d.id, progress: 0, done: false, claimed: false })),
      allClaimed: false,
      dayBonusClaimed: false,
    };
    persist();
  }
  return save.daily;
}
function dailyDef(id) { return DAILY_DEFS.find(d => d.id === id); }

function bumpDaily(type, amount) {
  ensureDaily();
  let changed = false;
  for (const t of save.daily.tasks) {
    if (t.done) continue;
    const def = dailyDef(t.id);
    if (!def || def.type !== type) continue;
    if (type === 'comboReach' || type === 'wallBricks') {
      t.progress = Math.max(t.progress, amount);
    } else {
      t.progress += amount;
    }
    if (t.progress >= def.goal) { t.progress = def.goal; t.done = true; changed = true; UI.toast(`Missie klaar: ${def.text}`, 2800); }
    else changed = true;
  }
  if (changed) { persist(); checkAchievements(); if (UI.renderMissions) UI.renderMissions(); }
}

function claimableDailyTasks() {
  ensureDaily();
  return save.daily.tasks.filter(t => t.done && !t.claimed && dailyDef(t.id));
}

function claimDailyTask(taskId, opts) {
  opts = opts || {};
  ensureDaily();
  const t = save.daily.tasks.find(x => x.id === taskId);
  const def = dailyDef(taskId);
  if (!t || !def || !t.done || t.claimed) return 0;
  t.claimed = true;
  grantMetaXP(def.xp);
  if (!opts.silent) {
    AudioSys.sfx('bonus');
    UI.toast(`+${def.xp} XP · ${def.text}`, 2600);
  }
  persist();
  if (!opts.skipRefresh) {
    checkDailyAllBonus();
    UI.renderMissions();
  }
  return def.xp;
}

function claimAllDailyReady() {
  ensureDaily();
  const ready = claimableDailyTasks();
  if (!ready.length) {
    UI.toast('Nog geen missie klaar om te claimen', 2400);
    return;
  }
  let total = 0;
  for (const t of ready) total += claimDailyTask(t.id, { silent: true, skipRefresh: true });
  AudioSys.sfx('bonus');
  persist();
  checkDailyAllBonus();
  UI.renderMissions();
  UI.renderMenu();
  UI.toast(ready.length === 1
    ? `+${total} XP geclaimd`
    : `${ready.length} missies · +${total} XP`, 3200);
}

function claimDailyDayBonus() {
  ensureDaily();
  if (save.daily.dayBonusClaimed) {
    UI.toast('Dagbonus al geclaimd — morgen weer 3 nieuwe', 2800);
    return;
  }
  const left = save.daily.tasks.filter(t => !t.claimed).length;
  if (left > 0) {
    UI.toast(left === 1
      ? 'Nog 1 missie claimen voor de dagbonus'
      : `Nog ${left} missies claimen voor +80 XP dagbonus`, 3000);
    return;
  }
  save.daily.dayBonusClaimed = true;
  save.stats.dailyBonusCount = (save.stats.dailyBonusCount || 0) + 1;
  grantMetaXP(80);
  AudioSys.sfx('win');
  persist();
  checkAchievements();
  UI.renderMissions();
  UI.renderMenu();
  UI.toast('Dagbonus! +80 XP · tot morgen', 3400);
}

function grantMetaXP(n) {
  save.xp += n;
  while (save.xp >= xpNeed(save.lvl)) {
    save.xp -= xpNeed(save.lvl);
    save.lvl++;
    AudioSys.sfx('levelup');
  }
  persist();
  UI.renderMenu();
}

function checkDailyAllBonus() {
  ensureDaily();
  if (save.daily.tasks.every(t => t.claimed) && !save.daily.dayBonusClaimed) {
    UI.toast('Alles geclaimd — tik Dagbonus (+80 XP)', 3500);
  }
}

function dailyStatusLine() {
  ensureDaily();
  const tasks = save.daily.tasks;
  const done = tasks.filter(t => t.done).length;
  const claimed = tasks.filter(t => t.claimed).length;
  const ready = tasks.filter(t => t.done && !t.claimed).length;
  const achN = Object.keys(save.achievements).length;
  if (save.daily.dayBonusClaimed) {
    return `Vandaag klaar · ${achN}/${ACHIEVEMENTS.length} prestaties · morgen nieuwe missies`;
  }
  if (ready > 0) {
    return `Claim klaar: ${ready}× XP · ${done}/3 gedaan · ${achN}/${ACHIEVEMENTS.length} prestaties`;
  }
  if (claimed === 3) {
    return `3/3 geclaimd — pak dagbonus (+80 XP) · ${achN}/${ACHIEVEMENTS.length} prestaties`;
  }
  return `Vandaag: ${done}/3 klaar · ${claimed}/3 geclaimd · ${achN}/${ACHIEVEMENTS.length} prestaties`;
}

function unlockAchievement(id) {
  if (save.achievements[id]) return;
  save.achievements[id] = todayKey();
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  persist();
  AudioSys.sfx('newmonster');
  UI.toast(`${ach ? ach.icon : '🎖'} Prestatie: ${ach ? ach.name : id}`, 4000);
  if (UI.renderMissions) UI.renderMissions();
}

function checkAchievements() {
  for (const ach of ACHIEVEMENTS) {
    if (!save.achievements[ach.id] && ach.test(save)) unlockAchievement(ach.id);
  }
}

function bumpStat(key, n) {
  save.stats[key] = (save.stats[key] || 0) + (n || 1);
  persist();
}

function trackCombo(n) {
  if (n > (save.stats.maxCombo || 0)) save.stats.maxCombo = n;
  bumpDaily('comboReach', n);
}

function exportSaveJson() {
  const payload = Object.assign({}, sanitizeSave(save), {
    _exportMeta: {
      app: APP_VERSION,
      exportedAt: new Date().toISOString(),
      key: SAVE_KEY,
      note: 'Stickman Fighter save — plak in Instellingen → Import',
    },
  });
  return JSON.stringify(payload, null, 2);
}

function saveHealthSummary() {
  let backupOk = false;
  let backupLvl = null;
  try {
    const b = readSaveJson(localStorage.getItem(SAVE_BACKUP_KEY));
    if (b) {
      backupOk = true;
      backupLvl = clamp(Math.floor(Number(b.lvl) || 1), 1, 500);
    }
  } catch (_) {}
  let primaryOk = false;
  try { primaryOk = !!localStorage.getItem(SAVE_KEY); } catch (_) {}
  return {
    primaryOk,
    backupOk,
    backupLvl,
    lvl: save.lvl,
    unlocked: save.unlocked,
    dex: dexCount(),
    kills: dexTotalKills(),
  };
}

function previewImportSave(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Plak eerst save-JSON in het vak');
  if (text.length > 120000) throw new Error('Save te groot of ongeldig');
  let parsed;
  try { parsed = JSON.parse(text); } catch (_) {
    throw new Error('Geen geldige JSON — controleer plaksel');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Ongeldige save-structuur');
  }
  const meta = parsed._exportMeta;
  delete parsed._exportMeta;
  const clean = sanitizeSave(Object.assign({}, DEFAULT_SAVE, parsed));
  clean.stats = Object.assign({}, DEFAULT_SAVE.stats, parsed.stats || {});
  clean.achievements = Object.assign({}, parsed.achievements || {});
  clean.stars = Object.assign({}, parsed.stars || {});
  clean.dex = Object.assign({}, parsed.dex || {});
  const final = sanitizeSave(clean);
  return { save: final, meta };
}
function sfReportError(where, err) {
  console.error('[Stickman]', where, err);
  const now = Date.now();
  if (!window.__sfErrToastT || now - window.__sfErrToastT > 4500) {
    window.__sfErrToastT = now;
    try { UI.toast('Er ging iets mis — terug naar menu', 4500); } catch (_) {}
  }
}
function syncPlayLayer() {
  const el = document.getElementById('game');
  if (!el) return;
  const canvasHits = state === 'play' && !!game;
  el.style.pointerEvents = canvasHits ? 'auto' : 'none';
  el.style.visibility = canvasHits ? 'visible' : 'hidden';
  document.body.classList.toggle('is-playing', canvasHits);
}

function ensureMenuScreenActive() {
  if (state !== 'menu') return;
  const active = document.querySelector('.screen.active');
  if (!active) {
    try { UI.show('menuScreen'); } catch (_) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('menuScreen')?.classList.add('active');
      syncPlayLayer();
    }
  }
}

function dismissTunnelOverlayIfStatic() {
  const o = document.getElementById('tunnelBootOverlay');
  if (!o) return;
  o.hidden = true;
  o.setAttribute('hidden', '');
  o.style.cssText = 'display:none!important;pointer-events:none!important;visibility:hidden!important';
  try { o.remove(); } catch (_) {}
}

function recoverToMenu() {
  try {
    game = null;
    state = 'menu';
    window.__sfLoopErr = false;
    Input.dualMode = false;
    try { Input.layout(W, H); } catch (_) {}
    try { if (InputP2) InputP2.layout(W, H); } catch (_) {}
    document.body.classList.remove('is-playing');
    syncPlayLayer();
    try { UI.goMenu(); } catch (_) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('menuScreen')?.classList.add('active');
      const pb = document.getElementById('pauseBtn');
      if (pb) pb.classList.remove('show');
    }
    try { AudioSys.play('menu'); } catch (_) {}
  } catch (err) {
    console.error('[Stickman] recoverToMenu', err);
    state = 'menu';
    game = null;
    syncPlayLayer();
  }
}
function importSaveJson(text) {
  const { save: next } = previewImportSave(text);
  save = next;
  persist();
  checkAchievements();
  UI.renderMenu();
  if (UI.renderMissions) UI.renderMissions();
  if (UI.renderSettings) UI.renderSettings();
  UI.toast(`Save geïmporteerd · Lv ${save.lvl} · level ${save.unlocked}`, 3200);
}

function recordLastPlay(mode, opts) {
  opts = opts || {};
  const lp = { mode };
  if (mode === 'adventure') lp.level = opts.level || (game && game.level && game.level.n) || save.unlocked;
  if (mode === 'versus') { lp.p1 = opts.p1 || vsSelect.p1; lp.p2 = opts.p2 || vsSelect.p2; }
  save.lastPlay = lp;
  persist();
}

function resumeLastPlay() {
  const lp = save.lastPlay;
  if (!lp || !lp.mode) return false;
  if (lp.mode === 'adventure') startGame('adventure', { level: lp.level || 1 });
  else if (lp.mode === 'versus') startGame('versus', { p1: lp.p1, p2: lp.p2 });
  else startGame(lp.mode);
  return true;
}

function vsFighterStats(entry) {
  const hp = Math.round(100 * entry.hpMul);
  const spd = Math.round(100 * entry.spdMul);
  const dmg = Math.round(100 * entry.dmgMul);
  let special = 'Rasengan';
  if (entry.isRobot) special = 'Robot-AI';
  else if (entry.special === 'chidori') special = 'Chidori';
  return { hp, spd, dmg, wpn: weaponById(entry.weapon).name, special };
}
function vsStatBar(label, pct, color) {
  const p = Math.min(100, Math.max(6, pct));
  return `<div class="vs-stat-col"><span class="vs-stat-l">${label}</span>` +
    `<span class="vs-stat-track"><i style="width:${p}%;background:${color}"></i></span></div>`;
}
function vsStatPreviewHtml(e1, e2) {
  const s1 = vsFighterStats(e1);
  const s2 = vsFighterStats(e2);
  const col = (name, s, accent) =>
    `<div class="vs-preview-col" style="--accent:${accent}"><div class="vs-preview-name">${name}</div>` +
    `<div class="vs-preview-wpn">${s.wpn} · ${s.special}</div>` +
    `${vsStatBar('HP', s.hp, '#6ee06e')}${vsStatBar('SPD', s.spd, '#7cf5ff')}` +
    `${vsStatBar('DMG', s.dmg, '#ff7a4d')}</div>`;
  return `<div class="vs-preview-duo">${col(e1.name, s1, '#7cf5ff')}` +
    `<div class="vs-preview-vs">VS</div>${col(e2.name, s2, '#ffb0b8')}</div>`;
}

function copyPlayLink() {
  const go = async () => {
    const url = await resolveSharePlayUrl();
    try {
      await navigator.clipboard.writeText(url);
      UI.toast('Vaste speel-link gekopieerd!', 2800);
    } catch (_) {
      UI.toast(url, 4500);
    }
  };
  go();
}

async function loadHostingBundle() {
  const [hosting, liveTxt] = await Promise.all([
    fetch('./hosting.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
    fetch('./LIVE-LINK.txt?t=' + Date.now(), { cache: 'no-store' }).then(r => r.text()).catch(() => ''),
  ]);
  const liveLine = (liveTxt || '').split('\n').find(l => l.startsWith('https://'));
  return { hosting, liveUrl: liveLine ? liveLine.trim() : '' };
}

function pickStablePlayUrl(hosting) {
  const j = hosting || {};
  return j.primary || j.githubPages || j.stable || '';
}

async function resolveSharePlayUrl() {
  if (location.hostname.endsWith('.github.io')) {
    return location.href.split('?')[0].split('#')[0];
  }
  const { hosting, liveUrl } = await loadHostingBundle();
  const stable = pickStablePlayUrl(hosting);
  if (stable) return stable;
  if (liveUrl && !liveUrl.includes('loca.lt')) return liveUrl;
  if (location.protocol !== 'file:') return location.href.split('?')[0].split('#')[0];
  return liveUrl || headLiveFromPage();
}

function headLiveFromPage() {
  if (location.protocol === 'file:') return '';
  return location.origin + location.pathname.replace(/\/[^/]*$/, '/');
}

function ensureTipsSeen() {
  if (!save.tipsSeen || typeof save.tipsSeen !== 'object') save.tipsSeen = {};
}

function showModeOnboarding(mode) {
  ensureTipsSeen();
  const key = 'mode_' + mode;
  if (save.tipsSeen[key]) return;
  const msgs = {
    adventure: 'Avontuur: groen=HP · oranje=rage · blauw=chakra/schild · vol chakra → 🌀',
    training: 'Training: ontwijk lasers · vol chakra → 🌀 · 2 rondes winnen',
    wall: 'Muur: combo = sneller sloop · beat je record vóór timer 0',
    versus: '2 spelers: P1 links · P2 rechts · liggend iPad · best-of-3',
  };
  if (!msgs[mode]) return;
  save.tipsSeen[key] = 1;
  if (mode === 'adventure' || mode === 'training') save.tipsSeen.chakra = 1;
  persist();
  setTimeout(() => UI.toast(msgs[mode], 4400), 900);
}

function playModeHint(g, mode) {
  if (!g) return;
  ensureTipsSeen();
  const key = 'hint_' + mode;
  if (save.tipsSeen[key]) return;
  save.tipsSeen[key] = 1;
  persist();
  const touch = IS_TOUCH;
  const lines = {
    adventure: touch
      ? 'Eerste minuut: links joystick · rechts slaan · pak groene bolletjes'
      : 'Eerste minuut: A/D lopen · J/K/L slaan · groene bol = HP',
    training: touch
      ? 'Eerste minuut: ontwijk · vol chakra-balk → tik 🌀'
      : 'Eerste minuut: ontwijk · chakra vol → U (speciaal)',
    wall: touch
      ? 'Eerste minuut: sla snel achter elkaar · combo telt mee'
      : 'Eerste minuut: combo = meer schade per steen',
    versus: touch
      ? 'Eerste minuut: P1 linker helft · P2 rechter helft'
      : 'Eerste minuut: P1 WASD+JKL · P2 pijltjes+123',
  };
  g.modeHintLine = lines[mode] || lines.adventure;
  g.hint = 7.5;
}

function maybeWelcomeToast() {
  ensureTipsSeen();
  if (save.tipsSeen.welcome) return;
  save.tipsSeen.welcome = 1;
  persist();
  setTimeout(() => {
    UI.toast('Welkom! Kies Avontuur of Training · ❓ Tips = volledige uitleg', 4800);
  }, 1400);
}

const xpNeed = lvl => 60 + (lvl - 1) * 40;
const dexCount = () => Object.keys(save.dex).length;
const dexTotalKills = () => {
  let n = 0;
  for (const id of Object.keys(save.dex)) n += save.dex[id] || 0;
  return n;
};
const MONSTER_TYPE_LABEL = {
  hop: 'Hups', fly: 'Vlieg', charge: 'Charge', shoot: 'Schiet', tank: 'Tank', dragon: 'Draak',
};
const DEX_REF_STATS = { hp: 420, dmg: 28, speed: 150 };
function dexMiniStat(label, val, max, color) {
  const pct = Math.min(100, Math.round((val / max) * 100));
  return `<span class="dex-mini-stat" title="${label} ${val}"><span class="dex-mini-l">${label}</span>` +
    `<span class="dex-mini-track"><i style="width:${pct}%;background:${color}"></i></span></span>`;
}
function dexHpBonus() {
  let bonus = 0;
  for (const id of Object.keys(save.dex)) {
    const sp = SPECIES[id];
    if (sp) bonus += rarityHpBonus(sp.rarity);
  }
  return bonus;
}
function playerStats() {
  return {
    maxhp: 100 + (save.lvl - 1) * 12 + dexHpBonus(),
    dmg: 10 + (save.lvl - 1) * 2 + Math.floor(rarityOf(weaponById(save.weapon).rarity).order * 0.5),
  };
}

/* ============================ RARITEITEN =============================== */
const RARITIES = {
  common:    { id: 'common',    name: 'Gewoon',     color: '#9db1e3', glow: 'rgba(157,177,227,.35)', order: 0 },
  uncommon:  { id: 'uncommon',  name: 'Ongewoon',   color: '#5ad06a', glow: 'rgba(90,208,106,.4)',  order: 1 },
  rare:      { id: 'rare',      name: 'Zeldzaam',   color: '#4a9fff', glow: 'rgba(74,159,255,.45)', order: 2 },
  epic:      { id: 'epic',      name: 'Episch',     color: '#b06ae0', glow: 'rgba(176,106,224,.5)', order: 3 },
  legendary: { id: 'legendary', name: 'Legendarisch', color: '#ffd75e', glow: 'rgba(255,215,94,.55)', order: 4 },
  mythic:    { id: 'mythic',    name: 'Mythisch',   color: '#ff6b9d', glow: 'rgba(255,107,157,.6)', order: 5 },
};
const rarityOf = id => RARITIES[id] || RARITIES.common;
const rarityHpBonus = r => ({ common: 3, uncommon: 5, rare: 8, epic: 12, legendary: 18, mythic: 25 }[r] || 5);

/* ============================== WAPENS ================================= */
const WEAPONS = [
  { id: 'vuist',     name: 'Vuisten',         dmg: 1.0, range: 38, speed: 1.0,  unlock: 1,  rarity: 'common',    desc: 'Taijutsu basics' },
  { id: 'kunai',     name: 'Kunai',           dmg: 1.35, range: 52, speed: 1.15, unlock: 2,  rarity: 'common',    desc: 'Klassieke ninja-mes' },
  { id: 'shuriken',  name: 'Shuriken',        dmg: 1.25, range: 64, speed: 1.35, unlock: 3,  rarity: 'common',    desc: 'Gooit scherpe sterren' },
  { id: 'zwaard',    name: 'Ninja-zwaard',    dmg: 1.55, range: 58, speed: 0.95, unlock: 5,  rarity: 'uncommon',  desc: 'Kenjutsu alleskunner' },
  { id: 'knuppel',   name: 'Knuppel',         dmg: 1.8, range: 50, speed: 0.72, unlock: 7,  rarity: 'uncommon',  desc: 'Rauwe slagkracht' },
  { id: 'speer',     name: 'Speer',           dmg: 1.6, range: 78, speed: 0.8,  unlock: 10, rarity: 'uncommon',  desc: 'Enorm bereik' },
  { id: 'nunchaku',  name: 'Nunchaku',        dmg: 1.3, range: 48, speed: 1.4,  unlock: 13, rarity: 'rare',      desc: 'Bliksemsnel' },
  { id: 'boemerang', name: 'Boemerang',       dmg: 1.7, range: 70, speed: 1.05, unlock: 16, rarity: 'rare',      desc: 'Komt terug' },
  { id: 'hamer',     name: 'Mokerhamer',      dmg: 2.6, range: 52, speed: 0.55, unlock: 20, rarity: 'epic',      desc: 'Sloopt alles' },
  { id: 'ketting',   name: 'Kettingzwaard',   dmg: 2.1, range: 68, speed: 0.95, unlock: 24, rarity: 'epic',      desc: 'Bereik + druk' },
  { id: 'laser',     name: 'Chakra-kling',    dmg: 2.3, range: 62, speed: 1.15, unlock: 28, rarity: 'legendary', desc: 'Blauw brandende kling' },
  { id: 'donder',    name: 'Bliksem-bijl',    dmg: 2.8, range: 58, speed: 0.7,  unlock: 34, rarity: 'legendary', desc: 'Als Chidori, maar een bijl' },
  { id: 'void',      name: 'Voidklaauw',      dmg: 2.5, range: 64, speed: 1.25, unlock: 40, rarity: 'mythic',    desc: 'Mythische klauw' },
  { id: 'guvve',     name: 'Guvvedukkie-stok', dmg: 3.1, range: 66, speed: 1.0, unlock: 48, rarity: 'mythic',  desc: 'Quak. Bitte. Boom.' },
];
const weaponById = id => WEAPONS.find(w => w.id === id) || WEAPONS[0];

/* ============================== STIJLEN ================================ */
const STYLES = [
  { id: 'classic', name: 'Klassiek', body: '#f2f5ff', accent: '#3db8ff', bandana: null,
    needLvl: 1, hint: 'Standaard ninja' },
  { id: 'konoha', name: 'Konoha bandana', body: '#f2f5ff', accent: '#43b25b', bandana: '#2d6b36', plate: '#dfe8ff',
    needLvl: 5, hint: 'Unlock op Lv 5' },
  { id: 'chakra', name: 'Chakra gloed', body: '#e8f4ff', accent: '#7cf5ff', bandana: '#3db8ff', glow: true,
    needTrain: 3, hint: 'Win 3× training' },
  { id: 'akatsuki', name: 'Rode mantel', body: '#1a1424', accent: '#e04f4f', bandana: '#e04f4f', coat: true,
    needLvl: 12, hint: 'Unlock op Lv 12' },
  { id: 'shadow', name: 'Schaduw-ninja', body: '#8fa3d9', accent: '#b06ae0', bandana: '#2a1840',
    needLvl: 15, hint: 'Unlock op Lv 15' },
  { id: 'guvve', name: 'Guvvedukkie', body: '#43b25b', accent: '#ffe259', bandana: '#2a8a38', duck: true,
    needDex: 8, hint: '8 monsters in boek' },
  { id: 'gold', name: 'Legendarisch', body: '#ffd75e', accent: '#c97a20', bandana: '#ffb830', glow: true,
    needLvl: 25, hint: 'Unlock op Lv 25' },
  { id: 'sand', name: 'Woestijn', body: '#e8c98a', accent: '#c97a20', bandana: '#8a6030',
    needLvl: 8, hint: 'Unlock op Lv 8' },
  { id: 'samurai', name: 'Samurai', body: '#2a2a35', accent: '#e04f4f', bandana: '#1a1a22', topknot: true,
    needLvl: 20, hint: 'Unlock op Lv 20' },
  { id: 'cyber', name: 'Cyber-ninja', body: '#1a2040', accent: '#7cf5ff', bandana: '#4ecf6a', visor: true,
    needLvl: 18, hint: 'Unlock op Lv 18' },
  { id: 'fox', name: 'Vossen-ninja', body: '#ff8c42', accent: '#ffe259', bandana: '#d05a1e', fox: true,
    needDex: 12, hint: '12 monsters in boek' },
  { id: 'storm', name: 'Stormgeest', body: '#dfe8ff', accent: '#6fd7ff', bandana: '#2a7fc0', glow: true,
    needTrain: 5, hint: 'Win 5× training' },
  { id: 'void', name: 'Void-waker', body: '#2a1840', accent: '#ff6b9d', bandana: '#5a1040', coat: true,
    needLvl: 40, hint: 'Unlock op Lv 40' },
  { id: 'hunter', name: 'Jagerlook', body: '#6b5344', accent: '#5ad06a', bandana: '#3d5c32', hunter: true,
    needDexKills: 75, hint: '75 kills in monsterboek' },
];
const styleById = id => STYLES.find(s => s.id === id) || STYLES[0];
function styleUnlocked(st) {
  if (st.id === 'classic') return true;
  if (st.needLvl && save.lvl >= st.needLvl) return true;
  if (st.needTrain && save.trainWins >= st.needTrain) return true;
  if (st.needDex && dexCount() >= st.needDex) return true;
  if (st.needDexKills && dexTotalKills() >= st.needDexKills) return true;
  return false;
}
function applyPlayerStyle(fighter) {
  const st = styleById(save.style || 'classic');
  if (!styleUnlocked(st)) { save.style = 'classic'; persist(); }
  fighter.color = styleById(save.style).body;
  fighter.style = styleById(save.style);
  fighter.lineW = st.id === 'gold' ? 5 : 4.5;
}

/* ========================== VERSUS / 2 SPELERS ========================== */
const VS_ROSTER = [
  { id: 'hero', name: 'Stick Ninja', tag: 'Balanced', styleId: 'classic', weapon: 'kunai',
    hpMul: 1, spdMul: 1, dmgMul: 1, unlock: () => true },
  { id: 'konoha', name: 'Konoha', tag: 'Snel', styleId: 'konoha', weapon: 'shuriken',
    hpMul: 0.95, spdMul: 1.08, dmgMul: 0.95, unlock: () => styleUnlocked(STYLES.find(s => s.id === 'konoha')) },
  { id: 'shadow', name: 'Schaduw', tag: 'Chidori', styleId: 'shadow', weapon: 'zwaard',
    hpMul: 1, spdMul: 1, dmgMul: 1.05, special: 'chidori', unlock: () => save.lvl >= 15 },
  { id: 'gold', name: 'Legende', tag: 'Zwaar', styleId: 'gold', weapon: 'hamer',
    hpMul: 1.15, spdMul: 0.92, dmgMul: 1.12, unlock: () => save.lvl >= 25 },
  { id: 'chakra', name: 'Chakra', tag: 'Special spam', styleId: 'chakra', weapon: 'laser',
    hpMul: 0.9, spdMul: 1, dmgMul: 0.92, unlock: () => save.trainWins >= 3 },
  { id: 'guvve', name: 'Guvvedukkie', tag: 'Quak', styleId: 'guvve', weapon: 'guvve',
    hpMul: 1.08, spdMul: 0.98, dmgMul: 1.15, unlock: () => dexCount() >= 8 },
  { id: 'rabbit', name: 'RabbitRobot', tag: 'CPU-killer', styleId: null, weapon: 'vuist',
    hpMul: 1.05, spdMul: 1.05, dmgMul: 1.08, isRobot: true, special: 'chidori',
    unlock: () => save.trainWins >= 1 },
  { id: 'akatsuki', name: 'Akatsuki', tag: 'Mantel', styleId: 'akatsuki', weapon: 'ketting',
    hpMul: 1.1, spdMul: 0.96, dmgMul: 1.1, unlock: () => save.lvl >= 12 },
  { id: 'brawler', name: 'Barve', tag: 'Tank', styleId: 'classic', weapon: 'knuppel',
    hpMul: 1.2, spdMul: 0.88, dmgMul: 1.08, unlock: () => true },
  { id: 'sand', name: 'Woestijn', tag: 'Bereik', styleId: 'sand', weapon: 'speer',
    hpMul: 1, spdMul: 1.02, dmgMul: 1, unlock: () => save.lvl >= 8 },
  { id: 'speedster', name: 'Speedster', tag: 'Combo', styleId: 'konoha', weapon: 'nunchaku',
    hpMul: 0.9, spdMul: 1.12, dmgMul: 0.95, unlock: () => save.lvl >= 13 },
  { id: 'samurai', name: 'Samurai', tag: 'Kenjutsu', styleId: 'samurai', weapon: 'zwaard',
    hpMul: 1.05, spdMul: 0.98, dmgMul: 1.08, unlock: () => save.lvl >= 20 },
  { id: 'golem', name: 'Rotsbonk', tag: 'Muur', styleId: null, bodyColor: '#9a917f', weapon: 'hamer',
    hpMul: 1.32, spdMul: 0.78, dmgMul: 1.06, unlock: () => save.lvl >= 22 },
  { id: 'cyber', name: 'Cyber', tag: 'Laser', styleId: 'cyber', weapon: 'laser',
    hpMul: 0.92, spdMul: 1.06, dmgMul: 1.05, special: 'chidori', unlock: () => save.lvl >= 18 },
  { id: 'storm', name: 'Storm', tag: 'Bliksem', styleId: 'storm', weapon: 'donder',
    hpMul: 1, spdMul: 1.1, dmgMul: 0.98, special: 'chidori', unlock: () => save.trainWins >= 5 },
  { id: 'fox', name: 'Vlamvos', tag: 'Hit & run', styleId: 'fox', weapon: 'boemerang',
    hpMul: 0.88, spdMul: 1.14, dmgMul: 0.9, unlock: () => dexCount() >= 12 },
  { id: 'void', name: 'Void', tag: 'Mythic', styleId: 'void', weapon: 'void',
    hpMul: 1.12, spdMul: 1.04, dmgMul: 1.15, unlock: () => save.lvl >= 40 },
  { id: 'dragon', name: 'Kristallo', tag: 'Baas', styleId: 'gold', weapon: 'donder',
    hpMul: 1.08, spdMul: 0.94, dmgMul: 1.18, unlock: () => save.unlocked >= 45 },
];
const vsRosterEntry = id => VS_ROSTER.find(r => r.id === id) || VS_ROSTER[0];
function vsUnlocked(r) { return !r.unlock || r.unlock(); }
function normalizeVsPick(id, fallback) {
  const r = vsRosterEntry(id);
  if (r.id === id && vsUnlocked(r)) return id;
  const fb = vsRosterEntry(fallback);
  return vsUnlocked(fb) ? fallback : 'hero';
}
function trackVsRosterUse(p1, p2) {
  if (!Array.isArray(save.vsPlayedIds)) save.vsPlayedIds = [];
  for (const id of [p1, p2]) {
    if (VS_ROSTER.some(r => r.id === id) && !save.vsPlayedIds.includes(id)) {
      save.vsPlayedIds.push(id);
    }
  }
  if (save.vsPlayedIds.length > 32) save.vsPlayedIds = save.vsPlayedIds.slice(-32);
  persist();
  checkAchievements();
}

try {
  save = sanitizeSave(save);
  persist();
} catch (err) {
  console.error('[Stickman] boot sanitize', err);
  try { save = Object.assign({}, DEFAULT_SAVE); persist(); } catch (_) {}
}

function systemPrefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; }
}
function motionReduced() {
  return !!save.reducedMotion || systemPrefersReducedMotion();
}
function syncA11yClasses() {
  document.body.classList.toggle('reduced-motion', motionReduced());
  document.body.classList.toggle('high-contrast', !!save.highContrast || motionReduced());
}

function buildVsFighter(entry, x, slot) {
  const st = entry.styleId ? styleById(entry.styleId) : null;
  const hp = Math.round(100 * entry.hpMul);
  const f = new Fighter({
    isPlayer: true,
    playerSlot: slot,
    name: entry.name,
    x, y: (typeof H === 'number' && H > 0 ? H : 520) * 0.78,
    face: slot === 1 ? 1 : -1,
    hp, maxhp: hp,
    baseDmg: Math.round(12 * entry.dmgMul),
    speed: Math.round(260 * entry.spdMul),
    weapon: weaponById(entry.weapon),
    color: entry.bodyColor || (st ? st.body : '#b8c4d8'),
    style: st,
    isRobot: !!entry.isRobot,
    vsSpecial: entry.special || 'rasengan',
  });
  if (entry.isRobot) f.isRobot = true;
  f.energy = 35;
  return f;
}

function vsSpawnX(slot) {
  return W * (slot === 1 ? 0.28 : 0.72);
}

function resetVsFighterRound(f, entry, ground, slot) {
  const hp = Math.round(100 * entry.hpMul);
  f.hp = f.maxhp = hp;
  f.baseDmg = Math.round(12 * entry.dmgMul);
  f.x = vsSpawnX(slot);
  f.y = ground;
  f.vx = 0;
  f.vy = 0;
  f.onGround = true;
  f.face = slot === 1 ? 1 : -1;
  f.state = 'idle';
  f.animT = 0;
  f.attack = null;
  f.hurtT = 0;
  f.deadT = 0;
  f.blocking = false;
  f.blockT = 0;
  f.energy = 40;
  f.substCd = 0;
  f.invulnT = 0;
  f.hitFlashT = 0;
  f.afterimages = [];
  f.dashCd = 0;
}

let vsSelect = { p1: 'hero', p2: 'rabbit' };

/* ============================ MONSTERS ================================= */
const SPECIES = {
  slymo:     { name: 'Slymo',     art: 'slime',    size: 17, hp: 30,  dmg: 6,  speed: 60,  type: 'hop',    xp: 8,  rarity: 'common',    c1: '#5ad06a', c2: '#2e8f3c' },
  bubbel:    { name: 'Bubbel',    art: 'slime',    size: 15, hp: 28,  dmg: 5,  speed: 70,  type: 'hop',    xp: 9,  rarity: 'common',    c1: '#7cf5ff', c2: '#2f8fc0' },
  flapper:   { name: 'Flapper',   art: 'bat',      size: 14, hp: 24,  dmg: 5,  speed: 95,  type: 'fly',    xp: 9,  rarity: 'common',    c1: '#8a6cf0', c2: '#5a3fb0' },
  piepvleugel:{ name: 'Piepvleugel', art: 'bat',   size: 13, hp: 22,  dmg: 6,  speed: 115, type: 'fly',    xp: 10, rarity: 'uncommon',  c1: '#ff9ad5', c2: '#c04590' },
  stekelra:  { name: 'Stekelra',  art: 'hedgehog', size: 15, hp: 40,  dmg: 9,  speed: 70,  type: 'charge', xp: 12, rarity: 'uncommon',  c1: '#c98850', c2: '#8a5a30' },
  ijzerstek: { name: 'Ijzerstek', art: 'hedgehog', size: 16, hp: 52,  dmg: 11, speed: 65,  type: 'charge', xp: 16, rarity: 'rare',      c1: '#9fb2c8', c2: '#5f7189' },
  spooki:    { name: 'Spooki',    art: 'ghost',    size: 16, hp: 34,  dmg: 7,  speed: 55,  type: 'shoot',  xp: 13, rarity: 'uncommon',  c1: '#cfe6ff', c2: '#7aa8cf' },
  nachtwolk: { name: 'Nachtwolk', art: 'ghost',    size: 18, hp: 48,  dmg: 10, speed: 50,  type: 'shoot',  xp: 18, rarity: 'rare',      c1: '#6b5cff', c2: '#2e2266' },
  blikkert:  { name: 'Blikkert',  art: 'can',      size: 16, hp: 46,  dmg: 8,  speed: 45,  type: 'shoot',  xp: 14, rarity: 'uncommon',  c1: '#9fb2c8', c2: '#5f7189' },
  laserblik: { name: 'Laserblik', art: 'can',      size: 17, hp: 58,  dmg: 12, speed: 50,  type: 'shoot',  xp: 20, rarity: 'rare',      c1: '#ff6b6b', c2: '#8a2020' },
  vlamvos:   { name: 'Vlamvos',   art: 'fox',      size: 16, hp: 38,  dmg: 9,  speed: 130, type: 'charge', xp: 15, rarity: 'rare',      c1: '#ff8c42', c2: '#d05a1e' },
  stormvos:  { name: 'Stormvos',  art: 'fox',      size: 17, hp: 55,  dmg: 13, speed: 150, type: 'charge', xp: 24, rarity: 'epic',      c1: '#7cf5ff', c2: '#2a7fc0' },
  rotsbonk:  { name: 'Rotsbonk',  art: 'golem',    size: 25, hp: 95,  dmg: 14, speed: 30,  type: 'tank',   xp: 24, rarity: 'epic',      c1: '#9a917f', c2: '#6b6355' },
  magmabon:  { name: 'Magmabon',  art: 'golem',    size: 28, hp: 130, dmg: 18, speed: 28,  type: 'tank',   xp: 36, rarity: 'legendary', c1: '#ff7043', c2: '#8a2020' },
  vlamdraak: { name: 'Vlamdraak', art: 'dragon',   size: 30, hp: 170, dmg: 16, speed: 70,  type: 'dragon', xp: 48, rarity: 'legendary', c1: '#e04f4f', c2: '#93262b' },
  kristallo: { name: 'Kristallo', art: 'dragon',   size: 34, hp: 280, dmg: 20, speed: 85,  type: 'dragon', xp: 75, rarity: 'legendary', c1: '#6fd7ff', c2: '#2f7fc0' },
  schaduwvorst:{ name: 'Schaduwvorst', art: 'dragon', size: 36, hp: 340, dmg: 24, speed: 95, type: 'dragon', xp: 95, rarity: 'mythic', c1: '#2a1840', c2: '#b06ae0' },
  voidkonijn:{ name: 'Voidkonijn', art: 'fox',     size: 20, hp: 220, dmg: 22, speed: 140, type: 'charge', xp: 110, rarity: 'mythic',  c1: '#ff6b9d', c2: '#5a1040' },
  guvvedrak: { name: 'Guvvedrak', art: 'dragon',   size: 38, hp: 420, dmg: 28, speed: 100, type: 'dragon', xp: 140, rarity: 'mythic',  c1: '#ffe259', c2: '#43b25b' },
};
const SPECIES_ORDER = Object.keys(SPECIES).sort((a, b) =>
  (rarityOf(SPECIES[a].rarity).order - rarityOf(SPECIES[b].rarity).order) || SPECIES[a].name.localeCompare(SPECIES[b].name)
);

const WORLD_THEMES = [
  'veld','veld','veld','bos','bos',
  'bos','grot','grot','grot','vulkaan',
  'vulkaan','vulkaan','cyber','cyber','cyber',
  'dojo','dojo','grot','vulkaan','cyber',
  'veld','bos','grot','vulkaan','cyber',
  'dojo','sloop','cyber','vulkaan','grot',
  'cyber','cyber','vulkaan','dojo','cyber',
  'cyber','vulkaan','dojo','cyber','cyber',
  'cyber','vulkaan','dojo','cyber','cyber',
  'cyber','cyber','cyber','cyber','cyber',
];
const UNLOCK_AT = {
  slymo: 1, bubbel: 1, flapper: 2, piepvleugel: 5, stekelra: 3, ijzerstek: 9,
  spooki: 4, nachtwolk: 14, blikkert: 6, laserblik: 18, vlamvos: 8, stormvos: 22,
  rotsbonk: 10, magmabon: 28, vlamdraak: 15, kristallo: 25, schaduwvorst: 35,
  voidkonijn: 40, guvvedrak: 48,
};
const BOSS_AT = {
  5:  [{ sp: 'rotsbonk', elite: true }, { sp: 'slymo' }, { sp: 'bubbel' }],
  10: [{ sp: 'vlamdraak', elite: true }, { sp: 'vlamvos' }],
  15: [{ sp: 'kristallo', elite: true }, { sp: 'stormvos' }],
  20: [{ sp: 'magmabon', elite: true }, { sp: 'laserblik' }, { sp: 'nachtwolk' }],
  25: [{ sp: 'kristallo', elite: true }, { sp: 'vlamdraak', elite: true }],
  30: [{ sp: 'schaduwvorst', elite: true }, { sp: 'nachtwolk' }, { sp: 'stormvos' }],
  35: [{ sp: 'schaduwvorst', elite: true }, { sp: 'magmabon', elite: true }],
  40: [{ sp: 'voidkonijn', elite: true }, { sp: 'schaduwvorst' }],
  45: [{ sp: 'voidkonijn', elite: true }, { sp: 'guvvedrak' }],
  50: [{ sp: 'guvvedrak', elite: true }, { sp: 'voidkonijn', elite: true }, { sp: 'schaduwvorst', elite: true }],
};

function weightedPick(pool, n) {
  const weights = pool.map(id => {
    const o = rarityOf(SPECIES[id].rarity).order;
    return Math.max(0.3, 1.5 - o * 0.22 + Math.min(n, 45) * 0.012 * o);
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}
const STAR_HP = { three: 0.72, two: 0.38 };
function starsFromHpPct(hpPct) {
  if (hpPct > STAR_HP.three) return 3;
  if (hpPct > STAR_HP.two) return 2;
  return 1;
}
function starHintLine() {
  return `3★ >${Math.round(STAR_HP.three * 100)}% HP · 2★ >${Math.round(STAR_HP.two * 100)}% · 1★ = win`;
}
function applyHitStop(game, spec) {
  if (!game || motionReduced()) return;
  const base = spec.kind === 'special' ? 0.052 : spec.kind === 'kick' ? 0.038 : 0.026;
  game.freezeT = Math.max(game.freezeT, base);
}
function isBossWave(level, waveIdx) {
  return !!(level && level.boss && waveIdx === level.waves.length - 1);
}
function buildLevel(n) {
  const hpMul = 1 + (n - 1) * 0.14;
  const dmgMul = 1 + (n - 1) * 0.08;
  const maxRarity = n >= 45 ? 5 : n >= 32 ? 4 : n >= 20 ? 3 : n >= 10 ? 2 : n >= 4 ? 1 : 0;
  const fightPool = Object.keys(UNLOCK_AT).filter(id =>
    UNLOCK_AT[id] <= n && rarityOf(SPECIES[id].rarity).order <= maxRarity && id !== 'guvvedrak'
  );
  const pool = fightPool.length ? fightPool : ['slymo'];
  const waves = [];
  const waveCount = Math.min(2 + Math.floor(n / 5), 5);
  const perWave = Math.min(2 + Math.floor(n / 4), 6);
  for (let w = 0; w < waveCount; w++) {
    const list = [];
    for (let i = 0; i < perWave; i++) {
      const sp = weightedPick(pool, n);
      const rareElite = rarityOf(SPECIES[sp].rarity).order >= 3 && Math.random() < 0.14;
      list.push({ sp, elite: rareElite });
    }
    waves.push(list);
  }
  if (BOSS_AT[n]) waves.push(BOSS_AT[n].map(x => Object.assign({}, x)));
  const theme = WORLD_THEMES[n - 1] || 'cyber';
  const rarityCap = ['common','uncommon','rare','epic','legendary','mythic'][maxRarity];
  return { n, waves, hpMul, dmgMul, theme, boss: !!BOSS_AT[n], rarityCap };
}

/* =============================== AUDIO ================================= */
const AudioSys = {
  ctx: null, master: null, musicGain: null, sfxGain: null,
  desiredSong: null,
  song: null, step: 0, bar: 0, nextTime: 0,
  paused: false,

  init() {
    try {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.28;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.82;
      this.sfxGain.connect(this.master);
      if (!this._tickTimer) this._tickTimer = setInterval(() => {
        try { this.tick(); } catch (_) {}
      }, 40);
      if (this.desiredSong && save.music) this.play(this.desiredSong);
      this.applyVolumes();
    } catch (err) {
      console.warn('[Stickman] AudioSys.init', err);
      this.ctx = null;
    }
  },

  _setGain(g, v) {
    if (!g) return;
    try {
      const t = this.ctx ? this.ctx.currentTime : 0;
      if (g.gain.cancelScheduledValues) g.gain.cancelScheduledValues(t);
      if (g.gain.setTargetAtTime) g.gain.setTargetAtTime(v, t, 0.04);
      else g.gain.value = v;
    } catch (_) {
      try { g.gain.value = v; } catch (_) {}
    }
  },

  applyVolumes() {
    if (!this.musicGain || !this.sfxGain) return;
    const mv = save.music ? clamp(Number(save.musicVol) || 0.85, 0, 1) : 0;
    const sv = save.sfx ? clamp(Number(save.sfxVol) || 1, 0, 1) : 0;
    const id = (this.song && this.song.id) || this.desiredSong;
    let baseM = (id === 'menu') ? 0.24 : 0.32;
    // Duck BGM in pauze / result — SFX blijft hoorbaar voor UI
    if (this.paused || state === 'pause') baseM *= 0.26;
    else if (state === 'result') baseM *= 0.5;
    this._setGain(this.musicGain, baseM * mv);
    this._setGain(this.sfxGain, 0.82 * sv);
  },

  setPaused(on) {
    this.paused = !!on;
    this.applyVolumes();
    if (!on) {
      try { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); } catch (_) {}
      if (save.music && this.desiredSong) {
        if (!this.song || this.song.id !== this.desiredSong) this.play(this.desiredSong);
      }
    }
  },

  tone(f0, f1, dur, type, vol, out, when) {
    if (!this.ctx) return;
    const toMusic = out === this.musicGain;
    if (toMusic) {
      if (!save.music) return;
    } else {
      vol *= save.sfx ? clamp(Number(save.sfxVol) || 1, 0, 1) : 0;
    }
    if (vol <= 0.001) return;
    const t = (when != null ? when : this.ctx.currentTime);
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(20, f0), t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(out || this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  },

  noise(dur, vol, filterFreq, hp, out, when) {
    if (!this.ctx) return;
    const toMusic = out === this.musicGain;
    if (toMusic) {
      if (!save.music) return;
    } else {
      vol *= save.sfx ? clamp(Number(save.sfxVol) || 1, 0, 1) : 0;
    }
    if (vol <= 0.001) return;
    const t = (when != null ? when : this.ctx.currentTime);
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(out || this.sfxGain);
    src.start(t);
  },

  sfx(name) {
    if (!this.ctx || !save.sfx) return;
    const T = (f0,f1,d,ty,v,w) => this.tone(f0,f1,d,ty,v,null,w);
    const N = (d,v,ff,hp,w) => this.noise(d,v,ff,hp,null,w);
    const now = this.ctx.currentTime;
    switch (name) {
      case 'swing':   N(0.07, 0.25, 2800, true); T(340, 150, 0.08, 'sine', 0.12); break;
      case 'hit':     T(180, 55, 0.1, 'square', 0.28); N(0.05, 0.28, 900, false); T(90, 45, 0.06, 'sine', 0.12); break;
      case 'hit2':    T(130, 40, 0.16, 'square', 0.38); N(0.1, 0.38, 500, false); T(220, 80, 0.08, 'triangle', 0.15); break;
      case 'jump':    T(230, 540, 0.13, 'sine', 0.22); break;
      case 'land':    N(0.05, 0.2, 400, false); break;
      case 'hurt':    T(320, 110, 0.16, 'sawtooth', 0.25); break;
      case 'die':     T(420, 55, 0.4, 'sawtooth', 0.3); N(0.25, 0.3, 700, false); break;
      case 'shoot':   T(760, 210, 0.13, 'square', 0.2); break;
      case 'laser':   T(1500, 320, 0.16, 'sawtooth', 0.2); break;
      case 'explode': N(0.4, 0.55, 600, false); T(110, 30, 0.35, 'sine', 0.5); break;
      case 'brick':   N(0.13, 0.42, 1400, false); T(480, 190, 0.09, 'triangle', 0.22); break;
      case 'crack':   N(0.06, 0.22, 2000, false); break;
      case 'block':   T(880, 660, 0.09, 'square', 0.2); N(0.05, 0.2, 4500, true); break;
      case 'special':
      case 'rasengan':
        T(180, 880, 0.45, 'sawtooth', 0.18);
        T(420, 1400, 0.5, 'sine', 0.16);
        N(0.35, 0.18, 2800, true);
        break;
      case 'chidori':
        T(900, 1600, 0.35, 'sawtooth', 0.22);
        N(0.3, 0.2, 5000, true);
        break;
      case 'subst':
        N(0.12, 0.35, 900, false); T(300, 120, 0.1, 'triangle', 0.15); break;
      case 'shuriken':
        T(880, 440, 0.08, 'square', 0.15); N(0.04, 0.12, 4000, true); break;
      case 'roar':    T(95, 55, 0.5, 'sawtooth', 0.35); N(0.4, 0.25, 350, false); break;
      case 'select':  T(660, 880, 0.07, 'square', 0.14); break;
      case 'combo':
        T(520, 780, 0.08, 'square', 0.16, now);
        T(780, 980, 0.1, 'triangle', 0.14, now + 0.04);
        break;
      case 'dash':
        N(0.06, 0.18, 3200, true); T(420, 680, 0.09, 'sine', 0.14); break;
      case 'pickup':
        T(660, 990, 0.1, 'square', 0.18, now);
        T(990, 1320, 0.12, 'triangle', 0.14, now + 0.05);
        break;
      case 'bell':    T(1250, 1180, 0.7, 'triangle', 0.3); break;
      case 'bonus':   T(880, 1320, 0.14, 'square', 0.2); T(1320, 1760, 0.14, 'square', 0.2, now + 0.1); break;
      case 'levelup':
        [523, 659, 784, 1047].forEach((f, i) => T(f, f, 0.16, 'square', 0.22, now + i * 0.09));
        break;
      case 'newmonster':
        [392, 523, 659].forEach((f, i) => T(f, f, 0.14, 'triangle', 0.22, now + i * 0.08));
        break;
      case 'win':
        [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, f, 0.2, 'square', 0.2, now + i * 0.12));
        break;
      case 'lose':
        [392, 330, 262, 196].forEach((f, i) => T(f, f * 0.97, 0.25, 'sawtooth', 0.18, now + i * 0.16));
        break;
    }
  },

  /* --------- Muziek: procedurele chiptune-sequencer (rechtenvrij) ------- */
  play(name) {
    if (!name || !SONGS[name]) return;
    this.desiredSong = name;
    if (!this.ctx || !save.music) { this.applyVolumes(); return; }
    if (this.song && this.song.id === name) { this.applyVolumes(); return; }
    this.song = Object.assign({ id: name }, SONGS[name]);
    this.step = 0; this.bar = 0;
    this.nextTime = this.ctx.currentTime + 0.06;
    this.applyVolumes();
  },
  stop() { this.song = null; this.desiredSong = null; this.applyVolumes(); },
  setMusicOn(on) {
    save.music = !!on; persist();
    if (!on) this.song = null;
    else if (this.desiredSong) this.play(this.desiredSong);
    this.applyVolumes();
  },
  setSfxOn(on) {
    save.sfx = !!on; persist();
    this.applyVolumes();
  },

  tick() {
    if (!this.ctx || !this.song || !save.music) return;
    const s = this.song;
    const spb = 60 / s.bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.18) {
      this.scheduleStep(this.step, this.bar, this.nextTime, spb);
      this.nextTime += spb;
      this.step = (this.step + 1) % 16;
      if (this.step === 0) this.bar++;
    }
  },

  scheduleStep(i, bar, t, spb) {
    const s = this.song, mg = this.musicGain;
    const midi = n => 440 * Math.pow(2, (n - 69) / 12);
    if (s.kick.includes(i)) this.tone(150, 42, 0.12, 'sine', 0.85, mg, t);
    if (s.snare.includes(i)) this.noise(0.09, 0.3, 1600, true, mg, t);
    if (s.hat.includes(i)) this.noise(0.03, 0.14, 6500, true, mg, t);
    const b = s.bass[i];
    if (b != null) this.tone(midi(b), midi(b), spb * 1.7, 'triangle', 0.4, mg, t);
    const leadPat = s.lead[bar % s.lead.length];
    const L = leadPat[i];
    if (L != null) this.tone(midi(L), midi(L) * 0.995, spb * 1.6, 'square', 0.12, mg, t);
    if (s.id === 'menu' && i === 0 && bar % 2 === 0) {
      this.tone(midi(57), midi(57), spb * 3.8, 'sine', 0.06, mg, t);
    }
  },
};

const SONGS = {
  menu: {
    bpm: 96,
    kick: [0, 8], snare: [], hat: [2, 6, 10, 14],
    bass: [45,null,null,null, 48,null,null,null, 43,null,null,null, 40,null,43,null],
    lead: [
      [69,null,72,null, 76,null,72,null, 74,null,71,null, 69,null,64,null],
      [69,null,72,null, 76,null,79,null, 77,null,74,null, 72,null,71,null],
    ],
  },
  battle: {
    bpm: 138,
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [40,40,null,40, 43,null,40,null, 45,45,null,43, 40,null,38,null],
    lead: [
      [76,null,79,76, null,74,76,null, 71,null,74,71, null,69,71,74],
      [76,null,79,81, null,79,76,null, 74,null,76,74, 71,null,69,null],
    ],
  },
  boss: {
    bpm: 156,
    kick: [0, 4, 8, 12, 14], snare: [4, 12], hat: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    bass: [38,38,38,null, 39,null,38,null, 41,41,null,39, 38,null,36,null],
    lead: [
      [74,null,75,74, null,70,74,null, 77,null,75,74, null,72,70,null],
      [74,null,77,79, null,77,75,null, 74,null,72,70, 69,null,70,null],
    ],
  },
};

/* =============================== INPUT ================================= */
const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const JOY_DEAD_PX = 14;
const btnHitSlop = () => (typeof save !== 'undefined' && save.bigTouch !== false ? 14 : 10);

function makePad(side) {
  return {
    side,
    keys: {},
    pressed: {},
    joy: { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 },
    buttons: [],
    btnPointers: {},
    joyHome: { x: 110, y: 0 },
    lastMoveTap: 0,
    lastMoveDir: 0,
    get move() {
      let m = 0;
      if (this.side === 'p1') {
        if (this.keys['arrowleft'] || this.keys['a']) m -= 1;
        if (this.keys['arrowright'] || this.keys['d']) m += 1;
      } else {
        if (this.keys['arrowleft']) m -= 1;
        if (this.keys['arrowright']) m += 1;
      }
      if (this.joy.active) {
        const jx = this.joy.dx;
        if (Math.abs(jx) >= JOY_DEAD_PX) m += clamp(jx / 45, -1, 1);
      }
      return clamp(m, -1, 1);
    },
    press(action) { this.pressed[action] = true; },
    take(action) { const v = this.pressed[action]; this.pressed[action] = false; return !!v; },
    layout(W, H) {
      const r = 38, rs = 30;
      const scale = (typeof save !== 'undefined' && save.bigTouch !== false) ? 1.16 : 1;
      const R = Math.round(r * scale), Rs = Math.round(rs * scale);
      if (this.side === 'p1') {
        this.joyHome = { x: Math.min(120, W * 0.14), y: H - 105 };
        this.buttons = [
          { id: 'punch', x: W * 0.38, y: H - 82, r: R, label: '\u{1F44A}', color: '#e0533f' },
          { id: 'kick', x: W * 0.48, y: H - 108, r: R, label: '\u{1F9B6}', color: '#3f8fe0' },
          { id: 'weapon', x: W * 0.34, y: H - 168, r: R, label: '\u{1F52A}', color: '#9b59d0' },
          { id: 'special', x: W * 0.46, y: H - 188, r: R, label: '\u{1F300}', color: '#3db8ff' },
          { id: 'subst', x: W * 0.28, y: H - 148, r: Rs, label: '\u{1F4A8}', color: '#c9a66b' },
          { id: 'jump', x: W * 0.26, y: H - 68, r: Rs, label: '\u2B06\uFE0F', color: '#43b25b' },
        ];
      } else {
        this.joyHome = { x: W - Math.min(120, W * 0.14), y: H - 105 };
        this.buttons = [
          { id: 'punch', x: W - W * 0.38, y: H - 82, r: R, label: '\u{1F44A}', color: '#e0533f' },
          { id: 'kick', x: W - W * 0.48, y: H - 108, r: R, label: '\u{1F9B6}', color: '#3f8fe0' },
          { id: 'weapon', x: W - W * 0.34, y: H - 168, r: R, label: '\u{1F52A}', color: '#9b59d0' },
          { id: 'special', x: W - W * 0.46, y: H - 188, r: R, label: '\u{1F300}', color: '#3db8ff' },
          { id: 'subst', x: W - W * 0.28, y: H - 148, r: Rs, label: '\u{1F4A8}', color: '#c9a66b' },
          { id: 'jump', x: W - W * 0.26, y: H - 68, r: Rs, label: '\u2B06\uFE0F', color: '#43b25b' },
        ];
      }
    },
    hitButton(x, y) {
      const slop = btnHitSlop();
      for (const b of this.buttons) {
        if ((x - b.x) ** 2 + (y - b.y) ** 2 < (b.r + slop) ** 2) return b;
      }
      return null;
    },
    ownsTouch(x, y, dual) {
      if (!dual) return this.side === 'p1';
      const w = innerWidth;
      return this.side === 'p1' ? x < w * 0.5 : x >= w * 0.5;
    },
    onDown(x, y, id, dual) {
      if (!this.ownsTouch(x, y, dual)) return false;
      const b = this.hitButton(x, y);
      if (b) {
        this.btnPointers[id] = b.id;
        b.held = true;
        this.press(b.id);
        return true;
      }
      if (!this.joy.active) {
        this.joy.active = true;
        this.joy.id = id;
        this.joy.ox = x;
        this.joy.oy = y;
        this.joy.dx = 0;
        this.joy.dy = 0;
        return true;
      }
      return false;
    },
    onMove(x, y, id) {
      if (this.joy.active && this.joy.id === id) {
        let dx = clamp(x - this.joy.ox, -55, 55);
        let dy = clamp(y - this.joy.oy, -55, 55);
        if (Math.abs(dx) < JOY_DEAD_PX) dx = 0;
        if (Math.abs(dy) < JOY_DEAD_PX) dy = 0;
        this.joy.dx = dx;
        this.joy.dy = dy;
      }
    },
    onUp(id) {
      if (this.joy.active && this.joy.id === id) {
        const dx = this.joy.dx;
        if (Math.abs(dx) > 22) {
          const now = performance.now();
          const dir = Math.sign(dx);
          if (now - this.lastMoveTap < 320 && this.lastMoveDir === dir) this.press('dash');
          this.lastMoveTap = now;
          this.lastMoveDir = dir;
        }
        this.joy.active = false;
        this.joy.dx = 0;
        this.joy.dy = 0;
      }
      const bid = this.btnPointers[id];
      if (bid) {
        const b = this.buttons.find(q => q.id === bid);
        if (b) b.held = false;
        delete this.btnPointers[id];
      }
    },
  };
}

const Input = Object.assign(makePad('p1'), {
  dualMode: false,
  onDown(x, y, id) {
    AudioSys.init();
    if (this.dualMode) {
      if (InputP2.onDown(x, y, id, true)) return;
      if (makePad('p1').onDown.call(this, x, y, id, true)) return;
      return;
    }
    const slop = btnHitSlop();
    for (const b of this.buttons) {
      if ((x - b.x) ** 2 + (y - b.y) ** 2 < (b.r + slop) ** 2) {
        this.btnPointers[id] = b.id;
        b.held = true;
        this.press(b.id);
        return;
      }
    }
    if (x < innerWidth * 0.5 && !this.joy.active) {
      const nearBtn = this.buttons.some(b => (x - b.x) ** 2 + (y - b.y) ** 2 < (b.r + slop + 18) ** 2);
      if (nearBtn) return;
      this.joy.active = true;
      this.joy.id = id;
      this.joy.ox = x;
      this.joy.oy = y;
      this.joy.dx = 0;
      this.joy.dy = 0;
    }
  },
  onMove(x, y, id) {
    if (this.dualMode) InputP2.onMove(x, y, id);
    makePad('p1').onMove.call(this, x, y, id);
  },
  onUp(id) {
    if (this.dualMode) {
      InputP2.onUp(id);
      makePad('p1').onUp.call(this, id);
      return;
    }
    makePad('p1').onUp.call(this, id);
  },
  endFrame() {
    this.pressed = {};
    if (InputP2) InputP2.pressed = {};
  },
});

const InputP2 = makePad('p2');

Input.layout = function (W, H) {
  if (Input.dualMode) {
    makePad('p1').layout.call(Input, W, H);
    InputP2.layout(W, H);
    return;
  }
  const scale = save.bigTouch !== false ? 1.14 : 1;
  const r = Math.round(42 * scale), rs = Math.round(34 * scale);
  Input.joyHome = { x: 110, y: H - 110 };
  Input.buttons = [
    { id: 'punch', x: W - 178, y: H - 88, r, label: '\u{1F44A}', color: '#e0533f' },
    { id: 'kick', x: W - 82, y: H - 118, r, label: '\u{1F9B6}', color: '#3f8fe0' },
    { id: 'weapon', x: W - 200, y: H - 186, r, label: '\u{1F52A}', color: '#9b59d0' },
    { id: 'special', x: W - 104, y: H - 216, r, label: '\u{1F300}', color: '#3db8ff' },
    { id: 'subst', x: W - 286, y: H - 168, r: rs, label: '\u{1F4A8}', color: '#c9a66b' },
    { id: 'jump', x: W - 296, y: H - 70, r: rs, label: '\u2B06\uFE0F', color: '#43b25b' },
  ];
};

addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  const now = performance.now();
  if (!Input.keys[k]) {
    if (k === 'w' || k === ' ' || (!Input.dualMode && k === 'arrowup')) Input.press('jump');
    if (k === 'j') Input.press('punch');
    if (k === 'k') Input.press('kick');
    if (k === 'l') Input.press('weapon');
    if (k === 'u' || k === 'i') Input.press('special');
    if (k === 'shift') Input.press('subst');
  }
  if (k === 'a' || (!Input.dualMode && k === 'arrowleft')) {
    if (now - Input.lastMoveTap < 300 && Input.lastMoveDir === -1) Input.press('dash');
    Input.lastMoveTap = now; Input.lastMoveDir = -1;
  }
  if (k === 'd' || (!Input.dualMode && k === 'arrowright')) {
    if (now - Input.lastMoveTap < 300 && Input.lastMoveDir === 1) Input.press('dash');
    Input.lastMoveTap = now; Input.lastMoveDir = 1;
  }
  if (k === 'd' || k === 'arrowright') {
    if (now - Input.lastMoveTap < 300 && Input.lastMoveDir === 1) Input.press('dash');
    Input.lastMoveTap = now; Input.lastMoveDir = 1;
  }
  if (Input.dualMode) {
    if (!InputP2.keys[k]) {
      if (k === 'arrowup') InputP2.press('jump');
      if (k === '1' || k === 'end') InputP2.press('punch');
      if (k === '2' || k === 'pagedown') InputP2.press('kick');
      if (k === '3') InputP2.press('weapon');
      if (k === '4') InputP2.press('special');
      if (k === '5') InputP2.press('subst');
    }
    if (k === 'arrowleft') {
      if (now - InputP2.lastMoveTap < 300 && InputP2.lastMoveDir === -1) InputP2.press('dash');
      InputP2.lastMoveTap = now; InputP2.lastMoveDir = -1;
    }
    if (k === 'arrowright') {
      if (now - InputP2.lastMoveTap < 300 && InputP2.lastMoveDir === 1) InputP2.press('dash');
      InputP2.lastMoveTap = now; InputP2.lastMoveDir = 1;
    }
    InputP2.keys[k] = true;
  }
  Input.keys[k] = true;
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
});
addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  Input.keys[k] = false;
  if (InputP2) InputP2.keys[k] = false;
});

/* ============================== CANVAS ================================= */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = innerWidth, H = innerHeight, DPR = 1;
let resizeDebounce = null;

function resize() {
  DPR = Math.min(devicePixelRatio || 1, maxCanvasDpr());
  W = innerWidth; H = innerHeight;
  canvas.width = W * DPR; canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  Input.layout(W, H);
  if (game) game.onResize();
}
function scheduleResize() {
  if (resizeDebounce) clearTimeout(resizeDebounce);
  resizeDebounce = setTimeout(() => {
    resizeDebounce = null;
    if (window.__sfResizeT) cancelAnimationFrame(window.__sfResizeT);
    window.__sfResizeT = requestAnimationFrame(resize);
  }, 140);
}
addEventListener('resize', scheduleResize);
addEventListener('orientationchange', scheduleResize);

canvas.addEventListener('pointerdown', e => {
  if (state !== 'play' || !game) return;
  e.preventDefault();
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  Input.onDown(e.clientX, e.clientY, e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (state !== 'play' || !game) return;
  e.preventDefault();
  Input.onMove(e.clientX, e.clientY, e.pointerId);
});
canvas.addEventListener('pointerup', e => {
  if (state !== 'play' || !game) return;
  e.preventDefault();
  Input.onUp(e.pointerId);
});
canvas.addEventListener('pointercancel', e => {
  if (state !== 'play' || !game) return;
  Input.onUp(e.pointerId);
});
document.addEventListener('gesturestart', e => {
  if (state === 'play') e.preventDefault();
});
document.addEventListener('pointerdown', () => AudioSys.init(), { once: false });

/* ============================ TEKENHULPEN ============================== */
function seg(x, y, ang, len) { return [x + Math.cos(ang) * len, y + Math.sin(ang) * len]; }

function drawWeaponShape(c, id, spin) {
  // getekend langs +x vanaf de hand (0,0); c is al getransleerd/geroteerd
  c.lineCap = 'round';
  switch (id) {
    case 'zwaard':
      c.strokeStyle = '#c9d6e8'; c.lineWidth = 5; c.beginPath(); c.moveTo(4, 0); c.lineTo(46, 0); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(8, -1); c.lineTo(42, -1); c.stroke();
      c.strokeStyle = '#a67c2e'; c.lineWidth = 5; c.beginPath(); c.moveTo(4, -7); c.lineTo(4, 7); c.stroke();
      break;
    case 'kunai':
      c.strokeStyle = '#7a8494'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(34, 0); c.stroke();
      c.fillStyle = '#c9d6e8';
      c.beginPath(); c.moveTo(34, -7); c.lineTo(52, 0); c.lineTo(34, 7); c.closePath(); c.fill();
      c.strokeStyle = '#a67c2e'; c.lineWidth = 2; c.beginPath(); c.moveTo(8, -5); c.lineTo(8, 5); c.stroke();
      c.beginPath(); c.arc(2, 0, 3, 0, TAU); c.stroke();
      break;
    case 'shuriken': {
      const rot = spin * 18;
      c.save(); c.translate(28, 0); c.rotate(rot);
      c.fillStyle = '#b8c4d4';
      for (let i = 0; i < 4; i++) {
        c.rotate(Math.PI / 2);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(4, -4); c.lineTo(16, 0); c.lineTo(4, 4); c.closePath(); c.fill();
      }
      c.fillStyle = '#5a6784'; c.beginPath(); c.arc(0, 0, 3.5, 0, TAU); c.fill();
      c.restore();
      break;
    }
    case 'knuppel':
      c.strokeStyle = '#8a5a30'; c.lineWidth = 6; c.beginPath(); c.moveTo(2, 0); c.lineTo(22, 0); c.stroke();
      c.lineWidth = 11; c.beginPath(); c.moveTo(22, 0); c.lineTo(40, 0); c.stroke();
      break;
    case 'speer':
      c.strokeStyle = '#a3763f'; c.lineWidth = 4; c.beginPath(); c.moveTo(-14, 0); c.lineTo(58, 0); c.stroke();
      c.fillStyle = '#c9d6e8'; c.beginPath(); c.moveTo(58, -6); c.lineTo(74, 0); c.lineTo(58, 6); c.closePath(); c.fill();
      break;
    case 'nunchaku': {
      c.strokeStyle = '#4a3520'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(22, 0); c.stroke();
      const a = 0.7 + Math.sin(spin * 14) * 1.1;
      const [jx, jy] = seg(22, 0, 0, 7);
      c.strokeStyle = '#889'; c.lineWidth = 1.5;
      const [ex, ey] = seg(jx, jy, a, 9);
      c.beginPath(); c.moveTo(jx, jy); c.lineTo(ex, ey); c.stroke();
      c.strokeStyle = '#4a3520'; c.lineWidth = 5;
      const [fx, fy] = seg(ex, ey, a, 22);
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(fx, fy); c.stroke();
      break;
    }
    case 'hamer':
      c.strokeStyle = '#7a5c34'; c.lineWidth = 5; c.beginPath(); c.moveTo(2, 0); c.lineTo(40, 0); c.stroke();
      c.fillStyle = '#6d7787'; c.fillRect(34, -12, 16, 24);
      c.fillStyle = '#8f9aab'; c.fillRect(34, -12, 16, 6);
      break;
    case 'laser':
      c.save();
      c.shadowColor = '#4ff3ff'; c.shadowBlur = 12;
      c.strokeStyle = '#4ff3ff'; c.lineWidth = 6; c.beginPath(); c.moveTo(6, 0); c.lineTo(50, 0); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(6, 0); c.lineTo(50, 0); c.stroke();
      c.restore();
      c.strokeStyle = '#39404f'; c.lineWidth = 6; c.beginPath(); c.moveTo(-4, 0); c.lineTo(6, 0); c.stroke();
      break;
    case 'boemerang':
      c.strokeStyle = '#c98850'; c.lineWidth = 5;
      c.beginPath(); c.arc(22, 0, 18, -2.2, 0.5); c.stroke();
      c.beginPath(); c.arc(22, 0, 10, -2.0, 0.3); c.stroke();
      break;
    case 'ketting':
      c.strokeStyle = '#8899aa'; c.lineWidth = 3;
      for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(8 + i * 10, Math.sin(i + spin * 8) * 2, 4, 0, TAU); c.stroke(); }
      c.strokeStyle = '#c9d6e8'; c.lineWidth = 5; c.beginPath(); c.moveTo(52, -2); c.lineTo(68, 0); c.lineTo(52, 2); c.stroke();
      break;
    case 'donder':
      c.strokeStyle = '#7a5c34'; c.lineWidth = 6; c.beginPath(); c.moveTo(2, 0); c.lineTo(34, 0); c.stroke();
      c.fillStyle = '#ffd75e';
      c.beginPath(); c.moveTo(34, -14); c.lineTo(58, -4); c.lineTo(40, 0); c.lineTo(58, 4); c.lineTo(34, 14); c.lineTo(38, 0); c.closePath(); c.fill();
      break;
    case 'void':
      c.save(); c.shadowColor = '#ff6b9d'; c.shadowBlur = 14;
      c.strokeStyle = '#ff6b9d'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(28, -10); c.lineTo(48, 0); c.lineTo(28, 10); c.closePath(); c.stroke();
      c.fillStyle = 'rgba(90,16,64,.7)'; c.fill();
      c.restore();
      break;
    case 'guvve':
      c.strokeStyle = '#43b25b'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(36, 0); c.stroke();
      c.fillStyle = '#ffe259'; c.beginPath(); c.ellipse(48, 0, 14, 10, 0, 0, TAU); c.fill();
      c.fillStyle = '#222'; c.beginPath(); c.arc(52, -2, 2, 0, TAU); c.fill();
      c.strokeStyle = '#ff8c42'; c.lineWidth = 2; c.beginPath(); c.moveTo(58, 0); c.lineTo(68, 2); c.stroke();
      break;
  }
}

function drawJutsuOrb(c, x, y, r, spin, kind, alpha) {
  c.save();
  c.translate(x, y);
  c.globalAlpha = alpha == null ? 1 : alpha;
  if (kind === 'chidori') {
    c.shadowColor = '#a8e0ff'; c.shadowBlur = 18;
    c.fillStyle = 'rgba(200,240,255,.55)';
    c.beginPath(); c.arc(0, 0, r * 0.9, 0, TAU); c.fill();
    c.strokeStyle = '#e8f7ff'; c.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const a = spin + i * (TAU / 7);
      c.beginPath();
      c.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
      c.lineTo(Math.cos(a + 0.4) * r * 1.3, Math.sin(a + 0.4) * r * 1.3);
      c.stroke();
    }
  } else {
    // Rasengan: draaiende chakra-bol
    c.shadowColor = '#3db8ff'; c.shadowBlur = 20;
    const grd = c.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, 'rgba(220,250,255,.95)');
    grd.addColorStop(0.45, 'rgba(80,190,255,.75)');
    grd.addColorStop(1, 'rgba(30,120,255,.15)');
    c.fillStyle = grd;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(180,235,255,.9)'; c.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const a0 = spin + i * 1.1;
      c.beginPath();
      c.ellipse(0, 0, r * 0.95, r * (0.35 + (i % 3) * 0.12), a0, 0, TAU);
      c.stroke();
    }
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.beginPath(); c.arc(-r * 0.2, -r * 0.2, r * 0.18, 0, TAU); c.fill();
  }
  c.restore();
}

/* ============================== VECHTER ================================ */
class Fighter {
  constructor(opts) {
    Object.assign(this, {
      x: 0, y: 0, vx: 0, vy: 0, face: 1, onGround: true,
      color: '#f2f5ff', lineW: 4.5, scale: 1,
      hp: 100, maxhp: 100, energy: 0, baseDmg: 10,
      state: 'idle', animT: 0, attack: null, hurtT: 0, deadT: 0,
      blocking: false, blockT: 0, isPlayer: false, isRobot: false,
      weapon: weaponById('vuist'), speed: 260, jumpV: 620,
      ai: null, aiTimer: 0, aiMove: 0, aiCd: 2,
      name: 'Stickman',
      substCd: 0, invulnT: 0, hitFlashT: 0, afterimages: [], dashCd: 0,
      style: null, playerSlot: 0, vsSpecial: 'rasengan',
    }, opts);
  }

  get bodyX() { return this.x; }
  get bodyY() { return this.y - 45 * this.scale; }
  get bodyR() { return 30 * this.scale; }
  get alive() { return this.hp > 0; }

  attackSpec(kind) {
    const w = this.weapon;
    switch (kind) {
      case 'punch':   return { kind, windup: 0.07, active: 0.09, recover: 0.12, range: 40, r: 24, dmg: this.baseDmg * 0.7, kb: 160 };
      case 'kick':    return { kind, windup: 0.11, active: 0.11, recover: 0.2,  range: 50, r: 26, dmg: this.baseDmg * 1.1, kb: 340 };
      case 'weapon':  return { kind, windup: 0.13 / w.speed, active: 0.1 / w.speed, recover: 0.2 / w.speed,
                               range: w.range + 14, r: 26 + w.range * 0.22, dmg: this.baseDmg * w.dmg, kb: 260 };
      case 'special': return {
        kind, windup: 0.48, active: 0.12, recover: 0.28, range: 55, r: 36,
        dmg: this.baseDmg * (this.isRobot ? 2.4 : 2.8), kb: 520, jutsu: (this.vsSpecial === 'chidori' || this.isRobot) ? 'chidori' : 'rasengan',
      };
    }
  }

  startAttack(kind, game) {
    if (this.attack || this.state === 'hurt' || !this.alive || this.invulnT > 0 && kind !== 'special') return;
    if (kind === 'special') {
      if (this.energy < 100) {
        if (this.isPlayer) game.floater(this.x, this.y - 110, 'Chakra niet vol!', '#7cf5ff', 13);
        return;
      }
      this.energy = 0;
      AudioSys.sfx(this.isRobot || this.vsSpecial === 'chidori' ? 'chidori' : 'rasengan');
      if (this.isPlayer) {
        const lbl = (this.vsSpecial === 'chidori' || this.isRobot) ? 'CHIDORI!' : 'RASENGAN!';
        game.banner(lbl, 0.7, this.vsSpecial === 'chidori' ? '#a8e0ff' : '#7cf5ff', 40);
      }
    } else {
      AudioSys.sfx(this.weapon.id === 'shuriken' ? 'shuriken' : 'swing');
    }
    this.attack = Object.assign({ t: 0, hasHit: false, fired: false }, this.attackSpec(kind));
    if (this.isRobot && kind === 'special') this.attack.windup = 0.58;
    this.blocking = false;
  }

  doSubstitution(game) {
    if (!this.alive || this.substCd > 0 || this.attack || this.invulnT > 0) return;
    this.substCd = 1.35;
    this.invulnT = 0.28;
    AudioSys.sfx('subst');
    // rookwolk + afterimage (substitutie / Kawarimi)
    game.burst(this.x, this.y - 40, '#c9a66b', 16);
    game.burst(this.x, this.y - 50, '#eee', 8);
    this.afterimages.push({ x: this.x, y: this.y, face: this.face, life: 0.35 });
    const dir = this.face || 1;
    const pad = this.playerSlot === 2 ? InputP2 : Input;
    const dashDir = Math.abs(pad.move) > 0.2 ? Math.sign(pad.move) : dir;
    this.x = clamp(this.x + dashDir * 140, game.minX, game.maxX);
    this.vx = dashDir * 420;
    game.floater(this.x, this.y - 100, 'Substitutie!', '#c9a66b', 14);
    game.shake(2, 0.08);
  }

  doDash(game, dir) {
    if (!this.alive || this.dashCd > 0 || this.attack || Math.abs(dir) < 0.1) return;
    this.dashCd = 0.85;
    this.invulnT = Math.max(this.invulnT, 0.14);
    AudioSys.sfx('dash');
    this.x = clamp(this.x + dir * 98, game.minX, game.maxX);
    this.vx = dir * 340;
    game.burst(this.x, this.y - 38, this.style?.accent || '#7cf5ff', 8);
    game.floater(this.x, this.y - 92, 'Dash!', '#7cf5ff', 12);
  }

  intent(dt, game) {
    if (this.playerSlot === 1 || (this.isPlayer && !this.playerSlot)) {
      const I = Input;
      return {
        move: I.move,
        jump: I.take('jump'),
        punch: I.take('punch'),
        kick: I.take('kick'),
        weapon: I.take('weapon'),
        special: I.take('special'),
        subst: I.take('subst'),
        dash: I.take('dash'),
        block: false,
      };
    }
    if (this.playerSlot === 2) {
      const I = InputP2;
      return {
        move: I.move,
        jump: I.take('jump'),
        punch: I.take('punch'),
        kick: I.take('kick'),
        weapon: I.take('weapon'),
        special: I.take('special'),
        subst: I.take('subst'),
        dash: I.take('dash'),
        block: false,
      };
    }
    return this.aiIntent(dt, game);
  }

  aiIntent(dt, game) {
    // RabbitRobot street-fighter AI
    const out = { move: 0, jump: false, punch: false, kick: false, weapon: false, special: false, block: false };
    const p = game.player;
    if (!p || !p.alive || !this.alive) return out;
    this.aiTimer -= dt; this.aiCd -= dt;
    const dx = p.x - this.x, dist = Math.abs(dx), dir = Math.sign(dx) || 1;
    const diff = this.aiDiff || 1;

    // reactief blokkeren als de speler aanvalt en dichtbij is
    if (p.attack && p.attack.t < p.attack.windup + p.attack.active && dist < 130 && !this.attack) {
      if (Math.random() < 0.55 * diff * dt * 22) { this.blockT = 0.42; }
    }
    if (this.blockT > 0) { this.blockT -= dt; out.block = true; return out; }

    if (this.aiTimer <= 0) {
      this.aiTimer = rand(0.22, 0.55) / diff;
      if (dist > 240) {
        this.aiMove = dir;
        if (this.aiCd <= 0 && Math.random() < 0.35) { out.special = true; this.aiCd = rand(2.4, 4) / diff; }
        if (Math.random() < 0.12) out.jump = true;
      } else if (dist > 110) {
        const r = Math.random();
        if (r < 0.55) this.aiMove = dir;
        else if (r < 0.75 && this.aiCd <= 0) { out.special = true; this.aiCd = rand(2.4, 4) / diff; }
        else this.aiMove = -dir * 0.6;
      } else {
        const r = Math.random();
        if (r < 0.42) out.punch = true;
        else if (r < 0.72) out.kick = true;
        else if (r < 0.86) { this.aiMove = -dir; }
        else { out.jump = true; this.aiMove = dir; }
      }
    }
    out.move = this.aiMove;
    return out;
  }

  update(dt, game) {
    this.animT += dt;
    if (!this.alive) {
      this.deadT += dt;
      this.vy += 1600 * dt; this.y += this.vy * dt;
      if (this.y > game.ground) { this.y = game.ground; this.vy = 0; }
      return;
    }
    const locked = game.inputLocked && (this.isPlayer || this.playerSlot);
    const it = locked ? { move: 0 } : this.intent(dt, game);
    if (game.inputLocked && !this.isPlayer && !this.playerSlot) {
      it.punch = it.kick = it.weapon = it.special = false; it.move = 0;
    }

    this.blocking = !!it.block && this.onGround && !this.attack;

    if (this.hurtT > 0) {
      this.hurtT -= dt;
      if (this.hurtT <= 0) this.state = 'idle';
    }

    const canAct = this.hurtT <= 0 && !this.blocking;
    // bewegen
    let mv = canAct && !this.attack ? (it.move || 0) : 0;
    this.vx = lerp(this.vx, mv * this.speed, 1 - Math.pow(0.0001, dt));
    if (Math.abs(mv) > 0.1) this.face = mv > 0 ? 1 : -1;

    if (canAct && it.jump && this.onGround && !this.attack) {
      this.vy = -this.jumpV; this.onGround = false; AudioSys.sfx('jump');
    }
    if (this.substCd > 0) this.substCd -= dt;
    if (this.dashCd > 0) this.dashCd -= dt;
    if (this.invulnT > 0) this.invulnT -= dt;
    if (this.hitFlashT > 0) this.hitFlashT -= dt;
    if (this._shurikenCd > 0) this._shurikenCd -= dt;
    for (const a of this.afterimages) a.life -= dt;
    this.afterimages = this.afterimages.filter(a => a.life > 0);

    if (canAct && it.subst) this.doSubstitution(game);
    if (canAct && it.dash) this.doDash(game, it.move || this.face);

    if (canAct) {
      if (it.punch) this.startAttack('punch', game);
      else if (it.kick) this.startAttack('kick', game);
      else if (it.weapon) {
        if (this.weapon.id === 'shuriken') game.throwShuriken(this);
        else this.startAttack(this.weapon.id === 'vuist' ? 'punch' : 'weapon', game);
      }
      else if (it.special) this.startAttack('special', game);
    }

    // zwaartekracht
    this.vy += 1700 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y >= game.ground) {
      if (!this.onGround && this.vy > 300) AudioSys.sfx('land');
      this.y = game.ground; this.vy = 0; this.onGround = true;
    } else this.onGround = false;
    this.x = clamp(this.x, game.minX, game.maxX);

    // aanval-timing
    if (this.attack) {
      const a = this.attack;
      a.t += dt;
      if (a.kind === 'special' && !a.fired && a.t >= a.windup) {
        a.fired = true;
        game.spawnJutsu(this, a);
      }
      if (this.isRobot && a.kind === 'special' && !a.fired && !a._telegraphed && a.t >= a.windup * 0.32) {
        a._telegraphed = true;
        if (game.mode === 'training') {
          game.trainTelegraphT = 0.7;
          game.floater(this.x, this.y - 138, '⚡ CHIDORI — dash/spring!', '#7cf5ff', 16);
          haptic(10);
        }
      }
      if (a.kind !== 'special' && !a.hasHit && a.t >= a.windup && a.t <= a.windup + a.active) {
        if (game.tryMelee(this, a)) a.hasHit = true;
      }
      if (a.t >= a.windup + a.active + a.recover) this.attack = null;
    }

    // chakra laadt sneller bij combo-gevoel (in beweging/gevecht)
    if (this.isPlayer) {
      const rate = this.attack ? 4.2 : 2.8;
      this.energy = clamp(this.energy + dt * rate, 0, 100);
    }

    // state voor animatie
    if (this.hurtT > 0) this.state = 'hurt';
    else if (this.attack) this.state = 'attack';
    else if (!this.onGround) this.state = 'jump';
    else if (Math.abs(this.vx) > 30) this.state = 'run';
    else this.state = 'idle';
  }

  takeDamage(dmg, kbx, game) {
    if (!this.alive) return 0;
    if (this.invulnT > 0) {
      game.floater(this.x, this.y - 115, 'MISS!', '#c9a66b', 13);
      return 0;
    }
    if (this.blocking) {
      dmg = Math.max(1, Math.round(dmg * 0.15));
      AudioSys.sfx('block');
      game.floater(this.x, this.y - 115, 'BLOK!', '#9fd8ff', 14);
      this.hp -= dmg;
      return dmg;
    }
    if (this.isPlayer && game && game.playerShieldT > 0) {
      dmg = Math.max(1, Math.round(dmg * 0.32));
      game.floater(this.x, this.y - 115, 'Schild!', '#9fd8ff', 13);
    }
    dmg = Math.round(dmg);
    this.hp -= dmg;
    this.hurtT = 0.24;
    this.hitFlashT = 0.14;
    this.attack = null;
    this.vx = kbx;
    this.vy = Math.min(this.vy, -120);
    if (this.isPlayer || this.playerSlot) this.invulnT = Math.max(this.invulnT, 0.22);
    if (this.isPlayer) this.energy = clamp(this.energy + 4, 0, 100);
    AudioSys.sfx(this.isPlayer ? 'hurt' : 'hit');
    if (this.isPlayer && game) {
      game.floater(this.x, this.y - 118, '-' + dmg, '#ff8080', 15);
    }
    if ((this.isPlayer || this.playerSlot) && game && save.haptics !== false) {
      haptic(dmg >= 18 ? 16 : 8);
    }
    if (this.hp <= 0) {
      this.hp = 0; this.deadT = 0; this.vy = -260;
      AudioSys.sfx('die');
    }
    return dmg;
  }

  /* ------------------------------ tekenen ----------------------------- */
  pose() {
    const t = this.animT, s = this.state;
    const P = {
      hipY: -46, lean: 0,
      arms: [[1.9, -1.1], [1.15, -0.85]],   // [achter, voor] : [schouder, elleboog] hoeken
      legs: [[1.82, 1.72], [1.34, 1.55]],
      headB: 0,
    };
    if (s === 'idle') {
      const b = Math.sin(t * 3);
      P.hipY = -46 + b * 1.4; P.headB = b * 0.6;
    } else if (s === 'run') {
      const c = t * 11;
      P.lean = 0.14;
      P.legs = [
        [Math.PI / 2 + Math.sin(c) * 0.75, Math.PI / 2 + Math.sin(c) * 0.75 + Math.max(0, Math.cos(c)) * 1.0],
        [Math.PI / 2 + Math.sin(c + Math.PI) * 0.75, Math.PI / 2 + Math.sin(c + Math.PI) * 0.75 + Math.max(0, Math.cos(c + Math.PI)) * 1.0],
      ];
      P.arms = [
        [1.55 - Math.sin(c + Math.PI) * 0.7, 1.55 - Math.sin(c + Math.PI) * 0.7 - 0.8],
        [1.55 - Math.sin(c) * 0.7, 1.55 - Math.sin(c) * 0.7 - 0.8],
      ];
      P.hipY = -46 + Math.abs(Math.sin(c)) * 2;
    } else if (s === 'jump') {
      const up = this.vy < 0;
      P.legs = up ? [[2.2, 1.4], [1.0, 2.0]] : [[1.9, 1.5], [1.25, 1.8]];
      P.arms = [[2.4, -2.6], [-0.6, -0.3]];
      P.lean = 0.08;
    } else if (s === 'hurt') {
      P.lean = -0.32;
      P.arms = [[-2.4, -2.0], [-0.5, -1.2]];
      P.legs = [[1.95, 1.8], [1.2, 1.45]];
    } else if (s === 'attack' && this.attack) {
      const a = this.attack;
      const total = a.windup + a.active + a.recover;
      const p = clamp(a.t / total, 0, 1);
      const wEnd = a.windup / total;
      const ext = p < wEnd ? -(p / wEnd) * 0.25
        : clamp((p - wEnd) / Math.max(0.001, (a.windup + a.active) / total - wEnd), 0, 1);
      if (a.kind === 'punch') {
        P.lean = 0.12 * ext;
        P.arms = [[1.9, -1.1], [lerp(1.15, 0.02, Math.max(0, ext)), lerp(-0.85, 0.0, Math.max(0, ext))]];
      } else if (a.kind === 'kick') {
        P.lean = -0.18 * Math.max(0, ext);
        P.legs = [[1.82, 1.72], [lerp(1.34, -0.06, Math.max(0, ext)), lerp(1.55, -0.02, Math.max(0, ext))]];
        P.arms = [[2.2, -2.2], [-0.8, -0.4]];
      } else if (a.kind === 'weapon') {
        const wid = this.weapon.id;
        if (wid === 'speer') {
          P.arms = [[1.9, -1.1], [lerp(0.9, 0.0, Math.max(0, ext)), lerp(-0.4, 0.0, Math.max(0, ext))]];
          P.lean = 0.16 * ext;
        } else {
          const sw = lerp(-2.15, 0.75, Math.max(0, ext) * (ext < 0 ? 0 : 1));
          const base = ext < 0 ? lerp(-1.6, -2.15, -ext / 0.25) : sw;
          P.arms = [[1.9, -1.1], [base, base + 0.12]];
          P.lean = 0.1 * ext;
        }
      } else if (a.kind === 'special') {
        // Rasengan / Chidori houding: hand naar voren
        const charge = clamp(a.t / a.windup, 0, 1);
        P.arms = [[2.1, -2.0], [lerp(0.4, 0.05, charge), lerp(-0.2, 0.05, charge)]];
        P.legs = [[1.95, 1.85], [1.15, 1.4]];
        P.lean = 0.18 * charge;
      }
    }
    if (this.blocking) {
      P.arms = [[0.9, -1.35], [0.75, -1.15]];
      P.lean = 0.05;
    }
    return P;
  }

  draw(c) {
    const s = this.scale;
    c.save();
    c.translate(this.x, this.y);
    if (this.hitFlashT > 0) {
      c.globalAlpha = Math.min(0.4, this.hitFlashT * 2.5);
      c.fillStyle = this.isPlayer ? '#ff8080' : '#ffe680';
      c.beginPath();
      c.ellipse(0, -44 * s, 34 * s, 48 * s, 0, 0, TAU);
      c.fill();
      c.globalAlpha = 1;
    }
    // schaduw
    c.fillStyle = 'rgba(0,0,0,.3)';
    c.beginPath(); c.ellipse(0, 2, 26 * s, 6 * s, 0, 0, TAU); c.fill();
    c.scale(this.face * s, s);

    if (!this.alive) {
      const k = clamp(this.deadT * 2.2, 0, 1);
      c.rotate(-1.45 * k);
      c.globalAlpha = this.deadT > 2 ? clamp(1 - (this.deadT - 2), 0, 1) : 1;
    }

    const P = this.pose();
    const hipX = 0, hipY = P.hipY;
    const shX = hipX + Math.sin(P.lean) * 32, shY = hipY - Math.cos(P.lean) * 32;
    const headX = shX + Math.sin(P.lean) * 12 + P.headB, headY = shY - Math.cos(P.lean) * 12 - 5;

    c.strokeStyle = this.color; c.lineWidth = this.lineW; c.lineCap = 'round';
    const armL = 17, legL = 24;

    const drawLimb = (x, y, a1, a2, l1, l2) => {
      const [mx, my] = seg(x, y, a1, l1);
      const [ex, ey] = seg(mx, my, a2, l2);
      c.beginPath(); c.moveTo(x, y); c.lineTo(mx, my); c.lineTo(ex, ey); c.stroke();
      return [ex, ey];
    };

    // achterste ledematen (donkerder)
    c.save();
    c.globalAlpha *= 0.75;
    drawLimb(hipX, hipY, P.legs[0][0], P.legs[0][1], legL, legL);
    drawLimb(shX, shY, P.arms[0][0], P.arms[0][1], armL, armL);
    c.restore();

    // romp
    c.beginPath(); c.moveTo(hipX, hipY); c.lineTo(shX, shY); c.stroke();
    // voorste been
    drawLimb(hipX, hipY, P.legs[1][0], P.legs[1][1], legL, legL);
    // hoofd
    c.beginPath(); c.arc(headX, headY - 9, 10.5, 0, TAU); c.stroke();
    if (this.isPlayer && this.style) this.drawStyleExtras(c, headX, headY - 9, shX, shY, hipX, hipY);
    if (this.isRobot) this.drawRobotHead(c, headX, headY - 9);

    // voorste arm + wapen
    const [hx, hy] = drawLimb(shX, shY, P.arms[1][0], P.arms[1][1], armL, armL);
    c.fillStyle = this.color;
    c.beginPath(); c.arc(hx, hy, 3.4, 0, TAU); c.fill();

    if (this.isPlayer && this.weapon.id !== 'vuist' && !(this.attack && this.attack.kind === 'special')) {
      const wAng = this.attack && this.attack.kind === 'weapon' ? P.arms[1][1] : -0.5;
      c.save(); c.translate(hx, hy); c.rotate(wAng);
      drawWeaponShape(c, this.weapon.id, this.animT);
      c.restore();
    }

    if (this.blocking) {
      c.strokeStyle = 'rgba(120,220,255,.8)'; c.lineWidth = 3;
      c.beginPath(); c.arc(22, -50, 26, -1.4, 1.4); c.stroke();
    }
    // Rasengan / Chidori oplaad in de hand
    if (this.attack && this.attack.kind === 'special' && !this.attack.fired) {
      const g = clamp(this.attack.t / this.attack.windup, 0, 1);
      const isChi = this.isRobot || this.vsSpecial === 'chidori';
      drawJutsuOrb(c, hx + 14, hy, 8 + g * 16, this.animT * (8 + g * 20), isChi ? 'chidori' : 'rasengan', 0.55 + g * 0.45);
    }
    c.restore();

    // afterimages (substitutie)
    for (const ai of this.afterimages) {
      c.save();
      c.globalAlpha = clamp(ai.life * 2, 0, 0.45);
      c.translate(ai.x, ai.y);
      c.scale(ai.face * this.scale, this.scale);
      c.strokeStyle = '#c9a66b'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, -46); c.lineTo(0, -14); c.stroke();
      c.beginPath(); c.arc(0, -58, 9, 0, TAU); c.stroke();
      c.restore();
    }
    if (this.invulnT > 0) {
      c.save();
      c.globalAlpha = 0.35 + Math.sin(this.animT * 40) * 0.15;
      c.strokeStyle = '#fff'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(this.x, this.y - 40, 28, 48, 0, 0, TAU); c.stroke();
      c.restore();
    }
  }

  drawStyleExtras(c, hx, hy, shX, shY, hipX, hipY) {
    const st = this.style;
    if (st.glow) {
      c.save();
      c.shadowColor = st.accent;
      c.shadowBlur = 10 + Math.sin(this.animT * 5) * 4;
      c.strokeStyle = st.accent;
      c.lineWidth = 2;
      c.beginPath(); c.arc(hx, hy, 12, 0, TAU); c.stroke();
      c.restore();
    }
    if (st.bandana) {
      c.fillStyle = st.bandana;
      c.fillRect(hx - 11, hy - 17, 22, 7);
      if (st.plate) {
        c.fillStyle = st.plate;
        c.fillRect(hx - 5, hy - 16, 10, 5);
      }
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(hx + 9, hy - 14); c.lineTo(hx + 18, hy - 10); c.stroke();
    }
    if (st.coat) {
      c.fillStyle = 'rgba(224,79,79,.32)';
      c.beginPath();
      c.moveTo(hipX - 14, hipY - 8); c.lineTo(hipX + 14, hipY - 8);
      c.lineTo(shX + 18, shY - 4); c.lineTo(shX - 18, shY - 4);
      c.closePath(); c.fill();
      c.strokeStyle = st.accent; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, shY - 6); c.lineTo(0, hipY + 4); c.stroke();
    }
    if (st.duck) {
      c.fillStyle = '#ffe259';
      c.beginPath(); c.moveTo(hx + 8, hy + 2); c.lineTo(hx + 16, hy + 4); c.lineTo(hx + 8, hy + 6); c.closePath(); c.fill();
    }
    if (st.fox) {
      c.fillStyle = st.accent;
      c.beginPath(); c.moveTo(hx - 10, hy - 16); c.lineTo(hx - 14, hy - 26); c.lineTo(hx - 6, hy - 18); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(hx + 4, hy - 16); c.lineTo(hx + 8, hy - 26); c.lineTo(hx + 2, hy - 18); c.closePath(); c.fill();
    }
    if (st.visor) {
      c.fillStyle = '#7cf5ff';
      c.globalAlpha = 0.85;
      c.fillRect(hx - 9, hy - 5, 18, 6);
      c.globalAlpha = 1;
    }
    if (st.topknot) {
      c.strokeStyle = st.accent; c.lineWidth = 3;
      c.beginPath(); c.moveTo(hx, hy - 18); c.lineTo(hx, hy - 30); c.stroke();
      c.fillStyle = st.accent;
      c.beginPath(); c.arc(hx, hy - 32, 4.5, 0, TAU); c.fill();
    }
    if (st.hunter) {
      c.fillStyle = 'rgba(61,92,50,.55)';
      c.beginPath();
      c.moveTo(hipX - 16, hipY - 6); c.lineTo(hipX + 16, hipY - 6);
      c.lineTo(shX + 20, shY - 2); c.lineTo(shX - 20, shY - 2);
      c.closePath(); c.fill();
      c.fillStyle = st.accent;
      c.beginPath(); c.arc(hx - 14, hy - 8, 3, 0, TAU); c.fill();
    }
  }

  drawRobotHead(c, hx, hy) {
    // konijnenoren + vizier
    c.strokeStyle = this.color; c.lineWidth = 4;
    c.beginPath(); c.moveTo(hx - 5, hy - 8); c.lineTo(hx - 9, hy - 26); c.stroke();
    c.beginPath(); c.moveTo(hx + 3, hy - 9); c.lineTo(hx + 5, hy - 27); c.stroke();
    c.strokeStyle = '#ff5d5d'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(hx - 9, hy - 26); c.lineTo(hx - 9, hy - 20); c.stroke();
    c.beginPath(); c.moveTo(hx + 5, hy - 27); c.lineTo(hx + 5, hy - 21); c.stroke();
    c.fillStyle = '#ff4d4d';
    c.fillRect(hx - 1, hy - 3, 9, 4);
    c.fillStyle = '#ffd0d0';
    c.fillRect(hx + 5, hy - 3, 2, 4);
  }
}

/* ============================== MONSTER ================================ */
class Monster {
  constructor(spId, x, game, opts) {
    const sp = SPECIES[spId];
    opts = opts || {};
    const eliteMul = opts.elite ? 1.7 : 1;
    this.spId = spId; this.sp = sp;
    this.elite = !!opts.elite;
    this.size = sp.size * (opts.elite ? 1.5 : 1);
    this.maxhp = Math.round(sp.hp * (opts.hpMul || 1) * eliteMul);
    this.hp = this.maxhp;
    this.dmg = Math.round(sp.dmg * (opts.dmgMul || 1) * (opts.elite ? 1.3 : 1));
    this.speed = sp.speed;
    this.x = x;
    this.flying = sp.type === 'fly' || sp.type === 'dragon';
    this.y = this.flying ? game.ground - rand(90, 160) : game.ground - this.size;
    this.vx = 0; this.vy = 0;
    this.t = rand(0, 10); this.flashT = 0; this.deadT = -1;
    this.atkCD = rand(0.5, 1.5); this.shootCD = rand(1, 2.5);
    this.dashT = 0; this.telegraphT = 0; this.hopT = rand(0, 0.8);
    this.face = -1;
    this.enraged = false;
  }
  get alive() { return this.hp > 0; }

  update(dt, game) {
    this.t += dt;
    if (this.flashT > 0) this.flashT -= dt;
    if (!this.alive) { this.deadT += dt; return; }
    const p = game.player;
    const dx = p.x - this.x, dir = Math.sign(dx) || 1, dist = Math.abs(dx);
    this.face = dir;
    this.atkCD -= dt; this.shootCD -= dt;
    const spdMul = this.enraged ? 1.32 : 1;
    const type = this.sp.type;

    if (type === 'hop') {
      this.hopT -= dt;
      if (this.hopT <= 0 && Math.abs(this.y - (game.ground - this.size)) < 2) {
        this.vy = -rand(240, 380); this.vx = dir * this.speed * spdMul * rand(1.2, 1.8);
        this.hopT = rand(0.7, 1.3);
      }
      this.vy += 1400 * dt;
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.y >= game.ground - this.size) { this.y = game.ground - this.size; this.vy = 0; this.vx *= 0.4; }
    } else if (type === 'fly') {
      const ty = game.ground - 110 + Math.sin(this.t * 2.4) * 42;
      this.y += (ty - this.y) * dt * 2.2;
      this.x += dir * this.speed * spdMul * dt * (dist > 30 ? 1 : 0);
    } else if (type === 'charge') {
      if (this.dashT > 0) {
        this.dashT -= dt;
        this.x += this.vx * dt;
      } else if (this.telegraphT > 0) {
        this.telegraphT -= dt;
        if (this.telegraphT <= 0) { this.dashT = 0.5; this.vx = dir * this.speed * spdMul * 3.4; AudioSys.sfx('swing'); }
      } else {
        this.x += dir * this.speed * spdMul * dt * 0.6;
        if (dist < 240 && this.atkCD <= 0) {
          this.telegraphT = this.enraged ? 0.28 : 0.45;
          this.atkCD = rand(1.6, 2.6) / (this.enraged ? 1.25 : 1);
        }
      }
      this.y = game.ground - this.size;
    } else if (type === 'shoot') {
      if (dist < 190) this.x -= dir * this.speed * spdMul * dt;
      else if (dist > 330) this.x += dir * this.speed * spdMul * dt;
      if (this.sp.art === 'ghost') this.y = game.ground - this.size - 26 + Math.sin(this.t * 2) * 14;
      else this.y = game.ground - this.size;
      if (this.shootCD <= 0 && dist < 560) {
        this.shootCD = rand(2.2, 3.2);
        game.spawnProjectile({
          x: this.x + dir * this.size, y: this.y - 4,
          vx: dir * 300, vy: 0, r: 8, dmg: this.dmg, from: 'enemy',
          kind: this.sp.art === 'ghost' ? 'orb' : 'laser',
        });
        AudioSys.sfx(this.sp.art === 'ghost' ? 'shoot' : 'laser');
      }
    } else if (type === 'tank') {
      if (this.telegraphT > 0) {
        this.telegraphT -= dt;
        if (this.telegraphT <= 0) {
          AudioSys.sfx('hit2'); game.shake(8, 0.25);
          if (Math.abs(p.x - this.x) < this.size + 62 && p.y > game.ground - 90)
            p.takeDamage(this.dmg, Math.sign(p.x - this.x) * 320, game);
        }
      } else {
        this.x += dir * this.speed * dt;
        if (dist < this.size + 48 && this.atkCD <= 0) { this.telegraphT = 0.55; this.atkCD = 2.0; AudioSys.sfx('roar'); }
      }
      this.y = game.ground - this.size;
    } else if (type === 'dragon') {
      const ty = game.ground - 130 + Math.sin(this.t * 1.7) * 36;
      this.y += (ty - this.y) * dt * 1.6;
      const want = 200;
      if (dist > want + 40) this.x += dir * this.speed * dt;
      else if (dist < want - 60) this.x -= dir * this.speed * dt * 0.7;
      if (this.shootCD <= 0) {
        this.shootCD = (this.elite ? rand(1.4, 2.0) : rand(1.9, 2.6)) / (this.enraged ? 1.35 : 1);
        const a = Math.atan2((p.y - 40) - this.y, p.x - this.x);
        game.spawnProjectile({ x: this.x + Math.cos(a) * this.size, y: this.y + Math.sin(a) * this.size,
          vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, r: 10, dmg: this.dmg, from: 'enemy', kind: 'fire', grav: 60 });
        AudioSys.sfx('roar');
      }
    }
    this.x = clamp(this.x, game.minX - 20, game.maxX + 20);

    // contactschade
    if (this.atkCD <= 0 || this.dashT > 0) {
      const rr = (this.size + p.bodyR) * 0.9;
      if ((p.x - this.x) ** 2 + (p.bodyY - this.y) ** 2 < rr * rr) {
        const d = this.dashT > 0 ? this.dmg * 1.3 : this.dmg;
        if (p.takeDamage(d, dir * 300, game) > 0) game.shake(4, 0.15);
        this.atkCD = Math.max(this.atkCD, 1.0);
      }
    }
  }

  takeDamage(dmg, kbx, game) {
    if (!this.alive) return;
    if (this.elite && !this.enraged && this.hp - dmg <= this.maxhp * 0.5) {
      this.enraged = true;
      this.speed = Math.round(this.speed * 1.28);
      this.dmg = Math.round(this.dmg * 1.22);
      game.banner(`${this.sp.name} — FASE 2!`, 1.6, '#ff6b6b', 36);
      AudioSys.sfx('roar');
      game.shake(9, 0.28);
      haptic(28);
    }
    this.hp -= dmg;
    this.flashT = 0.1;
    this.x += Math.sign(kbx) * 8;
    game.floater(this.x, this.y - this.size - 14, '-' + dmg, '#ffe680', 15);
    game.burst(this.x, this.y, this.sp.c1, 6);
    if (this.hp <= 0) {
      this.hp = 0; this.deadT = 0;
      AudioSys.sfx('die');
      game.burst(this.x, this.y, this.sp.c1, 18);
      game.onMonsterKilled(this);
    } else {
      AudioSys.sfx('hit');
    }
  }

  draw(c) {
    if (!this.alive && this.deadT > 0.6) return;
    c.save();
    c.translate(this.x, this.y);
    if (!this.alive) {
      const k = this.deadT / 0.6;
      c.globalAlpha = 1 - k;
      c.scale(1 + k * 0.6, Math.max(0.05, 1 - k));
    }
    // schaduw
    if (!this.flying) {
      c.save(); c.fillStyle = 'rgba(0,0,0,.28)';
      c.beginPath(); c.ellipse(0, this.size - 2, this.size, this.size * 0.24, 0, 0, TAU); c.fill(); c.restore();
    }
    // rariteit-aura
    const rar = rarityOf(this.sp.rarity);
    if (rar.order >= 2 && this.alive) {
      c.save();
      c.strokeStyle = rar.glow; c.lineWidth = 3 + rar.order * 0.4;
      c.beginPath(); c.ellipse(0, 0, this.size * 1.55, this.size * 1.2, 0, 0, TAU); c.stroke();
      if (rar.order >= 4) {
        c.globalAlpha = 0.25 + Math.sin(this.t * 6) * 0.1;
        c.fillStyle = rar.color;
        c.beginPath(); c.ellipse(0, 0, this.size * 1.7, this.size * 1.35, 0, 0, TAU); c.fill();
      }
      c.restore();
    }
    c.scale(this.face < 0 ? 1 : -1, 1); // art kijkt standaard naar links
    drawMonsterArt(c, this.sp, this.size, this.t, this.flashT > 0, this.telegraphT > 0);
    if (this.enraged && this.alive) {
      c.save();
      c.globalAlpha = 0.35 + Math.sin(this.t * 10) * 0.15;
      c.strokeStyle = '#ff6b6b'; c.lineWidth = 3;
      c.beginPath(); c.arc(0, 0, this.size * 1.35, 0, TAU); c.stroke();
      c.restore();
    }
    c.restore();

    if (this.alive && this.hp < this.maxhp && !this.elite) {
      const w = this.size * 2.4;
      c.fillStyle = 'rgba(0,0,0,.5)';
      c.fillRect(this.x - w / 2, this.y - this.size - 14, w, 5);
      c.fillStyle = '#6ee06e';
      c.fillRect(this.x - w / 2, this.y - this.size - 14, w * (this.hp / this.maxhp), 5);
    }
  }
}

function drawMonsterArt(c, sp, r, t, flash, telegraph) {
  const body = flash ? '#ffffff' : sp.c1;
  const dark = flash ? '#dddddd' : sp.c2;
  const sq = 1 + Math.sin(t * 5) * 0.05;
  c.lineWidth = 2;
  const eye = (x, y, s) => {
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill();
    c.fillStyle = '#1a1a2a'; c.beginPath(); c.arc(x - s * 0.3, y, s * 0.45, 0, TAU); c.fill();
  };
  switch (sp.art) {
    case 'slime': {
      c.fillStyle = body;
      c.beginPath(); c.ellipse(0, r * (1 - sq) * 0.5, r * 1.15 / sq, r * sq, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)';
      c.beginPath(); c.ellipse(-r * 0.35, -r * 0.35, r * 0.3, r * 0.18, -0.5, 0, TAU); c.fill();
      eye(-r * 0.4, -r * 0.1, r * 0.2); eye(r * 0.15, -r * 0.1, r * 0.2);
      c.strokeStyle = dark; c.beginPath(); c.arc(-r * 0.12, r * 0.3, r * 0.22, 0.2, Math.PI - 0.2); c.stroke();
      break;
    }
    case 'bat': {
      const flap = Math.sin(t * 13) * 0.7;
      c.fillStyle = dark;
      for (const s of [-1, 1]) {
        c.save(); c.translate(s * r * 0.5, -r * 0.2); c.rotate(s * (0.5 + flap));
        c.beginPath(); c.moveTo(0, 0); c.lineTo(s * r * 1.5, -r * 0.7); c.lineTo(s * r * 1.2, r * 0.35); c.closePath(); c.fill();
        c.restore();
      }
      c.fillStyle = body; c.beginPath(); c.arc(0, 0, r * 0.85, 0, TAU); c.fill();
      c.fillStyle = dark;
      c.beginPath(); c.moveTo(-r * 0.5, -r * 0.6); c.lineTo(-r * 0.3, -r * 1.15); c.lineTo(-r * 0.1, -r * 0.65); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(r * 0.5, -r * 0.6); c.lineTo(r * 0.3, -r * 1.15); c.lineTo(r * 0.1, -r * 0.65); c.closePath(); c.fill();
      eye(-r * 0.35, -r * 0.1, r * 0.22); eye(r * 0.1, -r * 0.1, r * 0.22);
      break;
    }
    case 'hedgehog': {
      c.fillStyle = telegraph ? '#ffdd66' : dark;
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + (i / 6) * Math.PI;
        c.beginPath();
        c.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7);
        c.lineTo(Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45);
        c.lineTo(Math.cos(a + 0.35) * r * 0.7, Math.sin(a + 0.35) * r * 0.7);
        c.closePath(); c.fill();
      }
      c.fillStyle = body; c.beginPath(); c.arc(0, 0, r * 0.9, 0, TAU); c.fill();
      c.fillStyle = dark; c.beginPath(); c.ellipse(-r * 0.85, r * 0.15, r * 0.35, r * 0.25, 0, 0, TAU); c.fill();
      eye(-r * 0.45, -r * 0.15, r * 0.18);
      break;
    }
    case 'ghost': {
      c.globalAlpha *= 0.88;
      c.fillStyle = body;
      c.beginPath();
      c.arc(0, -r * 0.15, r * 0.9, Math.PI, 0);
      const n = 4;
      for (let i = 0; i <= n; i++) {
        const x = r * 0.9 - (i / n) * r * 1.8;
        const y = r * 0.75 + Math.sin(t * 4 + i * 2) * r * 0.12 * ((i % 2) ? 1 : -1);
        c.lineTo(x, y);
      }
      c.closePath(); c.fill();
      eye(-r * 0.35, -r * 0.2, r * 0.2); eye(r * 0.15, -r * 0.2, r * 0.2);
      c.fillStyle = dark; c.beginPath(); c.ellipse(-r * 0.1, r * 0.15, r * 0.14, r * 0.2, 0, 0, TAU); c.fill();
      break;
    }
    case 'can': {
      c.fillStyle = body;
      c.fillRect(-r * 0.7, -r, r * 1.4, r * 2);
      c.fillStyle = dark;
      c.fillRect(-r * 0.7, -r, r * 1.4, r * 0.3);
      c.fillRect(-r * 0.7, r * 0.7, r * 1.4, r * 0.3);
      c.strokeStyle = dark; c.beginPath(); c.moveTo(0, -r); c.lineTo(0, -r * 1.5); c.stroke();
      c.fillStyle = '#ff5d5d'; c.beginPath(); c.arc(0, -r * 1.55, r * 0.14, 0, TAU); c.fill();
      c.fillStyle = '#20242e'; c.beginPath(); c.arc(-r * 0.15, -r * 0.3, r * 0.32, 0, TAU); c.fill();
      c.fillStyle = Math.sin(t * 6) > 0 ? '#7cf5ff' : '#3fa8b8';
      c.beginPath(); c.arc(-r * 0.15, -r * 0.3, r * 0.16, 0, TAU); c.fill();
      break;
    }
    case 'fox': {
      // vlammende staart
      c.fillStyle = '#ffd166';
      c.beginPath(); c.ellipse(r * 1.1, -r * 0.1 + Math.sin(t * 8) * 3, r * 0.55, r * 0.3, 0.3, 0, TAU); c.fill();
      c.fillStyle = body;
      c.beginPath(); c.ellipse(0, 0, r, r * 0.8, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-r * 0.55, -r * 0.5); c.lineTo(-r * 0.75, -r * 1.25); c.lineTo(-r * 0.15, -r * 0.7); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(r * 0.1, -r * 0.6); c.lineTo(r * 0.05, -r * 1.3); c.lineTo(r * 0.55, -r * 0.65); c.closePath(); c.fill();
      c.fillStyle = dark;
      c.beginPath(); c.moveTo(-r, 0); c.lineTo(-r * 1.35, r * 0.15); c.lineTo(-r * 0.85, r * 0.3); c.closePath(); c.fill();
      eye(-r * 0.45, -r * 0.2, r * 0.17);
      break;
    }
    case 'golem': {
      c.fillStyle = body;
      const rr2 = r * 0.9;
      c.beginPath();
      c.moveTo(-rr2, r); c.lineTo(-rr2 * 1.05, -r * 0.4); c.lineTo(-r * 0.4, -r);
      c.lineTo(r * 0.5, -r * 0.95); c.lineTo(rr2 * 1.05, -r * 0.2); c.lineTo(rr2, r);
      c.closePath(); c.fill();
      c.strokeStyle = dark; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(-r * 0.4, -r * 0.5); c.lineTo(-r * 0.1, 0); c.lineTo(-r * 0.35, r * 0.5); c.stroke();
      c.beginPath(); c.moveTo(r * 0.4, -r * 0.3); c.lineTo(r * 0.2, r * 0.25); c.stroke();
      // armen
      c.fillStyle = dark;
      const raise = telegraph ? -r * 0.8 : 0;
      c.beginPath(); c.arc(-r * 1.15, r * 0.15 + raise, r * 0.42, 0, TAU); c.fill();
      c.beginPath(); c.arc(r * 1.15, r * 0.3, r * 0.38, 0, TAU); c.fill();
      c.fillStyle = telegraph ? '#ff9a3d' : '#ffd75e';
      c.beginPath(); c.arc(-r * 0.35, -r * 0.45, r * 0.13, 0, TAU); c.fill();
      c.beginPath(); c.arc(r * 0.1, -r * 0.45, r * 0.13, 0, TAU); c.fill();
      break;
    }
    case 'dragon': {
      const flap = Math.sin(t * 6) * 0.55;
      // vleugels
      c.fillStyle = dark;
      for (const s of [-1, 1]) {
        c.save(); c.translate(s * r * 0.25, -r * 0.45); c.rotate(s * (0.35 + flap) - (s < 0 ? 0.2 : -0.2));
        c.beginPath(); c.moveTo(0, 0);
        c.lineTo(s * r * 1.7, -r * 1.05); c.lineTo(s * r * 1.9, -r * 0.2); c.lineTo(s * r * 0.9, r * 0.15);
        c.closePath(); c.fill(); c.restore();
      }
      // staart
      c.strokeStyle = body; c.lineWidth = r * 0.28; c.lineCap = 'round';
      c.beginPath(); c.moveTo(r * 0.5, r * 0.1);
      c.quadraticCurveTo(r * 1.4, r * 0.3, r * 1.7, -r * 0.25 + Math.sin(t * 3) * 6); c.stroke();
      // lijf
      c.fillStyle = body;
      c.beginPath(); c.ellipse(0, 0, r, r * 0.78, 0, 0, TAU); c.fill();
      c.fillStyle = '#ffe9c9';
      c.beginPath(); c.ellipse(-r * 0.25, r * 0.25, r * 0.5, r * 0.4, 0, 0, TAU); c.fill();
      // nek + kop
      c.fillStyle = body;
      c.beginPath(); c.ellipse(-r * 0.85, -r * 0.75, r * 0.5, r * 0.4, -0.4, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-r * 1.25, -r * 0.8); c.lineTo(-r * 1.7, -r * 0.6); c.lineTo(-r * 1.2, -r * 0.5); c.closePath(); c.fill();
      // hoorns
      c.fillStyle = '#ffe9c9';
      c.beginPath(); c.moveTo(-r * 0.75, -r * 1.05); c.lineTo(-r * 0.65, -r * 1.5); c.lineTo(-r * 0.5, -r * 1.0); c.closePath(); c.fill();
      eye(-r * 1.0, -r * 0.85, r * 0.13);
      break;
    }
  }
}

/* ========================== ACHTERGRONDEN ============================== */
const THEMES = {
  veld:    { sky1: '#7ec8ff', sky2: '#cfeeff', hill: '#5cb85c', hill2: '#3f9b47', ground: '#4c8f3f', gtop: '#66b356', deco: 'bloem' },
  bos:     { sky1: '#5aa9d6', sky2: '#bfe6d0', hill: '#2f7a45', hill2: '#215c33', ground: '#3c6b33', gtop: '#4c8543', deco: 'boom' },
  grot:    { sky1: '#232840', sky2: '#3a4265', hill: '#2a3050', hill2: '#1d2340', ground: '#3d4056', gtop: '#4d5170', deco: 'stalag' },
  vulkaan: { sky1: '#3a1f28', sky2: '#7a3020', hill: '#552430', hill2: '#3a1820', ground: '#4a2a28', gtop: '#5e3630', deco: 'lava' },
  cyber:   { sky1: '#0a1030', sky2: '#252a60', hill: '#1c2350', hill2: '#131840', ground: '#20264a', gtop: '#2c3468', deco: 'neon' },
  dojo:    { sky1: '#3a2d24', sky2: '#6a5240', hill: '#4a3a2c', hill2: '#3a2d22', ground: '#7a5c3c', gtop: '#8f6f4a', deco: 'lampion' },
  sloop:   { sky1: '#8fb6d0', sky2: '#d8e8f0', hill: '#7a8794', hill2: '#5f6b78', ground: '#6f7684', gtop: '#848b99', deco: 'kraan' },
};

function drawBackground(c, themeName, t, ground) {
  const th = THEMES[themeName] || THEMES.veld;
  const g = c.createLinearGradient(0, 0, 0, ground);
  g.addColorStop(0, th.sky1); g.addColorStop(1, th.sky2);
  c.fillStyle = g; c.fillRect(0, 0, W, ground);

  if (themeName === 'grot' || themeName === 'cyber') {
    c.fillStyle = 'rgba(255,255,255,.5)';
    for (let i = 0; i < 26; i++) {
      const x = (i * 137.5) % W, y = (i * 61.3) % (ground * 0.7);
      const tw = 0.5 + Math.sin(t * 2 + i) * 0.5;
      c.globalAlpha = 0.25 + tw * 0.5;
      c.fillRect(x, y, 2, 2);
    }
    c.globalAlpha = 1;
  } else {
    c.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 0; i < 4; i++) {
      const x = ((i * 250 + t * 12) % (W + 200)) - 100;
      const y = 50 + (i % 3) * 46;
      c.beginPath();
      c.ellipse(x, y, 42, 15, 0, 0, TAU); c.ellipse(x + 26, y - 9, 27, 12, 0, 0, TAU);
      c.fill();
    }
  }
  // heuvels
  c.fillStyle = th.hill;
  c.beginPath(); c.moveTo(0, ground);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, ground - 60 - Math.sin(x * 0.008 + 1) * 40);
  c.lineTo(W, ground); c.closePath(); c.fill();
  c.fillStyle = th.hill2;
  c.beginPath(); c.moveTo(0, ground);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, ground - 26 - Math.sin(x * 0.013 + 4) * 22);
  c.lineTo(W, ground); c.closePath(); c.fill();

  // decoratie
  if (th.deco === 'boom') {
    for (let i = 0; i < 5; i++) {
      const x = (i * 0.22 + 0.06) * W;
      c.fillStyle = '#54381f';
      c.fillRect(x - 5, ground - 90, 10, 90);
      c.fillStyle = th.hill2;
      c.beginPath(); c.arc(x, ground - 105, 38, 0, TAU); c.fill();
      c.beginPath(); c.arc(x - 24, ground - 82, 27, 0, TAU); c.fill();
      c.beginPath(); c.arc(x + 24, ground - 82, 27, 0, TAU); c.fill();
    }
  } else if (th.deco === 'stalag') {
    c.fillStyle = '#20263f';
    for (let i = 0; i < 7; i++) {
      const x = (i * 0.15 + 0.04) * W;
      c.beginPath(); c.moveTo(x - 20, 0); c.lineTo(x, 70 + (i % 3) * 32); c.lineTo(x + 20, 0); c.closePath(); c.fill();
    }
  } else if (th.deco === 'lava') {
    c.fillStyle = '#ff7a30';
    for (let i = 0; i < 8; i++) {
      const x = (i * 0.13 + 0.05) * W;
      const bub = Math.max(0, Math.sin(t * 3 + i * 2.2)) * 5;
      c.beginPath(); c.arc(x, ground - 8, 4 + bub, 0, TAU); c.fill();
    }
  } else if (th.deco === 'neon') {
    for (let i = 0; i < 6; i++) {
      const x = (i * 0.18 + 0.03) * W, h = 110 + (i % 3) * 60;
      c.fillStyle = '#161c3f';
      c.fillRect(x, ground - h, 54, h);
      c.fillStyle = i % 2 ? '#ff4dd2' : '#39d0ff';
      for (let wy = ground - h + 12; wy < ground - 12; wy += 22)
        for (let wx = x + 8; wx < x + 48; wx += 16)
          if ((wx + wy) % 3 !== 0) c.fillRect(wx, wy, 7, 9);
    }
  } else if (th.deco === 'lampion') {
    for (let i = 0; i < 4; i++) {
      const x = (i * 0.28 + 0.1) * W;
      c.strokeStyle = '#2c2018'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 46); c.stroke();
      c.fillStyle = '#e04f4f';
      c.beginPath(); c.ellipse(x, 62, 15, 19, 0, 0, TAU); c.fill();
      c.fillStyle = '#ffd75e'; c.fillRect(x - 5, 78, 10, 5);
    }
    c.fillStyle = 'rgba(0,0,0,.15)';
    for (let x = 0; x < W; x += 90) c.fillRect(x, 0, 4, ground);
  } else if (th.deco === 'kraan') {
    c.strokeStyle = '#c9a227'; c.lineWidth = 7;
    const cx = W * 0.16;
    c.beginPath(); c.moveTo(cx, ground); c.lineTo(cx, 60); c.lineTo(cx + 200, 60); c.stroke();
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx + 170, 60); c.lineTo(cx + 170, 130); c.stroke();
    c.fillStyle = '#5f6b78'; c.fillRect(cx + 155, 130, 30, 22);
  } else if (th.deco === 'bloem') {
    for (let i = 0; i < 9; i++) {
      const x = (i * 0.115 + 0.03) * W;
      c.fillStyle = ['#ff6b8a', '#ffd75e', '#fff'][i % 3];
      c.beginPath(); c.arc(x, ground - 7, 4, 0, TAU); c.fill();
      c.strokeStyle = '#2f7a45'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, ground - 4); c.lineTo(x, ground + 4); c.stroke();
    }
  }

  // grond
  const gg = c.createLinearGradient(0, ground, 0, H);
  gg.addColorStop(0, th.gtop); gg.addColorStop(1, th.ground);
  c.fillStyle = gg; c.fillRect(0, ground, W, H - ground);
  c.fillStyle = 'rgba(255,255,255,.12)';
  c.fillRect(0, ground, W, 3);
}

/* ================================ GAME ================================= */
let game = null;

class Game {
  constructor(mode, opts) {
    opts = opts || {};
    this.mode = mode;
    this.t = 0;
    this.ground = H * 0.78;
    this.minX = 40; this.maxX = W - 40;
    this.shakeT = 0; this.shakeMag = 0; this.freezeT = 0;
    this.particles = []; this.floaters = []; this.projectiles = []; this.banners = [];
    this.monsters = [];
    this.inputLocked = false;
    this.sessionXP = 0;
    this.over = false;
    this.maxCombo = 0;
    this.combo = 0;
    this.comboT = 0;

    const st = playerStats();
    if (mode !== 'versus') {
      this.player = new Fighter({
        isPlayer: true, x: W * 0.25, y: this.ground,
        hp: st.maxhp, maxhp: st.maxhp, baseDmg: st.dmg,
        weapon: weaponById(save.weapon), color: '#f2f5ff',
      });
      applyPlayerStyle(this.player);
    }

    if (mode === 'adventure') {
      this.combo = 0; this.comboT = 0;
      this.pickups = [];
      this.dmgBuffT = 0; this.dmgBuffMul = 1;
      this.playerShieldT = 0;
      this.initAdventure(opts.level || 1);
    } else if (mode === 'training') this.initTraining();
    else if (mode === 'wall') this.initWall();
    else if (mode === 'versus') this.initVersus(opts);
  }

  onResize() {
    this.ground = H * 0.78;
    this.maxX = W - 40;
    if (this.mode === 'wall') this.layoutWall(false);
  }

  /* --------------------------- AVONTUUR ------------------------------- */
  initAdventure(n) {
    this.level = buildLevel(n);
    this.theme = this.level.theme;
    this.waveIdx = -1;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.kills = 0;
    this.betweenT = 1.2;
    this.pickups = this.pickups || [];
    this.banner(`LEVEL ${n}`, 1.4, '#ffd75e', 54);
    AudioSys.play(this.level.boss ? 'boss' : 'battle');
    if (n === 1 && save.lvl === 1 && !save.tipsSeen.hint_adventure) this.hint = 6;
  }

  nextWave() {
    this.waveIdx++;
    if (this.waveIdx >= this.level.waves.length) { this.finishAdventure(true); return; }
    const wave = this.level.waves[this.waveIdx];
    const bossWave = isBossWave(this.level, this.waveIdx);
    this.spawnQueue = wave.slice();
    this.spawnTimer = bossWave ? 1.0 : 0.45;
    this.wavePause = 0;
    if (bossWave) {
      this.banner('BAAS-GOLF!', 1.8, '#ff6b6b', 50);
      AudioSys.play('boss');
      AudioSys.sfx('roar');
    } else if (wave.some(s => s.elite)) {
      this.banner('ELITE-GOLF', 1.2, '#ffd75e', 40);
      AudioSys.sfx('roar');
    } else {
      this.banner(`GOLF ${this.waveIdx + 1}/${this.level.waves.length}`, 1.1, '#cfe0ff', 38);
    }
  }

  updateAdventure(dt) {
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 0;
    }
    if (this.dmgBuffT > 0) {
      this.dmgBuffT -= dt;
      if (this.dmgBuffT <= 0) this.dmgBuffMul = 1;
    }
    if (this.playerShieldT > 0) this.playerShieldT -= dt;
    const p = this.player;
    for (const pk of this.pickups) {
      pk.t += dt;
      pk.bob = Math.sin(pk.t * 5) * 6;
      pk.life -= dt;
      if (!p.alive) continue;
      const dy = (p.y - 48) - pk.y;
      if ((p.x - pk.x) ** 2 + dy ** 2 < 44 * 44) this.collectPickup(pk);
    }
    this.pickups = this.pickups.filter(pk => pk.life > 0);
    if (this.betweenT > 0) {
      this.betweenT -= dt;
      if (this.betweenT <= 0 && this.waveIdx < 0) this.nextWave();
    }
    if (this.spawnQueue.length) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const bossWave = isBossWave(this.level, this.waveIdx);
        this.spawnTimer = bossWave ? 1.12 : 0.68;
        const def = this.spawnQueue.shift();
        const side = Math.random() < 0.75 ? 1 : -1;
        const x = side > 0 ? W + 40 : -40;
        this.monsters.push(new Monster(def.sp, x, this, {
          elite: def.elite, hpMul: this.level.hpMul, dmgMul: this.level.dmgMul,
        }));
      }
    } else if (this.waveIdx >= 0 && this.monsters.every(m => !m.alive)) {
      if (!this.wavePause) {
        const nextIsBoss = isBossWave(this.level, this.waveIdx + 1);
        this.wavePause = nextIsBoss ? 2.15 : 1.05;
      }
      this.wavePause -= dt;
      if (this.wavePause <= 0) { this.wavePause = 0; this.nextWave(); }
    }
    if (!this.player.alive && !this.over) this.finishAdventure(false);
  }

  finishAdventure(win) {
    if (this.over) return;
    this.over = true;
    this.inputLocked = true;
    let stars = 0;
    if (win) {
      const bonus = 30 + this.level.n * 10;
      this.grantXP(bonus);
      if (this.level.n === save.unlocked && save.unlocked < MAX_LEVEL) { save.unlocked++; persist(); }
      const hpPct = this.player.hp / Math.max(1, this.player.maxhp);
      stars = starsFromHpPct(hpPct);
      const prev = save.stars[this.level.n] || 0;
      if (stars > prev) { save.stars[this.level.n] = stars; persist(); }
      bumpStat('advWins', 1);
      bumpDaily('advWin', 1);
      checkAchievements();
      AudioSys.sfx('win');
      this.banner('GEWONNEN!', 2, '#7cfc8a', 56);
    } else {
      AudioSys.sfx('lose');
      this.banner('VERSLAGEN...', 2, '#ff6b6b', 50);
    }
    setTimeout(() => UI.showResult(win, {
      title: win ? 'GEWONNEN!' : 'VERSLAGEN...',
      detail: win
        ? `Level ${this.level.n} · ${this.kills} monsters · ${stars}★ · max combo ×${this.maxCombo || 0}`
        : `Level ${this.level.n} · ${this.kills} monsters · max combo ×${this.maxCombo || 0}`,
      xp: this.sessionXP,
      mode: 'adventure', level: this.level.n, win, stars,
      tip: win ? (stars >= 3 ? 'Perfecte run — hou je HP hoog!' : `${starHintLine()} — pickups helpen`) : 'Tip: blokkeer meer · vul chakra · Rasengan op baas',
    }), 1400);
  }

  onMonsterKilled(m) {
    this.kills++;
    this.freezeT = Math.max(this.freezeT, 0.045);
    this.shake(5, 0.18);
    haptic(12);
    const dropChance = m.elite ? 0.42 : 0.22;
    if (Math.random() < dropChance) this.spawnPickup(m.x, m.y - m.size * 0.5);
    bumpStat('kills', 1);
    bumpDaily('kills', 1);
    if (m.elite) {
      bumpStat('bossKills', 1);
      bumpDaily('bossKill', 1);
    }
    const rar = rarityOf(m.sp.rarity);
    const lvlScale = 1 + (this.level ? (this.level.n - 1) * 0.1 : 0);
    const rarMul = 1 + rar.order * 0.15;
    const xp = Math.round(m.sp.xp * lvlScale * rarMul * (m.elite ? 2 : 1));
    this.grantXP(xp);
    this.floater(m.x, m.y - m.size - 30, `+${xp} XP`, rar.color, 16);
    if (rar.order >= 3) this.floater(m.x, m.y - m.size - 50, rar.name.toUpperCase(), rar.color, 13);
    this.player.energy = clamp(this.player.energy + 12 + rar.order * 2, 0, 100);
    if (!save.dex[m.spId]) {
      save.dex[m.spId] = 0;
      persist();
      AudioSys.sfx('newmonster');
      const hpB = rarityHpBonus(m.sp.rarity);
      this.banner(`Nieuw ${rar.name}: ${m.sp.name}! +${hpB} max HP`, 2.0, rar.color, 28);
      this.player.maxhp += hpB; this.player.hp += hpB;
      UI.toast(`${rar.name}: ${m.sp.name} ontdekt! +${hpB} HP`, 3200);
    }
    save.dex[m.spId]++;
    persist();
  }

  spawnPickup(x, y) {
    const kind = choice(PICKUP_TYPES);
    this.pickups.push({ x, y, kind, t: rand(0, TAU), life: 16, bob: 0 });
  }

  collectPickup(pk) {
    if (pk._got) return;
    pk._got = true;
    const meta = PICKUP_META[pk.kind];
    const p = this.player;
    AudioSys.sfx('pickup');
    haptic(20);
    switch (pk.kind) {
      case 'heal':
        p.hp = Math.min(p.maxhp, p.hp + Math.round(p.maxhp * 0.28));
        this.floater(p.x, p.y - 100, '+HP', meta.color, 16);
        break;
      case 'rage':
        this.dmgBuffMul = 1.38;
        this.dmgBuffT = 9;
        this.floater(p.x, p.y - 100, 'RAGE ×1.4', meta.color, 16);
        break;
      case 'chakra':
        p.energy = 100;
        this.floater(p.x, p.y - 100, 'Vol chakra!', meta.color, 16);
        break;
      case 'shield':
        this.playerShieldT = 6.5;
        this.floater(p.x, p.y - 100, 'Schild!', meta.color, 16);
        break;
    }
    this.banner(meta.label, 0.9, meta.color, 28);
    this.burst(pk.x, pk.y, meta.color, 14);
    bumpStat('pickups', 1);
    bumpDaily('pickups', 1);
    pk.life = 0;
  }

  /* --------------------------- TRAINING ------------------------------- */
  initTraining() {
    this.theme = 'dojo';
    this.roundsP = 0; this.roundsR = 0;
    this.round = 0;
    this.roundTimer = 60;
    this.phase = 'intro'; this.phaseT = 0;
    const diff = 1 + Math.min(save.trainWins * 0.15, 1.2) + (save.lvl - 1) * 0.03;
    this.robot = new Fighter({
      isRobot: true, name: 'RabbitRobot',
      x: W * 0.75, y: this.ground, face: -1,
      color: '#b8c4d8', lineW: 5.5,
      hp: 1, maxhp: 1,
      baseDmg: 8 + save.lvl * 1.3 + save.trainWins * 0.8,
      speed: 230 + Math.min(save.trainWins * 8, 80),
      weapon: weaponById('vuist'),
    });
    this.robot.aiDiff = diff;
    this.robotMaxHp = Math.round(110 + save.lvl * 9 + save.trainWins * 14);
    this.trainTelegraphT = 0;
    this.startRound();
    AudioSys.play('boss');
  }

  startRound() {
    this.round++;
    this.roundTimer = 60;
    const st = playerStats();
    this.player.hp = this.player.maxhp = st.maxhp;
    this.player.x = W * 0.25; this.player.y = this.ground; this.player.vx = 0; this.player.face = 1;
    this.player.attack = null; this.player.hurtT = 0; this.player.energy = 30;
    this.robot.hp = this.robot.maxhp = this.robotMaxHp;
    this.robot.x = W * 0.75; this.robot.y = this.ground; this.robot.vx = 0; this.robot.face = -1;
    this.robot.attack = null; this.robot.hurtT = 0; this.robot.deadT = 0;
    this.phase = 'intro'; this.phaseT = 0;
    this.inputLocked = true;
    this.banner(`RONDE ${this.round}`, 1.1, '#ffd75e', 52);
    AudioSys.sfx('bell');
  }

  updateTraining(dt) {
    this.phaseT += dt;
    if (this.phase === 'intro') {
      if (this.phaseT > 1.2 && this.phaseT - dt <= 1.2) this.banner('VECHT!', 0.8, '#ff6b6b', 60);
      if (this.phaseT > 1.6) { this.phase = 'fight'; this.inputLocked = false; }
    } else if (this.phase === 'fight') {
      if (this.trainTelegraphT > 0) this.trainTelegraphT -= dt;
      this.roundTimer -= dt;
      const pDead = !this.player.alive, rDead = !this.robot.alive;
      if (pDead || rDead || this.roundTimer <= 0) {
        let pWin;
        if (rDead && !pDead) pWin = true;
        else if (pDead && !rDead) pWin = false;
        else pWin = (this.player.hp / this.player.maxhp) >= (this.robot.hp / this.robot.maxhp);
        if (pWin) this.roundsP++; else this.roundsR++;
        this.phase = 'roundend'; this.phaseT = 0;
        this.inputLocked = true;
        this.banner(pWin ? 'RONDE GEWONNEN!' : 'RONDE VERLOREN', 1.6, pWin ? '#7cfc8a' : '#ff6b6b', 40);
        AudioSys.sfx(pWin ? 'win' : 'lose');
      }
    } else if (this.phase === 'roundend') {
      if (this.phaseT > 2) {
        if (this.roundsP >= 2 || this.roundsR >= 2) this.finishTraining(this.roundsP >= 2);
        else this.startRound();
      }
    }
    this.robot.update(dt, this);
  }

  finishTraining(win) {
    if (this.over) return;
    this.over = true; this.inputLocked = true;
    let xp = 0;
    if (win) { save.trainWins++; persist(); xp = 70 + save.trainWins * 20; this.grantXP(xp);
      bumpDaily('trainWin', 1);
      checkAchievements();
      if (save.trainWins === 3) UI.toast('Stijl vrij: Chakra gloed!', 3200);
    }
    else { xp = 15; this.grantXP(xp); }
    setTimeout(() => UI.showResult(win, {
      title: win ? 'KAMPIOEN!' : 'ROBOT WINT...',
      detail: `RabbitRobot ${win ? 'verslagen' : 'was te sterk'} (${this.roundsP}-${this.roundsR}) · ${save.trainWins}x gewonnen`,
      xp: this.sessionXP, mode: 'training', win,
      tip: win ? 'Unlock stijlen door meer train-wins!' : 'Tip: duck lasers · chakra vol → 🌀 Rasengan',
    }), 1200);
  }

  initVersus(opts) {
    opts = opts || {};
    Input.dualMode = true;
    Input.layout(W, H);
    this.theme = 'dojo';
    this.roundsP1 = 0;
    this.roundsP2 = 0;
    this.round = 0;
    this.p1Pick = normalizeVsPick(opts.p1 || vsSelect.p1, 'hero');
    this.p2Pick = normalizeVsPick(opts.p2 || vsSelect.p2, 'rabbit');
    vsSelect.p1 = this.p1Pick;
    vsSelect.p2 = this.p2Pick;
    trackVsRosterUse(this.p1Pick, this.p2Pick);
    this.player = buildVsFighter(vsRosterEntry(this.p1Pick), vsSpawnX(1), 1);
    this.p2 = buildVsFighter(vsRosterEntry(this.p2Pick), vsSpawnX(2), 2);
    this.startVsRound();
    AudioSys.play('boss');
  }

  startVsRound() {
    this.round++;
    this.roundTimer = 99;
    const e1 = vsRosterEntry(this.p1Pick);
    const e2 = vsRosterEntry(this.p2Pick);
    resetVsFighterRound(this.player, e1, this.ground, 1);
    resetVsFighterRound(this.p2, e2, this.ground, 2);
    this.phase = 'intro';
    this.phaseT = 0;
    this.inputLocked = true;
    const mp = this.roundsP1 === 1 || this.roundsP2 === 1;
    const sub = mp ? ' · match point' : '';
    this.banner(`RONDE ${this.round}${sub}`, 1.1, '#ffd75e', 52);
    AudioSys.sfx('bell');
  }

  updateVersus(dt) {
    this.phaseT += dt;
    if (this.phase === 'intro') {
      if (this.phaseT > 1.2 && this.phaseT - dt <= 1.2) this.banner('FIGHT!', 0.8, '#ff6b6b', 60);
      if (this.phaseT > 1.6) { this.phase = 'fight'; this.inputLocked = false; }
    } else if (this.phase === 'fight') {
      this.roundTimer -= dt;
      const p1d = !this.player.alive, p2d = !this.p2.alive;
      if (p1d || p2d || this.roundTimer <= 0) {
        let p1Win;
        const timedOut = !p1d && !p2d && this.roundTimer <= 0;
        if (p2d && !p1d) p1Win = true;
        else if (p1d && !p2d) p1Win = false;
        else p1Win = (this.player.hp / this.player.maxhp) >= (this.p2.hp / this.p2.maxhp);
        if (p1Win) this.roundsP1++; else this.roundsP2++;
        this.phase = 'roundend';
        this.phaseT = 0;
        this.inputLocked = true;
        let msg = p1Win ? 'P1 WINT RONDE!' : 'P2 WINT RONDE!';
        if (timedOut) msg = `TIME! · ${msg}`;
        this.banner(msg, 1.5, p1Win ? '#7cf5ff' : '#ffb0b8', 38);
        AudioSys.sfx(p1Win ? 'win' : 'lose');
      }
    } else if (this.phase === 'roundend') {
      if (this.phaseT > 2.2) {
        if (this.roundsP1 >= 2 || this.roundsP2 >= 2) this.finishVersus(this.roundsP1 >= 2);
        else this.startVsRound();
      }
    }
    this.p2.update(dt, this);
  }

  finishVersus(p1Win) {
    if (this.over) return;
    this.over = true;
    this.inputLocked = true;
    Input.dualMode = false;
    Input.layout(W, H);
    bumpStat('vsMatches', 1);
    if (p1Win) bumpStat('vsWins', 1);
    this.grantXP(p1Win ? 35 : 20);
    setTimeout(() => UI.showResult(p1Win, {
      title: p1Win ? 'SPELER 1 WINT!' : 'SPELER 2 WINT!',
      detail: `${vsRosterEntry(this.p1Pick).name} vs ${vsRosterEntry(this.p2Pick).name} · ${this.roundsP1}-${this.roundsP2}`,
      xp: this.sessionXP, mode: 'versus', win: p1Win, p1: this.p1Pick, p2: this.p2Pick,
      tip: 'Opnieuw = rematch · Menu = andere vechters kiezen',
    }), 1200);
  }

  /* ------------------------------ MUUR -------------------------------- */
  initWall() {
    this.theme = 'sloop';
    this.wallTimer = 60;
    this.score = 0; this.combo = 0; this.comboT = 0; this.wallGen = 0;
    this.maxCombo = 0;
    this.wallRecordToast = false;
    this.layoutWall(true);
    this.banner('SLOOP DE MUUR!', 1.5, '#ffd75e', 46);
    AudioSys.play('battle');
    this.phase = 'fight';
  }

  layoutWall(fresh) {
    // laag en breed, zodat elke steen bereikbaar is (ook springend)
    const bw = 62, bh = 34, cols = 4, rows = 5;
    this.wallX = W - cols * bw - 30;
    if (!fresh) return;
    this.bricks = [];
    const hpBase = 26 + this.wallGen * 10;
    for (let cRow = 0; cRow < rows; cRow++) {
      for (let col = 0; col < cols; col++) {
        this.bricks.push({
          x: this.wallX + col * bw, y: this.ground - (cRow + 1) * bh,
          w: bw - 3, h: bh - 3,
          hp: hpBase, maxhp: hpBase,
          hue: 18 + (((cRow * 7 + col * 13) % 5) - 2) * 4,
          bonus: Math.random() < 0.07,
          seed: cRow * 31 + col * 17,
        });
      }
    }
  }

  updateWall(dt) {
    this.wallTimer -= dt;
    this.comboT -= dt;
    if (this.comboT <= 0) this.combo = 0;
    this.maxX = this.wallX - 16;
    if (this.bricks.every(b => b.hp <= 0)) {
      this.wallGen++;
      this.grantXP(25);
      this.banner('MUUR GESLOOPT! Nieuwe muur...', 1.4, '#7cfc8a', 34);
      AudioSys.sfx('win');
      this.layoutWall(true);
    }
    if (this.wallTimer <= 0 && !this.over) this.finishWall();
  }

  finishWall() {
    this.over = true; this.inputLocked = true;
    const best = Math.max(save.bestWall, this.score);
    const isRecord = this.score > save.bestWall;
    save.bestWall = best; persist();
    const xp = Math.round(this.score * 0.6);
    this.grantXP(xp);
    bumpDaily('wallBricks', this.score);
    checkAchievements();
    AudioSys.sfx(isRecord ? 'win' : 'bell');
    this.banner('TIJD!', 1.5, '#ffd75e', 56);
    setTimeout(() => UI.showResult(true, {
      title: isRecord ? 'NIEUW RECORD!' : 'TIJD IS OM!',
      detail: `${this.score} stenen · record ${best} · max combo ×${this.maxCombo || 0}`,
      xp: this.sessionXP, mode: 'wall', win: true,
      tip: isRecord ? 'Nieuw record — share met een vriend!' : 'Tip: hou combo vast voor snellere sloop',
    }), 1200);
  }

  /* -------------------------- GEDEELDE LOGICA ------------------------- */
  grantXP(n) {
    this.sessionXP += n;
    save.xp += n;
    while (save.xp >= xpNeed(save.lvl)) {
      save.xp -= xpNeed(save.lvl);
      save.lvl++;
      AudioSys.sfx('levelup');
      this.banner(`LEVEL OMHOOG! Lv ${save.lvl}`, 1.8, '#ffd75e', 40);
      const st = playerStats();
      this.player.maxhp = st.maxhp;
      this.player.baseDmg = st.dmg;
      this.player.hp = Math.min(this.player.maxhp, this.player.hp + Math.round(this.player.maxhp * 0.45));
      const unlockedW = WEAPONS.find(w => w.unlock === save.lvl);
      if (unlockedW) {
        setTimeout(() => this.banner(`Nieuw wapen: ${unlockedW.name}!`, 2, '#c792ff', 32), 900);
        AudioSys.sfx('newmonster');
      }
      const newStyle = STYLES.find(s => s.needLvl === save.lvl && styleUnlocked(s));
      if (newStyle) UI.toast(`Nieuwe stijl: ${newStyle.name}!`, 3500);
    }
    persist();
  }

  spawnJutsu(f, atk) {
    const jutsu = (atk && atk.jutsu) || (f.vsSpecial === 'chidori' || f.isRobot ? 'chidori' : 'rasengan');
    const dmg = atk ? atk.dmg : f.baseDmg * 2.8;
    const from = this.projFrom(f);
    if (jutsu === 'chidori') {
      this.spawnProjectile({
        x: f.x + f.face * 36, y: f.y - 48,
        vx: f.face * 620, vy: 0, r: 22, dmg, life: 0.35,
        from, kind: 'chidori', pierce: false, hitSet: new Set(),
      });
      f.vx = f.face * 380;
      this.shake(7, 0.2);
      AudioSys.sfx('chidori');
    } else {
      // Rasengan: zware draaiende chakra-bol
      this.spawnProjectile({
        x: f.x + f.face * 40, y: f.y - 50,
        vx: f.face * 400, vy: 0, r: 26, dmg,
        from, kind: 'rasengan', pierce: true, hitSet: new Set(), life: 1.4,
        spin: 0,
      });
      this.burst(f.x + f.face * 30, f.y - 50, '#7cf5ff', 18);
      this.shake(9, 0.28);
      this.freezeT = Math.max(this.freezeT, 0.06);
      AudioSys.sfx('rasengan');
      if (f.isPlayer || f.playerSlot) haptic(22);
    }
  }

  throwShuriken(f) {
    if (f._shurikenCd > 0) return;
    f._shurikenCd = 0.28;
    AudioSys.sfx('shuriken');
    const w = f.weapon;
    this.spawnProjectile({
      x: f.x + f.face * 24, y: f.y - 52,
      vx: f.face * 520, vy: rand(-40, 40), r: 10,
      dmg: f.baseDmg * w.dmg * 0.85,
      from: this.projFrom(f), kind: 'shuriken', life: 1.2, spin: 0,
    });
  }

  spawnWave(f) { this.spawnJutsu(f, f.attackSpec('special')); }

  spawnProjectile(p) {
    this.projectiles.push(Object.assign({ life: 3, grav: 0, spin: 0 }, p));
  }

  projFrom(f) {
    if (this.mode === 'versus') return f.playerSlot === 2 ? 'p2' : 'p1';
    return f.isPlayer ? 'player' : 'enemy';
  }

  tryMelee(f, spec) {
    const hx = f.x + f.face * spec.range * 0.8;
    const hy = f.y - 48;
    const r = spec.r;
    let hit = false;

    if (this.mode === 'wall' && f.isPlayer) {
      let hits = 0;
      for (const b of this.bricks) {
        if (b.hp <= 0) continue;
        const cx = clamp(hx, b.x, b.x + b.w), cy = clamp(hy, b.y, b.y + b.h);
        if ((hx - cx) ** 2 + (hy - cy) ** 2 < r * r) {
          hits++;
          const dmg = Math.round(spec.dmg * (1 + this.combo * 0.04) * rand(0.9, 1.15));
          b.hp -= dmg;
          this.burst(cx, cy, `hsl(${b.hue},45%,55%)`, 5);
          if (b.hp <= 0) {
            this.score++;
            this.combo++; this.comboT = 1.4;
            this.noteCombo();
            if (!this.wallRecordToast && this.score > save.bestWall) {
              this.wallRecordToast = true;
              this.floater(W * 0.5, 118, 'NIEUW RECORD!', '#ffd75e', 22);
              haptic(18);
              AudioSys.sfx('bonus');
            }
            this.burst(b.x + b.w / 2, b.y + b.h / 2, `hsl(${b.hue},50%,45%)`, 14);
            AudioSys.sfx(b.bonus ? 'explode' : 'brick');
            this.shake(b.bonus ? 6 : 3, b.bonus ? 0.16 : 0.12);
            this.floater(b.x + b.w / 2, b.y, this.combo > 1 ? `x${this.combo}!` : '+1', '#ffd75e', 16);
            if (b.bonus) {
              AudioSys.sfx('bonus');
              this.score += 5;
              this.burst(b.x + b.w / 2, b.y + b.h / 2, '#ffd75e', 22);
              this.floater(b.x + b.w / 2, b.y - 22, '★ BONUS +5', '#7cf5ff', 18);
            }
          } else {
            AudioSys.sfx('crack');
          }
          if (hits >= 3) break;
        }
      }
      return hits > 0;
    }

    // monsters
    for (const m of this.monsters) {
      if (!m.alive) continue;
      if ((hx - m.x) ** 2 + (hy - m.y) ** 2 < (r + m.size) ** 2) {
        let comboMul = 1;
        if (this.mode === 'adventure' && f.isPlayer) {
          this.combo = Math.min(12, this.combo + 1);
          this.comboT = 1.62;
          this.noteCombo();
          comboMul = 1 + Math.min(this.combo, 8) * 0.07;
          trackCombo(this.combo);
          if (this.combo === 3 || this.combo === 6 || this.combo === 10) {
            AudioSys.sfx('combo');
            this.floater(f.x + f.face * 30, f.y - 120, `COMBO ×${this.combo}!`, '#ffd75e', 17);
          }
        }
        const buff = f.isPlayer ? (this.dmgBuffMul || 1) : 1;
        const dmg = Math.round(spec.dmg * rand(0.9, 1.15) * comboMul * buff);
        m.takeDamage(dmg, f.face * spec.kb, this);
        applyHitStop(this, spec);
        if (spec.dmg >= 18) this.shake(3, 0.11);
        this.player.energy = clamp(this.player.energy + 8, 0, 100);
        hit = true;
      }
    }
    // vechters (training / versus)
    const targets = [];
    if (this.mode === 'versus') {
      if (f.playerSlot === 1 && this.p2) targets.push(this.p2);
      if (f.playerSlot === 2 && this.player) targets.push(this.player);
    } else {
      if (f.isPlayer && this.robot) targets.push(this.robot);
      if (!f.isPlayer && f.isRobot) targets.push(this.player);
    }
    for (const tgt of targets) {
      if (!tgt.alive) continue;
      if ((hx - tgt.bodyX) ** 2 + (hy - tgt.bodyY) ** 2 < (r + tgt.bodyR) ** 2) {
        const dmg = tgt.takeDamage(spec.dmg * rand(0.9, 1.15), f.face * spec.kb, this);
        const col = tgt.playerSlot === 2 ? '#ffb0b8' : (tgt.isPlayer ? '#ff8080' : '#ffe680');
        this.floater(tgt.x, tgt.y - 115, '-' + dmg, col, 16);
        this.burst(tgt.bodyX, tgt.bodyY, col, 7);
        f.energy = clamp(f.energy + 9, 0, 100);
        applyHitStop(this, spec);
        this.freezeT = Math.max(this.freezeT, motionReduced() ? 0.015 : 0.034);
        this.shake(spec.dmg > 20 ? 4 : 3, 0.12);
        if ((f.isPlayer || f.playerSlot) && save.haptics !== false) haptic(5);
        hit = true;
      }
    }
    if (hit && this.mode !== 'wall') AudioSys.sfx(spec.dmg > 20 ? 'hit2' : 'hit');
    return hit;
  }

  update(dt) {
    if (this.freezeT > 0) { this.freezeT -= dt; return; }
    this.t += dt;
    if (this.hint > 0) this.hint -= dt;
    this.shakeT = Math.max(0, this.shakeT - dt);

    this.player.update(dt, this);

    if (this.mode === 'adventure') this.updateAdventure(dt);
    else if (this.mode === 'training') this.updateTraining(dt);
    else if (this.mode === 'versus') this.updateVersus(dt);
    else if (this.mode === 'wall') this.updateWall(dt);

    for (const m of this.monsters) m.update(dt, this);
    this.monsters = this.monsters.filter(m => m.alive || m.deadT < 1);

    // projectielen
    for (const p of this.projectiles) {
      p.life -= dt;
      p.spin = (p.spin || 0) + dt * (p.kind === 'rasengan' ? 22 : p.kind === 'shuriken' ? 28 : 12);
      p.vy += (p.grav || 0) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'rasengan') p.r = Math.min(34, (p.r || 26) + dt * 4);
      if (p.from === 'enemy') {
        const pl = this.player;
        if (pl && pl.alive && (p.x - pl.bodyX) ** 2 + (p.y - pl.bodyY) ** 2 < (p.r + pl.bodyR * 0.8) ** 2) {
          pl.takeDamage(p.dmg, Math.sign(p.vx) * 260, this);
          this.floater(pl.x, pl.y - 115, '-' + Math.round(p.dmg), '#ff8080', 16);
          if (p.kind === 'chidori') this.burst(p.x, p.y, '#a8e0ff', 16);
          p.life = 0;
          this.burst(p.x, p.y, p.kind === 'chidori' ? '#a8e0ff' : '#ff9a3d', 8);
        }
      } else if (p.from === 'p2' && this.p2) {
        const pl = this.player;
        if (pl && pl.alive && (p.x - pl.bodyX) ** 2 + (p.y - pl.bodyY) ** 2 < (p.r + pl.bodyR * 0.8) ** 2) {
          pl.takeDamage(p.dmg, Math.sign(p.vx) * 260, this);
          this.floater(pl.x, pl.y - 115, '-' + Math.round(p.dmg), '#ff8080', 16);
          p.life = 0;
        }
      } else if (p.from === 'p1' && this.p2) {
        const pl = this.p2;
        if (pl.alive && (p.x - pl.bodyX) ** 2 + (p.y - pl.bodyY) ** 2 < (p.r + pl.bodyR * 0.8) ** 2) {
          pl.takeDamage(p.dmg, Math.sign(p.vx) * 260, this);
          this.floater(pl.x, pl.y - 115, '-' + Math.round(p.dmg), '#ffb0b8', 16);
          p.life = 0;
        }
      } else {
        for (const m of this.monsters) {
          if (!m.alive || (p.hitSet && p.hitSet.has(m))) continue;
          if ((p.x - m.x) ** 2 + (p.y - m.y) ** 2 < (p.r + m.size) ** 2) {
            m.takeDamage(Math.round(p.dmg), Math.sign(p.vx) * 300, this);
            if (p.kind === 'rasengan') this.burst(p.x, p.y, '#7cf5ff', 12);
            if (p.hitSet) p.hitSet.add(m); else p.life = 0;
          }
        }
        if (this.robot && this.robot.alive && !(p.hitSet && p.hitSet.has(this.robot))) {
          const rb = this.robot;
          if ((p.x - rb.bodyX) ** 2 + (p.y - rb.bodyY) ** 2 < (p.r + rb.bodyR) ** 2) {
            const d = rb.takeDamage(p.dmg, Math.sign(p.vx) * 300, this);
            this.floater(rb.x, rb.y - 115, '-' + d, '#ffe680', 16);
            if (p.hitSet) p.hitSet.add(rb); else p.life = 0;
          }
        }
        if (this.mode === 'wall' && this.bricks) {
          for (const b of this.bricks) {
            if (b.hp <= 0) continue;
            if (p.x + p.r > b.x && p.x - p.r < b.x + b.w && p.y + p.r > b.y && p.y - p.r < b.y + b.h) {
              b.hp -= p.dmg;
              if (b.hp <= 0) { this.score++; AudioSys.sfx('brick'); this.burst(p.x, p.y, `hsl(${b.hue},50%,45%)`, 12); }
              if (!p.pierce) p.life = 0;
            }
          }
        }
      }
      if (p.y > this.ground + 10 || p.x < -60 || p.x > W + 60) p.life = 0;
    }
    this.projectiles = this.projectiles.filter(p => p.life > 0);

    // deeltjes & tekstjes
    for (const pt of this.particles) {
      pt.life -= dt; pt.vy += (pt.grav || 900) * dt;
      pt.x += pt.vx * dt; pt.y += pt.vy * dt;
      if (pt.y > this.ground && pt.vy > 0) { pt.y = this.ground; pt.vy *= -0.4; }
    }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const fl of this.floaters) { fl.life -= dt; fl.y -= 40 * dt; }
    this.floaters = this.floaters.filter(f => f.life > 0);
    for (const b of this.banners) b.t += dt;
    this.banners = this.banners.filter(b => b.t < b.dur);
    this.trimFxCaps();
  }

  trimFxCaps() {
    const cap = fxCaps();
    const drop = (arr, max) => {
      if (arr.length > max) arr.splice(0, arr.length - max);
    };
    drop(this.particles, cap.particles);
    drop(this.floaters, cap.floaters);
    drop(this.projectiles, cap.projectiles);
    drop(this.banners, cap.banners);
    if (this.player && this.player.afterimages) drop(this.player.afterimages, cap.afterimages);
    if (this.p2 && this.p2.afterimages) drop(this.p2.afterimages, cap.afterimages);
    if (this.robot && this.robot.afterimages) drop(this.robot.afterimages, cap.afterimages);
  }

  noteCombo() {
    this.maxCombo = Math.max(this.maxCombo || 0, this.combo || 0);
    if (this.combo === 3 || this.combo === 5 || this.combo === 8 || this.combo === 10) {
      haptic(14 + this.combo);
    }
  }

  shake(mag, dur) {
    if (save.shake === false || motionReduced()) return;
    this.shakeMag = mag; this.shakeT = Math.max(this.shakeT, dur);
  }
  burst(x, y, color, n) {
    if (motionReduced()) n = Math.max(2, Math.floor(n * 0.45));
    else if (save.liteFx || Perf.tier >= 1) n = Math.max(3, Math.floor(n * 0.65));
    if (Perf.tier >= 2) n = Math.max(2, Math.floor(n * 0.55));
    const cap = fxCaps();
    const room = cap.particles - this.particles.length;
    n = Math.min(n, Math.max(0, room));
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), sp = rand(60, 320);
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120,
        life: rand(0.3, 0.7), color, size: rand(2, 5) });
    }
  }
  floater(x, y, txt, color, size) {
    const cap = fxCaps();
    if (this.floaters.length >= cap.floaters) this.floaters.shift();
    this.floaters.push({ x, y, txt, color, size: size || 15, life: 1.0 });
  }
  banner(txt, dur, color, size) {
    const cap = fxCaps();
    if (this.banners.length >= cap.banners) this.banners.shift();
    this.banners.push({ txt, dur, color: color || '#fff', size: size || 40, t: 0 });
  }

  /* ------------------------------ TEKENEN ----------------------------- */
  draw(c) {
    if (!c || W < 8 || H < 8) return;
    c.save();
    if (this.shakeT > 0) {
      c.translate(rand(-1, 1) * this.shakeMag, rand(-1, 1) * this.shakeMag);
    }
    drawBackground(c, this.theme, this.t, this.ground);

    if (this.mode === 'adventure' && this.pickups) {
      for (const pk of this.pickups) {
        const meta = PICKUP_META[pk.kind];
        const y = pk.y + (pk.bob || 0);
        c.save();
        const pkBlur = (save.liteFx || Perf.tier >= 1) ? 6 : 14;
        c.shadowColor = meta.color; c.shadowBlur = pkBlur;
        c.fillStyle = meta.color;
        c.beginPath(); c.arc(pk.x, y, 14, 0, TAU); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 2;
        c.beginPath(); c.arc(pk.x, y, 14, 0, TAU); c.stroke();
        c.font = '800 10px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#0a0d18';
        c.fillText(meta.label, pk.x, y + 4);
        c.restore();
      }
    }

    if (this.mode === 'wall') this.drawWall(c);

    for (const m of this.monsters) m.draw(c);
    if (this.robot) this.robot.draw(c);
    if (this.p2) this.p2.draw(c);
    this.player.draw(c);

    // projectielen
    for (const p of this.projectiles) {
      c.save();
      if (p.kind === 'rasengan') {
        drawJutsuOrb(c, p.x, p.y, p.r, p.spin || 0, 'rasengan', 1);
      } else if (p.kind === 'chidori') {
        drawJutsuOrb(c, p.x, p.y, p.r, p.spin || 0, 'chidori', 1);
      } else if (p.kind === 'shuriken') {
        c.translate(p.x, p.y); c.rotate(p.spin || 0);
        c.fillStyle = '#c9d6e8';
        for (let i = 0; i < 4; i++) {
          c.rotate(Math.PI / 2);
          c.beginPath(); c.moveTo(0, 0); c.lineTo(3, -3); c.lineTo(12, 0); c.lineTo(3, 3); c.closePath(); c.fill();
        }
      } else if (p.kind === 'wave') {
        c.shadowColor = '#ffd75e'; c.shadowBlur = 16;
        c.fillStyle = 'rgba(255,215,94,.9)';
        c.beginPath(); c.ellipse(p.x, p.y, p.r, p.r * 1.5, 0, 0, TAU); c.fill();
      } else if (p.kind === 'fire') {
        c.fillStyle = '#ff7a30';
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill();
        c.fillStyle = '#ffd166';
        c.beginPath(); c.arc(p.x - p.vx * 0.01, p.y, p.r * 0.55, 0, TAU); c.fill();
      } else if (p.kind === 'orb') {
        c.fillStyle = 'rgba(180,140,255,.9)';
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill();
      } else { // laser / robolaser
        c.strokeStyle = p.kind === 'robolaser' ? '#ff5d5d' : '#7cf5ff'; c.lineWidth = 5; c.lineCap = 'round';
        c.beginPath(); c.moveTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05); c.lineTo(p.x, p.y); c.stroke();
      }
      c.restore();
    }

    // deeltjes
    for (const pt of this.particles) {
      c.globalAlpha = clamp(pt.life * 2, 0, 1);
      c.fillStyle = pt.color;
      c.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    c.globalAlpha = 1;

    // zwevende tekstjes
    c.textAlign = 'center';
    for (const fl of this.floaters) {
      c.globalAlpha = clamp(fl.life * 1.6, 0, 1);
      c.font = `800 ${fl.size}px -apple-system, sans-serif`;
      c.fillStyle = fl.color;
      c.fillText(fl.txt, fl.x, fl.y);
    }
    c.globalAlpha = 1;
    c.restore();

    this.drawChakraReadyFx(c);

    this.drawHUD(c);

    // banners
    for (const b of this.banners) {
      const k = b.t / b.dur;
      const pop = k < 0.15 ? k / 0.15 : 1;
      const fade = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
      c.save();
      c.globalAlpha = fade;
      c.translate(W / 2, H * 0.34);
      c.scale(0.6 + pop * 0.4, 0.6 + pop * 0.4);
      c.font = `900 ${b.size}px -apple-system, sans-serif`;
      c.textAlign = 'center';
      c.lineWidth = 8; c.strokeStyle = 'rgba(0,0,0,.55)';
      c.strokeText(b.txt, 0, 0);
      c.fillStyle = b.color;
      c.fillText(b.txt, 0, 0);
      c.restore();
    }

    if (IS_TOUCH) this.drawTouchControls(c);

    if (this.hint > 0) {
      c.globalAlpha = clamp(this.hint, 0, 1);
      c.font = '600 15px -apple-system, sans-serif';
      c.fillStyle = '#fff'; c.textAlign = 'center';
      let hintTxt = this.modeHintLine;
      if (!hintTxt) {
        if (Input.dualMode && IS_TOUCH) {
          hintTxt = 'P1 = linker helft · P2 = rechter helft · joystick + aanvalsknoppen';
        } else if (Input.dualMode) {
          hintTxt = 'P1: A/D · W · J/K/L/U · Shift  |  P2: pijltjes · 1/2/3/4/5';
        } else if (IS_TOUCH) {
          hintTxt = 'Links: joystick om te lopen · Rechts: aanvalsknoppen';
        } else {
          hintTxt = 'A/D lopen · W springen · J stomp · K trap · L wapen · U speciaal';
        }
      }
      c.fillText(hintTxt, W / 2, H * 0.2);
      c.globalAlpha = 1;
    }
  }

  drawWall(c) {
    for (const b of this.bricks) {
      if (b.hp <= 0) continue;
      const dmg = 1 - b.hp / b.maxhp;
      c.fillStyle = `hsl(${b.hue}, 42%, ${48 - dmg * 12}%)`;
      c.fillRect(b.x, b.y, b.w, b.h);
      c.fillStyle = 'rgba(255,255,255,.14)';
      c.fillRect(b.x, b.y, b.w, 4);
      c.fillStyle = 'rgba(0,0,0,.2)';
      c.fillRect(b.x, b.y + b.h - 4, b.w, 4);
      if (b.bonus) {
        c.fillStyle = '#ffd75e'; c.font = '700 14px sans-serif'; c.textAlign = 'center';
        c.fillText('★', b.x + b.w / 2, b.y + b.h / 2 + 5);
      }
      // barsten
      if (dmg > 0.25) {
        c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1.5;
        const cx = b.x + (b.seed % b.w), cy = b.y + ((b.seed * 3) % b.h);
        const n = dmg > 0.65 ? 4 : 2;
        for (let i = 0; i < n; i++) {
          const a = (b.seed + i * 2.4) % TAU;
          c.beginPath(); c.moveTo(cx, cy);
          c.lineTo(cx + Math.cos(a) * b.w * 0.4, cy + Math.sin(a) * b.h * 0.5);
          c.stroke();
        }
      }
    }
  }

  drawChakraReadyFx(c) {
    const fighters = [this.player];
    if (this.p2) fighters.push(this.p2);
    for (const f of fighters) {
      if (!f || !f.alive || f.energy < 100) continue;
      const pulse = 0.35 + Math.sin(this.t * 7) * 0.15;
      c.save();
      c.globalAlpha = pulse;
      c.strokeStyle = f.playerSlot === 2 ? '#ffb0b8' : '#7cf5ff';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(f.x, f.y - 55, 38 + Math.sin(this.t * 9) * 4, 0, TAU);
      c.stroke();
      c.restore();
    }
  }

  drawHUD(c) {
    const p = this.player;
    if (p && p.alive && p.maxhp > 0 && p.hp / p.maxhp < 0.28 && !motionReduced()) {
      const a = 0.07 + Math.sin(this.t * 7) * 0.04;
      const g = c.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(180,20,40,${a})`);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    // spelerbalk (niet in 2P — eigen layout)
    const bw = Math.min(240, W * 0.32);
    const bx = 16, by = 18;
    if (this.mode !== 'versus') {
      c.fillStyle = 'rgba(0,0,0,.45)';
      this.rr(c, bx - 4, by - 4, bw + 8, 52, 10); c.fill();
      c.fillStyle = '#333c55'; this.rr(c, bx, by, bw, 15, 6); c.fill();
      c.fillStyle = p.hp / p.maxhp > 0.35 ? '#6ee06e' : '#ff6b6b';
      this.rr(c, bx, by, bw * clamp(p.hp / p.maxhp, 0, 1), 15, 6); c.fill();
      c.fillStyle = '#333c55'; this.rr(c, bx, by + 20, bw, 11, 5); c.fill();
      c.fillStyle = p.energy >= 100 ? '#7cf5ff' : '#3db8ff';
      this.rr(c, bx, by + 20, bw * p.energy / 100, 11, 5); c.fill();
      c.font = '800 10px -apple-system, sans-serif';
      c.fillStyle = 'rgba(255,255,255,.85)'; c.textAlign = 'left';
      c.fillText('CHAKRA', bx + 6, by + 29);
      c.font = '800 13px -apple-system, sans-serif';
      c.fillStyle = '#fff';
      c.fillText(`Lv ${save.lvl}`, bx + bw + 12, by + 13);
      if (p.energy >= 100) {
        c.fillStyle = '#7cf5ff';
        c.fillText('🌀 RASENGAN!', bx + bw + 12, by + 32);
        c.strokeStyle = 'rgba(124,245,255,.55)';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(bx + bw * 0.5, by + 25, 18 + Math.sin(this.t * 8) * 3, 0, TAU);
        c.stroke();
      }
    }

    c.textAlign = 'center';
    if (this.mode === 'adventure') {
      c.font = '800 16px -apple-system, sans-serif';
      c.fillStyle = 'rgba(255,255,255,.9)';
      const wv = Math.max(1, this.waveIdx + 1);
      c.fillText(`Level ${this.level.n} — Golf ${Math.min(wv, this.level.waves.length)}/${this.level.waves.length}`, W / 2, 30);
      if (p.alive) {
        const hpPct = p.hp / Math.max(1, p.maxhp);
        const proj = starsFromHpPct(hpPct);
        c.textAlign = 'right';
        c.font = '800 14px sans-serif';
        c.fillStyle = '#ffd75e';
        c.fillText(`${'★'.repeat(proj)}${'☆'.repeat(3 - proj)}`, W - 14, 30);
        c.textAlign = 'center';
      }
      const boss = this.monsters.find(m => m.elite && m.alive);
      if (boss) {
        const bwid = Math.min(420, W * 0.5);
        c.fillStyle = 'rgba(0,0,0,.5)'; this.rr(c, W / 2 - bwid / 2 - 3, 43, bwid + 6, 16, 8); c.fill();
        c.fillStyle = '#e04f5f'; this.rr(c, W / 2 - bwid / 2, 46, bwid * boss.hp / boss.maxhp, 10, 5); c.fill();
        c.font = '700 12px sans-serif'; c.fillStyle = '#ffb0b8';
        c.fillText(boss.sp.name.toUpperCase(), W / 2, 72);
      }
      if (save.comboHud !== false && this.combo > 1) {
        const pulse = 1 + Math.sin(this.t * 10) * 0.08;
        c.save();
        c.translate(W / 2, 92);
        c.scale(pulse, pulse);
        c.font = '900 20px sans-serif';
        c.fillStyle = this.combo >= 8 ? '#ff7a4d' : '#ffd75e';
        c.shadowColor = this.combo >= 8 ? '#ff7a4d' : '#ffd75e';
        c.shadowBlur = motionReduced() ? 0 : 12;
        c.fillText(`COMBO ×${this.combo}`, 0, 0);
        c.restore();
      }
      if (this.dmgBuffT > 0) {
        c.font = '800 13px sans-serif'; c.fillStyle = '#ff7a4d';
        c.fillText(`RAGE ${Math.ceil(this.dmgBuffT)}s`, W / 2, 108);
      }
      if (this.playerShieldT > 0) {
        c.font = '800 13px sans-serif'; c.fillStyle = '#9fd8ff';
        c.fillText(`Schild ${Math.ceil(this.playerShieldT)}s`, W / 2, this.dmgBuffT > 0 ? 124 : 108);
      }
    } else if (this.mode === 'training') {
      const r = this.robot;
      const half = Math.min(300, W * 0.36);
      if (this.trainTelegraphT > 0 && r.alive) {
        c.save();
        c.globalAlpha = 0.35 + Math.sin(this.t * 18) * 0.2;
        c.strokeStyle = '#7cf5ff';
        c.lineWidth = 4;
        c.beginPath();
        c.arc(r.x, r.y - 48, 42 + Math.sin(this.t * 14) * 6, 0, TAU);
        c.stroke();
        c.restore();
      }
      // robotbalk rechtsboven
      c.fillStyle = 'rgba(0,0,0,.45)'; this.rr(c, W - half - 20, by - 4, half + 8, 30, 10); c.fill();
      c.fillStyle = '#333c55'; this.rr(c, W - half - 16, by, half, 15, 6); c.fill();
      c.fillStyle = '#ff8080';
      const frac = clamp(r.hp / r.maxhp, 0, 1);
      this.rr(c, W - 16 - half * frac, by, half * frac, 15, 6); c.fill();
      c.font = '800 13px sans-serif'; c.textAlign = 'right'; c.fillStyle = '#fff';
      c.fillText('RABBITROBOT', W - 20, by + 30);
      // timer + rondepunten
      c.textAlign = 'center';
      c.font = '800 12px sans-serif';
      c.fillStyle = 'rgba(255,255,255,.65)';
      c.fillText(`Ronde ${this.round} · eerst 2 wint · ${this.roundsP}-${this.roundsR}`, W / 2, 68);
      const tLeft = Math.ceil(Math.max(0, this.roundTimer));
      const urgent = this.roundTimer < 15 && this.phase === 'fight';
      c.font = urgent ? '900 28px sans-serif' : '900 26px sans-serif';
      c.fillStyle = urgent ? '#ff9a9a' : '#fff';
      if (urgent && !motionReduced()) {
        c.save();
        c.translate(W / 2, 40);
        c.scale(1 + Math.sin(this.t * 10) * 0.05, 1 + Math.sin(this.t * 10) * 0.05);
        c.fillText(String(tLeft), 0, 0);
        c.restore();
      } else {
        c.fillText(String(tLeft), W / 2, 40);
      }
      for (let i = 0; i < 2; i++) {
        c.fillStyle = i < this.roundsP ? '#7cfc8a' : 'rgba(255,255,255,.25)';
        c.beginPath(); c.arc(W / 2 - 34 - i * 18, 82, 6, 0, TAU); c.fill();
        c.fillStyle = i < this.roundsR ? '#ff6b6b' : 'rgba(255,255,255,.25)';
        c.beginPath(); c.arc(W / 2 + 34 + i * 18, 82, 6, 0, TAU); c.fill();
      }
    } else if (this.mode === 'wall') {
      const tLeft = Math.ceil(Math.max(0, this.wallTimer));
      const urgent = this.wallTimer < 10;
      c.font = '900 30px sans-serif';
      c.fillStyle = urgent ? '#ff6b6b' : '#fff';
      if (urgent && !motionReduced()) {
        c.save();
        c.translate(W / 2, 42);
        c.scale(1 + Math.sin(this.t * 12) * 0.06, 1 + Math.sin(this.t * 12) * 0.06);
        c.fillText(String(tLeft), 0, 0);
        c.restore();
      } else {
        c.fillText(String(tLeft), W / 2, 42);
      }
      c.font = '800 17px sans-serif'; c.fillStyle = '#ffd75e';
      c.fillText(`Stenen: ${this.score}`, W / 2, 68);
      c.font = '700 13px sans-serif';
      const rec = Math.max(save.bestWall, this.score);
      c.fillStyle = this.score > 0 && this.score >= save.bestWall ? '#7cfc8a' : 'rgba(255,255,255,.5)';
      c.fillText(`Record: ${rec}`, W / 2, 86);
      if (this.combo > 1) {
        const pulse = 1 + Math.sin(this.t * 10) * 0.1;
        c.save();
        c.translate(W / 2, 112);
        c.scale(pulse, pulse);
        c.font = '900 22px sans-serif'; c.fillStyle = '#7cf5ff';
        c.fillText(`COMBO ×${this.combo}`, 0, 0);
        c.font = '700 12px sans-serif'; c.fillStyle = 'rgba(124,245,255,.85)';
        c.fillText(`+${Math.min(this.combo, 12) * 4}% sloop`, 0, 18);
        c.restore();
      }
    } else if (this.mode === 'versus' && this.p2) {
      const p2 = this.p2;
      const half = Math.min(280, W * 0.34);
      const name1 = vsRosterEntry(this.p1Pick).name;
      const name2 = vsRosterEntry(this.p2Pick).name;
      c.fillStyle = 'rgba(0,0,0,.45)'; this.rr(c, bx - 4, by - 4, half + 8, 44, 10); c.fill();
      c.fillStyle = '#333c55'; this.rr(c, bx, by, half, 14, 6); c.fill();
      c.fillStyle = p.hp / p.maxhp > 0.35 ? '#6ee06e' : '#ff6b6b';
      this.rr(c, bx, by, half * clamp(p.hp / p.maxhp, 0, 1), 14, 6); c.fill();
      c.font = '800 11px sans-serif'; c.textAlign = 'left'; c.fillStyle = '#7cf5ff';
      c.fillText(`P1 · ${name1}`, bx, by + 30);
      c.fillStyle = '#333c55'; this.rr(c, bx, by + 34, half, 5, 3); c.fill();
      c.fillStyle = p.energy >= 100 ? '#7cf5ff' : '#3db8ff';
      this.rr(c, bx, by + 34, half * (p.energy / 100), 5, 3); c.fill();

      c.fillStyle = 'rgba(0,0,0,.45)'; this.rr(c, W - half - 20, by - 4, half + 8, 44, 10); c.fill();
      c.fillStyle = '#333c55'; this.rr(c, W - half - 16, by, half, 14, 6); c.fill();
      c.fillStyle = '#ff8080';
      const frac2 = clamp(p2.hp / p2.maxhp, 0, 1);
      this.rr(c, W - 16 - half * frac2, by, half * frac2, 14, 6); c.fill();
      c.textAlign = 'right'; c.fillStyle = '#ffb0b8';
      c.fillText(`${name2} · P2`, W - 20, by + 30);
      c.fillStyle = '#333c55'; this.rr(c, W - half - 16, by + 34, half, 5, 3); c.fill();
      c.fillStyle = p2.energy >= 100 ? '#7cf5ff' : '#3db8ff';
      this.rr(c, W - half - 16, by + 34, half * (p2.energy / 100), 5, 3); c.fill();

      c.textAlign = 'center';
      const tLeft = Math.ceil(Math.max(0, this.roundTimer));
      const urgent = this.roundTimer < 15 && this.phase === 'fight';
      c.font = urgent ? '900 28px sans-serif' : '900 26px sans-serif';
      c.fillStyle = urgent ? '#ff9a9a' : '#fff';
      if (urgent && !motionReduced()) {
        c.save();
        c.translate(W / 2, 38);
        c.scale(1 + Math.sin(this.t * 10) * 0.05, 1 + Math.sin(this.t * 10) * 0.05);
        c.fillText(String(tLeft), 0, 0);
        c.restore();
      } else {
        c.fillText(String(tLeft), W / 2, 38);
      }
      c.font = '800 12px sans-serif'; c.fillStyle = 'rgba(255,255,255,.75)';
      c.fillText(`Ronde ${this.round} · eerst 2 wint · ${this.roundsP1}-${this.roundsP2}`, W / 2, 56);
      const mp1 = this.roundsP1 === 1 && this.roundsP2 < 2;
      const mp2 = this.roundsP2 === 1 && this.roundsP1 < 2;
      for (let i = 0; i < 2; i++) {
        const litP1 = i < this.roundsP1;
        c.fillStyle = litP1 ? '#7cf5ff' : 'rgba(255,255,255,.22)';
        if (mp1 && i === 1) c.fillStyle = '#ffd75e';
        c.beginPath(); c.arc(W / 2 - 40 - i * 16, 72, mp1 && i === 1 ? 6 : 5, 0, TAU); c.fill();
        const litP2 = i < this.roundsP2;
        c.fillStyle = litP2 ? '#ffb0b8' : 'rgba(255,255,255,.22)';
        if (mp2 && i === 1) c.fillStyle = '#ffd75e';
        c.beginPath(); c.arc(W / 2 + 40 + i * 16, 72, mp2 && i === 1 ? 6 : 5, 0, TAU); c.fill();
      }
      if (p.energy >= 100) {
        c.font = '800 10px sans-serif'; c.fillStyle = '#7cf5ff';
        c.fillText('🌀', bx + half - 8, by + 12);
      }
      if (p2.energy >= 100) {
        c.font = '800 10px sans-serif'; c.fillStyle = '#7cf5ff';
        c.textAlign = 'right';
        c.fillText('🌀', W - 20, by + 12);
        c.textAlign = 'center';
      }
    }
  }

  rr(c, x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  drawTouchControls(c) {
    if (Input.dualMode) {
      this.drawPad(c, Input, this.player, 'P1', '#7cf5ff');
      this.drawPad(c, InputP2, this.p2 || this.player, 'P2', '#ffb0b8');
      return;
    }
    c.save();
    const j = Input.joy;
    const jx = j.active ? j.ox : (Input.joyHome?.x || 110), jy = j.active ? j.oy : (Input.joyHome?.y || H - 110);
    c.globalAlpha = j.active ? 0.5 : 0.22;
    c.strokeStyle = '#fff'; c.lineWidth = 3;
    c.beginPath(); c.arc(jx, jy, 52, 0, TAU); c.stroke();
    c.globalAlpha = j.active ? 0.65 : 0.3;
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(jx + (j.active ? j.dx : 0), jy + (j.active ? j.dy * 0.3 : 0), 26, 0, TAU); c.fill();
    // knoppen
    for (const b of Input.buttons) {
      c.globalAlpha = b.held ? 0.85 : 0.45;
      c.fillStyle = b.color;
      c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
      c.globalAlpha = b.held ? 1 : 0.85;
      c.font = `${b.r * 0.85}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(b.label, b.x, b.y + 2);
      if (b.id === 'special' && this.player.energy >= 100) {
        c.globalAlpha = 0.9;
        c.strokeStyle = '#7cf5ff'; c.lineWidth = 4;
        c.beginPath(); c.arc(b.x, b.y, b.r + 5 + Math.sin(this.t * 8) * 2, 0, TAU); c.stroke();
      }
      if (b.id === 'subst' && this.player.substCd > 0) {
        c.globalAlpha = 0.35;
        c.fillStyle = '#000';
        c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
      }
    }
    c.textBaseline = 'alphabetic';
    c.restore();
  }

  drawPad(c, pad, fighter, label, accent) {
    c.save();
    const j = pad.joy;
    const jx = j.active ? j.ox : pad.joyHome.x, jy = j.active ? j.oy : pad.joyHome.y;
    c.globalAlpha = 0.35;
    c.strokeStyle = accent;
    c.lineWidth = 3;
    c.beginPath(); c.arc(jx, jy, 48, 0, TAU); c.stroke();
    c.globalAlpha = j.active ? 0.55 : 0.25;
    c.fillStyle = accent;
    c.beginPath(); c.arc(jx + (j.active ? j.dx : 0), jy + (j.active ? j.dy * 0.25 : 0), 22, 0, TAU); c.fill();
    c.font = '900 11px sans-serif'; c.fillStyle = accent; c.textAlign = 'center';
    c.fillText(label, jx, jy - 58);
    for (const b of pad.buttons) {
      c.globalAlpha = b.held ? 0.85 : 0.42;
      c.fillStyle = b.color;
      c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
      c.globalAlpha = 0.9;
      c.font = `${b.r * 0.8}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(b.label, b.x, b.y + 2);
      if (b.id === 'special' && fighter && fighter.energy >= 100) {
        c.strokeStyle = accent; c.lineWidth = 3;
        c.beginPath(); c.arc(b.x, b.y, b.r + 4, 0, TAU); c.stroke();
      }
    }
    c.textBaseline = 'alphabetic';
    c.restore();
  }
}

/* ================================= UI ================================== */
const UI = {
  screens: ['menuScreen', 'levelScreen', 'weaponScreen', 'styleScreen', 'settingsScreen', 'missionsScreen', 'charSelectScreen', 'dexScreen', 'helpScreen', 'installScreen', 'resultScreen', 'pauseScreen'],
  charPickStep: 1,
  lastResult: null,
  pauseSubDefault: 'Rasengan klaar — moto! · voortgang blijft op dit apparaat',

  refreshPauseSubtitle() {
    const sub = document.querySelector('#pauseScreen .subtitle');
    if (!sub) return;
    if (game?.mode === 'versus' && game.p2) {
      const a = vsRosterEntry(game.p1Pick).name;
      const b = vsRosterEntry(game.p2Pick).name;
      sub.textContent = `2P ${game.roundsP1}-${game.roundsP2} · ronde ${game.round} · ${a} vs ${b}`;
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
          requestAnimationFrame(() => { try { el.scrollTop = 0; } catch (_) {} });
        }
        if (id === 'pauseScreen') this.refreshPauseSubtitle();
      } else if (game?.mode === 'versus') {
        this.refreshPauseSubtitle();
      }
      const pauseBtn = document.getElementById('pauseBtn');
      if (pauseBtn) pauseBtn.classList.toggle('show', !id && !!game && state !== 'result');
    } catch (err) {
      console.error('[Stickman] UI.show', err);
    }
    syncPlayLayer();
  },

  syncTouchClass() {
    document.body.classList.toggle('big-touch', save.bigTouch !== false);
    syncA11yClasses();
  },

  goBack() {
    AudioSys.sfx('select');
    const active = this.screens.find(sid => document.getElementById(sid)?.classList.contains('active'));
    if (active === 'charSelectScreen' && this.charPickStep === 2) {
      this.charPickStep = 1;
      this.renderCharSelect();
      return;
    }
    if (active === 'pauseScreen' && game) {
      state = 'play';
      this.show(null);
      return;
    }
    if (active === 'resultScreen') {
      this.goMenu();
      return;
    }
    this.goMenu();
  },

  toast(msg, ms) {
    const host = document.getElementById('toastHost');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => el.remove(), ms || 2800);
  },

  goMenu() {
    game = null;
    state = 'menu';
    window.__sfLoopErr = false;
    Input.dualMode = false;
    Input.layout(W, H);
    this.syncTouchClass();
    this.renderMenu();
    this.show('menuScreen');
    AudioSys.setPaused(false);
    AudioSys.play('menu');
    if (window.StickInstall) window.StickInstall.refreshMenuButton();
  },

  renderCharSelect() {
    this.charPickStep = this.charPickStep || 1;
    const stepEl = document.getElementById('charPickStep');
    if (stepEl) {
      stepEl.textContent = this.charPickStep === 1
        ? 'Speler 1 — tik een vechter (linker joystick-zone)'
        : 'Speler 2 — tik een vechter (rechter joystick-zone)';
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
    if (statEl) statEl.innerHTML = vsStatPreviewHtml(e1, e2);
    grid.innerHTML = '';
    for (const r of VS_ROSTER) {
      const ok = vsUnlocked(r);
      const el = document.createElement('div');
      const sel1 = vsSelect.p1 === r.id;
      const sel2 = vsSelect.p2 === r.id;
      const focus = ok && ((this.charPickStep === 1 && !sel1) || (this.charPickStep === 2 && !sel2));
      el.className = 'char-card' + (ok ? '' : ' locked') + (sel1 ? ' p1sel' : '') + (sel2 ? ' p2sel' : '') +
        (focus ? ' pick-hint' : '');
      const cv = document.createElement('canvas');
      cv.width = 80; cv.height = 80;
      const cc = cv.getContext('2d');
      cc.translate(40, 62); cc.scale(0.95, 0.95);
      const prev = buildVsFighter(r, 0, 1);
      prev.draw(cc);
      el.appendChild(cv);
      const cap = document.createElement('div');
      cap.className = 'char-name';
      cap.textContent = r.name;
      el.appendChild(cap);
      const tag = document.createElement('div');
      tag.className = 'char-tag';
      tag.textContent = ok ? r.tag : r.hint || 'Locked';
      el.appendChild(tag);
      if (ok) {
        const mini = document.createElement('div');
        mini.className = 'char-mini-stat';
        const st = vsFighterStats(r);
        mini.textContent = `HP ${st.hp} · ${st.dmg}% dmg`;
        el.appendChild(mini);
        el.addEventListener('click', () => {
          AudioSys.sfx('select');
          if (this.charPickStep === 1) {
            vsSelect.p1 = r.id;
            this.charPickStep = 2;
            this.renderCharSelect();
          } else {
            vsSelect.p2 = r.id;
            this.renderCharSelect();
          }
        });
      }
      grid.appendChild(el);
    }
    requestAnimationFrame(() => {
      const pick = grid.querySelector(
        this.charPickStep === 1 ? '.char-card.p1sel' : '.char-card.p2sel'
      );
      if (pick) pick.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    const fightBtn = document.getElementById('btnCharFight');
    if (fightBtn) {
      fightBtn.disabled = !(vsSelect.p1 && vsSelect.p2);
      fightBtn.onclick = () => {
        if (!vsSelect.p1 || !vsSelect.p2) return;
        AudioSys.sfx('bell');
        startGame('versus', { p1: vsSelect.p1, p2: vsSelect.p2 });
      };
    }
    const backBtn = document.getElementById('charSelectBack');
    if (backBtn) {
      backBtn.textContent = this.charPickStep === 2 ? '\u2190 Andere P1' : '\u2190 Menu';
    }
    const backP = document.getElementById('charPickBackP1');
    if (backP) {
      backP.style.display = this.charPickStep === 2 ? 'flex' : 'none';
      if (!backP.dataset.bound) {
        backP.dataset.bound = '1';
        backP.addEventListener('click', () => {
          AudioSys.sfx('select');
          this.charPickStep = 1;
          this.renderCharSelect();
        });
      }
    }
    const bindPickPill = (id, step) => {
      const pill = document.getElementById(id);
      if (!pill || pill.dataset.bound) return;
      pill.dataset.bound = '1';
      pill.addEventListener('click', () => {
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
      swapBtn.addEventListener('click', () => {
        AudioSys.sfx('select');
        const t = vsSelect.p1;
        vsSelect.p1 = vsSelect.p2;
        vsSelect.p2 = t;
        this.renderCharSelect();
        UI.toast('P1 ↔ P2 omgewisseld', 1800);
      });
    }
    const rnd = document.getElementById('btnCharRandom');
    if (rnd && !rnd.dataset.bound) {
      rnd.dataset.bound = '1';
      rnd.addEventListener('click', () => {
        AudioSys.sfx('select');
        const pool = VS_ROSTER.filter(vsUnlocked);
        if (pool.length < 2) return;
        const a = choice(pool);
        let b = choice(pool);
        for (let i = 0; i < 8 && b.id === a.id; i++) b = choice(pool);
        vsSelect.p1 = a.id;
        vsSelect.p2 = b.id;
        this.charPickStep = 2;
        this.renderCharSelect();
        UI.toast(`${a.name} vs ${b.name}!`, 2400);
      });
    }
  },

  renderMenu() {
    this.syncTouchClass();
    const need = xpNeed(save.lvl);
    const w = weaponById(save.weapon);
    const st = styleById(save.style || 'classic');
    document.getElementById('menuStats').innerHTML =
      `Vechter <b>Lv ${save.lvl}</b> &nbsp;·&nbsp; Wapen: <b>${w.name}</b> &nbsp;·&nbsp; ` +
      `Stijl: <b style="color:${st.accent}">${st.name}</b> &nbsp;·&nbsp; ` +
      `Monsterboek: <b>${dexCount()}/${SPECIES_ORDER.length}</b> &nbsp;·&nbsp; Muur: <b>${save.bestWall}</b>` +
      `<div class="xpline"><div style="width:${Math.round(save.xp / need * 100)}%"></div></div>` +
      `<div style="font-size:12px;margin-top:4px;opacity:.85">${save.xp}/${need} XP · ${save.trainWins} train-wins</div>`;
    const cont = document.getElementById('btnContinue');
    const lp = save.lastPlay;
    if (cont) {
      if (lp && lp.mode) {
        const labels = { adventure: `Avontuur Lv ${lp.level || 1}`, training: 'Training', wall: 'Muur', versus: '2 spelers' };
        cont.style.display = 'flex';
        cont.querySelector('div').innerHTML =
          `Verder spelen<small>${labels[lp.mode] || lp.mode} — direct verder</small>`;
      } else cont.style.display = 'none';
    }
    document.getElementById('togMusic').classList.toggle('off', !save.music);
    document.getElementById('togSfx').classList.toggle('off', !save.sfx);
    ensureDaily();
    const verLine = document.getElementById('menuVerLine');
    if (verLine) verLine.textContent = 'v' + APP_VERSION + ' · iPad-tap fix · SW actief';
    const missEl = document.getElementById('menuDailyHint');
    if (missEl) missEl.textContent = dailyStatusLine();
    const tipEl = document.getElementById('menuTipLine');
    if (tipEl) {
      const tips = [
        'Tip: volle chakra → tik 🌀 voor Rasengan',
        'Tip: 2 spelers = liggend iPad, P1 links / P2 rechts',
        'Tip: muur-combo’s = sneller sloop & meer XP',
        'Tip: monsterboek vullen = meer max HP',
        'Tip: “Verder spelen” hervat je laatste modus',
        'Tip: Missies → claim XP (of “Claim alle klaar”)',
        'Tip: Zet in app-lade → speelt offline na 1× online',
      ];
      const i = Math.floor(Date.now() / 8000) % tips.length;
      tipEl.textContent = tips[i];
    }
    const playLinkEl = document.getElementById('menuPlayLink');
    if (playLinkEl) {
      if (location.hostname.endsWith('.github.io')) {
        playLinkEl.textContent = '✓ GitHub Pages — stabiele link (Deel speel-link in menu)';
      } else if (!playLinkEl.dataset.loaded) {
        playLinkEl.dataset.loaded = '1';
        loadHostingBundle().then(({ hosting }) => {
          const u = pickStablePlayUrl(hosting);
          if (u) {
            playLinkEl.innerHTML =
              `Vaste link (iPad): <a href="${u}" style="color:#7cf5ff;font-weight:800">${u.replace(/^https:\/\//, '')}</a>`;
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
    const sub = document.getElementById('missionsSub');
    if (sub) {
      sub.textContent = save.daily.dayBonusClaimed
        ? 'Dag voltooid — morgen 3 nieuwe lichte missies'
        : '3 lichte dagmissies · geen grind · claim wanneer klaar';
    }
    const sum = document.getElementById('missionsSummary');
    if (sum) {
      sum.style.display = 'block';
      const bonusLeft = !save.daily.dayBonusClaimed;
      sum.innerHTML = `<b>${doneN}/3</b> klaar · <b>${claimedN}/3</b> geclaimd` +
        (readyN ? ` · <b style="color:#ffd75e">${readyN} klaar om te claimen</b>` : '') +
        (bonusLeft
          ? (claimedN === 3
            ? ' · <b style="color:#7cfc8a">dagbonus +80 XP klaar</b>'
            : ` · dagbonus na ${3 - claimedN} claim${3 - claimedN === 1 ? '' : 's'}`)
          : ' · dagbonus ✔');
    }
    const claimAll = document.getElementById('dailyClaimAllBtn');
    if (claimAll) {
      claimAll.style.display = readyN >= 2 ? 'flex' : 'none';
      const lab = claimAll.querySelector('div');
      if (lab) {
        const xpSum = claimableDailyTasks().reduce((n, t) => n + (dailyDef(t.id)?.xp || 0), 0);
        lab.innerHTML = `Claim alle klaar<small>+${xpSum} XP in één tik</small>`;
      }
    }
    dailyHost.innerHTML = '';
    for (const t of tasks) {
      const def = dailyDef(t.id);
      if (!def) continue;
      const el = document.createElement('div');
      const claimable = t.done && !t.claimed;
      el.className = 'step-card mission-card' + (claimable ? ' claimable' : '') + (t.claimed ? ' claimed' : '');
      const pct = Math.min(100, Math.round(t.progress / def.goal * 100));
      let status;
      if (t.claimed) status = '<span style="color:#7cfc8a">✔ Geclaimd</span>';
      else if (t.done) status = '<span style="color:#ffd75e">Klaar — claim je XP</span>';
      else status = `<span style="opacity:.85">Bezig ${t.progress}/${def.goal}</span>`;
      el.innerHTML = `<b>${def.text}</b><br>${status}` +
        `<div style="opacity:.8;font-size:13px;margin-top:4px">Beloning +${def.xp} XP</div>` +
        `<div class="xpline" style="margin-top:8px"><div style="width:${pct}%"></div></div>`;
      if (claimable) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn claim-btn';
        btn.textContent = `Claim +${def.xp} XP`;
        btn.addEventListener('click', () => { AudioSys.sfx('select'); claimDailyTask(t.id); });
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
        if (label) label.innerHTML = 'Dagbonus geclaimd<small>Morgen weer nieuw</small>';
      } else {
        bonusBtn.classList.remove('done');
        bonusBtn.style.display = 'flex';
        bonusBtn.disabled = !ready;
        bonusBtn.style.opacity = ready ? '1' : '0.45';
        if (label) {
          label.innerHTML = ready
            ? 'Dagbonus claimen<small>+80 XP · tik hier</small>'
            : `Dagbonus<small>Nog ${3 - claimedN} claim${3 - claimedN === 1 ? '' : 's'} nodig</small>`;
        }
      }
    }
    const achSum = document.getElementById('achSummary');
    const gotN = Object.keys(save.achievements).length;
    if (achSum) achSum.textContent = `${gotN}/${ACHIEVEMENTS.length} unlocked · blijven staan (geen daily reset)`;
    achHost.innerHTML = '';
    const today = todayKey();
    for (const ach of ACHIEVEMENTS) {
      const got = save.achievements[ach.id];
      const el = document.createElement('div');
      const isNew = got === today;
      el.className = 'card' + (got ? '' : ' locked') + (isNew ? ' ach-card new' : '');
      el.style.borderColor = got ? (isNew ? '#7cf5ff' : '#ffd75e') : undefined;
      el.innerHTML = `<div class="cname">${ach.icon} ${ach.name}${isNew ? ' · nieuw' : ''}</div>` +
        `<div class="cinfo">${ach.desc}${got ? ' · ✔ ' + got : ' · nog open'}</div>`;
      achHost.appendChild(el);
    }
  },

  renderHosting() {
    const linkEl = document.getElementById('hostingLink');
    const hintEl = document.getElementById('hostingHint');
    const curEl = document.getElementById('hostingCurrent');
    if (!linkEl) return;
    loadHostingBundle()
      .then(({ hosting, liveUrl }) => {
        const stable = pickStablePlayUrl(hosting) || liveUrl || hosting.tunnel || hosting.netlifyUrl || headLiveFromPage();
        linkEl.textContent = stable || '—';
        const onTunnel = location.hostname.endsWith('.loca.lt') || location.hostname.includes('trycloudflare');
        if (curEl) {
          if (onTunnel && location.protocol !== 'file:') {
            curEl.style.display = 'block';
            curEl.textContent = 'Huidige sessie: ' + location.href.split('?')[0].split('#')[0];
          } else curEl.style.display = 'none';
        }
        let hint = hosting.stableHint || '';
        if (!hint) {
          if (stable && stable.includes('github.io')) {
            hint = 'Primair: GitHub Pages — bookmark op iPad (Safari → Delen → Zet op beginscherm).';
          } else if (location.hostname.endsWith('.github.io')) hint = 'Je speelt via GitHub Pages.';
          else if (location.hostname.endsWith('.netlify.app')) hint = 'Netlify-host — export save bij URL-wissel.';
          else hint = 'Tunnel is fallback — gebruik de vaste link hierboven voor je iPad.';
        }
        if (hosting.netlifyUrl && hosting.netlifyReadyAfter) {
          hint += ` Netlify (${hosting.netlifyUrl}) kan Forbidden geven tot ~${hosting.netlifyReadyAfter}.`;
        }
        if (hintEl) hintEl.textContent = hint;
      })
      .catch(() => {
        linkEl.textContent = location.origin;
        if (hintEl) hintEl.textContent = 'Speel via huidige link; export save bij URL-wissel.';
      });
  },

  renderLevels() {
    const grid = document.getElementById('levelGrid');
    grid.innerHTML = '';
    for (let n = 1; n <= MAX_LEVEL; n++) {
      const el = document.createElement('div');
      const boss = !!BOSS_AT[n];
      const locked = n > save.unlocked;
      const info = buildLevel(n);
      const rar = rarityOf(info.rarityCap);
      el.className = 'lvl' + (boss ? ' boss' : '') + (locked ? ' locked' : '') + (n < save.unlocked ? ' cleared' : '');
      el.style.boxShadow = locked ? 'none' : `0 5px 0 rgba(0,0,0,.35), 0 0 0 2px ${rar.color}55`;
      el.innerHTML = locked
        ? '&#128274;'
        : `${n}${boss ? '<small>BAAS</small>' : `<small style="color:${rar.color}">${rar.name}</small>`}` +
          (save.stars[n] ? `<span class="lvl-stars">${'★'.repeat(save.stars[n])}</span>` : '');
      if (!locked) {
        el.title = `${info.waves.length} golven · ${starHintLine()}`;
        el.addEventListener('click', () => { AudioSys.sfx('select'); startGame('adventure', { level: n }); });
      }
      grid.appendChild(el);
    }
  },

  renderWeapons() {
    const list = document.getElementById('weaponList');
    list.innerHTML = '';
    for (const w of WEAPONS) {
      const locked = save.lvl < w.unlock;
      const rar = rarityOf(w.rarity);
      const el = document.createElement('div');
      el.className = 'card rar-' + w.rarity + (save.weapon === w.id ? ' sel' : '') + (locked ? ' locked' : '');
      el.style.borderColor = rar.color + (save.weapon === w.id ? '' : '66');
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
      info.innerHTML = `<div class="cname">${w.name} <span class="rar-pill" style="color:${rar.color};border-color:${rar.color}">${rar.name}</span></div>
        <div class="cinfo">${w.desc} · schade x${w.dmg} · bereik ${w.range} · snelheid x${w.speed}</div>`;
      el.appendChild(info);
      const right = document.createElement('div');
      right.className = 'right';
      right.innerHTML = locked ? `&#128274; Lv ${w.unlock}` : (save.weapon === w.id ? '&#10004; gekozen' : 'kies');
      el.appendChild(right);
      if (!locked) el.addEventListener('click', () => {
        save.weapon = w.id; persist(); AudioSys.sfx('select'); this.renderWeapons();
      });
      list.appendChild(el);
    }
  },

  renderDex() {
    const sumEl = document.getElementById('dexSummary');
    if (sumEl) {
      const totalHp = dexHpBonus();
      const kills = dexTotalKills();
      sumEl.style.display = 'block';
      sumEl.innerHTML =
        `Boek <b>${dexCount()}/${SPECIES_ORDER.length}</b> · kills <b>${kills}</b> · bonus max HP <b>+${totalHp}</b>` +
        `<div class="dex-mini-row">${dexMiniStat('HP', totalHp, SPECIES_ORDER.length * 25, '#6ee06e')}` +
        `${dexMiniStat('Kills', kills, 150, '#ffd75e')}</div>`;
    }
    const list = document.getElementById('dexList');
    list.innerHTML = '';
    for (const id of SPECIES_ORDER) {
      const sp = SPECIES[id];
      const kills = save.dex[id] || 0;
      const rar = rarityOf(sp.rarity);
      const el = document.createElement('div');
      el.className = 'card' + (kills ? '' : ' locked');
      el.style.borderColor = kills ? rar.color : undefined;
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
      info.innerHTML = `<div class="cname">${kills ? sp.name : '???'} ${kills ? `<span class="rar-pill" style="color:${rar.color};border-color:${rar.color}">${rar.name}</span>` : ''}</div>
        <div class="cinfo">${kills ? `${typeLbl} · basis HP ${sp.hp} · dmg ${sp.dmg} · spd ${sp.speed} · ${sp.xp} XP · Lv ${UNLOCK_AT[id] || '?'}` : 'Nog niet verslagen'}</div>${statRow}`;
      el.appendChild(info);
      const right = document.createElement('div');
      right.className = 'right';
      right.style.color = rar.color;
      right.innerHTML = kills ? `${kills}x verslagen<br>+${hpB} max HP` : '';
      el.appendChild(right);
      list.appendChild(el);
    }
  },

  renderStyle() {
    const grid = document.getElementById('styleGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (const st of STYLES) {
      const ok = styleUnlocked(st);
      const el = document.createElement('div');
      el.className = 'style-card' + (save.style === st.id ? ' sel' : '') + (ok ? '' : ' locked');
      el.style.borderColor = ok ? st.accent + '88' : '';
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
      cap.textContent = st.name;
      el.appendChild(cap);
      const sub = document.createElement('div');
      sub.style.fontSize = '11px';
      sub.style.fontWeight = '600';
      sub.style.opacity = '0.75';
      sub.style.marginTop = '4px';
      sub.textContent = ok ? (save.style === st.id ? 'Actief' : 'Tik om te kiezen') : st.hint;
      el.appendChild(sub);
      if (ok) {
        el.addEventListener('click', () => {
          save.style = st.id; persist(); AudioSys.sfx('select');
          this.renderStyle(); this.renderMenu();
          UI.toast(`${st.name} uitgerust`, 2200);
        });
      }
      grid.appendChild(el);
    }
  },

  renderSettings() {
    const verEl = document.getElementById('setAppVersion');
    if (verEl) verEl.textContent = 'Versie ' + APP_VERSION + ' · save-key ongewijzigd';
    const healthEl = document.getElementById('saveHealthLine');
    if (healthEl) {
      const h = saveHealthSummary();
      healthEl.innerHTML =
        `<b>Lv ${h.lvl}</b> · unlock ${h.unlocked} · boek ${h.dex} · kills ${h.kills}<br>` +
        (h.primaryOk ? '✔ Save OK' : '⚠ Geen primary save') +
        (h.backupOk ? ` · ✔ Backup (Lv ${h.backupLvl})` : ' · ⚠ Geen backup') +
        `<br><span style="opacity:.75">Export/import = veiligste overzet · key: ${SAVE_KEY}</span>`;
    }
    const pct = (v, d) => Math.round((Number(v ?? d)) * 100);
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    setVal('setMusicVol', pct(save.musicVol, 0.85));
    setVal('setSfxVol', pct(save.sfxVol, 1));
    const lblM = document.getElementById('setMusicVolLbl');
    const lblS = document.getElementById('setSfxVolLbl');
    if (lblM) lblM.textContent = pct(save.musicVol, 0.85) + '%';
    if (lblS) lblS.textContent = pct(save.sfxVol, 1) + '%';
    ['setShake', 'setHaptics', 'setComboHud', 'setBigTouch', 'setReducedMotion', 'setLiteFx', 'setHighContrast'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      const keys = ['shake', 'haptics', 'comboHud', 'bigTouch', 'reducedMotion', 'liteFx', 'highContrast'];
      const key = keys[i];
      let off = save[key] === false;
      if (key === 'reducedMotion') off = !save.reducedMotion && !systemPrefersReducedMotion();
      if (key === 'highContrast') off = !save.highContrast;
      el.classList.toggle('off', off);
    });
    document.getElementById('togMusic')?.classList.toggle('off', !save.music);
    document.getElementById('togSfx')?.classList.toggle('off', !save.sfx);
  },

  renderPauseToggles() {
    document.getElementById('pauseTogMusic')?.classList.toggle('off', !save.music);
    document.getElementById('pauseTogSfx')?.classList.toggle('off', !save.sfx);
  },

  showResult(win, data) {
    this.lastResult = data;
    state = 'result';
    document.getElementById('pauseBtn').classList.remove('show');
    const title = document.getElementById('resTitle');
    title.textContent = data.title;
    title.className = 'bigres ' + (win ? 'win' : 'lose');
    document.getElementById('resDetail').textContent = data.detail;
    document.getElementById('resXp').textContent = `+${data.xp} XP verdiend · nu Lv ${save.lvl} (${save.xp}/${xpNeed(save.lvl)} XP)`;
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
        if (data.mode === 'versus') label.innerHTML = 'Rematch<small>Zelfde vechters</small>';
        else if (data.mode === 'training') label.innerHTML = 'Opnieuw<small>vs RabbitRobot</small>';
        else label.innerHTML = 'Opnieuw';
      }
    }
    this.show('resultScreen');
    AudioSys.setPaused(false);
    AudioSys.play('menu');
    AudioSys.applyVolumes();
  },
};

/* ============================ SPELSTART ================================ */
let state = 'menu';

function startGame(mode, opts) {
  opts = opts || {};
  const allowed = { adventure: 1, training: 1, wall: 1, versus: 1 };
  if (!allowed[mode]) {
    try { UI.toast('Onbekende modus', 2200); } catch (_) {}
    return;
  }
  window.__sfLoopErr = false;
  try { dismissTunnelOverlayIfStatic(); } catch (_) {}
  if (mode === 'versus') {
    try {
      opts.p1 = normalizeVsPick(opts.p1 || vsSelect.p1, 'hero');
      opts.p2 = normalizeVsPick(opts.p2 || vsSelect.p2, 'rabbit');
    } catch (_) {
      opts.p1 = 'hero'; opts.p2 = 'rabbit';
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
  try { AudioSys.setPaused(false); } catch (_) {}
  try { recordLastPlay(mode, opts); } catch (_) {}
  try { showModeOnboarding(mode); } catch (_) {}
  try { playModeHint(game, mode); } catch (_) {}
  try { UI.show(null); } catch (_) { syncPlayLayer(); }
  try {
    if (mode === 'training') AudioSys.play('boss');
    else if (mode === 'adventure') AudioSys.play(game.level && game.level.boss ? 'boss' : 'battle');
    else if (mode === 'versus') AudioSys.play('boss');
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
    try { handler(e); } catch (err) { console.error(err); }
  };
  el.addEventListener('click', run);
  el.addEventListener('touchend', (e) => {
    if (e.cancelable) e.preventDefault();
    run(e);
  }, { passive: false });
}

bindPress(document.getElementById('btnAdventure'), () => {
  AudioSys.init(); AudioSys.sfx('select'); UI.renderLevels(); UI.show('levelScreen');
});
const btnContinue = document.getElementById('btnContinue');
bindPress(btnContinue, () => {
  AudioSys.init(); AudioSys.sfx('select');
  if (!resumeLastPlay()) UI.toast('Nog geen sessie — kies een modus', 2400);
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
bindPress(document.getElementById('btnWeapons'), () => {
  AudioSys.init(); AudioSys.sfx('select'); UI.renderWeapons(); UI.show('weaponScreen');
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
  const n = claimableDailyTasks().length;
  if (n > 0) {
    setTimeout(() => UI.toast(n === 1 ? '1 missie klaar om te claimen' : `${n} missies klaar om te claimen`, 2600), 200);
  } else if (save.daily && save.daily.tasks.every(t => t.claimed) && !save.daily.dayBonusClaimed) {
    setTimeout(() => UI.toast('Dagbonus +80 XP staat klaar', 2600), 200);
  }
});
const dailyClaimAllBtn = document.getElementById('dailyClaimAllBtn');
if (dailyClaimAllBtn) dailyClaimAllBtn.addEventListener('click', () => {
  AudioSys.init(); AudioSys.sfx('select'); claimAllDailyReady();
});
const dailyBonusBtn = document.getElementById('dailyBonusBtn');
if (dailyBonusBtn) dailyBonusBtn.addEventListener('click', () => {
  AudioSys.sfx('select'); claimDailyDayBonus();
});
const btnCopyLink = document.getElementById('btnCopyLink');
if (btnCopyLink) btnCopyLink.addEventListener('click', () => copyPlayLink());
const btnOpenPlayLink = document.getElementById('btnOpenPlayLink');
if (btnOpenPlayLink) btnOpenPlayLink.addEventListener('click', async () => {
  AudioSys.sfx('select');
  const url = await resolveSharePlayUrl();
  if (url) window.open(url, '_blank', 'noopener');
});
const btnExportSave = document.getElementById('btnExportSave');
if (btnExportSave) btnExportSave.addEventListener('click', async () => {
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
  UI.toast(clipped
    ? 'Save in klembord + vak — bewaar veilig'
    : 'Save in vak — selecteer & kopieer handmatig', 3400);
  UI.renderSettings();
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
    const { save: next, meta } = previewImportSave(ta.value);
    if (!window.__sfImportConfirm) {
      window.__sfImportConfirm = true;
      const metaLine = meta && meta.app ? ` · export v${meta.app}` : '';
      if (previewEl) {
        previewEl.style.display = 'block';
        previewEl.textContent =
          `Preview: Lv ${next.lvl} · unlock ${next.unlocked} · boek ${Object.keys(next.dex || {}).length}${metaLine}. Tik Import nogmaals om te toepassen.`;
      }
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
  const onVol = (id, lblId, key) => {
    const el = document.getElementById(id);
    if (!el || el.dataset.bound) return;
    el.dataset.bound = '1';
    el.addEventListener('input', () => {
      save[key] = clamp(el.value / 100, 0, 1);
      persist();
      const lbl = document.getElementById(lblId);
      if (lbl) lbl.textContent = Math.round(save[key] * 100) + '%';
      AudioSys.applyVolumes();
    });
  };
  onVol('setMusicVol', 'setMusicVolLbl', 'musicVol');
  onVol('setSfxVol', 'setSfxVolLbl', 'sfxVol');
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
      if (key === 'liteFx') { Perf.reset(); scheduleResize(); }
      if (key === 'reducedMotion' || key === 'highContrast') syncA11yClasses();
      persist();
      UI.renderSettings();
      UI.syncTouchClass();
      Input.layout(W, H);
      AudioSys.sfx('select');
      haptic(8);
    });
  }
}
const btnRestoreBackup = document.getElementById('btnRestoreBackup');
if (btnRestoreBackup) btnRestoreBackup.addEventListener('click', () => {
  AudioSys.sfx('select');
  if (!window.__sfBackupConfirm) {
    const h = saveHealthSummary();
    if (!h.backupOk) {
      UI.toast('Geen backup gevonden op dit apparaat', 3000);
      return;
    }
    window.__sfBackupConfirm = true;
    UI.toast(`Backup Lv ${h.backupLvl} — tik nogmaals om te herstellen`, 3600);
    setTimeout(() => { window.__sfBackupConfirm = false; }, 6000);
    return;
  }
  window.__sfBackupConfirm = false;
  if (restoreSaveFromBackup()) {
    UI.toast('Backup teruggezet — save + backup synchroon', 3000);
    UI.renderSettings();
  } else UI.toast('Geen backup gevonden op dit apparaat', 3000);
});
const btnClearSave = document.getElementById('btnClearSave');
if (btnClearSave) btnClearSave.addEventListener('click', () => {
  if (!window.__sfClearConfirm) {
    window.__sfClearConfirm = true;
    UI.toast('Nogmaals tikken = voortgang wissen (backup blijft)', 3500);
    setTimeout(() => { window.__sfClearConfirm = false; }, 4000);
    return;
  }
  window.__sfClearConfirm = false;
  try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
  save = sanitizeSave(Object.assign({}, DEFAULT_SAVE));
  persist();
  AudioSys.sfx('lose');
  UI.renderMenu();
  UI.toast('Nieuwe start — backup staat nog in Instellingen', 4000);
});
bindSettingsControls();
const btnHelp = document.getElementById('btnHelp');
bindPress(btnHelp, () => {
  AudioSys.init(); AudioSys.sfx('select'); UI.show('helpScreen');
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
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const sub = UI.screens.some(sid => sid !== 'menuScreen' && document.getElementById(sid)?.classList.contains('active'));
  if (sub) { e.preventDefault(); UI.goBack(); }
});
bindPress(document.getElementById('togMusic'), () => {
  AudioSys.init();
  AudioSys.setMusicOn(!save.music);
  if (save.music) AudioSys.play('menu');
  UI.renderMenu();
});
bindPress(document.getElementById('togSfx'), () => {
  AudioSys.init();
  save.sfx = !save.sfx; persist(); AudioSys.sfx('select'); UI.renderMenu();
});
const btnSharePlay = document.getElementById('btnSharePlay');
bindPress(btnSharePlay, () => {
  AudioSys.init(); AudioSys.sfx('select'); copyPlayLink();
});
bindPress(document.getElementById('pauseBtn'), () => {
  if (state === 'play') {
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
    AudioSys.play('menu');
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
bindPress(document.getElementById('resAgain'), () => {
  const d = UI.lastResult;
  AudioSys.sfx('select');
  if (d.mode === 'adventure') startGame('adventure', { level: d.level });
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
  startGame('adventure', { level: Math.min(MAX_LEVEL, d.level + 1) });
});
bindPress(document.getElementById('resMenu'), () => { UI.goMenu(); });

/* ============================= HOOFDLUS ================================ */
let lastTime = performance.now();
let menuAnimT = 0;

function drawMenuBackdrop(c, t) {
  c.fillStyle = '#0b0e1a';
  c.fillRect(0, 0, W, H);
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#151b33');
  g.addColorStop(1, '#0a0d18');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  const lite = save.liteFx || motionReduced() || Perf.tier >= 1;
  const starN = lite ? 14 : 28;
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
  if (typeof drawJutsuOrb === 'function' && !lite) {
    drawJutsuOrb(c, 0, 0, 28 + Math.sin(t * 2) * 4, t * 3, 'rasengan', 0.85);
  } else if (typeof drawJutsuOrb === 'function' && lite) {
    drawJutsuOrb(c, 0, 0, 22, t * 2, 'rasengan', 0.55);
  }
  c.restore();
  c.globalAlpha = 1;
}

function loop(now) {
  requestAnimationFrame(loop);
  try {
    if (!ctx || !canvas) return;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    if (!(dt >= 0) || dt > 1) { lastTime = now; return; }
    Perf.tick(dt * 1000);
    lastTime = now;
    if (state === 'play' && game) {
      game.update(dt);
      try { Input.endFrame(); } catch (_) {}
    } else {
      menuAnimT += dt;
      if (state === 'menu') ensureMenuScreenActive();
    }
    if (game && typeof game.draw === 'function') {
      game.draw(ctx);
    } else {
      drawMenuBackdrop(ctx, menuAnimT);
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

function updateNetStatus(ev) {
  const el = document.getElementById('netStatus');
  if (!el) return;
  const off = typeof navigator.onLine === 'boolean' && !navigator.onLine;
  if (off) {
    el.hidden = false;
    el.classList.remove('online-flash');
    el.textContent = 'Offline — save blijft hier · speel uit app-cache';
    if (ev && ev.type === 'offline') {
      try { UI.toast('Offline — voortgang blijft op dit apparaat', 3000); } catch (_) {}
    }
    return;
  }
  if (ev && ev.type === 'online') {
    el.hidden = false;
    el.classList.add('online-flash');
    el.textContent = 'Weer online — verse Pages/SW bij volgende load';
    try { UI.toast('Weer online', 2200); } catch (_) {}
    setTimeout(() => {
      if (navigator.onLine) {
        el.hidden = true;
        el.classList.remove('online-flash');
        el.textContent = '';
      }
    }, 3200);
    return;
  }
  el.hidden = true;
  el.textContent = '';
}
window.addEventListener('online', updateNetStatus);
window.addEventListener('offline', updateNetStatus);

function bootGame() {
  if (window.__sfBooted) return;
  window.__sfBooted = true;
  try {
    save = sanitizeSave(save || Object.assign({}, DEFAULT_SAVE));
    persist();
  } catch (err) {
    console.error('[Stickman] save sanitize', err);
    save = Object.assign({}, DEFAULT_SAVE);
    try { persist(); } catch (_) {}
  }
  safeCall(() => dismissTunnelOverlayIfStatic(), 'overlay');
  safeCall(() => { if (typeof window.sfTunnelNukeOverlay === 'function') window.sfTunnelNukeOverlay(); }, 'nuke');
  safeCall(syncPlayLayer, 'syncPlay');
  safeCall(resize, 'resize');
  safeCall(() => UI.renderMenu(), 'menu');
  safeCall(ensureDaily, 'daily');
  safeCall(checkAchievements, 'ach');
  safeCall(updateNetStatus, 'net');
  safeCall(() => UI.syncTouchClass(), 'touch');
  safeCall(maybeWelcomeToast, 'welcome');
  if (!window.__sfGlobalErr) {
    window.__sfGlobalErr = true;
    window.addEventListener('unhandledrejection', (ev) => {
      if (window.__sfLoopErr) return;
      const r = ev.reason;
      if (r instanceof Error) sfReportError('async', r);
      if (state === 'play') {
        try { recoverToMenu(); } catch (_) {}
      }
    });
  }
  try {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMq = () => syncA11yClasses();
    if (mq.addEventListener) mq.addEventListener('change', onMq);
    else if (mq.addListener) mq.addListener(onMq);
  } catch (_) {}
  if (window.__sfRecoveredBackup) {
    window.__sfRecoveredBackup = false;
    safeCall(() => UI.toast('Save hersteld uit backup — je voortgang is veilig', 4200), 'toast');
  }
  AudioSys.desiredSong = 'menu';
  safeCall(() => { if (typeof AudioSys.applyVolumes === 'function') AudioSys.applyVolumes(); }, 'vol');
  requestAnimationFrame(loop);
  if (state === 'menu') safeCall(() => UI.show('menuScreen'), 'showMenu');
  if (!window.__sfTipTimer) {
    window.__sfTipTimer = setInterval(() => {
      if (state === 'menu') safeCall(() => UI.renderMenu(), 'menuTick');
    }, 8000);
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
window.addEventListener('error', (e) => reportAppError(e.message || 'error'));
window.addEventListener('unhandledrejection', (e) => reportAppError(String(e.reason || 'promise')));

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
  setInterval(tick, 2000);
}
bindUiLayerWatch();
