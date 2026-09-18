#!/usr/bin/env node
/**
 * Phone HUD keep-out (~390×844): pause must not cover stars/HP,
 * compact stack starts below chrome, sheets get a bottom pad, dock ≥44px.
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

const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const input = fs.readFileSync(path.join(root, 'src/systems/input.js'), 'utf8');
const gameSrc = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');

must(/function\s+hudPhoneCompact\s*\(/.test(input), 'hudPhoneCompact missing');
must(/function\s+hudPauseGutter\s*\(/.test(input), 'hudPauseGutter missing');
must(/function\s+hudSafeLayout\s*\(/.test(input), 'hudSafeLayout missing');
must(/function\s+hudTouchClearY\s*\(/.test(input), 'hudTouchClearY missing');
must(/hudSafeLayout\(W, H, this\.mode\)/.test(gameSrc), 'drawHUD must use hudSafeLayout');
must(/starX0/.test(gameSrc), 'adventure stars must use pause gutter (starX0)');
must(/wallYOff/.test(gameSrc), 'wall HUD must shift below chrome on phone');
must(/trainYOff/.test(gameSrc), 'training HUD must shift below chrome on phone');
must(/hudTouchClearY/.test(gameSrc), 'wave-pause ring must sit above touch buttons');
must(!/mode === 'versus'[\s\S]{0,80}compact \?/.test(gameSrc), 'must not rewrite Versus HUD');
must(/--hud-pause-gutter:/.test(css), 'CSS --hud-pause-gutter');
must(/--sheet-bottom-pad:/.test(css), 'CSS --sheet-bottom-pad');
must(/@media \(max-width: 430px\)/.test(css), 'CSS ≤430 phone HUD');

function rectsOverlap(a, b, pad) {
  const p = pad || 0;
  return a.x + a.w - p > b.x && b.x + b.w - p > a.x && a.y + a.h - p > b.y && b.y + b.h - p > a.y;
}

const gameJs = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
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
        scale() {}, rotate() {}, setTransform() {}, fillText() {}, strokeText() {}, measureText: (t) => ({ width: String(t).length * 7 }),
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
  navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile', language: 'en', vibrate() {} },
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
  vm.runInContext(gameJs, vm.createContext(ctx), { filename: 'game.js' });
} catch (e) {
  console.error('SMOKE_FAIL hud-phone boot', e.message);
  process.exit(1);
}

Promise.resolve().then(() => {
  must(ctx.__sfBooted, 'bootGame did not run');
  const layFn = ctx.hudSafeLayout || (ctx.__sf && ctx.__sf.hudSafeLayout);
  must(typeof layFn === 'function', 'hudSafeLayout not in boot scope');
  must(typeof ctx.hudPhoneCompact === 'function' && ctx.hudPhoneCompact(390, 844), '390×844 should be compact');
  must(!ctx.hudPhoneCompact(844, 390), 'landscape 844×390 should not be compact');
  must(!ctx.hudPhoneCompact(820, 1180), 'iPad portrait should not use phone compact');

  const pixel = layFn(390, 844, 'adventure');
  must(pixel.compact === true, 'pixel layout compact');
  must(pixel.pauseGutter >= 58, 'pause gutter too small ' + pixel.pauseGutter);
  must(pixel.centerY >= pixel.hp.y + pixel.hp.h - 2, 'center stack overlaps HP row ' + pixel.centerY + ' vs ' + (pixel.hp.y + pixel.hp.h));
  must(!rectsOverlap(pixel.hp, pixel.pause, 1), 'HP overlaps pause');
  must(!rectsOverlap(pixel.stars, pixel.pause, 1), 'stars overlap pause');
  must(pixel.stars.x + pixel.stars.w <= pixel.pause.x + 1, 'stars not left of pause');
  must(pixel.touchClearY < 844 - 80, 'touch-clear Y should sit above the button strip');
  must(pixel.hp.x + pixel.hp.w < pixel.stars.x + 8, 'HP should leave a gap before stars');

  const se = layFn(320, 568, 'wall');
  must(se.compact === true, 'SE compact');
  must(!rectsOverlap(se.stars, se.pause, 1), 'SE stars overlap pause');

  const desk = layFn(1280, 720, 'adventure');
  must(desk.compact === false, 'desktop should not be compact');

  const landHud = layFn(844, 390, 'adventure');
  must(landHud.compact === false, '844×390 HUD stays non-compact (#321)');
  must(landHud.pauseGutter >= 58, 'landscape pause gutter must stay (#321) ' + landHud.pauseGutter);
  must(!rectsOverlap(landHud.hp, landHud.pause, 1), 'land HP overlaps pause');
  must(!rectsOverlap(landHud.stars, landHud.pause, 1), 'land stars overlap pause');
  must(landHud.stars.x + landHud.stars.w <= landHud.pause.x + 1, 'land stars not left of pause');

  if (typeof ctx.startGame === 'function' && typeof ctx.W !== 'undefined') {
    try {
      ctx.W = 390; ctx.H = 844;
      if (typeof ctx.Input === 'object' && typeof ctx.Input.layout === 'function') ctx.Input.layout(390, 844);
      ctx.startGame('adventure', { level: 1, gamble: null });
      const g = ctx.game;
      if (g && typeof g.drawHUD === 'function') {
        const c = ctx.document.getElementById('game').getContext('2d');
        g.drawHUD(c);
        const used = g._hudLay;
        must(used && used.compact, 'drawHUD should stash compact layout');
        must(used.pauseGutter === pixel.pauseGutter, 'drawHUD pause gutter drift');
        if (typeof g.advHudBottom === 'number' && g.advHudBottom > 0) {
          must(g.advHudBottom < 844 * 0.42, 'adventure HUD covers too much playfield ' + g.advHudBottom);
        }
      }
    } catch (e) {
      console.error('SMOKE_FAIL hud-phone play', e && e.message);
      process.exit(1);
    }
  }

  console.log(JSON.stringify({
    ok: true,
    pixel: { compact: pixel.compact, pauseG: pixel.pauseGutter, centerY: pixel.centerY, hp: pixel.hp, stars: pixel.stars, pause: pixel.pause },
    app: ctx.APP_VERSION || (ctx.__sf && ctx.__sf.version),
  }));
  console.log('SMOKE_OK hud-phone 390×844 keep-out');
  process.exit(0);
}).catch((e) => {
  console.error('SMOKE_FAIL', e.message);
  process.exit(1);
});
