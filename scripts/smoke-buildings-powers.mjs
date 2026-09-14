#!/usr/bin/env node
/**
 * Buildings powers + timed resources — schema, tick, collect, combat apply.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
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
['menuScreen', 'game', 'toastHost', 'btnAdventure'].forEach(getEl);
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

run('save = sanitizeSave(Object.assign({}, DEFAULT_SAVE))');
assert(run('save.buildings && save.buildings.schema === 1'), 'sanitize seeds bag');
assert(run('save.buildings.byId.stick_lighter.level === 1'), 'starter stick_lighter Lv1');
assert(run('save.buildings.byId.woodchip_glue.level === 0'), 'glue locked at 0');
assert(run('buildingRatePerHour("stick_lighter", 1) === 10'), 'lighter lv1 = 10/h');
assert(run('buildingRatePerHour("woodchip_glue", 0) === 0'), 'lv0 produces nothing');
assert(run('buildingPendingCap("stick_lighter", 1) === 40'), 'lighter pending cap 4h × 10');
assert(run('buildingPowerBonus().critBonus === 0.01'), 'starter lighter +1% crit');
assert(run('buildingPowerBonus().dmgMul === 1'), 'starter does not touch DMG');
assert(run('buildingPowerBonus().maxHp === 0'), 'no boiler HP at lv0');

run(`
  save.buildings = sanitizeBuildingsBag({
    schema: 1,
    lastTickAt: 1,
    levels: { stick_lighter: 5, woodchip_glue: 5, chipping_wood: 5, bamboo_boesa: 5, echo_whistle: 5 },
    pending: { chipping_wood: 9999 },
    stock: { chipping_wood: 9999 },
  });
`);
assert(run('save.buildings.byId.chipping_wood.level === 5'), 'systems levels bag accepted');
assert(run('save.buildings.byId.chipping_wood.pending <= 112.001'), 'pending capped at 4h of lv5 chips rate');
assert(run('save.buildings.byId.chipping_wood.stock === 240'), 'chips stock capped');
assert(run('buildingRatePerHour("chipping_wood", 5) === 28'), 'chips lv5 = 28/h');

const bonus = run('JSON.stringify(buildingPowerBonus())');
const b = JSON.parse(bonus);
assert(b.dmgMul > 1.07 && b.dmgMul <= 1.12, 'stacked dmg within cap, got ' + b.dmgMul);
assert(b.critBonus >= 0.029 && b.critBonus <= 0.05, 'lighter crit, got ' + b.critBonus);
assert(b.maxHp === 12, 'boiler +12 HP');
assert(b.energyMul >= 1.09 && b.energyMul <= 1.16, 'whistle energy, got ' + b.energyMul);
assert(b.healBetween > 0, 'boiler adventure heal');
assert(b.defMul < 1 && b.defMul >= 0.92, 'glue def, got ' + b.defMul);

run(`
  save.buildings = sanitizeBuildingsBag({
    lastTickAt: 1_700_000_000_000,
    byId: {
      stick_lighter: { level: 1, pending: 0, stock: 0 },
      woodchip_glue: { level: 1, pending: 0, stock: 0 },
      chipping_wood: { level: 1, pending: 0, stock: 0 },
      bamboo_boesa: { level: 1, pending: 0, stock: 0 },
      echo_whistle: { level: 1, pending: 0, stock: 0 },
    },
  });
`);
const t0 = 1_700_000_000_000;
const oneHour = run('tickBuildingResources(' + (t0 + 3600000) + ', { skipPersist: true })');
assert(oneHour && oneHour.hours > 0.99 && oneHour.hours < 1.01, '1h delta');
assert(run('Math.floor(save.buildings.byId.stick_lighter.pending) === 10'), 'lighter +10 after 1h');
assert(run('Math.floor(save.buildings.byId.chipping_wood.pending) === 12'), 'chips +12 after 1h');

run('tickBuildingResources(' + (t0 + 3600000 + 20 * 3600000) + ', { skipPersist: true })');
assert(run('save.buildings.byId.stick_lighter.pending <= 40.001'), 'pending cap after long online tick');

run(`
  save.buildings.lastTickAt = 1_700_000_000_000;
  save.buildings.byId.chipping_wood.pending = 0;
`);
run('tickBuildingResources(' + (t0 + 72 * 3600000) + ', { skipPersist: true })');
assert(run('save.buildings.byId.chipping_wood.pending <= 48.001'), 'offline 72h still pending-capped');

run(`
  const _now = Date.now();
  save.buildings.lastTickAt = _now + 30000;
  save.buildings.byId.stick_lighter.pending = 5;
  globalThis.__rb = tickBuildingResources(_now, { skipPersist: true });
`);
assert(run('globalThis.__rb && globalThis.__rb.rollback'), 'clock rollback flagged');
assert(run('save.buildings.byId.stick_lighter.pending === 5'), 'rollback does not refund');

run(`
  save.buildings = sanitizeBuildingsBag({
    lastTickAt: Date.now(),
    byId: { stick_lighter: { level: 1, pending: 20.8, stock: 190 } },
  });
`);
const col = run('collectBuildingResource("stick_lighter", { silent: true, skipPersist: true })');
assert(col && col.ok && col.amount === 10, 'collect fills remaining stock room, got ' + (col && col.amount));
assert(run('save.buildings.byId.stick_lighter.stock === 200'), 'stock at cap after collect');
assert(run('Math.floor(save.buildings.byId.stick_lighter.pending) === 10'), 'remainder stays pending');

run(`
  save.buildings.byId.stick_lighter.pending = 0.4;
  save.buildings.byId.stick_lighter.stock = 0;
`);
const empty = run('collectBuildingResource("stick_lighter", { silent: true, skipPersist: true })');
assert(empty && !empty.ok, 'sub-1 pending is not collectable');

run(`
  save.buildings = sanitizeBuildingsBag({
    constructor: { level: 9 },
    __proto__: { level: 9 },
    byId: { __proto__: { level: 9 }, stick_lighter: { level: "max", pending: Infinity, stock: -4 } },
  });
`);
assert(run('save.buildings.byId.stick_lighter.level >= 0 && save.buildings.byId.stick_lighter.level <= 10'), 'corrupt level clamped');
assert(run('Number.isFinite(save.buildings.byId.stick_lighter.pending)'), 'pending finite');

run(`
  save.buildings = sanitizeBuildingsBag({ chipping_wood: { lv: 3, pending: 2 }, "stick-lighter": { level: 2 } });
`);
assert(run('save.buildings.byId.chipping_wood.level === 3'), 'flat lv');
assert(run('save.buildings.byId.stick_lighter.level === 2'), 'kebab alias');

run(`
  save.buildings = sanitizeBuildingsBag({
    byId: { chipping_wood: { level: 5 }, stick_lighter: { level: 0 }, woodchip_glue: { level: 0 }, bamboo_boesa: { level: 0 }, echo_whistle: { level: 0 } },
  });
  globalThis.__player = { maxhp: 100, hp: 100, baseDmg: 10, speed: 260 };
  globalThis.__game = {};
  applyBuildingPowersToPlayer(globalThis.__game, globalThis.__player);
`);
assert(run('globalThis.__player.baseDmg === 11'), 'chipping_wood lv5 ×1.06 → 11 dmg');
assert(run('globalThis.__player.maxhp === 100'), 'no boiler HP');
assert(run('globalThis.__game.buildingDmgMul === 1.06'), 'game dmg mul set');
assert(run('globalThis.__game.buildingCritBonus === 0'), 'no lighter crit');

run(`
  save.buildings = sanitizeBuildingsBag({
    byId: { stick_lighter: { level: 0 }, woodchip_glue: { level: 0 }, chipping_wood: { level: 0 }, bamboo_boesa: { level: 0 }, echo_whistle: { level: 0 } },
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
assert(run('buildingCanonId("bamboo-boesa-boiler") === "bamboo_boesa"'), 'long pixel boiler');
assert(run('buildingCanonId("echo-whistle-mill") === "echo_whistle"'), 'long pixel mill');
assert(run('buildingCanonId("dojo") === "chipping_wood"'), 'legacy dojo alias');

const ids = run('BUILDING_FACTORY_IDS.join(",")');
assert(ids === 'stick_lighter,woodchip_glue,chipping_wood,bamboo_boesa,echo_whistle', 'locked systems ids');

console.log('SMOKE_OK buildings-powers · 5 factories · starter stick_lighter Lv1 · offline delta · caps · collect · powers');
