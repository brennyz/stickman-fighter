#!/usr/bin/env node
/**
 * Smoke: Nightmare/Hel zone-wapens — drop-zone mapping, grant/unlock,
 * adventure keep-equipped, on-hit burn, silhouettes + effect coverage.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// Ensure fresh bundle
require('child_process').execSync('node scripts/build.mjs', { cwd: root, stdio: 'pipe' });
const code = fs.readFileSync(path.join(root, 'game.js'), 'utf8');

const mustCall = [
  [/rollZoneWeaponDrop\s*\(\s*this\s*,\s*m\s*\)/, 'kill→rollZoneWeaponDrop'],
  [/grantZoneBossClearWeapon\s*\(\s*lv\s*,\s*diff\s*\)/, 'clear→grantZoneBossClearWeapon'],
  [/applyWeaponOnHitEffect\s*\(\s*this\s*,\s*f\s*,\s*m/, 'hit→applyWeaponOnHitEffect'],
  [/tickWeaponStatusEffects\s*\(\s*this\s*,\s*dt\s*\)/, 'loop→tickWeaponStatusEffects'],
  [/spawnWeaponLightHit\s*\(\s*this\s*,\s*f\s*,\s*m/, 'hit→spawnWeaponLightHit'],
];
for (const [re, label] of mustCall) {
  if (!re.test(code)) {
    console.error('SMOKE_FAIL missing wire:', label);
    process.exit(1);
  }
}

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
        canvas: { width: 960, height: 540 },
      };
    },
    width: 960,
    height: 540,
  };
}

const els = {};
const document = {
  body: makeEl('body'),
  documentElement: { style: {}, clientWidth: 960, clientHeight: 540 },
  getElementById(id) {
    if (!els[id]) els[id] = makeEl(id);
    return els[id];
  },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement(tag) { return makeEl(tag); },
  addEventListener() {},
};
document.body.appendChild = () => {};

const window = {
  document,
  innerWidth: 960,
  innerHeight: 540,
  devicePixelRatio: 1,
  localStorage: (() => {
    const bag = {};
    return {
      getItem(k) { return bag[k] ?? null; },
      setItem(k, v) { bag[k] = String(v); },
      removeItem(k) { delete bag[k]; },
    };
  })(),
  requestAnimationFrame(cb) { return setTimeout(() => cb(Date.now()), 0); },
  cancelAnimationFrame(id) { clearTimeout(id); },
  addEventListener() {},
  removeEventListener() {},
  matchMedia() { return { matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }; },
  AudioContext: class { constructor() { this.state = 'running'; } createGain() { return { connect() {}, gain: { value: 1 } }; } createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { value: 0 } }; } resume() { return Promise.resolve(); } },
  webkitAudioContext: null,
  navigator: { userAgent: 'smoke', vibrate() {}, language: 'nl' },
  location: { href: 'http://127.0.0.1/index.html', protocol: 'http:', hostname: '127.0.0.1', pathname: '/index.html', search: '' },
  performance: { now: () => Date.now() },
  Image: class { constructor() { this.onload = null; this.onerror = null; this.src = ''; } },
  HTMLCanvasElement: function () {},
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
};
window.window = window;
window.self = window;
window.globalThis = window;
document.defaultView = window;

const sandbox = vm.createContext(window);
vm.runInContext(code, sandbox, { filename: 'game.js' });

const run = (src) => vm.runInContext(src, sandbox);
const fail = (msg) => { console.error('SMOKE_FAIL', msg); process.exit(1); };

// --- drop zone mapping ---
if (run("adventureDropZoneForLevel(1, 'normal')") !== null) fail('normal L1 should be null zone');
if (run("adventureDropZoneForLevel(55, 'normal')") !== 'nightmare') fail('normal L55 → nightmare');
if (run("adventureDropZoneForLevel(65, 'normal')") !== 'hell') fail('normal L65 → hell');
if (run("adventureDropZoneForLevel(1, 'nightmare')") !== 'nightmare') fail('NM 2.0 L1 → nightmare');
if (run("adventureDropZoneForLevel(1, 'hell')") !== 'hell') fail('HELL 3.0 L1 → hell');
if (run("adventureDropZoneForLevel(55, 'hell')") !== 'hell') fail('HELL 3.0 overrides island nightmare');

const zoneW = run('WEAPONS.filter((w) => w.dropZone)');
if (!Array.isArray(zoneW) || zoneW.length < 20) fail('expected ≥20 zone weapons, got ' + (zoneW && zoneW.length));

const effects = new Set(zoneW.map((w) => w.effect).filter(Boolean));
const switchBody = code.match(/function\s+applyWeaponOnHitEffect[\s\S]*?\nfunction\s+tickWeaponStatusEffects/);
if (!switchBody) fail('applyWeaponOnHitEffect body missing');
for (const eff of effects) {
  if (!new RegExp(`case\\s+'${eff}'`).test(switchBody[0])) {
    fail('effect not handled in switch: ' + eff);
  }
}

const drawFn = code.match(/function\s+drawWeaponShape[\s\S]*?\nfunction\s+\w+/);
if (!drawFn) fail('drawWeaponShape missing');
for (const w of zoneW) {
  if (!new RegExp(`case\\s+'${w.id}'`).test(drawFn[0])) {
    fail('missing silhouette case for ' + w.id);
  }
}

// --- grant / unlock / adventure keep ---
run('save.zoneWeapons = {}');
run("save.weapon = 'vuist'");
run('save.lvl = 5');
run('save.unlocked = 5');
const sample = zoneW.find((w) => w.dropZone === 'nightmare') || zoneW[0];
sandbox.__sampleId = sample.id;
if (!run('grantZoneWeapon(__sampleId, { silent: true })')) fail('grantZoneWeapon failed');
if (!run('weaponZoneUnlocked(__sampleId)')) fail('weaponZoneUnlocked false after grant');
if (!run('weaponUnlockedByLevel(weaponById(__sampleId))')) fail('weaponUnlockedByLevel false after grant');
if (run('weaponSkillGated(weaponById(__sampleId))')) fail('zone weapon should not be skill-gated');

run('save.weapon = __sampleId');
const advW = run('playerWeaponForAdventure(3)');
if (!advW || advW.id !== sample.id) {
  fail('playerWeaponForAdventure stripped zone weapon (got ' + (advW && advW.id) + ')');
}

run('save.zoneWeapons = {}');
run('save.lvl = 70');
run('save.unlocked = 70');
const best = run('bestWeaponForAdventureCap(70)');
if (best && best.dropZone) fail('bestWeaponForAdventureCap picked zone weapon without unlock');

// --- on-hit burn ---
run('save.zoneWeapons = {}; save.zoneWeapons[__sampleId] = 1; save.weapon = __sampleId');
run(`
  globalThis.__zwMon = {
    alive: true, hp: 100, maxhp: 100, x: 200, y: 400, size: 24, vx: 0, face: -1,
    sp: { name: 'Dummy', c1: '#fff', rarity: 'common' },
    takeDamage(d) { this.hp -= d; if (this.hp <= 0) this.alive = false; },
  };
  globalThis.__zwFighter = {
    weapon: Object.assign({}, applySummonTier(weaponById(__sampleId)), { effect: 'burn', effectLabel: 'test-burn' }),
    face: 1, isPlayer: true, x: 100, hp: 50, maxhp: 50,
  };
  globalThis.__zwGame = {
    monsters: [__zwMon],
    floater() {},
    burst() {},
    freezeT: 0,
    _wpnFlutterQueue: null,
  };
  applyWeaponOnHitEffect(__zwGame, __zwFighter, __zwMon, { dmg: 12, finisher: false });
`);
if (!(run('__zwMon.wpnBurnT > 0'))) fail('burn effect did not set wpnBurnT');
run('tickWeaponStatusEffects(__zwGame, 0.6)');
if (!(run('__zwMon.hp < 100'))) fail('tickWeaponStatusEffects did not apply burn dmg');

run('save.zoneWeapons = {}');
const granted = run("grantZoneBossClearWeapon(10, 'nightmare')");
if (!granted) fail('grantZoneBossClearWeapon NM island boss L10 failed');
if (!run('Object.keys(save.zoneWeapons).length > 0')) fail('zoneWeapons not updated on boss clear');

const noGrant = run("grantZoneBossClearWeapon(7, 'nightmare')");
if (noGrant) fail('non-boss level should not guarantee zone weapon');

if (run("!!weaponLightFx(weaponById('vuist'))")) fail('vuist must not have special light fx');
if (!run("!!weaponLightFx(weaponById('laser'))")) fail('legendary laser needs light fx');
if (!run("!!weaponLightFx(weaponById('void'))")) fail('mythic void needs light fx');
for (const w of zoneW) {
  sandbox.__lid = w.id;
  const fx = run('weaponLightFx(weaponById(__lid))');
  if (!fx || !fx.color || !fx.special) fail('missing light fx for ' + w.id);
  try {
    run('drawWeaponShape(document.createElement("canvas").getContext("2d"), __lid, 0.4, 0)');
  } catch (e) {
    fail('drawWeaponShape+light threw for ' + w.id + ': ' + e.message);
  }
}
run(`
  globalThis.__lightBursts = 0;
  spawnWeaponLightHit({
    burst() { globalThis.__lightBursts++; },
    particles: [],
  }, { weapon: weaponById('nachtkaars') }, { x: 10, y: 20, size: 24 }, { finisher: true });
`);
if (!(run('__lightBursts > 0'))) fail('spawnWeaponLightHit did not burst');
run("save.liteFx = true; globalThis.__lightBursts = 0");
run(`
  spawnWeaponLightHit({
    burst() { globalThis.__lightBursts++; },
    particles: [],
  }, { weapon: weaponById('hellevork') }, { x: 10, y: 20, size: 24 }, {});
`);
if (!(run('__lightBursts > 0'))) fail('liteFx still needs a small light burst');

console.log(JSON.stringify({
  ok: true,
  zoneWeapons: zoneW.length,
  effects: effects.size,
  sample: sample.id,
  advKept: advW.id,
  lightFx: zoneW.length,
}));
console.log('SMOKE_OK zone-weapons');
process.exit(0);