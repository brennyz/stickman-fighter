#!/usr/bin/env node
/**
 * Options aim-indicator: color + radius persist, sanitize, and draw use prefs.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error('SMOKE_FAIL', msg);
  process.exit(1);
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const inputSrc = fs.readFileSync(path.join(root, 'src/systems/input.js'), 'utf8');
const storageSrc = fs.readFileSync(path.join(root, 'src/core/storage.js'), 'utf8');
const startSrc = fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8');

if (!/id="setAimColor"/.test(html)) fail('settings missing setAimColor');
if (!/id="setAimRadius"/.test(html)) fail('settings missing setAimRadius');
if (!/id="setAimColorSwatches"/.test(html)) fail('settings missing color swatches');
if (!/id="aimPrefPreview"/.test(html)) fail('settings missing aim preview');
if (!/data-aim-color="#7cf5ff"/.test(html)) fail('default cyan swatch missing');
if (!/aimColor: '#7cf5ff'/.test(storageSrc)) fail('DEFAULT_SAVE.aimColor missing');
if (!/aimRadius: 8/.test(storageSrc)) fail('DEFAULT_SAVE.aimRadius missing');
if (!/function sanitizeAimHex/.test(storageSrc)) fail('sanitizeAimHex missing');
if (!/function aimPrefColor/.test(inputSrc)) fail('aimPrefColor missing');
if (!/function drawAimPrefPreview/.test(inputSrc)) fail('drawAimPrefPreview missing');
if (!/applyAimPrefs\(/.test(startSrc)) fail('settings must persist via applyAimPrefs');
if (/function projAimVelocity[\s\S]{0,200}aimColor/.test(inputSrc)) {
  fail('aim prefs must not rewrite projAimVelocity combat math');
}

const code = fs.readFileSync(path.join(root, 'game.js'), 'utf8');

function makeEl(id) {
  return {
    id, tagName: id === 'aimPrefPreview' ? 'CANVAS' : 'DIV',
    classList: { s: new Set(), add() {}, remove() {}, toggle() {}, contains: () => false },
    style: {}, hidden: false, dataset: {}, disabled: false, textContent: '', innerHTML: '', value: '',
    width: 180, height: 72,
    children: [], parentElement: null, closest() { return this; },
    addEventListener() {}, removeEventListener() {}, appendChild() {}, remove() {}, focus() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 40 }; },
    setAttribute() {}, removeAttribute() {}, getAttribute() { return null; },
    getContext() {
      return new Proxy({}, {
        get: (_t, p) => (p === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => undefined),
      });
    },
  };
}

const byId = new Map();
const get = (id) => { if (!byId.has(id)) byId.set(id, makeEl(id)); return byId.get(id); };
get('menuScreen').classList.s.add('active');

const ctx = {
  document: {
    getElementById: get, querySelector: () => null, querySelectorAll: () => [],
    body: get('body'), createElement: (t) => makeEl(t),
    createTextNode: (s) => ({ nodeType: 3, textContent: String(s), data: String(s) }),
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
  navigator: { onLine: true, userAgent: 'node', maxTouchPoints: 5, platform: 'Linux', vibrate() {} },
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

vm.runInContext(code, vm.createContext(ctx), { filename: 'game.js' });

if (typeof ctx.sanitizeAimHex !== 'function') fail('sanitizeAimHex not global');
if (ctx.sanitizeAimHex('#ffd75e') !== '#ffd75e') fail('hex 6 not kept');
if (ctx.sanitizeAimHex('#abc') !== '#aabbcc') fail('hex 3 not expanded');
if (ctx.sanitizeAimHex('red') !== '#7cf5ff') fail('bad color must fall back to cyan');
if (ctx.sanitizeAimRadius(99) !== 18) fail('radius must clamp high');
if (ctx.sanitizeAimRadius(2) !== 4) fail('radius must clamp low');
if (ctx.sanitizeAimRadius('nope') !== 8) fail('bad radius must default to 8');

const dirty = ctx.sanitizeSave(Object.assign({}, ctx.DEFAULT_SAVE, { aimColor: 'nope', aimRadius: 40 }));
if (dirty.aimColor !== '#7cf5ff') fail('sanitizeSave aimColor fallback');
if (dirty.aimRadius !== 18) fail('sanitizeSave aimRadius clamp');

const applied = ctx.applyAimPrefs('#ffb06a', 14);
if (!applied || applied.color !== '#ffb06a' || applied.radius !== 14) fail('applyAimPrefs return');
if (ctx.aimPrefColor() !== '#ffb06a') fail('aimPrefColor not reading save');
if (ctx.aimPrefRadius() !== 14) fail('aimPrefRadius not reading save');
if (ctx.aimVisualColor(-0.9) !== '#ffb06a') fail('aimVisualColor must use user color');

const stored = JSON.parse(ctx.localStorage.getItem('stickfighter_save_v1') || 'null');
if (!stored || stored.aimColor !== '#ffb06a' || stored.aimRadius !== 14) {
  fail('persist did not write aim prefs');
}
const again = ctx.sanitizeSave(stored);
if (again.aimColor !== '#ffb06a' || again.aimRadius !== 14) fail('reload sanitize dropped aim prefs');

const arcs = [];
const fakeC = {
  save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {},
  arc(_x, _y, r) { arcs.push(r); },
  lineWidth: 0, strokeStyle: '', fillStyle: '', globalAlpha: 1, lineCap: '',
};
ctx.drawPlayerAimIndicator(fakeC, { alive: true, x: 80, y: 220, face: 1 }, 1);
if (!arcs.length) fail('drawPlayerAimIndicator did not draw radius dot');
if (arcs[0] !== 14) fail('drawn radius must follow save.aimRadius, got ' + arcs[0]);

console.log('SMOKE_OK aim-indicator: options color+radius persist + draw');
