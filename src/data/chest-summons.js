/* ===================== DAILY CHEST SUMMONS ============================ */
/** Menu-kist: 5 wapen + 5 pet pulls per dag. 5% kans op “leuk” resultaat.
 *  Save-shape (sanitize + UI moeten dit strikt afvangen):
 *    save.chestDaily = { date, wLeft, pLeft, pulls[] }
 *    save.chestWeapons = { weaponId: { skill?, at? } }  // early unlock
 *  Bestaande save.summons (ascend epic/legendary) blijft apart. */

const CHEST_DAILY_WEAPON = 5;
const CHEST_DAILY_PET = 5;
const CHEST_NICE_CHANCE = 0.05;
const CHEST_PULL_LOG_MAX = 12;
const CHEST_SKILL_MAX = 48;
/** Reveal timeline: card pops in for the last 2 seconds (video or CSS fallback). */
const SUMMON_REVEAL_TOTAL_MS = 4000;
const SUMMON_CARD_LAST_MS = 2000;
const SUMMON_VIDEO_SRC = 'assets/summon/reveal.mp4';
let _summonVideoOk = null;

const CHEST_WEAPON_SKILLS = [
  'Schaduwsteek — crit na dash',
  'Klingdans — finisher +8%',
  'IJzeren Grip — minder knockback',
  'Vonklijn — hit-sparks langer',
  'Echo-slag — 2e tick 20%',
  'Stormritme — sneller combo-venster',
];

const CHEST_PET_SKILLS = [
  'Fluf-Schild — korte shield-pulse',
  'Snack-Boost — +pet-assist 1 golf',
  'Blink-Dash — snellere pet-CD',
  'Lucky Paw — +2% crit voor jou',
  'Koester — +4 max HP',
  'Cheer — chakra +6% regen',
];

function chestSkillPick(kind) {
  const pool = kind === 'pet' ? CHEST_PET_SKILLS : CHEST_WEAPON_SKILLS;
  return pool[Math.floor(Math.random() * pool.length)] || pool[0];
}

function clampChestLeft(n, max) {
  if (n == null || n === '') return max;
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) return max;
  return Math.max(0, Math.min(max, v));
}

function ensureChestDaily() {
  if (typeof save === 'undefined' || !save) return null;
  const dk = typeof todayKey === 'function' ? todayKey() : new Date().toISOString().slice(0, 10);
  if (!save.chestDaily || typeof save.chestDaily !== 'object' || save.chestDaily.date !== dk) {
    save.chestDaily = {
      date: dk,
      wLeft: CHEST_DAILY_WEAPON,
      pLeft: CHEST_DAILY_PET,
      pulls: [],
    };
  } else {
    save.chestDaily.wLeft = clampChestLeft(save.chestDaily.wLeft, CHEST_DAILY_WEAPON);
    save.chestDaily.pLeft = clampChestLeft(save.chestDaily.pLeft, CHEST_DAILY_PET);
    if (!Array.isArray(save.chestDaily.pulls)) save.chestDaily.pulls = [];
  }
  return save.chestDaily;
}

function chestWeaponLeft() {
  const d = ensureChestDaily();
  return d ? d.wLeft : 0;
}

function chestPetLeft() {
  const d = ensureChestDaily();
  return d ? d.pLeft : 0;
}

function chestSummonsLeft() {
  return chestWeaponLeft() + chestPetLeft();
}

function chestHasSummonsLeft() {
  return chestSummonsLeft() > 0;
}

function chestWeaponUnlocked(id) {
  return !!(save.chestWeapons && save.chestWeapons[id]);
}

function grantChestWeaponUnlock(weaponId, skill) {
  if (!save.chestWeapons || typeof save.chestWeapons !== 'object') save.chestWeapons = {};
  const sk = typeof skill === 'string' ? skill.slice(0, CHEST_SKILL_MAX) : chestSkillPick('weapon');
  save.chestWeapons[weaponId] = { skill: sk, at: Date.now() };
  return sk;
}

function chestWeaponSkillOf(weaponId) {
  const e = save.chestWeapons && save.chestWeapons[weaponId];
  return (e && typeof e.skill === 'string') ? e.skill : null;
}

