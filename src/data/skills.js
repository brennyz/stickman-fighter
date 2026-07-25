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
  if (SKILL_DEFS[id].group === 'jutsu' && next === 1) setActiveJutsu(id, true);
  return persistOrToast('skillUp/' + id);
}


/** Jutsu equipbaar als SUPER: Rasengan altijd, of shard-upgrade Lv≥1, of roster-unlock (needLvl). */
function jutsuSkillUnlocked(id, st) {
  if (!SKILL_DEFS[id] || SKILL_DEFS[id].group !== 'jutsu') return false;
  if (id === 'rasengan') return true;
  if (skillLevel(id, st) >= 1) return true;
  const bag = st || save;
  const sk = typeof skillById === 'function' ? skillById(id) : null;
  if (!sk || sk.id !== id) return false;
  const lvl = Math.floor(Number(bag && bag.lvl) || 1);
  const unlockedAdv = Math.floor(Number(bag && bag.unlocked) || 1);
  const cap = typeof adventureWeaponCapForLevel === 'function'
    ? adventureWeaponCapForLevel(unlockedAdv)
    : 999;
  if (sk.needLvl && sk.needLvl > cap) return false;
  if (sk.needLvl && lvl >= sk.needLvl) return true;
  return false;
}

function utilitySkillActive(id, st) {
  if (!SKILL_DEFS[id] || SKILL_DEFS[id].group !== 'utility') return false;
  return skillLevel(id, st) >= 1;
}

