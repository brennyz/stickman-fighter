#!/usr/bin/env node
/**
 * Smoke: FOMO PR-A (F0 local clock · F1 ritual sheet · F3 consecutive streak).
 * Spec: docs/FOMO-GAPS.md (#274). No F2 pity / Versus / weekly hunt.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error('SMOKE_FAIL', msg);
  process.exit(1);
}

const missions = fs.readFileSync(path.join(root, 'src/systems/missions.js'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'src/core/storage.js'), 'utf8');
const chest = fs.readFileSync(path.join(root, 'src/data/chest-summons.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
const catalog = fs.readFileSync(path.join(root, 'src/i18n/catalog.js'), 'utf8');
const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');

if (/function todayKey\(\)\s*\{\s*return new Date\(\)\.toISOString/.test(missions)) {
  fail('F0: todayKey still uses UTC toISOString');
}
if (!/getFullYear\(\) \+ '-' \+ String\(d\.getMonth/.test(missions)) {
  fail('F0: todayKey must use local YYYY-MM-DD');
}
if (!/function weekKey/.test(missions) || !/function daysBetweenKeys/.test(missions)) {
  fail('shared helpers weekKey/daysBetweenKeys missing');
}
if (!/id="fomoRitual"/.test(html)) fail('F1: #fomoRitual missing in index.html');
if (/id="fomoRitual"[^>]*class="[^"]*screen/.test(html)) fail('F1: ritual must not be a .screen');
if (!/fomoRitualReopen/.test(html)) fail('F1: Dagoverzicht reopen button missing');
if (!/fomo\.ritualTitle/.test(i18n) || !/fomo\.ritualReopen/.test(i18n)) {
  fail('F1: required i18n keys missing');
}
if (!/fomoRitualEggVisible/.test(missions) || !/advWins/.test(missions)) {
  fail('F1: egg visibility helper missing');
}
if (!/dailyStreakBest/.test(missions) || /daily7[\s\S]{0,80}dailyBonusCount/.test(missions)) {
  fail('F3: daily7 must test dailyStreakBest');
}
if (!/daysBetweenKeys\(prevDate, today\) === 1/.test(missions)) {
  fail('F3: miss-a-day must reset streak via daysBetweenKeys === 1');
}
if (/dudStreak|niceToday|grantMidChestWeapon/.test(missions)) {
  fail('F2 pity leaked into PR-A missions');
}
if (/function openChestSummon[\s\S]*dudStreak/.test(chest)) {
  fail('F2 pity leaked into openChestSummon');
}
if (/Versus|versus/.test((i18n.match(/fomo: \{[\s\S]*?\n    \},/) || [''])[0])) {
  fail('F1 fomo copy must not mention Versus');
}
if (!/CHEST_DAILY_LEFT_CAP = 12/.test(chest)) fail('F3: chest left cap 12 missing');
if (!/CHEST_DAILY_TOTAL = 10/.test(chest)) fail('F0: quota 10 must stay');
if (!/\bfomo:/.test(storage) || !/lastDayBonusDate/.test(storage)) {
  fail('sanitize/DEFAULT_SAVE missing fomo or lastDayBonusDate');
}
if (!/showFomoRitual/.test(ui) || !/lastOpenDate/.test(ui)) {
  fail('F1 renderMenu ritual / lastOpenDate missing');
}
if (!/hideFomoRitual\(\)/.test(ui) || !/fomo-open/.test(ui)) {
  fail('FOMO hide / fomo-open class missing — sheet can overlap summon');
}
if (!/summonTutShouldShow/.test(chest) || !/summonFomoSheetOpen/.test(chest)) {
  fail('tip vs FOMO helpers missing');
}
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
if (!/body:has\(#summonScreen\.active\) #fomoRitual/.test(css)) {
  fail('CSS must hide FOMO while summonScreen is active');
}
if (!/body\.fomo-open #summonTut/.test(css)) {
  fail('CSS must hide summon tip while FOMO is open');
}
if (!/_syncFomoHubLock/.test(ui) || !/is-fomo/.test(ui)) {
  fail('EX-021: FOMO hub lock (_syncFomoHubLock / is-fomo) missing');
}

function makeEl(id) {
  return {
    id, tagName: 'DIV', classList: { s: new Set(), add() {}, remove() {}, toggle() {}, contains: () => false },
    style: {}, hidden: id === 'fomoRitual', dataset: {}, disabled: false, textContent: '', innerHTML: '', value: '',
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
get('menuScreen').classList.s.add('active');

const ctx = {
  document: {
    getElementById: get, querySelector: () => null, querySelectorAll: () => [],
    body: get('body'), createElement: (t) => makeEl(t),
    createTextNode: (s) => ({ nodeType: 3, textContent: String(s), data: String(s) }),
    addEventListener() {}, dispatchEvent() {},
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
vm.runInContext(game, sandbox, { filename: 'game.js' });
const g = (src) => vm.runInContext(src, sandbox);

function must(cond, msg) { if (!cond) fail(msg); }

const pad = (n) => String(n).padStart(2, '0');
const localToday = (() => {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
})();
must(typeof g('todayKey') === 'function', 'todayKey not on runtime');
must(g('todayKey()') === localToday, `todayKey ${g('todayKey()')} !== local ${localToday}`);
must(g('daysBetweenKeys("2026-09-13", "2026-09-14")') === 1, 'daysBetweenKeys adjacent');
must(g('daysBetweenKeys("2026-09-12", "2026-09-14")') === 2, 'daysBetweenKeys skip');
must(g('daysBetweenKeys(null, todayKey())') === 99, 'daysBetweenKeys null → 99');

const ach = g('ACHIEVEMENTS.find(a => a.id === "daily7")');
must(ach, 'daily7 achievement missing');
must(!ach.test({ stats: { dailyBonusCount: 99, dailyStreakBest: 6 } }), 'daily7 must ignore lifetime count');
must(!!ach.test({ stats: { dailyBonusCount: 1, dailyStreakBest: 7 } }), 'daily7 unlocks on best consecutive ≥7');

g(`save = sanitizeSave(Object.assign({}, DEFAULT_SAVE, {
  chestDaily: { date: todayKey(), left: 10, pulls: [] },
  stats: Object.assign({}, DEFAULT_SAVE.stats, { advWins: 0, dailyStreak: 0, dailyStreakBest: 0, dailyBonusCount: 0 }),
  fomo: defaultFomoBag(),
}))`);
must(g('fomoRitualEggVisible()') === false, 'egg row must hide until first adv win');
g('save.stats.advWins = 1');
must(g('fomoRitualEggVisible()') === true, 'egg row after first adv win');

must(g('fomoRitualPending()') === true, 'new day + summons left → ritual pending');
g('save.fomo.ritualSeenDate = todayKey()');
must(g('fomoRitualPending()') === false, 'same-day dismiss → not pending');

const dirty = g(`sanitizeSave(Object.assign({}, DEFAULT_SAVE, {
  fomo: { ritualSeenDate: '2026-09-14', lastOpenDate: '2026-09-14', hacker: true, sneakCleared: 1 },
  stats: Object.assign({}, DEFAULT_SAVE.stats, { dailyStreak: 4, dailyStreakBest: 4, lastDayBonusDate: '2026-09-13', dailyBonusCount: 12 }),
  chestDaily: { date: todayKey(), left: 12, pulls: [] },
}))`);
must(dirty.fomo.ritualSeenDate === '2026-09-14', 'fomo date kept');
must(dirty.fomo.hacker == null, 'unknown fomo keys dropped');
must(dirty.stats.lastDayBonusDate === '2026-09-13', 'lastDayBonusDate kept as date');
must(dirty.stats.dailyStreak === 4, 'dailyStreak kept');
must(dirty.chestDaily.left === 12, 'F3 extra pull must survive sanitize (cap 12)');

function readyDay(prevDate, prevStreak) {
  const tasks = JSON.stringify(['kills12', 'advwin', 'wall35'].map((id) => ({ id, progress: 99, done: true, claimed: true })));
  g(`(function(){
    const tasks = ${tasks};
    save = sanitizeSave(Object.assign({}, DEFAULT_SAVE, {
      daily: { date: todayKey(), tasks: tasks, dayBonusClaimed: false },
      stats: Object.assign({}, DEFAULT_SAVE.stats, {
        dailyBonusCount: ${prevStreak || 0},
        dailyStreak: ${prevStreak || 0},
        dailyStreakBest: ${prevStreak || 0},
        lastDayBonusDate: ${JSON.stringify(prevDate)},
      }),
      chestDaily: { date: todayKey(), left: 10, pulls: [] },
    }));
    save.daily.dayBonusClaimed = false;
    save.daily.tasks = tasks;
  })()`);
}

const shift = (iso, days) => {
  const t = Date.parse(iso + 'T12:00:00') + days * 86400000;
  const d = new Date(t);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
};

readyDay(shift(localToday, -1), 1);
g('claimDailyDayBonus()');
must(g('save.stats.dailyStreak') === 2, `Mon+Tue should be streak 2, got ${g('save.stats.dailyStreak')}`);
must(g('save.stats.lastDayBonusDate') === localToday, 'lastDayBonusDate stamped today');

readyDay(shift(localToday, -2), 5);
g('claimDailyDayBonus()');
must(g('save.stats.dailyStreak') === 1, `miss a day → streak 1, got ${g('save.stats.dailyStreak')}`);
must(g('save.stats.dailyStreakBest') === 5, 'best consecutive must survive a miss');

readyDay(shift(localToday, -1), 2);
g('claimDailyDayBonus()');
must(g('save.stats.dailyStreak') === 3, 'day-3 streak');
must(g('save.chestDaily.left') === 11, `day-3 extra pull, left=${g('save.chestDaily.left')}`);

readyDay(shift(localToday, -1), 13);
g('save.lvl = 40; save.xp = 0');
g('claimDailyDayBonus()');
must(g('save.stats.dailyStreak') === 14, 'day-14 streak');
must(g('save.xp') >= 200 || g('save.lvl') > 40, 'day-14 is +80 and +120 XP only');
must(g('save.weekly') == null, 'PR-A must not write weekly/F4 fields');

console.log('SMOKE_OK fomo-pra F0/F1/F3');
