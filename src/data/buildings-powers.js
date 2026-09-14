/* ===================== BUILDINGS POWERS + TIMED LOOT =====================
 * Lane 4/4 — hooks the buildings *systems* bag (5 factories).
 * If systems catalog (`BUILDING_IDS` / `BUILDING_DEFS`) is present, we bind
 * to those ids (index + alias). Otherwise we ship the fallback 5-factory
 * contract so this PR is testable before mega-merge.
 *
 * Save bag (BUILDINGS_SCHEMA = 1):
 *   save.buildings = {
 *     schema: 1,
 *     lastTickAt: epoch_ms,
 *     byId: { stick_lighter: { level, pending, stock, lastCollectAt }, ... }
 *   }
 * Locked systems ids: stick_lighter, woodchip_glue, chipping_wood,
 * bamboo_boesa, echo_whistle. Also accepts kebab / longer pixel names
 * and systems-shaped { levels, pending, stock }.
 * Never throws. Clock rollback = no refund. Versus untouched.
 */
const BUILDINGS_SCHEMA = 1;
const BUILDING_LEVEL_MAX = 10;
const BUILDING_POWER_TIER_MAX = 5;
const BUILDING_OFFLINE_MAX_MS = 48 * 3600 * 1000;
const BUILDING_PENDING_HOURS = 4;
const BUILDING_STARTER_ID = 'stick_lighter';

/** Exact systems catalog (FINAL lock). */
const BUILDING_FACTORY_IDS = [
  'stick_lighter',
  'woodchip_glue',
  'chipping_wood',
  'bamboo_boesa',
  'echo_whistle',
];

const BUILDING_ID_ALIASES = {
  stick_lighter: 'stick_lighter', sticklighter: 'stick_lighter',
  factory_stick_lighter: 'stick_lighter', factorysticklighter: 'stick_lighter',
  forge: 'stick_lighter', smith: 'stick_lighter',
  woodchip_glue: 'woodchip_glue', woodchipglue: 'woodchip_glue',
  factory_woodchip_glue: 'woodchip_glue', factorywoodchipglue: 'woodchip_glue',
  tower: 'woodchip_glue', barracks: 'woodchip_glue',
  chipping_wood: 'chipping_wood', chippingwood: 'chipping_wood',
  factory_chipping_wood: 'chipping_wood', factorychippingwood: 'chipping_wood',
  dojo: 'chipping_wood', hall: 'chipping_wood', training: 'chipping_wood',
  bamboo_boesa: 'bamboo_boesa', bambooboesa: 'bamboo_boesa',
  bamboo_boesa_boiler: 'bamboo_boesa', bambooboesaboiler: 'bamboo_boesa',
  bambooboiler: 'bamboo_boesa', boesa: 'bamboo_boesa',
  garden: 'bamboo_boesa', farm: 'bamboo_boesa', kitchen: 'bamboo_boesa',
  echo_whistle: 'echo_whistle', echowhistle: 'echo_whistle',
  echo_whistle_mill: 'echo_whistle', echowhistlemill: 'echo_whistle',
  whistlemill: 'echo_whistle', shrine: 'echo_whistle', well: 'echo_whistle',
};

const BUILDING_RESOURCE = {
  stick_lighter:  { id: 'embers',  basePerHour: 10, stepPerHour: 3, stockCap: 200 },
  woodchip_glue:  { id: 'glue',    basePerHour:  8, stepPerHour: 3, stockCap: 160 },
  chipping_wood:  { id: 'chips',   basePerHour: 12, stepPerHour: 4, stockCap: 240 },
  bamboo_boesa:   { id: 'steam',   basePerHour: 16, stepPerHour: 5, stockCap: 320 },
  echo_whistle:   { id: 'echoes',  basePerHour:  6, stepPerHour: 2, stockCap: 120 },
};

