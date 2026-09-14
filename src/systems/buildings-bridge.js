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
const BUILDINGS_FACTORY_IDS = ['stick_lighter', 'woodchip_glue', 'chipping_wood', 'bamboo_boesa', 'echo_whistle'];
const BUILDINGS_STUB_MAX_LV = 8;
const BUILDINGS_STUB_DEFS = [
  { id: 'stick_lighter', world: 1, resourceId: 'spark', intervalMs: 75000, rate: 4, capBase: 8, capPerLv: 4 },
  { id: 'woodchip_glue', world: 2, resourceId: 'glue',  intervalMs: 90000, rate: 2, capBase: 6, capPerLv: 3 },
  { id: 'chipping_wood', world: 3, resourceId: 'chip',  intervalMs: 80000, rate: 3, capBase: 8, capPerLv: 4 },
  { id: 'bamboo_boesa',  world: 4, resourceId: 'steam', intervalMs: 110000, rate: 1, capBase: 4, capPerLv: 2 },
  { id: 'echo_whistle',  world: 5, resourceId: 'echo',  intervalMs: 130000, rate: 1, capBase: 3, capPerLv: 2 },
];

function buildingsHasLiveCatalog() {
  return typeof BUILDING_IDS !== 'undefined' && BUILDING_IDS && BUILDING_IDS.length
    && typeof buildingTooltipModel === 'function'
    && typeof buildingCollect === 'function';
}

function buildingsHasSystemsApi() {
  const sys = (typeof BuildingsSys !== 'undefined' && BuildingsSys) ? BuildingsSys : null;
  if (sys && typeof sys.list === 'function') return true;
  if (typeof listBuildings === 'function') return true;
  return buildingsHasLiveCatalog();
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
      hubStat: (typeof buildingsHubStatPartner === 'function') ? buildingsHubStatPartner : null,
      select: (typeof selectBuilding === 'function') ? selectBuilding : null,
      selectedId: (typeof selectedBuildingId === 'function') ? selectedBuildingId : null,
    };
  }
  if (buildingsHasLiveCatalog()) return BuildingsLiveSys;
  return null;
}

function buildingsI18nName(id) {
  if (typeof tOr === 'function') return tOr('buildings.' + id + '.name', tOr('buildings.' + id, id));
  if (typeof t === 'function') {
    const nested = t('buildings.' + id + '.name');
    if (nested && nested !== 'buildings.' + id + '.name') return nested;
    return t('buildings.' + id);
  }
  return id;
}
function buildingsI18nSub(id) {
  if (typeof tOr === 'function') return tOr('buildings.' + id + '.blurb', tOr('buildings.' + id + 'Sub', ''));
  if (typeof t === 'function') {
    const blurb = t('buildings.' + id + '.blurb');
    if (blurb && blurb !== 'buildings.' + id + '.blurb') return blurb;
    return t('buildings.' + id + 'Sub');
  }
  return '';
}
function buildingsResourceLabel(resourceId) {
  if (typeof buildingResourceLabel === 'function') {
    try {
      const live = buildingResourceLabel(resourceId);
      if (live) return live;
    } catch (_) {}
  }
  const key = ({
    spark: 'buildings.res.spark',
    glue: 'buildings.res.glue',
    chip: 'buildings.res.chip',
    steam: 'buildings.res.steam',
    echo: 'buildings.res.echo',
    xp: 'buildings.resXp',
    shard: 'buildings.resShard',
    pet: 'buildings.resPet',
    dust: 'buildings.resDust',
    ember: 'buildings.resEmber',
  })[resourceId];
  if (key && typeof tOr === 'function') return tOr(key, String(resourceId || ''));
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
  return { v: 1, selectedId: 'stick_lighter', factories, wallet: { spark: 0, glue: 0, chip: 0, steam: 0, echo: 0 } };
}

