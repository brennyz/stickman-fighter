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
  if (!sp) return 999;
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
    perk: 'Snellere energy-regen' },
  { id: 'pet_stekelra', speciesId: 'stekelra', passive: 'dmg', passiveVal: 0.035, assistMul: 0.34, cd: 4.8,
    perk: 'Charge-assist — stevige tik' },
  { id: 'pet_spooki', speciesId: 'spooki', passive: 'crit', passiveVal: 0.04, assistMul: 0.29, cd: 4.9,
    perk: '+4% crit-kans' },
  { id: 'pet_blikkert', speciesId: 'blikkert', passive: 'shield', passiveVal: 1.2, assistMul: 0.27, cd: 5.4,
    perk: 'Korte shield elke golf' },
  { id: 'pet_vlamvos', speciesId: 'vlamvos', passive: 'speed', passiveVal: 1.04, assistMul: 0.33, cd: 4.4,
    perk: '+4% loopsnelheid' },
  { id: 'pet_piepvleugel', speciesId: 'piepvleugel', passive: 'energy', passiveVal: 1.1, assistMul: 0.3, cd: 4.0,
    perk: 'Vlugge energy + dart-assist' },
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

function petPerkLabel(def) {
  if (!def) return '';
  const key = 'pets.perk.' + def.id;
  if (typeof tOr === 'function') return tOr(key, def.perk || '');
  return def.perk || '';
}

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

function tamedPetIds() {
  if (typeof PET_ROSTER === 'undefined' || !PET_ROSTER) return [];
  return PET_ROSTER.filter((d) => isPetTamed(d.id)).map((d) => d.id);
}

function cycleCombatPet() {
  const ids = tamedPetIds();
  if (!ids.length) return { kind: 'none' };
  const cur = save.activePet && ids.indexOf(save.activePet) >= 0 ? save.activePet : null;
  if (!cur) {
    equipPet(ids[0]);
    return { kind: 'equip', id: ids[0], def: petDef(ids[0]) };
  }
  if (ids.length === 1) return { kind: 'same', id: cur, def: petDef(cur) };
  const next = ids[(ids.indexOf(cur) + 1) % ids.length];
  equipPet(next);
  return { kind: 'cycle', id: next, def: petDef(next) };
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
  if (isPetTamed(def.id)) return save.activePet === def.id ? t('ui.petLineActive') : t('ui.petLineTamed');
  const cost = petCoinCost(def.id);
  if (canBuyPetWithCoins(def.id)) return t('ui.petLineBuy', { cost });
  const need = petKillNeed(speciesId);
  const cur = save.dex[speciesId] || 0;
  const wallet = petCoinsBalance();
  const coinHint = wallet > 0
    ? ((typeof tOr === 'function')
      ? tOr('pets.coinHint', ' · {have}/{cost} PC', { have: wallet, cost })
      : ` · ${wallet}/${cost} PC`)
    : '';
  if (cur <= 0) {
    const needLine = (typeof tOr === 'function')
      ? tOr('pets.lineNeed', 'Pet · {need} kills', { need })
      : ('Pet · ' + need + ' kills');
    return needLine + coinHint;
  }
  return t('ui.petTameLine', { cur: Math.min(cur, need), need, cost });
}

function petStatusOf(defOrId) {
  const def = typeof defOrId === 'string' ? petDef(defOrId) : defOrId;
  if (!def) return null;
  const tamed = isPetTamed(def.id);
  const active = !!(tamed && save.activePet === def.id);
  const kills = (save.dex && save.dex[def.speciesId]) || 0;
  const need = petKillNeed(def.speciesId);
  const cost = petCoinCost(def.id);
  const canBuy = !tamed && canBuyPetWithCoins(def.id);
  const canClaim = !tamed && kills >= need;
  const pct = tamed ? 100 : Math.min(100, Math.round((kills / Math.max(1, need)) * 100));
  let status = 'locked';
  if (active) status = 'active';
  else if (tamed) status = 'tamed';
  else if (canClaim) status = 'claimable';
  else if (canBuy) status = 'buyable';
  else if (kills > 0) status = 'progress';
  return { id: def.id, speciesId: def.speciesId, tamed, active, kills, need, cost, canBuy, canClaim, pct, status };
}