/** Power tiers: index 0 unused; [1]=lv1, [3]=lv3, [5]=lv5. Higher lv keeps lv5. */
const BUILDING_POWER_TIERS = {
  stick_lighter: {
    1: { critBonus: 0.01 },
    3: { critBonus: 0.02 },
    5: { critBonus: 0.03, dmgMul: 1.02 },
  },
  woodchip_glue: {
    1: { shieldWave: 0.35 },
    3: { shieldWave: 0.70 },
    5: { shieldWave: 1.00, defMul: 0.96 },
  },
  chipping_wood: {
    1: { dmgMul: 1.02 },
    3: { dmgMul: 1.04 },
    5: { dmgMul: 1.06, speedMul: 1.02 },
  },
  bamboo_boesa: {
    1: { maxHp: 4 },
    3: { maxHp: 8 },
    5: { maxHp: 12, healBetween: 0.02 },
  },
  echo_whistle: {
    1: { energyMul: 1.04 },
    3: { energyMul: 1.08 },
    5: { energyMul: 1.10, techniqueMul: 1.04 },
  },
};

const BUILDING_META = {
  stick_lighter: { name: 'Stick-Lighter', accent: '#ffd75e' },
  woodchip_glue: { name: 'Woodchip-Glue', accent: '#b8e986' },
  chipping_wood: { name: 'Chipping-Wood', accent: '#7cf5ff' },
  bamboo_boesa:  { name: 'Bamboo-Boesa', accent: '#6ee06e' },
  echo_whistle:  { name: 'Echo-Whistle', accent: '#c792ff' },
};

function emptyBuildingSlot(level) {
  return { level: clamp(Math.floor(Number(level) || 0), 0, BUILDING_LEVEL_MAX), pending: 0, stock: 0, lastCollectAt: 0 };
}

function emptyBuildingsBag() {
  const byId = {};
  for (const id of BUILDING_FACTORY_IDS) byId[id] = emptyBuildingSlot(id === BUILDING_STARTER_ID ? 1 : 0);
  return { schema: BUILDINGS_SCHEMA, lastTickAt: 0, byId };
}

function buildingCatalogIds() {
  try {
    if (typeof BUILDING_IDS !== 'undefined' && Array.isArray(BUILDING_IDS) && BUILDING_IDS.length) {
      return BUILDING_IDS.filter((id) => typeof id === 'string' && id);
    }
    if (typeof BUILDING_DEFS !== 'undefined' && Array.isArray(BUILDING_DEFS) && BUILDING_DEFS.length) {
      return BUILDING_DEFS.map((d) => d && d.id).filter((id) => typeof id === 'string' && id);
    }
  } catch (_) {}
  return BUILDING_FACTORY_IDS.slice();
}

function buildingCanonId(id) {
  if (typeof id !== 'string' || !id) return null;
  const raw = id.replace(/[^a-z0-9_]/gi, '').toLowerCase();
  if (!raw || raw === '__proto__' || raw === 'constructor' || raw === 'prototype') return null;
  if (BUILDING_ID_ALIASES[raw]) return BUILDING_ID_ALIASES[raw];
  if (BUILDING_RESOURCE[raw]) return raw;
  const ids = buildingCatalogIds();
  const idx = ids.indexOf(id);
  if (idx >= 0 && idx < BUILDING_FACTORY_IDS.length) return BUILDING_FACTORY_IDS[idx];
  const idxRaw = ids.indexOf(raw);
  if (idxRaw >= 0 && idxRaw < BUILDING_FACTORY_IDS.length) return BUILDING_FACTORY_IDS[idxRaw];
  return null;
}

function buildingMeta(id) {
  const canon = buildingCanonId(id) || id;
  const fallback = BUILDING_META[canon] || { name: String(id || 'Building'), accent: '#7cf5ff' };
  try {
    if (typeof BUILDING_DEFS !== 'undefined' && Array.isArray(BUILDING_DEFS)) {
      const def = BUILDING_DEFS.find((d) => d && (d.id === id || buildingCanonId(d.id) === canon));
      if (def) {
        return {
          name: def.name || fallback.name,
          accent: def.accent || fallback.accent,
        };
      }
    }
  } catch (_) {}
  return fallback;
}

function buildingResourceDef(id) {
  const canon = buildingCanonId(id);
  return (canon && BUILDING_RESOURCE[canon]) || null;
}

function buildingLevelOf(slot) {
  if (!slot || typeof slot !== 'object') return 0;
  const n = slot.level != null ? slot.level : slot.lv;
  return clamp(Math.floor(Number(n) || 0), 0, BUILDING_LEVEL_MAX);
}

