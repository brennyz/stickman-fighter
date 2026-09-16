/* Stickman Fighter — buildings powers + timed resources (4 of 4)
 * Binds to systems catalog (#292 / docs/BUILDINGS.md). Mega-merge only.
 *
 * IIFE so mega-merge with src/data/buildings.js does not redeclare const
 * BUILDINGS_SCHEMA / BUILDING_IDS / buildingLevel / …
 *
 * Schema / ids (FINAL — exact match systems):
 *   save.buildings = { schema: 1, factories: { [id]: { level, lastTickAt, stored } }, wallet }
 *   ids: stick_lighter, woodchip_glue, chipping_wood, bamboo_boesa, echo_whistle
 *   wallet: spark, glue, chip, steam, echo
 *
 * Combat apply is this lane. Tick / collect / 8h cap prefer buildingTickAll /
 * buildingCollect / sanitizeBuildingSave when those exist.
 */
(function (root) {
  'use strict';

  var SCHEMA = 1;
  var MAX_LEVEL = 10;
  var OFFLINE_HOURS = 8;
  var MS_PER_HOUR = 3600000;
  var WALLET_CAP = 99999;
  var STORED_ABS = 9999;
  var POWER_LEVELS = [1, 3, 5, 7, 9];

  var CANON_IDS = ['stick_lighter', 'woodchip_glue', 'chipping_wood', 'bamboo_boesa', 'echo_whistle'];
  var WALLET_KEYS = ['spark', 'glue', 'chip', 'steam', 'echo'];

  var START_RATE = {
    stick_lighter: 8,
    woodchip_glue: 6,
    chipping_wood: 10,
    bamboo_boesa: 7,
    echo_whistle: 5
  };

  var ALIAS_TO_CANON = {
    dojo: 'stick_lighter',
    forge: 'stick_lighter',
    smith: 'stick_lighter',
    tower: 'woodchip_glue',
    barracks: 'woodchip_glue',
    garden: 'chipping_wood',
    hall: 'chipping_wood',
    kitchen: 'bamboo_boesa',
    farm: 'bamboo_boesa',
    shrine: 'echo_whistle',
    well: 'echo_whistle',
    'stick-lighter-factory': 'stick_lighter',
    'woodchip-glue-factory': 'woodchip_glue',
    'chipping-wood-factory': 'chipping_wood',
    'bamboo-boesa-boiler': 'bamboo_boesa',
    'echo-whistle-mill': 'echo_whistle',
    sticklighter: 'stick_lighter',
    woodchipglue: 'woodchip_glue',
    chippingwood: 'chipping_wood',
    bambooboesa: 'bamboo_boesa',
    echowhistle: 'echo_whistle',
    stick_lighter_factory: 'stick_lighter',
    woodchip_glue_factory: 'woodchip_glue',
    chipping_wood_factory: 'chipping_wood',
    bamboo_boesa_boiler: 'bamboo_boesa',
    echo_whistle_mill: 'echo_whistle',
    stick_lighter: 'stick_lighter',
    woodchip_glue: 'woodchip_glue',
    chipping_wood: 'chipping_wood',
    bamboo_boesa: 'bamboo_boesa',
    echo_whistle: 'echo_whistle'
  };

  var WALLET_ALIAS = {
    embers: 'spark',
    ember_sticks: 'spark',
    chips: 'chip',
    wood_chips: 'chip',
    echoes: 'echo',
    echo_notes: 'echo',
    glue_pots: 'glue',
    boesa_steam: 'steam',
    spark: 'spark',
    glue: 'glue',
    chip: 'chip',
    steam: 'steam',
    echo: 'echo'
  };

  /* Rank 0–4 at Lv 1/3/5/7/9. Identity per factory — catalog power ids + sane caps. */
  var POWER_BY_RANK = {
    stick_lighter: [
      { id: 'spark_kindle', critBonus: 0.02 },
      { id: 'kindle_trail', critBonus: 0.04 },
      { id: 'ember_pocket', critBonus: 0.06 },
      { id: 'flare_step', critBonus: 0.08 },
      { id: 'matchstick_storm', critBonus: 0.10 }
    ],
    woodchip_glue: [
      { id: 'sticky_soles', shieldWave: 0.55, kbMul: 0.78 },
      { id: 'tacky_block', shieldWave: 0.90, kbMul: 0.78, blockMul: 0.72 },
      { id: 'glue_trap', shieldWave: 1.25, kbMul: 0.72, blockMul: 0.72, defMul: 0.95 },
      { id: 'paste_armor', shieldWave: 1.80, kbMul: 0.72, blockMul: 0.68, defMul: 0.92 },
      { id: 'chip_golem', shieldWave: 2.40, kbMul: 0.68, blockMul: 0.64, defMul: 0.88 }
    ],
    chipping_wood: [
      { id: 'splinter_edge', dmgMul: 1.04 },
      { id: 'chip_spray', dmgMul: 1.08 },
      { id: 'sawdust_cloud', dmgMul: 1.12, speedMul: 1.04 },
      { id: 'hopper_guard', dmgMul: 1.15, speedMul: 1.07 },
      { id: 'chipper_fury', dmgMul: 1.18, speedMul: 1.10 }
    ],
    bamboo_boesa: [
      { id: 'boiler_hiss', maxHp: 6 },
      { id: 'bamboo_vent', maxHp: 12 },
      { id: 'bamboo_burst', maxHp: 18, healBetween: 0.04 },
      { id: 'pressure_cook', maxHp: 26, healBetween: 0.06 },
      { id: 'boesa_overheat', maxHp: 36, healBetween: 0.08 }
    ],
    echo_whistle: [
      { id: 'taunt_toot', energyMul: 1.06 },
      { id: 'mill_heckle', energyMul: 1.10 },
      { id: 'echo_ridge', energyMul: 1.14, techniqueMul: 1.08 },
      { id: 'ridge_reply', energyMul: 1.18, techniqueMul: 1.12 },
      { id: 'whistle_chorus', energyMul: 1.24, techniqueMul: 1.16 }
    ]
  };

  var POWER_CAPS = {
    dmgMul: 1.18,
    speedMul: 1.10,
    energyMul: 1.24,
    techniqueMul: 1.16,
    critBonus: 0.10,
    maxHp: 36,
    shieldWave: 2.4,
    defMul: 0.88,
    healBetween: 0.08,
    kbMul: 0.68,
    blockMul: 0.64
  };

  function hasSystems() {
    return typeof root.BUILDING_BY_ID === 'object' && root.BUILDING_BY_ID
      && typeof root.BUILDING_IDS !== 'undefined' && root.BUILDING_IDS && root.BUILDING_IDS.length;
  }

  function buildingIds() {
    if (hasSystems()) return root.BUILDING_IDS;
    return CANON_IDS;
  }

  function clampNum(n, lo, hi) {
    n = Number(n);
    if (!Number.isFinite(n)) n = 0;
    if (n < lo) return lo;
    if (n > hi) return hi;
    return n;
  }

  function clampInt(n, lo, hi) {
    return clampNum(Math.round(Number(n) || 0), lo, hi);
  }

  function systemsCanonId(id) {
    if (hasSystems() && typeof root.buildingCanonId === 'function' && root.buildingCanonId !== canonId) {
      try {
        var c = root.buildingCanonId(id);
        if (c) return c;
      } catch (e) { /* fall */ }
    }
    return null;
  }

  function canonId(id) {
    if (typeof id !== 'string' || !id) return null;
    var sys = systemsCanonId(id);
    if (sys && (CANON_IDS.indexOf(sys) >= 0 || (hasSystems() && root.BUILDING_BY_ID[sys]))) return sys;
    var raw = id.replace(/[^a-z0-9_]/gi, '').toLowerCase();
    if (!raw || raw === '__proto__' || raw === 'constructor' || raw === 'prototype') return null;
    if (ALIAS_TO_CANON[id]) return ALIAS_TO_CANON[id];
    if (ALIAS_TO_CANON[raw]) return ALIAS_TO_CANON[raw];
    if (CANON_IDS.indexOf(id) >= 0) return id;
    if (CANON_IDS.indexOf(raw) >= 0) return raw;
    return null;
  }

  function canonRes(id) {
    if (typeof id !== 'string' || !id) return '';
    if (typeof root.buildingCanonRes === 'function') {
      try {
        var c = root.buildingCanonRes(id);
        if (c) return c;
      } catch (e) { /* fall */ }
    }
    return WALLET_ALIAS[id] || (WALLET_KEYS.indexOf(id) >= 0 ? id : '');
  }

  function resourceOf(id) {
    var def = hasSystems() ? root.BUILDING_BY_ID[id] : null;
    if (def && (def.resourceId || (def.resource && def.resource.id))) {
      return def.resourceId || def.resource.id;
    }
    var idx = CANON_IDS.indexOf(id);
    return idx >= 0 ? WALLET_KEYS[idx] : '';
  }

  function rateCapAt(id, level) {
    var lv = clampInt(level, 0, MAX_LEVEL);
    if (lv < 1) return { perHour: 0, cap: 0 };
    if (hasSystems() && typeof root.buildingOutputAtLevel === 'function' && root.BUILDING_BY_ID[id]) {
      try {
        return root.buildingOutputAtLevel(root.BUILDING_BY_ID[id], lv);
      } catch (e) { /* fall */ }
    }
    var start = START_RATE[id];
    if (start == null) return { perHour: 0, cap: 0 };
    var r = start;
    var rate = 0;
    for (var i = 0; i < lv; i++) {
      rate = Math.max(1, Math.round(r));
      r *= 1.22;
    }
    return { perHour: rate, cap: rate * OFFLINE_HOURS };
  }

  function emptySite() {
    return { level: 0, lastTickAt: 0, stored: 0 };
  }

  function emptyWallet() {
    return { spark: 0, glue: 0, chip: 0, steam: 0, echo: 0 };
  }

  function emptyBag() {
    return { schema: SCHEMA, factories: {}, wallet: {} };
  }

  function powerRankOfLevel(level) {
    var lv = clampInt(level, 0, MAX_LEVEL);
    if (lv < 1) return -1;
    return Math.min(4, Math.floor((lv - 1) / 2));
  }

  function migrateLegacy(raw) {
    var factories = {};
    var wallet = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { factories: factories, wallet: wallet };
    }

    function addSite(id, row) {
      if (!id || !row || typeof row !== 'object') return;
      var prev = factories[id] || emptySite();
      var level = Math.max(prev.level, clampInt(row.level != null ? row.level : row.lv, 0, MAX_LEVEL));
      var storedIn = Number(row.stored != null ? row.stored : row.pending);
      var stored = Math.max(prev.stored, (Number.isFinite(storedIn) && storedIn > 0) ? storedIn : 0);
      var last = Math.max(prev.lastTickAt, Math.floor(Number(row.lastTickAt) || 0));
      factories[id] = { level: level, lastTickAt: last, stored: stored };
      var stock = Math.max(0, Math.floor(Number(row.stock) || 0));
      var res = resourceOf(id);
      if (res && stock) wallet[res] = (wallet[res] || 0) + stock;
    }

    var facIn = (raw.factories && typeof raw.factories === 'object' && !Array.isArray(raw.factories))
      ? raw.factories
      : (raw.byId && typeof raw.byId === 'object' && !Array.isArray(raw.byId) ? raw.byId : null);
    if (facIn) {
      Object.keys(facIn).forEach(function (k) {
        addSite(canonId(k), facIn[k]);
      });
    }

    var levels = raw.levels;
    if (levels && typeof levels === 'object' && !Array.isArray(levels)) {
      Object.keys(levels).forEach(function (k) {
        var id = canonId(k);
        if (!id) return;
        var prev = factories[id] || emptySite();
        prev.level = Math.max(prev.level, clampInt(levels[k], 0, MAX_LEVEL));
        factories[id] = prev;
      });
    }

    var pending = raw.pending;
    if (pending && typeof pending === 'object' && !Array.isArray(pending)) {
      Object.keys(pending).forEach(function (k) {
        var id = canonId(k);
        if (!id) return;
        var prev = factories[id] || emptySite();
        prev.stored = Math.max(prev.stored, Math.max(0, Math.floor(Number(pending[k]) || 0)));
        factories[id] = prev;
      });
    }

    var stockMap = raw.stock;
    if (stockMap && typeof stockMap === 'object' && !Array.isArray(stockMap)) {
      Object.keys(stockMap).forEach(function (k) {
        var id = canonId(k);
        var res = resourceOf(id);
        var n = Math.max(0, Math.floor(Number(stockMap[k]) || 0));
        if (res && n) wallet[res] = (wallet[res] || 0) + n;
      });
    }

    if (!facIn) {
      Object.keys(raw).forEach(function (k) {
        if (k === 'schema' || k === 'factories' || k === 'wallet' || k === 'byId'
          || k === 'levels' || k === 'pending' || k === 'stock' || k === 'lastTickAt') return;
        var id = canonId(k);
        if (id && raw[k] && typeof raw[k] === 'object') addSite(id, raw[k]);
      });
    }

    var bagLast = Math.floor(Number(raw.lastTickAt) || 0);
    if (bagLast > 0) {
      Object.keys(factories).forEach(function (id) {
        if (!factories[id].lastTickAt) factories[id].lastTickAt = bagLast;
      });
    }

    var walIn = (raw.wallet && typeof raw.wallet === 'object' && !Array.isArray(raw.wallet)) ? raw.wallet : raw;
    Object.keys(walIn).forEach(function (k) {
      var dest = canonRes(k);
      var n = Math.floor(Number(walIn[k]) || 0);
      if (dest && n > 0) wallet[dest] = Math.max(wallet[dest] || 0, n);
    });

    return { factories: factories, wallet: wallet };
  }

  function clampBag(migrated) {
    var bag = emptyBag();
    var ids = buildingIds();
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var entry = (migrated.factories && migrated.factories[id]) || {};
      var lv = clampInt(entry.level, 0, MAX_LEVEL);
      var out = rateCapAt(id, lv);
      var storedRaw = Number(entry.stored);
      var stored = 0;
      if (lv >= 1 && Number.isFinite(storedRaw) && storedRaw > 0) {
        stored = clampNum(Math.round(storedRaw * 1000) / 1000, 0, out.cap || STORED_ABS);
      }
      var last = Math.floor(Number(entry.lastTickAt) || 0);
      if (last < 0 || last > 4102444800000) last = 0;
      if (lv <= 0 && stored <= 0 && last <= 0) continue;
      bag.factories[id] = { level: lv, lastTickAt: last, stored: stored };
    }
    for (var j = 0; j < WALLET_KEYS.length; j++) {
      var res = WALLET_KEYS[j];
      var n = clampInt((migrated.wallet && migrated.wallet[res]) || 0, 0, WALLET_CAP);
      if (n > 0) bag.wallet[res] = n;
    }
    return bag;
  }

  function sanitizeBuildingsBag(raw) {
    var migrated = migrateLegacy(raw);
    if (typeof root.sanitizeBuildingSave === 'function') {
      try {
        var tmp = { buildings: { schema: SCHEMA, factories: migrated.factories, wallet: migrated.wallet } };
        root.sanitizeBuildingSave(tmp);
        if (tmp.buildings && tmp.buildings.factories) return tmp.buildings;
      } catch (e) { /* fall through */ }
    }
    return clampBag(migrated);
  }

  function ensureBag(saveObj) {
    if (!saveObj || typeof saveObj !== 'object') return emptyBag();
    saveObj.buildings = sanitizeBuildingsBag(saveObj.buildings);
    return saveObj.buildings;
  }

  function siteOf(saveObj, id) {
    var bag = ensureBag(saveObj);
    if (!bag.factories[id]) bag.factories[id] = emptySite();
    return bag.factories[id];
  }

  function factoryLevel(id, saveObj) {
    var canon = canonId(id);
    if (!canon) return 0;
    if (typeof root.buildingLevel === 'function' && hasSystems()) {
      try { return root.buildingLevel(canon, saveObj); } catch (e) { /* fall */ }
    }
    var bag = (saveObj && saveObj.buildings) || (typeof save !== 'undefined' ? save.buildings : null);
    if (!bag || typeof bag !== 'object') return 0;
    if (bag.factories && bag.factories[canon]) return clampInt(bag.factories[canon].level, 0, MAX_LEVEL);
    if (bag.byId && bag.byId[canon]) return clampInt(bag.byId[canon].level, 0, MAX_LEVEL);
    return 0;
  }

  function powerRank(idOrLevel, saveObj) {
    if (typeof root.buildingPowerRank === 'function' && hasSystems()) {
      try { return root.buildingPowerRank(idOrLevel, saveObj); } catch (e) { /* fall */ }
    }
    if (typeof idOrLevel === 'number') return powerRankOfLevel(idOrLevel);
    return powerRankOfLevel(factoryLevel(idOrLevel, saveObj));
  }

  function emptyBonus() {
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
      kbMul: 1,
      blockMul: 1,
      powers: [],
      ranks: {}
    };
  }

  function powerForRank(id, rank) {
    var table = POWER_BY_RANK[id];
    if (!table || rank < 0) return {};
    return table[Math.min(rank, table.length - 1)] || {};
  }

  function buildingPowerBonus(s) {
    var out = emptyBonus();
    var saveObj = s || (typeof save !== 'undefined' ? save : null);
    var ids = buildingIds();
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var rank = powerRank(id, saveObj);
      out.ranks[id] = rank;
      var p = powerForRank(id, rank);
      if (p.dmgMul) out.dmgMul *= p.dmgMul;
      if (p.speedMul) out.speedMul *= p.speedMul;
      if (p.energyMul) out.energyMul *= p.energyMul;
      if (p.techniqueMul) out.techniqueMul *= p.techniqueMul;
      if (p.critBonus) out.critBonus += p.critBonus;
      if (p.maxHp) out.maxHp += p.maxHp;
      if (p.shieldWave) out.shieldWave += p.shieldWave;
      if (p.defMul) out.defMul *= p.defMul;
      if (p.healBetween) out.healBetween += p.healBetween;
      if (p.kbMul) out.kbMul *= p.kbMul;
      if (p.blockMul) out.blockMul *= p.blockMul;
      if (p.id) out.powers.push(p.id);
    }
    out.dmgMul = clampNum(out.dmgMul, 1, POWER_CAPS.dmgMul);
    out.speedMul = clampNum(out.speedMul, 1, POWER_CAPS.speedMul);
    out.energyMul = clampNum(out.energyMul, 1, POWER_CAPS.energyMul);
    out.techniqueMul = clampNum(out.techniqueMul, 1, POWER_CAPS.techniqueMul);
    out.critBonus = clampNum(out.critBonus, 0, POWER_CAPS.critBonus);
    out.maxHp = clampInt(out.maxHp, 0, POWER_CAPS.maxHp);
    out.shieldWave = clampNum(out.shieldWave, 0, POWER_CAPS.shieldWave);
    out.defMul = clampNum(out.defMul, POWER_CAPS.defMul, 1);
    out.healBetween = clampNum(out.healBetween, 0, POWER_CAPS.healBetween);
    out.kbMul = clampNum(out.kbMul, POWER_CAPS.kbMul, 1);
    out.blockMul = clampNum(out.blockMul, POWER_CAPS.blockMul, 1);
    return out;
  }

  function applyBuildingPowersToPlayer(game, player) {
    if (!game || !player) return;
    if (game.mode === 'versus') return;
    var b = buildingPowerBonus(game.save || (typeof save !== 'undefined' ? save : null));
    game.buildingDmgMul = b.dmgMul || 1;
    game.buildingEnergyMul = b.energyMul || 1;
    game.buildingTechniqueMul = b.techniqueMul || 1;
    game.buildingCritBonus = b.critBonus || 0;
    game.buildingShieldWave = b.shieldWave || 0;
    game.buildingDefMul = b.defMul || 1;
    game.buildingHealBetween = b.healBetween || 0;
    game.buildingKbMul = b.kbMul || 1;
    game.buildingBlockMul = b.blockMul || 1;
    game.buildingPowerRanks = b.ranks;
    game.buildingPowerIds = b.powers || [];
    game.buildingSawdustT = 0;
    if (typeof resetBuildingCombatWave === 'function') {
      try { resetBuildingCombatWave(game); } catch (e0) { /* ignore */ }
    }
    if (b.maxHp) {
      if (player.maxhp != null) {
        player.maxhp += b.maxHp;
        player.hp += b.maxHp;
      } else if (player.maxHp != null) {
        player.maxHp += b.maxHp;
        if (player.hp > 0) player.hp = Math.min(player.maxHp, (player.hp || 0) + b.maxHp);
      }
    }
    if (b.dmgMul && b.dmgMul !== 1) {
      if (player.baseDmg != null) player.baseDmg = Math.round(player.baseDmg * b.dmgMul);
      else if (player.dmg != null) player.dmg = Math.max(1, Math.round(player.dmg * b.dmgMul));
    }
    if (b.speedMul && b.speedMul !== 1 && player.speed != null) {
      player.speed = Math.round(player.speed * b.speedMul);
    }
  }

  function applyBuildingToSpec(fighter, spec) {
    if (!spec || !fighter || !fighter.isPlayer) return spec;
    var g = (typeof game !== 'undefined') ? game : null;
    if (!g || g.mode === 'versus') return spec;
    if (g.buildingTechniqueMul && g.buildingTechniqueMul !== 1 && spec.kind === 'special' && spec.dmg != null) {
      spec.dmg = Math.round(spec.dmg * g.buildingTechniqueMul);
    }
    return spec;
  }

  function storedFloor(n) {
    var v = Number(n);
    if (!Number.isFinite(v) || v < 0) return 0;
    return Math.floor(v + 1e-9);
  }

  function tickOneLocal(id, row, now) {
    if (!row || row.level < 1) {
      if (row) row.lastTickAt = now;
      return 0;
    }
    var out = rateCapAt(id, row.level);
    if (!out.perHour || !out.cap) return 0;
    var last = Math.floor(Number(row.lastTickAt) || 0);
    if (last <= 0 || last > now) {
      row.lastTickAt = now;
      return 0;
    }
    var elapsed = Math.min(now - last, OFFLINE_HOURS * MS_PER_HOUR);
    if (elapsed <= 0) return 0;
    var stored = clampNum(Number(row.stored) || 0, 0, out.cap);
    if (stored >= out.cap) {
      row.lastTickAt = now;
      row.stored = out.cap;
      return 0;
    }
    var units = (elapsed / MS_PER_HOUR) * out.perHour;
    if (!(units > 0)) return 0;
    var before = stored;
    row.stored = clampNum(stored + units, 0, out.cap);
    row.lastTickAt = now;
    if (row.stored >= out.cap) {
      row.stored = out.cap;
      row.lastTickAt = now;
    }
    return row.stored - before;
  }

  function tickLocal(saveObj, now) {
    var bag = ensureBag(saveObj);
    var added = 0;
    var ids = buildingIds();
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      if (!bag.factories[id]) continue;
      added += tickOneLocal(id, bag.factories[id], now);
    }
    return added;
  }

  function tickBuildingResources(nowMs, opts) {
    opts = opts || {};
    if (typeof save === 'undefined' || !save) return { added: 0, hours: 0 };
    ensureBag(save);
    var now = Math.floor(Number(nowMs) || Date.now());
    if (!(now > 0)) return { added: 0, hours: 0 };
    if (typeof root.buildingTickAll === 'function') {
      var changed = false;
      try { changed = !!root.buildingTickAll(save, now); } catch (e) { changed = false; }
      if (changed && !opts.skipPersist && typeof persist === 'function') persist();
      return { added: changed ? 1 : 0, hours: 0, via: 'systems' };
    }
    var added = tickLocal(save, now);
    if (added && !opts.skipPersist && typeof persist === 'function') persist();
    return { added: added, hours: added ? 1 : 0 };
  }

  function collectBuildingResource(id, opts) {
    opts = opts || {};
    var canon = canonId(id);
    if (!canon || typeof save === 'undefined' || !save) return { ok: false, amount: 0 };
    if (typeof root.buildingCollect === 'function') {
      try {
        var sys = root.buildingCollect(canon, save);
        if (sys && typeof sys === 'object') {
          return {
            ok: !!sys.ok && (sys.amount || 0) > 0,
            amount: sys.amount || 0,
            resource: sys.resourceId,
            resourceId: sys.resourceId,
            id: sys.buildingId || canon,
            buildingId: sys.buildingId || canon
          };
        }
      } catch (e) { /* fall */ }
    }
    var row = siteOf(save, canon);
    if (row._collectLock) return { ok: false, amount: 0, resource: resourceOf(canon), resourceId: resourceOf(canon), id: canon };
    row._collectLock = true;
    try {
      tickBuildingResources(Date.now(), { skipPersist: true });
      row = siteOf(save, canon);
      var amount = storedFloor(row.stored);
      var res = resourceOf(canon);
      if (amount < 1) return { ok: false, amount: 0, resource: res, resourceId: res, id: canon };
      row.stored = 0;
      row.lastTickAt = Date.now();
      save.buildings.wallet[res] = clampInt((save.buildings.wallet[res] || 0) + amount, 0, WALLET_CAP);
      if (!opts.skipPersist && typeof persist === 'function') persist();
      if (!opts.silent && typeof userToast === 'function') {
        var name = (typeof root.buildingLabel === 'function') ? root.buildingLabel(canon) : canon;
        var resName = (typeof root.buildingResourceLabel === 'function') ? root.buildingResourceLabel(res) : res;
        userToast(
          (typeof tOr === 'function')
            ? tOr('buildings.collected', '+{n} {res} · {name}', { n: amount, res: resName, name: name })
            : ('+' + amount + ' ' + resName + ' · ' + name),
          2400,
          { tone: 'ok' }
        );
      }
      return { ok: true, amount: amount, resource: res, resourceId: res, id: canon, buildingId: canon };
    } finally {
      row._collectLock = false;
    }
  }

  function collectAllBuildingResources(opts) {
    opts = opts || {};
    var got = [];
    var ids = buildingIds();
    for (var i = 0; i < ids.length; i++) {
      var r = collectBuildingResource(ids[i], { silent: true, skipPersist: true });
      if (r && r.ok && r.amount > 0) got.push(r);
    }
    if (!opts.skipPersist && typeof persist === 'function') persist();
    var total = got.reduce(function (n, r) { return n + r.amount; }, 0);
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
    var canon = canonId(id);
    if (!canon || typeof save === 'undefined' || !save) return 0;
    var row = siteOf(save, canon);
    row.level = clampInt(level, 0, MAX_LEVEL);
    var cap = rateCapAt(canon, row.level).cap;
    row.stored = clampInt(row.stored, 0, cap || 0);
    if (row.level >= 1 && !row.lastTickAt) row.lastTickAt = Date.now();
    if (row.level < 1) {
      row.stored = 0;
      row.lastTickAt = 0;
    }
    if (!opts.skipPersist && typeof persist === 'function') persist();
    return row.level;
  }

  function buildingRatePerHour(id, level) {
    var canon = canonId(id);
    if (!canon) return 0;
    var lv = (level == null) ? factoryLevel(canon) : level;
    return rateCapAt(canon, lv).perHour;
  }

  function buildingPendingCap(id, level) {
    var canon = canonId(id);
    if (!canon) return 0;
    var lv = (level == null) ? factoryLevel(canon) : level;
    return rateCapAt(canon, lv).cap;
  }

  function buildingWalletOf(resId, saveObj) {
    if (typeof root.buildingWallet === 'function' && hasSystems()) {
      try { return root.buildingWallet(resId, saveObj); } catch (e) { /* fall */ }
    }
    var bag = ensureBag(saveObj || (typeof save !== 'undefined' ? save : { buildings: emptyBag() }));
    if (resId == null || resId === '') {
      var all = emptyWallet();
      for (var i = 0; i < WALLET_KEYS.length; i++) {
        var k = WALLET_KEYS[i];
        all[k] = clampInt(bag.wallet[k] || 0, 0, WALLET_CAP);
      }
      return all;
    }
    var dest = canonRes(resId);
    return clampInt(bag.wallet[dest] || 0, 0, WALLET_CAP);
  }

  function buildingState(id) {
    var canon = canonId(id);
    if (!canon) return null;
    if (typeof root.buildingTooltipModel === 'function' && hasSystems()) {
      try {
        var m = root.buildingTooltipModel(canon, typeof save !== 'undefined' ? save : null);
        if (m) {
          return {
            id: m.id,
            name: m.name,
            level: m.level,
            pending: m.pending,
            pendingFloor: Math.floor(m.pending || 0),
            pendingCap: m.storageCap,
            stock: m.wallet,
            stockCap: WALLET_CAP,
            resource: m.resourceId,
            resourceName: m.resourceName,
            ratePerHour: m.outputRate,
            collectable: !!m.canCollect,
            powerRank: m.powerRank
          };
        }
      } catch (e) { /* fall */ }
    }
    var saveObj = (typeof save !== 'undefined') ? save : null;
    var lv = factoryLevel(canon, saveObj);
    var row = saveObj ? siteOf(saveObj, canon) : emptySite();
    var out = rateCapAt(canon, lv);
    return {
      id: canon,
      name: canon,
      level: lv,
      pending: row.stored || 0,
      pendingFloor: Math.floor(row.stored || 0),
      pendingCap: out.cap,
      stock: buildingWalletOf(resourceOf(canon), saveObj),
      stockCap: WALLET_CAP,
      resource: resourceOf(canon),
      resourceName: resourceOf(canon),
      ratePerHour: out.perHour,
      collectable: storedFloor(row.stored) >= 1,
      powerRank: powerRankOfLevel(lv)
    };
  }

  function buildingsHudModel() {
    return buildingIds().map(buildingState);
  }

  function localTooltip(id) {
    var st = buildingState(id);
    if (!st) return { title: '', lines: [] };
    return {
      title: st.name + ' Lv ' + st.level,
      lines: [
        'rank ' + st.powerRank,
        st.resourceName + ' ' + st.pendingFloor + '/' + Math.floor(st.pendingCap) + ' · ' + st.ratePerHour + '/u',
        'wallet ' + st.stock
      ]
    };
  }

  function ratesDoc() {
    return buildingIds().map(function (id) {
      return {
        id: id,
        resource: resourceOf(id),
        perHourLv1: buildingRatePerHour(id, 1),
        perHourLv10: buildingRatePerHour(id, 10),
        capHours: OFFLINE_HOURS,
        powerLevels: POWER_LEVELS.slice()
      };
    });
  }

  /* Public bind — never clobber systems names that already exist. */
  function setFree(name, value) {
    if (typeof root[name] === 'undefined') root[name] = value;
  }

  setFree('BUILDINGS_SCHEMA', SCHEMA);
  root.BUILDING_FACTORY_IDS = buildingIds().slice();
  root.BUILDING_POWER_IDS = CANON_IDS.slice();
  root.BUILDING_WALLET_KEYS = WALLET_KEYS.slice();
  root.BUILDING_POWER_LEVELS = POWER_LEVELS.slice();
  root.BUILDING_RESOURCE_CAP_MS = OFFLINE_HOURS * MS_PER_HOUR;
  root.BUILDING_POWER_TABLE = POWER_BY_RANK;
  root.BUILDING_POWER_CAPS = POWER_CAPS;

  function buildingPowerIdentity(id, saveObj) {
    var canon = canonId(id);
    if (!canon) return null;
    var rank = powerRank(canon, saveObj);
    var p = powerForRank(canon, rank);
    return { id: canon, rank: rank, powerId: p.id || null, bonus: p };
  }
  root.buildingPowerIdentity = buildingPowerIdentity;

  root.sanitizeBuildingsBag = sanitizeBuildingsBag;
  root.emptyBuildingsBag = emptyBag;
  root.ensureBuildingsBag = ensureBag;
  root.tickBuildingResources = tickBuildingResources;
  root.collectBuildingResource = collectBuildingResource;
  root.collectAllBuildingResources = collectAllBuildingResources;
  root.setBuildingLevel = setBuildingLevel;
  root.buildingRatePerHour = buildingRatePerHour;
  root.buildingPendingCap = buildingPendingCap;
  root.buildingPowerBonus = buildingPowerBonus;
  root.applyBuildingPowersToPlayer = applyBuildingPowersToPlayer;
  root.applyBuildingToSpec = applyBuildingToSpec;
  root.buildingState = buildingState;
  root.buildingsHudModel = buildingsHudModel;
  root.buildingRatesDoc = ratesDoc;
  root.buildingWalletOf = buildingWalletOf;

  setFree('buildingCanonId', canonId);
  setFree('buildingCatalogIds', buildingIds);

  if (typeof root.buildingTooltipModel !== 'function') {
    root.buildingTooltipModel = localTooltip;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      sanitizeBuildingsBag: sanitizeBuildingsBag,
      applyBuildingPowersToPlayer: applyBuildingPowersToPlayer,
      buildingPowerBonus: buildingPowerBonus
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
