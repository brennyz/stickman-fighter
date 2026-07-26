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

/** 2% per avontuur-level: zwaard → Master Sword — UIT (zorgde voor plotselinge run-breaks). */
const MASTER_SWORD_DURATION = 15;
const MASTER_SWORD_CHANCE = 0;
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
  // UIT: zeldzame summon-ascend (epic/legendary) crashte runs midden in combo-spam
  return false;
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
  waaier: 'wFan',
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
  fuuma: 'wFuuma',
  kristal: 'wLaser',
  donder: 'wDonder',
  vlamzweep: 'wLaser',
  void: 'wVoid',
  sterkling: 'wZwaard',
  guvve: 'wGuvve',
  master_sword: 'wMaster',
};

const FAMILY_SWING_SFX = {
  slash: 'wZwaard',
  spear: 'wSpeer',
  blunt: 'wKnuppel',
  chain: 'wNunchaku',
  hook: 'wKunai',
  fan: 'wFan',
  dual: 'wKunai',
  energy: 'wLaser',
};

function weaponSwingSfx(weaponOrId, attackKind) {
  if (attackKind === 'kick') return 'kick';
  if (attackKind === 'punch') return 'punch';
  const id = typeof weaponOrId === 'string' ? weaponOrId : (weaponOrId && weaponOrId.id);
  if (WEAPON_SWING_SFX[id]) return WEAPON_SWING_SFX[id];
  const fam = weaponMoveFamily(id);
  if (fam && FAMILY_SWING_SFX[fam]) return FAMILY_SWING_SFX[fam];
  return 'swing';
}

function weaponThrowSfx(id) {
  if (id === 'fuuma') return 'wFuuma';
  if (id === 'boemerang') return 'wBoemerang';
  return 'shuriken';
}

function weaponFinisherSfx(weaponOrId) {
  const id = typeof weaponOrId === 'string' ? weaponOrId : (weaponOrId && weaponOrId.id);
  if (id === 'master_sword') return 'wMaster';
  const fam = weaponMoveFamily(id);
  if (fam === 'blunt') return 'hitHeavy';
  if (fam === 'energy') return 'hitEnergy';
  if (fam === 'chain' || fam === 'fan') return 'wBoemerang';
  if (fam === 'spear') return 'wSpeer';
  if (fam === 'slash' || fam === 'hook' || fam === 'dual') return 'wZwaard';
  return 'comboEpic';
}

function weaponHitSfx(weaponOrId, dmg) {
  const id = typeof weaponOrId === 'string' ? weaponOrId : (weaponOrId && weaponOrId.id);
  if (id === 'laser' || id === 'void' || id === 'donder' || id === 'kristal' || id === 'vlamzweep' || id === 'sterkling' || id === 'master_sword') return 'hitEnergy';
  if (id === 'hamer' || id === 'knuppel' || id === 'guvve' || id === 'bostaf') return 'hitHeavy';
  if (id === 'zwaard' || id === 'ketting' || id === 'kunai' || id === 'tanto' || id === 'sai' || id === 'kama' || id === 'zeis' || id === 'drietand' || id === 'nunchaku' || id === 'tonfa' || id === 'speer') return 'hitMetal';
  if (id === 'shuriken' || id === 'fuuma') return 'hitMetal';
  if (id === 'boemerang') return 'hit2';
  if (id === 'waaier') return 'hit2';
  const w = typeof weaponOrId === 'object' && weaponOrId ? weaponOrId : (typeof weaponById === 'function' ? weaponById(id) : null);
  if (w && (w.rarity === 'nightmare' || w.rarity === 'hell')) {
    if (w.effect === 'quake' || w.effect === 'meteor' || w.effect === 'quakboom') return 'hitHeavy';
    if (w.effect === 'burn' || w.effect === 'inferno' || w.effect === 'sonic') return 'hitEnergy';
    return 'hit2';
  }
  if (dmg > 22) return 'hit2';
  return 'hit';
}

function playWeaponPickFeedback(id) {
  AudioSys.sfx('select');
  if (save.haptics !== false) haptic(6);
  setTimeout(() => {
    try { AudioSys.sfx(weaponSwingSfx(id)); } catch (_) {}
  }, 48);
}

function isThrowWeapon(id) {
  return id === 'shuriken' || id === 'fuuma' || id === 'boemerang';
}

