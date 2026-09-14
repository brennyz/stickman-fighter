/* ======================== BUILDINGS API BRIDGE ======================== */
/**
 * UI adapter for the Buildings HOME screen (batch 2 of 4).
 * Prefers the systems partner API (BuildingsSys / listBuildings).
 * If that PR is not merged, a local stub keeps the screen playable.
 *
 * Contract: docs/BUILDINGS-UI.md  ·  systems: docs/BUILDINGS.md (partner)
 * Stub state lives in its own localStorage key — not save.buildings —
 * so sanitizeSave does not wipe it and systems can own the real bag later.
 */
const BUILDINGS_STUB_KEY = 'sf-buildings-stub-v1';
const BUILDINGS_FACTORY_IDS = ['mill', 'forge', 'ranch', 'shrine', 'foundry'];
const BUILDINGS_STUB_MAX_LV = 8;
const BUILDINGS_STUB_DEFS = [
  { id: 'mill',    world: 1, resourceId: 'xp',    intervalMs: 75000, rate: 4, capBase: 8, capPerLv: 4 },
  { id: 'forge',   world: 2, resourceId: 'shard', intervalMs: 90000, rate: 2, capBase: 6, capPerLv: 3 },
  { id: 'ranch',   world: 3, resourceId: 'pet',   intervalMs: 80000, rate: 3, capBase: 8, capPerLv: 4 },
  { id: 'shrine',  world: 4, resourceId: 'dust',  intervalMs: 110000, rate: 1, capBase: 4, capPerLv: 2 },
  { id: 'foundry', world: 7, resourceId: 'ember', intervalMs: 130000, rate: 1, capBase: 3, capPerLv: 2 },
];

function buildingsHasSystemsApi() {
  const sys = (typeof BuildingsSys !== 'undefined' && BuildingsSys) ? BuildingsSys : null;
  if (sys && typeof sys.list === 'function') return true;
  if (typeof listBuildings === 'function') return true;
  return false;
}

function buildingsSystemsHandle() {
  if (typeof BuildingsSys !== 'undefined' && BuildingsSys && typeof BuildingsSys.list === 'function') {
    return BuildingsSys;
  }
  if (typeof listBuildings === 'function') {
    return {
      list: listBuildings,
      get: (typeof getBuilding === 'function') ? getBuilding : null,
      collect: (typeof collectBuilding === 'function') ? collectBuilding : null,
      upgrade: (typeof upgradeBuilding === 'function') ? upgradeBuilding : null,
      hubStat: (typeof buildingsHubStat === 'function') ? buildingsHubStat : null,
      select: (typeof selectBuilding === 'function') ? selectBuilding : null,
      selectedId: (typeof selectedBuildingId === 'function') ? selectedBuildingId : null,
    };
  }
  return null;
}

function buildingsI18nName(id) {
  return (typeof t === 'function') ? t('buildings.' + id) : id;
}
function buildingsI18nSub(id) {
  return (typeof t === 'function') ? t('buildings.' + id + 'Sub') : '';
}
function buildingsResourceLabel(resourceId) {
  const key = ({
    xp: 'buildings.resXp',
    shard: 'buildings.resShard',
    pet: 'buildings.resPet',
    dust: 'buildings.resDust',
    ember: 'buildings.resEmber',
  })[resourceId];
  return key && typeof t === 'function' ? t(key) : String(resourceId || '');
}
function buildingsWorldName(world) {
  try {
    if (typeof islandLabel === 'function') return islandLabel(world, 'name');
    if (typeof islandMeta === 'function') {
      const m = islandMeta(world);
      if (m && m.name) return m.name;
    }
  } catch (_) {}
  return 'W' + world;
}
function buildingsWorldLocked(world) {
  try {
    if (typeof islandUnlocked === 'function') return !islandUnlocked(world);
  } catch (_) {}
  const unlocked = (typeof save !== 'undefined' && save) ? (Number(save.unlocked) || 1) : 1;
  return world > 1 && unlocked <= (world - 1) * 10;
}

function buildingsArtPath(id) {
  const pixel = 'assets/buildings/pixel/' + id + '.png';
  const svg = 'assets/buildings/' + id + '.svg';
  if (typeof document !== 'undefined' && document) {
    const probe = document.querySelector('img[data-buildings-art="' + id + '"]');
    if (probe && probe.getAttribute('src')) return probe.getAttribute('src');
  }
  return { pixel, svg, hub: 'assets/buttons/hub/buildings.svg' };
}