function petPerkLine(def) {
  if (!def) return '';
  const txt = (key, fallback, params) => (typeof tOr === 'function') ? tOr(key, fallback, params) : fallback;
  switch (def.passive) {
    case 'dmg':
      return txt('pets.perkDmg', '+{pct}% damage', { pct: Math.round(def.passiveVal * 1000) / 10 });
    case 'hp':
      return txt('pets.perkHp', '+{n} max HP', { n: def.passiveVal });
    case 'energy':
      return txt('pets.perkEnergy', '+{pct}% energy regen', { pct: Math.round((def.passiveVal - 1) * 1000) / 10 });
    case 'crit':
      return txt('pets.perkCrit', '+{pct}% crit', { pct: Math.round(def.passiveVal * 1000) / 10 });
    case 'speed':
      return txt('pets.perkSpeed', '+{pct}% speed', { pct: Math.round((def.passiveVal - 1) * 1000) / 10 });
    case 'shield':
      return txt('pets.perkShield', 'Shield {n} / wave', { n: def.passiveVal });
    default:
      return def.perk || '';
  }
}

function petLiveBonusLine(def) {
  if (!def || !isPetTamed(def.id)) return '';
  const was = save.activePet;
  const bonus = (was === def.id && typeof petPassiveBonus === 'function')
    ? petPassiveBonus()
    : null;
  if (!bonus) return petPerkLine(def);
  const txt = (key, fallback, params) => (typeof tOr === 'function') ? tOr(key, fallback, params) : fallback;
  if (bonus.dmgMul > 1.001) {
    return txt('pets.liveDmg', 'Now +{pct}% damage', { pct: Math.round((bonus.dmgMul - 1) * 1000) / 10 });
  }
  if (bonus.maxHp > 0) return txt('pets.liveHp', 'Now +{n} max HP', { n: bonus.maxHp });
  if (bonus.energyMul > 1.001) {
    return txt('pets.liveEnergy', 'Now +{pct}% energy regen', { pct: Math.round((bonus.energyMul - 1) * 1000) / 10 });
  }
  if (bonus.critBonus > 0.001) {
    return txt('pets.liveCrit', 'Now +{pct}% crit', { pct: Math.round(bonus.critBonus * 1000) / 10 });
  }
  if (bonus.speedMul > 1.001) {
    return txt('pets.liveSpeed', 'Now +{pct}% speed', { pct: Math.round((bonus.speedMul - 1) * 1000) / 10 });
  }
  if (bonus.shieldWave > 0) {
    return txt('pets.liveShield', 'Now shield {n} / wave', { n: Math.round(bonus.shieldWave * 10) / 10 });
  }
  return petPerkLine(def);
}

function petsFilterRoster(filter) {
  return PET_ROSTER.filter((def) => {
    const st = petStatusOf(def);
    if (!st) return false;
    if (filter === 'ready') return st.canBuy || st.canClaim;
    if (filter === 'progress') return !st.tamed && st.kills > 0;
    if (filter === 'tamed') return st.tamed;
    return true;
  });
}

function petsWalletModel() {
  if (typeof ensureEggDaily === 'function') {
    try { ensureEggDaily(); } catch (_) {}
  }
  return {
    petCoins: petCoinsBalance(),
    tamed: petTamedCount(),
    total: PET_ROSTER.length,
    eggs: (typeof eggOwnedCount === 'function') ? eggOwnedCount() : 0,
    eggTotal: (typeof EGG_ROSTER !== 'undefined') ? EGG_ROSTER.length : 0,
    dailyReady: (typeof canCrackDailyEgg === 'function') ? canCrackDailyEgg() : false,
    advBonus: (typeof canAdvEggBonus === 'function') ? canAdvEggBonus() : false,
  };
}

