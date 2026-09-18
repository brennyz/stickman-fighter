/* ============================== BUILDINGS ============================== */
/** Island factories — data + save + unlock/upgrade + timed resources.
 *  Locked catalog (Brendon). Bind names in docs/BUILDINGS.md.
 *  Pixels / full UI / combat apply / Versus: other agents. */
const BUILDINGS_SCHEMA = 1;
const BUILDING_MAX_LEVEL = 10;
const BUILDING_OFFLINE_HOURS = 8;
const BUILDING_MS_PER_HOUR = 3600000;
const BUILDING_WALLET_CAP = 99999;
const BUILDING_STORED_CAP_ABS = 9999;

const buildingResourceIds = ['spark', 'glue', 'chip', 'steam', 'echo'];
const BUILDING_RESOURCE_IDS = buildingResourceIds;

const BUILDING_ID_ALIASES = {
  bamboo_boesa_boiler: 'bamboo_boesa',
  'bamboo-boesa-boiler': 'bamboo_boesa',
  'bamboo-boesa': 'bamboo_boesa',
  echo_whistle_mill: 'echo_whistle',
  'echo-whistle-mill': 'echo_whistle',
  'echo-whistle': 'echo_whistle',
  mill: 'echo_whistle',
  forge: 'stick_lighter',
};
const BUILDING_RES_ALIASES = {
  ember_sticks: 'spark',
  embers: 'spark',
  glue_pots: 'glue',
  wood_chips: 'chip',
  chips: 'chip',
  boesa_steam: 'steam',
  echo_notes: 'echo',
  echoes: 'echo',
};

function buildingRateCap(startRate) {
  const perHour = [];
  const cap = [];
  let r = startRate;
  for (let i = 0; i < BUILDING_MAX_LEVEL; i++) {
    const rate = Math.max(1, Math.round(r));
    perHour.push(rate);
    cap.push(rate * BUILDING_OFFLINE_HOURS);
    r *= 1.22;
  }
  return { perHour, cap };
}

function buildingCostTrack(buildPc, priorRes, priorN, ownRes, upPc0, upRes0) {
  const buildResources = {};
  if (priorRes && priorN) buildResources[priorRes] = priorN;
  const upgradeCosts = [];
  for (let i = 0; i < BUILDING_MAX_LEVEL - 1; i++) {
    const resources = {};
    const resN = Math.max(1, Math.round(upRes0 * Math.pow(1.38, i)));
    resources[ownRes] = resN;
    upgradeCosts.push({
      petCoins: Math.max(1, Math.round(upPc0 * Math.pow(1.32, i))),
      resources,
    });
  }
  return { buildCost: { petCoins: buildPc, resources: buildResources }, upgradeCosts };
}

