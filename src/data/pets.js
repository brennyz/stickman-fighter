/* ============================== DEX PETS ================================ */
/** Getemde mini-monsters — unlock via monsterboek-kills (deel 2 pets). */

const PET_KILL_NEED = { common: 12, uncommon: 18, rare: 28, epic: 40, legendary: 55, mythic: 75 };

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
  const out = { dmgMul: 1, energyMul: 1, critBonus: 0, maxHp: 0, speedMul: 1, shieldWave: 0 };
  switch (def.passive) {
    case 'dmg': out.dmgMul = 1 + def.passiveVal * tierMul; break;
    case 'hp': out.maxHp = Math.round(def.passiveVal * tierMul); break;
    case 'energy': out.energyMul = def.passiveVal * tierMul; break;
    case 'crit': out.critBonus = def.passiveVal * tierMul; break;
    case 'speed': out.speedMul = def.passiveVal * tierMul; break;
    case 'shield': out.shieldWave = def.passiveVal * tierMul; break;
  }
  if (sp) out.label = sp.name;
  return out;
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
  const need = petKillNeed(speciesId);
  const cur = save.dex[speciesId] || 0;
  if (cur <= 0) return `Pet · ${need} kills`;
  return `Pet · ${Math.min(cur, need)}/${need} kills`;
}
