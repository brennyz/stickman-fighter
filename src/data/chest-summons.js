/* ===================== DAILY CHEST SUMMONS ============================ */
/** Menu-kist: 10 random pulls/dag (wapen óf pet). Betere drop-odds.
 *  Save-shape (sanitize + UI moeten dit strikt afvangen):
 *    save.chestDaily = { date, left, pulls[] }
 *    (legacy wLeft/pLeft → gemigreerd naar left)
 *    save.chestWeapons = { weaponId: { skill?, at? } }  // early unlock
 *  Bestaande save.summons (ascend epic/legendary) blijft apart. */

const CHEST_DAILY_TOTAL = 10;
/** Jackpot / “leuk” roll — was 5%, nu ~14%. */
const CHEST_NICE_CHANCE = 0.14;
/** Op non-jackpot: kans op mid-tier unlock i.p.v. alleen coins/junk. */
const CHEST_GOOD_CHANCE = 0.30;
const CHEST_PULL_LOG_MAX = 12;
const CHEST_SKILL_MAX = 48;
/** Reveal timeline: matches Gemini clip (~10s); card last 2s. */
const SUMMON_REVEAL_TOTAL_MS = 10000;
const SUMMON_CARD_LAST_MS = 2000;
const SUMMON_VIDEO_SRC = 'assets/summon/reveal.mp4';
let _summonVideoOk = null;

function summonVideoUrl() {
  const base = (typeof SUMMON_VIDEO_SRC === 'string' && SUMMON_VIDEO_SRC)
    ? SUMMON_VIDEO_SRC
    : 'assets/summon/reveal.mp4';
  const rev = (typeof SW_CACHE_REV !== 'undefined') ? SW_CACHE_REV : 0;
  return base + (base.includes('?') ? '&' : '?') + 'v=' + rev;
}

/** Warm the mp4 while the hub is open so pull isn't racing a cold download. */
function ensureSummonVideoPreloaded() {
  try {
    const vid = document.getElementById('summonVideo');
    if (!vid) return;
    vid.muted = true;
    vid.defaultMuted = true;
    vid.setAttribute('muted', '');
    vid.setAttribute('playsinline', '');
    vid.setAttribute('webkit-playsinline', '');
    const src = summonVideoUrl();
    if (vid.getAttribute('src') !== src) {
      vid.setAttribute('src', src);
      try { vid.load(); } catch (_) {}
    }
  } catch (_) {}
}

/** @deprecated kept for older UI strings — use CHEST_DAILY_TOTAL */
const CHEST_DAILY_WEAPON = CHEST_DAILY_TOTAL;
const CHEST_DAILY_PET = CHEST_DAILY_TOTAL;

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

/** Migrate legacy {wLeft,pLeft} → {left}. */
function migrateChestLeftFields(raw) {
  if (!raw || typeof raw !== 'object') return CHEST_DAILY_TOTAL;
  if (raw.left != null && raw.left !== '') {
    return clampChestLeft(raw.left, CHEST_DAILY_TOTAL);
  }
  const w = clampChestLeft(raw.wLeft, 5);
  const p = clampChestLeft(raw.pLeft, 5);
  return clampChestLeft(w + p, CHEST_DAILY_TOTAL);
}

function ensureChestDaily() {
  if (typeof save === 'undefined' || !save) return null;
  const dk = typeof todayKey === 'function' ? todayKey() : new Date().toISOString().slice(0, 10);
  if (!save.chestDaily || typeof save.chestDaily !== 'object' || save.chestDaily.date !== dk) {
    save.chestDaily = {
      date: dk,
      left: CHEST_DAILY_TOTAL,
      pulls: [],
    };
  } else {
    save.chestDaily.left = migrateChestLeftFields(save.chestDaily);
    delete save.chestDaily.wLeft;
    delete save.chestDaily.pLeft;
    if (!Array.isArray(save.chestDaily.pulls)) save.chestDaily.pulls = [];
  }
  return save.chestDaily;
}

function chestSummonsLeft() {
  const d = ensureChestDaily();
  if (!d) return 0;
  try {
    if (typeof UI !== 'undefined' && UI._chestPullBusy && UI._chestPullLeftSnap != null) {
      return UI._chestPullLeftSnap;
    }
  } catch (_) {}
  return d.left;
}