function buildingsLoadStub() {
  try {
    const raw = localStorage.getItem(BUILDINGS_STUB_KEY);
    if (!raw) return buildingsEmptyStubState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return buildingsEmptyStubState();
    const base = buildingsEmptyStubState();
    base.selectedId = BUILDINGS_FACTORY_IDS.includes(parsed.selectedId) ? parsed.selectedId : 'stick_lighter';
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
  _sel: 'stick_lighter',
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
    state.wallet[def.resourceId] = Math.max(0, Math.floor(Number(state.wallet[def.resourceId]) || 0) + amount);
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
    return state.selectedId || this._sel || 'stick_lighter';
  },
  wallet() {
    return buildingsLoadStub().wallet;
  },
};

const BuildingsLiveSys = {
  _sel: 'stick_lighter',
  _ids() {
    return (typeof BUILDING_IDS !== 'undefined' && BUILDING_IDS.length) ? BUILDING_IDS : BUILDINGS_FACTORY_IDS;
  },
  _view(id) {
    const raw = buildingTooltipModel(id);
    if (!raw) return null;
    const art = buildingsArtPath(raw.id);
    const locked = !raw.unlocked;
    const unbuilt = !raw.built;
    const cost = raw.nextCost || {};
    const costPc = Math.max(0, Math.floor(Number(cost.petCoins) || 0));
    const canAct = !locked && (raw.canBuild || raw.canUpgrade);
    return {
      id: raw.id,
      name: raw.name || buildingsI18nName(raw.id),
      sub: raw.blurb || buildingsI18nSub(raw.id),
      world: raw.worldUnlock || 1,
      worldName: buildingsWorldName(raw.worldUnlock || 1),
      locked,
      lockHint: locked
        ? ((typeof t === 'function')
          ? t('buildings.lockWorld', { name: buildingsWorldName(raw.worldUnlock || 1), n: raw.worldUnlock || 1 })
          : '')
        : '',
      level: raw.level || 0,
      maxLevel: raw.maxLevel || 10,
      pending: raw.pending || 0,
      capacity: raw.storageCap || 1,
      nextMs: 0,
      resourceId: raw.resourceId,
      resourceLabel: raw.resourceName || buildingsResourceLabel(raw.resourceId),
      canCollect: !!raw.canCollect,
      canUpgrade: canAct,
      upgradeCost: costPc,
      upgradeHint: locked
        ? ''
        : (unbuilt
          ? ((typeof t === 'function') ? t('buildings.build') : 'Build')
          : ((typeof t === 'function')
            ? t('buildings.upgradeSub', { cost: costPc, next: (raw.level || 0) + 1 })
            : String(costPc))),
      art: art.pixel,
      artSvg: art.svg,
      artHub: art.hub,
      stub: false,
    };
  },
  list() {
    try { if (typeof buildingTickAll === 'function') buildingTickAll(); } catch (_) {}
    return this._ids().map((id) => this._view(id)).filter(Boolean);
  },
  get(id) {
    try { if (typeof buildingTickAll === 'function') buildingTickAll(); } catch (_) {}
    return this._view(id);
  },
  collect(id) {
    const res = buildingCollect(id);
    const amount = (res && res.amount) || 0;
    const ok = !!(res && res.ok && amount > 0);
    return {
      ok,
      amount,
      resourceId: res && res.resourceId,
      message: ok
        ? ((typeof t === 'function')
          ? t('buildings.collectDone', { n: amount, res: buildingsResourceLabel(res.resourceId) })
          : ('+' + amount))
        : ((typeof t === 'function') ? t('buildings.collectEmpty') : 'empty'),
    };
  },
  upgrade(id) {
    const lv = (typeof buildingLevel === 'function') ? buildingLevel(id) : 0;
    const res = (lv < 1 && typeof buildingBuild === 'function') ? buildingBuild(id) : buildingUpgrade(id);
    const ok = !!(res && res.ok);
    return {
      ok,
      level: res && res.level,
      message: ok
        ? ((typeof t === 'function')
          ? t('buildings.upgradeOk', { name: buildingsI18nName(id), lv: res.level })
          : ('Lv ' + (res && res.level)))
        : ((typeof t === 'function')
          ? (res && res.reason === 'broke' ? t('buildings.upgradeNeed', { need: 1 }) : t('buildings.locked'))
          : 'no'),
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
    if (!this._ids().includes(id)) return;
    this._sel = id;
  },
  selectedId() { return this._sel || 'stick_lighter'; },
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