/** Canonical five. List order = island 1..5. Do not add sawmill/forge/neonlab/shrine/reactor. */
const BUILDINGS = [
  {
    id: 'stick_lighter',
    name: 'Stick-Lighter Factory',
    nameNl: 'Stok-Aansteker Fabriek',
    short: 'Lighter',
    worldUnlock: 1,
    maxLevel: BUILDING_MAX_LEVEL,
    accent: '#ff9a4d',
    theme: 'ember',
    resourceId: 'spark',
    blurb: 'A lopsided woodshed that rubs sticks together until they sulk into sparks.',
    artHint: {
      shape: 'crooked woodshed, spark chimney, two giant matchsticks crossed',
      motif: 'match + grind-stone + ember',
      palette: ['#ff9a4d', '#c97a20', '#5a3a22'],
      iconFile: 'assets/buttons/modes/buildings-stick-lighter.svg',
      iconHint: 'stroke-first match + spark, 24×24, no emoji',
    },
    resource: Object.assign({ id: 'spark', name: 'Spark', nameNl: 'Vonken' }, buildingRateCap(8)),
    powers: [
      { rank: 0, id: 'spark_kindle', kind: 'passive', combatHook: 'onFirstMeleeHit', label: 'Spark Kindle', blurb: 'First melee chip each wave leaves a tiny ember.' },
      { rank: 1, id: 'kindle_trail', kind: 'passive', combatHook: 'onMoveTick', label: 'Kindle Trail', blurb: 'Walking drops brief ember crumbs.' },
      { rank: 2, id: 'ember_pocket', kind: 'passive', combatHook: 'onWeaponHit', label: 'Ember Pocket', blurb: 'Weapon hits can pop a spark chip.' },
      { rank: 3, id: 'flare_step', kind: 'active', combatHook: 'onActiveCast', label: 'Flare Step', blurb: 'Short dash that leaves a burn line.' },
      { rank: 4, id: 'matchstick_storm', kind: 'active', combatHook: 'onActiveCast', label: 'Matchstick Storm', blurb: 'Shower of lit sticks — short fire cone.' },
    ],
  },
  {
    id: 'woodchip_glue',
    name: 'Woodchip-Glue Factory',
    nameNl: 'Houtsnipper-Lijm Fabriek',
    short: 'Glue',
    worldUnlock: 2,
    maxLevel: BUILDING_MAX_LEVEL,
    accent: '#c9a66b',
    theme: 'glue',
    resourceId: 'glue',
    blurb: 'Boils yesterday’s sawdust into a paste that sticks harder than a combo. Do not lick.',
    artHint: {
      shape: 'vat-works with dripping paddles and a sticky roof',
      motif: 'glue pot + chip swirl + clamp',
      palette: ['#c9a66b', '#8a6a3a', '#e8d5a3'],
      iconFile: 'assets/buttons/modes/buildings-woodchip-glue.svg',
      iconHint: 'stroke-first pot + drip, 24×24, no emoji',
    },
    resource: Object.assign({ id: 'glue', name: 'Glue', nameNl: 'Lijm' }, buildingRateCap(6)),
    powers: [
      { rank: 0, id: 'sticky_soles', kind: 'passive', combatHook: 'onKnockback', label: 'Sticky Soles', blurb: 'Take less knockback — boots remember the floor.' },
      { rank: 1, id: 'tacky_block', kind: 'passive', combatHook: 'onBlock', label: 'Tacky Block', blurb: 'Block holds a beat longer.' },
      { rank: 2, id: 'glue_trap', kind: 'active', combatHook: 'onActiveCast', label: 'Glue Trap', blurb: 'Puddle that slows the first monster through it.' },
      { rank: 3, id: 'paste_armor', kind: 'passive', combatHook: 'onWaveStart', label: 'Paste Armor', blurb: 'Thin glue shield at wave start.' },
      { rank: 4, id: 'chip_golem', kind: 'passive', combatHook: 'onWaveStart', label: 'Chip Golem', blurb: 'Start each wave with chip-armor.' },
    ],
  },
  {
    id: 'chipping_wood',
    name: 'Chipping-Wood Factory',
    nameNl: 'Versnipper-Hout Fabriek',
    short: 'Chipper',
    worldUnlock: 3,
    maxLevel: BUILDING_MAX_LEVEL,
    accent: '#7cfc8a',
    theme: 'chips',
    resourceId: 'chip',
    blurb: 'A cheerful chipper that whispers TIMBER and coughs useful chips.',
    artHint: {
      shape: 'open hopper + spinning teeth, wood-dust halo',
      motif: 'log in / chips out / timber flag',
      palette: ['#7cfc8a', '#4a8a3a', '#c9b691'],
      iconFile: 'assets/buttons/modes/buildings-chipping-wood.svg',
      iconHint: 'stroke-first hopper + chip burst, 24×24, no emoji',
    },
    resource: Object.assign({ id: 'chip', name: 'Chip', nameNl: 'Snipper' }, buildingRateCap(10)),
    powers: [
      { rank: 0, id: 'splinter_edge', kind: 'passive', combatHook: 'onWeaponHit', label: 'Splinter Edge', blurb: 'Weapon hits fling a bonus splinter.' },
      { rank: 1, id: 'chip_spray', kind: 'passive', combatHook: 'onComboStep', label: 'Chip Spray', blurb: 'Combos cough extra chips.' },
      { rank: 2, id: 'sawdust_cloud', kind: 'active', combatHook: 'onActiveCast', label: 'Sawdust Cloud', blurb: 'Brief miss-haze in front of you.' },
      { rank: 3, id: 'hopper_guard', kind: 'passive', combatHook: 'onHurt', label: 'Hopper Guard', blurb: 'First hit each wave is a bit softer.' },
      { rank: 4, id: 'chipper_fury', kind: 'passive', combatHook: 'onComboStep', label: 'Chipper Fury', blurb: 'High combos spray splinters.' },
    ],
  },
  {
    id: 'bamboo_boesa',
    name: 'Bamboo-Boesa Boiler',
    nameNl: 'Bamboe-Boesa Ketel',
    short: 'Boiler',
    worldUnlock: 4,
    maxLevel: BUILDING_MAX_LEVEL,
    accent: '#ff7a4d',
    theme: 'fire-bamboo',
    resourceId: 'steam',
    blurb: 'Fire-island kettle that steams hollow “boesa” bamboo until the stalks whistle.',
    artHint: {
      shape: 'fat boiler, bamboo bundle, steam-whistle stack, ember belly',
      motif: 'bamboo + gauge + flame ring',
      palette: ['#ff7a4d', '#c97a20', '#5ad06a'],
      iconFile: 'assets/buttons/modes/buildings-bamboo-boesa.svg',
      iconHint: 'stroke-first kettle + bamboo, 24×24, no emoji',
    },
    resource: Object.assign({ id: 'steam', name: 'Steam', nameNl: 'Stoom' }, buildingRateCap(7)),
    powers: [
      { rank: 0, id: 'boiler_hiss', kind: 'passive', combatHook: 'onAuraTick', label: 'Boiler Hiss', blurb: 'Close-range heat aura chips crowders.' },
      { rank: 1, id: 'bamboo_vent', kind: 'passive', combatHook: 'onDash', label: 'Bamboo Vent', blurb: 'Dash puffs a steam shove.' },
      { rank: 2, id: 'bamboo_burst', kind: 'active', combatHook: 'onActiveCast', label: 'Bamboo Burst', blurb: 'Steam knock — short cone, heavy shove.' },
      { rank: 3, id: 'pressure_cook', kind: 'passive', combatHook: 'onComboStep', label: 'Pressure Cook', blurb: 'Combos build a heat pip.' },
      { rank: 4, id: 'boesa_overheat', kind: 'passive', combatHook: 'onLowHp', label: 'Boesa Overheat', blurb: 'Low HP: extra fire chip.' },
    ],
  },
  {
    id: 'echo_whistle',
    name: 'Echo-Whistle Mill',
    nameNl: 'Echo-Fluitmolen',
    short: 'Whistle',
    worldUnlock: 5,
    maxLevel: BUILDING_MAX_LEVEL,
    accent: '#7cf5ff',
    theme: 'echo',
    resourceId: 'echo',
    blurb: 'A mill wheel that turns air into taunts. The building heckles you back.',
    artHint: {
      shape: 'water-wheel mill with horn-bells and ripple rings',
      motif: 'whistle + echo arcs + spinning wheel',
      palette: ['#7cf5ff', '#c792ff', '#9db1e3'],
      iconFile: 'assets/buttons/modes/buildings-echo-whistle.svg',
      iconHint: 'stroke-first whistle + echo arcs, 24×24, no emoji',
    },
    resource: Object.assign({ id: 'echo', name: 'Echo', nameNl: 'Echo' }, buildingRateCap(5)),
    powers: [
      { rank: 0, id: 'taunt_toot', kind: 'taunt', combatHook: 'onActiveCast', label: 'Taunt Toot', blurb: 'Short whistle — nearest foe faces you.' },
      { rank: 1, id: 'mill_heckle', kind: 'passive', combatHook: 'onHurt', label: 'Mill Heckle', blurb: 'Taking a hit toots a tiny taunt.' },
      { rank: 2, id: 'echo_ridge', kind: 'passive', combatHook: 'onKill', label: 'Echo Ridge', blurb: 'Kills leave a sound-stun ripple.' },
      { rank: 3, id: 'ridge_reply', kind: 'passive', combatHook: 'onBlock', label: 'Ridge Reply', blurb: 'Perfect block echoes a stun pip.' },
      { rank: 4, id: 'whistle_chorus', kind: 'taunt', combatHook: 'onActiveCast', label: 'Whistle Chorus', blurb: 'Area taunt + brief stun.' },
    ],
  },
];

