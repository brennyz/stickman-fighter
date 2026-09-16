#!/usr/bin/env node
/** Equip look: data-driven slots, layer order, style pieces, gear override, draw-safe. */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const bundle = fs.readFileSync(path.join(root, 'game.js'), 'utf8');

function fail(msg) {
  console.error('SMOKE_FAIL', msg);
  process.exit(1);
}

if (!/function\s+resolveFighterLooks\s*\(/.test(bundle)) fail('resolveFighterLooks missing');
if (!/function\s+drawEquipLayer\s*\(/.test(bundle)) fail('drawEquipLayer missing');
if (!/function\s+looksForStyle\s*\(/.test(bundle)) fail('looksForStyle missing');
if (!src('src/manifest.json').includes('src/data/equip-look.js')) fail('manifest missing equip-look data');
if (!src('src/manifest.json').includes('src/render/equip-look.js')) fail('manifest missing equip-look render');
if (/fillRect\(\s*hx\s*-\s*11,\s*hy\s*-\s*17,\s*22,\s*7\s*\)/.test(src('src/entities/fighter.js'))) {
  fail('legacy brick bandana still in fighter.js');
}

function recordingContext() {
  const calls = [];
  const ctx = {
    calls,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowColor: '',
    shadowBlur: 0,
    lineCap: 'round',
    save() { calls.push(['save']); },
    restore() { calls.push(['restore']); },
    translate(x, y) { calls.push(['translate', x, y]); },
    scale(x, y) { calls.push(['scale', x, y]); },
    rotate() { calls.push(['rotate']); },
    beginPath() { calls.push(['beginPath']); },
    closePath() { calls.push(['closePath']); },
    moveTo(x, y) { calls.push(['moveTo', x, y]); },
    lineTo(x, y) { calls.push(['lineTo', x, y]); },
    quadraticCurveTo() { calls.push(['quad']); },
    bezierCurveTo() { calls.push(['bez']); },
    arc(x, y, r) { calls.push(['arc', x, y, r]); },
    ellipse() { calls.push(['ellipse']); },
    fill() { calls.push(['fill', ctx.fillStyle]); },
    stroke() { calls.push(['stroke', ctx.strokeStyle]); },
    fillRect(x, y, w, h) { calls.push(['fillRect', x, y, w, h, ctx.fillStyle]); },
    strokeRect() { calls.push(['strokeRect']); },
    rect() { calls.push(['rect']); },
    roundRect() { calls.push(['roundRect']); },
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
  };
  return new Proxy(ctx, {
    get(t, p) {
      if (p in t) return t[p];
      return () => undefined;
    },
  });
}

function makeEl(id) {
  return {
    id,
    tagName: id === 'game' ? 'CANVAS' : 'DIV',
    classList: {
      s: new Set(),
      add(x) { this.s.add(x); },
      remove(x) { this.s.delete(x); },
      toggle(x, v) {
        if (v === undefined) v = !this.s.has(x);
        v ? this.s.add(x) : this.s.delete(x);
      },
      contains(x) { return this.s.has(x); },
    },
    style: {},
    hidden: false,
    dataset: {},
    disabled: false,
    textContent: '',
    innerHTML: '',
    value: '',
    children: [],
    parentElement: null,
    closest() { return this; },
    addEventListener() {},
    removeEventListener() {},
    appendChild() {},
    remove() {},
    focus() {},
    select() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    clientWidth: 320,
    clientHeight: 480,
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 40 }; },
    setAttribute() {},
    removeAttribute() {},
    getAttribute() { return null; },
    getContext() { return recordingContext(); },
  };
}

const byId = new Map();
const get = (id) => {
  if (!byId.has(id)) byId.set(id, makeEl(id));
  return byId.get(id);
};
[
  'menuScreen', 'levelScreen', 'gambleScreen', 'weaponScreen', 'styleScreen', 'skillScreen', 'settingsScreen',
  'missionsScreen', 'charSelectScreen', 'dexScreen', 'helpScreen', 'installScreen',
  'resultScreen', 'pauseScreen', 'game', 'toastHost', 'pauseBtn', 'menuStats',
  'styleGrid', 'upgradeScreen', 'petScreen', 'summonScreen', 'modeHubScreen',
].forEach(get);
get('menuScreen').classList.add('active');

const ctx = {
  document: {
    getElementById: get,
    querySelector() { return null; },
    querySelectorAll(sel) {
      if (sel === '.screen') return [...byId.values()].filter((e) => String(e.id).endsWith('Screen'));
      return [];
    },
    body: get('body'),
    createElement: (t) => makeEl(t),
    addEventListener() {},
    dispatchEvent() {},
  },
  addEventListener() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 2,
  requestAnimationFrame: () => 0,
  cancelAnimationFrame() {},
  getComputedStyle() {
    return { display: 'flex', visibility: 'visible', opacity: '1', animationName: 'none', zIndex: '20', pointerEvents: 'auto' };
  },
  setInterval() { return 0; },
  clearInterval() {},
  setTimeout(fn) { try { fn(); } catch (_) {} return 0; },
  clearTimeout() {},
  performance: { now: () => 0 },
  console,
  location: {
    href: 'https://brennyz.github.io/stickman-fighter/',
    hostname: 'brennyz.github.io',
    protocol: 'https:',
    search: '',
    pathname: '/stickman-fighter/',
    origin: 'https://brennyz.github.io',
  },
  navigator: { onLine: true, userAgent: 'Chrome', maxTouchPoints: 0, platform: 'Linux', vibrate() {} },
  localStorage: {
    store: {},
    getItem(k) { return this.store[k] ?? null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; },
  },
  sfTunnelBoot: Promise.resolve(),
  dispatchEvent() {},
  AudioContext: class {
    constructor() { this.state = 'running'; this.destination = {}; this.currentTime = 0; this.sampleRate = 44100; }
    createGain() { return { connect() { return this; }, gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
    createOscillator() {
      return { connect() { return this; }, start() {}, stop() {}, type: 'sine', frequency: { value: 440, setValueAtTime() {}, exponentialRampToValueAtTime() {} } };
    }
    createBuffer() { return { getChannelData: () => new Float32Array(8) }; }
    createBufferSource() { return { connect() { return this; }, start() {}, buffer: null }; }
    createBiquadFilter() { return { connect() { return this; }, type: '', frequency: { value: 0 } }; }
    resume() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
  },
};
ctx.window = ctx;
ctx.globalThis = ctx;
ctx.self = ctx;
ctx.webkitAudioContext = ctx.AudioContext;

try {
  vm.runInContext(bundle, vm.createContext(ctx), { filename: 'game.js' });
} catch (e) {
  fail('load: ' + e.message);
}

await Promise.resolve();
const api = ctx.EquipLookApi;
if (!api) fail('EquipLookApi not on globalThis');
if (!api.slots || api.slots.join(',') !== 'head,chest,hands,legs,back') fail('slotIds must be head,chest,hands,legs,back');
if (!api.layers || api.layers.join(',') !== 'back,legs,chest,head,hands,weapon-hold,pet') {
  fail('draw order must be back,legs,chest,head,hands,weapon-hold,pet');
}
if (!api.paint || api.paint.join(',') !== 'back,legs,chest,head,hands') fail('paint layers must skip weapon-hold/pet');

const expectKind = {
  classic: [],
  leaf_band: ['bandana'],
  energy_glow: ['glow', 'bandana'],
  crimson_pact: ['coat', 'bandana'],
  shadow: ['cape', 'bandana'],
  guvve: ['bandana', 'duck'],
  gold: ['glow', 'bandana'],
  sand: ['vest', 'wrap', 'bandana'],
  samurai: ['topknot', 'bandana'],
  cyber: ['visor', 'bandana', 'lightning'],
  fox: ['fox', 'bandana'],
  storm: ['glow', 'bandana', 'lightning'],
  void: ['coat', 'bandana'],
  hunter: ['vest', 'bandana', 'charm'],
  crystal: ['glow', 'bandana', 'crystal'],
  tome: ['tome', 'bandana'],
};

for (const [id, kinds] of Object.entries(expectKind)) {
  const looks = api.forStyle({ id, bandana: '#123', accent: '#abc', plate: '#eee' });
  const got = looks.map((l) => l.kind);
  if (kinds.length === 0) {
    if (got.length) fail(id + ' should have no pieces, got ' + got);
    continue;
  }
  for (const k of kinds) {
    if (!got.includes(k)) fail(id + ' missing kind ' + k + ' (got ' + got + ')');
  }
  for (const l of looks) {
    if (!api.slots.includes(l.slot)) fail(id + ' piece ' + l.kind + ' bad slot ' + l.slot);
    if (!api.layers.includes(l.layer)) fail(id + ' piece ' + l.kind + ' bad layer ' + l.layer);
  }
}

const leaf = api.forStyle({ id: 'leaf_band', bandana: '#2d6b36', plate: '#dfe8ff', accent: '#43b25b' })[0];
if (!leaf || leaf.oy === undefined || leaf.scale < 0.9) fail('leaf_band bandana needs tuned oy/scale');
if (leaf.color !== '#2d6b36') fail('leaf_band color should hydrate from style');

if (typeof api.hidesBaseHead !== 'function') fail('hidesBaseHead missing');
for (const id of Object.keys(expectKind)) {
  const stLooks = api.forStyle({ id, bandana: '#123', accent: '#abc', plate: '#eee' });
  if (api.hidesBaseHead(stLooks)) fail(id + ' style must not hide the stick head');
}
const helmLooks = api.forGear({ head: { kind: 'helmet', color: '#9aa8bc' } });
if (!api.hidesBaseHead(helmLooks)) fail('helmet gear must mark coversHead so a replacement skull is drawn');
if (typeof api.luma === 'function') {
  if (api.luma('#1a1424') >= 0.38) fail('crimson/void body must count as dark (contrast rim)');
  if (api.luma('#f2f5ff') < 0.75) fail('classic body must count as light');
}
if (typeof api.headStroke === 'function') {
  const darkHead = api.headStroke('#1a1424');
  if (!darkHead || darkHead === '#1a1424') fail('dark style head stroke must lighten so the circle reads');
}
if (typeof api.previewBody === 'function') {
  const sam = api.previewBody('#2a2a35');
  if (!sam || sam === '#2a2a35') fail('samurai preview body must lighten on the style card');
  if (api.previewBody('#f2f5ff') !== '#f2f5ff') fail('classic preview body must stay light');
}
if (typeof api.previewCamera !== 'function') fail('previewCamera missing');
for (const [cw, ch] of [[80, 86], [64, 64]]) {
  const cam = api.previewCamera(cw, ch);
  const headY = cam.ty + cam.sc * cam.headLocalY;
  const headR = cam.headR * cam.sc;
  if (headY - headR < 1.5) fail('style card ' + cw + 'x' + ch + ' clips head top (y=' + (headY - headR).toFixed(2) + ')');
  if (headY + headR > ch - 1) fail('style card ' + cw + 'x' + ch + ' clips head bottom');
}

const gear = api.forGear({
  head: { kind: 'helmet', color: '#c9d6e8', accent: '#7cf5ff' },
  chest: { kind: 'chestplate', color: '#8fa3d9' },
});
if (gear.length < 2) fail('gear slots did not resolve');
if (!gear.some((l) => l.kind === 'helmet' && l.slot === 'head')) fail('helmet slot');
if (!gear.some((l) => l.kind === 'chestplate' && l.slot === 'chest')) fail('chestplate slot');

const merged = api.resolve({
  isPlayer: true,
  style: { id: 'leaf_band', bandana: '#2d6b36', plate: '#dfe8ff', accent: '#43b25b' },
  gear: { head: { kind: 'helmet', color: '#aaa' } },
});
if (!merged.some((l) => l.kind === 'helmet')) fail('gear head should appear');
if (merged.some((l) => l.kind === 'bandana')) fail('gear head should replace style bandana');

if (api.snap(3.4) !== 3 || api.snap(3.6) !== 4) fail('lookSnap rounding');
if (api.snap(NaN) !== 0 || api.snap(Infinity) !== 0) fail('lookSnap must treat non-finite as 0');

if (api.resolve(null).length) fail('resolve(null) must be empty');
if (api.resolve({}).length) fail('resolve({}) without style must be empty');
const fromId = api.resolve({ isPlayer: true, style: 'leaf_band' });
if (!fromId.some((l) => l.kind === 'bandana')) fail('style id string must resolve leaf_band');

if (api.forGear([]).length) fail('array gear must be ignored');
if (api.forGear('helmet').length) fail('string gear must be ignored');
if (api.forGear({ junk: { kind: 'helmet', color: '#ccc' } }).length) fail('unknown gear keys must not spawn pieces');
if (api.forGear({ constructor: { kind: 'helmet' } }).length) fail('constructor key must not spawn pieces');

const clamped = api.forGear({
  head: { kind: 'helmet', ox: 999, oy: -999, scale: 50, layer: 'NOPE', color: '#ccc' },
});
if (!clamped.length) fail('clamped helmet should still resolve');
if (Math.abs(clamped[0].ox) > 48 || Math.abs(clamped[0].oy) > 48) fail('ox/oy must clamp');
if (clamped[0].scale > 1.75) fail('scale must clamp');
if (!api.layers.includes(clamped[0].layer)) fail('unknown layer must canon to a real layer');

if (api.canonSlot && api.canonSlot('helmet') !== 'head') fail('helmet alias');
if (api.canonSlot && api.canonSlot('trinket') !== 'hands') fail('trinket alias → hands');
if (api.canonSlot && api.canonSlot('charm') !== 'back') fail('#280 charm alias → back');
if (api.canonSlot && api.canonSlot('accessory') !== 'back') fail('#280 accessory alias → back');
if (api.canonSlot && api.canonSlot('aura') !== 'back') fail('#280 aura alias → back');
if (api.canonSlot && api.canonSlot('nope') != null) fail('unknown slot must be null');
if (api.canonLayer && api.canonLayer('behind', 'head') !== 'back') fail('behind → back');
if (api.canonLayer && api.canonLayer('under', 'chest') !== 'back') fail('under → back');
if (api.canonLayer && !api.layers.includes(api.canonLayer('NOPE', 'head'))) fail('bad layer fallback');

const viaDraw = api.forGear({
  chest: { kind: 'vest', draw: { layer: 'chest', ox: 2, oy: -1, scale: 1.1, color: '#446688' } },
});
if (!viaDraw.length || viaDraw[0].layer !== 'chest' || viaDraw[0].ox !== 2 || viaDraw[0].oy !== -1) {
  fail('Item.draw.layer + offsets');
}

const oneSlot = api.forGear({
  head: { kind: 'helmet', color: '#aaa' },
  hat: { kind: 'bandana', color: '#bbb' },
});
if (oneSlot.filter((l) => l.slot === 'head').length !== 1) fail('one item per slot');

const hands = api.forGear({
  hands: { kind: 'gloves', color: '#ccc' },
  trinket: { kind: 'charm', color: '#ddd' },
});
if (!hands.some((l) => l.slot === 'hands' && l.kind === 'gloves')) fail('hands slot');
if (hands.filter((l) => l.slot === 'hands').length !== 1) fail('alias must not stack a second hands item');

const flooded = api.forGear({
  head: { kind: 'helmet', color: '#aaa' },
  chest: { kind: 'chestplate', color: '#aaa' },
  hands: { kind: 'gloves', color: '#aaa' },
  legs: { kind: 'greaves', color: '#aaa' },
  back: { kind: 'cape', color: '#aaa' },
  hat: { kind: 'helmet', color: '#bbb' },
});
if (flooded.length !== 5) fail('one item × 5 slots');
if (flooded.length > (api.max || 5)) fail('gear piece cap');

try {
  api.resolve({ isPlayer: true, style: { id: 'leaf_band', bandana: 12, accent: { x: 1 } }, gear: { head: { kind: 9, ox: 'nope' } } });
} catch (e) {
  fail('bad colors/kind must not throw: ' + e.message);
}

if (typeof api.fromDescriptor !== 'function' || typeof api.kindFromId !== 'function') {
  fail('gearRenderDescriptor consumer missing');
}
const desc = api.fromDescriptor({
  schema: 1,
  slots: [
    { slot: 'head', itemId: 'head_helm_iron', tint: '#9aa8bc', accent: '#7cf5ff', layer: 'head' },
    { slot: 'chest', itemId: 'chest_plate_knight', tint: '#c9d6e8', accent: '#8fa3d9', layer: 'chest' },
    { slot: 'hands', itemId: 'hands_gauntlet_steel', tint: '#b8c4d4', accent: '#6a5030', layer: 'hands' },
    { slot: 'legs', itemId: 'legs_greaves_iron', tint: '#8fa3d9', accent: '#5a6474', layer: 'legs' },
    { slot: 'back', itemId: 'back_cape_red', tint: '#e04f4f', accent: '#c97a20', layer: 'back' },
  ],
});
if (desc.length !== 5) fail('descriptor must yield 5 slots');
if (desc.map((l) => l.slot).join(',') !== 'head,chest,hands,legs,back') fail('descriptor slot order');
if (desc[0].kind !== 'helmet' || desc[1].kind !== 'chestplate' || desc[2].kind !== 'gloves') fail('catalog kind map');
if (desc[3].kind !== 'greaves' || desc[4].kind !== 'cape') fail('legs/back kind map');
if (desc[0].color !== '#9aa8bc' || desc[4].color !== '#e04f4f') fail('descriptor tint → color');

const bodyLayer = api.fromDescriptor({
  schema: 1,
  slots: [
    { slot: 'head', itemId: 'head_helm_iron', tint: '#9aa8bc', layer: 'body' },
    { slot: 'chest', itemId: null, kind: null, vanity: true, hasStats: false, tint: null, accent: null, layer: 'chest' },
    { slot: 'hands', itemId: null, kind: null, vanity: true, hasStats: false, tint: null, accent: null, layer: 'hands' },
    { slot: 'legs', itemId: null, kind: null, vanity: true, hasStats: false, tint: null, accent: null, layer: 'legs' },
    { slot: 'back', itemId: 'back_cape_red', tint: '#e04f4f', layer: 'body' },
  ],
});
if (bodyLayer.length !== 2) fail('#280 empty slots must be skipped');
if (bodyLayer[0].slot !== 'head' || bodyLayer[0].layer !== 'head') fail('#280 body layer must stay on head slot');
if (bodyLayer[1].slot !== 'back' || bodyLayer[1].layer !== 'back') fail('#280 body layer must stay on back slot');

if (api.kindFromId('back_tail_fox', 'back') !== 'tail') fail('tail_fox → tail');
if (api.kindFromId('back_void_spine', 'back') !== 'crystal') fail('void_spine → crystal');

const prevDesc = ctx.gearRenderDescriptor;
const prevSave = ctx.save;
ctx.gearRenderDescriptor = function gearRenderDescriptor() {
  return {
    schema: 1,
    slots: [
      { slot: 'head', itemId: 'head_helm_iron', kind: 'armour', vanity: false, hasStats: true, tint: '#9aa8bc', accent: '#7cf5ff', layer: 'head' },
      { slot: 'chest', itemId: 'chest_plate_knight', kind: 'armour', vanity: false, hasStats: true, tint: '#c9d6e8', accent: '#8fa3d9', layer: 'chest' },
      { slot: 'hands', itemId: 'hands_gauntlet_steel', kind: 'armour', vanity: false, hasStats: true, tint: '#b8c4d4', accent: '#6a5030', layer: 'hands' },
      { slot: 'legs', itemId: 'legs_greaves_iron', kind: 'armour', vanity: false, hasStats: true, tint: '#8fa3d9', accent: '#5a6474', layer: 'legs' },
      { slot: 'back', itemId: 'back_cape_red', kind: 'cosmetic', vanity: true, hasStats: false, tint: '#e04f4f', accent: '#c97a20', layer: 'back' },
    ],
  };
};
ctx.save = { gear: { equipped: { head: 'head_helm_iron' } } };
const fromLiveApi = api.resolve({ isPlayer: true, style: { id: 'leaf_band', bandana: '#2d6b36', plate: '#dfe8ff', accent: '#43b25b' } });
if (fromLiveApi.length < 5) fail('gearRenderDescriptor must paint all 5 equipped slots');
if (!fromLiveApi.some((l) => l.kind === 'helmet' && l.slot === 'head')) fail('live descriptor head');
if (!fromLiveApi.some((l) => l.kind === 'cape' && l.slot === 'back')) fail('live descriptor back');
if (fromLiveApi.some((l) => l.kind === 'bandana')) fail('live 5-slot loadout replaces style head');
const previewIso = api.resolve({
  isPlayer: true,
  _preview: true,
  style: { id: 'leaf_band', bandana: '#2d6b36', plate: '#dfe8ff', accent: '#43b25b' },
});
if (!previewIso.some((l) => l.kind === 'bandana')) fail('style preview must keep style pieces');
if (previewIso.some((l) => l.kind === 'helmet' || l.kind === 'cape')) fail('style preview must not steal live gearRenderDescriptor');
ctx.gearRenderDescriptor = prevDesc;
ctx.save = prevSave;

const viaFighter = api.resolve({
  isPlayer: true,
  style: { id: 'leaf_band', bandana: '#2d6b36', plate: '#dfe8ff', accent: '#43b25b' },
  gearDescriptor: { slots: [{ slot: 'head', itemId: 'head_helm_tin', tint: '#aaa', layer: 'head' }] },
});
if (!viaFighter.some((l) => l.kind === 'helmet')) fail('descriptor must drive resolve');
if (viaFighter.some((l) => l.kind === 'bandana')) fail('equipped head slot replaces style head');

const catalogIds = [
  ['head', 'wrap_cloth'], ['head', 'bandana_blue'], ['head', 'beanie_wool'], ['head', 'hat_paper'],
  ['head', 'crown_cardboard'], ['head', 'mask_fox'], ['head', 'horns_foam'], ['head', 'hat_chef'],
  ['head', 'hood_rain'], ['head', 'helm_pumpkin'], ['head', 'halo_wire'], ['head', 'visor_toy'],
  ['head', 'hood_void_paint'], ['head', 'mask_dream'], ['head', 'horns_sulfur'], ['head', 'visor_neon'],
  ['head', 'circlet_focus'], ['head', 'helm_lucky'], ['head', 'helm_tin'], ['head', 'helm_bronze'],
  ['head', 'helm_iron'], ['head', 'helm_steel'], ['head', 'helm_knight'], ['head', 'helm_crystal'],
  ['head', 'helm_void'], ['head', 'helm_nightmare'], ['head', 'helm_hell'],
  ['chest', 'shirt_plain'], ['chest', 'hoodie_gray'], ['chest', 'vest_denim'], ['chest', 'coat_red'],
  ['chest', 'gi_white'], ['chest', 'jacket_bomber'], ['chest', 'tunic_leaf'], ['chest', 'shirt_stripe'],
  ['chest', 'poncho_rain'], ['chest', 'robe_star'], ['chest', 'capelet_gold'], ['chest', 'jacket_void_paint'],
  ['chest', 'coat_dream'], ['chest', 'robe_ash'], ['chest', 'vest_lucky'], ['chest', 'sash_energy'],
  ['chest', 'coat_shadow_stat'], ['chest', 'vest_padded'], ['chest', 'mail_copper'], ['chest', 'plate_iron'],
  ['chest', 'cuirass_steel'], ['chest', 'plate_knight'], ['chest', 'vest_crystal'], ['chest', 'plate_void'],
  ['chest', 'plate_nightmare'], ['chest', 'plate_hell'],
  ['hands', 'wrap'], ['hands', 'mittens_wool'], ['hands', 'rings_plastic'], ['hands', 'gloves_sparkle'],
  ['hands', 'claws_toy'], ['hands', 'gloves_chef'], ['hands', 'wraps_gold'], ['hands', 'gloves_pixel'],
  ['hands', 'cuffs_bell'], ['hands', 'gloves_opera'], ['hands', 'claws_void_paint'], ['hands', 'wraps_dream'],
  ['hands', 'gaunt_ash_paint'], ['hands', 'gloves_tape'], ['hands', 'bracer_focus'], ['hands', 'wraps_monk'],
  ['hands', 'gloves_grip'], ['hands', 'bracer_leather'], ['hands', 'gauntlet_iron'], ['hands', 'gauntlet_steel'],
  ['hands', 'fists_spike'], ['hands', 'gauntlet_crystal'], ['hands', 'gauntlet_void'], ['hands', 'gauntlet_nightmare'],
  ['hands', 'gauntlet_hell'],
  ['legs', 'wrap'], ['legs', 'socks_plain'], ['legs', 'shorts_stripe'], ['legs', 'socks_lucky'],
  ['legs', 'pants_baggy'], ['legs', 'boots_clown'], ['legs', 'tabi_white'], ['legs', 'sneakers_check'],
  ['legs', 'wrap_gold'], ['legs', 'bells_ankle'], ['legs', 'boots_platform'], ['legs', 'wraps_void_paint'],
  ['legs', 'socks_dream'], ['legs', 'boots_ash_paint'], ['legs', 'boots_sprint'], ['legs', 'greaves_steady'],
  ['legs', 'boots_dash'], ['legs', 'boots_soft'], ['legs', 'greaves_leather'], ['legs', 'greaves_iron'],
  ['legs', 'boots_steel'], ['legs', 'greaves_knight'], ['legs', 'greaves_crystal'], ['legs', 'greaves_void'],
  ['legs', 'greaves_nightmare'], ['legs', 'greaves_hell'],
  ['back', 'pin_dot'], ['back', 'pin_star'], ['back', 'backpack_school'], ['back', 'scarf_long'],
  ['back', 'cape_red'], ['back', 'tail_fox'], ['back', 'banner_leaf'], ['back', 'kite_paper'],
  ['back', 'balloon_party'], ['back', 'wings_cardboard'], ['back', 'aura_glow'], ['back', 'cape_shadow'],
  ['back', 'cape_void_paint'], ['back', 'wings_dream'], ['back', 'wings_ash'], ['back', 'leaf'],
  ['back', 'cape_lucky'], ['back', 'void'], ['back', 'pack_leather'], ['back', 'plate_back'],
  ['back', 'shell_turtle'], ['back', 'banner_iron'], ['back', 'wing_steel'], ['back', 'crystal_shard'],
  ['back', 'void_spine'], ['back', 'wings_nightmare'], ['back', 'wings_hell'],
];
if (catalogIds.length !== 131) fail('catalog snapshot must stay 131');
const drawable = new Set(['bandana', 'visor', 'fox', 'horns', 'halo', 'glow', 'helmet', 'gloves', 'charm', 'greaves', 'wrap', 'wings', 'cape', 'tome', 'crystal', 'chestplate', 'vest', 'tail']);
for (const [slot, suf] of catalogIds) {
  const id = slot + '_' + suf;
  const kind = api.kindFromId(id, slot);
  if (!drawable.has(kind)) fail('undrawable kind for ' + id + ' → ' + kind);
}

if (typeof api.drawPreview === 'function') {
  const rec5 = recordingContext();
  api.drawPreview(rec5, 'classic', null);
  const f = api.drawPreview(rec5, 'classic');
  void f;
}

if (typeof api.drawPreview !== 'function') fail('drawPreview missing');
const rec = recordingContext();
try {
  for (const id of Object.keys(expectKind)) {
    api.drawPreview(rec, id);
    const recOne = recordingContext();
    api.drawPreview(recOne, id);
    const headArcs = recOne.calls.filter((c) => c[0] === 'arc' && Number(c[3]) >= 8 && Number(c[3]) <= 13.5);
    if (!headArcs.length) fail(id + ' preview drew no head-sized arc (head vanished)');
  }
  api.drawPreview(rec, 'leaf_band', { head: { kind: 'helmet', color: '#ccc' } });
} catch (e) {
  fail('drawPreview threw: ' + e.message);
}
if (!rec.calls.some((c) => c[0] === 'quad')) fail('bandana/coat should use curved paths, not only rects');
if (!rec.calls.some((c) => c[0] === 'fill')) fail('preview produced no fills');

console.log('SMOKE_OK equip-look slots=' + api.slots.join(',') + ' styles=' + Object.keys(expectKind).length);