function buildingsEmptyStubState() {
  const factories = {};
  for (const def of BUILDINGS_STUB_DEFS) {
    factories[def.id] = { lv: def.world <= 1 ? 1 : 0, lastTs: 0 };
  }
  return { v: 1, selectedId: 'mill', factories, wallet: { shard: 0, dust: 0, ember: 0 } };
}

function buildingsLoadStub() {
  try {
    const raw = localStorage.getItem(BUILDINGS_STUB_KEY);
    if (!raw) return buildingsEmptyStubState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return buildingsEmptyStubState();
    const base = buildingsEmptyStubState();
    base.selectedId = BUILDINGS_FACTORY_IDS.includes(parsed.selectedId) ? parsed.selectedId : 'mill';
    base.wallet = Object.assign(base.wallet, parsed.wallet || {});
    for (const id of BUILDINGS_FACTORY_IDS) {
      const row = parsed.factories && parsed.factories[id];
      if (row && typeof row === 'object') {
        base.factories[id] = {
          lv: Math.max(0, Math.min(BUILDINGS_STUB_MAX_LV, Math.floor(Number(row.lv) || 0))),
          lastTs: Math.max(0, Math.floor(Number(row.lastTs) || 0)),
        };
      }
    }
    return base;
  } catch (_) {
    return buildingsEmptyStubState();
  }
}

function buildingsSaveStub(state) {
  try { localStorage.setItem(BUILDINGS_STUB_KEY, JSON.stringify(state)); } catch (_) {}
}

function buildingsStubCap(def, lv) {
  return def.capBase + Math.max(1, lv) * def.capPerLv;
}
function buildingsStubInterval(def, lv) {
  return Math.max(18000, def.intervalMs - Math.max(0, lv - 1) * 5000);
}
function buildingsStubPending(def, row, now) {
  const lv = Math.max(0, row.lv || 0);
  if (lv < 1) return 0;
  const elapsed = Math.max(0, now - (row.lastTs || 0));
  const gained = Math.floor(elapsed / buildingsStubInterval(def, lv)) * def.rate * lv;
  return Math.min(buildingsStubCap(def, lv), gained);
}

function buildingsStubView(def, state, now) {
  now = now || Date.now();
  const row = state.factories[def.id] || { lv: 0, lastTs: 0 };
  const locked = buildingsWorldLocked(def.world);
  const level = locked ? 0 : Math.max(row.lv || 0, def.world <= 1 ? 1 : 0);
  if (!locked && level < 1) {
    row.lv = 1;
    state.factories[def.id] = row;
  }
  const pending = locked ? 0 : buildingsStubPending(def, row, now);
  const cap = buildingsStubCap(def, Math.max(1, level));
  const interval = buildingsStubInterval(def, Math.max(1, level));
  const nextMs = (locked || pending >= cap)
    ? 0
    : Math.max(0, interval - ((now - (row.lastTs || 0)) % interval));
  const maxLevel = BUILDINGS_STUB_MAX_LV;
  const atMax = level >= maxLevel;
  const upgradeCost = atMax ? 0 : 12 * Math.max(1, level);
  const wallet = (typeof petCoinsBalance === 'function') ? petCoinsBalance() : 0;
  const canUpgrade = !locked && !atMax && wallet >= upgradeCost;
  const art = buildingsArtPath(def.id);
  return {
    id: def.id,
    name: buildingsI18nName(def.id),
    sub: buildingsI18nSub(def.id),
    world: def.world,
    worldName: buildingsWorldName(def.world),
    locked,
    lockHint: locked
      ? ((typeof t === 'function')
        ? t('buildings.lockWorld', { name: buildingsWorldName(def.world), n: def.world })
        : buildingsWorldName(def.world))
      : '',
    level,
    maxLevel,
    pending,
    capacity: cap,
    nextMs,
    resourceId: def.resourceId,
    resourceLabel: buildingsResourceLabel(def.resourceId),
    canCollect: !locked && pending > 0,
    canUpgrade,
    upgradeCost,
    upgradeHint: atMax
      ? ((typeof t === 'function') ? t('buildings.upgradeMax') : 'Max')
      : ((typeof t === 'function')
        ? t('buildings.upgradeSub', { cost: upgradeCost, next: level + 1 })
        : String(upgradeCost)),
    art: art.pixel,
    artSvg: art.svg,
    artHub: art.hub,
    stub: true,
  };
}

