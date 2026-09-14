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
if (!api.slots || api.slots.join(',') !== 'head,chest,legs,back,trinket') fail('5 slots must be head,chest,legs,back,trinket');
if (!api.layers || api.layers[0] !== 'under' || api.layers[api.layers.length - 1] !== 'front') {
  fail('layers must start under and end front');
}

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
if (!leaf || leaf.oy === undefined || leaf.scale < 1) fail('leaf_band bandana needs tuned oy/scale');
if (leaf.color !== '#2d6b36') fail('leaf_band color should hydrate from style');

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

if (typeof api.drawPreview !== 'function') fail('drawPreview missing');
const rec = recordingContext();
try {
  for (const id of Object.keys(expectKind)) api.drawPreview(rec, id);
  api.drawPreview(rec, 'leaf_band', { head: { kind: 'helmet', color: '#ccc' } });
} catch (e) {
  fail('drawPreview threw: ' + e.message);
}
if (!rec.calls.some((c) => c[0] === 'quad')) fail('bandana/coat should use curved paths, not only rects');
if (!rec.calls.some((c) => c[0] === 'fill')) fail('preview produced no fills');

console.log('SMOKE_OK equip-look slots=' + api.slots.join(',') + ' styles=' + Object.keys(expectKind).length);