function chestBaseWeaponPool() {
  return WEAPONS.filter(w =>
    w && !w.dropZone && w.id !== 'vuist' && w.id !== 'master_sword' &&
    !(typeof isThrowWeapon === 'function' && isThrowWeapon(w.id)));
}

function pushChestPull(entry) {
  const d = ensureChestDaily();
  if (!d) return;
  const row = Object.assign({ at: Date.now() }, entry || {});
  d.pulls = (Array.isArray(d.pulls) ? d.pulls : []).concat([row]).slice(-CHEST_PULL_LOG_MAX);
}

function grantChestConsolation(kind) {
  const roll = Math.random();
  if (roll < 0.45) {
    const coins = 6 + Math.floor(Math.random() * 12);
    save.petCoins = (typeof petCoinsBalance === 'function' ? petCoinsBalance() : 0) + coins;
    return { type: 'coins', kind, amount: coins, nice: false };
  }
  if (roll < 0.8) {
    const xp = 18 + Math.floor(Math.random() * 28);
    if (typeof grantMetaXP === 'function') grantMetaXP(xp);
    else save.xp = (save.xp || 0) + xp;
    return { type: 'xp', kind, amount: xp, nice: false };
  }
  return {
    type: 'junk',
    kind,
    nice: false,
    label: kind === 'pet' ? 'Een pluisje… niks nuttigs' : 'Roestig schroot… niks nuttigs',
  };
}

function grantNiceChestWeapon() {
  const pool = chestBaseWeaponPool();
  const lockedNice = pool.filter(w =>
    rarityOf(w.rarity).order >= 3 &&
    !weaponUnlockedByLevel(w) &&
    w.unlock <= (save.lvl || 1) + 14);
  if (lockedNice.length) {
    const w = lockedNice[Math.floor(Math.random() * lockedNice.length)];
    const skill = grantChestWeaponUnlock(w.id, chestSkillPick('weapon'));
    return {
      type: 'weapon_unlock', kind: 'weapon', nice: true,
      weaponId: w.id, rarity: w.rarity, skill, name: w.name,
    };
  }

  const elig = typeof summonEligibleWeapons === 'function' ? summonEligibleWeapons() : [];
  if (elig.length) {
    const w = elig[Math.floor(Math.random() * elig.length)];
    const tier = Math.random() < 0.4 ? 'legendary' : 'epic';
    if (!save.summons || typeof save.summons !== 'object') save.summons = {};
    const prev = save.summons[w.id];
    if (prev !== 'legendary') save.summons[w.id] = tier;
    const skill = grantChestWeaponUnlock(w.id, chestSkillPick('weapon'));
    return {
      type: 'weapon_ascend', kind: 'weapon', nice: true,
      weaponId: w.id, rarity: save.summons[w.id] || tier, skill, name: w.name,
    };
  }

  // Alle high-tier al binnen — geef alsnog early unlock van hoogste locked
  const anyLocked = pool.filter(w => !weaponUnlockedByLevel(w) && w.unlock <= (save.lvl || 1) + 20);
  if (anyLocked.length) {
    anyLocked.sort((a, b) => rarityOf(b.rarity).order - rarityOf(a.rarity).order);
    const w = anyLocked[0];
    const skill = grantChestWeaponUnlock(w.id, chestSkillPick('weapon'));
    return {
      type: 'weapon_unlock', kind: 'weapon', nice: true,
      weaponId: w.id, rarity: w.rarity, skill, name: w.name,
    };
  }

  return grantChestConsolation('weapon');
}

