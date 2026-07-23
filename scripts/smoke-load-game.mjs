#!/usr/bin/env node
/** Smoke: laadt game.js in een minimale DOM — vangt TDZ / init crashes. */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const code = fs.readFileSync(path.join(root, 'game.js'), 'utf8');

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
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 40 }; },
    setAttribute() {},
    getAttribute() { return null; },
    getContext() {
      return new Proxy({}, {
        get: (_t, p) => {
          if (p === 'createLinearGradient' || p === 'createRadialGradient') {
            return () => ({ addColorStop() {} });
          }
          return () => undefined;
        },
      });
    },
  };
}

const byId = new Map();
const get = (id) => {
  if (!byId.has(id)) byId.set(id, makeEl(id));
  return byId.get(id);
};

[
  'menuScreen', 'levelScreen', 'weaponScreen', 'styleScreen', 'settingsScreen',
  'missionsScreen', 'charSelectScreen', 'dexScreen', 'helpScreen', 'installScreen',
  'resultScreen', 'pauseScreen', 'game', 'toastHost', 'pauseBtn', 'menuStats',
  'menuDailyHint', 'menuTipLine', 'menuPlayLink', 'togMusic', 'togSfx',
  'btnAdventure', 'btnTraining', 'btnWall', 'btnMatsCoins', 'btnWeapons', 'btnDex', 'btnVersus',
  'btnContinue', 'btnStyle', 'btnSettings', 'btnMissions', 'btnMissionsLbl', 'btnHelp', 'helpOk',
  'btnGuvve', 'pauseResume', 'pauseQuit', 'resAgain', 'resNext', 'resMenu',
  'pauseTogMusic', 'pauseTogSfx', 'tunnelBootOverlay', 'charPickStep', 'charGrid',
  'charGridScroll', 'charStatPreview', 'charP1Label', 'charP2Label', 'btnCharFight',
  'btnCharRandom', 'btnCharSwap', 'btnCharSagaClash', 'charIconRow', 'charPickBackP1', 'charSelectBack', 'netStatus',
].forEach(get);
get('menuScreen').classList.add('active');

const ctx = {
  document: {
    getElementById: get,
    querySelector() { return null; },
    querySelectorAll(sel) {
      if (sel === '.screen') {
        return [...byId.values()].filter((e) => String(e.id).endsWith('Screen'));
      }
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
    constructor() {
      this.state = 'running';
      this.destination = {};
      this.currentTime = 0;
      this.sampleRate = 44100;
    }
    createGain() {
      return { connect() { return this; }, gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} } };
    }
    createOscillator() {
      return {
        connect() { return this; }, start() {}, stop() {}, type: 'sine',
        frequency: { value: 440, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      };
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
  vm.runInContext(code, vm.createContext(ctx), { filename: 'game.js' });
} catch (e) {
  console.error('SMOKE_FAIL', e.message);
  process.exit(1);
}

// const/let zitten niet op window — bewijs via side-effect na boot
Promise.resolve().then(() => {
  if (!ctx.__sfBooted) {
    console.error('SMOKE_FAIL bootGame did not run (__sfBooted unset)');
    process.exit(1);
  }
  console.log('SMOKE_OK game.js loaded + bootGame');
}).catch((e) => {
  console.error('SMOKE_FAIL', e.message);
  process.exit(1);
});
