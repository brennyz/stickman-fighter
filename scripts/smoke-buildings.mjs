#!/usr/bin/env node
/** Buildings catalog + save + unlock/upgrade + timed resources. */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const code = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs/BUILDINGS.md'), 'utf8');

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
['menuScreen', 'game', 'toastHost', 'btnAdventure', 'buildingsScreen', 'buildingsList', 'buildingsScreenHead'].forEach(getEl);
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

const MUST_IDS = [
  'stick_lighter',
  'woodchip_glue',
  'chipping_wood',
  'bamboo_boesa_boiler',
  'echo_whistle_mill',
];
const MUST_NAMES = [
  'Stick-Lighter Factory',
  'Woodchip-Glue Factory',
  'Chipping-Wood Factory',
  'Bamboo-Boesa Boiler',
  'Echo-Whistle Mill',
];
const FORBIDDEN = ['sawmill', 'forge', 'neonlab', 'shrine', 'reactor'];

const ids = run('BUILDING_IDS.slice()');
const names = run('BUILDING_CATALOG.map(b => b.name)');
const worlds = run('BUILDING_CATALOG.map(b => b.worldUnlock)');

assert(ids.length === 5, 'catalog must be exactly 5, got ' + ids.length);
assert(ids.join(',') === MUST_IDS.join(','), 'ids mismatch: ' + ids.join(','));
assert(names.join('|') === MUST_NAMES.join('|'), 'names mismatch: ' + names.join('|'));
assert(worlds.join(',') === '1,2,3,4,5', 'worldUnlock must be islands 1-5 in list order: ' + worlds.join(','));
for (const bad of FORBIDDEN) {
  assert(!ids.some((id) => id.includes(bad)), 'forbidden id fragment ' + bad);
}

assert(!!run("buildingById('stick_lighter')"), 'stick_lighter missing');
assert(!!run("BUILDING_API && BUILDING_API.byId('echo_whistle_mill')"), 'BUILDING_API bind missing');
assert(docs.includes('BUILDING_API'), 'docs must document BUILDING_API');
assert(docs.includes('bamboo_boesa_boiler'), 'docs must use canonical boiler id');
assert(docs.includes('echo_whistle_mill'), 'docs must use canonical mill id');
assert(/`stick_lighter`/.test(docs) && /`woodchip_glue`/.test(docs) && /`chipping_wood`/.test(docs), 'docs missing canonical ids');

// Island 1 always open; later islands follow unlock > (n-1)*10
setSave({ unlocked: 1, petCoins: 200 });
assert(run("buildingWorldUnlocked('stick_lighter') === true"), 'island 1 always unlocked');
assert(run("buildingWorldUnlocked('woodchip_glue') === false"), 'island 2 locked at unlock=1');
assert(run("buildingCanBuild('stick_lighter') === true"), 'can build lighter with coins');
assert(run("buildingCanBuild('woodchip_glue') === false"), 'cannot build glue while island 2 locked');

const built = run("tryBuildBuilding('stick_lighter')");
assert(built && built.ok && built.level === 1, 'build lighter failed: ' + JSON.stringify(built));
assert(run("buildingLevel('stick_lighter') === 1"), 'lighter not level 1 after build');
assert(run("buildingHasPower('spark_kindle') === true"), 'Lv1 power spark_kindle missing');
assert(run("buildingHasPower('kindle_trail') === false"), 'Lv3 power should still be locked');
assert(run("tryBuildBuilding('stick_lighter').reason === 'built'"), 'rebuild must fail');

setSave({ unlocked: 10, petCoins: 200 });
assert(run("buildingWorldUnlocked('woodchip_glue') === false"), 'island 2 still locked at unlock=10');
setSave({ unlocked: 11, petCoins: 200, buildingRes: { ember_sticks: 20 } });
assert(run("buildingWorldUnlocked('woodchip_glue') === true"), 'island 2 opens at unlock 11');
assert(run("buildingWorldUnlocked('chipping_wood') === false"), 'island 3 locked at 11');

setSave({ unlocked: 21, petCoins: 5 });
assert(run("buildingWorldUnlocked('chipping_wood') === true"), 'island 3 opens at 21');
assert(run("tryBuildBuilding('chipping_wood').reason === 'broke'"), 'broke build must fail');

setSave({ unlocked: 31, petCoins: 500, buildingRes: { wood_chips: 20 } });
assert(run("buildingWorldUnlocked('bamboo_boesa_boiler') === true"), 'boiler unlocks island 4');
const boiler = run("tryBuildBuilding('bamboo_boesa_boiler')");
assert(boiler && boiler.ok, 'boiler build failed: ' + JSON.stringify(boiler));

