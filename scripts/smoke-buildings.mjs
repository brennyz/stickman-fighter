#!/usr/bin/env node
/** Locked buildings bind: 5 factories, schema 1, island 1–5, lvl 10, rank. */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const code = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs/BUILDINGS.md'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function makeEl(id) {
  return {
    id, tagName: 'DIV', classList: { s: new Set(), add() {}, remove() {}, toggle() {}, contains: () => false },
    style: {}, hidden: false, dataset: {}, disabled: false, textContent: '', innerHTML: '', value: '',
    children: [], parentElement: null, closest() { return this; },
    addEventListener() {}, removeEventListener() {}, appendChild() {}, remove() {}, focus() {}, select() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    setAttribute() {}, removeAttribute() {}, getAttribute() { return null; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 40 }; },
    getContext() {
      return new Proxy({}, { get: (_t, p) => (p === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => undefined) });
    },
  };
}

const byId = new Map();
const getEl = (id) => { if (!byId.has(id)) byId.set(id, makeEl(id)); return byId.get(id); };
['menuScreen', 'game', 'toastHost', 'buildingsScreen', 'buildingsList', 'buildingsWallet'].forEach(getEl);
getEl('menuScreen').classList.s.add('active');

const ctx = {
  document: {
    getElementById: getEl, querySelector: () => null, querySelectorAll: () => [],
    body: getEl('body'), createElement: (t) => makeEl(t),
    addEventListener() {}, dispatchEvent() {},
  },
  addEventListener() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  innerWidth: 390, innerHeight: 844, devicePixelRatio: 2,
  requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  setInterval: () => 0, clearInterval() {},
  setTimeout: (fn) => { try { fn(); } catch (_) {} return 0; },
  clearTimeout() {},
  performance: { now: () => 0 },
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

function setSave(patch) {
  sandbox.__patch = patch;
  run('save = sanitizeSave(Object.assign({}, DEFAULT_SAVE, globalThis.__patch))');
}

const MUST_IDS = ['stick_lighter', 'woodchip_glue', 'chipping_wood', 'bamboo_boesa', 'echo_whistle'];
const MUST_NAMES = [
  'Stick-Lighter Factory', 'Woodchip-Glue Factory', 'Chipping-Wood Factory',
  'Bamboo-Boesa Boiler', 'Echo-Whistle Mill',
];
const MUST_RES = ['spark', 'glue', 'chip', 'steam', 'echo'];
const FORBIDDEN = ['sawmill', 'forge', 'neonlab', 'shrine', 'reactor', 'bamboo_boesa_boiler', 'echo_whistle_mill'];

const EXPORTS = [
  'BUILDINGS_SCHEMA', 'BUILDING_IDS', 'BUILDINGS', 'BUILDING_BY_ID',
  'buildingUnlocked', 'buildingBuilt', 'buildingCanUpgrade', 'buildingCanCollect',
  'buildingTickAll', 'buildingCollect', 'buildingBuild', 'buildingUpgrade',
  'buildingPowerRank', 'buildingWallet', 'buildingResourceIds', 'buildingTooltipModel',
];
for (const name of EXPORTS) {
  assert(run('typeof ' + name + ' !== "undefined"'), 'missing export ' + name);
}

assert(run('BUILDINGS_SCHEMA') === 1, 'BUILDINGS_SCHEMA must be 1');
assert(run('BUILDING_IDS.join(",")') === MUST_IDS.join(','), 'BUILDING_IDS mismatch: ' + run('BUILDING_IDS.join(",")'));
assert(run('BUILDINGS.map(b => b.name).join("|")') === MUST_NAMES.join('|'), 'display names mismatch');
assert(run('BUILDINGS.map(b => b.resourceId).join(",")') === MUST_RES.join(','), 'resources mismatch');
assert(run('buildingResourceIds.join(",")') === MUST_RES.join(','), 'buildingResourceIds mismatch');
assert(run('BUILDINGS.map(b => b.worldUnlock).join(",")') === '1,2,3,4,5', 'islands must be 1-5');
assert(run('BUILDINGS.every(b => b.maxLevel === 10)'), 'max level must be 10');
assert(!!run("BUILDING_BY_ID.bamboo_boesa && BUILDING_BY_ID.echo_whistle"), 'BY_ID missing boiler/mill');
for (const bad of FORBIDDEN) {
  assert(!MUST_IDS.includes(bad) && !run('BUILDING_IDS').includes(bad), 'forbidden id ' + bad);
}

assert(/data-factory-id="stick_lighter"/.test(html), 'HTML missing data-factory-id stick_lighter');
assert(/data-factory-id="echo_whistle"/.test(html), 'HTML missing data-factory-id echo_whistle');
assert(/id="buildingsWallet"/.test(html), 'HTML missing #buildingsWallet');
assert(/id="buildingsScreen"/.test(html), 'HTML missing #buildingsScreen');
assert(docs.includes('buildingTooltipModel'), 'docs missing buildingTooltipModel');
assert(docs.includes('BUILDINGS_SCHEMA'), 'docs missing BUILDINGS_SCHEMA');
assert(docs.includes('bamboo_boesa') && docs.includes('echo_whistle'), 'docs missing locked ids');

setSave({ unlocked: 1, petCoins: 200 });
assert(run("buildingUnlocked('stick_lighter') === true"), 'island 1 always open');
assert(run("buildingUnlocked('woodchip_glue') === false"), 'island 2 locked at unlock=1');
assert(run("buildingCanBuild('stick_lighter') === true"), 'can build lighter');
assert(run("buildingBuilt('stick_lighter') === false"), 'not built yet');
const built = run("buildingBuild('stick_lighter')");
assert(built && built.ok && built.level === 1, 'build failed ' + JSON.stringify(built));
assert(run("buildingBuilt('stick_lighter') === true"), 'built flag');
assert(run("buildingPowerRank('stick_lighter') === 0"), 'rank at lv1 is 0');
assert(run("buildingPowerRank(1) === 0 && buildingPowerRank(2) === 0"), 'rank formula lv1-2');
assert(run("buildingPowerRank(3) === 1 && buildingPowerRank(10) === 4"), 'rank formula lv3 / lv10');
assert(run("buildingPowerRank(0) === -1"), 'unbuilt rank -1');

setSave({ unlocked: 10, petCoins: 200 });
assert(run("buildingUnlocked('woodchip_glue') === false"), 'island 2 still locked at 10');
setSave({ unlocked: 11, petCoins: 200, buildings: { schema: 1, factories: {}, wallet: { spark: 20 } } });
assert(run("typeof advUnlockedLevel === 'function' && advUnlockedLevel('normal') === 11"), 'unlock via advUnlockedLevel');
assert(run("buildingUnlocked('woodchip_glue') === true"), 'island 2 at unlock 11');
assert(run("buildingUnlocked('chipping_wood') === false"), 'island 3 locked at 11');

setSave({ unlocked: 21, petCoins: 5 });
assert(run("buildingUnlocked('chipping_wood') === true"), 'island 3 at 21');
assert(run("buildingBuild('chipping_wood').reason === 'broke'"), 'broke build');

setSave({ unlocked: 31, petCoins: 500, buildings: { schema: 1, factories: {}, wallet: { chip: 20 } } });
assert(run("buildingUnlocked('bamboo_boesa') === true"), 'boiler island 4');
assert(run("buildingBuild('bamboo_boesa').ok === true"), 'build boiler');

setSave({ unlocked: 41, petCoins: 500, buildings: { schema: 1, factories: {}, wallet: { steam: 20 } } });
assert(run("buildingUnlocked('echo_whistle') === true"), 'mill island 5');
assert(run("buildingBuild('echo_whistle').ok === true"), 'build mill');
assert(run("buildingHasPower('taunt_toot') === true"), 'taunt_toot at rank 0');

setSave({
  unlocked: 1,
  buildings: { schema: 1, factories: { stick_lighter: { level: 1, lastTickAt: 1_000_000, stored: 0 } }, wallet: {} },
});
run('globalThis.__sfBuildingNow = 1000000 + 2 * 3600000');
run('buildingTickAll(save, globalThis.__sfBuildingNow)');
assert(run("buildingPendingAmount('stick_lighter') === 16"), '2h * 8/hr = 16, got ' + run("buildingPendingAmount('stick_lighter')"));
run('globalThis.__sfBuildingNow = 1000000 + 40 * 3600000');
run('buildingTickAll(save, globalThis.__sfBuildingNow)');
assert(run("buildingPendingAmount('stick_lighter') === 64"), 'cap 8h*8=64, got ' + run("buildingPendingAmount('stick_lighter')"));
assert(run("buildingCanCollect('stick_lighter') === true"), 'can collect');
const got = run("buildingCollect('stick_lighter')");
assert(got && got.ok && got.amount === 64 && got.resourceId === 'spark', 'collect ' + JSON.stringify(got));
assert(run("buildingWallet('spark') === 64"), 'wallet spark');
assert(run("save.buildings.wallet.spark === 64"), 'save.buildings.wallet');
assert(run("buildingCanCollect('stick_lighter') === false"), 'empty hopper');

setSave({
  unlocked: 1,
  petCoins: 2500,
  buildings: {
    schema: 1,
    factories: { stick_lighter: { level: 1, lastTickAt: 1, stored: 0 } },
    wallet: { spark: 900 },
  },
});
for (let n = 1; n < 10; n++) {
  const r = run("buildingUpgrade('stick_lighter')");
  assert(r && r.ok, 'upgrade to ' + (n + 1) + ' failed ' + JSON.stringify(r));
}
assert(run("buildingLevel('stick_lighter') === 10"), 'max 10');
assert(run("buildingPowerRank('stick_lighter') === 4"), 'rank 4 at lv10');
assert(run("buildingHasPower('matchstick_storm') === true"), 'rank 4 power');
assert(run("buildingUpgrade('stick_lighter').reason === 'max'"), 'max upgrade');

const tip = run("buildingTooltipModel('stick_lighter')");
assert(tip && tip.id === 'stick_lighter' && tip.level === 10 && tip.powerRank === 4, 'tooltip model');
assert(tip.artHint && tip.resourceId === 'spark', 'tooltip art/resource');

setSave({
  buildings: {
    sawmill: { level: 9 },
    stick_lighter: { level: 99, stored: -3, lastTickAt: 'nope' },
    bamboo_boesa_boiler: { level: 2, stored: 4 },
  },
  buildingRes: { ember_sticks: 8, plutonium: 4, glue: 3 },
});
assert(run("save.buildings.schema === 1"), 'schema stamped');
assert(run("save.buildings.factories.stick_lighter.level === 10"), 'level clamp 99→10');
assert(run("save.buildings.factories.bamboo_boesa.level === 2"), 'alias boiler → bamboo_boesa');
assert(run("!save.buildings.factories.sawmill"), 'unknown factory stripped');
assert(run("save.buildings.wallet.spark === 8"), 'ember_sticks → spark');
assert(run("save.buildings.wallet.glue === 3"), 'glue kept');
assert(run("!save.buildings.wallet.plutonium"), 'unknown res stripped');
assert(run("save.buildingRes == null"), 'legacy buildingRes removed');

run('delete globalThis.__sfBuildingNow');
console.log('SMOKE_OK buildings: locked 5 ids, schema 1, factories+wallet, rank, bind exports');
