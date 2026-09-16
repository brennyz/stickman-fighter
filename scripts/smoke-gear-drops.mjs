#!/usr/bin/env node
/**
 * Smoke: world drops wired to PR #280 catalog (131 IDs, lvl+day gates, can-own-locked).
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
require('child_process').execSync('node scripts/build.mjs', { cwd: root, stdio: 'pipe' });
const code = fs.readFileSync(path.join(root, 'game.js'), 'utf8');

const mustCall = [
  [/rollGearWorldDrop\s*\(\s*this\s*,\s*m\s*\)/, 'kill→rollGearWorldDrop'],
  [/gearId:\s*gd\.id/, 'kill→spawnPickup gearId'],
  [/rollGearStageClearDrop/, 'stage-clear gear'],
  [/rollGearChestPull/, 'chest optional gear'],
  [/tickPlayTime\s*\(\s*dt\s*\)/, 'loop→tickPlayTime'],
];
for (const [re, label] of mustCall) {
  if (!re.test(code)) {
    console.error('SMOKE_FAIL missing wire:', label);
    process.exit(1);
  }
}

function makeEl(id) {
  return {
    id, tagName: id === 'game' ? 'CANVAS' : 'DIV',
    classList: { s: new Set(), add(x) { this.s.add(x); }, remove(x) { this.s.delete(x); }, toggle(x, v) { if (v === undefined) v = !this.s.has(x); v ? this.s.add(x) : this.s.delete(x); }, contains(x) { return this.s.has(x); } },
    style: {}, hidden: false, dataset: {}, textContent: '', innerHTML: '', children: [],
    parentElement: null, closest() { return this; }, addEventListener() {}, removeEventListener() {},
    appendChild() {}, remove() {}, focus() {}, setAttribute() {}, getAttribute() { return null; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    getContext() {
      return {
        fillRect() {}, clearRect() {}, strokeRect() {}, fillText() {}, measureText() { return { width: 8 }; },
        beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, arc() {}, ellipse() {},
        fill() {}, stroke() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
        createLinearGradient() { return { addColorStop() {} }; },
        createRadialGradient() { return { addColorStop() {} }; },
        drawImage() {}, setTransform() {}, quadraticCurveTo() {}, setLineDash() {}, clip() {}, rect() {},
        canvas: { width: 960, height: 540 },
      };
    },
    width: 960, height: 540,
  };
}

const els = {};
const document = {
  body: makeEl('body'),
  documentElement: { style: {}, clientWidth: 960, clientHeight: 540 },
  getElementById(id) { if (!els[id]) els[id] = makeEl(id); return els[id]; },
  querySelector() { return null; }, querySelectorAll() { return []; },
  createElement(tag) { return makeEl(tag); }, addEventListener() {},
};
document.body.appendChild = () => {};

const windowObj = {
  document, innerWidth: 960, innerHeight: 540, devicePixelRatio: 1,
  localStorage: (() => { const bag = {}; return { getItem(k) { return bag[k] ?? null; }, setItem(k, v) { bag[k] = String(v); }, removeItem(k) { delete bag[k]; } }; })(),
  requestAnimationFrame(cb) { return setTimeout(() => cb(Date.now()), 0); },
  cancelAnimationFrame(id) { clearTimeout(id); },
  addEventListener() {}, removeEventListener() {},
  matchMedia() { return { matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }; },
  AudioContext: class { constructor() { this.state = 'running'; } createGain() { return { connect() {}, gain: { value: 1 } }; } createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { value: 0 } }; } resume() { return Promise.resolve(); } },
  navigator: { userAgent: 'smoke', vibrate() {}, language: 'nl' },
  location: { href: 'http://127.0.0.1/index.html', protocol: 'http:', hostname: '127.0.0.1', pathname: '/index.html', search: '' },
  performance: { now: () => Date.now() }, Image: class {}, console, setTimeout, clearTimeout,
  setInterval: () => 0, clearInterval() {},
};
windowObj.window = windowObj; windowObj.self = windowObj; windowObj.globalThis = windowObj;
document.defaultView = windowObj;

const sandbox = vm.createContext(windowObj);
vm.runInContext(code, sandbox, { filename: 'game.js' });
const run = (src) => vm.runInContext(src, sandbox);
const fail = (msg) => { console.error('SMOKE_FAIL', msg); process.exit(1); };

const items = run('GEAR_ITEMS');
if (!Array.isArray(items) || items.length !== 131) fail('expected 131 GEAR_ITEMS, got ' + (items && items.length));
const slots = new Set(items.map((it) => it.slot));
for (const s of ['head', 'chest', 'hands', 'legs', 'back']) {
  if (!slots.has(s)) fail('missing slot ' + s);
}
if (slots.has('charm') || slots.has('body') || slots.has('feet')) fail('legacy slot still on items');

const catalogIds = [
  'head_wrap_cloth', 'head_helm_tin', 'head_helm_nightmare', 'head_horns_sulfur',
  'chest_shirt_plain', 'chest_plate_iron', 'chest_plate_hell',
  'hands_wrap', 'hands_gloves_tape', 'hands_gauntlet_void',
  'legs_wrap', 'legs_boots_soft', 'legs_greaves_hell',
  'back_pin_dot', 'back_cape_shadow', 'back_void', 'back_wings_hell',
];
for (const id of catalogIds) {
  if (!run('!!gearItemById(' + JSON.stringify(id) + ')')) fail('missing #280 id ' + id);
}
if (run("gearItemById('charm_void') && gearItemById('charm_void').id") !== 'back_void') {
  fail('charm_void should alias to back_void');
}
if (run("gearItemById('g_head_cloth') && gearItemById('g_head_cloth').id") !== 'head_wrap_cloth') {
  fail('g_head_cloth alias missing');
}

let lootable = 0;
for (const it of items) {
  if (!it.id.startsWith(it.slot + '_')) fail('id/slot mismatch ' + it.id);
  if (!(it.unlockLvl >= 1)) fail('unlockLvl missing ' + it.id);
  if (!(it.unlockDays >= 1)) fail('unlockDays missing ' + it.id);
  if (it.droppable) lootable++;
  run('globalThis.__gid = ' + JSON.stringify(it.id));
  if (!run('gearPixelRows(__gid).length === 16')) fail('pixels not 16 rows ' + it.id);
}
if (lootable < 120) fail('expected most items lootable, got ' + lootable);

run(`
  save.gear = { schema: 1, equipped: { head:null,chest:null,hands:null,legs:null,back:null }, owned: {} };
  save.ownedGear = {};
  save.lvl = 1;
  save.unlocked = 1;
  save.createdAt = Date.now();
  save.advCleared = { normal: false, nightmare: false, hell: false };
`);
/* Day-1 account age: unlockDays 1 open, unlockDays 2 closed */
if (run("gearGateOpen(gearById('head_wrap_cloth'))") !== true) fail('starter wrap should be day-1 open');
if (run("gearGateOpen(gearById('head_helm_tin'))") === true) fail('tin helm needs Lv3 + 2d');
run('save.lvl = 3; save.createdAt = Date.now() - 3 * 86400000');
if (run("gearGateOpen(gearById('head_helm_tin'))") !== true) fail('tin helm should open at Lv3 + 2d');