function buildingsNormalizeView(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || raw.key || '');
  if (!id) return null;
  const world = Math.max(1, Math.floor(Number(raw.world ?? raw.island ?? raw.unlockWorld) || 1));
  const locked = raw.locked != null ? !!raw.locked : buildingsWorldLocked(world);
  const art = buildingsArtPath(id);
  const resourceId = raw.resourceId || raw.resource || 'xp';
  return {
    id,
    name: raw.name || buildingsI18nName(id),
    sub: raw.sub || raw.blurb || buildingsI18nSub(id),
    world,
    worldName: raw.worldName || buildingsWorldName(world),
    locked,
    lockHint: raw.lockHint || raw.lockReason || (locked
      ? ((typeof t === 'function') ? t('buildings.lockWorld', { name: buildingsWorldName(world), n: world }) : '')
      : ''),
    level: Math.max(0, Math.floor(Number(raw.level ?? raw.lv) || 0)),
    maxLevel: Math.max(1, Math.floor(Number(raw.maxLevel ?? raw.maxLv) || BUILDINGS_STUB_MAX_LV)),
    pending: Math.max(0, Math.floor(Number(raw.pending ?? raw.ready ?? raw.stored) || 0)),
    capacity: Math.max(1, Math.floor(Number(raw.capacity ?? raw.cap) || 1)),
    nextMs: Math.max(0, Math.floor(Number(raw.nextMs ?? raw.readyInMs) || 0)),
    resourceId,
    resourceLabel: raw.resourceLabel || buildingsResourceLabel(resourceId),
    canCollect: raw.canCollect != null ? !!raw.canCollect : (!locked && Number(raw.pending ?? raw.ready) > 0),
    canUpgrade: !!raw.canUpgrade,
    upgradeCost: Math.max(0, Math.floor(Number(raw.upgradeCost) || 0)),
    upgradeHint: raw.upgradeHint || '',
    art: raw.art || art.pixel,
    artSvg: raw.artSvg || art.svg,
    artHub: art.hub,
    stub: false,
  };
}

const BuildingsStub = {
  _sel: 'mill',
  list() {
    const state = buildingsLoadStub();
    const now = Date.now();
    return BUILDINGS_STUB_DEFS.map((def) => buildingsStubView(def, state, now));
  },
  get(id) {
    const state = buildingsLoadStub();
    const def = BUILDINGS_STUB_DEFS.find((d) => d.id === id);
    if (!def) return null;
    return buildingsStubView(def, state, Date.now());
  },
  collect(id) {
    const state = buildingsLoadStub();
    const def = BUILDINGS_STUB_DEFS.find((d) => d.id === id);
    if (!def) return { ok: false, message: 'missing' };
    if (buildingsWorldLocked(def.world)) {
      return { ok: false, message: (typeof t === 'function') ? t('buildings.locked') : 'locked' };
    }
    const view = buildingsStubView(def, state, Date.now());
    if (view.pending <= 0) {
      return { ok: false, message: (typeof t === 'function') ? t('buildings.collectEmpty') : 'empty' };
    }
    const amount = view.pending;
    const row = state.factories[def.id] || { lv: 1, lastTs: 0 };
    row.lastTs = Date.now();
    state.factories[def.id] = row;
    if (def.resourceId === 'xp' && typeof save !== 'undefined' && save) {
      save.xp = Math.max(0, Math.floor(Number(save.xp) || 0) + amount);
      try { if (typeof persist === 'function') persist(); } catch (_) {}
    } else if (def.resourceId === 'pet' && typeof save !== 'undefined' && save) {
      const cur = (typeof petCoinsBalance === 'function') ? petCoinsBalance() : (Number(save.petCoins) || 0);
      save.petCoins = cur + amount;
      try { if (typeof persist === 'function') persist(); } catch (_) {}
    } else {
      state.wallet[def.resourceId] = Math.max(0, Math.floor(Number(state.wallet[def.resourceId]) || 0) + amount);
    }
    buildingsSaveStub(state);
    return {
      ok: true,
      amount,
      resourceId: def.resourceId,
      message: (typeof t === 'function')
        ? t('buildings.collectDone', { n: amount, res: buildingsResourceLabel(def.resourceId) })
        : ('+' + amount),
    };
  },
  upgrade(id) {
    const state = buildingsLoadStub();
    const def = BUILDINGS_STUB_DEFS.find((d) => d.id === id);
    if (!def) return { ok: false, message: 'missing' };
    if (buildingsWorldLocked(def.world)) {
      return { ok: false, message: (typeof t === 'function') ? t('buildings.locked') : 'locked' };
    }
    const view = buildingsStubView(def, state, Date.now());
    if (view.level >= view.maxLevel) {
      return { ok: false, message: (typeof t === 'function') ? t('buildings.upgradeMax') : 'max' };
    }
    const cost = view.upgradeCost;
    const wallet = (typeof petCoinsBalance === 'function') ? petCoinsBalance() : 0;
    if (wallet < cost) {
      return {
        ok: false,
        message: (typeof t === 'function') ? t('buildings.upgradeNeed', { need: cost - wallet }) : 'need',
      };
    }
    if (typeof save !== 'undefined' && save) {
      save.petCoins = wallet - cost;
      try { if (typeof persist === 'function') persist(); } catch (_) {}
    }
    const row = state.factories[def.id] || { lv: 1, lastTs: Date.now() };
    row.lv = Math.min(BUILDINGS_STUB_MAX_LV, Math.max(1, (row.lv || 1) + 1));
    state.factories[def.id] = row;
    buildingsSaveStub(state);
    return {
      ok: true,
      level: row.lv,
      message: (typeof t === 'function')
        ? t('buildings.upgradeOk', { name: buildingsI18nName(def.id), lv: row.lv })
        : ('Lv ' + row.lv),
    };
  },
  hubStat() {
    const rows = this.list();
    const ready = rows.filter((r) => r.canCollect).length;
    const open = rows.filter((r) => !r.locked).length;
    if (ready > 0 && typeof t === 'function') return t('buildings.hubStatReady', { n: ready });
    if (typeof t === 'function') return t('buildings.hubStatLocked', { n: open, total: rows.length });
    return open + '/' + rows.length;
  },
  select(id) {
    if (!BUILDINGS_FACTORY_IDS.includes(id)) return;
    const state = buildingsLoadStub();
    state.selectedId = id;
    this._sel = id;
    buildingsSaveStub(state);
  },
  selectedId() {
    const state = buildingsLoadStub();
    return state.selectedId || this._sel || 'mill';
  },
  wallet() {
    return buildingsLoadStub().wallet;
  },
};