function activeJutsuId(preferred, st) {
  const bag = st || save;
  const pick = (preferred && JUTSU_SKILL_IDS.includes(preferred)) ? preferred : (bag.activeJutsu || 'rasengan');
  if (jutsuSkillUnlocked(pick, bag)) return pick;
  for (const jid of JUTSU_SKILL_IDS) {
    if (jutsuSkillUnlocked(jid, bag)) return jid;
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
  if (skillExists(id)) save.skill = id;
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
    if (SKILL_DEFS[id].group === 'jutsu') w = id === activeJutsuId() ? 2.2 : 0.85;
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

/* ============================== SKILLS ================================= */
/** Chakra-specials — equip via Collectie → Skills (avontuur/training/muur/mats). */
const SKILLS = [
  { id: 'rasengan', name: 'Rasengan', saga: 'scroll', needLvl: 1,
    behavior: 'orb', dmgMul: 2.85, windup: 0.48, speed: 420, radius: 28, pierce: true, life: 1.4,
    color: '#7cf5ff', sfx: 'rasengan', banner: 'RASENGAN!', kb: 520,
    hint: 'Standaard', tooltip: 'Draaiende chakra-bol — pierce door meerdere vijanden.',
    bonus: 'Piercing orb' },
  { id: 'fireball_jutsu', name: 'Vuurbol', saga: 'scroll', needLvl: 4,
    behavior: 'orb', dmgMul: 2.65, windup: 0.42, speed: 380, radius: 26, pierce: false, life: 1.1,
    color: '#ff8c42', sfx: 'rasengan', banner: 'VUURBOL!', kb: 480,
    hint: 'Lv 4', tooltip: 'Katon-stijl vuurprojectiel — korter maar sneller te laden.',
    bonus: 'Snelle fire orb' },
  { id: 'chidori', name: 'Chidori', saga: 'scroll', needLvl: 6,
    behavior: 'dash', dmgMul: 2.72, windup: 0.48, speed: 620, radius: 22, pierce: false, life: 0.35,
    dashVx: 380, color: '#a8e0ff', sfx: 'chidori', banner: 'CHIDORI!', kb: 540,
    hint: 'Lv 6', tooltip: 'Bliksem-dash vooruit — korte maar heftige burst.',
    bonus: 'Lightning dash' },
  { id: 'shadow_clone_burst', name: 'Schaduw-clones', saga: 'scroll', needLvl: 8,
    behavior: 'dash', dmgMul: 2.58, windup: 0.44, speed: 540, radius: 24, pierce: true, life: 0.42,
    dashVx: 320, color: '#cfe0ff', sfx: 'chidori', banner: 'CLONE RUSH!', kb: 460,
    hint: 'Lv 8', tooltip: 'Dash met pierce-slagen — mobiel en breed.',
    bonus: 'Pierce dash' },
  { id: 'gentle_palm', name: 'Zachte palm', saga: 'scroll', needLvl: 10,
    behavior: 'orb', dmgMul: 2.45, windup: 0.38, speed: 340, radius: 32, pierce: false, life: 0.55,
    color: '#b8ffc8', sfx: 'rasengan', banner: 'PALM STRIKE!', kb: 620,
    hint: 'Lv 10', tooltip: 'Interne schade-burst op korte afstand — hoge knockback.',
    bonus: 'Heavy knockback' },
  { id: 'rinnegan', name: 'Rinnegan', saga: 'scroll', needLvl: 22,
    behavior: 'pull', dmgMul: 2.55, windup: 0.52, speed: 340, radius: 30, pierce: true, life: 1.05,
    pull: true, color: '#c47aff', sfx: 'rinnegan', banner: 'RINNEGAN!', kb: 460,
    hint: 'Lv 22', tooltip: 'Traag oog-orb met pull — trekt vijanden mee.',
    bonus: 'Pull + pierce' },
  { id: 'eight_gates', name: '8 poorten', saga: 'scroll', needLvl: 24,
    behavior: 'dash', dmgMul: 3.05, windup: 0.55, speed: 680, radius: 26, pierce: true, life: 0.38,
    dashVx: 420, color: '#ff6b6b', sfx: 'chidori', banner: '8 GATES!', kb: 580,
    hint: 'Lv 24', tooltip: 'Rood-blitz dash — hoogste scroll dash-schade.',
    bonus: 'Power dash' },
  { id: 'black_hole', name: 'Zwart gat', saga: 'scroll', needLvl: 38,
    behavior: 'meteor', dmgMul: 3.2, windup: 0.62, speed: 220, radius: 36, pierce: true, life: 1.35,
    pull: true, color: '#6a4aff', sfx: 'rinnegan', banner: 'BLACK HOLE!', kb: 500,
    hint: 'Lv 38', tooltip: 'Gravity-orb — langzaam, trekt alles naar binnen.',
    bonus: 'Gravity meteor' },

  { id: 'kamehameha', name: 'Kamehameha', saga: 'ki', needLvl: 7,
    behavior: 'beam', dmgMul: 3.0, windup: 0.58, speed: 520, radius: 34, pierce: true, life: 1.15,
    color: '#5ad0ff', sfx: 'rasengan', banner: 'KAMEHAMEHA!', kb: 540,
    hint: 'Lv 7', tooltip: 'Brede ki-straal — pierce door de hele golf.',
    bonus: 'Classic beam' },
  { id: 'galick_gun', name: 'Galick Gun', saga: 'ki', needLvl: 13,
    behavior: 'beam', dmgMul: 2.92, windup: 0.52, speed: 480, radius: 30, pierce: true, life: 1.0,
    color: '#b06ae0', sfx: 'rinnegan', banner: 'GALICK GUN!', kb: 520,
    hint: 'Lv 13', tooltip: 'Paarse ki-beam — iets sneller windup.',
    bonus: 'Purple beam' },
  { id: 'destructo_disc', name: 'Destructo Disc', saga: 'ki', needLvl: 16,
    behavior: 'disc', dmgMul: 2.78, windup: 0.5, speed: 560, radius: 18, pierce: true, life: 1.25,
    color: '#ffe259', sfx: 'rasengan', banner: 'DISC!', kb: 380,
    hint: 'Lv 16', tooltip: 'Dunne snijschijf — snel en pierce.',
    bonus: 'Pierce disc' },
  { id: 'instant_dash', name: 'Instant Move', saga: 'ki', needLvl: 11,
    behavior: 'dash', dmgMul: 2.48, windup: 0.36, speed: 700, radius: 20, pierce: false, life: 0.28,
    dashVx: 440, color: '#7cf5ff', sfx: 'chidori', banner: 'TELEPORT STRIKE!', kb: 420,
    hint: 'Lv 11', tooltip: 'Ultra-korte windup dash — surprise opener.',
    bonus: 'Fast dash' },
  { id: 'final_flash', name: 'Final Flash', saga: 'ki', needLvl: 28,
    behavior: 'beam', dmgMul: 3.35, windup: 0.68, speed: 580, radius: 38, pierce: true, life: 1.3,
    color: '#ffe080', sfx: 'rasengan', banner: 'FINAL FLASH!', kb: 600,
    hint: 'Lv 28', tooltip: 'Massieve gele beam — lang windup, extreme schade.',
    bonus: 'Mega beam' },
  { id: 'spirit_bomb', name: 'Spirit Bomb', saga: 'ki', needLvl: 32,
    behavior: 'meteor', dmgMul: 3.4, windup: 0.72, speed: 180, radius: 40, pierce: true, life: 1.6,
    pull: true, color: '#a8ecff', sfx: 'rinnegan', banner: 'SPIRIT BOMB!', kb: 480,
    hint: 'Lv 32', tooltip: 'Gigantische ki-orb — langzaam, alles trekt mee.',
    bonus: 'Ultimate orb' },

  { id: 'getsuga', name: 'Getsuga', saga: 'tide', needLvl: 9,
    behavior: 'beam', dmgMul: 2.75, windup: 0.46, speed: 500, radius: 26, pierce: true, life: 0.95,
    color: '#6fd7ff', sfx: 'rasengan', banner: 'GETSUGA!', kb: 500,
    hint: 'Lv 9', tooltip: 'Cyan maanslag-golf — snelle horizontale slash.',
    bonus: 'Moon slash' },
  { id: 'cero', name: 'Cero', saga: 'tide', needLvl: 15,
    behavior: 'beam', dmgMul: 2.88, windup: 0.54, speed: 510, radius: 32, pierce: true, life: 1.05,
    color: '#ff4040', sfx: 'rinnegan', banner: 'CERO!', kb: 560,
    hint: 'Lv 15', tooltip: 'Rode hollow-straal — brede tide beam.',
    bonus: 'Red beam' },
  { id: 'bankai_slash', name: 'Bankai Flash', saga: 'tide', needLvl: 26,
    behavior: 'dash', dmgMul: 3.1, windup: 0.5, speed: 640, radius: 28, pierce: true, life: 0.45,
    dashVx: 400, color: '#9db8ff', sfx: 'chidori', banner: 'BANKAI!', kb: 580,
    hint: 'Lv 26', tooltip: 'Blauwe blitz na release — pierce dash.',
    bonus: 'Bankai dash' },

  { id: 'gum_rocket', name: 'Gum-Gum Rocket', saga: 'fighter', needLvl: 5,
    behavior: 'dash', dmgMul: 2.52, windup: 0.4, speed: 580, radius: 24, pierce: false, life: 0.32,
    dashVx: 360, color: '#ffb0b8', sfx: 'chidori', banner: 'GUM ROCKET!', kb: 500,
    hint: 'Lv 5', tooltip: 'Rubber-arm dash — vroeg unlock street-fighter vibe.',
    bonus: 'Stretch dash' },
  { id: 'gear_second', name: 'Gear Second', saga: 'fighter', needLvl: 14,
    behavior: 'orb', dmgMul: 2.95, windup: 0.42, speed: 480, radius: 26, pierce: true, life: 1.0,
    color: '#ff6b6b', sfx: 'rasengan', banner: 'GEAR 2!', kb: 540,
    hint: 'Lv 14', tooltip: 'Steam-orb — snelle pierce special.',
    bonus: 'Speed orb' },

  { id: 'thunder_palm', name: 'Thunder Palm', saga: 'cape', needLvl: 12,
    behavior: 'dash', dmgMul: 2.68, windup: 0.45, speed: 600, radius: 24, pierce: false, life: 0.34,
    dashVx: 370, color: '#ffe259', sfx: 'chidori', banner: 'THUNDER!', kb: 520,
    hint: 'Lv 12', tooltip: 'Bliksem-palm dash — cape saga special.',
    bonus: 'Hero dash' },
  { id: 'serious_punch', name: 'Serious Punch', saga: 'cape', needLvl: 30,
    behavior: 'orb', dmgMul: 3.5, windup: 0.55, speed: 460, radius: 34, pierce: true, life: 0.7,
    color: '#ff4040', sfx: 'rasengan', banner: 'SERIOUS PUNCH!', kb: 720,
    hint: 'Lv 30', tooltip: 'One-hit orb — korte range, extreme schade.',
    bonus: 'Serious hit' },
  { id: 'serious_blast', name: 'Serious Blast', saga: 'cape', needLvl: 42,
    behavior: 'beam', dmgMul: 3.55, windup: 0.65, speed: 550, radius: 36, pierce: true, life: 1.2,
    color: '#ff8080', sfx: 'rasengan', banner: 'SERIOUS BLAST!', kb: 640,
    hint: 'Lv 42', tooltip: 'Serious Series beam — endgame cape ultimate.',
    bonus: 'Serious beam' },

  { id: 'sun_palm', name: 'Sun Palm', saga: 'dawn', needLvl: 10,
    behavior: 'orb', dmgMul: 2.7, windup: 0.44, speed: 400, radius: 30, pierce: false, life: 1.0,
    color: '#ffd75e', sfx: 'rasengan', banner: 'SUN PALM!', kb: 490,
    hint: 'Lv 10', tooltip: 'Gouden palm-orb — dawn saga balanced special.',
    bonus: 'Solar orb' },
  { id: 'moon_pull', name: 'Moon Pull', saga: 'dawn', needLvl: 18,
    behavior: 'pull', dmgMul: 2.62, windup: 0.5, speed: 300, radius: 28, pierce: true, life: 1.0,
    pull: true, color: '#e0a8ff', sfx: 'rinnegan', banner: 'MOON PULL!', kb: 440,
    hint: 'Lv 18', tooltip: 'Maankracht-orb met pull — controle-special.',
    bonus: 'Lunar pull' },
];

const skillById = id => SKILLS.find(s => s.id === id) || SKILLS[0];

function skillExists(id) {
  return SKILLS.some(s => s.id === id);
}

function skillBehaviorLabel(sk) {
  const map = { orb: 'Orb', dash: 'Dash', pull: 'Pull', beam: 'Beam', disc: 'Disc', meteor: 'Meteor' };
  return map[sk && sk.behavior] || 'Special';
}

function skillSkillGated(sk) {
  return !!(sk.needLvl && sk.needLvl > adventureWeaponCap());
}

function skillUnlocked(sk) {
  if (!sk) return false;
  if (sk.id === 'rasengan') return true;
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
  if (!f) return skillById('rasengan');
  if (f.isRobot) return skillById('chidori');
  if (f.playerSlot === 2 || (f.playerSlot && f.playerSlot !== 1)) {
    const vs = f.vsSpecial || 'rasengan';
    return skillById(vs) || skillById('rasengan');
  }
  if (f.isPlayer && !f.playerSlot) {
    // Prefer explicit skill pick; fall back to active SUPER jutsu (Rasengan/Chidori/Rinnegan).
    const fromSkill = save.skill ? skillById(save.skill) : null;
    if (fromSkill && skillUnlocked(fromSkill)) return fromSkill;
    const jutsuId = typeof activeJutsuId === 'function' ? activeJutsuId() : 'rasengan';
    const fromJutsu = skillById(jutsuId);
    return (fromJutsu && skillUnlocked(fromJutsu)) ? fromJutsu : skillById('rasengan');
  }
  if (f.vsSpecial) return skillById(f.vsSpecial) || skillById('rasengan');
  return skillById('rasengan');
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
  if (!sk) return 'rasengan';
  return sk.id || sk.sfx || 'rasengan';
}

function skillCombatLine(sk) {
  return sk.bonus || sk.hint || '';
}

const SKILL_BEHAVIORS = ['orb', 'dash', 'beam', 'disc', 'pull', 'meteor'];
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