run(`
  save.lvl = 55; save.unlocked = 51;
  save.createdAt = Date.now() - 40 * 86400000;
  save.advCleared = { normal: false, nightmare: false, hell: false };
`);
if (run("gearGateOpen(gearById('head_helm_nightmare'))") === true) fail('nightmare helm gated until normal clear');
if (run("gearGateOpen(gearById('head_helm_nightmare'), { zone: 'nightmare' })") !== true) {
  fail('nightmare helm open after normal-clear / nightmare zone');
}

run(`
  save.lvl = 55; save.unlocked = 51;
  save.createdAt = Date.now() - 40 * 86400000;
  save.advCleared = { normal: false, nightmare: false, hell: false };
  save.gear.owned = {}; save.ownedGear = {};
`);
const noZone = run("gearDropPool({ lvl: 55, days: 41, zone: null }).map(x => x.id)");
if (noZone.includes('head_helm_nightmare')) fail('nightmare helm must not drop outside zone without clear');
const nmZone = run("gearDropPool({ lvl: 55, days: 41, zone: 'nightmare' }).map(x => x.id)");
if (!nmZone.includes('head_helm_nightmare')) fail('nightmare helm should zone-drop: ' + JSON.stringify(nmZone.slice(0, 12)));
if (nmZone.includes('head_helm_hell')) fail('hell helm leaked into nightmare zone');
run('save.lvl = 66; save.unlocked = 61; save.createdAt = Date.now() - 50 * 86400000');
const hellZone = run("gearDropPool({ lvl: 66, days: 51, zone: 'hell' }).map(x => x.id)");
if (!hellZone.includes('head_helm_hell')) fail('hell helm should zone-drop on hell island');