BUILDINGS[0] = Object.assign(BUILDINGS[0], buildingCostTrack(20, null, 0, 'spark', 40, 16));
BUILDINGS[1] = Object.assign(BUILDINGS[1], buildingCostTrack(35, 'spark', 8, 'glue', 55, 14));
BUILDINGS[2] = Object.assign(BUILDINGS[2], buildingCostTrack(50, 'glue', 6, 'chip', 70, 20));
BUILDINGS[3] = Object.assign(BUILDINGS[3], buildingCostTrack(65, 'chip', 10, 'steam', 95, 16));
BUILDINGS[4] = Object.assign(BUILDINGS[4], buildingCostTrack(80, 'steam', 12, 'echo', 120, 12));

const BUILDING_IDS = BUILDINGS.map((b) => b.id);
const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));
const BUILDING_POWERS = BUILDINGS.flatMap((b) =>
  (b.powers || []).map((p) => Object.assign({ buildingId: b.id, atLevel: p.rank * 2 + 1 }, p))
);

function emptyBuildingSite() {
  return { level: 0, lastTickAt: 0, stored: 0 };
}

function emptyBuildingWallet() {
  const w = {};
  for (const id of buildingResourceIds) w[id] = 0;
  return w;
}

function emptyBuildingsRoot() {
  return { schema: BUILDINGS_SCHEMA, factories: {}, wallet: {} };
}

function buildingNowMs() {
  try {
    if (typeof globalThis !== 'undefined' && typeof globalThis.__sfBuildingNow === 'number') {
      return globalThis.__sfBuildingNow;
    }
  } catch (_) {}
  return Date.now();
}

function buildingSaveRef(st) {
  return st && typeof st === 'object' ? st : (typeof save !== 'undefined' ? save : null);
}

function buildingCanonId(id) {
  if (!id || typeof id !== 'string') return '';
  if (BUILDING_ID_ALIASES[id]) return BUILDING_ID_ALIASES[id];
  const snake = id.replace(/-/g, '_').toLowerCase();
  if (BUILDING_ID_ALIASES[snake]) return BUILDING_ID_ALIASES[snake];
  if (BUILDING_ID_ALIASES[id.toLowerCase()]) return BUILDING_ID_ALIASES[id.toLowerCase()];
  if (typeof BUILDING_IDS !== 'undefined' && BUILDING_IDS.includes(snake)) return snake;
  if (typeof BUILDING_IDS !== 'undefined' && BUILDING_IDS.includes(id)) return id;
  return snake;
}

function buildingCanonRes(id) {
  if (!id || typeof id !== 'string') return '';
  return BUILDING_RES_ALIASES[id] || id;
}

function ensureBuildingSave(st) {
  const s = buildingSaveRef(st);
  if (!s) return null;
  if (!s.buildings || typeof s.buildings !== 'object' || Array.isArray(s.buildings)) {
    s.buildings = emptyBuildingsRoot();
  }
  if (!s.buildings.factories || typeof s.buildings.factories !== 'object' || Array.isArray(s.buildings.factories)) {
    s.buildings.factories = {};
  }
  if (!s.buildings.wallet || typeof s.buildings.wallet !== 'object' || Array.isArray(s.buildings.wallet)) {
    s.buildings.wallet = {};
  }
  s.buildings.schema = BUILDINGS_SCHEMA;
  return s;
}

