'use strict';
/* --- src/00-prelude.js --- */
'use strict';
/* =========================================================================
   STICKMAN FIGHTER — Monster Arena
   Stickman-vechtgame voor iPad (touch) en desktop (toetsenbord).
   Modi: Avontuur, Training, Versus 2P, Muur, Mats (coinrun).
   Audio (sfx + bgm) is procedureel via Web Audio — rechtenvrij.
   d20 c4: volPct prelude, menuBackdropLiteFlags, motionReduced guards.
   ========================================================================= */

const TAU = Math.PI * 2;
const BANNER_LANES = 3;
const FX_CAP = { particles: 140, floaters: 28, projectiles: 48, banners: BANNER_LANES, afterimages: 12 };
const Perf = {
  tier: 0,
  emaMs: 16.7,
  frames: 0,
  tick(frameMs) {
    this.frames++;
    if (typeof document !== 'undefined' && document.hidden) return;
    this.emaMs = this.emaMs * 0.9 + frameMs * 0.1;
    if (save.liteFx) {
      if (this.tier !== 1) {
        this.tier = 1;
        try { SceneryArt.clearCache(); } catch (_) {}
        scheduleResize();
      }
      return;
    }
    const sampleEvery = IS_TOUCH ? 24 : 40;
    if (this.frames % sampleEvery !== 0) return;
    const prev = this.tier;
    const heavyMs = IS_TOUCH ? 22 : 24;
    if (this.emaMs > heavyMs) this.tier = Math.min(2, this.tier + 1);
    else if (this.emaMs < 17.5 && this.tier > 0) this.tier -= 1;
    if (prev !== this.tier) {
      try { SceneryArt.clearCache(); } catch (_) {}
      scheduleResize();
    }
    if (this.tier >= 2 && this.frames > 120 && !save.liteFx && !window.__sfLiteHint) {
      window.__sfLiteHint = 1;
      try { UI.toast('Traag op iPad? Instellingen → Lite FX', 4200); } catch (_) {}
    }
  },
  reset() { this.tier = 0; this.emaMs = 16.7; this.frames = 0; },
  skipHeavyDraw() {
    return state === 'play' && this.tier >= 2 && (this.frames & 1) === 0;
  },
  /** Hoofdmenu-landing zichtbaar — enige menu-scherm met canvas-animatie. */
  menuLandingVisible() {
    if (typeof state === 'undefined' || state !== 'menu') return false;
    try {
      const ms = document.getElementById('menuScreen');
      return !!(ms && ms.classList.contains('active'));
    } catch (_) {
      return false;
    }
  },
  /** Canvas mag getekend worden (gevecht of menu-backdrop). */
  canvasDrawActive() {
    if (typeof state !== 'undefined' && state === 'play' && typeof game !== 'undefined' && game) return true;
    return this.menuLandingVisible();
  },
  /** Statische submenu's — verlaag rAF-work (~2 Hz i.p.v. 60 Hz). */
  loopIdleMode() {
    if (typeof state === 'undefined' || state === 'play') return false;
    return !this.menuLandingVisible();
  },
};
function fxCaps() {
  let mul = 1;
  if (save.liteFx) mul = 0.55;
  else if (Perf.tier >= 2) mul = 0.42;
  else if (Perf.tier >= 1) mul = 0.68;
  if (motionReduced()) mul *= 0.62;
  const floor = { particles: 24, floaters: 8, projectiles: 16, banners: 2, afterimages: 4 };
  const out = {};
  for (const k of Object.keys(FX_CAP)) {
    out[k] = Math.max(floor[k] || 2, Math.floor(FX_CAP[k] * mul));
  }
  return out;
}
/** Meet FX-ruimte vóór spawn — tier/lite per-frame budget. */
function perfFxRoom(g, type) {
  if (!g) return 0;
  const cap = fxCaps();
  const max = type === 'particle' ? cap.particles
    : type === 'floater' ? cap.floaters
      : type === 'banner' ? cap.banners : 0;
  const arr = type === 'particle' ? g.particles
    : type === 'floater' ? g.floaters
      : type === 'banner' ? g.banners : null;
  if (!arr || !max) return 0;
  return Math.max(0, max - arr.length);
}
function perfFxBudgetAllow(g, cost) {
  cost = cost || 1;
  if (!g) return true;
  if (!save.liteFx && Perf.tier < 1) return true;
  const maxPerFrame = save.liteFx ? 5 : (Perf.tier >= 2 ? 9 : 14);
  if (g._fxBudgetFrame !== Perf.frames) {
    g._fxBudgetFrame = Perf.frames;
    g._fxBudgetUsed = 0;
  }
  if (g._fxBudgetUsed + cost > maxPerFrame) return false;
  g._fxBudgetUsed += cost;
  return true;
}
function perfFxSummary() {
  const caps = fxCaps();
  const fps = Perf.emaMs > 0 ? Math.round(1000 / Perf.emaMs) : 0;
  const dpr = typeof DPR !== 'undefined' ? DPR : 1;
  return { fps, tier: Perf.tier, dpr, maxDpr: maxCanvasDpr(), caps };
}

function pickBannerLane(banners) {
  const occupied = new Set();
  for (const b of banners) {
    if (typeof b.lane === 'number' && b.lane >= 0 && b.lane < BANNER_LANES) occupied.add(b.lane);
  }
  for (let i = 0; i < BANNER_LANES; i++) if (!occupied.has(i)) return i;
  let pick = 0;
  let best = -1;
  for (const b of banners) {
    const p = b.t / b.dur;
    if (p > best) { best = p; pick = b.lane; }
  }
  return pick;
}

function bannerLaneY(H, lane, size) {
  const baseY = H * 0.31;
  const step = Math.max(32, Math.min(48, H * 0.052));
  const mid = (BANNER_LANES - 1) * 0.5;
  const laneN = typeof lane === 'number' ? lane : 1;
  return baseY + (laneN - mid) * step;
}
function maxCanvasDpr() {
  const rm = motionReduced();
  if (save.liteFx || rm) return 1.25;
  if (typeof state !== 'undefined' && state !== 'play') return IS_TOUCH ? 1.15 : 1.25;
  if (Perf.tier >= 2) return 1;
  if (Perf.tier >= 1) return 1.35;
  return 2;
}
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const volPct = (v, d) => Math.round((Number(v ?? d)) * 100);
const choice = arr => arr[Math.floor(Math.random() * arr.length)];
const IS_TOUCH = (typeof window !== 'undefined' && ('ontouchstart' in window)) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);

/* --- src/core/storage.js --- */
/* ============================== OPSLAG ================================= */
const SAVE_KEY = 'stickfighter_save_v1';
const SAVE_BACKUP_KEY = 'stickfighter_save_backup_v1';
const SAVE_STAMP_KEY = 'stickfighter_save_stamp_v1';
const VERSION_UPDATE_SAVE_KEY = 'stickfighter_version_update_save_v1';
const VERSION_UPDATE_FLAG_KEY = 'stickfighter_version_update_flag_v1';
const SAVE_EXPORT_SCHEMA = 3;
const APP_VERSION = '1.17.86';
/** Keep in sync with sw.js CACHE suffix */
const SW_CACHE_REV = 201;
const DEFAULT_SAVE = { lvl: 1, xp: 0, unlocked: 1, weapon: 'vuist', petCoins: 0, dex: {}, summons: {}, pets: {}, activePet: null,
  eggPets: {}, activeEggPet: null, eggDaily: null,




  advIsland: 0, advFails: {}, advMasterBuff: null, missionsIntroSeen: false,
  bestWall: 0, trainWins: 0, music: true, sfx: true, style: 'classic', stars: {},
  musicVol: 0.85, sfxVol: 1, shake: true, haptics: true, comboHud: true, bigTouch: true,
  reducedMotion: false, liteFx: false, highContrast: false, lang: null, lastPlay: null, tipsSeen: {},
  stats: { kills: 0, advWins: 0, wallBestRun: 0, maxCombo: 0, maxKillStreak: 0, trainMaxCombo: 0, pickups: 0, bossKills: 0, vsMatches: 0, vsWins: 0, matsCoinBest: 0, summonCount: 0, killsSinceSummon: 0, petsTamed: 0, eggsHatched: 0, weaponFinishers: 0, skillShards: 0, itemShards: 0, dailyBonusCount: 0 },
  achievements: {}, daily: null, vsPlayedIds: [], weaponMastery: {}, skillUpgrades: {}, itemUpgrades: {} };

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
  return t('island.progress', {
    cur, name: islandLabel(cur, 'name'), cleared: prog.cleared, total: prog.total,
    unlocked: save.unlocked, max: MAX_LEVEL,
  });
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
  if (attacker.isPlayer && typeof game !== 'undefined' && game && game.petCritBonus) {
    critChance += game.petCritBonus;
  }
  if (attacker.isPlayer && typeof game !== 'undefined' && game && game.styleCritBonus) {
    critChance += game.styleCritBonus;
  }
  if (attacker.isPlayer && k === 'weapon' && attacker.weapon && attacker.weapon.upgradeCrit) {
    critChance += attacker.weapon.upgradeCrit;
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
  let col = hitConfirmColor(kind);
  if (kind === 'weapon' && spec.move) col = weaponMoveFxColor(spec.move);
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
  if (p.kind === 'rasengan') {
    spawnJutsuImpactFx(game, p.x, p.y, 'rasengan', 'full');
    if (!fxLite() && !motionReduced()) game.freezeT = Math.max(game.freezeT || 0, 0.045);
  } else if (p.kind === 'chidori') {
    spawnJutsuImpactFx(game, p.x, p.y, 'chidori', 'full');
  } else if (p.kind === 'rinnegan') {
    spawnJutsuImpactFx(game, p.x, p.y, 'rinnegan', 'full');
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
    if (!raw || raw.length > 180000) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const merged = Object.assign({}, DEFAULT_SAVE, parsed);
    merged.stats = Object.assign({}, DEFAULT_SAVE.stats, parsed.stats || {});
    merged.achievements = Object.assign({}, parsed.achievements || {});
    merged.stars = Object.assign({}, parsed.stars || {});
    merged.dex = Object.assign({}, parsed.dex || {});
    merged.summons = Object.assign({}, parsed.summons || {});
    merged.pets = Object.assign({}, parsed.pets || {});
    merged.eggPets = Object.assign({}, parsed.eggPets || {});
    merged.weaponMastery = Object.assign({}, DEFAULT_SAVE.weaponMastery || {}, parsed.weaponMastery || {});
    merged.tipsSeen = Object.assign({}, parsed.tipsSeen || {});
    merged.advFails = Object.assign({}, parsed.advFails || {});
    if (parsed.eggDaily && typeof parsed.eggDaily === 'object') merged.eggDaily = Object.assign({}, parsed.eggDaily);
    if (typeof parsed.activePet === 'string') merged.activePet = parsed.activePet;
    if (typeof parsed.activeEggPet === 'string') merged.activeEggPet = parsed.activeEggPet;
    if (typeof parsed.lang === 'string' && SUPPORTED_LANGS.includes(parsed.lang)) merged.lang = parsed.lang;
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

function saveHasProgress(s) {
  const st = s || save;
  if (!st || typeof st !== 'object') return false;
  if ((st.lvl || 1) > 1) return true;
  if ((st.unlocked || 1) > 1) return true;
  if ((st.stats && st.stats.kills) > 0) return true;
  if ((st.stats && st.stats.advWins) > 0) return true;
  if (Object.keys(st.dex || {}).length > 0) return true;
  if (Object.keys(st.achievements || {}).length > 0) return true;
  if (Object.keys(st.summons || {}).length > 0) return true;
  if (Object.keys(st.pets || {}).length > 0) return true;
  return false;
}

/** Bewaar save vóór versie-ophalen — blijft staan tot speler na update kiest. */
function stashSaveForVersionUpdate() {
  try {
    persist();
    syncBackupFromPrimary();
    const clean = sanitizeSave(save);
    const payload = {
      schema: SAVE_EXPORT_SCHEMA,
      fromApp: APP_VERSION,
      stashedAt: new Date().toISOString(),
      save: clean,
      summary: typeof saveExportSummaryLine === 'function' ? saveExportSummaryLine(clean) : `Lv ${clean.lvl}`,
    };
    localStorage.setItem(VERSION_UPDATE_SAVE_KEY, JSON.stringify(payload));
    localStorage.setItem(VERSION_UPDATE_FLAG_KEY, '1');
    return true;
  } catch (err) {
    sfReportError('versionStash', err, 'Save veiligstellen mislukt');
    return false;
  }
}

function peekVersionUpdateSave() {
  try {
    const raw = localStorage.getItem(VERSION_UPDATE_SAVE_KEY);
    if (!raw || raw.length > 200000) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.save) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

function clearVersionUpdateSave() {
  try {
    localStorage.removeItem(VERSION_UPDATE_SAVE_KEY);
    localStorage.removeItem(VERSION_UPDATE_FLAG_KEY);
  } catch (_) {}
}

function applyVersionUpdateSave() {
  const stash = peekVersionUpdateSave();
  if (!stash || !stash.save) return false;
  try {
    save = sanitizeSave(stash.save);
    if (!persist()) {
      userToast('Save geladen maar opslaan mislukt — export in Instellingen', 4200);
      return false;
    }
    clearVersionUpdateSave();
    checkAchievements();
    if (typeof UI !== 'undefined') {
      UI.renderMenu();
      if (UI.renderMissions) UI.renderMissions();
      if (UI.renderSettings) UI.renderSettings();
    }
    return true;
  } catch (err) {
    sfReportError('versionApply', err, 'Save laden mislukt');
    return false;
  }
}

function versionUpdateRestorePending() {
  try {
    if (localStorage.getItem(VERSION_UPDATE_FLAG_KEY) !== '1') return false;
  } catch (_) {
    return false;
  }
  return !!peekVersionUpdateSave();
}

/** Schrijf hoofd-save opnieuw naar backup (fix drift zonder progressie te verliezen). */
function syncBackupFromPrimary() {
  try {
    if (!save || typeof save !== 'object') return false;
    const clean = sanitizeSave(save);
    save = clean;
    const json = JSON.stringify(clean);
    localStorage.setItem(SAVE_KEY, json);
    localStorage.setItem(SAVE_BACKUP_KEY, json);
    try {
      localStorage.setItem(SAVE_STAMP_KEY, JSON.stringify({
        at: new Date().toISOString(),
        bytes: json.length,
        app: APP_VERSION,
      }));
    } catch (_) {}
    return true;
  } catch (err) {
    sfReportError('syncBackup', err, 'Backup sync mislukt');
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

  const cleanPets = {};
  for (const [k, v] of Object.entries(out.pets || {})) {
    if (typeof PET_BY_ID !== 'undefined' && !PET_BY_ID[k]) continue;
    if (typeof PET_BY_ID === 'undefined') continue;
    const entry = (v && typeof v === 'object') ? v : {};
    cleanPets[k] = {
      kills: clamp(Math.floor(Number(entry.kills) || 0), 0, 999999),
    };
  }
  out.pets = cleanPets;
  if (out.activePet && !cleanPets[out.activePet]) out.activePet = null;
  else if (out.activePet && typeof PET_BY_ID !== 'undefined' && !PET_BY_ID[out.activePet]) out.activePet = null;

  const cleanEggs = {};
  for (const [k, v] of Object.entries(out.eggPets || {})) {
    if (typeof EGG_BY_ID !== 'undefined' && !EGG_BY_ID[k]) continue;
    if (typeof EGG_BY_ID === 'undefined') continue;
    const entry = (v && typeof v === 'object') ? v : {};
    cleanEggs[k] = { src: typeof entry.src === 'string' ? entry.src.slice(0, 12) : 'daily' };
  }
  out.eggPets = cleanEggs;
  if (out.activeEggPet && !cleanEggs[out.activeEggPet]) out.activeEggPet = null;
  else if (out.activeEggPet && typeof EGG_BY_ID !== 'undefined' && !EGG_BY_ID[out.activeEggPet]) out.activeEggPet = null;
  if (out.eggDaily && typeof out.eggDaily === 'object') {
    const dk = typeof out.eggDaily.date === 'string' ? out.eggDaily.date.slice(0, 10) : todayKey();
    out.eggDaily = {
      date: dk,
      dailyCracked: !!out.eggDaily.dailyCracked,
      advBonus: !!out.eggDaily.advBonus,
    };
  } else out.eggDaily = null;

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

  const cleanMastery = {};
  for (const [k, v] of Object.entries(out.weaponMastery || {})) {
    if (!WEAPONS.some(w => w.id === k)) continue;
    const fin = clamp(Math.floor(Number(v && v.finishers) || 0), 0, 999999);
    if (fin > 0) cleanMastery[k] = { finishers: fin };
  }
  out.weaponMastery = cleanMastery;

  const cleanSkills = {};
  for (const id of SKILL_IDS) {
    const fixed = typeof sanitizeSkillUpgradeEntry === 'function'
      ? sanitizeSkillUpgradeEntry(id, (out.skillUpgrades || {})[id])
      : null;
    if (fixed) cleanSkills[id] = fixed;
  }
  out.skillUpgrades = cleanSkills;

  const cleanItems = { weapon: {}, pet: {}, style: {} };
  for (const cat of (typeof ITEM_UPGRADE_CATS !== 'undefined' ? ITEM_UPGRADE_CATS : ['weapon', 'pet', 'style'])) {
    const bag = (out.itemUpgrades && out.itemUpgrades[cat] && typeof out.itemUpgrades[cat] === 'object')
      ? out.itemUpgrades[cat] : {};
    for (const [id, raw] of Object.entries(bag)) {
      const fixed = typeof sanitizeItemUpgradeEntry === 'function'
        ? sanitizeItemUpgradeEntry(cat, id, raw)
        : null;
      if (fixed) cleanItems[cat][id] = fixed;
    }
  }
  out.itemUpgrades = cleanItems;

  out.petCoins = clamp(Math.floor(Number(out.petCoins) || 0), 0, 999999);
  if (out.lang != null && !SUPPORTED_LANGS.includes(out.lang)) out.lang = null;

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
  const played = [];
  for (const raw of out.vsPlayedIds) {
    if (typeof raw !== 'string') continue;
    const id = migrateVsRosterId(raw);
    if (VS_ROSTER.some(r => r.id === id) && !played.includes(id)) played.push(id);
  }
  out.vsPlayedIds = played.slice(0, 32);

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
  skill_shard: { color: '#ffd75e', label: 'SKILL' },
  item_shard: { color: '#c792ff', label: 'ITEM' },
};

/* --- src/i18n/i18n.js --- */
/* ============================== I18N =================================== */
const SUPPORTED_LANGS = ['nl', 'en', 'de', 'fr', 'es'];
const LANG_LABELS = { nl: 'NL', en: 'EN', de: 'DE', fr: 'FR', es: 'ES' };

const I18N = {
  nl: {
    back: { menu: '← Menu', collect: '← Collectie', levels: '← Levels' },
    common: { backHome: 'Terug naar menu', ok: 'Begrepen!', offline: 'Offline' },
    menu: {
      continue: 'Verder spelen', adventure: 'Avontuur', adventureSub: 'Verhaal · eilanden · bazen',
      arcade: 'Arcade', arcadeSub: 'Training · Muur · Mats', versus: '2 spelers', versusSub: 'Lokaal · iPad liggend',
      collect: 'Collectie', collectSub: 'Wapens · stijl · boek', music: 'Muziek', missions: 'Missies',
      options: 'Opties', tips: 'Tips', fresh: 'Verse versie', install: 'Zet in app-lade', installSub: 'Één icoon op je beginscherm',
      pressStart: 'insert coin', missionReady: 'missie klaar', dayBonus: 'Dagbonus',
    },
    hub: {
      step: 'Stap 2 · Kies modus', solo: 'SOLO', collection: 'COLLECTIE',
      arcadeTitle: 'Arcade', arcadeSub: 'Snelle sessies · high scores · geen voortgang verlies',
      collectTitle: 'Verzameling', collectSub: 'Wapens · dex & ei-pets · stijlen · monsterboek',
      training: 'Training vs RabbitRobot', trainingSub: '1v1 · oefenen',
      wall: 'Muur Slopen', wallSub: '60 sec · combo = sneller',
      mats: 'Mats · Muntjes bonus', matsSub: '45 sec · munten → pet coins',
      weapons: 'Wapens', weaponsSub: '26 wapens · summon ascends',
      pets: 'Pets', petsSub: 'Mats coins · dex temmen · ei arcade',
      style: 'Stijl', styleSub: 'Bandana & outfit unlocks',
      dex: 'Monsterboek', dexSub: '114 soorten · rariteit = HP',
      modes3: '3 snelle modi', fightersLocal: '20 vechters · lokaal', vsRecord: '{w}/{m} gewonnen',
    },
    modes: { adventure: 'Avontuur', training: 'Training', wall: 'Muur', versus: '2 spelers', coinrun: 'Mats · munten' },
    pause: {
      title: 'Pauze', sub: 'Rasengan klaar — moto! · voortgang blijft op dit apparaat',
      resume: 'Verder spelen', music: 'Muziek', sfx: 'Geluid', quit: 'Stop & hoofdmenu',
      vsRestart: 'Herstart match', vsRestartSub: '0-0 · zelfde vechters',
      audioHint: 'Volume in pauze — sliders sync met Instellingen',
    },
    result: { again: 'Opnieuw', next: 'Volgend level', menu: 'Hoofdmenu', rematch: 'Rematch', rematchSub: 'Zelfde vechters',
      xp: '+{xp} XP verdiend · nu Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Instellingen', sub: 'Geluid, trilling & HUD — opgeslagen op dit apparaat',
      lang: 'Taal / Language', music: 'Muziek', sfx: 'Effecten', shake: 'Schermschok', haptics: 'Trillen (iPad)',
      comboHud: 'Combo-HUD', bigTouch: 'Grote knoppen (iPad)', reducedMotion: 'Minder beweging (FX + iOS)',
      liteFx: 'Lite FX (iPad sneller)', highContrast: 'Hoog contrast tekst', restoreBackup: 'Herstel save uit backup',
      a11yMotionOn: 'Minder beweging: aan', a11yMotionOs: 'Minder beweging: via iOS/OS',
      a11yContrastOn: 'Hoog contrast: aan', a11yContrastOs: 'Hoog contrast: via iOS/OS',
      a11yDefault: 'Toegankelijkheid: standaard — schakel hierboven of via iOS Weergave',
      sfxSamplesOn: 'Online SFX: Kenney CC0 geladen',
      sfxSamplesLoad: 'Online SFX: laden… (synth fallback)',
      sfxSamplesOff: 'Online SFX: offline — synth fallback',
      syncBackup: 'Sync backup = hoofd-save', freshCache: 'Verse versie (cache legen)', clearSave: 'Nieuwe start (dubbel tikken)',
      hosting: 'Hosting & voortgang', copyLink: 'Kopieer vaste speel-link', openLink: 'Open vaste link',
      savePort: 'Save export / import', exportSave: 'Export save', importSave: 'Import save',
      langChanged: 'Taal: {lang}',
    },
    missions: { title: 'Missies & prestaties', sub: '3 lichte dagmissies · claim XP wanneer klaar',
      claimAll: 'Claim alle klaar', claimAllSub: '+XP in één tik', dayBonus: 'Dagbonus', dayBonusSub: '+80 XP · alle 3 geclaimd',
      achievements: 'Prestaties' },
    pets: { title: 'Pets · Metgezels', sub: 'Dex-pets via monsterboek · Ei-pets via dagelijkse arcade-pull',
      crackEgg: 'Dag-ei openen', crackEggSub: 'Gratis arcade-pull' },
    dex: { title: 'Monsterboek', sub: 'Rariteit = HP-bonus (+3…+25) · 4 rariteiten = Kristallijn · helft boek = Boekmeester · 75 kills = Jagerlook' },
    help: { title: 'Tips & controls' },
    install: { title: 'In app-lade zetten', sub: 'Verschijnt als icoon — net als een echte app' },
    island: {
      1: { name: 'Oost-eiland', sub: 'Lv 1–10' }, 2: { name: 'Vuur-eiland', sub: 'Lv 11–20' },
      3: { name: 'Neon-eiland', sub: 'Lv 21–30' }, 4: { name: 'Tempel-eiland', sub: 'Lv 31–40' },
      5: { name: 'Finale-eiland', sub: 'Lv 41–50' },
      progress: 'Eiland {cur}/5 · {name} · {cleared}/{total} · unlock Lv {unlocked}/{max}',
    },
    rarity: { common: 'Gewoon', uncommon: 'Ongewoon', rare: 'Zeldzaam', epic: 'Episch', legendary: 'Legendarisch', mythic: 'Mythisch' },
    audio: { musicOff: 'Muziek uit', sfxOff: 'Geluid uit', musicPct: 'Muziek {pct}%', sfxPct: 'SFX {pct}%', bgmDuckPause: ' · BGM gedempt' },
  },
  en: {
    back: { menu: '← Menu', collect: '← Collection', levels: '← Levels' },
    common: { backHome: 'Back to menu', ok: 'Got it!', offline: 'Offline' },
    menu: {
      continue: 'Continue', adventure: 'Adventure', adventureSub: 'Story · islands · bosses',
      arcade: 'Arcade', arcadeSub: 'Training · Wall · Mats', versus: '2 players', versusSub: 'Local · iPad landscape',
      collect: 'Collection', collectSub: 'Weapons · style · book', music: 'Music', missions: 'Missions',
      options: 'Options', tips: 'Tips', fresh: 'Fresh version', install: 'Add to home screen', installSub: 'One icon on your device',
      pressStart: 'insert coin', missionReady: 'mission ready', dayBonus: 'Daily bonus',
    },
    hub: {
      step: 'Step 2 · Pick mode', solo: 'SOLO', collection: 'COLLECTION',
      arcadeTitle: 'Arcade', arcadeSub: 'Quick sessions · high scores · no progress loss',
      collectTitle: 'Collection', collectSub: 'Weapons · dex & egg pets · styles · monster book',
      training: 'Training vs RabbitRobot', trainingSub: '1v1 · practice',
      wall: 'Wall Smash', wallSub: '60 sec · combo = faster',
      mats: 'Mats · Coin bonus', matsSub: '45 sec · coins → pet coins',
      weapons: 'Weapons', weaponsSub: '26 weapons · summon ascends',
      pets: 'Pets', petsSub: 'Mats coins · dex tame · egg arcade',
      style: 'Style', styleSub: 'Bandana & outfit unlocks',
      dex: 'Monster book', dexSub: '114 species · rarity = HP',
      modes3: '3 quick modes', fightersLocal: '20 fighters · local', vsRecord: '{w}/{m} won',
    },
    modes: { adventure: 'Adventure', training: 'Training', wall: 'Wall', versus: '2 players', coinrun: 'Mats · coins' },
    pause: {
      title: 'Paused', sub: 'Rasengan ready — go! · progress stays on this device',
      resume: 'Resume', music: 'Music', sfx: 'Sound', quit: 'Quit to menu',
      vsRestart: 'Restart match', vsRestartSub: '0-0 · same fighters',
      audioHint: 'Volume in pause — sliders sync with Settings',
    },
    result: { again: 'Again', next: 'Next level', menu: 'Main menu', rematch: 'Rematch', rematchSub: 'Same fighters',
      xp: '+{xp} XP earned · now Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Settings', sub: 'Sound, haptics & HUD — saved on this device',
      lang: 'Language / Taal', music: 'Music', sfx: 'Effects', shake: 'Screen shake', haptics: 'Haptics (iPad)',
      comboHud: 'Combo HUD', bigTouch: 'Big buttons (iPad)', reducedMotion: 'Reduce motion (FX + iOS)',
      liteFx: 'Lite FX (faster iPad)', highContrast: 'High contrast text', restoreBackup: 'Restore save from backup',
      a11yMotionOn: 'Reduce motion: on', a11yMotionOs: 'Reduce motion: via iOS/OS',
      a11yContrastOn: 'High contrast: on', a11yContrastOs: 'High contrast: via iOS/OS',
      a11yDefault: 'Accessibility: default — toggle above or via iOS Display settings',
      sfxSamplesOn: 'Online SFX: Kenney CC0 loaded',
      sfxSamplesLoad: 'Online SFX: loading… (synth fallback)',
      sfxSamplesOff: 'Online SFX: offline — synth fallback',
      syncBackup: 'Sync backup = main save', freshCache: 'Fresh version (clear cache)', clearSave: 'New start (tap twice)',
      hosting: 'Hosting & progress', copyLink: 'Copy play link', openLink: 'Open play link',
      savePort: 'Save export / import', exportSave: 'Export save', importSave: 'Import save',
      langChanged: 'Language: {lang}',
    },
    missions: { title: 'Missions & achievements', sub: '3 light daily missions · claim XP when done',
      claimAll: 'Claim all ready', claimAllSub: '+XP in one tap', dayBonus: 'Daily bonus', dayBonusSub: '+80 XP · all 3 claimed',
      achievements: 'Achievements' },
    pets: { title: 'Pets · Companions', sub: 'Dex pets via monster book · Egg pets via daily arcade pull',
      crackEgg: 'Open daily egg', crackEggSub: 'Free arcade pull' },
    dex: { title: 'Monster book', sub: 'Rarity = HP bonus (+3…+25) · 4 rarities = Crystalline · half book = Bookmaster · 75 kills = Hunter look' },
    help: { title: 'Tips & controls' },
    install: { title: 'Add to home screen', sub: 'Shows as an icon — like a real app' },
    island: {
      1: { name: 'East island', sub: 'Lv 1–10' }, 2: { name: 'Fire island', sub: 'Lv 11–20' },
      3: { name: 'Neon island', sub: 'Lv 21–30' }, 4: { name: 'Temple island', sub: 'Lv 31–40' },
      5: { name: 'Final island', sub: 'Lv 41–50' },
      progress: 'Island {cur}/5 · {name} · {cleared}/{total} · unlock Lv {unlocked}/{max}',
    },
    rarity: { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary', mythic: 'Mythic' },
    audio: { musicOff: 'Music off', sfxOff: 'Sound off', musicPct: 'Music {pct}%', sfxPct: 'SFX {pct}%', bgmDuckPause: ' · BGM ducked' },
  },
  de: {
    back: { menu: '← Menü', collect: '← Sammlung', levels: '← Level' },
    common: { backHome: 'Zurück zum Menü', ok: 'Verstanden!', offline: 'Offline' },
    menu: {
      continue: 'Weiterspielen', adventure: 'Abenteuer', adventureSub: 'Story · Inseln · Bosse',
      arcade: 'Arcade', arcadeSub: 'Training · Mauer · Mats', versus: '2 Spieler', versusSub: 'Lokal · iPad quer',
      collect: 'Sammlung', collectSub: 'Waffen · Stil · Buch', music: 'Musik', missions: 'Missionen',
      options: 'Optionen', tips: 'Tipps', fresh: 'Neue Version', install: 'Zum Home-Bildschirm', installSub: 'Ein Icon auf dem Gerät',
      pressStart: 'insert coin', missionReady: 'Mission bereit', dayBonus: 'Tagesbonus',
    },
    hub: {
      step: 'Schritt 2 · Modus wählen', solo: 'SOLO', collection: 'SAMMLUNG',
      arcadeTitle: 'Arcade', arcadeSub: 'Schnelle Runden · Highscores',
      collectTitle: 'Sammlung', collectSub: 'Waffen · Pets · Stile · Monsterbuch',
      training: 'Training vs RabbitRobot', trainingSub: '1v1 · Üben',
      wall: 'Mauer zerstören', wallSub: '60 Sek · Combo = schneller',
      mats: 'Mats · Münzen', matsSub: '45 Sek · Münzen → Pet-Coins',
      weapons: 'Waffen', weaponsSub: '26 Waffen · Summons',
      pets: 'Pets', petsSub: 'Mats-Coins · Dex zähmen',
      style: 'Stil', styleSub: 'Outfit-Freischaltungen',
      dex: 'Monsterbuch', dexSub: '114 Arten · Seltenheit = HP',
      modes3: '3 schnelle Modi', fightersLocal: '20 Kämpfer · lokal', vsRecord: '{w}/{m} Siege',
    },
    modes: { adventure: 'Abenteuer', training: 'Training', wall: 'Mauer', versus: '2 Spieler', coinrun: 'Mats · Münzen' },
    pause: {
      title: 'Pause', sub: 'Rasengan bereit — los! · Fortschritt bleibt auf diesem Gerät',
      resume: 'Weiter', music: 'Musik', sfx: 'Sound', quit: 'Menü verlassen',
      vsRestart: 'Match neu starten', vsRestartSub: '0-0 · gleiche Kämpfer',
      audioHint: 'Lautstärke in Pause — sync mit Einstellungen',
    },
    result: { again: 'Nochmal', next: 'Nächstes Level', menu: 'Hauptmenü', rematch: 'Revanche', rematchSub: 'Gleiche Kämpfer',
      xp: '+{xp} XP · jetzt Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Einstellungen', sub: 'Sound, Vibration & HUD — auf diesem Gerät gespeichert',
      lang: 'Sprache / Language', music: 'Musik', sfx: 'Effekte', shake: 'Bildschirmshake', haptics: 'Vibration (iPad)',
      comboHud: 'Combo-HUD', bigTouch: 'Große Tasten (iPad)', reducedMotion: 'Weniger Bewegung',
      liteFx: 'Lite FX (schneller)', highContrast: 'Hoher Kontrast', restoreBackup: 'Save aus Backup',
      syncBackup: 'Backup syncen', freshCache: 'Neue Version (Cache leeren)', clearSave: 'Neustart (2× tippen)',
      hosting: 'Hosting & Fortschritt', copyLink: 'Link kopieren', openLink: 'Link öffnen',
      savePort: 'Save export / import', exportSave: 'Save exportieren', importSave: 'Save importieren',
      langChanged: 'Sprache: {lang}',
    },
    missions: { title: 'Missionen & Erfolge', sub: '3 tägliche Missionen · XP abholen',
      claimAll: 'Alle abholen', claimAllSub: '+XP auf einmal', dayBonus: 'Tagesbonus', dayBonusSub: '+80 XP',
      achievements: 'Erfolge' },
    pets: { title: 'Pets · Begleiter', sub: 'Dex-Pets & Ei-Pets', crackEgg: 'Tages-Ei öffnen', crackEggSub: 'Gratis Pull' },
    dex: { title: 'Monsterbuch', sub: 'Seltenheit = HP-Bonus' },
    help: { title: 'Tipps & Steuerung' },
    install: { title: 'Zum Home-Bildschirm', sub: 'Wie eine echte App' },
    island: {
      1: { name: 'Ost-Insel', sub: 'Lv 1–10' }, 2: { name: 'Feuer-Insel', sub: 'Lv 11–20' },
      3: { name: 'Neon-Insel', sub: 'Lv 21–30' }, 4: { name: 'Tempel-Insel', sub: 'Lv 31–40' },
      5: { name: 'Finale-Insel', sub: 'Lv 41–50' },
      progress: 'Insel {cur}/5 · {name} · {cleared}/{total} · Lv {unlocked}/{max}',
    },
    rarity: { common: 'Gewöhnlich', uncommon: 'Ungewöhnlich', rare: 'Selten', epic: 'Episch', legendary: 'Legendär', mythic: 'Mythisch' },
    audio: { musicOff: 'Musik aus', sfxOff: 'Sound aus', musicPct: 'Musik {pct}%', sfxPct: 'SFX {pct}%', bgmDuckPause: ' · BGM gedämpft' },
  },
  fr: {
    back: { menu: '← Menu', collect: '← Collection', levels: '← Niveaux' },
    common: { backHome: 'Retour au menu', ok: 'Compris !', offline: 'Hors ligne' },
    menu: {
      continue: 'Continuer', adventure: 'Aventure', adventureSub: 'Histoire · îles · boss',
      arcade: 'Arcade', arcadeSub: 'Entraînement · Mur · Mats', versus: '2 joueurs', versusSub: 'Local · iPad paysage',
      collect: 'Collection', collectSub: 'Armes · style · bestiaire', music: 'Musique', missions: 'Missions',
      options: 'Options', tips: 'Astuces', fresh: 'Version fraîche', install: 'Ajouter à l\'écran d\'accueil', installSub: 'Une icône sur l\'appareil',
      pressStart: 'insert coin', missionReady: 'mission prête', dayBonus: 'Bonus du jour',
    },
    hub: {
      step: 'Étape 2 · Choisir le mode', solo: 'SOLO', collection: 'COLLECTION',
      arcadeTitle: 'Arcade', arcadeSub: 'Sessions rapides · high scores',
      collectTitle: 'Collection', collectSub: 'Armes · pets · styles · bestiaire',
      training: 'Entraînement vs RabbitRobot', trainingSub: '1v1 · pratique',
      wall: 'Mur à détruire', wallSub: '60 s · combo = plus vite',
      mats: 'Mats · Pièces', matsSub: '45 s · pièces → pet coins',
      weapons: 'Armes', weaponsSub: '26 armes · invocations',
      pets: 'Pets', petsSub: 'Pièces Mats · dex · œufs',
      style: 'Style', styleSub: 'Déblocages tenues',
      dex: 'Bestiaire', dexSub: '114 espèces · rareté = PV',
      modes3: '3 modes rapides', fightersLocal: '20 combattants · local', vsRecord: '{w}/{m} victoires',
    },
    modes: { adventure: 'Aventure', training: 'Entraînement', wall: 'Mur', versus: '2 joueurs', coinrun: 'Mats · pièces' },
    pause: {
      title: 'Pause', sub: 'Rasengan prêt — go ! · progrès sur cet appareil',
      resume: 'Reprendre', music: 'Musique', sfx: 'Son', quit: 'Quitter au menu',
      vsRestart: 'Recommencer', vsRestartSub: '0-0 · mêmes combattants',
      audioHint: 'Volume en pause — sync avec Options',
    },
    result: { again: 'Rejouer', next: 'Niveau suivant', menu: 'Menu principal', rematch: 'Revanche', rematchSub: 'Mêmes combattants',
      xp: '+{xp} XP · Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Options', sub: 'Son, vibrations & HUD — sauvegardé sur cet appareil',
      lang: 'Langue / Language', music: 'Musique', sfx: 'Effets', shake: 'Secousse écran', haptics: 'Vibration (iPad)',
      comboHud: 'HUD combo', bigTouch: 'Gros boutons (iPad)', reducedMotion: 'Moins de mouvement',
      liteFx: 'Lite FX (plus rapide)', highContrast: 'Contraste élevé', restoreBackup: 'Restaurer backup',
      syncBackup: 'Sync backup', freshCache: 'Version fraîche (cache)', clearSave: 'Nouveau départ (2× tap)',
      hosting: 'Hébergement & progrès', copyLink: 'Copier le lien', openLink: 'Ouvrir le lien',
      savePort: 'Export / import save', exportSave: 'Exporter save', importSave: 'Importer save',
      langChanged: 'Langue : {lang}',
    },
    missions: { title: 'Missions & succès', sub: '3 missions quotidiennes · réclamer XP',
      claimAll: 'Tout réclamer', claimAllSub: '+XP en un tap', dayBonus: 'Bonus du jour', dayBonusSub: '+80 XP',
      achievements: 'Succès' },
    pets: { title: 'Pets · Compagnons', sub: 'Pets dex & œufs arcade', crackEgg: 'Ouvrir l\'œuf du jour', crackEggSub: 'Tir gratuit' },
    dex: { title: 'Bestiaire', sub: 'Rareté = bonus PV' },
    help: { title: 'Astuces & contrôles' },
    install: { title: 'Ajouter à l\'écran d\'accueil', sub: 'Comme une vraie app' },
    island: {
      1: { name: 'Île de l\'Est', sub: 'Lv 1–10' }, 2: { name: 'Île de Feu', sub: 'Lv 11–20' },
      3: { name: 'Île Néon', sub: 'Lv 21–30' }, 4: { name: 'Île Temple', sub: 'Lv 31–40' },
      5: { name: 'Île Finale', sub: 'Lv 41–50' },
      progress: 'Île {cur}/5 · {name} · {cleared}/{total} · Lv {unlocked}/{max}',
    },
    rarity: { common: 'Commun', uncommon: 'Peu commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire', mythic: 'Mythique' },
    audio: { musicOff: 'Musique off', sfxOff: 'Son off', musicPct: 'Musique {pct}%', sfxPct: 'SFX {pct}%', bgmDuckPause: ' · BGM atténué' },
  },
  es: {
    back: { menu: '← Menú', collect: '← Colección', levels: '← Niveles' },
    common: { backHome: 'Volver al menú', ok: '¡Entendido!', offline: 'Sin conexión' },
    menu: {
      continue: 'Continuar', adventure: 'Aventura', adventureSub: 'Historia · islas · jefes',
      arcade: 'Arcade', arcadeSub: 'Entrenamiento · Muro · Mats', versus: '2 jugadores', versusSub: 'Local · iPad horizontal',
      collect: 'Colección', collectSub: 'Armas · estilo · bestiario', music: 'Música', missions: 'Misiones',
      options: 'Opciones', tips: 'Consejos', fresh: 'Versión nueva', install: 'Añadir a inicio', installSub: 'Un icono en tu dispositivo',
      pressStart: 'insert coin', missionReady: 'misión lista', dayBonus: 'Bonus diario',
    },
    hub: {
      step: 'Paso 2 · Elige modo', solo: 'SOLO', collection: 'COLECCIÓN',
      arcadeTitle: 'Arcade', arcadeSub: 'Sesiones rápidas · high scores',
      collectTitle: 'Colección', collectSub: 'Armas · pets · estilos · bestiario',
      training: 'Entrenamiento vs RabbitRobot', trainingSub: '1v1 · practicar',
      wall: 'Romper muro', wallSub: '60 s · combo = más rápido',
      mats: 'Mats · Monedas', matsSub: '45 s · monedas → pet coins',
      weapons: 'Armas', weaponsSub: '26 armas · invocaciones',
      pets: 'Pets', petsSub: 'Monedas Mats · dex · huevos',
      style: 'Estilo', styleSub: 'Desbloqueos de outfit',
      dex: 'Bestiario', dexSub: '114 especies · rareza = HP',
      modes3: '3 modos rápidos', fightersLocal: '20 luchadores · local', vsRecord: '{w}/{m} ganados',
    },
    modes: { adventure: 'Aventura', training: 'Entrenamiento', wall: 'Muro', versus: '2 jugadores', coinrun: 'Mats · monedas' },
    pause: {
      title: 'Pausa', sub: 'Rasengan listo — ¡ya! · progreso en este dispositivo',
      resume: 'Seguir', music: 'Música', sfx: 'Sonido', quit: 'Salir al menú',
      vsRestart: 'Reiniciar partida', vsRestartSub: '0-0 · mismos luchadores',
      audioHint: 'Volumen en pausa — sync con Opciones',
    },
    result: { again: 'Otra vez', next: 'Siguiente nivel', menu: 'Menú principal', rematch: 'Revancha', rematchSub: 'Mismos luchadores',
      xp: '+{xp} XP · Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Opciones', sub: 'Sonido, vibración y HUD — guardado en este dispositivo',
      lang: 'Idioma / Language', music: 'Música', sfx: 'Efectos', shake: 'Sacudida pantalla', haptics: 'Vibración (iPad)',
      comboHud: 'HUD combo', bigTouch: 'Botones grandes (iPad)', reducedMotion: 'Menos movimiento',
      liteFx: 'Lite FX (más rápido)', highContrast: 'Alto contraste', restoreBackup: 'Restaurar backup',
      syncBackup: 'Sync backup', freshCache: 'Versión nueva (caché)', clearSave: 'Nuevo inicio (2× tap)',
      hosting: 'Hosting y progreso', copyLink: 'Copiar enlace', openLink: 'Abrir enlace',
      savePort: 'Export / import save', exportSave: 'Exportar save', importSave: 'Importar save',
      langChanged: 'Idioma: {lang}',
    },
    missions: { title: 'Misiones y logros', sub: '3 misiones diarias · reclamar XP',
      claimAll: 'Reclamar todo', claimAllSub: '+XP de una vez', dayBonus: 'Bonus diario', dayBonusSub: '+80 XP',
      achievements: 'Logros' },
    pets: { title: 'Pets · Compañeros', sub: 'Pets dex y huevos arcade', crackEgg: 'Abrir huevo diario', crackEggSub: 'Tirada gratis' },
    dex: { title: 'Bestiario', sub: 'Rareza = bonus HP' },
    help: { title: 'Consejos y controles' },
    install: { title: 'Añadir a inicio', sub: 'Como una app real' },
    island: {
      1: { name: 'Isla Este', sub: 'Lv 1–10' }, 2: { name: 'Isla Fuego', sub: 'Lv 11–20' },
      3: { name: 'Isla Neón', sub: 'Lv 21–30' }, 4: { name: 'Isla Templo', sub: 'Lv 31–40' },
      5: { name: 'Isla Final', sub: 'Lv 41–50' },
      progress: 'Isla {cur}/5 · {name} · {cleared}/{total} · Lv {unlocked}/{max}',
    },
    rarity: { common: 'Común', uncommon: 'Poco común', rare: 'Raro', epic: 'Épico', legendary: 'Legendario', mythic: 'Mítico' },
    audio: { musicOff: 'Música off', sfxOff: 'Sonido off', musicPct: 'Música {pct}%', sfxPct: 'SFX {pct}%', bgmDuckPause: ' · BGM atenuado' },
  },
};

function i18nLookup(table, key) {
  const parts = key.split('.');
  let cur = table;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return null;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : null;
}

function detectBrowserLang() {
  try {
    const raw = (navigator.language || navigator.userLanguage || 'nl').slice(0, 2).toLowerCase();
    return SUPPORTED_LANGS.includes(raw) ? raw : 'en';
  } catch (_) {
    return 'nl';
  }
}

function getLang() {
  const l = save && save.lang;
  return SUPPORTED_LANGS.includes(l) ? l : detectBrowserLang();
}

function setLang(code) {
  if (!SUPPORTED_LANGS.includes(code)) return false;
  save.lang = code;
  persist();
  applyLang();
  return true;
}

function t(key, params) {
  const lang = getLang();
  let s = i18nLookup(I18N[lang], key) || i18nLookup(I18N.nl, key) || i18nLookup(I18N.en, key) || key;
  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params)) {
      s = s.split('{' + k + '}').join(String(v));
    }
  }
  return s;
}

function rarityLabel(id) {
  return t('rarity.' + id) || rarityOf(id).name;
}

function islandLabel(id, field) {
  return t('island.' + id + '.' + field) || (islandMeta(id)[field === 'name' ? 'name' : 'sub']);
}

function achLabel(ach, field) {
  const k = 'ach.' + ach.id + '.' + field;
  const v = t(k);
  if (v && v !== k) return v;
  return ach[field];
}

function setText(id, key, params) {
  const el = document.getElementById(id);
  if (el) el.textContent = t(key, params);
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function canApplyDomI18n() {
  return typeof document !== 'undefined' && document.getElementById
    && typeof document.createTextNode === 'function';
}

function applyLangStaticScreens() {
  if (!canApplyDomI18n()) return;
  if (document.documentElement) document.documentElement.lang = getLang();
  const net = document.getElementById('netStatus');
  if (net) net.textContent = t('common.offline');

  setText('menuLangLbl', 'settings.lang');
  setText('pressStartLine', 'menu.pressStart');
  const cont = document.getElementById('btnContinue');
  if (cont) {
    const div = cont.querySelector('div');
    if (div && !save.lastPlay?.mode) div.firstChild && (div.childNodes[0].textContent = t('menu.continue') + '\n');
  }

  const hubMap = [
    ['.hub-tile-adventure .hub-tile-title', 'menu.adventure'],
    ['.hub-tile-adventure .hub-tile-sub', 'menu.adventureSub'],
    ['.hub-tile-arcade .hub-tile-title', 'menu.arcade'],
    ['.hub-tile-arcade .hub-tile-sub', 'menu.arcadeSub'],
    ['.hub-tile-versus .hub-tile-title', 'menu.versus'],
    ['.hub-tile-versus .hub-tile-sub', 'menu.versusSub'],
    ['.hub-tile-collect .hub-tile-title', 'menu.collect'],
    ['.hub-tile-collect .hub-tile-sub', 'menu.collectSub'],
  ];
  for (const [sel, key] of hubMap) {
    const el = document.querySelector(sel);
    if (el) el.textContent = t(key);
  }

  const dockMap = [
    ['togMusic', 'menu.music', true], ['btnMissionsLbl', 'menu.missions', false],
    ['btnSettings', 'menu.options', true], ['btnHelp', 'menu.tips', true],
    ['btnVerseVersie', 'menu.fresh', true],
  ];
  for (const [id, key, isBtn] of dockMap) {
    const el = document.getElementById(id);
    if (!el) continue;
    const label = t(key);
    if (isBtn) {
      const ico = el.querySelector('.tog-ico');
      el.textContent = '';
      if (ico) el.appendChild(ico);
      el.appendChild(document.createTextNode(label));
    } else el.textContent = label;
  }

  const installLbl = document.getElementById('btnInstallLabel');
  if (installLbl) installLbl.innerHTML = t('menu.install') + '<small>' + t('menu.installSub') + '</small>';

  setText('modeHubStep', 'hub.step');
  const modeRows = [
    ['btnTraining', 'hub.training', 'hub.trainingSub'],
    ['btnWall', 'hub.wall', 'hub.wallSub'],
    ['btnMatsCoins', 'hub.mats', 'hub.matsSub'],
    ['btnWeapons', 'hub.weapons', 'hub.weaponsSub'],
    ['btnPets', 'hub.pets', 'hub.petsSub'],
    ['btnStyle', 'hub.style', 'hub.styleSub'],
    ['btnDex', 'hub.dex', 'hub.dexSub'],
  ];
  for (const [id, titleKey, subKey] of modeRows) {
    const btn = document.getElementById(id);
    const div = btn && btn.querySelector('div');
    if (!div) continue;
    const stat = div.querySelector('.hub-mode-stat');
    const statHtml = stat ? stat.outerHTML : '';
    div.innerHTML = t(titleKey) + '<small>' + t(subKey) + '</small>' + statHtml;
  }

  document.querySelectorAll('.sub-home-btn div').forEach((el) => {
    el.textContent = t('common.backHome');
  });

  setText('settingsHead', 'settings.title');
  setText('settingsSub', 'settings.sub');
  setText('setLangLbl', 'settings.lang');
  const setMap = [
    ['setShake', 'settings.shake'], ['setHaptics', 'settings.haptics'], ['setComboHud', 'settings.comboHud'],
    ['setBigTouch', 'settings.bigTouch'], ['setReducedMotion', 'settings.reducedMotion'],
    ['setLiteFx', 'settings.liteFx'], ['setHighContrast', 'settings.highContrast'],
    ['btnRestoreBackup', 'settings.restoreBackup'], ['btnSyncBackup', 'settings.syncBackup'],
    ['btnForceFresh', 'settings.freshCache'], ['btnClearSave', 'settings.clearSave'],
    ['btnCopyLink', 'settings.copyLink'], ['btnOpenPlayLink', 'settings.openLink'],
    ['btnExportSave', 'settings.exportSave'], ['btnImportSave', 'settings.importSave'],
  ];
  for (const [id, key] of setMap) {
    const el = document.getElementById(id);
    if (!el) continue;
    const ico = el.querySelector('.tog-ico');
    const label = t(key);
    if (ico) {
      el.textContent = '';
      el.appendChild(ico);
      el.appendChild(document.createTextNode(label));
    } else el.textContent = label;
  }
  const hostingTitle = document.querySelector('#settingsScreen .settings-card div[style*="ffd75e"]');
  if (hostingTitle) hostingTitle.textContent = t('settings.hosting');
  const savePortTitle = document.querySelectorAll('#settingsScreen .settings-card div[style*="ffd75e"]')[1];
  if (savePortTitle) savePortTitle.textContent = t('settings.savePort');

  setText('missionsHead', 'missions.title');
  setText('missionsSub', 'missions.sub');
  const claimAll = document.getElementById('dailyClaimAllBtn');
  if (claimAll) {
    const d = claimAll.querySelector('div');
    if (d) d.innerHTML = t('missions.claimAll') + '<small>' + t('missions.claimAllSub') + '</small>';
  }
  const dayBonus = document.getElementById('dailyBonusBtn');
  if (dayBonus) {
    const d = dayBonus.querySelector('div');
    if (d) d.innerHTML = t('missions.dayBonus') + '<small>' + t('missions.dayBonusSub') + '</small>';
  }
  document.querySelectorAll('#missionsScreen .head')[1] &&
    (document.querySelectorAll('#missionsScreen .head')[1].textContent = t('missions.achievements'));

  setText('petScreenHead', 'pets.title');
  setText('petScreenSub', 'pets.sub');
  const eggBtn = document.getElementById('eggCrackBtn');
  if (eggBtn) {
    const d = eggBtn.querySelector('div');
    if (d) d.innerHTML = t('pets.crackEgg') + '<small>' + t('pets.crackEggSub') + '</small>';
  }

  setText('dexScreenHead', 'dex.title');
  setText('dexScreenSub', 'dex.sub');
  setText('helpHead', 'help.title');
  setText('installHead', 'install.title');
  setText('installSub', 'ui.installSub');

  setText('charArenaPre', 'ui.charArenaPre');
  setText('charSelectHead', 'ui.charHead');
  setText('charSelectRosterLine', 'ui.charRosterLine');
  setText('levelScreenHead', 'ui.levelHead');
  setText('levelScreenSub', 'ui.levelSub');
  setText('gambleSub', 'ui.gambleSub');
  setText('styleScreenHead', 'ui.styleHead');
  setText('styleScreenSub', 'ui.styleSub');
  setText('weaponScreenHead', 'ui.weaponHead');
  setText('weaponScreenSub', 'ui.weaponSub');
  setText('skillScreenHead', 'ui.skillHead');
  setText('skillScreenSub', 'ui.skillSub');
  setText('helpFirstMinute', 'ui.helpFirstMinute');

  const gambleStartLbl = document.getElementById('gambleStartLbl');
  if (gambleStartLbl) gambleStartLbl.innerHTML = t('ui.gambleStart') + '<small>' + t('ui.gambleStartSub') + '</small>';
  const gambleSkipLbl = document.getElementById('gambleSkipLbl');
  if (gambleSkipLbl) gambleSkipLbl.innerHTML = t('ui.gambleSkip') + '<small>' + t('ui.gambleSkipSub') + '</small>';

  const helpTipsList = document.getElementById('helpTipsList');
  if (helpTipsList && typeof i18nList === 'function') {
    const tips = i18nList('help.tips');
    helpTipsList.innerHTML = tips.map((line) => `<li>${line}</li>`).join('');
  }

  const charIpadCard = document.getElementById('charIpadTipCard');
  if (charIpadCard) charIpadCard.innerHTML = t('ui.charIpadTip');

  const charFightBtn = document.getElementById('btnCharFight');
  if (charFightBtn) charFightBtn.textContent = t('ui.charFight');

  setText('pauseHead', 'pause.title');
  setText('pauseSub', 'pause.sub');
  const pauseResume = document.getElementById('pauseResume');
  if (pauseResume) pauseResume.querySelector('div').textContent = t('pause.resume');
  const pauseQuit = document.getElementById('pauseQuit');
  if (pauseQuit) pauseQuit.querySelector('div').textContent = t('pause.quit');
  const pauseVs = document.getElementById('pauseVsRestart');
  if (pauseVs) {
    const d = pauseVs.querySelector('div');
    if (d) d.innerHTML = t('pause.vsRestart') + '<small>' + t('pause.vsRestartSub') + '</small>';
  }
  ['pauseTogMusic', 'pauseTogSfx'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    const ico = el.querySelector('.tog-ico');
    const label = t(i ? 'pause.sfx' : 'pause.music');
    el.textContent = '';
    if (ico) el.appendChild(ico);
    el.appendChild(document.createTextNode(label));
  });

  const resAgain = document.getElementById('resAgain');
  if (resAgain) resAgain.querySelector('div').textContent = t('result.again');
  const resNext = document.getElementById('resNext');
  if (resNext) resNext.querySelector('div').textContent = t('result.next');
  const resMenu = document.getElementById('resMenu');
  if (resMenu) resMenu.querySelector('div').textContent = t('result.menu');
  const helpOk = document.getElementById('helpOk');
  if (helpOk) helpOk.querySelector('div').textContent = t('common.ok');

  UI.pauseSubDefault = t('pause.sub');
  if (!UI.BACK_LABELS) UI.BACK_LABELS = {};
  Object.assign(UI.BACK_LABELS, {
    modeHubScreen: t('back.menu'),
    levelScreen: t('back.menu'),
    gambleScreen: t('back.levels'),
    weaponScreen: t('back.collect'),
    petScreen: t('back.collect'),
    styleScreen: t('back.collect'),
    dexScreen: t('back.collect'),
    charSelectScreen: t('back.menu'),
    missionsScreen: t('back.menu'),
    settingsScreen: t('back.menu'),
    helpScreen: t('back.menu'),
    installScreen: t('back.menu'),
  });
  UI.syncBackLabels();
}

function onLangSwitchClick(e) {
  const btn = e.target.closest('[data-lang]');
  if (!btn) return;
  const code = btn.getAttribute('data-lang');
  if (!code || code === getLang()) return;
  safeUiAction(() => {
    setLang(code);
    AudioSys.sfx('select');
    UI.toast(t('settings.langChanged', { lang: LANG_LABELS[code] }), 2200);
    UI.renderSettings();
    UI.renderMenu();
    if (typeof UI.renderModeHub === 'function') UI.renderModeHub();
  }, 'setLang/' + code, t('ui.langSwitchFail') || 'Language switch failed');
}

function renderLangSwitchBar(bar) {
  if (!bar) return;
  const cur = getLang();
  bar.innerHTML = SUPPORTED_LANGS.map((code) =>
    `<button type="button" class="dex-filter-btn${cur === code ? ' active' : ''}" data-lang="${code}">${LANG_LABELS[code]}</button>`
  ).join('');
  if (!bar.dataset.bound) {
    bar.dataset.bound = '1';
    bar.addEventListener('click', onLangSwitchClick);
  }
}

function renderLangSwitch() {
  renderLangSwitchBar(document.getElementById('langSwitchBar'));
  renderLangSwitchBar(document.getElementById('menuLangBar'));
}

function applyLang() {
  if (!canApplyDomI18n()) return;
  applyLangStaticScreens();
  renderLangSwitch();
    if (typeof UI !== 'undefined') {
    UI.renderMenu();
    const active = UI.activeScreen && UI.activeScreen();
    if (active === 'settingsScreen') UI.renderSettings();
    else if (active === 'missionsScreen') UI.renderMissions();
    else if (active === 'helpScreen' && typeof UI.renderHelp === 'function') UI.renderHelp();
    else if (active === 'weaponScreen' && typeof UI.renderWeapons === 'function') UI.renderWeapons();
    else if (active === 'styleScreen' && typeof UI.renderStyle === 'function') UI.renderStyle();
    else if (active === 'charSelectScreen' && typeof UI.renderCharSelect === 'function') UI.renderCharSelect();
    else if (active === 'levelScreen' && typeof UI.renderLevels === 'function') UI.renderLevels();
    else if (active === 'modeHubScreen') UI.renderModeHub();
    UI.syncBackLabels();
  }
}

function initLang() {
  if (typeof mergeI18nCatalogs === 'function') mergeI18nCatalogs();
  if (!save.lang || !SUPPORTED_LANGS.includes(save.lang)) {
    save.lang = detectBrowserLang();
    persist();
  }
  applyLang();
}
/* --- src/render/art-helpers.js --- */
/* ============ IN-GAME ART HELPERS (art-upgrade 3/4) ==================== */
/** Getekend pickup-icoon (hart/vlam/spiraal/schild) ipv tekstlabel. */
function drawPickupIcon(c, kind, x, y, tint) {
  c.save();
  c.translate(x, y);
  c.fillStyle = '#0a0d18';
  if (kind === 'heal') {
    c.beginPath();
    c.moveTo(0, 6.5);
    c.bezierCurveTo(-9.5, -1.5, -5, -9.5, 0, -4);
    c.bezierCurveTo(5, -9.5, 9.5, -1.5, 0, 6.5);
    c.fill();
  } else if (kind === 'rage') {
    c.beginPath();
    c.moveTo(0.5, -8);
    c.quadraticCurveTo(6.5, -1.5, 3.5, 4);
    c.quadraticCurveTo(2.5, 7, -0.5, 7);
    c.quadraticCurveTo(-5, 7, -4.5, 2);
    c.quadraticCurveTo(-6.5, -2, 0.5, -8);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.beginPath();
    c.ellipse(-0.5, 3, 2, 3, 0, 0, TAU);
    c.fill();
  } else if (kind === 'chakra') {
    c.strokeStyle = '#0a0d18';
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    c.beginPath();
    for (let a = 0; a < TAU * 1.55; a += 0.22) {
      const rr = 1.2 + a * 1.35;
      const sx = Math.cos(a) * rr, sy = Math.sin(a) * rr;
      if (a === 0) c.moveTo(sx, sy); else c.lineTo(sx, sy);
    }
    c.stroke();
  } else if (kind === 'skill_shard' || kind === 'item_shard') {
    const fill = tint || (kind === 'item_shard' ? '#c792ff' : '#ffd75e');
    c.fillStyle = fill;
    c.beginPath();
    c.moveTo(0, -7);
    c.lineTo(6.5, -1);
    c.lineTo(4, 7);
    c.lineTo(-4, 7);
    c.lineTo(-6.5, -1);
    c.closePath();
    c.fill();
    c.strokeStyle = '#0a0d18';
    c.lineWidth = 1.6;
    c.stroke();
    if (kind === 'item_shard') {
      c.fillStyle = '#0a0d18';
      c.beginPath();
      c.arc(0, 0, 2.2, 0, TAU);
      c.fill();
    }
  } else {
    c.beginPath();
    c.moveTo(0, -8);
    c.quadraticCurveTo(7, -6.5, 7, -2.5);
    c.quadraticCurveTo(7, 3.5, 0, 8);
    c.quadraticCurveTo(-7, 3.5, -7, -2.5);
    c.quadraticCurveTo(-7, -6.5, 0, -8);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,.55)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(0, -5);
    c.lineTo(0, 4.5);
    c.stroke();
  }
  c.restore();
}

/** Vijfpuntige ster (gevuld of outline) ipv ★/☆ tekst-glyphs. */
function drawStarShape(c, x, y, r, color, filled) {
  c.save();
  c.translate(x, y);
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    if (i === 0) c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  if (filled) { c.fillStyle = color; c.fill(); }
  else { c.strokeStyle = color; c.lineWidth = 1.6; c.stroke(); }
  c.restore();
}

/** Mini-dobbelsteen voor gamble-HUD-regels ipv 🎲. */
function drawMiniDie(c, x, y, s, color) {
  c.save();
  c.fillStyle = color;
  const half = s / 2;
  c.beginPath();
  if (c.roundRect) c.roundRect(x - half, y - half, s, s, s * 0.24);
  else c.rect(x - half, y - half, s, s);
  c.fill();
  c.fillStyle = '#0a0d18';
  const d = s * 0.22, pr = Math.max(0.8, s * 0.11);
  for (const [dx, dy] of [[-d, -d], [d, d], [0, 0]]) {
    c.beginPath();
    c.arc(x + dx, y + dy, pr, 0, TAU);
    c.fill();
  }
  c.restore();
}

/* --- src/systems/missions.js --- */
/* ===================== DAGELIJKSE MISSIES & PRESTATIES ================= */
const DAILY_DEFS = [
  { id: 'kills12', type: 'kills', goal: 12, xp: 45, text: 'Versla 12 monsters' },
  { id: 'advwin', type: 'advWin', goal: 1, xp: 55, text: 'Win 1 avontuur-level' },
  { id: 'wall35', type: 'wallBricks', goal: 35, xp: 40, text: 'Sloop 35 muurstenen' },
  { id: 'trainwin', type: 'trainWin', goal: 1, xp: 60, text: 'Win training vs Robot' },
  { id: 'combo5', type: 'comboReach', goal: 5, xp: 35, text: 'Bereik combo ×5' },
  { id: 'finisher3', type: 'weaponFinisher', goal: 3, xp: 42, text: 'Land 3 wapen-finishers' },
  { id: 'pick3', type: 'pickups', goal: 3, xp: 30, text: 'Pak 3 power-ups' },
  { id: 'boss1', type: 'bossKill', goal: 1, xp: 50, text: 'Versla 1 baas-monster' },
];
const DAILY_PLAY_HINTS = {
  kills12: 'Speel Avontuur of Training',
  advwin: 'Menu → Avontuur, win het level',
  wall35: 'Menu → Muur slopen (combo helpt)',
  trainwin: 'Menu → Training vs RabbitRobot',
  combo5: 'Avontuur: snelle combo’s op monsters',
  finisher3: 'Avontuur/Training: ①+② raken, dan finisher ③',
  pick3: 'Avontuur: groen/oranje/blauwe bolletjes',
  boss1: 'Avontuur: baas aan einde van een level',
};
const DAILY_PLAY_TARGETS = {
  kills12: { mode: 'adventure', label: 'Avontuur' },
  advwin: { mode: 'adventure', label: 'Avontuur' },
  wall35: { mode: 'wall', label: 'Muur' },
  trainwin: { mode: 'training', label: 'Training' },
  combo5: { mode: 'adventure', label: 'Avontuur' },
  finisher3: { mode: 'adventure', label: 'Avontuur' },
  pick3: { mode: 'adventure', label: 'Avontuur' },
  boss1: { mode: 'adventure', label: 'Avontuur' },
};
function goDailyPlayTarget(taskId) {
  try {
    const t = DAILY_PLAY_TARGETS[taskId];
    if (!t) return;
    AudioSys.init();
    AudioSys.sfx('select');
    if (t.mode === 'adventure') {
      UI.renderLevels();
      UI.show('levelScreen');
    } else if (t.mode === 'training') {
      startGame('training');
    } else if (t.mode === 'wall') {
      startGame('wall');
    }
  } catch (err) {
    sfReportError('dailyPlay', err, 'Kon modus niet openen — kies handmatig in menu');
  }
}
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
  { id: 'dexHalf', name: 'Veldgids', desc: 'Helft van alle soorten ontdekt', icon: '🧭',
    test: s => Object.keys(s.dex || {}).length >= Math.ceil(SPECIES_ORDER.length / 2) },
  { id: 'dexTiers', name: 'Rariteitenjager', desc: '4 verschillende rariteiten in boek', icon: '💎',
    test: () => dexRarityTierCount() >= 4 },
  { id: 'dexMythic', name: 'Mythe-zoeker', desc: 'Eén mythisch monster ontdekt', icon: '✨',
    test: s => {
      for (const id of Object.keys(s.dex || {})) {
        const sp = SPECIES[id];
        if (sp && sp.rarity === 'mythic') return true;
      }
      return false;
    } },
  { id: 'train5', name: 'Robotbreker', desc: '5× training gewonnen', icon: '🤖',
    test: s => s.trainWins >= 5 },
  { id: 'wall100', name: 'Sloper', desc: 'Muurrecord 100+', icon: '🧱',
    test: s => s.bestWall >= 100 },
  { id: 'combo8', name: 'Combo-koning', desc: 'Combo ×8 bereikt', icon: '⚡',
    test: s => s.stats.maxCombo >= 8 },
  { id: 'finisher10', name: 'Stijl-meester', desc: '10 wapen-finishers geland', icon: '⚔',
    test: s => (s.stats.weaponFinishers || 0) >= 10 },
  { id: 'finisher1', name: 'Eerste stijl', desc: 'Land je eerste wapen-finisher', icon: '🗡',
    test: s => (s.stats.weaponFinishers || 0) >= 1 },
  { id: 'weaponMaster25', name: 'Wapen-legende', desc: '25 finishers met één wapen', icon: '👑',
    test: s => Object.values(s.weaponMastery || {}).some(m => (m.finishers || 0) >= 25) },
  { id: 'finisher50', name: 'Combo-sensei', desc: '50 finishers totaal', icon: '✨',
    test: s => (s.stats.weaponFinishers || 0) >= 50 },
  { id: 'streak10', name: 'Onstuitbaar', desc: 'Kill streak ×10 in avontuur', icon: '🔥',
    test: s => (s.stats.maxKillStreak || 0) >= 10 },
  { id: 'trainCombo10', name: 'Dummy-meester', desc: 'Training combo ×10', icon: '🎯',
    test: s => (s.stats.trainMaxCombo || 0) >= 10 },
  { id: 'lv50', name: 'Legende', desc: 'Unlock level 50', icon: '👑',
    test: s => s.unlocked >= 50 },
  { id: 'daily7', name: 'Vastberaden', desc: '7 dagen dagbonus geclaimd', icon: '📅',
    test: s => (s.stats.dailyBonusCount || 0) >= 7 },
  { id: 'vs5', name: 'Duelist', desc: '5× 2-speler duel gespeeld', icon: '🥊',
    test: s => (s.stats.vsMatches || 0) >= 5 },
  { id: 'vs_roster', name: 'Vol roster', desc: 'Speel met 10+ verschillende vechters (2P)', icon: '🎭',
    test: s => (s.vsPlayedIds || []).length >= 10 },
  { id: 'saga_icons', name: 'Saga-legends', desc: 'Speel 2P met alle 7 legend picks', icon: '🌟',
    test: s => {
      const need = ['ryu', 'ken', 'goku', 'onepunchman', 'aruskankou', 'kutjankorio', 'xavi'];
      const played = s.vsPlayedIds || [];
      return need.every(id => played.includes(id));
    } },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function ensureDaily() {
  const dk = todayKey();
  if (!save.daily || save.daily.date !== dk || !Array.isArray(save.daily.tasks) || !save.daily.tasks.length) {
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
  for (const task of save.daily.tasks) {
    if (task.done) continue;
    const def = dailyDef(task.id);
    if (!def || def.type !== type) continue;
    if (type === 'comboReach' || type === 'wallBricks') {
      task.progress = Math.max(task.progress, amount);
    } else {
      task.progress += amount;
    }
    if (task.progress >= def.goal) { task.progress = def.goal; task.done = true; changed = true; UI.toast(t('toast.missionDone', { text: dailyText(def.id) }), 2800); }
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
    UI.toast(t('toast.claimXp', { xp: def.xp, text: dailyText(taskId) }), 2600);
  }
  if (!persistOrToast('missie-claim')) return 0;
  if (!opts.skipRefresh) {
    checkDailyAllBonus();
    UI.renderMissions();
    if (!opts.silent && !opts.skipFollowUp) {
      setTimeout(() => dailyClaimFollowUpToast(), 420);
    }
  }
  return def.xp;
}

function claimAllDailyReady() {
  ensureDaily();
  const ready = claimableDailyTasks();
  if (!ready.length) {
    UI.toast(t('toast.noMissionReady'), 2400);
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
    ? t('toast.claimBatch1', { total })
    : t('toast.claimBatchN', { n: ready.length, total }), 3200);
  setTimeout(() => dailyClaimFollowUpToast(), 450);
}

function claimDailyDayBonus() {
  ensureDaily();
  if (save.daily.dayBonusClaimed) {
    UI.toast(t('toast.dayBonusAlready'), 2800);
    return;
  }
  const left = save.daily.tasks.filter(t => !t.claimed).length;
  if (left > 0) {
    UI.toast(left === 1
      ? t('toast.dayBonusNeed1')
      : t('toast.dayBonusNeedN', { n: left }), 3000);
    return;
  }
  save.daily.dayBonusClaimed = true;
  save.stats.dailyBonusCount = (save.stats.dailyBonusCount || 0) + 1;
  grantMetaXP(80);
  AudioSys.sfx('win');
  if (!persistOrToast('dagbonus')) return;
  checkAchievements();
  UI.renderMissions();
  UI.renderMenu();
  UI.toast(t('toast.dayBonusDone'), 3400);
}

function grantMetaXP(n) {
  save.xp += n;
  while (save.xp >= xpNeed(save.lvl)) {
    save.xp -= xpNeed(save.lvl);
    save.lvl++;
    AudioSys.sfx('levelup');
  }
  persistOrToast('XP');
  UI.renderMenu();
}

function checkDailyAllBonus() {
  ensureDaily();
  if (save.daily.tasks.every(t => t.claimed) && !save.daily.dayBonusClaimed) {
    UI.toast(t('toast.allClaimedTapBonus'), 3500);
  }
}

function dailyUnclaimedXp() {
  ensureDaily();
  let xp = claimableDailyTasks().reduce((n, t) => n + (dailyDef(t.id)?.xp || 0), 0);
  if (save.daily.tasks.every(t => t.claimed) && !save.daily.dayBonusClaimed) xp += 80;
  return xp;
}

function dailyPotentialXp() {
  ensureDaily();
  return save.daily.tasks.reduce((n, t) => n + (dailyDef(t.id)?.xp || 0), 0) + 80;
}

function dailyFlowStep() {
  ensureDaily();
  if (save.daily.dayBonusClaimed) return 0;
  if (claimableDailyTasks().length > 0) return 2;
  if (save.daily.tasks.every(t => t.claimed)) return 3;
  return 1;
}

function dailyFlowBarHtml(step) {
  if (step === 0) {
    return `<div class="mission-flow-bar mission-flow-done">${t('missionsUi.flowDone')}</div>`;
  }
  const mk = (n, label, sub) => {
    const active = step === n ? ' active' : '';
    const done = step > n ? ' done' : '';
    return `<span class="mission-flow-pill${active}${done}"><b>${n}</b> ${label}<small>${sub}</small></span>`;
  };
  return `<div class="mission-flow-bar">${mk(1, t('missionsUi.flowPlay'), t('missionsUi.flowPlaySub'))}` +
    `<span class="mission-flow-arrow">→</span>${mk(2, t('missionsUi.flowClaim'), t('missionsUi.flowClaimSub'))}` +
    `<span class="mission-flow-arrow">→</span>${mk(3, t('missionsUi.flowBonus'), t('missionsUi.flowBonusSub'))}</div>`;
}

function dailyTaskRemainderText(task, def) {
  if (task.done || task.claimed) return '';
  const left = def.goal - task.progress;
  if (left <= 0) return '';
  if (def.type === 'kills') return left === 1 ? t('missionsUi.remainderKills1') : t('missionsUi.remainderKillsN', { n: left });
  if (def.type === 'wallBricks') return left === 1 ? t('missionsUi.remainderBricks1') : t('missionsUi.remainderBricksN', { n: left });
  if (def.type === 'comboReach') return t('missionsUi.remainderCombo', { n: left });
  if (def.type === 'pickups') return left === 1 ? t('missionsUi.remainderPickups1') : t('missionsUi.remainderPickupsN', { n: left });
  if (def.type === 'advWin' || def.type === 'trainWin' || def.type === 'bossKill') return t('missionsUi.remainderRun');
  return t('missionsUi.remainderGeneric', { n: left });
}

function dailyClaimFollowUpToast() {
  const left = claimableDailyTasks();
  if (left.length > 0) {
    const xp = left.reduce((n, t) => n + (dailyDef(t.id)?.xp || 0), 0);
    UI.toast(left.length === 1
      ? t('toast.followUp1', { xp })
      : t('toast.followUpN', { n: left.length, xp }), 2600);
    return;
  }
  if (save.daily.tasks.every(t => t.claimed) && !save.daily.dayBonusClaimed) {
    UI.toast(t('toast.followUpBonus'), 2800);
  }
}

function achievementProgressFrac(ach) {
  const s = save;
  switch (ach.id) {
    case 'first_win': return Math.min(s.stats.advWins || 0, 1);
    case 'lv10': return Math.min(s.lvl, 10) / 10;
    case 'dex10': return Math.min(Object.keys(s.dex || {}).length, 10) / 10;
    case 'dexFull': return Object.keys(s.dex || {}).length / SPECIES_ORDER.length;
    case 'dex100': {
      let n = 0;
      for (const v of Object.values(s.dex || {})) n += v || 0;
      return Math.min(n, 100) / 100;
    }
    case 'dexHalf': return Object.keys(s.dex || {}).length / Math.ceil(SPECIES_ORDER.length / 2);
    case 'dexTiers': return dexRarityTierCount() / 4;
    case 'dexMythic': {
      for (const id of Object.keys(s.dex || {})) {
        const sp = SPECIES[id];
        if (sp && sp.rarity === 'mythic') return 1;
      }
      return 0;
    }
    case 'train5': return Math.min(s.trainWins, 5) / 5;
    case 'wall100': return Math.min(s.bestWall, 100) / 100;
    case 'combo8': return Math.min(s.stats.maxCombo || 0, 8) / 8;
    case 'finisher10': return Math.min(s.stats.weaponFinishers || 0, 10) / 10;
    case 'finisher1': return Math.min(s.stats.weaponFinishers || 0, 1);
    case 'finisher50': return Math.min(s.stats.weaponFinishers || 0, 50) / 50;
    case 'weaponMaster25': {
      let best = 0;
      for (const m of Object.values(s.weaponMastery || {})) best = Math.max(best, m.finishers || 0);
      return Math.min(best, 25) / 25;
    }
    case 'streak10': return Math.min(s.stats.maxKillStreak || 0, 10) / 10;
    case 'trainCombo10': return Math.min(s.stats.trainMaxCombo || 0, 10) / 10;
    case 'lv50': return Math.min(s.unlocked, 50) / 50;
    case 'daily7': return Math.min(s.stats.dailyBonusCount || 0, 7) / 7;
    case 'vs5': return Math.min(s.stats.vsMatches || 0, 5) / 5;
    case 'vs_roster': return Math.min((s.vsPlayedIds || []).length, 10) / 10;
    case 'saga_icons': {
      const need = ['ryu', 'ken', 'goku', 'onepunchman', 'aruskankou', 'kutjankorio', 'xavi'];
      const played = s.vsPlayedIds || [];
      return need.filter(id => played.includes(id)).length / need.length;
    }
    default: return 0;
  }
}

function achievementProgressHint(ach) {
  const s = save;
  switch (ach.id) {
    case 'first_win': return `${Math.min(s.stats.advWins || 0, 1)}/1 level-win`;
    case 'lv10': return `Lv ${Math.min(s.lvl, 10)}/10`;
    case 'dex10': return `${Object.keys(s.dex || {}).length}/10 soorten`;
    case 'dexFull': return `${Object.keys(s.dex || {}).length}/${SPECIES_ORDER.length} soorten`;
    case 'dex100': {
      let n = 0;
      for (const v of Object.values(s.dex || {})) n += v || 0;
      return `${Math.min(n, 100)}/100 kills in boek`;
    }
    case 'dexHalf': return `${Object.keys(s.dex || {}).length}/${Math.ceil(SPECIES_ORDER.length / 2)} soorten`;
    case 'dexTiers': return `${dexRarityTierCount()}/4 rariteiten`;
    case 'train5': return `${Math.min(s.trainWins, 5)}/5 training-wins`;
    case 'wall100': return `${Math.min(s.bestWall, 100)}/100 muur-score`;
    case 'combo8': return `×${Math.min(s.stats.maxCombo || 0, 8)}/8 combo`;
    case 'finisher10': return `${Math.min(s.stats.weaponFinishers || 0, 10)}/10 finishers`;
    case 'finisher1': return `${Math.min(s.stats.weaponFinishers || 0, 1)}/1 finisher`;
    case 'finisher50': return `${Math.min(s.stats.weaponFinishers || 0, 50)}/50 finishers`;
    case 'weaponMaster25': {
      let best = 0;
      for (const m of Object.values(s.weaponMastery || {})) best = Math.max(best, m.finishers || 0);
      return `${Math.min(best, 25)}/25 op één wapen`;
    }
    case 'streak10': return `streak ×${Math.min(s.stats.maxKillStreak || 0, 10)}/10`;
    case 'trainCombo10': return `train ×${Math.min(s.stats.trainMaxCombo || 0, 10)}/10`;
    case 'lv50': return `Unlock Lv ${Math.min(s.unlocked, 50)}/50`;
    case 'daily7': return `${Math.min(s.stats.dailyBonusCount || 0, 7)}/7 dagbonussen`;
    case 'vs5': return `${Math.min(s.stats.vsMatches || 0, 5)}/5 duels`;
    case 'vs_roster': return `${(s.vsPlayedIds || []).length}/10 vechters gespeeld`;
    case 'saga_icons': {
      const need = ['ryu', 'ken', 'goku', 'onepunchman', 'aruskankou', 'kutjankorio', 'xavi'];
      const played = s.vsPlayedIds || [];
      const n = need.filter(id => played.includes(id)).length;
      return `${n}/7 legends in 2P`;
    }
    default: return '';
  }
}

function dailyStreakLine() {
  const n = save.stats.dailyBonusCount || 0;
  if (n <= 0) return '';
  return n >= 7 ? t('missionsUi.streakDone', { n }) : t('missionsUi.streakLine', { n });
}

function dailyStatusLine() {
  ensureDaily();
  const tasks = save.daily.tasks;
  const done = tasks.filter(t => t.done).length;
  const claimed = tasks.filter(t => t.claimed).length;
  const ready = tasks.filter(t => t.done && !t.claimed).length;
  const achN = Object.keys(save.achievements).length;
  const streak = dailyStreakLine();
  const streakBit = streak ? ` · ${streak}` : '';
  if (save.daily.dayBonusClaimed) {
    return t('missionsUi.statusDone', {
      streak: streakBit,
      ach: achN,
      total: ACHIEVEMENTS.length,
    });
  }
  const step = dailyFlowStep();
  const stepHint = step === 2 ? t('missionsUi.statusStep2')
    : (step === 3 ? t('missionsUi.statusStep3') : t('missionsUi.statusStep1'));
  const pendingXp = dailyUnclaimedXp();
  if (ready > 0) {
    return t('missionsUi.statusReady', {
      hint: stepHint, xp: pendingXp, done, streak: streakBit,
    });
  }
  if (claimed === 3) {
    return t('missionsUi.statusAllClaimed', {
      hint: stepHint, streak: streakBit, ach: achN, total: ACHIEVEMENTS.length,
    });
  }
  return t('missionsUi.statusDefault', {
    hint: stepHint, done, xp: dailyPotentialXp(), streak: streakBit,
  });
}

function unlockAchievement(id) {
  if (save.achievements[id]) return;
  save.achievements[id] = todayKey();
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  persist();
  AudioSys.sfx('newmonster');
  UI.toast(t('toast.achievementUnlock', { name: ach ? achLabel(ach, 'name') : id }), 4000);
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

function trackKillStreak(n) {
  if (n > (save.stats.maxKillStreak || 0)) {
    save.stats.maxKillStreak = n;
    persist();
    checkAchievements();
  }
}

function trackTrainCombo(n) {
  if (n > (save.stats.trainMaxCombo || 0)) {
    save.stats.trainMaxCombo = n;
    persist();
    checkAchievements();
  }
}

function saveSanitizeNotes(before, after) {
  const notes = [];
  if (!before || !after) return notes;
  const num = (v) => Math.floor(Number(v) || 0);
  if (num(before.lvl) !== after.lvl) notes.push(`Lv ${num(before.lvl)}→${after.lvl}`);
  if (num(before.unlocked) !== after.unlocked) notes.push(`unlock ${num(before.unlocked)}→${after.unlocked}`);
  if (before.weapon !== after.weapon) notes.push('wapen reset');
  if (before.style !== after.style) notes.push('stijl reset');
  const stripCount = Object.keys(before).filter(k => !(k in DEFAULT_SAVE) && k !== '_exportMeta').length;
  if (stripCount) notes.push(`${stripCount} onbekend veld verwijderd`);
  const badDex = Object.keys(before.dex || {}).filter(k => !SPECIES[k]).length;
  if (badDex) notes.push(`${badDex} ongeldige dex-entry`);
  const badSummon = Object.keys(before.summons || {}).filter(k => {
    const w = WEAPONS.find(x => x.id === k);
    const v = before.summons[k];
    return !w || (v !== 'epic' && v !== 'legendary');
  }).length;
  if (badSummon) notes.push(`${badSummon} ongeldige summon`);
  if (typeof PET_BY_ID !== 'undefined') {
    const badPet = Object.keys(before.pets || {}).filter(k => !PET_BY_ID[k]).length;
    if (badPet) notes.push(`${badPet} ongeldige pet`);
    if (before.activePet && before.activePet !== after.activePet) notes.push('actieve pet reset');
  }
  if (typeof EGG_BY_ID !== 'undefined') {
    const badEgg = Object.keys(before.eggPets || {}).filter(k => !EGG_BY_ID[k]).length;
    if (badEgg) notes.push(`${badEgg} ongeldig ei-pet`);
    if (before.activeEggPet && before.activeEggPet !== after.activeEggPet) notes.push('actief ei reset');
  }
  if (before.eggDaily && !after.eggDaily) notes.push('ei-dag reset');
  if (!Number.isFinite(Number(before.musicVol)) || !Number.isFinite(Number(before.sfxVol))) {
    notes.push('volume gecorrigeerd');
  }
  return notes;
}

function saveDriftDetail() {
  const diag = saveStorageDiagnostics();
  if (!diag.drift) return '';
  const p = readSaveJson(localStorage.getItem(SAVE_KEY));
  const b = readSaveJson(localStorage.getItem(SAVE_BACKUP_KEY));
  if (!p || !b) return '';
  const parts = [];
  if (p.lvl !== b.lvl) parts.push(`Lv ${p.lvl} vs backup ${b.lvl}`);
  if (p.unlocked !== b.unlocked) parts.push(`unlock ${p.unlocked} vs ${b.unlocked}`);
  const pd = Object.keys(p.dex || {}).length, bd = Object.keys(b.dex || {}).length;
  if (pd !== bd) parts.push(`boek ${pd} vs ${bd}`);
  if (typeof PET_BY_ID !== 'undefined') {
    const pp = petCountFromSave(p), bp = petCountFromSave(b);
    if (pp !== bp) parts.push(`pets ${pp} vs ${bp}`);
  }
  if (typeof EGG_BY_ID !== 'undefined') {
    const pe = eggCountFromSave(p), be = eggCountFromSave(b);
    if (pe !== be) parts.push(`ei ${pe} vs ${be}`);
  }
  if (p.style !== b.style) parts.push('stijl verschilt');
  return parts.join(' · ');
}

function saveExportSummaryLine(s) {
  const st = s || save;
  const summons = summonCountFromSave(st);
  const pets = petCountFromSave(st);
  const eggs = eggCountFromSave(st);
  let line = `Lv ${st.lvl} · unlock ${st.unlocked} · boek ${dexCountFromSave(st)} · kills ${dexTotalKillsFromSave(st)} · ${Object.keys(st.achievements || {}).length} prestaties`;
  if (summons) line += ` · ✦ ${summons} summon`;
  if (pets) line += ` · pet ${pets}`;
  if (eggs) line += ` · ei ${eggs}`;
  const pc = Math.max(0, Math.floor(Number(st.petCoins) || 0));
  if (pc) line += ` · ${pc} pet coins`;
  return line;
}

function updateSaveImportPreview(text) {
  const previewEl = document.getElementById('saveImportPreview');
  if (!previewEl) return;
  if (typeof text !== 'string' || !text.trim()) {
    previewEl.style.display = 'none';
    previewEl.textContent = '';
    previewEl.style.color = '#ffd75e';
    return;
  }
  try {
    const { save: next, meta, warnings } = previewImportSave(text);
    previewEl.style.display = 'block';
    previewEl.style.color = '#ffd75e';
    const metaLine = meta && meta.app ? ` · export v${meta.app}` : '';
    const warnLine = warnings && warnings.length ? '\n' + warnings.join(' · ') : '';
    previewEl.textContent =
      `Preview: ${saveExportSummaryLine(next)}${metaLine}.${warnLine} Import 2× om te laden.`;
  } catch (e) {
    previewEl.style.display = 'block';
    previewEl.style.color = '#ffb0b8';
    previewEl.textContent = (e && e.message) ? e.message : 'Ongeldige save-JSON';
  }
}

let savePortPreviewT = null;
function bindSavePortPreview() {
  const ta = document.getElementById('savePortText');
  if (!ta || ta.dataset.previewBound) return;
  ta.dataset.previewBound = '1';
  ta.addEventListener('input', () => {
    clearTimeout(savePortPreviewT);
    savePortPreviewT = setTimeout(() => updateSaveImportPreview(ta.value), 420);
  });
}

function formatSaveBytes(n) {
  const b = Math.max(0, Math.floor(Number(n) || 0));
  if (b < 1024) return b + ' B';
  return (b / 1024).toFixed(b < 10240 ? 1 : 0) + ' KB';
}

async function promptVersionUpdateBeforeReload() {
  if (state === 'play' || state === 'pause' || state === 'result') {
    try { recoverToMenu(); } catch (_) {
      game = null;
      state = 'menu';
    }
  }
  return new Promise((resolve) => {
    UI.showVersionUpdateBeforeReload({
      hasProgress: saveHasProgress(),
      summary: saveExportSummaryLine(),
      onBackup: () => {
        if (!stashSaveForVersionUpdate()) {
          UI.toast(t('versionUpdate.stashFail'), 3600);
          resolve(false);
          return;
        }
        UI.toast(t('versionUpdate.stashOk'), 2800);
        resolve(true);
      },
      onSkip: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}

async function runVersionUpdateWithSavePrompt() {
  AudioSys.init();
  AudioSys.sfx('select');
  const proceed = await promptVersionUpdateBeforeReload();
  if (!proceed) return;
  const go = () => {
    if (typeof window.forceFreshVersion === 'function') return window.forceFreshVersion();
    const u = new URL(location.href);
    u.searchParams.set('fresh', String(Date.now()));
    location.replace(u.toString());
    return Promise.resolve();
  };
  safeAsync(go(), 'forceFresh', t('versionUpdate.fail'));
}

function maybeOfferVersionUpdateSave() {
  if (!versionUpdateRestorePending()) return;
  const stash = peekVersionUpdateSave();
  if (!stash) {
    clearVersionUpdateSave();
    return;
  }
  setTimeout(() => {
    try {
      UI.showVersionUpdateRestore({
        stash,
        currentSummary: saveExportSummaryLine(),
        onUse: () => {
          if (applyVersionUpdateSave()) {
            AudioSys.sfx('win');
            UI.toast(t('versionUpdate.applied', {
              from: stash.fromApp || '?',
              to: APP_VERSION,
              summary: saveExportSummaryLine(),
            }), 4800);
          } else {
            UI.toast(t('versionUpdate.applyFail'), 3600);
          }
        },
        onSkip: () => {
          clearVersionUpdateSave();
          UI.toast(t('versionUpdate.keptCurrent'), 3200);
        },
      });
    } catch (err) {
      sfReportError('versionRestoreOffer', err);
    }
  }, 900);
}

function saveStorageDiagnostics() {
  let primaryRaw = null;
  let backupRaw = null;
  try { primaryRaw = localStorage.getItem(SAVE_KEY); } catch (_) {}
  try { backupRaw = localStorage.getItem(SAVE_BACKUP_KEY); } catch (_) {}
  const primaryBytes = primaryRaw ? primaryRaw.length : 0;
  const backupBytes = backupRaw ? backupRaw.length : 0;
  const primaryParsed = readSaveJson(primaryRaw);
  const backupParsed = readSaveJson(backupRaw);
  let stampAt = null;
  let stampBytes = null;
  try {
    const st = JSON.parse(localStorage.getItem(SAVE_STAMP_KEY) || 'null');
    if (st && typeof st === 'object') {
      stampAt = typeof st.at === 'string' ? st.at : null;
      stampBytes = Number(st.bytes) || null;
    }
  } catch (_) {}
  let drift = false;
  if (primaryParsed && backupParsed) {
    drift = (primaryParsed.lvl !== backupParsed.lvl)
      || (primaryParsed.unlocked !== backupParsed.unlocked);
  }
  const primaryCorrupt = !!(primaryRaw && primaryRaw.length > 0 && !primaryParsed);
  const backupCorrupt = !!(backupRaw && backupRaw.length > 0 && !backupParsed);
  return {
    primaryBytes,
    backupBytes,
    primaryValid: !!primaryParsed,
    backupValid: !!backupParsed,
    primaryCorrupt,
    backupCorrupt,
    drift,
    stampAt,
    stampBytes,
  };
}

function summonCountFromSave(s) {
  return Object.keys((s && s.summons) || {}).length;
}

function petCountFromSave(s) {
  if (!s || !s.pets || typeof PET_BY_ID === 'undefined') return 0;
  return Object.keys(s.pets).filter(k => PET_BY_ID[k]).length;
}

function eggCountFromSave(s) {
  if (!s || !s.eggPets || typeof EGG_BY_ID === 'undefined') return 0;
  return Object.keys(s.eggPets).filter(k => EGG_BY_ID[k]).length;
}

function saveAgeDays(stampAt) {
  if (!stampAt) return null;
  try {
    const d = new Date(stampAt);
    if (Number.isNaN(d.getTime())) return null;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  } catch (_) {
    return null;
  }
}

function exportSaveJson() {
  const clean = sanitizeSave(save);
  const payload = Object.assign({}, clean, {
    _exportMeta: {
      schema: SAVE_EXPORT_SCHEMA,
      app: APP_VERSION,
      exportedAt: new Date().toISOString(),
      key: SAVE_KEY,
      backupKey: SAVE_BACKUP_KEY,
      summary: {
        lvl: clean.lvl,
        unlocked: clean.unlocked,
        dex: dexCountFromSave(clean),
        kills: dexTotalKillsFromSave(clean),
        achievements: Object.keys(clean.achievements || {}).length,
        summons: summonCountFromSave(clean),
        pets: petCountFromSave(clean),
        eggs: eggCountFromSave(clean),
        style: clean.style || 'classic',
      },
      note: 'Stickman Fighter save — plak in Instellingen → Import (2× tikken). Wissel van URL? Export vóór en import ná.',
    },
  });
  return JSON.stringify(payload, null, 2);
}

function saveHealthSummary() {
  const diag = saveStorageDiagnostics();
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
    primaryBytes: diag.primaryBytes,
    backupBytes: diag.backupBytes,
    primaryValid: diag.primaryValid,
    backupValid: diag.backupValid,
    primaryCorrupt: diag.primaryCorrupt,
    backupCorrupt: diag.backupCorrupt,
    drift: diag.drift,
    driftDetail: saveDriftDetail(),
    stampAt: diag.stampAt,
    summons: summonCountFromSave(save),
    pets: petCountFromSave(save),
    eggs: eggCountFromSave(save),
    exportSchema: SAVE_EXPORT_SCHEMA,
    saveAgeDays: saveAgeDays(diag.stampAt),
  };
}

function importPreviewWarnings(next, meta) {
  const lines = [];
  if (meta && meta.key && meta.key !== SAVE_KEY) {
    lines.push(`Verkeerde save-key (“${meta.key}”) — verwacht ${SAVE_KEY}`);
  } else if (!meta || !meta.key) {
    lines.push(`Geen export-key — wordt gecontroleerd tegen ${SAVE_KEY}`);
  }
  const schema = meta && Number(meta.schema);
  if (!schema || schema < SAVE_EXPORT_SCHEMA) {
    lines.push(`Oudere export-schema${schema ? ' v' + schema : ''} — wordt gemigreerd naar v${SAVE_EXPORT_SCHEMA}`);
  }
  if (meta && meta.exportedAt) {
    try {
      const d = new Date(meta.exportedAt);
      if (!Number.isNaN(d.getTime())) {
        lines.push('Export: ' + d.toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }));
      }
    } catch (_) {}
  }
  if (meta && meta.app) lines.push('App-versie export: v' + meta.app);
  if (meta && meta.summary && typeof meta.summary === 'object') {
    const s = meta.summary;
    let sum = `Export-samenvatting: Lv ${s.lvl} · unlock ${s.unlocked} · boek ${s.dex} · ${s.achievements} prestaties`;
    if (s.summons) sum += ` · ✦ ${s.summons}`;
    if (s.pets) sum += ` · pet ${s.pets}`;
    if (s.eggs) sum += ` · ei ${s.eggs}`;
    if (s.style && s.style !== 'classic') sum += ` · stijl ${s.style}`;
    lines.push(sum);
  }
  const summonN = summonCountFromSave(next);
  const curSummonN = summonCountFromSave(save);
  if (summonN > curSummonN) lines.push(`+${summonN - curSummonN} summon-wapen(s) in import`);
  else if (summonN < curSummonN) lines.push(`Minder summons dan nu (${summonN} vs ${curSummonN})`);
  const petN = petCountFromSave(next);
  const curPetN = petCountFromSave(save);
  if (petN > curPetN) lines.push(`+${petN - curPetN} dex-pet(s) in import`);
  else if (petN < curPetN) lines.push(`Minder pets dan nu (${petN} vs ${curPetN})`);
  const eggN = eggCountFromSave(next);
  const curEggN = eggCountFromSave(save);
  if (eggN > curEggN) lines.push(`+${eggN - curEggN} ei-pet(s) in import`);
  else if (eggN < curEggN) lines.push(`Minder ei-pets dan nu (${eggN} vs ${curEggN})`);
  if (next.style !== save.style) {
    lines.push(`Stijl ${save.style || 'classic'} → ${next.style || 'classic'}`);
  }
  if (next.lvl < save.lvl || next.unlocked < save.unlocked) {
    lines.push('Lager niveau/unlock dan huidige save op dit apparaat');
  } else if (next.lvl > save.lvl || next.unlocked > save.unlocked) {
    lines.push('Hogere voortgang dan huidige save — goed voor overzet');
  }
  return lines;
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
  clean.summons = Object.assign({}, parsed.summons || {});
  clean.pets = Object.assign({}, parsed.pets || {});
  clean.eggPets = Object.assign({}, parsed.eggPets || {});
  if (parsed.eggDaily && typeof parsed.eggDaily === 'object') clean.eggDaily = Object.assign({}, parsed.eggDaily);
  if (typeof parsed.activePet === 'string') clean.activePet = parsed.activePet;
  if (typeof parsed.activeEggPet === 'string') clean.activeEggPet = parsed.activeEggPet;
  const final = sanitizeSave(clean);
  const warnings = importPreviewWarnings(final, meta);
  const rawMerged = Object.assign({}, DEFAULT_SAVE, parsed);
  rawMerged.stats = Object.assign({}, DEFAULT_SAVE.stats, parsed.stats || {});
  rawMerged.achievements = Object.assign({}, parsed.achievements || {});
  rawMerged.stars = Object.assign({}, parsed.stars || {});
  rawMerged.dex = Object.assign({}, parsed.dex || {});
  rawMerged.summons = Object.assign({}, parsed.summons || {});
  rawMerged.pets = Object.assign({}, parsed.pets || {});
  rawMerged.eggPets = Object.assign({}, parsed.eggPets || {});
  if (parsed.eggDaily && typeof parsed.eggDaily === 'object') rawMerged.eggDaily = Object.assign({}, parsed.eggDaily);
  if (typeof parsed.activePet === 'string') rawMerged.activePet = parsed.activePet;
  if (typeof parsed.activeEggPet === 'string') rawMerged.activeEggPet = parsed.activeEggPet;
  const repairNotes = saveSanitizeNotes(rawMerged, final);
  if (repairNotes.length) warnings.push('Reparatie: ' + repairNotes.slice(0, 3).join(' · '));
  return { save: final, meta, warnings };
}
function sfReportError(where, err, userMsg) {
  console.error('[Stickman]', where, err);
  const now = Date.now();
  if (!window.__sfErrToastT || now - window.__sfErrToastT > 4500) {
    window.__sfErrToastT = now;
    userToast(userMsg || 'Er ging iets mis — terug naar menu');
  }
}
function syncPlayLayer() {
  const el = document.getElementById('game');
  if (!el) return;
  const canvasHits = state === 'play' && !!game;
  el.style.pointerEvents = canvasHits ? 'auto' : 'none';
  el.style.visibility = canvasHits ? 'visible' : 'hidden';
  el.style.touchAction = canvasHits ? 'none' : 'manipulation';
  document.body.classList.toggle('is-playing', canvasHits);
  document.body.style.overflow = canvasHits ? 'hidden' : '';
  try { if (typeof updateNetStatus === 'function') updateNetStatus(); } catch (_) {}
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
    // Al in menu zonder game? Niet schermen wegslingeren (menu-loop fout
    // mag navigatie/scroll niet elke frame terugzetten naar hoofdmenu).
    if (state === 'menu' && !game) {
      window.__sfLoopErr = false;
      syncPlayLayer();
      ensureMenuScreenActive();
      return;
    }
    try { clearGameResultTimer(game); } catch (_) {}
    try { cancelGambleStart(); } catch (_) {}
    game = null;
    state = 'menu';
    window.__sfLoopErr = false;
    Input.dualMode = false;
    try { Input.releaseAll(); } catch (_) {}
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
    try { playMenuBgm(true); } catch (_) {}
  } catch (err) {
    console.error('[Stickman] recoverToMenu', err);
    state = 'menu';
    game = null;
    syncPlayLayer();
  }
}
function importSaveJson(text) {
  if (state === 'play' || state === 'pause') {
    try { recoverToMenu(); } catch (_) {
      game = null;
      state = 'menu';
      try { syncPlayLayer(); } catch (_) {}
    }
  }
  const { save: next, warnings } = previewImportSave(text);
  save = next;
  if (!persistOrToast('import')) throw new Error('Import gelukt maar opslaan mislukt — probeer opnieuw');
  checkAchievements();
  UI.renderMenu();
  if (UI.renderMissions) UI.renderMissions();
  if (UI.renderSettings) UI.renderSettings();
  const repair = (warnings || []).find(w => w.startsWith('Reparatie:'));
  userToast(repair
    ? `Save geïmporteerd · Lv ${save.lvl} · ${repair.replace('Reparatie: ', '')}`
    : `Save geïmporteerd · Lv ${save.lvl} · level ${save.unlocked}`, 3400);
}

function exportSaveFilename() {
  return `stickfighter-save-Lv${save.lvl}-unlock${save.unlocked}.json`;
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
  try {
    if (lp.mode === 'adventure') {
      gokGooiStartLevel(lp.level || 1);
    } else if (lp.mode === 'versus') {
      startGame('versus', { p1: lp.p1, p2: lp.p2 });
    } else {
      startGame(lp.mode);
    }
    return true;
  } catch (err) {
    sfReportError('resumeLastPlay', err, 'Verder spelen mislukt — kies een modus');
    return false;
  }
}

function startAdventureFromGamble(skipGamble) {
  try {
    const level = pendingAdvLevel || save.unlocked || 1;
    const gamble = skipGamble ? null : lastGambleRoll;
    pendingAdvLevel = null;
    startGame('adventure', { level, gamble });
  } catch (err) {
    sfReportError('gambleStart', err, 'Avontuur starten mislukt — kies level opnieuw');
  }
}

let gokStartBusy = false;
let gokScreenTimer = null;

function cancelGambleStart() {
  if (gokScreenTimer) {
    clearTimeout(gokScreenTimer);
    gokScreenTimer = null;
  }
  gokStartBusy = false;
}

function playGambleRollSfx(g) {
  try { AudioSys.sfx('diceRoll'); } catch (_) {}
  setTimeout(() => {
    try { AudioSys.sfx('gamble'); } catch (_) {}
  }, motionReduced() ? 40 : 120);
  if (!g) return;
  const delay = motionReduced() ? 60 : 220;
  setTimeout(() => {
    try {
      if (g.outcome === 'superAlly' || g.outcome === 'ally') AudioSys.sfx('gambleWin');
      else if (g.outcome === 'superBoss' || g.outcome === 'miniBoss') AudioSys.sfx('gambleBoss');
    } catch (_) {}
  }, delay);
}

/** Instant: level-tik → dobbel-flash → vecht (geen tussen-scherm). */
function gokGooiStartLevel(n) {
  if (gokStartBusy) return;
  cancelGambleStart();
  gokStartBusy = true;
  try {
    pendingAdvLevel = n;
    AudioSys.init();
    lastGambleRoll = rollStageGamble();
    playGambleRollSfx(lastGambleRoll);
    try {
      const line = typeof gambleRollToastLine === 'function' ? gambleRollToastLine(lastGambleRoll) : '';
      if (line) UI.toast(line, motionReduced() ? 900 : 1400);
    } catch (_) {}
    try { AudioSys.sting('modeAdventure'); } catch (_) {}
    const delay = motionReduced() ? 80 : 420;
    gokScreenTimer = setTimeout(() => {
      gokScreenTimer = null;
      gokStartBusy = false;
      startAdventureFromGamble(false);
    }, delay);
  } catch (err) {
    cancelGambleStart();
    sfReportError('gokStart', err, 'Gok start mislukt — probeer opnieuw');
  }
}

function gokGooiStartFromScreen() {
  if (gokStartBusy) return;
  cancelGambleStart();
  gokStartBusy = true;
  try {
    AudioSys.init();
    lastGambleRoll = rollStageGamble();
    playGambleRollSfx(lastGambleRoll);
    UI.renderGamble(pendingAdvLevel || save.unlocked || 1);
    const sumLine = document.getElementById('gambleSumLine');
    if (sumLine) sumLine.textContent = 'START!';
    try { AudioSys.sting('modeAdventure'); } catch (_) {}
    const delay = motionReduced() ? 50 : 140;
    gokScreenTimer = setTimeout(() => {
      gokScreenTimer = null;
      gokStartBusy = false;
      startAdventureFromGamble(false);
    }, delay);
  } catch (err) {
    cancelGambleStart();
    sfReportError('gokGooi', err, 'Gok start mislukt — probeer opnieuw');
  }
}

function vsWeaponRangeFactor(w) {
  if (!w) return 0.25;
  if (typeof isThrowWeapon === 'function' && isThrowWeapon(w.id)) return 1;
  if (w.id === 'boemerang') return 0.88;
  if (w.range >= 74) return 0.72;
  if (w.range >= 58) return 0.48;
  return 0.22;
}
function vsFighterStats(entry) {
  const w = weaponById(entry.weapon);
  const hp = Math.round(100 * entry.hpMul);
  const spd = Math.round(100 * entry.spdMul);
  const dmg = Math.round(100 * entry.dmgMul);
  const crit = entry.crit != null ? entry.crit : 0.08;
  const critMul = entry.critMul != null ? entry.critMul : 1.5;
  const critPct = Math.round(crit * 100);
  const str = Math.round(Math.min(100, dmg * (w.dmg || 1) * (0.72 + crit * critMul * 0.35)));
  const rng = Math.round(Math.min(100, ((w.range || 38) / 78) * 100));
  const meleeScale = (typeof isThrowWeapon === 'function' && isThrowWeapon(w.id)) ? 0.38
    : (w.id === 'boemerang' ? 0.52 : 1);
  const meleeDps = Math.round(Math.min(100, (dmg * (w.speed || 1) * spd) / 88 * meleeScale));
  const rangeDps = Math.round(Math.min(100, (dmg * (w.speed || 1) * rng) / 72 * vsWeaponRangeFactor(w) * (0.82 + crit * 0.9)));
  let special = 'Rasengan';
  if (entry.isRobot) special = 'Robot · Chidori';
  else if (entry.special === 'chidori') special = 'Chidori';
  else if (entry.special === 'rinnegan') special = 'Rinnegan';
  const sigKey = entry.sig || 'balanced';
  const sig = VS_SIG_LABELS[sigKey] || sigKey;
  return { hp, spd, dmg, str, rng, meleeDps, rangeDps, wpn: w.name, special, critPct, sig, sigKey };
}
function vsOverallRating(s) {
  return Math.round((s.str + s.rng + s.meleeDps + s.rangeDps + s.hp * 0.35 + s.spd * 0.25) / 4.6);
}
function vsPlayedBefore(id) {
  return Array.isArray(save.vsPlayedIds) && save.vsPlayedIds.includes(id);
}
function vsUnlockedCount() {
  return VS_ROSTER.filter(vsUnlocked).length;
}
function sortVsRoster(list, mode) {
  const arr = list.slice();
  const statSort = ['hp', 'spd', 'dmg', 'str', 'rng', 'meleeDps', 'rangeDps', 'tot'];
  if (statSort.includes(mode)) {
    arr.sort((a, b) => {
      const sa = vsFighterStats(a);
      const sb = vsFighterStats(b);
      const key = mode === 'tot' ? null : mode;
      const va = key ? sa[key] : vsOverallRating(sa);
      const vb = key ? sb[key] : vsOverallRating(sb);
      const d = vb - va;
      return d !== 0 ? d : a.name.localeCompare(b.name);
    });
  } else {
    arr.sort((a, b) => a.name.localeCompare(b.name));
  }
  return arr;
}
function vsStatBar(label, pct, color, deltaHtml) {
  const p = Math.min(100, Math.max(6, pct));
  return `<div class="vs-stat-col"><span class="vs-stat-l">${label}${deltaHtml || ''}</span>` +
    `<span class="vs-stat-track"><i style="width:${p}%;background:${color}"></i></span></div>`;
}
function vsStatDeltaTag(mine, theirs, invert) {
  const d = mine - theirs;
  if (Math.abs(d) < 3) return '';
  const better = invert ? d < 0 : d > 0;
  const sign = d > 0 ? '+' : '';
  return `<span class="vs-stat-delta${better ? ' up' : ' down'}">${sign}${d}</span>`;
}
function vsMatchupHint(s1, s2) {
  const hints = [];
  if (s1.spd >= s2.spd + 8) hints.push('P1 sneller');
  else if (s2.spd >= s1.spd + 8) hints.push('P2 sneller');
  if (s1.hp >= s2.hp + 8) hints.push('P1 tankier');
  else if (s2.hp >= s1.hp + 8) hints.push('P2 tankier');
  if (s1.dmg >= s2.dmg + 8) hints.push('P1 harder hits');
  else if (s2.dmg >= s1.dmg + 8) hints.push('P2 harder hits');
  if (s1.str >= s2.str + 8) hints.push('P1 sterker (STR)');
  else if (s2.str >= s1.str + 8) hints.push('P2 sterker (STR)');
  if (s1.rng >= s2.rng + 8) hints.push('P1 meer reach');
  else if (s2.rng >= s1.rng + 8) hints.push('P2 meer reach');
  if (s1.meleeDps >= s2.meleeDps + 8) hints.push('P1 melee DPS');
  else if (s2.meleeDps >= s1.meleeDps + 8) hints.push('P2 melee DPS');
  if (s1.rangeDps >= s2.rangeDps + 8) hints.push('P1 range DPS');
  else if (s2.rangeDps >= s1.rangeDps + 8) hints.push('P2 range DPS');
  if (s1.critPct >= s2.critPct + 3) hints.push('P1 meer crit');
  else if (s2.critPct >= s1.critPct + 3) hints.push('P2 meer crit');
  if (s1.sigKey !== s2.sigKey) hints.push(`${s1.sig.split(' ')[0]} vs ${s2.sig.split(' ')[0]}`);
  return hints.slice(0, 3).join(' · ');
}
function vsMatchupMeter(s1, s2) {
  const r1 = vsOverallRating(s1);
  const r2 = vsOverallRating(s2);
  const total = Math.max(1, r1 + r2);
  const p1pct = Math.round(r1 / total * 100);
  let label = 'Gelijk spel';
  if (p1pct >= 58) label = 'P1 licht favoriet';
  else if (p1pct <= 42) label = 'P2 licht favoriet';
  return `<div class="vs-matchup-meter" aria-hidden="true">` +
    `<span class="vs-meter-p1">P1 ${p1pct}%</span>` +
    `<span class="vs-meter-track"><i style="width:${p1pct}%"></i></span>` +
    `<span class="vs-meter-p2">P2 ${100 - p1pct}%</span></div>` +
    `<div class="vs-matchup-hint">${label} · TOT preview</div>`;
}
function charStatPreviewPair() {
  const e1 = vsRosterEntry(vsSelect.p1);
  const e2 = vsRosterEntry(vsSelect.p2);
  const hover = UI.charPreviewHoverId ? vsRosterEntry(UI.charPreviewHoverId) : null;
  if (hover && UI.charPickStep === 1) return [hover, e2, true, !vsUnlocked(hover)];
  if (hover && UI.charPickStep === 2) return [e1, hover, true, !vsUnlocked(hover)];
  return [e1, e2, false, false];
}
function vsStatPreviewHtml(e1, e2, previewing, lockedPreview) {
  const s1 = vsFighterStats(e1);
  const s2 = vsFighterStats(e2);
  const g1 = vsSagaMeta(e1.saga || 'scroll');
  const g2 = vsSagaMeta(e2.saga || 'scroll');
  const step = UI.charPickStep === 2 ? 'Stap 2 · kies P2' : 'Stap 1 · kies P1';
  const counts = vsSagaUnlockedCounts(UI.charSagaFilter || 'all');
  const next = charRosterNextUnlock();
  const prog = next
    ? ` · volgende unlock: <b>${next.name}</b> (${next.hint})`
    : ' · roster compleet!';
  const head = `<div class="vs-preview-head">${step} · ${counts.unlocked}/${counts.total} in filter · ${vsUnlockedCount()}/${VS_ROSTER.length} totaal${prog}</div>`;
  const col = (entry, s, theirs, accent, saga, flair, side, locked) => {
    const live = previewing && !locked && ((UI.charPickStep === 1 && side === 'left') || (UI.charPickStep === 2 && side === 'right'));
    const played = !locked && vsPlayedBefore(entry.id) ? '<span class="vs-played-chip">gespeeld</span>' : '';
    const lockNote = locked ? `<div class="vs-preview-lock">${SVG_LOCK_ICON} ${vsUnlockHint(entry)}</div>` : '';
    return `<div class="vs-preview-col${live ? ' preview-live' : ''}${locked ? ' preview-locked' : ''}" style="--accent:${accent}">` +
    `<div class="vs-preview-name">${entry.name}${played}${live ? ' <span class="vs-preview-tag">preview</span>' : ''}${locked ? ' <span class="vs-preview-tag locked">locked</span>' : ''}</div>` +
    lockNote +
    `<div class="vs-preview-wpn">${sagaIconSvg(saga.id)} ${saga.label} · ${s.wpn} · ${s.special}</div>` +
    `<div class="vs-preview-sig">${s.sig} · ${s.critPct}% crit</div>` +
    `<div class="vs-preview-flair">${flair}</div>` +
    `${vsStatBar('TOT', vsOverallRating(s), '#ffd75e')}` +
    `${vsStatBar('STR', s.str, '#ff9a42', locked ? '' : vsStatDeltaTag(s.str, theirs.str))}` +
    `${vsStatBar('RNG', s.rng, '#c792ff', locked ? '' : vsStatDeltaTag(s.rng, theirs.rng))}` +
    `${vsStatBar('mDPS', s.meleeDps, '#ff7a4d', locked ? '' : vsStatDeltaTag(s.meleeDps, theirs.meleeDps))}` +
    `${vsStatBar('rDPS', s.rangeDps, '#7cf5ff', locked ? '' : vsStatDeltaTag(s.rangeDps, theirs.rangeDps))}` +
    `${vsStatBar('HP', s.hp, '#6ee06e', locked ? '' : vsStatDeltaTag(s.hp, theirs.hp))}` +
    `${vsStatBar('SPD', s.spd, '#9db1e3', locked ? '' : vsStatDeltaTag(s.spd, theirs.spd))}</div>`;
  };
  const hint = lockedPreview ? 'Unlock om te kiezen — stats zijn preview' : vsMatchupHint(s1, s2);
  const meter = lockedPreview ? '' : vsMatchupMeter(s1, s2);
  return head + `<div class="vs-preview-duo">${col(e1, s1, s2, '#7cf5ff', g1, rosterFlair(e1), 'left', lockedPreview && UI.charPickStep === 1)}` +
    `<div class="vs-preview-vs">VS</div>${col(e2, s2, s1, '#ffb0b8', g2, rosterFlair(e2), 'right', lockedPreview && UI.charPickStep === 2)}</div>` +
    meter +
    (hint ? `<div class="vs-matchup-hint">${hint}</div>` : '') +
    (previewing && !lockedPreview ? '<div class="vs-matchup-hint" style="opacity:.75">Tik kaart om te kiezen · stats zijn relatief, geen dmg-tweak</div>' : '');
}
function updateCharStatPreview() {
  const statEl = document.getElementById('charStatPreview');
  if (!statEl) return;
  const [a, b, previewing, lockedPreview] = charStatPreviewPair();
  statEl.innerHTML = vsStatPreviewHtml(a, b, previewing, lockedPreview);
}

function copyPlayLink() {
  safeAsync((async () => {
    const url = await resolveSharePlayUrl();
    try {
      await navigator.clipboard.writeText(url);
      UI.toast('GitHub Pages-link gekopieerd — deel speel.html (niet de tunnel)', 3600);
    } catch (_) {
      UI.toast(url, 4500);
    }
  })(), 'copyLink', 'Link kopiëren mislukt — zie Instellingen → Deel link');
}

function sharePlayLink() {
  safeAsync((async () => {
    const url = await resolveSharePlayUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Stickman Fighter',
          text: 'Gratis stickman vechtspel — open de link, tik SPELEN (Android + iPad + PC)',
          url,
        });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      UI.toast('Pages-link gekopieerd — stuur naar vrienden (Chrome op Android)', 3600);
    } catch (_) {
      UI.toast(url, 4500);
    }
  })(), 'shareLink', 'Delen mislukt — kopieer link via Instellingen');
}

function isTunnelHostUrl(u) {
  return /\.loca\.lt\b|trycloudflare\.com\b/i.test(String(u || ''));
}

function onTunnelHost() {
  return isTunnelHostUrl(location.hostname) || /\.loca\.lt$/i.test(location.hostname);
}

function playHostKind() {
  if (location.protocol === 'file:') return 'file';
  const h = location.hostname;
  if (/\.github\.io$/i.test(h)) return 'pages';
  if (/\.netlify\.app$/i.test(h)) return 'netlify';
  if (onTunnelHost()) return 'tunnel';
  if (/^localhost$|^127\./.test(h)) return 'local';
  return 'other';
}

/** Append ?v=SW rev on speel.html share links so friends skip stale PWA cache. */
function withShareRevParam(url, rev) {
  if (!url || typeof url !== 'string') return url;
  const base = url.split('#')[0].split('?')[0];
  if (!/\/speel\.html$/i.test(base)) return url;
  const v = rev != null ? rev : (typeof SW_CACHE_REV !== 'undefined' ? SW_CACHE_REV : 0);
  if (!v) return url;
  return base + '?v=' + v;
}

/** Canonical share/play URL — always GitHub Pages when configured; never a tunnel. */
function canonicalPagesPlayUrl(hosting) {
  const j = hosting || {};
  const candidates = [
    j.bookmarkShare,
    j.pagesSpeel,
    j.primary && String(j.primary).includes('github.io')
      ? String(j.primary).replace(/\/?$/, '/') + 'speel.html'
      : '',
    j.githubPages ? String(j.githubPages).replace(/\/?$/, '/') + 'speel.html' : '',
    j.stable && String(j.stable).includes('github.io')
      ? String(j.stable).replace(/\/?$/, '/') + 'speel.html'
      : '',
  ];
  for (const c of candidates) {
    if (c && !isTunnelHostUrl(c)) return c;
  }
  return '';
}

function firstNonTunnelHttps(liveTxt) {
  return (liveTxt || '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => /^https:\/\//i.test(l) && !isTunnelHostUrl(l)) || '';
}

function resolveBundleLiveUrl(hosting, liveTxt) {
  const pages = canonicalPagesPlayUrl(hosting);
  if (pages) return pages;
  const fromTxt = firstNonTunnelHttps(liveTxt);
  if (fromTxt) return fromTxt;
  return pages;
}

async function loadHostingBundle() {
  const [hosting, liveTxt] = await Promise.all([
    fetch('./hosting.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
    fetch('./LIVE-LINK.txt?t=' + Date.now(), { cache: 'no-store' }).then(r => r.text()).catch(() => ''),
  ]);
  const liveUrl = resolveBundleLiveUrl(hosting, liveTxt);
  return { hosting, liveUrl, liveTxt };
}

/** Stable URL for menu/settings — Pages only (tunnel never “the” play link). */
function pickStablePlayUrl(hosting) {
  const pages = canonicalPagesPlayUrl(hosting);
  if (pages) return pages;
  const j = hosting || {};
  const fallback = j.bookmarkPages || j.stable || '';
  return isTunnelHostUrl(fallback) ? '' : fallback;
}

function githubPagesRootUrl() {
  if (!location.hostname.endsWith('.github.io')) return '';
  const seg = location.pathname.split('/').filter(Boolean)[0];
  return seg ? `${location.origin}/${seg}/` : `${location.origin}/`;
}

async function resolveSharePlayUrl() {
  const { hosting, liveUrl } = await loadHostingBundle();
  const rev = (hosting && hosting.shareCacheRev) || SW_CACHE_REV;
  let url = '';
  if (hosting && hosting.shareOnlyPages) {
    const pagesOnly = canonicalPagesPlayUrl(hosting);
    url = pagesOnly || 'https://brennyz.github.io/stickman-fighter/speel.html';
  } else {
    const pages = canonicalPagesPlayUrl(hosting);
    if (pages) url = pages;
    else {
      const gh = githubPagesRootUrl();
      if (gh) url = gh + 'speel.html';
      else if (location.hostname.endsWith('.github.io')) {
        const base = location.href.split('?')[0].split('#')[0];
        url = base.replace(/\/(ipad|index|speel)\.html$/i, '/') + 'speel.html';
      } else if (liveUrl && !isTunnelHostUrl(liveUrl)) {
        url = liveUrl.replace(/\/ipad\.html$/i, '/speel.html').replace(/\/$/, '/speel.html');
      } else if (location.protocol !== 'file:' && !onTunnelHost()) {
        const href = location.href.split('?')[0].split('#')[0];
        url = href.replace(/\/ipad\.html$/i, '/').replace(/\/index\.html$/i, '/');
      } else {
        url = 'https://brennyz.github.io/stickman-fighter/speel.html';
      }
    }
  }
  return withShareRevParam(url, rev);
}

function headLiveFromPage() {
  if (location.protocol === 'file:') return '';
  return location.origin + location.pathname.replace(/\/[^/]*$/, '/');
}

function ensureTipsSeen() {
  if (!save.tipsSeen || typeof save.tipsSeen !== 'object') save.tipsSeen = {};
}

function modeOnboardingSeen(mode) {
  ensureTipsSeen();
  return !!(save.tipsSeen['onboard_' + mode] || save.tipsSeen['mode_' + mode]);
}

const ONBOARD_MODES = [
  { id: 'adventure', label: 'Avontuur' },
  { id: 'training', label: 'Training' },
  { id: 'wall', label: 'Muur' },
  { id: 'versus', label: '2 spelers' },
  { id: 'coinrun', label: 'Mats' },
];

function onboardingProgress() {
  const seen = ONBOARD_MODES.filter(m => modeOnboardingSeen(m.id)).length;
  return { seen, total: ONBOARD_MODES.length };
}

function nextUntriedMode() {
  return ONBOARD_MODES.find(m => !modeOnboardingSeen(m.id)) || null;
}

/** Eén result-tip per modus+uitkomst — geen herhaling, geen toast. */
function onceResultTip(mode, kind, tip) {
  if (!tip) return '';
  ensureTipsSeen();
  const key = 'result_' + mode + '_' + kind;
  if (save.tipsSeen[key]) return '';
  save.tipsSeen[key] = 1;
  persist();
  return tip;
}

function applyIslandOnboarding() {
  ensureTipsSeen();
  if (save.tipsSeen.islands) return;
  save.tipsSeen.islands = 1;
  persist();
}

/** Eén regel op level-scherm — geen toast (eilanden-uitleg). */
function adventureIslandHintLine() {
  ensureTipsSeen();
  if (!save.tipsSeen.islands || save.tipsSeen.islandsHint) return '';
  save.tipsSeen.islandsHint = 1;
  persist();
  return 'Eerste keer avontuur: 5×10 levels · skill gate per eiland · Meester-buff na 5× verlies op één level';
}

/** Eén hint per modus: in-gevecht regel, geen extra toast (geen stapel met welcome). */
function applyModeOnboarding(mode, g) {
  if (!g || !mode) return;
  ensureTipsSeen();
  const key = 'onboard_' + mode;
  if (save.tipsSeen[key]) return;
  save.tipsSeen[key] = 1;
  save.tipsSeen['mode_' + mode] = 1;
  save.tipsSeen['hint_' + mode] = 1;
  if (mode === 'adventure' || mode === 'training') save.tipsSeen.chakra = 1;
  if (mode === 'coinrun') save.tipsSeen.hint_coinrun = 1;
  persist();
  const touch = IS_TOUCH;
  const lines = {
    adventure: touch
      ? 'Eerste minuut: links lopen · rechts slaan · joy ↑ mik op vliegers · vol chakra = SUPER'
      : 'Eerste minuut: A/D · J/K/L · mik omhoog op vliegers · chakra vol → U',
    training: touch
      ? 'Eerste minuut: ontwijk rode laser · blokkeer dichtbij · chakra vol → SUPER'
      : 'Eerste minuut: ontwijk lasers · Shift = substitutie · chakra vol → U',
    wall: touch
      ? '60s · combo ×3/×5/×8 hints · record-tempo + projectie in HUD'
      : '60s · combo-milestones · voor/achter record-tempo · 5s countdown',
    versus: touch
      ? 'Eerste minuut: P1 links · P2 rechts · liggend iPad werkt het best'
      : 'Eerste minuut: P1 WASD+JKL · P2 pijltjes+1-5 · best-of-3',
    coinrun: touch
      ? '45s munten · joy ↑ mik · roze vlieger = +3 · max 3 shuriken snel'
      : 'Munten pakken · joy ↑ = hoger mikken · max 3 shuriken snel',
  };
  g.modeHintLine = lines[mode] || lines.adventure;
  g.hint = 8;
}

function maybeWelcomeToast() {
  ensureTipsSeen();
  if (save.tipsSeen.welcome) return;
  const prog = onboardingProgress();
  if (prog.seen > 0 || save.lvl > 1) {
    save.tipsSeen.welcome = 1;
    persist();
    return;
  }
  save.tipsSeen.welcome = 1;
  persist();
  setTimeout(() => {
    if (state === 'play') return;
    userToast(t('toast.welcome'), 3800);
  }, 2800);
}

/** Level-pacing v1.14.3: iets rustiger — +15% vroeg, oplopend tot +50% vanaf ~Lv 18. */
const xpNeed = (lvl) => {
  const base = 60 + (lvl - 1) * 40;
  const pace = 1.15 + Math.min(0.35, (lvl - 1) * 0.02);
  return Math.round(base * pace / 5) * 5;
};
const dexCount = () => Object.keys(save.dex).length;
function dexCountFromSave(s) {
  return Object.keys((s && s.dex) || {}).length;
}
function dexRarityTierCount() {
  return dexRarityTierCountFromSave(save);
}
function dexRarityTierCountFromSave(s) {
  const tiers = new Set();
  for (const id of Object.keys((s && s.dex) || {})) {
    const sp = SPECIES[id];
    if (sp && sp.rarity) tiers.add(sp.rarity);
  }
  return tiers.size;
}
function dexRarityBreakdown() {
  const counts = {};
  for (const id of Object.keys(RARITIES)) counts[id] = 0;
  for (const id of Object.keys(save.dex || {})) {
    const sp = SPECIES[id];
    if (sp && counts[sp.rarity] != null) counts[sp.rarity]++;
  }
  return counts;
}
function dexRarityTotals() {
  const counts = {};
  for (const id of Object.keys(RARITIES)) counts[id] = 0;
  for (const id of SPECIES_ORDER) {
    const sp = SPECIES[id];
    if (sp && counts[sp.rarity] != null) counts[sp.rarity]++;
  }
  return counts;
}
const DEX_ACH_IDS = ['dex10', 'dexHalf', 'dexTiers', 'dex100', 'dexMythic', 'dexFull'];
function dexNextAchievementHtml() {
  let best = null, bestFrac = -1;
  for (const id of DEX_ACH_IDS) {
    if (save.achievements[id]) continue;
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) continue;
    const frac = achievementProgressFrac(ach);
    if (frac >= 1) continue;
    if (frac > bestFrac) { bestFrac = frac; best = ach; }
  }
  if (!best) return '';
  const pct = Math.min(100, Math.round(bestFrac * 100));
  const hint = achievementProgressHint(best);
  return `<div class="dex-ach-next" style="margin-top:10px;padding:8px 10px;border-radius:12px;background:rgba(255,215,94,.06);border:1px solid rgba(255,215,94,.2)">` +
    `<div style="font-size:11px;font-weight:800;color:#ffd75e;margin-bottom:4px">Volgende prestatie · ${best.name}</div>` +
    `<div style="font-size:12px;opacity:.85">${best.desc}${hint ? ' · ' + hint : ''}</div>` +
    `<div class="xpline" style="margin-top:6px;height:6px"><div style="width:${pct}%"></div></div></div>`;
}
function dexSortedIds(rarityFilter, typeFilter, sortKey) {
  let ids = SPECIES_ORDER.filter(id => {
    const sp = SPECIES[id];
    if (rarityFilter !== 'all' && sp.rarity !== rarityFilter) return false;
    if (typeFilter !== 'all' && sp.type !== typeFilter) return false;
    return true;
  });
  if (sortKey === 'rarity') {
    ids.sort((a, b) => {
      const ra = rarityOf(SPECIES[a].rarity).order;
      const rb = rarityOf(SPECIES[b].rarity).order;
      if (ra !== rb) return rb - ra;
      return SPECIES_ORDER.indexOf(a) - SPECIES_ORDER.indexOf(b);
    });
  } else if (sortKey === 'unlock') {
    ids.sort((a, b) => (UNLOCK_AT[a] || 999) - (UNLOCK_AT[b] || 999));
  } else if (sortKey === 'kills') {
    ids.sort((a, b) => {
      const ka = save.dex[a] || 0, kb = save.dex[b] || 0;
      if (ka && kb) return kb - ka;
      if (ka) return -1;
      if (kb) return 1;
      return (UNLOCK_AT[a] || 999) - (UNLOCK_AT[b] || 999);
    });
  }
  return ids;
}
function dexTopKillId() {
  let topId = null, topN = 0;
  for (const id of Object.keys(save.dex || {})) {
    const n = save.dex[id] || 0;
    if (n > topN) { topN = n; topId = id; }
  }
  return topN >= 3 ? topId : null;
}
function weaponUnlockedCount() {
  let n = 0;
  for (const w of WEAPONS) if (weaponUnlockedByLevel(w)) n++;
  return n;
}
function weaponAdventureUsableCount() {
  let n = 0;
  for (const w of WEAPONS) if (weaponUsableNow(w)) n++;
  return n;
}
function weaponRarityBreakdown() {
  const counts = {};
  for (const id of Object.keys(RARITIES)) counts[id] = 0;
  for (const w of WEAPONS) {
    if (weaponUnlockedByLevel(w) && counts[w.rarity] != null) counts[w.rarity]++;
  }
  return counts;
}
function dexCosmeticProgressLines() {
  const out = [];
  const half = Math.ceil(SPECIES_ORDER.length / 2);
  const checks = [
    { styleId: 'crystal', cur: dexRarityTierCount(), goal: 4, label: 'rariteiten', name: 'Kristallijn' },
    { styleId: 'tome', cur: dexCount(), goal: half, label: 'soorten', name: 'Boekmeester' },
    { styleId: 'hunter', cur: dexTotalKills(), goal: 75, label: 'kills', name: 'Jagerlook' },
  ];
  for (const c of checks) {
    const st = STYLES.find(s => s.id === c.styleId);
    if (!st || styleUnlocked(st)) continue;
    out.push(c);
  }
  return out;
}
const dexTotalKills = () => {
  let n = 0;
  for (const id of Object.keys(save.dex)) n += save.dex[id] || 0;
  return n;
};
function dexTotalKillsFromSave(s) {
  let n = 0;
  for (const id of Object.keys((s && s.dex) || {})) n += s.dex[id] || 0;
  return n;
}
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
  if (save.style === 'tome') bonus += dexCount();
  return bonus;
}
function playerStats(opts) {
  opts = opts || {};
  const mul = opts.masterBuff ? 1.2 : 1;
  return {
    maxhp: Math.round((100 + (save.lvl - 1) * 12 + dexHpBonus()) * mul),
    dmg: Math.round((10 + (save.lvl - 1) * 2 + Math.floor(rarityOf(playerWeapon().rarity).order * 0.5)) * mul),
    speedMul: mul,
  };
}

/* --- src/data/rarities.js --- */
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

/* --- src/data/weapons.js --- */
/* ============================== WAPENS ================================= */
const WEAPONS = [
  { id: 'vuist',     name: 'Vuisten',         dmg: 1.0,  range: 38, speed: 1.0,  unlock: 1,  rarity: 'common',    desc: 'Taijutsu basics' },
  { id: 'kunai',     name: 'Kunai',           dmg: 1.35, range: 52, speed: 1.15, unlock: 2,  rarity: 'common',    desc: 'Klassieke ninja-mes' },
  { id: 'shuriken',  name: 'Shuriken',        dmg: 1.25, range: 64, speed: 1.35, unlock: 3,  rarity: 'common',    desc: 'Gooit scherpe sterren' },
  { id: 'tanto',     name: 'Tanto',           dmg: 1.22, range: 44, speed: 1.28, unlock: 4,  rarity: 'common',    desc: 'Korte blade · snel' },
  { id: 'zwaard',    name: 'Ninja-zwaard',    dmg: 1.55, range: 58, speed: 0.95, unlock: 5,  rarity: 'uncommon',  desc: 'Kenjutsu alleskunner' },
  { id: 'sai',       name: 'Sai',             dmg: 1.42, range: 46, speed: 1.22, unlock: 6,  rarity: 'uncommon',  desc: 'Driepuntig · pareren' },
  { id: 'knuppel',   name: 'Knuppel',         dmg: 1.8,  range: 50, speed: 0.72, unlock: 7,  rarity: 'uncommon',  desc: 'Rauwe slagkracht' },
  { id: 'waaier',    name: 'Strijdwaaier',    dmg: 1.48, range: 56, speed: 1.12, unlock: 9,  rarity: 'uncommon',  desc: 'Waaier-snede · stijlvol' },
  { id: 'speer',     name: 'Speer',           dmg: 1.6,  range: 78, speed: 0.8,  unlock: 10, rarity: 'uncommon',  desc: 'Enorm bereik' },
  { id: 'tonfa',     name: 'Tonfa',           dmg: 1.52, range: 50, speed: 1.28, unlock: 12, rarity: 'rare',      desc: 'Zijhandvat · flurry' },
  { id: 'nunchaku',  name: 'Nunchaku',        dmg: 1.3,  range: 48, speed: 1.4,  unlock: 13, rarity: 'rare',      desc: 'Bliksemsnel' },
  { id: 'kama',      name: 'Kama',            dmg: 1.68, range: 54, speed: 1.14, unlock: 15, rarity: 'rare',      desc: 'Sikkel · haak-slagen' },
  { id: 'boemerang', name: 'Boemerang',       dmg: 1.7,  range: 70, speed: 1.05, unlock: 16, rarity: 'rare',      desc: 'Komt terug' },
  { id: 'zeis',      name: 'Schaduwzeis',     dmg: 1.95, range: 74, speed: 0.82, unlock: 18, rarity: 'rare',      desc: 'Lange boog · duister' },
  { id: 'hamer',     name: 'Mokerhamer',      dmg: 2.6,  range: 52, speed: 0.55, unlock: 20, rarity: 'epic',      desc: 'Sloopt alles' },
  { id: 'drietand',  name: 'Drietand',        dmg: 2.05, range: 76, speed: 0.88, unlock: 22, rarity: 'epic',      desc: 'Drie punten · prikken' },
  { id: 'ketting',   name: 'Kettingzwaard',   dmg: 2.1,  range: 68, speed: 0.95, unlock: 24, rarity: 'epic',      desc: 'Bereik + druk' },
  { id: 'bostaf',    name: 'Bo-staf',         dmg: 1.9,  range: 72, speed: 1.08, unlock: 26, rarity: 'epic',      desc: 'Lange staf · tempo' },
  { id: 'laser',     name: 'Chakra-kling',    dmg: 2.3,  range: 62, speed: 1.15, unlock: 28, rarity: 'legendary', desc: 'Blauw brandende kling' },
  { id: 'fuuma',     name: 'Fūma-shuriken',   dmg: 1.95, range: 72, speed: 1.18, unlock: 30, rarity: 'legendary', desc: 'Grote werpster' },
  { id: 'kristal',   name: 'Kristalkling',    dmg: 2.45, range: 60, speed: 1.05, unlock: 32, rarity: 'legendary', desc: 'Scherven-snede' },
  { id: 'donder',    name: 'Bliksem-bijl',    dmg: 2.8,  range: 58, speed: 0.7,  unlock: 34, rarity: 'legendary', desc: 'Als Chidori, maar een bijl' },
  { id: 'vlamzweep', name: 'Vlamzweep',       dmg: 2.55, range: 78, speed: 1.0,  unlock: 36, rarity: 'legendary', desc: 'Vuurlijn · lang bereik' },
  { id: 'void',      name: 'Voidklaauw',      dmg: 2.5,  range: 64, speed: 1.25, unlock: 40, rarity: 'mythic',    desc: 'Mythische klauw' },
  { id: 'sterkling', name: 'Sterkling',       dmg: 2.75, range: 66, speed: 1.12, unlock: 44, rarity: 'mythic',    desc: 'Hemelmetaal · krits' },
  { id: 'guvve',     name: 'Guvvedukkie-stok', dmg: 3.1,  range: 66, speed: 1.0,  unlock: 48, rarity: 'mythic',    desc: 'Quak. Bitte. Boom.' },
];
const weaponById = id => WEAPONS.find(w => w.id === id) || WEAPONS[0];

/* --- src/data/styles.js --- */
/* ============================== STIJLEN ================================ */
const STYLES = [
  { id: 'classic', name: 'Klassiek', body: '#f2f5ff', accent: '#3db8ff', bandana: null,
    needLvl: 1, hint: 'Standaard ninja',
    tooltip: 'Basis ninja — geen bonus, wel de snelste unlock.',
    bonus: 'Geen combat-bonus' },
  { id: 'konoha', name: 'Konoha bandana', body: '#f2f5ff', accent: '#43b25b', bandana: '#2d6b36', plate: '#dfe8ff',
    needLvl: 5, hint: 'Unlock op Lv 5',
    tooltip: 'Leaf-dorp headband. Iets meer max HP — standvastig in lange levels.',
    bonus: '+5 max HP', mods: { maxHp: 5 } },
  { id: 'chakra', name: 'Chakra gloed', body: '#e8f4ff', accent: '#7cf5ff', bandana: '#3db8ff', glow: true,
    needTrain: 3, hint: 'Win 3× training',
    tooltip: 'Blauwe chakra-aura. Chakra laadt sneller — vaker Rasengan/Chidori.',
    bonus: '+8% chakra-regen', mods: { energyMul: 1.08 } },
  { id: 'akatsuki', name: 'Rode mantel', body: '#1a1424', accent: '#e04f4f', bandana: '#e04f4f', coat: true,
    needLvl: 12, hint: 'Unlock op Lv 12',
    tooltip: 'Rode mantel — agressieve slagen. Meer schade op melee en wapens.',
    bonus: '+4% schade', mods: { dmgMul: 1.04 } },
  { id: 'shadow', name: 'Schaduw-ninja', body: '#8fa3d9', accent: '#b06ae0', bandana: '#2a1840',
    needLvl: 15, hint: 'Unlock op Lv 15',
    tooltip: 'Schaduw-stappen. Extra crit-kans op alle hits.',
    bonus: '+3% crit', mods: { critBonus: 0.03 } },
  { id: 'guvve', name: 'Guvvedukkie', body: '#43b25b', accent: '#ffe259', bandana: '#2a8a38', duck: true,
    needDex: 8, hint: '8 monsters in boek',
    tooltip: 'Quack-cosplay. Bonus XP bij avontuur-kills — licht, geen grind.',
    bonus: '+6% avontuur-XP', mods: { xpMul: 1.06 } },
  { id: 'gold', name: 'Legendarisch', body: '#ffd75e', accent: '#c97a20', bandana: '#ffb830', glow: true,
    needLvl: 25, hint: 'Unlock op Lv 25',
    tooltip: 'Gouden outline + gloed. Sterkere knockback op kicks en specials.',
    bonus: '+10% knockback', mods: { kbMul: 1.1 } },
  { id: 'sand', name: 'Woestijn', body: '#e8c98a', accent: '#c97a20', bandana: '#8a6030',
    needLvl: 8, hint: 'Unlock op Lv 8',
    tooltip: 'Zandmantel — minder schade bij hits én sterker blok. Tank-stijl voor omringing.',
    bonus: '−14% schade · blok −25% chip', mods: { defMul: 0.86, blockMul: 0.75 } },
  { id: 'samurai', name: 'Samurai', body: '#2a2a35', accent: '#e04f4f', bandana: '#1a1a22', topknot: true,
    needLvl: 20, hint: 'Unlock op Lv 20',
    tooltip: 'Topknot + katana-houding. Wapen-combo’s raken iets verder.',
    bonus: '+8% wapen-reach', mods: { weaponRange: 1.08 } },
  { id: 'cyber', name: 'Cyber-ninja', body: '#1a2040', accent: '#7cf5ff', bandana: '#4ecf6a', visor: true, lightning: true,
    needLvl: 18, hint: 'Unlock op Lv 18',
    tooltip: 'Neon-visier + bliksem-flits bij melee. Snellere chakra en visuele chain-sparks.',
    bonus: 'Lightning FX · +6% chakra', mods: { energyMul: 1.06, lightning: true, dmgMul: 1.02 } },
  { id: 'fox', name: 'Vossen-ninja', body: '#ff8c42', accent: '#ffe259', bandana: '#d05a1e', fox: true,
    needDex: 12, hint: '12 monsters in boek',
    tooltip: 'Vossenoren — sneller op de grond. Ideaal voor kiting en shuriken.',
    bonus: '+5% loopsnelheid', mods: { speedMul: 1.05 } },
  { id: 'storm', name: 'Stormgeest', body: '#dfe8ff', accent: '#6fd7ff', bandana: '#2a7fc0', glow: true, lightning: true,
    needTrain: 5, hint: 'Win 5× training',
    tooltip: 'Storm-aura + zachte bliksem. Extra shield bij start van elke golf.',
    bonus: 'Lightning gloed · +0.8s shield/golf', mods: { shieldWave: 0.8, lightning: true } },
  { id: 'void', name: 'Void-waker', body: '#2a1840', accent: '#ff6b9d', bandana: '#5a1040', coat: true,
    needLvl: 40, hint: 'Unlock op Lv 40',
    tooltip: 'Void-mantel — zwaardere jutsu. Specials (Rasengan/Chidori/Rinnegan) raken harder.',
    bonus: '+8% jutsu-schade', mods: { jutsuMul: 1.08 } },
  { id: 'hunter', name: 'Jagerlook', body: '#6b5344', accent: '#5ad06a', bandana: '#3d5c32', hunter: true,
    needDexKills: 75, hint: '75 kills in monsterboek',
    tooltip: 'Jager-cape + groene accenten. Bonus schade vs monsters in avontuur.',
    bonus: '+6% vs monsters', mods: { advDmgMul: 1.06 } },
  { id: 'crystal', name: 'Kristallijn', body: '#e8f7ff', accent: '#6fd7ff', bandana: '#2f7fc0', glow: true, crystal: true,
    needDexTiers: 4, hint: '4 rariteiten in monsterboek',
    tooltip: 'Kristallen shard — reflecterende gloed. Korte shield elke golf.',
    bonus: '+1.0s shield/golf', mods: { shieldWave: 1.0 } },
  { id: 'tome', name: 'Boekmeester', body: '#f5efe6', accent: '#c98850', bandana: '#6b5344', tome: true,
    needDexHalf: true, hint: 'Helft van het monsterboek',
    tooltip: 'Monsterboek op je rug. Meer HP-bonus bij nieuwe dex-ontdekkingen (visueel + klein HP-top-up).',
    bonus: '+4 max HP · boek-wijsheid', mods: { maxHp: 4, dexHpBonus: 1 } },
];
const styleById = id => STYLES.find(s => s.id === id) || STYLES[0];

function styleMods(st) {
  return (st && st.mods) ? st.mods : {};
}

function styleCombatLine(st) {
  return st.bonus || st.hint || '';
}

function styleUnlocked(st) {
  if (st.id === 'classic') return true;
  if (styleSkillGated(st)) return false;
  if (st.needLvl && save.lvl >= st.needLvl) return true;
  if (st.needTrain && save.trainWins >= st.needTrain) return true;
  if (st.needDex && dexCount() >= st.needDex) return true;
  if (st.needDexKills && dexTotalKills() >= st.needDexKills) return true;
  if (st.needDexTiers && dexRarityTierCount() >= st.needDexTiers) return true;
  if (st.needDexHalf && typeof SPECIES_ORDER !== 'undefined' &&
      dexCount() >= Math.ceil(SPECIES_ORDER.length / 2)) return true;
  return false;
}

function applyStyleBonusesToPlayer(game, player) {
  if (!player) return;
  const st = styleById(save.style || 'classic');
  const m = styleMods(st);
  const up = styleUpgradeBonuses(st.id);
  const sc = up.modScale;
  game.styleDefMul = scaleStyleModValue('defMul', m.defMul || 1, sc) || 1;
  game.styleDmgMul = scaleStyleModValue('dmgMul', m.dmgMul || 1, sc) || 1;
  game.styleAdvDmgMul = scaleStyleModValue('advDmgMul', m.advDmgMul || 1, sc) || 1;
  game.styleEnergyMul = scaleStyleModValue('energyMul', m.energyMul || 1, sc) || 1;
  game.styleCritBonus = scaleStyleModValue('critBonus', m.critBonus || 0, sc) || 0;
  game.styleKbMul = scaleStyleModValue('kbMul', m.kbMul || 1, sc) || 1;
  game.styleJutsuMul = scaleStyleModValue('jutsuMul', m.jutsuMul || 1, sc) || 1;
  game.styleShieldWave = (m.shieldWave || 0) + up.shieldAdd;
  game.styleBlockMul = scaleStyleModValue('blockMul', m.blockMul || 1, sc) || 1;
  game.styleXpMul = scaleStyleModValue('xpMul', m.xpMul || 1, sc) || 1;
  game.styleLightning = !!(st.lightning || m.lightning);
  if (m.maxHp) {
    const hp = m.maxHp + up.maxHpAdd;
    player.maxhp += hp;
    player.hp += hp;
  } else if (up.maxHpAdd > 0) {
    player.maxhp += up.maxHpAdd;
    player.hp += up.maxHpAdd;
  }
  const speedMul = scaleStyleModValue('speedMul', m.speedMul || 1, sc) || 1;
  if (speedMul !== 1) {
    player.speed = Math.round(player.speed * speedMul);
  }
  const weaponRange = scaleStyleModValue('weaponRange', m.weaponRange || 1, sc) || 1;
  if (weaponRange !== 1) {
    game.styleWeaponRange = weaponRange;
  } else {
    game.styleWeaponRange = 1;
  }
}

function applyPlayerStyle(fighter) {
  const st = styleById(save.style || 'classic');
  if (!styleUnlocked(st)) { save.style = 'classic'; persist(); }
  fighter.color = styleById(save.style).body;
  fighter.style = styleById(save.style);
  fighter.lineW = st.id === 'gold' ? 5 : 4.5;
}

function applyStyleToSpec(fighter, spec) {
  if (!spec || !fighter || !fighter.isPlayer) return spec;
  const m = styleMods(fighter.style);
  if (m.dmgMul && m.dmgMul !== 1) spec.dmg = Math.round(spec.dmg * m.dmgMul);
  if (m.kbMul && m.kbMul !== 1) spec.kb = (spec.kb || 0) * m.kbMul;
  if (m.weaponRange && spec.kind === 'weapon') {
    spec.range = (spec.range || 40) * m.weaponRange;
    spec.r = (spec.r || 24) * Math.sqrt(m.weaponRange);
  }
  if (m.jutsuMul && spec.kind === 'special') spec.dmg = Math.round(spec.dmg * m.jutsuMul);
  return spec;
}
/* --- src/data/pets.js --- */
/* ============================== DEX PETS ================================ */
/** Getemde mini-monsters — unlock via monsterboek-kills (deel 2 pets). */

const PET_KILL_NEED = { common: 12, uncommon: 18, rare: 28, epic: 40, legendary: 55, mythic: 75 };
const PET_COIN_COST = { common: 18, uncommon: 28, rare: 45, epic: 65, legendary: 90, mythic: 120 };

/** Mats munten → pet coins: elke 2 gouden munten = 1 pet coin aan einde ronde. */
function matsPetCoinsFromRun(matsCoins) {
  return Math.max(0, Math.floor((matsCoins || 0) / 2));
}

function petCoinCost(petId) {
  const def = petDef(petId);
  if (!def) return 999;
  const sp = SPECIES[def.speciesId];
  return PET_COIN_COST[sp.rarity] || 30;
}

function petCoinsBalance() {
  return Math.max(0, Math.floor(Number(save.petCoins) || 0));
}

function canBuyPetWithCoins(petId) {
  if (isPetTamed(petId)) return false;
  return petCoinsBalance() >= petCoinCost(petId);
}

/** 12 launch-pets — 1 per type/thema, gekoppeld aan dex-species */
const PET_ROSTER = [
  { id: 'pet_slymo', speciesId: 'slymo', passive: 'dmg', passiveVal: 0.03, assistMul: 0.3, cd: 4.6,
    perk: 'Spring-assist — extra schade' },
  { id: 'pet_bubbel', speciesId: 'bubbel', passive: 'hp', passiveVal: 6, assistMul: 0.26, cd: 5.2,
    perk: '+6 max HP · zachte assist' },
  { id: 'pet_flapper', speciesId: 'flapper', passive: 'energy', passiveVal: 1.08, assistMul: 0.28, cd: 4.2,
    perk: 'Snellere chakra-regen' },
  { id: 'pet_stekelra', speciesId: 'stekelra', passive: 'dmg', passiveVal: 0.035, assistMul: 0.34, cd: 4.8,
    perk: 'Charge-assist — stevige tik' },
  { id: 'pet_spooki', speciesId: 'spooki', passive: 'crit', passiveVal: 0.04, assistMul: 0.29, cd: 4.9,
    perk: '+4% crit-kans' },
  { id: 'pet_blikkert', speciesId: 'blikkert', passive: 'shield', passiveVal: 1.2, assistMul: 0.27, cd: 5.4,
    perk: 'Korte shield elke golf' },
  { id: 'pet_vlamvos', speciesId: 'vlamvos', passive: 'speed', passiveVal: 1.04, assistMul: 0.33, cd: 4.4,
    perk: '+4% loopsnelheid' },
  { id: 'pet_piepvleugel', speciesId: 'piepvleugel', passive: 'energy', passiveVal: 1.1, assistMul: 0.3, cd: 4.0,
    perk: 'Vlugge chakra + dart-assist' },
  { id: 'pet_rotsbonk', speciesId: 'rotsbonk', passive: 'hp', passiveVal: 12, assistMul: 0.36, cd: 5.6,
    perk: '+12 max HP · tank-assist' },
  { id: 'pet_nachtwolk', speciesId: 'nachtwolk', passive: 'crit', passiveVal: 0.05, assistMul: 0.31, cd: 5.0,
    perk: 'Spook-crit + energy drain' },
  { id: 'pet_gloeidrake', speciesId: 'gloeidrake', passive: 'dmg', passiveVal: 0.045, assistMul: 0.38, cd: 5.2,
    perk: 'Draken-assist — zwaarste tik' },
  { id: 'pet_stormvos', speciesId: 'stormvos', passive: 'speed', passiveVal: 1.06, assistMul: 0.35, cd: 4.5,
    perk: 'Storm-snelheid + combo-assist' },
];

const PET_BY_ID = Object.fromEntries(PET_ROSTER.map(p => [p.id, p]));
const PET_BY_SPECIES = Object.fromEntries(PET_ROSTER.map(p => [p.speciesId, p]));

function petDef(id) { return PET_BY_ID[id] || null; }

function petKillNeed(speciesOrPetId) {
  const def = PET_BY_ID[speciesOrPetId] || PET_BY_SPECIES[speciesOrPetId];
  const sp = def ? SPECIES[def.speciesId] : SPECIES[speciesOrPetId];
  if (!sp) return 999;
  return PET_KILL_NEED[sp.rarity] || 20;
}

function isPetTamed(petId) {
  return !!(save.pets && save.pets[petId]);
}

function petTamedCount() {
  return Object.keys(save.pets || {}).filter(k => PET_BY_ID[k]).length;
}

function activePetDef() {
  const id = save.activePet;
  if (!id || !isPetTamed(id)) return null;
  return petDef(id);
}

function canTamePetForSpecies(speciesId) {
  const def = PET_BY_SPECIES[speciesId];
  if (!def || isPetTamed(def.id)) return false;
  return (save.dex[speciesId] || 0) >= petKillNeed(speciesId);
}

function maybeTamePet(speciesId) {
  const def = PET_BY_SPECIES[speciesId];
  if (!def || isPetTamed(def.id)) return false;
  const kills = save.dex[speciesId] || 0;
  const need = petKillNeed(speciesId);
  if (kills < need) return false;
  if (!save.pets || typeof save.pets !== 'object') save.pets = {};
  save.pets[def.id] = { at: Date.now(), kills };
  if (!save.activePet) save.activePet = def.id;
  persist();
  const sp = SPECIES[speciesId];
  try { AudioSys.sfx('summon'); } catch (_) {}
  return { def, sp, need, kills };
}

function petPassiveBonus() {
  const def = activePetDef();
  if (!def) {
    return { dmgMul: 1, energyMul: 1, critBonus: 0, maxHp: 0, speedMul: 1, shieldWave: 0 };
  }
  const sp = SPECIES[def.speciesId];
  const kills = save.dex[def.speciesId] || 0;
  const tier = Math.min(3, Math.floor(kills / 25));
  const tierMul = 1 + tier * 0.012;
  const up = petUpgradeBonuses(def.id);
  const out = { dmgMul: 1, energyMul: 1, critBonus: 0, maxHp: 0, speedMul: 1, shieldWave: 0 };
  switch (def.passive) {
    case 'dmg': out.dmgMul = 1 + def.passiveVal * tierMul * up.passiveMul; break;
    case 'hp': out.maxHp = Math.round(def.passiveVal * tierMul * up.passiveMul); break;
    case 'energy': out.energyMul = 1 + (def.passiveVal - 1) * tierMul * up.passiveMul; break;
    case 'crit': out.critBonus = def.passiveVal * tierMul * up.passiveMul; break;
    case 'speed': out.speedMul = 1 + (def.passiveVal - 1) * tierMul * up.passiveMul; break;
    case 'shield': out.shieldWave = def.passiveVal * tierMul * up.passiveMul; break;
  }
  if (sp) out.label = sp.name;
  return out;
}

function buyPetWithCoins(petId) {
  if (isPetTamed(petId)) return null;
  const def = petDef(petId);
  if (!def) return null;
  const cost = petCoinCost(petId);
  if (petCoinsBalance() < cost) return null;
  save.petCoins = petCoinsBalance() - cost;
  if (!save.pets || typeof save.pets !== 'object') save.pets = {};
  save.pets[petId] = { at: Date.now(), coins: cost };
  if (!save.activePet) save.activePet = petId;
  save.stats.petsTamed = (save.stats.petsTamed || 0) + 1;
  persist();
  try { AudioSys.sfx('summon'); } catch (_) {}
  return { def, cost, sp: SPECIES[def.speciesId] };
}

function equipPet(petId) {
  if (!petId) { save.activePet = null; persist(); return true; }
  if (!isPetTamed(petId)) return false;
  save.activePet = petId;
  persist();
  return true;
}

function petProgressLine(speciesId) {
  const def = PET_BY_SPECIES[speciesId];
  if (!def) return '';
  if (isPetTamed(def.id)) return save.activePet === def.id ? 'Pet · actief' : 'Pet · getemd';
  const cost = petCoinCost(def.id);
  if (canBuyPetWithCoins(def.id)) return `Pet · kopen ${cost} 🪙`;
  const need = petKillNeed(speciesId);
  const cur = save.dex[speciesId] || 0;
  const coinHint = petCoinsBalance() > 0 ? ` · ${petCoinsBalance()}/${cost} 🪙` : '';
  if (cur <= 0) return `Pet · ${need} kills${coinHint}`;
  return `Pet · ${Math.min(cur, need)}/${need} kills${coinHint}`;
}
/* --- src/data/upgrades.js --- */
/* ========================== ITEM UPGRADE ENGINE ========================= */
/** Shared upgrade tracks: weapons, pets, styles (skills stay in skills.js).
 *  Standard max Lv3 · mythic / extreme items max Lv5. */
const UPGRADE_MAX_STANDARD = 3;
const UPGRADE_MAX_EXTREME = 5;
const UPGRADE_PHASE_MAX = UPGRADE_MAX_STANDARD;
const ITEM_UPGRADE_CATS = ['weapon', 'pet', 'style'];
const ITEM_SHARD_CAP = 9999;
const ITEM_SHARD_ADD_CAP = 8;

const ITEM_SHARD_COSTS = [2, 4, 7, 12, 20];

function upgradeShardsSpentForLevel(lv, costs) {
  const n = clamp(Math.floor(lv) || 0, 0, costs.length + 2);
  let spent = 0;
  for (let i = 0; i < n; i++) spent += costs[i] || costs[costs.length - 1];
  return spent;
}

function upgradeMaxLevelFromBanked(banked, costs, hardMax) {
  let lv = 0;
  let budget = clamp(Math.floor(banked) || 0, 0, ITEM_SHARD_CAP);
  while (lv < hardMax) {
    const cost = costs[lv] || costs[costs.length - 1];
    if (budget < cost) break;
    budget -= cost;
    lv++;
  }
  return lv;
}

function upgradeMaxForRarity(rarity) {
  const order = rarityOf(rarity).order;
  return order >= 5 ? UPGRADE_MAX_EXTREME : UPGRADE_MAX_STANDARD;
}

function itemUpgradeIdValid(cat, id) {
  if (!ITEM_UPGRADE_CATS.includes(cat) || !id || typeof id !== 'string') return false;
  if (cat === 'weapon') return WEAPONS.some((w) => w.id === id);
  if (cat === 'pet') return !!petDef(id);
  if (cat === 'style') return STYLES.some((s) => s.id === id);
  return false;
}

function weaponUpgradeEligible(w) {
  return w && w.id && w.id !== 'vuist' && w.id !== 'master_sword' && save.lvl >= w.unlock && !isThrowWeapon(w.id);
}

function petUpgradeEligible(p) {
  return p && isPetTamed(p.id);
}

function styleUpgradeEligible(st) {
  return st && styleUnlocked(st);
}

function itemUpgradeEligible(cat, id) {
  if (!itemUpgradeIdValid(cat, id)) return false;
  if (cat === 'weapon') return weaponUpgradeEligible(WEAPONS.find((w) => w.id === id));
  if (cat === 'pet') return petUpgradeEligible(petDef(id));
  if (cat === 'style') return styleUpgradeEligible(styleById(id));
  return false;
}

function itemUpgradeEntry(cat, id) {
  if (!itemUpgradeIdValid(cat, id)) return null;
  if (!save.itemUpgrades || typeof save.itemUpgrades !== 'object') save.itemUpgrades = {};
  if (!save.itemUpgrades[cat] || typeof save.itemUpgrades[cat] !== 'object') save.itemUpgrades[cat] = {};
  if (!save.itemUpgrades[cat][id]) save.itemUpgrades[cat][id] = { level: 0, shards: 0 };
  return save.itemUpgrades[cat][id];
}

function itemUpgradeMax(cat, id) {
  if (!itemUpgradeIdValid(cat, id)) return UPGRADE_MAX_STANDARD;
  if (cat === 'weapon') {
    const w = WEAPONS.find((x) => x.id === id);
    if (!w) return UPGRADE_MAX_STANDARD;
    return upgradeMaxForRarity(w.rarity);
  }
  if (cat === 'pet') {
    const p = petDef(id);
    if (!p) return UPGRADE_MAX_STANDARD;
    const sp = SPECIES[p.speciesId];
    return upgradeMaxForRarity(sp ? sp.rarity : 'common');
  }
  if (cat === 'style') {
    const st = styleById(id);
    if (st.id === 'void' || (st.needLvl && st.needLvl >= 40)) return UPGRADE_MAX_EXTREME;
    if (st.needDexTiers || st.needDexHalf || st.needDexKills) return UPGRADE_MAX_EXTREME;
    return UPGRADE_MAX_STANDARD;
  }
  return UPGRADE_MAX_STANDARD;
}

function itemUpgradeLevel(cat, id) {
  if (!itemUpgradeIdValid(cat, id)) return 0;
  const e = itemUpgradeEntry(cat, id);
  if (!e) return 0;
  return clamp(Math.floor(Number(e.level) || 0), 0, itemUpgradeMax(cat, id));
}

function itemUpgradeShards(cat, id) {
  if (!itemUpgradeIdValid(cat, id)) return 0;
  const e = itemUpgradeEntry(cat, id);
  if (!e) return 0;
  return clamp(Math.floor(Number(e.shards) || 0), 0, ITEM_SHARD_CAP);
}

function itemUpgradeCost(cat, id) {
  if (!itemUpgradeIdValid(cat, id)) return null;
  const lv = itemUpgradeLevel(cat, id);
  const max = itemUpgradeMax(cat, id);
  if (lv >= max) return null;
  return ITEM_SHARD_COSTS[lv] || ITEM_SHARD_COSTS[ITEM_SHARD_COSTS.length - 1];
}

function itemCanUpgrade(cat, id) {
  if (!itemUpgradeEligible(cat, id)) return false;
  const cost = itemUpgradeCost(cat, id);
  if (cost == null) return false;
  return itemUpgradeShards(cat, id) >= cost;
}

function sanitizeItemUpgradeEntry(cat, id, raw) {
  if (!itemUpgradeIdValid(cat, id) || !itemUpgradeEligible(cat, id)) return null;
  const max = itemUpgradeMax(cat, id);
  const entry = (raw && typeof raw === 'object') ? raw : {};
  let lv = clamp(Math.floor(Number(entry.level) || 0), 0, max);
  let shards = clamp(Math.floor(Number(entry.shards) || 0), 0, ITEM_SHARD_CAP);
  const spent = upgradeShardsSpentForLevel(lv, ITEM_SHARD_COSTS);
  const total = shards + spent;
  const maxFromBanked = upgradeMaxLevelFromBanked(total, ITEM_SHARD_COSTS, max);
  if (lv > maxFromBanked) lv = maxFromBanked;
  const spent2 = upgradeShardsSpentForLevel(lv, ITEM_SHARD_COSTS);
  shards = clamp(total - spent2, 0, ITEM_SHARD_CAP);
  if (lv <= 0 && shards <= 0) return null;
  return { level: lv, shards };
}

function normalizeItemUpgrades() {
  const clean = { weapon: {}, pet: {}, style: {} };
  const raw = (save.itemUpgrades && typeof save.itemUpgrades === 'object') ? save.itemUpgrades : {};
  for (const cat of ITEM_UPGRADE_CATS) {
    const bag = (raw[cat] && typeof raw[cat] === 'object') ? raw[cat] : {};
    for (const [id, entry] of Object.entries(bag)) {
      const fixed = sanitizeItemUpgradeEntry(cat, id, entry);
      if (fixed) clean[cat][id] = fixed;
    }
  }
  save.itemUpgrades = clean;
}

function addItemShards(cat, id, n) {
  if (!itemUpgradeEligible(cat, id)) return 0;
  const add = clamp(Math.floor(Number(n) || 0), 1, ITEM_SHARD_ADD_CAP);
  const e = itemUpgradeEntry(cat, id);
  if (!e) return 0;
  e.shards = clamp(itemUpgradeShards(cat, id) + add, 0, ITEM_SHARD_CAP);
  save.stats = save.stats || {};
  save.stats.itemShards = clamp((save.stats.itemShards || 0) + add, 0, 9999999);
  persist();
  return add;
}

function tryItemUpgrade(cat, id) {
  if (!itemUpgradeEligible(cat, id) || !itemCanUpgrade(cat, id)) return false;
  const cost = itemUpgradeCost(cat, id);
  const e = itemUpgradeEntry(cat, id);
  if (!e || cost == null || itemUpgradeShards(cat, id) < cost) return false;
  const next = itemUpgradeLevel(cat, id) + 1;
  if (next > itemUpgradeMax(cat, id)) return false;
  e.shards = clamp(itemUpgradeShards(cat, id) - cost, 0, ITEM_SHARD_CAP);
  e.level = next;
  persist();
  return true;
}

/* ---- Weapon upgrade steps (procedural per rarity) ---- */
function weaponUpgradeStep(w, i) {
  const mythic = rarityOf(w.rarity).order >= 5;
  if (i === 0) return { dmgMul: 1.07, speedMul: 1.03 };
  if (i === 1) return { dmgMul: 1.06, range: 4 };
  if (i === 2) return { dmgMul: 1.08, speedMul: 1.05, range: 2 };
  if (i === 3 && mythic) return { dmgMul: 1.1, critBonus: 0.02 };
  if (i === 4 && mythic) return { dmgMul: 1.12, range: 6, speedMul: 1.06 };
  return { dmgMul: 1.05 };
}

function weaponUpgradeBonuses(weaponId) {
  const w = WEAPONS.find((x) => x.id === weaponId);
  if (!w || !weaponUpgradeEligible(w)) {
    return { dmgMul: 1, range: 0, speedMul: 1, critBonus: 0 };
  }
  const lv = itemUpgradeLevel('weapon', weaponId);
  const b = { dmgMul: 1, range: 0, speedMul: 1, critBonus: 0 };
  for (let i = 0; i < lv; i++) {
    const s = weaponUpgradeStep(w, i);
    if (s.dmgMul) b.dmgMul *= s.dmgMul;
    if (s.range) b.range += s.range;
    if (s.speedMul) b.speedMul *= s.speedMul;
    if (s.critBonus) b.critBonus += s.critBonus;
  }
  b.dmgMul = clamp(b.dmgMul, 1, 2.2);
  b.speedMul = clamp(b.speedMul, 1, 1.35);
  b.range = clamp(b.range, 0, 24);
  b.critBonus = clamp(b.critBonus, 0, 0.08);
  return b;
}

function applyWeaponUpgrades(w) {
  if (!w || !w.id || !weaponUpgradeEligible(w)) return w;
  const b = weaponUpgradeBonuses(w.id);
  const lv = itemUpgradeLevel('weapon', w.id);
  if (lv <= 0) return w;
  return Object.assign({}, w, {
    dmg: Math.round(w.dmg * b.dmgMul * 100) / 100,
    range: w.range + b.range,
    speed: Math.round(w.speed * b.speedMul * 100) / 100,
    upgradeLevel: lv,
    upgradeCrit: b.critBonus,
  });
}

function weaponUpgradeSummary(id) {
  const lv = itemUpgradeLevel('weapon', id);
  const b = weaponUpgradeBonuses(id);
  const parts = [];
  if (b.dmgMul > 1.001) parts.push(`DMG ×${b.dmgMul.toFixed(2)}`);
  if (b.range > 0) parts.push(`+${b.range} reach`);
  if (b.speedMul > 1.001) parts.push(`spd ×${b.speedMul.toFixed(2)}`);
  if (b.critBonus > 0) parts.push(`+${Math.round(b.critBonus * 100)}% crit`);
  if (lv >= itemUpgradeMax('weapon', id)) parts.push('MAX');
  return parts.length ? parts.join(' · ') : (lv ? `Lv ${lv}` : '—');
}

function weaponUpgradePreview(id) {
  const w = WEAPONS.find((x) => x.id === id);
  if (!w || !weaponUpgradeEligible(w)) return '';
  const lv = itemUpgradeLevel('weapon', id);
  if (lv >= itemUpgradeMax('weapon', id)) return '';
  const s = weaponUpgradeStep(w, lv);
  const parts = [];
  if (s.dmgMul) parts.push(`DMG +${Math.round((s.dmgMul - 1) * 100)}%`);
  if (s.range) parts.push(`+${s.range} reach`);
  if (s.speedMul) parts.push(`spd +${Math.round((s.speedMul - 1) * 100)}%`);
  if (s.critBonus) parts.push(`+${Math.round(s.critBonus * 100)}% crit`);
  return parts.join(' · ');
}

/* ---- Pet upgrades ---- */
function petUpgradeBonuses(petId) {
  const p = petDef(petId);
  if (!p || !petUpgradeEligible(p)) {
    return { passiveMul: 1, assistMul: 1, cdMul: 1 };
  }
  const lv = itemUpgradeLevel('pet', petId);
  return {
    passiveMul: clamp(1 + lv * 0.1, 1, 1.5),
    assistMul: clamp(1 + lv * 0.08, 1, 1.45),
    cdMul: clamp(Math.pow(0.93, lv), 0.65, 1),
  };
}

function petUpgradeSummary(id) {
  const lv = itemUpgradeLevel('pet', id);
  const b = petUpgradeBonuses(id);
  const parts = [];
  if (b.passiveMul > 1.001) parts.push(`passief ×${b.passiveMul.toFixed(2)}`);
  if (b.assistMul > 1.001) parts.push(`assist ×${b.assistMul.toFixed(2)}`);
  if (b.cdMul < 0.999) parts.push(`CD ×${b.cdMul.toFixed(2)}`);
  if (lv >= itemUpgradeMax('pet', id)) parts.push('MAX');
  return parts.length ? parts.join(' · ') : (lv ? `Lv ${lv}` : '—');
}

function petUpgradePreview(id) {
  const lv = itemUpgradeLevel('pet', id);
  if (lv >= itemUpgradeMax('pet', id)) return '';
  return `passief +10% · assist +8% · CD −7%`;
}

/* ---- Style upgrades ---- */
function styleUpgradeBonuses(styleId) {
  const st = styleById(styleId);
  if (!st || !styleUpgradeEligible(st)) {
    return { modScale: 1, maxHpAdd: 0, shieldAdd: 0 };
  }
  const lv = itemUpgradeLevel('style', styleId);
  return {
    modScale: clamp(1 + lv * 0.1, 1, 1.5),
    maxHpAdd: clamp(lv * 2, 0, 10),
    shieldAdd: clamp(lv * 0.2, 0, 1),
  };
}

function scaleStyleModValue(key, val, scale) {
  if (val == null || val === 1 || val === 0) return val;
  if (key === 'maxHp') return val;
  if (key === 'shieldWave') return val;
  if (key === 'critBonus') return val * scale;
  if (key === 'dexHpBonus') return val;
  if (typeof val === 'number' && val > 1) return 1 + (val - 1) * scale;
  if (typeof val === 'number' && val < 1) return 1 - (1 - val) * scale;
  return val;
}

function styleUpgradeSummary(id) {
  const lv = itemUpgradeLevel('style', id);
  const b = styleUpgradeBonuses(id);
  const parts = [];
  if (b.modScale > 1.001) parts.push(`bonus ×${b.modScale.toFixed(2)}`);
  if (b.maxHpAdd > 0) parts.push(`+${b.maxHpAdd} HP`);
  if (b.shieldAdd > 0) parts.push(`+${b.shieldAdd.toFixed(1)}s shield/golf`);
  if (lv >= itemUpgradeMax('style', id)) parts.push('MAX');
  return parts.length ? parts.join(' · ') : (lv ? `Lv ${lv}` : '—');
}

function styleUpgradePreview(id) {
  const lv = itemUpgradeLevel('style', id);
  if (lv >= itemUpgradeMax('style', id)) return '';
  return `bonus +10% · +2 HP · +0.2s shield/golf`;
}

function rollItemShardDrop(monster) {
  const elite = !!(monster && monster.elite);
  const giant = !!(monster && monster.giant);
  const superBoss = !!(monster && monster.superBoss);
  let chance = 0.07;
  if (superBoss) chance = 0.42;
  else if (elite) chance = 0.18;
  else if (giant) chance = 0.11;
  if (Math.random() >= chance) return null;

  const pool = [];
  const curW = save.weapon || 'vuist';
  for (const w of WEAPONS) {
    if (!weaponUpgradeEligible(w)) continue;
    let wgt = w.id === curW ? 3 : 0.8;
    if (itemUpgradeLevel('weapon', w.id) >= itemUpgradeMax('weapon', w.id)) wgt *= 0.25;
    pool.push({ cat: 'weapon', id: w.id, w: wgt });
  }
  const ap = activePetDef();
  for (const p of PET_ROSTER) {
    if (!petUpgradeEligible(p)) continue;
    let wgt = ap && ap.id === p.id ? 2.8 : 0.7;
    if (itemUpgradeLevel('pet', p.id) >= itemUpgradeMax('pet', p.id)) wgt *= 0.25;
    pool.push({ cat: 'pet', id: p.id, w: wgt });
  }
  const curSt = save.style || 'classic';
  for (const st of STYLES) {
    if (!styleUpgradeEligible(st)) continue;
    let wgt = st.id === curSt ? 2.5 : 0.65;
    if (itemUpgradeLevel('style', st.id) >= itemUpgradeMax('style', st.id)) wgt *= 0.25;
    pool.push({ cat: 'style', id: st.id, w: wgt });
  }
  if (!pool.length) return null;
  let total = 0;
  for (const x of pool) total += x.w;
  let r = Math.random() * total;
  for (const x of pool) {
    r -= x.w;
    if (r <= 0) return x;
  }
  return pool[0];
}

function itemUpgradeLabel(cat, id) {
  if (!itemUpgradeIdValid(cat, id)) return id || '?';
  if (cat === 'weapon') {
    const w = WEAPONS.find((x) => x.id === id);
    return w ? weaponLabel(w) : id;
  }
  if (cat === 'pet') {
    const p = petDef(id);
    return p ? (SPECIES[p.speciesId]?.name || p.id) : id;
  }
  if (cat === 'style') return styleLabel(styleById(id));
  return id;
}

function itemUpgradeSummary(cat, id) {
  if (cat === 'weapon') return weaponUpgradeSummary(id);
  if (cat === 'pet') return petUpgradeSummary(id);
  if (cat === 'style') return styleUpgradeSummary(id);
  return '';
}

function itemUpgradePreview(cat, id) {
  if (cat === 'weapon') return weaponUpgradePreview(id);
  if (cat === 'pet') return petUpgradePreview(id);
  if (cat === 'style') return styleUpgradePreview(id);
  return '';
}

function itemUpgradeColor(cat, id) {
  if (!itemUpgradeIdValid(cat, id)) return '#ffd75e';
  if (cat === 'weapon') {
    const w = WEAPONS.find((x) => x.id === id);
    return w ? rarityOf(w.rarity).color : '#ffd75e';
  }
  if (cat === 'pet') {
    const p = petDef(id);
    const sp = p ? SPECIES[p.speciesId] : null;
    return sp ? rarityOf(sp.rarity).color : '#7cf5ff';
  }
  if (cat === 'style') return styleById(id).accent || '#c792ff';
  return '#ffd75e';
}

function totalItemUpgradeLevels() {
  let n = 0;
  if (!save.itemUpgrades) return 0;
  for (const cat of ['weapon', 'pet', 'style']) {
    const bag = save.itemUpgrades[cat] || {};
    for (const id of Object.keys(bag)) n += itemUpgradeLevel(cat, id);
  }
  return n;
}

function totalAllUpgradeLevels() {
  return totalSkillLevels() + totalItemUpgradeLevels();
}

function countSkillUpgradesReady() {
  let n = 0;
  for (const id of SKILL_IDS) if (skillCanUpgrade(id)) n++;
  return n;
}

function countItemUpgradesReady(cat) {
  let n = 0;
  if (cat === 'weapon') {
    for (const w of WEAPONS) {
      if (weaponUpgradeEligible(w) && itemCanUpgrade('weapon', w.id)) n++;
    }
  } else if (cat === 'pet') {
    for (const p of PET_ROSTER) {
      if (petUpgradeEligible(p) && itemCanUpgrade('pet', p.id)) n++;
    }
  } else if (cat === 'style') {
    for (const st of STYLES) {
      if (styleUpgradeEligible(st) && itemCanUpgrade('style', st.id)) n++;
    }
  }
  return n;
}

function countAllUpgradesReady() {
  return countSkillUpgradesReady()
    + countItemUpgradesReady('weapon')
    + countItemUpgradesReady('pet')
    + countItemUpgradesReady('style');
}
/* --- src/data/skills.js --- */
/* ========================== SKILL UPGRADES ============================= */
/** Permanent skill upgrades via adventure shard drops. */
const SKILL_MAX_LEVEL = 5;
const SKILL_SHARD_CAP = 9999;
const SKILL_SHARD_ADD_CAP = 8;
const SKILL_SHARD_COSTS = [3, 5, 8, 12, 18];

function skillMaxLevel(id) {
  const def = SKILL_DEFS[id];
  if (!def) return UPGRADE_MAX_STANDARD;
  return def.group === 'jutsu' ? UPGRADE_MAX_EXTREME : UPGRADE_MAX_STANDARD;
}

const SKILL_DEFS = {
  rasengan: {
    id: 'rasengan', group: 'jutsu', color: '#7cf5ff',
    steps: [
      { dmgMul: 1.08, radius: 2 },
      { dmgMul: 1.08, speedMul: 1.06, energySave: 5 },
      { dmgMul: 1.1, radius: 2, extraShot: 0.14 },
      { dmgMul: 1.1, lifeMul: 1.12, windupMul: 0.92 },
      { dmgMul: 1.12, radius: 3, energySave: 8, extraShot: 0.1 },
    ],
  },
  chidori: {
    id: 'chidori', group: 'jutsu', color: '#a8e0ff',
    steps: [
      { dmgMul: 1.1, radius: 1 },
      { dmgMul: 1.08, speedMul: 1.08, energySave: 5 },
      { dmgMul: 1.1, windupMul: 0.9, dashMul: 1.1 },
      { dmgMul: 1.12, radius: 2, lifeMul: 1.08 },
      { dmgMul: 1.14, energySave: 10, pierceRepeat: 0.22 },
    ],
  },
  rinnegan: {
    id: 'rinnegan', group: 'jutsu', color: '#c47aff',
    steps: [
      { dmgMul: 1.08, radius: 2 },
      { dmgMul: 1.08, lifeMul: 1.1, energySave: 5 },
      { dmgMul: 1.1, radius: 2, pullMul: 1.15 },
      { dmgMul: 1.1, extraShot: 0.12, windupMul: 0.92 },
      { dmgMul: 1.12, radius: 3, energySave: 8, lifeMul: 1.1 },
    ],
  },
  subst: {
    id: 'subst', group: 'utility', color: '#c9a66b',
    steps: [
      { cdMul: 0.92 },
      { cdMul: 0.92, invulnAdd: 0.04 },
      { cdMul: 0.9, dashDistMul: 1.1 },
      { cdMul: 0.9, invulnAdd: 0.05 },
      { cdMul: 0.88, dashDistMul: 1.12 },
    ],
  },
  dash: {
    id: 'dash', group: 'utility', color: '#7cf5ff',
    steps: [
      { cdMul: 0.9 },
      { cdMul: 0.92, dashDistMul: 1.1 },
      { cdMul: 0.9, dashSpeedMul: 1.12 },
      { cdMul: 0.92, dashDistMul: 1.08 },
      { cdMul: 0.88, dashSpeedMul: 1.15 },
    ],
  },
  chakra: {
    id: 'chakra', group: 'utility', color: '#ffd75e',
    steps: [
      { regenMul: 1.12, energySave: 3 },
      { regenMul: 1.1, energySave: 4 },
      { regenMul: 1.15 },
      { energySave: 5, regenMul: 1.1 },
      { regenMul: 1.18, energySave: 6 },
    ],
  },
};

const SKILL_IDS = Object.keys(SKILL_DEFS);
const JUTSU_SKILL_IDS = SKILL_IDS.filter((id) => SKILL_DEFS[id].group === 'jutsu');

function skillEntry(id) {
  if (!SKILL_DEFS[id]) return null;
  if (!save.skillUpgrades || typeof save.skillUpgrades !== 'object') save.skillUpgrades = {};
  if (!save.skillUpgrades[id]) save.skillUpgrades[id] = { level: 0, shards: 0 };
  return save.skillUpgrades[id];
}

function sanitizeSkillUpgradeEntry(id, raw) {
  if (!SKILL_DEFS[id]) return null;
  const max = skillMaxLevel(id);
  const entry = (raw && typeof raw === 'object') ? raw : {};
  let lv = clamp(Math.floor(Number(entry.level) || 0), 0, max);
  let shards = clamp(Math.floor(Number(entry.shards) || 0), 0, SKILL_SHARD_CAP);
  const spent = upgradeShardsSpentForLevel(lv, SKILL_SHARD_COSTS);
  const total = shards + spent;
  const maxFromBanked = upgradeMaxLevelFromBanked(total, SKILL_SHARD_COSTS, max);
  if (lv > maxFromBanked) lv = maxFromBanked;
  const spent2 = upgradeShardsSpentForLevel(lv, SKILL_SHARD_COSTS);
  shards = clamp(total - spent2, 0, SKILL_SHARD_CAP);
  if (lv <= 0 && shards <= 0) return null;
  return { level: lv, shards };
}

function normalizeSkillUpgrades() {
  const clean = {};
  const raw = (save.skillUpgrades && typeof save.skillUpgrades === 'object') ? save.skillUpgrades : {};
  for (const id of SKILL_IDS) {
    const fixed = sanitizeSkillUpgradeEntry(id, raw[id]);
    if (fixed) clean[id] = fixed;
  }
  save.skillUpgrades = clean;
}

function skillLevel(id) {
  const def = SKILL_DEFS[id];
  if (!def) return 0;
  const e = skillEntry(id);
  if (!e) return 0;
  return clamp(Math.floor(Number(e.level) || 0), 0, skillMaxLevel(id));
}

function skillShards(id) {
  if (!SKILL_DEFS[id]) return 0;
  const e = skillEntry(id);
  if (!e) return 0;
  return clamp(Math.floor(Number(e.shards) || 0), 0, SKILL_SHARD_CAP);
}

function skillUpgradeCost(id) {
  const lv = skillLevel(id);
  const max = skillMaxLevel(id);
  if (lv >= max) return null;
  return SKILL_SHARD_COSTS[lv] || SKILL_SHARD_COSTS[SKILL_SHARD_COSTS.length - 1];
}

function skillCanUpgrade(id) {
  const cost = skillUpgradeCost(id);
  if (cost == null) return false;
  return skillShards(id) >= cost;
}

function skillBonuses(id) {
  const def = SKILL_DEFS[id];
  const b = {
    dmgMul: 1, radius: 0, speedMul: 1, lifeMul: 1, windupMul: 1, energySave: 0,
    regenMul: 1, cdMul: 1, dashDistMul: 1, dashSpeedMul: 1, invulnAdd: 0,
    extraShot: 0, pierceRepeat: 0, pullMul: 1,
  };
  if (!def) return b;
  const lv = skillLevel(id);
  for (let i = 0; i < lv; i++) {
    const s = def.steps[i];
    if (!s) continue;
    if (s.dmgMul) b.dmgMul *= s.dmgMul;
    if (s.radius) b.radius += s.radius;
    if (s.speedMul) b.speedMul *= s.speedMul;
    if (s.lifeMul) b.lifeMul *= s.lifeMul;
    if (s.windupMul) b.windupMul *= s.windupMul;
    if (s.energySave) b.energySave += s.energySave;
    if (s.regenMul) b.regenMul *= s.regenMul;
    if (s.cdMul) b.cdMul *= s.cdMul;
    if (s.dashDistMul) b.dashDistMul *= s.dashDistMul;
    if (s.dashSpeedMul) b.dashSpeedMul *= s.dashSpeedMul;
    if (s.invulnAdd) b.invulnAdd += s.invulnAdd;
    if (s.extraShot) b.extraShot = Math.min(0.45, b.extraShot + s.extraShot);
    if (s.pierceRepeat) b.pierceRepeat = Math.min(0.4, b.pierceRepeat + s.pierceRepeat);
    if (s.pullMul) b.pullMul *= s.pullMul;
  }
  return b;
}

function jutsuSkillBonuses(kind) {
  return skillBonuses(kind && SKILL_DEFS[kind] ? kind : 'rasengan');
}

function utilitySkillBonuses() {
  return {
    subst: skillBonuses('subst'),
    dash: skillBonuses('dash'),
    chakra: skillBonuses('chakra'),
  };
}

function skillChakraCost(jutsuKind) {
  const j = jutsuSkillBonuses(jutsuKind || 'rasengan');
  const c = utilitySkillBonuses().chakra;
  return clamp(100 - (j.energySave || 0) - (c.energySave || 0), 72, 100);
}

function addSkillShards(id, n) {
  if (!SKILL_DEFS[id]) return 0;
  const add = clamp(Math.floor(Number(n) || 0), 1, SKILL_SHARD_ADD_CAP);
  const e = skillEntry(id);
  if (!e) return 0;
  e.shards = clamp(skillShards(id) + add, 0, SKILL_SHARD_CAP);
  save.stats = save.stats || {};
  save.stats.skillShards = clamp((save.stats.skillShards || 0) + add, 0, 9999999);
  persist();
  return add;
}

function trySkillUpgrade(id) {
  if (!SKILL_DEFS[id] || !skillCanUpgrade(id)) return false;
  const cost = skillUpgradeCost(id);
  const e = skillEntry(id);
  if (!e || cost == null || skillShards(id) < cost) return false;
  const next = skillLevel(id) + 1;
  if (next > skillMaxLevel(id)) return false;
  e.shards = clamp(skillShards(id) - cost, 0, SKILL_SHARD_CAP);
  e.level = next;
  persist();
  return true;
}

function rollSkillShardDrop(monster) {
  const elite = !!(monster && monster.elite);
  const giant = !!(monster && monster.giant);
  const superBoss = !!(monster && monster.superBoss);
  let chance = 0.1;
  if (superBoss) chance = 0.55;
  else if (elite) chance = 0.28;
  else if (giant) chance = 0.16;
  if (Math.random() >= chance) return null;
  const weights = [];
  for (const id of SKILL_IDS) {
    let w = 1;
    if (SKILL_DEFS[id].group === 'jutsu') w = id === 'rasengan' ? 2.2 : 0.85;
    if (skillLevel(id) >= skillMaxLevel(id)) w *= 0.35;
    weights.push({ id, w });
  }
  let total = 0;
  for (const x of weights) total += x.w;
  let r = Math.random() * total;
  for (const x of weights) {
    r -= x.w;
    if (r <= 0) return x.id;
  }
  return weights[0]?.id || 'rasengan';
}

function skillUpgradeSummary(id) {
  const lv = skillLevel(id);
  const b = skillBonuses(id);
  const parts = [];
  if (b.dmgMul > 1.001) parts.push(`DMG ×${b.dmgMul.toFixed(2)}`);
  if (b.radius > 0) parts.push(`+${b.radius} radius`);
  if (b.energySave > 0) parts.push(`−${b.energySave} chakra`);
  if (b.regenMul > 1.001) parts.push(`regen ×${b.regenMul.toFixed(2)}`);
  if (b.cdMul < 0.999) parts.push(`CD ×${b.cdMul.toFixed(2)}`);
  if (b.extraShot > 0) parts.push(`${Math.round(b.extraShot * 100)}% extra shot`);
  if (b.pierceRepeat > 0) parts.push(`${Math.round(b.pierceRepeat * 100)}% re-hit`);
  if (b.windupMul < 0.999) parts.push(`sneller cast`);
  if (lv >= skillMaxLevel(id)) parts.push('MAX');
  return parts.length ? parts.join(' · ') : (lv ? 'Lv ' + lv : '—');
}

function skillNextStepPreview(id) {
  const lv = skillLevel(id);
  const def = SKILL_DEFS[id];
  if (!def || lv >= skillMaxLevel(id)) return '';
  const s = def.steps[lv];
  if (!s) return '';
  const parts = [];
  if (s.dmgMul) parts.push(`DMG +${Math.round((s.dmgMul - 1) * 100)}%`);
  if (s.radius) parts.push(`+${s.radius} radius`);
  if (s.energySave) parts.push(`−${s.energySave} chakra`);
  if (s.regenMul) parts.push(`regen +${Math.round((s.regenMul - 1) * 100)}%`);
  if (s.cdMul) parts.push(`CD −${Math.round((1 - s.cdMul) * 100)}%`);
  if (s.extraShot) parts.push(`+${Math.round(s.extraShot * 100)}% extra`);
  if (s.pierceRepeat) parts.push(`+${Math.round(s.pierceRepeat * 100)}% re-hit`);
  return parts.join(' · ');
}

function totalSkillLevels() {
  let n = 0;
  for (const id of SKILL_IDS) n += skillLevel(id);
  return n;
}
/* --- src/data/summons.js --- */
/* ============================ SUMMONS ================================== */
/* Hele kleine kans bij een kill: een Summon ascendeert een lager wapen
   (common/uncommon/rare) naar Episch of Legendarisch — met power boven
   hogere unlock-wapens. Permanent in save.summons { wapenId: tier }. */
const SUMMON_BOOST = {
  epic:      { dmg: 1.55, range: 8,  speed: 1.08 },
  legendary: { dmg: 1.95, range: 12, speed: 1.12 },
};
const summonTierOf = id => (save.summons || {})[id] || null;
function summonEligibleWeapons() {
  return WEAPONS.filter(w =>
    save.lvl >= w.unlock &&
    rarityOf(w.rarity).order <= 2 &&
    summonTierOf(w.id) !== 'legendary');
}
/** Wapenobject met summon-tier toegepast (alleen speler-arsenaal). */
function applySummonTier(w) {
  const tier = summonTierOf(w.id);
  if (!tier || !SUMMON_BOOST[tier]) return w;
  if (rarityOf(w.rarity).order >= rarityOf(tier).order) return w;
  const b = SUMMON_BOOST[tier];
  return Object.assign({}, w, {
    rarity: tier,
    dmg: Math.round(w.dmg * b.dmg * 100) / 100,
    range: w.range + b.range,
    speed: Math.round(w.speed * b.speed * 100) / 100,
    summoned: true,
  });
}
const playerWeapon = () => applyWeaponUpgrades(applySummonTier(weaponById(save.weapon)));

/** 2% per avontuur-level: zwaard → Master Sword (Zelda) — 15s, ×2 dmg, groot bereik, unblockable. */
const MASTER_SWORD_DURATION = 15;
const MASTER_SWORD_CHANCE = 0.02;
function canMasterSwordRoll(w) {
  if (!w || w.id === 'vuist' || w.id === 'master_sword' || isThrowWeapon(w.id)) return false;
  const fam = weaponMoveFamily(w.id);
  return fam === 'slash' || fam === 'energy';
}
function buildMasterSwordWeapon(base) {
  base = base || weaponById('zwaard');
  return Object.assign({}, base, {
    id: 'master_sword',
    name: 'Master Sword',
    dmg: Math.round((base.dmg || 1.55) * 2 * 100) / 100,
    range: Math.max(96, (base.range || 58) + 38),
    speed: Math.min(1.22, (base.speed || 1) * 1.1),
    rarity: 'legendary',
    masterSword: true,
    desc: 'Hyrules legendarische kling — unblockable',
  });
}
function rollSummonChance(elite) {
  const since = save.stats.killsSinceSummon || 0;
  // Basis ~0,7% per kill; zachte pity-ramp (+0,004%/kill, max +2%); elites ×2,5
  const chance = (0.007 + Math.min(0.02, since * 0.00004)) * (elite ? 2.5 : 1);
  return Math.random() < chance;
}

/** Swing-SFX per wapen (procedureel) — geen generieke “swing” voor alles. */
const WEAPON_SWING_SFX = {
  vuist: 'punch',
  kunai: 'wKunai',
  shuriken: 'shuriken',
  tanto: 'wKunai',
  zwaard: 'wZwaard',
  sai: 'wKunai',
  knuppel: 'wKnuppel',
  waaier: 'wBoemerang',
  speer: 'wSpeer',
  tonfa: 'wNunchaku',
  nunchaku: 'wNunchaku',
  kama: 'wKunai',
  boemerang: 'wBoemerang',
  zeis: 'wZwaard',
  hamer: 'wHamer',
  drietand: 'wSpeer',
  ketting: 'wKetting',
  bostaf: 'wKnuppel',
  laser: 'wLaser',
  fuuma: 'shuriken',
  kristal: 'wLaser',
  donder: 'wDonder',
  vlamzweep: 'wLaser',
  void: 'wVoid',
  sterkling: 'wZwaard',
  guvve: 'wGuvve',
  master_sword: 'wMaster',
};

function weaponSwingSfx(weaponOrId, attackKind) {
  if (attackKind === 'kick') return 'kick';
  if (attackKind === 'punch') return 'punch';
  const id = typeof weaponOrId === 'string' ? weaponOrId : (weaponOrId && weaponOrId.id);
  return WEAPON_SWING_SFX[id] || 'swing';
}

function weaponHitSfx(weaponOrId, dmg) {
  const id = typeof weaponOrId === 'string' ? weaponOrId : (weaponOrId && weaponOrId.id);
  if (id === 'laser' || id === 'void' || id === 'donder' || id === 'kristal' || id === 'vlamzweep' || id === 'sterkling') return 'hitEnergy';
  if (id === 'hamer' || id === 'knuppel' || id === 'guvve' || id === 'bostaf') return 'hitHeavy';
  if (id === 'zwaard' || id === 'ketting' || id === 'kunai' || id === 'tanto' || id === 'sai' || id === 'kama' || id === 'zeis' || id === 'drietand') return 'hitMetal';
  if (id === 'master_sword') return 'hitEnergy';
  if (dmg > 22) return 'hit2';
  return 'hit';
}

function isThrowWeapon(id) {
  return id === 'shuriken' || id === 'fuuma';
}

/** Per wapen: 3 opeenvolgende melee-bewegingen (combo-ketting ~1,4s). */
const WEAPON_MOVE_FAMILIES = {
  slash: {
    labels: ['Horizontale snede', 'Opwaartse kling', 'Doorsteek'],
    moves: [
      { pose: 'slash', rangeMul: 1, dmgMul: 1, kbMul: 1, hitY: 0, windupMul: 1, activeMul: 1 },
      { pose: 'upper', rangeMul: 0.96, dmgMul: 1.04, kbMul: 1.08, hitY: -22, windupMul: 0.94, activeMul: 0.95 },
      { pose: 'thrust', rangeMul: 1.1, dmgMul: 1.06, kbMul: 1.12, hitY: -6, windupMul: 1.05, activeMul: 1.04 },
    ],
  },
  spear: {
    labels: ['Steek', 'Lage sweep', 'Hoge stoot'],
    moves: [
      { pose: 'thrust', rangeMul: 1.12, dmgMul: 1, kbMul: 1.1, hitY: -4, windupMul: 1.02, activeMul: 1.05 },
      { pose: 'sweep', rangeMul: 1.05, dmgMul: 0.98, kbMul: 1.05, hitY: 14, windupMul: 0.92, activeMul: 1 },
      { pose: 'upper', rangeMul: 1.08, dmgMul: 1.08, kbMul: 1.14, hitY: -20, windupMul: 1.08, activeMul: 1.02 },
    ],
  },
  blunt: {
    labels: ['Overhead', 'Zijslag', 'Opwaartse smash'],
    moves: [
      { pose: 'overhead', rangeMul: 0.94, dmgMul: 1.08, kbMul: 1.15, hitY: -8, windupMul: 1.1, activeMul: 0.92 },
      { pose: 'slash', rangeMul: 1.02, dmgMul: 1, kbMul: 1.05, hitY: 2, windupMul: 0.95, activeMul: 1 },
      { pose: 'upper', rangeMul: 1, dmgMul: 1.1, kbMul: 1.2, hitY: -16, windupMul: 1.06, activeMul: 0.98 },
    ],
  },
  chain: {
    labels: ['Flurry', 'Wervel', 'Hak'],
    moves: [
      { pose: 'slash', rangeMul: 0.98, dmgMul: 0.98, kbMul: 0.95, hitY: 0, windupMul: 0.88, activeMul: 0.92 },
      { pose: 'spin', rangeMul: 1.06, dmgMul: 1.02, kbMul: 1.08, hitY: -4, windupMul: 0.96, activeMul: 1.02 },
      { pose: 'overhead', rangeMul: 1, dmgMul: 1.1, kbMul: 1.18, hitY: -10, windupMul: 1.04, activeMul: 1 },
    ],
  },
  hook: {
    labels: ['Haak', 'Lage rippen', 'Opstoot'],
    moves: [
      { pose: 'hook', rangeMul: 1, dmgMul: 1, kbMul: 1.08, hitY: 4, windupMul: 0.96, activeMul: 1 },
      { pose: 'sweep', rangeMul: 1.04, dmgMul: 1.02, kbMul: 1.05, hitY: 16, windupMul: 0.94, activeMul: 0.98 },
      { pose: 'thrust', rangeMul: 1.08, dmgMul: 1.08, kbMul: 1.12, hitY: -8, windupMul: 1.06, activeMul: 1.04 },
    ],
  },
  fan: {
    labels: ['Waaier-zweef', 'Kruissnede', 'Windslag'],
    moves: [
      { pose: 'slash', rangeMul: 1, dmgMul: 0.98, kbMul: 0.98, hitY: -6, windupMul: 0.9, activeMul: 0.95 },
      { pose: 'spin', rangeMul: 1.04, dmgMul: 1.02, kbMul: 1.02, hitY: 0, windupMul: 0.92, activeMul: 1 },
      { pose: 'upper', rangeMul: 1.06, dmgMul: 1.06, kbMul: 1.1, hitY: -18, windupMul: 1, activeMul: 1.02 },
    ],
  },
  dual: {
    labels: ['Kruis-stoot', 'Parry-snap', 'Dubbel-slagen'],
    moves: [
      { pose: 'thrust', rangeMul: 1, dmgMul: 1, kbMul: 1, hitY: -2, windupMul: 0.92, activeMul: 0.95 },
      { pose: 'hook', rangeMul: 0.98, dmgMul: 1.04, kbMul: 1.06, hitY: 6, windupMul: 0.9, activeMul: 0.92 },
      { pose: 'spin', rangeMul: 1.08, dmgMul: 1.08, kbMul: 1.12, hitY: -4, windupMul: 1.02, activeMul: 1.04 },
    ],
  },
  energy: {
    labels: ['Energie-zwaai', 'Focus-stoot', 'Nova-sweep'],
    moves: [
      { pose: 'slash', rangeMul: 1, dmgMul: 1, kbMul: 1.02, hitY: -4, windupMul: 0.94, activeMul: 0.98 },
      { pose: 'thrust', rangeMul: 1.1, dmgMul: 1.06, kbMul: 1.1, hitY: -8, windupMul: 1.04, activeMul: 1.05 },
      { pose: 'spin', rangeMul: 1.06, dmgMul: 1.08, kbMul: 1.14, hitY: 0, windupMul: 1.06, activeMul: 1.02 },
    ],
  },
};

/** Per wapen: eigen 1-2-3 stijl (labels + optionele move-tweaks; stats erven anders van family). */
const WEAPON_COMBOS = {
  kunai: {
    labels: ['Kunai-steek', 'Ruk-terug', 'Kruis-snede'],
    moves: [
      { pose: 'thrust', rangeMul: 1.04, dmgMul: 1, kbMul: 1, hitY: -4, windupMul: 0.9, activeMul: 0.92 },
      { pose: 'hook', rangeMul: 0.98, dmgMul: 1.02, kbMul: 1.04, hitY: 2, windupMul: 0.88, activeMul: 0.9 },
      { pose: 'slash', rangeMul: 1.02, dmgMul: 1.04, kbMul: 1.06, hitY: 0, windupMul: 0.94, activeMul: 0.96 },
    ],
  },
  tanto: {
    labels: ['Quick-draw', 'Omkeer-priem', 'Lethale punctie'],
    moves: [
      { pose: 'slash', rangeMul: 0.98, dmgMul: 1, kbMul: 0.98, hitY: 0, windupMul: 0.82, activeMul: 0.88 },
      { pose: 'hook', rangeMul: 1, dmgMul: 1.02, kbMul: 1.04, hitY: 4, windupMul: 0.86, activeMul: 0.9 },
      { pose: 'thrust', rangeMul: 1.06, dmgMul: 1.08, kbMul: 1.1, hitY: -6, windupMul: 0.98, activeMul: 1 },
    ],
  },
  zwaard: {
    labels: ['Iai-houw', 'Diagonale kling', 'Kenjutsu-eind'],
  },
  sai: {
    labels: ['Drie-punt stoot', 'Blok-snap', 'Parry-kruis'],
  },
  knuppel: {
    labels: ['Woudslag', 'Zij-knock', 'Knuppel-smash'],
  },
  waaier: {
    labels: ['Waaier-dans', 'Bladstorm', 'Wind-coup'],
  },
  speer: {
    labels: ['Verre steek', 'Lage sweep', 'Speersprong'],
  },
  tonfa: {
    labels: ['Tonfa-flurry', 'Worp-rotatie', 'Breaker-slag'],
    moves: [
      { pose: 'slash', rangeMul: 0.96, dmgMul: 0.98, kbMul: 0.95, hitY: 0, windupMul: 0.82, activeMul: 0.88 },
      { pose: 'spin', rangeMul: 1.02, dmgMul: 1, kbMul: 1.02, hitY: -2, windupMul: 0.88, activeMul: 0.92 },
      { pose: 'overhead', rangeMul: 1.02, dmgMul: 1.12, kbMul: 1.22, hitY: -10, windupMul: 1.04, activeMul: 0.96 },
    ],
  },
  nunchaku: {
    labels: ['Bliksem-flurry', 'Ketting-wervel', 'Finisher-hak'],
  },
  kama: {
    labels: ['Sikkel-haak', 'Oogst-sweep', 'Grap-stoot'],
  },
  boemerang: {
    labels: ['Return-slag', 'Boomer-sweep', 'Spin-out'],
  },
  zeis: {
    labels: ['Schaduw-sweep', 'Rip-sikkel', 'Zeis-doorsteek'],
    moves: [
      { pose: 'sweep', rangeMul: 1.08, dmgMul: 1, kbMul: 1.02, hitY: 12, windupMul: 0.96, activeMul: 1.02 },
      { pose: 'hook', rangeMul: 1.04, dmgMul: 1.04, kbMul: 1.08, hitY: 6, windupMul: 0.94, activeMul: 1 },
      { pose: 'thrust', rangeMul: 1.12, dmgMul: 1.1, kbMul: 1.14, hitY: -8, windupMul: 1.08, activeMul: 1.04 },
    ],
  },
  hamer: {
    labels: ['Moker-slag', 'Aardbeving', 'Afteller-smash'],
    moves: [
      { pose: 'overhead', rangeMul: 0.92, dmgMul: 1.12, kbMul: 1.2, hitY: -8, windupMul: 1.14, activeMul: 0.9 },
      { pose: 'slash', rangeMul: 1, dmgMul: 1.04, kbMul: 1.08, hitY: 4, windupMul: 1, activeMul: 0.96 },
      { pose: 'upper', rangeMul: 0.98, dmgMul: 1.14, kbMul: 1.24, hitY: -18, windupMul: 1.1, activeMul: 0.96 },
    ],
  },
  drietand: {
    labels: ['Drie-punt prik', 'Poseidon-sweep', 'Neptune-stoot'],
  },
  ketting: {
    labels: ['Ketting-flurry', 'Steel-whip', 'Bladregen'],
  },
  bostaf: {
    labels: ['Bo-flow', 'Endurance-sweep', 'Zen-stoot'],
    moves: [
      { pose: 'thrust', rangeMul: 1.08, dmgMul: 1, kbMul: 1.06, hitY: -2, windupMul: 0.9, activeMul: 0.98 },
      { pose: 'sweep', rangeMul: 1.08, dmgMul: 0.98, kbMul: 1.04, hitY: 10, windupMul: 0.88, activeMul: 0.98 },
      { pose: 'thrust', rangeMul: 1.1, dmgMul: 1.06, kbMul: 1.12, hitY: -12, windupMul: 1.02, activeMul: 1.04 },
    ],
  },
  laser: {
    labels: ['Chakra-zwaai', 'Focus-stoot', 'Licht-nova'],
  },
  kristal: {
    labels: ['Kristal-splinter', 'Prisma-stoot', 'Shard-burst'],
  },
  donder: {
    labels: ['Bliksem-hak', 'Storm-overhead', 'Donder-smash'],
    moves: [
      { pose: 'slash', rangeMul: 1, dmgMul: 1.04, kbMul: 1.08, hitY: 0, windupMul: 0.98, activeMul: 0.96 },
      { pose: 'overhead', rangeMul: 0.96, dmgMul: 1.12, kbMul: 1.18, hitY: -10, windupMul: 1.12, activeMul: 0.9 },
      { pose: 'upper', rangeMul: 1.02, dmgMul: 1.16, kbMul: 1.26, hitY: -20, windupMul: 1.08, activeMul: 0.94 },
    ],
  },
  vlamzweep: {
    labels: ['Vlam-zweef', 'Vuur-wervel', 'Inferno-hak'],
  },
  void: {
    labels: ['Void-rits', 'Leegte-stoot', 'Klauw-nova'],
  },
  sterkling: {
    labels: ['Ster-val', 'Nova-stoot', 'Kosmische sweep'],
  },
  guvve: {
    labels: ['GUVOO', 'QUAK', 'STICK'],
    moves: [
      { pose: 'overhead', rangeMul: 0.96, dmgMul: 1.1, kbMul: 1.18, hitY: -6, windupMul: 1.08, activeMul: 0.94 },
      { pose: 'slash', rangeMul: 1.04, dmgMul: 1.06, kbMul: 1.1, hitY: 4, windupMul: 0.96, activeMul: 0.98 },
      { pose: 'upper', rangeMul: 1.06, dmgMul: 1.18, kbMul: 1.28, hitY: -14, windupMul: 1.1, activeMul: 0.96 },
    ],
  },
  master_sword: {
    labels: ['Licht-slice', 'Zwaard-dans', 'Triforce-stoot'],
    moves: [
      { pose: 'slash', rangeMul: 1.06, dmgMul: 1.04, kbMul: 1.06, hitY: 0, windupMul: 0.92, activeMul: 0.96 },
      { pose: 'spin', rangeMul: 1.1, dmgMul: 1.08, kbMul: 1.12, hitY: -4, windupMul: 0.98, activeMul: 1.02 },
      { pose: 'thrust', rangeMul: 1.16, dmgMul: 1.12, kbMul: 1.18, hitY: -8, windupMul: 1.04, activeMul: 1.06 },
    ],
  },
};

function weaponComboSet(id) {
  const fam = weaponMoveFamily(id);
  if (!fam) return null;
  const familySet = WEAPON_MOVE_FAMILIES[fam] || WEAPON_MOVE_FAMILIES.slash;
  const custom = WEAPON_COMBOS[id];
  if (!custom) return familySet;
  return {
    labels: custom.labels || familySet.labels,
    moves: custom.moves || familySet.moves,
  };
}

function weaponMoveFamily(id) {
  if (id === 'master_sword') return 'slash';
  if (isThrowWeapon(id) || id === 'vuist') return null;
  if (id === 'speer' || id === 'drietand' || id === 'bostaf') return 'spear';
  if (id === 'knuppel' || id === 'hamer' || id === 'tonfa' || id === 'guvve' || id === 'donder') return 'blunt';
  if (id === 'nunchaku' || id === 'ketting' || id === 'vlamzweep' || id === 'boemerang') return 'chain';
  if (id === 'kama' || id === 'zeis') return 'hook';
  if (id === 'waaier') return 'fan';
  if (id === 'sai') return 'dual';
  if (id === 'laser' || id === 'void' || id === 'kristal' || id === 'sterkling') return 'energy';
  return 'slash';
}

function weaponMoveDef(id, idx) {
  const set = weaponComboSet(id);
  if (!set) return null;
  const moves = set.moves;
  if (!moves || !moves.length) return WEAPON_MOVE_FAMILIES.slash.moves[0];
  const n = ((idx || 0) % 3 + 3) % 3;
  return moves[n] || moves[0];
}

function weaponMoveLabels(id) {
  const set = weaponComboSet(id);
  if (!set) return null;
  return set.labels || WEAPON_MOVE_FAMILIES.slash.labels;
}

function applyWeaponMovePose(P, ext, move) {
  const e = Math.max(0, ext);
  const pose = (move && move.pose) || 'slash';
  if (pose === 'thrust') {
    P.arms = [[1.9, -1.1], [lerp(0.9, 0.0, e), lerp(-0.4, 0.0, e)]];
    P.lean = 0.18 * e;
  } else if (pose === 'upper') {
    P.arms = [[1.7, -1.3], [lerp(0.4, -1.3, e), lerp(-0.2, -0.55, e)]];
    P.lean = -0.08 * e;
  } else if (pose === 'sweep') {
    P.arms = [[1.9, -1.1], [lerp(0.2, 0.55, e), lerp(0.3, 0.9, e)]];
    P.lean = 0.14 * e;
  } else if (pose === 'overhead') {
    P.arms = [[2.0, -1.5], [lerp(0.8, -1.55, e), lerp(-0.3, -0.88, e)]];
    P.lean = -0.12 * e;
  } else if (pose === 'spin') {
    const sw = lerp(-2.4, 1.05, e);
    P.arms = [[1.6, -1.0], [sw, sw + 0.35]];
    P.lean = 0.16 * Math.sin(e * Math.PI) * e;
  } else if (pose === 'hook') {
    P.arms = [[1.9, -1.1], [lerp(-1.8, 0.35, e), lerp(-0.6, 0.15, e)]];
    P.lean = 0.12 * e;
  } else {
    const sw = lerp(-2.15, 0.75, e);
    const base = ext < 0 ? lerp(-1.6, -2.15, -ext / 0.25) : sw;
    P.arms = [[1.9, -1.1], [base, base + 0.12]];
    P.lean = 0.1 * ext;
  }
}

const WEAPON_COMBO_WINDOW = 1.38;
const WEAPON_COMBO_GRACE = 0.6;
const WEAPON_COMBO_STEP_MUL = [1, 1.06, 1.12];
const WEAPON_FINISHER_MUL = { dmg: 1.15, kb: 1.12, energy: 6 };
const WEAPON_POSE_FX = {
  slash: '#e8f0ff', thrust: '#9fd8ff', upper: '#ffd75e', sweep: '#b06ae0',
  overhead: '#ff8080', spin: '#7cf5ff', hook: '#c792ff',
};

function weaponComboStepMul(idx) {
  const n = clamp(((idx || 0) % 3 + 3) % 3, 0, 2);
  return WEAPON_COMBO_STEP_MUL[n] || 1;
}

function weaponMoveFxColor(move) {
  const pose = (move && move.pose) || 'slash';
  return WEAPON_POSE_FX[pose] || '#e8f0ff';
}

function isWeaponFinisher(f, spec) {
  if (!f || !spec || spec.kind !== 'weapon' || spec.moveIdx !== 2) return false;
  if (isThrowWeapon(f.weapon?.id)) return false;
  return (f._weaponComboHits || 0) >= 2;
}

const WEAPON_MASTERY_TIERS = [
  { min: 0, name: 'Leerling', color: '#9fd8ff' },
  { min: 3, name: 'Virtuoos', color: '#c792ff' },
  { min: 10, name: 'Meester', color: '#ffd75e' },
  { min: 25, name: 'Legende', color: '#ffb830' },
];

function weaponMasteryCount(id) {
  return (save.weaponMastery && save.weaponMastery[id] && save.weaponMastery[id].finishers) || 0;
}

function weaponMasteryTierIdx(count) {
  let idx = 0;
  for (let i = 0; i < WEAPON_MASTERY_TIERS.length; i++) {
    if (count >= WEAPON_MASTERY_TIERS[i].min) idx = i;
  }
  return idx;
}

function weaponMasteryTier(id, countOverride) {
  const count = countOverride != null ? countOverride : weaponMasteryCount(id);
  return WEAPON_MASTERY_TIERS[weaponMasteryTierIdx(count)];
}

function weaponMasteryTopList(limit) {
  const list = [];
  for (const w of WEAPONS) {
    if (isThrowWeapon(w.id) || w.id === 'vuist') continue;
    const n = weaponMasteryCount(w.id);
    if (n > 0) list.push({ id: w.id, name: w.name, finishers: n, tier: weaponMasteryTier(w.id) });
  }
  list.sort((a, b) => b.finishers - a.finishers);
  return list.slice(0, limit || 3);
}

function weaponComboTipOnce() {
  if (typeof save === 'undefined') return;
  if (!save.tipsSeen || typeof save.tipsSeen !== 'object') save.tipsSeen = {};
  if (save.tipsSeen.weaponCombo) return;
  save.tipsSeen.weaponCombo = 1;
  if (typeof persist === 'function') persist();
  try { UI.toast('Wapen 3× tikken = ①②③ · raak met ①+② voor gouden finisher ③', 4200); } catch (_) {}
}

function trackWeaponFinisher(weaponId, gameRef) {
  if (!weaponId || isThrowWeapon(weaponId) || typeof save === 'undefined') return;
  save.stats = save.stats || {};
  const prevTotal = save.stats.weaponFinishers || 0;
  save.stats.weaponFinishers = prevTotal + 1;
  save.weaponMastery = save.weaponMastery || {};
  const m = save.weaponMastery[weaponId] || { finishers: 0 };
  const prevCount = m.finishers || 0;
  const prevTierIdx = weaponMasteryTierIdx(prevCount);
  m.finishers = prevCount + 1;
  save.weaponMastery[weaponId] = m;
  const newTierIdx = weaponMasteryTierIdx(m.finishers);
  if (gameRef) gameRef.runFinishers = (gameRef.runFinishers || 0) + 1;
  if (typeof bumpDaily === 'function') bumpDaily('weaponFinisher', 1);
  if (newTierIdx > prevTierIdx && typeof UI !== 'undefined') {
    const w = weaponById(weaponId);
    const tier = WEAPON_MASTERY_TIERS[newTierIdx];
    try { UI.toast(`${w.name}: ${tier.name}!`, 3200); } catch (_) {}
  }
  if (prevTotal === 0 && typeof UI !== 'undefined') {
    try { UI.toast('Eerste finisher! Raak ① én ②, dan is ③ goud.', 3600); } catch (_) {}
  }
  if (typeof checkAchievements === 'function') checkAchievements();
}

function resetWeaponCombo(f) {
  if (!f) return;
  f.weaponComboIdx = 0;
  f.weaponComboT = 0;
  f._lastWeaponKind = null;
  f._weaponComboPrimed = false;
  f._weaponComboHits = 0;
}

function bumpWeaponComboWindow(f, bonus) {
  if (!f || f.weaponComboT <= 0) return;
  f.weaponComboT = Math.min(WEAPON_COMBO_WINDOW + 0.32, f.weaponComboT + (bonus || 0.14));
}

function sanitizeWeaponSpec(spec) {
  if (!spec) return spec;
  spec.windup = Math.max(0.045, spec.windup || 0.1);
  spec.active = Math.max(0.04, spec.active || 0.08);
  spec.recover = Math.max(0.06, spec.recover || 0.12);
  spec.range = Math.max(24, spec.range || 40);
  spec.r = Math.max(22, spec.r || 24);
  if (spec.moveHitY != null) spec.moveHitY = clamp(spec.moveHitY, -32, 24);
  return spec;
}

function drawWeaponStylePips(c, x, y, fighter) {
  if (!fighter || !weaponMoveFamily(fighter.weapon?.id) || fighter.weaponComboT <= 0) return;
  const labels = weaponMoveLabels(fighter.weapon.id);
  const readyFin = fighter.weaponComboIdx >= 2 && (fighter._weaponComboHits || 0) >= 2;
  for (let i = 0; i < 3; i++) {
    const lit = i <= fighter.weaponComboIdx;
    const fin = readyFin && i === 2;
    c.fillStyle = fin ? '#ffb830' : (lit ? '#ffd75e' : 'rgba(255,255,255,.22)');
    c.beginPath();
    c.arc(x + i * 13, y, fin ? 4.2 : 3.5, 0, TAU);
    c.fill();
    if (fin && !motionReduced()) {
      c.strokeStyle = 'rgba(255,184,48,.45)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(x + i * 13, y, 6.5, 0, TAU);
      c.stroke();
    }
  }
  if (labels && labels[fighter.weaponComboIdx]) {
    c.font = '9px sans-serif';
    c.fillStyle = readyFin && fighter.weaponComboIdx === 2 ? '#ffb830' : 'rgba(255,255,255,.72)';
    c.textAlign = 'center';
    const lbl = labels[fighter.weaponComboIdx];
    c.fillText(lbl.length > 14 ? lbl.slice(0, 13) + '…' : lbl, x + 13, y + 12);
    c.textAlign = 'left';
  }
  if (!motionReduced()) {
    const frac = clamp(fighter.weaponComboT / WEAPON_COMBO_WINDOW, 0, 1);
    c.fillStyle = 'rgba(255,255,255,.14)';
    c.fillRect(x - 2, y + 18, 40, 3);
    c.fillStyle = readyFin ? '#ffb830' : '#ffd75e';
    c.fillRect(x - 2, y + 18, 40 * frac, 3);
  }
}

/* --- src/systems/versus.js --- */
/* ========================== VERSUS / 2 SPELERS ========================== */
/** Saga-hints: parodie-vibes, geen officiële manga/IP-namen. */
const VS_SAGAS = {
  all: { id: 'all', label: 'Alle', emoji: '⭐', blurb: 'Alle 20 vechters — kies P1, dan P2.' },
  fighter: { id: 'fighter', label: 'Street', emoji: '🥋', blurb: 'Ryu & Ken — classic white/red gi duel.' },
  ki: { id: 'ki', label: 'Ki', emoji: '🔥', blurb: 'Ki-golven & power spikes — Goku vibes.' },
  scroll: { id: 'scroll', label: 'Scroll', emoji: '📜', blurb: 'Ninja & demon fox — headband hints.' },
  tide: { id: 'tide', label: 'Tide', emoji: '🌊', blurb: 'Reach & crew — rubber stretch slagen.' },
  cape: { id: 'cape', label: 'Cape', emoji: '🦸', blurb: 'Serious hero — bald one-punch blink.' },
  dawn: { id: 'dawn', label: 'Dawn', emoji: '☀️', blurb: 'Holy lance & void sin aura.' },
};
function vsSagaMeta(id) { return VS_SAGAS[id] || VS_SAGAS.scroll; }

/** Saga-iconen als inline SVG (art-upgrade 4/4) — vervangt emoji-chips. */
const SAGA_ICON_SVG = {
  all: '<path d="M12 3l2 6h6l-5 4 2 6-5-3.6L7 19l2-6-5-4h6z" fill="currentColor" stroke="none"/>',
  ki: '<path d="M12 3c3 3.5 5.5 6 5.5 10a5.5 5.5 0 01-11 0c0-2 .8-3.6 2-5.4.4 1.4 1 2.2 2 2.9C10.2 8 10.8 5.5 12 3z" fill="currentColor" stroke="none"/>',
  scroll: '<path d="M7 4h11v14H7z"/><path d="M7 4a2 2 0 00-2 2v12a2 2 0 002 2h11"/><path d="M10 8h5M10 12h5"/>',
  tide: '<path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M3 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>',
  cape: '<path d="M12 3l7 4-2 13-5 2-5-2L5 7z"/><path d="M12 3v19"/>',
  fighter: '<path d="M8 4h8v4H8zM6 8h12v12H6z"/><path d="M9 12h6M9 16h6"/>',
  dawn: '<circle cx="12" cy="14" r="4.5"/><path d="M12 5.5V3M5.5 8L4 6.5M18.5 8L20 6.5M3 14h2M19 14h2"/>',
};
function sagaIconSvg(id) {
  const body = SAGA_ICON_SVG[id] || SAGA_ICON_SVG.all;
  return '<svg viewBox="0 0 24 24" style="width:1.05em;height:1.05em;vertical-align:-0.16em" ' +
    'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
}
function rosterFlair(r) { return r.flair || r.tag; }

/** Featured legends — snel kiezen bovenaan character select. */
const VS_FEATURED_IDS = ['ryu', 'ken', 'goku', 'onepunchman', 'aruskankou', 'kutjankorio', 'xavi'];
const SAGA_ICON_IDS = VS_FEATURED_IDS;
const VS_ROSTER_MAX = 20;
const VS_ROSTER_MIGRATE = {
  kiball: 'goku', scrollkid: 'aruskankou', zipcape: 'onepunchman', tidecrew: 'rubber',
  dawnlance: 'lance', spikyki: 'goku', bandana: 'aruskankou', hero: 'stick',
};
function migrateVsRosterId(id) {
  if (!id || typeof id !== 'string') return 'ryu';
  return VS_ROSTER_MIGRATE[id] || id;
}
function sagaIconEntries() {
  return VS_FEATURED_IDS.map(id => vsRosterEntry(id));
}
function pickCharPoolFiltered() {
  const filter = UI.charSagaFilter || 'all';
  let pool = VS_ROSTER.filter(vsUnlocked);
  if (filter !== 'all') pool = pool.filter(r => (r.saga || 'scroll') === filter);
  return pool;
}
function pickSagaIconClash() {
  const icons = sagaIconEntries().filter(vsUnlocked);
  if (icons.length < 2) return null;
  const a = choice(icons);
  const diff = icons.filter(r => r.id !== a.id && r.saga !== a.saga);
  const b = diff.length ? choice(diff) : choice(icons.filter(r => r.id !== a.id));
  return { a, b };
}

const VS_SIG_LABELS = {
  balanced: 'Balanced all-round',
  shuriken: 'Wapen-crit focus',
  assassin: 'Kick-assassin',
  heavy: 'Zware crit-slagen',
  combo: 'Combo-kick chain',
  kenjutsu: 'Kenjutsu crit',
  hitrun: 'Hit & run kicks',
  quak: 'Quak punch',
  rinne: 'Rinne jutsu boost',
  boss: 'Baas-crit',
  storm: 'Storm kicks',
  tank: 'Tank punch + kb',
  reach: 'Reach wapen',
};

function vsSagaUnlockedCounts(sagaId) {
  const list = sagaId === 'all' ? VS_ROSTER : VS_ROSTER.filter(r => (r.saga || 'scroll') === sagaId);
  return { unlocked: list.filter(vsUnlocked).length, total: list.length };
}

function charRosterNextUnlock() {
  for (const r of VS_ROSTER) {
    if (!vsUnlocked(r)) return { name: r.name, hint: vsUnlockHint(r) };
  }
  return null;
}

/** Willekeurig duo met vergelijkbare overall-rating (fair match, geen dmg-tweak). */
function pickBalancedRandomDuo() {
  const pool = pickCharPoolFiltered();
  if (pool.length < 2) return null;
  const rated = pool.map(r => ({ r, rating: vsOverallRating(vsFighterStats(r)) }));
  const a = choice(rated);
  let best = null;
  let bestDiff = 999;
  for (const x of rated) {
    if (x.r.id === a.r.id) continue;
    const d = Math.abs(x.rating - a.rating);
    if (d < bestDiff) { bestDiff = d; best = x; }
  }
  if (!best) {
    const rest = rated.filter(x => x.r.id !== a.r.id);
    best = rest.length ? choice(rest) : null;
  }
  if (!best) return null;
  return { a: a.r, b: best.r, ratingDiff: bestDiff };
}

const VS_ROSTER = [
  { id: 'ryu', name: 'Ryu', tag: 'Street · balanced', saga: 'fighter', flair: 'White gi · hadou stance · all-round',
    styleId: 'classic', weapon: 'vuist', bodyColor: '#f0f0f8', gi: 'white',
    hpMul: 1, spdMul: 1, dmgMul: 1.02, crit: 0.09, critMul: 1.5, sig: 'balanced', unlock: () => true, featured: true },
  { id: 'ken', name: 'Ken', tag: 'Street · fire kicks', saga: 'fighter', flair: 'Red gi · blazing shoryu · combo rush',
    styleId: 'konoha', weapon: 'nunchaku', bodyColor: '#ff5555', gi: 'red',
    hpMul: 0.94, spdMul: 1.1, dmgMul: 1.06, crit: 0.11, critMul: 1.52, sig: 'combo', unlock: () => true, featured: true },
  { id: 'goku', name: 'Goku', tag: 'Ki · melee DPS', saga: 'ki', flair: 'Orange trainee · ki-ball rush · high STR',
    styleId: 'gold', bodyColor: '#ff9a42', weapon: 'donder', special: 'rasengan',
    hpMul: 1.02, spdMul: 1.08, dmgMul: 1.14, crit: 0.09, critMul: 1.55, sig: 'heavy', unlock: () => true, featured: true },
  { id: 'xavi', name: 'Xavi', tag: 'Tide · control', saga: 'tide', flair: 'Midfield maestro · spear reach · tempo passes',
    styleId: 'sand', weapon: 'speer', bodyColor: '#5a8fd4',
    hpMul: 1.04, spdMul: 1.04, dmgMul: 0.98, crit: 0.08, critMul: 1.48, sig: 'reach', unlock: () => true, featured: true },
  { id: 'aruskankou', name: 'Aruskankou', tag: 'Scroll · electric', saga: 'scroll', flair: 'Trainer spark · shuriken storm · crit chain',
    styleId: 'konoha', weapon: 'shuriken', bodyColor: '#ffe259',
    hpMul: 0.92, spdMul: 1.1, dmgMul: 1.0, crit: 0.13, critMul: 1.55, sig: 'shuriken', unlock: () => true, featured: true },
  { id: 'kutjankorio', name: 'Kutjankorio', tag: 'Scroll · fox demon', saga: 'scroll', flair: 'Red chakra fox · void claw · rinne burst',
    styleId: 'fox', weapon: 'void', special: 'rinnegan', bodyColor: '#e84848',
    hpMul: 1.06, spdMul: 1.06, dmgMul: 1.12, crit: 0.11, critMul: 1.6, sig: 'rinne', unlock: () => true, featured: true },
  { id: 'onepunchman', name: 'One Punch Man', tag: 'Cape · bald', saga: 'cape', flair: 'Bald hero · serious punch · one-hit blur',
    styleId: 'classic', weapon: 'vuist', bodyColor: '#ffe8c8', bald: true, gi: 'hero',
    hpMul: 0.82, spdMul: 1.2, dmgMul: 1.18, crit: 0.06, critMul: 2.0, sig: 'heavy', unlock: () => true, featured: true },
  { id: 'stick', name: 'Stick Ninja', tag: 'Balanced', saga: 'scroll', flair: 'Headband rookie · balanced kunai',
    styleId: 'classic', weapon: 'kunai',
    hpMul: 1, spdMul: 1, dmgMul: 1, crit: 0.08, critMul: 1.5, sig: 'balanced', unlock: () => true },
  { id: 'rabbit', name: 'RabbitRobot', tag: 'CPU rival', saga: 'cape', flair: 'Serious bot · training rival · ear lasers',
    styleId: null, weapon: 'vuist', isRobot: true, special: 'chidori',
    hpMul: 1.05, spdMul: 1.05, dmgMul: 1.08, crit: 0.06, critMul: 1.45, unlock: () => true },
  { id: 'rubber', name: 'Rubber Crew', tag: 'Tide · range', saga: 'tide', flair: 'Stretch captain · boomerang reach · range DPS',
    styleId: 'sand', weapon: 'boemerang',
    hpMul: 1.08, spdMul: 0.98, dmgMul: 1.04, crit: 0.07, critMul: 1.48, sig: 'reach', unlock: () => true },
  { id: 'shadow', name: 'Schaduw', tag: 'Chidori', saga: 'scroll', flair: 'Lightning step · chidori charge',
    styleId: 'shadow', weapon: 'zwaard', special: 'chidori',
    hpMul: 1, spdMul: 1.02, dmgMul: 1.06, crit: 0.1, critMul: 1.55, sig: 'assassin', unlock: () => true },
  { id: 'lance', name: 'Holy Lance', tag: 'Dawn · lancer', saga: 'dawn', flair: 'Sin lance · spear reach · holy thrust',
    styleId: 'samurai', weapon: 'speer', special: 'rinnegan',
    hpMul: 1.1, spdMul: 0.96, dmgMul: 1.1, crit: 0.1, critMul: 1.58, sig: 'kenjutsu', unlock: () => true },
  { id: 'barve', name: 'Barve', tag: 'Tank', saga: 'tide', flair: 'Deck brawler · wide club swings',
    styleId: 'classic', weapon: 'knuppel',
    hpMul: 1.22, spdMul: 0.86, dmgMul: 1.1, crit: 0.06, critMul: 1.48, sig: 'tank', unlock: () => true },
  { id: 'konoha', name: 'Konoha', tag: 'Snel', saga: 'scroll', flair: 'Leaf sprint · shuriken flurry',
    styleId: 'konoha', weapon: 'shuriken',
    hpMul: 0.95, spdMul: 1.08, dmgMul: 0.96, crit: 0.08, critMul: 1.48, sig: 'shuriken', unlock: () => true },
  { id: 'storm', name: 'Storm', tag: 'Bliksem', saga: 'ki', flair: 'Thunder charge · ki bolt axe',
    styleId: 'storm', weapon: 'donder', special: 'chidori',
    hpMul: 1, spdMul: 1.1, dmgMul: 1.0, crit: 0.1, critMul: 1.5, sig: 'storm', unlock: () => true },
  { id: 'guvve', name: 'Guvvedukkie', tag: 'Quak', saga: 'tide', flair: 'Quack crew · bonk stick',
    styleId: 'guvve', weapon: 'guvve',
    hpMul: 1.08, spdMul: 0.98, dmgMul: 1.14, crit: 0.05, critMul: 1.55, sig: 'quak', unlock: () => true },
  { id: 'samurai', name: 'Samurai', tag: 'Kenjutsu', saga: 'dawn', flair: 'Blade oath · crit cuts',
    styleId: 'samurai', weapon: 'zwaard',
    hpMul: 1.05, spdMul: 0.98, dmgMul: 1.08, crit: 0.09, critMul: 1.52, sig: 'kenjutsu', unlock: () => true },
  { id: 'akatsuki', name: 'Akatsuki', tag: 'Rinne', saga: 'dawn', flair: 'Crimson cloak · rinne pressure',
    styleId: 'akatsuki', weapon: 'ketting', special: 'rinnegan',
    hpMul: 1.1, spdMul: 0.96, dmgMul: 1.1, crit: 0.1, critMul: 1.55, sig: 'rinne', unlock: () => true },
  { id: 'cyber', name: 'Cyber', tag: 'Laser', saga: 'scroll', flair: 'Visor ninja · laser kunai',
    styleId: 'cyber', weapon: 'laser', special: 'chidori',
    hpMul: 0.92, spdMul: 1.06, dmgMul: 1.05, crit: 0.09, critMul: 1.52, sig: 'shuriken', unlock: () => true },
  { id: 'void', name: 'Void', tag: 'Rinnegan', saga: 'dawn', flair: 'Void sin · gravity rip',
    styleId: 'void', weapon: 'void', special: 'rinnegan',
    hpMul: 1.12, spdMul: 1.04, dmgMul: 1.14, crit: 0.12, critMul: 1.65, sig: 'rinne', unlock: () => true },
];
const vsRosterEntry = id => {
  id = migrateVsRosterId(id);
  return VS_ROSTER.find(r => r.id === id) || VS_ROSTER[0];
};
function vsUnlocked(r) { return !r.unlock || r.unlock(); }
function vsUnlockHint(r) {
  if (!r || vsUnlocked(r)) return '';
  return 'Keep playing to unlock';
}
function normalizeVsPick(id, fallback) {
  id = migrateVsRosterId(id);
  fallback = migrateVsRosterId(fallback);
  const r = vsRosterEntry(id);
  if (r.id === id && vsUnlocked(r)) return id;
  const fb = vsRosterEntry(fallback);
  return vsUnlocked(fb) ? fallback : 'ryu';
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

function systemPrefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; }
}
function systemPrefersMoreContrast() {
  try { return window.matchMedia('(prefers-contrast: more)').matches; } catch (_) { return false; }
}
function motionReduced() {
  return !!save.reducedMotion || systemPrefersReducedMotion();
}
function a11yHighContrast() {
  return !!save.highContrast || systemPrefersMoreContrast() || motionReduced();
}
function syncA11yClasses() {
  document.body.classList.toggle('reduced-motion', motionReduced());
  document.body.classList.toggle('high-contrast', a11yHighContrast());
}
function a11yStatusText() {
  const bits = [];
  if (motionReduced()) {
    bits.push(save.reducedMotion ? t('settings.a11yMotionOn') : t('settings.a11yMotionOs'));
  }
  if (a11yHighContrast()) {
    bits.push(save.highContrast ? t('settings.a11yContrastOn') : t('settings.a11yContrastOs'));
  }
  return bits.length ? bits.join(' · ') : t('settings.a11yDefault');
}
function refreshA11yUi() {
  syncA11yClasses();
  try {
    const el = document.getElementById('a11yStatusLine');
    if (el) el.textContent = a11yStatusText();
    const active = document.getElementById('settingsScreen')?.classList.contains('active');
    if (active && typeof UI !== 'undefined' && UI.renderSettings) UI.renderSettings();
  } catch (_) {}
}

/** Canvas HUD-tekst met optionele stroke bij hoog contrast (geen flits). */
function fillHudText(c, text, x, y, opts) {
  opts = opts || {};
  const align = opts.align || c.textAlign || 'center';
  c.textAlign = align;
  const fill = opts.fill || '#fff';
  if (a11yHighContrast()) {
    c.lineWidth = opts.strokeW || 3.5;
    c.strokeStyle = opts.stroke || 'rgba(0,0,0,.88)';
    c.strokeText(text, x, y);
  }
  c.fillStyle = fill;
  c.fillText(text, x, y);
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
    rosterId: entry.id,
    bald: !!entry.bald,
    gi: entry.gi || null,
  });
  if (entry.isRobot) f.isRobot = true;
  f.energy = 35;
  return f;
}

function applyVsArenaBounds(game) {
  const pad = Math.max(28, W * 0.04);
  const gap = Math.max(32, W * 0.035);
  game.vsMid = W * 0.5;
  game.p1MaxX = game.vsMid - gap * 0.5;
  game.p2MinX = game.vsMid + gap * 0.5;
  game.minX = pad;
  game.maxX = W - pad;
}

function fighterMoveXBounds(f, game) {
  let min = game.minX ?? 40;
  let max = game.maxX ?? W - 40;
  if (game.mode === 'wall' && f.isPlayer && game.wallX != null) {
    const cols = game.wallCols || 4;
    const bw = game.wallBrickW || 62;
    const wallFace = game.wallX + cols * bw;
    max = Math.min(max, wallFace - 12);
  }
  if (game.mode === 'versus' && f.playerSlot === 1) max = Math.min(max, game.p1MaxX ?? max);
  if (game.mode === 'versus' && f.playerSlot === 2) min = Math.max(min, game.p2MinX ?? min);
  return { min, max };
}

function clampFighterX(f, game, x) {
  const b = fighterMoveXBounds(f, game);
  return clamp(x, b.min, b.max);
}

/** Beweging — hardened: snappy keyboard-turn, analog joy, lichte hurt-control. */
const MOVE_ACCEL = 0.00068;
const MOVE_FLIP_ACCEL = 0.0048;
const MOVE_DIGITAL_ACCEL_MUL = 2.4;
const MOVE_STOP_DECAY = 0.0018;
const MOVE_AIR_MUL = 0.78;
const MOVE_ATTACK_RECOVER_MUL = 0.76;
const MOVE_HURT_MUL = 0.88;

function padDigitalMove(pad) {
  if (!pad) return 0;
  let m = 0;
  if (pad.side === 'p1') {
    if (Input.dualMode) {
      if (pad.keys['a']) m -= 1;
      if (pad.keys['d']) m += 1;
    } else {
      if (pad.keys['arrowleft'] || pad.keys['a']) m -= 1;
      if (pad.keys['arrowright'] || pad.keys['d']) m += 1;
    }
  } else {
    if (pad.keys['arrowleft']) m -= 1;
    if (pad.keys['arrowright']) m += 1;
  }
  return clamp(m, -1, 1);
}

function joyMoveAxis(pad) {
  if (!pad || !pad.joy.active) return 0;
  const jx = pad.joy.dx;
  if (Math.abs(jx) < JOY_DEAD_PX) return 0;
  const t = clamp(jx / JOY_MAX_PX, -1, 1);
  return Math.sign(t) * Math.pow(Math.abs(t), 0.78);
}

function applyFighterMove(f, mv, dt, opts) {
  opts = opts || {};
  const canAct = opts.canAct !== false;
  let targetVx = mv * f.speed;
  if (!f.onGround) targetVx *= MOVE_AIR_MUL;

  const flip = f.vx !== 0 && mv !== 0 && Math.sign(f.vx) !== Math.sign(mv);
  let accel = flip ? MOVE_FLIP_ACCEL : MOVE_ACCEL;
  if (f.isPlayer || f.playerSlot) accel *= flip ? 1.3 : 1.14;
  if (opts.digital) accel *= MOVE_DIGITAL_ACCEL_MUL;

  if (flip && f.onGround && Math.abs(f.vx) > 30) {
    f.vx *= opts.digital ? 0.1 : 0.16;
  }

  const lerpPow = opts.digital && canAct && Math.abs(mv) > 0.45 ? accel * 2.5 : accel;
  f.vx = lerp(f.vx, targetVx, 1 - Math.pow(lerpPow, dt));

  if (flip && canAct && Math.abs(mv) > 0.1 && f.onGround) {
    f.vx += mv * f.speed * (opts.digital ? 0.34 : 0.24);
  }
  if (canAct && Math.abs(mv) < 0.035 && f.onGround) {
    f.vx = lerp(f.vx, 0, 1 - Math.pow(MOVE_STOP_DECAY, dt));
  }
  if (Math.abs(mv) > 0.05) f.face = mv > 0 ? 1 : -1;
}

function vsSpawnX(slot) {
  const pad = Math.max(40, W * 0.08);
  const usable = Math.max(80, W - pad * 2);
  return slot === 1 ? pad + usable * 0.2 : W - pad - usable * 0.2;
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
  f.invulnT = 0.55;
  // alive is een getter (hp > 0) — hp is hierboven al gereset
  f.hitFlashT = 0;
  f.afterimages = [];
  f.dashCd = 0;
  resetWeaponCombo(f);
}

let vsSelect = { p1: 'ryu', p2: 'ken' };

/* --- src/data/monsters.js --- */
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
  /* --- Deel 1/2 horde-expansie: +40 soorten --- */
  moerasly:    { name: 'Moerasly',    art: 'slime',    size: 16, hp: 32,  dmg: 6,  speed: 58,  type: 'hop',    xp: 8,  rarity: 'common',    c1: '#4a8f52', c2: '#1e4a28' },
  paddensly:   { name: 'Paddensly',   art: 'slime',    size: 18, hp: 36,  dmg: 7,  speed: 52,  type: 'hop',    xp: 10, rarity: 'uncommon',  c1: '#7ad06a', c2: '#3a7a42' },
  giftbub:     { name: 'Giftbub',     art: 'slime',    size: 15, hp: 30,  dmg: 8,  speed: 64,  type: 'hop',    xp: 11, rarity: 'uncommon',  c1: '#b06ae0', c2: '#5a3080' },
  frostbub:    { name: 'Frostbub',    art: 'slime',    size: 17, hp: 42,  dmg: 9,  speed: 62,  type: 'hop',    xp: 14, rarity: 'rare',      c1: '#a8e0ff', c2: '#3a7fc0' },
  lavablob:    { name: 'Lavablo',     art: 'slime',    size: 19, hp: 55,  dmg: 11, speed: 55,  type: 'hop',    xp: 20, rarity: 'epic',      c1: '#ff7043', c2: '#8a2818' },
  toxbub:      { name: 'Toxbub',      art: 'slime',    size: 18, hp: 48,  dmg: 10, speed: 60,  type: 'hop',    xp: 17, rarity: 'rare',      c1: '#9fd06a', c2: '#4a7030' },
  voidsly:     { name: 'Voidsly',     art: 'slime',    size: 20, hp: 88,  dmg: 14, speed: 68,  type: 'hop',    xp: 42, rarity: 'mythic',    c1: '#5a1040', c2: '#ff6b9d' },
  dwergvleerm: { name: 'Dwergvleerm', art: 'bat',      size: 12, hp: 20,  dmg: 5,  speed: 105, type: 'fly',    xp: 8,  rarity: 'common',    c1: '#6b7690', c2: '#3a4258' },
  piekbout:    { name: 'Piekbout',    art: 'hedgehog', size: 14, hp: 36,  dmg: 8,  speed: 72,  type: 'charge', xp: 10, rarity: 'common',    c1: '#a3763f', c2: '#6b4a28' },
  koperblik:   { name: 'Koperblik',   art: 'can',      size: 15, hp: 42,  dmg: 7,  speed: 48,  type: 'shoot',  xp: 9,  rarity: 'common',    c1: '#c98850', c2: '#7a5030' },
  nachtschaduw:{ name: 'Nachtschaduw',art: 'bat',      size: 14, hp: 26,  dmg: 6,  speed: 100, type: 'fly',    xp: 10, rarity: 'uncommon',  c1: '#2a1840', c2: '#5a3fb0' },
  kegelbeest:  { name: 'Kegelbeest',  art: 'hedgehog', size: 16, hp: 44,  dmg: 10, speed: 68,  type: 'charge', xp: 13, rarity: 'uncommon',  c1: '#d4a574', c2: '#8a6030' },
  roestblik:   { name: 'Roestblik',   art: 'can',      size: 16, hp: 50,  dmg: 9,  speed: 46,  type: 'shoot',  xp: 12, rarity: 'uncommon',  c1: '#b86a4a', c2: '#6a3820' },
  zandgeest:   { name: 'Zandgeest',   art: 'ghost',    size: 15, hp: 36,  dmg: 7,  speed: 52,  type: 'shoot',  xp: 11, rarity: 'uncommon',  c1: '#e8c98a', c2: '#8a6030' },
  mistgeest:   { name: 'Mistgeest',   art: 'ghost',    size: 17, hp: 38,  dmg: 8,  speed: 54,  type: 'shoot',  xp: 12, rarity: 'uncommon',  c1: '#dfe8ff', c2: '#7aa8cf' },
  ijsvos:      { name: 'Ijsvos',      art: 'fox',      size: 16, hp: 42,  dmg: 10, speed: 125, type: 'charge', xp: 14, rarity: 'uncommon',  c1: '#a8e0ff', c2: '#3a7fc0' },
  oervaamp:    { name: 'Oervaamp',    art: 'bat',      size: 15, hp: 28,  dmg: 7,  speed: 108, type: 'fly',    xp: 13, rarity: 'rare',      c1: '#ffd75e', c2: '#c97a20' },
  kristaldrek: { name: 'Kristaldrek', art: 'hedgehog', size: 17, hp: 56,  dmg: 12, speed: 66,  type: 'charge', xp: 17, rarity: 'rare',      c1: '#6fd7ff', c2: '#2f7fc0' },
  plasmafles:  { name: 'Plasmafles',  art: 'can',      size: 18, hp: 62,  dmg: 13, speed: 52,  type: 'shoot',  xp: 19, rarity: 'rare',      c1: '#7cf5ff', c2: '#2a7fc0' },
  zielenschemer:{ name: 'Zielenschemer', art: 'ghost', size: 18, hp: 52,  dmg: 10, speed: 50,  type: 'shoot',  xp: 17, rarity: 'rare',      c1: '#c47aff', c2: '#5a2080' },
  bliksemvos:  { name: 'Bliksemvos',  art: 'fox',      size: 17, hp: 52,  dmg: 12, speed: 145, type: 'charge', xp: 20, rarity: 'rare',      c1: '#ffe259', c2: '#c97a20' },
  granietkolos:{ name: 'Granietkolos',art: 'golem',    size: 26, hp: 105, dmg: 15, speed: 32,  type: 'tank',   xp: 22, rarity: 'rare',      c1: '#8a8478', c2: '#5a5548' },
  gloeidrake:  { name: 'Gloeidrake',  art: 'dragon',   size: 28, hp: 155, dmg: 17, speed: 72,  type: 'dragon', xp: 28, rarity: 'rare',      c1: '#ff9a42', c2: '#c04018' },
  stormer:     { name: 'Stormer',     art: 'bat',      size: 16, hp: 32,  dmg: 9,  speed: 118, type: 'fly',    xp: 18, rarity: 'epic',      c1: '#7cf5ff', c2: '#2a7fc0' },
  thorndrake:  { name: 'Thorndrake',  art: 'hedgehog', size: 18, hp: 68,  dmg: 13, speed: 70,  type: 'charge', xp: 22, rarity: 'epic',      c1: '#5ad06a', c2: '#2a6030' },
  stoomkan:    { name: 'Stoomkan',    art: 'can',      size: 18, hp: 66,  dmg: 14, speed: 48,  type: 'shoot',  xp: 21, rarity: 'epic',      c1: '#dfe8ff', c2: '#6a7080' },
  banjaa:      { name: 'Banjaa',      art: 'ghost',    size: 19, hp: 62,  dmg: 12, speed: 48,  type: 'shoot',  xp: 22, rarity: 'epic',      c1: '#ffb0b8', c2: '#8a3040' },
  asvos:       { name: 'Asvos',       art: 'fox',      size: 18, hp: 58,  dmg: 14, speed: 148, type: 'charge', xp: 26, rarity: 'epic',      c1: '#9a917f', c2: '#4a4038' },
  sliksteen:   { name: 'Sliksteen',   art: 'golem',    size: 29, hp: 145, dmg: 19, speed: 29,  type: 'tank',   xp: 32, rarity: 'epic',      c1: '#6b5344', c2: '#3a2820' },
  stormwyrm:   { name: 'Stormwyrm',   art: 'dragon',   size: 32, hp: 195, dmg: 19, speed: 88,  type: 'dragon', xp: 38, rarity: 'epic',      c1: '#6fd7ff', c2: '#2a5080' },
  schimmervleerm:{ name: 'Schimmervleerm', art: 'bat', size: 17, hp: 38,  dmg: 10, speed: 112, type: 'fly',    xp: 24, rarity: 'legendary', c1: '#b06ae0', c2: '#5a2080' },
  ijzerklauw:  { name: 'Ijzerklauw',  art: 'hedgehog', size: 19, hp: 78,  dmg: 14, speed: 68,  type: 'charge', xp: 28, rarity: 'legendary', c1: '#9fb2c8', c2: '#4a5568' },
  ethergeest:  { name: 'Ethergeest',  art: 'ghost',    size: 20, hp: 72,  dmg: 13, speed: 46,  type: 'shoot',  xp: 30, rarity: 'legendary', c1: '#7cf5ff', c2: '#2a7fc0' },
  vuurstorm:   { name: 'Vuurstorm',   art: 'fox',      size: 19, hp: 68,  dmg: 15, speed: 152, type: 'charge', xp: 32, rarity: 'legendary', c1: '#ff7043', c2: '#a02818' },
  obsidianaut: { name: 'Obsidianaut', art: 'golem',    size: 30, hp: 165, dmg: 21, speed: 27,  type: 'tank',   xp: 40, rarity: 'legendary', c1: '#2a1840', c2: '#6a5080' },
  titanbonk:   { name: 'Titanbonk',   art: 'golem',    size: 32, hp: 185, dmg: 22, speed: 26,  type: 'tank',   xp: 44, rarity: 'legendary', c1: '#ffd75e', c2: '#8a6020' },
  zeewyrm:     { name: 'Zeewyrm',     art: 'dragon',   size: 35, hp: 260, dmg: 22, speed: 92,  type: 'dragon', xp: 55, rarity: 'legendary', c1: '#4a9fff', c2: '#1a4080' },
  neondrake:   { name: 'Neondrake',   art: 'dragon',   size: 36, hp: 310, dmg: 24, speed: 98,  type: 'dragon', xp: 72, rarity: 'mythic',    c1: '#7cf5ff', c2: '#ff6b9d' },
  etherwyrm:   { name: 'Etherwyrm',   art: 'dragon',   size: 37, hp: 360, dmg: 26, speed: 102, type: 'dragon', xp: 88, rarity: 'mythic',    c1: '#c47aff', c2: '#2a1840' },
  omegadrake:  { name: 'Omegadrake',  art: 'dragon',   size: 39, hp: 400, dmg: 27, speed: 105, type: 'dragon', xp: 120, rarity: 'mythic',   c1: '#ffe259', c2: '#e04f4f' },
  /* --- Deel 2/2 horde-expansie: +55 soorten (114 totaal = 6× bestiary) --- */
    kleiply: { name: 'Kleiply', art: 'slime', size: 15, hp: 30, dmg: 5, speed: 56, type: 'hop', xp: 7, rarity: 'common', c1: '#4a8f52', c2: '#1e4a28' },
    spinbub: { name: 'Spinbub', art: 'slime', size: 15, hp: 32, dmg: 6, speed: 58, type: 'hop', xp: 8, rarity: 'common', c1: '#7ad06a', c2: '#3a7a42' },
    hongerly: { name: 'Hongerly', art: 'slime', size: 16, hp: 38, dmg: 7, speed: 60, type: 'hop', xp: 10, rarity: 'uncommon', c1: '#b06ae0', c2: '#5a3080' },
    parelsly: { name: 'Parelsly', art: 'slime', size: 17, hp: 39, dmg: 6, speed: 62, type: 'hop', xp: 10, rarity: 'uncommon', c1: '#a8e0ff', c2: '#3a7fc0' },
    modderblob: { name: 'Modderblob', art: 'slime', size: 17, hp: 41, dmg: 8, speed: 64, type: 'hop', xp: 12, rarity: 'rare', c1: '#ff7043', c2: '#8a2818' },
    crystalbub: { name: 'Crystalbub', art: 'slime', size: 15, hp: 48, dmg: 9, speed: 65, type: 'hop', xp: 14, rarity: 'epic', c1: '#6fd7ff', c2: '#2f7fc0' },
    chaosly: { name: 'Chaosly', art: 'slime', size: 16, hp: 58, dmg: 10, speed: 58, type: 'hop', xp: 19, rarity: 'legendary', c1: '#ffd75e', c2: '#8a6020' },
    zwerm: { name: 'Zwerm', art: 'bat', size: 13, hp: 24, dmg: 5, speed: 105, type: 'fly', xp: 8, rarity: 'common', c1: '#6b7690', c2: '#3a4258' },
    karmijnvleerm: { name: 'Karmijnvleerm', art: 'bat', size: 14, hp: 26, dmg: 6, speed: 108, type: 'fly', xp: 9, rarity: 'common', c1: '#8a6cf0', c2: '#5a3fb0' },
    echovleerm: { name: 'Echovleerm', art: 'bat', size: 15, hp: 31, dmg: 6, speed: 96, type: 'fly', xp: 11, rarity: 'uncommon', c1: '#2a1840', c2: '#5a3fb0' },
    spiegelvleerm: { name: 'Spiegelvleerm', art: 'bat', size: 15, hp: 32, dmg: 7, speed: 99, type: 'fly', xp: 12, rarity: 'uncommon', c1: '#ff9ad5', c2: '#c04590' },
    voidvleerm: { name: 'Voidvleerm', art: 'bat', size: 13, hp: 34, dmg: 8, speed: 102, type: 'fly', xp: 13, rarity: 'rare', c1: '#7cf5ff', c2: '#2a7fc0' },
    duskwing: { name: 'Duskwing', art: 'bat', size: 14, hp: 46, dmg: 10, speed: 108, type: 'fly', xp: 20, rarity: 'legendary', c1: '#ffd75e', c2: '#c97a20' },
    glimwing: { name: 'Glimwing', art: 'bat', size: 16, hp: 58, dmg: 13, speed: 111, type: 'fly', xp: 28, rarity: 'mythic', c1: '#b06ae0', c2: '#5a2080' },
    bronzenstek: { name: 'Bronzenstek', art: 'hedgehog', size: 15, hp: 40, dmg: 9, speed: 68, type: 'charge', xp: 10, rarity: 'common', c1: '#a3763f', c2: '#6b4a28' },
    koperstek: { name: 'Koperstek', art: 'hedgehog', size: 16, hp: 42, dmg: 8, speed: 70, type: 'charge', xp: 11, rarity: 'common', c1: '#c98850', c2: '#8a5a30' },
    froststek: { name: 'Froststek', art: 'hedgehog', size: 16, hp: 49, dmg: 10, speed: 72, type: 'charge', xp: 13, rarity: 'uncommon', c1: '#6fd7ff', c2: '#2f7fc0' },
    kolossstek: { name: 'Kolossstek', art: 'hedgehog', size: 14, hp: 52, dmg: 10, speed: 64, type: 'charge', xp: 14, rarity: 'rare', c1: '#5ad06a', c2: '#2a6030' },
    thornox: { name: 'Thornox', art: 'hedgehog', size: 15, hp: 62, dmg: 13, speed: 66, type: 'charge', xp: 18, rarity: 'epic', c1: '#9fb2c8', c2: '#4a5568' },
    spineclaw: { name: 'Spineclaw', art: 'hedgehog', size: 16, hp: 76, dmg: 16, speed: 68, type: 'charge', xp: 24, rarity: 'legendary', c1: '#ffd75e', c2: '#8a6020' },
    quillfang: { name: 'Quillfang', art: 'hedgehog', size: 17, hp: 92, dmg: 17, speed: 70, type: 'charge', xp: 34, rarity: 'mythic', c1: '#ff6b9d', c2: '#5a1040' },
    spookvlam: { name: 'Spookvlam', art: 'ghost', size: 15, hp: 38, dmg: 7, speed: 52, type: 'shoot', xp: 11, rarity: 'uncommon', c1: '#cfe6ff', c2: '#7aa8cf' },
    koudspook: { name: 'Koudspook', art: 'ghost', size: 16, hp: 44, dmg: 9, speed: 54, type: 'shoot', xp: 14, rarity: 'rare', c1: '#6b5cff', c2: '#2e2266' },
    spiraalgeest: { name: 'Spiraalgeest', art: 'ghost', size: 17, hp: 46, dmg: 9, speed: 50, type: 'shoot', xp: 15, rarity: 'rare', c1: '#c47aff', c2: '#5a2080' },
    wispgeest: { name: 'Wispgeest', art: 'ghost', size: 16, hp: 54, dmg: 11, speed: 50, type: 'shoot', xp: 17, rarity: 'epic', c1: '#ffb0b8', c2: '#8a3040' },
    nexusgeest: { name: 'Nexusgeest', art: 'ghost', size: 17, hp: 68, dmg: 12, speed: 54, type: 'shoot', xp: 22, rarity: 'legendary', c1: '#7cf5ff', c2: '#2a7fc0' },
    mistwraith: { name: 'Mistwraith', art: 'ghost', size: 18, hp: 72, dmg: 14, speed: 55, type: 'shoot', xp: 26, rarity: 'mythic', c1: '#2a1840', c2: '#b06ae0' },
    palewraith: { name: 'Palewraith', art: 'ghost', size: 16, hp: 56, dmg: 10, speed: 52, type: 'shoot', xp: 18, rarity: 'epic', c1: '#dfe8ff', c2: '#6a7080' },
    olieblik: { name: 'Olieblik', art: 'can', size: 15, hp: 44, dmg: 7, speed: 48, type: 'shoot', xp: 9, rarity: 'common', c1: '#c98850', c2: '#7a5030' },
    batterijkan: { name: 'Batterijkan', art: 'can', size: 16, hp: 46, dmg: 8, speed: 46, type: 'shoot', xp: 10, rarity: 'common', c1: '#9fb2c8', c2: '#5f7189' },
    schrootblik: { name: 'Schrootblik', art: 'can', size: 16, hp: 52, dmg: 9, speed: 47, type: 'shoot', xp: 12, rarity: 'uncommon', c1: '#b86a4a', c2: '#6a3820' },
    turboblok: { name: 'Turboblok', art: 'can', size: 17, hp: 58, dmg: 11, speed: 49, type: 'shoot', xp: 15, rarity: 'rare', c1: '#ff6b6b', c2: '#8a2020' },
    ionkan: { name: 'Ionkan', art: 'can', size: 18, hp: 64, dmg: 13, speed: 51, type: 'shoot', xp: 18, rarity: 'epic', c1: '#7cf5ff', c2: '#2a7fc0' },
    quantumkan: { name: 'Quantumkan', art: 'can', size: 18, hp: 72, dmg: 14, speed: 50, type: 'shoot', xp: 22, rarity: 'legendary', c1: '#ffd75e', c2: '#c97a20' },
    omegacan: { name: 'Omegacan', art: 'can', size: 19, hp: 82, dmg: 16, speed: 48, type: 'shoot', xp: 28, rarity: 'mythic', c1: '#c47aff', c2: '#5a2080' },
    zilvervos: { name: 'Zilvervos', art: 'fox', size: 16, hp: 44, dmg: 10, speed: 125, type: 'charge', xp: 13, rarity: 'uncommon', c1: '#dfe8ff', c2: '#6a7080' },
    maanvos: { name: 'Maanvos', art: 'fox', size: 16, hp: 50, dmg: 11, speed: 130, type: 'charge', xp: 16, rarity: 'rare', c1: '#ffe259', c2: '#c97a20' },
    jadevos: { name: 'Jadevos', art: 'fox', size: 17, hp: 52, dmg: 12, speed: 132, type: 'charge', xp: 17, rarity: 'rare', c1: '#43b25b', c2: '#2a6030' },
    stellarvos: { name: 'Stellarvos', art: 'fox', size: 17, hp: 58, dmg: 14, speed: 138, type: 'charge', xp: 20, rarity: 'epic', c1: '#ff7043', c2: '#a02818' },
    kosmischvos: { name: 'Kosmischvos', art: 'fox', size: 18, hp: 66, dmg: 15, speed: 142, type: 'charge', xp: 24, rarity: 'legendary', c1: '#7cf5ff', c2: '#2a7fc0' },
    emberfox: { name: 'Emberfox', art: 'fox', size: 17, hp: 60, dmg: 13, speed: 135, type: 'charge', xp: 21, rarity: 'epic', c1: '#ff8c42', c2: '#d05a1e' },
    shadowfox: { name: 'Shadowfox', art: 'fox', size: 19, hp: 78, dmg: 18, speed: 145, type: 'charge', xp: 30, rarity: 'mythic', c1: '#5a1040', c2: '#ff6b9d' },
    leisteen: { name: 'Leisteen', art: 'golem', size: 25, hp: 98, dmg: 14, speed: 31, type: 'tank', xp: 20, rarity: 'uncommon', c1: '#8a8478', c2: '#5a5548' },
    marmerbonk: { name: 'Marmerbonk', art: 'golem', size: 26, hp: 108, dmg: 15, speed: 30, type: 'tank', xp: 22, rarity: 'rare', c1: '#9a917f', c2: '#6b6355' },
    koraalbonk: { name: 'Koraalbonk', art: 'golem', size: 27, hp: 115, dmg: 16, speed: 29, type: 'tank', xp: 24, rarity: 'rare', c1: '#e8c98a', c2: '#8a6030' },
    barnsteen: { name: 'Barnsteen', art: 'golem', size: 28, hp: 132, dmg: 18, speed: 28, type: 'tank', xp: 28, rarity: 'epic', c1: '#ff7043', c2: '#8a2020' },
    adamantbonk: { name: 'Adamantbonk', art: 'golem', size: 29, hp: 158, dmg: 20, speed: 27, type: 'tank', xp: 34, rarity: 'legendary', c1: '#2a1840', c2: '#6a5080' },
    basaltbonk: { name: 'Basaltbonk', art: 'golem', size: 28, hp: 138, dmg: 19, speed: 28, type: 'tank', xp: 30, rarity: 'epic', c1: '#9fb2c8', c2: '#4a5568' },
    titanrock: { name: 'Titanrock', art: 'golem', size: 31, hp: 175, dmg: 22, speed: 26, type: 'tank', xp: 38, rarity: 'mythic', c1: '#ffd75e', c2: '#8a6020' },
    mistwyrm: { name: 'Mistwyrm', art: 'dragon', size: 28, hp: 165, dmg: 17, speed: 76, type: 'dragon', xp: 26, rarity: 'rare', c1: '#6fd7ff', c2: '#2a5080' },
    sandwyrm: { name: 'Sandwyrm', art: 'dragon', size: 29, hp: 172, dmg: 18, speed: 78, type: 'dragon', xp: 28, rarity: 'rare', c1: '#e8c98a', c2: '#8a6030' },
    frostwyrm: { name: 'Frostwyrm', art: 'dragon', size: 30, hp: 188, dmg: 19, speed: 82, type: 'dragon', xp: 32, rarity: 'epic', c1: '#a8e0ff', c2: '#3a7fc0' },
    chaoswyrm: { name: 'Chaoswyrm', art: 'dragon', size: 32, hp: 225, dmg: 22, speed: 88, type: 'dragon', xp: 42, rarity: 'legendary', c1: '#b06ae0', c2: '#5a2080' },
    prismewyrm: { name: 'Prismewyrm', art: 'dragon', size: 33, hp: 240, dmg: 23, speed: 90, type: 'dragon', xp: 48, rarity: 'legendary', c1: '#7cf5ff', c2: '#ff6b9d' },
    apexwyrm: { name: 'Apexwyrm', art: 'dragon', size: 35, hp: 285, dmg: 25, speed: 95, type: 'dragon', xp: 58, rarity: 'mythic', c1: '#ffe259', c2: '#e04f4f' },
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
  moerasly: 1, dwergvleerm: 2, piekbout: 2, koperblik: 3, paddensly: 4, giftbub: 5,
  kegelbeest: 5, roestblik: 6, zandgeest: 7, mistgeest: 8, ijsvos: 9, toxbub: 10,
  nachtschaduw: 11, oervaamp: 12, kristaldrek: 13, plasmafles: 14, zielenschemer: 15,
  bliksemvos: 16, granietkolos: 17, gloeidrake: 18, frostbub: 19, lavablob: 20,
  stormer: 21, thorndrake: 22, stoomkan: 23, banjaa: 24, asvos: 25, sliksteen: 26,
  stormwyrm: 27, schimmervleerm: 29, ijzerklauw: 30, ethergeest: 31, vuurstorm: 32,
  obsidianaut: 33, titanbonk: 34, zeewyrm: 36, voidsly: 38, neondrake: 40,
  etherwyrm: 43, omegadrake: 46,
  kleiply: 1, spinbub: 2, hongerly: 4, parelsly: 6, modderblob: 4, crystalbub: 6, chaosly: 8, zwerm: 10, karmijnvleerm: 7, echovleerm: 9, spiegelvleerm: 11, voidvleerm: 13, duskwing: 11, glimwing: 13, bronzenstek: 15, koperstek: 17, froststek: 14, kolossstek: 16, thornox: 18, spineclaw: 20, quillfang: 18, spookvlam: 20, koudspook: 22, spiraalgeest: 24, wispgeest: 21, nexusgeest: 23, mistwraith: 25, palewraith: 27, olieblik: 25, batterijkan: 27, schrootblik: 29, turboblok: 30, ionkan: 28, quantumkan: 30, omegacan: 32, zilvervos: 34, maanvos: 32, jadevos: 34, stellarvos: 36, kosmischvos: 37, emberfox: 35, shadowfox: 37, leisteen: 39, marmerbonk: 41, koraalbonk: 39, barnsteen: 41, adamantbonk: 43, basaltbonk: 44, titanrock: 42, mistwyrm: 44, sandwyrm: 46, frostwyrm: 48, chaoswyrm: 46, prismewyrm: 48, apexwyrm: 50,

};
/** Avontuur horde: 6× meer spawns + reuzen + volledig monsterboek (114 soorten). */
const ADVENTURE_HORDE_MUL = 6;
const ADVENTURE_HORDE_MAX_PER_WAVE = 36;
const ADVENTURE_MAX_ALIVE = IS_TOUCH ? 54 : 78;
const GIANT_SPAWN_CHANCE = 0.15;
const GIANT_SIZE_MUL = 1.52;
const GIANT_HP_MUL = 1.34;
const GIANT_DMG_MUL = 1.14;
const GIANT_XP_MUL = 1.3;
/** Nood-ontsnapping als je omringd / stunlocked bent — tik midden-KETS! */
const KETSBAM_DETECT_R = 148;
const KETSBAM_NEAR_MIN = 3;
const KETSBAM_BLAST_R = 192;
const KETSBAM_CD = 9;
const KETSBAM_CHARGE_DUR = 2;
const KETSBAM_INVULN = 1.15;
const KETSBAM_SUPER_ARMOR = 0.95;
/** Min. gap tussen speler-hits door contact/projectiles — anti stunlock-keten */
const PLAYER_HURT_CHAIN_CD = 0.42;
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
function scaleKnockback(kb, dmg, opts) {
  opts = opts || {};
  let mul = 1;
  if (dmg >= 22) mul += 0.22;
  else if (dmg >= 18) mul += 0.14;
  else if (dmg >= 12) mul += 0.06;
  if (opts.crit) mul += 0.1;
  if (opts.kind === 'kick') mul += 0.08;
  if (opts.kind === 'special') mul += 0.12;
  return kb * Math.min(mul, 1.38);
}
function applyHitStop(game, spec, opts) {
  if (!game || motionReduced()) return;
  opts = opts || {};
  if (opts.chip) {
    game.freezeT = Math.max(game.freezeT, 0.018);
    return;
  }
  if (opts.playerHurt) {
    if (game.mode === 'adventure' || game.mode === 'training' || game.mode === 'wall') {
      return;
    }
    const dmg = spec && spec.dmg != null ? spec.dmg : 8;
    let base = dmg >= 18 ? 0.018 : 0.01;
    if (opts.heavy) base += 0.004;
    if (game.mode === 'versus') base += 0.004;
    game.freezeT = Math.max(game.freezeT, Math.min(base, 0.028));
    if (opts.heavy || dmg >= 18) {
      try {
        const x = game.player ? game.player.x : (typeof W !== 'undefined' ? W * 0.5 : 0);
        AudioSys.sfxAt('hitstop', x);
      } catch (_) {}
    }
    return;
  }
  const kind = spec && spec.kind ? spec.kind : 'punch';
  let base = kind === 'special' ? 0.052 : kind === 'kick' ? 0.038 : 0.026;
  if (opts.heavy || (spec && spec.dmg >= 18)) base += 0.008;
  if (opts.crit) base += 0.014;
  if (opts.combo >= 6) base += 0.006;
  if (opts.combo >= 10) base += 0.006;
  if (game.mode === 'versus') base += 0.006;
  base = Math.min(base, 0.072);
  game.freezeT = Math.max(game.freezeT, base);
  if (opts.crit || opts.heavy || (spec && spec.dmg >= 18)) {
    try {
      const x = game.player ? game.player.x : (typeof W !== 'undefined' ? W * 0.5 : 0);
      AudioSys.sfxAt('hitstop', x);
    } catch (_) {}
  }
}
function isBossWave(level, waveIdx) {
  return !!(level && level.boss && waveIdx === level.waves.length - 1);
}

function rollWaveGiant(n, elite) {
  if (elite || n < 2) return false;
  return Math.random() < GIANT_SPAWN_CHANCE;
}

function buildLevel(n) {
  const hpMul = 1 + (n - 1) * 0.14;
  const dmgMul = 1 + (n - 1) * 0.08;
  const maxRarity = n >= 45 ? 5 : n >= 32 ? 4 : n >= 20 ? 3 : n >= 10 ? 2 : n >= 4 ? 1 : 0;
  const fightPool = Object.keys(UNLOCK_AT).filter(id =>
    UNLOCK_AT[id] <= n && rarityOf(SPECIES[id].rarity).order <= maxRarity && id !== 'guvvedrak'
  );
  const pool = fightPool.length ? fightPool : ['slymo'];
  const flyPool = pool.filter((id) => {
    const t = SPECIES[id] && SPECIES[id].type;
    return t === 'fly' || t === 'dragon';
  });
  const waves = [];
  const waveMeta = [];
  const waveCount = Math.min(2 + Math.floor(n / 5), 5);
  const basePerWave = 2 + Math.floor(n / 4);
  const perWave = Math.min(Math.max(2, Math.ceil(basePerWave * ADVENTURE_HORDE_MUL)), ADVENTURE_HORDE_MAX_PER_WAVE);
  for (let w = 0; w < waveCount; w++) {
    const list = [];
    for (let i = 0; i < perWave; i++) {
      const sp = weightedPick(pool, n);
      const rareElite = rarityOf(SPECIES[sp].rarity).order >= 3 && Math.random() < 0.14;
      list.push({ sp, elite: rareElite, giant: rollWaveGiant(n, rareElite) });
    }
    const meta = { trait: null, spawnMul: 1, label: '' };
    const roll = Math.random();
    if (flyPool.length && n >= 3 && roll < 0.22) {
      list[Math.floor(Math.random() * list.length)].sp = weightedPick(flyPool, n);
      meta.trait = 'flyers';
      meta.label = 'Vliegers — mik omhoog!';
    } else if (roll < 0.38) {
      meta.trait = 'rush';
      meta.spawnMul = 0.76;
      meta.label = 'Rush-golf';
    } else if (n >= 7 && roll < 0.52) {
      const sp = weightedPick(pool, n);
      list.push({ sp, elite: true, giant: rollWaveGiant(n, true) });
      meta.trait = 'elite';
      meta.label = 'Extra elite';
    }
    waves.push(list);
    waveMeta.push(meta);
  }
  if (BOSS_AT[n]) {
    const bossWave = BOSS_AT[n].map(x => Object.assign({}, x));
    const hordePad = Math.min(3 + Math.floor(n / 8), 10);
    for (let i = 0; i < hordePad; i++) {
      const elite = Math.random() < 0.1;
      bossWave.push({ sp: weightedPick(pool, n), elite, giant: rollWaveGiant(n, elite) });
    }
    waves.push(bossWave);
    waveMeta.push({ trait: 'boss', spawnMul: 1, label: 'Baas-golf' });
  }
  const theme = WORLD_THEMES[n - 1] || 'cyber';
  const rarityCap = ['common','uncommon','rare','epic','legendary','mythic'][maxRarity];
  return { n, waves, waveMeta, hpMul, dmgMul, theme, boss: !!BOSS_AT[n], rarityCap };
}

const WAVE_TRAIT_BANNER = {
  flyers: { text: 'VLIEGER-GOLF', color: '#c47aff', size: 40 },
  rush: { text: 'RUSH-GOLF', color: '#ffb06a', size: 40 },
  elite: { text: 'ELITE-GOLF', color: '#ffb0b8', size: 40 },
};

/** Avontuur: 2× d6 gok vóór level — super-baas of super-bondgenoot (alleen dit level). */
const GAMBLE_ALLIES = {
  ki: { id: 'ki', name: 'Ki-sage', dmgMul: 1.2, energyRate: 1.4, color: '#7cf5ff' },
  scroll: { id: 'scroll', name: 'Scroll-meester', dmgMul: 1.16, maxHpBonus: 32, color: '#ffd75e' },
  tide: { id: 'tide', name: 'Tide-elite', dmgMul: 1.14, healBetweenWaves: 0.1, color: '#6ee06e' },
  cape: { id: 'cape', name: 'Cape-held', dmgMul: 1.18, shieldStart: 3.5, color: '#ffb0b8' },
  dawn: { id: 'dawn', name: 'Dawn-waker', dmgMul: 1.24, critBonus: 0.07, color: '#c47aff' },
};
const GAMBLE_ALLY_IDS = Object.keys(GAMBLE_ALLIES);

function pickSuperBossSpecies(levelN) {
  const pool = SPECIES_ORDER.filter((id) => {
    const o = rarityOf(SPECIES[id].rarity).order;
    return o >= 3 && (UNLOCK_AT[id] == null || UNLOCK_AT[id] <= levelN);
  });
  if (!pool.length) return 'magmabon';
  return pool[Math.floor(Math.random() * pool.length)];
}

function rollStageGamble() {
  const d1 = 1 + Math.floor(Math.random() * 6);
  const d2 = 1 + Math.floor(Math.random() * 6);
  const sum = d1 + d2;
  let outcome = 'neutral';
  if (sum <= 3) outcome = 'superBoss';
  else if (sum <= 5) outcome = 'miniBoss';
  else if (sum >= 12) outcome = 'superAlly';
  else if (sum >= 9) outcome = 'ally';
  const allyId = GAMBLE_ALLY_IDS[Math.floor(Math.random() * GAMBLE_ALLY_IDS.length)];
  return { d1, d2, sum, outcome, allyId };
}

function gambleDiceFace(d) {
  return ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][d - 1] || '?';
}

function gambleRollToastLine(g) {
  if (!g) return '';
  const faces = `${gambleDiceFace(g.d1)} ${gambleDiceFace(g.d2)} = ${g.sum}`;
  if (g.outcome === 'neutral') return `${faces} · normaal level`;
  const label = typeof gambleOutcomeLabelFromKey === 'function'
    ? gambleOutcomeLabelFromKey(g).replace(/^[^!]+!?\s*/, '').slice(0, 40)
    : '';
  return label ? `${faces} · ${label}` : faces;
}

function gambleOutcomeLabel(g) {
  if (!g) return '';
  if (g.outcome === 'superBoss') return 'Pech! Super-baas in een willekeurige golf';
  if (g.outcome === 'miniBoss') return 'Risico: extra elite-super in een golf';
  if (g.outcome === 'superAlly') {
    const a = GAMBLE_ALLIES[g.allyId];
    return `Jackpot! Super-bondgenoot: ${a ? a.name : 'Sage'} (sterk buff)`;
  }
  if (g.outcome === 'ally') {
    const a = GAMBLE_ALLIES[g.allyId];
    return `Geluk! Bondgenoot: ${a ? a.name : 'Sage'} (buff dit level)`;
  }
  return 'Neutraal — gewoon level (geen extra gok-effect)';
}

/** Intro-lied + FX voor elite / baas / super-baas (avontuur). */
function triggerSpecialEnemyIntro(game, monster, kind) {
  if (!game || !monster) return;
  const tier = kind || (monster.superBoss ? 'superBoss' : (monster.elite ? 'elite' : 'boss'));
  const name = (monster.sp && monster.sp.name) || 'Baas';
  const rar = rarityOf(monster.sp?.rarity || 'rare');
  const col = tier === 'superBoss' ? '#ffd75e' : (tier === 'boss' ? '#ff6b6b' : (rar.color || '#ffb0b8'));
  monster.introT = tier === 'superBoss' ? 2.4 : (tier === 'boss' ? 2.0 : 1.55);
  monster.introTier = tier;
  const waveKey = `${game.mode || 'x'}:${game.waveIdx}:${tier === 'superBoss' ? 'super' : 'special'}`;
  const firstOfWave = tier === 'superBoss' || game._specialIntroKey !== waveKey;
  if (firstOfWave) game._specialIntroKey = waveKey;

  if (firstOfWave) {
    try {
      if (tier === 'superBoss') {
        AudioSys.sting('superBossIntro');
        AudioSys.play('boss');
        game.banner(`SUPER BAAS — ${name}!`, 2.0, col, 44);
      } else if (tier === 'boss') {
        AudioSys.sting('bossIntro');
        AudioSys.play('boss');
        game.banner(`BAAS — ${name}!`, 1.8, col, 42);
      } else {
        AudioSys.sting('eliteIntro');
        AudioSys.play('elite');
        game.banner(`ELITE — ${name}!`, 1.5, col, 38);
      }
    } catch (_) {}
    try { AudioSys.sfx('roar'); } catch (_) {}
  } else {
    try { game.floater(monster.x, monster.y - monster.size - 20, name, col, 14); } catch (_) {}
  }

  const x = monster.x, y = monster.y - (monster.size || 40) * 0.4;
  const burstN = motionReduced() || fxLite()
    ? 8
    : (firstOfWave ? (tier === 'superBoss' ? 28 : 18) : 8);
  try {
    game.burst(x, y, col, burstN);
    if (firstOfWave) {
      game.burst(x, y, '#fff', Math.ceil(burstN * 0.35));
      spawnFxRing(game, x, y, col, tier === 'superBoss' ? 22 : 14);
      if (tier !== 'elite') spawnFxRing(game, x, y - 20, '#fff', 10);
      game.shake(tier === 'superBoss' ? 12 : (tier === 'boss' ? 9 : 6), tier === 'superBoss' ? 0.42 : 0.28);
      game.freezeT = Math.max(game.freezeT || 0, tier === 'superBoss' ? 0.16 : 0.1);
      haptic(tier === 'superBoss' ? 28 : 16);
    }
  } catch (_) {}
}

function applyGambleToStage(game, g) {
  if (!game || !g || !game.level) return;
  game.stageDmgMul = 1;
  game.stageEnergyMul = 1;
  game.stageAlly = null;
  game.stageHealBetween = 0;
  game.stageShieldPerWave = 0;
  game.stageCritBonus = 0;
  game.gambleBossWave = 0;
  const pot = g.outcome === 'superAlly' ? 1.22 : 1;
  if (g.outcome === 'superBoss' || g.outcome === 'miniBoss') {
    const wi = Math.floor(Math.random() * game.level.waves.length);
    const sp = pickSuperBossSpecies(game.level.n);
    game.level.waves[wi].push({
      sp,
      elite: true,
      superBoss: g.outcome === 'superBoss',
    });
    game.gambleBossWave = wi + 1;
  }
  if (g.outcome === 'ally' || g.outcome === 'superAlly') {
    const ally = GAMBLE_ALLIES[g.allyId] || GAMBLE_ALLIES.ki;
    game.stageAlly = ally;
    game.stageDmgMul = (ally.dmgMul || 1) * pot;
    game.stageEnergyMul = (ally.energyRate || 1) * (g.outcome === 'superAlly' ? 1.12 : 1);
    const hpBonus = Math.round((ally.maxHpBonus || 0) * pot);
    if (hpBonus > 0 && game.player) {
      game.player.maxhp += hpBonus;
      game.player.hp = Math.min(game.player.maxhp, game.player.hp + hpBonus);
    }
    game.stageHealBetween = (ally.healBetweenWaves || 0) * pot;
    game.stageShieldPerWave = (ally.shieldStart || 0) * pot;
    game.stageCritBonus = (ally.critBonus || 0) * pot;
  }
}

let pendingAdvLevel = null;
let lastGambleRoll = null;

/* --- src/data/egg-pets.js --- */
/* ============================== EGG PETS (ARCADE) ===================== */
/** Cosmetische ei-metgezels — dagelijks + bonus na avontuur-win (deel 3 pets). */

const EGG_WEIGHT = { common: 40, uncommon: 28, rare: 16, epic: 10, legendary: 5, mythic: 1 };

const EGG_ROSTER = [
  { id: 'egg_pebble', name: 'Kiezel', rarity: 'common', c1: '#b8c4d4', c2: '#6b7a8f', pattern: 'speckle',
    perk: 'Zachte grijze gloed' },
  { id: 'egg_moss', name: 'Mosbal', rarity: 'common', c1: '#7ad06a', c2: '#3a8a40', pattern: 'dot',
    perk: 'Groene sprankels' },
  { id: 'egg_candy', name: 'Snoep', rarity: 'uncommon', c1: '#ff9ad5', c2: '#c04590', pattern: 'stripe',
    perk: 'Roze strepen' },
  { id: 'egg_cloud', name: 'Wolkje', rarity: 'uncommon', c1: '#dfe8ff', c2: '#8fa3d9', pattern: 'swirl',
    perk: 'Zachte wolk-swirl' },
  { id: 'egg_star', name: 'Sterretje', rarity: 'rare', c1: '#ffd75e', c2: '#c97a20', pattern: 'star',
    perk: 'Gouden sterren' },
  { id: 'egg_flame', name: 'Vlammetje', rarity: 'rare', c1: '#ff8c42', c2: '#d04018', pattern: 'flame',
    perk: 'Warme vlam-accent' },
  { id: 'egg_crystal', name: 'Kristal', rarity: 'epic', c1: '#7cf5ff', c2: '#2a7fc0', pattern: 'crystal',
    perk: 'Blauw kristal-shimmer' },
  { id: 'egg_moon', name: 'Maanei', rarity: 'epic', c1: '#cfe6ff', c2: '#6b5cff', pattern: 'moon',
    perk: 'Maansikkel-gloed' },
  { id: 'egg_gold', name: 'Gouden', rarity: 'legendary', c1: '#ffe259', c2: '#c97a20', pattern: 'gold',
    perk: 'Legendarische goudglans' },
  { id: 'egg_neon', name: 'Neon', rarity: 'legendary', c1: '#4ecf6a', c2: '#7cf5ff', pattern: 'neon',
    perk: 'Neon-rand pulse' },
  { id: 'egg_rainbow', name: 'Regenboog', rarity: 'mythic', c1: '#ff6b9d', c2: '#7cf5ff', pattern: 'rainbow',
    perk: 'Mythisch regenboog-ei' },
  { id: 'egg_prism', name: 'Prisma', rarity: 'mythic', c1: '#b06ae0', c2: '#ffd75e', pattern: 'prism',
    perk: 'Zeldzaam prisma-flits' },
];

const EGG_BY_ID = Object.fromEntries(EGG_ROSTER.map(e => [e.id, e]));

function eggDef(id) { return EGG_BY_ID[id] || null; }

function isEggOwned(id) {
  return !!(save.eggPets && save.eggPets[id]);
}

function eggOwnedCount() {
  return Object.keys(save.eggPets || {}).filter(k => EGG_BY_ID[k]).length;
}

function activeEggPetDef() {
  const id = save.activeEggPet;
  if (!id || !isEggOwned(id)) return null;
  return eggDef(id);
}

function ensureEggDaily() {
  const dk = todayKey();
  if (!save.eggDaily || save.eggDaily.date !== dk) {
    save.eggDaily = { date: dk, dailyCracked: false, advBonus: false };
  }
}

function canCrackDailyEgg() {
  ensureEggDaily();
  return !save.eggDaily.dailyCracked;
}

function canAdvEggBonus() {
  ensureEggDaily();
  return !save.eggDaily.advBonus && eggOwnedCount() < EGG_ROSTER.length;
}

function weightedEggPick() {
  const unowned = EGG_ROSTER.filter(e => !isEggOwned(e.id));
  const pool = unowned.length ? unowned : EGG_ROSTER;
  let total = 0;
  const wts = pool.map(e => {
    const w = EGG_WEIGHT[e.rarity] || 10;
    total += w;
    return w;
  });
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= wts[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function hatchEggPet(source) {
  const def = weightedEggPick();
  const dup = isEggOwned(def.id);
  if (!dup) {
    if (!save.eggPets || typeof save.eggPets !== 'object') save.eggPets = {};
    save.eggPets[def.id] = { at: Date.now(), src: source || 'daily' };
    if (!save.activeEggPet) save.activeEggPet = def.id;
    save.stats.eggsHatched = (save.stats.eggsHatched || 0) + 1;
  } else {
    grantMetaXP(10);
  }
  try { AudioSys.sfx(dup ? 'select' : 'summon'); } catch (_) {}
  return { def, duplicate: dup, xp: dup ? 10 : 0 };
}

function crackDailyEgg() {
  if (!canCrackDailyEgg()) return null;
  save.eggDaily.dailyCracked = true;
  const res = hatchEggPet('daily');
  persist();
  return res;
}

function maybeAdvEggBonus() {
  if (!canAdvEggBonus()) return null;
  save.eggDaily.advBonus = true;
  const res = hatchEggPet('adv');
  persist();
  return res;
}

function equipEggPet(id) {
  if (!id) { save.activeEggPet = null; persist(); return true; }
  if (!isEggOwned(id)) return false;
  save.activeEggPet = id;
  persist();
  return true;
}

function eggDailyStatusLine() {
  ensureEggDaily();
  if (canCrackDailyEgg()) return 'Dag-ei klaar';
  if (canAdvEggBonus()) return 'Bonus-ei: win 1× avontuur';
  return 'Morgen weer ei';
}

function eggProgressSummary() {
  const owned = eggOwnedCount();
  const active = activeEggPetDef();
  return {
    owned,
    total: EGG_ROSTER.length,
    activeName: active ? active.name : 'geen',
    daily: eggDailyStatusLine(),
  };
}
/* --- src/i18n/catalog.js --- */
/* ============================== I18N CATALOG ========================== */
function deepMergeI18n(target, source) {
  if (!source || typeof source !== 'object') return target;
  for (const k of Object.keys(source)) {
    const sv = source[k];
    if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
      if (!target[k] || typeof target[k] !== 'object' || Array.isArray(target[k])) target[k] = {};
      deepMergeI18n(target[k], sv);
    } else target[k] = sv;
  }
  return target;
}

function seedNlGameStrings() {
  if (!I18N.nl.banner) I18N.nl.banner = {};
  Object.assign(I18N.nl.banner, {
    levelStart: 'LEVEL {n}',
    levelUp: 'LEVEL OMHOOG! Lv {lvl}',
    newWeapon: 'Nieuw wapen: {name}!',
    masterBuff: 'MEESTER-BUFF +20%',
    masterSword: 'MASTER SWORD!',
    bossWave: 'BAAS-GOLF!',
    eliteWave: 'ELITE-GOLF',
    superBossWave: 'SUPER-BAAS GOLF',
    waveClear: 'Golf gewist +{heal} HP',
    waveN: 'GOLF {n}/{total}',
    fight: 'VECHT!',
    won: 'GEWONNEN!',
    lost: 'VERSLAGEN...',
    round: 'RONDE {n}',
    roundDecisive: 'RONDE {n} · beslissende ronde',
    roundMatchPoint: 'RONDE {n} · match point',
    roundWon: 'RONDE GEWONNEN!',
    roundLost: 'RONDE VERLOREN',
    p1RoundWin: 'P1 WINT RONDE!',
    p2RoundWin: 'P2 WINT RONDE!',
    timeHpVs: 'TIME! {hp1}% vs {hp2}% · {msg}',
    summon: '✦ SUMMON! ✦',
    summonAscend: '{name} → {rar}!',
    newDex: 'Nieuw {rar}: {name}! +{hp} max HP',
    pet: 'PET! {name}',
    matsStart: 'MATS · MUNTJES BONUS',
    wallStart: 'SLOOP DE MUUR!',
    bonusDone: 'BONUS KLAAR!',
    kets: 'KETS!',
    ketsBam: 'KETS-BAM!',
    wallTime: 'TIJD!',
    wallNewWall: 'MUUR GESLOOPT! Nieuwe muur...',
  });
  if (!I18N.nl.result) I18N.nl.result = {};
  Object.assign(I18N.nl.result, {
    advWin: 'GEWONNEN!', advLose: 'VERSLAGEN...', trainWin: 'KAMPIOEN!', trainLose: 'ROBOT WINT...',
    vsP1Win: 'SPELER 1 WINT!', vsP2Win: 'SPELER 2 WINT!', wallRecord: 'NIEUW RECORD!', wallTime: 'TIJD IS OM!',
    matsRecord: 'MATS RECORD!', matsDone: 'Goed gedaan, Mats!',
    perfectRun: 'Perfecte run — hou je HP hoog!',
    pickupsHelp: '{hint} — pickups helpen',
    lossBlockTip: 'Tip: blokkeer · mik omhoog op vliegers · {prog}',
    lossOrbTip: 'Tip: pak groene orbs · vul SUPER vóór baas · {prog}',
    lossGambleTip: 'Eerste nederlaag: vóór elk level kun je dobbelen — bondgenoot helpt tussen golven.',
    trainComboRecord: 'Combo-trainer: ×{n}{rec}',
    trainComboNewRec: ' — nieuw record!',
    trainStyleUnlock: 'Nieuwe stijl vrij: Chakra gloed — Instellingen → Stijl!',
    trainStyleMore: 'Unlock stijlen door meer train-wins!',
    trainLossTip: 'Spring tijdens CHIDORI-telegraph — robot mist · duck oor-lasers',
    trainTipDefault: 'Tip: duck lasers · chakra vol → Rasengan',
    vsRematchTip: 'Opnieuw = rematch · Pauze → Herstart match (0-0)',
    wallRecordShare: 'Nieuw record — share met een vriend!',
    wallComboTip: 'Tip: hou combo vast voor snellere sloop',
    wallGapTip: 'Nog {gap} stenen tot je record — combo helpt!',
    wallComboBarTip: 'Tip: snelle opeenvolgende slagen vullen de combo-balk',
    wallStrongCombo: 'Sterke combo (×{n}) — volgende keer record?',
    wallBehindPace: 'Achter record-tempo — probeer combo ×5+ voor meer sloop',
    wallGoodPace: 'Goed tempo — volgende run kan record breken!',
    matsPetTip: 'Pet coins uitgeven in Collectie → Pets · elke 2 Mats-munten = 1 pet coin',
    matsControlTip: 'Joystick omhoog = hoger mikken (slag + gooi) · shuriken max 3× snel',
    masterBuffActive: ' · Meester-buff actief',
    wavesProg: '{cur}/{total} golven',
    trainDetail: 'RabbitRobot {outcome} ({s}-{r}) · max combo ×{combo}{wins}{record}{finishers}',
    trainOutcomeWin: 'verslagen', trainOutcomeLose: 'was te sterk',
    trainWinsLine: ' · {n}x gewonnen', trainRecordLine: ' · record ×{n}',
    finishersLine: ' · {n} finishers',
    wallDetail: '{score} stenen (~{pace}/min) · record {best} · max combo ×{combo}{paceDelta}',
    wallPaceDelta: ' · tempo {delta} vs record',
    matsDetail: '{n} munten · record {best}{pet}{flyers}',
    matsPetEarned: ' · +{n} pet coins (totaal {wallet})',
    matsFlyers: ' · vliegers = +3 per hit',
    advDetailWin: 'Level {lv} · {kills} monsters · {stars}★ · max combo ×{combo}{finishers}{streak}',
    advDetailLose: 'Level {lv} · {kills} monsters · max combo ×{combo}{finishers}{streak}',
    streakLine: ' · streak ×{n}',
    gambleLine: ' · gok: {text}',
  });
  if (!I18N.nl.combat) I18N.nl.combat = {};
  Object.assign(I18N.nl.combat, {
    counter: 'COUNTER!', crit: 'CRIT!', streak3: 'STREAK ×3', streak5: 'ON FIRE!',
    streak8: 'RAMPAGE!', streak12: 'UNSTOPPABLE!', streakHold: 'STREAK ×{n} vast!',
    combo3: 'Combo ×3 — door!', combo5: 'Combo ×5 — netjes!', combo8: 'Combo ×8 — pro!',
    combo10: 'Combo ×10 — meester!', comboN: 'COMBO ×{n}!',
    pickupHp: '+HP', pickupRage: 'RAGE ×1.4', pickupChakra: 'Vol chakra!', pickupShield: 'Schild!',
    pickupSkillShard: '+1 {name} shard',
    pickupItemShard: '+1 {name} item-shard',
    giant: 'REUS!', wallCombo3: 'Combo ×3 · sloop +{pct}%',
    wallCombo5: 'Combo ×5 · sloop +{pct}%', wallCombo8: 'Combo ×8 · sloop +{pct}%',
    wallTempo: 'MUUR-TEMPO!', wallRecord: 'NIEUW RECORD!', bonus5: 'BONUS +5',
    masterSwordGain: 'Hyrules legendarische kling — 15s!',
    masterSwordFade: 'Master Sword vervaagt…',
    bossWaits: 'DE BAAS WACHT…',
    checkpoint: 'CHECKPOINT — DEEL {part}/3',
    allyHeal: '+{heal} bondgenoot',
    allyHit: '{name} −{dmg}',
    gambleSuperBoss: 'Super-baas mogelijk golf {n}',
    allyHelps: '{name} helpt je!',
    masterBuffFloater: '5× verloren — HP, snelheid & schade ↑',
    skillGate: 'Eiland-skill gate: max wapen Lv {cap}',
    aimUp: 'Joystick omhoog = hoger mikken',
    trainIntro: 'Combo-trainer — 3s oefenen, robot wacht',
    earLaser: 'Oor-laser — spring!',
    robotActive: 'Robot activeert — hou combo vast!',
    roundCombo: 'Ronde combo ×{n}',
    wallHalf: 'Halve tijd — combo vasthouden!',
    wallLast15: 'Laatste 15s — record jagen!',
    wallLast5: '5s — vol gas!',
    wallComboTipShort: 'Tip: snelle opeenvolgende slagen vullen combo',
    wallComboLost: 'Combo weg — snel weer raken!',
    wallComboLow: 'Combo bijna weg!',
    wallNearRec: 'Bijna record — nog {gap}!',
    coinPlus1: '+1 munt', coinPlus3: '+3 munten',
  });
  if (!I18N.nl.toast) I18N.nl.toast = {};
  Object.assign(I18N.nl.toast, {
    islandUnlock: '{name} ontgrendeld! Skill gate: wapens tot Lv {cap}',
    masterBuffGain: 'Meester-buff! +20% HP, snelheid & schade tot je wint',
    eggDuplicate: 'Bonus-ei dubbel: {name} (+10 XP)',
    eggNew: 'Bonus-ei! {name} ({rar})',
    dexDiscover: '{rar}: {name} ontdekt! +{hp} HP',
    petTamed: '{name} getemd — metgezel! ({cur}/{need} kills)',
    styleUnlockTome: 'Nieuwe stijl: Boekmeester!',
    styleUnlockCrystal: 'Nieuwe stijl: Kristallijn!',
    styleUnlock: 'Nieuwe stijl: {name}!',
    summon: '✦ Summon! {name} is nu {rar} — schade ×{dmg}',
    shurikenWait: 'Werpwapen even wachten…',
    shurikenSpam: 'Niet spammen — max 3 snel achter elkaar',
    missionDone: 'Missie klaar: {text}',
    claimXp: '+{xp} XP · {text}',
    noMissionReady: 'Nog geen missie klaar om te claimen',
    claimBatch1: '+{total} XP geclaimd',
    claimBatchN: '{n} missies · +{total} XP',
    dayBonusAlready: 'Dagbonus al geclaimd — morgen weer 3 nieuwe',
    dayBonusNeed1: 'Nog 1 missie claimen voor de dagbonus',
    dayBonusNeedN: 'Nog {n} missies claimen voor +80 XP dagbonus',
    dayBonusDone: 'Dagbonus! +80 XP · tot morgen',
    allClaimedTapBonus: 'Alles geclaimd — tik Dagbonus (+80 XP)',
    followUp1: 'Nog 1 missie klaar om te claimen (+{xp} XP)',
    followUpN: 'Nog {n} missies klaar · +{xp} XP',
    followUpBonus: 'Stap 3: tik Dagbonus (+80 XP)',
    achievementUnlock: 'Prestatie: {name} — bekijk bij Missies',
    charSagaUnlock: 'Unlock minstens 2 saga-icons (Ki/Scroll/Tide/Cape/Dawn)',
    charSagaClash: '{a} vs {b} — saga clash!',
    charSwap: 'P1 ↔ P2 omgewisseld',
    charNotEnough: 'Niet genoeg unlocked vechters in deze saga',
    charRandom: '{a} vs {b} · HP {hp1}/{hp2} · TOT {tot1}/{tot2}',
    charFair: 'Fair duo: {a} vs {b} · TOT Δ{diff}',
    skillUpgradeReady: '{name} kan upgraden — Collectie → Upgrades',
    skillUpgraded: '{name} Lv {lv}! {detail}',
    itemUpgradeReady: '{name} kan upgraden — Collectie → Upgrades',
    itemUpgraded: '{name} Lv {lv}! {detail}',
    skipGamble: 'Zonder gok',
    weaponIslandCap: 'Klaar voor training — in avontuur max Lv {cap}',
    petNone: 'Geen actieve pet',
    petFollow: '{name} volgt je nu!',
    petNoCoins: 'Niet genoeg pet coins',
    petBought: '{name} gekocht! Volgt je nu.',
    eggAlreadyOpened: 'Dag-ei al geopend — morgen weer',
    eggDuplicateUi: 'Dubbel ei: {name} (+10 XP)',
    eggHatch: 'Uitgekomen! {name} ({rarity})',
    eggNone: 'Geen actief ei-pet',
    eggFloat: '{name} zweeft nu mee!',
    styleEquipped: '{name} uitgerust',
    welcome: 'Welkom! Menu → Tips · per modus één korte hint bovenin (geen toast-stapel)',
  });
  if (!I18N.nl.versionUpdate) I18N.nl.versionUpdate = {};
  Object.assign(I18N.nl.versionUpdate, {
    beforeTitle: 'Versie ophalen',
    beforeBodyProgress: 'Je hebt voortgang op dit apparaat:\n{summary}\n\nSave veiligstellen vóór v{version}? Daarna kun je die save in de nieuwe versie gebruiken.',
    beforeBodyFresh: 'Nieuwe versie laden (v{version})?\nGeen voortgang gevonden — je kunt direct updaten.',
    backupAndGo: 'Ja — save maken & updaten',
    goWithout: 'Updaten zonder extra save',
    cancel: 'Annuleren',
    afterTitle: 'Save gevonden',
    afterBody: 'Vóór de update (v{from}) bewaarde je:\n{stashSummary}\n\nHuidige save:\n{currentSummary}\n\nDeze save gebruiken in v{to}?',
    useStash: 'Ja — gebruik bewaarde save',
    keepCurrent: 'Nee — houd huidige save',
    stashOk: 'Save bewaard — update start…',
    stashFail: 'Save bewaren mislukt — probeer Export in Instellingen',
    applied: 'Save van v{from} geladen in v{to} · {summary}',
    applyFail: 'Save laden mislukt — probeer Herstel backup in Instellingen',
    keptCurrent: 'Huidige save behouden',
    fail: 'Update mislukt — sluit tab en open opnieuw',
  });
  if (!I18N.nl.missionsUi) I18N.nl.missionsUi = {};
  Object.assign(I18N.nl.missionsUi, {
    flowDone: '✓ Dag afgerond — morgen 3 nieuwe missies (middernacht)',
    flowPlay: 'Speel', flowPlaySub: 'doe missies',
    flowClaim: 'Claim', flowClaimSub: '+XP',
    flowBonus: 'Dagbonus', flowBonusSub: '+80 XP',
    subDayDone: 'Dag voltooid — morgen 3 nieuwe lichte missies (middernacht)',
    subDayDoneStreak: 'Dag voltooid · {streak} — morgen 3 nieuwe lichte missies (middernacht)',
    subStep1: 'Stap 1: speel missies · max +{xp} XP vandaag — licht, geen grind',
    subStep2: 'Stap 2: claim +{xp} XP · daarna dagbonus (+80) — licht, geen grind',
    subStep3: 'Stap 3: tik Dagbonus (+80 XP) — licht, geen grind',
    summaryDone: '{done}/3 klaar · {claimed}/3 geclaimd',
    summaryReady: '{n} klaar om te claimen',
    summaryBonusReady: 'dagbonus +80 XP klaar',
    summaryBonusAfter1: 'dagbonus na 1 claim',
    summaryBonusAfterN: 'dagbonus na {n} claims',
    summaryMax: 'max vandaag +{xp} XP',
    claimAllBtn: 'Claim alle klaar',
    claimAllAfter1: 'nog 1 claim voor dagbonus +80',
    claimAllAfterN: 'nog {n} claims voor dagbonus +80',
    claimAllThenBonus: 'daarna dagbonus +80',
    dailyClaimed: 'Geclaimd',
    dailyReady: 'Klaar — tik Claim hieronder',
    dailyProgress: 'Bezig {cur}/{goal}',
    dailyReward: 'Beloning +{xp} XP',
    dailyClaimBtn: 'Claim +{xp} XP',
    dailyPlayBtn: 'Speel {mode} →',
    dailyNextUp: 'volgende',
    bonusClaimed: 'Dagbonus geclaimd',
    bonusTomorrow: 'Morgen weer nieuw',
    bonusClaimBtn: 'Dagbonus claimen',
    bonusTap: '+80 XP · tik hier',
    bonusNeed: 'Dagbonus',
    bonusNeed1: 'Nog 1 claim nodig',
    bonusNeedN: 'Nog {n} claims nodig',
    achSummary: '{got}/{total} prestaties · permanent (niet dagelijks)',
    achNear: '{n} bijna klaar',
    filterAll: 'Alle', filterNear: 'Bijna', filterOpen: 'Open', filterDone: 'Behaald',
    badgeNew: 'nieuw', badgeNear: 'bijna', stillOpen: 'nog open',
    streakDone: '{n}× dagbonus · Vastberaden!',
    streakLine: '{n}× dagbonus streak',
    statusDone: 'Vandaag klaar{streak} · {ach}/{total} prestaties · morgen nieuwe missies',
    statusStep2: 'Stap 2: claim XP',
    statusStep3: 'Stap 3: dagbonus +80 XP',
    statusStep1: 'Stap 1: speel missies',
    statusReady: '{hint} · +{xp} XP klaar · {done}/3 gedaan{streak}',
    statusAllClaimed: '{hint} — open Missies{streak} · {ach}/{total} prestaties',
    statusDefault: '{hint} · {done}/3 klaar · max +{xp} XP vandaag{streak}',
    remainderKills1: 'Nog 1 kill',
    remainderKillsN: 'Nog {n} kills',
    remainderBricks1: 'Nog 1 steen',
    remainderBricksN: 'Nog {n} stenen',
    remainderCombo: 'Nog combo ×{n}',
    remainderPickups1: 'Nog 1 pickup',
    remainderPickupsN: 'Nog {n} pickups',
    remainderRun: 'Nog 1 run',
    remainderGeneric: 'Nog {n}',
  });
  if (!I18N.nl.help) I18N.nl.help = {};
  I18N.nl.help.tips = [
    '<b>Power-ups:</b> verslagen monsters laten soms bolletjes vallen — HP, rage, chakra, schild.',
    '<b>Bazen:</b> onder half HP worden ze woester (fase 2).',
    '<b>Combo’s:</b> sla snel achter elkaar om ×2 / ×3 schade te stapelen.',
    '<b>Dash:</b> dubbel-tik links/rechts (of toets <b>Shift</b>) om te ontwijken.',
    '<b>Rasengan:</b> vul je <b>chakra</b>-balk — dan laad je een draaiende chakra-bol en knal je ‘m erin.',
    '<b>Substitutie:</b> rookwolk + ontwijk (knop of <b>Shift</b>). Korte onkwetsbaarheid.',
    '<b>Wapen-combo:</b> tik wapen 3× snel — elk wapen heeft 3 eigen moves (①②③). Raak met ① én ②, dan is ③ een <b>finisher</b> (+schade, +chakra). Meesterschap: Virtuoos 3× · Meester 10× · Legende 25× per wapen.',
    '<b>2 spelers:</b> roster met <b>5 saga-icons</b> (Ki/Scroll/Tide/Cape/Dawn parodie) + filters · best-of-3.',
    '<b>RabbitRobot:</b> hij gebruikt <b>Chidori</b> (bliksem) — wacht tot hij open is.',
    '<b>Muur:</b> 60s timer · combo-balk (+4% sloop per hit) · milestones ×3/×5/×8 · record-tempo in HUD · bom/goud bonusstenen.',
    '<b>Rariteiten:</b> Gewoon → Ongewoon → Zeldzaam → Episch → Legendarisch → Mythisch. Zeldzamer = meer XP & meer max HP.',
    '<b>50 levels:</b> <b>5 eilanden × 10 levels</b> — skill gate wapens per eiland · baas Lv 10/20/30/40/50 opent volgend eiland · 5× verlies = Meester-buff (+20%).',
    '<b>Backup:</b> elke save wordt dubbel opgeslagen — bij problemen: <b>Instellingen → Herstel save uit backup</b>.',
    '<b>Delen:</b> menu → <b>Deel link</b> — vrienden op Android openen in Chrome → Zet in app-lade. Zie ANDROID-DELEN.txt op GitHub.',
    '<b>Offline:</b> na 1× online openen cache’t de app HTML+JS — banner onderaan bij geen net. Tunnel-link heeft internet nodig; GitHub Pages + app-lade = stabielst.',
  ];
  if (!I18N.nl.menu) I18N.nl.menu = {};
  I18N.nl.menu.tips = [
    'Kies een tegel — Avontuur · Arcade · 2P · Collectie',
    '5 eilanden — baas Lv 10/20/30/40/50 opent volgend eiland',
    'Skill gate — max wapen per eiland in avontuur',
    '5× verlies op één level = Meester-buff +20%',
    'Training = solo · Versus = 2P lokaal op iPad',
    'Muur-combo’s = sneller sloop & meer XP',
    'Monsterboek vullen = meer max HP',
    'Verder spelen hervat je laatste modus',
    'Menu-muziek wisselt als je terugkeert uit een modus',
  ];
  if (!I18N.nl.ui) I18N.nl.ui = {};
  Object.assign(I18N.nl.ui, {
    menuMissionReady: 'missie klaar',
    menuFirstMinuteNext: 'Eerste minuut {seen}/{total} · probeer: {next}',
    menuFirstMinutePartial: 'Eerste minuut {seen}/{total} modi — één hint per modus bovenin',
    charArenaPre: 'VERSUS · BEST OF 3',
    charSub1: 'Speler 1 — tik een unlocked kaart (linker helft in gevecht)',
    charSub2: 'Speler 2 — tik een andere vechter (rechter helft in gevecht)',
    charStep1: 'Stap 1/2 · Choose P1',
    charStep2: 'Stap 2/2 · Choose P2',
    charRosterLine: '20 vechters · STR · RNG · mDPS · rDPS',
    charBlurbAll: '20 legends · tik kaart = kiezen · hover = stats preview',
    charEmpty: 'Geen vechters in deze saga — tik ⭐ Alle',
    charLocked: '🔒 Locked',
    charIconRow: 'Saga-icons · deel 2 — tik om te kiezen',
    charBig5Title: 'Legends · snel kiezen',
    charBig5Hint: 'Ryu · Ken · Goku · One Punch Man · Aruskankou · Kutjankorio · Xavi',
    charArenaPre: 'VERSUS · BEST OF 3',
    charHead: 'SELECT FIGHTER',
    charBackP1: '← Andere P1',
    charBackMenu: '← Menu',
    charFight: 'VECHT! (best-of-3)',
    charIpadTip: 'iPad: speler 1 gebruikt de linker helft van het scherm (joystick + knoppen), speler 2 de rechter helft. Draai je iPad liggend voor het meeste ruimte.',
    levelHead: 'Kies een eiland',
    levelSub: '5 eilanden × 10 levels · Tik level = Gooi & start · lang indrukken = zonder gok',
    gambleSub: 'Twee dobbelstenen: pech = super-baas in een willekeurige golf · geluk = sterke bondgenoot (buff alleen dit level)',
    gambleSumDefault: 'Tik Gooi & start — of overslaan zonder gok',
    gambleSumRoll: 'Som: {d1} + {d2} = {sum}',
    gambleHead: 'Gok — {island} · Lv {level}',
    gambleCtx: 'Skill gate: wapens tot Lv {cap} · daarna dobbelen voor super-baas of bondgenoot',
    gamblePreview: 'Super-baas (som ≤5) of super-bondgenoot (som ≥9) kan dit level veranderen.',
    gambleStart: 'Gooi & start',
    gambleStartSub: '2× d6 · meteen level',
    gambleSkip: 'Overslaan',
    gambleSkipSub: 'Geen gok — geen extra baas of buff',
    styleHead: 'Stijl',
    styleSub: 'Outfits met bonus — level, training, monsterboek · hover voor tooltip',
    styleActive: 'Actief',
    stylePick: 'Tik om te kiezen',
    styleIslandGate: 'Eiland-skill Lv {lvl}',
    weaponHead: 'Wapens',
    weaponSub: 'Summons zijn echt · eiland-skill gate: alleen wapens tot je huidige eiland-cap in avontuur',
    skillHead: 'Upgrades',
    skillSub: 'Shards in avontuur · skills, wapens, pets & stijl · meestal max Lv 3 · zeldzaam Lv 5',
    skillTabSkills: 'Skills',
    skillTabWeapons: 'Wapens',
    skillTabPets: 'Pets',
    skillTabStyle: 'Stijl',
    upgradeSubSkills: 'Skill-shards in avontuur · jutsu max Lv 5 · utility max Lv 3',
    upgradeSubWeapons: 'Item-shards voor unlocked wapens · mythisch max Lv 5',
    upgradeSubPets: 'Item-shards voor getemde pets · passief, assist & CD',
    upgradeSubStyle: 'Item-shards voor unlocked outfits · bonus, HP & shield',
    upgradeEmptyWeapons: 'Unlock eerst wapens via level in avontuur.',
    upgradeEmptyPets: 'Tem eerst een pet via monsterboek-kills of pet coins.',
    upgradeEmptyStyle: 'Unlock eerst stijlen via level, training of monsterboek.',
    upgradeReady: '{n} klaar om te upgraden',
    upgradeShardHint: 'Goud = skill shard · paars = wapen/pet/stijl shard',
    itemUpgrade: 'Upgrade',
    itemMax: 'MAX',
    itemShards: '{cur}/{cost} shards',
    itemLevel: 'Lv {lv}/{max}',
    itemNow: 'Nu',
    itemNext: 'Volgende',
    skillUpgrade: 'Upgrade',
    skillMax: 'MAX',
    skillShards: '{cur}/{cost} shards',
    skillShardsOnly: '{n} shards',
    skillLevel: 'Lv {lv}/{max}',
    skillNow: 'Nu',
    skillNext: 'Volgende',
    skillGroupJutsu: 'Jutsu',
    skillGroupUtility: 'Utility',
    helpFirstMinute: 'Eerste minuut — per modus één korte hint bovenin het gevecht (geen toast-stapel). Avontuur: joystick + knoppen · groen = HP · vol chakra = SUPER-knop. Training = Robot · Muur = combo · 2 spelers = links/rechts.',
    helpOnboardHead: 'Eerste-minuut hints: {seen}/{total} modi gezien · max één regel bovenin per modus',
    helpTryNext: 'Probeer als volgende: {mode}',
    helpTrySub: 'Nog niet gespeeld — één hint bovenin, geen extra toast.',
    helpHintSeen: '✓ hint gezien',
    helpHintNot: '· nog niet',
    helpTouch: 'touch',
    helpKeyboard: 'toetsenbord',
    helpIslandTitle: 'Eilanden & skill gate',
    helpIslandIntro: 'avontuur is 5×10 levels. Per eiland geldt een wapen-cap (nu Lv {cap} op eiland {cur}).',
    helpMasterBuff: 'Meester-buff: 5× verlies op hetzelfde level → +20% HP, snelheid & schade tot je wint. Baas op Lv 10/20/30/40/50 opent het volgende eiland.',
    helpIslandLocked: 'Vergrendeld — versla baas Lv {lv}',
    helpIslandProg: '{cleared}/{total} levels · {stars}/{maxStars}★ · skill gate wapens Lv {cap}',
    installSub: 'Verschijnt als icoon — net als een echte app',
    boss: 'BAAS',
    topHunter: 'Top jager',
    modeAdventure: '5 eilanden × 10 levels · skill gate wapens · Meester-buff na 5× verlies · dobbel-gok vóór level',
    modeTraining: 'Combo-trainer ×5/×8/×10 · 3s dummy · lasers · Chidori',
    modeWall: '60s · combo ×3/×5/×8 hints · record-tempo + projectie in HUD · 5s waarschuwing',
    modeVersus: 'P1 links P2 rechts · best-of-3 · rematch in pauze',
    modeCoinrun: '45s munten · 2 munten = 1 pet coin · mik ↑ · vliegers +3',
    langSwitchFail: 'Taal wisselen mislukt',
  });
  if (!I18N.nl.skill) I18N.nl.skill = {};
  Object.assign(I18N.nl.skill, {
    rasengan: 'Rasengan', chidori: 'Chidori', rinnegan: 'Rinnegan',
    subst: 'Substitutie', dash: 'Dash', chakra: 'Chakra',
  });
  if (!I18N.nl.hud) I18N.nl.hud = {};
  Object.assign(I18N.nl.hud, {
    super: 'SUPER', masterShort: 'MEESTER +20%', masterSword: 'MASTER SWORD {n}s',
    levelWave: 'Level {n} — Golf {wv}/{total}', islandWeapon: '{name} · wapen ≤ Lv {cap}',
    part: 'deel {cur}/3', waveLine: 'Golf {n}/{total}', wavesTotal: '{total} golven',
    nextWave: 'Volgende golf', eggPet: 'Ei · {name}', petActive: 'Pet · {name}',
    petDefault: 'Metgezel', cosmetic: 'Cosmetisch',
    gambleBoss: 'Super-baas mogelijk · golf {n}', starZone: ' · 3★ zone',
    star2: ' · 2★ bij >{pct}% HP', star3: ' · 3★ bij >{pct}% HP', hpPct: '{pct}% HP{hint}',
    enemiesLeft1: 'Nog 1 vijand in deze golf', enemiesLeftN: 'Nog {n} vijanden in deze golf',
    toBoss: 'Op weg naar de baas — {sec}s', walkNext: 'Verder lopen… volgende golf {sec}s',
    streak: 'STREAK ×{n}', combo: 'COMBO ×{n}', rage: 'RAGE {n}s', shield: 'Schild {n}s',
    earLaser: 'OOR-LASER — spring!', chidoriTele: 'CHIDORI — dash/spring!',
    kickTele: 'TRAP — spring/blok!', punchTele: 'SLA — blok/weg!', earLaserShort: 'OOR-LASER',
    rabbitRobot: 'RABBITROBOT · {pct}%', roundInfo: 'Ronde {n} · eerst 2 wint · {s}-{r}',
    dummyGrace: 'Dummy {n}s — oefen combo', goal: 'doel ×{n}', record: 'record ×{n}',
    time: 'TIJD', wallGen: 'MUUR ×{n}', stones: 'Stenen: {n}',
    recordGap: 'Record {best} · nog {gap} te gaan',
    recordBroken: 'Record gebroken · {rec}', recordLine: 'Record: {rec}',
    pace: '~{pace}/min · projectie ~{proj}', paceAhead: 'Voor op record-tempo +{n}',
    paceBehind: 'Achter record-tempo {n}', comboLabel: 'COMBO',
    comboSmash: '+{pct}% sloop', comboActive: 'Combo actief — nog een steen!',
    coins: 'Munten: {n}', matsRecord: 'Record Mats: {n}',
    petCoins: 'Pet coins: +{pending} · wallet {wallet}',
    matsHint: 'Joystick ↑ mik · slag/gooi hoger · shuriken op roze vliegers',
    spawnFair: 'Spawn · eerlijk start', nextRound: 'Volgende ronde',
    p1Line: 'P1 · {name} · {pct}%', p2Line: '{pct}% · {name} · P2',
    decisiveRound: 'Beslissende ronde · {s}-{r}',
    timeHpWin: 'TIME = hoogste HP % wint',
    hintDualTouch: 'P1 = linker helft · P2 = rechter helft · joystick + aanvalsknoppen',
    hintDualKb: 'P1: A/D · W · J/K/L/U · Shift  |  P2: pijltjes · 1/2/3/4/5',
    hintTouch: 'Links: joystick om te lopen · Rechts: aanvalsknoppen',
    hintKb: 'A/D lopen · W springen · J stomp · K trap · L wapen · U speciaal',
    ketsTap: 'Tik!', ketsKey: 'E / tik',
  });
}

function seedNlFromRuntime() {
  if (typeof ACHIEVEMENTS !== 'undefined') {
    if (!I18N.nl.ach) I18N.nl.ach = {};
    for (const a of ACHIEVEMENTS) I18N.nl.ach[a.id] = { name: a.name, desc: a.desc };
  }
  if (typeof DAILY_DEFS !== 'undefined') {
    if (!I18N.nl.daily) I18N.nl.daily = {};
    for (const d of DAILY_DEFS) {
      if (!I18N.nl.daily[d.id]) I18N.nl.daily[d.id] = {};
      I18N.nl.daily[d.id].text = d.text;
    }
  }
  if (typeof DAILY_PLAY_HINTS !== 'undefined') {
    if (!I18N.nl.daily) I18N.nl.daily = {};
    for (const id of Object.keys(DAILY_PLAY_HINTS)) {
      if (!I18N.nl.daily[id]) I18N.nl.daily[id] = {};
      I18N.nl.daily[id].hint = DAILY_PLAY_HINTS[id];
    }
  }
  if (typeof WEAPONS !== 'undefined') {
    if (!I18N.nl.weapon) I18N.nl.weapon = {};
    for (const w of WEAPONS) I18N.nl.weapon[w.id] = { name: w.name, desc: w.desc };
  }
  if (typeof STYLES !== 'undefined') {
    if (!I18N.nl.style) I18N.nl.style = {};
    for (const s of STYLES) I18N.nl.style[s.id] = { name: s.name, hint: s.hint, tooltip: s.tooltip, bonus: s.bonus };
  }
  if (typeof PICKUP_META !== 'undefined') {
    if (!I18N.nl.pickup) I18N.nl.pickup = {};
    for (const kind of PICKUP_TYPES || Object.keys(PICKUP_META)) {
      const m = PICKUP_META[kind];
      if (m && m.label) I18N.nl.pickup[kind] = m.label;
    }
  }
}

function mergeI18nCatalogs() {
  seedNlFromRuntime();
  seedNlGameStrings();
  deepMergeI18n(I18N.en, CATALOG_EN);
  deepMergeI18n(I18N.de, CATALOG_DE);
  deepMergeI18n(I18N.fr, CATALOG_FR);
  deepMergeI18n(I18N.es, CATALOG_ES);
}

const CATALOG_EN = {
  ach: {
    first_win: { name: 'First triumph', desc: 'Win your first level' },
    lv10: { name: 'Growing ninja', desc: 'Reach fighter Lv 10' },
    dex10: { name: 'Monster expert', desc: '10 species in monster book' },
    dexFull: { name: 'Encyclopedia', desc: 'All monster species discovered' },
    dex100: { name: 'Hunter', desc: '100 monster kills logged' },
    dexHalf: { name: 'Field guide', desc: 'Half of all species discovered' },
    dexTiers: { name: 'Rarity hunter', desc: '4 different rarities in book' },
    dexMythic: { name: 'Myth seeker', desc: 'Discover one mythic monster' },
    train5: { name: 'Robot breaker', desc: 'Win training 5×' },
    wall100: { name: 'Demolisher', desc: 'Wall record 100+' },
    combo8: { name: 'Combo king', desc: 'Reach combo ×8' },
    finisher10: { name: 'Style master', desc: 'Land 10 weapon finishers' },
    finisher1: { name: 'First style', desc: 'Land your first weapon finisher' },
    weaponMaster25: { name: 'Weapon legend', desc: '25 finishers with one weapon' },
    finisher50: { name: 'Combo sensei', desc: '50 finishers total' },
    streak10: { name: 'Unstoppable', desc: 'Kill streak ×10 in adventure' },
    trainCombo10: { name: 'Dummy master', desc: 'Training combo ×10' },
    lv50: { name: 'Legend', desc: 'Unlock level 50' },
    daily7: { name: 'Determined', desc: 'Claim 7 daily bonuses' },
    vs5: { name: 'Duelist', desc: 'Play 5× 2-player duels' },
    vs_roster: { name: 'Full roster', desc: 'Play 10+ different fighters (2P)' },
    saga_icons: { name: 'Saga legends', desc: 'Play 2P with all 7 legend picks' },
  },
  daily: {
    kills12: { text: 'Defeat 12 monsters', hint: 'Play Adventure or Training' },
    advwin: { text: 'Win 1 adventure level', hint: 'Menu → Adventure, win the level' },
    wall35: { text: 'Smash 35 wall bricks', hint: 'Menu → Wall smash (combo helps)' },
    trainwin: { text: 'Win training vs Robot', hint: 'Menu → Training vs RabbitRobot' },
    combo5: { text: 'Reach combo ×5', hint: 'Adventure: fast combos on monsters' },
    finisher3: { text: 'Land 3 weapon finishers', hint: 'Adventure/Training: hit ①+②, then finisher ③' },
    pick3: { text: 'Grab 3 power-ups', hint: 'Adventure: green/orange/blue orbs' },
    boss1: { text: 'Defeat 1 boss monster', hint: 'Adventure: boss at end of a level' },
  },
  weapon: {
    vuist: { name: 'Fists', desc: 'Taijutsu basics' },
    kunai: { name: 'Kunai', desc: 'Classic ninja blade' },
    shuriken: { name: 'Shuriken', desc: 'Throws sharp stars' },
    tanto: { name: 'Tanto', desc: 'Short blade · fast' },
    zwaard: { name: 'Ninja sword', desc: 'Kenjutsu all-rounder' },
    sai: { name: 'Sai', desc: 'Three-prong · parry' },
    knuppel: { name: 'Club', desc: 'Raw blunt force' },
    waaier: { name: 'War fan', desc: 'Fan slash · stylish' },
    speer: { name: 'Spear', desc: 'Huge reach' },
    tonfa: { name: 'Tonfa', desc: 'Side handle · flurry' },
    nunchaku: { name: 'Nunchaku', desc: 'Lightning fast' },
    kama: { name: 'Kama', desc: 'Sickle · hook strikes' },
    boemerang: { name: 'Boomerang', desc: 'Comes back' },
    zeis: { name: 'Shadow scythe', desc: 'Long arc · dark' },
    hamer: { name: 'Sledgehammer', desc: 'Smashes everything' },
    drietand: { name: 'Trident', desc: 'Three points · thrust' },
    ketting: { name: 'Chain blade', desc: 'Reach + pressure' },
    bostaf: { name: 'Bo staff', desc: 'Long staff · tempo' },
    laser: { name: 'Chakra blade', desc: 'Blue burning edge' },
    fuuma: { name: 'Fūma shuriken', desc: 'Large throwing star' },
    kristal: { name: 'Crystal blade', desc: 'Shard slash' },
    donder: { name: 'Lightning axe', desc: 'Like Chidori, but an axe' },
    vlamzweep: { name: 'Flame whip', desc: 'Fire line · long reach' },
    void: { name: 'Void claw', desc: 'Mythic claw' },
    sterkling: { name: 'Star blade', desc: 'Sky metal · crits' },
    guvve: { name: 'Guvvedukkie stick', desc: 'Quack. Please. Boom.' },
  },
  style: {
    classic: { name: 'Classic', hint: 'Standard ninja', tooltip: 'Base ninja — no bonus, fastest unlock.', bonus: 'No combat bonus' },
    konoha: { name: 'Konoha bandana', hint: 'Unlock at Lv 5', tooltip: 'Leaf village headband. Slightly more max HP — steady in long levels.', bonus: '+5 max HP' },
    chakra: { name: 'Chakra glow', hint: 'Win training 3×', tooltip: 'Blue chakra aura. Chakra charges faster — more Rasengan/Chidori.', bonus: '+8% chakra regen' },
    akatsuki: { name: 'Red cloak', hint: 'Unlock at Lv 12', tooltip: 'Red cloak — aggressive hits. More melee and weapon damage.', bonus: '+4% damage' },
    shadow: { name: 'Shadow ninja', hint: 'Unlock at Lv 15', tooltip: 'Shadow steps. Extra crit chance on all hits.', bonus: '+3% crit' },
    guvve: { name: 'Guvvedukkie', hint: '8 monsters in book', tooltip: 'Quack cosplay. Bonus XP on adventure kills — light, no grind.', bonus: '+6% adventure XP' },
    gold: { name: 'Legendary', hint: 'Unlock at Lv 25', tooltip: 'Golden outline + glow. Stronger knockback on kicks and specials.', bonus: '+10% knockback' },
    sand: { name: 'Desert', hint: 'Unlock at Lv 8', tooltip: 'Sand cloak — less damage taken and stronger block. Tank style for crowds.', bonus: '−14% damage · block −25% chip' },
    samurai: { name: 'Samurai', hint: 'Unlock at Lv 20', tooltip: 'Topknot + katana stance. Weapon combos reach slightly farther.', bonus: '+8% weapon reach' },
    cyber: { name: 'Cyber ninja', hint: 'Unlock at Lv 18', tooltip: 'Neon visor + lightning flash on melee. Faster chakra and chain sparks.', bonus: 'Lightning FX · +6% chakra' },
    fox: { name: 'Fox ninja', hint: '12 monsters in book', tooltip: 'Fox ears — faster on the ground. Great for kiting and shuriken.', bonus: '+5% move speed' },
    storm: { name: 'Storm spirit', hint: 'Win training 5×', tooltip: 'Storm aura + soft lightning. Extra shield at start of each wave.', bonus: 'Lightning glow · +0.8s shield/wave' },
    void: { name: 'Void walker', hint: 'Unlock at Lv 40', tooltip: 'Void cloak — heavier jutsu. Specials (Rasengan/Chidori/Rinnegan) hit harder.', bonus: '+8% jutsu damage' },
    hunter: { name: 'Hunter look', hint: '75 kills in monster book', tooltip: 'Hunter cape + green accents. Bonus damage vs monsters in adventure.', bonus: '+6% vs monsters' },
    crystal: { name: 'Crystalline', hint: '4 rarities in monster book', tooltip: 'Crystal shard — reflective glow. Short shield each wave.', bonus: '+1.0s shield/wave' },
    tome: { name: 'Bookmaster', hint: 'Half the monster book', tooltip: 'Monster book on your back. More HP bonus on new dex discoveries.', bonus: '+4 max HP · book wisdom' },
  },
  pickup: { heal: '+HP', rage: 'RAGE', chakra: 'CHAKRA', shield: 'SHIELD' },
  result: {
    advWin: 'VICTORY!', advLose: 'DEFEATED...', trainWin: 'CHAMPION!', trainLose: 'ROBOT WINS...',
    vsP1Win: 'PLAYER 1 WINS!', vsP2Win: 'PLAYER 2 WINS!', wallRecord: 'NEW RECORD!', wallTime: "TIME'S UP!",
    matsRecord: 'MATS RECORD!', matsDone: 'Nice job, Mats!',
    perfectRun: 'Perfect run — keep HP high!',
    pickupsHelp: '{hint} — pickups help',
    lossBlockTip: 'Tip: block · aim up at flyers · {prog}',
    lossOrbTip: 'Tip: grab green orbs · fill SUPER before boss · {prog}',
    lossGambleTip: 'First loss: before each level you can gamble — ally helps between waves.',
    trainComboRecord: 'Combo trainer: ×{n}{rec}',
    trainComboNewRec: ' — new record!',
    trainStyleUnlock: 'New style unlocked: Chakra glow — Settings → Style!',
    trainStyleMore: 'Unlock styles with more training wins!',
    trainLossTip: 'Jump during CHIDORI telegraph — robot misses · duck ear-lasers',
    trainTipDefault: 'Tip: duck lasers · full chakra → Rasengan',
    vsRematchTip: 'Again = rematch · Pause → Restart match (0-0)',
    wallRecordShare: 'New record — share with a friend!',
    wallComboTip: 'Tip: keep combo for faster smash',
    wallGapTip: '{gap} bricks to your record — combo helps!',
    wallComboBarTip: 'Tip: quick consecutive hits fill the combo bar',
    wallStrongCombo: 'Strong combo (×{n}) — record next time?',
    wallBehindPace: 'Behind record pace — try combo ×5+ for more smash',
    wallGoodPace: 'Good pace — next run could break record!',
    matsPetTip: 'Spend pet coins in Collection → Pets · every 2 Mats coins = 1 pet coin',
    matsControlTip: 'Joystick up = aim higher (melee + throw) · shuriken max 3× fast',
    masterBuffActive: ' · Master buff active',
    wavesProg: '{cur}/{total} waves',
    trainDetail: 'RabbitRobot {outcome} ({s}-{r}) · max combo ×{combo}{wins}{record}{finishers}',
    trainOutcomeWin: 'defeated', trainOutcomeLose: 'was too strong',
    trainWinsLine: ' · {n} wins', trainRecordLine: ' · record ×{n}',
    finishersLine: ' · {n} finishers',
    wallDetail: '{score} bricks (~{pace}/min) · record {best} · max combo ×{combo}{paceDelta}',
    wallPaceDelta: ' · pace {delta} vs record',
    matsDetail: '{n} coins · record {best}{pet}{flyers}',
    matsPetEarned: ' · +{n} pet coins (total {wallet})',
    matsFlyers: ' · flyers = +3 per hit',
    advDetailWin: 'Level {lv} · {kills} monsters · {stars}★ · max combo ×{combo}{finishers}{streak}',
    advDetailLose: 'Level {lv} · {kills} monsters · max combo ×{combo}{finishers}{streak}',
    streakLine: ' · streak ×{n}',
    gambleLine: ' · gamble: {text}',
  },
  banner: {
    levelStart: 'LEVEL {n}',
    levelUp: 'LEVEL UP! Lv {lvl}', newWeapon: 'New weapon: {name}!', masterBuff: 'MASTER BUFF +20%',
    masterSword: 'MASTER SWORD!',
    bossWave: 'BOSS WAVE!', eliteWave: 'ELITE WAVE', superBossWave: 'SUPER-BOSS WAVE',
    waveClear: 'Wave cleared +{heal} HP', waveN: 'WAVE {n}/{total}',
    fight: 'FIGHT!', won: 'VICTORY!', lost: 'DEFEATED...',
    round: 'ROUND {n}', roundDecisive: 'ROUND {n} · decisive round', roundMatchPoint: 'ROUND {n} · match point',
    roundWon: 'ROUND WON!', roundLost: 'ROUND LOST',
    p1RoundWin: 'P1 WINS ROUND!', p2RoundWin: 'P2 WINS ROUND!',
    timeHpVs: 'TIME! {hp1}% vs {hp2}% · {msg}',
    summon: '✦ SUMMON! ✦', summonAscend: '{name} → {rar}!',
    newDex: 'New {rar}: {name}! +{hp} max HP', pet: 'PET! {name}',
    matsStart: 'MATS · COIN BONUS', wallStart: 'SMASH THE WALL!', bonusDone: 'BONUS DONE!',
    kets: 'KETS!', ketsBam: 'KETS-BAM!', wallTime: 'TIME!', wallNewWall: 'WALL SMASHED! New wall...',
  },
  help: { tips: [
    'Power-ups: defeated monsters sometimes drop orbs — HP, rage, chakra, shield.',
    'Bosses: below half HP they get fiercer (phase 2).',
    'Combos: hit quickly in a row to stack ×2 / ×3 damage.',
    'Dash: double-tap left/right (or Shift) to dodge.',
    'Rasengan: fill your chakra bar — then charge a spinning orb and slam it in.',
    'Substitution: smoke cloud + dodge (button or Shift). Brief invulnerability.',
    'Weapon combo: tap weapon 3× fast — each weapon has 3 moves (①②③). Hit with ① and ②, then ③ is a finisher (+damage, +chakra). Mastery: Virtuoso 3× · Master 10× · Legend 25× per weapon.',
    '2 players: roster with 5 saga-icons (Ki/Scroll/Tide/Cape/Dawn parody) + filters · best-of-3.',
    'RabbitRobot: uses Chidori (lightning) — wait until he opens up.',
    'Wall: 60s timer · combo bar (+4% smash per hit) · milestones ×3/×5/×8 · record pace in HUD · bomb/gold bonus bricks.',
    'Rarities: Common → Uncommon → Rare → Epic → Legendary → Mythic. Rarer = more XP & max HP.',
    '50 levels: 5 islands × 10 levels — skill gate weapons per island · boss Lv 10/20/30/40/50 opens next island · 5× loss = Master buff (+20%).',
    'Backup: every save is stored twice — if needed: Settings → Restore save from backup.',
    'Share: menu → Share link — friends on Android open in Chrome → Add to home screen. See ANDROID-DELEN.txt on GitHub.',
    'Offline: after opening online once the app caches HTML+JS — banner at bottom when offline. Tunnel links need internet; GitHub Pages + home screen = most stable.',
  ] },
  toast: {
    unknownMode: 'Unknown mode', noSession: 'No session yet — pick a mode',
    missionsIntro: 'Missions: Play → claim XP → daily bonus — light, no grind',
    missionReady1: '1 mission ready to claim', missionReadyN: '{n} missions ready to claim',
    dayBonusReady: 'Daily bonus +80 XP ready', noPlayLink: 'No play link found — see Settings',
    pasteSaveFirst: 'Paste save JSON in the box first', importPreview: 'Import preview — tap Import again to load',
    invalidSave: 'Invalid save — check JSON', noBackup: 'No backup found on this device',
    backupConfirm: 'Backup Lv {lvl}{drift} — tap again to restore',
    backupRestored: 'Backup restored — save + backup in sync',
    backupFailed: 'Backup restore failed — export save if you have one',
    syncConfirm: 'Sync overwrites backup with main save — tap again',
    syncOk: 'Backup synced with main save', syncFailed: 'Sync failed — export save as backup',
    clearConfirm: 'Tap again = wipe progress (backup stays)', newStart: 'Fresh start — backup still in Settings',
    exportCopied: 'Save copied + download · {summary} (~{size})',
    exportBox: 'Save in box + download · {summary} (~{size})',
    islandUnlock: '{name} unlocked! Skill gate: weapons up to Lv {cap}',
    masterBuffGain: 'Master buff! +20% HP, speed & damage until you win',
    eggDuplicate: 'Bonus egg duplicate: {name} (+10 XP)',
    eggNew: 'Bonus egg! {name} ({rar})',
    dexDiscover: '{rar}: {name} discovered! +{hp} HP',
    petTamed: '{name} tamed — companion! ({cur}/{need} kills)',
    styleUnlockTome: 'New style: Bookmaster!',
    styleUnlockCrystal: 'New style: Crystalline!',
    styleUnlock: 'New style: {name}!',
    summon: '✦ Summon! {name} is now {rar} — damage ×{dmg}',
    shurikenWait: 'Throw weapon on cooldown…',
    shurikenSpam: "Don't spam — max 3 rapid throws",
    missionDone: 'Mission complete: {text}',
    claimXp: '+{xp} XP · {text}',
    noMissionReady: 'No mission ready to claim yet',
    claimBatch1: '+{total} XP claimed',
    claimBatchN: '{n} missions · +{total} XP',
    dayBonusAlready: 'Daily bonus already claimed — 3 new tomorrow',
    dayBonusNeed1: 'Claim 1 more mission for daily bonus',
    dayBonusNeedN: 'Claim {n} more missions for +80 XP daily bonus',
    dayBonusDone: 'Daily bonus! +80 XP · see you tomorrow',
    allClaimedTapBonus: 'All claimed — tap Daily bonus (+80 XP)',
    followUp1: '1 more mission ready to claim (+{xp} XP)',
    followUpN: '{n} more missions ready · +{xp} XP',
    followUpBonus: 'Step 3: tap Daily bonus (+80 XP)',
    achievementUnlock: 'Achievement: {name} — see Missions',
    charSagaUnlock: 'Unlock at least 2 saga-icons (Ki/Scroll/Tide/Cape/Dawn)',
    charSagaClash: '{a} vs {b} — saga clash!',
    charSwap: 'P1 ↔ P2 swapped',
    charNotEnough: 'Not enough unlocked fighters in this saga',
    charRandom: '{a} vs {b} · HP {hp1}/{hp2} · TOT {tot1}/{tot2}',
    charFair: 'Fair duo: {a} vs {b} · TOT Δ{diff}',
    skillUpgradeReady: '{name} ready to upgrade — Collection → Upgrades',
    skillUpgraded: '{name} Lv {lv}! {detail}',
    itemUpgradeReady: '{name} ready to upgrade — Collection → Upgrades',
    itemUpgraded: '{name} Lv {lv}! {detail}',
    skipGamble: 'No gamble',
    weaponIslandCap: 'Ready for training — in adventure max Lv {cap}',
    petNone: 'No active pet',
    petFollow: '{name} follows you now!',
    petNoCoins: 'Not enough pet coins',
    petBought: '{name} bought! Follows you now.',
    eggAlreadyOpened: 'Daily egg already opened — try tomorrow',
    eggDuplicateUi: 'Duplicate egg: {name} (+10 XP)',
    eggHatch: 'Hatched! {name} ({rarity})',
    eggNone: 'No active egg pet',
    eggFloat: '{name} floats along now!',
    styleEquipped: '{name} equipped',
    welcome: 'Welcome! Menu → Tips · one short hint per mode (no toast stack)',
  },
  versionUpdate: {
    beforeTitle: 'Fetch new version',
    beforeBodyProgress: 'You have progress on this device:\n{summary}\n\nBack up save before v{version}? You can use it in the new version after reload.',
    beforeBodyFresh: 'Load new version (v{version})?\nNo progress found — you can update directly.',
    backupAndGo: 'Yes — back up save & update',
    goWithout: 'Update without extra backup',
    cancel: 'Cancel',
    afterTitle: 'Save found',
    afterBody: 'Before update (v{from}) you saved:\n{stashSummary}\n\nCurrent save:\n{currentSummary}\n\nUse this save in v{to}?',
    useStash: 'Yes — use saved backup',
    keepCurrent: 'No — keep current save',
    stashOk: 'Save backed up — starting update…',
    stashFail: 'Backup failed — try Export in Settings',
    applied: 'Save from v{from} loaded in v{to} · {summary}',
    applyFail: 'Load failed — try Restore backup in Settings',
    keptCurrent: 'Kept current save',
    fail: 'Update failed — close tab and reopen',
  },
  missionsUi: {
    flowDone: '✓ Day complete — 3 new missions tomorrow (midnight)',
    flowPlay: 'Play', flowPlaySub: 'do missions',
    flowClaim: 'Claim', flowClaimSub: '+XP',
    flowBonus: 'Daily bonus', flowBonusSub: '+80 XP',
    subDayDone: 'Day complete — 3 new light missions tomorrow (midnight)',
    subDayDoneStreak: 'Day complete · {streak} — 3 new light missions tomorrow (midnight)',
    subStep1: 'Step 1: play missions · max +{xp} XP today — light, no grind',
    subStep2: 'Step 2: claim +{xp} XP · then daily bonus (+80) — light, no grind',
    subStep3: 'Step 3: tap Daily bonus (+80 XP) — light, no grind',
    summaryDone: '{done}/3 done · {claimed}/3 claimed',
    summaryReady: '{n} ready to claim',
    summaryBonusReady: 'daily bonus +80 XP ready',
    summaryBonusAfter1: 'daily bonus after 1 claim',
    summaryBonusAfterN: 'daily bonus after {n} claims',
    summaryMax: 'max today +{xp} XP',
    claimAllBtn: 'Claim all ready',
    claimAllAfter1: '1 more claim for +80 daily bonus',
    claimAllAfterN: '{n} more claims for +80 daily bonus',
    claimAllThenBonus: 'then daily bonus +80',
    dailyClaimed: 'Claimed',
    dailyReady: 'Ready — tap Claim below',
    dailyProgress: 'In progress {cur}/{goal}',
    dailyReward: 'Reward +{xp} XP',
    dailyClaimBtn: 'Claim +{xp} XP',
    dailyPlayBtn: 'Play {mode} →',
    dailyNextUp: 'next up',
    bonusClaimed: 'Daily bonus claimed',
    bonusTomorrow: 'New tomorrow',
    bonusClaimBtn: 'Claim daily bonus',
    bonusTap: '+80 XP · tap here',
    bonusNeed: 'Daily bonus',
    bonusNeed1: '1 more claim needed',
    bonusNeedN: '{n} more claims needed',
    achSummary: '{got}/{total} achievements · permanent (not daily)',
    achNear: '{n} almost done',
    filterAll: 'All', filterNear: 'Almost', filterOpen: 'Open', filterDone: 'Earned',
    badgeNew: 'new', badgeNear: 'almost', stillOpen: 'still open',
    streakDone: '{n}× daily bonus · Determined!',
    streakLine: '{n}× daily bonus streak',
    statusDone: 'Done today{streak} · {ach}/{total} achievements · new missions tomorrow',
    statusStep2: 'Step 2: claim XP',
    statusStep3: 'Step 3: daily bonus +80 XP',
    statusStep1: 'Step 1: play missions',
    statusReady: '{hint} · +{xp} XP ready · {done}/3 done{streak}',
    statusAllClaimed: '{hint} — open Missions{streak} · {ach}/{total} achievements',
    statusDefault: '{hint} · {done}/3 done · max +{xp} XP today{streak}',
    remainderKills1: '1 kill left',
    remainderKillsN: '{n} kills left',
    remainderBricks1: '1 brick left',
    remainderBricksN: '{n} bricks left',
    remainderCombo: 'combo ×{n} left',
    remainderPickups1: '1 pickup left',
    remainderPickupsN: '{n} pickups left',
    remainderRun: '1 run left',
    remainderGeneric: '{n} left',
  },
  ui: {
    menuMissionReady: 'mission ready',
    menuFirstMinuteNext: 'First minute {seen}/{total} · try: {next}',
    menuFirstMinutePartial: 'First minute {seen}/{total} modes — one hint per mode at top',
    charSub1: 'Player 1 — tap an unlocked card (left half in fight)',
    charSub2: 'Player 2 — tap another fighter (right half in fight)',
    charStep1: 'Step 1/2 · Choose P1',
    charStep2: 'Step 2/2 · Choose P2',
    charRosterLine: '20 fighters · STR · RNG · mDPS · rDPS',
    charBlurbAll: '20 legends · tap card to pick · hover = stat preview',
    charEmpty: 'No fighters in this saga — tap ⭐ All',
    charLocked: '🔒 Locked',
    charIconRow: 'Saga icons · part 2 — tap to pick',
    charBig5Title: 'Legends · quick pick',
    charBig5Hint: 'Ryu · Ken · Goku · One Punch Man · Aruskankou · Kutjankorio · Xavi',
    charArenaPre: 'VERSUS · BEST OF 3',
    charHead: 'SELECT FIGHTER',
    charBackP1: '← Other P1',
    charBackMenu: '← Menu',
    charFight: 'FIGHT! (best-of-3)',
    charIpadTip: 'iPad: player 1 uses the left half (joystick + buttons), player 2 the right half. Landscape works best.',
    levelHead: 'Pick an island',
    levelSub: '5 islands × 10 levels · Tap level = Roll & start · long press = no gamble',
    gambleSub: 'Two dice: bad luck = super-boss in a random wave · lucky = strong ally (buff this level only)',
    gambleSumDefault: 'Tap Roll & start — or skip with no gamble',
    gambleSumRoll: 'Sum: {d1} + {d2} = {sum}',
    gambleHead: 'Gamble — {island} · Lv {level}',
    gambleCtx: 'Skill gate: weapons up to Lv {cap} · then roll for super-boss or ally',
    gamblePreview: 'Super-boss (sum ≤5) or super-ally (sum ≥9) can change this level.',
    gambleStart: 'Roll & start',
    gambleStartSub: '2× d6 · straight into level',
    gambleSkip: 'Skip',
    gambleSkipSub: 'No gamble — no extra boss or buff',
    styleHead: 'Style',
    styleSub: 'Outfits with bonus — level, training, monster book · hover for tooltip',
    styleActive: 'Active',
    stylePick: 'Tap to equip',
    styleIslandGate: 'Island skill Lv {lvl}',
    weaponHead: 'Weapons',
    weaponSub: 'Summons are real · island skill gate: adventure weapons up to your island cap',
    skillHead: 'Upgrades',
    skillSub: 'Adventure shards · skills, weapons, pets & style · usually max Lv 3 · rare Lv 5',
    skillTabSkills: 'Skills',
    skillTabWeapons: 'Weapons',
    skillTabPets: 'Pets',
    skillTabStyle: 'Style',
    upgradeSubSkills: 'Skill shards in adventure · jutsu max Lv 5 · utility max Lv 3',
    upgradeSubWeapons: 'Item shards for unlocked weapons · mythic max Lv 5',
    upgradeSubPets: 'Item shards for tamed pets · passive, assist & CD',
    upgradeSubStyle: 'Item shards for unlocked outfits · bonus, HP & shield',
    upgradeEmptyWeapons: 'Unlock weapons via adventure level first.',
    upgradeEmptyPets: 'Tame a pet via monster book kills or pet coins first.',
    upgradeEmptyStyle: 'Unlock styles via level, training or monster book first.',
    upgradeReady: '{n} ready to upgrade',
    upgradeShardHint: 'Gold = skill shard · purple = weapon/pet/style shard',
    itemUpgrade: 'Upgrade',
    itemMax: 'MAX',
    itemShards: '{cur}/{cost} shards',
    itemLevel: 'Lv {lv}/{max}',
    itemNow: 'Now',
    itemNext: 'Next',
    skillUpgrade: 'Upgrade',
    skillMax: 'MAX',
    skillShards: '{cur}/{cost} shards',
    skillShardsOnly: '{n} shards',
    skillLevel: 'Lv {lv}/{max}',
    skillNow: 'Now',
    skillNext: 'Next',
    skillGroupJutsu: 'Jutsu',
    skillGroupUtility: 'Utility',
    helpFirstMinute: 'First minute — one short hint per mode at top (no toast stack). Adventure: joystick + buttons · green = HP · full chakra = SUPER. Training = Robot · Wall = combo · 2P = left/right.',
    helpOnboardHead: 'First-minute hints: {seen}/{total} modes seen · max one line per mode at top',
    helpTryNext: 'Try next: {mode}',
    helpTrySub: 'Not played yet — one hint at top, no extra toast.',
    helpHintSeen: '✓ hint seen',
    helpHintNot: '· not yet',
    helpTouch: 'touch',
    helpKeyboard: 'keyboard',
    helpIslandTitle: 'Islands & skill gate',
    helpIslandIntro: 'adventure is 5×10 levels. Each island has a weapon cap (now Lv {cap} on island {cur}).',
    helpMasterBuff: 'Master buff: 5× loss on same level → +20% HP, speed & damage until you win. Boss Lv 10/20/30/40/50 opens next island.',
    helpIslandLocked: 'Locked — beat boss Lv {lv}',
    helpIslandProg: '{cleared}/{total} levels · {stars}/{maxStars}★ · skill gate weapons Lv {cap}',
    installSub: 'Shows as an icon — like a real app',
    boss: 'BOSS',
    topHunter: 'Top hunter',
    modeAdventure: '5 islands × 10 levels · skill gate weapons · Master buff after 5× loss · gamble roll before level',
    modeTraining: 'Combo trainer ×5/×8/×10 · 3s dummy · lasers · Chidori',
    modeWall: '60s · combo ×3/×5/×8 hints · record pace + projection in HUD · 5s warning',
    modeVersus: 'P1 left P2 right · best-of-3 · rematch in pause',
    modeCoinrun: '45s coins · 2 coins = 1 pet coin · aim ↑ · flyers +3',
    langSwitchFail: 'Language switch failed',
  },
  fighter: {
    chakraEmpty: 'Chakra not full!', subst: 'Substitution!', dash: 'Dash!',
    shield: 'Shield!', parry: 'PARRY!', block: 'BLOCK!', miss: 'MISS!',
  },
  egg: { dailyReady: 'Daily egg ready', advBonus: 'Bonus egg: win 1× adventure', tomorrow: 'Egg again tomorrow' },
  pet: {
    active: 'Pet · active', tamed: 'Pet · tamed', buy: 'Pet · buy {cost} 🪙',
    killsNeed: 'Pet · {need} kills', killsProgress: 'Pet · {cur}/{need} kills',
  },
  menu: { tips: [
    'Pick a tile — Adventure · Arcade · 2P · Collection',
    '5 islands — boss Lv 10/20/30/40/50 opens next island',
    'Skill gate — max weapon per island in adventure',
    '5× loss on one level = Master buff +20%',
    'Training = solo · Versus = 2P local on iPad',
    'Wall combos = faster smash & more XP',
    'Fill monster book = more max HP',
    'Continue resumes your last mode',
    'Menu music changes when you return from a mode',
  ] },
  combat: {
    counter: 'COUNTER!', crit: 'CRIT!', streak3: 'STREAK ×3', streak5: 'ON FIRE!',
    streak8: 'RAMPAGE!', streak12: 'UNSTOPPABLE!', streakHold: 'STREAK ×{n} locked!',
    combo3: 'Combo ×3 — keep going!', combo5: 'Combo ×5 — nice!', combo8: 'Combo ×8 — pro!',
    combo10: 'Combo ×10 — master!', comboN: 'COMBO ×{n}!',
    pickupHp: '+HP', pickupRage: 'RAGE ×1.4', pickupChakra: 'Full chakra!', pickupShield: 'Shield!',
    pickupSkillShard: '+1 {name} shard',
    pickupItemShard: '+1 {name} item-shard',
    giant: 'GIANT!', wallCombo3: 'Combo ×3 · smash +{pct}%',
    wallCombo5: 'Combo ×5 · smash +{pct}%', wallCombo8: 'Combo ×8 · smash +{pct}%',
    wallTempo: 'WALL TEMPO!', wallRecord: 'NEW RECORD!', bonus5: 'BONUS +5',
    masterSwordGain: "Hyrule's legendary blade — 15s!",
    masterSwordFade: 'Master Sword fades…',
    bossWaits: 'THE BOSS AWAITS…',
    checkpoint: 'CHECKPOINT — PART {part}/3',
    allyHeal: '+{heal} ally', allyHit: '{name} −{dmg}',
    gambleSuperBoss: 'Super-boss possible wave {n}', allyHelps: '{name} helps you!',
    masterBuffFloater: '5× lost — HP, speed & damage ↑',
    skillGate: 'Island skill gate: max weapon Lv {cap}',
    aimUp: 'Joystick up = aim higher',
    trainIntro: 'Combo trainer — 3s practice, robot waits',
    earLaser: 'Ear-laser — jump!', robotActive: 'Robot active — keep combo!',
    roundCombo: 'Round combo ×{n}',
    wallHalf: 'Half time — keep combo!', wallLast15: 'Last 15s — chase record!',
    wallLast5: '5s — full gas!', wallComboTipShort: 'Tip: quick consecutive hits fill combo',
    wallComboLost: 'Combo gone — hit again fast!', wallComboLow: 'Combo almost gone!',
    wallNearRec: 'Almost record — {gap} to go!', coinPlus1: '+1 coin', coinPlus3: '+3 coins',
  },
  hud: {
    super: 'SUPER', masterShort: 'MASTER +20%', masterSword: 'MASTER SWORD {n}s',
    levelWave: 'Level {n} — Wave {wv}/{total}', islandWeapon: '{name} · weapon ≤ Lv {cap}',
    part: 'part {cur}/3', waveLine: 'Wave {n}/{total}', wavesTotal: '{total} waves',
    nextWave: 'Next wave', eggPet: 'Egg · {name}', petActive: 'Pet · {name}',
    petDefault: 'Companion', cosmetic: 'Cosmetic',
    gambleBoss: 'Super-boss possible · wave {n}', starZone: ' · 3★ zone',
    star2: ' · 2★ at >{pct}% HP', star3: ' · 3★ at >{pct}% HP', hpPct: '{pct}% HP{hint}',
    enemiesLeft1: '1 enemy left this wave', enemiesLeftN: '{n} enemies left this wave',
    toBoss: 'Heading to boss — {sec}s', walkNext: 'Walking on… next wave {sec}s',
    streak: 'STREAK ×{n}', combo: 'COMBO ×{n}', rage: 'RAGE {n}s', shield: 'Shield {n}s',
    earLaser: 'EAR-LASER — jump!', chidoriTele: 'CHIDORI — dash/jump!',
    kickTele: 'KICK — jump/block!', punchTele: 'PUNCH — block/dodge!', earLaserShort: 'EAR-LASER',
    rabbitRobot: 'RABBITROBOT · {pct}%', roundInfo: 'Round {n} · first to 2 · {s}-{r}',
    dummyGrace: 'Dummy {n}s — practice combo', goal: 'goal ×{n}', record: 'record ×{n}',
    time: 'TIME', wallGen: 'WALL ×{n}', stones: 'Stones: {n}',
    recordGap: 'Record {best} · {gap} to go',
    recordBroken: 'Record broken · {rec}', recordLine: 'Record: {rec}',
    pace: '~{pace}/min · projection ~{proj}', paceAhead: 'Ahead of record pace +{n}',
    paceBehind: 'Behind record pace {n}', comboLabel: 'COMBO',
    comboSmash: '+{pct}% smash', comboActive: 'Combo active — one more brick!',
    coins: 'Coins: {n}', matsRecord: 'Mats record: {n}',
    petCoins: 'Pet coins: +{pending} · wallet {wallet}',
    matsHint: 'Joystick ↑ aim · melee/throw higher · shuriken on pink flyers',
    spawnFair: 'Spawn · fair start', nextRound: 'Next round',
    p1Line: 'P1 · {name} · {pct}%', p2Line: '{pct}% · {name} · P2',
    decisiveRound: 'Decisive round · {s}-{r}',
    timeHpWin: 'TIME = highest HP % wins',
    hintDualTouch: 'P1 = left half · P2 = right half · joystick + attack buttons',
    hintDualKb: 'P1: A/D · W · J/K/L/U · Shift  |  P2: arrows · 1/2/3/4/5',
    hintTouch: 'Left: joystick to walk · Right: attack buttons',
    hintKb: 'A/D walk · W jump · J punch · K kick · L weapon · U special',
    ketsTap: 'Tap!', ketsKey: 'E / tap',
  },
  jutsu: { rasengan: 'RASENGAN!', chidori: 'CHIDORI!', rinnegan: 'RINNEGAN!' },
  skill: {
    rasengan: 'Rasengan', chidori: 'Chidori', rinnegan: 'Rinnegan',
    subst: 'Substitution', dash: 'Dash', chakra: 'Chakra',
  },
  gamble: {
    superBoss: 'Bad luck! Super-boss in a random wave',
    miniBoss: 'Risk: extra elite in a wave',
    superAlly: 'Jackpot! Super-ally: {name} (strong buff)',
    ally: 'Lucky! Ally: {name} (buff this level)',
    neutral: 'Neutral — normal level (no extra gamble effect)',
  },
};

const CATALOG_DE = {
  ach: {
    first_win: { name: 'Erster Triumph', desc: 'Gewinne dein erstes Level' },
    lv10: { name: 'Wachsender Ninja', desc: 'Erreiche Kämpfer Lv 10' },
    dex10: { name: 'Monsterkenner', desc: '10 Arten im Monsterbuch' },
    dexFull: { name: 'Enzyklopädie', desc: 'Alle Monsterarten entdeckt' },
    dex100: { name: 'Jäger', desc: '100 Monster-Kills registriert' },
    dexHalf: { name: 'Feldguide', desc: 'Hälfte aller Arten entdeckt' },
    dexTiers: { name: 'Seltenheitsjäger', desc: '4 Seltenheiten im Buch' },
    dexMythic: { name: 'Mythensucher', desc: 'Ein mythisches Monster entdeckt' },
    train5: { name: 'Robotbrecher', desc: '5× Training gewonnen' },
    wall100: { name: 'Schlacker', desc: 'Mauer-Rekord 100+' },
    combo8: { name: 'Combo-König', desc: 'Combo ×8 erreicht' },
    finisher10: { name: 'Stil-Meister', desc: '10 Waffen-Finisher gelandet' },
    finisher1: { name: 'Erster Stil', desc: 'Lande deinen ersten Finisher' },
    weaponMaster25: { name: 'Waffenlegende', desc: '25 Finisher mit einer Waffe' },
    finisher50: { name: 'Combo-Sensei', desc: '50 Finisher insgesamt' },
    streak10: { name: 'Unaufhaltsam', desc: 'Kill-Streak ×10 im Abenteuer' },
    trainCombo10: { name: 'Dummy-Meister', desc: 'Training-Combo ×10' },
    lv50: { name: 'Legende', desc: 'Level 50 freischalten' },
    daily7: { name: 'Entschlossen', desc: '7 Tagesboni abgeholt' },
    vs5: { name: 'Duellant', desc: '5× 2-Spieler-Duell gespielt' },
    vs_roster: { name: 'Volles Roster', desc: '10+ verschiedene Kämpfer (2P)' },
    saga_icons: { name: 'Saga-Legenden', desc: '2P mit allen 7 Legend-Picks' },
  },
  daily: {
    kills12: { text: 'Besiege 12 Monster', hint: 'Abenteuer oder Training spielen' },
    advwin: { text: 'Gewinne 1 Abenteuer-Level', hint: 'Menü → Abenteuer, Level gewinnen' },
    wall35: { text: 'Zerstöre 35 Mauersteine', hint: 'Menü → Mauer (Combo hilft)' },
    trainwin: { text: 'Gewinne Training vs Robot', hint: 'Menü → Training vs RabbitRobot' },
    combo5: { text: 'Erreiche Combo ×5', hint: 'Abenteuer: schnelle Combos' },
    finisher3: { text: 'Lande 3 Waffen-Finisher', hint: '①+② treffen, dann Finisher ③' },
    pick3: { text: 'Sammle 3 Power-ups', hint: 'Abenteuer: grüne/orange/blaue Kugeln' },
    boss1: { text: 'Besiege 1 Boss-Monster', hint: 'Abenteuer: Boss am Levelende' },
  },
  weapon: {
    vuist: { name: 'Fäuste', desc: 'Taijutsu-Grundlagen' }, kunai: { name: 'Kunai', desc: 'Klassische Ninja-Klinge' },
    shuriken: { name: 'Shuriken', desc: 'Wirft scharfe Sterne' }, tanto: { name: 'Tanto', desc: 'Kurze Klinge · schnell' },
    zwaard: { name: 'Ninja-Schwert', desc: 'Kenjutsu-Allrounder' }, sai: { name: 'Sai', desc: 'Dreizack · parieren' },
    knuppel: { name: 'Knüppel', desc: 'Rohe Schlagkraft' }, waaier: { name: 'Kriegsfächer', desc: 'Fächer-Schnitt · stilvoll' },
    speer: { name: 'Speer', desc: 'Enorme Reichweite' }, tonfa: { name: 'Tonfa', desc: 'Seitengriff · Flurry' },
    nunchaku: { name: 'Nunchaku', desc: 'Blitzschnell' }, kama: { name: 'Kama', desc: 'Sichel · Haken-Schläge' },
    boemerang: { name: 'Bumerang', desc: 'Kommt zurück' }, zeis: { name: 'Schattensense', desc: 'Langer Bogen · dunkel' },
    hamer: { name: 'Vorschlaghammer', desc: 'Zerstört alles' }, drietand: { name: 'Dreizack', desc: 'Drei Spitzen · stechen' },
    ketting: { name: 'Kettenklinge', desc: 'Reichweite + Druck' }, bostaf: { name: 'Bo-Stab', desc: 'Langer Stab · Tempo' },
    laser: { name: 'Chakra-Klinge', desc: 'Blau brennende Klinge' }, fuuma: { name: 'Fūma-Shuriken', desc: 'Großer Wurfstern' },
    kristal: { name: 'Kristallklinge', desc: 'Splitter-Schnitt' }, donder: { name: 'Blitz-Axt', desc: 'Wie Chidori, aber eine Axt' },
    vlamzweep: { name: 'Flammenpeitsche', desc: 'Feuerlinie · lange Reichweite' }, void: { name: 'Void-Klaue', desc: 'Mythische Klaue' },
    sterkling: { name: 'Sternklinge', desc: 'Himmelsmetall · Crits' }, guvve: { name: 'Guvvedukkie-Stab', desc: 'Quak. Bitte. Boom.' },
  },
  style: {
    classic: { name: 'Klassisch', hint: 'Standard-Ninja', tooltip: 'Basis-Ninja — kein Bonus.', bonus: 'Kein Kampfbonus' },
    konoha: { name: 'Konoha-Bandana', hint: 'Lv 5', tooltip: 'Leaf-Dorf-Kopfband. Etwas mehr max HP.', bonus: '+5 max HP' },
    chakra: { name: 'Chakra-Glühen', hint: '3× Training gewinnen', tooltip: 'Blaues Chakra. Schnelleres Laden.', bonus: '+8% Chakra-Regen' },
    akatsuki: { name: 'Roter Mantel', hint: 'Lv 12', tooltip: 'Aggressive Schläge.', bonus: '+4% Schaden' },
    shadow: { name: 'Schatten-Ninja', hint: 'Lv 15', tooltip: 'Extra Crit-Chance.', bonus: '+3% Crit' },
    guvve: { name: 'Guvvedukkie', hint: '8 Monster im Buch', tooltip: 'Quack-Cosplay. Bonus-XP.', bonus: '+6% Abenteuer-XP' },
    gold: { name: 'Legendär', hint: 'Lv 25', tooltip: 'Goldene Umrandung.', bonus: '+10% Knockback' },
    sand: { name: 'Wüste', hint: 'Lv 8', tooltip: 'Sandmantel — weniger Schaden.', bonus: '−14% Schaden · Block −25%' },
    samurai: { name: 'Samurai', hint: 'Lv 20', tooltip: 'Katana-Haltung.', bonus: '+8% Waffen-Reichweite' },
    cyber: { name: 'Cyber-Ninja', hint: 'Lv 18', tooltip: 'Neon-Visier.', bonus: 'Blitz-FX · +6% Chakra' },
    fox: { name: 'Fuchs-Ninja', hint: '12 Monster im Buch', tooltip: 'Fuchsohren — schneller.', bonus: '+5% Lauftempo' },
    storm: { name: 'Sturmgeist', hint: '5× Training gewinnen', tooltip: 'Sturm-Aura.', bonus: 'Blitz · +0,8s Schild/Welle' },
    void: { name: 'Void-Wanderer', hint: 'Lv 40', tooltip: 'Schwerere Jutsu.', bonus: '+8% Jutsu-Schaden' },
    hunter: { name: 'Jägerlook', hint: '75 Kills im Buch', tooltip: 'Jäger-Umhang.', bonus: '+6% vs Monster' },
    crystal: { name: 'Kristallin', hint: '4 Seltenheiten', tooltip: 'Kristall-Splitter.', bonus: '+1,0s Schild/Welle' },
    tome: { name: 'Buchmeister', hint: 'Hälfte des Buches', tooltip: 'Monsterbuch auf dem Rücken.', bonus: '+4 max HP · Buchweisheit' },
  },
  result: {
    advWin: 'GEWONNEN!', advLose: 'BESIEGT...', trainWin: 'MEISTER!', trainLose: 'ROBOT GEWINNT...',
    vsP1Win: 'SPIELER 1 GEWINNT!', vsP2Win: 'SPIELER 2 GEWINNT!', wallRecord: 'NEUER REKORD!', wallTime: 'ZEIT UM!',
    matsRecord: 'MATS-REKORD!', matsDone: 'Gut gemacht, Mats!',
  },
  banner: {
    levelUp: 'LEVEL UP! Lv {lvl}', masterBuff: 'MEISTER-BUFF +20%', bossWave: 'BOSS-WELLE!',
    fight: 'KÄMPF!', won: 'GEWONNEN!', lost: 'VERLOREN...', summon: '✦ SUMMON! ✦',
    matsStart: 'MATS · MÜNZEN-BONUS', wallStart: 'ZERSTÖRE DIE MAUER!', bonusDone: 'BONUS FERTIG!',
    kets: 'KETS!', ketsBam: 'KETS-BAM!',
  },
  help: { tips: [
    'Power-ups: besiegte Monster lassen manchmal Kugeln fallen — HP, Rage, Chakra, Schild.',
    'Bosse: unter halb HP werden sie wütender (Phase 2).',
    'Combos: schnell hintereinander schlagen für ×2 / ×3 Schaden.',
    'Dash: doppelt tippen links/rechts (oder Shift) zum Ausweichen.',
    'Rasengan: Chakra-Balken füllen — dann Kugel laden und einschlagen.',
    'Substitution: Rauchwolke + Ausweichen (Taste oder Shift). Kurz unverwundbar.',
    'Waffen-Combo: Waffe 3× schnell — ①②③. Mit ① und ② treffen, dann ③ Finisher.',
    '2 Spieler: Roster mit 5 Saga-Icons · Best-of-3.',
    'RabbitRobot: nutzt Chidori — warte auf eine Lücke.',
    'Mauer: 60s · Combo-Balken · Meilensteine ×3/×5/×8 · Rekord-Tempo im HUD.',
    'Seltenheiten: Gewöhnlich → Ungewöhnlich → Selten → Episch → Legendär → Mythisch.',
    '50 Level: 5 Inseln × 10 — Skill-Gate · Boss Lv 10/20/30/40/50 · 5× Verlust = Meister-Buff.',
    'Backup: jede Save doppelt — Einstellungen → Backup wiederherstellen.',
    'Teilen: Menü → Link teilen — Chrome auf Android → Zum Home-Bildschirm.',
    'Offline: nach 1× online wird gecacht — Banner unten ohne Netz.',
  ] },
};

const CATALOG_FR = {
  ach: {
    first_win: { name: 'Première victoire', desc: 'Gagne ton premier niveau' },
    lv10: { name: 'Ninja en croissance', desc: 'Atteins combattant Lv 10' },
    dex10: { name: 'Expert monstres', desc: '10 espèces au bestiaire' },
    dexFull: { name: 'Encyclopédie', desc: 'Toutes les espèces découvertes' },
    dex100: { name: 'Chasseur', desc: '100 kills enregistrés' },
    dexHalf: { name: 'Guide terrain', desc: 'Moitié des espèces découvertes' },
    dexTiers: { name: 'Chasseur de raretés', desc: '4 raretés au bestiaire' },
    dexMythic: { name: 'Chercheur de mythes', desc: 'Un monstre mythique découvert' },
    train5: { name: 'Brise-robot', desc: '5× entraînement gagné' },
    wall100: { name: 'Démolisseur', desc: 'Record mur 100+' },
    combo8: { name: 'Roi du combo', desc: 'Combo ×8 atteint' },
    finisher10: { name: 'Maître du style', desc: '10 finishers d\'arme' },
    finisher1: { name: 'Premier style', desc: 'Ton premier finisher' },
    weaponMaster25: { name: 'Légende d\'arme', desc: '25 finishers avec une arme' },
    finisher50: { name: 'Sensei combo', desc: '50 finishers au total' },
    streak10: { name: 'Impossible à arrêter', desc: 'Série ×10 en aventure' },
    trainCombo10: { name: 'Maître du dummy', desc: 'Combo entraînement ×10' },
    lv50: { name: 'Légende', desc: 'Débloquer niveau 50' },
    daily7: { name: 'Déterminé', desc: '7 bonus quotidiens réclamés' },
    vs5: { name: 'Duelliste', desc: '5× duels 2 joueurs' },
    vs_roster: { name: 'Roster complet', desc: '10+ combattants différents (2P)' },
    saga_icons: { name: 'Légendes saga', desc: '2P avec les 7 légendes' },
  },
  daily: {
    kills12: { text: 'Vaincs 12 monstres', hint: 'Joue Aventure ou Entraînement' },
    advwin: { text: 'Gagne 1 niveau aventure', hint: 'Menu → Aventure, gagne le niveau' },
    wall35: { text: 'Casse 35 briques du mur', hint: 'Menu → Mur (combo aide)' },
    trainwin: { text: 'Gagne entraînement vs Robot', hint: 'Menu → Entraînement vs RabbitRobot' },
    combo5: { text: 'Atteins combo ×5', hint: 'Aventure : combos rapides' },
    finisher3: { text: 'Lande 3 finishers d\'arme', hint: '①+② puis finisher ③' },
    pick3: { text: 'Prends 3 power-ups', hint: 'Aventure : orbes vert/orange/bleu' },
    boss1: { text: 'Vaincs 1 boss', hint: 'Aventure : boss en fin de niveau' },
  },
  weapon: {
    vuist: { name: 'Poings', desc: 'Bases taijutsu' }, kunai: { name: 'Kunai', desc: 'Lame ninja classique' },
    shuriken: { name: 'Shuriken', desc: 'Lance des étoiles' }, tanto: { name: 'Tanto', desc: 'Lame courte · rapide' },
    zwaard: { name: 'Épée ninja', desc: 'Kenjutsu polyvalent' }, sai: { name: 'Sai', desc: 'Trois dents · parade' },
    knuppel: { name: 'Massue', desc: 'Force brute' }, waaier: { name: 'Éventail de guerre', desc: 'Entaille stylée' },
    speer: { name: 'Lance', desc: 'Grande portée' }, tonfa: { name: 'Tonfa', desc: 'Poignée latérale' },
    nunchaku: { name: 'Nunchaku', desc: 'Ultra rapide' }, kama: { name: 'Kama', desc: 'Faucille · crochet' },
    boemerang: { name: 'Boomerang', desc: 'Revient en arrière' }, zeis: { name: 'Faux de l\'ombre', desc: 'Long arc · sombre' },
    hamer: { name: 'Masse', desc: 'Tout détruit' }, drietand: { name: 'Trident', desc: 'Trois pointes' },
    ketting: { name: 'Lame chaîne', desc: 'Portée + pression' }, bostaf: { name: 'Bô', desc: 'Long bâton' },
    laser: { name: 'Lame chakra', desc: 'Lame bleue ardente' }, fuuma: { name: 'Shuriken Fūma', desc: 'Grande étoile' },
    kristal: { name: 'Lame cristal', desc: 'Entaille de shards' }, donder: { name: 'Hache foudre', desc: 'Comme Chidori, en hache' },
    vlamzweep: { name: 'Fouet flamme', desc: 'Ligne de feu' }, void: { name: 'Griffe du vide', desc: 'Griffe mythique' },
    sterkling: { name: 'Lame étoile', desc: 'Métal céleste · crits' }, guvve: { name: 'Bâton Guvvedukkie', desc: 'Coin. S\'il vous plaît. Boum.' },
  },
  style: {
    classic: { name: 'Classique', hint: 'Ninja standard', tooltip: 'Ninja de base — pas de bonus.', bonus: 'Pas de bonus combat' },
    konoha: { name: 'Bandana Konoha', hint: 'Lv 5', tooltip: 'Bandeau du village.', bonus: '+5 PV max' },
    chakra: { name: 'Lueur chakra', hint: '3× entraînement gagné', tooltip: 'Aura bleue.', bonus: '+8% regen chakra' },
    akatsuki: { name: 'Manteau rouge', hint: 'Lv 12', tooltip: 'Coups agressifs.', bonus: '+4% dégâts' },
    shadow: { name: 'Ninja ombre', hint: 'Lv 15', tooltip: 'Crit en plus.', bonus: '+3% crit' },
    guvve: { name: 'Guvvedukkie', hint: '8 monstres au bestiaire', tooltip: 'Cosplay coin-coin.', bonus: '+6% XP aventure' },
    gold: { name: 'Légendaire', hint: 'Lv 25', tooltip: 'Contour doré.', bonus: '+10% knockback' },
    sand: { name: 'Désert', hint: 'Lv 8', tooltip: 'Manteau de sable.', bonus: '−14% dégâts · bloc −25%' },
    samurai: { name: 'Samouraï', hint: 'Lv 20', tooltip: 'Posture katana.', bonus: '+8% portée arme' },
    cyber: { name: 'Cyber-ninja', hint: 'Lv 18', tooltip: 'Visière néon.', bonus: 'FX éclair · +6% chakra' },
    fox: { name: 'Ninja renard', hint: '12 monstres', tooltip: 'Oreilles de renard.', bonus: '+5% vitesse' },
    storm: { name: 'Esprit tempête', hint: '5× entraînement', tooltip: 'Aura tempête.', bonus: 'Éclair · +0,8s bouclier/vague' },
    void: { name: 'Marcheur du vide', hint: 'Lv 40', tooltip: 'Jutsu plus lourds.', bonus: '+8% dégâts jutsu' },
    hunter: { name: 'Look chasseur', hint: '75 kills bestiaire', tooltip: 'Cape chasseur.', bonus: '+6% vs monstres' },
    crystal: { name: 'Cristallin', hint: '4 raretés', tooltip: 'Éclat cristal.', bonus: '+1,0s bouclier/vague' },
    tome: { name: 'Maître du livre', hint: 'Moitié du bestiaire', tooltip: 'Bestiaire sur le dos.', bonus: '+4 PV max · sagesse' },
  },
  result: {
    advWin: 'VICTOIRE !', advLose: 'DÉFAITE...', trainWin: 'CHAMPION !', trainLose: 'ROBOT GAGNE...',
    vsP1Win: 'JOUEUR 1 GAGNE !', vsP2Win: 'JOUEUR 2 GAGNE !', wallRecord: 'NOUVEAU RECORD !', wallTime: 'FIN DU TEMPS !',
    matsRecord: 'RECORD MATS !', matsDone: 'Bien joué, Mats !',
  },
  banner: {
    levelUp: 'LEVEL UP ! Lv {lvl}', masterBuff: 'BUFF MAÎTRE +20 %', bossWave: 'VAGUE BOSS !',
    fight: 'COMBAT !', won: 'VICTOIRE !', lost: 'DÉFAITE...', summon: '✦ INVOCATION ! ✦',
    matsStart: 'MATS · BONUS PIÈCES', wallStart: 'CASSE LE MUR !', bonusDone: 'BONUS TERMINÉ !',
    kets: 'KETS !', ketsBam: 'KETS-BAM !',
  },
  help: { tips: [
    'Power-ups : les monstres vaincus laissent parfois des orbes — PV, rage, chakra, bouclier.',
    'Boss : sous la moitié des PV ils deviennent plus furieux (phase 2).',
    'Combos : enchaîne vite pour ×2 / ×3 dégâts.',
    'Dash : double-tap gauche/droite (ou Shift) pour esquiver.',
    'Rasengan : remplis la barre chakra — charge une boule et frappe.',
    'Substitution : nuage de fumée + esquive (bouton ou Shift). Invulnérabilité brève.',
    'Combo arme : arme 3× vite — ①②③. Touche ① et ②, puis ③ finisher.',
    '2 joueurs : roster 5 icônes saga · best-of-3.',
    'RabbitRobot : utilise Chidori — attends qu\'il s\'ouvre.',
    'Mur : 60 s · barre combo · jalons ×3/×5/×8 · tempo record au HUD.',
    'Raretés : Commun → Peu commun → Rare → Épique → Légendaire → Mythique.',
    '50 niveaux : 5 îles × 10 — skill gate · boss Lv 10/20/30/40/50 · 5× échec = buff maître.',
    'Backup : chaque save est doublée — Options → Restaurer backup.',
    'Partager : menu → Lien — Chrome Android → Écran d\'accueil.',
    'Hors ligne : après 1× en ligne, cache HTML+JS — bannière sans réseau.',
  ] },
};

const CATALOG_ES = {
  ach: {
    first_win: { name: 'Primer triunfo', desc: 'Gana tu primer nivel' },
    lv10: { name: 'Ninja en crecimiento', desc: 'Alcanza luchador Lv 10' },
    dex10: { name: 'Experto monstruos', desc: '10 especies en el bestiario' },
    dexFull: { name: 'Enciclopedia', desc: 'Todas las especies descubiertas' },
    dex100: { name: 'Cazador', desc: '100 kills registrados' },
    dexHalf: { name: 'Guía de campo', desc: 'Mitad de especies descubiertas' },
    dexTiers: { name: 'Cazador de rarezas', desc: '4 rarezas en el libro' },
    dexMythic: { name: 'Buscador de mitos', desc: 'Un monstruo mítico descubierto' },
    train5: { name: 'Rompe-robots', desc: '5× entrenamiento ganado' },
    wall100: { name: 'Demoledor', desc: 'Récord muro 100+' },
    combo8: { name: 'Rey del combo', desc: 'Combo ×8 alcanzado' },
    finisher10: { name: 'Maestro del estilo', desc: '10 finishers de arma' },
    finisher1: { name: 'Primer estilo', desc: 'Tu primer finisher' },
    weaponMaster25: { name: 'Leyenda de armas', desc: '25 finishers con un arma' },
    finisher50: { name: 'Sensei combo', desc: '50 finishers en total' },
    streak10: { name: 'Imparable', desc: 'Racha ×10 en aventura' },
    trainCombo10: { name: 'Maestro del dummy', desc: 'Combo entrenamiento ×10' },
    lv50: { name: 'Leyenda', desc: 'Desbloquear nivel 50' },
    daily7: { name: 'Determinado', desc: '7 bonos diarios reclamados' },
    vs5: { name: 'Duelista', desc: '5× duelos a 2 jugadores' },
    vs_roster: { name: 'Roster completo', desc: '10+ luchadores distintos (2P)' },
    saga_icons: { name: 'Leyendas saga', desc: '2P con las 7 leyendas' },
  },
  daily: {
    kills12: { text: 'Derrota 12 monstruos', hint: 'Juega Aventura o Entrenamiento' },
    advwin: { text: 'Gana 1 nivel aventura', hint: 'Menú → Aventura, gana el nivel' },
    wall35: { text: 'Rompe 35 ladrillos del muro', hint: 'Menú → Muro (combo ayuda)' },
    trainwin: { text: 'Gana entrenamiento vs Robot', hint: 'Menú → Entrenamiento vs RabbitRobot' },
    combo5: { text: 'Alcanza combo ×5', hint: 'Aventura: combos rápidos' },
    finisher3: { text: 'Aterriza 3 finishers de arma', hint: '①+② luego finisher ③' },
    pick3: { text: 'Recoge 3 power-ups', hint: 'Aventura: orbes verde/naranja/azul' },
    boss1: { text: 'Derrota 1 jefe', hint: 'Aventura: jefe al final del nivel' },
  },
  weapon: {
    vuist: { name: 'Puños', desc: 'Básicos taijutsu' }, kunai: { name: 'Kunai', desc: 'Cuchilla ninja clásica' },
    shuriken: { name: 'Shuriken', desc: 'Lanza estrellas' }, tanto: { name: 'Tanto', desc: 'Hoja corta · rápida' },
    zwaard: { name: 'Espada ninja', desc: 'Kenjutsu versátil' }, sai: { name: 'Sai', desc: 'Tres puntas · parada' },
    knuppel: { name: 'Garrote', desc: 'Fuerza bruta' }, waaier: { name: 'Abanico de guerra', desc: 'Corte con estilo' },
    speer: { name: 'Lanza', desc: 'Gran alcance' }, tonfa: { name: 'Tonfa', desc: 'Empuñadura lateral' },
    nunchaku: { name: 'Nunchaku', desc: 'Ultrarrápido' }, kama: { name: 'Kama', desc: 'Hoz · gancho' },
    boemerang: { name: 'Bumerán', desc: 'Vuelve atrás' }, zeis: { name: 'Guadaña sombra', desc: 'Arco largo · oscuro' },
    hamer: { name: 'Mazo', desc: 'Lo destroza todo' }, drietand: { name: 'Tridente', desc: 'Tres puntas' },
    ketting: { name: 'Espada cadena', desc: 'Alcance + presión' }, bostaf: { name: 'Bastón bo', desc: 'Bastón largo' },
    laser: { name: 'Hoja chakra', desc: 'Filo azul ardiente' }, fuuma: { name: 'Shuriken Fūma', desc: 'Estrella grande' },
    kristal: { name: 'Hoja cristal', desc: 'Corte de fragmentos' }, donder: { name: 'Hacha rayo', desc: 'Como Chidori, pero hacha' },
    vlamzweep: { name: 'Látigo llama', desc: 'Línea de fuego' }, void: { name: 'Garra void', desc: 'Garra mítica' },
    sterkling: { name: 'Hoja estrella', desc: 'Metal celestial · críticos' }, guvve: { name: 'Palo Guvvedukkie', desc: 'Cuac. Por favor. Boom.' },
  },
  style: {
    classic: { name: 'Clásico', hint: 'Ninja estándar', tooltip: 'Ninja base — sin bonus.', bonus: 'Sin bonus combate' },
    konoha: { name: 'Bandana Konoha', hint: 'Lv 5', tooltip: 'Cinta del pueblo.', bonus: '+5 HP máx' },
    chakra: { name: 'Brillo chakra', hint: '3× entrenamiento ganado', tooltip: 'Aura azul.', bonus: '+8% regen chakra' },
    akatsuki: { name: 'Capa roja', hint: 'Lv 12', tooltip: 'Golpes agresivos.', bonus: '+4% daño' },
    shadow: { name: 'Ninja sombra', hint: 'Lv 15', tooltip: 'Más críticos.', bonus: '+3% crít' },
    guvve: { name: 'Guvvedukkie', hint: '8 monstruos en libro', tooltip: 'Cosplay cuac.', bonus: '+6% XP aventura' },
    gold: { name: 'Legendario', hint: 'Lv 25', tooltip: 'Contorno dorado.', bonus: '+10% knockback' },
    sand: { name: 'Desierto', hint: 'Lv 8', tooltip: 'Capa de arena.', bonus: '−14% daño · bloqueo −25%' },
    samurai: { name: 'Samurái', hint: 'Lv 20', tooltip: 'Postura katana.', bonus: '+8% alcance arma' },
    cyber: { name: 'Cyber-ninja', hint: 'Lv 18', tooltip: 'Visor neón.', bonus: 'FX rayo · +6% chakra' },
    fox: { name: 'Ninja zorro', hint: '12 monstruos', tooltip: 'Orejas de zorro.', bonus: '+5% velocidad' },
    storm: { name: 'Espíritu tormenta', hint: '5× entrenamiento', tooltip: 'Aura tormenta.', bonus: 'Rayo · +0,8s escudo/ola' },
    void: { name: 'Caminante void', hint: 'Lv 40', tooltip: 'Jutsu más fuertes.', bonus: '+8% daño jutsu' },
    hunter: { name: 'Look cazador', hint: '75 kills libro', tooltip: 'Capa cazador.', bonus: '+6% vs monstruos' },
    crystal: { name: 'Cristalino', hint: '4 rarezas', tooltip: 'Fragmento cristal.', bonus: '+1,0s escudo/ola' },
    tome: { name: 'Maestro del libro', hint: 'Mitad del bestiario', tooltip: 'Libro en la espalda.', bonus: '+4 HP máx · sabiduría' },
  },
  result: {
    advWin: '¡VICTORIA!', advLose: 'DERROTA...', trainWin: '¡CAMPEÓN!', trainLose: 'ROBOT GANA...',
    vsP1Win: '¡JUGADOR 1 GANA!', vsP2Win: '¡JUGADOR 2 GANA!', wallRecord: '¡NUEVO RÉCORD!', wallTime: '¡SE ACABÓ EL TIEMPO!',
    matsRecord: '¡RÉCORD MATS!', matsDone: '¡Bien hecho, Mats!',
  },
  banner: {
    levelUp: '¡SUBIDA DE NIVEL! Lv {lvl}', masterBuff: 'BUFF MAESTRO +20%', bossWave: '¡OLA JEFE!',
    fight: '¡LUCHA!', won: '¡VICTORIA!', lost: 'DERROTA...', summon: '✦ ¡INVOCACIÓN! ✦',
    matsStart: 'MATS · BONUS MONEDAS', wallStart: '¡ROMPE EL MURO!', bonusDone: '¡BONUS LISTO!',
    kets: '¡KETS!', ketsBam: '¡KETS-BAM!',
  },
  help: { tips: [
    'Power-ups: monstruos derrotados sueltan orbes — HP, furia, chakra, escudo.',
    'Jefes: bajo mitad HP se vuelven más feroces (fase 2).',
    'Combos: golpea rápido para ×2 / ×3 daño.',
    'Dash: doble toque izquierda/derecha (o Shift) para esquivar.',
    'Rasengan: llena la barra chakra — carga una bola y golpea.',
    'Substitución: nube de humo + esquiva (botón o Shift). Invulnerabilidad breve.',
    'Combo arma: arma 3× rápido — ①②③. Acierta ① y ②, luego ③ finisher.',
    '2 jugadores: roster 5 iconos saga · best-of-3.',
    'RabbitRobot: usa Chidori — espera que se abra.',
    'Muro: 60 s · barra combo · hitos ×3/×5/×8 · ritmo récord en HUD.',
    'Rarezas: Común → Poco común → Raro → Épico → Legendario → Mítico.',
    '50 niveles: 5 islas × 10 — skill gate · jefe Lv 10/20/30/40/50 · 5× derrotas = buff maestro.',
    'Backup: cada save se guarda doble — Opciones → Restaurar backup.',
    'Compartir: menú → Enlace — Chrome Android → Añadir a inicio.',
    'Offline: tras 1× online cachea HTML+JS — banner sin red.',
  ] },
};

function weaponLabel(w) {
  const id = typeof w === 'string' ? w : (w && w.id);
  const k = 'weapon.' + id + '.name';
  const v = t(k);
  if (v && v !== k) return v;
  const ww = typeof w === 'object' && w ? w : (typeof weaponById === 'function' ? weaponById(id) : null);
  return ww ? ww.name : String(id || '');
}

function weaponDesc(w) {
  const id = typeof w === 'string' ? w : (w && w.id);
  const k = 'weapon.' + id + '.desc';
  const v = t(k);
  if (v && v !== k) return v;
  const ww = typeof w === 'object' && w ? w : (typeof weaponById === 'function' ? weaponById(id) : null);
  return ww ? ww.desc : '';
}

function styleLabel(st, field) {
  field = field || 'name';
  const id = typeof st === 'string' ? st : (st && st.id);
  const k = 'style.' + id + '.' + field;
  const v = t(k);
  if (v && v !== k) return v;
  const ss = typeof st === 'object' && st ? st : (typeof styleById === 'function' ? styleById(id) : null);
  return ss && ss[field] != null ? ss[field] : '';
}

function dailyText(id) {
  const k = 'daily.' + id + '.text';
  const v = t(k);
  if (v && v !== k) return v;
  const def = typeof dailyDef === 'function' ? dailyDef(id) : null;
  return def ? def.text : id;
}

function dailyHint(id) {
  const k = 'daily.' + id + '.hint';
  const v = t(k);
  if (v && v !== k) return v;
  return (typeof DAILY_PLAY_HINTS !== 'undefined' && DAILY_PLAY_HINTS[id]) || '';
}

function pickupLabel(kind, skillId, itemCat, itemId) {
  if (kind === 'skill_shard' && skillId) {
    return t('combat.pickupSkillShard', { name: skillLabel(skillId) });
  }
  if (kind === 'item_shard' && itemCat && itemId) {
    return t('combat.pickupItemShard', { name: itemUpgradeLabel(itemCat, itemId) });
  }
  const k = 'pickup.' + kind;
  const v = t(k);
  if (v && v !== k) return v;
  return (typeof PICKUP_META !== 'undefined' && PICKUP_META[kind] && PICKUP_META[kind].label) || kind;
}

function skillLabel(id) {
  const k = 'skill.' + (id || 'rasengan');
  const v = t(k);
  if (v && v !== k) return v;
  if (id === 'subst') return 'Substitutie';
  if (id === 'dash') return 'Dash';
  if (id === 'chakra') return 'Chakra';
  return jutsuLabel(id);
}

function skillDesc(id) {
  const k = 'skillDesc.' + id;
  const v = t(k);
  if (v && v !== k) return v;
  return '';
}

function jutsuLabel(kind) {
  const k = 'jutsu.' + (kind || 'rasengan');
  const v = t(k);
  if (v && v !== k) return v;
  if (typeof jutsuHudLabel === 'function') return jutsuHudLabel(kind);
  return String(kind || '').toUpperCase();
}

function eggDailyLine(key) {
  const k = 'egg.' + key;
  const v = t(k);
  if (v && v !== k) return v;
  const nl = { dailyReady: 'Dag-ei klaar', advBonus: 'Bonus-ei: win 1× avontuur', tomorrow: 'Morgen weer ei' };
  return nl[key] || key;
}

function gambleOutcomeLabelFromKey(g) {
  if (!g) return '';
  const out = g.outcome || 'neutral';
  if (out === 'superAlly' || out === 'ally') {
    const a = typeof GAMBLE_ALLIES !== 'undefined' ? GAMBLE_ALLIES[g.allyId] : null;
    return t('gamble.' + out, { name: a ? a.name : 'Sage' });
  }
  const k = 'gamble.' + out;
  const v = t(k);
  return (v && v !== k) ? v : (typeof gambleOutcomeLabel === 'function' ? gambleOutcomeLabel(g) : out);
}

function i18nList(key) {
  const parts = key.split('.');
  for (const code of [getLang(), 'nl', 'en']) {
    let cur = I18N[code];
    for (const p of parts) {
      if (!cur || typeof cur !== 'object') { cur = null; break; }
      cur = cur[p];
    }
    if (Array.isArray(cur) && cur.length) return cur;
  }
  let cur = CATALOG_EN;
  for (const p of parts) {
    if (!cur) return [];
    cur = cur[p];
  }
  return Array.isArray(cur) ? cur : [];
}

function menuTipAt(i) {
  const tips = i18nList('menu.tips');
  if (!tips.length) return '';
  return tips[((i % tips.length) + tips.length) % tips.length];
}

function dailyModeLabel(mode) {
  if (mode === 'adventure') return t('modes.adventure');
  if (mode === 'training') return t('modes.training');
  if (mode === 'wall') return t('modes.wall');
  if (mode === 'versus') return t('modes.versus');
  if (mode === 'coinrun') return t('modes.coinrun');
  return mode;
}
/* --- src/systems/audio-samples.js --- */
/* ========================= ONLINE SFX SAMPLES (CC0) ======================
   Kenney.nl game audio — CC0 1.0 · mirror: ETdoFresh/kenney.nl via jsDelivr.
   Loads on first AudioSys.init; procedural synth remains fallback offline. */
const KENNEY_CDN = 'https://cdn.jsdelivr.net/gh/ETdoFresh/kenney.nl@master';
const SAMPLE_PACKS = {
  impact: `${KENNEY_CDN}/kenney_impactsounds/Audio`,
  ui: `${KENNEY_CDN}/kenney_interfacesounds/Audio`,
  digital: `${KENNEY_CDN}/kenney_digitalaudio/Audio`,
  rpg: `${KENNEY_CDN}/kenney_rpgaudio/Audio`,
  casino: `${KENNEY_CDN}/kenney_casinoaudio/Audio`,
  uiaudio: `${KENNEY_CDN}/kenney_uiaudio/Audio`,
};

function sampleUrl(pack, file) {
  const base = SAMPLE_PACKS[pack];
  return base ? `${base}/${file}` : '';
}

/** Multiple files per SFX id → random pick each play for variety. */
const SFX_SAMPLE_MAP = {
  select: { pack: 'ui', vol: 0.55, files: ['click_002.ogg', 'click_003.ogg', 'click_004.ogg', 'confirmation_001.ogg'] },
  bonus: { pack: 'ui', vol: 0.7, files: ['confirmation_002.ogg', 'confirmation_003.ogg', 'confirmation_004.ogg'] },
  bell: { pack: 'impact', vol: 0.75, files: ['impactBell_heavy_001.ogg', 'impactBell_heavy_002.ogg', 'impactBell_heavy_003.ogg'] },
  pickup: { pack: 'ui', vol: 0.65, files: ['drop_002.ogg', 'drop_003.ogg', 'drop_004.ogg'] },
  levelup: { pack: 'ui', vol: 0.8, files: ['confirmation_003.ogg', 'confirmation_004.ogg', 'bong_001.ogg'] },
  win: { pack: 'ui', vol: 0.85, files: ['confirmation_004.ogg', 'bong_001.ogg'] },
  lose: { pack: 'ui', vol: 0.7, files: ['error_002.ogg', 'error_003.ogg', 'back_003.ogg'] },
  gamble: { pack: 'casino', vol: 0.65, files: ['chipLay1.ogg', 'chipLay2.ogg', 'cardSlide3.ogg'] },
  gambleWin: { pack: 'casino', vol: 0.75, files: ['chipLay3.ogg', 'cardPlace2.ogg', 'cardPlace3.ogg'] },
  gambleBoss: { pack: 'impact', vol: 0.9, files: ['impactPunch_heavy_003.ogg', 'impactMetal_heavy_002.ogg'] },
  diceRoll: { pack: 'casino', vol: 0.6, files: ['cardShuffle.ogg', 'chipLay1.ogg', 'cardSlide1.ogg', 'cardSlide5.ogg'] },
  summon: { pack: 'digital', vol: 0.75, files: ['phaseJump3.ogg', 'phaseJump4.ogg', 'pepSound3.ogg'] },
  newmonster: { pack: 'rpg', vol: 0.7, files: ['bookOpen.ogg', 'doorOpen_1.ogg', 'creak2.ogg'] },
  combo: { pack: 'digital', vol: 0.65, files: ['pepSound1.ogg', 'pepSound2.ogg', 'highUp.ogg'] },
  comboEpic: { pack: 'digital', vol: 0.78, files: ['pepSound4.ogg', 'phaseJump5.ogg', 'highUp.ogg'] },
  comboMega: { pack: 'digital', vol: 0.85, files: ['phaseJump5.ogg', 'pepSound5.ogg', 'bong_001.ogg'] },
  punch: { pack: 'impact', vol: 0.82, files: ['impactPunch_medium_001.ogg', 'impactPunch_medium_002.ogg', 'impactPunch_medium_003.ogg', 'impactGeneric_light_001.ogg'] },
  kick: { pack: 'impact', vol: 0.88, files: ['impactPunch_heavy_001.ogg', 'impactSoft_medium_002.ogg', 'impactPunch_medium_004.ogg'] },
  hit2: { pack: 'impact', vol: 0.75, files: ['impactGeneric_light_002.ogg', 'impactGeneric_light_003.ogg', 'impactSoft_medium_001.ogg'] },
  hitHeavy: { pack: 'impact', vol: 0.92, files: ['impactPunch_heavy_002.ogg', 'impactPunch_heavy_003.ogg', 'impactMetal_heavy_001.ogg'] },
  hitMetal: { pack: 'impact', vol: 0.85, files: ['impactMetal_medium_001.ogg', 'impactMetal_medium_002.ogg', 'impactMetal_light_003.ogg'] },
  hitEnergy: { pack: 'digital', vol: 0.7, files: ['laser3.ogg', 'laser4.ogg', 'pepSound2.ogg'] },
  crit: { pack: 'impact', vol: 0.9, files: ['impactGlass_heavy_001.ogg', 'impactGlass_heavy_002.ogg', 'impactMetal_heavy_003.ogg'] },
  block: { pack: 'impact', vol: 0.7, files: ['impactMetal_light_001.ogg', 'impactMetal_light_002.ogg', 'impactWood_medium_001.ogg'] },
  swing: { pack: 'rpg', vol: 0.55, files: ['chop.ogg', 'drawKnife1.ogg', 'drawKnife2.ogg', 'cloth2.ogg'] },
  wKunai: { pack: 'rpg', vol: 0.5, files: ['drawKnife2.ogg', 'drawKnife3.ogg', 'cloth3.ogg'] },
  wFuuma: { pack: 'rpg', vol: 0.58, files: ['drawKnife3.ogg', 'chop.ogg'] },
  wBoemerang: { pack: 'digital', vol: 0.52, files: ['phaseJump1.ogg', 'lowDown.ogg', 'lowRandom.ogg'] },
  wLaser: { pack: 'digital', vol: 0.65, files: ['laser5.ogg', 'laser6.ogg', 'laser7.ogg'] },
  wZwaard: { pack: 'rpg', vol: 0.6, files: ['drawKnife1.ogg', 'chop.ogg', 'clothBelt.ogg'] },
  wSpeer: { pack: 'rpg', vol: 0.58, files: ['drawKnife2.ogg', 'footstep04.ogg', 'chop.ogg'] },
  wKnuppel: { pack: 'impact', vol: 0.8, files: ['impactWood_heavy_001.ogg', 'impactWood_medium_002.ogg'] },
  wGuvve: { pack: 'impact', vol: 0.75, files: ['impactSoft_heavy_001.ogg', 'impactPlank_medium_001.ogg'] },
  wKatana: { pack: 'rpg', vol: 0.62, files: ['chop.ogg', 'drawKnife3.ogg'] },
  wMaster: { pack: 'digital', vol: 0.78, files: ['phaseJump4.ogg', 'laser8.ogg', 'highUp.ogg'] },
  shuriken: { pack: 'digital', vol: 0.55, files: ['laser1.ogg', 'laser2.ogg', 'lowDown.ogg'] },
  shoot: { pack: 'digital', vol: 0.62, files: ['laser4.ogg', 'laser5.ogg'] },
  laser: { pack: 'digital', vol: 0.68, files: ['laser6.ogg', 'laser7.ogg', 'laser8.ogg', 'laser9.ogg'] },
  rasengan: { pack: 'digital', vol: 0.72, files: ['phaseJump2.ogg', 'phaseJump3.ogg', 'pepSound3.ogg'] },
  chidori: { pack: 'digital', vol: 0.75, files: ['laser2.ogg', 'laser3.ogg', 'highUp.ogg'] },
  rinnegan: { pack: 'digital', vol: 0.78, files: ['lowThreeTone.ogg', 'phaseJump4.ogg', 'laser1.ogg'] },
  special: { pack: 'digital', vol: 0.7, files: ['phaseJump3.ogg', 'pepSound4.ogg'] },
  subst: { pack: 'rpg', vol: 0.65, files: ['cloth4.ogg', 'clothBelt2.ogg', 'dropLeather.ogg'] },
  dash: { pack: 'digital', vol: 0.5, files: ['phaseJump1.ogg', 'lowDown.ogg', 'lowRandom.ogg'] },
  jump: { pack: 'digital', vol: 0.58, files: ['phaseJump1.ogg', 'phaseJump2.ogg', 'highUp.ogg'] },
  land: { pack: 'impact', vol: 0.55, files: ['footstep_concrete_001.ogg', 'footstep_concrete_002.ogg', 'footstep_grass_002.ogg'] },
  step: { pack: 'impact', vol: 0.35, files: ['footstep_grass_001.ogg', 'footstep_grass_003.ogg', 'footstep_carpet_002.ogg'] },
  travel: { pack: 'impact', vol: 0.4, files: ['footstep_carpet_001.ogg', 'footstep_carpet_003.ogg', 'footstep_wood_002.ogg'] },
  hurt: { pack: 'ui', vol: 0.65, files: ['error_001.ogg', 'error_002.ogg'] },
  die: { pack: 'impact', vol: 0.85, files: ['impactGlass_heavy_003.ogg', 'impactSoft_heavy_003.ogg', 'impactWood_heavy_002.ogg'] },
  roar: { pack: 'impact', vol: 0.95, files: ['impactPunch_heavy_004.ogg', 'impactSoft_heavy_004.ogg', 'impactMetal_heavy_004.ogg'] },
  explode: { pack: 'impact', vol: 0.9, files: ['impactMetal_heavy_002.ogg', 'impactGlass_heavy_004.ogg', 'impactPunch_heavy_003.ogg'] },
  brick: { pack: 'impact', vol: 0.7, files: ['impactPlank_medium_002.ogg', 'impactWood_light_002.ogg', 'impactGeneric_light_004.ogg'] },
  crack: { pack: 'impact', vol: 0.65, files: ['impactGlass_light_002.ogg', 'impactWood_light_003.ogg'] },
  whoosh: { pack: 'digital', vol: 0.45, files: ['lowDown.ogg', 'lowRandom.ogg', 'phaseJump1.ogg'] },
  checkpoint: { pack: 'ui', vol: 0.72, files: ['confirmation_002.ogg', 'bong_001.ogg'] },
  bossArrive: { pack: 'impact', vol: 0.95, files: ['impactPunch_heavy_004.ogg', 'impactMetal_heavy_003.ogg'] },
  bossWait: { pack: 'impact', vol: 0.6, files: ['impactSoft_medium_003.ogg', 'creak1.ogg'] },
  masterSword: { pack: 'digital', vol: 0.82, files: ['phaseJump5.ogg', 'laser8.ogg', 'highUp.ogg'] },
  wMaster: { pack: 'digital', vol: 0.7, files: ['laser7.ogg', 'pepSound5.ogg'] },
  waveClear: { pack: 'ui', vol: 0.68, files: ['confirmation_003.ogg', 'confirmation_001.ogg'] },
  hitstop: { pack: 'impact', vol: 0.45, files: ['impactGeneric_light_001.ogg', 'impactMetal_light_004.ogg'] },
  ketsbam: { pack: 'impact', vol: 1, files: ['impactPunch_heavy_004.ogg', 'impactMetal_heavy_004.ogg', 'impactGlass_heavy_004.ogg'] },
  ketsbamCharge: { pack: 'digital', vol: 0.55, rate: 0.88, files: ['lowRandom.ogg', 'lowThreeTone.ogg'] },
};

function collectSampleUrls() {
  const urls = [];
  const seen = new Set();
  for (const cfg of Object.values(SFX_SAMPLE_MAP)) {
    for (const f of cfg.files || []) {
      const u = sampleUrl(cfg.pack, f);
      if (u && !seen.has(u)) { seen.add(u); urls.push(u); }
    }
  }
  return urls;
}

function sampleMapForSfx(name) {
  return SFX_SAMPLE_MAP[name] || null;
}
/* --- src/systems/audio.js --- */
/* =============================== AUDIO ================================= */
const AudioSys = {
  ctx: null, master: null, musicGain: null, sfxGain: null,
  desiredSong: null,
  song: null, step: 0, bar: 0, nextTime: 0,
  paused: false,
  _sfxVar: 0,
  _sfxPan: 0,
  _combatHeat: 0,
  _samples: {},
  _sampleLoadStarted: false,
  _sampleCount: 0,
  _samplesReady: false,

  init() {
    try {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        this.loadSamples();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.28;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.74;
      this.sfxGain.connect(this.master);
      if (!this._tickTimer) this._tickTimer = setInterval(() => {
        try { this.tick(); } catch (_) {}
      }, 40);
      this.loadSamples();
      if (this.desiredSong && save.music) this.play(this.desiredSong);
      this.applyVolumes();
    } catch (err) {
      console.warn('[Stickman] AudioSys.init', err);
      this.ctx = null;
    }
  },

  /** Fetch Kenney CC0 samples (jsDelivr) — batched; procedural fallback until ready. */
  loadSamples() {
    if (!this.ctx || this._sampleLoadStarted || typeof collectSampleUrls !== 'function') return;
    this._sampleLoadStarted = true;
    const urls = collectSampleUrls();
    if (!urls.length) return;
    let idx = 0;
    const batch = 8;
    const loadOne = async (url) => {
      try {
        const res = await fetch(url, { mode: 'cors', cache: 'force-cache' });
        if (!res.ok) return;
        const ab = await res.arrayBuffer();
        const buf = await this.ctx.decodeAudioData(ab);
        this._samples[url] = buf;
        this._sampleCount++;
        if (this._sampleCount >= 12) this._samplesReady = true;
      } catch (_) {}
    };
    const pump = () => {
      if (!this.ctx) return;
      const chunk = urls.slice(idx, idx + batch);
      idx += batch;
      Promise.all(chunk.map(u => loadOne(u))).then(() => {
        if (idx < urls.length) setTimeout(pump, 16);
        else if (this._sampleCount > 0) this._samplesReady = true;
      });
    };
    pump();
  },

  _playSample(name) {
    if (!this.ctx || !save.sfx) return false;
    const cfg = typeof sampleMapForSfx === 'function' ? sampleMapForSfx(name) : null;
    if (!cfg) return false;
    const loaded = (cfg.files || []).map(f => sampleUrl(cfg.pack, f)).filter(u => u && this._samples[u]);
    if (!loaded.length) return false;
    const url = loaded[Math.floor(Math.random() * loaded.length)];
    const buf = this._samples[url];
    if (!buf) return false;
    const lite = save.liteFx || (typeof Perf !== 'undefined' && Perf.tier >= 1);
    const sv = clamp(Number(save.sfxVol) || 1, 0, 1);
    let vol = (cfg.vol != null ? cfg.vol : 0.75) * sv * (lite ? 0.78 : 1);
    if (vol <= 0.001) return false;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const rate = (cfg.rate || 1) * (0.93 + Math.random() * 0.14);
    src.playbackRate.value = rate;
    const dur = Math.min(buf.duration / rate, 2.8);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(g);
    g.connect(this._sfxDest());
    src.start(t);
    src.stop(t + dur + 0.02);
    return true;
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
    const lite = save.liteFx || (typeof Perf !== 'undefined' && Perf.tier >= 1);
    const inPause = this.paused || state === 'pause';
    let baseM = (id === 'menu') ? 0.24 : 0.32;
    if (lite) baseM *= 0.88;
    // Duck BGM in pauze / result — SFX blijft hoorbaar (iets harder in pauze voor knoppen)
    if (inPause) baseM *= 0.26;
    else if (state === 'result') baseM *= 0.5;
    const sfxMul = (lite ? 0.68 : 0.74) * (inPause ? 1.1 : 1);
    this._setGain(this.musicGain, baseM * mv);
    this._setGain(this.sfxGain, sfxMul * sv);
    this.syncContextPower();
  },

  /** Suspend Web Audio when fully muted / tab hidden — saves battery on iPad/PWA */
  syncContextPower() {
    if (!this.ctx) return;
    const needAudio = !!(save.music || save.sfx);
    if (typeof document !== 'undefined' && document.hidden) {
      try { if (this.ctx.state === 'running') this.ctx.suspend(); } catch (_) {}
      return;
    }
    const inFight = state === 'play' || state === 'pause';
    const menuBgm = (state === 'menu' || state === 'result') && save.music && this.song;
    const keepAwake = needAudio && (inFight || menuBgm);
    try {
      if (!keepAwake && this.ctx.state === 'running') {
        this.ctx.suspend();
      } else if (keepAwake && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (_) {}
  },

  /** Soft music-channel blip when dragging volume sliders (pauze/instellingen). */
  previewMusicVol() {
    if (!this.ctx || !save.music) return;
    try { if (this.ctx.state === 'suspended') this.ctx.resume(); } catch (_) {}
    const mv = clamp(Number(save.musicVol) || 0.85, 0, 1);
    if (mv <= 0.001) return;
    const lite = save.liteFx || (typeof Perf !== 'undefined' && Perf.tier >= 1);
    let vol = 0.14 * mv * (lite ? 0.88 : 1);
    if (this.paused || state === 'pause') vol *= 0.26;
    this.tone(660, 880, 0.11, 'sine', vol, this.musicGain);
  },

  setPaused(on) {
    this.paused = !!on;
    const needAudio = !!(save.music || save.sfx);
    if (on) {
      try { this.init(); } catch (_) {}
      if (needAudio) {
        try { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); } catch (_) {}
      } else {
        try { this.syncContextPower(); } catch (_) {}
      }
    }
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
    o.connect(g); g.connect(out || this._sfxDest());
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
    src.connect(f); f.connect(g); g.connect(out || this._sfxDest());
    src.start(t);
  },

  /** Route SFX to stereo field — screenX maps left/right on W */
  _sfxDest(out) {
    if (out) return out;
    const pan = this._sfxPan || 0;
    if (!this.ctx || Math.abs(pan) < 0.04) return this.sfxGain;
    try {
      if (!this.ctx.createStereoPanner) return this.sfxGain;
      const sp = this.ctx.createStereoPanner();
      sp.pan.value = pan;
      sp.connect(this.sfxGain);
      return sp;
    } catch (_) { return this.sfxGain; }
  },

  /** Pan SFX by world/screen X (0…W → left…right) */
  sfxAt(name, screenX) {
    if (!this.ctx || !save.sfx) return;
    if (typeof screenX === 'number' && typeof W !== 'undefined' && W > 0) {
      this._sfxPan = clamp((screenX / W) * 2 - 1, -1, 1) * 0.82;
    }
    this.sfx(name);
    this._sfxPan = 0;
  },

  /** 0…1 — ramps BGM lead intensity during hot combos */
  setCombatHeat(v) {
    this._combatHeat = clamp(Number(v) || 0, 0, 1);
  },

  /** Detuned twin layer — fuller body without samples */
  detuneTone(f0, f1, dur, type, vol, cents, out, when) {
    this.tone(f0, f1, dur, type, vol * 0.72, out, when);
    const r = Math.pow(2, (cents || 8) / 1200);
    this.tone(f0 * r, f1 * r, dur * 0.92, type, vol * 0.38, out, (when != null ? when : this.ctx.currentTime) + 0.004);
  },

  /** Micro pitch wobble so rapid SFX don't sound identical */
  _pitchVar() {
    this._sfxVar = (this._sfxVar + 1) % 97;
    return 0.975 + (this._sfxVar % 6) * 0.01;
  },

  /** Short echo tail — arcade space without reverb node */
  echoTone(f0, f1, dur, type, vol, delay, decay, out, when) {
    this.tone(f0, f1, dur, type, vol, out, when);
    const lite = save.liteFx || (typeof Perf !== 'undefined' && Perf.tier >= 1);
    if (lite) return;
    const t = (when != null ? when : this.ctx.currentTime) + (delay || 0.055);
    this.tone(f0 * 0.996, f1 * 0.996, dur * 0.82, type, vol * (decay || 0.4), out, t);
  },

  sfx(name) {
    if (!this.ctx || !save.sfx) return;
    try { if (this.ctx.state === 'suspended') this.ctx.resume(); } catch (_) {}
    if (this._playSample(name)) return;
    const lite = save.liteFx || (typeof Perf !== 'undefined' && Perf.tier >= 1);
    const v = (n) => n * (lite ? 0.72 : 0.88);
    const d = (n) => n * (lite ? 0.78 : 0.9);
    const P = () => this._pitchVar();
    const T = (f0, f1, dur, ty, vol, w) => { const p = P(); this.tone(f0 * p, f1 * p, d(dur), ty, v(vol), null, w); };
    const D = (f0, f1, dur, ty, vol, w, c) => this.detuneTone(f0 * P(), f1 * P(), d(dur), ty, v(vol), c, null, w);
    const E = (f0, f1, dur, ty, vol, w, dl, dc) => this.echoTone(f0 * P(), f1 * P(), d(dur), ty, v(vol), dl, dc, null, w);
    const N = (dur, vol, ff, hp, w) => this.noise(d(dur), v(vol), ff, hp, null, w);
    const I = (thump, crack, w) => {
      T(thump, thump * 0.52, 0.08, 'sine', 0.22, w);
      N(0.04, 0.16, crack, true, w);
      if (!lite) T(crack * 0.32, crack * 0.18, 0.045, 'triangle', 0.09, w + 0.012);
    };
    const C = (freqs, ty, vol, gap, w) => {
      freqs.forEach((f, i) => T(f, f * 1.015, 0.1, ty, vol * (1 - i * 0.05), w + i * gap));
    };
    const S = (freqs, w) => {
      if (lite) { T(freqs[0], freqs[0] * 1.06, 0.05, 'sine', 0.08, w); return; }
      freqs.forEach((f, i) => T(f, f * 1.1, 0.045, 'sine', 0.075, w + i * 0.02));
    };
    const now = this.ctx.currentTime;
    switch (name) {
      case 'swing':
        N(0.05, 0.22, 3400, true, now);
        T(420, 160, 0.07, 'sine', 0.11, now);
        if (!lite) N(0.025, 0.08, 6200, true, now + 0.015);
        break;
      case 'punch':
        I(240, 3200, now);
        T(520, 880, 0.04, 'triangle', 0.1, now + 0.02);
        break;
      case 'kick':
        I(280, 2600, now);
        T(420, 140, 0.07, 'triangle', 0.12, now + 0.02);
        break;
      case 'wKunai':
        N(0.035, 0.15, 5400, true, now);
        T(1020, 380, 0.075, 'triangle', 0.13, now);
        if (!lite) T(1480, 620, 0.04, 'sine', 0.07, now + 0.025);
        break;
      case 'wZwaard':
        N(0.06, 0.22, 4000, true, now);
        D(680, 260, 0.1, 'sawtooth', 0.11, now, 11);
        E(920, 420, 0.06, 'sine', 0.09, now + 0.02, 0.04, 0.35);
        break;
      case 'wKnuppel':
        I(120, 800, now);
        T(160, 48, 0.11, 'sine', 0.18, now);
        if (!lite) N(0.05, 0.12, 1400, false, now + 0.04);
        break;
      case 'wSpeer':
        N(0.045, 0.16, 4200, true, now);
        T(580, 180, 0.11, 'triangle', 0.13, now);
        if (!lite) T(880, 320, 0.05, 'sine', 0.08, now + 0.04);
        break;
      case 'wNunchaku':
        N(0.03, 0.13, 5200, true, now);
        T(820, 540, 0.05, 'sine', 0.11, now);
        T(540, 820, 0.05, 'sine', 0.1, now + 0.038);
        if (!lite) T(660, 440, 0.04, 'triangle', 0.08, now + 0.07);
        break;
      case 'wBoemerang':
        T(680, 980, 0.09, 'triangle', 0.12, now);
        T(980, 420, 0.11, 'sine', 0.11, now + 0.05);
        N(0.045, 0.11, 3800, true, now);
        if (!lite) E(620, 920, 0.07, 'sine', 0.08, now + 0.08, 0.05, 0.38);
        break;
      case 'wHamer':
        I(80, 550, now);
        T(95, 38, 0.15, 'sine', 0.26, now);
        T(190, 75, 0.07, 'square', 0.11, now + 0.05);
        if (!lite) N(0.08, 0.14, 900, false, now + 0.03);
        break;
      case 'wKetting':
        N(0.065, 0.19, 2400, true, now);
        T(300, 150, 0.085, 'sawtooth', 0.13, now);
        T(520, 220, 0.055, 'triangle', 0.09, now + 0.035);
        if (!lite) T(780, 360, 0.04, 'sine', 0.07, now + 0.06);
        break;
      case 'wLaser':
        T(1280, 420, 0.11, 'sawtooth', 0.15, now);
        T(1680, 880, 0.07, 'sine', 0.11, now);
        N(0.045, 0.11, 6200, true, now);
        if (!lite) E(980, 520, 0.08, 'triangle', 0.09, now + 0.03, 0.045, 0.42);
        break;
      case 'wDonder':
        T(160, 55, 0.14, 'sawtooth', 0.22, now);
        N(0.12, 0.24, 1600, true, now);
        T(1040, 380, 0.09, 'sine', 0.13, now + 0.05);
        if (!lite) T(55, 28, 0.2, 'sine', 0.12, now + 0.08);
        break;
      case 'wVoid':
        T(200, 75, 0.13, 'sine', 0.15, now);
        D(680, 200, 0.11, 'triangle', 0.12, now + 0.04, 9);
        N(0.09, 0.15, 1300, true, now);
        break;
      case 'wGuvve':
        I(220, 1800, now);
        T(320, 180, 0.09, 'square', 0.15, now + 0.02);
        if (!lite) T(480, 260, 0.07, 'triangle', 0.11, now + 0.06);
        break;
      case 'hit':
        I(180, 1400, now);
        T(880, 420, 0.05, 'triangle', 0.1, now + 0.015);
        break;
      case 'hit2':
        I(130, 900, now);
        T(150, 55, 0.09, 'square', 0.24, now);
        N(0.07, 0.26, 650, false, now);
        T(320, 140, 0.06, 'triangle', 0.12, now + 0.025);
        break;
      case 'hitMetal':
        I(520, 3800, now);
        E(980, 460, 0.06, 'triangle', 0.13, now + 0.01, 0.035, 0.45);
        T(240, 95, 0.07, 'sine', 0.11, now);
        break;
      case 'hitHeavy':
        I(110, 650, now);
        T(130, 42, 0.13, 'sine', 0.24, now);
        if (!lite) N(0.1, 0.22, 550, false, now + 0.04);
        break;
      case 'hitEnergy':
        T(760, 280, 0.09, 'sine', 0.15, now);
        D(1120, 520, 0.07, 'triangle', 0.11, now, 10);
        N(0.05, 0.13, 4400, true, now);
        if (!lite) S([880, 1047], now + 0.04);
        break;
      case 'jump':
        T(220, 620, 0.11, 'sine', 0.16, now);
        T(620, 880, 0.07, 'triangle', 0.1, now + 0.04);
        if (!lite) N(0.025, 0.07, 5200, true, now);
        break;
      case 'land':
        I(95, 480, now);
        if (!lite) T(180, 70, 0.05, 'sine', 0.08, now + 0.02);
        break;
      case 'hurt':
        T(380, 120, 0.12, 'triangle', 0.18, now);
        T(220, 90, 0.08, 'sawtooth', 0.12, now + 0.03);
        break;
      case 'die':
        T(420, 55, 0.34, 'sawtooth', 0.24, now);
        N(0.2, 0.24, 750, false, now);
        if (!lite) C([330, 262, 196], 'triangle', 0.12, 0.09, now + 0.12);
        break;
      case 'shoot':
        T(920, 240, 0.11, 'square', 0.15, now);
        N(0.035, 0.1, 5400, true, now);
        break;
      case 'laser':
        T(1500, 360, 0.13, 'sawtooth', 0.15, now);
        T(1800, 900, 0.07, 'sine', 0.1, now);
        N(0.045, 0.11, 6800, true, now + 0.02);
        break;
      case 'explode':
        N(0.3, 0.4, 650, false, now);
        T(110, 35, 0.24, 'sine', 0.34, now);
        if (!lite) {
          T(80, 28, 0.32, 'sawtooth', 0.18, now + 0.04);
          S([880, 1100, 1320], now + 0.08);
        }
        break;
      case 'brick':
        N(0.11, 0.32, 1500, false, now);
        T(540, 200, 0.08, 'triangle', 0.16, now);
        T(880, 440, 0.05, 'sine', 0.1, now + 0.03);
        break;
      case 'crack':
        N(0.06, 0.2, 2100, false, now);
        T(720, 280, 0.05, 'triangle', 0.1, now);
        break;
      case 'block':
        T(980, 760, 0.07, 'sine', 0.14, now);
        N(0.045, 0.15, 5000, true, now);
        T(620, 820, 0.05, 'triangle', 0.1, now + 0.025);
        break;
      case 'crit':
        I(520, 4200, now);
        D(1040, 1560, 0.07, 'triangle', 0.16, now + 0.02, 12);
        S([1560, 1870, 2093], now + 0.05);
        break;
      case 'special':
      case 'rasengan':
        T(320, 1040, 0.2, 'sine', 0.13, now);
        D(580, 1220, 0.16, 'triangle', 0.11, now + 0.04, 10);
        N(0.12, 0.1, 3600, true, now);
        if (!lite) S([880, 1047, 1175], now + 0.1);
        break;
      case 'chidori':
        T(920, 1580, 0.18, 'sine', 0.14, now);
        N(0.14, 0.12, 5600, true, now);
        T(1400, 920, 0.06, 'triangle', 0.1, now + 0.06);
        if (!lite) T(180, 90, 0.08, 'sine', 0.08, now + 0.02);
        break;
      case 'rinnegan':
        T(240, 760, 0.14, 'sine', 0.14, now);
        T(760, 480, 0.15, 'triangle', 0.12, now + 0.04);
        T(980, 1320, 0.08, 'sine', 0.11, now + 0.1);
        N(0.1, 0.11, 1900, true, now + 0.02);
        if (!lite) T(55, 32, 0.18, 'sawtooth', 0.1, now + 0.05);
        break;
      case 'subst':
        N(0.1, 0.24, 1300, true, now);
        T(520, 120, 0.09, 'sine', 0.14, now);
        if (!lite) {
          T(920, 480, 0.06, 'triangle', 0.1, now + 0.04);
          N(0.05, 0.1, 7000, true, now + 0.02);
        }
        break;
      case 'shuriken':
        T(980, 460, 0.075, 'triangle', 0.14, now);
        N(0.038, 0.12, 4900, true, now);
        if (!lite) T(1420, 680, 0.045, 'sine', 0.08, now + 0.022);
        break;
      case 'roar':
        T(95, 48, 0.42, 'sawtooth', 0.27, now);
        N(0.32, 0.26, 360, false, now);
        if (!lite) {
          T(52, 28, 0.36, 'sine', 0.17, now + 0.06);
          N(0.16, 0.15, 1100, true, now + 0.14);
        }
        break;
      case 'select':
        T(660, 880, 0.045, 'sine', 0.1, now);
        T(880, 1040, 0.055, 'triangle', 0.09, now + 0.025);
        break;
      case 'combo':
        T(520, 880, 0.065, 'triangle', 0.14, now);
        T(880, 1040, 0.075, 'sine', 0.12, now + 0.03);
        if (!lite) S([1040, 1175, 1319], now + 0.05);
        break;
      case 'dash':
        N(0.06, 0.16, 3600, true, now);
        T(420, 820, 0.08, 'sine', 0.11, now);
        if (!lite) T(980, 620, 0.05, 'triangle', 0.08, now + 0.04);
        break;
      case 'pickup':
        C([784, 988, 1175], 'sine', 0.14, 0.045, now);
        if (!lite) S([1319, 1568], now + 0.12);
        break;
      case 'bell':
        D(1319, 1240, 0.5, 'triangle', 0.22, now, 6);
        T(988, 988, 0.35, 'sine', 0.08, now + 0.05);
        break;
      case 'bonus':
        C([880, 1109, 1320], 'square', 0.15, 0.065, now);
        if (!lite) S([1568, 1760], now + 0.14);
        break;
      case 'levelup':
        C([523, 659, 784, 1047], 'triangle', 0.16, 0.065, now);
        if (!lite) {
          T(1047, 1319, 0.12, 'sine', 0.12, now + 0.22);
          S([1568, 1760, 2093], now + 0.28);
        }
        break;
      case 'newmonster':
        C([392, 523, 659, 784], 'sine', 0.15, 0.055, now);
        if (!lite) T(110, 70, 0.12, 'sawtooth', 0.1, now + 0.02);
        break;
      case 'win':
        C([523, 659, 784, 1047, 1319], 'triangle', 0.15, 0.08, now);
        if (!lite) {
          C([1568, 1760, 2093], 'sine', 0.1, 0.07, now + 0.38);
          N(0.08, 0.12, 1800, true, now + 0.5);
        }
        break;
      case 'lose':
        [392, 330, 262, 196, 147].forEach((f, i) => T(f, f * 0.96, 0.2, 'triangle', 0.13, now + i * 0.11));
        if (!lite) N(0.12, 0.14, 600, false, now + 0.35);
        break;
      case 'ketsbamCharge':
        T(52, 185, 1.92, 'sawtooth', 0.22, now);
        T(88, 240, 1.95, 'sine', 0.17, now);
        N(1.95, 0.15, 720, false, now);
        if (!lite) {
          N(1.9, 0.11, 2200, true, now + 0.08);
          T(165, 440, 1.65, 'triangle', 0.13, now + 0.18);
          for (let i = 0; i < 8; i++) {
            N(0.045, 0.075, 2800 + i * 380, true, now + 0.12 + i * 0.22);
            T(380 + i * 70, 180 + i * 35, 0.055, 'square', 0.065, now + 0.16 + i * 0.22);
          }
          C([247, 330, 440, 587], 'sine', 0.085, 0.07, now + 1.35);
          N(0.2, 0.18, 1400, true, now + 1.55);
        }
        break;
      case 'ketsbam':
        N(0.36, 0.4, 400, false, now);
        T(52, 20, 0.44, 'sawtooth', 0.34, now);
        C([196, 247, 294, 392], 'square', 0.14, 0.042, now + 0.08);
        if (!lite) {
          S([523, 659, 784, 988], now + 0.18);
          N(0.16, 0.2, 850, true, now + 0.14);
        }
        break;
      case 'summon':
        C([659, 784, 988, 1175], 'sine', 0.15, 0.068, now);
        D(880, 1360, 0.22, 'triangle', 0.13, now + 0.1, 14);
        if (!lite) {
          S([1319, 1568, 1760, 2093], now + 0.24);
          N(0.08, 0.12, 3200, true, now + 0.12);
        }
        break;
      case 'gamble':
        N(0.05, 0.13, 2600, true, now);
        [920, 740, 560, 420].forEach((f, i) => T(f, f * 0.82, 0.055, 'square', 0.11, now + i * 0.038));
        break;
      case 'gambleWin':
        C([523, 659, 784, 988, 1175], 'triangle', 0.14, 0.058, now);
        if (!lite) {
          S([1568, 1760, 2093], now + 0.3);
          N(0.06, 0.1, 2400, true, now + 0.35);
        }
        break;
      case 'gambleBoss':
        T(85, 38, 0.3, 'sawtooth', 0.24, now);
        N(0.22, 0.26, 480, false, now);
        C([311, 370, 415, 494], 'square', 0.13, 0.075, now + 0.12);
        break;
      case 'comboEpic':
        C([880, 1047, 1175, 1319], 'square', 0.15, 0.048, now);
        I(360, 3400, now);
        if (!lite) S([1568, 1760, 2093], now + 0.1);
        break;
      case 'comboMega':
        C([988, 1175, 1319, 1568, 1760], 'triangle', 0.16, 0.052, now);
        N(0.14, 0.19, 1100, true, now + 0.05);
        if (!lite) {
          T(105, 38, 0.22, 'sine', 0.2, now + 0.22);
          S([2093, 2349, 2637], now + 0.28);
        }
        break;
      case 'whoosh':
        N(0.09, 0.15, 4300, true, now);
        T(260, 1280, 0.13, 'sine', 0.11, now);
        break;
      case 'travel':
        N(0.06, 0.12, 3200, true, now);
        T(180, 520, 0.14, 'sine', 0.1, now);
        if (!lite) T(520, 880, 0.08, 'triangle', 0.08, now + 0.06);
        break;
      case 'step':
        N(0.025, 0.08, 900, false, now);
        T(120, 70, 0.04, 'sine', 0.09, now);
        break;
      case 'checkpoint':
        C([523, 659, 784], 'sine', 0.14, 0.055, now);
        E(988, 1175, 0.1, 'triangle', 0.11, now + 0.12, 0.06, 0.42);
        if (!lite) S([1175, 1319], now + 0.18);
        break;
      case 'bossArrive':
        T(70, 28, 0.32, 'sawtooth', 0.26, now);
        N(0.24, 0.28, 420, false, now);
        C([311, 370, 415, 494, 622], 'square', 0.13, 0.07, now + 0.1);
        if (!lite) {
          T(880, 220, 0.28, 'sawtooth', 0.16, now + 0.38);
          N(0.12, 0.16, 1100, true, now + 0.45);
        }
        break;
      case 'bossWait':
        T(110, 55, 0.22, 'sawtooth', 0.14, now);
        N(0.12, 0.14, 600, false, now);
        if (!lite) T(220, 110, 0.12, 'sine', 0.1, now + 0.08);
        break;
      case 'masterSword':
        C([784, 988, 1175, 1568], 'sine', 0.15, 0.065, now);
        D(880, 1760, 0.24, 'triangle', 0.14, now + 0.08, 12);
        if (!lite) {
          S([2093, 2349, 2637], now + 0.22);
          N(0.08, 0.12, 4200, true, now + 0.1);
        }
        break;
      case 'wMaster':
        N(0.05, 0.18, 4600, true, now);
        D(720, 1320, 0.11, 'sawtooth', 0.13, now, 14);
        E(1040, 520, 0.08, 'sine', 0.12, now + 0.03, 0.045, 0.45);
        if (!lite) S([1568, 1760], now + 0.06);
        break;
      case 'waveClear':
        C([659, 784, 988], 'triangle', 0.13, 0.05, now);
        T(880, 1040, 0.08, 'sine', 0.11, now + 0.12);
        if (!lite) S([1175, 1319], now + 0.15);
        break;
      case 'hitstop':
        I(420, 4800, now);
        T(980, 420, 0.035, 'square', 0.12, now + 0.008);
        break;
      case 'diceRoll':
        [680, 820, 540, 760, 620, 880].forEach((f, i) => {
          T(f, f * (0.85 + Math.random() * 0.1), 0.045, 'square', 0.09, now + i * 0.032);
        });
        N(0.04, 0.1, 3400, true, now);
        break;
    }
  },

  /** Korte arcade-stingers — procedureel, rechtenvrij (geen samples) */
  sting(name, kind) {
    if (!this.ctx || !save.sfx) return;
    try { if (this.ctx.state === 'suspended') this.ctx.resume(); } catch (_) {}
    const lite = save.liteFx || (typeof Perf !== 'undefined' && Perf.tier >= 1);
    const v = (n) => n * (lite ? 0.72 : 0.88);
    const d = (n) => n * (lite ? 0.78 : 0.9);
    const now = this.ctx.currentTime;
    const T = (f0, f1, dur, ty, vol, w) => this.tone(f0, f1, d(dur), ty, v(vol), null, w);
    const N = (dur, vol, ff, hp, w) => this.noise(d(dur), v(vol), ff, hp, null, w);
    const E = (f0, f1, dur, ty, vol, w, dl, dc) => this.echoTone(f0, f1, d(dur), ty, v(vol), dl, dc, null, w);
    const S = (freqs, w) => {
      if (lite) { T(freqs[0], freqs[0] * 1.06, 0.05, 'sine', 0.08, w); return; }
      freqs.forEach((f, i) => T(f, f * 1.1, 0.045, 'sine', 0.075, w + i * 0.02));
    };
    switch (name) {
      case 'title':
        [392, 523, 659, 784, 988, 1175].forEach((f, i) => T(f, f, 0.085, 'triangle', 0.13, now + i * 0.045));
        T(120, 55, 0.2, 'sine', 0.22, now + 0.04);
        N(0.07, 0.17, 1400, false, now + 0.28);
        if (!lite) S([1319, 1568], now + 0.22);
        break;
      case 'modeAdventure':
        [440, 554, 659, 784, 880].forEach((f, i) => E(f, f, 0.075, 'sine', 0.11, now + i * 0.042, 0.05, 0.35));
        if (!lite) T(220, 880, 0.12, 'triangle', 0.08, now + 0.18);
        break;
      case 'modeTraining':
        T(220, 920, 0.15, 'sine', 0.12, now);
        N(0.14, 0.15, 5000, true, now + 0.03);
        T(660, 920, 0.075, 'triangle', 0.11, now + 0.14);
        if (!lite) S([988, 1175], now + 0.22);
        break;
      case 'modeVersus':
        T(140, 920, 0.075, 'square', 0.18, now);
        T(920, 140, 0.075, 'square', 0.17, now + 0.085);
        N(0.06, 0.22, 950, false, now + 0.04);
        if (!lite) I(480, 2800, now + 0.12);
        break;
      case 'modeWall':
        [196, 247, 330, 392, 440].forEach((f, i) => T(f, f * 0.96, 0.095, 'triangle', 0.14, now + i * 0.038));
        if (!lite) N(0.05, 0.12, 5200, true, now + 0.18);
        break;
      case 'modeMats':
        [523, 659, 784, 988].forEach((f, i) => T(f, f * 1.02, 0.075, 'sine', 0.12, now + i * 0.048));
        T(392, 523, 0.11, 'triangle', 0.11, now + 0.18);
        if (!lite) S([1175, 1319], now + 0.24);
        break;
      case 'superReady':
        if (kind === 'chidori') {
          T(920, 1480, 0.14, 'sine', 0.16, now);
          N(0.1, 0.14, 5400, true, now);
          T(1200, 920, 0.06, 'triangle', 0.1, now + 0.08);
        } else if (kind === 'rinnegan') {
          T(360, 660, 0.12, 'sine', 0.16, now);
          T(880, 1180, 0.1, 'triangle', 0.12, now + 0.05);
          T(110, 60, 0.14, 'sine', 0.09, now + 0.03);
        } else {
          T(720, 1180, 0.1, 'sine', 0.14, now);
          T(980, 1320, 0.09, 'triangle', 0.12, now + 0.05);
          T(1320, 880, 0.07, 'sine', 0.08, now + 0.1);
        }
        break;
      case 'eliteIntro':
        T(95, 50, 0.24, 'sawtooth', 0.23, now);
        N(0.2, 0.24, 480, false, now);
        [392, 466, 523, 622, 740].forEach((f, i) => E(f, f * 1.02, 0.095, 'square', 0.12, now + 0.12 + i * 0.065, 0.05, 0.38));
        T(180, 85, 0.3, 'sine', 0.19, now + 0.38);
        break;
      case 'bossIntro':
        T(68, 36, 0.34, 'sawtooth', 0.3, now);
        N(0.3, 0.3, 360, false, now);
        T(210, 100, 0.22, 'square', 0.21, now + 0.08);
        [311, 370, 415, 494, 622, 740].forEach((f, i) => T(f, f * 0.97, 0.105, 'triangle', 0.14, now + 0.18 + i * 0.075));
        N(0.14, 0.22, 850, true, now + 0.58);
        if (!lite) T(55, 28, 0.25, 'sine', 0.14, now + 0.45);
        break;
      case 'superBossIntro':
        T(52, 28, 0.42, 'sawtooth', 0.34, now);
        N(0.38, 0.34, 300, false, now);
        T(130, 62, 0.3, 'square', 0.26, now + 0.1);
        [262, 330, 392, 523, 659, 784, 988].forEach((f, i) => E(f, f * 1.03, 0.115, 'square', 0.14, now + 0.22 + i * 0.085, 0.055, 0.4));
        T(880, 180, 0.38, 'sawtooth', 0.2, now + 0.72);
        N(0.22, 0.26, 650, true, now + 0.88);
        break;
      case 'masterSword':
        [523, 659, 784, 988, 1175, 1568].forEach((f, i) => E(f, f * 1.02, 0.09, 'sine', 0.12, now + i * 0.048, 0.055, 0.4));
        T(880, 1760, 0.28, 'triangle', 0.14, now + 0.12);
        if (!lite) S([1760, 2093, 2349], now + 0.28);
        break;
      default:
        T(480, 660, 0.06, 'sine', 0.11, now);
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
  stop() { this.song = null; this.desiredSong = null; this.setCombatHeat(0); this.applyVolumes(); },
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
    if (typeof document !== 'undefined' && document.hidden) return;
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
    const lite = save.liteFx || (typeof Perf !== 'undefined' && Perf.tier >= 1);
    const heat = this._combatHeat || 0;
    if (s.kick.includes(i)) {
      this.tone(150, 42, 0.12, 'sine', 0.85, mg, t);
      if (!lite) this.tone(72, 34, 0.16, 'sine', 0.38, mg, t);
    }
    if (s.snare.includes(i)) {
      this.noise(0.09, 0.3, 1600, true, mg, t);
      if (!lite) {
        this.tone(190, 95, 0.055, 'triangle', 0.14, mg, t);
        this.noise(0.025, 0.12, 5200, true, mg, t + 0.008);
      }
    }
    if (s.hat.includes(i)) this.noise(0.03, 0.14, 6500, true, mg, t);
    const b = s.bass[i];
    if (b != null) {
      this.tone(midi(b), midi(b), spb * 1.7, 'triangle', 0.4, mg, t);
      if (!lite && (i === 0 || i === 8)) this.tone(midi(b + 12), midi(b + 12) * 0.998, spb * 1.2, 'sine', 0.08, mg, t);
    }
    const leadPat = s.lead[bar % s.lead.length];
    const L = leadPat[i];
    if (L != null) {
      const heat = this._combatHeat || 0;
      const lv = 0.12 + heat * 0.055;
      this.tone(midi(L), midi(L) * 0.995, spb * 1.6, 'square', lv, mg, t);
      if (!lite && i % 2 === 0) this.tone(midi(L + 7), midi(L + 7) * 0.998, spb * 1.1, 'triangle', 0.05 + heat * 0.03, mg, t + spb * 0.12);
    }
    if ((s.id === 'battle' || s.id === 'elite' || s.id === 'boss') && heat > 0.35 && !lite && i === 8 && bar % 2 === 0) {
      this.tone(midi(84), midi(79), spb * 0.9, 'square', 0.04 + heat * 0.04, mg, t);
    }
    if (s.id === 'battle' || s.id === 'elite' || s.id === 'boss') {
      if (i === 0 && bar % 4 === 0 && !lite) {
        this.tone(midi(60), midi(60), spb * 3.6, 'sine', 0.05, mg, t);
        this.tone(midi(64), midi(64), spb * 3.4, 'triangle', 0.04, mg, t);
        this.tone(midi(67), midi(67), spb * 3.2, 'sine', 0.03, mg, t);
      }
      if (i === 12 && bar % 2 === 1 && !lite) {
        this.tone(midi(72), midi(76), spb * 1.3, 'square', 0.07, mg, t);
      }
      if (i === 15 && bar % 8 === 7 && !lite) {
        this.noise(0.08, 0.17, 7800, true, mg, t);
        this.tone(midi(84), midi(67), spb * 0.75, 'square', 0.08, mg, t);
      }
    }
    const menuIds = ['menu', 'menu2', 'menu3', 'menuArcade', 'menuHero', 'menuDream'];
    if (menuIds.includes(s.id) && !lite && [3, 7, 11, 15].includes(i) && bar % 2 === 0) {
      const arp = [72, 76, 79, 84][Math.floor(i / 4)];
      this.tone(midi(arp), midi(arp + 2), spb * 0.52, 'triangle', 0.042, mg, t);
    }
    if (s.id === 'menu' || s.id === 'menu2' || s.id === 'menu3' || s.id === 'menuArcade' || s.id === 'menuHero' || s.id === 'menuDream') {
      if (i === 0 && bar % 4 === 0) {
        this.tone(midi(72), midi(72), spb * 1.8, 'square', 0.13, mg, t);
        this.tone(midi(76), midi(79), spb * 1.2, 'square', 0.09, mg, t + spb * 0.45);
      }
      if (i === 8 && bar % 2 === 0) {
        this.tone(midi(57), midi(48), spb * 1.4, 'triangle', 0.11, mg, t);
      }
      if (i === 0 && bar % 2 === 0) {
        this.tone(midi(57), midi(57), spb * 3.8, 'sine', 0.06, mg, t);
      }
    }
    if (s.id === 'menu2') {
      if (i === 4 || i === 12) this.tone(midi(79), midi(84), spb * 1.1, 'square', 0.1, mg, t);
      if (i === 0 && bar % 8 === 4) this.tone(midi(52), midi(45), spb * 2.6, 'triangle', 0.08, mg, t);
    }
    if (s.id === 'menu3') {
      if (i === 0 && bar % 4 === 2) this.tone(midi(64), midi(67), spb * 3.4, 'sine', 0.07, mg, t);
      if (i === 8 && bar % 4 === 0) this.tone(midi(60), midi(55), spb * 2.8, 'triangle', 0.06, mg, t);
    }
    if (s.id === 'menuArcade') {
      if (i === 0 || i === 8) this.tone(midi(67), midi(60), spb * 1.5, 'square', 0.09, mg, t);
      if (i === 4 && bar % 2 === 0) this.noise(0.03, 0.1, 5200, true, mg, t);
    }
    if (s.id === 'menuHero') {
      if (i === 4 || i === 12) this.tone(midi(79), midi(84), spb * 1.05, 'square', 0.11, mg, t);
      if (i === 0 && bar % 4 === 2) this.tone(midi(57), midi(64), spb * 2.9, 'triangle', 0.075, mg, t);
      if (!lite && i === 8 && bar % 2 === 0) this.tone(midi(72), midi(76), spb * 1.25, 'sine', 0.065, mg, t);
    }
    if (s.id === 'menuDream') {
      if (i === 0 && bar % 4 === 0) this.tone(midi(60), midi(60), spb * 4.2, 'sine', 0.055, mg, t);
      if (i === 8 && bar % 2 === 0) this.tone(midi(67), midi(64), spb * 2.4, 'triangle', 0.05, mg, t);
      if (!lite && (i === 4 || i === 12)) this.tone(midi(76), midi(79), spb * 1.6, 'sine', 0.045, mg, t);
    }
    if (s.id === 'wall' && !lite && i === 0 && bar % 2 === 0) {
      this.tone(midi(79), midi(76), spb * 0.85, 'square', 0.05, mg, t);
    }
    if (s.id === 'mats' && !lite && i === 12 && bar % 4 === 2) {
      this.tone(midi(84), midi(79), spb * 1.1, 'triangle', 0.06, mg, t);
    }
    if (s.id === 'elite' || s.id === 'boss') {
      if (i === 0 && bar % 2 === 0) {
        this.tone(midi(s.id === 'boss' ? 50 : 55), midi(s.id === 'boss' ? 38 : 43), spb * 2.4, 'sawtooth', 0.07, mg, t);
      }
      if (i === 8 && bar % 4 === 1) {
        this.noise(0.06, 0.12, 2200, true, mg, t);
      }
    }
    if (s.id === 'training') {
      if (i === 0) this.tone(midi(64), midi(57), spb * 2.2, 'triangle', 0.08, mg, t);
      if (i === 12 && bar % 2 === 0) this.noise(0.05, 0.1, 4800, true, mg, t);
    }
    if (s.id === 'versus') {
      if (i === 0 || i === 8) this.tone(midi(48), midi(36), spb * 1.6, 'square', 0.07, mg, t);
      if (i === 4 && bar % 2 === 1) this.noise(0.04, 0.11, 1600, false, mg, t);
    }
    if (s.id === 'wall') {
      if (i === 0 && bar % 4 === 0) this.tone(midi(67), midi(62), spb * 3.2, 'sine', 0.07, mg, t);
      if ([2, 6, 10, 14].includes(i)) this.noise(0.02, 0.08, 7000, true, mg, t);
    }
    if (s.id === 'mats') {
      if (i === 0 || i === 8) this.tone(midi(72), midi(76), spb * 1.4, 'sine', 0.09, mg, t);
      if (i === 4) this.tone(midi(79), midi(72), spb * 1.1, 'triangle', 0.07, mg, t);
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
  /** Menu variant — sneller, helderder */
  menu2: {
    bpm: 104,
    kick: [0, 8], snare: [4, 12], hat: [2, 6, 10, 14],
    bass: [48,null,null,null, 52,null,null,null, 45,null,null,null, 43,null,45,null],
    lead: [
      [72,null,76,null, 79,null,76,null, 77,null,74,null, 72,null,69,null],
      [74,null,77,null, 81,null,77,null, 79,null,76,null, 74,null,72,null],
    ],
  },
  /** Menu variant — eiland / avontuur sfeer */
  menu3: {
    bpm: 84,
    kick: [0], snare: [], hat: [4, 12],
    bass: [43,null,null,null, 40,null,null,null, 38,null,null,null, 36,null,38,null],
    lead: [
      [64,null,67,null, 71,null,67,null, 69,null,64,null, 62,null,60,null],
      [67,null,71,null, 74,null,71,null, 69,null,67,null, 64,null,62,null],
    ],
  },
  /** Menu variant — coin-op arcade */
  menuArcade: {
    bpm: 110,
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [50,null,50,null, 48,null,45,null, 50,null,52,null, 48,null,45,null],
    lead: [
      [76,null,79,null, 81,null,79,null, 76,null,74,null, 72,null,76,null],
      [79,null,81,null, 84,null,81,null, 79,null,76,null, 74,null,72,null],
    ],
  },
  /** Menu variant — hero fanfare / title energy */
  menuHero: {
    bpm: 100,
    kick: [0, 6, 8, 14], snare: [4, 12], hat: [2, 6, 10, 14],
    bass: [45,null,null,48, 50,null,null,45, 43,null,40,null, 38,null,43,null],
    lead: [
      [69,null,72,76, null,74,72,null, 69,null,67,null, 64,null,67,69],
      [72,null,76,79, null,77,74,null, 72,null,69,null, 67,null,69,72],
    ],
  },
  /** Menu variant — dreamy / floaty */
  menuDream: {
    bpm: 88,
    kick: [0], snare: [], hat: [4, 12],
    bass: [48,null,null,null, 45,null,null,null, 43,null,null,null, 41,null,43,null],
    lead: [
      [67,null,71,null, 74,null,71,null, 69,null,67,null, 64,null,62,null],
      [69,null,72,null, 76,null,72,null, 69,null,67,null, 64,null,67,null],
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
  elite: {
    bpm: 148,
    kick: [0, 4, 8, 11, 12], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [41,41,null,41, 44,null,41,null, 46,46,null,44, 41,null,39,null],
    lead: [
      [77,null,80,77, null,75,77,null, 72,null,75,72, null,70,72,75],
      [77,null,80,82, null,80,77,null, 75,null,77,75, 72,null,70,null],
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
  /** Training vs RabbitRobot — strak, metallig, minder zwaar dan baas */
  training: {
    bpm: 128,
    kick: [0, 8], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [48,null,48,null, 45,null,43,null, 48,null,50,null, 45,null,43,null],
    lead: [
      [71,null,null,74, null,76,null,74, 71,null,69,null, 67,null,69,null],
      [74,null,76,null, 79,null,76,null, 74,null,71,null, 69,null,71,74],
    ],
  },
  /** 2P versus — syncopisch, duellerend */
  versus: {
    bpm: 152,
    kick: [0, 3, 8, 11], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [36,36,null,38, 36,null,41,null, 38,38,null,36, 33,null,36,null],
    lead: [
      [72,null,75,72, null,70,72,null, 67,null,70,67, null,65,67,70],
      [75,null,77,79, null,77,75,null, 72,null,70,67, 65,null,67,null],
    ],
  },
  /** Muur — snelle arcade-tick */
  wall: {
    bpm: 168,
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [1,3,5,7,9,11,13,15],
    bass: [43,43,null,43, 45,null,43,null, 47,47,null,45, 43,null,40,null],
    lead: [
      [79,79,null,76, 79,null,81,null, 76,76,null,74, 76,null,79,null],
      [81,null,79,76, null,74,76,null, 79,null,81,84, null,81,79,null],
    ],
  },
  /** Mats munten — speels / vrolijk */
  mats: {
    bpm: 118,
    kick: [0, 8], snare: [4, 12], hat: [2, 6, 10, 14],
    bass: [48,null,null,48, 52,null,48,null, 50,null,null,50, 47,null,45,null],
    lead: [
      [72,null,76,79, null,76,72,null, 74,null,77,81, null,77,74,null],
      [76,null,79,83, null,79,76,null, 74,null,72,69, 71,null,72,76],
    ],
  },
};

const MENU_BGM_TRACKS = ['menu', 'menu2', 'menu3', 'menuArcade', 'menuHero', 'menuDream'];
let menuBgmIdx = 0;

/** Rotate menu BGM when returning from a game; keep current track on boot/toggle. */
function playMenuBgm(fromGame) {
  if (fromGame) menuBgmIdx = (menuBgmIdx + 1) % MENU_BGM_TRACKS.length;
  AudioSys.play(MENU_BGM_TRACKS[menuBgmIdx]);
}

/* --- src/systems/input.js --- */
/* =============================== INPUT ================================= */
const SHURIKEN_CD = 0.4;
const SHURIKEN_BURST_WINDOW = 1.35;
const SHURIKEN_BURST_MAX = 3;

function inputPadForFighter(f) {
  if (f && f.playerSlot === 2) return InputP2;
  return Input;
}

/** Joystick / toetsen → genormaliseerde mikrichting (−y = omhoog). */
function fighterAimNorm(f) {
  const pad = inputPadForFighter(f);
  const face = (f && f.face) || 1;
  let nx = face * 0.82;
  let ny = -0.2;
  if (pad && pad.joy && pad.joy.active) {
    const jx = pad.joy.dx;
    const jy = pad.joy.dy;
    // Verticale mik los van horizontale looprichting — joy ↑ blijft duidelijk
    if (Math.abs(jy) >= JOY_AIM_DEAD_PX) {
      ny = clamp(jy / JOY_MAX_PX, -1.05, 0.78);
      if (ny < -0.14) ny = clamp(ny * 1.38, -1.15, 0);
    }
    if (Math.abs(jx) >= JOY_DEAD_PX) nx = clamp(jx / JOY_MAX_PX, -1, 1);
    else nx = face * 0.72;
  }
  if (pad && pad.keys) {
    const up = !!(pad.keys.arrowup || pad.keys.w);
    const down = !!(pad.keys.arrowdown || pad.keys.s);
    if (up && !down) ny = -0.95;
    if (down && !up) ny = 0.62;
  }
  const len = Math.hypot(nx, ny) || 1;
  return { nx: nx / len, ny: ny / len };
}

function aimVisualColor(ny) {
  if (ny < -0.42) return '#7cf5ff';
  if (ny > 0.22) return '#ffb06a';
  return '#e8f0ff';
}

function drawJoyAimGuide(c, jx, jy, j, ui, accent) {
  const outer = Math.round(48 * ui);
  c.save();
  c.globalAlpha = j.active ? 0.44 : 0.2;
  c.strokeStyle = accent || '#fff';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(jx, jy - outer + 6);
  c.lineTo(jx - 6, jy - outer + 16);
  c.lineTo(jx + 6, jy - outer + 16);
  c.closePath();
  c.stroke();
  c.beginPath();
  c.moveTo(jx, jy + outer - 6);
  c.lineTo(jx - 6, jy + outer - 16);
  c.lineTo(jx + 6, jy + outer - 16);
  c.closePath();
  c.stroke();
  const barX = jx + outer + Math.round(8 * ui);
  const barH = outer * 1.3;
  c.globalAlpha = 0.26;
  c.beginPath();
  c.moveTo(barX, jy - barH / 2);
  c.lineTo(barX, jy + barH / 2);
  c.stroke();
  c.fillStyle = '#aab4cc';
  c.beginPath();
  c.arc(barX, jy, 3, 0, TAU);
  c.fill();
  if (j.active && Math.abs(j.dy) >= JOY_AIM_DEAD_PX) {
    const t = clamp(-j.dy / JOY_MAX_PX, -1, 1);
    c.globalAlpha = 0.78;
    c.fillStyle = aimVisualColor(-t);
    c.beginPath();
    c.arc(barX, jy - t * (barH / 2 - 4), 5, 0, TAU);
    c.fill();
  }
  c.restore();
}

function drawPlayerAimIndicator(c, fighter, alpha) {
  if (!fighter || !fighter.alive) return;
  const aim = fighterAimNorm(fighter);
  const col = aimVisualColor(aim.ny);
  const ox = fighter.x;
  const oy = fighter.y - 52 + clamp(aim.ny, -1, 0.55) * 32;
  const len = 54;
  c.save();
  c.globalAlpha = alpha != null ? alpha : 0.5;
  c.strokeStyle = col;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(ox, oy);
  c.lineTo(ox + aim.nx * len, oy + aim.ny * len * 1.08);
  c.stroke();
  c.fillStyle = col;
  c.beginPath();
  c.arc(ox + aim.nx * len, oy + aim.ny * len * 1.08, 5, 0, TAU);
  c.fill();
  const hit = meleeHitPoint(fighter, { range: 40 });
  c.globalAlpha *= 0.55;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(hit.hx - 6, hit.hy);
  c.lineTo(hit.hx + 6, hit.hy);
  c.moveTo(hit.hx, hit.hy - 6);
  c.lineTo(hit.hx, hit.hy + 6);
  c.stroke();
  c.restore();
}

/** Werpers / jutsu: snelheid in de mikrichting (joy ↑ = hoger gooien). */
function projAimVelocity(f, baseSpeed) {
  baseSpeed = baseSpeed || 520;
  const aim = fighterAimNorm(f);
  return {
    vx: aim.nx * baseSpeed,
    vy: aim.ny * baseSpeed * 1.05,
    nx: aim.nx,
    ny: aim.ny,
  };
}

/** Melee-hitpunt: joy/toets ↑ tilts de slag omhoog (flying + hoge vijanden). */
function meleeHitPoint(f, spec) {
  const aim = (f && f._aimAtAttack) || fighterAimNorm(f);
  const range = (spec && spec.range) || 40;
  const hx = f.x + f.face * range * (0.72 + Math.abs(aim.nx) * 0.18);
  const moveOff = (spec && spec.moveHitY) || 0;
  const hy = f.y - 48 + clamp(aim.ny, -1, 0.65) * 88 + moveOff;
  return { hx, hy, aim };
}

function canThrowShuriken(f, game) {
  if (!f || f._shurikenCd > 0) return false;
  const t = game ? game.t : 0;
  f._shurikenBurst = (f._shurikenBurst || []).filter(x => t - x < SHURIKEN_BURST_WINDOW);
  return f._shurikenBurst.length < SHURIKEN_BURST_MAX;
}

function noteShurikenThrow(f, game) {
  f._shurikenCd = SHURIKEN_CD;
  const t = game ? game.t : 0;
  f._shurikenBurst = f._shurikenBurst || [];
  f._shurikenBurst.push(t);
}

const JOY_DEAD_PX = 11;
const JOY_AIM_DEAD_PX = 7;
const JOY_MAX_PX = 58;
/** Geen pointermove meer → joy los (iPad mist soms pointerup) — alleen als touch weg is */
const JOY_STALE_MS = IS_TOUCH ? 2000 : 1600;

function btnHitSlop() {
  const base = (typeof save !== 'undefined' && save.bigTouch !== false) ? 14 : 10;
  if (IS_TOUCH && typeof W === 'number' && W > 0 && typeof H === 'number' && H > 0) {
    const ui = touchUiScale(W, H);
    return Math.round(base + (ui >= 1.02 ? 5 : 2));
  }
  return base;
}

/** Dichtstbijzijnde knop binnen slop — voorkomt verkeerde match bij overlap/slop (d9). */
function hitTouchButton(buttons, x, y) {
  const slop = btnHitSlop();
  let best = null;
  let bestD = Infinity;
  for (const b of buttons) {
    const d = Math.hypot(x - b.x, y - b.y);
    if (d <= b.r + slop && d < bestD) {
      bestD = d;
      best = b;
    }
  }
  return best;
}

function joyGuardRadius(pad) {
  const ui = touchUiScale(W, H);
  return Math.round((pad && pad.side === 'p2' ? 54 : 58) * ui);
}

function pointInJoyZone(pad, x, y) {
  const home = (pad && pad.joyHome) || { x: 110, y: (H || 600) - 110 };
  return Math.hypot(x - home.x, y - home.y) <= joyGuardRadius(pad) + btnHitSlop() * 0.5;
}

function nearAnyTouchButton(buttons, x, y, extra) {
  const pad = extra || 0;
  const slop = btnHitSlop() + pad;
  for (const b of buttons) {
    if (Math.hypot(x - b.x, y - b.y) < b.r + slop) return true;
  }
  return false;
}

const TOUCH_BTN_META = {
  punch: { label: '\u{1F44A}', color: '#e0533f' },
  kick: { label: '\u{1F9B6}', color: '#3f8fe0' },
  weapon: { label: '\u{1F52A}', color: '#9b59d0' },
  special: { label: '\u{1F300}', color: '#3db8ff' },
  subst: { label: '\u{1F4A8}', color: '#c9a66b' },
  jump: { label: '\u2B06\uFE0F', color: '#43b25b' },
};

function touchBtn(id, x, y, rad) {
  const m = TOUCH_BTN_META[id];
  return { id, x, y, r: rad, label: m.label, color: m.color, held: false };
}

function shiftTouchButtons(buttons, dx) {
  if (!dx) return;
  for (const b of buttons) b.x += dx;
}

/** Knoppen mogen niet buiten de schermranden uitsteken. */
function clampButtonsToScreen(buttons, H) {
  let maxBy = -Infinity, maxBx = -Infinity;
  for (const b of buttons) {
    maxBy = Math.max(maxBy, b.y + b.r);
    maxBx = Math.max(maxBx, b.x + b.r);
  }
  const overY = maxBy - (H - 4);
  if (overY > 0) for (const b of buttons) b.y -= overY;
  const overX = maxBx - (W - 2);
  if (overX > 0) for (const b of buttons) b.x -= overX;
}

function layoutTouchButtonCluster(W, H, ui, safe, opts) {
  const side = opts.side || 'p1';
  const dual = !!opts.dual;
  const portraitTight = W < 420 && H > W * 1.02;
  const r = Math.max(20, Math.round((portraitTight ? 34 : 42) * ui));
  const rs = Math.max(17, Math.round((portraitTight ? 28 : 34) * ui));
  const bottomY = H - safe.bottom - Math.max(10, H * 0.02);
  const joyInset = Math.max((dual ? 48 : 64) + (side === 'p1' ? safe.left : safe.right), W * (portraitTight ? 0.09 : 0.12));
  const joyHome = side === 'p1'
    ? { x: joyInset, y: bottomY - (dual ? 6 : 8) }
    : { x: W - joyInset, y: bottomY - 6 };

  let buttons;
  if (!dual) {
    const marginR = Math.max(10 + safe.right, W * 0.035);
    const xR = W - marginR;
    if (portraitTight) {
      const rSmall = Math.max(18, Math.round(28 * ui));
      const rsSmall = Math.max(15, Math.round(24 * ui));
      const col = rSmall * 1.55 + 12;
      const gap = 6;
      const by = bottomY - rsSmall * 0.35;
      const xJump = xR - rsSmall * 0.15;
      const xMid = xR - col;
      const xFar = xR - col * 2.25;
      buttons = [
        touchBtn('jump', xJump, by, rsSmall),
        touchBtn('punch', xMid, by, rSmall),
        touchBtn('kick', xFar, by, rSmall),
        touchBtn('special', xJump, by - (rsSmall + rSmall + gap), rSmall),
        touchBtn('weapon', xMid, by - (rSmall + rSmall + gap), rSmall),
        touchBtn('subst', xFar, by - (rsSmall + rSmall + gap), rsSmall),
      ];
      const joyClear = joyHome.x + Math.round(50 * ui) + rSmall * 0.25;
      const minBx = Math.min(...buttons.map((b) => b.x - b.r));
      if (minBx < joyClear) shiftTouchButtons(buttons, joyClear - minBx);
    } else {
      // Nette 3×2 grid zonder overlap (fix: punch/jump lagen op elkaar,
      // waardoor jump onbereikbaar was — hitButton pakt de eerste match).
      const gap = Math.max(8, Math.round(10 * ui));
      const colW = r * 2 + gap;
      const rowH = r * 2 + gap;
      const x1 = xR - r;
      const x2 = x1 - colW;
      const x3 = x2 - colW * 0.96;
      const yB = bottomY - r * 0.15;
      const yT = yB - rowH;
      buttons = [
        touchBtn('punch', x1, yB, r),
        touchBtn('kick', x2, yB, r),
        touchBtn('jump', x3, yB + (r - rs) * 0.4, rs),
        touchBtn('special', x1, yT, r),
        touchBtn('weapon', x2, yT, r),
        touchBtn('subst', x3, yT + (r - rs) * 0.4, rs),
      ];
      const joyClear = joyHome.x + Math.round(55 * ui) + r * 0.3;
      const minBx = Math.min(...buttons.map((b) => b.x - b.r));
      if (minBx < joyClear) shiftTouchButtons(buttons, joyClear - minBx);
    }
    clampButtonsToScreen(buttons, H);
    return { joyHome, buttons };
  }

  const zoneEdge = portraitTight ? (side === 'p1' ? W * 0.44 : W * 0.56) : (side === 'p1' ? W * 0.48 : W * 0.52);
  const sign = side === 'p1' ? -1 : 1;
  if (portraitTight) {
    const rSmall = Math.max(17, Math.round(26 * ui));
    const rsSmall = Math.max(14, Math.round(22 * ui));
    const col = rSmall * 1.5 + 11;
    const gap = 5;
    const by = bottomY - rsSmall * 0.32;
    const edge = zoneEdge;
    const xNear = edge + sign * rsSmall * 0.2;
    const xMid = edge + sign * col;
    const xFar = edge + sign * col * 2.2;
    buttons = [
      touchBtn('jump', xNear, by, rsSmall),
      touchBtn('punch', xMid, by, rSmall),
      touchBtn('kick', xFar, by, rSmall),
      touchBtn('special', xNear, by - (rsSmall + rSmall + gap), rSmall),
      touchBtn('weapon', xMid, by - (rSmall + rSmall + gap), rSmall),
      touchBtn('subst', xFar, by - (rsSmall + rSmall + gap), rsSmall),
    ];
    if (side === 'p1') {
      const joyClear = joyHome.x + Math.round(46 * ui) + rSmall * 0.2;
      const minBx = Math.min(...buttons.map((b) => b.x - b.r));
      if (minBx < joyClear) shiftTouchButtons(buttons, joyClear - minBx);
      const maxBx = Math.max(...buttons.map((b) => b.x + b.r));
      if (maxBx > W * 0.46 - 6) shiftTouchButtons(buttons, (W * 0.46 - 6) - maxBx);
    } else {
      const minBx = Math.min(...buttons.map((b) => b.x - b.r));
      if (minBx < W * 0.54 + 6) shiftTouchButtons(buttons, (W * 0.54 + 6) - minBx);
      const maxBx = Math.max(...buttons.map((b) => b.x + b.r));
      const joyClear = W - joyHome.x + Math.round(46 * ui) + rSmall * 0.2;
      if (W - minBx < joyClear) shiftTouchButtons(buttons, -(joyClear - (W - minBx)));
      if (maxBx > W - 6) shiftTouchButtons(buttons, -(maxBx - (W - 6)));
    }
  } else {
    // 2P landscape: compacte 2×3 grid per kant — geen overlap
    const gapD = Math.max(6, Math.round(8 * ui));
    const rD = Math.max(19, Math.round(r * 0.88));
    const rsD = Math.max(16, Math.round(rs * 0.88));
    const colW2 = rD * 2 + gapD;
    const rowH2 = rD * 2 + gapD;
    const xIn = zoneEdge + sign * rD;
    const xOut = zoneEdge + sign * (rD + colW2);
    const yB2 = bottomY - rD * 0.15;
    const yM2 = yB2 - rowH2;
    const yT2 = yM2 - rowH2;
    buttons = [
      touchBtn('punch', xIn, yB2, rD),
      touchBtn('kick', xOut, yB2, rD),
      touchBtn('special', xIn, yM2, rD),
      touchBtn('weapon', xOut, yM2, rD),
      touchBtn('jump', xIn, yT2 + (rD - rsD) * 0.4, rsD),
      touchBtn('subst', xOut, yT2 + (rD - rsD) * 0.4, rsD),
    ];
    // joystick-clearance per kant
    if (side === 'p1') {
      const joyClear = joyHome.x + Math.round(55 * ui) + rD * 0.3;
      const minBx = Math.min(...buttons.map((b) => b.x - b.r));
      if (minBx < joyClear) shiftTouchButtons(buttons, joyClear - minBx);
    } else {
      const joyClearR = joyHome.x - Math.round(55 * ui) - rD * 0.3;
      const maxBx = Math.max(...buttons.map((b) => b.x + b.r));
      if (maxBx > joyClearR) shiftTouchButtons(buttons, joyClearR - maxBx);
    }
  }
  clampButtonsToScreen(buttons, H);
  return { joyHome, buttons };
}

/** 2P touch: middenstrook = geen joystick (minder mis-taps op split). */
function touchPadZone(x) {
  if (!Input.dualMode) return 'p1';
  const w = W || (typeof innerWidth === 'number' ? innerWidth : 800);
  const margin = IS_TOUCH ? (w < 420 ? 0.08 : 0.06) : 0.04;
  const lo = w * (0.5 - margin);
  const hi = w * (0.5 + margin);
  if (x >= lo && x <= hi) return 'neutral';
  return x < lo ? 'p1' : 'p2';
}

function relayoutTouchPads() {
  if (typeof W === 'undefined' || typeof H === 'undefined') return;
  try {
    Input.layout(W, H);
    if (typeof InputP2 !== 'undefined') InputP2.layout(W, H);
  } catch (_) {}
}

/** Voorkom dat scroll/slide over menu-tegels meteen selecteert (iPad). */
const TAP_SLOP_PX = IS_TOUCH ? 12 : 8;
const _uiTap = { id: null, x: 0, y: 0, moved: false, scrolls: [] };
let _uiLastGestureScroll = false;
let _uiBlockClickAfterScroll = false;

function uiTapScrollParents(fromEl) {
  const out = [];
  let el = fromEl;
  while (el && el !== document.documentElement) {
    if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) {
      out.push({ el, top: el.scrollTop, left: el.scrollLeft });
    }
    el = el.parentElement;
  }
  return out;
}

function uiTapSlopPx() {
  if (IS_TOUCH && typeof save !== 'undefined' && save.bigTouch !== false) return 16;
  return TAP_SLOP_PX;
}

function uiTapGuardMove(x, y) {
  if (_uiTap.id == null) return;
  if (Math.hypot(x - _uiTap.x, y - _uiTap.y) > uiTapSlopPx()) _uiTap.moved = true;
  if (_uiTap.moved) return;
  for (const s of _uiTap.scrolls) {
    if (Math.abs(s.el.scrollTop - s.top) > 1 || Math.abs(s.el.scrollLeft - s.left) > 1) {
      _uiTap.moved = true;
      break;
    }
  }
}

function uiTapGuardFinish(cancelled) {
  const tap = !cancelled && _uiTap.id != null && !_uiTap.moved;
  _uiLastGestureScroll = !tap;
  if (!tap) _uiBlockClickAfterScroll = true;
  _uiTap.id = null;
  _uiTap.scrolls = [];
}

function uiTapAllowed() { return !_uiLastGestureScroll; }

/** True tijdens/na scroll-slide — blokkeert tap én long-press (iPad level-tegels). */
function uiGestureMoved() { return !!_uiTap.moved || _uiLastGestureScroll; }

function initUiTapScrollGuard() {
  if (window.__sfUiTapGuard) return;
  window.__sfUiTapGuard = true;
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    _uiTap.id = e.pointerId;
    _uiTap.x = e.clientX;
    _uiTap.y = e.clientY;
    _uiTap.moved = false;
    _uiTap.scrolls = uiTapScrollParents(e.target);
    _uiLastGestureScroll = false;
  }, { passive: true, capture: true });
  document.addEventListener('pointermove', (e) => {
    if (_uiTap.id !== e.pointerId) return;
    uiTapGuardMove(e.clientX, e.clientY);
  }, { passive: true, capture: true });
  document.addEventListener('pointerup', (e) => {
    if (_uiTap.id !== e.pointerId) return;
    uiTapGuardFinish(false);
  }, { passive: true, capture: true });
  document.addEventListener('pointercancel', (e) => {
    if (_uiTap.id !== e.pointerId) return;
    uiTapGuardFinish(true);
  }, { passive: true, capture: true });
  document.addEventListener('click', (e) => {
    if (!_uiBlockClickAfterScroll) return;
    _uiBlockClickAfterScroll = false;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }, true);
}

function touchEndedOnSelector(e, selector) {
  if (!uiTapAllowed()) return null;
  const t = e.changedTouches && e.changedTouches[0];
  const fromTarget = e.target && e.target.closest ? e.target.closest(selector) : null;
  if (!fromTarget) return null;
  if (!t) return fromTarget;
  try {
    const top = document.elementFromPoint(t.clientX, t.clientY);
    const fromPoint = top && top.closest ? top.closest(selector) : null;
    if (fromPoint && fromPoint !== fromTarget) return null;
  } catch (_) {}
  return fromTarget;
}

function readSafeInsets() {
  try {
    const cs = getComputedStyle(document.documentElement);
    const px = (k) => parseFloat(cs.getPropertyValue(k)) || 0;
    return {
      top: px('--safe-top'),
      bottom: px('--safe-bottom'),
      left: px('--safe-left'),
      right: px('--safe-right'),
    };
  } catch (_) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
}

function syncViewportCssVars(vp) {
  vp = vp || viewportGameSize();
  try {
    const root = document.documentElement;
    root.style.setProperty('--vv-w', vp.w + 'px');
    root.style.setProperty('--vv-h', vp.h + 'px');
    root.style.setProperty('--vv-top', vp.offsetY + 'px');
    root.style.setProperty('--vv-left', vp.offsetX + 'px');
  } catch (_) {}
}

function viewportGameSize() {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  if (vv && vv.width > 0 && vv.height > 0) {
    return {
      w: Math.max(1, Math.round(vv.width)),
      h: Math.max(1, Math.round(vv.height)),
      offsetX: Math.round(vv.offsetLeft || 0),
      offsetY: Math.round(vv.offsetTop || 0),
    };
  }
  return { w: Math.max(1, innerWidth), h: Math.max(1, innerHeight), offsetX: 0, offsetY: 0 };
}

function touchUiScale(W, H) {
  const base = (typeof save !== 'undefined' && save.bigTouch !== false) ? 1.1 : 1;
  const portrait = H > W * 1.04;
  const fit = portrait
    ? Math.min(W / 390, H / 660, W / H * 0.95)
    : Math.min(W / 400, H / 740);
  return clamp(fit * base, 0.62, 1.16);
}

function hudInsetTop() {
  return Math.max(readSafeInsets().top, 6) + 10;
}

function playfieldGroundY(H, W) {
  const portrait = H > W * 1.02;
  if (portrait && H < 480) return H * 0.68;
  if (portrait && H < 520) return H * 0.7;
  if (portrait && H < 640) return H * 0.72;
  if (portrait) return H * 0.73;
  return H * 0.78;
}

function pointerGameCoords(clientX, clientY) {
  const el = canvas;
  if (el && W > 0 && H > 0) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 2 && rect.height > 2) {
      return {
        x: clamp((clientX - rect.left) * (W / rect.width), 0, W),
        y: clamp((clientY - rect.top) * (H / rect.height), 0, H),
      };
    }
  }
  const vp = viewportGameSize();
  return {
    x: clamp(clientX - vp.offsetX, 0, W || vp.w),
    y: clamp(clientY - vp.offsetY, 0, H || vp.h),
  };
}

function ketsbamPromptCenter() {
  return { cx: W * 0.5, cy: H * 0.46 };
}

function ketsbamHitTest(x, y, g) {
  if (!g || !g.ketsbamShow) return false;
  const ui = touchUiScale(W, H);
  const { cx, cy } = ketsbamPromptCenter();
  const r = 58 * ui + btnHitSlop();
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function applyJoyDelta(pad, x, y, id) {
  if (!pad.joy.active || pad.joy.id !== id) return;
  let dx = x - pad.joy.ox;
  let dy = y - pad.joy.oy;
  // Zwevende stick: origin schuift mee aan de rand — makkelijker omkeren links/rechts
  if (Math.abs(dx) > JOY_MAX_PX) {
    pad.joy.ox += dx - Math.sign(dx) * JOY_MAX_PX;
    dx = Math.sign(dx) * JOY_MAX_PX;
  }
  if (Math.abs(dy) > JOY_MAX_PX) {
    pad.joy.oy += dy - Math.sign(dy) * JOY_MAX_PX;
    dy = Math.sign(dy) * JOY_MAX_PX;
  }
  if (Math.abs(dx) < JOY_DEAD_PX) dx = 0;
  if (Math.abs(dy) < JOY_DEAD_PX) dy = 0;
  pad.joy.dx = dx;
  pad.joy.dy = dy;
  pad.joy.lastAt = performance.now();
}

function makePad(side) {
  return {
    side,
    keys: {},
    pressed: {},
    activePointers: new Set(),
    joy: { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0, lastAt: 0 },
    buttons: [],
    btnPointers: {},
    pointerPads: {},
    joyHome: { x: 110, y: 0 },
    lastMoveTap: 0,
    lastMoveDir: 0,
    releaseJoy() {
      this.joy.active = false;
      this.joy.id = null;
      this.joy.dx = 0;
      this.joy.dy = 0;
      this.joy.lastAt = 0;
    },
    releaseAll() {
      this.releaseJoy();
      for (const b of this.buttons) b.held = false;
      this.btnPointers = {};
      this.pointerPads = {};
      this.activePointers.clear();
      this.keys = {};
    },
    refreshJoyHold(now) {
      if (this.joy.active && this.joy.id != null && this.activePointers.has(this.joy.id)) {
        this.joy.lastAt = now;
      }
    },
    hardenPointers(now) {
      const t = now || performance.now();
      if (this.joy.active) {
        if (this.joy.id == null || !this.activePointers.has(this.joy.id)) {
          this.releaseJoy();
        } else if (
          this.activePointers.size === 0
          && this.joy.lastAt
          && t - this.joy.lastAt > JOY_STALE_MS
        ) {
          this.releaseJoy();
        }
      }
      if (this.joy.active && this.activePointers.size === 0) {
        this.releaseJoy();
      }
      for (const pid of Object.keys(this.btnPointers)) {
        const n = Number(pid);
        if (!this.activePointers.has(n) && !this.activePointers.has(pid)) {
          const bid = this.btnPointers[pid];
          const b = this.buttons.find(q => q.id === bid);
          if (b) b.held = false;
          delete this.btnPointers[pid];
        }
      }
    },
    get move() {
      let m = padDigitalMove(this);
      if (this.joy.active) m += joyMoveAxis(this);
      return clamp(m, -1, 1);
    },
    press(action) { this.pressed[action] = true; },
    take(action) { const v = this.pressed[action]; this.pressed[action] = false; return !!v; },
    layout(W, H) {
      const ui = touchUiScale(W, H);
      const safe = readSafeInsets();
      const laid = layoutTouchButtonCluster(W, H, ui, safe, { side: this.side, dual: true });
      this.joyHome = laid.joyHome;
      this.buttons = laid.buttons;
    },
    hitButton(x, y) {
      return hitTouchButton(this.buttons, x, y);
    },
    ownsTouch(x, y, dual) {
      if (!dual) return this.side === 'p1';
      const z = touchPadZone(x);
      if (z === 'neutral') return false;
      return this.side === 'p1' ? z === 'p1' : z === 'p2';
    },
    onDown(x, y, id, dual) {
      if (!this.ownsTouch(x, y, dual)) return false;
      this.activePointers.add(id);
      if (dual) this.pointerPads[id] = this.side;
      const b = this.hitButton(x, y);
      if (b) {
        if (b.held) return true;
        this.btnPointers[id] = b.id;
        b.held = true;
        this.press(b.id);
        try { if (typeof haptic === 'function') haptic(6); } catch (_) {}
        return true;
      }
      if (this.joy.active && this.joy.id !== id && !this.activePointers.has(this.joy.id)) {
        this.releaseJoy();
      }
      if (this.joy.active && this.joy.id !== id) return false;
      if (!this.joy.active) {
        if (!pointInJoyZone(this, x, y)) return false;
        if (nearAnyTouchButton(this.buttons, x, y, btnHitSlop())) return false;
        this.joy.active = true;
        this.joy.id = id;
        this.joy.ox = x;
        this.joy.oy = y;
        this.joy.dx = 0;
        this.joy.dy = 0;
        this.joy.lastAt = performance.now();
        return true;
      }
      return false;
    },
    onMove(x, y, id, dual) {
      if (!this.activePointers.has(id)) return;
      if (dual && this.pointerPads[id] && this.pointerPads[id] !== this.side) return;
      applyJoyDelta(this, x, y, id);
    },
    onUp(id) {
      this.activePointers.delete(id);
      delete this.pointerPads[id];
      if (this.joy.active && this.joy.id === id) {
        const dx = this.joy.dx;
        if (Math.abs(dx) > 22) {
          const now = performance.now();
          const dir = Math.sign(dx);
          if (now - this.lastMoveTap < 320 && this.lastMoveDir === dir) this.press('dash');
          this.lastMoveTap = now;
          this.lastMoveDir = dir;
        }
        this.releaseJoy();
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

const Input = makePad('p1');
const _padP1Methods = {
  onDown: Input.onDown,
  onMove: Input.onMove,
  onUp: Input.onUp,
  hardenPointers: Input.hardenPointers,
  refreshJoyHold: Input.refreshJoyHold,
  releaseAll: Input.releaseAll,
  layout: Input.layout,
};

Object.assign(Input, {
  dualMode: false,
  pointerPads: {},
  onDown(x, y, id) {
    AudioSys.init();
    if (this.dualMode) {
      const z = touchPadZone(x);
      if (z === 'neutral') return;
      this.pointerPads[id] = z;
      if (z === 'p2') {
        InputP2.onDown(x, y, id, true);
        return;
      }
      _padP1Methods.onDown.call(this, x, y, id, true);
      return;
    }
    this.activePointers.add(id);
    const b = hitTouchButton(this.buttons, x, y);
    if (b) {
      if (b.held) return;
      this.btnPointers[id] = b.id;
      b.held = true;
      this.press(b.id);
      try { if (typeof haptic === 'function') haptic(6); } catch (_) {}
      return;
    }
    if (!pointInJoyZone(this, x, y)) {
      if (this.joy.active && this.joy.id === id) this.releaseJoy();
      this.activePointers.delete(id);
      return;
    }
    if (nearAnyTouchButton(this.buttons, x, y, btnHitSlop())) {
      this.activePointers.delete(id);
      return;
    }
    if (this.joy.active && this.joy.id !== id && !this.activePointers.has(this.joy.id)) {
      this.releaseJoy();
    }
    if (this.joy.active && this.joy.id !== id) return;
    if (!this.joy.active) {
      this.joy.active = true;
      this.joy.id = id;
      this.joy.ox = x;
      this.joy.oy = y;
      this.joy.dx = 0;
      this.joy.dy = 0;
      this.joy.lastAt = performance.now();
    }
  },
  onMove(x, y, id) {
    if (this.dualMode) {
      const owner = this.pointerPads[id];
      if (owner === 'p2') {
        InputP2.onMove(x, y, id, true);
        return;
      }
      if (owner === 'p1') {
        _padP1Methods.onMove.call(this, x, y, id, true);
        return;
      }
      return;
    }
    if (!this.activePointers.has(id)) return;
    applyJoyDelta(this, x, y, id);
  },
  onUp(id) {
    if (this.dualMode) {
      const owner = this.pointerPads[id];
      if (owner === 'p2') InputP2.onUp(id);
      else if (owner === 'p1') _padP1Methods.onUp.call(this, id);
      delete this.pointerPads[id];
      return;
    }
    _padP1Methods.onUp.call(this, id);
  },
  hardenPointers(now) {
    _padP1Methods.hardenPointers.call(this, now);
    if (InputP2 && Input.dualMode) InputP2.hardenPointers(now);
  },
  releaseAll() {
    _padP1Methods.releaseAll.call(this);
    this.pointerPads = {};
    if (InputP2) InputP2.releaseAll();
  },
  endFrame() {
    const now = performance.now();
    _padP1Methods.refreshJoyHold.call(this, now);
    if (InputP2 && Input.dualMode) InputP2.refreshJoyHold.call(InputP2, now);
    this.hardenPointers(now);
    this.pressed = {};
    if (InputP2) InputP2.pressed = {};
  },
});

const InputP2 = makePad('p2');

Input.layout = function (W, H) {
  if (Input.dualMode) {
    _padP1Methods.layout.call(Input, W, H);
    InputP2.layout(W, H);
    return;
  }
  const ui = touchUiScale(W, H);
  const safe = readSafeInsets();
  const laid = layoutTouchButtonCluster(W, H, ui, safe, { side: 'p1', dual: false });
  Input.joyHome = laid.joyHome;
  Input.buttons = laid.buttons;
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
    if (k === 'e' && state === 'play' && game) game.tryKetsbam();
  }
  if (k === 'a' || (!Input.dualMode && k === 'arrowleft')) {
    if (now - Input.lastMoveTap < 300 && Input.lastMoveDir === -1) Input.press('dash');
    Input.lastMoveTap = now; Input.lastMoveDir = -1;
  }
  if (k === 'd' || (!Input.dualMode && k === 'arrowright')) {
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
    if (!['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(k)) Input.keys[k] = true;
  } else {
    Input.keys[k] = true;
  }
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
});
addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (Input.dualMode && ['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(k)) {
    if (InputP2) InputP2.keys[k] = false;
  } else {
    Input.keys[k] = false;
    if (InputP2) InputP2.keys[k] = false;
  }
});

/* --- src/core/canvas.js --- */
/* ============================== CANVAS ================================= */
const canvas = document.getElementById('game');
const ctx = canvas ? canvas.getContext('2d') : null;
if (!canvas || !ctx) {
  try { sfReportError('canvas', new Error('2d context unavailable')); } catch (_) {}
}
let W = innerWidth, H = innerHeight, DPR = 1;
let resizeDebounce = null;
let lastResizeKey = '';

function resize() {
  const vp = viewportGameSize();
  syncViewportCssVars(vp);
  const newDpr = Math.min(devicePixelRatio || 1, maxCanvasDpr());
  const sizeKey = vp.w + 'x' + vp.h + '@' + newDpr + 't' + Perf.tier;
  if (sizeKey === lastResizeKey) return;
  lastResizeKey = sizeKey;
  try { if (typeof menuBgCacheInvalidate === 'function') menuBgCacheInvalidate(); } catch (_) {}
  DPR = newDpr;
  W = vp.w;
  H = vp.h;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.left = vp.offsetX + 'px';
  canvas.style.top = vp.offsetY + 'px';
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  Input.layout(W, H);
  if (game) game.onResize();
}
function scheduleResize() {
  if (resizeDebounce) clearTimeout(resizeDebounce);
  const delay = IS_TOUCH ? (Perf.tier >= 2 ? 175 : 140) : 100;
  resizeDebounce = setTimeout(() => {
    resizeDebounce = null;
    if (window.__sfResizeT) cancelAnimationFrame(window.__sfResizeT);
    window.__sfResizeT = requestAnimationFrame(() => {
      window.__sfResizeT = null;
      resize();
    });
  }, delay);
}
addEventListener('resize', scheduleResize);
addEventListener('orientationchange', () => {
  if (state === 'play') try { Input.releaseAll(); } catch (_) {}
  setTimeout(resize, 60);
  scheduleResize();
});
if (typeof window !== 'undefined' && window.visualViewport) {
  window.visualViewport.addEventListener('resize', scheduleResize);
  window.visualViewport.addEventListener('scroll', scheduleResize);
}
window.addEventListener('pageshow', () => scheduleResize());

canvas.addEventListener('pointerdown', e => {
  if (state !== 'play' || !game) return;
  e.preventDefault();
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  const p = pointerGameCoords(e.clientX, e.clientY);
  if (ketsbamHitTest(p.x, p.y, game) && game.tryKetsbam()) return;
  Input.onDown(p.x, p.y, e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (state !== 'play' || !game) return;
  e.preventDefault();
  const p = pointerGameCoords(e.clientX, e.clientY);
  Input.onMove(p.x, p.y, e.pointerId);
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
canvas.addEventListener('lostpointercapture', e => {
  if (state !== 'play' || !game) return;
  Input.onUp(e.pointerId);
});
function onGlobalPointerEnd(e) {
  if (state !== 'play' || !game) return;
  Input.onUp(e.pointerId);
}
window.addEventListener('pointerup', onGlobalPointerEnd);
window.addEventListener('pointercancel', onGlobalPointerEnd);
window.addEventListener('blur', () => {
  if (state === 'play') try { Input.releaseAll(); } catch (_) {}
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'play') try { Input.releaseAll(); } catch (_) {}
});
document.addEventListener('gesturestart', e => {
  if (state === 'play') e.preventDefault();
});
document.addEventListener('pointerdown', () => AudioSys.init(), { once: false });

/* --- src/render/draw-helpers.js --- */
/* ============================ TEKENHULPEN ============================== */
function seg(x, y, ang, len) { return [x + Math.cos(ang) * len, y + Math.sin(ang) * len]; }

function drawWeaponShape(c, id, spin, moveIdx) {
  // getekend langs +x vanaf de hand (0,0); c is al getransleerd/geroteerd
  c.lineCap = 'round';
  const mi = ((moveIdx || 0) % 3 + 3) % 3;
  if (mi) {
    c.save();
    if (mi === 1) c.rotate(0.22);
    else if (mi === 2) c.rotate(-0.12);
  }
  switch (id) {
    case 'zwaard':
      c.strokeStyle = '#c9d6e8'; c.lineWidth = 5; c.beginPath(); c.moveTo(4, 0); c.lineTo(46, 0); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(8, -1); c.lineTo(42, -1); c.stroke();
      c.strokeStyle = '#a67c2e'; c.lineWidth = 5; c.beginPath(); c.moveTo(4, -7); c.lineTo(4, 7); c.stroke();
      break;
    case 'master_sword':
      c.save();
      c.shadowColor = '#6fd7ff'; c.shadowBlur = 16;
      c.strokeStyle = '#3a9fd4'; c.lineWidth = 6; c.beginPath(); c.moveTo(6, 0); c.lineTo(64, 0); c.stroke();
      c.strokeStyle = '#e8f8ff'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(12, -1.5); c.lineTo(60, -1.5); c.stroke();
      c.strokeStyle = 'rgba(180,235,255,.55)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(12, 1.5); c.lineTo(60, 1.5); c.stroke();
      c.restore();
      c.fillStyle = '#ffd75e'; c.fillRect(0, -9, 11, 18);
      c.strokeStyle = '#c97a20'; c.lineWidth = 2; c.strokeRect(0, -9, 11, 18);
      c.fillStyle = '#6a4a9a'; c.fillRect(-7, -6, 9, 12);
      c.fillStyle = '#8a6030';
      c.beginPath(); c.moveTo(5.5, -3); c.lineTo(3.5, 1); c.lineTo(7.5, 1); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(5.5, 2.5); c.lineTo(2.5, 7); c.lineTo(8.5, 7); c.closePath(); c.fill();
      c.strokeStyle = '#4db8ff'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(11, -12); c.lineTo(11, 12); c.stroke();
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
    case 'tanto':
      c.strokeStyle = '#6a7484'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(28, 0); c.stroke();
      c.fillStyle = '#dce4f0';
      c.beginPath(); c.moveTo(28, -5); c.lineTo(44, 0); c.lineTo(28, 5); c.closePath(); c.fill();
      c.strokeStyle = '#8a6030'; c.lineWidth = 3; c.beginPath(); c.moveTo(4, -5); c.lineTo(4, 5); c.stroke();
      break;
    case 'sai':
      c.strokeStyle = '#a8b4c4'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(40, 0); c.stroke();
      c.beginPath(); c.moveTo(10, 0); c.lineTo(22, -10); c.stroke();
      c.beginPath(); c.moveTo(10, 0); c.lineTo(22, 10); c.stroke();
      c.fillStyle = '#c9d6e8'; c.beginPath(); c.moveTo(40, -4); c.lineTo(50, 0); c.lineTo(40, 4); c.closePath(); c.fill();
      break;
    case 'waaier': {
      c.save();
      const open = 0.55 + Math.sin(spin * 6) * 0.12;
      for (let i = -3; i <= 3; i++) {
        const a = i * 0.22 * open;
        c.strokeStyle = i === 0 ? '#e8c98a' : '#c97a20';
        c.lineWidth = i === 0 ? 3 : 2;
        c.beginPath(); c.moveTo(4, 0); c.lineTo(4 + Math.cos(a) * 38, Math.sin(a) * 38); c.stroke();
      }
      c.fillStyle = 'rgba(255,215,94,.25)';
      c.beginPath(); c.moveTo(4, 0);
      c.arc(4, 0, 36, -0.7 * open, 0.7 * open);
      c.closePath(); c.fill();
      c.restore();
      break;
    }
    case 'tonfa':
      c.strokeStyle = '#5a4030'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(42, 0); c.stroke();
      c.lineWidth = 5; c.beginPath(); c.moveTo(12, 0); c.lineTo(12, 14); c.stroke();
      break;
    case 'kama':
      c.strokeStyle = '#6a5030'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(34, 0); c.stroke();
      c.strokeStyle = '#c9d6e8'; c.lineWidth = 3.5;
      c.beginPath(); c.arc(34, -2, 14, -0.2, 2.4); c.stroke();
      break;
    case 'zeis':
      c.strokeStyle = '#3a3048'; c.lineWidth = 4; c.beginPath(); c.moveTo(-8, 0); c.lineTo(48, 0); c.stroke();
      c.strokeStyle = '#b06ae0'; c.lineWidth = 4;
      c.beginPath(); c.arc(48, -6, 18, -0.4, 2.6); c.stroke();
      c.strokeStyle = '#e0c0ff'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(48, -6, 14, -0.2, 2.4); c.stroke();
      break;
    case 'drietand':
      c.strokeStyle = '#7a8494'; c.lineWidth = 4; c.beginPath(); c.moveTo(-6, 0); c.lineTo(50, 0); c.stroke();
      c.strokeStyle = '#c9d6e8'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(50, 0); c.lineTo(66, 0); c.stroke();
      c.beginPath(); c.moveTo(50, 0); c.lineTo(62, -10); c.stroke();
      c.beginPath(); c.moveTo(50, 0); c.lineTo(62, 10); c.stroke();
      break;
    case 'bostaf':
      c.strokeStyle = '#8a6030'; c.lineWidth = 5; c.beginPath(); c.moveTo(-20, 0); c.lineTo(58, 0); c.stroke();
      c.strokeStyle = '#c9a66b'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-16, -4); c.lineTo(-16, 4); c.stroke();
      c.beginPath(); c.moveTo(54, -4); c.lineTo(54, 4); c.stroke();
      break;
    case 'fuuma': {
      const rot = spin * 14;
      c.save(); c.translate(30, 0); c.rotate(rot);
      c.fillStyle = '#9aa8bc';
      for (let i = 0; i < 4; i++) {
        c.rotate(Math.PI / 2);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(6, -7); c.lineTo(22, 0); c.lineTo(6, 7); c.closePath(); c.fill();
      }
      c.fillStyle = '#3a4560'; c.beginPath(); c.arc(0, 0, 5, 0, TAU); c.fill();
      c.restore();
      break;
    }
    case 'kristal':
      c.save(); c.shadowColor = '#7cf5ff'; c.shadowBlur = 10;
      c.fillStyle = 'rgba(124,245,255,.55)';
      c.beginPath(); c.moveTo(8, 0); c.lineTo(28, -10); c.lineTo(52, 0); c.lineTo(28, 10); c.closePath(); c.fill();
      c.strokeStyle = '#e8ffff'; c.lineWidth = 2; c.stroke();
      c.restore();
      c.strokeStyle = '#5a6784'; c.lineWidth = 5; c.beginPath(); c.moveTo(-2, 0); c.lineTo(8, 0); c.stroke();
      break;
    case 'vlamzweep': {
      c.strokeStyle = '#5a3020'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(14, 0); c.stroke();
      c.save(); c.shadowColor = '#ff8c42'; c.shadowBlur = 10;
      c.strokeStyle = '#ff6b3f'; c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(14, 0);
      for (let i = 1; i <= 6; i++) {
        c.lineTo(14 + i * 8, Math.sin(spin * 10 + i) * 6);
      }
      c.stroke();
      c.strokeStyle = '#ffd75e'; c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(14, 0);
      for (let i = 1; i <= 6; i++) {
        c.lineTo(14 + i * 8, Math.sin(spin * 10 + i + 0.4) * 3);
      }
      c.stroke();
      c.restore();
      break;
    }
    case 'sterkling':
      c.save(); c.shadowColor = '#ffd75e'; c.shadowBlur = 12;
      c.strokeStyle = '#ffd75e'; c.lineWidth = 5; c.beginPath(); c.moveTo(4, 0); c.lineTo(50, 0); c.stroke();
      c.strokeStyle = '#fff8d0'; c.lineWidth = 2; c.beginPath(); c.moveTo(8, -1); c.lineTo(46, -1); c.stroke();
      c.restore();
      c.fillStyle = '#c97a20';
      c.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * TAU / 5;
        const r = i % 2 === 0 ? 7 : 3;
        const x = 10 + Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.closePath(); c.fill();
      break;
  }
  if (mi) c.restore();
}

function fxLite() {
  return !!(save.liteFx || Perf.tier >= 2 || motionReduced());
}

function ensureParticleRoom(game, slots) {
  if (!game || slots <= 0) return true;
  const cap = fxCaps();
  let room = cap.particles - game.particles.length;
  if (room >= slots) return true;
  let need = slots - room;
  for (let i = 0; i < game.particles.length && need > 0; ) {
    const p = game.particles[i];
    if (p.kind === 'ring') { i++; continue; }
    game.particles.splice(i, 1);
    need--;
    room++;
  }
  return room >= slots;
}

function spawnFxRing(game, x, y, color, baseR) {
  if (!game || motionReduced()) return;
  if (!perfFxBudgetAllow(game, 1) || perfFxRoom(game, 'particle') <= 0) return;
  if (!ensureParticleRoom(game, 1)) return;
  const lite = fxLite();
  const life = lite ? 0.22 : 0.34;
  const size = (baseR || 12) * (lite ? 0.62 : 1);
  game.particles.push({
    x, y, vx: 0, vy: 0, life, maxLife: life,
    color: color || '#7cf5ff',
    size,
    kind: 'ring',
    grav: 0,
  });
}

/** Jutsu impact burst — Lite FX capped; scale 'small' for projectile fade-out. */
function spawnJutsuImpactFx(game, x, y, kind, scale) {
  if (!game || motionReduced()) return;
  const lite = fxLite();
  const small = scale === 'small';
  if (kind === 'rasengan') {
    game.burst(x, y, '#7cf5ff', lite ? (small ? 4 : 6) : (small ? 8 : 14), { kind: 'spark', size: small ? 2.2 : 2.8 });
    spawnFxRing(game, x, y, '#a8ecff', lite ? 6 : (small ? 8 : 14));
    if (!lite && !small) spawnFxRing(game, x, y, '#5ad0ff', 7);
  } else if (kind === 'chidori') {
    game.burst(x, y, '#a8e0ff', lite ? 8 : 14);
    spawnFxRing(game, x, y, '#c8f0ff', lite ? 7 : 11);
  } else if (kind === 'rinnegan') {
    game.burst(x, y, '#c47aff', lite ? 6 : 12);
    spawnFxRing(game, x, y, '#e0a8ff', lite ? 7 : 10);
    if (!lite && !small) spawnFxRing(game, x, y, '#ff6b9d', 6);
  }
}

function drawJutsuOrb(c, x, y, r, spin, kind, alpha) {
  const lite = fxLite();
  c.save();
  c.translate(x, y);
  c.globalAlpha = alpha == null ? 1 : alpha;
  if (kind === 'chidori') {
    c.shadowColor = '#a8e0ff'; c.shadowBlur = lite ? 8 : 18;
    c.fillStyle = 'rgba(200,240,255,.55)';
    c.beginPath(); c.arc(0, 0, r * 0.9, 0, TAU); c.fill();
    c.strokeStyle = '#e8f7ff'; c.lineWidth = 2;
    const bolts = lite ? 4 : 7;
    for (let i = 0; i < bolts; i++) {
      const a = spin + i * (TAU / bolts);
      c.beginPath();
      c.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
      c.lineTo(Math.cos(a + 0.4) * r * 1.3, Math.sin(a + 0.4) * r * 1.3);
      c.stroke();
    }
  } else if (kind === 'rinnegan') {
    c.shadowColor = '#c47aff'; c.shadowBlur = lite ? 10 : 24;
    const grd = c.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, 'rgba(40,10,60,.95)');
    grd.addColorStop(0.35, 'rgba(120,40,180,.85)');
    grd.addColorStop(0.7, 'rgba(200,80,255,.45)');
    grd.addColorStop(1, 'rgba(80,20,120,.1)');
    c.fillStyle = grd;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,120,160,.85)'; c.lineWidth = 2;
    for (let ring = 0; ring < (lite ? 2 : 4); ring++) {
      c.beginPath();
      c.arc(0, 0, r * (0.35 + ring * 0.18), spin * (1 + ring * 0.2), spin * (1 + ring * 0.2) + Math.PI * 1.35);
      c.stroke();
    }
    c.fillStyle = 'rgba(255,90,120,.9)';
    const tomoe = lite ? 3 : 6;
    for (let i = 0; i < tomoe; i++) {
      const a = spin * 2 + i * (TAU / tomoe);
      c.beginPath();
      c.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.12, 0, TAU);
      c.fill();
    }
  } else {
    // Rasengan: chakra-bol + draaiende buitenringen
    c.shadowColor = '#3db8ff'; c.shadowBlur = lite ? 8 : 22;
    const grd = c.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, 'rgba(220,250,255,.95)');
    grd.addColorStop(0.45, 'rgba(80,190,255,.75)');
    grd.addColorStop(1, 'rgba(30,120,255,.15)');
    c.fillStyle = grd;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(180,235,255,.9)'; c.lineWidth = 2;
    const ellipses = lite ? 2 : 5;
    for (let i = 0; i < ellipses; i++) {
      const a0 = spin + i * 1.1;
      c.beginPath();
      c.ellipse(0, 0, r * 0.95, r * (0.35 + (i % 3) * 0.12), a0, 0, TAU);
      c.stroke();
    }
    // Outer chakra arcs (juice) — één boog in Lite FX
    c.strokeStyle = 'rgba(124,245,255,.8)';
    c.lineWidth = lite ? 2 : 2.6;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(0, 0, r * 1.14, spin, spin + Math.PI * 1.35);
    c.stroke();
    if (!lite) {
      c.strokeStyle = 'rgba(160,230,255,.55)';
      c.lineWidth = 1.8;
      c.beginPath();
      c.arc(0, 0, r * 1.28, -spin * 1.35, -spin * 1.35 + Math.PI * 1.05);
      c.stroke();
    }
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.beginPath(); c.arc(-r * 0.2, -r * 0.2, r * 0.18, 0, TAU); c.fill();
  }
  c.restore();
}

/* --- src/entities/fighter.js --- */
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
      weaponComboIdx: 0, weaponComboT: 0, _lastWeaponKind: null, _weaponComboPrimed: false, _weaponComboHits: 0,
      style: null, playerSlot: 0, vsSpecial: 'rasengan',
    }, opts);
  }

  get bodyX() { return this.x; }
  get bodyY() { return this.y - 45 * this.scale; }
  get bodyR() { return 30 * this.scale; }
  get alive() { return this.hp > 0; }

  attackSpec(kind) {
    const w = this.weapon;
    let spec;
    switch (kind) {
      case 'punch':
        spec = { kind, windup: 0.07, active: 0.09, recover: 0.12, range: 48, r: 30, dmg: this.baseDmg * 0.7, kb: 160 };
        break;
      case 'kick':
        spec = { kind, windup: 0.11, active: 0.11, recover: 0.2,  range: 58, r: 32, dmg: this.baseDmg * 1.1, kb: 340 };
        break;
      case 'weapon': {
        const wid = (w && w.id) || 'vuist';
        const moveIdx = clamp(((this.weaponComboIdx || 0) % 3 + 3) % 3, 0, 2);
        const move = weaponMoveDef(wid, moveIdx);
        spec = {
          kind, windup: 0.13 / (w.speed || 1), active: 0.1 / (w.speed || 1), recover: 0.2 / (w.speed || 1),
          range: (w.range || 40) + 18, r: 30 + (w.range || 40) * 0.26, dmg: this.baseDmg * (w.dmg || 1), kb: 260,
          moveIdx, move,
        };
        if (move) {
          spec.windup *= move.windupMul || 1;
          spec.active *= move.activeMul || 1;
          spec.range *= move.rangeMul || 1;
          spec.r *= move.rangeMul || 1;
          spec.dmg *= move.dmgMul || 1;
          spec.kb *= move.kbMul || 1;
          spec.moveHitY = move.hitY || 0;
          const stepMul = weaponComboStepMul(moveIdx);
          spec.dmg *= stepMul;
          spec.kb *= stepMul;
        }
        break;
      }
      case 'special': {
        const j = fighterJutsuKind(this);
        const jb = jutsuSkillBonuses(j);
        const jMul = (j === 'rinnegan' ? 2.55 : j === 'chidori' ? (this.isRobot ? 2.35 : 2.72) : 2.85) * jb.dmgMul;
        const windup = (j === 'rinnegan' ? 0.52 : 0.48) * jb.windupMul;
        spec = {
          kind, windup, active: 0.12, recover: 0.28, range: 62 + jb.radius, r: 44 + jb.radius * 0.5,
          dmg: this.baseDmg * jMul, kb: j === 'rinnegan' ? 460 : 520, jutsu: j,
          extraShot: jb.extraShot, pierceRepeat: jb.pierceRepeat, pullMul: jb.pullMul,
        };
        break;
      }
      default:
        return null;
    }
    if (spec && spec.kind === 'weapon') spec = sanitizeWeaponSpec(spec);
    if (spec && spec.kind === 'weapon' && (w.masterSword || w.id === 'master_sword')) spec.unblockable = true;
    spec = applySignatureToSpec(this, spec);
    return applyStyleToSpec(this, spec);
  }

  startAttack(kind, game) {
    if (this.attack || this.state === 'hurt' || !this.alive || this.invulnT > 0 && kind !== 'special') return;
    if (kind === 'special') {
      const jKind = fighterJutsuKind(this);
      const chakraCost = skillChakraCost(jKind);
      if (this.energy < chakraCost) {
        if (this.isPlayer) game.floater(this.x, this.y - 110, 'Chakra niet vol!', '#7cf5ff', 13);
        return;
      }
      this.energy = Math.max(0, this.energy - chakraCost);
      AudioSys.sfx(jKind === 'chidori' ? 'chidori' : jKind === 'rinnegan' ? 'rinnegan' : 'rasengan');
      if (this.isPlayer || this.playerSlot) {
        const lbl = jKind === 'chidori' ? 'CHIDORI!' : jKind === 'rinnegan' ? 'RINNEGAN!' : 'RASENGAN!';
        const col = jKind === 'chidori' ? '#a8e0ff' : jKind === 'rinnegan' ? '#c47aff' : '#7cf5ff';
        game.banner(lbl, 0.7, col, 40);
      }
    } else {
      AudioSys.sfx(weaponSwingSfx(this.weapon, kind));
    }
    if (kind === 'weapon' && !isThrowWeapon(this.weapon.id)) {
      if (this.isPlayer || this.playerSlot) weaponComboTipOnce();
      const sameWep = this._lastWeaponKind === this.weapon.id;
      if (this._weaponComboPrimed && this.weaponComboT > 0 && sameWep) {
        this.weaponComboIdx = (this.weaponComboIdx + 1) % 3;
      } else {
        this.weaponComboIdx = 0;
      }
      this._weaponComboPrimed = false;
      this.weaponComboT = WEAPON_COMBO_WINDOW;
      this._lastWeaponKind = this.weapon.id;
    } else if (kind !== 'weapon') {
      resetWeaponCombo(this);
    }
    this.attack = Object.assign({ t: 0, hasHit: false, fired: false }, this.attackSpec(kind));
    if (this.attack && this.attack.kind === 'weapon' && this.attack.move) {
      this.attack.moveIdx = this.weaponComboIdx;
    }
    this._aimAtAttack = fighterAimNorm(this);
    if (this.isRobot && kind === 'special') this.attack.windup = 0.58;
    this.blocking = false;
  }

  doSubstitution(game) {
    if (!this.alive || this.substCd > 0 || this.attack || this.invulnT > 0) return;
    const sb = skillBonuses('subst');
    resetWeaponCombo(this);
    this.substCd = 1.35 * sb.cdMul;
    this.invulnT = 0.28 + (sb.invulnAdd || 0);
    AudioSys.sfx('subst');
    // rookwolk + afterimage (substitutie / Kawarimi)
    game.burst(this.x, this.y - 40, '#c9a66b', 16);
    game.burst(this.x, this.y - 50, '#eee', 8);
    this.afterimages.push({ x: this.x, y: this.y, face: this.face, life: 0.35 });
    const dir = this.face || 1;
    const pad = this.playerSlot === 2 ? InputP2 : Input;
    const dashDir = Math.abs(pad.move) > 0.2 ? Math.sign(pad.move) : dir;
    const dist = 140 * (sb.dashDistMul || 1);
    this.x = clampFighterX(this, game, this.x + dashDir * dist);
    this.vx = dashDir * 420 * (sb.dashDistMul || 1);
    game.floater(this.x, this.y - 100, 'Substitutie!', '#c9a66b', 14);
    game.shake(2, 0.08);
  }

  doDash(game, dir) {
    if (!this.alive || this.dashCd > 0 || Math.abs(dir) < 0.1) return;
    if (this.attack && this.hurtT <= 0) return;
    if (this.hurtT > 0) this.hurtT = 0;
    const db = skillBonuses('dash');
    resetWeaponCombo(this);
    this.dashCd = 0.85 * db.cdMul;
    this.invulnT = Math.max(this.invulnT, 0.14);
    AudioSys.sfx('dash');
    const dist = 98 * (db.dashDistMul || 1);
    this.x = clampFighterX(this, game, this.x + dir * dist);
    this.vx = dir * 340 * (db.dashSpeedMul || 1);
    game.burst(this.x, this.y - 38, this.style?.accent || '#7cf5ff', 8);
    game.floater(this.x, this.y - 92, 'Dash!', '#7cf5ff', 12);
  }

  /** Nood-KETS-BAM: omringd/stunlock → tik midden-symbool of druk E. */
  doKetsbam(game) {
    if (!this.isPlayer || !this.alive || !game) return false;
    if (game.ketsbamCd > 0 || game.ketsbamChargeT > 0 || game.inputLocked || game.traveling) return false;
    const near = game.countNearbyMonsters(KETSBAM_DETECT_R);
    const stuck = this.hurtT > 0 && near >= 2;
    const swarmed = near >= KETSBAM_NEAR_MIN;
    if (!swarmed && !stuck) return false;

    game.ketsbamCd = KETSBAM_CD;
    game.ketsbamSuperT = KETSBAM_SUPER_ARMOR + KETSBAM_CHARGE_DUR;
    game.ketsbamShow = false;
    game.ketsbamChargeT = KETSBAM_CHARGE_DUR;
    game.ketsbamChargeDur = KETSBAM_CHARGE_DUR;
    game.ketsbamChargePulse = 0;
    game.inputLocked = true;
    this.hurtT = 0;
    this.attack = null;
    this.blocking = false;
    this.vx = 0;
    this.vy = 0;
    this.invulnT = Math.max(this.invulnT, KETSBAM_INVULN + KETSBAM_CHARGE_DUR);
    resetWeaponCombo(this);

    game.banner('KETS!', KETSBAM_CHARGE_DUR, '#ffd75e', 44);
    try { AudioSys.sfx('ketsbamCharge'); } catch (_) {}
    if (save.haptics !== false) haptic(12);
    return true;
  }

  finishKetsbam(game) {
    if (!this.isPlayer || !this.alive || !game) return;
    game.ketsbamChargeT = 0;
    game.inputLocked = false;
    game.ketsbamSuperT = Math.max(game.ketsbamSuperT, KETSBAM_SUPER_ARMOR);

    game.shake(14, 0.38);
    game.freezeT = Math.max(game.freezeT, 0.06);
    game.banner('KETS-BAM!', 0.85, '#ffd75e', 42);
    try { AudioSys.sfx('ketsbam'); } catch (_) {}

    const px = this.x, py = this.y - 42;
    for (const m of game.monsters) {
      if (!m.alive) continue;
      const dx = m.x - px, dy = m.y - py;
      const dist = Math.hypot(dx, dy);
      if (dist > KETSBAM_BLAST_R) continue;
      const falloff = 1 - dist / KETSBAM_BLAST_R;
      const dmg = Math.max(10, Math.round(this.baseDmg * (1.65 + falloff * 1.1)));
      const kb = Math.sign(dx || this.face || 1) * (380 + falloff * 120);
      m.takeDamage(dmg, kb, game);
    }
    game.burst(px, py, '#ffd75e', fxLite() ? 22 : 40, { kind: 'spark', size: 3.2 });
    game.burst(px, py, '#ff7043', fxLite() ? 14 : 26);
    spawnFxRing(game, px, py, '#ffe259', fxLite() ? 10 : 18);
    game.floater(px, py - 80, 'KETS-BAM!', '#ffd75e', 20);
    if (save.haptics !== false) haptic(32);
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
    let diff = this.aiDiff || 1;
    if (game.mode === 'training' && p.hp / Math.max(1, p.maxhp) < 0.32) diff *= 0.84;
    const pAir = !p.onGround;

    // reactief blokkeren als de speler aanvalt en dichtbij is
    if (p.attack && p.attack.t < p.attack.windup + p.attack.active && dist < 130 && !this.attack) {
      if (Math.random() < 0.55 * diff * dt * 22) { this.blockT = 0.42; }
    }
    if (this.blockT > 0) { this.blockT -= dt; out.block = true; return out; }

    if (this.aiTimer <= 0) {
      this.aiTimer = rand(0.22, 0.55) / diff;
      if (dist > 240) {
        this.aiMove = dir;
        if (this.aiCd <= 0 && dist > 105 && !pAir && Math.random() < 0.3) { out.special = true; this.aiCd = rand(2.6, 4.2) / diff; }
        if (Math.random() < 0.12) out.jump = true;
      } else if (dist > 110) {
        const r = Math.random();
        if (r < 0.55) this.aiMove = dir;
        else if (r < 0.72 && this.aiCd <= 0 && dist > 120 && !pAir) { out.special = true; this.aiCd = rand(2.6, 4.2) / diff; }
        else this.aiMove = -dir * 0.6;
      } else {
        const trainFair = game.mode === 'training';
        const r = Math.random();
        if (r < (trainFair ? 0.34 : 0.42)) out.punch = true;
        else if (r < (trainFair ? 0.58 : 0.72)) out.kick = true;
        else if (r < (trainFair ? 0.82 : 0.86)) { this.aiMove = -dir; }
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
      resetWeaponCombo(this);
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
    const pad = (this.playerSlot === 2) ? InputP2 : (this.isPlayer ? Input : null);
    let mv = 0;
    if (canAct) {
      if (!this.attack) mv = it.move || 0;
      else if (this.attack.t >= this.attack.windup + this.attack.active) {
        mv = (it.move || 0) * MOVE_ATTACK_RECOVER_MUL;
      }
    } else if ((this.isPlayer || this.playerSlot) && this.hurtT > 0 && this.onGround) {
      mv = (it.move || 0) * MOVE_HURT_MUL;
    }
    const dig = pad && padDigitalMove(pad) !== 0
      && Math.abs((it.move || 0) - padDigitalMove(pad)) < 0.08;
    applyFighterMove(this, mv, dt, { canAct: canAct || this.hurtT > 0, digital: !!dig });

    if (canAct && it.jump && this.onGround && !this.attack) {
      this.vy = -this.jumpV; this.onGround = false; AudioSys.sfx('jump');
    } else if ((this.isPlayer || this.playerSlot) && this.hurtT > 0 && this.hurtT <= 0.14
        && this.onGround && !this.attack && it.jump) {
      this.vy = -this.jumpV * 0.92;
      this.onGround = false;
      this.hurtT = 0;
      this.state = 'idle';
      AudioSys.sfx('jump');
    }
    if (this.substCd > 0) this.substCd -= dt;
    if (this.dashCd > 0) this.dashCd -= dt;
    if (this.weaponComboT > 0) {
      this.weaponComboT -= dt;
      if (this.weaponComboT <= 0) resetWeaponCombo(this);
    }
    if (this.invulnT > 0) this.invulnT -= dt;
    if (this.hitFlashT > 0) this.hitFlashT -= dt;
    if (this._shurikenCd > 0) this._shurikenCd -= dt;
    for (const a of this.afterimages) a.life -= dt;
    this.afterimages = this.afterimages.filter(a => a.life > 0);

    if (canAct && it.subst) this.doSubstitution(game);
    const canDash = canAct || ((this.isPlayer || this.playerSlot) && this.hurtT > 0 && this.onGround);
    if (canDash && it.dash) this.doDash(game, it.move || this.face);

    if (canAct) {
      if (it.punch) this.startAttack('punch', game);
      else if (it.kick) this.startAttack('kick', game);
      else if (it.weapon) {
        if (isThrowWeapon(this.weapon.id)) game.throwShuriken(this);
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
    this.x = clampFighterX(this, game, this.x);

    // aanval-timing
    if (this.attack) {
      const a = this.attack;
      a.t += dt;
      if (this.isRobot && a.kind === 'special' && !a.fired && !a._telegraphed && a.t >= a.windup * 0.28) {
        a._telegraphed = true;
        if (game.mode === 'training') {
          game.trainTelegraphT = 0.85;
          game.floater(this.x, this.y - 138, 'CHIDORI — dash/spring!', '#7cf5ff', 16);
          haptic(10);
        }
      }
      if (this.isRobot && a.kind === 'special' && !a.fired && a._telegraphed && game.mode === 'training') {
        const p = game.player;
        if (p && !p.onGround) {
          this.attack = null;
          game.trainTelegraphT = 0;
          this.aiCd = rand(2.5, 4.2) / (this.aiDiff || 1);
          game.floater(this.x, this.y - 128, 'Chidori gemist — spring werkt!', '#7cf5ff', 14);
        } else if (a.t >= a.windup) {
          a.fired = true;
          game.spawnJutsu(this, a);
        }
      } else if (a.kind === 'special' && !a.fired && a.t >= a.windup) {
        a.fired = true;
        game.spawnJutsu(this, a);
      }
      if (this.isRobot && game.mode === 'training' && !a.fired && (a.kind === 'punch' || a.kind === 'kick') && a.t < a.windup) {
        const p = game.player;
        if (p && p.alive && Math.abs(p.x - this.x) < a.range + 36) {
          const maxT = a.kind === 'kick' ? 0.42 : 0.32;
          game.trainMeleeTelegraphT = Math.max(game.trainMeleeTelegraphT || 0, a.windup - a.t + 0.04);
          game.trainMeleeTelegraphMax = maxT;
          game.trainTelegraphKind = a.kind;
        }
      }
      if (a.kind !== 'special' && !a.hasHit && a.t >= a.windup && a.t <= a.windup + a.active) {
        if (game.tryMelee(this, a)) a.hasHit = true;
      }
      if (a.t >= a.windup + a.active + a.recover) {
        if (a.kind === 'weapon' && !isThrowWeapon(this.weapon.id)) {
          this._weaponComboPrimed = true;
          this.weaponComboT = Math.max(this.weaponComboT, WEAPON_COMBO_WINDOW * WEAPON_COMBO_GRACE);
        }
        this.attack = null;
      }
    }

    // chakra laadt sneller bij combo-gevoel (in beweging/gevecht)
    if (this.isPlayer || this.playerSlot) {
      const stageMul = (typeof game !== 'undefined' && game && game.stageEnergyMul) ? game.stageEnergyMul : 1;
      const petMul = (typeof game !== 'undefined' && game && game.petEnergyMul) ? game.petEnergyMul : 1;
      const styleMul = (typeof game !== 'undefined' && game && game.styleEnergyMul) ? game.styleEnergyMul : 1;
      const chakraMul = (this.isPlayer || this.playerSlot) ? skillBonuses('chakra').regenMul : 1;
      const rate = (this.attack ? 4.2 : 2.8) * stageMul * petMul * styleMul * chakraMul;
      const prevE = this._energyPrev == null ? this.energy : this._energyPrev;
      this.energy = clamp(this.energy + dt * rate, 0, 100);
      if (this.energy >= 100 && prevE < 100) {
        try { AudioSys.sting('superReady', fighterJutsuKind(this)); } catch (_) {}
      }
      this._energyPrev = this.energy;
    }

    // state voor animatie
    if (this.hurtT > 0) this.state = 'hurt';
    else if (this.attack) this.state = 'attack';
    else if (!this.onGround) this.state = 'jump';
    else if (Math.abs(this.vx) > 30) this.state = 'run';
    else this.state = 'idle';
    // Bewegend decor: speler "loopt" mee tijdens reis tussen golven
    if (this.isPlayer && game && game.traveling) {
      const pad = inputPadForFighter(this);
      const tMove = pad ? pad.move : 0;
      if (Math.abs(tMove) > 0.05) this.face = tMove > 0 ? 1 : -1;
      else if (this.state === 'idle' || Math.abs(this.vx) < 22) this.face = 1;
      if (this.state === 'idle') this.state = 'run';
    }
  }

  takeDamage(dmg, kbx, game, opts) {
    opts = opts || {};
    if (!this.alive) return 0;
    if ((this.isPlayer || this.playerSlot) && game && game.ketsbamSuperT > 0) return 0;
    if (this.invulnT > 0) {
      if (game) game.floater(this.x, this.y - 115, 'MISS!', '#c9a66b', 13);
      return 0;
    }
    if (this.blocking && !opts.unblockable) {
      const blockMul = (this.isPlayer && game && game.styleBlockMul) ? game.styleBlockMul : 1;
      dmg = Math.max(1, Math.round(dmg * 0.15 * blockMul));
      AudioSys.sfx('block');
      const atk = opts.attacker && opts.attacker.attack;
      const parry = atk && atk.t >= atk.windup && atk.t <= atk.windup + 0.16;
      game.floater(this.x, this.y - 115, parry ? 'PARRY!' : 'BLOK!', parry ? '#ffd75e' : '#9fd8ff', 14);
      if (game) {
        applyHitStop(game, { kind: 'punch' }, { chip: true });
        if (parry) game.freezeT = Math.max(game.freezeT, 0.032);
        spawnFxRing(game, this.x, this.y - 42, parry ? '#ffd75e' : '#9fd8ff', fxLite() ? 6 : 10);
      }
      if (save.haptics !== false) haptic(parry ? 9 : 4);
      this.hp -= dmg;
      return dmg;
    }
    if (this.isPlayer && game && game.playerShieldT > 0) {
      dmg = Math.max(1, Math.round(dmg * 0.32));
      game.floater(this.x, this.y - 115, 'Schild!', '#9fd8ff', 13);
    }
    dmg = Math.round(dmg);
    if (this.isPlayer && game && game.styleDefMul && game.styleDefMul !== 1) {
      dmg = Math.max(1, Math.round(dmg * game.styleDefMul));
    }
    this.hp -= dmg;
    if (this.isPlayer && game) {
      if (game.mode === 'training' || game.mode === 'adventure') {
        game.combo = 0;
        game.comboT = 0;
      }
      if (game.mode === 'adventure') game.killStreak = 0;
    }
    this.hurtT = dmg >= 18 ? 0.16 : 0.12;
    this.hitFlashT = motionReduced() ? 0.06 : (dmg >= 18 ? 0.18 : 0.14);
    this.attack = null;
    const kbScaled = scaleKnockback(kbx, dmg, { heavy: dmg >= 18 });
    this.vx = kbScaled;
    this.vy = Math.min(this.vy, -120);
    if (this.isPlayer || this.playerSlot) {
      this.invulnT = Math.max(this.invulnT, dmg >= 18 ? 0.54 : 0.46);
      if (game) game.playerHurtCd = PLAYER_HURT_CHAIN_CD;
      resetWeaponCombo(this);
      if (game) applyHitStop(game, { kind: 'punch', dmg }, { playerHurt: true, heavy: dmg >= 18 });
    }
    if (this.isPlayer) this.energy = clamp(this.energy + 4, 0, 100);
    AudioSys.sfxAt(this.isPlayer ? 'hurt' : 'hit', this.x);
    if (this.isPlayer && game) {
      game.floater(this.x, this.y - 118, '-' + dmg, '#ff8080', 15);
    }
    if ((this.isPlayer || this.playerSlot) && game && save.haptics !== false) {
      haptic(dmg >= 18 ? 16 : 8);
    }
    if (this.hp <= 0) {
      this.hp = 0; this.deadT = 0; this.vy = -260;
      AudioSys.sfxAt('die', this.x);
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
        const move = a.move || weaponMoveDef(this.weapon.id, a.moveIdx || 0);
        applyWeaponMovePose(P, ext, move);
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
      const flashA = motionReduced() ? 0.18 : 0.4;
      c.globalAlpha = Math.min(flashA, this.hitFlashT * (flashA / 0.14));
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
    if (this.bald) {
      c.fillStyle = '#ffe8c8';
      c.beginPath(); c.arc(headX, headY - 9, 10.5, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.2;
      c.beginPath(); c.arc(headX, headY - 9, 10.5, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.4)';
      c.beginPath(); c.arc(headX - 3, headY - 12, 2.8, 0, TAU); c.fill();
    } else {
      c.beginPath(); c.arc(headX, headY - 9, 10.5, 0, TAU); c.stroke();
    }
    if (this.gi === 'white' || this.gi === 'red' || this.gi === 'hero') {
      const giFill = this.gi === 'red' ? 'rgba(220,48,48,.55)' : this.gi === 'hero' ? 'rgba(255,226,89,.72)' : 'rgba(255,255,255,.78)';
      c.fillStyle = giFill;
      c.fillRect(shX - 14, shY - 8, 28, 22);
      c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1;
      c.strokeRect(shX - 14, shY - 8, 28, 22);
      if (this.gi === 'hero') {
        c.fillStyle = 'rgba(255,80,80,.75)';
        c.fillRect(shX - 16, shY - 2, 6, 18);
      }
    }
    if (this.isPlayer && this.style) this.drawStyleExtras(c, headX, headY - 9, shX, shY, hipX, hipY);
    if (this.isRobot) this.drawRobotHead(c, headX, headY - 9);

    // voorste arm + wapen
    const [hx, hy] = drawLimb(shX, shY, P.arms[1][0], P.arms[1][1], armL, armL);
    c.fillStyle = this.color;
    c.beginPath(); c.arc(hx, hy, 3.4, 0, TAU); c.fill();

    if (this.isPlayer && this.weapon.id !== 'vuist' && !(this.attack && this.attack.kind === 'special')) {
      const aimLift = (this._aimAtAttack && (this.attack?.kind === 'weapon' || this.attack?.kind === 'punch' || this.attack?.kind === 'kick'))
        ? clamp(this._aimAtAttack.ny, -1, 0.4) * 0.85
        : 0;
      const wAng = this.attack && this.attack.kind === 'weapon' ? P.arms[1][1] + aimLift : -0.5 + aimLift * 0.25;
      if (this.attack && this.attack.kind === 'weapon' && this.attack.move && !motionReduced() && !fxLite()) {
        const a = this.attack;
        if (a.t >= a.windup && a.t <= a.windup + a.active) {
          const ext = clamp((a.t - a.windup) / Math.max(0.01, a.active), 0, 1);
          c.save();
          c.globalAlpha = 0.32 * (1 - ext * 0.35);
          c.strokeStyle = weaponMoveFxColor(a.move);
          c.lineWidth = 2.5;
          c.beginPath();
          c.arc(hx, hy, 16 + ext * 30, wAng - 0.85, wAng + 0.45);
          c.stroke();
          c.restore();
        }
      }
      c.save(); c.translate(hx, hy); c.rotate(wAng);
      if (this.weapon.masterSword || this.weapon.id === 'master_sword') {
        c.shadowColor = '#6fd7ff';
        c.shadowBlur = fxLite() ? 10 : 18;
      }
      drawWeaponShape(c, this.weapon.id, this.animT, this.attack && this.attack.moveIdx);
      c.restore();
    }

    if (this.blocking) {
      c.strokeStyle = 'rgba(120,220,255,.8)'; c.lineWidth = 3;
      c.beginPath(); c.arc(22, -50, 26, -1.4, 1.4); c.stroke();
    }
    // Rasengan / Chidori oplaad in de hand
    if (this.attack && this.attack.kind === 'special' && !this.attack.fired) {
      const g = clamp(this.attack.t / this.attack.windup, 0, 1);
      const kind = fighterJutsuKind(this);
      drawJutsuOrb(c, hx + 14, hy, 8 + g * 16, this.animT * (8 + g * 20), kind, 0.55 + g * 0.45);
      if (kind === 'chidori') {
        c.strokeStyle = `rgba(200,240,255,${0.35 + g * 0.45})`;
        c.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const a = this.animT * 14 + i * 1.4;
          c.beginPath();
          c.moveTo(hx + 10, hy - 4);
          c.lineTo(hx + 10 + Math.cos(a) * (18 + g * 22), hy - 4 + Math.sin(a) * 8);
          c.stroke();
        }
      } else if (kind === 'rinnegan') {
        c.strokeStyle = `rgba(196,122,255,${0.4 + g * 0.45})`;
        c.lineWidth = 2;
        for (let ring = 0; ring < 3; ring++) {
          c.beginPath();
          c.arc(hx + 14, hy, 10 + g * 16 + ring * 4, this.animT * (6 + ring), this.animT * (6 + ring) + Math.PI * 1.1);
          c.stroke();
        }
        c.fillStyle = `rgba(255,100,140,${0.35 + g * 0.4})`;
        for (let i = 0; i < 3; i++) {
          const a = this.animT * 8 + i * (TAU / 3);
          c.beginPath();
          c.arc(hx + 14 + Math.cos(a) * (8 + g * 12), hy + Math.sin(a) * (8 + g * 10), 2.5 + g * 2, 0, TAU);
          c.fill();
        }
      } else {
        c.fillStyle = `rgba(124,245,255,${0.25 + g * 0.35})`;
        for (let i = 0; i < 5; i++) {
          const a = this.animT * 10 + i * (TAU / 5);
          c.beginPath();
          c.arc(hx + 14 + Math.cos(a) * (10 + g * 14), hy + Math.sin(a) * (6 + g * 8), 2 + g * 2, 0, TAU);
          c.fill();
        }
      }
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
    if (st.crystal) {
      c.fillStyle = st.accent;
      c.globalAlpha = 0.9;
      c.beginPath();
      c.moveTo(hx + 10, hy - 6); c.lineTo(hx + 16, hy - 12); c.lineTo(hx + 22, hy - 6); c.lineTo(hx + 16, hy); c.closePath();
      c.fill();
      c.globalAlpha = 1;
    }
    if (st.tome) {
      c.fillStyle = st.accent;
      c.fillRect(hx - 18, hy - 2, 7, 10);
      c.fillStyle = '#fff8e8';
      c.fillRect(hx - 16.5, hy, 4, 6);
      c.strokeStyle = st.bandana || '#6b5344';
      c.lineWidth = 1.2;
      c.strokeRect(hx - 18, hy - 2, 7, 10);
    }
    if (st.lightning && !motionReduced()) {
      const pulse = Math.sin(this.animT * 14) * 0.5 + 0.5;
      if (pulse > 0.35 || st.id === 'cyber') {
        c.save();
        c.strokeStyle = st.id === 'cyber' ? '#7cf5ff' : '#6fd7ff';
        c.shadowColor = st.id === 'cyber' ? '#4ecf6a' : '#7cf5ff';
        c.shadowBlur = st.id === 'cyber' ? 10 : 6;
        c.lineWidth = st.id === 'cyber' ? 2 : 1.4;
        c.globalAlpha = 0.55 + pulse * 0.35;
        const lx = hx + (st.id === 'cyber' ? 14 : -12);
        const ly = hy - 8;
        c.beginPath();
        c.moveTo(hx, hy - 10);
        c.lineTo(hx + 4, hy - 4);
        c.lineTo(hx - 2, hy + 2);
        c.lineTo(lx, ly);
        c.stroke();
        if (st.id === 'cyber' && pulse > 0.6) {
          c.beginPath();
          c.moveTo(hx - 6, hy - 14);
          c.lineTo(hx + 8, hy - 18);
          c.lineTo(hx + 2, hy - 6);
          c.stroke();
        }
        c.restore();
      }
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

/* --- src/entities/monster.js --- */
/* ============================== MONSTER ================================ */
class Monster {
  constructor(spId, x, game, opts) {
    const sp = SPECIES[spId];
    opts = opts || {};
    const eliteMul = opts.elite ? 1.7 : 1;
    this.spId = spId; this.sp = sp;
    this.elite = !!opts.elite;
    this.superBoss = !!opts.superBoss;
    this.size = sp.size * (opts.elite ? 1.5 : 1);
    this.maxhp = Math.round(sp.hp * (opts.hpMul || 1) * eliteMul);
    this.hp = this.maxhp;
    this.dmg = Math.round(sp.dmg * (opts.dmgMul || 1) * (opts.elite ? 1.3 : 1));
    if (this.superBoss) {
      this.elite = true;
      this.maxhp = Math.round(this.maxhp * 2.35);
      this.hp = this.maxhp;
      this.dmg = Math.round(this.dmg * 1.42);
      this.size *= 1.32;
    }
    if (opts.giant && !this.superBoss) {
      this.giant = true;
      this.size = Math.round(this.size * GIANT_SIZE_MUL);
      this.maxhp = Math.round(this.maxhp * GIANT_HP_MUL);
      this.hp = this.maxhp;
      this.dmg = Math.round(this.dmg * GIANT_DMG_MUL);
    }
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
    this.introT = 0;
    this.introTier = null;
  }
  get alive() { return this.hp > 0; }

  update(dt, game) {
    this.t += dt;
    if (this.introT > 0) this.introT -= dt;
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
      if (game.playerHurtCd > 0) { /* stunlock-guard */ }
      else {
      const rr = (this.size + p.bodyR) * 0.82;
      if ((p.x - this.x) ** 2 + (p.bodyY - this.y) ** 2 < rr * rr) {
        const d = this.dashT > 0 ? this.dmg * 1.3 : this.dmg;
        if (p.takeDamage(d, dir * 180, game) > 0) {
          game.shake(4, 0.15);
          applyHitStop(game, { kind: 'punch', dmg: d }, { playerHurt: true, heavy: d >= 18 });
        }
        this.atkCD = Math.max(this.atkCD, 1.55);
      }
      }
    }
  }

  takeDamage(dmg, kbx, game, opts) {
    opts = opts || {};
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
    this.flashT = motionReduced() ? 0.06 : (dmg >= 18 ? 0.14 : opts.crit ? 0.12 : 0.1);
    const kb = scaleKnockback(kbx, dmg, { crit: opts.crit, kind: opts.kind });
    this.x += Math.sign(kb || 1) * clamp(Math.abs(kb) * 0.038, 5, 26);
    game.floater(this.x, this.y - this.size - 14, '-' + dmg, '#ffe680', 15);
    game.burst(this.x, this.y, this.sp.c1, dmg >= 18 ? 9 : 6);
    if (opts.crit) spawnFxRing(game, this.x, this.y - this.size * 0.4, '#ffd75e', fxLite() ? 5 : 8);
    if (this.hp <= 0) {
      this.hp = 0; this.deadT = 0;
      AudioSys.sfxAt('die', this.x);
      const burstN = fxLite() ? 6 : (this.superBoss ? 14 : (this.elite ? 12 : 10));
      game.burst(this.x, this.y, this.sp.c1, burstN);
      game.onMonsterKilled(this);
    } else {
      AudioSys.sfxAt('hit', this.x);
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
    if (this.introT > 0 && this.alive) {
      c.save();
      const p = clamp(this.introT / 1.6, 0, 1);
      const pulse = 1 + Math.sin(this.t * 14) * 0.08;
      c.globalAlpha = 0.25 + p * 0.45;
      c.strokeStyle = this.introTier === 'superBoss' ? '#ffd75e' : (this.introTier === 'boss' ? '#ff6b6b' : '#c47aff');
      c.lineWidth = 4 + p * 4;
      c.beginPath();
      c.ellipse(0, 0, this.size * (1.7 + (1 - p) * 0.9) * pulse, this.size * (1.35 + (1 - p) * 0.7) * pulse, 0, 0, TAU);
      c.stroke();
      if (!motionReduced()) {
        c.globalAlpha = 0.15 + p * 0.25;
        c.fillStyle = c.strokeStyle;
        c.beginPath();
        c.ellipse(0, 0, this.size * 1.9 * pulse, this.size * 1.5 * pulse, 0, 0, TAU);
        c.fill();
      }
      c.restore();
    }
    if (rar.order >= 2 && this.alive) {
      c.save();
      c.strokeStyle = this.superBoss ? '#ffd75e' : rar.glow; c.lineWidth = 3 + rar.order * 0.4;
      c.beginPath(); c.ellipse(0, 0, this.size * 1.55, this.size * 1.2, 0, 0, TAU); c.stroke();
      if (rar.order >= 4) {
        c.globalAlpha = 0.25 + Math.sin(this.t * 6) * 0.1;
        c.fillStyle = rar.color;
        c.beginPath(); c.ellipse(0, 0, this.size * 1.7, this.size * 1.35, 0, 0, TAU); c.fill();
      }
      c.restore();
    }
    if (this.giant && this.alive) {
      c.save();
      c.globalAlpha = 0.35 + Math.sin(this.t * 4) * 0.08;
      c.strokeStyle = '#ffd75e'; c.lineWidth = 2.5;
      c.beginPath(); c.ellipse(0, this.size * 0.82, this.size * 1.28, this.size * 0.24, 0, 0, TAU); c.stroke();
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
  const body = flash ? (motionReduced() ? sp.c1 : '#ffffff') : sp.c1;
  const dark = flash ? (motionReduced() ? sp.c2 : '#dddddd') : sp.c2;
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

/* --- src/entities/pet.js --- */
/* ============================== PET FOLLOWER ========================== */
class Pet {
  constructor(def, game) {
    this.def = def;
    this.sp = SPECIES[def.speciesId];
    this.game = game;
    this.x = game.player ? game.player.x - 36 : W * 0.2;
    this.y = game.player ? game.player.y : game.ground;
    this.face = 1;
    this.t = Math.random() * 6;
    this.assistT = 1.8;
    this.assistCd = (def.cd || 5) * (petUpgradeBonuses(def.id).cdMul || 1);
    this.size = Math.max(9, Math.round((this.sp?.size || 14) * 0.52));
    this.flashT = 0;
  }

  update(dt) {
    const g = this.game;
    const p = g.player;
    if (!p || !p.alive) return;
    this.t += dt;
    if (this.flashT > 0) this.flashT -= dt;
    const bob = Math.sin(this.t * 6) * 2;
    const tx = p.x - p.face * (IS_TOUCH ? 34 : 38);
    const ty = p.y - 6 + bob * 0.25;
    const follow = g.traveling ? 11 : 8;
    this.x += (tx - this.x) * Math.min(1, dt * follow);
    this.y += (ty - this.y) * Math.min(1, dt * 10);
    this.face = p.face || 1;

    const inAdv = g.mode === 'adventure';
    const inTrain = g.mode === 'training';
    if ((!inAdv && !inTrain) || g.over || g.inputLocked) return;
    if (inAdv && !g.monsters.some(m => m.alive)) return;
    if (inTrain && (!g.robot || !g.robot.alive)) return;
    this.assistT -= dt;
    if (this.assistT > 0) return;
    this.assistCd = (this.def.cd || 5) * (petUpgradeBonuses(this.def.id).cdMul || 1);
    this.assistT = this.assistCd;

    let tgt = null;
    let best = 1e9;
    if (inTrain) {
      tgt = g.robot;
      best = Math.abs(tgt.x - p.x);
    } else {
      for (const m of g.monsters) {
        if (!m.alive) continue;
        const d = Math.abs(m.x - p.x);
        if (d < best) { best = d; tgt = m; }
      }
    }
    if (!tgt || best > 420) return;

    const up = petUpgradeBonuses(this.def.id);
    const mul = (this.def.assistMul || 0.3) * (up.assistMul || 1) * (g.stageDmgMul || 1) * (g.petDmgMul || 1);
    const dmg = Math.max(4, Math.round(p.baseDmg * mul));
    const kb = Math.sign(tgt.x - this.x || p.face) * (120 + dmg * 2.2);
    tgt.takeDamage(dmg, kb, g);
    this.flashT = 0.12;
    const col = this.sp?.c1 || '#7cf5ff';
    g.floater(tgt.x, tgt.y - tgt.size - 18, `${this.sp?.name || 'Pet'} −${dmg}`, col, 11);
    if (!fxLite()) g.burst(this.x, this.y - this.size, col, 4, { kind: 'spark', size: 1.8 });
    try { AudioSys.sfxAt('hit', tgt.x); } catch (_) {}
  }

  draw(c) {
    if (!this.sp) return;
    c.save();
    c.translate(this.x, this.y - this.size * 0.35);
    if (this.face < 0) { c.scale(-1, 1); }
    c.globalAlpha = 0.94;
    drawMonsterArt(c, this.sp, this.size, this.t, this.flashT > 0, false);
    c.globalAlpha = 1;
    c.restore();
    c.save();
    c.fillStyle = 'rgba(124,245,255,.75)';
    c.beginPath();
    c.arc(this.x, this.y - this.size * 1.15, 2.2, 0, TAU);
    c.fill();
    c.restore();
  }
}

function spawnGamePet(game) {
  if (!game) return;
  game.pet = null;
  const def = activePetDef();
  if (!def) return;
  game.pet = new Pet(def, game);
}

function applyPetBonusesToPlayer(game, player) {
  if (!player) return;
  const pb = petPassiveBonus();
  game.petDmgMul = pb.dmgMul || 1;
  game.petEnergyMul = pb.energyMul || 1;
  game.petCritBonus = pb.critBonus || 0;
  game.petShieldWave = pb.shieldWave || 0;
  if (pb.maxHp) {
    player.maxhp += pb.maxHp;
    player.hp += pb.maxHp;
  }
  if (pb.dmgMul && pb.dmgMul !== 1) {
    player.baseDmg = Math.round(player.baseDmg * pb.dmgMul);
  }
  if (pb.speedMul && pb.speedMul !== 1) {
    player.speed = Math.round(player.speed * pb.speedMul);
  }
}
/* --- src/entities/egg-pet.js --- */
/* ============================== EGG PET FOLLOWER ====================== */

function drawEggPetArt(c, def, size, t, x, y, dim) {
  if (!def) return;
  const rar = rarityOf(def.rarity);
  const bob = Math.sin(t * 4.2) * 1.5;
  c.save();
  c.translate(x, y + bob);
  const s = size;
  const g = c.createLinearGradient(0, -s, 0, s * 0.9);
  g.addColorStop(0, def.c1);
  g.addColorStop(1, def.c2);
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(0, 0, s * 0.72, s, 0, 0, TAU);
  c.fill();
  c.strokeStyle = dim ? 'rgba(255,255,255,.12)' : (rar.color + '88');
  c.lineWidth = 1.4;
  c.stroke();
  if (!dim) {
    c.globalAlpha = 0.35 + Math.sin(t * 3) * 0.08;
    c.fillStyle = rar.glow || 'rgba(124,245,255,.25)';
    c.beginPath();
    c.ellipse(0, 0, s * 0.95, s * 1.15, 0, 0, TAU);
    c.fill();
    c.globalAlpha = 1;
  }
  c.save();
  c.globalAlpha = dim ? 0.25 : 0.85;
  c.fillStyle = '#fff';
  switch (def.pattern) {
    case 'stripe':
      for (let i = -2; i <= 2; i++) {
        c.fillRect(-s * 0.55, i * s * 0.22 - 2, s * 1.1, 3);
      }
      break;
    case 'dot':
      for (let i = 0; i < 5; i++) {
        const a = i * 1.25 + t * 0.4;
        c.beginPath();
        c.arc(Math.cos(a) * s * 0.35, Math.sin(a) * s * 0.45 - s * 0.1, 2.2, 0, TAU);
        c.fill();
      }
      break;
    case 'speckle':
      for (let i = 0; i < 7; i++) {
        c.beginPath();
        c.arc((i * 17 % 11 - 5) * 0.9, (i * 13 % 9 - 4) * 1.1 - 2, 1.6, 0, TAU);
        c.fill();
      }
      break;
    case 'star':
      drawStarShape(c, 0, -s * 0.15, s * 0.22, '#fff', true);
      break;
    case 'swirl':
      c.strokeStyle = '#fff';
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(0, -s * 0.05, s * 0.28, 0.2, TAU - 0.4);
      c.stroke();
      break;
    case 'flame':
      c.fillStyle = '#ffd75e';
      c.beginPath();
      c.moveTo(0, -s * 0.55);
      c.quadraticCurveTo(s * 0.2, -s * 0.2, 0, s * 0.05);
      c.quadraticCurveTo(-s * 0.2, -s * 0.2, 0, -s * 0.55);
      c.fill();
      break;
    case 'crystal':
      c.strokeStyle = '#fff';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(0, -s * 0.45);
      c.lineTo(s * 0.22, -s * 0.05);
      c.lineTo(0, s * 0.2);
      c.lineTo(-s * 0.22, -s * 0.05);
      c.closePath();
      c.stroke();
      break;
    case 'moon':
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(-s * 0.08, -s * 0.12, s * 0.18, 0, TAU);
      c.fill();
      c.globalCompositeOperation = 'destination-out';
      c.beginPath();
      c.arc(s * 0.04, -s * 0.16, s * 0.14, 0, TAU);
      c.fill();
      c.globalCompositeOperation = 'source-over';
      break;
    case 'gold':
      c.strokeStyle = '#ffe259';
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(0, 0, s * 0.55, s * 0.78, 0, 0, TAU);
      c.stroke();
      break;
    case 'neon':
      c.strokeStyle = '#4ecf6a';
      c.shadowColor = '#7cf5ff';
      c.shadowBlur = 6;
      c.lineWidth = 1.8;
      c.beginPath();
      c.ellipse(0, 0, s * 0.62, s * 0.86, 0, 0, TAU);
      c.stroke();
      c.shadowBlur = 0;
      break;
    case 'rainbow':
      ['#ff6b9d', '#ffd75e', '#4ecf6a', '#7cf5ff'].forEach((col, i) => {
        c.fillStyle = col;
        c.fillRect(-s * 0.5 + i * s * 0.25, -s * 0.35, s * 0.22, s * 0.7);
      });
      break;
    case 'prism':
      c.strokeStyle = '#fff';
      c.lineWidth = 1.3;
      for (let i = 0; i < 3; i++) {
        c.save();
        c.rotate(i * 0.9 + t * 0.5);
        c.strokeRect(-s * 0.15, -s * 0.35, s * 0.3, s * 0.55);
        c.restore();
      }
      break;
    default:
      break;
  }
  c.restore();
  if (!dim) {
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(-s * 0.18, -s * 0.08, 2.2, 0, TAU);
    c.arc(s * 0.14, -s * 0.04, 2.6, 0, TAU);
    c.fill();
    c.fillStyle = '#1a2040';
    c.beginPath();
    c.arc(-s * 0.16, -s * 0.08, 1, 0, TAU);
    c.arc(s * 0.16, -s * 0.04, 1.1, 0, TAU);
    c.fill();
  }
  c.restore();
}

class EggPet {
  constructor(def, game) {
    this.def = def;
    this.game = game;
    this.x = game.player ? game.player.x + 28 : W * 0.25;
    this.y = game.player ? game.player.y - 48 : game.ground - 48;
    this.t = Math.random() * 6;
    this.size = 11;
  }

  update(dt) {
    const g = this.game;
    const p = g.player;
    if (!p || !p.alive) return;
    this.t += dt;
    const bob = Math.sin(this.t * 4.5) * 3;
    const tx = p.x + p.face * (IS_TOUCH ? 26 : 30);
    const ty = p.y - 46 + bob;
    const follow = g.traveling ? 10 : 7;
    this.x += (tx - this.x) * Math.min(1, dt * follow);
    this.y += (ty - this.y) * Math.min(1, dt * 9);
  }

  draw(c) {
    drawEggPetArt(c, this.def, this.size, this.t, this.x, this.y, false);
  }
}

function spawnGameEggPet(game) {
  if (!game) return;
  game.eggPet = null;
  const def = activeEggPetDef();
  if (!def) return;
  game.eggPet = new EggPet(def, game);
}
/* --- src/render/scenery.js --- */
/* ============== SCENERY ART — pixel-art lagen (upgrade 1/4) ============ */
/* Gecachte offscreen tiles (1× gerenderd per thema), chunky pixel look via
   imageSmoothingEnabled=false + opschaling. Geen externe assets — offline OK. */
function sceneryRng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const SCENERY_SCALE = 3;

const SceneryArt = {
  cache: {},

  clearCache() { this.cache = {}; },

  get(themeName, kind) {
    const key = themeName + ':' + kind;
    if (key in this.cache) return this.cache[key];
    let cv = null;
    try { cv = this.render(themeName, kind); } catch (_) { cv = null; }
    this.cache[key] = cv;
    return cv;
  },

  makeTile(w, h) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const x = cv.getContext('2d');
    return { cv, x, px: (px, py, pw, ph, col) => { x.fillStyle = col; x.fillRect(Math.round(px), Math.round(py), Math.max(1, Math.round(pw)), Math.max(1, Math.round(ph))); } };
  },

  /** Dither-rand: om-en-om pixels boven een silhouetlijn. */
  dither(px, x0, y, w, col, step) {
    for (let i = 0; i < w; i += (step || 2)) px(x0 + i, y, 1, 1, col);
  },

  render(themeName, kind) {
    if (kind === 'cloud') return this.renderCloud(themeName);
    if (kind === 'tree') return this.renderTree(themeName);
    return this.renderFar(themeName);
  },

  renderCloud() {
    const { cv, px } = this.makeTile(26, 12);
    const r = sceneryRng(77);
    // blokkige cumulus: 3 tinten
    const rows = [
      [7, 9, 4], [4, 16, 6], [2, 22, 9],
    ];
    for (const [y, w, x0] of rows) {
      px(x0, y, w, 3, '#f4f9ff');
    }
    px(5, 6, 14, 3, '#ffffff');
    px(8, 3, 8, 3, '#ffffff');
    for (let i = 0; i < 8; i++) px(3 + r() * 20, 9 + r() * 2, 1, 1, '#d8e8f6');
    return cv;
  },

  renderTree(themeName) {
    const { cv, px } = this.makeTile(22, 34);
    const dark = themeName === 'bos' ? '#1d4a2c' : '#2e7a3c';
    const mid = themeName === 'bos' ? '#276238' : '#3f9b4c';
    const light = themeName === 'bos' ? '#347a46' : '#55b862';
    // stam
    px(9, 24, 4, 10, '#54381f');
    px(9, 24, 2, 10, '#6b4a2a');
    // gelaagde kruin (3 lagen met dither)
    const layers = [
      [3, 14, 16, dark], [5, 8, 14, mid], [7, 3, 10, light],
    ];
    for (const [x0, y0, w, col] of layers) {
      const h = 8;
      px(x0, y0 + 2, w, h - 2, col);
      px(x0 + 2, y0, w - 4, 2, col);
      this.dither(px, x0, y0 + h, w, col, 2);
    }
    px(6, 10, 2, 2, '#eaf6d8');
    px(13, 15, 2, 2, '#eaf6d8');
    return cv;
  },

  renderFar(themeName) {
    const W0 = 160, H0 = 72;
    const { cv, px } = this.makeTile(W0, H0);
    const r = sceneryRng(themeName.length * 1337 + 42);
    const base = H0; // silhouet staat op tile-bodem
    switch (themeName) {
      case 'bos': {
        // twee rijen dennen-silhouetten
        for (let i = 0; i < 9; i++) {
          const x = i * 19 + r() * 6;
          const h = 26 + r() * 14;
          for (let yy = 0; yy < h; yy += 3) {
            const w = 2 + (yy / h) * 14;
            px(x - w / 2, base - h + yy, w, 3, '#1c3f2b');
          }
        }
        for (let i = 0; i < 7; i++) {
          const x = 8 + i * 24 + r() * 8;
          const h = 16 + r() * 10;
          for (let yy = 0; yy < h; yy += 3) {
            const w = 2 + (yy / h) * 12;
            px(x - w / 2, base - h + yy, w, 3, '#152f20');
          }
        }
        break;
      }
      case 'grot': {
        // rotswand-skyline + gloeiende kristallen
        for (let x = 0; x < W0; x += 4) {
          const h = 18 + Math.sin(x * 0.16) * 8 + r() * 10;
          px(x, base - h, 4, h, '#1b2140');
          if (r() < 0.5) px(x, base - h - 1, 2, 1, '#252c4e');
        }
        for (let i = 0; i < 8; i++) {
          const x = r() * W0, y = base - 4 - r() * 16;
          px(x, y, 2, 3, '#6fd7ff');
          px(x, y - 1, 1, 1, '#bffaff');
        }
        break;
      }
      case 'vulkaan': {
        // vulkaankegels met lava-rand + as-rook
        const cones = [[30, 44], [95, 56], [140, 36]];
        for (const [cx, h] of cones) {
          for (let yy = 0; yy < h; yy += 2) {
            const w = 4 + (yy / h) * (h * 0.9);
            px(cx - w / 2, base - h + yy, w, 2, '#241016');
          }
          px(cx - 3, base - h, 6, 2, '#ff7a30');
          px(cx - 1, base - h - 1, 3, 1, '#ffc06b');
          for (let s = 0; s < 4; s++) px(cx - 2 + r() * 6, base - h - 4 - s * 3, 2, 2, `rgba(120,100,110,${0.5 - s * 0.1})`);
        }
        for (let i = 0; i < 10; i++) px(r() * W0, base - 2 - r() * 6, 2, 1, '#3a1a20');
        break;
      }
      case 'cyber': {
        // skyline met verlichte raampjes + antennes
        let x = 0;
        while (x < W0 - 8) {
          const bw = 10 + Math.floor(r() * 14);
          const bh = 20 + Math.floor(r() * 34);
          px(x, base - bh, bw, bh, '#0d1434');
          px(x, base - bh, bw, 1, '#1c2a5e');
          for (let wy = base - bh + 3; wy < base - 3; wy += 4) {
            for (let wx = x + 2; wx < x + bw - 2; wx += 4) {
              if (r() < 0.35) px(wx, wy, 2, 2, r() < 0.5 ? '#ff4dd2' : '#39d0ff');
            }
          }
          if (r() < 0.4) { px(x + bw / 2, base - bh - 5, 1, 5, '#1c2a5e'); px(x + bw / 2, base - bh - 6, 1, 1, '#ff5d5d'); }
          x += bw + 2 + Math.floor(r() * 5);
        }
        break;
      }
      case 'dojo': {
        // pagode-silhouet + torii-poort
        const pag = (cx, s) => {
          for (let tier = 0; tier < 3; tier++) {
            const w = (34 - tier * 9) * s, y = base - (12 + tier * 11) * s;
            px(cx - w / 2, y, w, 3 * s, '#241a12');
            px(cx - w / 2 - 3 * s, y, 3 * s, 2 * s, '#241a12');
            px(cx + w / 2, y, 3 * s, 2 * s, '#241a12');
            px(cx - (w * 0.32), y + 3 * s, w * 0.64, 8 * s, '#2f2318');
          }
          px(cx - 1, base - 40 * s, 2, 4, '#241a12');
        };
        pag(36, 1);
        pag(120, 0.7);
        // torii
        px(70, base - 22, 3, 22, '#4a1f16');
        px(88, base - 22, 3, 22, '#4a1f16');
        px(64, base - 24, 33, 3, '#5c2419');
        px(67, base - 18, 27, 2, '#4a1f16');
        for (let i = 0; i < 12; i++) px(r() * W0, base - 1 - r() * 3, 2, 1, '#2a2018');
        break;
      }
      case 'sloop': {
        // stadsblokken met kapotte daken + verre kraan
        let x = 4;
        while (x < W0 - 12) {
          const bw = 14 + Math.floor(r() * 12);
          const bh = 16 + Math.floor(r() * 22);
          px(x, base - bh, bw, bh, '#48525e');
          this.dither(px, x, base - bh - 1, bw, '#48525e', 2);
          for (let wy = base - bh + 3; wy < base - 3; wy += 5) {
            for (let wx = x + 2; wx < x + bw - 2; wx += 5) {
              if (r() < 0.3) px(wx, wy, 2, 2, '#2e353d');
            }
          }
          if (r() < 0.35) px(x + 2 + r() * (bw - 6), base - bh - 3, 3, 3, '#3a434d');
          x += bw + 3;
        }
        px(118, base - 52, 2, 52, '#3a434d');
        px(118, base - 52, 26, 2, '#3a434d');
        px(140, base - 50, 1, 8, '#3a434d');
        px(139, base - 42, 3, 3, '#2e353d');
        break;
      }
      default: {
        // veld: glooiende verre heuvels + molen + boerderijtje
        for (let x = 0; x < W0; x += 2) {
          const h = 14 + Math.sin(x * 0.05 + 2) * 7 + Math.sin(x * 0.11) * 4;
          px(x, base - h, 2, h, '#69ab5e');
          if ((x >> 1) % 2 === 0) px(x, base - h - 1, 1, 1, '#7dbd70');
        }
        // molen
        const mx = 118, mh = 26;
        px(mx - 3, base - mh, 6, mh, '#8a7358');
        px(mx - 4, base - mh - 2, 8, 3, '#6d5a44');
        px(mx - 1, base - mh - 8, 2, 8, '#5a4a38');
        px(mx - 8, base - mh - 3, 16, 2, '#5a4a38');
        // boerderij
        px(28, base - 8, 14, 8, '#a8544a');
        px(26, base - 11, 18, 3, '#6d3a32');
        px(32, base - 6, 3, 6, '#4a2a24');
        break;
      }
    }
    return cv;
  },
};

/** Weer per thema (art-upgrade 4/4) — stateless deeltjes uit formules. */
function drawThemeWeather(c, themeName, t, ground, scroll) {
  if (fxLite() || motionReduced() || Perf.tier >= 2) return;
  const wrapW = (v, span) => ((v % span) + span) % span;
  const n = Perf.tier >= 1 ? 6 : 11;
  c.save();
  for (let i = 0; i < n; i++) {
    const seed = i * 137.5 + 31;
    switch (themeName) {
      case 'bos': {
        // dwarrelende blaadjes
        const fall = 26 + (i % 4) * 9;
        const x = wrapW(seed * 4.1 + Math.sin(t * 0.8 + i * 1.3) * 46 - t * 12 - scroll * 0.3, W + 60) - 30;
        const y = wrapW(seed * 2.3 + t * fall, ground + 40) - 20;
        c.fillStyle = i % 2 ? 'rgba(96,168,96,.5)' : 'rgba(150,190,92,.42)';
        c.save(); c.translate(x, y); c.rotate(t * 2.2 + i); c.fillRect(-3.2, -1.6, 6.4, 3.2); c.restore();
        break;
      }
      case 'veld':
      case 'dojo': {
        // bloesem-blaadjes die zijwaarts drijven
        const drift = 18 + (i % 3) * 8;
        const x = wrapW(seed * 3.7 - t * drift - scroll * 0.35, W + 40) - 20;
        const y = wrapW(seed * 1.7 + t * 14 + Math.sin(t * 1.4 + i) * 24, ground + 30) - 15;
        c.fillStyle = themeName === 'dojo' ? 'rgba(255,170,190,.5)' : 'rgba(255,235,250,.55)';
        c.save(); c.translate(x, y); c.rotate(t * 1.6 + i * 2); c.fillRect(-2.4, -1.4, 4.8, 2.8); c.restore();
        break;
      }
      case 'vulkaan': {
        // opstijgende sintels met flikker
        const rise = 30 + (i % 4) * 12;
        const x = wrapW(seed * 3.3 + Math.sin(t * 1.7 + i * 2.1) * 18 - scroll * 0.3, W + 30) - 15;
        const y = ground - wrapW(seed * 1.9 + t * rise, ground + 20);
        const fl = 0.35 + Math.max(0, Math.sin(t * 6 + i * 1.7)) * 0.4;
        c.fillStyle = `rgba(255,${120 + (i % 3) * 30},48,${fl.toFixed(2)})`;
        c.fillRect(x, y, 3, 3);
        break;
      }
      case 'cyber': {
        // neon-regen strepen
        const fall = 320 + (i % 3) * 90;
        const x = wrapW(seed * 4.7 - scroll * 0.4, W + 20) - 10;
        const y = wrapW(seed * 2.9 + t * fall, ground + 60) - 30;
        c.strokeStyle = i % 3 ? 'rgba(90,160,255,.30)' : 'rgba(255,77,210,.24)';
        c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y + 13); c.stroke();
        break;
      }
      case 'grot': {
        // zwevende stofjes
        const x = wrapW(seed * 3.9 + Math.sin(t * 0.5 + i) * 30 - scroll * 0.15, W + 20) - 10;
        const y = wrapW(seed * 2.1 + Math.sin(t * 0.7 + i * 2.3) * 40 + t * 6, ground) ;
        c.fillStyle = `rgba(200,220,255,${(0.10 + (i % 3) * 0.05).toFixed(2)})`;
        c.fillRect(x, y, 2, 2);
        break;
      }
      case 'sloop': {
        // grijze stofvlokken
        const x = wrapW(seed * 4.3 - t * 22 - scroll * 0.4, W + 30) - 15;
        const y = wrapW(seed * 1.8 + t * 10 + Math.sin(t + i) * 14, ground * 0.9) + ground * 0.08;
        c.fillStyle = 'rgba(180,190,200,.22)';
        c.fillRect(x, y, 3, 2);
        break;
      }
      default:
        break;
    }
  }
  c.restore();
  c.globalAlpha = 1;
}

/** Pixel-art laag tekenen: getild, smoothing uit, parallax-offset. */
function drawSceneryTile(c, tile, y, scroll, rate, scale) {
  if (!tile) return;
  const s = scale || SCENERY_SCALE;
  const tw = tile.width * s;
  const th = tile.height * s;
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const off = (((-scroll * rate) % tw) + tw) % tw;
  for (let x = off - tw; x < W + tw; x += tw) {
    c.drawImage(tile, Math.round(x), Math.round(y), tw, th);
  }
  c.imageSmoothingEnabled = prev;
}

/* --- src/render/backgrounds.js --- */
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

function drawBackground(c, themeName, t, ground, scroll, stageFx) {
  scroll = scroll || 0;
  const th = THEMES[themeName] || THEMES.veld;
  const g = c.createLinearGradient(0, 0, 0, ground);
  g.addColorStop(0, th.sky1); g.addColorStop(1, th.sky2);
  c.fillStyle = g; c.fillRect(0, 0, W, ground);
  const wrap = (x, span) => ((x % span) + span) % span;

  if (themeName === 'grot' || themeName === 'cyber') {
    c.fillStyle = 'rgba(255,255,255,.5)';
    const starN = Perf.tier >= 1 ? 14 : 26;
    for (let i = 0; i < starN; i++) {
      const x = wrap(i * 137.5 - scroll * 0.08, W), y = (i * 61.3) % (ground * 0.7);
      const tw = 0.5 + Math.sin(t * 2 + i) * 0.5;
      c.globalAlpha = 0.25 + tw * 0.5;
      c.fillRect(x, y, 2, 2);
    }
    c.globalAlpha = 1;
  } else {
    // pixel-art wolken (art-upgrade 1/4) — cached sprite, drijft langzaam mee
    const cloud = SceneryArt.get(themeName, 'cloud');
    if (cloud) {
      const prev = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      const cloudN = Perf.tier >= 1 ? 2 : 4;
      for (let i = 0; i < cloudN; i++) {
        const s = (i % 2 ? 2.6 : 3.4);
        const cw = cloud.width * s, chh = cloud.height * s;
        const x = wrap(i * 260 + t * 10 - scroll * 0.15, W + 240) - 120;
        const y = 36 + (i % 3) * 44;
        c.globalAlpha = 0.75;
        c.drawImage(cloud, Math.round(x), y, cw, chh);
      }
      c.globalAlpha = 1;
      c.imageSmoothingEnabled = prev;
    }
  }
  // pixel-art skyline per thema (art-upgrade 1/4) — traagste parallax-laag
  const farTile = SceneryArt.get(themeName, 'far');
  if (farTile && Perf.tier < 2) {
    drawSceneryTile(c, farTile, ground - 52 - farTile.height * SCENERY_SCALE, scroll, 0.18);
  }
  // heuvels (parallax: verre laag traag, nabije laag sneller)
  c.fillStyle = th.hill;
  c.beginPath(); c.moveTo(0, ground);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, ground - 60 - Math.sin((x + scroll * 0.3) * 0.008 + 1) * 40);
  c.lineTo(W, ground); c.closePath(); c.fill();
  c.fillStyle = th.hill2;
  c.beginPath(); c.moveTo(0, ground);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, ground - 26 - Math.sin((x + scroll * 0.55) * 0.013 + 4) * 22);
  c.lineTo(W, ground); c.closePath(); c.fill();

  // decoratie (scrollt mee — wrap zodat het oneindig doorloopt)
  const dSpan = W + 220;
  const dX = (base) => wrap(base - scroll * 0.7, dSpan) - 110;
  if (th.deco === 'boom') {
    // pixel-art bomen (art-upgrade 1/4) — cached sprite, 2 formaten
    const tree = SceneryArt.get(themeName, 'tree');
    if (tree) {
      const prev = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      const treeN = Perf.tier >= 2 ? 3 : (Perf.tier >= 1 ? 4 : 5);
      for (let i = 0; i < treeN; i++) {
        const x = dX((i * 0.22 + 0.06) * dSpan);
        const s = i % 2 ? 3.6 : 4.6;
        const twd = tree.width * s, thg = tree.height * s;
        c.drawImage(tree, Math.round(x - twd / 2), Math.round(ground - thg), twd, thg);
      }
      c.imageSmoothingEnabled = prev;
    } else {
      for (let i = 0; i < 5; i++) {
        const x = dX((i * 0.22 + 0.06) * dSpan);
        c.fillStyle = '#54381f';
        c.fillRect(x - 5, ground - 90, 10, 90);
        c.fillStyle = th.hill2;
        c.beginPath(); c.arc(x, ground - 105, 38, 0, TAU); c.fill();
        c.beginPath(); c.arc(x - 24, ground - 82, 27, 0, TAU); c.fill();
        c.beginPath(); c.arc(x + 24, ground - 82, 27, 0, TAU); c.fill();
      }
    }
  } else if (th.deco === 'stalag') {
    c.fillStyle = '#20263f';
    for (let i = 0; i < 7; i++) {
      const x = dX((i * 0.15 + 0.04) * dSpan);
      c.beginPath(); c.moveTo(x - 20, 0); c.lineTo(x, 70 + (i % 3) * 32); c.lineTo(x + 20, 0); c.closePath(); c.fill();
    }
  } else if (th.deco === 'lava') {
    c.fillStyle = '#ff7a30';
    for (let i = 0; i < 8; i++) {
      const x = dX((i * 0.13 + 0.05) * dSpan);
      const bub = Math.max(0, Math.sin(t * 3 + i * 2.2)) * 5;
      c.beginPath(); c.arc(x, ground - 8, 4 + bub, 0, TAU); c.fill();
    }
  } else if (th.deco === 'neon') {
    for (let i = 0; i < 6; i++) {
      const x = dX((i * 0.18 + 0.03) * dSpan), h = 110 + (i % 3) * 60;
      c.fillStyle = '#161c3f';
      c.fillRect(x, ground - h, 54, h);
      c.fillStyle = i % 2 ? '#ff4dd2' : '#39d0ff';
      for (let wy = ground - h + 12; wy < ground - 12; wy += 22)
        for (let wx = x + 8; wx < x + 48; wx += 16)
          if ((Math.round(wx - x) + wy) % 3 !== 0) c.fillRect(wx, wy, 7, 9);
    }
  } else if (th.deco === 'lampion') {
    for (let i = 0; i < 4; i++) {
      const x = dX((i * 0.28 + 0.1) * dSpan);
      c.strokeStyle = '#2c2018'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 46); c.stroke();
      c.fillStyle = '#e04f4f';
      c.beginPath(); c.ellipse(x, 62, 15, 19, 0, 0, TAU); c.fill();
      c.fillStyle = '#ffd75e'; c.fillRect(x - 5, 78, 10, 5);
    }
    c.fillStyle = 'rgba(0,0,0,.15)';
    const off = wrap(-scroll * 0.7, 90);
    for (let x = off - 90; x < W; x += 90) c.fillRect(x, 0, 4, ground);
  } else if (th.deco === 'kraan') {
    c.strokeStyle = '#c9a227'; c.lineWidth = 7;
    const cx = dX(W * 0.16);
    c.beginPath(); c.moveTo(cx, ground); c.lineTo(cx, 60); c.lineTo(cx + 200, 60); c.stroke();
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx + 170, 60); c.lineTo(cx + 170, 130); c.stroke();
    c.fillStyle = '#5f6b78'; c.fillRect(cx + 155, 130, 30, 22);
  } else if (th.deco === 'bloem') {
    for (let i = 0; i < 9; i++) {
      const x = dX((i * 0.115 + 0.03) * dSpan);
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
  // grondstrepen — lopen mee met de wereld (loop-gevoel)
  c.fillStyle = 'rgba(0,0,0,.14)';
  const span = 92;
  const off = wrap(-scroll, span);
  for (let x = off - span; x < W + span; x += span) {
    c.fillRect(x, ground + 10, 36, 4);
    c.fillRect(x + 52, ground + 26, 20, 3);
  }
  // weer per thema (art-upgrade 4/4): blaadjes/bloesem/sintels/regen/stof
  drawThemeWeather(c, themeName, t, ground, scroll);
  // pixel-speckles op de grond (art-upgrade 1/4) — deterministisch, scroll-vast
  if (!fxLite()) {
    const spSpan = 61;
    const spOff = wrap(-scroll, spSpan);
    c.fillStyle = 'rgba(255,255,255,.08)';
    for (let x = spOff - spSpan; x < W + spSpan; x += spSpan) {
      c.fillRect(x + 8, ground + 18, 3, 3);
      c.fillRect(x + 34, ground + 38, 3, 3);
    }
    c.fillStyle = 'rgba(0,0,0,.12)';
    for (let x = spOff - spSpan; x < W + spSpan; x += spSpan) {
      c.fillRect(x + 22, ground + 30, 3, 3);
      c.fillRect(x + 48, ground + 14, 3, 3);
    }
  }

  // Stage-delen (avontuur): decor evolueert per deel — schemer + rotsen + arena-fakkels
  if (stageFx && stageFx.pr > 0.02) {
    const pr = clamp(stageFx.pr, 0, 1);
    const part = stageFx.part || 1;
    // 1) lucht kleurt langzaam naar schemer richting het einde
    const dusk = c.createLinearGradient(0, 0, 0, ground);
    dusk.addColorStop(0, `rgba(30,14,60,${(pr * 0.30).toFixed(3)})`);
    dusk.addColorStop(1, `rgba(90,30,50,${(pr * 0.16).toFixed(3)})`);
    c.fillStyle = dusk;
    c.fillRect(0, 0, W, ground);
    // 2) vanaf deel 2: rotsblokken op de grondlijn
    if (part >= 2) {
      const rSpan = W + 260;
      for (let i = 0; i < 5; i++) {
        const x = wrap((i * 0.21 + 0.12) * rSpan - scroll * 0.85, rSpan) - 130;
        const s = 10 + (i % 3) * 7;
        c.fillStyle = 'rgba(20,16,34,.55)';
        c.beginPath();
        c.moveTo(x - s, ground);
        c.lineTo(x - s * 0.3, ground - s);
        c.lineTo(x + s * 0.5, ground - s * 0.7);
        c.lineTo(x + s, ground);
        c.closePath(); c.fill();
      }
    }
    // 3) deel 3: arena-fakkels (extra fel bij baas-level)
    if (part >= 3) {
      const fSpan = W + 300;
      const n = stageFx.boss ? 4 : 3;
      for (let i = 0; i < n; i++) {
        const x = wrap((i * 0.27 + 0.08) * fSpan - scroll * 0.9, fSpan) - 150;
        c.strokeStyle = '#3a2a1a'; c.lineWidth = 5;
        c.beginPath(); c.moveTo(x, ground); c.lineTo(x, ground - 64); c.stroke();
        const fl = Math.sin(t * 9 + i * 2.1) * 3;
        c.fillStyle = stageFx.boss ? '#ff6b3f' : '#ffb347';
        c.beginPath();
        c.ellipse(x, ground - 72 + fl * 0.4, 7 + fl * 0.5, 13 + fl, 0, 0, TAU);
        c.fill();
        c.fillStyle = '#ffe9a8';
        c.beginPath();
        c.ellipse(x, ground - 68 + fl * 0.3, 3.5, 6, 0, 0, TAU);
        c.fill();
      }
      if (stageFx.boss) {
        c.fillStyle = `rgba(150,20,40,${(0.05 + Math.sin(t * 2.2) * 0.02).toFixed(3)})`;
        c.fillRect(0, 0, W, ground);
      }
    }
  }
}

/* --- src/game/game.js --- */
/* ================================ GAME ================================= */
let game = null;

function scheduleGameResult(g, delay, fn) {
  if (!g) return;
  if (g._resultTimer) clearTimeout(g._resultTimer);
  g._resultTimer = setTimeout(() => {
    g._resultTimer = null;
    fn();
  }, delay);
}

function clearGameResultTimer(g) {
  if (g && g._resultTimer) {
    clearTimeout(g._resultTimer);
    g._resultTimer = null;
  }
}

class Game {
  constructor(mode, opts) {
    opts = opts || {};
    this.mode = mode;
    this.t = 0;
    this.ground = playfieldGroundY(H, W);
    this.minX = 40; this.maxX = W - 40;
    this.shakeT = 0; this.shakeMag = 0; this.freezeT = 0;
    this.particles = []; this.floaters = []; this.projectiles = []; this.banners = [];
    this.monsters = [];
    this.inputLocked = false;
    this.playerHurtCd = 0;
    this.sessionXP = 0;
    this.over = false;
    this.maxCombo = 0;
    this.combo = 0;
    this.comboT = 0;
    this.runFinishers = 0;

    const st = playerStats();
    if (mode !== 'versus') {
      const advLevel = mode === 'adventure' ? (opts.level || 1) : 0;
      const mb = mode === 'adventure' && masterBuffActive(advLevel);
      const pst = mode === 'adventure' ? playerStats({ masterBuff: mb }) : st;
      const wpn = mode === 'adventure' ? playerWeaponForAdventure(advLevel) : playerWeapon();
      this.player = new Fighter({
        isPlayer: true, x: W * 0.25, y: this.ground,
        hp: pst.maxhp, maxhp: pst.maxhp, baseDmg: pst.dmg,
        weapon: wpn, color: '#f2f5ff',
        speed: Math.round(260 * (pst.speedMul || 1)),
        rosterId: 'hero',
      });
      applyPlayerStyle(this.player);
      applyStyleBonusesToPlayer(this, this.player);
      this.petDmgMul = 1;
      this.petEnergyMul = 1;
      this.petCritBonus = 0;
      this.petShieldWave = 0;
      applyPetBonusesToPlayer(this, this.player);
      spawnGamePet(this);
      spawnGameEggPet(this);
    }

    if (mode === 'adventure') {
      this.combo = 0; this.comboT = 0;
      this.killStreak = 0;
      this.sessionBestKillStreak = 0;
      this.pickups = [];
      this.dmgBuffT = 0; this.dmgBuffMul = 1;
      this.playerShieldT = 0;
      this.stageDmgMul = 1;
      this.stageEnergyMul = 1;
      this.stageAlly = null;
      this.stageHealBetween = 0;
      this.stageShieldPerWave = 0;
      this.stageCritBonus = 0;
      this.gambleRoll = null;
      this.gambleBossWave = 0;
      this.masterSwordT = 0;
      this._savedMasterWeapon = null;
      this.initAdventure(opts.level || 1, opts.gamble);
    } else if (mode === 'training') this.initTraining();
    else if (mode === 'wall') this.initWall();
    else if (mode === 'coinrun') this.initCoinRun();
    else if (mode === 'versus') this.initVersus(opts);
  }

  onResize() {
    this.ground = playfieldGroundY(H, W);
    this.maxX = W - 40;
    if (this.mode === 'versus' && this.p2) {
      applyVsArenaBounds(this);
      Input.dualMode = true;
      Input.layout(W, H);
      this.player.x = clampFighterX(this.player, this, vsSpawnX(1));
      this.player.y = this.ground;
      this.p2.x = clampFighterX(this.p2, this, vsSpawnX(2));
      this.p2.y = this.ground;
    }
    if (this.mode === 'wall') this.layoutWall(false);
  }

  /* --------------------------- AVONTUUR ------------------------------- */
  initAdventure(n, gamble) {
    this.level = buildLevel(n);
    this.theme = this.level.theme;
    this.waveIdx = -1;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.kills = 0;
    this.betweenT = 1.2;
    this.pickups = this.pickups || [];
    this.worldX = 0;
    this.traveling = false;
    this.progressSmooth = 0;
    this.stagePart = 1;
    this.partFlashT = 0;
    this.bossArriveT = 0;
    this.travelWasOn = false;
    this.bossBeatPlayed = false;
    this.waveTotal = 0;
    this.allyAssistT = 0;
    this.gambleRoll = gamble || null;
    this.ketsbamCd = 0;
    this.ketsbamSuperT = 0;
    this.ketsbamShow = false;
    this.ketsbamPulse = 0;
    this.ketsbamChargeT = 0;
    this.ketsbamChargeDur = 0;
    this.ketsbamChargePulse = 0;
    applyGambleToStage(this, gamble);
    this.banner(t('banner.levelStart', { n }), 1.4, '#ffd75e', 54);
    if (masterBuffActive(n)) {
      setTimeout(() => {
        try {
          if (this.over) return;
          this.banner(t('banner.masterBuff'), 2, '#c47aff', 40);
          this.floater(W * 0.5, 132, t('combat.masterBuffFloater'), '#c47aff', 14);
        } catch (_) {}
      }, 1500);
    }
    const wCap = adventureWeaponCapForLevel(n);
    if (playerWeapon().unlock > wCap) {
      setTimeout(() => {
        try {
          if (this.over) return;
          this.floater(W * 0.5, 148, t('combat.skillGate', { cap: wCap }), '#ffd75e', 13);
        } catch (_) {}
      }, masterBuffActive(n) ? 2800 : 1500);
    }
    if (gamble && gamble.outcome !== 'neutral') {
      setTimeout(() => {
        try {
          if (this.over) return;
          this.banner(gambleOutcomeLabelFromKey(gamble).slice(0, 42), 2.2, '#7cf5ff', 34);
        } catch (_) {}
      }, 1600);
    }
    if (this.gambleBossWave > 0) {
      this.floater(W * 0.5, 100, t('combat.gambleSuperBoss', { n: this.gambleBossWave }), '#ffb0b8', 14);
    }
    if (this.stageAlly) {
      this.floater(W * 0.5, 118, t('combat.allyHelps', { name: this.stageAlly.name }), this.stageAlly.color || '#7cf5ff', 15);
    }
    this.allyAssistT = this.stageAlly ? 2.2 : 0;
    setTimeout(() => { try { if (!this.over) this.maybeRollMasterSword(); } catch (_) {} }, 900);
    AudioSys.play(this.level.boss ? 'boss' : 'battle');
  }

  maybeRollMasterSword() {
    if (this.mode !== 'adventure' || this.over || !this.player || !this.player.alive) return;
    if (this.masterSwordT > 0) return;
    const w = this.player.weapon;
    if (!canMasterSwordRoll(w)) return;
    if (Math.random() >= MASTER_SWORD_CHANCE) return;
    this.activateMasterSword();
  }

  activateMasterSword() {
    const p = this.player;
    if (!p || !canMasterSwordRoll(p.weapon)) return;
    this._savedMasterWeapon = p.weapon;
    p.weapon = buildMasterSwordWeapon(p.weapon);
    this.masterSwordT = MASTER_SWORD_DURATION;
    resetWeaponCombo(p);
    this.banner(t('banner.masterSword'), 2.4, '#7cf5ff', 52);
    this.floater(p.x, p.y - 132, t('combat.masterSwordGain'), '#ffd75e', 16);
    if (!fxLite() && !motionReduced()) {
      this.burst(p.x + p.face * 18, p.y - 52, '#6fd7ff', 14, { kind: 'spark', size: 2.8 });
      spawnFxRing(this, p.x, p.y - 48, '#7cf5ff', 12);
    }
    try { AudioSys.sting('masterSword'); AudioSys.sfx('masterSword'); } catch (_) {}
    haptic(26);
  }

  deactivateMasterSword(silent) {
    if (!this._savedMasterWeapon || !this.player) {
      this.masterSwordT = 0;
      this._savedMasterWeapon = null;
      return;
    }
    this.player.weapon = this._savedMasterWeapon;
    this._savedMasterWeapon = null;
    this.masterSwordT = 0;
    resetWeaponCombo(this.player);
    if (!silent) {
      this.floater(this.player.x, this.player.y - 120, t('combat.masterSwordFade'), '#9db1e3', 14);
    }
  }

  nextWave() {
    if (!this.player?.alive) {
      if (!this.over) this.finishAdventure(false);
      return;
    }
    this.waveIdx++;
    if (this.waveIdx >= this.level.waves.length) { this.finishAdventure(true); return; }
    const wave = this.level.waves[this.waveIdx];
    const bossWave = isBossWave(this.level, this.waveIdx);
    this.spawnQueue = wave.slice();
    this.waveTotal = wave.length;
    this.spawnTimer = bossWave ? 1.0 : 0.45;
    this.wavePause = 0;
    if (this.stageShieldPerWave > 0 && this.player) {
      this.playerShieldT = Math.max(this.playerShieldT, this.stageShieldPerWave);
    }
    if (this.petShieldWave > 0 && this.player) {
      this.playerShieldT = Math.max(this.playerShieldT, this.petShieldWave);
    }
    if (this.styleShieldWave > 0 && this.player) {
      this.playerShieldT = Math.max(this.playerShieldT, this.styleShieldWave);
    }
    if (bossWave) {
      this.banner(t('banner.bossWave'), 1.8, '#ff6b6b', 50);
      AudioSys.play('boss');
      AudioSys.sfx('roar');
      try {
        this.shake(8, 0.3);
        this.burst(W * 0.5, this.ground - 80, '#ff6b6b', fxLite() ? 12 : 22);
        spawnFxRing(this, W * 0.5, this.ground - 80, '#ffd75e', 18);
      } catch (_) {}
    } else if (wave.some(s => s.elite || s.superBoss)) {
      const hasSuper = wave.some(s => s.superBoss);
      this.banner(hasSuper ? t('banner.superBossWave') : t('banner.eliteWave'), 1.35, hasSuper ? '#ffd75e' : '#ffb0b8', 40);
      AudioSys.play(hasSuper ? 'boss' : 'elite');
      AudioSys.sfx('roar');
    } else {
      const meta = this.level.waveMeta && this.level.waveMeta[this.waveIdx];
      const trait = meta && meta.trait && WAVE_TRAIT_BANNER[meta.trait];
      if (trait) {
        this.banner(trait.text, 1.2, trait.color, trait.size);
        if (meta.trait === 'flyers') {
          try { this.floater(W * 0.5, 108, t('combat.aimUp'), '#c47aff', 13); } catch (_) {}
        }
      } else {
        this.banner(t('banner.waveN', { n: this.waveIdx + 1, total: this.level.waves.length }), 1.1, '#cfe0ff', 38);
      }
    }
  }

  /** 0..1 voortgang door het level (golven + kills binnen golf). */
  stageProgress() {
    if (!this.level || !this.level.waves) return 0;
    const total = this.level.waves.length;
    if (this.waveIdx < 0) return 0;
    if (this.waveIdx >= total) return 1;
    let frac;
    if (this.wavePause > 0) {
      frac = 1;
    } else {
      const size = Math.max(1, this.waveTotal || 1);
      const remaining = this.spawnQueue.length + this.monsters.filter((m) => m.alive).length;
      frac = clamp(1 - remaining / size, 0, 1) * 0.85;
    }
    return clamp((this.waveIdx + frac) / total, 0, 1);
  }

  updateAdventure(dt) {
    // Bewegend decor: tussen golven "loopt" de wereld door (à la beat 'em up)
    const travelPhase = this.wavePause > 0 || (this.betweenT > 0 && this.waveIdx < 0);
    this.traveling = travelPhase && !!(this.player && this.player.alive) && !this.over;
    // Deel 3: camera-punch bij vertrek, zwaardere beat bij aankomst op de baas
    if (this.traveling && !this.travelWasOn) {
      this.shake(motionReduced() ? 2 : 5, 0.22);
      this.bossBeatPlayed = false;
      this._travelStepT = 0;
      try { AudioSys.sfx('travel'); } catch (_) {}
      if (!fxLite() && !motionReduced() && this.player) {
        this.burst(this.player.x - 18, this.player.y - 8, '#c9b691', 9, { kind: 'spark', size: 2.2 });
      }
    } else if (!this.traveling && this.travelWasOn) {
      if (isBossWave(this.level, this.waveIdx)) {
        this.shake(motionReduced() ? 3 : 9, 0.35);
        this.freezeT = Math.max(this.freezeT, 0.06);
        this.bossArriveT = motionReduced() ? 0.3 : 0.7;
        haptic(24);
        try { AudioSys.sfx('bossArrive'); } catch (_) {}
      }
    }
    this.travelWasOn = this.traveling;
    if (this.traveling) {
      this.worldX = (this.worldX || 0) + dt * (isBossWave(this.level, this.waveIdx + 1) ? 220 : 165);
      this._travelStepT = (this._travelStepT || 0) + dt;
      if (this._travelStepT >= 0.38) {
        this._travelStepT = 0;
        try { AudioSys.sfx('step'); } catch (_) {}
      }
    }
    // Baas-aankomst-beat: halverwege de reis naar de baas-golf één roar
    if (this.wavePause > 0 && isBossWave(this.level, this.waveIdx + 1) && !this.bossBeatPlayed) {
      const f = 1 - this.wavePause / (this.wavePauseTotal || 1);
      if (f > 0.45) {
        this.bossBeatPlayed = true;
        try { AudioSys.sfx('bossWait'); } catch (_) {}
        this.floater(W / 2, 120, t('combat.bossWaits'), '#ff8a9a', 15);
      }
    }
    if (this.partFlashT > 0) this.partFlashT -= dt;
    if (this.bossArriveT > 0) this.bossArriveT -= dt;
    const pr = this.stageProgress();
    const part = Math.min(3, 1 + Math.floor(pr * 3));
    if (part > (this.stagePart || 1)) {
      this.stagePart = part;
      this.partFlashT = motionReduced() ? 0.22 : 0.5;
      this.floater(W / 2, 96, t('combat.checkpoint', { part }), '#7cf5ff', 17);
      const orbX = W / 2 - Math.min(320, W * 0.5) / 2 + clamp(this.progressSmooth || 0, 0, 1) * Math.min(320, W * 0.5);
      if (!fxLite()) this.burst(orbX, 44, '#7cf5ff', motionReduced() ? 6 : 14, { kind: 'spark', size: 2.4 });
      try { AudioSys.sfx('checkpoint'); } catch (_) {}
      haptic(10);
    }
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 0;
    }
    try { AudioSys.setCombatHeat(Math.min(1, (this.combo || 0) / 12 + (this.killStreak || 0) / 14)); } catch (_) {}
    if (this.dmgBuffT > 0) {
      this.dmgBuffT -= dt;
      if (this.dmgBuffT <= 0) this.dmgBuffMul = 1;
    }
    if (this.playerShieldT > 0) this.playerShieldT -= dt;
    if (this.masterSwordT > 0) {
      this.masterSwordT -= dt;
      if (this.masterSwordT <= 0) this.deactivateMasterSword(false);
    }
    if (this.stageAlly && this.player && this.player.alive && this.monsters.some((m) => m.alive)) {
      this.allyAssistT = (this.allyAssistT || 0) - dt;
      if (this.allyAssistT <= 0) {
        this.allyAssistT = this.stageAlly.id === 'dawn' ? 3.6 : 5;
        const tgt = this.monsters.reduce((best, m) => {
          if (!m.alive) return best;
          const d = Math.abs(m.x - this.player.x);
          return !best || d < Math.abs(best.x - this.player.x) ? m : best;
        }, null);
        if (tgt) {
          const dmg = Math.round(this.player.baseDmg * 0.38 * (this.stageDmgMul || 1));
          tgt.takeDamage(dmg, Math.sign(tgt.x - this.player.x) * 140, this);
          this.floater(tgt.x, tgt.y - tgt.size - 22, t('combat.allyHit', { name: this.stageAlly.name, dmg }), this.stageAlly.color || '#7cf5ff', 12);
          if (!fxLite()) this.burst(tgt.x, tgt.y - tgt.size * 0.4, this.stageAlly.color || '#7cf5ff', 6, { kind: 'spark', size: 2 });
        }
      }
    }
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
      if (this.betweenT <= 0 && this.waveIdx < 0 && this.player?.alive) this.nextWave();
    }
    if (this.spawnQueue.length) {
      const alive = this.monsters.filter((m) => m.alive).length;
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && alive < ADVENTURE_MAX_ALIVE) {
        const bossWave = isBossWave(this.level, this.waveIdx);
        const meta = this.level.waveMeta && this.level.waveMeta[this.waveIdx];
        const spawnMul = (meta && meta.spawnMul) || 1;
        const queueLeft = this.spawnQueue.length;
        const batch = queueLeft > 28 ? 3 : queueLeft > 14 ? 2 : 1;
        const intervalMul = queueLeft > 20 ? 0.72 : queueLeft > 10 ? 0.86 : 1;
        this.spawnTimer = (bossWave ? 0.92 : 0.38) * spawnMul * intervalMul;
        for (let b = 0; b < batch && this.spawnQueue.length && this.monsters.filter((m) => m.alive).length < ADVENTURE_MAX_ALIVE; b++) {
          const def = this.spawnQueue.shift();
          const side = Math.random() < 0.75 ? 1 : -1;
          const x = (side > 0 ? W + 40 : -40) + b * side * 32;
          const mon = new Monster(def.sp, x, this, {
            elite: !!(def.elite || def.superBoss),
            superBoss: !!def.superBoss,
            giant: !!def.giant,
            hpMul: this.level.hpMul,
            dmgMul: this.level.dmgMul,
          });
          this.monsters.push(mon);
          if (def.superBoss) {
            triggerSpecialEnemyIntro(this, mon, 'superBoss');
          } else if (def.elite || bossWave) {
            triggerSpecialEnemyIntro(this, mon, bossWave ? 'boss' : 'elite');
          } else if (def.giant && !fxLite()) {
            this.floater(mon.x, mon.y - mon.size - 28, t('combat.giant'), '#ffd75e', 13);
          }
        }
      } else if (alive >= ADVENTURE_MAX_ALIVE) {
        this.spawnTimer = Math.min(this.spawnTimer, 0.12);
      }
    } else if (this.waveIdx >= 0 && this.monsters.every(m => !m.alive) && this.player?.alive) {
      if (!this.wavePause) {
        const nextIsBoss = isBossWave(this.level, this.waveIdx + 1);
        this.wavePause = nextIsBoss ? 2.15 : 1.55;
        this.wavePauseTotal = this.wavePause;
        const waveHeal = Math.max(4, Math.round(this.player.maxhp * 0.06));
        this.player.hp = Math.min(this.player.maxhp, this.player.hp + waveHeal);
        this.player.energy = clamp(this.player.energy + 8, 0, 100);
        this.floater(this.player.x, this.player.y - 88, t('banner.waveClear', { heal: waveHeal }), '#6ee06e', 14);
        if (this.stageHealBetween > 0) {
          const heal = Math.max(8, Math.round(this.player.maxhp * this.stageHealBetween));
          this.player.hp = Math.min(this.player.maxhp, this.player.hp + heal);
          this.floater(this.player.x, this.player.y - 108, t('combat.allyHeal', { heal }), '#6ee06e', 14);
        }
        try { AudioSys.sfx('waveClear'); } catch (_) {}
        if ((this.killStreak || 0) >= 5) {
          this.floater(W / 2, 112, t('combat.streakHold', { n: this.killStreak }), '#ffd75e', 15);
        }
      }
      this.wavePause -= dt;
      if (this.wavePause <= 0) { this.wavePause = 0; this.nextWave(); }
    }
    if (!this.player.alive && !this.over) this.finishAdventure(false);
  }

  finishAdventure(win) {
    if (this.over) return;
    if (win && (!this.player || !this.player.alive)) win = false;
    this.deactivateMasterSword(true);
    this.over = true;
    this.inputLocked = true;
    let stars = 0;
    const lv = this.level.n;
    if (win) {
      const bonus = 30 + lv * 10;
      this.grantXP(bonus);
      if (lv === save.unlocked && save.unlocked < MAX_LEVEL) { save.unlocked++; persist(); }
      if (lv % LEVELS_PER_ISLAND === 0) {
        save.advIsland = Math.min(5, lv / LEVELS_PER_ISLAND);
        persist();
        if (lv < MAX_LEVEL) {
          const nCap = adventureWeaponCapForLevel(lv + 1);
          setTimeout(() => {
            try { UI.toast(t('toast.islandUnlock', { name: islandLabel(islandFromLevel(lv + 1), 'name'), cap: nCap }), 4200); } catch (_) {}
          }, 1700);
        }
      }
      if (save.advMasterBuff === lv) {
        save.advMasterBuff = null;
        persist();
      }
      const hpPct = this.player.hp / Math.max(1, this.player.maxhp);
      stars = starsFromHpPct(hpPct);
      const prev = save.stars[lv] || 0;
      if (stars > prev) { save.stars[lv] = stars; persist(); }
      bumpStat('advWins', 1);
      bumpDaily('advWin', 1);
      const eggBonus = maybeAdvEggBonus();
      if (eggBonus) {
        spawnGameEggPet(this);
        const rar = rarityOf(eggBonus.def.rarity);
        setTimeout(() => {
          try {
            UI.toast(eggBonus.duplicate
              ? t('toast.eggDuplicate', { name: eggBonus.def.name })
              : t('toast.eggNew', { name: eggBonus.def.name, rar: rarityLabel(eggBonus.def.rarity) }), 3800);
          } catch (_) {}
        }, 1200);
      }
      checkAchievements();
      AudioSys.sfx('win');
      this.banner(t('banner.won'), 2, '#7cfc8a', 56);
    } else {
      if (!save.advFails || typeof save.advFails !== 'object') save.advFails = {};
      const hadMaster = save.advMasterBuff === lv;
      save.advFails[lv] = (save.advFails[lv] || 0) + 1;
      const gotMaster = save.advFails[lv] >= 5 && !hadMaster;
      if (gotMaster) save.advMasterBuff = lv;
      persist();
      if (gotMaster) {
        setTimeout(() => { try { UI.toast(t('toast.masterBuffGain'), 3800); } catch (_) {} }, 1500);
      }
      AudioSys.sfx('lose');
      this.banner(t('banner.lost'), 2, '#ff6b6b', 50);
    }
    scheduleGameResult(this, 1400, () => UI.showResult(win, {
      title: win ? t('result.advWin') : t('result.advLose'),
      detail: (() => {
        const finishers = this.runFinishers ? t('result.finishersLine', { n: this.runFinishers }) : '';
        const streak = (this.sessionBestKillStreak || 0) >= 3
          ? t('result.streakLine', { n: this.sessionBestKillStreak }) : '';
        let base = win
          ? t('result.advDetailWin', { lv, kills: this.kills, stars, combo: this.maxCombo || 0, finishers, streak })
          : t('result.advDetailLose', { lv, kills: this.kills, combo: this.maxCombo || 0, finishers, streak });
        if (masterBuffActive(lv) && !win) base += t('result.masterBuffActive');
        if (this.gambleRoll && this.gambleRoll.outcome !== 'neutral') {
          base += t('result.gambleLine', {
            text: gambleOutcomeLabelFromKey(this.gambleRoll).replace(/^[^!]+!?\s*/, '').slice(0, 48),
          });
        }
        return base;
      })(),
      xp: this.sessionXP,
      mode: 'adventure', level: this.level.n, win, stars,
      tip: win ? (stars >= 3 ? t('result.perfectRun') : t('result.pickupsHelp', { hint: starHintLine() })) : (() => {
        const prog = this.waveIdx >= 0 ? t('result.wavesProg', { cur: this.waveIdx + 1, total: this.level.waves.length }) : 'start';
        const base = this.player.hp <= 0
          ? t('result.lossBlockTip', { prog })
          : t('result.lossOrbTip', { prog });
        const once = onceResultTip('adventure', 'loss',
          t('result.lossGambleTip'));
        return once ? `${once} · ${base}` : base;
      })(),
    }));
  }

  onMonsterKilled(m) {
    this.kills++;
    this.killStreak = (this.killStreak || 0) + 1;
    const ks = this.killStreak;
    this.sessionBestKillStreak = Math.max(this.sessionBestKillStreak || 0, ks);
    trackKillStreak(ks);
    if ([3, 5, 8, 12].includes(ks)) {
      const msgs = { 3: t('combat.streak3'), 5: t('combat.streak5'), 8: t('combat.streak8'), 12: t('combat.streak12') };
      this.floater(W / 2, 128, msgs[ks], ks >= 8 ? '#ff7a4d' : '#ffd75e', 17);
      AudioSys.sfx(ks >= 8 ? 'comboEpic' : 'combo');
      if (!motionReduced() && !fxLite()) spawnFxRing(this, m.x, m.y - m.size * 0.35, ks >= 8 ? '#ff7a4d' : '#ffd75e', 7 + ks * 0.35);
      haptic(8 + Math.min(ks, 12));
    }
    this.freezeT = Math.max(this.freezeT, 0.045 + Math.min(ks, 12) * 0.002);
    this.shake(5, 0.18);
    haptic(12);
    const rar = rarityOf(m.sp.rarity);
    const killRingR = m.superBoss ? 18 : (m.elite ? 14 : (m.giant ? 12 : 9));
    spawnFxRing(this, m.x, m.y - m.size * 0.32, rar.color, killRingR);
    if (!fxLite() && m.elite && !motionReduced()) {
      this.burst(m.x, m.y - m.size * 0.2, '#fff', 4, { kind: 'spark', size: 2.2 });
    }
    const dropChance = m.elite ? 0.42 : 0.22;
    if (Math.random() < dropChance) this.spawnPickup(m.x, m.y - m.size * 0.5);
    if (this.mode === 'adventure') {
      const skillId = rollSkillShardDrop(m);
      if (skillId) this.spawnPickup(m.x + rand(-18, 18), m.y - m.size * 0.35, { skillId });
      const itemDrop = rollItemShardDrop(m);
      if (itemDrop) this.spawnPickup(m.x + rand(-22, 22), m.y - m.size * 0.45, { itemCat: itemDrop.cat, itemId: itemDrop.id });
    }
    bumpStat('kills', 1);
    bumpDaily('kills', 1);
    if (m.elite) {
      bumpStat('bossKills', 1);
      bumpDaily('bossKill', 1);
    }
    const lvlScale = 1 + (this.level ? (this.level.n - 1) * 0.1 : 0);
    const rarMul = 1 + rar.order * 0.15;
    const giantMul = m.giant ? GIANT_XP_MUL : 1;
    const xp = Math.round(m.sp.xp * lvlScale * rarMul * (m.elite ? 2 : 1) * giantMul);
    this.grantXP(xp);
    this.floater(m.x, m.y - m.size - 30, `+${xp} XP`, rar.color, 16);
    if (rar.order >= 3) this.floater(m.x, m.y - m.size - 50, rar.name.toUpperCase(), rar.color, 13);
    this.player.energy = clamp(this.player.energy + 12 + rar.order * 2, 0, 100);
    const tiersBefore = dexRarityTierCount();
    const countBefore = dexCount();
    if (!save.dex[m.spId]) {
      save.dex[m.spId] = 0;
      persist();
      AudioSys.sfx('newmonster');
      const hpB = rarityHpBonus(m.sp.rarity);
      this.banner(t('banner.newDex', { rar: rarityLabel(m.sp.rarity), name: m.sp.name, hp: hpB }), 2.0, rar.color, 28);
      this.player.maxhp += hpB; this.player.hp += hpB;
      UI.toast(t('toast.dexDiscover', { rar: rarityLabel(m.sp.rarity), name: m.sp.name, hp: hpB }), 3200);
    }
    save.dex[m.spId]++;
    persist();
    const tame = maybeTamePet(m.spId);
    if (tame) {
      save.stats.petsTamed = petTamedCount();
      persist();
      spawnGamePet(this);
      this.banner(t('banner.pet', { name: tame.sp.name }), 2.2, tame.sp.c1, 36);
      UI.toast(t('toast.petTamed', { name: tame.sp.name, cur: tame.kills, need: tame.need }), 4200);
    }
    checkAchievements();
    // Cosmetics die op dex-drempels unlocken (geen combat-wijziging)
    if (countBefore < dexCount()) {
      const half = Math.ceil(SPECIES_ORDER.length / 2);
      if (countBefore < half && dexCount() >= half) {
        UI.toast(t('toast.styleUnlockTome'), 3500);
      }
      if (tiersBefore < 4 && dexRarityTierCount() >= 4) {
        UI.toast(t('toast.styleUnlockCrystal'), 3500);
      }
    }
    this.maybeSummon(m);
  }

  /** Hele kleine kans: Summon ascendeert een lager wapen naar Episch/Legendarisch. */
  maybeSummon(m) {
    save.stats.killsSinceSummon = (save.stats.killsSinceSummon || 0) + 1;
    const eligible = summonEligibleWeapons();
    if (!eligible.length) { persist(); return; }
    if (!rollSummonChance(!!(m && m.elite))) { persist(); return; }
    const pick = eligible[Math.floor(Math.random() * eligible.length)];
    const wasEpic = summonTierOf(pick.id) === 'epic';
    const tier = (wasEpic || Math.random() < 0.15) ? 'legendary' : 'epic';
    if (!save.summons || typeof save.summons !== 'object') save.summons = {};
    save.summons[pick.id] = tier;
    save.stats.summonCount = (save.stats.summonCount || 0) + 1;
    save.stats.killsSinceSummon = 0;
    persist();
    const rar = rarityOf(tier);
    const asc = applyWeaponUpgrades(applySummonTier(weaponById(pick.id)));
    if (this.player && this.player.weapon && this.player.weapon.id === pick.id) {
      this.player.weapon = playerWeapon();
      const st = playerStats();
      this.player.baseDmg = st.dmg;
    }
    AudioSys.sfx('summon');
    setTimeout(() => { try { AudioSys.sfx('bonus'); } catch (_) {} }, 280);
    this.freezeT = Math.max(this.freezeT, 0.1);
    this.shake(9, 0.35);
    const px = this.player ? this.player.x : W * 0.5;
    const py = this.player ? this.player.y : this.ground;
    this.burst(px, py - 70, rar.color, fxLite() ? 14 : 30);
    this.burst(px, py - 70, '#fff', fxLite() ? 6 : 12);
    this.banner(t('banner.summon'), 2.2, rar.color, 44);
    setTimeout(() => this.banner(t('banner.summonAscend', { name: weaponLabel(pick), rar: rar.name }), 2.4, rar.color, 30), 1100);
    this.floater(px, py - 130, `${weaponLabel(pick)} ✦ ${rar.name}`, rar.color, 17);
    UI.toast(t('toast.summon', { name: weaponLabel(pick), rar: rar.name, dmg: asc.dmg }), 4200);
  }

  spawnPickup(x, y, opts) {
    opts = opts || {};
    if (opts.skillId && SKILL_DEFS[opts.skillId]) {
      this.pickups.push({
        x, y, kind: 'skill_shard', skillId: opts.skillId,
        t: rand(0, TAU), life: 18, bob: 0,
      });
      return;
    }
    if (opts.itemCat && opts.itemId && itemUpgradeEligible(opts.itemCat, opts.itemId)) {
      this.pickups.push({
        x, y, kind: 'item_shard', itemCat: opts.itemCat, itemId: opts.itemId,
        t: rand(0, TAU), life: 18, bob: 0,
      });
      return;
    }
    const kind = choice(PICKUP_TYPES);
    this.pickups.push({ x, y, kind, t: rand(0, TAU), life: 16, bob: 0 });
  }

  collectPickup(pk) {
    if (pk._got) return;
    pk._got = true;
    const meta = PICKUP_META[pk.kind] || PICKUP_META.heal;
    const p = this.player;
    AudioSys.sfx('pickup');
    haptic(20);
    switch (pk.kind) {
      case 'skill_shard': {
        const sid = pk.skillId;
        if (!sid || !SKILL_DEFS[sid]) break;
        addSkillShards(sid, 1);
        const def = SKILL_DEFS[sid];
        const col = def.color;
        const lbl = skillLabel(sid);
        this.floater(p.x, p.y - 100, t('combat.pickupSkillShard', { name: lbl }), col, 15);
        if (skillCanUpgrade(sid)) {
          try { UI.toast(t('toast.skillUpgradeReady', { name: lbl }), 2800); } catch (_) {}
        }
        break;
      }
      case 'item_shard': {
        const cat = pk.itemCat;
        const iid = pk.itemId;
        if (!cat || !iid || !itemUpgradeEligible(cat, iid)) break;
        if (addItemShards(cat, iid, 1) <= 0) break;
        const lbl = itemUpgradeLabel(cat, iid);
        const col = itemUpgradeColor(cat, iid);
        this.floater(p.x, p.y - 100, t('combat.pickupItemShard', { name: lbl }), col, 15);
        if (itemCanUpgrade(cat, iid)) {
          try { UI.toast(t('toast.itemUpgradeReady', { name: lbl }), 2800); } catch (_) {}
        }
        break;
      }
      case 'heal':
        p.hp = Math.min(p.maxhp, p.hp + Math.round(p.maxhp * 0.28));
        this.floater(p.x, p.y - 100, t('combat.pickupHp'), meta.color, 16);
        break;
      case 'rage':
        this.dmgBuffMul = 1.38;
        this.dmgBuffT = 9;
        this.floater(p.x, p.y - 100, t('combat.pickupRage'), meta.color, 16);
        break;
      case 'chakra':
        p.energy = 100;
        this.floater(p.x, p.y - 100, t('combat.pickupChakra'), meta.color, 16);
        break;
      case 'shield':
        this.playerShieldT = 6.5;
        this.floater(p.x, p.y - 100, t('combat.pickupShield'), meta.color, 16);
        break;
    }
    this.banner(pickupLabel(pk.kind, pk.skillId, pk.itemCat, pk.itemId), 0.9,
      (pk.kind === 'skill_shard' && SKILL_DEFS[pk.skillId]) ? SKILL_DEFS[pk.skillId].color
        : (pk.kind === 'item_shard' && pk.itemCat && pk.itemId) ? itemUpgradeColor(pk.itemCat, pk.itemId)
          : meta.color, 28);
    this.burst(pk.x, pk.y,
      (pk.kind === 'skill_shard' && SKILL_DEFS[pk.skillId]) ? SKILL_DEFS[pk.skillId].color
        : (pk.kind === 'item_shard' && pk.itemCat && pk.itemId) ? itemUpgradeColor(pk.itemCat, pk.itemId)
          : meta.color, 14);
    bumpStat('pickups', 1);
    bumpDaily('pickups', 1);
    pk.life = 0;
  }

  /* --------------------------- TRAINING ------------------------------- */
  initTraining() {
    this.theme = 'dojo';
    this.roundsP = 0; this.roundsR = 0;
    this.trainRoundLog = [];
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
    this.trainMeleeTelegraphT = 0;
    this.trainMeleeTelegraphMax = 0.32;
    this.trainTelegraphKind = null;
    this.trainLaserCd = rand(5, 8);
    this.trainLaserTelegraph = 0;
    this.trainComboBest = 0;
    this.trainComboGoals = {};
    this.trainRoundBest = 0;
    this.startRound();
    AudioSys.play('training');
  }

  startRound() {
    this.round++;
    this.roundTimer = 60;
    const st = playerStats();
    this.player.hp = this.player.maxhp = st.maxhp;
    this.player.x = W * 0.25; this.player.y = this.ground; this.player.vx = 0; this.player.face = 1;
    this.player.attack = null; this.player.hurtT = 0; this.player.energy = 30;
    resetWeaponCombo(this.player);
    this.robot.hp = this.robot.maxhp = this.robotMaxHp;
    this.robot.x = W * 0.75; this.robot.y = this.ground; this.robot.vx = 0; this.robot.face = -1;
    this.robot.attack = null; this.robot.hurtT = 0; this.robot.deadT = 0;
    resetWeaponCombo(this.robot);
    this.phase = 'intro'; this.phaseT = 0;
    this.inputLocked = true;
    this.trainLaserCd = rand(4, 7);
    this.trainLaserTelegraph = 0;
    this.trainMeleeTelegraphT = 0;
    this.trainTelegraphKind = null;
    this.combo = 0;
    this.comboT = 0;
    this.trainRoundBest = 0;
    this.trainDummyGrace = this.round === 1 ? 3.5 : 0;
    const mp = this.roundsP === 1 || this.roundsR === 1;
    const decisive = this.roundsP === 1 && this.roundsR === 1;
    this.banner(
      decisive ? t('banner.roundDecisive', { n: this.round })
        : (mp ? t('banner.roundMatchPoint', { n: this.round }) : t('banner.round', { n: this.round })),
      1.1, decisive ? '#ff9a9a' : '#ffd75e', 52,
    );
    if (this.round === 1) {
      this.floater(W / 2, 148, t('combat.trainIntro'), '#7cf5ff', 16);
    }
    AudioSys.sfx('bell');
  }

  updateTrainingLasers(dt) {
    if ((this.trainDummyGrace || 0) > 0) return;
    if (this.phase !== 'fight' || !this.robot?.alive || !this.player?.alive) return;
    if (this.robot.attack || this.robot.hurtT > 0) {
      if ((this.trainLaserCd || 0) <= 0.5) this.trainLaserCd = rand(1.8, 3.2);
      return;
    }
    if (this.trainLaserTelegraph > 0) {
      this.trainLaserTelegraph -= dt;
      this.trainTelegraphT = Math.max(this.trainTelegraphT || 0, this.trainLaserTelegraph);
      if (this.trainLaserTelegraph <= 0) this.fireTrainingLaser();
      return;
    }
    if ((this.trainLaserCd || 0) > 0) {
      this.trainLaserCd -= dt;
      return;
    }
    if (!this.player.onGround) {
      this.trainLaserCd = rand(2.5, 4.5);
      return;
    }
    const pLow = this.player.hp / Math.max(1, this.player.maxhp) < 0.32;
    if (pLow && Math.random() < 0.38) {
      this.trainLaserCd = rand(3.2, 5.5);
      return;
    }
    const diff = Math.min(1.5, (this.robot.aiDiff || 1) * (pLow ? 0.88 : 1));
    this.trainLaserTelegraph = 0.95;
    this.trainLaserCd = rand(8, 12) / diff;
    this.floater(this.robot.x, this.robot.y - 148, t('combat.earLaser'), '#ff9a9a', 15);
    haptic(8);
  }

  fireTrainingLaser() {
    const r = this.robot;
    if (!r || !r.alive) return;
    const dir = Math.sign(this.player.x - r.x) || -1;
    const y = r.y - 52;
    const dmg = Math.min(20, Math.round(8 + save.lvl * 0.35 + save.trainWins * 0.35));
    this.spawnProjectile({
      x: r.x + dir * 30, y,
      vx: dir * 480, vy: 0, r: 13, dmg,
      from: 'enemy', kind: 'robolaser', life: 0.6, grav: 0,
    });
    AudioSys.sfx('laser');
    this.shake(3, 0.1);
  }

  updateTraining(dt) {
    this.phaseT += dt;
    if (this.phase === 'intro') {
      if (this.phaseT > 1.2 && this.phaseT - dt <= 1.2) this.banner(t('banner.fight'), 0.8, '#ff6b6b', 60);
      if (this.phaseT > 1.6) { this.phase = 'fight'; this.inputLocked = false; }
    } else if (this.phase === 'fight') {
      if (this.trainDummyGrace > 0) {
        this.trainDummyGrace -= dt;
        if (this.trainDummyGrace <= 0) this.floater(W / 2, 132, t('combat.robotActive'), '#ff9a9a', 15);
      }
      if (this.comboT > 0) {
        this.comboT -= dt;
        if (this.comboT <= 0) this.combo = 0;
      }
      if (this.trainTelegraphT > 0) this.trainTelegraphT -= dt;
      if (this.trainMeleeTelegraphT > 0) this.trainMeleeTelegraphT -= dt;
      this.updateTrainingLasers(dt);
      this.roundTimer -= dt;
      const pDead = !this.player.alive, rDead = !this.robot.alive;
      if (pDead || rDead || this.roundTimer <= 0) {
        let pWin;
        const timedOut = !pDead && !rDead && this.roundTimer <= 0;
        if (rDead && !pDead) pWin = true;
        else if (pDead && !rDead) pWin = false;
        else pWin = (this.player.hp / Math.max(1, this.player.maxhp)) >= (this.robot.hp / Math.max(1, this.robot.maxhp));
        if (pWin) this.roundsP++; else this.roundsR++;
        this.trainRoundLog = this.trainRoundLog || [];
        this.trainRoundLog.push(pWin ? 'p' : 'r');
        this.trainComboBest = Math.max(this.trainComboBest || 0, this.trainRoundBest || 0);
        this.phase = 'roundend'; this.phaseT = 0;
        this.inputLocked = true;
        const roundCombo = this.trainRoundBest || 0;
        let msg = pWin ? t('banner.roundWon') : t('banner.roundLost');
        if (timedOut) {
          const hpP = Math.round(this.player.hp / Math.max(1, this.player.maxhp) * 100);
          const hpR = Math.round(this.robot.hp / Math.max(1, this.robot.maxhp) * 100);
          msg = t('banner.timeHpVs', { hp1: hpP, hp2: hpR, msg });
        }
        this.banner(msg, 1.6, pWin ? '#7cfc8a' : '#ff6b6b', 40);
        if (roundCombo >= 3) {
          this.floater(W / 2, 118, t('combat.roundCombo', { n: roundCombo }), '#ffd75e', 14);
        }
        AudioSys.sfx(pWin ? 'win' : 'lose');
      }
    } else if (this.phase === 'roundend') {
      if (this.phaseT > 2.2) {
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
    if (win) {
      save.trainWins++;
      persist();
      xp = 70 + Math.min(save.trainWins, 12) * 20;
      const best = this.trainComboBest || 0;
      trackTrainCombo(best);
      if (best >= 10) xp += 30;
      else if (best >= 8) xp += 20;
      else if (best >= 5) xp += 10;
      this.grantXP(xp);
      bumpDaily('trainWin', 1);
      checkAchievements();
    }
    else { xp = 15; this.grantXP(xp); }
    const trainBest = this.trainComboBest || 0;
    const rec = save.stats.trainMaxCombo || 0;
    const trainTip = win
      ? (trainBest >= 8
        ? t('result.trainComboRecord', { n: trainBest, rec: trainBest >= rec ? t('result.trainComboNewRec') : '' })
        : (save.trainWins === 3 ? t('result.trainStyleUnlock') : t('result.trainStyleMore')))
      : (onceResultTip('training', 'loss', t('result.trainLossTip'))
        || t('result.trainTipDefault'));
    scheduleGameResult(this, 1200, () => UI.showResult(win, {
      title: win ? t('result.trainWin') : t('result.trainLose'),
      detail: t('result.trainDetail', {
        outcome: win ? t('result.trainOutcomeWin') : t('result.trainOutcomeLose'),
        s: this.roundsP, r: this.roundsR, combo: trainBest,
        wins: win ? t('result.trainWinsLine', { n: save.trainWins }) : '',
        record: rec > 0 ? t('result.trainRecordLine', { n: rec }) : '',
        finishers: this.runFinishers ? t('result.finishersLine', { n: this.runFinishers }) : '',
      }) + ((this.trainRoundLog || []).length
        ? ' · ' + this.trainRoundLog.map((w, i) => `R${i + 1} ${w === 'p' ? 'Jij' : 'Bot'}`).join(' · ')
        : ''),
      xp: this.sessionXP, mode: 'training', win,
      tip: trainTip,
    }));
  }

  initVersus(opts) {
    opts = opts || {};
    Input.dualMode = true;
    Input.layout(W, H);
    this.theme = 'dojo';
    this.roundsP1 = 0;
    this.roundsP2 = 0;
    this.round = 0;
    this.vsRoundLog = [];
    this.p1Pick = normalizeVsPick(opts.p1 || vsSelect.p1, 'ryu');
    this.p2Pick = normalizeVsPick(opts.p2 || vsSelect.p2, 'ken');
    vsSelect.p1 = this.p1Pick;
    vsSelect.p2 = this.p2Pick;
    trackVsRosterUse(this.p1Pick, this.p2Pick);
    applyVsArenaBounds(this);
    this.player = buildVsFighter(vsRosterEntry(this.p1Pick), vsSpawnX(1), 1);
    this.p2 = buildVsFighter(vsRosterEntry(this.p2Pick), vsSpawnX(2), 2);
    this.startVsRound();
    AudioSys.play('versus');
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
    const decisive = this.roundsP1 === 1 && this.roundsP2 === 1;
    this.banner(decisive ? t('banner.roundDecisive', { n: this.round }) : (mp ? t('banner.roundMatchPoint', { n: this.round }) : t('banner.round', { n: this.round })), 1.1, decisive ? '#ff9a9a' : '#ffd75e', 52);
    AudioSys.sfx('bell');
  }

  updateVersus(dt) {
    this.phaseT += dt;
    if (this.phase === 'intro') {
      if (this.phaseT > 1.2 && this.phaseT - dt <= 1.2) this.banner(t('banner.fight'), 0.8, '#ff6b6b', 60);
      if (this.phaseT > 1.6) { this.phase = 'fight'; this.inputLocked = false; }
    } else if (this.phase === 'fight') {
      this.roundTimer -= dt;
      const p1d = !this.player.alive, p2d = !this.p2.alive;
      if (p1d || p2d || this.roundTimer <= 0) {
        let p1Win;
        const timedOut = !p1d && !p2d && this.roundTimer <= 0;
        if (p2d && !p1d) p1Win = true;
        else if (p1d && !p2d) p1Win = false;
        else p1Win = (this.player.hp / Math.max(1, this.player.maxhp)) >= (this.p2.hp / Math.max(1, this.p2.maxhp));
        if (p1Win) this.roundsP1++; else this.roundsP2++;
        this.vsRoundLog = this.vsRoundLog || [];
        this.vsRoundLog.push(p1Win ? 'p1' : 'p2');
        this.phase = 'roundend';
        this.phaseT = 0;
        this.inputLocked = true;
        let msg = p1Win ? t('banner.p1RoundWin') : t('banner.p2RoundWin');
        if (timedOut) {
          const hp1 = Math.round(this.player.hp / Math.max(1, this.player.maxhp) * 100);
          const hp2 = Math.round(this.p2.hp / Math.max(1, this.p2.maxhp) * 100);
          msg = t('banner.timeHpVs', { hp1, hp2, msg });
        }
        this.banner(msg, 1.5, p1Win ? '#7cf5ff' : '#ffb0b8', 38);
        AudioSys.sfx(p1Win ? 'win' : 'lose');
      }
    } else if (this.phase === 'roundend') {
      if (this.phaseT > 2.2) {
        if (this.roundsP1 >= 2 || this.roundsP2 >= 2) this.finishVersus(this.roundsP1 >= 2);
        else this.startVsRound();
      }
    }
    if (this.p2) this.p2.update(dt, this);
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
    scheduleGameResult(this, 1200, () => UI.showResult(p1Win, {
      title: p1Win ? t('result.vsP1Win') : t('result.vsP2Win'),
      detail: `${vsRosterEntry(this.p1Pick).name} vs ${vsRosterEntry(this.p2Pick).name} · ${this.roundsP1}-${this.roundsP2}` +
        ((this.vsRoundLog || []).length ? ` · ${this.vsRoundLog.map((w, i) => `R${i + 1} ${w === 'p1' ? 'P1' : 'P2'}`).join(' · ')}` : '') +
        (this.runFinishers ? ` · ${this.runFinishers} finishers` : ''),
      xp: this.sessionXP, mode: 'versus', win: p1Win, p1: this.p1Pick, p2: this.p2Pick,
      tip: t('result.vsRematchTip'),
    }));
  }

  /* ------------------------------ MUUR -------------------------------- */
  initWall() {
    this.theme = 'sloop';
    this.wallTimer = 60;
    this.wallDuration = 60;
    this.wallComboWindow = 1.4;
    this.score = 0; this.combo = 0; this.comboT = 0; this.wallGen = 0;
    this.maxCombo = 0;
    this.wallRecordToast = false;
    this.wallHints = {
      half: false, quarter: false, five: false, comboWarn: false,
      nearRec: false, lostCombo: false, startCombo: false,
      combo3: false, combo5: false, combo8: false,
    };
    this.layoutWall(true);
    this.banner(t('banner.wallStart'), 1.5, '#ffd75e', 46);
    AudioSys.play('wall');
    this.phase = 'fight';
  }

  layoutWall(fresh) {
    // laag en breed, zodat elke steen bereikbaar is (ook springend)
    const bw = 62, bh = 34, cols = 4, rows = 5;
    this.wallX = W - cols * bw - 30;
    this.wallCols = cols;
    this.wallBrickW = bw;
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
    try { AudioSys.setCombatHeat(Math.min(1, (this.combo || 0) / 10)); } catch (_) {}
    const prevTimer = this.wallTimer;
    this.wallTimer -= dt;
    const hints = this.wallHints || (this.wallHints = {});
    if (!hints.half && prevTimer > 30 && this.wallTimer <= 30) {
      hints.half = true;
      this.floater(W / 2, 108, t('combat.wallHalf'), '#7cf5ff', 15);
    }
    if (!hints.quarter && prevTimer > 15 && this.wallTimer <= 15) {
      hints.quarter = true;
      this.floater(W / 2, 108, t('combat.wallLast15'), '#ffd75e', 15);
      if (this.wallTimer < 10) AudioSys.sfx('bonus');
    }
    if (!hints.five && prevTimer > 5 && this.wallTimer <= 5) {
      hints.five = true;
      this.floater(W / 2, 108, t('combat.wallLast5'), '#ff6b6b', 15);
      AudioSys.sfx('bonus');
    }
    const elapsed = (this.wallDuration || 60) - this.wallTimer;
    if (!hints.startCombo && elapsed > 2.5 && elapsed < 9 && this.combo === 0) {
      hints.startCombo = true;
      this.floater(W / 2, 132, t('combat.wallComboTipShort'), '#7cf5ff', 14);
    }
    const prevComboT = this.comboT;
    this.comboT -= dt;
    if (this.comboT <= 0) {
      if (this.combo >= 4 && !hints.lostCombo) {
        hints.lostCombo = true;
        this.floater(W / 2, 120, t('combat.wallComboLost'), '#ff9a9a', 14);
      }
      this.combo = 0;
    } else if (!hints.comboWarn && this.combo >= 3 && prevComboT > 0.35 && this.comboT <= 0.35) {
      hints.comboWarn = true;
      this.floater(W / 2, 120, t('combat.wallComboLow'), '#ff9a9a', 13);
    }
    const bestSaved = save.bestWall || 0;
    if (!hints.nearRec && bestSaved > 0 && this.score > 0) {
      const gap = bestSaved - this.score;
      if (gap > 0 && gap <= 5) {
        hints.nearRec = true;
        this.floater(W / 2, 94, t('combat.wallNearRec', { gap }), '#7cfc8a', 16);
        haptic(12);
      }
    }
    if (this.bricks.every(b => b.hp <= 0)) {
      this.wallGen++;
      this.grantXP(25);
      this.banner(t('banner.wallNewWall'), 1.4, '#7cfc8a', 34);
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
    this.banner(t('banner.wallTime'), 1.5, '#ffd75e', 56);
    const pace = Math.round(this.score); // 60s run → stenen ≈ per minuut
    const paceDelta = wallRecordPaceDelta({ wallTimer: 0, wallDuration: this.wallDuration, score: this.score });
    let tip = isRecord ? t('result.wallRecordShare') : t('result.wallComboTip');
    if (!isRecord && best > 0) {
      const gap = best - this.score;
      if (gap > 0 && gap <= 15) tip = t('result.wallGapTip', { gap });
      else if ((this.maxCombo || 0) < 5) tip = t('result.wallComboBarTip');
      else if ((this.maxCombo || 0) >= 8) tip = t('result.wallStrongCombo', { n: this.maxCombo });
      else if (paceDelta != null && paceDelta < -3) tip = t('result.wallBehindPace');
      else if (paceDelta != null && paceDelta >= 3) tip = t('result.wallGoodPace');
    }
    scheduleGameResult(this, 1200, () => UI.showResult(true, {
      title: isRecord ? t('result.wallRecord') : t('result.wallTime'),
      detail: t('result.wallDetail', {
        score: this.score, pace, best, combo: this.maxCombo || 0,
        paceDelta: paceDelta != null && best > 0 && !isRecord
          ? t('result.wallPaceDelta', { delta: `${paceDelta >= 0 ? '+' : ''}${paceDelta}` }) : '',
      }),
      xp: this.sessionXP, mode: 'wall', win: true,
      tip,
    }));
  }

  /* ------------------------ MATS · MUNTJES BONUS ----------------------- */
  initCoinRun() {
    this.theme = 'cyber';
    this.coinTimer = 45;
    this.coinsCollected = 0;
    this.petCoinsThisRun = 0;
    this.coinPickups = [];
    this.flyers = [];
    this.coinSpawnAcc = 0;
    this.flyerSpawnAcc = 0;
    this.player.weapon = applySummonTier(weaponById('shuriken'));
    this.player.x = W * 0.28;
    this.player.face = 1;
    this.inputLocked = false;
    this.banner(t('banner.matsStart'), 1.5, '#ffd75e', 46);
    AudioSys.play('mats');
  }

  spawnCoinPickup() {
    this.coinPickups.push({
      x: rand(W * 0.15, W * 0.88),
      y: rand(this.ground - 220, this.ground - 60),
      bob: rand(0, TAU),
      got: false,
    });
  }

  spawnFlyer() {
    const fromLeft = Math.random() < 0.5;
    const y = rand(this.ground - 280, this.ground - 90);
    this.flyers.push({
      x: fromLeft ? -40 : W + 40,
      y,
      vx: (fromLeft ? 1 : -1) * rand(120, 200),
      vy: rand(-30, 40),
      r: 22,
      hp: 1,
      wobble: rand(0, TAU),
    });
  }

  updateCoinRun(dt) {
    this.coinTimer -= dt;
    this.coinSpawnAcc += dt;
    this.flyerSpawnAcc += dt;
    while (this.coinSpawnAcc >= 0.75) {
      this.coinSpawnAcc -= 0.75;
      this.spawnCoinPickup();
    }
    while (this.flyerSpawnAcc >= 1.6) {
      this.flyerSpawnAcc -= 1.6;
      if (this.flyers.length < 8) this.spawnFlyer();
    }
    const pl = this.player;
    for (const c of this.coinPickups) {
      if (c.got) continue;
      c.bob += dt * 5;
      if ((pl.bodyX - c.x) ** 2 + (pl.bodyY - (c.y + Math.sin(c.bob) * 6)) ** 2 < 42 * 42) {
        c.got = true;
        this.coinsCollected++;
        AudioSys.sfx('pickup');
        this.floater(c.x, c.y - 20, t('combat.coinPlus1'), '#ffd75e', 15);
        haptic(8);
      }
    }
    this.coinPickups = this.coinPickups.filter(c => !c.got);
    for (const fl of this.flyers) {
      fl.x += fl.vx * dt;
      fl.y += fl.vy * dt;
      fl.wobble += dt * 4;
      fl.vy += Math.sin(fl.wobble) * 40 * dt;
      if (fl.x < -80 || fl.x > W + 80) fl.hp = 0;
    }
    this.flyers = this.flyers.filter(f => f.hp > 0);
    if (this.coinTimer <= 0 && !this.over) this.finishCoinRun();
  }

  finishCoinRun() {
    this.over = true;
    this.inputLocked = true;
    const n = this.coinsCollected;
    const best = Math.max(save.stats.matsCoinBest || 0, n);
    const isRecord = n > (save.stats.matsCoinBest || 0);
    save.stats.matsCoinBest = best;
    const petEarned = matsPetCoinsFromRun(n);
    if (petEarned > 0) {
      save.petCoins = petCoinsBalance() + petEarned;
      this.petCoinsThisRun = petEarned;
    }
    persist();
    const xp = Math.round(n * 4 + 15);
    this.grantXP(xp);
    AudioSys.sfx(isRecord ? 'win' : 'bonus');
    this.banner(t('banner.bonusDone'), 1.4, '#7cfc8a', 40);
    const wallet = petCoinsBalance();
    scheduleGameResult(this, 1200, () => UI.showResult(true, {
      title: isRecord ? t('result.matsRecord') : t('result.matsDone'),
      detail: t('result.matsDetail', {
        n, best,
        pet: petEarned > 0 ? t('result.matsPetEarned', { n: petEarned, wallet }) : '',
        flyers: t('result.matsFlyers'),
      }),
      xp: this.sessionXP,
      mode: 'coinrun',
      win: true,
      tip: petEarned > 0
        ? t('result.matsPetTip')
        : t('result.matsControlTip'),
    }));
  }

  drawCoinRunLayer(c) {
    for (const cn of this.coinPickups) {
      const y = cn.y + Math.sin(cn.bob) * 6;
      c.save();
      c.translate(cn.x, y);
      c.fillStyle = '#ffd75e';
      c.beginPath(); c.arc(0, 0, 14, 0, TAU); c.fill();
      c.strokeStyle = '#c97a20'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#2a1a00'; c.font = '900 12px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('$', 0, 1);
      c.restore();
    }
    for (const fl of this.flyers) {
      c.save();
      c.translate(fl.x, fl.y + Math.sin(fl.wobble) * 8);
      c.fillStyle = 'rgba(255,120,160,.85)';
      c.beginPath(); c.ellipse(0, 0, fl.r, fl.r * 0.65, 0, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.font = '900 11px sans-serif'; c.textAlign = 'center';
      c.fillText('+3', 0, 4);
      c.restore();
    }
  }

  /* -------------------------- GEDEELDE LOGICA ------------------------- */
  grantXP(n) {
    if (this.mode === 'adventure' && this.styleXpMul && this.styleXpMul !== 1) {
      n = Math.round(n * this.styleXpMul);
    }
    this.sessionXP += n;
    save.xp += n;
    while (save.xp >= xpNeed(save.lvl)) {
      save.xp -= xpNeed(save.lvl);
      save.lvl++;
      AudioSys.sfx('levelup');
      this.banner(t('banner.levelUp', { lvl: save.lvl }), 1.8, '#ffd75e', 40);
      const st = playerStats();
      this.player.maxhp = st.maxhp;
      this.player.baseDmg = st.dmg;
      this.player.hp = Math.min(this.player.maxhp, this.player.hp + Math.round(this.player.maxhp * 0.45));
      const unlockedW = WEAPONS.find(w => w.unlock === save.lvl);
      if (unlockedW) {
        setTimeout(() => this.banner(t('banner.newWeapon', { name: weaponLabel(unlockedW) }), 2, '#c792ff', 32), 900);
        AudioSys.sfx('newmonster');
      }
      const newStyle = STYLES.find(s => s.needLvl === save.lvl && styleUnlocked(s));
      if (newStyle) UI.toast(t('toast.styleUnlock', { name: styleLabel(newStyle) }), 3500);
    }
    persist();
  }

  spawnJutsu(f, atk) {
    const jutsu = (atk && atk.jutsu) || fighterJutsuKind(f);
    const jb = jutsuSkillBonuses(jutsu);
    const dmg = (atk ? atk.dmg : f.baseDmg * 2.8);
    const from = this.projFrom(f);
    const critMeta = projCritMeta(f);
    const baseSpd = jutsu === 'chidori' ? 620 : jutsu === 'rinnegan' ? 340 : 420;
    const aim = projAimVelocity(f, baseSpd * jb.speedMul);
    const y0 = f.y - 50 + clamp(aim.ny, -1, 0.5) * 36;
    const fireProj = (offX, offY, scale) => {
      const sc = scale || 1;
      if (jutsu === 'chidori') {
        this.spawnProjectile(Object.assign({
          x: f.x + f.face * (36 + offX), y: y0 + offY,
          vx: aim.vx, vy: aim.vy * 0.85, r: (22 + jb.radius) * sc, dmg: dmg * sc,
          life: 0.35 * jb.lifeMul, from, kind: 'chidori', pierce: false, hitSet: new Set(),
          pierceRepeat: jb.pierceRepeat,
        }, critMeta));
      } else if (jutsu === 'rinnegan') {
        this.spawnProjectile(Object.assign({
          x: f.x + f.face * (38 + offX), y: y0 + offY,
          vx: aim.vx, vy: aim.vy * 0.9, r: (30 + jb.radius) * sc, dmg: dmg * sc,
          from, kind: 'rinnegan', pierce: true, hitSet: new Set(), life: 1.05 * jb.lifeMul,
          spin: 0, pull: true, pullMul: jb.pullMul || 1, extraShot: jb.extraShot,
        }, critMeta));
      } else {
        const face = f.face || 1;
        this.spawnProjectile(Object.assign({
          x: f.x + face * (40 + offX), y: y0 + offY,
          vx: face * baseSpd * jb.speedMul, vy: 0, r: (28 + jb.radius) * sc, dmg: dmg * sc,
          from, kind: 'rasengan', pierce: true, hitSet: new Set(), life: 1.4 * jb.lifeMul,
          spin: 0, extraShot: jb.extraShot,
        }, critMeta));
      }
    };
    if (jutsu === 'chidori') {
      fireProj(0, 0, 1);
      f.vx = f.face * 380 * jb.speedMul;
      this.shake(7, 0.2);
      AudioSys.sfx('chidori');
    } else if (jutsu === 'rinnegan') {
      fireProj(0, 0, 1);
      this.burst(f.x + f.face * 28, y0, '#c47aff', 22);
      this.burst(f.x + f.face * 28, y0, '#ff6b9d', 10);
      this.shake(8, 0.24);
      this.freezeT = Math.max(this.freezeT, 0.05);
      AudioSys.sfx('rinnegan');
      if (f.isPlayer || f.playerSlot) haptic(20);
    } else {
      fireProj(0, 0, 1);
      this.burst(f.x + f.face * 30, y0, '#7cf5ff', fxLite() ? 8 : 16);
      spawnFxRing(this, f.x + f.face * 34, y0, '#7cf5ff', 10);
      this.shake(9, 0.28);
      this.freezeT = Math.max(this.freezeT, 0.06);
      AudioSys.sfx('rasengan');
      if (f.isPlayer || f.playerSlot) haptic(22);
    }
    const extra = (atk && atk.extraShot) || jb.extraShot || 0;
    if (extra > 0 && Math.random() < extra) {
      fireProj(f.face * 12, rand(-8, 8), 0.72);
    }
  }

  throwShuriken(f) {
    if (!canThrowShuriken(f, this)) {
      if (!this._shurikenWarnT || this.t - this._shurikenWarnT > 0.9) {
        this._shurikenWarnT = this.t;
        try {
          UI.toast(f._shurikenCd > 0 ? t('toast.shurikenWait') : t('toast.shurikenSpam'), 1600);
        } catch (_) {}
      }
      return;
    }
    noteShurikenThrow(f, this);
    AudioSys.sfx('shuriken');
    const w = f.weapon;
    const big = w.id === 'fuuma';
    const critMeta = projCritMeta(f);
    const aim = projAimVelocity(f, big ? 500 : 560);
    this.spawnProjectile(Object.assign({
      x: f.x + (f.face || 1) * 24,
      y: f.y - 52 + clamp(aim.ny, -1, 0.5) * 30,
      vx: aim.vx, vy: aim.vy, r: big ? 14 : 10,
      dmg: f.baseDmg * w.dmg * (big ? 1.05 : 0.85),
      from: this.projFrom(f), kind: 'shuriken', life: big ? 1.55 : 1.4, spin: 0,
      throwId: w.id,
    }, critMeta));
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
    const { hx, hy } = meleeHitPoint(f, spec);
    const r = spec.r;
    let hit = false;

    if (this.mode === 'wall' && f.isPlayer) {
      let hits = 0;
      for (const b of this.bricks) {
        if (b.hp <= 0) continue;
        const cx = clamp(hx, b.x, b.x + b.w), cy = clamp(hy, b.y, b.y + b.h);
        if ((hx - cx) ** 2 + (hy - cy) ** 2 < r * r) {
          hits++;
          const hitRoll = rollHitDamage(f, spec, 1 + this.combo * 0.04);
          const dmg = hitRoll.dmg;
          if (hitRoll.crit) applyCritFx(this, cx, cy);
          b.hp -= dmg;
          this.burst(cx, cy, `hsl(${b.hue},45%,55%)`, 5);
          if (b.hp <= 0) {
            this.score++;
            this.combo++; this.comboT = this.wallComboWindow || 1.4;
            this.noteCombo();
            const wh = this.wallHints || {};
            if (this.combo === 3 && !wh.combo3) {
              wh.combo3 = true;
              this.floater(W * 0.5, 136, t('combat.wallCombo3', { pct: wallComboDmgPct(3) }), '#7cf5ff', 15);
            } else if (this.combo === 5 && !wh.combo5) {
              wh.combo5 = true;
              this.floater(W * 0.5, 136, t('combat.wallCombo5', { pct: wallComboDmgPct(5) }), '#7cf5ff', 16);
              AudioSys.sfx('combo');
            } else if (this.combo === 8 && !wh.combo8) {
              wh.combo8 = true;
              this.floater(W * 0.5, 136, t('combat.wallCombo8', { pct: wallComboDmgPct(8) }), '#ffd75e', 17);
              AudioSys.sfx('combo');
              haptic(14);
            }
            if (!this.wallRecordToast && this.score > save.bestWall) {
              this.wallRecordToast = true;
              this.floater(W * 0.5, 118, t('combat.wallRecord'), '#ffd75e', 22);
              haptic(18);
              AudioSys.sfx('bonus');
            }
            this.burst(b.x + b.w / 2, b.y + b.h / 2, `hsl(${b.hue},50%,45%)`, 14);
            AudioSys.sfxAt(b.bonus ? 'explode' : 'brick', b.x + b.w / 2);
            this.shake(b.bonus ? 6 : 3, b.bonus ? 0.16 : 0.12);
            this.floater(b.x + b.w / 2, b.y, this.combo > 1 ? `x${this.combo}!` : '+1', '#ffd75e', 16);
            if (b.bonus) {
              AudioSys.sfx('bonus');
              this.score += 5;
              this.burst(b.x + b.w / 2, b.y + b.h / 2, '#ffd75e', 22);
              this.floater(b.x + b.w / 2, b.y - 22, t('combat.bonus5'), '#7cf5ff', 18);
            }
          } else {
            AudioSys.sfxAt('crack', cx);
          }
          if (hits >= 3) break;
        }
      }
      if (hits > 0) {
        try { AudioSys.sfxAt(weaponHitSfx(f.weapon, spec.dmg), hx); } catch (_) {}
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
          const chainBonus = (f._chainKind === spec.kind && this.combo >= 2) ? 0.18 : 0;
          f._chainKind = spec.kind;
          this.comboT = 1.62 + chainBonus;
          this.noteCombo();
          comboMul = 1 + Math.min(this.combo, 8) * 0.07;
          trackCombo(this.combo);
          if (this.combo === 3 || this.combo === 6 || this.combo === 10) {
            AudioSys.sfx('combo');
            this.floater(f.x + f.face * 30, f.y - 120, t('combat.comboN', { n: this.combo }), '#ffd75e', 17);
          }
        }
        const buff = f.isPlayer ? (this.dmgBuffMul || 1) * (this.stageDmgMul || 1) * (this.styleAdvDmgMul || 1) : 1;
        const finisher = spec.kind === 'weapon' && isWeaponFinisher(f, spec);
        const hitRoll = rollHitDamage(f, spec, comboMul * buff * (finisher ? WEAPON_FINISHER_MUL.dmg : 1));
        if (hitRoll.crit) applyCritFx(this, m.x, m.y);
        const kbHit = scaleKnockback(f.face * spec.kb * (finisher ? WEAPON_FINISHER_MUL.kb : 1), hitRoll.dmg, { crit: hitRoll.crit, kind: spec.kind });
        m.takeDamage(hitRoll.dmg, kbHit, this, { crit: hitRoll.crit, kind: spec.kind });
        applyHitStop(this, spec, { crit: hitRoll.crit, combo: this.combo, heavy: hitRoll.dmg >= 18 });
        applyHitConfirmFx(this, hx, hy, spec);
        if (f.isPlayer && this.styleLightning && !fxLite()) {
          this.burst(m.x, m.y - m.size * 0.5, f.style?.accent || '#7cf5ff', 5, { kind: 'spark', size: 2 });
          if (f.style?.id === 'cyber') spawnFxRing(this, m.x, m.y - m.size * 0.3, '#4ecf6a', 6);
        }
        if (spec.dmg >= 18) this.shake(3, 0.11);
        if (spec.kind === 'weapon') bumpWeaponComboWindow(f, 0.12);
        if (spec.kind === 'weapon' && !isThrowWeapon(f.weapon.id) && spec.moveIdx < 2) {
          f._weaponComboHits = (f._weaponComboHits || 0) + 1;
        }
        if ((f.isPlayer || f.playerSlot) && spec.kind === 'weapon' && !isThrowWeapon(f.weapon.id)) {
          const labels = weaponMoveLabels(f.weapon.id);
          const idx = spec.moveIdx || 0;
          if (labels && labels[idx]) {
            const txt = finisher ? labels[idx] + '!' : labels[idx];
            const col = finisher ? '#ffb830' : (idx === 2 ? '#ffd75e' : 'rgba(255,255,255,.88)');
            this.floater(f.x + f.face * 24, f.y - (118 + idx * 5), txt, col, finisher ? 15 : (idx === 2 ? 13 : 11));
          }
          if (finisher) {
            trackWeaponFinisher(f.weapon.id, this);
            try { AudioSys.sfx('comboEpic'); } catch (_) {}
            if (!fxLite()) {
              this.burst(hx, hy, f.style?.accent || '#ffb830', 8, { kind: 'spark', size: 2.5 });
              spawnFxRing(this, hx, hy, '#ffb830', 12);
            }
            f.energy = clamp(f.energy + WEAPON_FINISHER_MUL.energy, 0, 100);
            bumpWeaponComboWindow(f, 0.18);
          }
        }
        this.player.energy = clamp(this.player.energy + 8, 0, 100);
        try { AudioSys.sfxAt(weaponHitSfx(f.weapon, hitRoll.dmg), m.x); } catch (_) {}
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
        if (this.mode === 'training' && f.isPlayer) {
          this.combo = Math.min(12, this.combo + 1);
          f._chainKind = spec.kind;
          this.comboT = 1.55;
          this.trainRoundBest = Math.max(this.trainRoundBest || 0, this.combo);
          this.trainComboBest = Math.max(this.trainComboBest || 0, this.combo);
          trackCombo(this.combo);
          const goals = this.trainComboGoals || (this.trainComboGoals = {});
          if ([3, 5, 8, 10].includes(this.combo) && !goals[this.combo]) {
            goals[this.combo] = 1;
            AudioSys.sfx('combo');
            const labels = {
              3: t('combat.combo3'),
              5: t('combat.combo5'),
              8: t('combat.combo8'),
              10: t('combat.combo10'),
            };
            this.floater(f.x + f.face * 30, f.y - 130, labels[this.combo], '#ffd75e', 16);
            haptic(8 + this.combo);
          }
        }
        const finisher = spec.kind === 'weapon' && isWeaponFinisher(f, spec);
        const hitRoll = rollHitDamage(f, spec, finisher ? WEAPON_FINISHER_MUL.dmg : 1);
        const kbHit = scaleKnockback(f.face * spec.kb * (finisher ? WEAPON_FINISHER_MUL.kb : 1), hitRoll.dmg, { crit: hitRoll.crit, kind: spec.kind });
        const counter = isCounterHitWindow(tgt);
        const dmg = tgt.takeDamage(hitRoll.dmg, kbHit, this, {
          unblockable: spec.unblockable, attacker: f, kind: spec.kind,
        });
        if (hitRoll.crit) applyCritFx(this, tgt.x, tgt.y);
        const col = tgt.playerSlot === 2 ? '#ffb0b8' : (tgt.isPlayer ? '#ff8080' : '#ffe680');
        this.floater(tgt.x, tgt.y - 115, (counter ? t('combat.counter') + ' ' : '') + '-' + dmg, col, 16);
        this.burst(tgt.bodyX, tgt.bodyY, col, 7);
        applyHitConfirmFx(this, hx, hy, spec);
        if (spec.kind === 'weapon') bumpWeaponComboWindow(f, 0.1);
        if (spec.kind === 'weapon' && !isThrowWeapon(f.weapon.id) && spec.moveIdx < 2) {
          f._weaponComboHits = (f._weaponComboHits || 0) + 1;
        }
        if ((f.isPlayer || f.playerSlot) && spec.kind === 'weapon' && !isThrowWeapon(f.weapon.id)) {
          const labels = weaponMoveLabels(f.weapon.id);
          const idx = spec.moveIdx || 0;
          if (labels && labels[idx]) {
            const txt = finisher ? labels[idx] + '!' : labels[idx];
            this.floater(f.x + f.face * 24, f.y - (118 + idx * 5), txt, finisher ? '#ffb830' : '#ffd75e', finisher ? 14 : 11);
          }
          if (finisher) {
            trackWeaponFinisher(f.weapon.id, this);
            try { AudioSys.sfx('comboEpic'); } catch (_) {}
            bumpWeaponComboWindow(f, 0.14);
          }
        }
        f.energy = clamp(f.energy + 9, 0, 100);
        applyHitStop(this, spec, { crit: hitRoll.crit, combo: this.combo, heavy: hitRoll.dmg >= 18 });
        if (counter) this.freezeT = Math.max(this.freezeT, 0.014);
        this.shake(spec.dmg > 20 ? 4 : 3, 0.12);
        if ((f.isPlayer || f.playerSlot) && save.haptics !== false) haptic(5);
        try { AudioSys.sfxAt(weaponHitSfx(f.weapon, hitRoll.dmg), tgt.x); } catch (_) {}
        hit = true;
      }
    }
    return hit;
  }

  update(dt) {
    if (this.playerHurtCd > 0) this.playerHurtCd -= dt;
    if (this.ketsbamChargeT > 0) {
      if (this.ketsbamCd > 0) this.ketsbamCd -= dt;
      if (this.ketsbamSuperT > 0) this.ketsbamSuperT -= dt;
      this.ketsbamChargeT -= dt;
      this.ketsbamChargePulse = (this.ketsbamChargePulse || 0) + dt;
      this.t += dt;
      if (this.player?.alive) {
        this.player.vx = 0;
        this.player.update(dt, this);
      }
      this.ketsbamChargeAcc = (this.ketsbamChargeAcc || 0) + dt;
      const dur = this.ketsbamChargeDur || KETSBAM_CHARGE_DUR;
      const prog = 1 - this.ketsbamChargeT / dur;
      if (this.ketsbamChargeAcc >= 0.07 && !motionReduced()) {
        this.ketsbamChargeAcc = 0;
        const px = this.player.x;
        const py = this.player.y - 50;
        this.burst(px + rand(-20, 20), py + rand(-30, 10), prog > 0.6 ? '#fff8dc' : '#ffd75e',
          fxLite() ? 2 : 4, { kind: 'spark', size: 2 + prog * 2 });
        if (prog > 0.45 && !fxLite()) {
          this.burst(px, this.player.y + 2, '#ff9a3d', 2, { kind: 'ring' });
        }
      }
      if (this.ketsbamChargeT <= 0 && this.player?.alive) this.player.finishKetsbam(this);
      return;
    }
    if (this.freezeT > 0) { this.freezeT -= dt; return; }
    if (this.mode === 'adventure') this.updateKetsbam(dt);
    this.t += dt;
    if (this.hint > 0) this.hint -= dt;
    this.shakeT = Math.max(0, this.shakeT - dt);

    if (!this.player) return;
    this.player.update(dt, this);
    if (this.pet) this.pet.update(dt);
    if (this.eggPet) this.eggPet.update(dt);

    if (this.mode === 'adventure') this.updateAdventure(dt);
    else if (this.mode === 'training') this.updateTraining(dt);
    else if (this.mode === 'versus') this.updateVersus(dt);
    else if (this.mode === 'wall') this.updateWall(dt);
    else if (this.mode === 'coinrun') this.updateCoinRun(dt);

    for (const m of this.monsters) m.update(dt, this);
    this.monsters = this.monsters.filter(m => m.alive || m.deadT < 1);

    // projectielen
    for (const p of this.projectiles) {
      p.life -= dt;
      p.spin = (p.spin || 0) + dt * (p.kind === 'rasengan' ? 22 : p.kind === 'rinnegan' ? 16 : p.kind === 'shuriken' ? 28 : 12);
      p.vy += (p.grav || 0) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'rasengan') {
        p.r = Math.min(34, (p.r || 26) + dt * 4);
        // Capte chakra-trail — minder frequent bij Lite FX / lag
        if (!motionReduced()) {
          p._trailAcc = (p._trailAcc || 0) + dt;
          const interval = (save.liteFx || Perf.tier >= 1) ? 0.07 : 0.032;
          if (p._trailAcc >= interval) {
            p._trailAcc = 0;
            const n = (save.liteFx || Perf.tier >= 1) ? 1 : 2;
            const back = Math.sign(p.vx || 1) * 10;
            this.burst(p.x - back, p.y + rand(-4, 4), '#7cf5ff', n, { kind: 'spark', size: 2.4 });
          }
        }
      }
      if (p.kind === 'rinnegan') {
        p.r = Math.min(36, (p.r || 30) + dt * 2.5);
        if (!motionReduced() && !fxLite()) {
          p._trailAcc = (p._trailAcc || 0) + dt;
          if (p._trailAcc >= 0.055) {
            p._trailAcc = 0;
            this.burst(p.x, p.y, '#c47aff', 1, { kind: 'spark', size: 2.2 });
          }
        }
      }
      if (p.from === 'enemy') {
        const pl = this.player;
        if (pl && pl.alive && this.playerHurtCd <= 0
            && (p.x - pl.bodyX) ** 2 + (p.y - pl.bodyY) ** 2 < (p.r + pl.bodyR * 0.8) ** 2) {
          const hit = resolveProjHit(p);
          pl.takeDamage(hit.dmg, Math.sign(p.vx) * 260, this);
          applyHitStop(this, { kind: p.kind === 'chidori' ? 'special' : 'punch', dmg: hit.dmg },
            { crit: hit.crit, heavy: hit.dmg >= 18, playerHurt: true });
          this.floater(pl.x, pl.y - 115, '-' + hit.dmg, '#ff8080', 16);
          if (hit.crit) applyCritFx(this, pl.x, pl.y);
          if (p.kind === 'chidori') this.burst(p.x, p.y, '#a8e0ff', 16);
          p.life = 0;
          this.burst(p.x, p.y, p.kind === 'chidori' ? '#a8e0ff' : '#ff9a3d', 8);
        }
      } else if (p.from === 'p2' && this.p2) {
        const pl = this.player;
        if (pl && pl.alive && (p.x - pl.bodyX) ** 2 + (p.y - pl.bodyY) ** 2 < (p.r + pl.bodyR * 0.8) ** 2) {
          projStrikeFighter(this, p, pl, '#ff8080');
        }
      } else if (p.from === 'p1' && this.p2) {
        const pl = this.p2;
        if (pl.alive && (p.x - pl.bodyX) ** 2 + (p.y - pl.bodyY) ** 2 < (p.r + pl.bodyR * 0.8) ** 2) {
          projStrikeFighter(this, p, pl, '#ffb0b8');
        }
      } else {
        for (const m of this.monsters) {
          if (!m.alive) continue;
          const allowRehit = p._rehit && p._rehit.has(m);
          if (p.hitSet && p.hitSet.has(m) && !allowRehit) continue;
          if ((p.x - m.x) ** 2 + (p.y - m.y) ** 2 < (p.r + m.size) ** 2) {
            const hit = resolveProjHit(p);
            m.takeDamage(hit.dmg, Math.sign(p.vx) * 300, this);
            if (hit.crit) applyCritFx(this, m.x, m.y);
            if (p.kind === 'rasengan') {
              spawnJutsuImpactFx(this, p.x, p.y, 'rasengan', 'full');
            }
            if (p.kind === 'rinnegan') this.burst(p.x, p.y, '#c47aff', 10);
            if (allowRehit) {
              if (p._rehit) p._rehit.delete(m);
              if (p.hitSet) p.hitSet.add(m);
            } else if (p.hitSet) {
              if (p.pierceRepeat > 0 && Math.random() < p.pierceRepeat) {
                if (!p._rehit) p._rehit = new Set();
                p._rehit.add(m);
              } else {
                p.hitSet.add(m);
              }
            } else p.life = 0;
          }
        }
        if (this.robot && this.robot.alive && !(p.hitSet && p.hitSet.has(this.robot))) {
          const rb = this.robot;
          if ((p.x - rb.bodyX) ** 2 + (p.y - rb.bodyY) ** 2 < (p.r + rb.bodyR) ** 2) {
            const hit = resolveProjHit(p);
            const d = rb.takeDamage(hit.dmg, Math.sign(p.vx) * 300, this);
            this.floater(rb.x, rb.y - 115, '-' + d, '#ffe680', 16);
            if (hit.crit) applyCritFx(this, rb.x, rb.y);
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
        if (this.mode === 'coinrun' && this.flyers && p.kind === 'shuriken' && p.from === 'player') {
          for (const fl of this.flyers) {
            if (fl.hp <= 0) continue;
            if ((p.x - fl.x) ** 2 + (p.y - fl.y) ** 2 < (p.r + fl.r) ** 2) {
              fl.hp = 0;
              this.coinsCollected += 3;
              this.floater(fl.x, fl.y - 24, t('combat.coinPlus3'), '#ffd75e', 17);
              this.burst(fl.x, fl.y, '#ffd75e', 12);
              AudioSys.sfx('bonus');
              haptic(12);
              p.life = 0;
              break;
            }
          }
        }
      }
      if (p.y > this.ground + 10 || p.x < -60 || p.x > W + 60) p.life = 0;
    }
    for (const p of this.projectiles) {
      if (p.life <= 0 && !p._impactFx && (p.kind === 'rasengan' || p.kind === 'rinnegan' || p.kind === 'chidori')) {
        p._impactFx = true;
        spawnJutsuImpactFx(this, p.x, p.y, p.kind, 'small');
      }
    }
    this.projectiles = this.projectiles.filter(p => p.life > 0);

    // deeltjes & tekstjes
    for (const pt of this.particles) {
      pt.life -= dt;
      if (pt.kind !== 'ring') {
        pt.vy += (pt.grav || 900) * dt;
        pt.x += pt.vx * dt; pt.y += pt.vy * dt;
        if (pt.y > this.ground && pt.vy > 0) { pt.y = this.ground; pt.vy *= -0.4; }
      }
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
    const comboSfx = (n) => (n >= 15 ? 'comboMega' : n >= 10 ? 'comboEpic' : 'combo');
    if (this.mode === 'wall' && (this.combo === 5 || this.combo === 8 || this.combo === 10)) {
      AudioSys.sfx(comboSfx(this.combo));
      const msg = this.combo === 8 ? t('combat.wallTempo') : t('combat.comboN', { n: this.combo });
      this.floater(W * 0.5, 130, msg, '#7cf5ff', 18);
    }
    if (this.mode === 'adventure' && (this.combo === 6 || this.combo === 10)) {
      AudioSys.sfx(comboSfx(this.combo));
      this.floater(W * 0.5, 118, t('combat.comboN', { n: this.combo }), '#ffd75e', 16);
    }
    if ([5, 10, 15].includes(this.combo) && this.player && !motionReduced()) {
      const col = this.combo >= 10 ? '#ffd75e' : '#7cf5ff';
      spawnFxRing(this, this.player.x, this.player.y - 50, col, 9 + this.combo * 0.35);
      if (this.combo === 5 || this.combo === 10 || this.combo === 15) AudioSys.sfx(comboSfx(this.combo));
    }
    if (this.combo === 3 || this.combo === 5 || this.combo === 8 || this.combo === 10) {
      haptic(14 + this.combo);
    }
  }

  shake(mag, dur) {
    if (save.shake === false || motionReduced()) return;
    this.shakeMag = mag; this.shakeT = Math.max(this.shakeT, dur);
  }
  burst(x, y, color, n, opts) {
    opts = opts || {};
    const kind = opts.kind || 'square';
    const floorN = kind === 'spark' ? 1 : 2;
    if (motionReduced()) n = Math.max(floorN, Math.floor(n * 0.45));
    else if (save.liteFx || Perf.tier >= 1) n = Math.max(kind === 'spark' ? 1 : 3, Math.floor(n * 0.65));
    if (Perf.tier >= 2) n = Math.max(floorN, Math.floor(n * 0.55));
    if (!perfFxBudgetAllow(this, Math.min(n, 4))) n = Math.max(floorN, Math.floor(n * 0.45));
    if (n <= 0 || perfFxRoom(this, 'particle') <= 0) return;
    ensureParticleRoom(this, Math.min(n, 12));
    const cap = fxCaps();
    const room = cap.particles - this.particles.length;
    n = Math.min(n, Math.max(0, room));
    if (n <= 0) return;
    const baseSize = opts.size || 0;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const sp = kind === 'spark' ? rand(20, 90) : rand(60, 320);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (kind === 'spark' ? 40 : 120),
        life: kind === 'spark' ? rand(0.12, 0.28) : rand(0.3, 0.7),
        color,
        size: baseSize || rand(2, 5),
        kind,
        grav: kind === 'spark' ? 200 : 900,
      });
    }
  }
  floater(x, y, txt, color, size) {
    if (!perfFxBudgetAllow(this, 1)) return;
    if (perfFxRoom(this, 'floater') <= 0) return;
    const cap = fxCaps();
    if (this.floaters.length >= cap.floaters) this.floaters.shift();
    this.floaters.push({ x, y, txt, color, size: size || 15, life: 1.0 });
  }
  banner(txt, dur, color, size) {
    if (!perfFxBudgetAllow(this, 1)) return;
    if (perfFxRoom(this, 'banner') <= 0) return;
    if (motionReduced()) {
      dur = Math.min(dur, 1.15);
      size = Math.min(size || 40, 32);
    }
    const lane = pickBannerLane(this.banners);
    this.banners = this.banners.filter((b) => b.lane !== lane);
    this.banners.push({
      txt, dur, color: color || '#fff', size: size || 40, t: 0, lane,
    });
  }

  drawBannerLine(c, b) {
    const k = b.t / b.dur;
    const calm = motionReduced();
    const pop = calm ? 1 : (k < 0.15 ? k / 0.15 : 1);
    const fade = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
    const lane = typeof b.lane === 'number' ? b.lane : 1;
    const laneScale = lane === 1 ? 1 : 0.92;
    const y = bannerLaneY(H, lane, b.size);
    c.save();
    c.globalAlpha = fade;
    c.translate(W / 2, y);
    c.scale(
      (calm ? 1 : (0.6 + pop * 0.4)) * laneScale,
      (calm ? 1 : (0.6 + pop * 0.4)) * laneScale,
    );
    if (!fxLite() && !calm) {
      c.shadowColor = b.color;
      c.shadowBlur = lane === 1 ? 14 : 9;
    }
    c.font = `900 ${b.size}px -apple-system, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const tw = c.measureText(b.txt).width;
    const ph = b.size * 1.05;
    const pw = tw + 28;
    c.fillStyle = 'rgba(6,10,24,.42)';
    this.rr(c, -pw * 0.5, -ph * 0.52, pw, ph, Math.min(10, ph * 0.22));
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,.08)';
    c.lineWidth = 1.5;
    this.rr(c, -pw * 0.5, -ph * 0.52, pw, ph, Math.min(10, ph * 0.22));
    c.stroke();
    if (a11yHighContrast()) {
      fillHudText(c, b.txt, 0, 0, { fill: b.color, stroke: 'rgba(0,0,0,.9)', strokeW: 4 });
    } else {
      c.lineWidth = 8;
      c.strokeStyle = 'rgba(0,0,0,.55)';
      c.strokeText(b.txt, 0, 0);
      c.fillStyle = b.color;
      c.fillText(b.txt, 0, 0);
    }
    if (!fxLite() && !calm && fade > 0.35 && lane === 1) {
      c.globalAlpha = fade * 0.42;
      c.strokeStyle = b.color;
      c.lineWidth = 2.5;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-tw * 0.52, ph * 0.42);
      c.lineTo(tw * 0.52, ph * 0.42);
      c.stroke();
      const sweep = clamp((k - 0.12) / 0.55, 0, 1);
      if (sweep > 0 && sweep < 1) {
        c.save();
        c.globalAlpha = fade * 0.28 * (1 - Math.abs(sweep - 0.5) * 1.6);
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = '#fff';
        const bandW = Math.max(18, tw * 0.14);
        const sx = -tw * 0.58 + (tw * 1.16 * sweep);
        c.beginPath();
        c.moveTo(sx, -b.size * 0.62);
        c.lineTo(sx + bandW, -b.size * 0.62);
        c.lineTo(sx + bandW * 0.55, b.size * 0.55);
        c.lineTo(sx - bandW * 0.2, b.size * 0.55);
        c.closePath();
        c.fill();
        c.restore();
      }
    }
    c.restore();
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
  }

  /* ------------------------------ TEKENEN ----------------------------- */
  draw(c) {
    if (!c || W < 8 || H < 8) return;
    c.save();
    if (this.shakeT > 0) {
      c.translate(rand(-1, 1) * this.shakeMag, rand(-1, 1) * this.shakeMag);
    }
    drawBackground(c, this.theme, this.t, this.ground, this.worldX || 0,
      this.mode === 'adventure' && this.level ? {
        pr: this.progressSmooth || 0,
        part: this.stagePart || 1,
        boss: !!this.level.boss,
      } : null);

    if (this.mode === 'versus' && this.vsMid) {
      c.save();
      c.strokeStyle = 'rgba(255,255,255,.09)';
      c.setLineDash([8, 12]);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(this.vsMid, this.ground - 100);
      c.lineTo(this.vsMid, H);
      c.stroke();
      c.setLineDash([]);
      if (this.phase === 'intro') {
        const sx1 = vsSpawnX(1);
        const sx2 = vsSpawnX(2);
        c.setLineDash([4, 8]);
        c.strokeStyle = 'rgba(124,245,255,.35)';
        c.beginPath(); c.moveTo(sx1, this.ground - 72); c.lineTo(sx1, H); c.stroke();
        c.strokeStyle = 'rgba(255,176,184,.35)';
        c.beginPath(); c.moveTo(sx2, this.ground - 72); c.lineTo(sx2, H); c.stroke();
        c.setLineDash([]);
        c.font = '800 9px sans-serif';
        c.fillStyle = 'rgba(124,245,255,.65)';
        c.textAlign = 'center';
        c.fillText('P1 spawn', sx1, this.ground - 78);
        c.fillStyle = 'rgba(255,176,184,.65)';
        c.fillText('P2 spawn', sx2, this.ground - 78);
      }
      c.font = '800 10px sans-serif';
      c.fillStyle = 'rgba(124,245,255,.5)';
      c.textAlign = 'left';
      c.fillText('P1', Math.max(10, this.minX), this.ground - 6);
      c.fillStyle = 'rgba(255,176,184,.5)';
      c.textAlign = 'right';
      c.fillText('P2', Math.min(W - 10, this.maxX), this.ground - 6);
      c.textAlign = 'center';
      c.restore();
    }

    if (this.mode === 'adventure' && this.pickups) {
      for (const pk of this.pickups) {
        const meta = PICKUP_META[pk.kind] || PICKUP_META.heal;
        const pkCol = (pk.kind === 'skill_shard' && pk.skillId && SKILL_DEFS[pk.skillId])
          ? SKILL_DEFS[pk.skillId].color
          : (pk.kind === 'item_shard' && pk.itemCat && pk.itemId)
            ? itemUpgradeColor(pk.itemCat, pk.itemId)
            : meta.color;
        const y = pk.y + (pk.bob || 0);
        c.save();
        const pkBlur = (save.liteFx || Perf.tier >= 1 || motionReduced()) ? 0 : 14;
        c.shadowColor = pkCol; c.shadowBlur = pkBlur;
        c.fillStyle = pkCol;
        c.beginPath(); c.arc(pk.x, y, 14, 0, TAU); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 2;
        c.beginPath(); c.arc(pk.x, y, 14, 0, TAU); c.stroke();
        drawPickupIcon(c, pk.kind, pk.x, y, pkCol);
        c.restore();
      }
    }

    if (this.mode === 'wall') this.drawWall(c);
    if (this.mode === 'coinrun') this.drawCoinRunLayer(c);

    if (this.mode === 'adventure') this.drawApproachingWave(c);
    if (this.mode === 'adventure') this.drawTravelSpeedLines(c);
    for (const m of this.monsters) m.draw(c);
    if (this.robot) this.robot.draw(c);
    if (this.p2) this.p2.draw(c);
    if (this.eggPet) this.eggPet.draw(c);
    if (this.pet) this.pet.draw(c);
    this.player.draw(c);

    // projectielen
    for (const p of this.projectiles) {
      c.save();
      if (p.kind === 'rasengan') {
        if (!fxLite() && !motionReduced()) {
          c.save();
          c.globalAlpha = 0.28 + Math.sin((p.spin || 0) * 2.1) * 0.12;
          c.strokeStyle = '#7cf5ff';
          c.lineWidth = 2;
          c.beginPath();
          c.arc(p.x, p.y, p.r * (1.22 + Math.sin(p.spin * 1.4) * 0.06), 0, TAU);
          c.stroke();
          c.restore();
        }
        drawJutsuOrb(c, p.x, p.y, p.r, p.spin || 0, 'rasengan', 1);
      } else if (p.kind === 'chidori') {
        drawJutsuOrb(c, p.x, p.y, p.r, p.spin || 0, 'chidori', 1);
      } else if (p.kind === 'rinnegan') {
        drawJutsuOrb(c, p.x, p.y, p.r, p.spin || 0, 'rinnegan', 1);
      } else if (p.kind === 'shuriken') {
        c.translate(p.x, p.y); c.rotate(p.spin || 0);
        const big = p.throwId === 'fuuma';
        c.fillStyle = big ? '#9aa8bc' : '#c9d6e8';
        const tip = big ? 18 : 12;
        for (let i = 0; i < 4; i++) {
          c.rotate(Math.PI / 2);
          c.beginPath(); c.moveTo(0, 0); c.lineTo(big ? 5 : 3, big ? -5 : -3); c.lineTo(tip, 0); c.lineTo(big ? 5 : 3, big ? 5 : 3); c.closePath(); c.fill();
        }
        if (big) {
          c.fillStyle = '#3a4560'; c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.fill();
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
      if (pt.kind === 'ring') {
        const maxL = pt.maxLife || 0.34;
        const t = 1 - clamp(pt.life / maxL, 0, 1);
        c.strokeStyle = pt.color;
        c.lineWidth = 2.2 * (1 - t * 0.45);
        c.globalAlpha = clamp(pt.life * 3.2, 0, 0.88);
        c.beginPath();
        c.arc(pt.x, pt.y, pt.size * (1 + t * 1.1), 0, TAU);
        c.stroke();
        if (!fxLite() && t < 0.55) {
          c.globalAlpha = clamp(pt.life * 1.8, 0, 0.35);
          c.lineWidth = 1.2;
          c.beginPath();
          c.arc(pt.x, pt.y, pt.size * (0.55 + t * 0.65), 0, TAU);
          c.stroke();
        }
        continue;
      }
      c.fillStyle = pt.color;
      if (pt.kind === 'spark') {
        c.beginPath();
        c.arc(pt.x, pt.y, pt.size, 0, TAU);
        c.fill();
      } else {
        c.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      }
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
    if (this.mode === 'adventure') this.drawKetsbamChargeAura(c);

    this.drawHUD(c);
    if (this.mode === 'adventure') this.drawKetsbamPrompt(c);

    // banners — max 3 lanes, geen overlap
    const bannerDraw = this.banners.slice().sort((a, b) => (a.lane || 0) - (b.lane || 0));
    for (const b of bannerDraw) this.drawBannerLine(c, b);

    if (IS_TOUCH) this.drawTouchControls(c);

    if (this.hint > 0) {
      c.globalAlpha = clamp(this.hint, 0, 1);
      let hintTxt = this.modeHintLine;
      if (!hintTxt) {
        if (Input.dualMode && IS_TOUCH) {
          hintTxt = t('hud.hintDualTouch');
        } else if (Input.dualMode) {
          hintTxt = t('hud.hintDualKb');
        } else if (IS_TOUCH) {
          hintTxt = t('hud.hintTouch');
        } else {
          hintTxt = t('hud.hintKb');
        }
      }
      c.font = '600 15px -apple-system, sans-serif';
      c.textAlign = 'center';
      const tw = c.measureText(hintTxt).width;
      const padX = 16;
      const pillY = H * 0.2 - 24;
      c.fillStyle = 'rgba(6,10,24,.78)';
      this.rr(c, W / 2 - tw / 2 - padX, pillY, tw + padX * 2, 30, 10);
      c.fill();
      c.strokeStyle = 'rgba(255,215,94,.35)';
      c.lineWidth = a11yHighContrast() ? 2.5 : 1.5;
      this.rr(c, W / 2 - tw / 2 - padX, pillY, tw + padX * 2, 30, 10);
      c.stroke();
      fillHudText(c, hintTxt, W / 2, H * 0.2, {
        fill: '#fff',
        stroke: 'rgba(0,0,0,.85)',
        strokeW: a11yHighContrast() ? 3.5 : 0,
      });
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
        drawStarShape(c, b.x + b.w / 2, b.y + b.h / 2, 7, '#ffd75e', true);
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

  drawSuperMeterFill(c, x, y, w, h, pct, kind, t) {
    pct = clamp(pct, 0, 1);
    const ready = pct >= 1;
    const calm = motionReduced();
    c.save();
    if (kind === 'chidori') {
      const seg = 10;
      const segW = w / seg;
      for (let i = 0; i < seg; i++) {
        const segStart = i / seg;
        if (pct <= segStart) continue;
        const fill = Math.min(1, (pct - segStart) * seg);
        if (fill <= 0.01) continue;
        const flick = calm ? 0.85 : (0.7 + Math.sin(t * 24 + i * 1.9) * 0.3);
        c.fillStyle = ready ? `rgba(168,224,255,${flick})` : `rgba(80,160,255,${0.45 + fill * 0.45})`;
        this.rr(c, x + i * segW + 1, y + 1, Math.max(1, segW * fill - 2), h - 2, 2);
        c.fill();
      }
    } else if (kind === 'rinnegan') {
      const rings = 6;
      for (let i = 0; i < rings; i++) {
        const segStart = i / rings;
        if (pct <= segStart) continue;
        const fill = Math.min(1, (pct - segStart) * rings);
        const pulse = calm ? 0.7 : (0.55 + Math.sin(t * 9 + i * 1.1) * 0.25);
        c.fillStyle = ready ? `rgba(196,122,255,${pulse})` : `rgba(100,40,160,${0.35 + fill * 0.45})`;
        const rw = w / rings;
        this.rr(c, x + i * rw + 1, y + 1, Math.max(1, rw * fill - 2), h - 2, 3);
        c.fill();
      }
      if (pct > 0.2 && !fxLite() && !calm) {
        c.strokeStyle = `rgba(255,120,160,${0.25 + Math.sin(t * 6) * 0.12})`;
        c.lineWidth = 1;
        c.beginPath();
        c.arc(x + w * pct * 0.5, y + h * 0.5, h * 1.4, t * 3, t * 3 + Math.PI);
        c.stroke();
      }
    } else {
      const fw = w * pct;
      if (fw > 1) {
        const g = c.createLinearGradient(x, y, x + fw, y + h);
        g.addColorStop(0, '#1a5cff');
        g.addColorStop(0.55, '#3db8ff');
        g.addColorStop(1, ready ? '#9af5ff' : '#5ad0ff');
        c.fillStyle = g;
        this.rr(c, x, y, fw, h, 5);
        c.fill();
        if (pct > 0.12 && !fxLite() && !calm) {
          c.strokeStyle = `rgba(230,250,255,${0.28 + Math.sin(t * 7) * 0.12})`;
          c.lineWidth = 1.2;
          const cx = x + fw * 0.55;
          const cy = y + h * 0.5;
          c.beginPath();
          for (let a = 0; a <= TAU * 1.6; a += 0.35) {
            const r = Math.min(fw, h * 2) * 0.22 * (a / (TAU * 1.6));
            const px = cx + Math.cos(a + t * 5) * r;
            const py = cy + Math.sin(a + t * 5) * r * 0.55;
            if (a === 0) c.moveTo(px, py); else c.lineTo(px, py);
          }
          c.stroke();
        }
      }
    }
    c.restore();
  }

  drawChakraReadyFx(c) {
    const fighters = [this.player];
    if (this.p2) fighters.push(this.p2);
    const calm = motionReduced();
    for (const f of fighters) {
      if (!f || !f.alive || f.energy < 100) continue;
      const kind = fighterJutsuKind(f);
      if (calm) {
        c.save();
        c.globalAlpha = 0.42;
        c.strokeStyle = f.playerSlot === 2 ? '#ffb0b8' : (kind === 'chidori' ? '#a8e0ff' : kind === 'rinnegan' ? '#c47aff' : '#7cf5ff');
        c.lineWidth = 2;
        c.beginPath();
        c.arc(f.x, f.y - 55, 36, 0, TAU);
        c.stroke();
        c.restore();
        continue;
      }
      const pulse = 0.35 + Math.sin(this.t * 7) * 0.15;
      c.save();
      c.globalAlpha = pulse;
      if (kind === 'chidori') {
        c.strokeStyle = f.playerSlot === 2 ? '#ffb0b8' : '#a8e0ff';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(f.x, f.y - 55, 38 + Math.sin(this.t * 11) * 5, 0, TAU);
        c.stroke();
        c.globalAlpha = pulse * 0.6;
        for (let i = 0; i < 3; i++) {
          c.beginPath();
          c.moveTo(f.x - 20, f.y - 60 + i * 12);
          c.lineTo(f.x + 28, f.y - 52 + i * 10);
          c.stroke();
        }
      } else if (kind === 'rinnegan') {
        c.strokeStyle = f.playerSlot === 2 ? '#ffb0b8' : '#c47aff';
        c.lineWidth = 3;
        for (let ring = 0; ring < 3; ring++) {
          c.beginPath();
          c.arc(f.x, f.y - 55, 34 + ring * 8 + Math.sin(this.t * 8 + ring) * 3, this.t * (1.5 + ring * 0.3), this.t * (1.5 + ring * 0.3) + Math.PI * 1.25);
          c.stroke();
        }
        c.fillStyle = '#ff6b9d';
        for (let i = 0; i < 3; i++) {
          const a = this.t * 5 + i * (TAU / 3);
          c.beginPath();
          c.arc(f.x + Math.cos(a) * 28, f.y - 55 + Math.sin(a) * 10, 4, 0, TAU);
          c.fill();
        }
      } else {
        c.strokeStyle = f.playerSlot === 2 ? '#ffb0b8' : '#7cf5ff';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(f.x, f.y - 55, 38 + Math.sin(this.t * 9) * 4, 0, TAU);
        c.stroke();
        c.globalAlpha = pulse * 0.5;
        c.beginPath();
        c.arc(f.x, f.y - 55, 48 + Math.sin(this.t * 6) * 3, this.t * 2, this.t * 2 + Math.PI * 1.2);
        c.stroke();
      }
      c.restore();
    }
  }

  /** Deel 2: volgende golf komt als silhouetten aanlopen tijdens de reis. */
  drawApproachingWave(c) {
    if (!(this.wavePause > 0) || !this.level) return;
    const nextIdx = this.waveIdx + 1;
    const next = this.level.waves[nextIdx];
    if (!next || !next.length) return;
    const totalPause = this.wavePauseTotal || 1.55;
    const f = clamp(1 - this.wavePause / totalPause, 0, 1);
    const count = Math.min(4, next.length);
    c.save();
    for (let i = 0; i < count; i++) {
      const def = next[i];
      const sp = SPECIES[def.sp];
      if (!sp) continue;
      const size = (sp.size || 24) * (def.elite ? 1.4 : 1) * (def.superBoss ? 1.32 : 1);
      const flying = sp.type === 'fly' || sp.type === 'dragon';
      const bob = Math.sin(this.t * 6 + i * 1.7) * (flying ? 8 : 2.5);
      // van ver (klein, rechts) naar dichtbij
      const x = W + 60 - f * (140 + i * 12) + i * 44;
      if (x > W + 50) continue;
      const y = flying ? this.ground - 120 + bob : this.ground - size * (0.55 + f * 0.45) + bob;
      const scale = 0.45 + f * 0.55;
      c.globalAlpha = 0.2 + f * 0.35;
      c.fillStyle = def.superBoss ? 'rgba(255,215,94,.9)' : (def.elite ? 'rgba(255,138,154,.85)' : (sp.c2 || '#20263f'));
      c.beginPath();
      c.ellipse(x, y, size * scale, size * scale * 0.88, 0, 0, TAU);
      c.fill();
      // ogen-glimp zodat het "iets levends" is
      c.globalAlpha = 0.35 + f * 0.5;
      c.fillStyle = '#fff';
      const eye = Math.max(1.6, size * scale * 0.13);
      c.beginPath(); c.arc(x - size * scale * 0.28, y - size * scale * 0.2, eye, 0, TAU); c.fill();
      c.beginPath(); c.arc(x + size * scale * 0.02, y - size * scale * 0.22, eye, 0, TAU); c.fill();
    }
    c.restore();
    c.globalAlpha = 1;
  }

  /** Preview van volgende golf tijdens reis — kleine silhouet-chips. */
  drawNextWavePreview(c) {
    const nextIdx = this.waveIdx + 1;
    const next = this.level && this.level.waves[nextIdx];
    if (!next || !next.length) return;
    const meta = this.level.waveMeta && this.level.waveMeta[nextIdx];
    const chips = Math.min(5, next.length);
    const gap = 22;
    const x0 = W / 2 - ((chips - 1) * gap) / 2;
    const y = H - 52;
    c.save();
    c.font = '700 9px sans-serif';
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.textAlign = 'center';
    c.fillText(t('hud.nextWave'), W / 2, y - 14);
    for (let i = 0; i < chips; i++) {
      const def = next[i];
      const sp = SPECIES[def.sp];
      if (!sp) continue;
      const cx = x0 + i * gap;
      const flying = sp.type === 'fly' || sp.type === 'dragon';
      const col = def.superBoss ? '#ffd75e' : (def.elite ? '#ffb0b8' : (sp.c2 || '#8899bb'));
      c.fillStyle = col;
      c.globalAlpha = 0.75;
      c.beginPath();
      c.arc(cx, y + (flying ? -5 : 0), 6 + (def.elite ? 1.5 : 0), 0, TAU);
      c.fill();
      if (flying) {
        c.strokeStyle = 'rgba(196,122,255,.7)';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(cx - 5, y - 2);
        c.lineTo(cx + 5, y - 2);
        c.stroke();
      }
    }
    if (meta && meta.label) {
      c.globalAlpha = 0.85;
      c.fillStyle = meta.trait === 'flyers' ? '#c47aff' : (meta.trait === 'rush' ? '#ffb06a' : '#ffb0b8');
      c.fillText(meta.label, W / 2, y + 16);
    }
    c.restore();
    c.globalAlpha = 1;
    c.textAlign = 'center';
  }

  /** Deel 3: speed-lines tijdens de reis — geeft vaart zonder echte camera. */
  drawTravelSpeedLines(c) {
    if (!this.traveling || fxLite() || motionReduced()) return;
    c.save();
    c.strokeStyle = 'rgba(255,255,255,.16)';
    c.lineWidth = 2;
    c.lineCap = 'round';
    const scroll = this.worldX || 0;
    for (let i = 0; i < 7; i++) {
      const y = this.ground - 30 - ((i * 97) % Math.max(80, this.ground - 120));
      const len = 46 + (i * 31) % 60;
      const x = W - (((scroll * (2.4 + (i % 3) * 0.8)) + i * 240) % (W + len)) ;
      c.globalAlpha = 0.1 + (i % 3) * 0.05;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + len, y);
      c.stroke();
    }
    c.restore();
    c.globalAlpha = 1;
  }

  /** Deel 3: checkpoint-flits + baas-aankomst overlays (boven de wereld, onder HUD-tekst). */
  drawStageBeatFx(c) {
    if (this.partFlashT > 0 && !motionReduced()) {
      const f = clamp(this.partFlashT / 0.5, 0, 1);
      const g = c.createRadialGradient(W / 2, 44, 10, W / 2, 44, H * 0.9);
      g.addColorStop(0, `rgba(124,245,255,${0.26 * f})`);
      g.addColorStop(0.4, `rgba(124,245,255,${0.09 * f})`);
      g.addColorStop(1, 'rgba(124,245,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    // Rustige rode hartslag terwijl je naar de baas-golf reist
    if (this.wavePause > 0 && isBossWave(this.level, this.waveIdx + 1) && !motionReduced()) {
      const f = clamp(1 - this.wavePause / (this.wavePauseTotal || 1), 0, 1);
      const beat = Math.max(0, Math.sin(this.t * 6.5));
      const a = 0.05 * f + beat * beat * 0.06 * f;
      const g = c.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.9);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(200,30,50,${a})`);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    if (this.bossArriveT > 0) {
      const f = clamp(this.bossArriveT / 0.7, 0, 1);
      const mul = motionReduced() ? 0.45 : 1;
      const g = c.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.95);
      g.addColorStop(0, `rgba(255,90,90,${0.1 * f * mul})`);
      g.addColorStop(1, `rgba(160,10,30,${0.28 * f * mul})`);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
  }

  /** Stage-voortgang: balk in 3 delen + lopend bolletje (vervangt wave-pips). */
  drawStageProgress(c) {
    if (!this.level || !this.level.waves) return;
    const total = this.level.waves.length;
    const tw = Math.min(320, W * 0.5);
    const x0 = W / 2 - tw / 2;
    const y = 44;
    const target = this.stageProgress();
    if (this.progressSmooth == null) this.progressSmooth = target;
    this.progressSmooth += (target - this.progressSmooth) * (motionReduced() ? 0.25 : 0.09);
    if (Math.abs(target - this.progressSmooth) < 0.002) this.progressSmooth = target;
    const pr = clamp(this.progressSmooth, 0, 1);

    // 3 segmenten
    const segGap = 6;
    const segW = (tw - segGap * 2) / 3;
    for (let s = 0; s < 3; s++) {
      const sx = x0 + s * (segW + segGap);
      c.fillStyle = 'rgba(0,0,0,.5)';
      this.rr(c, sx - 1, y - 5, segW + 2, 10, 5); c.fill();
      c.fillStyle = 'rgba(255,255,255,.14)';
      this.rr(c, sx, y - 4, segW, 8, 4); c.fill();
      const f = clamp(pr * 3 - s, 0, 1);
      if (f > 0.01) {
        c.fillStyle = s === 2 && this.level.boss ? '#ff8a9a' : '#ffd75e';
        this.rr(c, sx, y - 4, segW * f, 8, 4); c.fill();
      }
    }
    // golf-streepjes
    c.fillStyle = 'rgba(255,255,255,.4)';
    for (let i = 1; i < total; i++) {
      const tx = x0 + (i / total) * tw;
      c.fillRect(tx - 1, y - 3, 2, 6);
    }
    // checkpoint-diamantjes op de deel-grenzen (deel 3-polish)
    for (let s = 1; s <= 2; s++) {
      const cx = x0 + s * (segW + segGap) - segGap / 2;
      const passed = pr * 3 >= s;
      const justFlash = passed && this.partFlashT > 0 && Math.min(3, 1 + Math.floor(pr * 3)) === s + 1;
      const r = justFlash && !motionReduced() ? 5.5 + Math.sin(this.t * 18) * 1.2 : (justFlash ? 5 : 4);
      c.save();
      c.translate(cx, y);
      c.rotate(Math.PI / 4);
      c.fillStyle = passed ? (justFlash ? '#bffaff' : '#7cf5ff') : 'rgba(255,255,255,.25)';
      c.fillRect(-r / 2, -r / 2, r, r);
      c.restore();
    }
    // baas-vlag aan het einde (getekend — art-upgrade 3/4)
    if (this.level.boss) {
      const fx0 = x0 + tw + 9;
      const wave = motionReduced() ? 0 : Math.sin(this.t * 5) * 1.2;
      c.strokeStyle = '#ff8a9a'; c.lineWidth = 2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(fx0, y - 8); c.lineTo(fx0, y + 8); c.stroke();
      c.fillStyle = '#ff8a9a';
      c.beginPath();
      c.moveTo(fx0 + 1, y - 8);
      c.quadraticCurveTo(fx0 + 6, y - 7 + wave, fx0 + 11, y - 5);
      c.lineTo(fx0 + 1, y - 1);
      c.closePath();
      c.fill();
    }
    // bolletje
    const bx = x0 + pr * tw;
    const pulse = motionReduced() ? 0 : Math.sin(this.t * (this.traveling ? 12 : 6)) * 1.2;
    c.fillStyle = 'rgba(0,0,0,.4)';
    c.beginPath(); c.arc(bx, y, 9.5 + pulse * 0.4, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(bx, y, 8 + pulse * 0.4, 0, TAU); c.fill();
    c.fillStyle = this.traveling ? '#7cf5ff' : '#ffd75e';
    c.beginPath(); c.arc(bx, y, 5 + pulse * 0.3, 0, TAU); c.fill();
    // deel-label
    c.font = '700 10px sans-serif';
    c.textAlign = 'left';
    c.fillStyle = 'rgba(255,255,255,.6)';
    c.fillText(t('hud.part', { cur: Math.min(3, 1 + Math.floor(pr * 3)) }), x0 + tw + (this.level.boss ? 24 : 10), y + 3.5);
    // golf-pips (d4 c3): expliciete golf 1/N onder de balk
    const pipY = y + 16;
    const pipGap = Math.min(14, (tw - 8) / Math.max(1, total));
    const pipStart = W / 2 - ((total - 1) * pipGap) / 2;
    const cur = Math.max(0, this.waveIdx);
    for (let i = 0; i < total; i++) {
      const px = pipStart + i * pipGap;
      const isBossPip = this.level.boss && i === total - 1;
      const done = i < cur;
      const active = i === cur && this.waveIdx >= 0 && this.wavePause <= 0;
      const nextPause = i === cur + 1 && this.wavePause > 0;
      const pulseP = (active || nextPause) && !motionReduced() ? 1 + Math.sin(this.t * 8) * 0.12 : 1;
      const r = (done || active ? 3.5 : 3) * pulseP;
      c.beginPath();
      if (done) {
        c.fillStyle = isBossPip ? '#ff8a9a' : '#ffd75e';
        c.arc(px, pipY, r, 0, TAU);
        c.fill();
      } else {
        c.strokeStyle = isBossPip ? 'rgba(255,138,154,.85)' : (active || nextPause ? '#7cf5ff' : 'rgba(255,255,255,.35)');
        c.lineWidth = active || nextPause ? 2 : 1.2;
        c.arc(px, pipY, r, 0, TAU);
        c.stroke();
        if (active || nextPause) {
          c.fillStyle = 'rgba(124,245,255,.28)';
          c.fill();
        }
      }
    }
    c.font = '700 9px sans-serif';
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.textAlign = 'center';
    const waveNum = this.waveIdx >= 0 ? Math.min(total, cur + 1) : 0;
    c.fillText(waveNum > 0 ? t('hud.waveLine', { n: waveNum, total }) : t('hud.wavesTotal', { total }), W / 2, pipY + 11);
    c.textAlign = 'center';
  }

  countNearbyMonsters(radius) {
    const p = this.player;
    if (!p || !p.alive) return 0;
    let n = 0;
    const r2 = radius * radius;
    const py = p.y - 40;
    for (const m of this.monsters) {
      if (!m.alive) continue;
      const dx = m.x - p.x, dy = m.y - py;
      if (dx * dx + dy * dy <= r2) n++;
    }
    return n;
  }

  updateKetsbam(dt) {
    if (this.over || !this.player?.alive) {
      this.ketsbamShow = false;
      return;
    }
    if (this.ketsbamChargeT > 0) {
      this.ketsbamShow = false;
      return;
    }
    if (this.ketsbamCd > 0) this.ketsbamCd -= dt;
    if (this.ketsbamSuperT > 0) this.ketsbamSuperT -= dt;
    const near = this.countNearbyMonsters(KETSBAM_DETECT_R);
    const stuck = this.player.hurtT > 0 && near >= 2;
    const swarmed = near >= KETSBAM_NEAR_MIN;
    this.ketsbamShow = this.ketsbamCd <= 0 && !this.inputLocked && !this.traveling && (swarmed || stuck);
    if (this.ketsbamShow) this.ketsbamPulse = (this.ketsbamPulse || 0) + dt;
    else this.ketsbamPulse = 0;
  }

  tryKetsbam() {
    if (this.ketsbamChargeT > 0 || !this.ketsbamShow || !this.player?.alive || this.over) return false;
    return this.player.doKetsbam(this);
  }

  drawKetsbamChargeAura(c) {
    if (this.ketsbamChargeT <= 0 || !this.player?.alive) return;
    const f = this.player;
    const dur = this.ketsbamChargeDur || KETSBAM_CHARGE_DUR;
    const prog = clamp(1 - this.ketsbamChargeT / dur, 0, 1);
    const pulse = this.ketsbamChargePulse || 0;
    const px = f.x, py = f.y - 52;
    const calm = motionReduced();
    const lite = fxLite() || calm;

    c.save();
    const ringR = calm ? (28 + prog * 88) : (28 + prog * 88 + Math.sin(pulse * 11) * 7);
    c.globalAlpha = 0.22 + prog * 0.38;
    c.strokeStyle = '#ffd75e';
    c.lineWidth = 2.5 + prog * 3.5;
    c.beginPath();
    c.ellipse(px, f.y + 3, ringR, ringR * 0.26, 0, 0, TAU);
    c.stroke();

    const h = 70 + prog * 170;
    const grad = c.createLinearGradient(px, f.y, px, f.y - h);
    grad.addColorStop(0, `rgba(255,154,61,${0.12 + prog * 0.22})`);
    grad.addColorStop(0.45, `rgba(255,232,120,${0.18 + prog * 0.32})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = grad;
    c.fillRect(px - 16 - prog * 14, f.y - h, 32 + prog * 28, h);

    const rings = lite ? 2 : 4;
    for (let i = 0; i < rings; i++) {
      const r = calm
        ? (34 + i * 13 + prog * 22)
        : (34 + i * 13 + prog * 22 + Math.sin(pulse * 10 + i * 1.4) * 5);
      c.globalAlpha = (0.3 + prog * 0.28) * (1 - i * 0.17);
      c.strokeStyle = i % 2 ? '#fff8dc' : '#ff9a3d';
      c.lineWidth = 2 + prog * 2;
      c.beginPath();
      c.arc(px, py, r, 0, TAU);
      c.stroke();
    }

    if (!lite) {
      c.globalAlpha = 0.45 + prog * 0.35;
      c.strokeStyle = '#fff';
      c.lineWidth = 2;
      const spikes = calm ? 4 : 7;
      for (let i = 0; i < spikes; i++) {
        const a = pulse * 9 + i * (TAU / spikes);
        const len = 22 + prog * 44;
        c.beginPath();
        c.moveTo(px + Math.cos(a) * 18, py + Math.sin(a) * 10);
        c.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len * 0.55 - prog * 24);
        c.stroke();
      }
    }

    c.globalAlpha = 0.85;
    c.font = `900 ${18 + prog * 8}px -apple-system, sans-serif`;
    c.textAlign = 'center';
    c.fillStyle = '#ffd75e';
    c.strokeStyle = 'rgba(0,0,0,.55)';
    c.lineWidth = 4;
    c.strokeText(t('banner.kets'), px, py - 58 - prog * 24);
    c.fillText(t('banner.kets'), px, py - 58 - prog * 24);
    c.restore();
  }

  drawKetsbamPrompt(c) {
    if (!this.ketsbamShow || !this.player?.alive) return;
    const ui = touchUiScale(W, H);
    const { cx, cy } = ketsbamPromptCenter();
    const calm = motionReduced();
    const pulse = calm ? 1 : (0.9 + Math.sin((this.ketsbamPulse || 0) * 10) * 0.1);
    const r = 46 * ui * pulse;
    c.save();
    c.globalAlpha = 0.92;
    c.fillStyle = 'rgba(6,10,24,.72)';
    c.beginPath();
    c.arc(cx, cy, r + 10 * ui, 0, TAU);
    c.fill();
    c.strokeStyle = 'rgba(255,215,94,.55)';
    c.lineWidth = 3 * ui;
    c.stroke();
    // ster/kets-symbool
    c.translate(cx, cy);
    if (!calm) c.rotate((this.ketsbamPulse || 0) * 2.2);
    c.fillStyle = '#ffd75e';
    c.strokeStyle = '#ff7043';
    c.lineWidth = 2.5 * ui;
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU - Math.PI / 2;
      const rr = i % 2 ? r * 0.42 : r * 0.88;
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    c.fill();
    c.stroke();
    if (!calm) c.rotate(-(this.ketsbamPulse || 0) * 2.2);
    c.font = `900 ${Math.round(17 * ui)}px -apple-system,sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineWidth = 5 * ui;
    c.strokeStyle = 'rgba(0,0,0,.55)';
    c.strokeText(t('banner.kets'), 0, 2);
    c.fillStyle = '#fff';
    c.fillText(t('banner.kets'), 0, 2);
    c.restore();
    c.font = `700 ${Math.round(12 * ui)}px -apple-system,sans-serif`;
    c.textAlign = 'center';
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.fillText(IS_TOUCH ? t('hud.ketsTap') : t('hud.ketsKey'), cx, cy + r + 18 * ui);
    c.textAlign = 'left';
  }

  drawHUD(c) {
    if (this.mode === 'adventure') this.drawStageBeatFx(c);
    const p = this.player;
    if (this.mode === 'adventure' && (this.killStreak || 0) >= 8 && !motionReduced()) {
      const a = 0.045 + Math.min(0.07, (this.killStreak || 0) / 100);
      const g = c.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, `rgba(255,122,77,${a})`);
      g.addColorStop(0.15, 'rgba(0,0,0,0)');
      g.addColorStop(0.85, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(255,122,77,${a})`);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    if (p && p.alive && p.maxhp > 0 && p.hp / p.maxhp < 0.28) {
      const calm = motionReduced();
      const a = calm ? 0.055 : (0.07 + Math.sin(this.t * 7) * 0.04);
      const g = c.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(180,20,40,${a})`);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    // spelerbalk (niet in 2P — eigen layout)
    const bw = Math.min(240, W * 0.32);
    const bx = Math.max(12, readSafeInsets().left + 8);
    const by = hudInsetTop();
    if (this.mode !== 'versus') {
      c.fillStyle = 'rgba(0,0,0,.45)';
      this.rr(c, bx - 4, by - 4, bw + 8, 52, 10); c.fill();
      c.fillStyle = '#333c55'; this.rr(c, bx, by, bw, 15, 6); c.fill();
      c.fillStyle = p.hp / p.maxhp > 0.35 ? '#6ee06e' : '#ff6b6b';
      this.rr(c, bx, by, bw * clamp(p.hp / p.maxhp, 0, 1), 15, 6); c.fill();
      if (this.mode === 'adventure' && masterBuffActive(this.level.n)) {
        c.fillStyle = 'rgba(196,122,255,.28)';
        this.rr(c, bx - 2, by - 16, bw + 4, 13, 5); c.fill();
        c.font = '800 9px -apple-system, sans-serif';
        c.fillStyle = '#c47aff';
        c.textAlign = 'left';
        c.fillText(t('hud.masterShort'), bx + 4, by - 7);
      }
      if (this.mode === 'adventure') {
        c.strokeStyle = 'rgba(255,215,94,.5)';
        c.lineWidth = 1;
        for (const frac of [STAR_HP.two, STAR_HP.three]) {
          const tx = bx + bw * frac;
          c.beginPath();
          c.moveTo(tx, by + 1);
          c.lineTo(tx, by + 14);
          c.stroke();
        }
      }
      c.fillStyle = '#333c55'; this.rr(c, bx, by + 20, bw, 11, 5); c.fill();
      const jKind = fighterJutsuKind(p);
      this.drawSuperMeterFill(c, bx, by + 20, bw, 11, p.energy / 100, jKind, this.t);
      c.font = '800 10px -apple-system, sans-serif';
      c.fillStyle = 'rgba(255,255,255,.85)'; c.textAlign = 'left';
      c.fillText(t('hud.super'), bx + 6, by + 29);
      // getekend jutsu-icoontje (art-upgrade 3/4): bliksem / oog / orb
      const ix = bx + 6 + c.measureText(t('hud.super')).width + 9;
      const iy = by + 25.5;
      if (jKind === 'chidori') {
        c.fillStyle = '#a8e0ff';
        c.beginPath();
        c.moveTo(ix + 2, iy - 5.5);
        c.lineTo(ix - 2.5, iy + 1);
        c.lineTo(ix + 0.3, iy + 1);
        c.lineTo(ix - 1.5, iy + 5.5);
        c.lineTo(ix + 3.5, iy - 1);
        c.lineTo(ix + 0.7, iy - 1);
        c.closePath();
        c.fill();
      } else if (jKind === 'rinnegan') {
        c.strokeStyle = '#c47aff'; c.lineWidth = 1.4;
        c.beginPath(); c.ellipse(ix + 1, iy, 5.2, 3.2, 0, 0, TAU); c.stroke();
        c.fillStyle = '#c47aff';
        c.beginPath(); c.arc(ix + 1, iy, 1.7, 0, TAU); c.fill();
      } else {
        c.strokeStyle = '#7cf5ff'; c.lineWidth = 1.4;
        c.beginPath(); c.arc(ix + 1, iy, 4.6, 0, TAU); c.stroke();
        c.fillStyle = '#7cf5ff';
        c.beginPath(); c.arc(ix + 1, iy, 2, 0, TAU); c.fill();
      }
      c.font = '800 13px -apple-system, sans-serif';
      c.fillStyle = '#fff';
      c.fillText(`Lv ${save.lvl}`, bx + bw + 12, by + 13);
      if (p.energy >= 100) {
        c.fillStyle = jKind === 'chidori' ? '#a8e0ff' : jKind === 'rinnegan' ? '#c47aff' : '#7cf5ff';
        c.fillText(jutsuLabel(jKind), bx + bw + 12, by + 32);
        c.strokeStyle = jKind === 'chidori' ? 'rgba(168,224,255,.55)' : jKind === 'rinnegan' ? 'rgba(196,122,255,.55)' : 'rgba(124,245,255,.55)';
        c.lineWidth = 2;
        c.beginPath();
        const joyR = motionReduced() ? 18 : 18 + Math.sin(this.t * 8) * 3;
        c.arc(bx + bw * 0.5, by + 25, joyR, 0, TAU);
        c.stroke();
      }
      const wFam = weaponMoveFamily(p.weapon.id);
      if (wFam) drawWeaponStylePips(c, bx + 10, by + 38, p);
    }

    c.textAlign = 'center';
    if (this.mode === 'adventure') {
      const isl = islandMeta(islandFromLevel(this.level.n));
      const wCap = adventureWeaponCapForLevel(this.level.n);
      const wv = Math.max(1, this.waveIdx + 1);
      c.font = '800 16px -apple-system, sans-serif';
      fillHudText(c, t('hud.levelWave', { n: this.level.n, wv: Math.min(wv, this.level.waves.length), total: this.level.waves.length }), W / 2, 30, {
        fill: a11yHighContrast() ? '#fff' : 'rgba(255,255,255,.9)',
      });
      c.font = '700 11px -apple-system, sans-serif';
      c.fillStyle = isl.accent;
      c.globalAlpha = 0.92;
      c.fillText(t('hud.islandWeapon', { name: islandLabel(islandFromLevel(this.level.n), 'name'), cap: wCap }), W / 2, 48);
      c.globalAlpha = 1;
      this.drawStageProgress(c);
      const bossAlive = this.monsters.find(m => m.elite && m.alive);
      if (!bossAlive) {
        if (this.stageAlly) {
          c.font = '700 11px sans-serif';
          const col = this.stageAlly.color || '#7cf5ff';
          c.fillStyle = col;
          const txt = this.stageAlly.name;
          c.fillText(txt, W / 2 + 7, 62);
          drawMiniDie(c, W / 2 - c.measureText(txt).width / 2 - 3, 58.5, 10, col);
        } else if (this.eggPet && activeEggPetDef()) {
          c.font = '700 11px sans-serif';
          c.fillStyle = this.eggPet.def?.c1 || '#ffd75e';
          const txt = t('hud.eggPet', { name: this.eggPet.def?.name || t('hud.cosmetic') });
          c.fillText(txt, W / 2, 62);
        } else if (this.pet && activePetDef()) {
          c.font = '700 11px sans-serif';
          c.fillStyle = this.pet.sp?.c1 || '#7cf5ff';
          const txt = t('hud.petActive', { name: this.pet.sp?.name || t('hud.petDefault') });
          c.fillText(txt, W / 2, 62);
        } else if (this.gambleBossWave > 0) {
          c.font = '700 11px sans-serif';
          c.fillStyle = '#ffb0b8';
          const txt = t('hud.gambleBoss', { n: this.gambleBossWave });
          c.fillText(txt, W / 2 + 7, 62);
          drawMiniDie(c, W / 2 - c.measureText(txt).width / 2 - 3, 58.5, 10, '#ffb0b8');
        }
      }
      if (p.alive) {
        const hpPct = p.hp / Math.max(1, p.maxhp);
        const proj = starsFromHpPct(hpPct);
        for (let i = 0; i < 3; i++) {
          drawStarShape(c, W - 52 + i * 19, 26, 8, '#ffd75e', i < proj);
        }
        c.textAlign = 'center';
        c.font = '700 11px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.7)';
        const pct = Math.round(hpPct * 100);
        let starHint = t('hud.starZone');
        if (hpPct <= STAR_HP.two) starHint = t('hud.star2', { pct: Math.round(STAR_HP.two * 100) });
        else if (hpPct <= STAR_HP.three) starHint = t('hud.star3', { pct: Math.round(STAR_HP.three * 100) });
        c.fillText(t('hud.hpPct', { pct, hint: starHint }), W / 2, 76);
      }
      if (this.waveIdx >= 0 && (this.spawnQueue.length > 0 || this.monsters.some((m) => m.alive))) {
        const rem = this.spawnQueue.length + this.monsters.filter((m) => m.alive).length;
        c.font = '700 11px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.62)';
        c.fillText(rem === 1 ? t('hud.enemiesLeft1') : t('hud.enemiesLeftN', { n: rem }), W / 2, 90);
      }
      if (this.wavePause > 0) {
        const nextBoss = isBossWave(this.level, this.waveIdx + 1);
        const sec = Math.max(0, this.wavePause);
        const totalPause = this.wavePauseTotal || 1.55;
        const pauseFrac = clamp(1 - this.wavePause / totalPause, 0, 1);
        const ringX = W / 2;
        const ringY = H - 78;
        const ringR = 24;
        if (!motionReduced()) {
          c.save();
          c.strokeStyle = nextBoss ? 'rgba(255,138,154,.22)' : 'rgba(124,245,255,.18)';
          c.lineWidth = 3.5;
          c.beginPath();
          c.arc(ringX, ringY, ringR, 0, TAU);
          c.stroke();
          c.strokeStyle = nextBoss ? '#ffb0b8' : '#7cf5ff';
          c.lineWidth = 3.5;
          c.lineCap = 'round';
          c.beginPath();
          c.arc(ringX, ringY, ringR, -Math.PI / 2, -Math.PI / 2 + pauseFrac * TAU);
          c.stroke();
          c.restore();
        }
        c.font = '800 15px sans-serif';
        const pauseMsg = nextBoss ? t('hud.toBoss', { sec: sec.toFixed(1) }) : t('hud.walkNext', { sec: sec.toFixed(1) });
        fillHudText(c, pauseMsg, ringX, ringY, {
          fill: nextBoss ? '#ffc8d0' : '#d8e8ff',
        });
        this.drawNextWavePreview(c);
      }
      const boss = bossAlive;
      if (boss) {
        const bwid = Math.min(420, W * 0.5);
        c.fillStyle = 'rgba(0,0,0,.5)'; this.rr(c, W / 2 - bwid / 2 - 3, 57, bwid + 6, 16, 8); c.fill();
        c.fillStyle = '#e04f5f'; this.rr(c, W / 2 - bwid / 2, 60, bwid * boss.hp / boss.maxhp, 10, 5); c.fill();
        c.font = '700 12px sans-serif';
        fillHudText(c, boss.sp.name.toUpperCase(), W / 2, 106, { fill: '#ffc8d0' });
      }
      if ((this.killStreak || 0) >= 2) {
        c.textAlign = 'right';
        c.font = '800 12px sans-serif';
        fillHudText(c, t('hud.streak', { n: this.killStreak }), W - Math.max(14, readSafeInsets().right + 8), 62, {
          fill: this.killStreak >= 8 ? '#ff7a4d' : '#ffd75e',
        });
      }
      if (save.comboHud !== false && this.combo > 1) {
        const calm = motionReduced();
        const pulse = calm ? 1 : (1 + Math.sin(this.t * 10) * 0.08);
        const col = this.combo >= 8 ? '#ff7a4d' : '#ffd75e';
        c.save();
        c.translate(W / 2, 92);
        c.scale(pulse, pulse);
        if (!fxLite() && !calm) {
          c.globalAlpha = 0.35 + Math.sin(this.t * 12) * 0.1;
          c.strokeStyle = col;
          c.lineWidth = 2;
          c.beginPath();
          c.arc(0, -4, 30 + Math.min(12, this.combo) + Math.sin(this.t * 14) * 3, 0, TAU);
          c.stroke();
          c.globalAlpha = 1;
        }
        c.font = '900 20px sans-serif';
        c.fillStyle = col;
        if (!calm) {
          c.shadowColor = col;
          c.shadowBlur = 12;
        }
        fillHudText(c, t('hud.combo', { n: this.combo }), 0, 0, { fill: col, strokeW: calm ? 4 : 3.5 });
        c.restore();
      }
      if (this.dmgBuffT > 0) {
        c.font = '800 13px sans-serif'; c.fillStyle = '#ff7a4d';
        c.fillText(t('hud.rage', { n: Math.ceil(this.dmgBuffT) }), W / 2, 108);
      }
      if (this.playerShieldT > 0) {
        c.font = '800 13px sans-serif'; c.fillStyle = '#9fd8ff';
        c.fillText(t('hud.shield', { n: Math.ceil(this.playerShieldT) }), W / 2, this.dmgBuffT > 0 ? 124 : 108);
      }
      if (this.masterSwordT > 0) {
        c.font = '900 14px sans-serif'; c.fillStyle = '#7cf5ff';
        if (!motionReduced()) { c.shadowColor = '#7cf5ff'; c.shadowBlur = 8; }
        const yMs = 108 + (this.dmgBuffT > 0 ? 16 : 0) + (this.playerShieldT > 0 ? 16 : 0);
        c.fillText(t('hud.masterSword', { n: Math.ceil(this.masterSwordT) }), W / 2, yMs);
        c.shadowBlur = 0;
      }
    } else if (this.mode === 'training') {
      const r = this.robot;
      const half = Math.min(300, W * 0.36);
      if (this.phase === 'intro' && this.phaseT < 1.55) {
        const n = Math.ceil(Math.max(0.35, 1.55 - this.phaseT));
        c.font = '900 48px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.92)';
        c.fillText(String(n), W / 2, H * 0.4);
        c.font = '700 13px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.65)';
        c.fillText(t('hud.spawnFair'), W / 2, H * 0.4 + 28);
      } else if (this.phase === 'roundend') {
        const left = Math.max(0, 2.2 - this.phaseT);
        c.font = '900 34px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.9)';
        c.fillText(String(Math.ceil(left)), W / 2, H * 0.38);
        c.font = '700 13px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.7)';
        c.fillText(t('hud.nextRound'), W / 2, H * 0.38 + 26);
        const barW = Math.min(140, W * 0.24);
        c.fillStyle = 'rgba(0,0,0,.35)';
        this.rr(c, W / 2 - barW / 2, H * 0.38 + 34, barW, 5, 3);
        c.fill();
        c.fillStyle = '#7cf5ff';
        this.rr(c, W / 2 - barW / 2, H * 0.38 + 34, barW * clamp(left / 2.2, 0, 1), 5, 3);
        c.fill();
      }
      const tele = this.trainLaserTelegraph > 0
        ? { label: t('hud.earLaser'), frac: this.trainLaserTelegraph / 0.95, color: '#ff6b6b', max: 0.95 }
        : (this.trainTelegraphT > 0
          ? { label: t('hud.chidoriTele'), frac: this.trainTelegraphT / 0.85, color: '#7cf5ff', max: 0.85 }
          : (this.trainMeleeTelegraphT > 0
            ? {
              label: this.trainTelegraphKind === 'kick' ? t('hud.kickTele') : t('hud.punchTele'),
              frac: this.trainMeleeTelegraphT / (this.trainMeleeTelegraphMax || 0.32),
              color: '#ffb347',
              max: this.trainMeleeTelegraphMax || 0.32,
            }
            : null));
      if (tele) {
        const barW = Math.min(220, W - 48);
        const bx = (W - barW) / 2;
        c.fillStyle = 'rgba(0,0,0,.4)';
        this.rr(c, bx - 4, 88, barW + 8, 22, 8);
        c.fill();
        c.font = '800 11px sans-serif';
        c.textAlign = 'center';
        fillHudText(c, tele.label, W / 2, 102, { fill: tele.color, strokeW: a11yHighContrast() ? 3 : 0 });
        c.fillStyle = 'rgba(255,255,255,.15)';
        this.rr(c, bx, 108, barW, 5, 3);
        c.fill();
        c.fillStyle = tele.color;
        this.rr(c, bx, 108, barW * clamp(tele.frac, 0, 1), 5, 3);
        c.fill();
      }
      if (this.trainMeleeTelegraphT > 0 && r.alive && !this.trainLaserTelegraph && !this.trainTelegraphT) {
        const dir = Math.sign(this.player.x - r.x) || -1;
        c.save();
        c.globalAlpha = motionReduced() ? 0.38 : (0.3 + Math.sin(this.t * 22) * 0.15);
        c.strokeStyle = '#ffb347';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(r.x + dir * 28, r.y - 28, 22, 0, TAU);
        c.stroke();
        c.restore();
      }
      if (this.trainTelegraphT > 0 && r.alive) {
        c.save();
        c.globalAlpha = motionReduced() ? 0.42 : (0.35 + Math.sin(this.t * 18) * 0.2);
        c.strokeStyle = '#7cf5ff';
        c.lineWidth = 4;
        c.beginPath();
        c.arc(r.x, r.y - 48, 42 + (motionReduced() ? 0 : Math.sin(this.t * 14) * 6), 0, TAU);
        c.stroke();
        const dashDir = Math.sign(this.player.x - r.x) || -1;
        const dashLen = Math.min(200, Math.abs(this.player.x - r.x) + 40);
        c.globalAlpha = 0.35 + (this.trainTelegraphT / 0.85) * 0.35;
        c.strokeStyle = '#7cf5ff';
        c.lineWidth = 3;
        c.setLineDash([8, 10]);
        c.beginPath();
        c.moveTo(r.x, r.y - 22);
        c.lineTo(r.x + dashDir * dashLen, r.y - 22);
        c.stroke();
        c.setLineDash([]);
        c.restore();
      }
      if (this.trainLaserTelegraph > 0 && r.alive) {
        const ly = r.y - 52;
        c.save();
        c.globalAlpha = 0.25 + (this.trainLaserTelegraph / 0.95) * 0.45;
        c.strokeStyle = '#ff5d5d';
        c.lineWidth = 6;
        c.setLineDash([14, 10]);
        c.beginPath();
        c.moveTo(24, ly);
        c.lineTo(W - 24, ly);
        c.stroke();
        c.setLineDash([]);
        c.font = '800 13px sans-serif';
        c.textAlign = 'center';
        fillHudText(c, t('hud.earLaserShort'), W / 2, ly - 10, { fill: '#ffb0b8' });
        c.restore();
      }
      // robotbalk rechtsboven
      c.fillStyle = 'rgba(0,0,0,.45)'; this.rr(c, W - half - 20, by - 4, half + 8, 30, 10); c.fill();
      c.fillStyle = '#333c55'; this.rr(c, W - half - 16, by, half, 15, 6); c.fill();
      c.fillStyle = '#ff8080';
      const frac = clamp(r.hp / r.maxhp, 0, 1);
      this.rr(c, W - 16 - half * frac, by, half * frac, 15, 6); c.fill();
      c.font = '800 13px sans-serif'; c.textAlign = 'right'; c.fillStyle = '#fff';
      const rPct = Math.round(frac * 100);
      c.fillText(t('hud.rabbitRobot', { pct: rPct }), W - 20, by + 30);
      // timer + rondepunten
      c.textAlign = 'center';
      c.font = '800 12px sans-serif';
      c.fillStyle = 'rgba(255,255,255,.65)';
      const decisiveRound = this.roundsP === 1 && this.roundsR === 1;
      const scoreLine = decisiveRound
        ? t('hud.decisiveRound', { s: this.roundsP, r: this.roundsR })
        : t('hud.roundInfo', { n: this.round, s: this.roundsP, r: this.roundsR });
      c.fillText(scoreLine, W / 2, 68);
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
      const timerBarW = Math.min(160, W * 0.28);
      const timerFrac = clamp(this.roundTimer / 60, 0, 1);
      c.fillStyle = 'rgba(0,0,0,.35)';
      this.rr(c, W / 2 - timerBarW / 2, 46, timerBarW, 5, 3);
      c.fill();
      c.fillStyle = urgent ? '#ff6b6b' : '#7cf5ff';
      this.rr(c, W / 2 - timerBarW / 2, 46, timerBarW * timerFrac, 5, 3);
      c.fill();
      if (this.roundTimer < 12 && this.phase === 'fight') {
        c.font = '700 9px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.fillText(t('hud.timeHpWin'), W / 2, 58);
      }
      const mpP = this.roundsP === 1 && this.roundsR < 2;
      const mpR = this.roundsR === 1 && this.roundsP < 2;
      for (let i = 0; i < 2; i++) {
        const px = W / 2 - 34 - i * 18;
        c.fillStyle = i < this.roundsP ? '#7cfc8a' : 'rgba(255,255,255,.25)';
        c.beginPath(); c.arc(px, 82, 6, 0, TAU); c.fill();
        if (mpP && i === 1) {
          c.strokeStyle = '#ffd75e'; c.lineWidth = 2;
          c.beginPath(); c.arc(px, 82, 9, 0, TAU); c.stroke();
        }
        const rx = W / 2 + 34 + i * 18;
        c.fillStyle = i < this.roundsR ? '#ff6b6b' : 'rgba(255,255,255,.25)';
        c.beginPath(); c.arc(rx, 82, 6, 0, TAU); c.fill();
        if (mpR && i === 1) {
          c.strokeStyle = '#ffd75e'; c.lineWidth = 2;
          c.beginPath(); c.arc(rx, 82, 9, 0, TAU); c.stroke();
        }
      }
      if ((this.trainDummyGrace || 0) > 0) {
        c.textAlign = 'center';
        c.font = '800 12px sans-serif';
        c.fillStyle = '#7cf5ff';
        c.fillText(t('hud.dummyGrace', { n: this.trainDummyGrace.toFixed(1) }), W / 2, 118);
      }
      if (this.combo > 0 && this.comboT > 0 && save.comboHud !== false) {
        const col = this.combo >= 8 ? '#ff7a4d' : '#ffd75e';
        const nextGoal = this.combo < 5 ? 5 : this.combo < 8 ? 8 : this.combo < 10 ? 10 : 0;
        const rec = save.stats.trainMaxCombo || 0;
        c.textAlign = 'left';
        c.font = '800 13px sans-serif';
        c.fillStyle = col;
        c.fillText(t('hud.combo', { n: this.combo }), 16, 118);
        c.font = '700 10px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.65)';
        if (nextGoal) c.fillText(t('hud.goal', { n: nextGoal }), 16, 132);
        if (rec > 0) c.fillText(t('hud.record', { n: rec }), 16, nextGoal ? 146 : 132);
        const barW = Math.min(120, W * 0.28);
        const barY = nextGoal ? (rec > 0 ? 152 : 138) : (rec > 0 ? 146 : 132);
        c.fillStyle = 'rgba(255,255,255,.15)';
        this.rr(c, 16, barY, barW, 4, 2);
        c.fill();
        c.fillStyle = col;
        this.rr(c, 16, barY, barW * clamp(this.comboT / 1.55, 0, 1), 4, 2);
        c.fill();
        c.textAlign = 'center';
      }
    } else if (this.mode === 'wall') {
      const wallDur = this.wallDuration || 60;
      const tLeft = Math.ceil(Math.max(0, this.wallTimer));
      const urgent = this.wallTimer < 10;
      const barW = Math.min(220, W - 48);
      const barX = (W - barW) / 2;
      const timeFrac = clamp(this.wallTimer / wallDur, 0, 1);
      c.font = '700 9px sans-serif';
      c.textAlign = 'left';
      c.fillStyle = 'rgba(255,255,255,.45)';
      c.fillText(t('hud.time'), barX, 44);
      c.textAlign = 'center';
      c.fillStyle = 'rgba(0,0,0,.42)';
      this.rr(c, barX, 48, barW, 7, 4); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.22)';
      c.lineWidth = 1;
      for (const frac of [0.5, 0.25]) {
        const tx = barX + barW * frac;
        c.beginPath();
        c.moveTo(tx, 47);
        c.lineTo(tx, 56);
        c.stroke();
      }
      c.fillStyle = urgent ? '#ff6b6b' : '#7cf5ff';
      this.rr(c, barX, 48, Math.max(4, barW * timeFrac), 7, 4); c.fill();

      c.font = '900 30px sans-serif';
      c.fillStyle = urgent ? '#ff6b6b' : '#fff';
      if (urgent && !motionReduced()) {
        c.save();
        c.translate(W / 2, 36);
        c.scale(1 + Math.sin(this.t * 12) * 0.06, 1 + Math.sin(this.t * 12) * 0.06);
        c.fillText(String(tLeft), 0, 0);
        c.restore();
      } else {
        c.fillText(String(tLeft), W / 2, 36);
      }
      if (this.wallGen > 0) {
        c.font = '800 12px sans-serif';
        c.textAlign = 'left';
        c.fillStyle = 'rgba(255,215,94,.85)';
        c.fillText(t('hud.wallGen', { n: this.wallGen + 1 }), 16, 36);
        c.textAlign = 'center';
      }
      c.font = '800 17px sans-serif'; c.fillStyle = '#ffd75e';
      c.fillText(t('hud.stones', { n: this.score }), W / 2, 68);
      c.font = '700 13px sans-serif';
      const bestSaved = save.bestWall || 0;
      const rec = Math.max(bestSaved, this.score);
      const onPace = this.score > bestSaved;
      c.fillStyle = onPace ? '#7cfc8a' : 'rgba(255,255,255,.55)';
      if (bestSaved > 0 && this.score < bestSaved) {
        const gap = bestSaved - this.score;
        c.fillText(t('hud.recordGap', { best: bestSaved, gap }), W / 2, 86);
      } else {
        c.fillText(onPace && bestSaved > 0 ? t('hud.recordBroken', { rec }) : t('hud.recordLine', { rec }), W / 2, 86);
      }
      let showPaceDelta = false;
      const elapsed = wallDur - this.wallTimer;
      if (elapsed > 2 && this.score > 0) {
        const pace = Math.round((this.score / elapsed) * 60);
        const proj = Math.round(this.score + (this.wallTimer / elapsed) * this.score);
        c.font = '700 12px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.62)';
        c.fillText(t('hud.pace', { pace, proj }), W / 2, 102);
        const paceDelta = wallRecordPaceDelta(this);
        if (paceDelta != null && bestSaved > 0) {
          showPaceDelta = true;
          c.font = '700 11px sans-serif';
          c.fillStyle = paceDelta >= 0 ? '#7cfc8a' : '#ffb0b8';
          c.fillText(
            paceDelta >= 0 ? t('hud.paceAhead', { n: paceDelta }) : t('hud.paceBehind', { n: paceDelta }),
            W / 2, 116
          );
        }
      }
      const comboWin = this.wallComboWindow || 1.4;
      if (this.combo > 0 && this.comboT > 0) {
        const cFrac = clamp(this.comboT / comboWin, 0, 1);
        const cBarW = Math.min(160, W * 0.42);
        const cBarX = (W - cBarW) / 2;
        const cy = showPaceDelta ? (this.combo > 1 ? 162 : 146) : (this.combo > 1 ? 148 : 132);
        c.font = '700 9px sans-serif';
        c.textAlign = 'left';
        c.fillStyle = 'rgba(124,245,255,.55)';
        c.fillText(t('hud.comboLabel'), cBarX, cy - 4);
        c.textAlign = 'center';
        c.fillStyle = 'rgba(0,0,0,.38)';
        this.rr(c, cBarX, cy, cBarW, 5, 3); c.fill();
        c.fillStyle = cFrac < 0.25 ? '#ff9a9a' : '#7cf5ff';
        this.rr(c, cBarX, cy, Math.max(3, cBarW * cFrac), 5, 3); c.fill();
      }
      if (this.combo > 1) {
        const pulse = motionReduced() ? 1 : (1 + Math.sin(this.t * 10) * 0.1);
        c.save();
        c.translate(W / 2, showPaceDelta ? 142 : 128);
        c.scale(pulse, pulse);
        c.font = '900 22px sans-serif'; c.fillStyle = '#7cf5ff';
        c.fillText(t('hud.combo', { n: this.combo }), 0, 0);
        c.font = '700 12px sans-serif'; c.fillStyle = 'rgba(124,245,255,.85)';
        c.fillText(t('hud.comboSmash', { pct: Math.min(this.combo, 12) * 4 }), 0, 18);
        c.restore();
      } else if (this.combo === 1 && this.comboT > 0) {
        c.font = '700 12px sans-serif';
        c.fillStyle = 'rgba(124,245,255,.75)';
        c.fillText(t('hud.comboActive'), W / 2, showPaceDelta ? 132 : 118);
      }
    } else if (this.mode === 'coinrun') {
      const tLeft = Math.ceil(Math.max(0, this.coinTimer));
      c.font = '900 30px sans-serif';
      c.fillStyle = this.coinTimer < 10 ? '#ff6b6b' : '#fff';
      c.fillText(String(tLeft), W / 2, 42);
      c.font = '800 18px sans-serif'; c.fillStyle = '#ffd75e';
      c.fillText(t('hud.coins', { n: this.coinsCollected }), W / 2, 70);
      c.font = '700 13px sans-serif'; c.fillStyle = 'rgba(255,255,255,.7)';
      c.fillText(t('hud.matsRecord', { n: save.stats.matsCoinBest || 0 }), W / 2, 90);
      const pendingPet = matsPetCoinsFromRun(this.coinsCollected);
      c.fillStyle = '#ff9ad5';
      c.fillText(t('hud.petCoins', { pending: pendingPet, wallet: petCoinsBalance() }), W / 2, 108);
      c.fillStyle = 'rgba(124,245,255,.85)';
      c.fillText(t('hud.matsHint'), W / 2, 128);
    } else if (this.mode === 'versus' && this.p2) {
      const p2 = this.p2;
      const half = Math.min(260, W * 0.38);
      const safeTop = hudInsetTop();
      const byVs = Math.max(by, safeTop + 42);
      const name1 = vsRosterEntry(this.p1Pick).name;
      const name2 = vsRosterEntry(this.p2Pick).name;
      if (this.phase === 'intro' && this.phaseT < 1.55) {
        const n = Math.ceil(Math.max(0.35, 1.55 - this.phaseT));
        c.font = '900 48px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.92)';
        c.fillText(String(n), W / 2, H * 0.4);
        c.font = '700 13px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.65)';
        c.fillText(t('hud.spawnFair'), W / 2, H * 0.4 + 28);
      } else if (this.phase === 'roundend') {
        const left = Math.max(0, 2.2 - this.phaseT);
        c.font = '900 34px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.9)';
        c.fillText(String(Math.ceil(left)), W / 2, H * 0.38);
        c.font = '700 13px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.7)';
        c.fillText(t('hud.nextRound'), W / 2, H * 0.38 + 26);
        const barW = Math.min(140, W * 0.24);
        c.fillStyle = 'rgba(0,0,0,.35)';
        this.rr(c, W / 2 - barW / 2, H * 0.38 + 34, barW, 5, 3);
        c.fill();
        c.fillStyle = '#7cf5ff';
        this.rr(c, W / 2 - barW / 2, H * 0.38 + 34, barW * clamp(left / 2.2, 0, 1), 5, 3);
        c.fill();
      }
      c.fillStyle = 'rgba(0,0,0,.45)'; this.rr(c, bx - 4, byVs - 4, half + 8, 44, 10); c.fill();
      c.fillStyle = '#333c55'; this.rr(c, bx, byVs, half, 14, 6); c.fill();
      c.fillStyle = p.hp / p.maxhp > 0.35 ? '#6ee06e' : '#ff6b6b';
      this.rr(c, bx, byVs, half * clamp(p.hp / p.maxhp, 0, 1), 14, 6); c.fill();
      c.font = '800 11px sans-serif'; c.textAlign = 'left'; c.fillStyle = '#7cf5ff';
      const hp1Pct = Math.round(clamp(p.hp / p.maxhp, 0, 1) * 100);
      c.fillText(t('hud.p1Line', { name: name1, pct: hp1Pct }), bx, byVs + 30);
      c.fillStyle = '#333c55'; this.rr(c, bx, byVs + 34, half, 5, 3); c.fill();
      this.drawSuperMeterFill(c, bx, byVs + 34, half, 5, p.energy / 100, fighterJutsuKind(p), this.t);
      drawWeaponStylePips(c, bx + 8, byVs + 44, p);

      c.fillStyle = 'rgba(0,0,0,.45)'; this.rr(c, W - half - 20, byVs - 4, half + 8, 44, 10); c.fill();
      c.fillStyle = '#333c55'; this.rr(c, W - half - 16, byVs, half, 14, 6); c.fill();
      c.fillStyle = '#ff8080';
      const frac2 = clamp(p2.hp / p2.maxhp, 0, 1);
      this.rr(c, W - 16 - half * frac2, byVs, half * frac2, 14, 6); c.fill();
      c.textAlign = 'right'; c.fillStyle = '#ffb0b8';
      const hp2Pct = Math.round(frac2 * 100);
      c.fillText(t('hud.p2Line', { pct: hp2Pct, name: name2 }), W - 20, byVs + 30);
      c.fillStyle = '#333c55'; this.rr(c, W - half - 16, byVs + 34, half, 5, 3); c.fill();
      this.drawSuperMeterFill(c, W - half - 16, byVs + 34, half, 5, p2.energy / 100, fighterJutsuKind(p2), this.t);
      drawWeaponStylePips(c, W - half - 8, byVs + 44, p2);

      c.textAlign = 'center';
      const tLeft = Math.ceil(Math.max(0, this.roundTimer));
      const urgent = this.roundTimer < 15 && this.phase === 'fight';
      c.font = urgent ? '900 28px sans-serif' : '900 26px sans-serif';
      c.fillStyle = urgent ? '#ff9a9a' : '#fff';
      const timerY = byVs + 58;
      if (urgent && !motionReduced()) {
        c.save();
        c.translate(W / 2, timerY);
        c.scale(1 + Math.sin(this.t * 10) * 0.05, 1 + Math.sin(this.t * 10) * 0.05);
        c.fillText(String(tLeft), 0, 0);
        c.restore();
      } else {
        c.fillText(String(tLeft), W / 2, timerY);
      }
      c.font = '800 12px sans-serif'; c.fillStyle = 'rgba(255,255,255,.75)';
      const decisiveRound = this.roundsP1 === 1 && this.roundsP2 === 1;
      const scoreLine = decisiveRound
        ? t('hud.decisiveRound', { s: this.roundsP1, r: this.roundsP2 })
        : t('hud.roundInfo', { n: this.round, s: this.roundsP1, r: this.roundsP2 });
      c.fillText(scoreLine, W / 2, timerY + 18);
      const timerBarW = Math.min(160, W * 0.28);
      const timerFrac = clamp(this.roundTimer / 99, 0, 1);
      c.fillStyle = 'rgba(0,0,0,.35)';
      this.rr(c, W / 2 - timerBarW / 2, timerY + 24, timerBarW, 5, 3);
      c.fill();
      c.fillStyle = urgent ? '#ff6b6b' : '#7cf5ff';
      this.rr(c, W / 2 - timerBarW / 2, timerY + 24, timerBarW * timerFrac, 5, 3);
      c.fill();
      if (this.roundTimer < 12 && this.phase === 'fight') {
        c.font = '700 10px sans-serif';
        c.fillStyle = 'rgba(255,215,94,.85)';
        c.fillText(t('hud.timeHpWin'), W / 2, timerY + 38);
      }
      const mp1 = this.roundsP1 === 1 && this.roundsP2 < 2;
      const mp2 = this.roundsP2 === 1 && this.roundsP1 < 2;
      const dotY = (this.roundTimer < 12 && this.phase === 'fight') ? timerY + 48 : timerY + 34;
      const log = this.vsRoundLog || [];
      if (log.length) {
        c.font = '700 9px sans-serif';
        c.textAlign = 'center';
        const chips = log.map((w, i) => `R${i + 1}:${w === 'p1' ? 'P1' : 'P2'}`).join(' · ');
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.fillText(chips, W / 2, dotY - 12);
      }
      for (let i = 0; i < 2; i++) {
        const litP1 = i < this.roundsP1;
        c.fillStyle = litP1 ? '#7cf5ff' : 'rgba(255,255,255,.22)';
        if (mp1 && i === 1) c.fillStyle = '#ffd75e';
        c.beginPath(); c.arc(W / 2 - 40 - i * 16, dotY, mp1 && i === 1 ? 6 : 5, 0, TAU); c.fill();
        const litP2 = i < this.roundsP2;
        c.fillStyle = litP2 ? '#ffb0b8' : 'rgba(255,255,255,.22)';
        if (mp2 && i === 1) c.fillStyle = '#ffd75e';
        c.beginPath(); c.arc(W / 2 + 40 + i * 16, dotY, mp2 && i === 1 ? 6 : 5, 0, TAU); c.fill();
      }
      if (p.invulnT > 0.05) {
        c.font = '700 9px sans-serif'; c.fillStyle = 'rgba(124,245,255,.75)'; c.textAlign = 'left';
        c.fillText(`${p.invulnT.toFixed(1)}s`, bx, byVs + 52);
      }
      if (p2.invulnT > 0.05) {
        c.font = '700 9px sans-serif'; c.fillStyle = 'rgba(255,176,184,.75)'; c.textAlign = 'right';
        c.fillText(`${p2.invulnT.toFixed(1)}s`, W - 20, byVs + 52);
      }
      if (p.energy >= 100) {
        const k1 = fighterJutsuKind(p);
        drawJutsuMiniIcon(c, k1, bx + half - 10, byVs + 9, jutsuAccentColor(k1, false));
      }
      if (p2.energy >= 100) {
        const k2 = fighterJutsuKind(p2);
        drawJutsuMiniIcon(c, k2, W - 26, byVs + 9, jutsuAccentColor(k2, true));
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

  drawSpecialBtnMeter(c, b, fighter, accent) {
    if (!fighter || b.id !== 'special') return;
    const pct = clamp(fighter.energy / 100, 0, 1);
    const kind = fighterJutsuKind(fighter);
    const ring = b.r + 4;
    c.save();
    c.globalAlpha = 0.28;
    c.strokeStyle = '#1a2030';
    c.lineWidth = 6;
    c.beginPath(); c.arc(b.x, b.y, ring, 0, TAU); c.stroke();
    if (pct > 0.02) {
      c.globalAlpha = kind === 'chidori' ? 0.75 + Math.sin(this.t * 18) * 0.12 : 0.82;
      c.strokeStyle = kind === 'chidori' ? '#7ec8ff' : kind === 'rinnegan' ? '#b06ae0' : accent || '#3db8ff';
      c.lineWidth = 5;
      c.lineCap = 'round';
      c.beginPath();
      c.arc(b.x, b.y, ring, -Math.PI / 2, -Math.PI / 2 + TAU * pct);
      c.stroke();
    }
    if (pct >= 1) {
      c.globalAlpha = 0.9;
      c.strokeStyle = kind === 'chidori' ? '#a8e0ff' : kind === 'rinnegan' ? '#c47aff' : '#7cf5ff';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(b.x, b.y, ring + 5 + Math.sin(this.t * 8) * 2, 0, TAU);
      c.stroke();
    }
    c.restore();
  }

  drawTouchControls(c) {
    const ui = touchUiScale(W, H);
    const joyOuter = Math.round(52 * ui);
    const joyInner = Math.round(26 * ui);
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
    c.beginPath(); c.arc(jx, jy, joyOuter, 0, TAU); c.stroke();
    drawJoyAimGuide(c, jx, jy, j, ui, '#7cf5ff');
    c.globalAlpha = j.active ? 0.65 : 0.3;
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(jx + (j.active ? j.dx : 0), jy + (j.active ? j.dy : 0), joyInner, 0, TAU); c.fill();
    if (this.player) {
      drawPlayerAimIndicator(c, this.player, j.active ? 0.62 : 0.28);
    }
    // knoppen
    for (const b of Input.buttons) {
      if (b.id === 'special') this.drawSpecialBtnMeter(c, b, this.player, '#3db8ff');
      c.globalAlpha = b.held ? 0.85 : 0.45;
      c.fillStyle = b.color;
      c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
      if (b.held) {
        c.globalAlpha = 0.6;
        c.strokeStyle = '#fff';
        c.lineWidth = 2.5;
        c.beginPath(); c.arc(b.x, b.y, b.r + 3, 0, TAU); c.stroke();
      }
      c.globalAlpha = b.held ? 1 : 0.85;
      const jk = b.id === 'special' ? fighterJutsuKind(this.player) : null;
      if (!drawTouchBtnIcon(c, b.id, b.x, b.y, b.r, jk)) {
        c.font = `${b.r * 0.85}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(b.label, b.x, b.y + 2);
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
    const ui = touchUiScale(W, H);
    const joyOuter = Math.round(48 * ui);
    const joyInner = Math.round(22 * ui);
    const j = pad.joy;
    const jx = j.active ? j.ox : pad.joyHome.x, jy = j.active ? j.oy : pad.joyHome.y;
    c.globalAlpha = 0.35;
    c.strokeStyle = accent;
    c.lineWidth = 3;
    c.beginPath(); c.arc(jx, jy, joyOuter, 0, TAU); c.stroke();
    drawJoyAimGuide(c, jx, jy, j, ui, accent);
    c.globalAlpha = j.active ? 0.55 : 0.25;
    c.fillStyle = accent;
    c.beginPath(); c.arc(jx + (j.active ? j.dx : 0), jy + (j.active ? j.dy : 0), joyInner, 0, TAU); c.fill();
    if (fighter) drawPlayerAimIndicator(c, fighter, j.active ? 0.55 : 0.24);
    c.font = '900 11px sans-serif'; c.fillStyle = accent; c.textAlign = 'center';
    c.fillText(label, jx, jy - 58);
    for (const b of pad.buttons) {
      if (b.id === 'special') this.drawSpecialBtnMeter(c, b, fighter, accent);
      c.globalAlpha = b.held ? 0.85 : 0.42;
      c.fillStyle = b.color;
      c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
      if (b.held) {
        c.globalAlpha = 0.55;
        c.strokeStyle = accent;
        c.lineWidth = 2;
        c.beginPath(); c.arc(b.x, b.y, b.r + 3, 0, TAU); c.stroke();
      }
      c.globalAlpha = 0.9;
      const jk2 = b.id === 'special' && fighter ? fighterJutsuKind(fighter) : (b.id === 'special' ? 'rasengan' : null);
      if (!drawTouchBtnIcon(c, b.id, b.x, b.y, b.r, jk2)) {
        c.font = `${b.r * 0.8}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(b.label, b.x, b.y + 2);
      }
    }
    c.textBaseline = 'alphabetic';
    c.restore();
  }
}

/* --- src/ui/ui.js --- */
/* ================================= UI ================================== */
function appendItemUpgradeButton(el, cat, id, rerender) {
  if (!itemUpgradeEligible(cat, id) || !itemCanUpgrade(cat, id)) return;
  const cost = itemUpgradeCost(cat, id);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn claim-btn';
  btn.textContent = t('ui.itemUpgrade') + ` (${cost})`;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    safeUiAction(() => {
      if (!tryItemUpgrade(cat, id)) return;
      AudioSys.sfx('levelup');
      const name = itemUpgradeLabel(cat, id);
      const lv = itemUpgradeLevel(cat, id);
      UI.toast(t('toast.itemUpgraded', { name, lv, detail: itemUpgradeSummary(cat, id) }), 3200);
      rerender();
    }, 'itemUp/' + cat + '/' + id, 'Upgrade mislukt');
  });
  el.appendChild(btn);
}

function itemUpgradeCardParts(cat, id, color) {
  if (!itemUpgradeEligible(cat, id)) return { canUp: false, lv: 0, max: 0, html: '' };
  const lv = itemUpgradeLevel(cat, id);
  const max = itemUpgradeMax(cat, id);
  const shards = itemUpgradeShards(cat, id);
  const cost = itemUpgradeCost(cat, id);
  const canUp = itemCanUpgrade(cat, id);
  const now = itemUpgradeSummary(cat, id);
  const next = itemUpgradePreview(cat, id);
  const shardLine = cost != null ? t('ui.itemShards', { cur: shards, cost }) : t('ui.itemMax');
  return {
    canUp, lv, max,
    html:
      `<div class="skill-card-body"><div class="cname" style="color:${color}">${itemUpgradeLabel(cat, id)} ` +
      `<span class="rar-pill" style="color:${color};border-color:${color}">${t('ui.itemLevel', { lv, max })}</span></div>` +
      `<div class="cinfo">${shardLine}</div>` +
      `<div class="cinfo" style="opacity:.88;font-size:12px;margin-top:4px"><b>${t('ui.itemNow')}:</b> ${now}</div>` +
      (next ? `<div class="cinfo" style="opacity:.75;font-size:11px;margin-top:3px"><b>${t('ui.itemNext')}:</b> ${next}</div>` : '') +
      `</div>`,
  };
}

function drawUpgradeItemIcon(cat, id, cv) {
  if (!cv) return;
  const cc = cv.getContext('2d');
  if (!cc) return;
  cc.clearRect(0, 0, cv.width, cv.height);
  if (cat === 'weapon') {
    const w = WEAPONS.find((x) => x.id === id);
    if (!w) return;
    cc.translate(10, 40);
    cc.rotate(-0.6);
    if (w.id === 'vuist') {
      cc.strokeStyle = '#f2f5ff'; cc.lineWidth = 5; cc.lineCap = 'round';
      cc.beginPath(); cc.moveTo(2, 8); cc.lineTo(24, -6); cc.stroke();
      cc.fillStyle = '#f2f5ff'; cc.beginPath(); cc.arc(28, -9, 7, 0, TAU); cc.fill();
    } else {
      drawWeaponShape(cc, w.id, 0.2);
    }
  } else if (cat === 'pet') {
    const p = petDef(id);
    const sp = p ? SPECIES[p.speciesId] : null;
    if (!sp) return;
    cc.translate(32, 38);
    cc.scale(0.55, 0.55);
    drawMonsterArt(cc, sp, sp.size, 1.2, false, false);
  } else if (cat === 'style') {
    const st = styleById(id);
    cc.translate(36, 58);
    cc.scale(0.85, 0.85);
    const preview = new Fighter({ isPlayer: true, x: 0, y: 0, color: st.body, style: st, scale: 0.9 });
    preview.animT = 0.4;
    preview.draw(cc);
  }
}

function buildUpgradeItemCard(cat, id, color, rerender) {
  const card = itemUpgradeCardParts(cat, id, color);
  const el = document.createElement('div');
  el.className = 'card skill-card' + (card.canUp ? ' claimable' : '') + (card.lv >= card.max ? ' claimed' : '');
  el.style.borderColor = color + '88';
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 64;
  drawUpgradeItemIcon(cat, id, cv);
  el.appendChild(cv);
  const wrap = document.createElement('div');
  wrap.innerHTML = card.html;
  while (wrap.firstChild) el.appendChild(wrap.firstChild);
  appendItemUpgradeButton(el, cat, id, rerender);
  return el;
}

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
  else bits.push(t('audio.musicPct', { pct: mPct }) + (inPause ? t('audio.bgmDuckPause') : ''));
  if (!save.sfx) bits.push(t('audio.sfxOff'));
  else bits.push(t('audio.sfxPct', { pct: sPct }));
  return bits.join(' · ');
}

const UI = {
  screens: ['menuScreen', 'modeHubScreen', 'levelScreen', 'gambleScreen', 'weaponScreen', 'skillScreen', 'petScreen', 'styleScreen', 'settingsScreen', 'missionsScreen', 'charSelectScreen', 'dexScreen', 'helpScreen', 'installScreen', 'resultScreen', 'pauseScreen'],
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
        try { Input.releaseAll(); } catch (_) {}
        state = 'play';
        AudioSys.setPaused(false);
        if (save.music && AudioSys.desiredSong) AudioSys.play(AudioSys.desiredSong);
        this.show(null);
        return;
      }
      if (active === 'gambleScreen') {
        try { cancelGambleStart(); } catch (_) {}
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
      if (active === 'weaponScreen' || active === 'skillScreen' || active === 'petScreen' || active === 'styleScreen' || active === 'dexScreen') {
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
      this.hideVersionUpdateDialog();
      try { clearGameResultTimer(game); } catch (_) {}
      try { cancelGambleStart(); } catch (_) {}
      try { Input.releaseAll(); } catch (_) {}
      game = null;
      state = 'menu';
      window.__sfLoopErr = false;
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
      try { Input.releaseAll(); } catch (_) {}
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
      const skillLv = totalAllUpgradeLevels();
      const ready = countAllUpgradesReady();
      setStat('hubStatSkills', ready > 0
        ? t('ui.upgradeReady', { n: ready })
        : (skillLv > 0 ? `Lv ${skillLv} totaal` : 'Shards in avontuur'));
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
    try {
    this.syncTouchClass();
    const need = xpNeed(save.lvl);
    const w = weaponById(save.weapon);
    const st = styleById(save.style || 'classic');
    const pct = Math.round(save.xp / need * 100);
    ensureDaily();
    const dailyTasks = (save.daily && Array.isArray(save.daily.tasks)) ? save.daily.tasks : [];
    const readyClaim = claimableDailyTasks().length;
    const bonusReady = dailyTasks.length > 0 && dailyTasks.every(t => t.claimed) && !save.daily.dayBonusClaimed;
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
    document.getElementById('togMusic')?.classList.toggle('off', !save.music);
    document.getElementById('togSfx')?.classList.toggle('off', !save.sfx);
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
    } catch (err) {
      sfReportError('renderMenu', err, 'Menu kon niet ververst worden');
    }
  },

  renderMissions() {
    ensureDaily();
    const dailyHost = document.getElementById('dailyList');
    const achHost = document.getElementById('achList');
    if (!dailyHost || !achHost) return;
    const tasks = (save.daily && Array.isArray(save.daily.tasks)) ? save.daily.tasks : [];
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
        let holdX = 0;
        let holdY = 0;
        el.addEventListener('pointerdown', (e) => {
          holdSkip = false;
          holdX = e.clientX;
          holdY = e.clientY;
          holdT = setTimeout(() => {
            holdT = null;
            if (!uiTapAllowed() || (typeof uiGestureMoved === 'function' && uiGestureMoved())) return;
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
        el.addEventListener('pointermove', (e) => {
          if (!holdT) return;
          const slop = typeof uiTapSlopPx === 'function' ? uiTapSlopPx() : 12;
          if (Math.hypot(e.clientX - holdX, e.clientY - holdY) > slop) cancelHold();
        }, { passive: true });
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
    const face = (d) => (typeof gambleDiceFace === 'function' ? gambleDiceFace(d) : '?');
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
      const upLv = weaponUpgradeEligible(base) ? itemUpgradeLevel('weapon', w.id) : 0;
      const upMax = weaponUpgradeEligible(base) ? itemUpgradeMax('weapon', w.id) : 0;
      const upBadge = upLv > 0
        ? ` <span class="rar-pill" style="color:#ffd75e;border-color:#ffd75e">↑ Lv ${upLv}/${upMax}</span>`
        : '';
      const upLine = weaponUpgradeEligible(base) && (upLv > 0 || itemUpgradeShards('weapon', w.id) > 0)
        ? `<div class="cinfo" style="opacity:.82;font-size:12px;margin-top:3px">${weaponUpgradeSummary(w.id)}</div>`
        : '';
      const moveLine = labels
        ? `① ${labels[0]} · ② ${labels[1]} · ③ ${labels[2]} finisher${mastLine}`
        : (isThrowWeapon(w.id) ? 'Werp-projectiel — geen melee-combo' : '');
      info.innerHTML = `<div class="cname">${weaponLabel(w)} <span class="rar-pill" style="color:${rar.color};border-color:${rar.color}">${rarityLabel(w.rarity)}</span>${summonBadge}${tierBadge}${upBadge}</div>
        <div class="cinfo">${statLine}</div>` +
        upLine +
        (moveLine ? `<div class="cinfo" style="opacity:.78;font-size:12px;margin-top:3px">${moveLine}</div>` : '');
      el.appendChild(info);
      if (weaponUpgradeEligible(base)) appendItemUpgradeButton(el, 'weapon', w.id, () => this.renderWeapons());
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

  renderSkills(tab) {
    if (tab) this.upgradeTab = tab;
    this.renderUpgrades();
  },

  openUpgrades(tab) {
    this.upgradeTab = tab || 'skills';
    this.renderUpgrades();
    this.show('skillScreen');
  },

  renderUpgrades() {
    const tab = this.upgradeTab || 'skills';
    const head = document.getElementById('skillScreenHead');
    const sub = document.getElementById('skillScreenSub');
    if (head) head.textContent = t('ui.skillHead');
    const subKeys = {
      skills: 'ui.upgradeSubSkills',
      weapon: 'ui.upgradeSubWeapons',
      pet: 'ui.upgradeSubPets',
      style: 'ui.upgradeSubStyle',
    };
    if (sub) sub.textContent = t(subKeys[tab] || 'ui.skillSub');
    const bar = document.getElementById('upgradeTabBar');
    if (bar) {
      const tabs = [
        { id: 'skills', label: t('ui.skillTabSkills'), ready: countSkillUpgradesReady() },
        { id: 'weapon', label: t('ui.skillTabWeapons'), ready: countItemUpgradesReady('weapon') },
        { id: 'pet', label: t('ui.skillTabPets'), ready: countItemUpgradesReady('pet') },
        { id: 'style', label: t('ui.skillTabStyle'), ready: countItemUpgradesReady('style') },
      ];
      bar.innerHTML = tabs.map((tb) =>
        `<button type="button" role="tab" aria-selected="${tab === tb.id ? 'true' : 'false'}" ` +
        `class="dex-filter-btn${tab === tb.id ? ' active' : ''}" data-upgrade-tab="${tb.id}">${tb.label}` +
        (tb.ready > 0 ? `<span class="upgrade-tab-badge">${tb.ready}</span>` : '') +
        `</button>`
      ).join('');
      if (!bar.dataset.bound) {
        bar.dataset.bound = '1';
        bar.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-upgrade-tab]');
          if (!btn) return;
          AudioSys.sfx('select');
          UI.upgradeTab = btn.getAttribute('data-upgrade-tab') || 'skills';
          UI.renderUpgrades();
        });
      }
    }
    const sumEl = document.getElementById('skillSummary');
    if (sumEl) {
      const skillShards = save.stats?.skillShards || 0;
      const itemShards = save.stats?.itemShards || 0;
      const ready = countAllUpgradesReady();
      sumEl.style.display = 'block';
      sumEl.innerHTML =
        `Totaal <b>${totalAllUpgradeLevels()}</b> upgrade-levels · ` +
        `<b>${skillShards}</b> skill · <b>${itemShards}</b> item shards` +
        (ready > 0 ? ` · <b style="color:#ffd75e">${t('ui.upgradeReady', { n: ready })}</b>` : '') +
        `<div class="upgrade-shard-hint">${t('ui.upgradeShardHint')}</div>` +
        `<div style="font-size:11px;opacity:.72;margin-top:4px">Standaard max Lv ${UPGRADE_MAX_STANDARD} · mythische/extreme max Lv ${UPGRADE_MAX_EXTREME}</div>`;
    }
    if (tab === 'skills') this.renderUpgradeSkills();
    else this.renderUpgradeItems(tab);
  },

  renderUpgradeSkills() {
    const list = document.getElementById('skillList');
    if (!list) return;
    list.innerHTML = '';
    const groups = [
      { id: 'jutsu', title: t('ui.skillGroupJutsu'), ids: JUTSU_SKILL_IDS },
      { id: 'utility', title: t('ui.skillGroupUtility'), ids: SKILL_IDS.filter((id) => SKILL_DEFS[id].group === 'utility') },
    ];
    for (const g of groups) {
      const hdr = document.createElement('div');
      hdr.className = 'skill-group-head';
      hdr.textContent = g.title;
      list.appendChild(hdr);
      for (const id of g.ids) {
        const def = SKILL_DEFS[id];
        const lv = skillLevel(id);
        const maxLv = skillMaxLevel(id);
        const shards = skillShards(id);
        const cost = skillUpgradeCost(id);
        const canUp = skillCanUpgrade(id);
        const el = document.createElement('div');
        el.className = 'card skill-card' + (canUp ? ' claimable' : '') + (lv >= maxLv ? ' claimed' : '');
        el.style.borderColor = def.color + '88';
        const name = skillLabel(id);
        const now = skillUpgradeSummary(id);
        const next = skillNextStepPreview(id);
        const shardLine = cost != null
          ? t('ui.skillShards', { cur: shards, cost })
          : t('ui.skillMax');
        const desc = skillDesc(id);
        el.innerHTML =
          `<div class="skill-card-body"><div class="cname" style="color:${def.color}">${name} ` +
          `<span class="rar-pill" style="color:${def.color};border-color:${def.color}">${t('ui.skillLevel', { lv, max: maxLv })}</span></div>` +
          (desc ? `<div class="cinfo" style="opacity:.82;font-size:12px">${desc}</div>` : '') +
          `<div class="cinfo">${shardLine}</div>` +
          `<div class="cinfo" style="opacity:.88;font-size:12px;margin-top:4px"><b>${t('ui.skillNow')}:</b> ${now}</div>` +
          (next ? `<div class="cinfo" style="opacity:.75;font-size:11px;margin-top:3px"><b>${t('ui.skillNext')}:</b> ${next}</div>` : '') +
          `</div>`;
        if (canUp) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn claim-btn';
          btn.textContent = t('ui.skillUpgrade') + ` (${cost})`;
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            safeUiAction(() => {
              if (!trySkillUpgrade(id)) return;
              AudioSys.sfx('levelup');
              const nlv = skillLevel(id);
              UI.toast(t('toast.skillUpgraded', { name, lv: nlv, detail: skillUpgradeSummary(id) }), 3200);
              this.renderUpgrades();
            }, 'skillUp/' + id, 'Upgrade mislukt');
          });
          el.appendChild(btn);
        }
        list.appendChild(el);
      }
    }
  },

  renderUpgradeItems(cat) {
    const list = document.getElementById('skillList');
    if (!list) return;
    list.innerHTML = '';
    let items = [];
    if (cat === 'weapon') {
      items = WEAPONS.filter((w) => weaponUpgradeEligible(w)).map((w) => ({
        id: w.id, color: rarityOf(w.rarity).color,
      }));
    } else if (cat === 'pet') {
      items = PET_ROSTER.filter((p) => petUpgradeEligible(p)).map((p) => {
        const sp = SPECIES[p.speciesId];
        return { id: p.id, color: sp ? rarityOf(sp.rarity).color : '#7cf5ff' };
      });
    } else if (cat === 'style') {
      items = STYLES.filter((st) => styleUpgradeEligible(st)).map((st) => ({
        id: st.id, color: st.accent || '#c792ff',
      }));
    }
    items.sort((a, b) => itemUpgradeLevel(cat, b.id) - itemUpgradeLevel(cat, a.id));
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'step-card upgrade-empty';
      const emptyKeys = {
        weapon: 'ui.upgradeEmptyWeapons',
        pet: 'ui.upgradeEmptyPets',
        style: 'ui.upgradeEmptyStyle',
      };
      empty.textContent = t(emptyKeys[cat] || 'ui.skillSub');
      list.appendChild(empty);
      return;
    }
    for (const it of items) {
      list.appendChild(buildUpgradeItemCard(cat, it.id, it.color, () => this.renderUpgrades()));
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
      const upLv = tamed ? itemUpgradeLevel('pet', def.id) : 0;
      const upMax = tamed ? itemUpgradeMax('pet', def.id) : 0;
      const upBadge = upLv > 0 ? ` <span class="rar-pill" style="color:#ffd75e;border-color:#ffd75e">↑ Lv ${upLv}/${upMax}</span>` : '';
      info.innerHTML = `<div class="cname">${sp.name} <span class="rar-pill" style="color:${rar.color};border-color:${rar.color}">${rarityLabel(sp.rarity)}</span>${badge}${upBadge}</div>` +
        `<div class="cinfo">${def.perk}</div>` +
        `<div class="cinfo" style="opacity:.78;font-size:12px;margin-top:3px">${tamed
          ? 'Getemd · assist in avontuur'
          : (canBuy
            ? `Kopen: ${cost} pet coins`
            : `Temmen: ${Math.min(kills, need)}/${need} kills · of ${cost} 🪙`)}</div>` +
        (tamed && (upLv > 0 || itemUpgradeShards('pet', def.id) > 0)
          ? `<div class="cinfo" style="opacity:.82;font-size:12px;margin-top:3px">${petUpgradeSummary(def.id)}</div>` : '');
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
        appendItemUpgradeButton(el, 'pet', def.id, () => this.renderPets());
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
        const upLv = itemUpgradeLevel('style', st.id);
        const upMax = itemUpgradeMax('style', st.id);
        if (upLv > 0 || itemUpgradeShards('style', st.id) > 0) {
          const up = document.createElement('div');
          up.style.fontSize = '10px';
          up.style.fontWeight = '700';
          up.style.color = '#ffd75e';
          up.style.marginTop = '4px';
          up.textContent = `↑ Lv ${upLv}/${upMax} · ${styleUpgradeSummary(st.id)}`;
          el.appendChild(up);
        }
        appendItemUpgradeButton(el, 'style', st.id, () => this.renderStyle());
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

  hideVersionUpdateDialog() {
    const ov = document.getElementById('versionUpdateOverlay');
    if (ov) ov.hidden = true;
    const actions = document.getElementById('versionUpdateActions');
    if (actions) actions.replaceChildren();
  },

  _versionUpdateBtn(label, cls, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn mode-btn big-touch ' + (cls || 'b-gray');
    const div = document.createElement('div');
    div.textContent = label;
    btn.appendChild(div);
    btn.addEventListener('click', () => {
      try { AudioSys.sfx('select'); } catch (_) {}
      this.hideVersionUpdateDialog();
      onClick();
    });
    return btn;
  },

  showVersionUpdateBeforeReload(opts) {
    opts = opts || {};
    const ov = document.getElementById('versionUpdateOverlay');
    const title = document.getElementById('versionUpdateTitle');
    const body = document.getElementById('versionUpdateBody');
    const actions = document.getElementById('versionUpdateActions');
    if (!ov || !title || !body || !actions) {
      if (opts.onSkip) opts.onSkip();
      return;
    }
    title.textContent = t('versionUpdate.beforeTitle');
    body.textContent = opts.hasProgress
      ? t('versionUpdate.beforeBodyProgress', { summary: opts.summary || '', version: APP_VERSION })
      : t('versionUpdate.beforeBodyFresh', { version: APP_VERSION });
    actions.replaceChildren();
    if (opts.hasProgress) {
      actions.appendChild(this._versionUpdateBtn(t('versionUpdate.backupAndGo'), 'b-continue', () => {
        if (opts.onBackup) opts.onBackup();
      }));
    }
    actions.appendChild(this._versionUpdateBtn(t('versionUpdate.goWithout'), 'b-gray', () => {
      if (opts.onSkip) opts.onSkip();
    }));
    actions.appendChild(this._versionUpdateBtn(t('versionUpdate.cancel'), 'b-gray', () => {
      if (opts.onCancel) opts.onCancel();
    }));
    ov.hidden = false;
  },

  showVersionUpdateRestore(opts) {
    opts = opts || {};
    const stash = opts.stash;
    const ov = document.getElementById('versionUpdateOverlay');
    const title = document.getElementById('versionUpdateTitle');
    const body = document.getElementById('versionUpdateBody');
    const actions = document.getElementById('versionUpdateActions');
    if (!ov || !title || !body || !actions || !stash) return;
    title.textContent = t('versionUpdate.afterTitle');
    body.textContent = t('versionUpdate.afterBody', {
      from: stash.fromApp || '?',
      to: APP_VERSION,
      stashSummary: stash.summary || saveExportSummaryLine(stash.save),
      currentSummary: opts.currentSummary || saveExportSummaryLine(),
    });
    actions.replaceChildren();
    actions.appendChild(this._versionUpdateBtn(t('versionUpdate.useStash'), 'b-continue', () => {
      if (opts.onUse) opts.onUse();
    }));
    actions.appendChild(this._versionUpdateBtn(t('versionUpdate.keepCurrent'), 'b-gray', () => {
      if (opts.onSkip) opts.onSkip();
    }));
    ov.hidden = false;
  },

  showResult(win, data) {
    if (state === 'menu' || !data) return;
    this.lastResult = data;
    state = 'result';
    scheduleResize();
    document.getElementById('pauseBtn')?.classList.remove('show');
    const title = document.getElementById('resTitle');
    if (!title) return;
    title.textContent = data.title;
    title.className = 'bigres ' + (win ? 'win' : 'lose');
    const detailEl = document.getElementById('resDetail');
    if (detailEl) detailEl.textContent = data.detail;
    const xpEl = document.getElementById('resXp');
    if (xpEl) xpEl.textContent = t('result.xp', {
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

/* --- src/boot/start.js --- */
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
bindPress(document.getElementById('btnSkills'), () => {
  AudioSys.init(); AudioSys.sfx('select'); UI.openUpgrades('skills');
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
    } else if (key === 'musicVol') {
      let previewT = 0;
      const previewMusic = () => {
        if (save.music && (Number(save.musicVol) || 0) > 0.01) AudioSys.previewMusicVol();
      };
      el.addEventListener('change', previewMusic);
      el.addEventListener('input', () => {
        clearTimeout(previewT);
        previewT = setTimeout(previewMusic, 280);
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
  safeAsync(runVersionUpdateWithSavePrompt(), 'forceFresh', t('versionUpdate.fail'));
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

/* --- src/boot/loop.js --- */
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
