#!/usr/bin/env node
/**
 * Playtest probe — PERFORMANCE / MID-PHONE on LIVE v1.18.190 / SW 400.
 * Measures spawn hitch, fxLite caps, kill-freeze, long-session pool/cache.
 * Versus stays out. Does not change balance.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

function fail(msg, extra) {
  console.error('SMOKE_FAIL', msg);
  if (extra !== undefined) console.error(extra);
  process.exit(1);
}
function must(cond, msg, extra) {
  if (!cond) fail(msg, extra);
}

require('child_process').execSync('node scripts/build.mjs', { cwd: root, stdio: 'pipe' });
const built = fs.readFileSync(path.join(root, 'game.js'), 'utf8');

function makeEl(id) {
  return {
    id,
    tagName: id === 'game' ? 'CANVAS' : 'DIV',
    classList: {
      s: new Set(),
      add(x) { this.s.add(x); },
      remove(x) { this.s.delete(x); },
      toggle(x, v) { if (v === undefined) v = !this.s.has(x); v ? this.s.add(x) : this.s.delete(x); },
      contains(x) { return this.s.has(x); },
    },
    style: {},
    hidden: false,
    dataset: {},
    textContent: '',
    innerHTML: '',
    children: [],
    parentElement: null,
    closest() { return this; },
    addEventListener() {},
    removeEventListener() {},
    appendChild() {},
    remove() {},
    focus() {},
    setAttribute() {},
    getAttribute() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getContext() {
      return {
        fillRect() {}, clearRect() {}, strokeRect() {}, fillText() {}, measureText() { return { width: 8 }; },
        beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, arc() {}, arcTo() {}, ellipse() {},
        fill() {}, stroke() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
        createLinearGradient() { return { addColorStop() {} }; },
        createRadialGradient() { return { addColorStop() {} }; },
        drawImage() {}, setTransform() {}, quadraticCurveTo() {},
        setLineDash() {}, clip() {}, rect() {}, roundRect() {},
        canvas: { width: 390, height: 844 },
      };
    },
    width: 390,
    height: 844,
  };
}

const els = {};
const document = {
  body: makeEl('body'),
  hidden: false,
  getElementById(id) { return els[id] || (els[id] = makeEl(id)); },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement(t) { return makeEl(t); },
  addEventListener() {},
};
els.game = makeEl('game');
els.menuScreen = makeEl('menuScreen');
els.menuScreen.classList.add('active');

const sandbox = {
  window: {},
  document,
  console,
  location: { href: 'https://brennyz.github.io/stickman-fighter/', hostname: 'brennyz.github.io', protocol: 'https:', search: '', pathname: '/stickman-fighter/', origin: 'https://brennyz.github.io' },
  navigator: { onLine: true, userAgent: 'Chrome', maxTouchPoints: 5, platform: 'Linux', vibrate() {} },
  localStorage: { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = String(v); }, removeItem(k) { delete this.store[k]; } },
  innerWidth: 390,
  innerHeight: 844,
  devicePixelRatio: 2.2,
  requestAnimationFrame: () => 0,
  cancelAnimationFrame() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  addEventListener() {},
  setTimeout(fn) { try { fn(); } catch (_) {} return 0; },
  clearTimeout() {},
  setInterval() { return 0; },
  clearInterval() {},
  performance: { now: () => 0 },
  AudioContext: class {
    constructor() { this.state = 'running'; this.destination = {}; this.currentTime = 0; }
    createOscillator() {
      const freq = { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} };
      return { connect() { return this; }, start() {}, stop() {}, frequency: freq, detune: freq, type: 'sine' };
    }
    createGain() { return { connect() { return this; }, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
  },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.self = sandbox;
sandbox.HTMLCanvasElement = function () {};
sandbox.Image = function () { this.onload = null; };
sandbox.URL = { createObjectURL() { return ''; }, revokeObjectURL() {} };

vm.createContext(sandbox);
try {
  vm.runInContext(built, sandbox, { filename: 'game.js' });
} catch (e) {
  fail('game.js threw in vm', e && e.message);
}

function run(src) {
  try {
    return vm.runInContext(src, sandbox);
  } catch (e) {
    fail('vm: ' + src, e && e.message);
  }
}

must(run('typeof APP_VERSION === "string" && APP_VERSION === "1.18.190"'), 'expected LIVE 1.18.190');
must(run('SW_CACHE_REV === 400'), 'expected SW 400');

const report = {
  build: { app: '1.18.190', sw: 400, shaHint: 'c9a29fc' },
  viewport: { w: 390, h: 844, dpr: 2.2, touch: true },
};

run('save.liteFx = false; save.reducedMotion = false; save.shake = true; Perf.reset(); W = 390; H = 844; window.__sfForceTouchFx = true;');
report.touchCaps = run('fxCaps()');
report.spawnLiteAtFrame0 = run('fxSpawnLite()');
report.fxLiteAtFrame0 = run('fxLite()');
report.touchDevice = run('fxTouchDevice()');

run('Perf.frames = 200; Perf.tier = 0;');
report.spawnLiteAfter90Tier0 = run('fxSpawnLite()');
report.fxLiteAfter90Tier0 = run('fxLite()');

run('Perf.tier = 1;');
report.spawnLiteTier1 = run('fxSpawnLite()');
report.fxLiteTier1 = run('fxLite()');

run('Perf.tier = 2;');
report.spawnLiteTier2 = run('fxSpawnLite()');
report.fxLiteTier2 = run('fxLite()');

run('save.liteFx = true; Perf.reset(); Perf.frames = 200;');
report.liteCaps = run('fxCaps()');
report.fxLiteWhenSettingOn = run('fxLite()');
report.spawnLiteWhenSettingOn = run('fxSpawnLite()');
report.perfTierWhenLite = run('Perf.tier');

run('save.liteFx = false; W = 1280; H = 720; window.__sfForceTouchFx = false; Perf.reset(); Perf.frames = 200; Perf.tier = 0;');
report.deskCaps = run('fxCaps()');

run('W = 390; H = 844; window.__sfForceTouchFx = true; save.liteFx = false; Perf.reset();');
try { run('startGame("training")'); } catch (e) { fail('startGame training', e && e.message); }
must(run('!!(game && game.player)'), 'training missing');

run('game.particles = []; game.freezeT = 0; game._fxBudgetFrame = -1; game._fxBudgetUsed = 0;');
const introMon = `{ x: 280, y: game.ground - 40, size: 44, sp: { name: "X", rarity: "rare" }, elite: true }`;
run(`var __intro = ${introMon}; triggerSpecialEnemyIntro(game, __intro, "elite");`);
report.wave1Elite = {
  spawnLite: run('fxSpawnLite()'),
  particles: run('game.particles.length'),
  freezeT: run('game.freezeT || 0'),
};

run('Perf.frames = 200; Perf.tier = 0; game.particles = []; game.freezeT = 0; game._fxBudgetFrame = -1; game._fxBudgetUsed = 0; game._specialIntroKey = null;');
run(`var __intro2 = ${introMon}; triggerSpecialEnemyIntro(game, __intro2, "elite");`);
report.lateEliteTier0 = {
  spawnLite: run('fxSpawnLite()'),
  particles: run('game.particles.length'),
  freezeT: run('game.freezeT || 0'),
};

run('game.particles = []; game.freezeT = 0; game._fxBudgetFrame = -1; game._fxBudgetUsed = 0; game._specialIntroKey = null;');
run(`var __boss = Object.assign(${introMon}, { bossCore: true, superBoss: true, colossal: true }); triggerSpecialEnemyIntro(game, __boss, "superBoss");`);
report.lateColossalTier0 = {
  spawnLite: run('fxSpawnLite()'),
  particles: run('game.particles.length'),
  freezeT: run('game.freezeT || 0'),
};

run('save.liteFx = true; Perf.reset(); game.particles = []; game.freezeT = 0; game._fxBudgetFrame = -1; game._fxBudgetUsed = 0; game._specialIntroKey = null;');
run(`var __intro3 = ${introMon}; triggerSpecialEnemyIntro(game, __intro3, "elite");`);
report.eliteWithLiteFx = {
  spawnLite: run('fxSpawnLite()'),
  particles: run('game.particles.length'),
  freezeT: run('game.freezeT || 0'),
};

run('save.liteFx = true; game.freezeT = 0; juiceKillSnap(game, { elite: false });');
report.killSnapLiteCommon = run('game.freezeT || 0');
run('game.freezeT = 0; juiceKillSnap(game, { elite: true, bossCore: true });');
report.killSnapLiteElite = run('game.freezeT || 0');

run('save.liteFx = false; Perf.reset(); Perf.frames = 200; Perf.tier = 0; window.__sfForceTouchFx = true; game.freezeT = 0;');
run('applyHitStop(game, { kind: "punch", dmg: 10 }, { combo: 2 });');
report.hitStopPunch = run('game.freezeT || 0');
run('game.freezeT = 0; applyHitStop(game, { kind: "kick", dmg: 20 }, { heavy: true, crit: true, combo: 10 });');
report.hitStopHeavy = run('game.freezeT || 0');

run('save.liteFx = true; game.freezeT = 0; applyHitStop(game, { kind: "punch", dmg: 10 }, {});');
report.hitStopPunchLite = run('game.freezeT || 0');

run('save.liteFx = false; Perf.reset(); window.__sfForceTouchFx = true;');
const soak = run(`
(function () {
  const snaps = [];
  let maxParticles = 0;
  let maxPool = 0;
  let maxScenery = 0;
  let maxMonsters = 0;
  let okStarts = 0;
  for (let i = 0; i < 24; i++) {
    try { startGame('training'); } catch (_) {}
    if (!game) continue;
    okStarts++;
    try { game.burst(200, 200, '#ff3040', 34); } catch (_) {}
    try { if (typeof juiceKillSnap === 'function') juiceKillSnap(game, { elite: i % 4 === 0 }); } catch (_) {}
    try {
      if (typeof triggerSpecialEnemyIntro === 'function') {
        const mon = (game.monsters && game.monsters[0]) || game.robot || { x: 280, y: 200, size: 40, sp: { name: 'X', rarity: 'rare' }, elite: true };
        triggerSpecialEnemyIntro(game, mon, 'elite');
      }
    } catch (_) {}
    maxParticles = Math.max(maxParticles, (game.particles || []).length);
    maxMonsters = Math.max(maxMonsters, (game.monsters || []).length);
    maxPool = Math.max(maxPool, typeof fxPoolSize === 'function' ? fxPoolSize() : 0);
    if (typeof SceneryArt !== 'undefined' && SceneryArt && SceneryArt.cache) {
      maxScenery = Math.max(maxScenery, Object.keys(SceneryArt.cache).length);
    }
    if (i === 0 || i === 11 || i === 23) {
      snaps.push({
        i,
        mode: game && game.mode,
        particles: game ? game.particles.length : 0,
        pool: typeof fxPoolSize === 'function' ? fxPoolSize() : 0,
        scenery: (typeof SceneryArt !== 'undefined' && SceneryArt.cache) ? Object.keys(SceneryArt.cache).length : 0,
        freezeT: game ? (game.freezeT || 0) : 0,
      });
    }
  }
  try { startGame('training'); } catch (_) {}
  return {
    cycles: 24,
    okStarts,
    maxParticles, maxPool, maxScenery, maxMonsters,
    endPool: typeof fxPoolSize === 'function' ? fxPoolSize() : 0,
    endParticles: game ? game.particles.length : -1,
    snaps,
  };
})()
`);
report.longSession = soak;

run('save.liteFx = true; Perf.reset(); game.particles = []; game._fxBudgetFrame = -1; game._fxBudgetUsed = 0; game.burst(180, 180, "#fff", 34);');
report.liteBurst34 = run('game.particles.length');

must(report.wave1Elite.freezeT === 0, 'wave-1 elite must not freeze', report.wave1Elite);
must(report.wave1Elite.particles <= 12, 'wave-1 elite dump too fat', report.wave1Elite);
must(report.eliteWithLiteFx.freezeT === 0, 'liteFx elite must not freeze', report.eliteWithLiteFx);
must(report.liteCaps.particles <= 70, 'lite particle cap too high', report.liteCaps);
must(report.touchCaps.particles <= 110, 'touch particle cap too high', report.touchCaps);
must(report.longSession.endPool <= 160, 'particle pool grew past FX_POOL_MAX', report.longSession);
must(report.longSession.maxScenery <= 32, 'scenery cache unbounded', report.longSession);

const findings = [];
if (report.lateEliteTier0.freezeT > 0) {
  findings.push({
    id: 'PERF-01',
    sev: 'P1',
    title: 'Elite/boss intro hitch returns after first ~90 frames on mid-phone',
    detail: `After Perf.frames>=90 and tier 0, spawnLite=${report.lateEliteTier0.spawnLite}, particles=${report.lateEliteTier0.particles}, freezeT=${report.lateEliteTier0.freezeT}s. Wave 2+ on a still-smooth mid-phone dumps full intro + freeze.`,
  });
}
if (report.lateColossalTier0.freezeT > 0.1) {
  findings.push({
    id: 'PERF-02',
    sev: 'P1',
    title: 'Colossal / super-boss intro still 100ms+ freeze when spawnLite is off',
    detail: `particles=${report.lateColossalTier0.particles}, freezeT=${report.lateColossalTier0.freezeT}s.`,
  });
}
if (report.killSnapLiteCommon > 0 || report.killSnapLiteElite > 0) {
  findings.push({
    id: 'PERF-03',
    sev: 'P1',
    title: 'juiceKillSnap freeze is not gated by liteFx / spawnLite',
    detail: `Lite FX still applies freezeT ${report.killSnapLiteCommon}s (common) / ${report.killSnapLiteElite}s (elite) on every kill before the shake rate-limit.`,
  });
}
if (report.hitStopPunchLite > 0) {
  findings.push({
    id: 'PERF-04',
    sev: 'P2',
    title: 'applyHitStop ignore liteFx — punch/kick freeze stays on mid-phone',
    detail: `punch=${report.hitStopPunch}s heavy=${report.hitStopHeavy}s litePunch=${report.hitStopPunchLite}s. Only motionReduced skips it.`,
  });
}
if (!report.fxLiteAfter90Tier0 && !report.spawnLiteAfter90Tier0) {
  findings.push({
    id: 'PERF-05',
    sev: 'P2',
    title: 'Mid-phone after opener is full-fat FX until EMA climbs to tier 1/2',
    detail: 'fxLite() is liteFx OR tier>=2 OR reduced-motion. After 90 frames at tier 0, neither spawnLite nor fxLite is on — death bursts, crit rings, hit-stop are desktop-weight.',
  });
}
findings.push({
  id: 'PERF-06',
  sev: 'P3',
  title: 'Long session: pool + scenery stay bounded; UI canvases are the leftover leak risk',
  detail: `24 startGame cycles: maxPool=${report.longSession.maxPool} endPool=${report.longSession.endPool} maxParticles=${report.longSession.maxParticles} maxScenery=${report.longSession.maxScenery}. Particle pool recycles. SceneryArt evicts. UI.js still news 64px canvases on each upgrades/pets/gear paint.`,
});

report.findings = findings;

const outDir = path.join(root, 'docs');
const jsonPath = path.join(outDir, 'playtest-perf-midphone-2026-09-18.json');
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');

console.log('SMOKE_OK playtest-perf-midphone');
console.log(JSON.stringify({
  wave1Elite: report.wave1Elite,
  lateEliteTier0: report.lateEliteTier0,
  lateColossalTier0: report.lateColossalTier0,
  killSnap: { common: report.killSnapLiteCommon, elite: report.killSnapLiteElite },
  hitStop: { punch: report.hitStopPunch, heavy: report.hitStopHeavy, lite: report.hitStopPunchLite },
  caps: { touch: report.touchCaps.particles, lite: report.liteCaps.particles, desk: report.deskCaps.particles },
  longSession: report.longSession,
  findings: findings.map((f) => f.id + ' ' + f.sev),
}, null, 2));