function grantNiceChestPet() {
  const untamed = PET_ROSTER.filter(p => !isPetTamed(p.id));
  const nice = untamed.filter(p => {
    const sp = SPECIES[p.speciesId];
    return sp && rarityOf(sp.rarity).order >= 3;
  });
  const pool = nice.length ? nice : untamed.filter(p => {
    const sp = SPECIES[p.speciesId];
    return sp && rarityOf(sp.rarity).order >= 2;
  });
  if (pool.length) {
    const def = pool[Math.floor(Math.random() * pool.length)];
    const skill = chestSkillPick('pet');
    if (!save.pets || typeof save.pets !== 'object') save.pets = {};
    save.pets[def.id] = { at: Date.now(), src: 'chest', skill, kills: 0 };
    if (!save.activePet) save.activePet = def.id;
    save.stats = save.stats || {};
    save.stats.petsTamed = (save.stats.petsTamed || 0) + 1;
    const sp = SPECIES[def.speciesId];
    return {
      type: 'pet_unlock', kind: 'pet', nice: true,
      petId: def.id, rarity: sp ? sp.rarity : 'rare', skill,
      name: sp ? sp.name : def.id,
    };
  }
  // Alles al getemd → mythic-achtig ei of coins
  if (typeof hatchEggPet === 'function') {
    const res = hatchEggPet('chest');
    return {
      type: 'egg', kind: 'pet', nice: true,
      eggId: res.def && res.def.id, rarity: res.def && res.def.rarity,
      name: res.def && res.def.name, duplicate: !!res.duplicate,
      skill: chestSkillPick('pet'),
    };
  }
  return grantChestConsolation('pet');
}

function grantCommonChestPet() {
  if (typeof hatchEggPet === 'function' && Math.random() < 0.55) {
    const res = hatchEggPet('chest');
    return {
      type: 'egg', kind: 'pet', nice: false,
      eggId: res.def && res.def.id, rarity: res.def && res.def.rarity,
      name: res.def && res.def.name, duplicate: !!res.duplicate,
    };
  }
  return grantChestConsolation('pet');
}

/**
 * Atomisch genoeg: counters eerst valideren, daarna reward; bij throw rollback counter.
 * @param {'weapon'|'pet'} kind
 */
function openChestSummon(kind) {
  if (kind !== 'weapon' && kind !== 'pet') return { ok: false, reason: 'bad_kind' };
  const d = ensureChestDaily();
  if (!d) return { ok: false, reason: 'no_save' };

  const key = kind === 'weapon' ? 'wLeft' : 'pLeft';
  if (clampChestLeft(d[key], kind === 'weapon' ? CHEST_DAILY_WEAPON : CHEST_DAILY_PET) <= 0) {
    return { ok: false, reason: 'empty', kind };
  }

  const before = {
    wLeft: d.wLeft,
    pLeft: d.pLeft,
    pullsLen: Array.isArray(d.pulls) ? d.pulls.length : 0,
  };
  d[key] = clampChestLeft(d[key] - 1, kind === 'weapon' ? CHEST_DAILY_WEAPON : CHEST_DAILY_PET);

  let result;
  try {
    const nice = Math.random() < CHEST_NICE_CHANCE;
    if (kind === 'weapon') result = nice ? grantNiceChestWeapon() : grantChestConsolation('weapon');
    else result = nice ? grantNiceChestPet() : grantCommonChestPet();
    if (!result || typeof result !== 'object') result = grantChestConsolation(kind);
    result.ok = true;
    result.kind = kind;
    result.nice = !!result.nice;
    result.left = { weapon: chestWeaponLeft(), pet: chestPetLeft() };
    pushChestPull({
      kind,
      type: result.type,
      nice: result.nice,
      id: result.weaponId || result.petId || result.eggId || null,
      rarity: result.rarity || null,
    });
    save.stats = save.stats || {};
    save.stats.summonCount = (save.stats.summonCount || 0) + 1;
    if (typeof persist === 'function') persist();
    try { AudioSys.sfx(result.nice ? 'summon' : 'select'); } catch (_) {}
    return result;
  } catch (err) {
    d.wLeft = before.wLeft;
    d.pLeft = before.pLeft;
    if (Array.isArray(d.pulls) && d.pulls.length > before.pullsLen) {
      d.pulls = d.pulls.slice(0, before.pullsLen);
    }
    try { console.warn('[chest-summon]', err); } catch (_) {}
    return { ok: false, reason: 'error', kind };
  }
}