/** Per wapen: 3 opeenvolgende melee-bewegingen (combo-ketting ~1,4s). */
const WEAPON_MOVE_FAMILIES = {
  slash: {
    labels: ['Horizontale snede', 'Opwaartse kling', 'Overhead-finisher'],
    moves: [
      { pose: 'slash', rangeMul: 1, dmgMul: 1, kbMul: 1, hitY: 0, windupMul: 1, activeMul: 1 },
      { pose: 'upper', rangeMul: 0.96, dmgMul: 1.04, kbMul: 1.08, hitY: -22, windupMul: 0.94, activeMul: 0.95 },
      { pose: 'overhead', rangeMul: 1.06, dmgMul: 1.1, kbMul: 1.16, hitY: -10, windupMul: 1.06, activeMul: 0.98 },
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
    labels: ['Haak', 'Lage rippen', 'Opwaartse sikkel'],
    moves: [
      { pose: 'hook', rangeMul: 1, dmgMul: 1, kbMul: 1.08, hitY: 4, windupMul: 0.96, activeMul: 1 },
      { pose: 'sweep', rangeMul: 1.04, dmgMul: 1.02, kbMul: 1.05, hitY: 16, windupMul: 0.94, activeMul: 0.98 },
      { pose: 'upper', rangeMul: 1.06, dmgMul: 1.1, kbMul: 1.14, hitY: -16, windupMul: 1.04, activeMul: 1 },
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
      { pose: 'slash', rangeMul: 1, dmgMul: 1, kbMul: 1, hitY: -2, windupMul: 0.92, activeMul: 0.95 },
      { pose: 'hook', rangeMul: 0.98, dmgMul: 1.04, kbMul: 1.06, hitY: 6, windupMul: 0.9, activeMul: 0.92 },
      { pose: 'spin', rangeMul: 1.08, dmgMul: 1.08, kbMul: 1.12, hitY: -4, windupMul: 1.02, activeMul: 1.04 },
    ],
  },
  energy: {
    labels: ['Energie-zwaai', 'Opwaartse focus', 'Nova-sweep'],
    moves: [
      { pose: 'slash', rangeMul: 1, dmgMul: 1, kbMul: 1.02, hitY: -4, windupMul: 0.94, activeMul: 0.98 },
      { pose: 'upper', rangeMul: 1.06, dmgMul: 1.06, kbMul: 1.1, hitY: -16, windupMul: 1.02, activeMul: 1 },
      { pose: 'spin', rangeMul: 1.06, dmgMul: 1.08, kbMul: 1.14, hitY: 0, windupMul: 1.06, activeMul: 1.02 },
    ],
  },
};

/** Per wapen: eigen 1-2-3 stijl (labels + optionele move-tweaks; stats erven anders van family). */
const WEAPON_COMBOS = {
  kunai: {
    labels: ['Kunai-snit', 'Ruk-terug', 'Kruis-snede'],
    moves: [
      { pose: 'slash', rangeMul: 1.02, dmgMul: 1, kbMul: 1, hitY: -2, windupMul: 0.9, activeMul: 0.92 },
      { pose: 'hook', rangeMul: 0.98, dmgMul: 1.02, kbMul: 1.04, hitY: 2, windupMul: 0.88, activeMul: 0.9 },
      { pose: 'slash', rangeMul: 1.04, dmgMul: 1.06, kbMul: 1.08, hitY: 0, windupMul: 0.94, activeMul: 0.96 },
    ],
  },
  tanto: {
    labels: ['Quick-draw', 'Omkeer-haak', 'Diepe snede'],
    moves: [
      { pose: 'slash', rangeMul: 0.98, dmgMul: 1, kbMul: 0.98, hitY: 0, windupMul: 0.82, activeMul: 0.88 },
      { pose: 'hook', rangeMul: 1, dmgMul: 1.02, kbMul: 1.04, hitY: 4, windupMul: 0.86, activeMul: 0.9 },
      { pose: 'upper', rangeMul: 1.04, dmgMul: 1.08, kbMul: 1.12, hitY: -14, windupMul: 0.98, activeMul: 1 },
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
    labels: ['Schaduw-sweep', 'Rip-sikkel', 'Zeis-ophaal'],
    moves: [
      { pose: 'sweep', rangeMul: 1.08, dmgMul: 1, kbMul: 1.02, hitY: 12, windupMul: 0.96, activeMul: 1.02 },
      { pose: 'hook', rangeMul: 1.04, dmgMul: 1.04, kbMul: 1.08, hitY: 6, windupMul: 0.94, activeMul: 1 },
      { pose: 'upper', rangeMul: 1.1, dmgMul: 1.12, kbMul: 1.16, hitY: -14, windupMul: 1.06, activeMul: 1.02 },
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
  nachtkaars: { labels: ['Wax-snit', 'Drip-stoot', 'Kaars-finisher'] },
  droomprikker: { labels: ['Prik', 'Droom-haak', 'Slapeloos'] },
  spooklepel: { labels: ['Lepel-slap', 'Omkeer', 'Spook-scoop'] },
  nachtmerriesok: { labels: ['Sok-slap', 'Nat-zwiep', 'Was-finisher'] },
  echotrompet: { labels: ['Blaas', 'Echo-sweep', 'Fanfare'] },
  schaduwbanaan: { labels: ['Schil', 'Slip-stoot', 'Banaan-boom'] },
  voidvork: { labels: ['Vork-prik', 'Leegte-hap', 'Drie-tand'] },
  angstaccordeon: { labels: ['Zuig-akkoord', 'Pomp', 'Angst-crescendo'] },
  slaapkussen: { labels: ['Pluis-klop', 'Kussen-slam', 'Nacht-uit'] },
  spooktoaster: { labels: ['Toast-in', 'Pop!', 'Verbrand'] },
  droomspiegel: { labels: ['Spiegel-snit', 'Reflect', 'Krit-nova'] },
  nachtuilvleugel: { labels: ['Fladder', 'Uil-sweep', 'Nachtvlucht'] },
  waanballon: { labels: ['Opblazen', 'Wobble', 'POP!'] },
  schriktandwiel: { labels: ['Rammel', 'Tand-hak', 'Gear-grind'] },
  hellevork: { labels: ['Zwavel-prik', 'Hel-stoot', 'Drie-vlam'] },
  lavalepel: { labels: ['Schep-lava', 'Plas-slam', 'Magma-scoop'] },
  duiveltrommel: { labels: ['Beuk', 'Rol-slag', 'Hel-solo'] },
  zwavelzeep: { labels: ['Glad', 'Schuim-stoot', 'Zeep-boom'] },
  infernoijsje: { labels: ['Lik-koud', 'Smelt', 'Inferno-dip'] },
  helhamsterwiel: { labels: ['Rol', 'Chaos-spin', 'Wiel-crash'] },
  brimstonebanaan: { labels: ['Schil', 'Brim-slip', 'Knal-banaan'] },
  demondoekje: { labels: ['Veeg', 'Wipe', 'EXECUTE'] },
  asaccordeon: { labels: ['As-zuig', 'Pomp-vuur', 'Crescendo'] },
  chiliketting: { labels: ['Chili-flurry', 'Kettingsmaak', 'Brand-regen'] },
  helgitaar: { labels: ['Riff', 'Powerchord', 'Solo-finisher'] },
  pyroeend: { labels: ['QUAK', 'Vlam-eend', 'BOOM-eend'] },
  apocalypslepel: { labels: ['Wereld-schep', 'Meteor-scoop', 'EINDE'] },
  master_sword: {
    labels: ['Licht-slice', 'Zwaard-dans', 'Triforce-hak'],
    moves: [
      { pose: 'slash', rangeMul: 1.06, dmgMul: 1.04, kbMul: 1.06, hitY: 0, windupMul: 0.92, activeMul: 0.96 },
      { pose: 'spin', rangeMul: 1.1, dmgMul: 1.08, kbMul: 1.12, hitY: -4, windupMul: 0.98, activeMul: 1.02 },
      { pose: 'overhead', rangeMul: 1.12, dmgMul: 1.14, kbMul: 1.2, hitY: -12, windupMul: 1.06, activeMul: 1 },
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
  if (id === 'speer' || id === 'drietand' || id === 'bostaf' || id === 'echotrompet' || id === 'helgitaar') return 'spear';
  if (id === 'knuppel' || id === 'hamer' || id === 'tonfa' || id === 'guvve' || id === 'donder'
    || id === 'slaapkussen' || id === 'duiveltrommel' || id === 'apocalypslepel' || id === 'pyroeend') return 'blunt';
  if (id === 'nunchaku' || id === 'ketting' || id === 'vlamzweep' || id === 'chiliketting'
    || id === 'angstaccordeon' || id === 'asaccordeon' || id === 'helhamsterwiel') return 'chain';
  if (id === 'kama' || id === 'zeis' || id === 'voidvork' || id === 'hellevork' || id === 'droomprikker') return 'hook';
  if (id === 'waaier' || id === 'nachtuilvleugel' || id === 'demondoekje') return 'fan';
  if (id === 'sai' || id === 'nachtmerriesok' || id === 'zwavelzeep') return 'dual';
  if (id === 'laser' || id === 'void' || id === 'kristal' || id === 'sterkling'
    || id === 'nachtkaars' || id === 'spooktoaster' || id === 'droomspiegel' || id === 'waanballon'
    || id === 'lavalepel' || id === 'infernoijsje' || id === 'brimstonebanaan') return 'energy';
  if (id === 'spooklepel' || id === 'schaduwbanaan' || id === 'schriktandwiel') return 'slash';
  return 'slash';
}

/** Idle grip: speer horizontaal, zeis/kama meer rechtop — voorkomt “alles is speer”. */
function weaponIdleAngle(id) {
  if (id === 'zeis') return -1.2;
  if (id === 'kama') return -1.05;
  if (id === 'hamer' || id === 'donder') return -1.12;
  if (id === 'tonfa') return -0.95;
  if (id === 'void') return -0.55;
  if (id === 'waaier') return -0.32;
  const fam = weaponMoveFamily(id);
  if (!fam) return -0.45;
  if (fam === 'spear') return -0.1;
  if (fam === 'blunt') return -1.05;
  if (fam === 'hook') return -0.95;
  if (fam === 'chain') return -0.78;
  if (fam === 'fan') return -0.32;
  if (fam === 'dual') return -0.58;
  if (fam === 'energy') return -0.5;
  return -0.72;
}

/** Extra rotatie t.o.v. onderarm — alleen thrust/spear blijft speer-uitgelijnd. */
function weaponGripBias(id, move) {
  const pose = (move && move.pose) || '';
  const fam = weaponMoveFamily(id);
  if (fam === 'spear' || pose === 'thrust') return 0;
  if (id === 'zeis' || id === 'kama') {
    if (pose === 'overhead' || pose === 'upper') return -0.55;
    if (pose === 'sweep' || pose === 'hook') return -0.48;
    return -0.5;
  }
  if (pose === 'overhead' || pose === 'upper') return -0.42;
  if (pose === 'slash' || pose === 'spin') return -0.55;
  if (pose === 'sweep' || pose === 'hook') return -0.35;
  if (fam === 'blunt') return -0.65;
  return -0.4;
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

function weaponComboTipOnce(gameRef) {
  if (typeof save === 'undefined') return;
  if (!save.tipsSeen || typeof save.tipsSeen !== 'object') save.tipsSeen = {};
  if (save.tipsSeen.weaponCombo) return;
  save.tipsSeen.weaponCombo = 1;
  if (typeof persist === 'function') persist();
  const tip = (typeof t === 'function' && t('ui.weaponComboHint') !== 'ui.weaponComboHint')
    ? t('ui.weaponComboHint')
    : 'Wapen 3× = ①②③ · ①+② raken → gouden ③';
  if (gameRef && gameRef.hint > 0) {
    if (!gameRef.modeHintLine || gameRef.modeHintLine.indexOf('①') < 0) {
      gameRef.modeHintLine = gameRef.modeHintLine
        ? gameRef.modeHintLine + ' · ' + tip
        : tip;
    }
    gameRef.hint = Math.max(gameRef.hint, 6);
  }
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
  noteRunLootFinisher(gameRef && gameRef.runLoot);
  if (typeof bumpDaily === 'function') bumpDaily('weaponFinisher', 1);
  if (newTierIdx > prevTierIdx && typeof UI !== 'undefined') {
    const w = weaponById(weaponId);
    const tier = WEAPON_MASTERY_TIERS[newTierIdx];
    try { UI.toast(`${w.name}: ${tier.name}!`, 3200); } catch (_) {}
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