run('save.gear.owned = {}; save.ownedGear = {}');
if (!run("grantGearItem('head_bandana_blue', { silent: true, src: 'drop' })")) fail('grant failed');
if (!run("gearOwned('head_bandana_blue')")) fail('gearOwned false after grant');
if (!run("!!save.gear.owned.head_bandana_blue.at")) fail('owned payload missing at');
if (!run("save.ownedGear.head_bandana_blue.gearId === 'head_bandana_blue'")) fail('ownedGear contract mirror missing');
if (!run("typeof save.ownedGear.head_bandana_blue.at === 'number' && save.ownedGear.head_bandana_blue.at > 0")) {
  fail('ownedGear payload missing at');
}
if (run("Object.keys(save.ownedGear.head_bandana_blue).sort().join(',')") !== 'at,gearId') {
  fail('ownedGear payload must be { gearId, at }');
}
if (run("grantGearItem('head_bandana_blue', { silent: true })")) fail('duplicate grant should be false');

/* can-own-locked: hell piece at day 1 / lvl 1 */
run(`
  save.lvl = 1; save.unlocked = 1;
  save.createdAt = Date.now();
  save.advCleared = { normal: false, nightmare: false, hell: false };
`);
if (!run("grantGearItem('head_helm_hell', { silent: true, src: 'drop' })")) fail('can-own-locked grant failed');
if (!run("gearItemOwned('head_helm_hell')")) fail('owned hell helm while gated');
if (run("gearCanEquip('head_helm_hell').ok") === true) fail('equip must stay gated');

const dirty = run("sanitizeGearOwned({ head_bandana_blue: { at: 1, src: 'drop' }, nope: 1, g_head_cloth: 1 })");
if (!dirty.head_bandana_blue || dirty.nope || dirty.g_head_cloth) fail('sanitize leaked junk or missed alias flatten');
if (!dirty.head_wrap_cloth) fail('g_head_cloth should flatten to head_wrap_cloth');

run(`
  save.gear.owned = {};
  save.ownedGear = {};
  save.lvl = 5;
  save.unlocked = 1;
  save.createdAt = Date.now() - 2 * 86400000;
  save.advCleared = { normal: false, nightmare: false, hell: false };
`);
const pool = run("gearDropPool({ lvl: 5, zone: null, days: 3 }).map(x => x.id)");
if (!pool.includes('head_bandana_blue') || !pool.includes('chest_hoodie_gray')) {
  fail('early pool missing gated-open commons: ' + JSON.stringify(pool));
}
if (pool.includes('head_wrap_cloth')) fail('starter should not be droppable');
if (pool.includes('chest_plate_iron') || pool.includes('back_void') || pool.includes('head_helm_hell')) {
  fail('early pool leaked gated items: ' + JSON.stringify(pool));
}