function buildingSite(id, st) {
  const canon = buildingCanonId(id);
  if (!BUILDING_BY_ID[canon]) return null;
  const s = ensureBuildingSave(st);
  if (!s) return emptyBuildingSite();
  const raw = s.buildings.factories[canon];
  if (!raw || typeof raw !== 'object') {
    s.buildings.factories[canon] = emptyBuildingSite();
    return s.buildings.factories[canon];
  }
  return raw;
}

function buildingLevel(id, st) {
  const def = BUILDING_BY_ID[buildingCanonId(id)];
  if (!def) return 0;
  const site = buildingSite(def.id, st);
  return clamp(Math.floor(Number(site && site.level) || 0), 0, def.maxLevel);
}

function buildingCampaignUnlock(st) {
  const s = buildingSaveRef(st);
  if (s && typeof save !== 'undefined' && s === save && typeof advUnlockedLevel === 'function') {
    try { return clamp(Math.floor(Number(advUnlockedLevel('normal')) || 1), 1, 70); } catch (_) {}
  }
  return clamp(Math.floor(Number((s || {}).unlocked) || 1), 1, 70);
}

function buildingUnlocked(id, st) {
  const def = BUILDING_BY_ID[buildingCanonId(id)];
  if (!def) return false;
  if (def.worldUnlock <= 1) return true;
  const unlocked = buildingCampaignUnlock(st);
  const per = (typeof LEVELS_PER_ISLAND === 'number') ? LEVELS_PER_ISLAND : 10;
  return unlocked > (def.worldUnlock - 1) * per;
}

function buildingBuilt(id, st) {
  return buildingLevel(id, st) >= 1;
}

function buildingPowerRank(idOrLevel, st) {
  const lv = (typeof idOrLevel === 'number')
    ? clamp(Math.floor(idOrLevel) || 0, 0, BUILDING_MAX_LEVEL)
    : buildingLevel(idOrLevel, st);
  if (lv < 1) return -1;
  return Math.floor((lv - 1) / 2);
}

function buildingWallet(resId, st) {
  const s = ensureBuildingSave(st);
  if (!s) return resId ? 0 : emptyBuildingWallet();
  if (resId == null || resId === '') {
    const all = emptyBuildingWallet();
    for (const id of buildingResourceIds) {
      all[id] = clamp(Math.floor(Number(s.buildings.wallet[id]) || 0), 0, BUILDING_WALLET_CAP);
    }
    return all;
  }
  const canon = buildingCanonRes(resId);
  if (!buildingResourceIds.includes(canon)) return 0;
  return clamp(Math.floor(Number(s.buildings.wallet[canon]) || 0), 0, BUILDING_WALLET_CAP);
}

function buildingOutputAtLevel(def, level) {
  if (!def || !def.resource || level < 1) return { perHour: 0, cap: 0 };
  const i = clamp(level, 1, def.maxLevel) - 1;
  return {
    perHour: def.resource.perHour[i] || 0,
    cap: def.resource.cap[i] || 0,
  };
}

function buildingCostClone(cost) {
  const out = { petCoins: Math.max(0, Math.floor(Number(cost && cost.petCoins) || 0)), resources: {} };
  const res = (cost && cost.resources && typeof cost.resources === 'object') ? cost.resources : {};
  for (const [k, v] of Object.entries(res)) {
    const id = buildingCanonRes(k);
    if (!buildingResourceIds.includes(id)) continue;
    const n = Math.max(0, Math.floor(Number(v) || 0));
    if (n) out.resources[id] = n;
  }
  return out;
}

function buildingNextCost(id, st) {
  const def = BUILDING_BY_ID[buildingCanonId(id)];
  if (!def) return null;
  const lv = buildingLevel(def.id, st);
  if (lv < 1) return buildingCostClone(def.buildCost);
  if (lv >= def.maxLevel) return null;
  return buildingCostClone(def.upgradeCosts[lv - 1] || def.upgradeCosts[def.upgradeCosts.length - 1]);
}

function buildingCanPay(cost, st) {
  if (!cost) return false;
  const s = buildingSaveRef(st);
  const coins = Math.max(0, Math.floor(Number((s || {}).petCoins) || 0));
  if (coins < (cost.petCoins || 0)) return false;
  for (const [res, n] of Object.entries(cost.resources || {})) {
    if (buildingWallet(res, s) < n) return false;
  }
  return true;
}

function buildingPay(cost, st) {
  const s = ensureBuildingSave(st);
  if (!s || !buildingCanPay(cost, s)) return false;
  s.petCoins = clamp(Math.floor(Number(s.petCoins) || 0) - (cost.petCoins || 0), 0, 999999);
  for (const [res, n] of Object.entries(cost.resources || {})) {
    const id = buildingCanonRes(res);
    s.buildings.wallet[id] = clamp(buildingWallet(id, s) - n, 0, BUILDING_WALLET_CAP);
  }
  return true;
}

function buildingCanBuild(id, st) {
  const def = BUILDING_BY_ID[buildingCanonId(id)];
  if (!def) return false;
  if (buildingBuilt(def.id, st)) return false;
  if (!buildingUnlocked(def.id, st)) return false;
  return buildingCanPay(buildingCostClone(def.buildCost), st);
}