function buildingRatePerHour(id, level) {
  const res = buildingResourceDef(id);
  const lv = clamp(Math.floor(Number(level) || 0), 0, BUILDING_LEVEL_MAX);
  if (!res || lv < 1) return 0;
  return res.basePerHour + (lv - 1) * res.stepPerHour;
}

function buildingPendingCap(id, level) {
  const rate = buildingRatePerHour(id, level);
  if (rate <= 0) return 0;
  return Math.round(rate * BUILDING_PENDING_HOURS * 1000) / 1000;
}

function buildingPowerForLevel(id, level) {
  const canon = buildingCanonId(id);
  const table = canon && BUILDING_POWER_TIERS[canon];
  const lv = clamp(Math.floor(Number(level) || 0), 0, BUILDING_POWER_TIER_MAX);
  if (!table || lv < 1) return {};
  let pick = {};
  for (const key of Object.keys(table)) {
    const gate = parseInt(key, 10);
    if (gate <= lv) pick = table[key];
  }
  return pick || {};
}

function emptyBuildingPowerBonus() {
  return {
    dmgMul: 1,
    speedMul: 1,
    energyMul: 1,
    techniqueMul: 1,
    critBonus: 0,
    maxHp: 0,
    shieldWave: 0,
    defMul: 1,
    healBetween: 0,
  };
}

function ensureBuildingsBag(s) {
  const target = s || (typeof save !== 'undefined' ? save : null);
  if (!target || typeof target !== 'object') return emptyBuildingsBag();
  if (!target.buildings || typeof target.buildings !== 'object' || Array.isArray(target.buildings)) {
    target.buildings = emptyBuildingsBag();
  }
  return target.buildings;
}

function buildingSlot(id, s) {
  const canon = buildingCanonId(id);
  if (!canon) return emptyBuildingSlot(0);
  const bag = ensureBuildingsBag(s);
  if (!bag.byId || typeof bag.byId !== 'object') bag.byId = {};
  if (!bag.byId[canon] || typeof bag.byId[canon] !== 'object') {
    bag.byId[canon] = emptyBuildingSlot(canon === BUILDING_STARTER_ID ? 1 : 0);
  }
  return bag.byId[canon];
}

function readBuildingSlotLoose(raw, id) {
  const canon = buildingCanonId(id);
  if (!canon || !raw || typeof raw !== 'object') return emptyBuildingSlot(canon === BUILDING_STARTER_ID ? 1 : 0);
  const byId = (raw.byId && typeof raw.byId === 'object') ? raw.byId : raw;
  const levels = (raw.levels && typeof raw.levels === 'object') ? raw.levels : null;
  const pendingBag = (raw.pending && typeof raw.pending === 'object') ? raw.pending : null;
  const stockBag = (raw.stock && typeof raw.stock === 'object') ? raw.stock : null;
  const aliases = [id, canon].concat(Object.keys(BUILDING_ID_ALIASES).filter((k) => BUILDING_ID_ALIASES[k] === canon));
  let src = null;
  for (const key of aliases) {
    if (byId[key] && typeof byId[key] === 'object' && !Array.isArray(byId[key])) { src = byId[key]; break; }
  }
  if (!src) {
    for (const key of Object.keys(byId)) {
      if (buildingCanonId(key) !== canon) continue;
      if (byId[key] && typeof byId[key] === 'object' && !Array.isArray(byId[key])) { src = byId[key]; break; }
    }
  }
  const slot = emptyBuildingSlot(canon === BUILDING_STARTER_ID ? 1 : 0);
  if (src) {
    slot.level = buildingLevelOf(src);
    slot.pending = clamp(Number(src.pending) || 0, 0, 99999);
    slot.stock = clamp(Math.floor(Number(src.stock) || 0), 0, 99999);
    slot.lastCollectAt = clamp(Math.floor(Number(src.lastCollectAt) || 0), 0, 9e15);
  }
  if (levels) {
    for (const key of aliases) {
      if (levels[key] != null) { slot.level = clamp(Math.floor(Number(levels[key]) || 0), 0, BUILDING_LEVEL_MAX); break; }
    }
  }
  if (pendingBag) {
    for (const key of aliases) {
      if (pendingBag[key] != null) { slot.pending = clamp(Number(pendingBag[key]) || 0, 0, 99999); break; }
    }
  }
  if (stockBag) {
    for (const key of aliases) {
      if (stockBag[key] != null) { slot.stock = clamp(Math.floor(Number(stockBag[key]) || 0), 0, 99999); break; }
    }
  }
  return slot;
}