setSave({ unlocked: 41, petCoins: 500, buildingRes: { boesa_steam: 20 } });
assert(run("buildingWorldUnlocked('echo_whistle_mill') === true"), 'mill unlocks island 5');
const mill = run("tryBuildBuilding('echo_whistle_mill')");
assert(mill && mill.ok, 'mill build failed: ' + JSON.stringify(mill));
assert(run("buildingHasPower('taunt_toot') === true"), 'taunt_toot at mill Lv1');

// Timed hopper: 2 hours at Lv1 lighter = 16 ember sticks, cap respected
setSave({
  unlocked: 1,
  petCoins: 0,
  buildings: { stick_lighter: { level: 1, lastTickAt: 1_000_000, stored: 0 } },
});
run('globalThis.__sfBuildingNow = 1000000 + 2 * 3600000');
run('tickBuildings(save, globalThis.__sfBuildingNow)');
assert(run("buildingPendingAmount('stick_lighter') === 16"), '2h * 8/hr should be 16, got ' + run("buildingPendingAmount('stick_lighter')"));

run('globalThis.__sfBuildingNow = 1000000 + 40 * 3600000');
run('tickBuildings(save, globalThis.__sfBuildingNow)');
const pending = run("buildingPendingAmount('stick_lighter')");
const cap = run("buildingStorageCap('stick_lighter')");
assert(pending === cap, 'offline/cap should clamp hopper to ' + cap + ' got ' + pending);
assert(pending === 64, 'Lv1 cap is 64, got ' + pending);

const collected = run("collectBuilding('stick_lighter')");
assert(collected && collected.ok && collected.amount === 64, 'collect amount ' + JSON.stringify(collected));
assert(run("buildingWallet('ember_sticks') === 64"), 'wallet after collect');
assert(run("buildingPendingAmount('stick_lighter') === 0"), 'hopper empty after collect');

// Upgrade path + power gates
setSave({
  unlocked: 1,
  petCoins: 500,
  buildingRes: { ember_sticks: 200 },
  buildings: { stick_lighter: { level: 1, lastTickAt: 1, stored: 0 } },
});
assert(run("tryUpgradeBuilding('stick_lighter').ok === true"), 'upgrade 1→2');
assert(run("buildingLevel('stick_lighter') === 2"), 'level 2');
assert(run("buildingHasPower('kindle_trail') === false"), 'trail still locked at 2');
assert(run("tryUpgradeBuilding('stick_lighter').ok === true"), 'upgrade 2→3');
assert(run("buildingLevel('stick_lighter') === 3"), 'level 3');
assert(run("buildingHasPower('kindle_trail') === true"), 'trail unlocks at 3');
assert(run("buildingHasPower('matchstick_storm') === false"), 'storm locked before 5');
assert(run("tryUpgradeBuilding('stick_lighter').ok === true"), 'upgrade 3→4');
assert(run("tryUpgradeBuilding('stick_lighter').ok === true"), 'upgrade 4→5');
assert(run("buildingLevel('stick_lighter') === 5"), 'level 5');
assert(run("buildingHasPower('matchstick_storm') === true"), 'storm at 5');
assert(run("tryUpgradeBuilding('stick_lighter').reason === 'max'"), 'max upgrade');

const powers = run('buildingUnlockedPowers()');
assert(powers.includes('spark_kindle') && powers.includes('matchstick_storm'), 'unlockedPowers incomplete: ' + powers);

// Sanitize junk
setSave({
  buildings: {
    sawmill: { level: 9, stored: 99 },
    stick_lighter: { level: 99, stored: -3, lastTickAt: 'nope' },
  },
  buildingRes: { ember_sticks: -8, plutonium: 4, glue_pots: 3 },
});
assert(run("!save.buildings.sawmill"), 'unknown building must strip');
assert(run("save.buildings.stick_lighter.level === 5"), 'level clamp 99→5');
assert(run("save.buildings.stick_lighter.stored === 0"), 'neg stored → 0 at max? stored clamped');
assert(run("save.buildingRes.ember_sticks == null || save.buildingRes.ember_sticks === 0"), 'neg wallet stripped');
assert(run("!save.buildingRes.plutonium"), 'unknown resource stripped');
assert(run("save.buildingRes.glue_pots === 3"), 'valid wallet kept');

const uiRows = run('listBuildingsForUi()');
assert(Array.isArray(uiRows) && uiRows.length === 5, 'listForUi must return 5 rows');
assert(uiRows[0].id === 'stick_lighter' && uiRows[4].id === 'echo_whistle_mill', 'ui row order');
assert(uiRows.every((r) => r.artHint && r.artHint.iconFile), 'artHint bind missing');

run('delete globalThis.__sfBuildingNow');
console.log('SMOKE_OK buildings: 5 quirky factories, island 1-5, save/tick/powers/sanitize');