run("save.gear.owned = { head_bandana_blue: { at: 1, src: 'drop' } }");
const pool2 = run("gearDropPool({ lvl: 5, zone: null, days: 3 }).map(x => x.id)");
if (pool2.includes('head_bandana_blue')) fail('owned item stayed in drop pool');

let dropped = null;
run(`
  save.gear.owned = {};
  save.ownedGear = {};
  save.lvl = 8;
  save.unlocked = 8;
  save.createdAt = Date.now() - 10 * 86400000;
  save.advCleared = { normal: false, nightmare: false, hell: false };
`);
for (let i = 0; i < 40 && !dropped; i++) {
  dropped = run(`
    rollGearWorldDrop({
      mode: 'adventure', advDiff: 'normal',
      level: { n: 10, boss: true, diff: 'normal' },
      pickups: [],
    }, { elite: true, superBoss: false, giant: false })
  `);
}
if (!dropped || !dropped.id) fail('island-boss elite should guarantee a gear drop');

if (run("rollGearWorldDrop({ mode: 'adventure', satanActive: true, level: { n: 10 }, pickups: [] }, { elite: true })")) {
  fail('no gear during satan');
}

run('save.stats.playSec = 0');
run('tickPlayTime(0.05)');
if (Math.abs(run('save.stats.playSec') - 0.05) > 0.001) fail('tickPlayTime did not add frame seconds');
run('tickPlayTime(12)');
if (Math.abs(run('save.stats.playSec') - 0.13) > 0.001) fail('tickPlayTime should cap huge dt');

run(`
  globalThis.__gearRects = 0;
  drawGearPixels({
    save() {}, restore() {}, imageSmoothingEnabled: true,
    fillRect() { globalThis.__gearRects++; },
  }, 'head_helm_knight', 0, 0, 2);
`);
if (!(run('__gearRects > 8'))) fail('drawGearPixels drew too few pixels');

