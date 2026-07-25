/* ========================== SKILL UPGRADES ============================= */
/** Permanent skill upgrades via adventure shard drops. */
const SKILL_MAX_LEVEL = 5;
const SKILL_SHARD_CAP = 9999;
const SKILL_SHARD_ADD_CAP = 8;
const SKILL_SHARD_COSTS = [3, 5, 8, 12, 18];

function skillMaxLevel(id) {
  const def = SKILL_DEFS[id];
  if (!def) return UPGRADE_MAX_STANDARD;
  return def.group === 'jutsu' ? UPGRADE_MAX_EXTREME : UPGRADE_MAX_STANDARD;
}

const SKILL_DEFS = {
  rasengan: {
    id: 'rasengan', group: 'jutsu', color: '#7cf5ff',
    steps: [
      { dmgMul: 1.08, radius: 2 },
      { dmgMul: 1.08, speedMul: 1.06, energySave: 5 },
      { dmgMul: 1.1, radius: 2, extraShot: 0.14 },
      { dmgMul: 1.1, lifeMul: 1.12, windupMul: 0.92 },
      { dmgMul: 1.12, radius: 3, energySave: 8, extraShot: 0.1 },
    ],
  },
  chidori: {
    id: 'chidori', group: 'jutsu', color: '#a8e0ff',
    steps: [
      { dmgMul: 1.1, radius: 1 },
      { dmgMul: 1.08, speedMul: 1.08, energySave: 5 },
      { dmgMul: 1.1, windupMul: 0.9, dashMul: 1.1 },
      { dmgMul: 1.12, radius: 2, lifeMul: 1.08 },
      { dmgMul: 1.14, energySave: 10, pierceRepeat: 0.22 },
    ],
  },
  rinnegan: {
    id: 'rinnegan', group: 'jutsu', color: '#c47aff',
    steps: [
      { dmgMul: 1.08, radius: 2 },
      { dmgMul: 1.08, lifeMul: 1.1, energySave: 5 },
      { dmgMul: 1.1, radius: 2, pullMul: 1.15 },
      { dmgMul: 1.1, extraShot: 0.12, windupMul: 0.92 },
      { dmgMul: 1.12, radius: 3, energySave: 8, lifeMul: 1.1 },
    ],
  },
  subst: {
    id: 'subst', group: 'utility', color: '#c9a66b',
    steps: [
      { cdMul: 0.92 },
      { cdMul: 0.92, invulnAdd: 0.04 },
      { cdMul: 0.9, dashDistMul: 1.1 },
      { cdMul: 0.9, invulnAdd: 0.05 },
      { cdMul: 0.88, dashDistMul: 1.12 },
    ],
  },
  dash: {
    id: 'dash', group: 'utility', color: '#7cf5ff',
    steps: [
      { cdMul: 0.9 },
      { cdMul: 0.92, dashDistMul: 1.1 },
      { cdMul: 0.9, dashSpeedMul: 1.12 },
      { cdMul: 0.92, dashDistMul: 1.08 },
      { cdMul: 0.88, dashSpeedMul: 1.15 },
    ],
  },
  chakra: {
    id: 'chakra', group: 'utility', color: '#ffd75e',
    steps: [
      { regenMul: 1.12, energySave: 3 },
      { regenMul: 1.1, energySave: 4 },
      { regenMul: 1.15 },
      { energySave: 5, regenMul: 1.1 },
      { regenMul: 1.18, energySave: 6 },
    ],
  },
};

const SKILL_IDS = Object.keys(SKILL_DEFS);
const JUTSU_SKILL_IDS = SKILL_IDS.filter((id) => SKILL_DEFS[id].group === 'jutsu');

function skillEntry(id) {
  if (!SKILL_DEFS[id]) return null;
  if (!save.skillUpgrades || typeof save.skillUpgrades !== 'object') save.skillUpgrades = {};
  if (!save.skillUpgrades[id]) save.skillUpgrades[id] = { level: 0, shards: 0 };
  return save.skillUpgrades[id];
}

function sanitizeSkillUpgradeEntry(id, raw) {
  if (!SKILL_DEFS[id]) return null;
  const max = skillMaxLevel(id);
  const entry = (raw && typeof raw === 'object') ? raw : {};
  let lv = clamp(Math.floor(Number(entry.level) || 0), 0, max);
  let shards = clamp(Math.floor(Number(entry.shards) || 0), 0, SKILL_SHARD_CAP);
  const spent = upgradeShardsSpentForLevel(lv, SKILL_SHARD_COSTS);
  const total = shards + spent;
  const maxFromBanked = upgradeMaxLevelFromBanked(total, SKILL_SHARD_COSTS, max);
  if (lv > maxFromBanked) lv = maxFromBanked;
  const spent2 = upgradeShardsSpentForLevel(lv, SKILL_SHARD_COSTS);
  shards = clamp(total - spent2, 0, SKILL_SHARD_CAP);
  if (lv <= 0 && shards <= 0) return null;
  return { level: lv, shards };
}