function sanitizeBuildingsBag(raw) {
  const out = emptyBuildingsBag();
  const src = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
  const now = Date.now();
  const last = Math.floor(Number(src.lastTickAt || src.lastTick || src.tickedAt) || 0);
  out.lastTickAt = (last > 0 && last <= now + 60000) ? last : 0;
  out.schema = BUILDINGS_SCHEMA;
  const ids = BUILDING_FACTORY_IDS;
  const hadAny = !!(src.byId || src.levels || src.stick_lighter || src.dojo || src.chipping_wood);
  for (const id of ids) {
    const slot = readBuildingSlotLoose(src, id);
    const cap = buildingPendingCap(id, slot.level);
    const stockCap = (BUILDING_RESOURCE[id] && BUILDING_RESOURCE[id].stockCap) || 0;
    slot.pending = clamp(Number(slot.pending) || 0, 0, cap || 0);
    slot.stock = clamp(Math.floor(Number(slot.stock) || 0), 0, stockCap || 0);
    if (!hadAny && id === BUILDING_STARTER_ID && slot.level < 1) slot.level = 1;
    out.byId[id] = slot;
  }
  return out;
}

function buildingPowerBonus(s) {
  const out = emptyBuildingPowerBonus();
  const bag = (s && s.buildings) || (typeof save !== 'undefined' ? save.buildings : null);
  if (!bag || typeof bag !== 'object') return out;
  for (const id of BUILDING_FACTORY_IDS) {
    const slot = (bag.byId && bag.byId[id]) || bag[id];
    const lv = buildingLevelOf(slot);
    const p = buildingPowerForLevel(id, lv);
    if (p.dmgMul) out.dmgMul *= p.dmgMul;
    if (p.speedMul) out.speedMul *= p.speedMul;
    if (p.energyMul) out.energyMul *= p.energyMul;
    if (p.techniqueMul) out.techniqueMul *= p.techniqueMul;
    if (p.critBonus) out.critBonus += p.critBonus;
    if (p.maxHp) out.maxHp += p.maxHp;
    if (p.shieldWave) out.shieldWave += p.shieldWave;
    if (p.defMul) out.defMul *= p.defMul;
    if (p.healBetween) out.healBetween += p.healBetween;
  }
  out.dmgMul = clamp(out.dmgMul, 1, 1.12);
  out.speedMul = clamp(out.speedMul, 1, 1.06);
  out.energyMul = clamp(out.energyMul, 1, 1.16);
  out.techniqueMul = clamp(out.techniqueMul, 1, 1.08);
  out.critBonus = clamp(out.critBonus, 0, 0.05);
  out.maxHp = clamp(Math.round(out.maxHp), 0, 20);
  out.shieldWave = clamp(out.shieldWave, 0, 2.2);
  out.defMul = clamp(out.defMul, 0.92, 1);
  out.healBetween = clamp(out.healBetween, 0, 0.04);
  return out;
}

function applyBuildingPowersToPlayer(game, player) {
  if (!game || !player) return;
  const b = buildingPowerBonus();
  game.buildingDmgMul = b.dmgMul || 1;
  game.buildingEnergyMul = b.energyMul || 1;
  game.buildingTechniqueMul = b.techniqueMul || 1;
  game.buildingCritBonus = b.critBonus || 0;
  game.buildingShieldWave = b.shieldWave || 0;
  game.buildingDefMul = b.defMul || 1;
  game.buildingHealBetween = b.healBetween || 0;
  if (b.maxHp) {
    player.maxhp += b.maxHp;
    player.hp += b.maxHp;
  }
  if (b.dmgMul && b.dmgMul !== 1) {
    player.baseDmg = Math.round(player.baseDmg * b.dmgMul);
  }
  if (b.speedMul && b.speedMul !== 1) {
    player.speed = Math.round(player.speed * b.speedMul);
  }
}