function sanitizeChestDaily(raw, today) {
  if (!raw || typeof raw !== 'object') {
    return {
      date: today,
      wLeft: CHEST_DAILY_WEAPON,
      pLeft: CHEST_DAILY_PET,
      pulls: [],
    };
  }
  const dk = (typeof raw.date === 'string' ? raw.date.slice(0, 10) : null) || today;
  const out = {
    date: dk,
    wLeft: clampChestLeft(raw.wLeft, CHEST_DAILY_WEAPON),
    pLeft: clampChestLeft(raw.pLeft, CHEST_DAILY_PET),
    pulls: [],
  };
  // Als date ≠ vandaag: reset pulls + full quota (nieuwe dag)
  if (dk !== today) {
    out.date = today;
    out.wLeft = CHEST_DAILY_WEAPON;
    out.pLeft = CHEST_DAILY_PET;
    return out;
  }
  if (Array.isArray(raw.pulls)) {
    for (const p of raw.pulls.slice(-CHEST_PULL_LOG_MAX)) {
      if (!p || typeof p !== 'object') continue;
      const kind = p.kind === 'pet' ? 'pet' : (p.kind === 'weapon' ? 'weapon' : null);
      if (!kind) continue;
      out.pulls.push({
        kind,
        type: typeof p.type === 'string' ? p.type.slice(0, 24) : 'junk',
        nice: !!p.nice,
        id: typeof p.id === 'string' ? p.id.slice(0, 32) : null,
        rarity: typeof p.rarity === 'string' ? p.rarity.slice(0, 16) : null,
        at: Math.floor(Number(p.at) || 0) || undefined,
      });
    }
  }
  return out;
}

function sanitizeChestWeapons(raw) {
  const clean = {};
  if (!raw || typeof raw !== 'object') return clean;
  for (const [k, v] of Object.entries(raw)) {
    const w = typeof weaponById === 'function' ? weaponById(k) : null;
    if (!w || w.dropZone || w.id === 'vuist' || w.id === 'master_sword') continue;
    const entry = (v && typeof v === 'object') ? v : {};
    clean[k] = {
      skill: typeof entry.skill === 'string' ? entry.skill.slice(0, CHEST_SKILL_MAX) : undefined,
      at: Math.floor(Number(entry.at) || 0) || undefined,
    };
    if (!clean[k].skill) delete clean[k].skill;
    if (!clean[k].at) delete clean[k].at;
  }
  return clean;
}

function chestResultToast(res) {
  if (!res || !res.ok) {
    if (res && res.reason === 'empty') {
      return res.kind === 'pet' ? 'Geen pet-summons meer vandaag' : 'Geen wapen-summons meer vandaag';
    }
    return 'Summon mislukt — probeer opnieuw';
  }
  if (res.type === 'weapon_unlock') {
    return `✦ ${res.name} ontgrendeld! · ${rarityLabel(res.rarity)}${res.skill ? ' · ' + res.skill : ''}`;
  }
  if (res.type === 'weapon_ascend') {
    return `✦ ${res.name} → ${rarityLabel(res.rarity)}!${res.skill ? ' · ' + res.skill : ''}`;
  }
  if (res.type === 'pet_unlock') {
    return `✦ Pet ${res.name}! · ${rarityLabel(res.rarity)}${res.skill ? ' · ' + res.skill : ''}`;
  }
  if (res.type === 'egg') {
    const dup = res.duplicate ? ' (dup +XP)' : '';
    return `Ei: ${res.name || '?'}${dup}`;
  }
  if (res.type === 'coins') return `+${res.amount} pet coins`;
  if (res.type === 'xp') return `+${res.amount} XP`;
  return res.label || 'Niks bijzonders…';
}

function chestResultRarityId(res) {
  if (!res || !res.ok) return 'common';
  if (res.rarity && typeof rarityOf === 'function') return rarityOf(res.rarity).id || res.rarity;
  if (res.nice) return 'legendary';
  if (res.type === 'coins' || res.type === 'xp') return 'uncommon';
  return 'common';
}

function summonRevealCardDelayMs(totalMs) {
  const total = Math.max(SUMMON_CARD_LAST_MS + 400, Number(totalMs) || SUMMON_REVEAL_TOTAL_MS);
  return Math.max(0, total - SUMMON_CARD_LAST_MS);
}