function normalizeSkillUpgrades() {
  const clean = {};
  const raw = (save.skillUpgrades && typeof save.skillUpgrades === 'object') ? save.skillUpgrades : {};
  for (const id of SKILL_IDS) {
    const fixed = sanitizeSkillUpgradeEntry(id, raw[id]);
    if (fixed) clean[id] = fixed;
  }
  save.skillUpgrades = clean;
}

function skillLevel(id, s) {
  const def = SKILL_DEFS[id];
  if (!def) return 0;
  const bag = (s && s.skillUpgrades) || (save && save.skillUpgrades) || {};
  const raw = bag[id];
  if (!raw) return 0;
  return clamp(Math.floor(Number(raw.level) || 0), 0, skillMaxLevel(id));
}

function skillShards(id) {
  if (!SKILL_DEFS[id]) return 0;
  const e = skillEntry(id);
  if (!e) return 0;
  return clamp(Math.floor(Number(e.shards) || 0), 0, SKILL_SHARD_CAP);
}

function skillUpgradeCost(id) {
  const lv = skillLevel(id);
  const max = skillMaxLevel(id);
  if (lv >= max) return null;
  return SKILL_SHARD_COSTS[lv] || SKILL_SHARD_COSTS[SKILL_SHARD_COSTS.length - 1];
}

function skillCanUpgrade(id) {
  const cost = skillUpgradeCost(id);
  if (cost == null) return false;
  return skillShards(id) >= cost;
}

function skillBonuses(id, s) {
  const def = SKILL_DEFS[id];
  const b = {
    dmgMul: 1, radius: 0, speedMul: 1, lifeMul: 1, windupMul: 1, energySave: 0,
    regenMul: 1, cdMul: 1, dashDistMul: 1, dashSpeedMul: 1, invulnAdd: 0,
    extraShot: 0, pierceRepeat: 0, pullMul: 1,
  };
  if (!def) return b;
  const lv = skillLevel(id, s);
  if (lv <= 0) return b;
  for (let i = 0; i < lv; i++) {
    const s = def.steps[i];
    if (!s) continue;
    if (s.dmgMul) b.dmgMul *= s.dmgMul;
    if (s.radius) b.radius += s.radius;
    if (s.speedMul) b.speedMul *= s.speedMul;
    if (s.lifeMul) b.lifeMul *= s.lifeMul;
    if (s.windupMul) b.windupMul *= s.windupMul;
    if (s.energySave) b.energySave += s.energySave;
    if (s.regenMul) b.regenMul *= s.regenMul;
    if (s.cdMul) b.cdMul *= s.cdMul;
    if (s.dashDistMul) b.dashDistMul *= s.dashDistMul;
    if (s.dashSpeedMul) b.dashSpeedMul *= s.dashSpeedMul;
    if (s.invulnAdd) b.invulnAdd += s.invulnAdd;
    if (s.extraShot) b.extraShot = Math.min(0.45, b.extraShot + s.extraShot);
    if (s.pierceRepeat) b.pierceRepeat = Math.min(0.4, b.pierceRepeat + s.pierceRepeat);
    if (s.pullMul) b.pullMul *= s.pullMul;
  }
  return b;
}

function jutsuSkillBonuses(kind) {
  return skillBonuses(kind && SKILL_DEFS[kind] ? kind : 'rasengan');
}

function utilitySkillBonuses() {
  return {
    subst: skillBonuses('subst'),
    dash: skillBonuses('dash'),
    chakra: skillBonuses('chakra'),
  };
}

function skillChakraCost(jutsuKind) {
  const j = jutsuSkillBonuses(jutsuKind || 'rasengan');
  const c = utilitySkillBonuses().chakra;
  return clamp(100 - (j.energySave || 0) - (c.energySave || 0), 72, 100);
}

function addSkillShards(id, n) {
  if (!SKILL_DEFS[id]) return 0;
  const add = clamp(Math.floor(Number(n) || 0), 1, SKILL_SHARD_ADD_CAP);
  const e = skillEntry(id);
  if (!e) return 0;
  e.shards = clamp(skillShards(id) + add, 0, SKILL_SHARD_CAP);
  save.stats = save.stats || {};
  save.stats.skillShards = clamp((save.stats.skillShards || 0) + add, 0, 9999999);
  persist();
  return add;
}

function trySkillUpgrade(id) {
  if (!SKILL_DEFS[id] || !skillCanUpgrade(id)) return false;
  const cost = skillUpgradeCost(id);
  const e = skillEntry(id);
  if (!e || cost == null || skillShards(id) < cost) return false;
  const next = skillLevel(id) + 1;
  if (next > skillMaxLevel(id)) return false;
  e.shards = clamp(skillShards(id) - cost, 0, SKILL_SHARD_CAP);
  e.level = next;
  persist();
  if (SKILL_DEFS[id].group === 'jutsu' && next === 1) setActiveJutsu(id, false);
  return true;
}

