#!/usr/bin/env node
/**
 * Mid-phone fxLite: caps, spawn hitch guard, particle pool, fighters always draw.
 * Versus stays out.
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

const prelude = fs.readFileSync(path.join(root, 'src/00-prelude.js'), 'utf8');
const drawH = fs.readFileSync(path.join(root, 'src/render/draw-helpers.js'), 'utf8');
const gameSrc = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const monSrc = fs.readFileSync(path.join(root, 'src/data/monsters.js'), 'utf8');
const fighterSrc = fs.readFileSync(path.join(root, 'src/entities/fighter.js'), 'utf8');
const monsterEnt = fs.readFileSync(path.join(root, 'src/entities/monster.js'), 'utf8');
const versusSrc = fs.readFileSync(path.join(root, 'src/systems/versus.js'), 'utf8');
const startSrc = fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8');
const juiceSrc = fs.readFileSync(path.join(root, 'src/systems/combat-juice.js'), 'utf8');
const built = fs.readFileSync(path.join(root, 'game.js'), 'utf8');

must(/function fxSpawnLite\(/.test(prelude), 'fxSpawnLite missing');
must(/function fxSkipFreeze\(/.test(prelude), 'fxSkipFreeze missing');
must(/function fxTouchDevice\(/.test(prelude), 'fxTouchDevice missing');
must(/function prewarmFxPool\(/.test(prelude), 'prewarmFxPool missing');
must(/function allocFxParticle\(/.test(prelude), 'allocFxParticle missing');
must(/function releaseFxParticle\(/.test(prelude), 'releaseFxParticle missing');
must(/FX_POOL_PREWARM = 48/.test(prelude), 'prewarm size must stay 48');
must(/save\.liteFx\) mul = 0\.42/.test(prelude), 'liteFx cap mul should be 0.42');
must(/!fxSpawnLite\(\) && !fxTouchDevice\(\)/.test(prelude), 'unlimited FX budget must skip mid-phone/spawnLite');
must(!/Perf\.frames\s*<\s*90/.test(prelude), 'spawnLite must stay on for touch whole fight (no 90-frame cutoff)');
must(/function fxLite\(/.test(drawH), 'fxLite missing');
must(/allocFxParticle/.test(gameSrc), 'burst must use particle pool');
must(/releaseFxParticle/.test(gameSrc), 'dead particles must return to pool');
must(/Fighters always draw/.test(gameSrc), 'draw() must document fighters-always-visible');
must(/drawCombatants\(c\)/.test(gameSrc) || /for \(const m of this\.monsters\) m\.draw\(c\);/.test(gameSrc),
  'monsters must always draw (drawCombatants or inline)');
must(/this\.player\.draw\(c\)/.test(gameSrc), 'player must always draw');

{
  const skipBlock = gameSrc.match(/const skipFx[\s\S]{0,200}for \(const pt of this\.particles\)/);
  must(!!skipBlock, 'skipFx must wrap particles only');
  must(!/player\.draw|m\.draw/.test(skipBlock[0]), 'skipFx must not wrap fighter draw');
}

must(/fxSpawnLite/.test(monSrc), 'special intro must use spawnLite');
must(/no freeze/.test(monSrc), 'lite spawn path must skip freeze hitch');
must(/fxSkipFreeze/.test(monSrc) && /addFreeze/.test(monSrc), 'applyHitStop must gate freeze on Lite FX / touch');
must(/fxSkipFreeze/.test(juiceSrc) || /fxLite\(\)|fxSpawnLite\(\)|fxTouchDevice\(\)/.test(juiceSrc),
  'juiceKillSnap must gate freeze on Lite FX / touch');
must(/prewarmFxPool/.test(startSrc), 'startGame must prewarm pool before first spawn');

must(!/if\s*\(\s*fxLite\s*\(\s*\)\s*\)\s*return;/.test(fighterSrc), 'fighter.draw must not bail on fxLite');
must(!/if\s*\(\s*fxLite\s*\(\s*\)\s*\)\s*return;/.test(monsterEnt), 'monster.draw must not bail on fxLite');

must(/Versus/.test(prelude) && /untouched|retired|2P/.test(versusSrc + prelude), 'Versus lane stays documented');
must(!/fxSpawnLite/.test(versusSrc), 'versus.js must stay out of this lane');

must(/function fxSpawnLite\(/.test(built), 'built bundle missing fxSpawnLite');
must(/function fxSkipFreeze\(/.test(built), 'built bundle missing fxSkipFreeze');
must(/function prewarmFxPool\(/.test(built), 'built bundle missing prewarmFxPool');

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
        beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, arc() {}, ellipse() {},
        fill() {}, stroke() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
        createLinearGradient() { return { addColorStop() {} }; },
        createRadialGradient() { return { addColorStop() {} }; },
        drawImage() {}, setTransform() {}, quadraticCurveTo() {},
        setLineDash() {}, clip() {}, rect() {},
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
  devicePixelRatio: 2,
  requestAnimationFrame: () => 0,
  cancelAnimationFrame() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  addEventListener() {},
  setTimeout(fn) { try { fn(); } catch (_) {} return 0; },
  clearTimeout() {},
  setInterval() { return 0; },
  clearInterval() {},
  performance: { now: () => 0 },
  AudioContext: class { constructor() { this.state = 'running'; this.destination = {}; this.currentTime = 0; } createOscillator() { return { connect() { return this; }, start() {}, stop() {}, frequency: { value: 0 }, type: 'sine' }; } createGain() { return { connect() { return this; }, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } }; } } ,
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

must(run('typeof fxCaps === "function"'), 'fxCaps not in scope');
must(run('typeof fxLite === "function"'), 'fxLite not in scope');
must(run('typeof fxSpawnLite === "function"'), 'fxSpawnLite not in scope');
must(run('typeof fxSkipFreeze === "function"'), 'fxSkipFreeze not in scope');
must(run('typeof prewarmFxPool === "function"'), 'prewarmFxPool not in scope');
must(run('typeof allocFxParticle === "function"'), 'allocFxParticle not in scope');

run('save.liteFx = false; save.reducedMotion = false; Perf.tier = 0; Perf.frames = 0; window.__sfForceTouchFx = true;');
must(run('fxTouchDevice()'), 'force-touch hook must trip fxTouchDevice');
must(run('fxSpawnLite()'), 'mid-phone first frames must be spawnLite');
must(run('fxSkipFreeze()'), 'touch first frames must skip kill/hit freeze');
const touchCaps = run('fxCaps()');
must(touchCaps.particles <= 110, 'touch particle cap too high', touchCaps);
must(touchCaps.particles >= 16, 'touch particle floor too low', touchCaps);

run('Perf.frames = 200;');
must(run('fxSpawnLite()'), 'touch devices must keep spawnLite after opener (~90 frames)');
must(run('fxSkipFreeze()'), 'touch after opener must still skip freeze');

run('window.__sfForceTouchFx = false; Perf.frames = 200; save.liteFx = true;');
must(run('fxLite()'), 'liteFx must trip fxLite');
must(run('fxSpawnLite()'), 'liteFx must trip spawnLite');
must(run('fxSkipFreeze()'), 'liteFx must skip kill/hit freeze');
const liteCaps = run('fxCaps()');
must(liteCaps.particles <= 70, 'liteFx particle cap should be ≤70', liteCaps);
must(liteCaps.particles >= 16, 'liteFx must keep a readable floor', liteCaps);
must(liteCaps.particles < touchCaps.particles || liteCaps.particles <= 60, 'lite caps should be tighter than mid-phone default');

run('save.liteFx = false; W = 1280; window.__sfForceTouchFx = false; Perf.tier = 0; Perf.frames = 200;');
const deskCaps = run('fxCaps()');
must(deskCaps.particles >= 80, 'wide viewport must keep a usable FX cap', deskCaps);
must(!run('fxSpawnLite()'), 'desktop after opener must not stay spawnLite');
must(!run('fxSkipFreeze()'), 'desktop after opener still allows freeze');

const pooled = run('prewarmFxPool(48)');
must(pooled >= 48, 'prewarm must fill 48', pooled);
const before = run('fxPoolSize()');
must(run('!!allocFxParticle()'), 'allocFxParticle returns object');
must(run('fxPoolSize()') === before - 1, 'alloc should pop from pool');
run('releaseFxParticle({ x:0,y:0,vx:0,vy:0,life:0,maxLife:0,color:"#fff",size:2,kind:"square",grav:900 })');
must(run('fxPoolSize()') === before, 'release should push back to pool');

try { run('startGame("training")'); } catch (e) { fail('startGame training threw', e); }
must(run('!!(game && game.player)'), 'training game+player missing');
must(run('Array.isArray(game.particles)'), 'particles array missing');

run('save.liteFx = true; Perf.tier = 2; game.particles = []; game._fxBudgetFrame = -1; game._fxBudgetUsed = 0; game.burst(200, 200, "#ff3040", 34);');
const burstN = run('game.particles.length');
must(burstN <= 12, 'lite burst of 34 must clamp hard', burstN);
must(burstN >= 1, 'lite burst must still show a hit spark', burstN);

run('var __freezeBefore = game.freezeT || 0;');
run('var __introMon = (game.monsters && game.monsters[0]) || game.robot || { x: 300, y: game.ground - 40, size: 40, sp: { name: "X", rarity: "rare" } };');
run('if (typeof triggerSpecialEnemyIntro === "function") triggerSpecialEnemyIntro(game, __introMon, "elite");');
must(run('(game.freezeT || 0) <= __freezeBefore'), 'lite elite intro must not add freeze hitch');
must(run('game.particles.length <= ' + liteCaps.particles), 'intro must respect cap', run('game.particles.length'));

run('save.liteFx = true; window.__sfForceTouchFx = true; game.freezeT = 0;');
must(run('fxSkipFreeze()'), 'lite+touch must skip freeze before kill snap');
run('juiceKillSnap(game, { elite: true, bossCore: true });');
must(run('(game.freezeT || 0) === 0'), 'juiceKillSnap must not freeze on Lite FX / touch');
run('game.freezeT = 0; applyHitStop(game, { kind: "punch", dmg: 22 }, { heavy: true, crit: true });');
must(run('(game.freezeT || 0) === 0'), 'applyHitStop must not freeze on Lite FX / touch');

run('save.liteFx = false; save.reducedMotion = false; Perf.tier = 0; Perf.frames = 200; W = 1280; window.__sfForceTouchFx = false; game.freezeT = 0;');
must(!run('fxSkipFreeze()'), 'desktop must allow freeze');
run('juiceKillSnap(game, { elite: false });');
must(run('(game.freezeT || 0) >= 0.05'), 'desktop juiceKillSnap still freezes');
run('game.freezeT = 0; applyHitStop(game, { kind: "punch", dmg: 22 }, { heavy: true });');
must(run('(game.freezeT || 0) >= 0.03'), 'desktop applyHitStop still freezes');

run('save.liteFx = false; save.reducedMotion = false; Perf.tier = 0; Perf.frames = 3600; window.__sfForceTouchFx = true;');
run('game._specialIntroKey = ""; game.waveIdx = (game.waveIdx || 0) + 1; game.particles = []; game._fxBudgetFrame = -1; game._fxBudgetUsed = 0; game.freezeT = 0;');
must(run('fxSpawnLite()'), 'mid-phone after minute 1 (~3600 frames) must stay spawnLite');
must(run('fxSkipFreeze()'), 'mid-phone after minute 1 must skip freeze');
run('var __lateMon = { x: 300, y: (game.ground || 400) - 40, size: 40, elite: true, sp: { name: "X", rarity: "rare" } };');
run('triggerSpecialEnemyIntro(game, __lateMon, "elite");');
const lateEliteN = run('game.particles.length');
must(run('(game.freezeT || 0) === 0'), 'minute-1 mid-phone elite intro must not freeze');
must(lateEliteN >= 1, 'minute-1 elite intro must still show a spark', lateEliteN);
must(lateEliteN <= 12, 'minute-1 elite intro must stay spawnLite-sized (not 18+ desktop dump)', lateEliteN);

must(run('typeof game.player.draw === "function"'), 'player.draw missing');

console.log('SMOKE_OK fx-lite', {
  liteParticles: liteCaps.particles,
  touchParticles: touchCaps.particles,
  deskParticles: deskCaps.particles,
  burstN,
  lateEliteN,
  pool: run('fxPoolSize()'),
  skipFreeze: true,
});