function buildingCanUpgrade(id, st) {
  const def = BUILDING_BY_ID[buildingCanonId(id)];
  if (!def) return false;
  const lv = buildingLevel(def.id, st);
  if (lv < 1 || lv >= def.maxLevel) return false;
  if (!buildingUnlocked(def.id, st)) return false;
  const cost = buildingNextCost(def.id, st);
  return !!(cost && buildingCanPay(cost, st));
}

function buildingStoredFloor(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.floor(v + 1e-9);
}

function buildingQuantizeStored(n, cap) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return 0;
  const hi = cap > 0 ? cap : BUILDING_STORED_CAP_ABS;
  return clamp(Math.round(v * 1000) / 1000, 0, hi);
}

function buildingPendingAmount(id, st) {
  const def = BUILDING_BY_ID[buildingCanonId(id)];
  if (!def || !buildingBuilt(def.id, st)) return 0;
  const s = ensureBuildingSave(st);
  tickOneBuilding(def.id, buildingNowMs(), s);
  const site = buildingSite(def.id, s);
  const cap = buildingOutputAtLevel(def, buildingLevel(def.id, s)).cap;
  return clamp(buildingStoredFloor(site && site.stored), 0, cap || BUILDING_STORED_CAP_ABS);
}

function buildingCanCollect(id, st) {
  return buildingBuilt(id, st) && buildingPendingAmount(id, st) > 0;
}

function buildingBuild(id, st) {
  const def = BUILDING_BY_ID[buildingCanonId(id)];
  if (!def) return { ok: false, reason: 'unknown' };
  if (buildingBuilt(def.id, st)) return { ok: false, reason: 'built' };
  if (!buildingUnlocked(def.id, st)) return { ok: false, reason: 'locked' };
  const cost = buildingCostClone(def.buildCost);
  if (!buildingCanPay(cost, st)) return { ok: false, reason: 'broke' };
  const s = ensureBuildingSave(st);
  if (!buildingPay(cost, s)) return { ok: false, reason: 'broke' };
  const site = buildingSite(def.id, s);
  site.level = 1;
  site.stored = 0;
  site.lastTickAt = buildingNowMs();
  if (typeof save !== 'undefined' && s === save) persistOrToast('building/build/' + def.id);
  return { ok: true, level: 1, buildingId: def.id };
}

function buildingUpgrade(id, st) {
  const def = BUILDING_BY_ID[buildingCanonId(id)];
  if (!def) return { ok: false, reason: 'unknown' };
  const lv = buildingLevel(def.id, st);
  if (lv < 1) return { ok: false, reason: 'unbuilt' };
  if (lv >= def.maxLevel) return { ok: false, reason: 'max' };
  if (!buildingUnlocked(def.id, st)) return { ok: false, reason: 'locked' };
  const cost = buildingNextCost(def.id, st);
  if (!cost || !buildingCanPay(cost, st)) return { ok: false, reason: 'broke' };
  const s = ensureBuildingSave(st);
  if (!buildingPay(cost, s)) return { ok: false, reason: 'broke' };
  const site = buildingSite(def.id, s);
  site.level = lv + 1;
  const cap = buildingOutputAtLevel(def, site.level).cap;
  site.stored = clamp(Math.floor(Number(site.stored) || 0), 0, cap);
  if (typeof save !== 'undefined' && s === save) persistOrToast('building/up/' + def.id);
  return { ok: true, level: site.level, buildingId: def.id };
}

function tickOneBuilding(id, now, st) {
  const def = BUILDING_BY_ID[buildingCanonId(id)];
  if (!def) return false;
  const lv = buildingLevel(def.id, st);
  if (lv < 1) return false;
  const site = buildingSite(def.id, st);
  const out = buildingOutputAtLevel(def, lv);
  if (!out.perHour || !out.cap) return false;
  let last = Math.floor(Number(site.lastTickAt) || 0);
  if (last <= 0 || last > now) {
    site.lastTickAt = now;
    return true;
  }
  const maxMs = BUILDING_OFFLINE_HOURS * BUILDING_MS_PER_HOUR;
  const elapsed = Math.min(now - last, maxMs);
  if (elapsed <= 0) return false;
  const stored = clamp(Number(site.stored) || 0, 0, out.cap);
  if (stored >= out.cap) {
    site.lastTickAt = now;
    site.stored = out.cap;
    return true;
  }
  const units = (elapsed / BUILDING_MS_PER_HOUR) * out.perHour;
  if (!(units > 0)) return false;
  const next = clamp(stored + units, 0, out.cap);
  if (next <= stored) return false;
  site.stored = next;
  site.lastTickAt = now;
  if (site.stored >= out.cap) {
    site.stored = out.cap;
    site.lastTickAt = now;
  }
  return true;
}

function buildingTickAll(st, nowMs) {
  const s = ensureBuildingSave(st);
  if (!s) return false;
  const now = typeof nowMs === 'number' ? nowMs : buildingNowMs();
  let changed = false;
  for (const id of BUILDING_IDS) {
    if (tickOneBuilding(id, now, s)) changed = true;
  }
  return changed;
}

