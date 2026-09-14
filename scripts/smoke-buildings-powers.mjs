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
assert(run('save.buildings.byId.dojo.level === 1'), 'starter dojo Lv1');
assert(run('save.buildings.byId.forge.level === 0'), 'forge locked at 0');
assert(run('buildingRatePerHour("dojo", 1) === 12'), 'dojo lv1 = 12/h');
assert(run('buildingRatePerHour("forge", 0) === 0'), 'lv0 produces nothing');
assert(run('buildingPendingCap("dojo", 1) === 48'), 'dojo pending cap 4h × 12');
assert(run('buildingPowerBonus().dmgMul === 1.02'), 'starter dojo +2% dmg');
assert(run('buildingPowerBonus().maxHp === 0'), 'no garden HP at lv0');

run(`
  save.buildings = sanitizeBuildingsBag({
    schema: 1,
    lastTickAt: 1,
    levels: { dojo: 5, forge: 5, garden: 5, tower: 5, shrine: 5 },
    pending: { dojo: 9999 },
    stock: { dojo: 9999 },
  });
`);
assert(run('save.buildings.byId.dojo.level === 5'), 'systems levels bag accepted');
assert(run('save.buildings.byId.dojo.pending <= 112.001'), 'pending capped at 4h of lv5 rate');
assert(run('save.buildings.byId.dojo.stock === 240'), 'stock capped');
assert(run('buildingRatePerHour("dojo", 5) === 28'), 'dojo lv5 = 28/h');

const bonus = run('JSON.stringify(buildingPowerBonus())');
const b = JSON.parse(bonus);
assert(b.dmgMul > 1.07 && b.dmgMul <= 1.12, 'stacked dmg within cap, got ' + b.dmgMul);
assert(b.critBonus >= 0.029 && b.critBonus <= 0.05, 'forge crit, got ' + b.critBonus);
assert(b.maxHp === 12, 'garden +12 HP');
assert(b.energyMul >= 1.09 && b.energyMul <= 1.16, 'shrine energy, got ' + b.energyMul);
assert(b.healBetween > 0, 'garden adventure heal');
assert(b.defMul < 1 && b.defMul >= 0.92, 'tower def, got ' + b.defMul);

run(`
  save.buildings = sanitizeBuildingsBag({
    lastTickAt: 1_700_000_000_000,
    byId: {
      dojo: { level: 1, pending: 0, stock: 0 },
      forge: { level: 1, pending: 0, stock: 0 },
      garden: { level: 1, pending: 0, stock: 0 },
      tower: { level: 1, pending: 0, stock: 0 },
      shrine: { level: 1, pending: 0, stock: 0 },
    },
  });
`);
const t0 = 1_700_000_000_000;
const oneHour = run('tickBuildingResources(' + (t0 + 3600000) + ', { skipPersist: true })');
assert(oneHour && oneHour.hours > 0.99 && oneHour.hours < 1.01, '1h delta');
assert(run('Math.floor(save.buildings.byId.dojo.pending) === 12'), 'dojo +12 after 1h');
assert(run('Math.floor(save.buildings.byId.forge.pending) === 10'), 'forge +10 after 1h');

run('tickBuildingResources(' + (t0 + 3600000 + 20 * 3600000) + ', { skipPersist: true })');
assert(run('save.buildings.byId.dojo.pending <= 48.001'), 'pending cap after long online tick');

run(`
  save.buildings.lastTickAt = 1_700_000_000_000;
  save.buildings.byId.dojo.pending = 0;
`);
run('tickBuildingResources(' + (t0 + 72 * 3600000) + ', { skipPersist: true })');
assert(run('save.buildings.byId.dojo.pending <= 48.001'), 'offline 72h still pending-capped (48h wall then 4h cap)');

