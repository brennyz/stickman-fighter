/* ============================== OPSLAG ================================= */
const SAVE_KEY = 'stickfighter_save_v1';
const SAVE_BACKUP_KEY = 'stickfighter_save_backup_v1';
const SAVE_STAMP_KEY = 'stickfighter_save_stamp_v1';
const VERSION_UPDATE_SAVE_KEY = 'stickfighter_version_update_save_v1';
const VERSION_UPDATE_FLAG_KEY = 'stickfighter_version_update_flag_v1';
const SAVE_EXPORT_SCHEMA = 3;
const APP_VERSION = '1.18.140';
/** Keep in sync with sw.js CACHE suffix */
const SW_CACHE_REV = 350;
const DEFAULT_SAVE = { lvl: 1, xp: 0, unlocked: 1, weapon: 'vuist', petCoins: 0, dex: {}, summons: {}, pets: {}, activePet: null,
  eggPets: {}, activeEggPet: null, eggDaily: null,
  chestDaily: null, chestWeapons: {},
  zoneWeapons: {},
  advIsland: 0, advFails: {}, advMasterBuff: null, advSatanAt: {},
  /** Normal / Nightmare / Hell — Epic Seven-stijl endgame tiers */
  advDiff: 'normal',
  advCleared: { normal: false, nightmare: false, hell: false },
  advHard: {
    nightmare: { unlocked: 1, stars: {}, fails: {}, masterBuff: null, satanAt: {} },
    hell: { unlocked: 1, stars: {}, fails: {}, masterBuff: null, satanAt: {} },
  },
  bestWall: 0, trainWins: 0, music: true, sfx: true, style: 'classic', stars: {},
  musicVol: 0.85, sfxVol: 1, shake: true, haptics: true, comboHud: true, bigTouch: true,
  /** null/undefined = auto via IS_TOUCH; true = force pads; false = force keyboard */
  showTouchPads: null,
  /** Keyboard legend on PC / when pads off (default on) */
  kbLegend: true,
  reducedMotion: false, liteFx: false, highContrast: false, lang: null, lastPlay: null, tipsSeen: {},
  stats: { kills: 0, advWins: 0, wallBestRun: 0, maxCombo: 0, maxKillStreak: 0, trainMaxCombo: 0, pickups: 0, bossKills: 0, vsMatches: 0, vsWins: 0, matsCoinBest: 0, summonCount: 0, killsSinceSummon: 0, petsTamed: 0, eggsHatched: 0, weaponFinishers: 0, tideBattleWins: 0, skillShards: 0, itemShards: 0, dailyBonusCount: 0 },
  achievements: {}, daily: null, vsPlayedIds: [], weaponMastery: {}, skillUpgrades: {}, itemUpgrades: {}, activeTechnique: 'spiral_orb', skill: 'spiral_orb', super: 'ketsbam', missionsIntroSeen: false };