function buildingsApi() {
  const live = buildingsSystemsHandle();
  return live || BuildingsStub;
}

function buildingsList() {
  const api = buildingsApi();
  let rows = [];
  try { rows = api.list() || []; } catch (_) { rows = []; }
  if (!Array.isArray(rows) || !rows.length) {
    try { rows = BuildingsStub.list(); } catch (_) { rows = []; }
  }
  return rows.map((r) => (r && r.id && r.name != null && r.pending != null) ? r : buildingsNormalizeView(r)).filter(Boolean);
}

function buildingsGet(id) {
  const api = buildingsApi();
  let row = null;
  try { row = api.get ? api.get(id) : null; } catch (_) { row = null; }
  if (row) return buildingsNormalizeView(row) || row;
  return buildingsList().find((r) => r.id === id) || null;
}

function buildingsCollect(id) {
  const api = buildingsApi();
  try { return api.collect(id) || { ok: false }; } catch (err) {
    return { ok: false, message: (err && err.message) || 'collect' };
  }
}

function buildingsUpgrade(id) {
  const api = buildingsApi();
  try { return api.upgrade(id) || { ok: false }; } catch (err) {
    return { ok: false, message: (err && err.message) || 'upgrade' };
  }
}

function buildingsHubStat() {
  const api = buildingsApi();
  try {
    if (typeof api.hubStat === 'function') {
      const line = api.hubStat();
      if (line) return line;
    }
  } catch (_) {}
  return BuildingsStub.hubStat();
}

function buildingsSelect(id) {
  const api = buildingsApi();
  try { if (typeof api.select === 'function') api.select(id); } catch (_) {}
  BuildingsStub._sel = id;
  if (!buildingsHasSystemsApi()) BuildingsStub.select(id);
}

function buildingsSelectedId() {
  const api = buildingsApi();
  try {
    if (typeof api.selectedId === 'function') {
      const id = api.selectedId();
      if (id) return id;
    }
  } catch (_) {}
  return BuildingsStub.selectedId();
}

function buildingsFormatEta(ms) {
  const s = Math.max(0, Math.ceil((Number(ms) || 0) / 1000));
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + String(r).padStart(2, '0');
}
