#!/usr/bin/env node
/** Gear systems: catalog volume, flags, gates, migrate, save safety. */
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
['menuScreen', 'game', 'toastHost', 'btnAdventure', 'gearScreen', 'gearSlotRow', 'gearList'].forEach(getEl);
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

const sandbox = vm.createContext(ctx);
vm.runInContext(code, sandbox, { filename: 'game.js' });
const run = (src) => vm.runInContext(src, sandbox);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const slots = run('GEAR_SLOT_IDS.slice()');
assert(slots.join(',') === 'head,chest,hands,legs,back', 'five stable slots including back');
assert(run('GEAR_SCHEMA === 1'), 'schema 1');

const total = run('GEAR_ITEMS.length');
assert(total >= 100, 'catalog volume >= 100, got ' + total);

for (const slot of ['head', 'chest', 'hands', 'legs', 'back']) {
  const n = run(`gearItemsForSlot(${JSON.stringify(slot)}).length`);
  assert(n >= 20, slot + ' should have >= 20 items, got ' + n);
}

const cosmetics = run("GEAR_ITEMS.filter(i => i.kind === 'cosmetic')");
const vanity = cosmetics.filter((i) => i.vanity);
const statCos = cosmetics.filter((i) => !i.vanity && i.hasStats);
assert(vanity.length > statCos.length, 'most cosmetics are vanity');
assert(statCos.length >= 8, 'some cosmetics have stats');
assert(run("GEAR_ITEMS.filter(i => i.kind === 'armour').every(i => i.hasStats && !i.vanity)"), 'armour has stats');

assert(run('GEAR_ITEMS.every(i => i.unlockLvl >= 1 && i.unlockDays >= 1)'), 'every item has level + time gate');
assert(run('new Set(GEAR_ITEMS.map(i => i.id)).size === GEAR_ITEMS.length'), 'unique item ids');

const DAY = run('GEAR_MS_PER_DAY');
const now = Date.now();

run(`
  globalThis.__gNow = ${now};
  save = sanitizeSave(Object.assign({}, DEFAULT_SAVE, { createdAt: ${now}, lvl: 1, unlocked: 1 }));
`);
assert(run('save.createdAt === ' + now) || run('save.createdAt > 1e11'), 'createdAt set');
assert(run("save.gear.schema === 1"), 'gear bag schema');
assert(run("!!save.gear.owned.head_wrap_cloth"), 'starter head granted');
assert(run("!!save.gear.owned.back_pin_dot"), 'starter back granted');
assert(run("save.gear.equipped.head === 'head_wrap_cloth'"), 'starter auto-equip');

const defaultEq = run('JSON.stringify(DEFAULT_SAVE.gear.equipped)');
run('grantStarterGear(DEFAULT_SAVE, ' + now + ')');
assert(run('JSON.stringify(DEFAULT_SAVE.gear.equipped)') === defaultEq, 'DEFAULT_SAVE.gear not mutated');

run(`
  save = sanitizeSave(Object.assign({}, DEFAULT_SAVE, {
    createdAt: ${now},
    lvl: 1,
    gear: {
      schema: 1,
      equipped: { head: 'head_helm_iron', charm: 'charm_void', fake: 'x' },
      owned: {
        head_helm_iron: { at: ${now}, src: 'drop' },
        charm_leaf: 1,
        'head_wrap_cloth': true,
        nope: { at: 1 },
        __proto__: { polluted: 1 },
      },
    },
  }));
`);
assert(run("!save.gear.owned.nope"), 'unknown id stripped');
assert(run("!!save.gear.owned.back_leaf"), 'charm_leaf migrated to back_leaf');
assert(run("save.gear.equipped.head !== 'head_helm_iron'"), 'gated unequipped (lvl 1 cannot wear iron helm)');
assert(run("save.gear.equipped.back !== 'charm_void' && save.gear.equipped.back !== 'back_void'"), 'legacy charm/void stays gated');
assert(run("!Object.prototype.polluted"), 'no proto pollution');

run(`
  save = sanitizeSave(Object.assign({}, DEFAULT_SAVE, {
    createdAt: ${now - 20 * DAY},
    lvl: 20,
    unlocked: 20,
    gear: { schema: 1, equipped: {}, owned: { head_visor_neon: { at: 1, src: 'drop' } } },
  }));
`);
assert(run("gearCanEquip('head_visor_neon').ok === true"), 'stat cosmetic unlocks when lvl+days pass');
assert(run("gearItemHasCombatStats(gearItemById('head_visor_neon'))"), 'stat cosmetic applies');
assert(run("!gearItemHasCombatStats(gearItemById('head_hat_paper'))"), 'vanity cosmetic no stats');

run("gearEquipItem('head_visor_neon')");
const mods = run('gearCombatMods()');
assert(mods.energyMul > 1, 'equipped stat cosmetic stacks energy');

run(`
  save = sanitizeSave(Object.assign({}, DEFAULT_SAVE, {
    createdAt: ${now - 2 * DAY},
    lvl: 40,
    gear: { owned: { head_visor_neon: { at: 1 } }, equipped: { head: 'head_visor_neon' } },
  }));
`);
assert(run("save.gear.equipped.head !== 'head_visor_neon'"), 'time gate unequips if days not met');
assert(run("gearItemLootable(gearItemById('head_visor_neon')) === false"), 'time gate still blocks lootable');
assert(run("gearCanEquip('head_visor_neon').ok === false"), 'equip blocked by time gate even if owned');

run(`
  save = sanitizeSave(Object.assign({}, DEFAULT_SAVE, {
    lvl: 12,
    unlocked: 12,
    stats: { kills: 80 },
    gear: { owned: ['charm_pin_star', 'head_wrap_cloth'] },
  }));
`);
assert(run('save.createdAt <= Date.now()'), 'veteran createdAt set');
assert(run("!!save.gear.owned.back_pin_star"), 'owned array + charm alias migrate');
assert(run('gearAccountAgeDays(save, Date.now()) >= 80'), 'veteran backdate unlocks time gates');

run(`
  const dirty = Object.assign({}, DEFAULT_SAVE, {
    gear: { equipped: 'nope', owned: null, schema: 99 },
    createdAt: 'tomorrow',
  });
  save = sanitizeSave(dirty);
`);
assert(run("save.gear && save.gear.schema === 1 && save.gear.equipped.head !== undefined"), 'corrupt bag repaired');
assert(run('typeof save.createdAt === "number" && save.createdAt > 1e11'), 'bad createdAt repaired');

const rarities = run("[...new Set(GEAR_ITEMS.map(i => i.rarity))]");
for (const r of ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'nightmare', 'hell']) {
  assert(rarities.includes(r), 'rarity spread includes ' + r);
}

console.log('SMOKE_OK gear: ' + total + ' items · slots ' + slots.join('/') + ' · vanity cosmetics ' + vanity.length + ' · stat cosmetics ' + statCos.length);