const MAX_LEVEL = 70;
const LEVELS_PER_ISLAND = 10;
const ISLAND_COUNT = 7;
const ISLAND_WEAPON_CAPS = [10, 20, 30, 40, 48, 60, 70];
/** Avontuur moeilijkheidsgraden — Normal eerst; Nightmare 2.0 / Hell 3.0 na clear. */
const ADV_DIFFS = [
  {
    id: 'normal', order: 0, model: '1.0', accent: '#5ad06a',
    hpMul: 1, dmgMul: 1, rarityBoost: 0, eliteBonus: 0, giantBonus: 0,
    theme: null, xpMul: 1, dropMul: 1, speedMul: 1,
    enrageMul: 1, enrageAt: 0.5, hordeMul: 1, petCoinMul: 1,
  },
  {
    id: 'nightmare', order: 1, model: '2.0', accent: '#ff7a4d',
    hpMul: 1.48, dmgMul: 1.38, rarityBoost: 1, eliteBonus: 0.16, giantBonus: 0.1,
    theme: 'nightmare', xpMul: 1.35, dropMul: 1.42, speedMul: 1.09,
    enrageMul: 1.18, enrageAt: 0.58, hordeMul: 1.08, petCoinMul: 1.15,
  },
  {
    id: 'hell', order: 2, model: '3.0', accent: '#ff4a4a',
    hpMul: 1.95, dmgMul: 1.78, rarityBoost: 2, eliteBonus: 0.28, giantBonus: 0.16,
    theme: 'hell', xpMul: 1.7, dropMul: 1.8, speedMul: 1.16,
    enrageMul: 1.32, enrageAt: 0.68, hordeMul: 1.16, petCoinMul: 1.35,
  },
];
const ADV_DIFF_IDS = ADV_DIFFS.map((d) => d.id);
function emptyAdvHardBag() {
  return { unlocked: 1, stars: {}, fails: {}, masterBuff: null, satanAt: {} };
}
function advDiffMeta(id) {
  return ADV_DIFFS.find((d) => d.id === id) || ADV_DIFFS[0];
}
function normalizeAdvDiffId(id) {
  return ADV_DIFF_IDS.includes(id) ? id : 'normal';
}
function currentAdvDiff() {
  return normalizeAdvDiffId(save && save.advDiff);
}
function setAdvDiff(id) {
  const next = normalizeAdvDiffId(id);
  if (!advDiffAvailable(next)) return false;
  save.advDiff = next;
  persist();
  return true;
}
function advDiffAvailable(id) {
  const d = normalizeAdvDiffId(id);
  if (d === 'normal') return true;
  const cleared = (save && save.advCleared) || {};
  if (d === 'nightmare') return !!cleared.normal;
  if (d === 'hell') return !!cleared.nightmare;
  return false;
}
function advDiffLabel(id) {
  const meta = advDiffMeta(id);
  const name = typeof t === 'function' ? t('ui.diff.' + meta.id) : meta.id;
  return meta.model && meta.model !== '1.0' ? (name + ' ' + meta.model) : name;
}
function advDiffShort(id) {
  const meta = advDiffMeta(id);
  if (meta.id === 'nightmare') return 'NM 2.0';
  if (meta.id === 'hell') return 'HELL 3.0';
  return 'NORMAL';
}
function advDiffUnlockHint(id) {
  const d = normalizeAdvDiffId(id);
  if (d === 'nightmare') return typeof t === 'function' ? t('ui.diffUnlockNightmare') : ('Clear Normal Lv ' + MAX_LEVEL);
  if (d === 'hell') return typeof t === 'function' ? t('ui.diffUnlockHell') : ('Clear Nightmare Lv ' + MAX_LEVEL);
  return '';
}
function advDiffBlurb(id) {
  const d = normalizeAdvDiffId(id);
  let base = '';
  if (typeof t === 'function') {
    if (d === 'nightmare') base = t('ui.diffBlurbNightmare');
    else if (d === 'hell') base = t('ui.diffBlurbHell');
    else base = t('ui.diffBlurbNormal');
  } else if (d === 'nightmare') {
    base = 'Fire arena · earlier enrage · wilder rarities';
  } else if (d === 'hell') {
    base = 'Lava · screaming pain · mythic hordes';
  } else {
    base = 'Standard adventure';
  }
  if (save && save.advCleared && save.advCleared[d] && typeof t === 'function') {
    base += ' · ' + t('ui.diffBlurbSatanAfterClear');
  }
  return base;
}
function advPetCoinMul(diff) {
  return advDiffMeta(diff || currentAdvDiff()).petCoinMul || 1;
}
function ensureAdvHardBag(diff) {
  const d = normalizeAdvDiffId(diff);
  if (d === 'normal') return null;
  if (!save.advHard || typeof save.advHard !== 'object') save.advHard = {};
  if (!save.advHard[d] || typeof save.advHard[d] !== 'object') save.advHard[d] = emptyAdvHardBag();
  const bag = save.advHard[d];
  if (!bag.stars || typeof bag.stars !== 'object') bag.stars = {};
  if (!bag.fails || typeof bag.fails !== 'object') bag.fails = {};
  return bag;
}
function advUnlockedLevel(diff) {
  const d = normalizeAdvDiffId(diff || currentAdvDiff());
  if (d === 'normal') return clamp(Math.floor(Number(save.unlocked) || 1), 1, MAX_LEVEL);
  const bag = ensureAdvHardBag(d);
  return clamp(Math.floor(Number(bag.unlocked) || 1), 1, MAX_LEVEL);
}
function setAdvUnlockedLevel(n, diff) {
  const d = normalizeAdvDiffId(diff || currentAdvDiff());
  const lv = clamp(Math.floor(Number(n) || 1), 1, MAX_LEVEL);
  if (d === 'normal') save.unlocked = lv;
  else ensureAdvHardBag(d).unlocked = lv;
}
function advStarsFor(levelN, diff) {
  const d = normalizeAdvDiffId(diff || currentAdvDiff());
  const n = Math.floor(Number(levelN) || 0);
  if (d === 'normal') return (save.stars && save.stars[n]) || 0;
  const bag = ensureAdvHardBag(d);
  return (bag.stars && bag.stars[n]) || 0;
}
function setAdvStarsFor(levelN, stars, diff) {
  const d = normalizeAdvDiffId(diff || currentAdvDiff());
  const n = Math.floor(Number(levelN) || 0);
  const s = clamp(Math.floor(Number(stars) || 0), 0, 3);
  if (d === 'normal') {
    if (!save.stars || typeof save.stars !== 'object') save.stars = {};
    save.stars[n] = s;
  } else {
    const bag = ensureAdvHardBag(d);
    bag.stars[n] = s;
  }
}
function advFailCountFor(levelN, diff) {
  const d = normalizeAdvDiffId(diff || currentAdvDiff());
  const n = Math.floor(Number(levelN) || 0);
  if (d === 'normal') return (save.advFails && save.advFails[n]) || 0;
  const bag = ensureAdvHardBag(d);
  return (bag.fails && bag.fails[n]) || 0;
}
function bumpAdvFail(levelN, diff) {
  const d = normalizeAdvDiffId(diff || currentAdvDiff());
  const n = Math.floor(Number(levelN) || 0);
  if (d === 'normal') {
    if (!save.advFails || typeof save.advFails !== 'object') save.advFails = {};
    save.advFails[n] = (save.advFails[n] || 0) + 1;
    return save.advFails[n];
  }
  const bag = ensureAdvHardBag(d);
  bag.fails[n] = (bag.fails[n] || 0) + 1;
  return bag.fails[n];
}
function masterBuffLevel(diff) {
  const d = normalizeAdvDiffId(diff || currentAdvDiff());
  if (d === 'normal') return save.advMasterBuff || null;
  return ensureAdvHardBag(d).masterBuff || null;
}
function setMasterBuffLevel(levelN, diff) {
  const d = normalizeAdvDiffId(diff || currentAdvDiff());
  const mb = levelN == null ? null : clamp(Math.floor(Number(levelN) || 0), 1, MAX_LEVEL);
  if (d === 'normal') save.advMasterBuff = mb;
  else ensureAdvHardBag(d).masterBuff = mb;
}
function isAdvLevelCleared(n, diff) {
  const d = normalizeAdvDiffId(diff || currentAdvDiff());
  const unlocked = advUnlockedLevel(d);
  if (n < unlocked) return true;
  if (n === MAX_LEVEL && unlocked >= MAX_LEVEL) {
    if (advStarsFor(MAX_LEVEL, d) > 0) return true;
    if (save.advCleared && save.advCleared[d]) return true;
  }
  return false;
}
function markAdvDiffCleared(diff) {
  const d = normalizeAdvDiffId(diff);
  if (!save.advCleared || typeof save.advCleared !== 'object') {
    save.advCleared = { normal: false, nightmare: false, hell: false };
  }
  save.advCleared[d] = true;
}
function advDropChanceMul(diff) {
  return advDiffMeta(diff || currentAdvDiff()).dropMul || 1;
}
function advXpMul(diff) {
  return advDiffMeta(diff || currentAdvDiff()).xpMul || 1;
}
/** ASSET-STYLE file icons — adventure islands (assets/ui/island-*.svg). */
const ADVENTURE_ISLANDS = [
  { id: 1, name: 'Oost-eiland', sub: 'Lv 1–10 · landweg', accent: '#5ad06a', theme: 'landweg',
    icon: '<img class="island-ico" src="assets/ui/island-landweg.svg" alt="" width="24" height="24" decoding="async" draggable="false">' },
  { id: 2, name: 'Vuur-eiland', sub: 'Lv 11–20', accent: '#ff7a4d', theme: 'vulkaan',
    icon: '<img class="island-ico" src="assets/ui/island-vulkaan.svg" alt="" width="24" height="24" decoding="async" draggable="false">' },
  { id: 3, name: 'Neon-eiland', sub: 'Lv 21–30', accent: '#7cf5ff', theme: 'cyber',
    icon: '<img class="island-ico" src="assets/ui/island-cyber.svg" alt="" width="24" height="24" decoding="async" draggable="false">' },
  { id: 4, name: 'Tempel-eiland', sub: 'Lv 31–40', accent: '#ffd75e', theme: 'dojo',
    icon: '<img class="island-ico" src="assets/ui/island-dojo.svg" alt="" width="24" height="24" decoding="async" draggable="false">' },
  { id: 5, name: 'Finale-eiland', sub: 'Lv 41–50', accent: '#ff6b9d', theme: 'cyber',
    icon: '<img class="island-ico" src="assets/ui/island-finale.svg" alt="" width="24" height="24" decoding="async" draggable="false">' },
  { id: 6, name: 'Nachtmerrie', sub: 'Lv 51–60 · droomchaos', accent: '#c47aff', theme: 'nachtmerrie',
    icon: '<img class="island-ico" src="assets/ui/island-nachtmerrie.svg" alt="" width="24" height="24" decoding="async" draggable="false">' },
  { id: 7, name: 'Hel', sub: 'Lv 61–70 · zwavel & lava', accent: '#ff6a3d', theme: 'hel',
    icon: '<img class="island-ico" src="assets/ui/island-hel.svg" alt="" width="24" height="24" decoding="async" draggable="false">' },
];
function islandMeta(id) { return ADVENTURE_ISLANDS.find(i => i.id === id) || ADVENTURE_ISLANDS[0]; }
function islandCount() { return ADVENTURE_ISLANDS.length || ISLAND_COUNT; }
function islandProgress(islandId, diff) {
  const d = normalizeAdvDiffId(diff || currentAdvDiff());
  const { start, end } = islandLevelRange(islandId);
  const total = end - start + 1;
  let cleared = 0;
  let stars = 0;
  for (let n = start; n <= end; n++) {
    if (isAdvLevelCleared(n, d)) cleared++;
    stars += advStarsFor(n, d);
  }
  return { cleared, total, stars, maxStars: total * 3 };
}
function adventureProgressLine() {
  const cur = currentAdvIsland();
  const prog = islandProgress(cur);
  const isl = islandMeta(cur);
  return t('island.progress', {
    cur, name: islandLabel(cur, 'name'), cleared: prog.cleared, total: prog.total,
    unlocked: advUnlockedLevel(), max: MAX_LEVEL,
  });
}
function islandFromLevel(n) { return Math.min(islandCount(), Math.max(1, Math.ceil(n / LEVELS_PER_ISLAND))); }
function islandLevelRange(islandId) {
  const start = (islandId - 1) * LEVELS_PER_ISLAND + 1;
  return { start, end: Math.min(MAX_LEVEL, start + LEVELS_PER_ISLAND - 1) };
}
function currentAdvIsland(diff) {
  return islandFromLevel(advUnlockedLevel(diff || currentAdvDiff()) || 1);
}
function islandUnlocked(islandId, diff) {
  if (islandId <= 1) return true;
  return advUnlockedLevel(diff || currentAdvDiff()) > (islandId - 1) * LEVELS_PER_ISLAND;
}
function adventureWeaponCapForLevel(levelN) {
  const idx = Math.min(ISLAND_WEAPON_CAPS.length - 1, Math.max(0, Math.ceil(levelN / LEVELS_PER_ISLAND) - 1));
  return ISLAND_WEAPON_CAPS[idx];
}
function adventureWeaponCap() { return adventureWeaponCapForLevel(advUnlockedLevel('normal') || 1); }
function weaponSkillGated(w) {
  // Zone-drops (Nightmare/Hel): bruikbaar zodra verzameld — geen eiland-skill gate
  if (w && w.dropZone) return false;
  return w.unlock > adventureWeaponCap();
}
function weaponUnlockedByLevel(w) {
  if (!w) return false;
  if (w.dropZone) return typeof weaponZoneUnlocked === 'function' ? weaponZoneUnlocked(w) : !!(save.zoneWeapons && save.zoneWeapons[w.id]);
  if (save.chestWeapons && save.chestWeapons[w.id]) return true;
  return save.lvl >= w.unlock;
}
function weaponUsableNow(w) { return weaponUnlockedByLevel(w) && !weaponSkillGated(w); }
function styleSkillGated(st) { return !!(st.needLvl && st.needLvl > adventureWeaponCap()); }
function masterBuffActive(levelN, diff) {
  return masterBuffLevel(diff || currentAdvDiff()) === levelN;
}
function bestWeaponForAdventureCap(cap) {
  let best = weaponById('vuist');
  for (const base of WEAPONS) {
    if (base.dropZone) continue; // zone-wapens nooit via level-cap auto-pick
    if (!weaponUnlockedByLevel(base)) continue;
    if (base.unlock <= cap && base.unlock >= best.unlock) best = base;
  }
  return applySummonTier(best);
}
function playerWeaponForAdventure(levelN) {
  const w = playerWeapon();
  // Zone-wapens: zodra unlocked, altijd meenemen in avontuur
  if (w && w.dropZone && weaponUnlockedByLevel(w)) return w;
  const cap = adventureWeaponCapForLevel(levelN);
  if (w.unlock <= cap) return w;
  return bestWeaponForAdventureCap(cap);
}
function advFailCount(levelN, diff) { return advFailCountFor(levelN, diff || currentAdvDiff()); }
function advSatanReady(levelN, diff) {
  return typeof shouldTriggerSatan === 'function' ? shouldTriggerSatan(levelN, diff) : false;
}
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
function wallPauseSubtitle(g) {
  if (!g || g.mode !== 'wall') return '';
  const tLeft = Math.ceil(Math.max(0, g.wallTimer || 0));
  const stones = g.score || 0;
  const combo = g.combo || 0;
  const best = save.bestWall || 0;
  const paceDelta = wallRecordPaceDelta(g);
  const parts = [t('pause.wallTime', { n: tLeft }), t('pause.wallStones', { n: stones })];
  if (combo > 1) parts.push(t('pause.wallCombo', { n: combo }));
  if (best > 0 && paceDelta != null) {
    parts.push(paceDelta >= 0
      ? t('pause.wallPaceAhead', { n: paceDelta })
      : t('pause.wallPaceBehind', { n: Math.abs(paceDelta) }));
  } else if (best > 0 && stones < best) {
    parts.push(t('pause.wallGap', { gap: best - stones }));
  }
  return parts.join(' · ');
}
let save = loadSave();
function fighterTechniqueKind(f) {
  return fighterEquippedSkill(f).id;
}
function techniqueHudLabel(kind) {
  const sk = skillById(kind);
  return sk.banner || 'SPECIAL!';
}