function buildingCollect(id, st) {
  const def = BUILDING_BY_ID[buildingCanonId(id)];
  if (!def || !buildingBuilt(def.id, st)) return { ok: false, reason: 'unbuilt', amount: 0 };
  const s = ensureBuildingSave(st);
  const site = buildingSite(def.id, s);
  const res = def.resourceId;
  if (site._collectLock) return { ok: true, amount: 0, resourceId: res, reason: 'busy' };
  site._collectLock = true;
  try {
    tickOneBuilding(def.id, buildingNowMs(), s);
    const amount = clamp(buildingStoredFloor(site.stored), 0, BUILDING_STORED_CAP_ABS);
    if (amount <= 0) return { ok: true, amount: 0, resourceId: res };
    site.stored = 0;
    site.lastTickAt = buildingNowMs();
    s.buildings.wallet[res] = clamp(buildingWallet(res, s) + amount, 0, BUILDING_WALLET_CAP);
    if (typeof save !== 'undefined' && s === save) persistOrToast('building/collect/' + def.id);
    return { ok: true, amount, resourceId: res, buildingId: def.id };
  } finally {
    site._collectLock = false;
  }
}

function buildingLabel(id, field) {
  const def = BUILDING_BY_ID[buildingCanonId(id)];
  if (!def) return id || '?';
  const f = field || 'name';
  const key = 'buildings.' + def.id + '.' + f;
  const fallback = def[f] || (f === 'nameShort' ? def.short : def.name) || def.name;
  if (typeof tOr === 'function') return tOr(key, fallback);
  return fallback;
}

function buildingResourceLabel(resId) {
  const canon = buildingCanonRes(resId);
  const def = BUILDINGS.find((b) => b.resourceId === canon);
  const fallback = (def && def.resource && def.resource.name) || canon || '?';
  if (typeof tOr === 'function') return tOr('buildings.res.' + canon, fallback);
  return fallback;
}

function buildingTxt(key, fallback, params) {
  if (typeof tOr === 'function') return tOr(key, fallback, params);
  if (!fallback) return key;
  if (!params) return fallback;
  let out = String(fallback);
  for (const [k, v] of Object.entries(params)) out = out.split('{' + k + '}').join(String(v));
  return out;
}

function buildingPowerField(power, field, fallback) {
  if (!power) return '';
  const id = power.id;
  if (typeof t === 'function') {
    const nestedKey = 'buildings.power.' + id + '.' + field;
    const nested = t(nestedKey);
    if (nested && nested !== nestedKey) return nested;
    if (field === 'label') {
      const flat = t('buildings.power.' + id);
      if (flat && flat !== 'buildings.power.' + id) return flat;
    }
  }
  return fallback || '';
}

function buildingPowerLabel(power) {
  if (!power) return '';
  return buildingPowerField(power, 'label', power.label || power.id);
}

function buildingPowerBlurb(power) {
  if (!power) return '';
  return buildingPowerField(power, 'blurb', '');
}

function buildingCostLabel(cost) {
  if (!cost) return '';
  const bits = [];
  const pc = Math.max(0, Math.floor(Number(cost.petCoins) || 0));
  if (pc) bits.push(buildingTxt('buildings.costPc', '{n} PC', { n: pc }));
  const res = (cost.resources && typeof cost.resources === 'object') ? cost.resources : {};
  for (const [k, v] of Object.entries(res)) {
    const n = Math.max(0, Math.floor(Number(v) || 0));
    if (!n) continue;
    bits.push(buildingTxt('buildings.costRes', '{n} {res}', { n, res: buildingResourceLabel(k) }));
  }
  return bits.join(' · ');
}

function buildingArtSrc(id) {
  const def = BUILDING_BY_ID[buildingCanonId(id)];
  const canon = def ? def.id : buildingCanonId(id);
  const stroke = (def && def.artHint && def.artHint.iconFile)
    ? def.artHint.iconFile
    : ('assets/buttons/modes/buildings-' + String(canon || '').replace(/_/g, '-') + '.svg');
  return {
    pixel: 'assets/buildings/' + canon + '.svg',
    stroke,
    hub: 'assets/buttons/hub/buildings.svg',
  };
}

function buildingIslandName(world) {
  const n = Math.max(1, Math.floor(Number(world) || 1));
  try {
    if (typeof islandLabel === 'function') return islandLabel(n, 'name');
  } catch (_) {}
  return buildingTxt('buildings.islandFallback', 'eiland {n}', { n });
}

function buildingWalletModel(st) {
  const s = ensureBuildingSave(st);
  if (s) buildingTickAll(s);
  const wallet = buildingWallet(null, s);
  const pc = Math.max(0, Math.floor(Number((buildingSaveRef(s) || {}).petCoins) || 0));
  const resources = buildingResourceIds.map((id) => {
    const def = BUILDINGS.find((b) => b.resourceId === id);
    const built = !!(def && buildingBuilt(def.id, s));
    const lv = def ? buildingLevel(def.id, s) : 0;
    const out = built ? buildingOutputAtLevel(def, lv) : { perHour: 0, cap: 0 };
    return {
      id,
      name: buildingResourceLabel(id),
      amount: wallet[id] || 0,
      rate: out.perHour || 0,
      factoryId: def ? def.id : '',
      built,
    };
  });
  return { petCoins: pc, resources };
}

