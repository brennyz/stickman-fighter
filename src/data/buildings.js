/* ============================== BUILDINGS ============================== */
/** Island factories: catalog + save + unlock/upgrade + timed resources.
 *  Combat application is owned by the powers partner — this file only
 *  unlocks powerIds. Pixel art is owned by the art partner (artHint only).
 *  Bind API: docs/BUILDINGS.md · BUILDING_API */
const BUILDING_MAX_LEVEL = 5;
const BUILDING_OFFLINE_HOURS = 8;
const BUILDING_MS_PER_HOUR = 3600000;
const BUILDING_WALLET_CAP = 99999;
const BUILDING_STORED_CAP_ABS = 9999;

const BUILDING_RESOURCE_IDS = [
  'ember_sticks',
  'glue_pots',
  'wood_chips',
  'boesa_steam',
  'echo_notes',
];

/** Canonical five — do not rename. List order = island 1..5 unlock. */
const BUILDING_CATALOG = [
  {
    id: 'stick_lighter',
    name: 'Stick-Lighter Factory',
    nameNl: 'Stok-Aansteker Fabriek',
    short: 'Lighter',
    worldUnlock: 1,
    maxLevel: BUILDING_MAX_LEVEL,
    accent: '#ff9a4d',
    theme: 'ember',
    blurb: 'A lopsided woodshed that rubs sticks together until they sulk into sparks.',
    blurbNl: 'Scheef schuurtje dat stokken tegen elkaar wrijft tot ze vonken geven.',
    artHint: {
      shape: 'crooked woodshed, spark-coughing chimney, two giant matchsticks crossed',
      motif: 'match + grind-stone + ember pile',
      palette: ['#ff9a4d', '#c97a20', '#5a3a22'],
      iconFile: 'assets/buttons/modes/buildings-stick-lighter.svg',
      iconHint: 'stroke-first match + spark, viewBox 0 0 24 24, no emoji',
    },
    resource: {
      id: 'ember_sticks',
      name: 'Ember sticks',
      nameNl: 'Gloei-stokjes',
      perHour: [8, 14, 22, 34, 50],
      cap: [64, 112, 176, 272, 400],
    },
    buildCost: { petCoins: 20, resources: {} },
    upgradeCosts: [
      { petCoins: 40, resources: { ember_sticks: 16 } },
      { petCoins: 75, resources: { ember_sticks: 32 } },
      { petCoins: 120, resources: { ember_sticks: 56 } },
      { petCoins: 180, resources: { ember_sticks: 90 } },
    ],
    powers: [
      { id: 'spark_kindle', atLevel: 1, kind: 'passive', combatHook: 'onFirstMeleeHit',
        label: 'Spark Kindle', blurb: 'First melee chip each wave leaves a tiny ember.' },
      { id: 'kindle_trail', atLevel: 3, kind: 'passive', combatHook: 'onMoveTick',
        label: 'Kindle Trail', blurb: 'Walking drops brief ember crumbs that tag chasers.' },
      { id: 'matchstick_storm', atLevel: 5, kind: 'active', combatHook: 'onActiveCast',
        label: 'Matchstick Storm', blurb: 'Shower of lit sticks — short cone, fire chip.' },
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
    blurb: 'Boils yesterday’s sawdust into a paste that sticks harder than a combo. Do not lick.',
    blurbNl: 'Kookt zaagsel tot een pasta die harder plakt dan een combo. Niet likken.',
    artHint: {
      shape: 'vat-works with dripping paddles and a sticky roof',
      motif: 'glue pot + woodchip swirl + clamp',
      palette: ['#c9a66b', '#8a6a3a', '#e8d5a3'],
      iconFile: 'assets/buttons/modes/buildings-woodchip-glue.svg',
      iconHint: 'stroke-first pot + drip, 24×24, no emoji',
    },
    resource: {
      id: 'glue_pots',
      name: 'Glue pots',
      nameNl: 'Lijmpotten',
      perHour: [6, 11, 18, 28, 42],
      cap: [48, 88, 144, 224, 336],
    },
    buildCost: { petCoins: 35, resources: { ember_sticks: 8 } },
    upgradeCosts: [
      { petCoins: 55, resources: { glue_pots: 14 } },
      { petCoins: 90, resources: { glue_pots: 28 } },
      { petCoins: 140, resources: { glue_pots: 48 } },
      { petCoins: 210, resources: { glue_pots: 80 } },
    ],
    powers: [
      { id: 'sticky_soles', atLevel: 1, kind: 'passive', combatHook: 'onKnockback',
        label: 'Sticky Soles', blurb: 'Take less knockback — boots remember the floor.' },
      { id: 'glue_trap', atLevel: 3, kind: 'active', combatHook: 'onActiveCast',
        label: 'Glue Trap', blurb: 'Puddle that slows the first monster through it.' },
      { id: 'chip_golem', atLevel: 5, kind: 'passive', combatHook: 'onWaveStart',
        label: 'Chip Golem', blurb: 'Start each wave with a thin chip-armor shield.' },
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
    blurb: 'A cheerful chipper that whispers TIMBER and coughs useful chips.',
    blurbNl: 'Vrolijke versnipperaar die TIMBER fluistert en nuttige snippers hoest.',
    artHint: {
      shape: 'open hopper + spinning teeth, wood-dust halo',
      motif: 'log in / chips out / tiny timber flag',
      palette: ['#7cfc8a', '#4a8a3a', '#c9b691'],
      iconFile: 'assets/buttons/modes/buildings-chipping-wood.svg',
      iconHint: 'stroke-first hopper + chip burst, 24×24, no emoji',
    },
    resource: {
      id: 'wood_chips',
      name: 'Wood chips',
      nameNl: 'Houtsnippers',
      perHour: [10, 16, 24, 36, 54],
      cap: [80, 128, 192, 288, 432],
    },
    buildCost: { petCoins: 50, resources: { glue_pots: 6 } },
    upgradeCosts: [
      { petCoins: 70, resources: { wood_chips: 20 } },
      { petCoins: 110, resources: { wood_chips: 40 } },
      { petCoins: 165, resources: { wood_chips: 70 } },
      { petCoins: 240, resources: { wood_chips: 110 } },
    ],
    powers: [
      { id: 'splinter_edge', atLevel: 1, kind: 'passive', combatHook: 'onWeaponHit',
        label: 'Splinter Edge', blurb: 'Weapon hits fling a bonus splinter chip.' },
      { id: 'sawdust_cloud', atLevel: 3, kind: 'active', combatHook: 'onActiveCast',
        label: 'Sawdust Cloud', blurb: 'Brief miss-haze in front of you.' },
      { id: 'chipper_fury', atLevel: 5, kind: 'passive', combatHook: 'onComboStep',
        label: 'Chipper Fury', blurb: 'High combos spray extra splinters.' },
    ],
  },
  {
    id: 'bamboo_boesa_boiler',
    name: 'Bamboo-Boesa Boiler',
    nameNl: 'Bamboe-Boesa Ketel',
    short: 'Boiler',
    worldUnlock: 4,
    maxLevel: BUILDING_MAX_LEVEL,
    accent: '#ff7a4d',
    theme: 'fire-bamboo',
    blurb: 'Fire-island kettle that steams hollow “boesa” bamboo until the stalks whistle.',
    blurbNl: 'Vuur-ketel die holle boesa-bamboe stoomt tot de stengels fluiten.',
    artHint: {
      shape: 'fat boiler, bamboo bundle, steam-whistle stack, ember belly',
      motif: 'bamboo + pressure gauge + flame ring',
      palette: ['#ff7a4d', '#c97a20', '#5ad06a'],
      iconFile: 'assets/buttons/modes/buildings-bamboo-boesa.svg',
      iconHint: 'stroke-first kettle + bamboo, 24×24, no emoji',
    },
    resource: {
      id: 'boesa_steam',
      name: 'Boesa steam',
      nameNl: 'Boesa-stoom',
      perHour: [7, 12, 20, 30, 46],
      cap: [56, 96, 160, 240, 368],
    },
    buildCost: { petCoins: 65, resources: { wood_chips: 10 } },
    upgradeCosts: [
      { petCoins: 95, resources: { boesa_steam: 16 } },
      { petCoins: 145, resources: { boesa_steam: 34 } },
      { petCoins: 210, resources: { boesa_steam: 58 } },
      { petCoins: 300, resources: { boesa_steam: 96 } },
    ],
    powers: [
      { id: 'boiler_hiss', atLevel: 1, kind: 'passive', combatHook: 'onAuraTick',
        label: 'Boiler Hiss', blurb: 'Close-range heat aura chips foes who crowd you.' },
      { id: 'bamboo_burst', atLevel: 3, kind: 'active', combatHook: 'onActiveCast',
        label: 'Bamboo Burst', blurb: 'Steam knock — short cone, heavy shove.' },
      { id: 'boesa_overheat', atLevel: 5, kind: 'passive', combatHook: 'onLowHp',
        label: 'Boesa Overheat', blurb: 'Low HP: extra fire chip, you run hotter.' },
    ],
  },
  {
    id: 'echo_whistle_mill',
    name: 'Echo-Whistle Mill',
    nameNl: 'Echo-Fluitmolen',
    short: 'Whistle',
    worldUnlock: 5,
    maxLevel: BUILDING_MAX_LEVEL,
    accent: '#7cf5ff',
    theme: 'echo',
    blurb: 'A mill wheel that turns air into taunts. The building heckles you back.',
    blurbNl: 'Molenrad dat lucht tot taunts maalt. Het gebouw scheldt terug.',
    artHint: {
      shape: 'water-wheel mill with horn-bells and ripple rings',
      motif: 'whistle + echo arcs + spinning wheel',
      palette: ['#7cf5ff', '#c792ff', '#9db1e3'],
      iconFile: 'assets/buttons/modes/buildings-echo-whistle.svg',
      iconHint: 'stroke-first whistle + echo arcs, 24×24, no emoji',
    },
    resource: {
      id: 'echo_notes',
      name: 'Echo notes',
      nameNl: 'Echo-noten',
      perHour: [5, 9, 15, 24, 38],
      cap: [40, 72, 120, 192, 304],
    },
    buildCost: { petCoins: 80, resources: { boesa_steam: 12 } },
    upgradeCosts: [
      { petCoins: 120, resources: { echo_notes: 12 } },
      { petCoins: 175, resources: { echo_notes: 26 } },
      { petCoins: 250, resources: { echo_notes: 46 } },
      { petCoins: 360, resources: { echo_notes: 78 } },
    ],
    powers: [
      { id: 'taunt_toot', atLevel: 1, kind: 'taunt', combatHook: 'onActiveCast',
        label: 'Taunt Toot', blurb: 'Short whistle — nearest foe turns to face you.' },
      { id: 'echo_ridge', atLevel: 3, kind: 'passive', combatHook: 'onKill',
        label: 'Echo Ridge', blurb: 'Kills leave a sound-stun ripple.' },
      { id: 'whistle_chorus', atLevel: 5, kind: 'taunt', combatHook: 'onActiveCast',
        label: 'Whistle Chorus', blurb: 'Area taunt + brief stun. The mill sings along.' },
    ],
  },
];

const BUILDING_IDS = BUILDING_CATALOG.map((b) => b.id);
const BUILDING_BY_ID = Object.fromEntries(BUILDING_CATALOG.map((b) => [b.id, b]));
const BUILDING_POWERS = BUILDING_CATALOG.flatMap((b) =>
  (b.powers || []).map((p) => Object.assign({ buildingId: b.id }, p))
);
const BUILDING_POWER_BY_ID = Object.fromEntries(BUILDING_POWERS.map((p) => [p.id, p]));
const BUILDING_RESOURCE_BY_ID = Object.fromEntries(
  BUILDING_CATALOG.map((b) => [b.resource.id, { buildingId: b.id, resource: b.resource }])
);

function emptyBuildingSite() {
  return { level: 0, lastTickAt: 0, stored: 0 };
}

function emptyBuildingWallet() {
  const w = {};
  for (const id of BUILDING_RESOURCE_IDS) w[id] = 0;
  return w;
}

function emptyBuildingsBag() {
  const bag = {};
  for (const id of BUILDING_IDS) bag[id] = emptyBuildingSite();
  return bag;
}

function buildingById(id) {
  return BUILDING_BY_ID[id] || null;
}

function buildingPowerById(id) {
  return BUILDING_POWER_BY_ID[id] || null;
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

function ensureBuildingSave(st) {
  const s = buildingSaveRef(st);
  if (!s) return null;
  if (!s.buildings || typeof s.buildings !== 'object' || Array.isArray(s.buildings)) s.buildings = {};
  if (!s.buildingRes || typeof s.buildingRes !== 'object' || Array.isArray(s.buildingRes)) s.buildingRes = {};
  return s;
}

function buildingSite(id, st) {
  const def = buildingById(id);
  if (!def) return null;
  const s = ensureBuildingSave(st);
  if (!s) return emptyBuildingSite();
  const raw = s.buildings[id];
  if (!raw || typeof raw !== 'object') {
    s.buildings[id] = emptyBuildingSite();
    return s.buildings[id];
  }
  return raw;
}

function buildingLevel(id, st) {
  const def = buildingById(id);
  if (!def) return 0;
  const site = buildingSite(id, st);
  return clamp(Math.floor(Number(site && site.level) || 0), 0, def.maxLevel);
}

function buildingMaxLevel(id) {
  const def = buildingById(id);
  return def ? def.maxLevel : BUILDING_MAX_LEVEL;
}

function buildingWorldUnlocked(id, st) {
  const def = buildingById(id);
  if (!def) return false;
  if (def.worldUnlock <= 1) return true;
  const s = buildingSaveRef(st);
  const unlocked = clamp(Math.floor(Number((s || {}).unlocked) || 1), 1, 70);
  const per = (typeof LEVELS_PER_ISLAND === 'number') ? LEVELS_PER_ISLAND : 10;
  return unlocked > (def.worldUnlock - 1) * per;
}

function buildingOwned(id, st) {
  return buildingLevel(id, st) >= 1;
}

function buildingWallet(resId, st) {
  if (!BUILDING_RESOURCE_IDS.includes(resId)) return 0;
  const s = ensureBuildingSave(st);
  if (!s) return 0;
  return clamp(Math.floor(Number(s.buildingRes[resId]) || 0), 0, BUILDING_WALLET_CAP);
}

function buildingWalletAll(st) {
  const out = emptyBuildingWallet();
  for (const id of BUILDING_RESOURCE_IDS) out[id] = buildingWallet(id, st);
  return out;
}

function buildingOutputAtLevel(def, level) {
  if (!def || !def.resource || level < 1) return { perHour: 0, cap: 0 };
  const i = clamp(level, 1, def.maxLevel) - 1;
  return {
    perHour: def.resource.perHour[i] || 0,
    cap: def.resource.cap[i] || 0,
  };
}

function buildingOutputRate(id, st) {
  return buildingOutputAtLevel(buildingById(id), buildingLevel(id, st)).perHour;
}

function buildingStorageCap(id, st) {
  return buildingOutputAtLevel(buildingById(id), buildingLevel(id, st)).cap;
}

function buildingCostClone(cost) {
  const out = { petCoins: Math.max(0, Math.floor(Number(cost && cost.petCoins) || 0)), resources: {} };
  const res = (cost && cost.resources && typeof cost.resources === 'object') ? cost.resources : {};
  for (const [k, v] of Object.entries(res)) {
    if (!BUILDING_RESOURCE_IDS.includes(k)) continue;
    const n = Math.max(0, Math.floor(Number(v) || 0));
    if (n) out.resources[k] = n;
  }
  return out;
}

function buildingBuildCost(id) {
  const def = buildingById(id);
  return def ? buildingCostClone(def.buildCost) : null;
}

function buildingUpgradeCost(id, st) {
  const def = buildingById(id);
  if (!def) return null;
  const lv = buildingLevel(id, st);
  if (lv < 1 || lv >= def.maxLevel) return null;
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
    s.buildingRes[res] = clamp(buildingWallet(res, s) - n, 0, BUILDING_WALLET_CAP);
  }
  return true;
}

function buildingCanBuild(id, st) {
  const def = buildingById(id);
  if (!def) return false;
  if (buildingOwned(id, st)) return false;
  if (!buildingWorldUnlocked(id, st)) return false;
  return buildingCanPay(buildingBuildCost(id), st);
}

function buildingCanUpgrade(id, st) {
  const def = buildingById(id);
  if (!def) return false;
  const lv = buildingLevel(id, st);
  if (lv < 1 || lv >= def.maxLevel) return false;
  if (!buildingWorldUnlocked(id, st)) return false;
  const cost = buildingUpgradeCost(id, st);
  return !!(cost && buildingCanPay(cost, st));
}

function tryBuildBuilding(id, st) {
  const def = buildingById(id);
  if (!def) return { ok: false, reason: 'unknown' };
  if (buildingOwned(id, st)) return { ok: false, reason: 'built' };
  if (!buildingWorldUnlocked(id, st)) return { ok: false, reason: 'locked' };
  const cost = buildingBuildCost(id);
  if (!buildingCanPay(cost, st)) return { ok: false, reason: 'broke' };
  const s = ensureBuildingSave(st);
  if (!buildingPay(cost, s)) return { ok: false, reason: 'broke' };
  const site = buildingSite(id, s);
  site.level = 1;
  site.stored = 0;
  site.lastTickAt = buildingNowMs();
  if (s === save) persistOrToast('building/build/' + id);
  return { ok: true, level: 1, buildingId: id };
}

function tryUpgradeBuilding(id, st) {
  const def = buildingById(id);
  if (!def) return { ok: false, reason: 'unknown' };
  const lv = buildingLevel(id, st);
  if (lv < 1) return { ok: false, reason: 'unbuilt' };
  if (lv >= def.maxLevel) return { ok: false, reason: 'max' };
  if (!buildingWorldUnlocked(id, st)) return { ok: false, reason: 'locked' };
  const cost = buildingUpgradeCost(id, st);
  if (!cost || !buildingCanPay(cost, st)) return { ok: false, reason: 'broke' };
  const s = ensureBuildingSave(st);
  if (!buildingPay(cost, s)) return { ok: false, reason: 'broke' };
  const site = buildingSite(id, s);
  site.level = lv + 1;
  const cap = buildingStorageCap(id, s);
  site.stored = clamp(Math.floor(Number(site.stored) || 0), 0, cap);
  if (s === save) persistOrToast('building/up/' + id);
  return { ok: true, level: site.level, buildingId: id };
}

function tickOneBuilding(id, now, st) {
  const def = buildingById(id);
  if (!def) return false;
  const lv = buildingLevel(id, st);
  if (lv < 1) return false;
  const site = buildingSite(id, st);
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
  const stored = clamp(Math.floor(Number(site.stored) || 0), 0, out.cap);
  if (stored >= out.cap) {
    site.lastTickAt = now;
    site.stored = out.cap;
    return site.stored !== stored || site.lastTickAt !== last;
  }
  const units = Math.floor((elapsed / BUILDING_MS_PER_HOUR) * out.perHour);
  if (units <= 0) return false;
  const usedMs = Math.floor((units / out.perHour) * BUILDING_MS_PER_HOUR);
  site.stored = clamp(stored + units, 0, out.cap);
  site.lastTickAt = last + usedMs;
  if (site.stored >= out.cap) site.lastTickAt = now;
  return true;
}

function tickBuildings(st, nowMs) {
  const s = ensureBuildingSave(st);
  if (!s) return false;
  const now = typeof nowMs === 'number' ? nowMs : buildingNowMs();
  let changed = false;
  for (const id of BUILDING_IDS) {
    if (tickOneBuilding(id, now, s)) changed = true;
  }
  return changed;
}

function buildingPendingAmount(id, st) {
  const s = ensureBuildingSave(st);
  if (!s) return 0;
  tickOneBuilding(id, buildingNowMs(), s);
  const site = buildingSite(id, s);
  const cap = buildingStorageCap(id, s);
  return clamp(Math.floor(Number(site && site.stored) || 0), 0, cap || BUILDING_STORED_CAP_ABS);
}

function collectBuilding(id, st) {
  const def = buildingById(id);
  if (!def || !buildingOwned(id, st)) return { ok: false, reason: 'unbuilt', amount: 0 };
  const s = ensureBuildingSave(st);
  tickOneBuilding(id, buildingNowMs(), s);
  const site = buildingSite(id, s);
  const amount = clamp(Math.floor(Number(site.stored) || 0), 0, BUILDING_STORED_CAP_ABS);
  if (amount <= 0) return { ok: true, amount: 0, resourceId: def.resource.id };
  site.stored = 0;
  site.lastTickAt = buildingNowMs();
  const res = def.resource.id;
  s.buildingRes[res] = clamp(buildingWallet(res, s) + amount, 0, BUILDING_WALLET_CAP);
  if (s === save) persistOrToast('building/collect/' + id);
  return { ok: true, amount, resourceId: res, buildingId: id };
}

function collectAllBuildings(st) {
  const gained = {};
  let total = 0;
  for (const id of BUILDING_IDS) {
    const r = collectBuilding(id, st);
    if (r && r.ok && r.amount > 0) {
      gained[r.resourceId] = (gained[r.resourceId] || 0) + r.amount;
      total += r.amount;
    }
  }
  return { ok: true, total, gained };
}

function buildingUnlockedPowers(st) {
  const out = [];
  for (const p of BUILDING_POWERS) {
    if (buildingLevel(p.buildingId, st) >= p.atLevel) out.push(p.id);
  }
  return out;
}

function buildingHasPower(powerId, st) {
  const p = buildingPowerById(powerId);
  if (!p) return false;
  return buildingLevel(p.buildingId, st) >= p.atLevel;
}

function buildingNextPower(id, st) {
  const def = buildingById(id);
  if (!def) return null;
  const lv = buildingLevel(id, st);
  return (def.powers || []).find((p) => p.atLevel > lv) || null;
}

function buildingLabel(id, field) {
  const def = buildingById(id);
  if (!def) return id || '?';
  const f = field || 'name';
  const key = 'buildings.' + id + '.' + f;
  if (typeof tOr === 'function') {
    const fallback = def[f] || def.name;
    return tOr(key, fallback);
  }
  return def[f] || def.name;
}

function buildingResourceLabel(resId) {
  const row = BUILDING_RESOURCE_BY_ID[resId];
  if (!row) return resId || '?';
  const key = 'buildings.res.' + resId;
  if (typeof tOr === 'function') return tOr(key, row.resource.name);
  return row.resource.name;
}

function countBuildingLevels(st) {
  let n = 0;
  const s = buildingSaveRef(st);
  const bag = (s && s.buildings && typeof s.buildings === 'object') ? s.buildings : {};
  for (const id of BUILDING_IDS) {
    n += clamp(Math.floor(Number(bag[id] && bag[id].level) || 0), 0, BUILDING_MAX_LEVEL);
  }
  return n;
}

function sanitizeBuildingSave(s) {
  if (!s || typeof s !== 'object') return s;
  const bagIn = (s.buildings && typeof s.buildings === 'object' && !Array.isArray(s.buildings))
    ? s.buildings : {};
  const bag = {};
  for (const id of BUILDING_IDS) {
    const def = buildingById(id);
    const raw = bagIn[id];
    const entry = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
    const lv = clamp(Math.floor(Number(entry.level) || 0), 0, def.maxLevel);
    const cap = lv >= 1 ? (buildingOutputAtLevel(def, lv).cap || BUILDING_STORED_CAP_ABS) : 0;
    const stored = lv >= 1
      ? clamp(Math.floor(Number(entry.stored) || 0), 0, cap)
      : 0;
    let last = Math.floor(Number(entry.lastTickAt) || 0);
    if (last < 0 || last > 4102444800000) last = 0;
    if (lv <= 0 && stored <= 0 && last <= 0) continue;
    bag[id] = { level: lv, lastTickAt: last, stored };
  }
  s.buildings = bag;
  const resIn = (s.buildingRes && typeof s.buildingRes === 'object' && !Array.isArray(s.buildingRes))
    ? s.buildingRes : {};
  const wallet = {};
  for (const id of BUILDING_RESOURCE_IDS) {
    const n = clamp(Math.floor(Number(resIn[id]) || 0), 0, BUILDING_WALLET_CAP);
    if (n > 0) wallet[id] = n;
  }
  s.buildingRes = wallet;
  return s;
}

function listBuildingsForUi(st) {
  const s = ensureBuildingSave(st);
  tickBuildings(s);
  return BUILDING_CATALOG.map((def) => {
    const lv = buildingLevel(def.id, s);
    const unlocked = buildingWorldUnlocked(def.id, s);
    const out = buildingOutputAtLevel(def, lv);
    const powersOn = (def.powers || []).filter((p) => lv >= p.atLevel).map((p) => p.id);
    return {
      id: def.id,
      name: buildingLabel(def.id, 'name'),
      blurb: buildingLabel(def.id, 'blurb'),
      short: def.short,
      worldUnlock: def.worldUnlock,
      theme: def.theme,
      accent: def.accent,
      artHint: def.artHint,
      unlocked,
      lockedReason: unlocked ? null : 'world',
      level: lv,
      maxLevel: def.maxLevel,
      built: lv >= 1,
      canBuild: buildingCanBuild(def.id, s),
      canUpgrade: buildingCanUpgrade(def.id, s),
      buildCost: buildingBuildCost(def.id),
      nextCost: lv < 1 ? buildingBuildCost(def.id) : buildingUpgradeCost(def.id, s),
      resourceId: def.resource.id,
      resourceName: buildingResourceLabel(def.resource.id),
      outputRate: out.perHour,
      storageCap: out.cap,
      pending: buildingPendingAmount(def.id, s),
      wallet: buildingWallet(def.resource.id, s),
      powers: def.powers || [],
      powersUnlocked: powersOn,
      nextPower: buildingNextPower(def.id, s),
    };
  });
}

const BUILDING_API = {
  catalog: BUILDING_CATALOG,
  ids: BUILDING_IDS,
  resources: BUILDING_RESOURCE_IDS,
  powers: BUILDING_POWERS,
  byId: buildingById,
  powerById: buildingPowerById,
  worldUnlocked: buildingWorldUnlocked,
  level: buildingLevel,
  maxLevel: buildingMaxLevel,
  owned: buildingOwned,
  canBuild: buildingCanBuild,
  canUpgrade: buildingCanUpgrade,
  tryBuild: tryBuildBuilding,
  tryUpgrade: tryUpgradeBuilding,
  buildCost: buildingBuildCost,
  upgradeCost: buildingUpgradeCost,
  outputRate: buildingOutputRate,
  storageCap: buildingStorageCap,
  pending: buildingPendingAmount,
  tick: tickBuildings,
  collect: collectBuilding,
  collectAll: collectAllBuildings,
  unlockedPowers: buildingUnlockedPowers,
  hasPower: buildingHasPower,
  wallet: buildingWallet,
  walletAll: buildingWalletAll,
  listForUi: listBuildingsForUi,
  sanitize: sanitizeBuildingSave,
  nowMs: buildingNowMs,
};

try {
  if (typeof globalThis !== 'undefined') globalThis.BUILDING_API = BUILDING_API;
} catch (_) {}