/** Klein getekend technique-icoon (bliksem/oog/orb) voor HUD-markers. */
function drawTechniqueMiniIcon(c, kind, x, y, color) {
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
  } else if (behavior === 'slash') {
    c.beginPath();
    c.moveTo(-6, 0);
    c.lineTo(-2, -2.5);
    c.lineTo(0, 0);
    c.lineTo(2, 2.5);
    c.lineTo(6, 0);
    c.stroke();
    c.beginPath();
    c.arc(0, 0, 1.6, 0, TAU);
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
function drawTouchBtnIcon(c, id, x, y, r, techniqueKind) {
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
      const sk = skillById(techniqueKind);
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
      } else if (behavior === 'slash') {
        c.beginPath();
        c.moveTo(-s, 0);
        c.lineTo(-s * 0.35, -s * 0.35);
        c.lineTo(0, 0);
        c.lineTo(s * 0.35, s * 0.35);
        c.lineTo(s, 0);
        c.stroke();
        c.beginPath();
        c.moveTo(-s * 0.85, s * 0.25);
        c.lineTo(0, 0);
        c.lineTo(s * 0.85, -s * 0.25);
        c.stroke();
        c.beginPath();
        c.arc(0, 0, s * 0.22, 0, TAU);
        c.fill();
      } else if (behavior === 'pull' || behavior === 'meteor') {
        c.beginPath(); c.ellipse(0, 0, s, s * 0.62, 0, 0, TAU); c.stroke();
        c.beginPath(); c.arc(0, 0, s * 0.3, 0, TAU); c.fill();
      } else if (behavior === 'beam' || behavior === 'disc') {
        c.beginPath(); c.ellipse(0, 0, s * 1.05, s * 0.45, 0, 0, TAU); c.stroke();
        c.beginPath(); c.arc(0, 0, s * 0.25, 0, TAU); c.fill();
      } else {
        // spiral_orb: orb + spiraal
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

function techniqueAccentColor(kind, p2Slot) {
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
  blade_arts: { weaponDmg: 1.16, weaponCrit: 0.14, weaponCritMul: 1.72 },
  hitrun: { kickDmg: 1.12, kickCrit: 0.22, kickCritMul: 1.58 },
  quak: { punchDmg: 1.28, critAdd: -0.02 },
  void_sig: { techniqueCrit: 0.07, techniqueDmg: 1.06 },
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
  if (spec.kind === 'special' && sig.techniqueDmg) spec.dmg *= sig.techniqueDmg;
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
  if (k === 'special' || spec.technique) {
    critChance += sig.techniqueCrit || 0;
    const jsk = SKILLS.find(s => s.id === spec.technique);
    if (jsk && (jsk.id === 'void_gaze' || jsk.behavior === 'pull' || jsk.behavior === 'slash')) critChance += 0.05;
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
  if (attacker._wpnCritSurgeT > 0) critChance += 0.18;
  critChance = clamp(critChance, 0, 0.48);
  let dmg = spec.dmg * rand(0.9, 1.15) * mult;
  const crit = Math.random() < critChance;
  if (crit) dmg *= critMul;
  return { dmg: Math.max(1, Math.round(dmg)), crit };
}

function projCritMeta(f) {
  const prof = combatEntryFor(f);
  const sig = SIG_MODS[prof.sig] || {};
  let critChance = prof.crit + (sig.critAdd || 0) + (sig.techniqueCrit || 0);
  const eqSk = fighterEquippedSkill(f);
  if (eqSk && (eqSk.id === 'void_gaze' || eqSk.behavior === 'pull' || eqSk.behavior === 'slash')) critChance += 0.05;
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

function applyHitConfirmFx(game, x, y, spec, opts) {
  if (!game || motionReduced()) return;
  opts = opts || {};
  const kind = spec && spec.kind ? spec.kind : 'punch';
  let col = hitConfirmColor(kind);
  if (kind === 'weapon' && spec.move) col = weaponMoveFxColor(spec.move);
  if (opts.counter) col = '#ffd75e';
  const ringN = opts.counter ? (fxLite() ? 9 : 14) : (fxLite() ? 6 : 9);
  spawnFxRing(game, x, y, col, ringN);
  if (!fxLite()) {
    const burstN = opts.counter ? 5 : 3;
    const burstSize = opts.counter ? 2.4 : 2;
    game.burst(x, y, col, burstN, { kind: 'spark', size: burstSize });
  }
}

function isCounterHitWindow(target) {
  const a = target && target.attack;
  return !!(a && a.t < a.windup * 0.92);
}

/** Avontuur: monster in telegraph/dash/technique windup — counter-hit zonder dmg×. */
function isMonsterCounterWindow(m) {
  if (!m || !m.alive) return false;
  return (m.telegraphT > 0) || (m.dashT > 0) || (m.techniqueTelegraphT > 0);
}

function resolveProjHit(p) {
  let dmg = p.dmg * rand(0.9, 1.15);
  const crit = Math.random() < (p.critChance != null ? p.critChance : 0.08);
  if (crit) dmg *= (p.critMul != null ? p.critMul : 1.5);
  return { dmg: Math.max(1, Math.round(dmg)), crit };
}

/** Void Gaze lichtschits: horizontale strook L+R, dikte tapert met afstand tot centrum. */
function slashWaveHalfHeight(p, dist) {
  const r0 = p.r0 || p.r || 42;
  const maxR = Math.max(1, p.slashMaxReach || 460);
  const t = clamp(Math.abs(dist) / maxR, 0, 1);
  return Math.max(5, r0 * (1 - t * 0.82));
}

function projHitsTarget(p, tx, ty, tr) {
  if (p.slashWave) {
    const dx = tx - p.x;
    const dy = ty - p.y;
    const reach = p.slashReach || 0;
    if (Math.abs(dx) > reach + tr) return false;
    const halfH = slashWaveHalfHeight(p, dx);
    return Math.abs(dy) <= halfH + tr * 0.9;
  }
  return (p.x - tx) ** 2 + (p.y - ty) ** 2 < (p.r + tr) ** 2;
}

function projKnockDir(p, tgtX) {
  if (p.slashWave) return Math.sign((tgtX || 0) - p.x) || 1;
  return Math.sign(p.vx || 1) || 1;
}

function projStrikeFighter(game, p, tgt, col) {
  if (!tgt || !tgt.alive) return;
  const sk = (typeof skillExists === 'function' && skillExists(p.kind)) ? skillById(p.kind) : null;
  const hit = resolveProjHit(p);
  const dir = projKnockDir(p, tgt.x);
  const kbBase = p.kind === 'void_gaze' ? 340 : 260;
  const kb = dir * kbBase * (p.kbMul || 1);
  const dealt = tgt.takeDamage(hit.dmg, kb, game, {
    projWeaponId: (p.kind === 'shuriken' || p.kind === 'boemerang') ? (p.throwId || p.kind) : null,
  });
  if (dealt > 0) {
    applyHitStop(game, { kind: sk ? 'special' : 'punch', dmg: hit.dmg }, { crit: hit.crit, heavy: hit.dmg >= 18 });
  }
  game.floater(tgt.x, tgt.y - 115, '-' + dealt, col, 16);
  if (hit.crit) applyCritFx(game, tgt.x, tgt.y);
  if (p.pull) tgt.vx += dir * 160;
  spawnTechniqueImpactFx(game, p.x + (p.slashWave ? dir * Math.min(40, p.slashReach || 0) : 0), p.y, p.kind, 'full');
  if (sk && sk.behavior === 'orb' && sk.id === 'spiral_orb' && !fxLite() && !motionReduced()) {
    game.freezeT = Math.max(game.freezeT || 0, 0.045);
  }
  if (sk && sk.behavior === 'slash' && !fxLite() && !motionReduced()) {
    game.freezeT = Math.max(game.freezeT || 0, 0.04);
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
  let skUp = 0;
  for (const v of Object.values(s.skillUpgrades || {})) skUp += Math.floor(Number(v && v.level) || 0);
  let itUp = 0;
  for (const bag of Object.values(s.itemUpgrades || {})) {
    if (!bag || typeof bag !== 'object') continue;
    for (const v of Object.values(bag)) itUp += Math.floor(Number(v && v.level) || 0);
  }
  const petCoins = Math.floor(Number(s.petCoins) || 0);
  return unlocked * 1e12 + lvl * 1e9 + xp * 1e6 + ach * 1e5 + dex * 1e4
    + dexKills * 1e3 + starSum * 1e2 + statSum + skUp * 15 + itUp * 12 + petCoins;
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

/** Version-stash / export envelope: { schema, save: { lvl… } } → flat save object. */
function unwrapSavePayload(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return parsed;
  const inner = parsed.save;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    const meta = Object.assign({}, parsed._exportMeta || {}, {
      schema: parsed.schema,
      app: parsed.fromApp || parsed.app,
      exportedAt: parsed.stashedAt || parsed.exportedAt,
      summary: parsed.summary,
    });
    return Object.assign({}, inner, { _exportMeta: meta });
  }
  return parsed;
}

function readSaveJson(raw) {
  try {
    if (!raw || raw.length > 180000) return null;
    const parsed = unwrapSavePayload(JSON.parse(raw));
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
    merged.skillUpgrades = (parsed.skillUpgrades && typeof parsed.skillUpgrades === 'object' && !Array.isArray(parsed.skillUpgrades))
      ? Object.assign({}, parsed.skillUpgrades) : {};
    merged.itemUpgrades = { weapon: {}, pet: {}, style: {} };
    if (parsed.itemUpgrades && typeof parsed.itemUpgrades === 'object' && !Array.isArray(parsed.itemUpgrades)) {
      for (const cat of ['weapon', 'pet', 'style']) {
        const bag = parsed.itemUpgrades[cat];
        if (bag && typeof bag === 'object' && !Array.isArray(bag)) merged.itemUpgrades[cat] = Object.assign({}, bag);
      }
    }
    merged.tipsSeen = sanitizeTipsSeen(parsed.tipsSeen);
    merged.advFails = Object.assign({}, parsed.advFails || {});
    merged.advSatanAt = Object.assign({}, parsed.advSatanAt || {});
    merged.zoneWeapons = Object.assign({}, parsed.zoneWeapons || {});
    merged.chestWeapons = Object.assign({}, parsed.chestWeapons || {});
    if (parsed.chestDaily && typeof parsed.chestDaily === 'object') merged.chestDaily = Object.assign({}, parsed.chestDaily);
    merged.advCleared = Object.assign(
      { normal: false, nightmare: false, hell: false },
      (parsed.advCleared && typeof parsed.advCleared === 'object') ? parsed.advCleared : {}
    );
    merged.advHard = {
      nightmare: Object.assign(emptyAdvHardBag(), (parsed.advHard && parsed.advHard.nightmare) || {}),
      hell: Object.assign(emptyAdvHardBag(), (parsed.advHard && parsed.advHard.hell) || {}),
    };
    if (typeof parsed.advDiff === 'string') merged.advDiff = parsed.advDiff;
    if (parsed.eggDaily && typeof parsed.eggDaily === 'object') merged.eggDaily = Object.assign({}, parsed.eggDaily);
    if (typeof parsed.activePet === 'string') merged.activePet = parsed.activePet;
    if (typeof parsed.activeEggPet === 'string') merged.activeEggPet = parsed.activeEggPet;
    // Legacy key migration (hex-encoded tokens — store greps stay clean)
    const hexToStrEarly = (hex) => {
      let s = '';
      for (let i = 0; i < hex.length; i += 2) s += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
      return s;
    };
    const LEGACY_ACTIVE = hexToStrEarly('6163746976654a75747375');
    if (typeof parsed.activeTechnique === 'string') merged.activeTechnique = parsed.activeTechnique;
    else if (typeof parsed[LEGACY_ACTIVE] === 'string') merged.activeTechnique = parsed[LEGACY_ACTIVE];
    delete merged[LEGACY_ACTIVE];
    const SKILL_ALIASES_EARLY = {};
    const STYLE_ALIASES_EARLY = {};
    const SUPER_ALIASES_EARLY = {};
    const _add = (map, hex, id) => { map[hexToStrEarly(hex)] = id; };
    _add(SKILL_ALIASES_EARLY, '726173656e67616e', 'spiral_orb');
    _add(SKILL_ALIASES_EARLY, '636869646f7269', 'lightning_pierce');
    _add(SKILL_ALIASES_EARLY, '72696e6e6567616e', 'void_gaze');
    _add(SKILL_ALIASES_EARLY, '6b616d6568616d656861', 'wave_cannon');
    _add(SKILL_ALIASES_EARLY, '6b616d6568616d65', 'wave_cannon');
    _add(SKILL_ALIASES_EARLY, '67616c69636b5f67756e', 'violet_blast');
    _add(SKILL_ALIASES_EARLY, '7370697269745f626f6d62', 'energy_sphere');
    _add(SKILL_ALIASES_EARLY, '66696e616c5f666c617368', 'solar_beam');
    _add(SKILL_ALIASES_EARLY, '62616e6b6169', 'blade_ascend');
    _add(SKILL_ALIASES_EARLY, '62616e6b61695f736c617368', 'blade_ascend');
    _add(SKILL_ALIASES_EARLY, '67657473756761', 'moon_slash');
    _add(SKILL_ALIASES_EARLY, '6365726f', 'void_beam');
    _add(SKILL_ALIASES_EARLY, '65696768745f6761746573', 'iron_surge');
    _add(SKILL_ALIASES_EARLY, '385f6761746573', 'iron_surge');
    _add(SKILL_ALIASES_EARLY, '616b617473756b695f7374796c65', 'crimson_pact');
    _add(SKILL_ALIASES_EARLY, '6669726562616c6c5f6a75747375', 'fire_orb');
    _add(SKILL_ALIASES_EARLY, '6669726562616c6c5f626c617374', 'fire_orb');
    _add(SKILL_ALIASES_EARLY, '736861646f775f636c6f6e655f6275727374', 'clone_rush');
    _add(SKILL_ALIASES_EARLY, '67656e746c655f70616c6d', 'soft_palm');
    _add(SKILL_ALIASES_EARLY, '64657374727563746f5f64697363', 'cutter_disc');
    _add(SKILL_ALIASES_EARLY, '72617a6f725f64697363', 'cutter_disc');
    _add(SKILL_ALIASES_EARLY, '696e7374616e745f64617368', 'blink_strike');
    _add(SKILL_ALIASES_EARLY, '67756d5f726f636b6574', 'stretch_dash');
    _add(SKILL_ALIASES_EARLY, '676561725f7365636f6e64', 'steam_burst');
    _add(SKILL_ALIASES_EARLY, '737465616d5f72757368', 'steam_burst');
    _add(SKILL_ALIASES_EARLY, '736572696f75735f70756e6368', 'heavy_punch');
    _add(SKILL_ALIASES_EARLY, '746974616e5f66697374', 'heavy_punch');
    _add(SKILL_ALIASES_EARLY, '736572696f75735f626c617374', 'heavy_blast');
    _add(SKILL_ALIASES_EARLY, '746974616e5f6265616d', 'heavy_blast');
    _add(SKILL_ALIASES_EARLY, '6368616b7261', 'energy');
    _add(SKILL_ALIASES_EARLY, '656e657267795f636f7265', 'energy');
    _add(STYLE_ALIASES_EARLY, '6368616b7261', 'energy_glow');
    _add(STYLE_ALIASES_EARLY, '616b617473756b69', 'crimson_pact');
    _add(STYLE_ALIASES_EARLY, '6b6f6e6f6861', 'leaf_band');
    _add(STYLE_ALIASES_EARLY, '656e65726779', 'energy_glow');
    _add(SUPER_ALIASES_EARLY, '73686172696e67616e', 'mind_eye');
    const mapId = (id, map) => (typeof id === 'string' && map[id]) ? map[id] : id;
    if (typeof merged.activeTechnique === 'string') merged.activeTechnique = mapId(merged.activeTechnique, SKILL_ALIASES_EARLY);
    if (typeof merged.skill === 'string') merged.skill = mapId(merged.skill, SKILL_ALIASES_EARLY);
    if (typeof merged.style === 'string') merged.style = mapId(merged.style, STYLE_ALIASES_EARLY);
    if (typeof merged.super === 'string') merged.super = mapId(merged.super, SUPER_ALIASES_EARLY);
    if (merged.skillUpgrades && typeof merged.skillUpgrades === 'object') {
      const next = {};
      for (const [k, v] of Object.entries(merged.skillUpgrades)) {
        const nk = mapId(k, SKILL_ALIASES_EARLY);
        if (!v || typeof v !== 'object') continue;
        const prev = next[nk];
        const lv = Math.floor(Number(v.level) || 0);
        const sh = Math.floor(Number(v.shards) || 0);
        if (!prev) next[nk] = { level: lv, shards: sh };
        else next[nk] = { level: Math.max(prev.level, lv), shards: Math.max(prev.shards, sh) };
      }
      merged.skillUpgrades = next;
    }
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
  const maxLevel = 70;
  const maxIsland = 7;
  const skillSnap = typeof snapshotSkillUpgradeTracks === 'function' ? snapshotSkillUpgradeTracks(s) : null;
  const itemSnap = typeof snapshotItemUpgradeTracks === 'function' ? snapshotItemUpgradeTracks(s) : null;
  const out = Object.assign({}, DEFAULT_SAVE, s);
  delete out._exportMeta;
  if (typeof migrateLegacySkillSave === 'function') migrateLegacySkillSave(out);
  else {
    const leg = (typeof hexToStr === 'function')
      ? hexToStr('6163746976654a75747375')
      : null;
    if (leg && typeof out[leg] === 'string' && !out.activeTechnique) out.activeTechnique = out[leg];
    if (leg) delete out[leg];
  }
  out.lvl = clamp(Math.floor(Number(out.lvl) || 1), 1, 500);
  out.xp = clamp(Math.floor(Number(out.xp) || 0), 0, 999999);
  out.unlocked = clamp(Math.floor(Number(out.unlocked) || 1), 1, maxLevel);
  out.advIsland = clamp(Math.floor(Number(out.advIsland) || 0), 0, maxIsland);
  out.advDiff = normalizeAdvDiffId(out.advDiff);
  const clearedIn = (out.advCleared && typeof out.advCleared === 'object') ? out.advCleared : {};
  out.advCleared = {
    normal: !!clearedIn.normal,
    nightmare: !!clearedIn.nightmare,
    hell: !!clearedIn.hell,
  };
  // Migratie: campagne-einde gehaald (Lv70 of legacy Lv50) → Nightmare vrij
  if (!out.advCleared.normal) {
    const stars = out.stars || {};
    const sFinal = Number(stars[maxLevel]) || 0;
    const sLegacy = Number(stars[50]) || 0;
    if ((out.unlocked >= maxLevel && sFinal > 0) || (out.unlocked >= 50 && sLegacy > 0)) {
      out.advCleared.normal = true;
    }
  }
  const sanitizeHardBag = (raw) => {
    const bag = emptyAdvHardBag();
    const src = (raw && typeof raw === 'object') ? raw : {};
    bag.unlocked = clamp(Math.floor(Number(src.unlocked) || 1), 1, maxLevel);
    const stars = {};
    for (const [k, v] of Object.entries(src.stars || {})) {
      const n = parseInt(k, 10);
      if (n >= 1 && n <= maxLevel) stars[n] = clamp(Math.floor(Number(v) || 0), 0, 3);
    }
    bag.stars = stars;
    const fails = {};
    for (const [k, v] of Object.entries(src.fails || {})) {
      const n = parseInt(k, 10);
      if (n >= 1 && n <= maxLevel) fails[n] = clamp(Math.floor(Number(v) || 0), 0, 99);
    }
    bag.fails = fails;
    const mb = parseInt(src.masterBuff, 10);
    bag.masterBuff = (Number.isFinite(mb) && mb >= 1 && mb <= maxLevel) ? mb : null;
    const satanAt = {};
    for (const [k, v] of Object.entries(src.satanAt || {})) {
      const n = parseInt(k, 10);
      if (n >= 1 && n <= maxLevel) satanAt[n] = clamp(Math.floor(Number(v) || 0), 0, 99);
    }
    bag.satanAt = satanAt;
    return bag;
  };
  const hardIn = (out.advHard && typeof out.advHard === 'object') ? out.advHard : {};
  out.advHard = {
    nightmare: sanitizeHardBag(hardIn.nightmare),
    hell: sanitizeHardBag(hardIn.hell),
  };
  const hardCleared = (bag) => {
    if (!bag) return false;
    if (bag.unlocked >= maxLevel && (bag.stars[maxLevel] || 0) > 0) return true;
    // legacy: oude eindbaas Lv50
    if (bag.unlocked >= 50 && (bag.stars[50] || 0) > 0) return true;
    return false;
  };
  if (hardCleared(out.advHard.nightmare)) out.advCleared.nightmare = true;
  if (hardCleared(out.advHard.hell)) out.advCleared.hell = true;
  const canPickDiff = (id) => {
    if (id === 'normal') return true;
    if (id === 'nightmare') return !!out.advCleared.normal;
    if (id === 'hell') return !!out.advCleared.nightmare;
    return false;
  };
  if (!canPickDiff(out.advDiff)) out.advDiff = 'normal';
  const cleanFails = {};
  for (const [k, v] of Object.entries(out.advFails || {})) {
    const n = parseInt(k, 10);
    if (n >= 1 && n <= maxLevel) cleanFails[n] = clamp(Math.floor(Number(v) || 0), 0, 99);
  }
  out.advFails = cleanFails;
  const cleanSatanAt = {};
  for (const [k, v] of Object.entries(out.advSatanAt || {})) {
    const n = parseInt(k, 10);
    if (n >= 1 && n <= maxLevel) cleanSatanAt[n] = clamp(Math.floor(Number(v) || 0), 0, 99);
  }
  out.advSatanAt = cleanSatanAt;
  const mb = parseInt(out.advMasterBuff, 10);
  out.advMasterBuff = (Number.isFinite(mb) && mb >= 1 && mb <= maxLevel) ? mb : null;
  if (!out.advIsland && out.unlocked > 1) {
    out.advIsland = Math.min(maxIsland, Math.floor((out.unlocked - 1) / LEVELS_PER_ISLAND));
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
  // Tri-state: null = auto (device), true = force pads, false = force keyboard
  if (out.showTouchPads === true || out.showTouchPads === false) { /* keep */ }
  else out.showTouchPads = null;
  out.kbLegend = out.kbLegend !== false;
  out.reducedMotion = !!out.reducedMotion;
  out.liteFx = !!out.liteFx;
  out.highContrast = !!out.highContrast;
  out.tipsSeen = sanitizeTipsSeen(out.tipsSeen);
  out.missionsIntroSeen = !!out.missionsIntroSeen;
  if (out.lastPlay && typeof out.lastPlay === 'object') {
    const lp = out.lastPlay;
    if (!['adventure', 'training', 'wall', 'coinrun'].includes(lp.mode)) out.lastPlay = null;
    else {
      const advCap = maxLevel;
      out.lastPlay = {
        mode: lp.mode,
        level: clamp(Math.floor(Number(lp.level) || 1), 1, advCap),
      };
      const diffId = (lp.mode === 'adventure' && ADV_DIFF_IDS.includes(lp.difficulty))
        ? lp.difficulty : undefined;
      if (diffId) out.lastPlay.difficulty = diffId;
    }
  } else out.lastPlay = null;
  if (!WEAPONS.some(w => w.id === out.weapon)) out.weapon = 'vuist';

  // Zone-wapens (Nachtmerrie / Hel drops)
  const cleanZone = {};
  for (const [k, v] of Object.entries(out.zoneWeapons || {})) {
    if (!v) continue;
    const w = WEAPONS.find(x => x.id === k);
    if (w && w.dropZone) cleanZone[k] = 1;
  }
  out.zoneWeapons = cleanZone;

  out.chestWeapons = typeof sanitizeChestWeapons === 'function'
    ? sanitizeChestWeapons(out.chestWeapons)
    : {};

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
    const row = {
      kills: clamp(Math.floor(Number(entry.kills) || 0), 0, 999999),
    };
    if (typeof entry.src === 'string') row.src = entry.src.slice(0, 12);
    if (typeof entry.skill === 'string') row.skill = entry.skill.slice(0, 48);
    if (entry.coins != null) row.coins = clamp(Math.floor(Number(entry.coins) || 0), 0, 999999);
    cleanPets[k] = row;
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

  if (typeof TECHNIQUE_SKILL_IDS !== 'undefined' && TECHNIQUE_SKILL_IDS.includes(out.activeTechnique)) {
    /* keep */
  } else {
    out.activeTechnique = 'spiral_orb';
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

  {
    const today = typeof todayKey === 'function' ? todayKey() : new Date().toISOString().slice(0, 10);
    if (typeof sanitizeChestDaily === 'function') {
      out.chestDaily = sanitizeChestDaily(out.chestDaily, today);
    } else if (out.chestDaily && typeof out.chestDaily === 'object') {
      const w = Math.max(0, Math.min(5, Math.floor(Number(out.chestDaily.wLeft) || 0)));
      const p = Math.max(0, Math.min(5, Math.floor(Number(out.chestDaily.pLeft) || 0)));
      const leftRaw = out.chestDaily.left != null ? Number(out.chestDaily.left) : (w + p);
      out.chestDaily = {
        date: today,
        left: Math.max(0, Math.min(10, Math.floor(Number.isFinite(leftRaw) ? leftRaw : 10))),
        pulls: [],
      };
    } else out.chestDaily = null;
  }

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
  let skillOk = skPick.id === 'spiral_orb';
  if (skPick.needLvl && out.lvl >= skPick.needLvl && !(skPick.needLvl > adventureWeaponCapForLevel(out.unlocked || 1))) skillOk = true;
  out.skill = skillOk ? skPick.id : 'spiral_orb';

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

  let aj = typeof out.activeTechnique === 'string' ? out.activeTechnique : 'spiral_orb';
  if (typeof TECHNIQUE_SKILL_IDS !== 'undefined' && !TECHNIQUE_SKILL_IDS.includes(aj)) aj = 'spiral_orb';
  if (typeof techniqueSkillUnlocked === 'function' && !techniqueSkillUnlocked(aj, out)) {
    aj = 'spiral_orb';
    for (const jid of TECHNIQUE_SKILL_IDS) {
      if (techniqueSkillUnlocked(jid, out)) { aj = jid; break; }
    }
  }
  out.activeTechnique = aj;

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

const PICKUP_TYPES = ['heal', 'rage', 'energy', 'shield'];
const PICKUP_META = {
  heal:   { color: '#6ee06e', label: '+HP' },
  rage:   { color: '#ff7a4d', label: 'RAGE' },
  energy: { color: '#7cf5ff', label: 'ENERGY' },
  shield: { color: '#9fd8ff', label: 'SCHILD' },
  skill_shard: { color: '#ffd75e', label: 'SKILL' },
  item_shard: { color: '#c792ff', label: 'ITEM' },
};

