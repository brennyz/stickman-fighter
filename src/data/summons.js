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
const playerWeapon = () => applySummonTier(weaponById(save.weapon));

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
  const fam = weaponMoveFamily(id);
  if (!fam) return null;
  const set = WEAPON_MOVE_FAMILIES[fam] || WEAPON_MOVE_FAMILIES.slash;
  const moves = set && set.moves;
  if (!moves || !moves.length) return WEAPON_MOVE_FAMILIES.slash.moves[0];
  const n = ((idx || 0) % 3 + 3) % 3;
  return moves[n] || moves[0];
}

function weaponMoveLabels(id) {
  const fam = weaponMoveFamily(id);
  if (!fam) return null;
  const set = WEAPON_MOVE_FAMILIES[fam] || WEAPON_MOVE_FAMILIES.slash;
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

function resetWeaponCombo(f) {
  if (!f) return;
  f.weaponComboIdx = 0;
  f.weaponComboT = 0;
  f._lastWeaponKind = null;
  f._weaponComboPrimed = false;
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
  spec.r = Math.max(18, spec.r || 24);
  if (spec.moveHitY != null) spec.moveHitY = clamp(spec.moveHitY, -32, 24);
  return spec;
}

function drawWeaponStylePips(c, x, y, fighter) {
  if (!fighter || !weaponMoveFamily(fighter.weapon?.id) || fighter.weaponComboT <= 0) return;
  for (let i = 0; i < 3; i++) {
    c.fillStyle = i <= fighter.weaponComboIdx ? '#ffd75e' : 'rgba(255,255,255,.22)';
    c.beginPath();
    c.arc(x + i * 13, y, 3.5, 0, TAU);
    c.fill();
  }
}