function buildingTooltipModel(id, st) {
  const def = BUILDING_BY_ID[buildingCanonId(id)];
  if (!def) return null;
  const s = ensureBuildingSave(st);
  buildingTickAll(s);
  const lv = buildingLevel(def.id, s);
  const rank = buildingPowerRank(def.id, s);
  const out = buildingOutputAtLevel(def, lv);
  const powersOn = (def.powers || []).filter((p) => rank >= p.rank).map((p) => p.id);
  const nextPower = (def.powers || []).find((p) => p.rank > rank) || null;
  return {
    id: def.id,
    name: buildingLabel(def.id, 'name'),
    nameShort: buildingLabel(def.id, 'nameShort'),
    blurb: buildingLabel(def.id, 'blurb'),
    short: def.short,
    worldUnlock: def.worldUnlock,
    theme: def.theme,
    accent: def.accent,
    artHint: def.artHint,
    unlocked: buildingUnlocked(def.id, s),
    built: lv >= 1,
    level: lv,
    maxLevel: def.maxLevel,
    powerRank: rank,
    canBuild: buildingCanBuild(def.id, s),
    canUpgrade: buildingCanUpgrade(def.id, s),
    canCollect: buildingCanCollect(def.id, s),
    nextCost: buildingNextCost(def.id, s),
    resourceId: def.resourceId,
    resourceName: buildingResourceLabel(def.resourceId),
    outputRate: out.perHour,
    storageCap: out.cap,
    pending: buildingPendingAmount(def.id, s),
    wallet: buildingWallet(def.resourceId, s),
    powers: def.powers || [],
    powersUnlocked: powersOn,
    nextPower,
    artSrc: buildingArtSrc(def.id),
    nextCostLabel: buildingCostLabel(buildingNextCost(def.id, s)),
  };
}

/** UI copy model: produce line + power line, no hardcoded factory text in the screen. */
function buildingDescModel(id, st) {
  const tip = buildingTooltipModel(id, st);
  if (!tip) return null;
  const def = BUILDING_BY_ID[tip.id];
  const islandName = buildingIslandName(tip.worldUnlock);
  const lv0 = def && def.resource && def.resource.perHour ? (def.resource.perHour[0] || 0) : 0;
  const unlockLine = tip.unlocked
    ? ''
    : buildingTxt('buildings.lockedWorldNamed', '{name} (eiland {n})', {
      name: islandName, n: tip.worldUnlock,
    });
  let produceLine;
  if (!tip.unlocked) {
    produceLine = buildingTxt('buildings.desc.produceLocked', '{res} na eiland', {
      res: tip.resourceName,
    });
  } else if (!tip.built) {
    produceLine = buildingTxt('buildings.desc.produceUnbuilt', 'Bouw: {res} {n}/u', {
      res: tip.resourceName, n: lv0,
    });
  } else {
    produceLine = buildingTxt('buildings.desc.produce', '{n}/u · hopper {cap}', {
      res: tip.resourceName, n: tip.outputRate, cap: tip.storageCap,
    });
  }
  const currentPower = (def.powers || []).filter((p) => tip.powerRank >= p.rank).pop() || null;
  const powerLine = currentPower
    ? buildingTxt('buildings.desc.powerOn', 'R{rank} {label}', {
      rank: tip.powerRank,
      label: buildingPowerLabel(currentPower),
      blurb: buildingPowerBlurb(currentPower),
    })
    : buildingTxt('buildings.desc.powerNone', 'Bouw voor kracht');
  const doesLine = !tip.unlocked
    ? unlockLine
    : !tip.built
      ? buildingTxt('buildings.desc.doesUnbuilt', '{res} · bouw', { res: tip.resourceName })
      : buildingTxt('buildings.desc.does', '{res} {n}/u · {power}', {
        res: tip.resourceName,
        n: tip.outputRate,
        power: currentPower ? buildingPowerLabel(currentPower) : '—',
      });
  let nextLine = '';
  if (tip.built && tip.level < tip.maxLevel) {
    const nextLv = tip.level + 1;
    const nextOut = buildingOutputAtLevel(def, nextLv);
    const nextRank = buildingPowerRank(nextLv);
    const newPower = (def.powers || []).find((p) => p.rank === nextRank && nextRank > tip.powerRank) || null;
    const powerBit = newPower
      ? buildingTxt('buildings.desc.nextPower', ' · {label}', { label: buildingPowerLabel(newPower) })
      : '';
    nextLine = buildingTxt('buildings.desc.nextLv', 'Lv{n} {rate}/u · {cap}{power}', {
      n: nextLv, res: tip.resourceName, rate: nextOut.perHour, cap: nextOut.cap, power: powerBit,
    });
  } else if (tip.built && tip.level >= tip.maxLevel) {
    nextLine = buildingTxt('buildings.upgradeMax', 'Max level');
  } else if (!tip.built && tip.unlocked) {
    const firstOut = buildingOutputAtLevel(def, 1);
    const firstPower = (def.powers || []).find((p) => p.rank === 0) || null;
    const powerBit = firstPower
      ? buildingTxt('buildings.desc.nextPower', ' · {label}', { label: buildingPowerLabel(firstPower) })
      : '';
    nextLine = buildingTxt('buildings.desc.nextLv', 'Lv{n} {rate}/u · {cap}{power}', {
      n: 1, res: tip.resourceName, rate: firstOut.perHour, cap: firstOut.cap, power: powerBit,
    });
  }
  const powersDetail = (def.powers || []).map((p) => ({
    id: p.id,
    rank: p.rank,
    kind: p.kind,
    combatHook: p.combatHook,
    label: buildingPowerLabel(p),
    blurb: buildingPowerBlurb(p),
    unlocked: tip.powerRank >= p.rank,
  }));
  return Object.assign({}, tip, {
    produceLine,
    powerLine,
    doesLine,
    unlockLine,
    nextLine,
    islandName,
    currentPower: currentPower ? currentPower.id : '',
    currentPowerLabel: currentPower ? buildingPowerLabel(currentPower) : '',
    currentPowerBlurb: currentPower ? buildingPowerBlurb(currentPower) : '',
    powersDetail,
  });
}