function jutsuSkillUnlocked(id, s) {
  if (!SKILL_DEFS[id] || SKILL_DEFS[id].group !== 'jutsu') return false;
  if (id === 'rasengan') return true;
  return skillLevel(id, s) >= 1;
}

function utilitySkillActive(id, s) {
  if (!SKILL_DEFS[id] || SKILL_DEFS[id].group !== 'utility') return false;
  return skillLevel(id, s) >= 1;
}

function activeJutsuId(preferred, s) {
  const st = s || save;
  const pick = (preferred && JUTSU_SKILL_IDS.includes(preferred)) ? preferred : (st.activeJutsu || 'rasengan');
  if (jutsuSkillUnlocked(pick, st)) return pick;
  for (const id of JUTSU_SKILL_IDS) {
    if (jutsuSkillUnlocked(id, st)) return id;
  }
  return 'rasengan';
}

function ensureActiveJutsuValid(preferred) {
  const id = activeJutsuId(preferred);
  save.activeJutsu = id;
  return id;
}

function setActiveJutsu(id, silent) {
  if (!jutsuSkillUnlocked(id)) return false;
  save.activeJutsu = id;
  persist();
  if (!silent) {
    try { UI.toast(t('toast.jutsuEquipped', { name: skillLabel(id) }), 2800); } catch (_) {}
  }
  return true;
}

function rollSkillShardDrop(monster) {
  const elite = !!(monster && monster.elite);
  const giant = !!(monster && monster.giant);
  const superBoss = !!(monster && monster.superBoss);
  let chance = 0.1;
  if (superBoss) chance = 0.55;
  else if (elite) chance = 0.28;
  else if (giant) chance = 0.16;
  if (Math.random() >= chance) return null;
  const weights = [];
  for (const id of SKILL_IDS) {
    let w = 1;
    if (SKILL_DEFS[id].group === 'jutsu') w = id === 'rasengan' ? 2.2 : 0.85;
    if (skillLevel(id) >= skillMaxLevel(id)) w *= 0.35;
    weights.push({ id, w });
  }
  let total = 0;
  for (const x of weights) total += x.w;
  let r = Math.random() * total;
  for (const x of weights) {
    r -= x.w;
    if (r <= 0) return x.id;
  }
  return weights[0]?.id || 'rasengan';
}

function skillUpgradeSummary(id) {
  const lv = skillLevel(id);
  const b = skillBonuses(id);
  const parts = [];
  if (b.dmgMul > 1.001) parts.push(`DMG ×${b.dmgMul.toFixed(2)}`);
  if (b.radius > 0) parts.push(`+${b.radius} radius`);
  if (b.energySave > 0) parts.push(`−${b.energySave} chakra`);
  if (b.regenMul > 1.001) parts.push(`regen ×${b.regenMul.toFixed(2)}`);
  if (b.cdMul < 0.999) parts.push(`CD ×${b.cdMul.toFixed(2)}`);
  if (b.extraShot > 0) parts.push(`${Math.round(b.extraShot * 100)}% extra shot`);
  if (b.pierceRepeat > 0) parts.push(`${Math.round(b.pierceRepeat * 100)}% re-hit`);
  if (b.windupMul < 0.999) parts.push(`sneller cast`);
  if (lv >= skillMaxLevel(id)) parts.push('MAX');
  return parts.length ? parts.join(' · ') : (lv ? 'Lv ' + lv : '—');
}

function skillNextStepPreview(id) {
  const lv = skillLevel(id);
  const def = SKILL_DEFS[id];
  if (!def || lv >= skillMaxLevel(id)) return '';
  const s = def.steps[lv];
  if (!s) return '';
  const parts = [];
  if (s.dmgMul) parts.push(`DMG +${Math.round((s.dmgMul - 1) * 100)}%`);
  if (s.radius) parts.push(`+${s.radius} radius`);
  if (s.energySave) parts.push(`−${s.energySave} chakra`);
  if (s.regenMul) parts.push(`regen +${Math.round((s.regenMul - 1) * 100)}%`);
  if (s.cdMul) parts.push(`CD −${Math.round((1 - s.cdMul) * 100)}%`);
  if (s.extraShot) parts.push(`+${Math.round(s.extraShot * 100)}% extra`);
  if (s.pierceRepeat) parts.push(`+${Math.round(s.pierceRepeat * 100)}% re-hit`);
  return parts.join(' · ');
}

function totalSkillLevels() {
  let n = 0;
  for (const id of SKILL_IDS) n += skillLevel(id);
  return n;
}