function applyBuildingToSpec(fighter, spec) {
  if (!spec || !fighter || !fighter.isPlayer) return spec;
  if (typeof game === 'undefined' || !game) return spec;
  if (game.buildingTechniqueMul && game.buildingTechniqueMul !== 1 && spec.kind === 'special') {
    spec.dmg = Math.round(spec.dmg * game.buildingTechniqueMul);
  }
  return spec;
}

function _accrueSlot(id, slot, hours) {
  if (!slot || hours <= 0) return 0;
  const rate = buildingRatePerHour(id, slot.level);
  if (rate <= 0) return 0;
  const cap = buildingPendingCap(id, slot.level);
  const before = Number(slot.pending) || 0;
  const next = clamp(before + rate * hours, 0, cap);
  slot.pending = Math.round(next * 1000) / 1000;
  return slot.pending - before;
}

function tickBuildingResources(nowMs, opts) {
  opts = opts || {};
  if (typeof save === 'undefined' || !save) return { added: 0, hours: 0 };
  const bag = ensureBuildingsBag(save);
  const clean = sanitizeBuildingsBag(bag);
  save.buildings = clean;
  const now = Math.floor(Number(nowMs) || Date.now());
  if (!(now > 0)) return { added: 0, hours: 0 };
  let last = Math.floor(Number(clean.lastTickAt) || 0);
  if (last <= 0) {
    clean.lastTickAt = now;
    if (!opts.skipPersist && typeof persist === 'function') persist();
    return { added: 0, hours: 0, primed: true };
  }
  if (now < last) {
    clean.lastTickAt = now;
    if (!opts.skipPersist && typeof persist === 'function') persist();
    return { added: 0, hours: 0, rollback: true };
  }
  let delta = now - last;
  if (delta > BUILDING_OFFLINE_MAX_MS) delta = BUILDING_OFFLINE_MAX_MS;
  const hours = delta / 3600000;
  if (hours < 1 / 3600 && !opts.force) return { added: 0, hours: 0 };
  let added = 0;
  for (const id of BUILDING_FACTORY_IDS) {
    added += _accrueSlot(id, clean.byId[id], hours);
  }
  clean.lastTickAt = now;
  if (!opts.skipPersist && typeof persist === 'function') persist();
  return { added, hours };
}

function collectBuildingResource(id, opts) {
  opts = opts || {};
  const canon = buildingCanonId(id);
  if (!canon || typeof save === 'undefined' || !save) return { ok: false, amount: 0 };
  tickBuildingResources(Date.now(), { skipPersist: true });
  const slot = buildingSlot(canon, save);
  const res = buildingResourceDef(canon);
  const amount = Math.floor(Number(slot.pending) || 0);
  if (amount < 1) return { ok: false, amount: 0, resource: res && res.id, id: canon };
  const stockCap = (res && res.stockCap) || 0;
  const room = Math.max(0, stockCap - (slot.stock || 0));
  const take = Math.min(amount, room);
  if (take < 1) return { ok: false, amount: 0, capped: true, resource: res && res.id, id: canon };
  slot.pending = Math.round(((Number(slot.pending) || 0) - take) * 1000) / 1000;
  slot.stock = (slot.stock || 0) + take;
  slot.lastCollectAt = Date.now();
  if (!opts.skipPersist && typeof persist === 'function') persist();
  if (!opts.silent && typeof userToast === 'function') {
    const name = buildingLabel(canon);
    const resName = buildingResourceLabel(canon);
    userToast(
      (typeof tOr === 'function')
        ? tOr('buildings.collected', '+{n} {res} · {name}', { n: take, res: resName, name })
        : ('+' + take + ' ' + resName + ' · ' + name),
      2400,
      { tone: 'ok' }
    );
  }
  return { ok: true, amount: take, resource: res && res.id, id: canon, stock: slot.stock, pending: slot.pending };
}