function countBuildingLevels(st) {
  let n = 0;
  const s = buildingSaveRef(st);
  const bag = (s && s.buildings && s.buildings.factories && typeof s.buildings.factories === 'object')
    ? s.buildings.factories : {};
  for (const id of BUILDING_IDS) {
    n += clamp(Math.floor(Number(bag[id] && bag[id].level) || 0), 0, BUILDING_MAX_LEVEL);
  }
  return n;
}

function migrateLegacyBuildingBag(raw) {
  const factories = {};
  const wallet = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { factories, wallet };
  }
  const facIn = (raw.factories && typeof raw.factories === 'object' && !Array.isArray(raw.factories))
    ? raw.factories : raw;
  for (const [k, v] of Object.entries(facIn)) {
    if (k === 'schema' || k === 'factories' || k === 'wallet') continue;
    const id = buildingCanonId(k);
    if (!BUILDING_BY_ID[id] || !v || typeof v !== 'object') continue;
    const prev = factories[id] || emptyBuildingSite();
    const lv = Math.max(prev.level, Math.floor(Number(v.level) || 0));
    const stored = Math.max(prev.stored, Number.isFinite(Number(v.stored)) ? Math.max(0, Number(v.stored)) : 0);
    const last = Math.max(prev.lastTickAt, Math.floor(Number(v.lastTickAt) || 0));
    factories[id] = { level: lv, stored, lastTickAt: last };
  }
  const walIn = (raw.wallet && typeof raw.wallet === 'object' && !Array.isArray(raw.wallet))
    ? raw.wallet : {};
  for (const [k, v] of Object.entries(walIn)) {
    const id = buildingCanonRes(k);
    if (!buildingResourceIds.includes(id)) continue;
    wallet[id] = Math.max(wallet[id] || 0, Math.floor(Number(v) || 0));
  }
  return { factories, wallet };
}

function sanitizeBuildingSave(s) {
  if (!s || typeof s !== 'object') return s;
  const migrated = migrateLegacyBuildingBag(s.buildings);
  const legacyRes = (s.buildingRes && typeof s.buildingRes === 'object' && !Array.isArray(s.buildingRes))
    ? s.buildingRes : {};
  for (const [k, v] of Object.entries(legacyRes)) {
    const id = buildingCanonRes(k);
    if (!buildingResourceIds.includes(id)) continue;
    migrated.wallet[id] = Math.max(migrated.wallet[id] || 0, Math.floor(Number(v) || 0));
  }
  const factories = {};
  for (const id of BUILDING_IDS) {
    const def = BUILDING_BY_ID[id];
    const entry = migrated.factories[id] || {};
    const lv = clamp(Math.floor(Number(entry.level) || 0), 0, def.maxLevel);
    const cap = lv >= 1 ? (buildingOutputAtLevel(def, lv).cap || BUILDING_STORED_CAP_ABS) : 0;
    const stored = lv >= 1 ? buildingQuantizeStored(entry.stored, cap) : 0;
    let last = Math.floor(Number(entry.lastTickAt) || 0);
    if (last < 0 || last > 4102444800000) last = 0;
    if (lv <= 0 && stored <= 0 && last <= 0) continue;
    factories[id] = { level: lv, lastTickAt: last, stored };
  }
  const wallet = {};
  for (const id of buildingResourceIds) {
    const n = clamp(Math.floor(Number(migrated.wallet[id]) || 0), 0, BUILDING_WALLET_CAP);
    if (n > 0) wallet[id] = n;
  }
  s.buildings = { schema: BUILDINGS_SCHEMA, factories, wallet };
  if ('buildingRes' in s) delete s.buildingRes;
  return s;
}

function buildingHasPower(powerId, st) {
  const p = BUILDING_POWERS.find((x) => x.id === powerId);
  if (!p) return false;
  return buildingPowerRank(p.buildingId, st) >= p.rank;
}

try {
  if (typeof globalThis !== 'undefined') {
    globalThis.BUILDINGS_SCHEMA = BUILDINGS_SCHEMA;
    globalThis.BUILDING_IDS = BUILDING_IDS;
    globalThis.BUILDINGS = BUILDINGS;
    globalThis.BUILDING_BY_ID = BUILDING_BY_ID;
    globalThis.buildingResourceIds = buildingResourceIds;
    globalThis.buildingDescModel = buildingDescModel;
    globalThis.buildingWalletModel = buildingWalletModel;
    globalThis.buildingArtSrc = buildingArtSrc;
    globalThis.buildingCostLabel = buildingCostLabel;
  }
} catch (_) {}
