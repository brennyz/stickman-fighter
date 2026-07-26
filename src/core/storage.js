/* ============================== OPSLAG ================================= */
const SAVE_KEY = 'stickfighter_save_v1';
const SAVE_BACKUP_KEY = 'stickfighter_save_backup_v1';
const SAVE_STAMP_KEY = 'stickfighter_save_stamp_v1';
const VERSION_UPDATE_SAVE_KEY = 'stickfighter_version_update_save_v1';
const VERSION_UPDATE_FLAG_KEY = 'stickfighter_version_update_flag_v1';
const SAVE_EXPORT_SCHEMA = 3;
const APP_VERSION = '1.18.72';
/** Keep in sync with sw.js CACHE suffix */
const SW_CACHE_REV = 282;
const DEFAULT_SAVE = { lvl: 1, xp: 0, unlocked: 1, weapon: 'vuist', petCoins: 0, dex: {}, summons: {}, pets: {}, activePet: null,
  eggPets: {}, activeEggPet: null, eggDaily: null,




  advIsland: 0, advFails: {}, advMasterBuff: null,
  bestWall: 0, trainWins: 0, music: true, sfx: true, style: 'classic', stars: {},
  musicVol: 0.85, sfxVol: 1, shake: true, haptics: true, comboHud: true, bigTouch: true,
  reducedMotion: false, liteFx: false, highContrast: false, lang: null, lastPlay: null, tipsSeen: {},
  stats: { kills: 0, advWins: 0, wallBestRun: 0, maxCombo: 0, maxKillStreak: 0, trainMaxCombo: 0, pickups: 0, bossKills: 0, vsMatches: 0, vsWins: 0, matsCoinBest: 0, summonCount: 0, killsSinceSummon: 0, petsTamed: 0, eggsHatched: 0, weaponFinishers: 0, tideBattleWins: 0, skillShards: 0, itemShards: 0, dailyBonusCount: 0 },
  achievements: {}, daily: null, vsPlayedIds: [], weaponMastery: {}, skillUpgrades: {}, itemUpgrades: {}, activeJutsu: 'rasengan', skill: 'rasengan', super: 'ketsbam', missionsIntroSeen: false };

