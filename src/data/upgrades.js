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
