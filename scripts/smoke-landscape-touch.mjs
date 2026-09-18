#!/usr/bin/env node
/**
 * Short-landscape 1P pads (~844×390): punch/jump/swipe reachable, ≥44px,
 * above the system nav, clear of the #321 pause gutter. Portrait must not
 * change jump-rightmost. Versus/dual is out of scope.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

const input = fs.readFileSync(path.join(root, 'src/systems/input.js'), 'utf8');
const dens = fs.readFileSync(path.join(root, 'src/systems/combat-density.js'), 'utf8');
const versus = fs.readFileSync(path.join(root, 'src/systems/versus.js'), 'utf8');

must(/function\s+touchPhoneLandscape\s*\(/.test(input), 'touchPhoneLandscape missing');
must(/else if \(touchPhoneLandscape\(W, H\)\)/.test(input), '1P short-landscape cluster missing');
must(/Short landscape 1P/.test(input), 'landscape layout comment missing');
must(/hudSafeLayout/.test(input) && /pauseGutter/.test(input), 'must keep #321 hudSafeLayout');
must(!/touchPhoneLandscape/.test(versus), 'versus.js must not own landscape pads');
must(/yCut = shortLand \? 0\.55 : 0\.62/.test(dens), 'short-landscape swipe y-cut missing');

function makeEl(id) {
  return {
    id,
    tagName: id === 'game' ? 'CANVAS' : 'DIV',
    classList: { s: new Set(), add(x) { this.s.add(x); }, remove(x) { this.s.delete(x); }, contains(x) { return this.s.has(x); }, toggle() {} },
    style: {}, hidden: false, dataset: {}, textContent: '', innerHTML: '',
    getContext() {
      return {
        fillRect() {}, clearRect() {}, beginPath() {}, arc() {}, fill() {}, stroke() {},
        moveTo() {}, lineTo() {}, closePath() {}, save() {}, restore() {}, translate() {},
        scale() {}, rotate() {}, fillText() {}, strokeText() {}, measureText: (t) => ({ width: String(t).length * 7 }),
        createLinearGradient() { return { addColorStop() {} }; },
        createRadialGradient() { return { addColorStop() {} }; },
        drawImage() {}, setLineDash() {}, quadraticCurveTo() {}, ellipse() {},
        fillStyle: '', strokeStyle: '', font: '', textAlign: '', textBaseline: '',
        globalAlpha: 1, lineWidth: 1, shadowBlur: 0, shadowColor: '',
      };
    },
    addEventListener() {}, removeEventListener() {}, appendChild() {}, querySelector() { return null; },
    querySelectorAll() { return []; }, getBoundingClientRect() { return { left: 0, top: 0, width: 390, height: 844 }; },
    setAttribute() {}, getAttribute() { return null; }, focus() {}, click() {},
  };
}

const els = {};
const ctx = {
  console,
  setTimeout, clearTimeout,
  setInterval() { return 0; },
  clearInterval() {},
  requestAnimationFrame() { return 0; },
  cancelAnimationFrame() {},
  performance: { now: () => Date.now() },
  innerWidth: 390, innerHeight: 844,
  devicePixelRatio: 2,
  navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile', language: 'en', vibrate() {}, maxTouchPoints: 5 },
  localStorage: { _s: {}, getItem(k) { return this._s[k] ?? null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } },
  document: {
    documentElement: { style: { setProperty() {} }, classList: { add() {}, remove() {}, contains() { return false; } } },
    body: { classList: { s: new Set(), add(x) { this.s.add(x); }, remove(x) { this.s.delete(x); }, contains(x) { return this.s.has(x); }, toggle(x, on) { on ? this.s.add(x) : this.s.delete(x); } }, appendChild() {}, style: {} },
    getElementById: (id) => (els[id] || (els[id] = makeEl(id))),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
    createElement: (tag) => makeEl(tag),
    hidden: false,
  },
  addEventListener() {},
  removeEventListener() {},
  getComputedStyle() { return { getPropertyValue() { return '0px'; } }; },
  matchMedia: () => ({ matches: false, addListener() {}, addEventListener() {} }),
  Image: function () { this.onload = null; this.src = ''; },
  Audio: function () { this.play = () => Promise.resolve(); this.pause = () => {}; },
  URL: { createObjectURL() { return ''; }, revokeObjectURL() {} },
  location: { href: 'http://127.0.0.1/index.html', hostname: '127.0.0.1', protocol: 'http:', search: '', hash: '' },
  history: { replaceState() {} },
  HTMLCanvasElement: function () {},
  OffscreenCanvas: function () {},
  Path2D: function () {},
  visualViewport: { width: 390, height: 844, offsetTop: 0, offsetLeft: 0, addEventListener() {} },
  AudioContext: class {
    constructor() { this.destination = {}; this.sampleRate = 44100; this.state = 'running'; }
    createGain() { return { connect() { return this; }, gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
    createOscillator() { return { connect() { return this; }, start() {}, stop() {}, frequency: { value: 440, setValueAtTime() {} } }; }
    createBuffer() { return { getChannelData: () => new Float32Array(8) }; }
    createBufferSource() { return { connect() { return this; }, start() {}, buffer: null }; }
    createBiquadFilter() { return { connect() { return this; }, frequency: { value: 0 } }; }
    resume() { return Promise.resolve(); }
  },
};
ctx.window = ctx;
ctx.globalThis = ctx;
ctx.self = ctx;
ctx.webkitAudioContext = ctx.AudioContext;

try {
  vm.runInContext(fs.readFileSync(path.join(root, 'game.js'), 'utf8'), vm.createContext(ctx), { filename: 'game.js' });
} catch (e) {
  console.error('SMOKE_FAIL landscape-touch boot', e.message);
  process.exit(1);
}

Promise.resolve().then(() => {
  must(ctx.__sfBooted, 'bootGame did not run');
  const landFn = ctx.touchPhoneLandscape || (ctx.__sf && ctx.__sf.touchPhoneLandscape);
  must(typeof landFn === 'function', 'touchPhoneLandscape not in boot scope');
  must(landFn(844, 390), '844×390 is phone landscape');
  must(landFn(568, 320), '568×320 is phone landscape');
  must(!landFn(390, 844), '390×844 is not landscape');
  must(!landFn(1180, 820), 'iPad landscape is not phone-landscape');
  must(!landFn(1280, 720), 'desktop is not phone-landscape');

  const layFn = ctx.hudSafeLayout || (ctx.__sf && ctx.__sf.hudSafeLayout);
  must(typeof layFn === 'function', 'hudSafeLayout missing');
  const pause390 = layFn(390, 844, 'adventure').pauseGutter;
  const pauseLand = layFn(844, 390, 'adventure').pauseGutter;
  must(pause390 >= 58 && pauseLand >= 58, 'pause gutter regress ' + pause390 + '/' + pauseLand);
  must(layFn(844, 390, 'adventure').compact === false, 'landscape HUD must stay non-compact');

  const Input = ctx.__sf && ctx.__sf.Input;
  must(Input && typeof Input.layout === 'function', 'Input.layout missing on __sf');
  const swipeFn = ctx.combatJoySwipeAccepts || (ctx.__sf && ctx.__sf.combatDensity && ctx.__sf.combatDensity.joySwipe);
  const joyZone = ctx.pointInJoyZone;

  ctx.W = 390; ctx.H = 844;
  Input.dualMode = false;
  Input.layout(390, 844);
  const port = {};
  for (const b of Input.buttons || []) port[b.id] = { x: Math.round(b.x), y: Math.round(b.y), d: Math.round(b.r * 2) };
  must(port.jump && port.punch && port.jump.x > port.punch.x, 'portrait jump must stay right of punch');
  must(port.jump.d >= 44 && port.punch.d >= 44, 'portrait 44px floor');

  ctx.W = 844; ctx.H = 390;
  Input.layout(844, 390);
  const land = {};
  for (const b of Input.buttons || []) land[b.id] = { x: Math.round(b.x), y: Math.round(b.y), r: b.r, d: Math.round(b.r * 2) };
  must(land.jump && land.punch && land.kick, 'landscape missing punch/jump/kick');
  must(land.jump.d >= 44 && land.punch.d >= 44 && land.kick.d >= 44, 'landscape <44px ' + JSON.stringify(land));
  must(land.jump.x > land.punch.x && land.punch.x > land.kick.x, 'landscape thumb order jump>punch>kick');
  must(land.punch.x > 844 * 0.55, 'landscape punch not in right thumb ' + land.punch.x);
  const minBottom = Math.min(...(Input.buttons || []).map((b) => 390 - (b.y + b.r)));
  must(minBottom >= 24, 'landscape buttons in system nav ' + minBottom);
  const joy = Input.joyHome;
  must(joy && joy.y + 40 <= 390 - 18, 'landscape joy in system nav ' + (joy && joy.y));
  must(land.kick.x - land.kick.r > 844 * 0.34, 'landscape kick overlaps swipe band');
  const pause = layFn(844, 390, 'adventure').pause;
  must(land.special.y - land.special.r > pause.y + pause.h, 'landscape special hits pause gutter');
  must(typeof swipeFn === 'function' && swipeFn(80, 320, 844, 390) === true, 'landscape swipe dead');
  must(swipeFn(700, 320, 844, 390) === false, 'landscape swipe steals punch');
  if (typeof joyZone === 'function') {
    must(joyZone(Input, 80, 320) === true, 'landscape left-bottom should be joy/swipe');
    must(joyZone(Input, land.punch.x, land.punch.y) === false, 'punch center must not be joy');
  }

  Input.dualMode = false;
  ctx.W = 390; ctx.H = 844;
  Input.layout(390, 844);
  const port2 = {};
  for (const b of Input.buttons || []) port2[b.id] = { x: Math.round(b.x) };
  must(port2.jump && port2.jump.x === port.jump.x && port2.punch.x === port.punch.x, 'portrait layout drifted after landscape');

  console.log(JSON.stringify({
    ok: true,
    portrait: port,
    landscape: land,
    joy: { x: Math.round(joy.x), y: Math.round(joy.y) },
    pauseGutter: pauseLand,
    app: ctx.APP_VERSION || (ctx.__sf && ctx.__sf.version),
  }));
  console.log('SMOKE_OK landscape-touch 844×390');
  process.exit(0);
}).catch((e) => {
  console.error('SMOKE_FAIL', e.message);
  process.exit(1);
});