const MAX_LEVEL = 50;
const LEVELS_PER_ISLAND = 10;
const ISLAND_WEAPON_CAPS = [10, 20, 30, 40, 48];
const ADVENTURE_ISLANDS = [
  { id: 1, name: 'Oost-eiland', sub: 'Lv 1–10 · landweg', accent: '#5ad06a', theme: 'landweg',
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
  return fighterEquippedSkill(f).id;
}
function jutsuHudLabel(kind) {
  const sk = skillById(kind);
  return sk.banner || 'SPECIAL!';
}

/** Klein getekend jutsu-icoon (bliksem/oog/orb) voor HUD-markers. */
function drawJutsuMiniIcon(c, kind, x, y, color) {
  const sk = skillById(kind);
  const behavior = sk.behavior || 'orb';
  c.save();
  c.translate(x, y);
  c.strokeStyle = color || sk.color || '#7cf5ff';
  c.fillStyle = c.strokeStyle;
  c.lineWidth = 1.4;
  if (behavior === 'dash') {
    c.beginPath();
    c.moveTo(2, -5.5);
    c.lineTo(-2.5, 1);
    c.lineTo(0.3, 1);
    c.lineTo(-1.5, 5.5);
    c.lineTo(3.5, -1);
    c.lineTo(0.7, -1);
    c.closePath();
    c.fill();
  } else if (behavior === 'pull' || behavior === 'meteor') {
    c.beginPath(); c.ellipse(0, 0, 5.2, 3.2, 0, 0, TAU); c.stroke();
    c.beginPath(); c.arc(0, 0, 1.7, 0, TAU); c.fill();
  } else if (behavior === 'beam' || behavior === 'disc') {
    c.beginPath(); c.ellipse(0, 0, 6, 2.8, 0, 0, TAU); c.stroke();
    c.fillStyle = c.strokeStyle;
    c.beginPath(); c.arc(0, 0, 1.4, 0, TAU); c.fill();
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
      const sk = skillById(jutsuKind);
      const behavior = sk.behavior || 'orb';
      if (behavior === 'dash') {
        c.beginPath();
        c.moveTo(s * 0.35, -s);
        c.lineTo(-s * 0.55, s * 0.15);
        c.lineTo(s * 0.05, s * 0.15);
        c.lineTo(-s * 0.3, s);
        c.lineTo(s * 0.65, -s * 0.2);
        c.lineTo(s * 0.1, -s * 0.2);
        c.closePath();
        c.fill();
      } else if (behavior === 'pull' || behavior === 'meteor') {
        c.beginPath(); c.ellipse(0, 0, s, s * 0.62, 0, 0, TAU); c.stroke();
        c.beginPath(); c.arc(0, 0, s * 0.3, 0, TAU); c.fill();
      } else if (behavior === 'beam' || behavior === 'disc') {
        c.beginPath(); c.ellipse(0, 0, s * 1.05, s * 0.45, 0, 0, TAU); c.stroke();
        c.beginPath(); c.arc(0, 0, s * 0.25, 0, TAU); c.fill();
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
  const sk = SKILLS.find(s => s.id === kind);
  if (sk) return p2Slot ? '#ffb0b8' : sk.color;
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
    const jsk = SKILLS.find(s => s.id === spec.jutsu);
    if (jsk && (jsk.id === 'rinnegan' || jsk.behavior === 'pull')) critChance += 0.05;
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
  const eqSk = fighterEquippedSkill(f);
  if (eqSk && (eqSk.id === 'rinnegan' || eqSk.behavior === 'pull')) critChance += 0.05;
  return { critChance: clamp(critChance, 0, 0.42), critMul: prof.critMul };
}

function applyCritFx(game, x, y) {
  if (!game) return;
  game.floater(x, y - 132, 'CRIT!', '#ffd75e', 18, 'fx');
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
  const sk = (typeof skillExists === 'function' && skillExists(p.kind)) ? skillById(p.kind) : null;
  const hit = resolveProjHit(p);
  const kb = Math.sign(p.vx || 1) * (p.kind === 'rinnegan' ? 300 : 260);
  const dealt = tgt.takeDamage(hit.dmg, kb, game, {
    projWeaponId: p.kind === 'shuriken' ? (p.throwId || 'shuriken') : null,
  });
  if (dealt > 0) {
    applyHitStop(game, { kind: sk ? 'special' : 'punch', dmg: hit.dmg }, { crit: hit.crit, heavy: hit.dmg >= 18 });
  }
  game.floater(tgt.x, tgt.y - 115, '-' + dealt, col, 16);
  if (hit.crit) applyCritFx(game, tgt.x, tgt.y);
  if (p.pull) tgt.vx += Math.sign(p.vx || 1) * 160;
  spawnJutsuImpactFx(game, p.x, p.y, p.kind, 'full');
  if (sk && sk.behavior === 'orb' && sk.id === 'rasengan' && !fxLite() && !motionReduced()) {
    game.freezeT = Math.max(game.freezeT || 0, 0.045);
  }
  if (p.hitSet) p.hitSet.add(tgt);
  else if (!p.pierce) p.life = 0;
}

/** Vergelijk twee saves — hoogste score wint (voorkomt stille progressie-verlies). */
function saveProgressScore(s) {
  if (!s || typeof s !== 'object') return 0;
  const unlocked = Math.floor(Number(s.unlocked) || 1);
  const lvl = Math.floor(Number(s.lvl) || 1);
  const xp = Math.floor(Number(s.xp) || 0);
  const dex = Object.keys(s.dex || {}).length;
  let dexKills = 0;
  for (const v of Object.values(s.dex || {})) dexKills += Math.floor(Number(v) || 0);
  const ach = Object.keys(s.achievements || {}).length;
  const st = s.stats || {};
  const statSum = (st.advWins || 0) + (st.kills || 0) + (st.vsWins || 0) + (st.bossKills || 0);
  let starSum = 0;
  for (const v of Object.values(s.stars || {})) starSum += Math.floor(Number(v) || 0);
  return unlocked * 1e12 + lvl * 1e9 + xp * 1e6 + ach * 1e5 + dex * 1e4
    + dexKills * 1e3 + starSum * 1e2 + statSum;
}

function pickBestSave(primary, backup) {
  if (primary && backup) {
    const pScore = saveProgressScore(primary);
    const bScore = saveProgressScore(backup);
    if (bScore > pScore) {
      window.__sfRecoveredBackup = true;
      return backup;
    }
    return primary;
  }
  if (primary) return primary;
  if (backup) {
    window.__sfRecoveredBackup = true;
    return backup;
  }
  return null;
}

function loadSave() {
  let primaryRaw = null;
  let backupRaw = null;
  try { primaryRaw = localStorage.getItem(SAVE_KEY); } catch (_) {}
  try { backupRaw = localStorage.getItem(SAVE_BACKUP_KEY); } catch (_) {}
  const best = pickBestSave(readSaveJson(primaryRaw), readSaveJson(backupRaw));
  return best || Object.assign({}, DEFAULT_SAVE);
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
    merged.tipsSeen = sanitizeTipsSeen(parsed.tipsSeen);
    merged.advFails = Object.assign({}, parsed.advFails || {});
    if (parsed.eggDaily && typeof parsed.eggDaily === 'object') merged.eggDaily = Object.assign({}, parsed.eggDaily);
    if (typeof parsed.activePet === 'string') merged.activePet = parsed.activePet;
    if (typeof parsed.activeEggPet === 'string') merged.activeEggPet = parsed.activeEggPet;
    if (typeof parsed.activeJutsu === 'string') merged.activeJutsu = parsed.activeJutsu;
    // lang: copy raw — SUPPORTED_LANGS may not exist yet (storage loads before i18n)
    if (typeof parsed.lang === 'string') merged.lang = parsed.lang;
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

function writeSaveStamp(json) {
  try {
    localStorage.setItem(SAVE_STAMP_KEY, JSON.stringify({
      at: new Date().toISOString(),
      bytes: json.length,
      app: APP_VERSION,
    }));
  } catch (_) {}
}

/** Alleen hoofd-save schrijven — backup intact laten (nieuwe start / reset). */
function persistPrimaryOnly() {
  try {
    if (!save || typeof save !== 'object') return false;
    const json = JSON.stringify(save);
    localStorage.setItem(SAVE_KEY, json);
    writeSaveStamp(json);
    return true;
  } catch (e) {
    return false;
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
    let backupOk = false;
    try {
      localStorage.setItem(SAVE_BACKUP_KEY, json);
      backupOk = true;
    } catch (_) {}
    if (!backupOk && !window.__sfBackupWriteWarn) {
      window.__sfBackupWriteWarn = true;
      userToast('Backup opslaan mislukt — export save in Instellingen (hoofd-save wel OK)', 5200);
    }
    writeSaveStamp(json);
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

function applySaveFromBackupRaw() {
  try {
    const backup = readSaveJson(localStorage.getItem(SAVE_BACKUP_KEY));
    if (!backup) return false;
    save = sanitizeSave(backup);
    return persist();
  } catch (_) {
    return false;
  }
}

function restoreSaveFromBackup() {
  try {
    if (!applySaveFromBackupRaw()) {
      userToast('Backup herstellen mislukt — export save als je die hebt', 4200);
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
    writeSaveStamp(json);
    return true;
  } catch (err) {
    sfReportError('syncBackup', err, 'Backup sync mislukt');
    return false;
  }
}

/** tipsSeen flags → 0/1 (corrupt imports met [] of strings breken onboarding). */
function sanitizeTipsSeen(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const k of Object.keys(raw)) {
    if (typeof k !== 'string') continue;
    out[k.slice(0, 48)] = raw[k] ? 1 : 0;
  }
  return out;
}

/** Corrupte / gemanipuleerde saves veilig maken (localStorage + import). */
function sanitizeSave(s) {
  // Literal max — nooit TDZ op MAX_LEVEL (anders crashen alle click-handlers)
  const maxLevel = 50;
  const skillSnap = typeof snapshotSkillUpgradeTracks === 'function' ? snapshotSkillUpgradeTracks(s) : null;
  const itemSnap = typeof snapshotItemUpgradeTracks === 'function' ? snapshotItemUpgradeTracks(s) : null;
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
  out.tipsSeen = sanitizeTipsSeen(out.tipsSeen);
  out.missionsIntroSeen = !!out.missionsIntroSeen;
  if (out.lastPlay && typeof out.lastPlay === 'object') {
    const lp = out.lastPlay;
    if (!['adventure', 'training', 'wall', 'versus', 'coinrun'].includes(lp.mode)) out.lastPlay = null;
    else {
      const advCap = lp.mode === 'adventure' ? out.unlocked : maxLevel;
      let p1 = typeof lp.p1 === 'string' ? lp.p1.slice(0, 24) : undefined;
      let p2 = typeof lp.p2 === 'string' ? lp.p2.slice(0, 24) : undefined;
      if (typeof VS_ROSTER !== 'undefined') {
        if (p1 && !VS_ROSTER.some(r => r.id === p1)) p1 = undefined;
        if (p2 && !VS_ROSTER.some(r => r.id === p2)) p2 = undefined;
      }
      out.lastPlay = {
        mode: lp.mode,
        level: clamp(Math.floor(Number(lp.level) || 1), 1, advCap),
        p1,
        p2,
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

  if (typeof JUTSU_SKILL_IDS !== 'undefined' && JUTSU_SKILL_IDS.includes(out.activeJutsu)) {
    /* keep */
  } else {
    out.activeJutsu = 'rasengan';
  }
  if (out.eggDaily && typeof out.eggDaily === 'object') {
    const dk = typeof out.eggDaily.date === 'string'
      ? out.eggDaily.date.slice(0, 10)
      : (typeof todayKey === 'function' ? todayKey() : new Date().toISOString().slice(0, 10));
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

  const skPick = skillById(out.skill);
  let skillOk = skPick.id === 'rasengan';
  if (skPick.needLvl && out.lvl >= skPick.needLvl && !(skPick.needLvl > adventureWeaponCapForLevel(out.unlocked || 1))) skillOk = true;
  out.skill = skillOk ? skPick.id : 'rasengan';

  const spPick = superById(out.super);
  let superOk = spPick.id === 'ketsbam';
  if (spPick.needLvl && out.lvl >= spPick.needLvl && !(spPick.needLvl > adventureWeaponCapForLevel(out.unlocked || 1))) superOk = true;
  out.super = superOk ? spPick.id : 'ketsbam';

  const cleanStars = {};
  for (const [k, v] of Object.entries(out.stars || {})) {
    const n = parseInt(k, 10);
    if (n >= 1 && n <= maxLevel) cleanStars[n] = clamp(Math.floor(Number(v) || 0), 0, 3);
  }
  out.stars = cleanStars;

  // Bewaar kill-counts (Jager-prestatie); clamp corrupte waarden — nooit hard op 1 zetten
  const cleanDex = {};
  for (const [k, v] of Object.entries(out.dex || {})) {
    if (typeof SPECIES !== 'undefined' && !SPECIES[k]) continue;
    if (typeof SPECIES === 'undefined') break;
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
  if (typeof SKILL_IDS !== 'undefined') {
    for (const id of SKILL_IDS) {
      const fixed = typeof sanitizeSkillUpgradeEntry === 'function'
        ? sanitizeSkillUpgradeEntry(id, (out.skillUpgrades || {})[id])
        : null;
      if (fixed) cleanSkills[id] = fixed;
    }
  }
  out.skillUpgrades = cleanSkills;

  let aj = typeof out.activeJutsu === 'string' ? out.activeJutsu : 'rasengan';
  if (typeof JUTSU_SKILL_IDS !== 'undefined' && !JUTSU_SKILL_IDS.includes(aj)) aj = 'rasengan';
  if (typeof jutsuSkillUnlocked === 'function' && !jutsuSkillUnlocked(aj, out)) {
    aj = 'rasengan';
    for (const jid of JUTSU_SKILL_IDS) {
      if (jutsuSkillUnlocked(jid, out)) { aj = jid; break; }
    }
  }
  out.activeJutsu = aj;

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

  if (skillSnap && typeof restoreLostSkillUpgrades === 'function') restoreLostSkillUpgrades(skillSnap, out);
  if (itemSnap && typeof restoreLostItemUpgrades === 'function') restoreLostItemUpgrades(itemSnap, out);

  out.petCoins = clamp(Math.floor(Number(out.petCoins) || 0), 0, 999999);
  if (out.lang != null && typeof SUPPORTED_LANGS !== 'undefined' && !SUPPORTED_LANGS.includes(out.lang)) {
    out.lang = null;
  }

  out.stats = Object.assign({}, DEFAULT_SAVE.stats, out.stats || {});
  const cleanStats = {};
  for (const key of Object.keys(DEFAULT_SAVE.stats)) {
    cleanStats[key] = clamp(Math.floor(Number(out.stats[key]) || 0), 0, 9999999);
  }
  out.stats = cleanStats;

  const cleanAch = {};
  for (const [k, v] of Object.entries(out.achievements || {})) {
    if (typeof ACHIEVEMENTS !== 'undefined' && ACHIEVEMENTS.some(a => a.id === k) && typeof v === 'string') {
      cleanAch[k] = v.slice(0, 32);
    }
  }
  out.achievements = cleanAch;

  if (out.daily && typeof out.daily === 'object') {
    const dk = typeof out.daily.date === 'string'
      ? out.daily.date.slice(0, 10)
      : (typeof todayKey === 'function' ? todayKey() : new Date().toISOString().slice(0, 10));
    const tasks = Array.isArray(out.daily.tasks) ? out.daily.tasks : [];
    out.daily = {
      date: dk,
      tasks: tasks.filter(t => t && typeof dailyDef === 'function' && dailyDef(t.id)).map(t => {
        const def = dailyDef(t.id);
        const goal = def ? def.goal : 99999;
        const progress = clamp(Math.floor(Number(t.progress) || 0), 0, goal);
        const done = def ? progress >= goal : false;
        let claimed = !!t.claimed;
        if (claimed && !done) claimed = false;
        return {
          id: t.id,
          progress: done ? goal : progress,
          done,
          claimed,
        };
      }).slice(0, 5),
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
    if (typeof VS_ROSTER !== 'undefined' && VS_ROSTER.some(r => r.id === id) && !played.includes(id)) played.push(id);
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