/** @deprecated alias — shared pool */
function chestWeaponLeft() {
  return chestSummonsLeft();
}

/** @deprecated alias — shared pool (0; use chestSummonsLeft) */
function chestPetLeft() {
  return 0;
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
    const coins = 8 + Math.floor(Math.random() * 16);
    save.petCoins = (typeof petCoinsBalance === 'function' ? petCoinsBalance() : 0) + coins;
    return { type: 'coins', kind, amount: coins, nice: false };
  }
  if (roll < 0.8) {
    const xp = 22 + Math.floor(Math.random() * 34);
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

function grantMidChestWeapon() {
  const pool = chestBaseWeaponPool();
  const locked = pool.filter(w =>
    !weaponUnlockedByLevel(w) &&
    rarityOf(w.rarity).order >= 1 &&
    rarityOf(w.rarity).order <= 3 &&
    w.unlock <= (save.lvl || 1) + 10);
  if (!locked.length) return null;
  // Bias toward higher rarity within mid band
  locked.sort((a, b) => rarityOf(b.rarity).order - rarityOf(a.rarity).order);
  const top = locked.slice(0, Math.max(3, Math.ceil(locked.length * 0.45)));
  const w = top[Math.floor(Math.random() * top.length)];
  const skill = grantChestWeaponUnlock(w.id, chestSkillPick('weapon'));
  return {
    type: 'weapon_unlock', kind: 'weapon', nice: false,
    weaponId: w.id, rarity: w.rarity, skill, name: w.name,
  };
}

function grantNiceChestWeapon() {
  const pool = chestBaseWeaponPool();
  const lockedNice = pool.filter(w =>
    rarityOf(w.rarity).order >= 2 &&
    !weaponUnlockedByLevel(w) &&
    w.unlock <= (save.lvl || 1) + 16);
  if (lockedNice.length) {
    lockedNice.sort((a, b) => rarityOf(b.rarity).order - rarityOf(a.rarity).order);
    const pickFrom = lockedNice.slice(0, Math.max(4, Math.ceil(lockedNice.length * 0.5)));
    const w = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    const skill = grantChestWeaponUnlock(w.id, chestSkillPick('weapon'));
    return {
      type: 'weapon_unlock', kind: 'weapon', nice: true,
      weaponId: w.id, rarity: w.rarity, skill, name: w.name,
    };
  }

  const elig = typeof summonEligibleWeapons === 'function' ? summonEligibleWeapons() : [];
  if (elig.length) {
    const w = elig[Math.floor(Math.random() * elig.length)];
    const tier = Math.random() < 0.45 ? 'legendary' : 'epic';
    if (!save.summons || typeof save.summons !== 'object') save.summons = {};
    const prev = save.summons[w.id];
    if (prev !== 'legendary') save.summons[w.id] = tier;
    const skill = grantChestWeaponUnlock(w.id, chestSkillPick('weapon'));
    return {
      type: 'weapon_ascend', kind: 'weapon', nice: true,
      weaponId: w.id, rarity: save.summons[w.id] || tier, skill, name: w.name,
    };
  }

  const anyLocked = pool.filter(w => !weaponUnlockedByLevel(w) && w.unlock <= (save.lvl || 1) + 22);
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
    return sp && rarityOf(sp.rarity).order >= 2;
  });
  const pool = nice.length ? nice : untamed.filter(p => {
    const sp = SPECIES[p.speciesId];
    return sp && rarityOf(sp.rarity).order >= 1;
  });
  if (pool.length) {
    pool.sort((a, b) => {
      const ra = rarityOf((SPECIES[a.speciesId] || {}).rarity).order;
      const rb = rarityOf((SPECIES[b.speciesId] || {}).rarity).order;
      return rb - ra;
    });
    const top = pool.slice(0, Math.max(4, Math.ceil(pool.length * 0.5)));
    const def = top[Math.floor(Math.random() * top.length)];
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

function grantMidChestPet() {
  const untamed = PET_ROSTER.filter(p => !isPetTamed(p.id));
  const mid = untamed.filter(p => {
    const sp = SPECIES[p.speciesId];
    return sp && rarityOf(sp.rarity).order >= 1 && rarityOf(sp.rarity).order <= 3;
  });
  if (!mid.length) return null;
  const def = mid[Math.floor(Math.random() * mid.length)];
  const skill = chestSkillPick('pet');
  if (!save.pets || typeof save.pets !== 'object') save.pets = {};
  save.pets[def.id] = { at: Date.now(), src: 'chest', skill, kills: 0 };
  if (!save.activePet) save.activePet = def.id;
  save.stats = save.stats || {};
  save.stats.petsTamed = (save.stats.petsTamed || 0) + 1;
  const sp = SPECIES[def.speciesId];
  return {
    type: 'pet_unlock', kind: 'pet', nice: false,
    petId: def.id, rarity: sp ? sp.rarity : 'uncommon', skill,
    name: sp ? sp.name : def.id,
  };
}

function grantCommonChestPet() {
  if (Math.random() < CHEST_GOOD_CHANCE) {
    const mid = grantMidChestPet();
    if (mid) return mid;
  }
  if (typeof hatchEggPet === 'function' && Math.random() < 0.62) {
    const res = hatchEggPet('chest');
    return {
      type: 'egg', kind: 'pet', nice: false,
      eggId: res.def && res.def.id, rarity: res.def && res.def.rarity,
      name: res.def && res.def.name, duplicate: !!res.duplicate,
    };
  }
  return grantChestConsolation('pet');
}

function grantCommonChestWeapon() {
  if (Math.random() < CHEST_GOOD_CHANCE) {
    const mid = grantMidChestWeapon();
    if (mid) return mid;
  }
  return grantChestConsolation('weapon');
}

/**
 * Atomisch genoeg: counters eerst valideren, daarna reward; bij throw rollback counter.
 * @param {'weapon'|'pet'|'random'|null|undefined} kind
 */
function openChestSummon(kind) {
  const d = ensureChestDaily();
  if (!d) return { ok: false, reason: 'no_save' };

  if (clampChestLeft(d.left, CHEST_DAILY_TOTAL) <= 0) {
    return { ok: false, reason: 'empty', kind: kind || 'random' };
  }

  let rollKind = kind;
  if (rollKind !== 'weapon' && rollKind !== 'pet') {
    rollKind = Math.random() < 0.5 ? 'weapon' : 'pet';
  }

  const before = {
    left: d.left,
    pullsLen: Array.isArray(d.pulls) ? d.pulls.length : 0,
  };
  d.left = clampChestLeft(d.left - 1, CHEST_DAILY_TOTAL);

  let result;
  try {
    const nice = Math.random() < CHEST_NICE_CHANCE;
    if (rollKind === 'weapon') {
      result = nice ? grantNiceChestWeapon() : grantCommonChestWeapon();
    } else {
      result = nice ? grantNiceChestPet() : grantCommonChestPet();
    }
    if (!result || typeof result !== 'object') result = grantChestConsolation(rollKind);
    result.ok = true;
    result.kind = rollKind;
    result.nice = !!result.nice;
    result.left = { total: chestSummonsLeft() };
    pushChestPull({
      kind: rollKind,
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
    d.left = before.left;
    if (Array.isArray(d.pulls) && d.pulls.length > before.pullsLen) {
      d.pulls = d.pulls.slice(0, before.pullsLen);
    }
    try { console.warn('[chest-summon]', err); } catch (_) {}
    return { ok: false, reason: 'error', kind: rollKind };
  }
}

function sanitizeChestDaily(raw, today) {
  if (!raw || typeof raw !== 'object') {
    return {
      date: today,
      left: CHEST_DAILY_TOTAL,
      pulls: [],
    };
  }
  const dk = (typeof raw.date === 'string' ? raw.date.slice(0, 10) : null) || today;
  const out = {
    date: dk,
    left: migrateChestLeftFields(raw),
    pulls: [],
  };
  if (dk !== today) {
    out.date = today;
    out.left = CHEST_DAILY_TOTAL;
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
    if (res && res.reason === 'empty') return 'Geen summons meer vandaag';
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