function petsNextGoal() {
  if (typeof canCrackDailyEgg === 'function' && canCrackDailyEgg()) {
    return { kind: 'egg', key: 'pets.nextEgg' };
  }
  let buy = null;
  let claim = null;
  let tame = null;
  for (const def of PET_ROSTER) {
    const st = petStatusOf(def);
    if (!st || st.tamed) continue;
    const sp = SPECIES[def.speciesId];
    const name = sp ? sp.name : def.id;
    if (st.canClaim && !claim) claim = Object.assign({ name }, st);
    if (st.canBuy && (!buy || st.cost < buy.cost)) buy = Object.assign({ name }, st);
    if (st.kills > 0 && (!tame || st.pct > tame.pct)) tame = Object.assign({ name }, st);
  }
  if (claim) return { kind: 'claim', key: 'pets.nextClaim', name: claim.name, id: claim.id, cur: claim.kills, need: claim.need };
  if (buy) return { kind: 'buy', key: 'pets.nextBuy', name: buy.name, cost: buy.cost, id: buy.id };
  if (tame) {
    return {
      kind: 'tame', key: 'pets.nextTame', name: tame.name, id: tame.id,
      cur: Math.min(tame.kills, tame.need), need: tame.need,
    };
  }
  if (typeof canAdvEggBonus === 'function' && canAdvEggBonus()) {
    return { kind: 'eggAdv', key: 'pets.nextEggAdv' };
  }
  if (petTamedCount() >= PET_ROSTER.length
    && typeof EGG_ROSTER !== 'undefined'
    && typeof eggOwnedCount === 'function'
    && eggOwnedCount() >= EGG_ROSTER.length) {
    return { kind: 'done', key: 'pets.nextNone' };
  }
  return { kind: 'hint', key: 'pets.nextHint' };
}

function petsNextGoalLine() {
  const goal = petsNextGoal();
  const txt = (key, fallback, params) => (typeof tOr === 'function') ? tOr(key, fallback, params) : (fallback || '');
  switch (goal.kind) {
    case 'egg': return txt(goal.key, 'Daily egg ready');
    case 'eggAdv': return txt(goal.key, 'Win adventure for a bonus egg');
    case 'claim': return txt(goal.key, 'Claim {name} · {cur}/{need} kills', goal);
    case 'buy': return txt(goal.key, 'Buy {name} · {cost} PC', goal);
    case 'tame': return txt(goal.key, 'Tame {name} · {cur}/{need} kills', goal);
    case 'done': return txt(goal.key, 'Collection complete');
    default: return txt(goal.key, 'Hunt in the monster book or play coin bonus');
  }
}

function petsHubStatLine() {
  const goal = petsNextGoal();
  const txt = (key, fallback, params) => (typeof tOr === 'function') ? tOr(key, fallback, params) : (fallback || '');
  if (goal.kind === 'egg') return txt('pets.hubEggReady', 'Daily egg ready');
  if (goal.kind === 'claim') return txt('pets.hubNextClaim', 'Ready to tame · {name}', { name: goal.name });
  if (goal.kind === 'buy') return txt('pets.hubNextBuy', 'Buy ready · {cost} PC', { cost: goal.cost });
  if (goal.kind === 'tame') return txt('pets.hubNextTame', 'Almost tamed · {name}', { name: goal.name });
  const w = petsWalletModel();
  if (w.tamed > 0 || w.eggs > 0 || w.petCoins > 0) {
    return t('ui.hubStatPetsFull', {
      pets: w.tamed, total: w.total, coins: w.petCoins, eggs: w.eggs, eggTotal: w.eggTotal,
    });
  }
  return t('ui.hubStatPetsEmpty', { total: w.total });
}

function claimPetFromDex(petId) {
  const def = petDef(petId);
  if (!def || isPetTamed(def.id)) return null;
  if (typeof maybeTamePet !== 'function') return null;
  return maybeTamePet(def.speciesId);
}
