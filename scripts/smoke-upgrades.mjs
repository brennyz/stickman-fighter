#!/usr/bin/env node
/**
 * Upgrade hardening smoke — cheat-save clamp + ownership gates.
 * Mutates lexical `save` via vm.runInContext (ctx.save = … does NOT work).
 */
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
    querySelector() { return null; }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 40 }; },
    setAttribute() {}, removeAttribute() {}, getAttribute() { return null; },
    getContext() {
      return new Proxy({}, { get: (_t, p) => (p === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => undefined) });
    },
  };
}

const byId = new Map();
const getEl = (id) => { if (!byId.has(id)) byId.set(id, makeEl(id)); return byId.get(id); };
['menuScreen', 'game', 'toastHost', 'btnAdventure'].forEach(getEl);
getEl('menuScreen').classList.s.add('active');

const ctx = {
  document: {
    getElementById: getEl,
    querySelector: () => null,
    querySelectorAll: () => [],
    body: getEl('body'),
    createElement: (t) => makeEl(t),
    addEventListener() {},
    dispatchEvent() {},
  },
  addEventListener() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  innerWidth: 1024, innerHeight: 768, devicePixelRatio: 2,
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

const sandbox = vm.createContext(ctx);
vm.runInContext(code, sandbox, { filename: 'game.js' });

const run = (src) => vm.runInContext(src, sandbox);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function setSave(patch) {
  sandbox.__patch = patch;
  run('save = sanitizeSave(Object.assign({}, DEFAULT_SAVE, globalThis.__patch))');
}

// --- sanitize / clamp (apply via lexical save) ---
setSave({
  lvl: 5,
  weapon: 'kunai',
  skillUpgrades: { rasengan: { level: 99, shards: 0 }, dash: { level: 2, shards: 1 } },
  itemUpgrades: {
    weapon: { kunai: { level: 9, shards: 0 }, vuist: { level: 3, shards: 5 }, fake: { level: 2, shards: 2 } },
    pet: { pet_slymo: { level: 4, shards: 99 } },
    style: { void: { level: 6, shards: 0 } },
    hacker: { x: { level: 5, shards: 5 } },
  },
});

assert(run("skillLevel('rasengan') <= skillMaxLevel('rasengan')"), 'skill level clamped to max');
assert(run("skillLevel('dash') <= 2"), 'skill level clamped by shard budget');
assert(run('!save.itemUpgrades.weapon?.vuist'), 'vuist upgrades stripped');
assert(run('!save.itemUpgrades.weapon?.fake'), 'invalid weapon id stripped');
assert(run('!save.itemUpgrades.hacker'), 'invalid category stripped');
assert(run('!!save.itemUpgrades.style?.void'), 'style upgrades persist when island-gated');
assert(run("itemUpgradeLevel('weapon', 'kunai') <= itemUpgradeMax('weapon', 'kunai')"), 'weapon level clamped');
assert(run('!!save.itemUpgrades.pet?.pet_slymo'), 'pet upgrades persist when untamed');

run('save.pets = { pet_slymo: { at: Date.now() } }');
run('normalizeItemUpgrades()');
assert(run("itemUpgradeLevel('pet', 'pet_slymo') <= itemUpgradeMax('pet', 'pet_slymo')"), 'pet level clamped when tamed');

assert(run("addItemShards('weapon', 'vuist', 1) === 0"), 'ineligible weapon shard add blocked');
assert(run("addItemShards('weapon', 'fake_id', 1) === 0"), 'invalid weapon shard add blocked');
assert(run("weaponUpgradeBonuses('vuist').dmgMul === 1"), 'vuist gets no weapon bonus');

setSave({
  lvl: 8,
  skillUpgrades: { chidori: { level: 2, shards: 0 }, rasengan: { level: 1, shards: 0 } },
  activeJutsu: 'chidori',
});
assert(run("save.activeJutsu === 'chidori'"), 'equipped jutsu kept after sanitize');
assert(run("activeJutsuId(undefined, save) === 'chidori'"), 'active jutsu resolves from save');
assert(run("jutsuSkillUnlocked('chidori', save)"), 'chidori unlocked at Lv 2');
assert(run("skillBonuses('chidori', save).dmgMul > 1"), 'upgraded skill bonuses apply from Lv 1+');
assert(run("skillBonuses('rasengan', save).dmgMul > 1"), 'rasengan Lv 1 bonus applies');

// --- ownership: no upgrade for weapons you don't own ---
assert(run("!weaponUpgradeEligible(weaponById('vuist'))"), 'vuist never upgrade-eligible');
const master = run("weaponById('master_sword')");
if (master && master.id === 'master_sword') {
  assert(run("!weaponUpgradeEligible(weaponById('master_sword'))"), 'master_sword never upgrade-eligible');
}

setSave({ lvl: 1, zoneWeapons: {} });
assert(run("!WEAPONS.some((w) => w.dropZone && weaponUpgradeEligible(w))"), 'lvl1: no zone weapons eligible');
assert(run("!weaponUpgradeEligible(weaponById('kunai'))"), 'kunai locked at lvl1');
assert(run("addItemShards('weapon', 'kunai', 3) === 0"), 'shards refused for locked weapon');

setSave({ lvl: 25, zoneWeapons: {} });
assert(run("weaponUpgradeEligible(weaponById('kunai'))"), 'kunai owned via level');
assert(run("!weaponUpgradeEligible(weaponById('guvve'))"), 'high unlock weapon locked at lvl25');
assert(run("!WEAPONS.some((w) => w.dropZone && weaponUpgradeEligible(w))"), 'lvl25: still no zone weapons');
assert(run("addItemShards('weapon', 'nachtkaars', 5) === 0"), 'shards refused for unowned zone weapon');

setSave({ lvl: 70, zoneWeapons: {} });
assert(run("!weaponUpgradeEligible(weaponById('nachtkaars'))"), 'lvl70 alone does not unlock zone weapon');
assert(run("!weaponUpgradeEligible(weaponById('hellevork'))"), 'lvl70 alone does not unlock hell weapon');
assert(run("addItemShards('weapon', 'hellevork', 4) === 0"), 'shards refused for unowned hell weapon');
assert(run("!tryItemUpgrade('weapon', 'nachtkaars')"), 'cannot upgrade unowned zone weapon');
// Harden: banked shards / cheat save still cannot upgrade unowned zone weapons
run("save.itemUpgrades = { weapon: { nachtkaars: { level: 0, shards: 99 }, hellevork: { level: 2, shards: 50 } }, pet: {}, style: {} }");
assert(run("!weaponUpgradeEligible(weaponById('nachtkaars'))"), 'banked shards do not imply ownership');
assert(run("addItemShards('weapon', 'nachtkaars', 1) === 0"), 'belt: no shard add with banked+unowned');
assert(run("!tryItemUpgrade('weapon', 'nachtkaars')"), 'belt: tryItemUpgrade blocked with banked shards');
assert(run("!itemCanUpgrade('weapon', 'nachtkaars')"), 'itemCanUpgrade false when unowned');
assert(run("weaponUpgradeBonuses('nachtkaars').dmgMul === 1"), 'unowned zone weapon gets no combat bonus');
assert(run("weaponUpgradeBonuses('hellevork').dmgMul === 1"), 'unowned hell weapon gets no combat bonus despite saved level');

// All zone weapons blocked at high lvl without ownership
assert(run("WEAPONS.filter((w) => w.dropZone).every((w) => !weaponUpgradeEligible(w))"), 'every zone weapon blocked without ownership');
assert(run("WEAPONS.filter((w) => w.dropZone).every((w) => addItemShards('weapon', w.id, 1) === 0)"), 'every zone weapon shard-add blocked');

setSave({ lvl: 55, zoneWeapons: { nachtkaars: 1 } });
assert(run("weaponUpgradeEligible(weaponById('nachtkaars'))"), 'owned nachtkaars is upgrade-eligible');
assert(run("!weaponUpgradeEligible(weaponById('hellevork'))"), 'unowned hell weapon still blocked');
assert(run("addItemShards('weapon', 'nachtkaars', 3) === 3"), 'shards ok for owned zone weapon');
assert(run("itemUpgradeShards('weapon', 'nachtkaars') === 3"), 'owned zone shard count');
// Owned zone weapon with enough shards can upgrade
run("save.itemUpgrades.weapon.nachtkaars = { level: 0, shards: itemUpgradeCost('weapon', 'nachtkaars') }");
assert(run("tryItemUpgrade('weapon', 'nachtkaars')"), 'owned zone weapon upgrades with shards');
assert(run("itemUpgradeLevel('weapon', 'nachtkaars') === 1"), 'owned zone upgrade level 1');

setSave({ lvl: 70, zoneWeapons: { hellevork: 1, nachtkaars: 1 } });
assert(run("weaponUpgradeEligible(weaponById('hellevork'))"), 'owned hellevork eligible');
assert(run("weaponUpgradeEligible(weaponById('nachtkaars'))"), 'owned nachtkaars eligible at 70');

// throw weapons never upgradeable
assert(run("!weaponUpgradeEligible(weaponById('shuriken'))"), 'shuriken (throw) not upgradeable');
assert(run("!weaponUpgradeEligible(weaponById('boemerang'))"), 'boemerang (throw) not upgradeable');

// pets / styles still gated
setSave({ lvl: 10, pets: {} });
assert(run("!petUpgradeEligible(petDef('pet_slymo'))"), 'untamed pet not eligible');
assert(run("addItemShards('pet', 'pet_slymo', 5) === 0"), 'pet shards refused when untamed');
run("save.pets = { pet_slymo: { at: Date.now() } }");
assert(run("petUpgradeEligible(petDef('pet_slymo'))"), 'tamed pet eligible');
assert(run("addItemShards('pet', 'pet_slymo', 2) === 2"), 'pet shards ok when tamed');

setSave({ lvl: 1, trainWins: 0 });
assert(run("!styleUpgradeEligible(styleById('chakra'))"), 'locked style not eligible');
assert(run("addItemShards('style', 'chakra', 5) === 0"), 'style shards refused when locked');
run('save.trainWins = 3');
assert(run("styleUpgradeEligible(styleById('chakra'))"), 'unlocked style eligible');

// shard drop pool never picks unowned weapons (superBoss → high drop chance)
setSave({ lvl: 20, zoneWeapons: {}, pets: { pet_slymo: { at: 1 } }, style: 'classic' });
for (let i = 0; i < 50; i++) {
  const drop = run('rollItemShardDrop({ superBoss: true })');
  if (!drop) continue;
  if (drop.cat === 'weapon') {
    assert(run(`weaponUpgradeEligible(weaponById(${JSON.stringify(drop.id)}))`), `weapon drop ${drop.id} must be owned`);
    assert(run(`!weaponById(${JSON.stringify(drop.id)}).dropZone`), 'no zone-weapon shard drop without ownership');
  }
  if (drop.cat === 'pet') {
    assert(run(`petUpgradeEligible(petDef(${JSON.stringify(drop.id)}))`), `pet drop ${drop.id} must be tamed`);
  }
  if (drop.cat === 'style') {
    assert(run(`styleUpgradeEligible(styleById(${JSON.stringify(drop.id)}))`), `style drop ${drop.id} must be unlocked`);
  }
}

setSave({
  lvl: 60,
  zoneWeapons: { nachtkaars: 1 },
  pets: { pet_slymo: { at: 1 } },
  style: 'classic',
});
let sawOwnedZone = false;
for (let i = 0; i < 120; i++) {
  const drop = run('rollItemShardDrop({ superBoss: true })');
  if (drop && drop.cat === 'weapon' && drop.id === 'nachtkaars') sawOwnedZone = true;
  if (drop && drop.cat === 'weapon') {
    assert(run(`weaponUpgradeEligible(weaponById(${JSON.stringify(drop.id)}))`), `drop ${drop.id} stays eligible`);
  }
}
assert(
  sawOwnedZone || run("weaponUpgradeEligible(weaponById('nachtkaars'))"),
  'owned zone weapon is in pool or at least eligible'
);

// full upgrade path on owned weapon
setSave({ lvl: 5, zoneWeapons: {} });
assert(run("weaponUpgradeEligible(weaponById('kunai'))"), 'kunai eligible at lvl5');
assert(run("!itemCanUpgrade('weapon', 'kunai')"), 'cannot upgrade without shards');
const cost = run("itemUpgradeCost('weapon', 'kunai')");
assert(typeof cost === 'number' && cost >= 1, 'upgrade cost positive');
run(`addItemShards('weapon', 'kunai', ${cost})`);
assert(run("itemCanUpgrade('weapon', 'kunai')"), 'can upgrade with shards');
assert(run("tryItemUpgrade('weapon', 'kunai')"), 'tryItemUpgrade succeeds');
assert(run("itemUpgradeLevel('weapon', 'kunai') === 1"), 'upgrade level becomes 1');

console.log('SMOKE_OK upgrades hardened + ownership gates');
