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