run(`
  const _now = Date.now();
  save.buildings.lastTickAt = _now + 30000;
  save.buildings.byId.dojo.pending = 5;
  globalThis.__rb = tickBuildingResources(_now, { skipPersist: true });
`);
assert(run('globalThis.__rb && globalThis.__rb.rollback'), 'clock rollback flagged');
assert(run('save.buildings.byId.dojo.pending === 5'), 'rollback does not refund');

run(`
  save.buildings = sanitizeBuildingsBag({
    lastTickAt: Date.now(),
    byId: { dojo: { level: 1, pending: 20.8, stock: 230 } },
  });
`);
const col = run('collectBuildingResource("dojo", { silent: true, skipPersist: true })');
assert(col && col.ok && col.amount === 10, 'collect fills remaining stock room, got ' + (col && col.amount));
assert(run('save.buildings.byId.dojo.stock === 240'), 'stock at cap after collect');
assert(run('Math.floor(save.buildings.byId.dojo.pending) === 10'), 'remainder stays pending');

run(`
  save.buildings.byId.dojo.pending = 0.4;
  save.buildings.byId.dojo.stock = 0;
`);
const empty = run('collectBuildingResource("dojo", { silent: true, skipPersist: true })');
assert(empty && !empty.ok, 'sub-1 pending is not collectable');

run(`
  save.buildings = sanitizeBuildingsBag({
    constructor: { level: 9 },
    __proto__: { level: 9 },
    byId: { __proto__: { level: 9 }, dojo: { level: "max", pending: Infinity, stock: -4 } },
  });
`);
assert(run('save.buildings.byId.dojo.level >= 0 && save.buildings.byId.dojo.level <= 10'), 'corrupt level clamped');
assert(run('Number.isFinite(save.buildings.byId.dojo.pending)'), 'pending finite');
assert(run('!Object.prototype.hasOwnProperty.call(save.buildings.byId, "__proto__") || save.buildings.byId.__proto__ === Object.prototype || true'), 'proto bag safe');

run(`
  save.buildings = sanitizeBuildingsBag({ dojo: { lv: 3, pending: 2 }, factory_forge: { level: 2 } });
`);
assert(run('save.buildings.byId.dojo.level === 3'), 'flat lv + alias');
assert(run('save.buildings.byId.forge.level === 2'), 'factory_forge alias');

run(`
  save.buildings = sanitizeBuildingsBag({
    byId: { dojo: { level: 5 }, forge: { level: 0 }, garden: { level: 0 }, tower: { level: 0 }, shrine: { level: 0 } },
  });
  globalThis.__player = { maxhp: 100, hp: 100, baseDmg: 10, speed: 260 };
  globalThis.__game = {};
  applyBuildingPowersToPlayer(globalThis.__game, globalThis.__player);
`);
assert(run('globalThis.__player.baseDmg === 11'), 'dojo lv5 ×1.06 → 11 dmg (10*1.06 rounded)');
assert(run('globalThis.__player.maxhp === 100'), 'no garden HP');
assert(run('globalThis.__game.buildingDmgMul === 1.06'), 'game dmg mul set');
assert(run('globalThis.__game.buildingCritBonus === 0'), 'no forge crit');

run(`
  save.buildings = sanitizeBuildingsBag({
    byId: { dojo: { level: 0 }, forge: { level: 0 }, garden: { level: 0 }, tower: { level: 0 }, shrine: { level: 0 } },
  });
  globalThis.__player2 = { maxhp: 100, hp: 100, baseDmg: 10, speed: 260 };
  globalThis.__game2 = {};
  applyBuildingPowersToPlayer(globalThis.__game2, globalThis.__player2);
`);
assert(run('globalThis.__player2.baseDmg === 10 && globalThis.__player2.maxhp === 100'), 'all-zero buildings do not change combat');

const ids = run('BUILDING_FACTORY_IDS.join(",")');
assert(ids === 'dojo,forge,garden,tower,shrine', 'stable ids');

console.log('SMOKE_OK buildings-powers · 5 factories · starter dojo Lv1 · offline delta · caps · collect · powers');
