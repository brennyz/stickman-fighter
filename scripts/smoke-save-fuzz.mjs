#!/usr/bin/env node
/** Fuzz: corrupt save snapshots must sanitize without throwing. */
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
    querySelector() { return null; }, querySelectorAll() { return [] },
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 40 }; },
    setAttribute() {}, removeAttribute() {}, getAttribute() { return null; },
    getContext() {
      return new Proxy({}, { get: (_t, p) => (p === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => undefined) });
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

vm.runInContext(code, vm.createContext(ctx), { filename: 'game.js' });

const base = ctx.sanitizeSave(Object.assign({}, ctx.DEFAULT_SAVE));
const mutators = [
  (s) => { s.lvl = 'oops'; },
  (s) => { s.xp = NaN; },
  (s) => { s.unlocked = -99; },
  (s) => { s.weapon = 'fake_blade'; },
  (s) => { s.style = null; },
  (s) => { s.dex = 'not-an-object'; },
  (s) => { s.pets = [{ id: 'x' }]; },
  (s) => { s.stats = null; },
  (s) => { s.skillUpgrades = { rasengan: { level: 999, shards: -5 } }; },
  (s) => { s.itemUpgrades = { weapon: { fake: { level: 9 } }, hacker: { x: 1 } }; },
  (s) => { s.achievements = '[]'; },
  (s) => { s.activeJutsu = 42; },
  (s) => { s.stars = { abc: 'three' }; },
  (s) => { s.tipsSeen = 'yes'; },
  (s) => { delete s.lvl; delete s.xp; },
  (s) => { s.musicVol = 'loud'; s.sfxVol = Infinity; },
  (s) => {
    s.skillUpgrades = { rasengan: { level: 'max', shards: null }, fake: 42 };
    s.itemUpgrades = { weapon: { katana: { level: -3, shards: 'x' } }, hacker: { x: 1 } };
  },
];

let ok = 0;
for (let i = 0; i < mutators.length; i++) {
  const dirty = JSON.parse(JSON.stringify(base));
  mutators[i](dirty);
  try {
    const clean = ctx.sanitizeSave(dirty);
    if (!clean || typeof clean.lvl !== 'number') throw new Error('bad lvl after sanitize');
    ctx.saveSanitizeNotes(dirty, clean);
    ok++;
  } catch (e) {
    console.error('SMOKE_FAIL save-fuzz case', i, e.message || e);
    process.exit(1);
  }
}

// Version-stash envelope must unwrap to real progress
try {
  const env = {
    schema: 3,
    fromApp: '1.18.0',
    stashedAt: '2026-01-01T00:00:00Z',
    save: Object.assign({}, base, { lvl: 22, unlocked: 18 }),
    summary: 'Lv 22',
  };
  const loaded = ctx.readSaveJson(JSON.stringify(env));
  if (!loaded || loaded.lvl !== 22 || loaded.unlocked !== 18) {
    throw new Error('envelope unwrap failed: lvl=' + (loaded && loaded.lvl));
  }
  if (typeof ctx.previewImportSave === 'function') {
    const { save: imported } = ctx.previewImportSave(JSON.stringify(env));
    if (!imported || imported.lvl !== 22) throw new Error('previewImportSave envelope failed');
  }
  ok++;
} catch (e) {
  console.error('SMOKE_FAIL save-fuzz envelope', e.message || e);
  process.exit(1);
}

console.log(`SMOKE_OK save-fuzz ${ok}/${mutators.length + 1} corrupt saves repaired`);
