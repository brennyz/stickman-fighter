/* ============================== OPSLAG ================================= */
const SAVE_KEY = 'stickfighter_save_v1';
const SAVE_BACKUP_KEY = 'stickfighter_save_backup_v1';
const SAVE_STAMP_KEY = 'stickfighter_save_stamp_v1';
const SAVE_EXPORT_SCHEMA = 2;
const APP_VERSION = '1.17.38';
/** Keep in sync with sw.js CACHE suffix */
const SW_CACHE_REV = 164;
const DEFAULT_SAVE = { lvl: 1, xp: 0, unlocked: 1, weapon: 'vuist', dex: {}, summons: {},
  advIsland: 0, advFails: {}, advMasterBuff: null,
  bestWall: 0, trainWins: 0, music: true, sfx: true, style: 'classic', stars: {},
  musicVol: 0.85, sfxVol: 1, shake: true, haptics: true, comboHud: true, bigTouch: true,
  reducedMotion: false, liteFx: false, highContrast: false, lastPlay: null, tipsSeen: {},
  stats: { kills: 0, advWins: 0, wallBestRun: 0, maxCombo: 0, pickups: 0, bossKills: 0, vsMatches: 0, vsWins: 0, matsCoinBest: 0, summonCount: 0, killsSinceSummon: 0 },
  achievements: {}, daily: null, vsPlayedIds: [] };