/* Unique silhouettes: early commons + one strong set per slot + NM/Hell accents */
const earlyUnique = [
  'head_wrap_cloth', 'head_bandana_blue', 'head_beanie_wool', 'head_hat_paper', 'head_crown_cardboard',
  'chest_shirt_plain', 'chest_hoodie_gray', 'chest_vest_denim', 'chest_coat_red',
  'hands_wrap', 'hands_mittens_wool', 'hands_rings_plastic',
  'legs_wrap', 'legs_socks_plain', 'legs_shorts_stripe', 'legs_boots_clown',
  'back_pin_dot', 'back_backpack_school', 'back_scarf_long', 'back_cape_red',
];
const occSeen = {};
for (const id of earlyUnique) {
  const occ = run('gearPixelOccupancy(' + JSON.stringify(id) + ')');
  if (!occ || occ.length !== 256) fail('occupancy missing/short for ' + id);
  if (occSeen[occ]) fail('silhouette collision ' + id + ' vs ' + occSeen[occ]);
  occSeen[occ] = id;
}
const slotSet = ['head_helm_knight', 'chest_plate_iron', 'hands_gauntlet_iron', 'legs_greaves_knight', 'back_cape_red'];
const slotOcc = {};
for (const id of slotSet) {
  const occ = run('gearPixelOccupancy(' + JSON.stringify(id) + ')');
  if (slotOcc[occ]) fail('slot-set collision ' + id + ' vs ' + slotOcc[occ]);
  slotOcc[occ] = id;
}
if (run("gearTintKey(gearById('head_helm_nightmare'))") !== 'night') fail('nightmare helm tint');
if (run("gearTintKey(gearById('head_helm_hell'))") !== 'lava') fail('hell helm tint');
if (run("gearTintKey(gearById('chest_plate_nightmare'))") !== 'night') fail('nightmare plate tint');
if (run("gearTintKey(gearById('chest_plate_hell'))") !== 'lava') fail('hell plate tint');
if (run("gearPixelKey(gearById('head_helm_nightmare'))") === run("gearPixelKey(gearById('head_helm_hell'))")) {
  fail('nightmare/hell helm must use distinct silhouettes');
}
const feelCommon = run("gearPickupFeel('head_bandana_blue', 'normal')");
if (!feelCommon || feelCommon.scale !== 2 || feelCommon.ring) fail('common pickup should stay scale 2, no ring');
const feelRare = run("gearPickupFeel('head_helm_iron', 'normal')");
if (!feelRare || !(feelRare.scale > 2) || !feelRare.ring) fail('rare pickup needs larger scale + ring');
const feelElite = run("gearPickupFeel('head_bandana_blue', 'elite')");
if (!feelElite || !(feelElite.scale >= 2.5) || !feelElite.ring) fail('elite drop should bump scale + ring');
const feelBoss = run("gearPickupFeel('back_wings_hell', 'superBoss')");
if (!feelBoss || !(feelBoss.scale >= 2.75) || !feelBoss.ring) fail('superBoss hell pickup should be largest + ring');
if (run('GEAR_MAX_FIELD') !== 3) fail('GEAR_MAX_FIELD must stay 3');
run(`
  globalThis.__fxCalls = 0;
  globalThis.__fxOk = gearPickupDrawFx({
    save() {}, restore() {}, beginPath() {}, arc() {}, stroke() {}, fillRect() { globalThis.__fxCalls++; },
  }, { gearId: 'back_wings_hell', dropTier: 'superBoss', t: 0.4, x: 10 }, 20, gearPickupFeel('back_wings_hell', 'superBoss'));
`);
if (run('__fxOk') !== true) fail('gearPickupDrawFx should run when lite/motion flags off');
if (!(run('__fxCalls >= 1'))) fail('hell pickup FX should draw flicker pixels');
run('save.liteFx = true');
if (run("gearPickupDrawFx({ save(){}, restore(){}, beginPath(){}, arc(){}, stroke(){}, fillRect(){} }, { gearId: 'back_wings_hell', t: 1, x: 0 }, 0, gearPickupFeel('back_wings_hell', 'superBoss'))") !== false) {
  fail('liteFx must skip pickup motion FX');
}
run('save.liteFx = false');
if (run('Object.keys(GEAR_PIXEL_BY_ID).length') !== 131) fail('GEAR_PIXEL_BY_ID must cover 131 ids');

run(`
  globalThis.__gearPk = null;
  globalThis.__gearHost = { pickups: [], clampPickupPos(x, y) { return { x, y }; }, spawnPickup: Game.prototype.spawnPickup };
  globalThis.__gearHost.spawnPickup(120, 200, { gearId: 'back_cape_shadow', dropTier: 'elite' });
  globalThis.__gearPk = globalThis.__gearHost.pickups[0];
`);
const pk = run('__gearPk');
if (!pk || pk.kind !== 'gear' || pk.gearId !== 'back_cape_shadow') fail('spawnPickup did not create gear pickup');

run(`
  globalThis.__gearHost2 = { pickups: [], clampPickupPos(x, y) { return { x, y }; }, spawnPickup: Game.prototype.spawnPickup };
  globalThis.__gearHost2.spawnPickup(1, 1, { gearId: 'not_a_real_item' });
  globalThis.__badPk = globalThis.__gearHost2.pickups.length;
`);
if (run('__badPk') !== 0) fail('invalid gearId must not spawn a generic orb');

const stage = run("save.gear.owned={}; save.ownedGear={}; save.lvl=12; save.createdAt=Date.now()-20*86400000; rollGearStageClearDrop(10, 'normal')");
if (!stage || !stage.id) fail('stage-clear island boss should roll gear');
if (run("rollGearStageClearDrop(7, 'normal')")) fail('non-island level must not stage-clear gear');

console.log(JSON.stringify({
  ok: true,
  items: items.length,
  lootable,
  slots: [...slots],
  sample: dropped.id,
  catalog: catalogIds.length,
}));
console.log('SMOKE_OK gear-drops');
process.exit(0);
