#!/usr/bin/env node
/** Upgrade hardening smoke — cheat-save clamp + eligibility gates. */
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
const get = (id) => { if (!byId.has(id)) byId.set(id, makeEl(id)); return byId.get(id); };
['menuScreen', 'game', 'toastHost', 'btnAdventure'].forEach(get);
get('menuScreen').classList.s.add('active');

const ctx = {
  document: {
    getElementById: get,
    querySelector: () => null,
    querySelectorAll: () => [],
    body: get('body'),
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

vm.runInContext(code, vm.createContext(ctx), { filename: 'game.js' });

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Baseline save — kunai unlocked at Lv1+
ctx.save = ctx.sanitizeSave(Object.assign({}, ctx.DEFAULT_SAVE, {
  lvl: 5,
  weapon: 'kunai',
  skillUpgrades: { rasengan: { level: 99, shards: 0 }, dash: { level: 2, shards: 1 } },
  itemUpgrades: {
    weapon: { kunai: { level: 9, shards: 0 }, vuist: { level: 3, shards: 5 }, fake: { level: 2, shards: 2 } },
    pet: { pet_slymo: { level: 4, shards: 99 } },
    style: { void: { level: 6, shards: 0 } },
    hacker: { x: { level: 5, shards: 5 } },
  },
}));

assert(ctx.skillLevel('rasengan') <= ctx.skillMaxLevel('rasengan'), 'skill level clamped to max');
assert(ctx.skillLevel('dash') <= 2, 'skill level clamped by shard budget');
assert(!ctx.save.itemUpgrades.weapon?.vuist, 'vuist upgrades stripped');
assert(!ctx.save.itemUpgrades.weapon?.fake, 'invalid weapon id stripped');
assert(!ctx.save.itemUpgrades.hacker, 'invalid category stripped');
assert(ctx.save.itemUpgrades.style?.void, 'style upgrades persist when island-gated');
assert(ctx.itemUpgradeLevel('weapon', 'kunai') <= ctx.itemUpgradeMax('weapon', 'kunai'), 'weapon level clamped');
assert(ctx.save.itemUpgrades.pet?.pet_slymo, 'pet upgrades persist when untamed');

ctx.save.pets = { pet_slymo: { at: Date.now() } };
ctx.normalizeItemUpgrades();
assert(ctx.itemUpgradeLevel('pet', 'pet_slymo') <= ctx.itemUpgradeMax('pet', 'pet_slymo'), 'pet level clamped when tamed');

assert(ctx.addItemShards('weapon', 'vuist', 1) === 0, 'ineligible weapon shard add blocked');
assert(ctx.addItemShards('weapon', 'fake_id', 1) === 0, 'invalid weapon shard add blocked');
assert(ctx.weaponUpgradeBonuses('vuist').dmgMul === 1, 'vuist gets no weapon bonus');

const equipped = ctx.sanitizeSave(Object.assign({}, ctx.DEFAULT_SAVE, {
  lvl: 8,
  unlocked: 8,
  skillUpgrades: { chidori: { level: 2, shards: 0 }, rasengan: { level: 1, shards: 0 } },
  activeJutsu: 'chidori',
}));
assert(equipped.activeJutsu === 'chidori', 'equipped jutsu kept after sanitize');
assert(ctx.activeJutsuId(undefined, equipped) === 'chidori', 'active jutsu resolves from save');
assert(ctx.jutsuSkillUnlocked('chidori', equipped), 'chidori unlocked at Lv 2');
assert(ctx.skillBonuses('chidori', equipped).dmgMul > 1, 'upgraded skill bonuses apply from Lv 1+');
assert(ctx.skillBonuses('rasengan', equipped).dmgMul > 1, 'rasengan Lv 1 bonus applies');

// Roster unlock (needLvl) must allow equipping Chidori without shard upgrades
const rosterOnly = ctx.sanitizeSave(Object.assign({}, ctx.DEFAULT_SAVE, {
  lvl: 8,
  unlocked: 8,
  skill: 'chidori',
  activeJutsu: 'chidori',
  skillUpgrades: {},
}));
assert(ctx.jutsuSkillUnlocked('chidori', rosterOnly), 'chidori equippable via roster needLvl without shards');
assert(rosterOnly.activeJutsu === 'chidori', 'sanitize keeps roster-equipped chidori');
assert(ctx.activeJutsuId(undefined, rosterOnly) === 'chidori', 'activeJutsuId respects roster unlock');

vm.runInContext(
  "Object.assign(save, { lvl: 8, unlocked: 8, skillUpgrades: {}, activeJutsu: 'rasengan', skill: 'rasengan' });",
  ctx
);
assert(ctx.jutsuSkillUnlocked('chidori'), 'live save: chidori unlocked at fighter Lv 8');
assert(ctx.setActiveJutsu('chidori', true), 'setActiveJutsu chidori without shards');
assert(vm.runInContext('save.activeJutsu', ctx) === 'chidori', 'activeJutsu set to chidori');
assert(vm.runInContext('save.skill', ctx) === 'chidori', 'skill synced to chidori');

const tooLow = Object.assign({}, ctx.DEFAULT_SAVE, { lvl: 4, unlocked: 4, skillUpgrades: {} });
assert(!ctx.jutsuSkillUnlocked('chidori', tooLow), 'chidori still locked below needLvl without shards');

console.log('SMOKE_OK upgrades hardened');