function collectAllBuildingResources(opts) {
  opts = opts || {};
  const got = [];
  for (const id of BUILDING_FACTORY_IDS) {
    const r = collectBuildingResource(id, { silent: true, skipPersist: true });
    if (r && r.ok && r.amount > 0) got.push(r);
  }
  if (!opts.skipPersist && typeof persist === 'function') persist();
  const total = got.reduce((n, r) => n + r.amount, 0);
  if (!opts.silent && total > 0 && typeof userToast === 'function') {
    userToast(
      (typeof tOr === 'function')
        ? tOr('buildings.collectedAll', 'Oogst +{n} uit {k} gebouwen', { n: total, k: got.length })
        : ('Oogst +' + total + ' uit ' + got.length + ' gebouwen'),
      2600,
      { tone: 'ok' }
    );
  }
  return { ok: total > 0, amount: total, parts: got };
}

function setBuildingLevel(id, level, opts) {
  opts = opts || {};
  const canon = buildingCanonId(id);
  if (!canon || typeof save === 'undefined' || !save) return 0;
  const slot = buildingSlot(canon, save);
  slot.level = clamp(Math.floor(Number(level) || 0), 0, BUILDING_LEVEL_MAX);
  const cap = buildingPendingCap(canon, slot.level);
  slot.pending = clamp(Number(slot.pending) || 0, 0, cap);
  if (!opts.skipPersist && typeof persist === 'function') persist();
  return slot.level;
}

function buildingLabel(id) {
  const meta = buildingMeta(id);
  const canon = buildingCanonId(id) || id;
  if (typeof tOr === 'function') return tOr('buildings.' + canon + '.name', meta.name);
  return meta.name;
}

function buildingResourceLabel(id) {
  const res = buildingResourceDef(id);
  const rid = res ? res.id : 'loot';
  if (typeof tOr === 'function') return tOr('buildings.res.' + rid, rid);
  return rid;
}

function buildingPowerLine(id, level) {
  const p = buildingPowerForLevel(id, level);
  const parts = [];
  if (p.dmgMul && p.dmgMul !== 1) parts.push('DMG ×' + p.dmgMul.toFixed(2));
  if (p.speedMul && p.speedMul !== 1) parts.push('SPD ×' + p.speedMul.toFixed(2));
  if (p.energyMul && p.energyMul !== 1) parts.push('EN ×' + p.energyMul.toFixed(2));
  if (p.techniqueMul && p.techniqueMul !== 1) parts.push('TECH ×' + p.techniqueMul.toFixed(2));
  if (p.critBonus) parts.push('+' + Math.round(p.critBonus * 100) + '% crit');
  if (p.maxHp) parts.push('+' + p.maxHp + ' HP');
  if (p.shieldWave) parts.push('+' + p.shieldWave.toFixed(2) + 's shield/golf');
  if (p.defMul && p.defMul !== 1) parts.push('DEF ×' + p.defMul.toFixed(2));
  if (p.healBetween) parts.push('+' + Math.round(p.healBetween * 100) + '% heal/golf');
  return parts.join(' · ') || '—';
}

function buildingState(id, s) {
  const canon = buildingCanonId(id);
  if (!canon) return null;
  const slot = buildingSlot(canon, s);
  const res = buildingResourceDef(canon);
  const lv = buildingLevelOf(slot);
  return {
    id: canon,
    name: buildingLabel(canon),
    accent: buildingMeta(canon).accent,
    level: lv,
    pending: Number(slot.pending) || 0,
    pendingFloor: Math.floor(Number(slot.pending) || 0),
    pendingCap: buildingPendingCap(canon, lv),
    stock: slot.stock || 0,
    stockCap: (res && res.stockCap) || 0,
    resource: res && res.id,
    resourceName: buildingResourceLabel(canon),
    ratePerHour: buildingRatePerHour(canon, lv),
    powerLine: buildingPowerLine(canon, lv),
    lastCollectAt: slot.lastCollectAt || 0,
    collectable: Math.floor(Number(slot.pending) || 0) >= 1,
  };
}

function buildingTooltipModel(id) {
  const st = buildingState(id);
  if (!st) return { title: '', lines: [] };
  return {
    title: st.name + ' Lv ' + st.level,
    lines: [
      st.powerLine,
      st.resourceName + ' ' + st.pendingFloor + '/' + Math.floor(st.pendingCap) + ' · ' + st.ratePerHour + '/u',
      'Voorraad ' + st.stock + '/' + st.stockCap,
    ],
  };
}

function buildingsHudModel() {
  return BUILDING_FACTORY_IDS.map((id) => buildingState(id));
}
