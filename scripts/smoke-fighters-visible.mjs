#!/usr/bin/env node
/**
 * P0: fighters + mobs must paint on portrait 390×844 and landscape 844×390.
 * Static + VM draw (no throw / translate+stroke) + optional Chrome pixel sample.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';
import http from 'http';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error('SMOKE_FAIL', msg);
  process.exit(1);
}

const canvasSrc = fs.readFileSync(path.join(root, 'src/core/canvas.js'), 'utf8');
const gameSrc = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const loopSrc = fs.readFileSync(path.join(root, 'src/boot/loop.js'), 'utf8');
const fighterSrc = fs.readFileSync(path.join(root, 'src/entities/fighter.js'), 'utf8');

if (!/function\s+resetFightCanvas\s*\(/.test(canvasSrc)) fail('resetFightCanvas missing');
if (!/function\s+pinPlayfieldBodies\s*\(/.test(canvasSrc)) fail('pinPlayfieldBodies missing');
if (!/function\s+fighterCombatStroke\s*\(/.test(canvasSrc)) fail('fighterCombatStroke missing');
if (!/function\s+drawFighterFallback\s*\(/.test(canvasSrc)) fail('drawFighterFallback missing');
if (!/drawCombatants\s*\(c\)/.test(gameSrc)) fail('Game.drawCombatants missing');
if (!/pinPlayfieldBodies\(this\)/.test(gameSrc)) fail('draw/onResize must pin bodies');
if (!/this\.weapon && this\.weapon\.id/.test(fighterSrc)) fail('fighter.draw must null-check weapon');
if (!/fighterCombatStroke/.test(fighterSrc)) fail('fighter.draw must use contrast stroke');
if (!/drawCombatants\(ctx\)/.test(loopSrc)) fail('draw-error recover must re-paint combatants');
if (/drawBackground[\s\S]{0,180}catch \(_\) \{\s*try \{ ctx\.fillStyle = '#0a0d18'/.test(loopSrc)
  && !/game\.drawCombatants/.test(loopSrc)) {
  fail('draw-error catch still wipes fighters with background-only paint');
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
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    imageSmoothingEnabled: true,
    save() { calls.push(['save']); },
    restore() { calls.push(['restore']); },
    setTransform() { calls.push(['setTransform']); },
    translate(x, y) { calls.push(['translate', x, y]); },
    scale() { calls.push(['scale']); },
    rotate() { calls.push(['rotate']); },
    beginPath() { calls.push(['beginPath']); },
    closePath() {},
    moveTo() { calls.push(['moveTo']); },
    lineTo() { calls.push(['lineTo']); },
    quadraticCurveTo() {},
    bezierCurveTo() {},
    arc() { calls.push(['arc']); },
    ellipse() { calls.push(['ellipse']); },
    fill() { calls.push(['fill', ctx.fillStyle]); },
    stroke() { calls.push(['stroke', ctx.strokeStyle]); },
    fillRect() { calls.push(['fillRect']); },
    strokeRect() {},
    fillText() { calls.push(['fillText']); },
    strokeText() {},
    measureText(t) { return { width: String(t || '').length * 7 }; },
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
    drawImage() {},
    setLineDash() {},
    clip() {},
    arcTo() {},
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
      contains(x) { return this.s.has(x); },
      toggle(x, on) { on ? this.s.add(x) : this.s.delete(x); },
    },
    style: {},
    hidden: false,
    dataset: {},
    textContent: '',
    innerHTML: '',
    width: 800,
    height: 400,
    getContext() { return recordingContext(); },
    addEventListener() {},
    removeEventListener() {},
    appendChild() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 390, height: 844 }; },
    setAttribute() {},
    getAttribute() { return null; },
    focus() {},
    click() {},
    setPointerCapture() {},
  };
}

function bootVm() {
  const gameJs = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
  const els = {};
  const errors = [];
  const ctx = {
    __errors: errors,
    console: {
      log() {},
      warn() {},
      error(...a) { errors.push(a.map(String).join(' ')); },
    },
    setTimeout(fn) { try { if (typeof fn === 'function') fn(); } catch (_) {} return 0; },
    clearTimeout() {},
    setInterval() { return 0; },
    clearInterval() {},
    requestAnimationFrame() { return 0; },
    cancelAnimationFrame() {},
    performance: { now: () => Date.now() },
    innerWidth: 390,
    innerHeight: 844,
    devicePixelRatio: 2,
    navigator: {
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile',
      language: 'en',
      vibrate() {},
      maxTouchPoints: 5,
    },
    localStorage: {
      _s: {},
      getItem(k) { return this._s[k] ?? null; },
      setItem(k, v) { this._s[k] = String(v); },
      removeItem(k) { delete this._s[k]; },
    },
    document: {
      documentElement: { style: { setProperty() {} }, classList: { add() {}, remove() {}, contains() { return false; } } },
      body: {
        classList: {
          s: new Set(),
          add(x) { this.s.add(x); },
          remove(x) { this.s.delete(x); },
          contains(x) { return this.s.has(x); },
          toggle(x, on) { on ? this.s.add(x) : this.s.delete(x); },
        },
        appendChild() {},
        style: {},
      },
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
  vm.runInContext(gameJs, vm.createContext(ctx), { filename: 'game.js' });
  return ctx;
}

function sizeTo(gctx, w, h) {
  gctx.innerWidth = w;
  gctx.innerHeight = h;
  if (gctx.visualViewport) {
    gctx.visualViewport.width = w;
    gctx.visualViewport.height = h;
  }
  if (typeof gctx.forceGameResize === 'function') gctx.forceGameResize();
  else if (typeof gctx.resize === 'function') gctx.resize();
}

function assertDrawVisible(gctx, label, w, h) {
  sizeTo(gctx, w, h);
  const GameFn = (gctx.__sf && gctx.__sf.Game) || gctx.Game;
  if (typeof gctx.startGame !== 'function' && typeof GameFn !== 'function') fail('startGame/Game missing');
  try {
    if (typeof gctx.startGame === 'function') {
      gctx.startGame('adventure', { level: 1, gamble: null, difficulty: 'normal' });
    }
  } catch (e) {
    fail(label + ' startGame threw: ' + e.message);
  }
  let g = (gctx.__sf && gctx.__sf.game) || gctx.game;
  if ((!g || !g.player) && typeof GameFn === 'function') {
    try { g = new GameFn('adventure', { level: 1, gamble: null, difficulty: 'normal' }); }
    catch (e) { fail(label + ' new Game threw: ' + e.message + ' | ' + (gctx.__errors || []).slice(-3).join(' | ')); }
  }
  if (!g || !g.player) fail(label + ' no player after startGame ' + (gctx.__errors || []).slice(-4).join(' | '));
  if (typeof gctx.pinPlayfieldBodies === 'function') gctx.pinPlayfieldBodies(g);
  for (let i = 0; i < 90; i++) {
    try { g.update(1 / 30); } catch (e) { fail(label + ' update threw: ' + e.message); }
  }
  if (!Number.isFinite(g.player.x) || !Number.isFinite(g.player.y)) fail(label + ' player xy not finite');
  if (g.player.y < 20 || g.player.y > h + 8) fail(label + ' player.y off playfield ' + g.player.y + ' H=' + h);
  if (g.player.y > g.ground + 2) fail(label + ' player below ground');
  if (g.player.x < 8 || g.player.x > w - 8) fail(label + ' player.x off playfield ' + g.player.x);

  const rec = recordingContext();
  try { g.draw(rec); } catch (e) { fail(label + ' draw threw: ' + e.message); }
  const strokes = rec.calls.filter((c) => c[0] === 'stroke' || c[0] === 'fill' || c[0] === 'arc' || c[0] === 'ellipse');
  if (strokes.length < 6) fail(label + ' too few paint calls ' + strokes.length);
  const px = g.player.x, py = g.player.y;
  const near = rec.calls.some((c) => c[0] === 'translate' && Math.abs(c[1] - px) < 80 && Math.abs(c[2] - py) < 80);
  if (!near) fail(label + ' no translate near player ' + px + ',' + py);

  const lifted = gctx.fighterCombatStroke('#1a2040');
  if (!lifted || lifted === '#1a2040') fail('cyber body #1a2040 must lift for contrast');

  return {
    label,
    w,
    h,
    player: { x: Math.round(g.player.x), y: Math.round(g.player.y), ground: Math.round(g.ground) },
    monsters: (g.monsters || []).length,
    paintCalls: strokes.length,
    cyberStroke: lifted,
  };
}

function startStaticServer(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let rel = decodeURIComponent((req.url || '/').split('?')[0]);
      if (rel === '/') rel = '/index.html';
      const file = path.join(root, rel.replace(/^\//, ''));
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('no'); return;
      }
      const ext = path.extname(file);
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.once('error', (err) => {
      if (err && err.code === 'EADDRINUSE') resolve(null);
      else reject(err);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function chromePixelProof() {
  const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
  if (!chrome) {
    console.log('SMOKE_SKIP chrome pixel (no chrome binary)');
    return { skipped: true };
  }
  const outDir = '/tmp/sf-fighters-visible';
  fs.mkdirSync(outDir, { recursive: true });
  const artDir = '/opt/cursor/artifacts/screenshots';
  try { fs.mkdirSync(artDir, { recursive: true }); } catch (_) {}

  let puppeteer;
  try {
    puppeteer = await import('puppeteer-core');
  } catch (_) {
    await new Promise((res, rej) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], { cwd: outDir, stdio: 'inherit' });
      p.on('exit', (c) => (c === 0 ? res() : rej(new Error('npm puppeteer'))));
    });
    puppeteer = await import(path.join(outDir, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'));
  }

  const server = await startStaticServer(8798);
  const shots = [];
  const sizes = [
    { w: 844, h: 390, name: 'landscape-844x390' },
    { w: 390, h: 844, name: 'portrait-390x844' },
  ];
  for (const sz of sizes) {
    const browser = await puppeteer.default.launch({
      executablePath: chrome,
      headless: 'new',
      args: ['--no-sandbox', `--window-size=${sz.w},${sz.h}`],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: sz.w, height: sz.h, deviceScaleFactor: 2, isMobile: true });
    await page.goto('http://127.0.0.1:8798/index.html', { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });
    const info = await page.evaluate((w, h) => {
      const vv = window.visualViewport;
      if (vv) {
        try { Object.defineProperty(vv, 'width', { value: w, configurable: true }); } catch (_) {}
        try { Object.defineProperty(vv, 'height', { value: h, configurable: true }); } catch (_) {}
      }
      try {
        if (typeof save === 'object' && save) {
          save.lvl = Math.max(save.lvl || 1, 20);
          save.style = 'cyber';
          save.styles = Array.from(new Set([...(save.styles || []), 'cyber']));
          if (!save.tipsSeen || typeof save.tipsSeen !== 'object') save.tipsSeen = {};
          save.tipsSeen.moveBarAim = 1;
        }
      } catch (_) {}
      if (typeof forceGameResize === 'function') forceGameResize();
      // Level 13 = cyber city (matches the empty purple-city report).
      startGame('adventure', { level: 13, gamble: null, difficulty: 'normal' });
      const g = (window.__sf && window.__sf.game) || window.game;
      if (g && g.aimTut) {
        if (typeof finishAimTutorial === 'function') finishAimTutorial(g, 'smoke');
        else g.aimTut = null;
      }
      if (g && g.player && typeof applyPlayerStyle === 'function') applyPlayerStyle(g.player);
      if (typeof pinPlayfieldBodies === 'function') pinPlayfieldBodies(g);
      for (let i = 0; i < 75; i++) {
        try { g.update(1 / 30); } catch (_) {}
      }
      if (typeof pinPlayfieldBodies === 'function') pinPlayfieldBodies(g);
      const canvas = document.getElementById('game');
      const c = canvas.getContext('2d');
      g.draw(c);
      try {
        if (typeof dismissSplashOverlay === 'function') dismissSplashOverlay();
      } catch (_) {}
      const splash = document.getElementById('sfSplash');
      if (splash) {
        splash.classList.add('is-done');
        splash.style.display = 'none';
        splash.hidden = true;
        try { splash.remove(); } catch (_) {}
      }
      document.body.classList.add('is-playing');
      document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
      const dpr = (typeof DPR === 'number' && DPR > 0) ? DPR : (c.canvas.width / Math.max(1, w));
      const px = g.player.x;
      const py = g.player.y;
      const sample = (x, y) => {
        const ix = Math.max(0, Math.min(c.canvas.width - 1, Math.round(x * dpr)));
        const iy = Math.max(0, Math.min(c.canvas.height - 1, Math.round(y * dpr)));
        const d = c.getImageData(ix, iy, 1, 1).data;
        return [d[0], d[1], d[2], d[3]];
      };
      const pts = [];
      let bright = 0;
      for (let oy = -78; oy <= 4; oy += 4) {
        for (let ox = -22; ox <= 22; ox += 4) {
          const p = sample(px + ox, py + oy);
          pts.push(p);
          const lum = p[0] + p[1] + p[2];
          if (lum > 340 && p[3] > 80) bright++;
        }
      }
      const bg = sample(10, 10);
      return {
        w, h,
        player: { x: Math.round(px), y: Math.round(py), ground: Math.round(g.ground) },
        monsters: (g.monsters || []).filter((m) => m.alive).length,
        theme: g.theme,
        style: g.player && g.player.style && g.player.style.id,
        color: g.player && g.player.color,
        samplePts: pts.length,
        bg,
        bright,
        dpr,
        canvas: { cw: c.canvas.width, ch: c.canvas.height },
        png: canvas.toDataURL('image/png'),
      };
    }, sz.w, sz.h);
    const destA = path.join(outDir, sz.name + '.png');
    const destB = path.join(artDir, 'fighters-' + sz.name + '.png');
    if (info.png && info.png.startsWith('data:image/png')) {
      const b64 = info.png.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(destA, Buffer.from(b64, 'base64'));
    } else {
      const canvasEl = await page.$('#game');
      if (canvasEl) await canvasEl.screenshot({ path: destA });
      else await page.screenshot({ path: destA, fullPage: false });
    }
    delete info.png;
    try { fs.copyFileSync(destA, destB); } catch (_) {}
    await browser.close();
    if (info.bright < 3) {
      fail('chrome ' + sz.name + ' no contrasting pixels near player ' + JSON.stringify(info));
    }
    shots.push({ ...info, shot: destA });
  }
  if (server) try { server.close(); } catch (_) {}
  return { skipped: false, shots };
}

function waitBoot(gctx) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (gctx.__sfBooted) return resolve();
      if (Date.now() - start > 4000) return reject(new Error('bootGame did not run'));
      setImmediate(tick);
    };
    tick();
  });
}

async function run() {
  const gctx = bootVm();
  await waitBoot(gctx);
  const portrait = assertDrawVisible(gctx, 'portrait-390x844', 390, 844);
  const land = assertDrawVisible(gctx, 'landscape-844x390', 844, 390);
  let chrome = { skipped: true };
  try { chrome = await chromePixelProof(); } catch (e) {
    fail('chrome pixel: ' + (e && e.message));
  }
  console.log(JSON.stringify({ ok: true, portrait, land, chrome }, null, 2));
  console.log('SMOKE_OK fighters-visible 390×844 + 844×390');
}

run().catch((e) => {
  console.error('SMOKE_FAIL', e && e.stack || e);
  process.exit(1);
});