const MAX_LEVEL = 50;
const LEVELS_PER_ISLAND = 10;
const ISLAND_WEAPON_CAPS = [10, 20, 30, 40, 48];
const ADVENTURE_ISLANDS = [
  { id: 1, name: 'Oost-eiland', sub: 'Lv 1–10', accent: '#5ad06a', theme: 'veld',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 20h20" stroke="#5ad06a" stroke-width="2" stroke-linecap="round"/><path d="M5 20V13l5-8 5 8v7" fill="#43b25b" stroke="#2d8a3e" stroke-width="1"/><circle cx="18" cy="7" r="2.5" fill="#7cf5ff" opacity=".75"/></svg>' },
  { id: 2, name: 'Vuur-eiland', sub: 'Lv 11–20', accent: '#ff7a4d', theme: 'vulkaan',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20 L12 5 L20 20 Z" fill="#e85a6a" stroke="#ff7a4d" stroke-width="1.2"/><path d="M10 11 L12 7 L14 11 Z" fill="#ffd75e"/><ellipse cx="12" cy="20" rx="8" ry="1.5" fill="#ff7a4d" opacity=".45"/></svg>' },
  { id: 3, name: 'Neon-eiland', sub: 'Lv 21–30', accent: '#7cf5ff', theme: 'cyber',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="16" width="20" height="5" rx="1" fill="#1a2040" stroke="#7cf5ff" stroke-width="1.2"/><rect x="5" y="10" width="4" height="6" fill="#7cf5ff" opacity=".85"/><rect x="10" y="7" width="4" height="9" fill="#4ecf6a" opacity=".8"/><rect x="15" y="5" width="4" height="11" fill="#c47aff" opacity=".85"/></svg>' },
  { id: 4, name: 'Tempel-eiland', sub: 'Lv 31–40', accent: '#ffd75e', theme: 'dojo',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L17 8 H7 Z" fill="#ffd75e"/><rect x="10" y="8" width="4" height="12" fill="#c97a20"/><path d="M6 11 H18 M7 14 H17 M8 17 H16" stroke="#ffd75e" stroke-width="1.4" stroke-linecap="round"/><rect x="4" y="20" width="16" height="2" rx="1" fill="#8a6030"/></svg>' },
  { id: 5, name: 'Finale-eiland', sub: 'Lv 41–50', accent: '#ff6b9d', theme: 'cyber',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18 L7 10 L12 14 L17 10 L20 18 Z" fill="#ff6b9d" stroke="#ffd75e" stroke-width="1"/><circle cx="12" cy="8" r="2.8" fill="#ffd75e"/><path d="M12 2 v2 M12 20 v2 M2 12 h2 M20 12 h2" stroke="#ffd75e" stroke-width="1.2" opacity=".7"/></svg>' },
];
function islandMeta(id) { return ADVENTURE_ISLANDS.find(i => i.id === id) || ADVENTURE_ISLANDS[0]; }
function islandProgress(islandId) {
  const { start, end } = islandLevelRange(islandId);
  const total = end - start + 1;
  let cleared = 0;
  let stars = 0;
  for (let n = start; n <= end; n++) {
    if (n < save.unlocked) cleared++;
    stars += save.stars[n] || 0;
  }
  return { cleared, total, stars, maxStars: total * 3 };
}
function adventureProgressLine() {
  const cur = currentAdvIsland();
  const prog = islandProgress(cur);
  const isl = islandMeta(cur);
  return `Eiland ${cur}/5 · ${isl.name} · ${prog.cleared}/${prog.total} · unlock Lv ${save.unlocked}/${MAX_LEVEL}`;
}
function islandFromLevel(n) { return Math.min(5, Math.max(1, Math.ceil(n / LEVELS_PER_ISLAND))); }
function islandLevelRange(islandId) {
  const start = (islandId - 1) * LEVELS_PER_ISLAND + 1;
  return { start, end: Math.min(MAX_LEVEL, start + LEVELS_PER_ISLAND - 1) };
}
function currentAdvIsland() { return islandFromLevel(save.unlocked || 1); }
function islandUnlocked(islandId) {
  if (islandId <= 1) return true;
  return (save.unlocked || 1) > (islandId - 1) * LEVELS_PER_ISLAND;
}
function adventureWeaponCapForLevel(levelN) {
  const idx = Math.min(ISLAND_WEAPON_CAPS.length - 1, Math.max(0, Math.ceil(levelN / LEVELS_PER_ISLAND) - 1));
  return ISLAND_WEAPON_CAPS[idx];
}
function adventureWeaponCap() { return adventureWeaponCapForLevel(save.unlocked || 1); }
function weaponSkillGated(w) { return w.unlock > adventureWeaponCap(); }
function weaponUnlockedByLevel(w) { return save.lvl >= w.unlock; }
function weaponUsableNow(w) { return weaponUnlockedByLevel(w) && !weaponSkillGated(w); }
function styleSkillGated(st) { return !!(st.needLvl && st.needLvl > adventureWeaponCap()); }
function masterBuffActive(levelN) { return save.advMasterBuff === levelN; }
function bestWeaponForAdventureCap(cap) {
  let best = weaponById('vuist');
  for (const base of WEAPONS) {
    if (save.lvl >= base.unlock && base.unlock <= cap && base.unlock >= best.unlock) best = base;
  }
  return applySummonTier(best);
}
function playerWeaponForAdventure(levelN) {
  const w = playerWeapon();
  const cap = adventureWeaponCapForLevel(levelN);
  if (w.unlock <= cap) return w;
  return bestWeaponForAdventureCap(cap);
}
function advFailCount(levelN) { return (save.advFails && save.advFails[levelN]) || 0; }
function wallRecordPaceDelta(g) {
  const best = save.bestWall || 0;
  if (!g || best <= 0) return null;
  const dur = g.wallDuration || 60;
  const elapsed = dur - (g.wallTimer || 0);
  if (elapsed < 3) return null;
  const expected = (best / dur) * elapsed;
  return Math.round(g.score - expected);
}
function wallComboDmgPct(combo) { return Math.min(combo, 12) * 4; }
let save = loadSave();
function fighterJutsuKind(f) {
  if (!f) return 'rasengan';
  if (f.vsSpecial === 'rinnegan') return 'rinnegan';
  if (f.isRobot || f.vsSpecial === 'chidori') return 'chidori';
  return 'rasengan';
}
function jutsuHudLabel(kind) {
  if (kind === 'chidori') return 'CHIDORI!';
  if (kind === 'rinnegan') return 'RINNEGAN!';
  return 'RASENGAN!';
}

/** Klein getekend jutsu-icoon (bliksem/oog/orb) voor HUD-markers. */
function drawJutsuMiniIcon(c, kind, x, y, color) {
  c.save();
  c.translate(x, y);
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = 1.4;
  if (kind === 'chidori') {
    c.beginPath();
    c.moveTo(2, -5.5);
    c.lineTo(-2.5, 1);
    c.lineTo(0.3, 1);
    c.lineTo(-1.5, 5.5);
    c.lineTo(3.5, -1);
    c.lineTo(0.7, -1);
    c.closePath();
    c.fill();
  } else if (kind === 'rinnegan') {
    c.beginPath(); c.ellipse(0, 0, 5.2, 3.2, 0, 0, TAU); c.stroke();
    c.beginPath(); c.arc(0, 0, 1.7, 0, TAU); c.fill();
  } else {
    c.beginPath(); c.arc(0, 0, 4.6, 0, TAU); c.stroke();
    c.beginPath(); c.arc(0, 0, 2, 0, TAU); c.fill();
  }
  c.restore();
}

/** Getekend touch-knop-icoon (art-upgrade 4/4) — vervangt emoji-labels. */
function drawTouchBtnIcon(c, id, x, y, r, jutsuKind) {
  const s = r * 0.52;
  c.save();
  c.translate(x, y);
  c.strokeStyle = '#fff';
  c.fillStyle = '#fff';
  c.lineWidth = Math.max(2, r * 0.13);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  switch (id) {
    case 'punch': {
      // vuist: blok + knokkels
      c.beginPath();
      if (c.roundRect) c.roundRect(-s * 0.75, -s * 0.55, s * 1.5, s * 1.1, s * 0.3);
      else c.rect(-s * 0.75, -s * 0.55, s * 1.5, s * 1.1);
      c.fill();
      c.strokeStyle = 'rgba(0,0,0,.35)';
      c.lineWidth = Math.max(1.4, r * 0.08);
      c.beginPath();
      for (let i = -1; i <= 1; i++) {
        c.moveTo(i * s * 0.38, -s * 0.55);
        c.lineTo(i * s * 0.38, -s * 0.1);
      }
      c.stroke();
      break;
    }
    case 'kick': {
      // laars
      c.beginPath();
      c.moveTo(-s * 0.45, -s * 0.9);
      c.lineTo(s * 0.15, -s * 0.9);
      c.lineTo(s * 0.15, s * 0.25);
      c.lineTo(s * 0.95, s * 0.45);
      c.quadraticCurveTo(s * 1.05, s * 0.9, s * 0.6, s * 0.9);
      c.lineTo(-s * 0.45, s * 0.9);
      c.closePath();
      c.fill();
      break;
    }
    case 'weapon': {
      // kling + greep
      c.beginPath();
      c.moveTo(-s * 0.85, s * 0.85);
      c.lineTo(s * 0.7, -s * 0.7);
      c.stroke();
      c.beginPath();
      c.moveTo(s * 0.25, -s * 1.0);
      c.lineTo(s * 1.0, -s * 0.25);
      c.lineTo(s * 0.7, -s * 0.7);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(-s * 0.5, s * 0.2);
      c.lineTo(-s * 0.05, s * 0.65);
      c.stroke();
      break;
    }
    case 'special': {
      if (jutsuKind === 'chidori') {
        c.beginPath();
        c.moveTo(s * 0.35, -s);
        c.lineTo(-s * 0.55, s * 0.15);
        c.lineTo(s * 0.05, s * 0.15);
        c.lineTo(-s * 0.3, s);
        c.lineTo(s * 0.65, -s * 0.2);
        c.lineTo(s * 0.1, -s * 0.2);
        c.closePath();
        c.fill();
      } else if (jutsuKind === 'rinnegan') {
        c.beginPath(); c.ellipse(0, 0, s, s * 0.62, 0, 0, TAU); c.stroke();
        c.beginPath(); c.arc(0, 0, s * 0.3, 0, TAU); c.fill();
      } else {
        // rasengan: orb + spiraal
        c.beginPath(); c.arc(0, 0, s * 0.95, 0, TAU); c.stroke();
        c.beginPath();
        for (let a = 0; a < TAU * 1.35; a += 0.3) {
          const rr = s * 0.12 + a * s * 0.12;
          const px2 = Math.cos(a) * rr, py2 = Math.sin(a) * rr;
          if (a === 0) c.moveTo(px2, py2); else c.lineTo(px2, py2);
        }
        c.stroke();
      }
      break;
    }
    case 'subst': {
      // rookwolk
      c.beginPath();
      c.arc(-s * 0.45, s * 0.2, s * 0.42, 0, TAU);
      c.arc(0, -s * 0.15, s * 0.55, 0, TAU);
      c.arc(s * 0.5, s * 0.25, s * 0.4, 0, TAU);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,.7)';
      c.lineWidth = Math.max(1.4, r * 0.08);
      c.beginPath();
      c.moveTo(s * 0.85, -s * 0.55); c.lineTo(s * 1.15, -s * 0.65);
      c.moveTo(s * 0.75, -s * 0.2); c.lineTo(s * 1.2, -s * 0.25);
      c.stroke();
      break;
    }
    case 'jump': {
      c.beginPath();
      c.moveTo(0, s * 0.9);
      c.lineTo(0, -s * 0.5);
      c.stroke();
      c.beginPath();
      c.moveTo(-s * 0.7, -s * 0.1);
      c.lineTo(0, -s * 0.95);
      c.lineTo(s * 0.7, -s * 0.1);
      c.stroke();
      break;
    }
    default:
      c.restore();
      return false;
  }
  c.restore();
  return true;
}

function jutsuAccentColor(kind, p2Slot) {
  if (kind === 'chidori') return p2Slot ? '#ffb0b8' : '#a8e0ff';
  if (kind === 'rinnegan') return p2Slot ? '#ffb0b8' : '#c47aff';
  return p2Slot ? '#ffb0b8' : '#7cf5ff';
}

const SIG_MODS = {
  balanced: {},
  shuriken: { weaponDmg: 1.08, weaponCrit: 0.11, weaponCritMul: 1.55 },
  assassin: { kickDmg: 1.18, kickCrit: 0.16, kickCritMul: 1.6 },
  heavy: { weaponDmg: 1.14, weaponCrit: 0.1, weaponCritMul: 2.05 },
  combo: { kickDmg: 1.24, kickCrit: 0.2, kickCritMul: 1.5 },
  kenjutsu: { weaponDmg: 1.16, weaponCrit: 0.14, weaponCritMul: 1.72 },
  hitrun: { kickDmg: 1.12, kickCrit: 0.22, kickCritMul: 1.58 },
  quak: { punchDmg: 1.28, critAdd: -0.02 },
  rinne: { jutsuCrit: 0.07, jutsuDmg: 1.06 },
  boss: { critAdd: 0.05, critMul: 1.72 },
  storm: { kickDmg: 1.14, kickCrit: 0.08 },
  tank: { punchDmg: 1.2, punchCrit: 0.04, kbMul: 1.15 },
  reach: { weaponDmg: 1.06, weaponRange: 1.08, weaponCrit: 0.06 },
};

function combatEntryFor(f) {
  if (f && f.rosterId) {
    const e = vsRosterEntry(f.rosterId);
    return {
      crit: e.crit != null ? e.crit : 0.08,
      critMul: e.critMul != null ? e.critMul : 1.5,
      sig: e.sig || 'balanced',
    };
  }
  const lv = typeof save !== 'undefined' ? (save.lvl || 1) : 1;
  return { crit: 0.06 + Math.min(0.05, lv * 0.002), critMul: 1.48, sig: 'balanced' };
}

function applySignatureToSpec(f, spec) {
  const prof = combatEntryFor(f);
  const sig = SIG_MODS[prof.sig] || {};
  if (spec.kind === 'punch' && sig.punchDmg) spec.dmg *= sig.punchDmg;
  if (spec.kind === 'kick' && sig.kickDmg) spec.dmg *= sig.kickDmg;
  if (spec.kind === 'weapon') {
    if (sig.weaponDmg) spec.dmg *= sig.weaponDmg;
    if (sig.weaponRange) spec.range *= sig.weaponRange;
  }
  if (spec.kind === 'special' && sig.jutsuDmg) spec.dmg *= sig.jutsuDmg;
  if (sig.kbMul && spec.kb) spec.kb *= sig.kbMul;
  return spec;
}

function rollHitDamage(attacker, spec, mult) {
  mult = mult || 1;
  const prof = combatEntryFor(attacker);
  const sig = SIG_MODS[prof.sig] || {};
  let critChance = prof.crit + (sig.critAdd || 0);
  let critMul = prof.critMul;
  const k = spec.kind;
  if (k === 'kick') {
    critChance += sig.kickCrit || 0;
    if (sig.kickCritMul) critMul = sig.kickCritMul;
  }
  if (k === 'weapon') {
    critChance += sig.weaponCrit || 0;
    if (sig.weaponCritMul) critMul = sig.weaponCritMul;
  }
  if (k === 'punch') critChance += sig.punchCrit || 0;
  if (k === 'special' || spec.jutsu) {
    critChance += sig.jutsuCrit || 0;
    if (spec.jutsu === 'rinnegan') critChance += 0.05;
  }
  if (attacker.isPlayer && typeof game !== 'undefined' && game && game.stageCritBonus) {
    critChance += game.stageCritBonus;
  }
  critChance = clamp(critChance, 0, 0.48);
  let dmg = spec.dmg * rand(0.9, 1.15) * mult;
  const crit = Math.random() < critChance;
  if (crit) dmg *= critMul;
  return { dmg: Math.max(1, Math.round(dmg)), crit };
}

function projCritMeta(f) {
  const prof = combatEntryFor(f);
  const sig = SIG_MODS[prof.sig] || {};
  let critChance = prof.crit + (sig.critAdd || 0) + (sig.jutsuCrit || 0);
  if (fighterJutsuKind(f) === 'rinnegan') critChance += 0.05;
  return { critChance: clamp(critChance, 0, 0.42), critMul: prof.critMul };
}

function applyCritFx(game, x, y) {
  if (!game) return;
  game.floater(x, y - 132, 'CRIT!', '#ffd75e', 18);
  try { AudioSys.sfx('crit'); } catch (_) {}
  if (save.haptics !== false) haptic(10);
  spawnFxRing(game, x, y - 42, '#ffd75e', fxLite() ? 9 : 15);
  if (!motionReduced()) {
    game.burst(x, y - 40, '#ffe259', fxLite() ? 4 : 8, { kind: 'spark', size: 2.6 });
  }
}

function hitConfirmColor(kind) {
  if (kind === 'kick') return '#ff9a6a';
  if (kind === 'weapon') return '#ffd75e';
  if (kind === 'special') return '#7cf5ff';
  return '#e8f0ff';
}

function applyHitConfirmFx(game, x, y, spec) {
  if (!game || motionReduced()) return;
  const kind = spec && spec.kind ? spec.kind : 'punch';
  const col = hitConfirmColor(kind);
  spawnFxRing(game, x, y, col, fxLite() ? 6 : 9);
  if (!fxLite()) game.burst(x, y, col, 3, { kind: 'spark', size: 2 });
}

function isCounterHitWindow(target) {
  const a = target && target.attack;
  return !!(a && a.t < a.windup * 0.92);
}

function resolveProjHit(p) {
  let dmg = p.dmg * rand(0.9, 1.15);
  const crit = Math.random() < (p.critChance != null ? p.critChance : 0.08);
  if (crit) dmg *= (p.critMul != null ? p.critMul : 1.5);
  return { dmg: Math.max(1, Math.round(dmg)), crit };
}

function projStrikeFighter(game, p, tgt, col) {
  if (!tgt || !tgt.alive) return;
  const hit = resolveProjHit(p);
  const kb = Math.sign(p.vx || 1) * (p.kind === 'rinnegan' ? 300 : 260);
  const dealt = tgt.takeDamage(hit.dmg, kb, game);
  if (dealt > 0) {
    const kind = p.kind === 'rasengan' || p.kind === 'rinnegan' || p.kind === 'chidori' ? 'special' : 'punch';
    applyHitStop(game, { kind, dmg: hit.dmg }, { crit: hit.crit, heavy: hit.dmg >= 18 });
  }
  game.floater(tgt.x, tgt.y - 115, '-' + dealt, col, 16);
  if (hit.crit) applyCritFx(game, tgt.x, tgt.y);
  if (p.kind === 'rinnegan' && p.pull) tgt.vx += Math.sign(p.vx || 1) * 160;
  if (p.kind === 'chidori') {
    game.burst(p.x, p.y, '#a8e0ff', 14);
    spawnFxRing(game, p.x, p.y, '#c8f0ff', fxLite() ? 8 : 12);
  } else if (p.kind === 'rinnegan') {
    game.burst(p.x, p.y, '#c47aff', 12);
    spawnFxRing(game, p.x, p.y, '#e0a8ff', fxLite() ? 8 : 11);
  }
  if (p.hitSet) p.hitSet.add(tgt);
  else if (!p.pierce) p.life = 0;
}

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
    merged.summons = Object.assign({}, parsed.summons || {});
    return merged;
  } catch (e) {
    return null;
  }
}

function userToast(msg, ms) {
  try {
    if (typeof UI !== 'undefined' && UI.toast) UI.toast(msg, ms || 3200);
  } catch (err) {
    console.warn('[Stickman] toast', msg, err);
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
    try {
      localStorage.setItem(SAVE_STAMP_KEY, JSON.stringify({
        at: new Date().toISOString(),
        bytes: json.length,
        app: APP_VERSION,
      }));
    } catch (_) {}
    return true;
  } catch (e) {
    let backupSaved = false;
    try {
      localStorage.setItem(SAVE_BACKUP_KEY, JSON.stringify(save));
      backupSaved = true;
    } catch (_) {}
    if (!window.__sfPersistWarn) {
      window.__sfPersistWarn = true;
      userToast(backupSaved
        ? 'Hoofd-save mislukt — backup wel bijgewerkt (export in Instellingen)'
        : 'Opslaan mislukt — export save in Instellingen', 5200);
    }
    return false;
  }
}

function safeCall(fn, label, toastOnFail) {
  try { return fn(); } catch (err) {
    console.error('[Stickman]', label || 'safeCall', err);
    if (toastOnFail) userToast(toastOnFail);
    return undefined;
  }
}

function safeAsync(promise, label, userMsg) {
  return Promise.resolve(promise).catch((err) => {
    sfReportError(label || 'async', err, userMsg || 'Actie mislukt — probeer opnieuw');
  });
}

function safeUiAction(fn, label, userMsg) {
  try { return fn(); } catch (err) {
    sfReportError(label || 'ui', err, userMsg || 'Actie mislukt — probeer opnieuw');
  }
}

function persistOrToast(context) {
  if (persist()) return true;
  const key = context || 'save';
  window.__sfPersistCtxWarn = window.__sfPersistCtxWarn || {};
  if (!window.__sfPersistCtxWarn[key]) {
    window.__sfPersistCtxWarn[key] = true;
    userToast(context
      ? `Opslaan mislukt (${context}) — export save in Instellingen`
      : 'Opslaan mislukt — export save in Instellingen', 4200);
  }
  return false;
}

function restoreSaveFromBackup() {
  try {
    const backup = readSaveJson(localStorage.getItem(SAVE_BACKUP_KEY));
    if (!backup) return false;
    save = sanitizeSave(backup);
    if (!persist()) {
      userToast('Backup geladen maar opslaan mislukt — export save', 4200);
      return false;
    }
    checkAchievements();
    UI.renderMenu();
    if (UI.renderMissions) UI.renderMissions();
    return true;
  } catch (err) {
    sfReportError('restoreBackup', err, 'Backup herstellen mislukt');
    return false;
  }
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
  out.advIsland = clamp(Math.floor(Number(out.advIsland) || 0), 0, 5);
  const cleanFails = {};
  for (const [k, v] of Object.entries(out.advFails || {})) {
    const n = parseInt(k, 10);
    if (n >= 1 && n <= maxLevel) cleanFails[n] = clamp(Math.floor(Number(v) || 0), 0, 99);
  }
  out.advFails = cleanFails;
  const mb = parseInt(out.advMasterBuff, 10);
  out.advMasterBuff = (Number.isFinite(mb) && mb >= 1 && mb <= maxLevel) ? mb : null;
  if (!out.advIsland && out.unlocked > 1) {
    out.advIsland = Math.min(5, Math.floor((out.unlocked - 1) / LEVELS_PER_ISLAND));
  }
  out.trainWins = clamp(Math.floor(Number(out.trainWins) || 0), 0, 9999);
  out.bestWall = clamp(Math.floor(Number(out.bestWall) || 0), 0, 999999);
  out.musicVol = (() => {
    const v = Number(out.musicVol);
    return Number.isFinite(v) ? clamp(v, 0, 1) : DEFAULT_SAVE.musicVol;
  })();
  out.sfxVol = (() => {
    const v = Number(out.sfxVol);
    return Number.isFinite(v) ? clamp(v, 0, 1) : DEFAULT_SAVE.sfxVol;
  })();
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
    if (!['adventure', 'training', 'wall', 'versus', 'coinrun'].includes(lp.mode)) out.lastPlay = null;
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

  // Summons: alleen bekende wapens, geldige tiers, en alleen echte upgrades
  const cleanSummons = {};
  for (const [k, v] of Object.entries(out.summons || {})) {
    const w = WEAPONS.find(x => x.id === k);
    if (!w || (v !== 'epic' && v !== 'legendary')) continue;
    const wOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 }[w.rarity] || 0;
    const tOrder = v === 'legendary' ? 4 : 3;
    if (tOrder > wOrder) cleanSummons[k] = v;
  }
  out.summons = cleanSummons;
  const stPick = STYLES.find(st => st.id === out.style) || STYLES[0];
  let styleOk = stPick.id === 'classic';
  if (stPick.needLvl && out.lvl >= stPick.needLvl && !(stPick.needLvl > adventureWeaponCapForLevel(out.unlocked || 1))) styleOk = true;
  if (stPick.needTrain && out.trainWins >= stPick.needTrain) styleOk = true;
  if (stPick.needDex && dexCountFromSave(out) >= stPick.needDex) styleOk = true;
  if (stPick.needDexKills && dexTotalKillsFromSave(out) >= stPick.needDexKills) styleOk = true;
  if (stPick.needDexTiers && dexRarityTierCountFromSave(out) >= stPick.needDexTiers) styleOk = true;
  if (stPick.needDexHalf && typeof SPECIES_ORDER !== 'undefined' &&
      dexCountFromSave(out) >= Math.ceil(SPECIES_ORDER.length / 2)) styleOk = true;
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
  const cleanStats = {};
  for (const key of Object.keys(DEFAULT_SAVE.stats)) {
    cleanStats[key] = clamp(Math.floor(Number(out.stats[key]) || 0), 0, 9999999);
  }
  out.stats = cleanStats;

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

  const allowedKeys = new Set(Object.keys(DEFAULT_SAVE));
  for (const k of Object.keys(out)) {
    if (!allowedKeys.has(k)) delete out[k];
  }
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

