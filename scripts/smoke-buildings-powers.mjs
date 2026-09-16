#!/usr/bin/env node
/**
 * Buildings powers — bind to #292 schema/ids (factories/wallet, spark/chip/echo).
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const code = fs.readFileSync(path.join(root, 'game.js'), 'utf8');

function makeEl(id) {
  return {
    id, tagName: 'DIV', classList: { s: new Set(), add() {}, remove() {}, toggle() {}, contains: () => false },
    style: {}, hidden: false, dataset: {}, disabled: false, textContent: '', innerHTML: '', value: '',
    children: [], parentElement: null, closest() { return this; },
    addEventListener() {}, removeEventListener() {}, appendChild() {}, remove() {}, focus() {}, select() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 40 }; },
    setAttribute() {}, removeAttribute() {}, getAttribute() { return null; },
    getContext() {
      return new Proxy({}, { get: (_t, p) => (p === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => undefined) });
    },
  };
}

const byId = new Map();
const getEl = (id) => { if (!byId.has(id)) byId.set(id, makeEl(id)); return byId.get(id); };
['menuScreen', 'game', 'toastHost', 'btnAdventure', 'buildingsScreen', 'buildingsWallet'].forEach(getEl);
getEl('menuScreen').classList.s.add('active');

const ctx = {
  document: {
    getElementById: getEl,
    querySelector: () => null,
    querySelectorAll: () => [],
    body: getEl('body'),
    createElement: (t) => makeEl(t),
    addEventListener() {},
    dispatchEvent() {},
    hidden: false,
  },
  addEventListener() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  innerWidth: 390, innerHeight: 844, devicePixelRatio: 2,
  requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  setInterval: () => 0, clearInterval() {},
  setTimeout: (fn) => { try { fn(); } catch (_) {} return 0; },
  clearTimeout() {},
  performance: { now: () => 0 },
  Date,
  console,
  location: { href: 'https://example.com/', hostname: 'example.com', protocol: 'https:', search: '', pathname: '/', origin: 'https://example.com' },
  navigator: { onLine: true, userAgent: 'node', maxTouchPoints: 0, platform: 'Linux', vibrate() {} },
  localStorage: { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = String(v); }, removeItem(k) { delete this.store[k]; } },
  sfTunnelBoot: Promise.resolve(),
  dispatchEvent() {},
  AudioContext: class {
    constructor() { this.state = 'running'; this.destination = {}; this.currentTime = 0; this.sampleRate = 44100; }
    createGain() { return { connect() { return this; }, gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
    createOscillator() { return { connect() { return this; }, start() {}, stop() {}, type: 'sine', frequency: { value: 440, setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
    createBuffer() { return { getChannelData: () => new Float32Array(8) }; }
    createBufferSource() { return { connect() { return this; }, start() {}, buffer: null }; }
    createBiquadFilter() { return { connect() { return this; }, type: '', frequency: { value: 0 } }; }
    resume() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
  },
};
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx; ctx.webkitAudioContext = ctx.AudioContext;

const sandbox = vm.createContext(ctx);
vm.runInContext(code, sandbox, { filename: 'game.js' });
const run = (src) => vm.runInContext(src, sandbox);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(run('typeof tickBuildingResources === "function"'), 'tickBuildingResources defined');
assert(run('typeof collectBuildingResource === "function"'), 'collectBuildingResource defined');
assert(run('typeof applyBuildingPowersToPlayer === "function"'), 'applyBuildingPowersToPlayer defined');
assert(run('BUILDING_FACTORY_IDS.length === 5'), 'five factories');
assert(run('BUILDINGS_SCHEMA === 1'), 'schema 1');

const locked = run('BUILDING_FACTORY_IDS.join(",")');
assert(locked === 'stick_lighter,woodchip_glue,chipping_wood,bamboo_boesa,echo_whistle', 'locked #292 ids, got ' + locked);

run('save = sanitizeSave(Object.assign({}, DEFAULT_SAVE))');
assert(run('save.buildings && save.buildings.schema === 1'), 'sanitize seeds bag');
assert(run('save.buildings.factories && save.buildings.wallet'), '#292 factories/wallet');
assert(run('!(save.buildings.byId)'), 'no parallel byId bag');
assert(run('!save.buildings.factories.stick_lighter || save.buildings.factories.stick_lighter.level === 0'), 'no auto starter');

assert(run('buildingRatePerHour("stick_lighter", 1) === 8'), 'lighter lv1 = 8/h (#292)');
assert(run('buildingRatePerHour("woodchip_glue", 1) === 6'), 'glue lv1 = 6/h');
assert(run('buildingRatePerHour("chipping_wood", 1) === 10'), 'chip lv1 = 10/h');
assert(run('buildingRatePerHour("bamboo_boesa", 1) === 7'), 'steam lv1 = 7/h');
assert(run('buildingRatePerHour("echo_whistle", 1) === 5'), 'echo lv1 = 5/h');
assert(run('buildingRatePerHour("woodchip_glue", 0) === 0'), 'lv0 produces nothing');
assert(run('buildingPendingCap("stick_lighter", 1) === 64'), '8h × 8 spark');
assert(run('buildingRatePerHour("chipping_wood", 5) === 22'), 'chip lv5 = 22/h');
assert(run('buildingPendingCap("chipping_wood", 5) === 176'), 'chip lv5 cap 8h × 22');

run(`
  save.buildings = sanitizeBuildingsBag({
    factories: { stick_lighter: { level: 1, lastTickAt: 0, stored: 0 } },
    wallet: {},
  });
`);
assert(run('save.buildings.factories.stick_lighter.level === 1'), 'built lighter');
assert(run('buildingPowerBonus().critBonus === 0.02'), 'lv1 lighter +2% crit');
assert(run('buildingPowerBonus().dmgMul === 1'), 'starter rank 0 does not touch DMG');
assert(run('buildingPowerBonus().maxHp === 0'), 'no boiler HP at lv0');
assert(run('buildingPowerIdentity("stick_lighter").powerId === "spark_kindle"'), 'rank 0 identity spark_kindle');

run(`
  save.buildings = sanitizeBuildingsBag({
    schema: 1,
    lastTickAt: 1,
    levels: { stick_lighter: 5, woodchip_glue: 5, chipping_wood: 5, bamboo_boesa_boiler: 5, echo_whistle_mill: 5 },
    pending: { chipping_wood: 9999 },
    stock: { chipping_wood: 9999 },
  });
`);
assert(run('save.buildings.factories.chipping_wood.level === 5'), 'systems levels bag accepted');
assert(run('save.buildings.factories.bamboo_boesa.level === 5'), 'boiler alias → bamboo_boesa');
assert(run('save.buildings.factories.echo_whistle.level === 5'), 'mill alias → echo_whistle');
assert(run('save.buildings.factories.chipping_wood.stored <= 176'), 'stored capped at 8h of lv5 chip rate');
assert(run('save.buildings.wallet.chip === 9999 || save.buildings.wallet.chip > 0'), 'stock → wallet.chip');
assert(run('!save.buildings.wallet.chips'), 'no plural chips key');

const bonus = run('JSON.stringify(buildingPowerBonus())');
const b = JSON.parse(bonus);
assert(b.dmgMul > 1.10 && b.dmgMul <= 1.18, 'stacked dmg within cap, got ' + b.dmgMul);
assert(b.critBonus >= 0.059 && b.critBonus <= 0.10, 'lighter crit, got ' + b.critBonus);
assert(b.maxHp === 18, 'boiler +18 HP at lv5');
assert(b.energyMul >= 1.13 && b.energyMul <= 1.24, 'whistle energy, got ' + b.energyMul);
assert(b.healBetween > 0, 'boiler adventure heal');
assert(b.defMul < 1 && b.defMul >= 0.88, 'glue def, got ' + b.defMul);
assert(b.powers && b.powers.indexOf('ember_pocket') >= 0, 'lv5 lighter identity ember_pocket');
assert(b.powers && b.powers.indexOf('sawdust_cloud') >= 0, 'lv5 chipper identity sawdust_cloud');

const t0 = 1_700_000_000_000;
run(`
  save.buildings = sanitizeBuildingsBag({
    factories: {
      stick_lighter: { level: 1, lastTickAt: ${t0}, stored: 0 },
      woodchip_glue: { level: 1, lastTickAt: ${t0}, stored: 0 },
      chipping_wood: { level: 1, lastTickAt: ${t0}, stored: 0 },
      bamboo_boesa: { level: 1, lastTickAt: ${t0}, stored: 0 },
      echo_whistle: { level: 1, lastTickAt: ${t0}, stored: 0 },
    },
    wallet: {},
  });
`);
run('tickBuildingResources(' + (t0 + 3600000) + ', { skipPersist: true })');
assert(run('save.buildings.factories.stick_lighter.stored === 8'), 'lighter +8 spark after 1h');
assert(run('save.buildings.factories.chipping_wood.stored === 10'), 'chip +10 after 1h');

run('tickBuildingResources(' + (t0 + 3600000 + 20 * 3600000) + ', { skipPersist: true })');
assert(run('save.buildings.factories.stick_lighter.stored <= 64'), '8h hopper cap after long tick');

run(`
  save.buildings.factories.chipping_wood.lastTickAt = ${t0};
  save.buildings.factories.chipping_wood.stored = 0;
`);
run('tickBuildingResources(' + (t0 + 72 * 3600000) + ', { skipPersist: true })');
assert(run('save.buildings.factories.chipping_wood.stored <= 80'), 'offline 72h still 8h-capped');

run(`
  save.buildings.factories.stick_lighter.lastTickAt = Date.now() + 30000;
  save.buildings.factories.stick_lighter.stored = 5;
  tickBuildingResources(Date.now(), { skipPersist: true });
`);
assert(run('save.buildings.factories.stick_lighter.stored === 5'), 'rollback does not refund');

run(`
  save.buildings = sanitizeBuildingsBag({
    factories: { stick_lighter: { level: 1, lastTickAt: Date.now(), stored: 20 } },
    wallet: { spark: 4 },
  });
`);
const col = run('collectBuildingResource("stick_lighter", { silent: true, skipPersist: true })');
assert(col && col.ok && col.amount === 20, 'collect hopper → wallet, got ' + (col && col.amount));
assert(run('save.buildings.factories.stick_lighter.stored === 0'), 'hopper emptied');
assert(run('save.buildings.wallet.spark === 24'), 'wallet.spark 4+20');
assert(col.resourceId === 'spark' || col.resource === 'spark', 'resource id spark');

run(`
  save.buildings.factories.stick_lighter.stored = 0.4;
`);
const empty = run('collectBuildingResource("stick_lighter", { silent: true, skipPersist: true })');
assert(empty && !empty.ok, 'sub-1 stored is not collectable');

run(`
  save.buildings = sanitizeBuildingsBag({
    constructor: { level: 9 },
    __proto__: { level: 9 },
    byId: { __proto__: { level: 9 }, stick_lighter: { level: "max", pending: Infinity, stock: -4 } },
  });
`);
assert(run('!save.buildings.factories.stick_lighter || (save.buildings.factories.stick_lighter.level >= 0 && save.buildings.factories.stick_lighter.level <= 10)'), 'corrupt level clamped');
assert(run('!save.buildings.factories.stick_lighter || Number.isFinite(save.buildings.factories.stick_lighter.stored)'), 'stored finite');

run(`
  save.buildings = sanitizeBuildingsBag({ chipping_wood: { lv: 3, pending: 2 }, "stick-lighter": { level: 2 } });
`);
assert(run('save.buildings.factories.chipping_wood.level === 3'), 'flat lv');
assert(run('save.buildings.factories.stick_lighter.level === 2'), 'kebab alias');

run(`
  save.buildings = sanitizeBuildingsBag({
    byId: {
      chipping_wood: { level: 5, pending: 3, stock: 7 },
      stick_lighter: { level: 0 },
      woodchip_glue: { level: 0 },
      bamboo_boesa_boiler: { level: 0 },
      echo_whistle_mill: { level: 0 },
    },
  });
  globalThis.__player = { maxhp: 100, hp: 100, baseDmg: 10, speed: 260 };
  globalThis.__game = {};
  applyBuildingPowersToPlayer(globalThis.__game, globalThis.__player);
`);
assert(run('globalThis.__player.baseDmg === 11'), 'chipping_wood lv5 ×1.12 → 11 dmg');
assert(run('globalThis.__player.maxhp === 100'), 'no boiler HP');
assert(run('globalThis.__game.buildingDmgMul === 1.12'), 'game dmg mul set');
assert(run('globalThis.__game.buildingCritBonus === 0'), 'no lighter crit');
assert(run('save.buildings.wallet.chip === 7'), 'legacy stock → wallet.chip');
assert(run('save.buildings.factories.chipping_wood.stored === 3'), 'legacy pending → stored');

run(`
  save.buildings = sanitizeBuildingsBag({
    factories: {
      stick_lighter: { level: 0 }, woodchip_glue: { level: 0 }, chipping_wood: { level: 0 },
      bamboo_boesa: { level: 0 }, echo_whistle: { level: 0 },
    },
  });
  globalThis.__player2 = { maxhp: 100, hp: 100, baseDmg: 10, speed: 260 };
  globalThis.__game2 = {};
  applyBuildingPowersToPlayer(globalThis.__game2, globalThis.__player2);
`);
assert(run('globalThis.__player2.baseDmg === 10 && globalThis.__player2.maxhp === 100'), 'all-zero buildings do not change combat');

assert(run('buildingCanonId("stick_lighter") === "stick_lighter"'), 'locked stick_lighter');
assert(run('buildingCanonId("woodchip_glue") === "woodchip_glue"'), 'locked woodchip_glue');
assert(run('buildingCanonId("chipping_wood") === "chipping_wood"'), 'locked chipping_wood');
assert(run('buildingCanonId("bamboo_boesa") === "bamboo_boesa"'), 'locked bamboo_boesa');
assert(run('buildingCanonId("echo_whistle") === "echo_whistle"'), 'locked echo_whistle');
assert(run('buildingCanonId("bamboo_boesa_boiler") === "bamboo_boesa"'), 'boiler alias');
assert(run('buildingCanonId("echo_whistle_mill") === "echo_whistle"'), 'mill alias');
assert(run('buildingCanonId("bamboo-boesa-boiler") === "bamboo_boesa"'), 'kebab boiler');
assert(run('buildingCanonId("echo-whistle-mill") === "echo_whistle"'), 'kebab mill');

run(`
  save.buildings = sanitizeBuildingsBag({
    wallet: { embers: 5, chips: 3, echoes: 2, glue: 1 },
    byId: { bamboo_boesa_boiler: { level: 4, pending: 3, stock: 7 } },
  });
`);
assert(run('save.buildings.factories.bamboo_boesa.level === 4'), 'legacy boiler bag migrates');
assert(run('save.buildings.wallet.spark === 5'), 'embers → spark');
assert(run('save.buildings.wallet.chip === 3'), 'chips → chip');
assert(run('save.buildings.wallet.echo === 2'), 'echoes → echo');
assert(run('save.buildings.wallet.steam === 7'), 'boiler stock → steam');

run(`
  globalThis.__tickCalls = 0;
  globalThis.__collectCalls = 0;
  const _prevTick = globalThis.buildingTickAll;
  const _prevCollect = globalThis.buildingCollect;
  globalThis.buildingTickAll = function (st, now) {
    globalThis.__tickCalls++;
    globalThis.__tickNow = now;
    return true;
  };
  globalThis.buildingCollect = function (id, st) {
    globalThis.__collectCalls++;
    return { ok: true, amount: 3, resourceId: 'spark', buildingId: id };
  };
  globalThis.__via = tickBuildingResources(Date.now(), { skipPersist: true });
  globalThis.__colVia = collectBuildingResource('stick_lighter', { silent: true, skipPersist: true });
  globalThis.buildingTickAll = _prevTick;
  globalThis.buildingCollect = _prevCollect;
`);
assert(run('globalThis.__tickCalls === 1'), 'tick delegates to buildingTickAll');
assert(run('globalThis.__collectCalls === 1'), 'collect delegates to buildingCollect');
assert(run('globalThis.__colVia && globalThis.__colVia.amount === 3'), 'systems collect amount surfaced');

let systemsCode = '';
try {
  systemsCode = execSync('git show origin/cursor/buildings-catalog-1419:src/data/buildings.js', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
} catch (_) {
  systemsCode = '';
}

if (systemsCode.includes('const BUILDING_IDS')) {
  try {
    vm.runInContext(systemsCode, sandbox, { filename: 'buildings-systems.js' });
  } catch (err) {
    console.log('systems overlay skipped:', err && err.message);
    systemsCode = '';
  }
}
if (systemsCode && run('typeof buildingBuild === "function" && typeof BUILDING_IDS !== "undefined"')) {
  assert(run('BUILDING_IDS.join(",") === "stick_lighter,woodchip_glue,chipping_wood,bamboo_boesa,echo_whistle"'), 'live #292 BUILDING_IDS');
  assert(run('buildingResourceIds.join(",") === "spark,glue,chip,steam,echo"'), 'live #292 wallet keys');
  assert(run('buildingPowerRank(5) === 2'), 'systems rank lv5 = 2');
  assert(run('buildingPowerRank(1) === 0'), 'systems rank lv1 = 0');
  assert(run('buildingPowerRank(0) === -1'), 'systems rank unbuilt = -1');
  run(`
    save = { unlocked: 70, petCoins: 9999, buildings: { schema: 1, factories: {}, wallet: {} } };
    sanitizeBuildingSave(save);
    buildingBuild('stick_lighter', save);
    setBuildingLevel('stick_lighter', 1, { skipPersist: true });
    save.buildings.factories.stick_lighter.lastTickAt = ${t0};
    save.buildings.factories.stick_lighter.stored = 0;
    buildingTickAll(save, ${t0 + 3600000});
  `);
  assert(run('save.buildings.factories.stick_lighter.stored === 8'), 'systems 1h tick 8 spark');
  run(`
    globalThis.__sysCol = buildingCollect('stick_lighter', save);
    globalThis.__p = { maxhp: 100, hp: 100, baseDmg: 10, speed: 260 };
    globalThis.__g = { save: save };
    applyBuildingPowersToPlayer(globalThis.__g, globalThis.__p);
  `);
  assert(run('globalThis.__sysCol && globalThis.__sysCol.resourceId === "spark"'), 'systems collect spark');
  assert(run('save.buildings.wallet.spark >= 8'), 'systems collect filled wallet');
  assert(run('globalThis.__g.buildingCritBonus === 0.02'), 'powers apply against systems bag');
  assert(run('globalThis.__p.baseDmg === 10'), 'lv1 lighter does not change DMG');
}

run(`
  save.buildings = sanitizeBuildingsBag({
    factories: { stick_lighter: { level: 1, lastTickAt: ${t0}, stored: 0 } },
    wallet: {},
  });
  tickBuildingResources(${t0 + 30 * 60 * 1000}, { skipPersist: true });
`);
assert(run('Math.abs(save.buildings.factories.stick_lighter.stored - 4) < 1e-6'), '30min lighter = 4 spark (half hour)');

run(`
  save.buildings = sanitizeBuildingsBag({
    factories: { echo_whistle: { level: 5, lastTickAt: ${t0}, stored: 0 } },
    wallet: {},
  });
  tickBuildingResources(${t0 + 10 * 60 * 1000}, { skipPersist: true });
`);
assert(run('save.buildings.factories.echo_whistle.stored > 1 && save.buildings.factories.echo_whistle.stored < 2'), '10min echo lv5 keeps fractional hopper');

run(`
  save.buildings = sanitizeBuildingsBag({
    factories: { stick_lighter: { level: 1, lastTickAt: Date.now(), stored: 9 } },
    wallet: { spark: 1 },
  });
  globalThis.__c1 = collectBuildingResource('stick_lighter', { silent: true, skipPersist: true });
  globalThis.__c2 = collectBuildingResource('stick_lighter', { silent: true, skipPersist: true });
`);
assert(run('globalThis.__c1 && globalThis.__c1.ok && globalThis.__c1.amount === 9'), 'first collect pays once');
assert(run('globalThis.__c2 && !globalThis.__c2.ok && globalThis.__c2.amount === 0'), 'second collect does not double-pay');
assert(run('save.buildings.wallet.spark === 10'), 'wallet credited once');

run(`
  const raw = {
    wallet: { spark: 5, embers: 5, glue: 2 },
    factories: { stick_lighter: { level: 2, lastTickAt: 9, stored: 1 } },
  };
  save.buildings = sanitizeBuildingsBag(raw);
  const once = JSON.stringify(save.buildings);
  save.buildings = sanitizeBuildingsBag(save.buildings);
  globalThis.__idempoWallet = save.buildings.wallet.spark;
  globalThis.__idempoSame = JSON.stringify(save.buildings) === once;
`);
assert(run('globalThis.__idempoWallet === 5'), 'embers+spark migrate with max, not sum');
assert(run('globalThis.__idempoSame === true'), 'sanitize is idempotent');

assert(run('typeof applyBuildingCombatHook === "function" && typeof tickBuildingCombat === "function"'), 'combat identity hooks exported');
run(`
  save.buildings = sanitizeBuildingsBag({
    factories: {
      stick_lighter: { level: 9 }, woodchip_glue: { level: 9 }, chipping_wood: { level: 9 },
      bamboo_boesa: { level: 9 }, echo_whistle: { level: 9 },
    },
  });
  globalThis.__full = buildingPowerBonus();
  globalThis.__gVs = { mode: 'versus' };
  globalThis.__pVs = { maxhp: 100, hp: 100, baseDmg: 10, speed: 260 };
  applyBuildingPowersToPlayer(globalThis.__gVs, globalThis.__pVs);
  applyBuildingCombatHook({ mode: 'versus', player: { alive: true } }, 'onWeaponHit', { target: { alive: true, x: 0, y: 0 } });
`);
assert(run('globalThis.__full.dmgMul === 1.18 && globalThis.__full.critBonus === 0.10 && globalThis.__full.maxHp === 36'), 'rank 4 caps');
assert(run('globalThis.__full.powers.indexOf("matchstick_storm") >= 0 && globalThis.__full.powers.indexOf("whistle_chorus") >= 0'), 'rank 4 identities');
assert(run('globalThis.__pVs.baseDmg === 10 && globalThis.__pVs.maxhp === 100'), 'versus apply is a no-op');

console.log('SMOKE_OK buildings-powers · 5 factories · #292 bag · spark/chip/echo · 8h cap · collect→wallet · identities 0–4');
