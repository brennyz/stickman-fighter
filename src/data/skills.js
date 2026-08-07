/* ========================== SKILL UPGRADES ============================= */
/** Permanent skill upgrades via adventure shard drops. */
const SKILL_MAX_LEVEL = 5;
const SKILL_SHARD_CAP = 9999;
const SKILL_SHARD_ADD_CAP = 8;
/** Shard-kosten per level-up (index 0 = Lv0→1 …). Spiral Orb gaat tot Lv8. */
const SKILL_SHARD_COSTS = [3, 5, 8, 12, 18, 24, 32, 42];
const SPIRAL_ORB_MAX_LEVEL = 8;

function skillMaxLevel(id) {
  if (id === 'spiral_orb') return SPIRAL_ORB_MAX_LEVEL;
  const def = SKILL_DEFS[id];
  if (!def) return UPGRADE_MAX_STANDARD;
  return def.group === 'technique' ? UPGRADE_MAX_EXTREME : UPGRADE_MAX_STANDARD;
}

const SKILL_DEFS = {
  spiral_orb: {
    id: 'spiral_orb', group: 'technique', color: '#7cf5ff',
    steps: [
      { dmgMul: 1.08, radius: 2 },
      { dmgMul: 1.08, speedMul: 1.06, energySave: 5 },
      { dmgMul: 1.1, radius: 2, windupMul: 0.94 },
      { dmgMul: 1.06, radius: 1, multiShot: 'dual' }, // Lv4: dubbele krul
      { dmgMul: 1.08, lifeMul: 1.08, energySave: 6 },
      { dmgMul: 1.08, radius: 2, speedMul: 1.05 },
      { dmgMul: 1.1, windupMul: 0.92, energySave: 6 },
      { dmgMul: 1.1, radius: 2, multiShot: 'triple' }, // Lv8: driedubbel ultimate
    ],
  },
  lightning_pierce: {
    id: 'lightning_pierce', group: 'technique', color: '#a8e0ff',
    steps: [
      { dmgMul: 1.1, radius: 1 },
      { dmgMul: 1.08, speedMul: 1.08, energySave: 5 },
      { dmgMul: 1.1, windupMul: 0.9, dashMul: 1.1 },
      { dmgMul: 1.12, radius: 2, lifeMul: 1.08 },
      { dmgMul: 1.14, energySave: 10, pierceRepeat: 0.22 },
    ],
  },
  void_gaze: {
    id: 'void_gaze', group: 'technique', color: '#c47aff',
    steps: [
      { dmgMul: 1.1, radius: 5 },
      { dmgMul: 1.08, speedMul: 1.08, energySave: 5, radius: 4 },
      { dmgMul: 1.1, radius: 6, lifeMul: 1.1 },
      { dmgMul: 1.12, windupMul: 0.9, speedMul: 1.06, radius: 5 },
      { dmgMul: 1.14, radius: 7, energySave: 8, pierceRepeat: 0.15 },
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
  energy: {
    id: 'energy', group: 'utility', color: '#ffd75e',
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
const TECHNIQUE_SKILL_IDS = SKILL_IDS.filter((id) => SKILL_DEFS[id].group === 'technique');

/** Legacy anime/IP skill ids → store-safe ids (save migration). Keys hex-encoded so store greps stay clean. */
function hexToStr(hex) {
  let s = '';
  for (let i = 0; i < hex.length; i += 2) s += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
  return s;
}

const SKILL_ID_ALIASES = (() => {
  const m = {};
  const add = (hex, id) => { m[hexToStr(hex)] = id; };
  add('726173656e67616e', 'spiral_orb');
  add('636869646f7269', 'lightning_pierce');
  add('72696e6e6567616e', 'void_gaze');
  add('6b616d6568616d656861', 'wave_cannon');
  add('6b616d6568616d65', 'wave_cannon');
  add('67616c69636b5f67756e', 'violet_blast');
  add('7370697269745f626f6d62', 'energy_sphere');
  add('66696e616c5f666c617368', 'solar_beam');
  add('62616e6b6169', 'blade_ascend');
  add('62616e6b61695f736c617368', 'blade_ascend');
  add('67657473756761', 'moon_slash');
  add('6365726f', 'void_beam');
  add('65696768745f6761746573', 'iron_surge');
  add('385f6761746573', 'iron_surge');
  add('616b617473756b695f7374796c65', 'crimson_pact');
  add('6669726562616c6c5f6a75747375', 'fire_orb');
  add('6669726562616c6c5f626c617374', 'fire_orb');
  add('736861646f775f636c6f6e655f6275727374', 'clone_rush');
  add('67656e746c655f70616c6d', 'soft_palm');
  add('64657374727563746f5f64697363', 'cutter_disc');
  add('72617a6f725f64697363', 'cutter_disc');
  add('696e7374616e745f64617368', 'blink_strike');
  add('67756d5f726f636b6574', 'stretch_dash');
  add('676561725f7365636f6e64', 'steam_burst');
  add('737465616d5f72757368', 'steam_burst');
  add('736572696f75735f70756e6368', 'heavy_punch');
  add('746974616e5f66697374', 'heavy_punch');
  add('736572696f75735f626c617374', 'heavy_blast');
  add('746974616e5f6265616d', 'heavy_blast');
  add('6368616b7261', 'energy');
  add('656e657267795f636f7265', 'energy');
  return m;
})();
const STYLE_ID_ALIASES = (() => {
  const m = {};
  const add = (hex, id) => { m[hexToStr(hex)] = id; };
  add('6368616b7261', 'energy_glow');
  add('616b617473756b69', 'crimson_pact');
  add('6b6f6e6f6861', 'leaf_band');
  add('656e65726779', 'energy_glow');
  return m;
})();
const SUPER_ID_ALIASES = (() => {
  const m = {};
  const add = (hex, id) => { m[hexToStr(hex)] = id; };
  add('73686172696e67616e', 'mind_eye');
  return m;
})();

function migrateSkillId(id) {
  if (!id || typeof id !== 'string') return id;
  return SKILL_ID_ALIASES[id] || id;
}

function migrateStyleId(id) {
  if (!id || typeof id !== 'string') return id;
  return STYLE_ID_ALIASES[id] || id;
}

/** Remap skillUpgrades bag keys from legacy ids; merge collisions by max level/shards. */
function migrateSkillUpgradesBag(raw) {
  const src = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
  const out = {};
  for (const [k, v] of Object.entries(src)) {
    const id = migrateSkillId(k);
    if (!id) continue;
    const entry = (v && typeof v === 'object') ? v : {};
    const lv = Math.floor(Number(entry.level) || 0);
    const shards = Math.floor(Number(entry.shards) || 0);
    const prev = out[id];
    if (!prev) {
      out[id] = { level: lv, shards };
      continue;
    }
    out[id] = {
      level: Math.max(Math.floor(Number(prev.level) || 0), lv),
      shards: Math.max(Math.floor(Number(prev.shards) || 0), shards),
    };
  }
  return out;
}

function migrateLegacySkillSave(bag) {
  if (!bag || typeof bag !== 'object') return bag;
  const legacyActive = hexToStr('6163746976654a75747375');
  if (typeof bag[legacyActive] === 'string' && !bag.activeTechnique) {
    bag.activeTechnique = bag[legacyActive];
  }
  delete bag[legacyActive];
  if (typeof bag.activeTechnique === 'string') bag.activeTechnique = migrateSkillId(bag.activeTechnique);
  if (typeof bag.skill === 'string') bag.skill = migrateSkillId(bag.skill);
  if (typeof bag.style === 'string') bag.style = migrateStyleId(bag.style);
  if (typeof bag.super === 'string') {
    bag.super = (SUPER_ID_ALIASES[bag.super] || bag.super);
  }
  bag.skillUpgrades = migrateSkillUpgradesBag(bag.skillUpgrades);
  if (bag.tipsSeen && typeof bag.tipsSeen === 'object') {
    const legacyTip = hexToStr('6368616b7261'); // energy tip key
    if (bag.tipsSeen[legacyTip] && !bag.tipsSeen.energy) bag.tipsSeen.energy = bag.tipsSeen[legacyTip];
    if (legacyTip in bag.tipsSeen) delete bag.tipsSeen[legacyTip];
  }
  if (bag.itemUpgrades && bag.itemUpgrades.style && typeof bag.itemUpgrades.style === 'object') {
    const next = {};
    for (const [k, v] of Object.entries(bag.itemUpgrades.style)) next[migrateStyleId(k)] = v;
    bag.itemUpgrades.style = next;
  }
  return bag;
}

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

function snapshotSkillUpgradeTracks(st) {
  const snap = {};
  const raw = (st && st.skillUpgrades && typeof st.skillUpgrades === 'object') ? st.skillUpgrades : {};
  for (const [id, e] of Object.entries(raw)) {
    if (!SKILL_DEFS[id] || !e || typeof e !== 'object') continue;
    const lv = Math.floor(Number(e.level) || 0);
    const shards = Math.floor(Number(e.shards) || 0);
    if (lv > 0 || shards > 0) snap[id] = { level: lv, shards };
  }
  return snap;
}

function countSkillUpgradeLevels(st) {
  let n = 0;
  const raw = (st && st.skillUpgrades) || {};
  for (const id of SKILL_IDS) {
    n += Math.floor(Number(raw[id] && raw[id].level) || 0);
  }
  return n;
}

function restoreLostSkillUpgrades(snap, out) {
  if (!snap || !out) return out;
  for (const [id, raw] of Object.entries(snap)) {
    if (!SKILL_DEFS[id]) continue;
    const cur = (out.skillUpgrades || {})[id];
    const curLv = cur ? Math.floor(Number(cur.level) || 0) : 0;
    const curSh = cur ? Math.floor(Number(cur.shards) || 0) : 0;
    const prevLv = Math.floor(Number(raw.level) || 0);
    const prevSh = Math.floor(Number(raw.shards) || 0);
    if (prevLv > curLv || (prevLv === curLv && prevSh > curSh)) {
      const merged = sanitizeSkillUpgradeEntry(id, {
        level: Math.max(prevLv, curLv),
        shards: Math.max(prevSh, curSh),
      });
      if (merged) {
        if (!out.skillUpgrades) out.skillUpgrades = {};
        out.skillUpgrades[id] = merged;
      }
    }
  }
  return out;
}

function skillLevel(id, st) {
  const def = SKILL_DEFS[id];
  if (!def) return 0;
  const bag = (st && st.skillUpgrades) || (save && save.skillUpgrades) || {};
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

function skillBonuses(id, st) {
  const def = SKILL_DEFS[id];
  const b = {
    dmgMul: 1, radius: 0, speedMul: 1, lifeMul: 1, windupMul: 1, energySave: 0,
    regenMul: 1, cdMul: 1, dashDistMul: 1, dashSpeedMul: 1, invulnAdd: 0,
    extraShot: 0, pierceRepeat: 0, pullMul: 1,
  };
  if (!def) return b;
  const lv = skillLevel(id, st);
  if (lv <= 0) return b;
  for (let i = 0; i < lv; i++) {
    const step = def.steps[i];
    if (!step) continue;
    if (step.dmgMul) b.dmgMul *= step.dmgMul;
    if (step.radius) b.radius += step.radius;
    if (step.speedMul) b.speedMul *= step.speedMul;
    if (step.lifeMul) b.lifeMul *= step.lifeMul;
    if (step.windupMul) b.windupMul *= step.windupMul;
    if (step.energySave) b.energySave += step.energySave;
    if (step.regenMul) b.regenMul *= step.regenMul;
    if (step.cdMul) b.cdMul *= step.cdMul;
    if (step.dashDistMul) b.dashDistMul *= step.dashDistMul;
    if (step.dashSpeedMul) b.dashSpeedMul *= step.dashSpeedMul;
    if (step.invulnAdd) b.invulnAdd += step.invulnAdd;
    if (step.extraShot) b.extraShot = Math.min(0.45, b.extraShot + step.extraShot);
    if (step.pierceRepeat) b.pierceRepeat = Math.min(0.4, b.pierceRepeat + step.pierceRepeat);
    if (step.pullMul) b.pullMul *= step.pullMul;
  }
  return b;
}

function techniqueSkillBonuses(kind) {
  return skillBonuses(kind && SKILL_DEFS[kind] ? kind : 'spiral_orb');
}

/** Spiral Orb multi-shot: Lv1–3 single · Lv4–7 dual curl · Lv8+ triple ultimate. */
function spiralOrbShotMode(lv) {
  const n = Math.floor(Number(lv) || 0);
  if (n >= 8) return 'triple';
  if (n >= 4) return 'dual';
  return 'single';
}

function spiralOrbShotModeLabel(mode) {
  if (mode === 'triple') return 'Driedubbele Spiraal Orb';
  if (mode === 'dual') return 'Dubbele Spiraal Orb';
  return 'Horizontale Spiraal Orb';
}

/**
 * Spiral Orb cast-cooldown (seconden) op skill-level:
 * Lv1–2 → 2s · Lv3–7 → 3s · Lv8 → 5s
 * (skillLevel 0 = basis = Lv1-gedrag)
 */
function spiralOrbCooldownSec(lv) {
  const n = Math.floor(Number(lv) || 0);
  if (n >= 8) return 5;
  if (n >= 3) return 3;
  return 2;
}

function utilitySkillBonuses() {
  return {
    subst: skillBonuses('subst'),
    dash: skillBonuses('dash'),
    energy: skillBonuses('energy'),
  };
}

function skillEnergyCost(techniqueKind) {
  const j = techniqueSkillBonuses(techniqueKind || 'spiral_orb');
  const c = utilitySkillBonuses().energy;
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
  if (SKILL_DEFS[id].group === 'technique' && next === 1) setActiveTechnique(id, true);
  return persistOrToast('skillUp/' + id);
}


function techniqueSkillUnlocked(id, st) {
  if (!SKILL_DEFS[id] || SKILL_DEFS[id].group !== 'technique') return false;
  if (id === 'spiral_orb') return true;
  return skillLevel(id, st) >= 1;
}

function activeTechniqueId(preferred, st) {
  const bag = st || save;
  const pick = (preferred && TECHNIQUE_SKILL_IDS.includes(preferred)) ? preferred : (bag.activeTechnique || 'spiral_orb');
  if (techniqueSkillUnlocked(pick, bag)) return pick;
  for (const jid of TECHNIQUE_SKILL_IDS) {
    if (techniqueSkillUnlocked(jid, bag)) return jid;
  }
  return 'spiral_orb';
}

function setActiveTechnique(id, silent) {
  if (!techniqueSkillUnlocked(id)) return false;
  save.activeTechnique = id;
  if (skillExists(id)) save.skill = id;
  persist();
  if (!silent) {
    try { UI.toast(t('toast.techniqueEquipped', { name: skillLabel(id) }), 2800); } catch (_) {}
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
  try {
    if (typeof game !== 'undefined' && game && game.mode === 'adventure') {
      chance = Math.min(0.92, chance * advDropChanceMul(game.advDiff));
    }
  } catch (_) {}
  if (Math.random() >= chance) return null;
  const weights = [];
  for (const id of SKILL_IDS) {
    let w = 1;
    if (SKILL_DEFS[id].group === 'technique') w = id === activeTechniqueId() ? 2.2 : 0.85;
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
  return weights[0]?.id || 'spiral_orb';
}

function skillUpgradeSummary(id) {
  const lv = skillLevel(id);
  const b = skillBonuses(id);
  const parts = [];
  if (id === 'spiral_orb') {
    parts.push(spiralOrbShotModeLabel(spiralOrbShotMode(lv)));
    parts.push('CD ' + spiralOrbCooldownSec(lv) + 's');
  }
  if (b.dmgMul > 1.001) parts.push(`DMG ×${b.dmgMul.toFixed(2)}`);
  if (b.radius > 0) parts.push(`+${b.radius} radius`);
  if (b.energySave > 0) parts.push(`−${b.energySave} energy`);
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
  if (s.multiShot === 'dual') parts.push('Dubbele krul (↑+↓)');
  if (s.multiShot === 'triple') parts.push('Driedubbel ultimate (→↑↓)');
  if (s.dmgMul) parts.push(`DMG +${Math.round((s.dmgMul - 1) * 100)}%`);
  if (s.radius) parts.push(`+${s.radius} radius`);
  if (s.energySave) parts.push(`−${s.energySave} energy`);
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

/* ============================== SKILLS ================================= */
/** Energy specials — equip via Collectie → Skills (avontuur/training/muur/mats). */
const SKILLS = [
  { id: 'spiral_orb', name: 'Spiraal Orb', saga: 'scroll', needLvl: 1,
    behavior: 'orb', dmgMul: 2.85, windup: 0.48, speed: 420, radius: 28, pierce: true, life: 1.4,
    color: '#7cf5ff', sfx: 'spiral_orb', banner: 'SPIRAL ORB!', kb: 520,
    hint: 'Standaard', tooltip: 'Altijd horizontaal. Lv4: dubbele krul ↑↓. Lv8: driedubbel ultimate →↑↓. Cooldown: Lv1–2 = 2s · Lv3 = 3s · Lv8 = 5s.',
    bonus: 'Horizontaal · dual/triple · CD 2/3/5s' },
  { id: 'fire_orb', name: 'Vuurbol', saga: 'scroll', needLvl: 4,
    behavior: 'orb', dmgMul: 2.65, windup: 0.42, speed: 380, radius: 26, pierce: false, life: 1.1,
    color: '#ff8c42', sfx: 'spiral_orb', banner: 'VUURBOL!', kb: 480,
    hint: 'Lv 4', tooltip: 'Vuur-stijl vuurprojectiel — korter maar sneller te laden.',
    bonus: 'Snelle fire orb' },
  { id: 'lightning_pierce', name: 'Bliksemprik', saga: 'scroll', needLvl: 6,
    behavior: 'dash', dmgMul: 2.72, windup: 0.48, speed: 620, radius: 22, pierce: false, life: 0.35,
    dashVx: 380, color: '#a8e0ff', sfx: 'lightning_pierce', banner: 'LIGHTNING PIERCE!', kb: 540,
    hint: 'Lv 6', tooltip: 'Bliksem-dash vooruit — korte maar heftige burst.',
    bonus: 'Lightning dash' },
  { id: 'clone_rush', name: 'Schaduw-clones', saga: 'scroll', needLvl: 8,
    behavior: 'dash', dmgMul: 2.58, windup: 0.44, speed: 540, radius: 24, pierce: true, life: 0.42,
    dashVx: 320, color: '#cfe0ff', sfx: 'lightning_pierce', banner: 'CLONE RUSH!', kb: 460,
    hint: 'Lv 8', tooltip: 'Dash met pierce-slagen — mobiel en breed.',
    bonus: 'Pierce dash' },
  { id: 'soft_palm', name: 'Zachte palm', saga: 'scroll', needLvl: 10,
    behavior: 'orb', dmgMul: 2.45, windup: 0.38, speed: 340, radius: 32, pierce: false, life: 0.55,
    color: '#b8ffc8', sfx: 'spiral_orb', banner: 'PALM STRIKE!', kb: 620,
    hint: 'Lv 10', tooltip: 'Interne schade-burst op korte afstand — hoge knockback.',
    bonus: 'Heavy knockback' },
  { id: 'void_gaze', name: 'Leegteblik', saga: 'scroll', needLvl: 22,
    behavior: 'slash', dmgMul: 2.95, windup: 0.42, speed: 720, radius: 42, pierce: true, life: 0.68,
    color: '#c47aff', sfx: 'void_gaze', banner: 'VOID GAZE!', kb: 580,
    hint: 'Lv 22', tooltip: 'Lichtschits-explosie links én rechts — strook dik bij jou, dun verderop. Upgrades = dikkere strook.',
    bonus: '2-richting slash · taper · dikker per Lv' },
  { id: 'iron_surge', name: 'IJzerstoot', saga: 'scroll', needLvl: 24,
    behavior: 'dash', dmgMul: 3.05, windup: 0.55, speed: 680, radius: 26, pierce: true, life: 0.38,
    dashVx: 420, color: '#ff6b6b', sfx: 'lightning_pierce', banner: 'IRON SURGE!', kb: 580,
    hint: 'Lv 24', tooltip: 'Rood-blitz dash — hoogste scroll dash-schade.',
    bonus: 'Power dash' },
  { id: 'black_hole', name: 'Zwart gat', saga: 'scroll', needLvl: 38,
    behavior: 'meteor', dmgMul: 3.2, windup: 0.62, speed: 220, radius: 36, pierce: true, life: 1.35,
    pull: true, color: '#6a4aff', sfx: 'void_gaze', banner: 'BLACK HOLE!', kb: 500,
    hint: 'Lv 38', tooltip: 'Gravity-orb — langzaam, trekt alles naar binnen.',
    bonus: 'Gravity meteor' },

  { id: 'wave_cannon', name: 'Golfkanon', saga: 'ki', needLvl: 7,
    behavior: 'beam', dmgMul: 3.0, windup: 0.58, speed: 520, radius: 34, pierce: true, life: 1.15,
    color: '#5ad0ff', sfx: 'spiral_orb', banner: 'WAVE CANNON!', kb: 540,
    hint: 'Lv 7', tooltip: 'Brede ki-straal — pierce door de hele golf.',
    bonus: 'Classic beam' },
  { id: 'violet_blast', name: 'Violetschot', saga: 'ki', needLvl: 13,
    behavior: 'beam', dmgMul: 2.92, windup: 0.52, speed: 480, radius: 30, pierce: true, life: 1.0,
    color: '#b06ae0', sfx: 'void_gaze', banner: 'VIOLET BLAST!', kb: 520,
    hint: 'Lv 13', tooltip: 'Paarse ki-beam — iets sneller windup.',
    bonus: 'Purple beam' },
  { id: 'cutter_disc', name: 'Cutter Disc', saga: 'ki', needLvl: 16,
    behavior: 'disc', dmgMul: 2.78, windup: 0.5, speed: 560, radius: 18, pierce: true, life: 1.25,
    color: '#ffe259', sfx: 'spiral_orb', banner: 'DISC!', kb: 380,
    hint: 'Lv 16', tooltip: 'Dunne snijschijf — snel en pierce.',
    bonus: 'Pierce disc' },
  { id: 'blink_strike', name: 'Blink Strike', saga: 'ki', needLvl: 11,
    behavior: 'dash', dmgMul: 2.48, windup: 0.36, speed: 700, radius: 20, pierce: false, life: 0.28,
    dashVx: 440, color: '#7cf5ff', sfx: 'lightning_pierce', banner: 'TELEPORT STRIKE!', kb: 420,
    hint: 'Lv 11', tooltip: 'Ultra-korte windup dash — surprise opener.',
    bonus: 'Fast dash' },
  { id: 'solar_beam', name: 'Zonnestraal', saga: 'ki', needLvl: 28,
    behavior: 'beam', dmgMul: 3.35, windup: 0.68, speed: 580, radius: 38, pierce: true, life: 1.3,
    color: '#ffe080', sfx: 'spiral_orb', banner: 'SOLAR BEAM!', kb: 600,
    hint: 'Lv 28', tooltip: 'Massieve gele beam — lang windup, extreme schade.',
    bonus: 'Mega beam' },
  { id: 'energy_sphere', name: 'Energiesfeer', saga: 'ki', needLvl: 32,
    behavior: 'meteor', dmgMul: 3.4, windup: 0.72, speed: 180, radius: 40, pierce: true, life: 1.6,
    pull: true, color: '#a8ecff', sfx: 'void_gaze', banner: 'ENERGY SPHERE!', kb: 480,
    hint: 'Lv 32', tooltip: 'Gigantische ki-orb — langzaam, alles trekt mee.',
    bonus: 'Ultimate orb' },

  { id: 'moon_slash', name: 'Maanslag', saga: 'tide', needLvl: 9,
    behavior: 'beam', dmgMul: 2.75, windup: 0.46, speed: 500, radius: 26, pierce: true, life: 0.95,
    color: '#6fd7ff', sfx: 'spiral_orb', banner: 'MOON SLASH!', kb: 500,
    hint: 'Lv 9', tooltip: 'Cyan maanslag-golf — snelle horizontale slash.',
    bonus: 'Moon slash' },
  { id: 'void_beam', name: 'Leegtestraal', saga: 'tide', needLvl: 15,
    behavior: 'beam', dmgMul: 2.88, windup: 0.54, speed: 510, radius: 32, pierce: true, life: 1.05,
    color: '#ff4040', sfx: 'void_gaze', banner: 'VOID BEAM!', kb: 560,
    hint: 'Lv 15', tooltip: 'Rode leegte-straal — brede tide beam.',
    bonus: 'Red beam' },
  { id: 'blade_ascend', name: 'Lemmet-opstijging', saga: 'tide', needLvl: 26,
    behavior: 'dash', dmgMul: 3.1, windup: 0.5, speed: 640, radius: 28, pierce: true, life: 0.45,
    dashVx: 400, color: '#9db8ff', sfx: 'lightning_pierce', banner: 'BLADE ASCEND!', kb: 580,
    hint: 'Lv 26', tooltip: 'Blauwe blitz na release — pierce dash.',
    bonus: 'Blade Ascend dash' },

  { id: 'stretch_dash', name: 'Stretch Dash', saga: 'fighter', needLvl: 5,
    behavior: 'dash', dmgMul: 2.52, windup: 0.4, speed: 580, radius: 24, pierce: false, life: 0.32,
    dashVx: 360, color: '#ffb0b8', sfx: 'lightning_pierce', banner: 'STRETCH DASH!', kb: 500,
    hint: 'Lv 5', tooltip: 'Rubber-arm dash — vroeg unlock arcade vibe.',
    bonus: 'Stretch dash' },
  { id: 'steam_burst', name: 'Steam Burst', saga: 'fighter', needLvl: 14,
    behavior: 'orb', dmgMul: 2.95, windup: 0.42, speed: 480, radius: 26, pierce: true, life: 1.0,
    color: '#ff6b6b', sfx: 'spiral_orb', banner: 'STEAM BURST!', kb: 540,
    hint: 'Lv 14', tooltip: 'Steam-orb — snelle pierce special.',
    bonus: 'Speed orb' },

  { id: 'thunder_palm', name: 'Thunder Palm', saga: 'cape', needLvl: 12,
    behavior: 'dash', dmgMul: 2.68, windup: 0.45, speed: 600, radius: 24, pierce: false, life: 0.34,
    dashVx: 370, color: '#ffe259', sfx: 'lightning_pierce', banner: 'THUNDER!', kb: 520,
    hint: 'Lv 12', tooltip: 'Bliksem-palm dash — cape saga special.',
    bonus: 'Hero dash' },
  { id: 'heavy_punch', name: 'Heavy Punch', saga: 'cape', needLvl: 30,
    behavior: 'orb', dmgMul: 3.5, windup: 0.55, speed: 460, radius: 34, pierce: true, life: 0.7,
    color: '#ff4040', sfx: 'spiral_orb', banner: 'HEAVY PUNCH!', kb: 720,
    hint: 'Lv 30', tooltip: 'One-hit orb — korte range, extreme schade.',
    bonus: 'Heavy hit' },
  { id: 'heavy_blast', name: 'Heavy Blast', saga: 'cape', needLvl: 42,
    behavior: 'beam', dmgMul: 3.55, windup: 0.65, speed: 550, radius: 36, pierce: true, life: 1.2,
    color: '#ff8080', sfx: 'spiral_orb', banner: 'HEAVY BLAST!', kb: 640,
    hint: 'Lv 42', tooltip: 'Heavy Series beam — endgame cape ultimate.',
    bonus: 'Heavy beam' },

  { id: 'sun_palm', name: 'Sun Palm', saga: 'dawn', needLvl: 10,
    behavior: 'orb', dmgMul: 2.7, windup: 0.44, speed: 400, radius: 30, pierce: false, life: 1.0,
    color: '#ffd75e', sfx: 'spiral_orb', banner: 'SUN PALM!', kb: 490,
    hint: 'Lv 10', tooltip: 'Gouden palm-orb — dawn saga balanced special.',
    bonus: 'Solar orb' },
  { id: 'moon_pull', name: 'Moon Pull', saga: 'dawn', needLvl: 18,
    behavior: 'pull', dmgMul: 2.62, windup: 0.5, speed: 300, radius: 28, pierce: true, life: 1.0,
    pull: true, color: '#e0a8ff', sfx: 'void_gaze', banner: 'MOON PULL!', kb: 440,
    hint: 'Lv 18', tooltip: 'Maankracht-orb met pull — controle-special.',
    bonus: 'Lunar pull' },
];

const skillById = id => SKILLS.find(s => s.id === id) || SKILLS[0];

function skillExists(id) {
  return SKILLS.some(s => s.id === id);
}

function skillBehaviorLabel(sk) {
  const map = {
    orb: 'Orb', dash: 'Dash', pull: 'Pull', beam: 'Beam', disc: 'Disc',
    meteor: 'Meteor', slash: 'Slash',
  };
  return map[sk && sk.behavior] || 'Special';
}

function skillSkillGated(sk) {
  return !!(sk.needLvl && sk.needLvl > adventureWeaponCap());
}

function skillUnlocked(sk) {
  if (!sk) return false;
  if (sk.id === 'spiral_orb') return true;
  if (skillSkillGated(sk)) return false;
  if (sk.needLvl && save.lvl >= sk.needLvl) return true;
  if (sk.needTrain && save.trainWins >= sk.needTrain) return true;
  if (sk.needDex && dexCount() >= sk.needDex) return true;
  if (sk.needDexKills && dexTotalKills() >= sk.needDexKills) return true;
  return false;
}

function skillUnlockedCount() {
  return SKILLS.filter(skillUnlocked).length;
}

function fighterEquippedSkill(f) {
  if (!f) return skillById('spiral_orb');
  if (f.isRobot) return skillById('lightning_pierce');
  if (f.playerSlot === 2 || (f.playerSlot && f.playerSlot !== 1)) {
    const vs = f.vsSpecial || 'spiral_orb';
    return skillById(vs) || skillById('spiral_orb');
  }
  if (f.isPlayer && !f.playerSlot) {
    const skillId = save.skill || (typeof activeTechniqueId === 'function' ? activeTechniqueId() : 'spiral_orb') || 'spiral_orb';
    const eq = skillById(skillId);
    return skillUnlocked(eq) ? eq : skillById('spiral_orb');
  }
  if (f.vsSpecial) return skillById(f.vsSpecial) || skillById('spiral_orb');
  return skillById('spiral_orb');
}

function applyPlayerSkill(fighter) {
  if (!fighter || !fighter.isPlayer || fighter.playerSlot) return;
  const sk = fighterEquippedSkill(fighter);
  fighter.vsSpecial = sk.id;
}

function skillBanner(sk) {
  return (sk && sk.banner) || 'SPECIAL!';
}

function skillHudColor(sk) {
  return (sk && sk.color) || '#7cf5ff';
}

function skillSfxId(sk) {
  if (!sk) return 'spiral_orb';
  return sk.id || sk.sfx || 'spiral_orb';
}

function skillCombatLine(sk) {
  return sk.bonus || sk.hint || '';
}

const SKILL_BEHAVIORS = ['orb', 'dash', 'beam', 'disc', 'pull', 'meteor', 'slash'];
const SKILL_SAGA_ORDER = ['scroll', 'ki', 'tide', 'fighter', 'cape', 'dawn'];

function skillsForFilters(saga, behavior) {
  let list = SKILLS.slice();
  if (saga && saga !== 'all') list = list.filter(s => s.saga === saga);
  if (behavior && behavior !== 'all') list = list.filter(s => s.behavior === behavior);
  return list;
}

function skillSagaCounts(saga) {
  const list = saga === 'all' ? SKILLS : SKILLS.filter(s => s.saga === saga);
  return { unlocked: list.filter(skillUnlocked).length, total: list.length };
}

function skillNextUnlock() {
  const pending = SKILLS.filter(s => !skillUnlocked(s))
    .sort((a, b) => (a.needLvl || 999) - (b.needLvl || 999));
  return pending[0] || null;
}

function sortSkills(list, mode) {
  const arr = list.slice();
  if (mode === 'dmg') arr.sort((a, b) => (b.dmgMul || 0) - (a.dmgMul || 0) || (a.needLvl || 0) - (b.needLvl || 0));
  else if (mode === 'name') arr.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  else arr.sort((a, b) => (a.needLvl || 0) - (b.needLvl || 0) || String(a.name).localeCompare(String(b.name)));
  return arr;
}

function skillBehaviorLabelI18n(sk) {
  const beh = sk && sk.behavior ? sk.behavior : 'orb';
  const k = 'skill.behavior.' + beh;
  const v = typeof t === 'function' ? t(k) : '';
  if (v && v !== k) return v;
  return skillBehaviorLabel(sk);
}

function skillSagaBlurb(saga) {
  if (!saga || saga === 'all') return typeof t === 'function' ? t('ui.skillBlurbAll') : '';
  const k = 'skill.saga.' + saga + '.blurb';
  const v = typeof t === 'function' ? t(k) : '';
  if (v && v !== k) return v;
  const meta = typeof vsSagaMeta === 'function' ? vsSagaMeta(saga) : null;
  return meta ? meta.blurb : '';
}

function skillStatRows(sk) {
  if (!sk) return [];
  const maxDmg = 3.6;
  const maxSpd = 720;
  const maxKb = 720;
  const maxWind = 0.75;
  return [
    { key: 'dmg', pct: clamp((sk.dmgMul || 2) / maxDmg, 0.08, 1), text: '×' + (sk.dmgMul || 2).toFixed(2) },
    { key: 'wind', pct: clamp(1 - (sk.windup || 0.5) / maxWind, 0.08, 1), text: ((sk.windup || 0) * 1000 | 0) + 'ms' },
    { key: 'spd', pct: clamp((sk.speed || 400) / maxSpd, 0.08, 1), text: String(sk.speed || 0) },
    { key: 'kb', pct: clamp((sk.kb || 480) / maxKb, 0.08, 1), text: String(sk.kb || 0) },
  ];
}

function skillTags(sk) {
  if (!sk) return [];
  const tags = [skillBehaviorLabelI18n(sk)];
  if (sk.pierce) tags.push(typeof t === 'function' ? t('skill.tag.pierce') : 'Pierce');
  if (sk.pull) tags.push(typeof t === 'function' ? t('skill.tag.pull') : 'Pull');
  return tags;
}
