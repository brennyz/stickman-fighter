#!/usr/bin/env node
/** Smoke: laadt game.js in een minimale DOM — vangt TDZ / init crashes. */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const code = fs.readFileSync(path.join(root, 'game.js'), 'utf8');

// Regressie: Input.onDown mag playInputSuppressed() niet aanroepen als de helper
// ontbreekt — dat gaf ReferenceError → window error → recoverToMenu (adventure 1-tap crash).
if (/\bplayInputSuppressed\s*\(/.test(code) && !/function\s+playInputSuppressed\s*\(/.test(code)) {
  console.error('SMOKE_FAIL playInputSuppressed() called but function not defined — adventure tap→menu');
  process.exit(1);
}

// Regressie v1.18.73: levelScreenActive()-guard in gokGooiStartLevel brak Continue
// (menu → dice roll → abort omdat levelScreen niet open is).
{
  const fn = code.match(/function\s+gokGooiStartLevel\s*\([\s\S]*?\nfunction\s+\w+/);
  const body = fn ? fn[0] : '';
  if (/levelScreenActive\s*\(/.test(body)) {
    console.error('SMOKE_FAIL gokGooiStartLevel must not gate on levelScreenActive — Continue never starts');
    process.exit(1);
  }
  if (/gambleEl\.classList\.contains\s*\(\s*['\"]active['\"]\s*\)/.test(code.match(/function\s+gokGooiStartFromScreen\s*\([\s\S]*?\nfunction\s+\w+/)?.[0] || '')) {
    console.error('SMOKE_FAIL gokGooiStartFromScreen must not abort when gambleScreen inactive');
    process.exit(1);
  }
}

// Regressie v1.18.79: module-split miste checkpoint-helpers → wave-clear ReferenceError.
if (/\bpartBoundaryWaveIdx\s*\(/.test(code) && !/function\s+partBoundaryWaveIdx\s*\(/.test(code)) {
  console.error('SMOKE_FAIL partBoundaryWaveIdx used but not defined — wave clear hiccup');
  process.exit(1);
}
if (/\bplayerWalkInput\s*\(/.test(code) && !/function\s+playerWalkInput\s*\(/.test(code)) {
  console.error('SMOKE_FAIL playerWalkInput used but not defined — part gate hiccup');
  process.exit(1);
}

// Versus-retire: combatEntryFor must not assume vsRosterEntry() returns an object.
{
  const fn = code.match(/function\s+combatEntryFor\s*\([\s\S]*?\nfunction\s+\w+/);
  const body = fn ? fn[0] : '';
  if (!body) {
    console.error('SMOKE_FAIL combatEntryFor missing — punch/weapon attackSpec');
    process.exit(1);
  }
  if (/vsRosterEntry\s*\([^)]*\)\s*;/.test(body) && !/\bif\s*\(\s*e\s*\)/.test(body) && !/e\s*\|\|/.test(body) && !/e\s*\?/.test(body)) {
    console.error('SMOKE_FAIL combatEntryFor must null-check vsRosterEntry — mobile punch/weapon throw');
    process.exit(1);
  }
}
if (/\btrackVsRosterUse\s*\(/.test(code) && !/function\s+trackVsRosterUse\s*\(/.test(code)) {
  console.error('SMOKE_FAIL trackVsRosterUse called but not defined — leftover versus init');
  process.exit(1);
}

function makeEl(id) {
  return {
    id,
    tagName: id === 'game' ? 'CANVAS' : 'DIV',
    classList: {
      s: new Set(),
      add(x) { this.s.add(x); },
      remove(x) { this.s.delete(x); },
      toggle(x, v) {
        if (v === undefined) v = !this.s.has(x);
        v ? this.s.add(x) : this.s.delete(x);
      },
      contains(x) { return this.s.has(x); },
    },
    style: {},
    hidden: false,
    dataset: {},
    disabled: false,
    textContent: '',
    innerHTML: '',
    value: '',
    children: [],
    parentElement: null,
    closest() { return this; },
    addEventListener() {},
    removeEventListener() {},
    appendChild() {},
    remove() {},
    focus() {},
    select() {},
    querySelector() { return null; },
    querySelectorAll(sel) {
      // Genoeg voor screenLooksUsable / hub checks in smoke
      if (this.id && String(this.id).endsWith('Screen')) {
        return [{ clientWidth: 48, clientHeight: 24, className: 'btn' }];
      }
      return [];
    },
    clientWidth: 320,
    clientHeight: 480,
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 40 }; },
    setAttribute() {},
    removeAttribute() {},
    getAttribute() { return null; },
    getContext() {
      return new Proxy({}, {
        get: (_t, p) => {
          if (p === 'createLinearGradient' || p === 'createRadialGradient') {
            return () => ({ addColorStop() {} });
          }
          return () => undefined;
        },
      });
    },
  };
}

const byId = new Map();
const get = (id) => {
  if (!byId.has(id)) byId.set(id, makeEl(id));
  return byId.get(id);
};

[
  'menuScreen', 'levelScreen', 'gambleScreen', 'weaponScreen', 'styleScreen', 'skillScreen', 'settingsScreen',
  'missionsScreen', 'charSelectScreen', 'dexScreen', 'helpScreen', 'installScreen',
  'resultScreen', 'pauseScreen', 'game', 'toastHost', 'pauseBtn', 'menuStats',
  'menuDailyHint', 'menuTipLine', 'menuPlayLink', 'togMusic', 'togSfx',
  'btnAdventure', 'btnTraining', 'btnWall', 'btnMatsCoins', 'btnWeapons', 'btnDex', 'btnVersus',
  'btnContinue', 'btnStyle', 'btnSkills', 'btnSettings', 'btnMissions', 'btnMissionsLbl', 'btnHelp', 'helpOk',
  'skillPreview', 'skillGrid', 'skillGridScroll', 'skillSagaBlurb', 'skillBehaviorBar', 'btnSkillSort', 'skillNextUnlock',
  'superPreview', 'superGrid', 'superGridScroll', 'superSummary', 'superNextUnlock',
  'btnGuvve', 'pauseResume', 'pauseQuit', 'resAgain', 'resNext', 'resMenu',
  'pauseTogMusic', 'pauseTogSfx', 'pauseMusicVol', 'pauseSfxVol', 'tunnelBootOverlay', 'charPickStep', 'charGrid',
  'charGridScroll', 'charStatPreview', 'charP1Label', 'charP2Label', 'btnCharFight',
  'btnCharRandom', 'btnCharSwap', 'btnCharSagaClash', 'charIconRow', 'charPickBackP1', 'charSelectBack', 'netStatus',
  'gambleHead', 'gambleDiceRow', 'gambleSumLine', 'gambleOutcome', 'btnGambleRoll', 'btnGambleStart', 'btnGambleSkip',
].forEach(get);
get('menuScreen').classList.add('active');

const ctx = {
  document: {
    getElementById: get,
    querySelector() { return null; },
    querySelectorAll(sel) {
      if (sel === '.screen') {
        return [...byId.values()].filter((e) => String(e.id).endsWith('Screen'));
      }
      return [];
    },
    body: get('body'),
    createElement: (t) => makeEl(t),
    addEventListener() {},
    dispatchEvent() {},
  },
  addEventListener() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 2,
  requestAnimationFrame: () => 0,
  cancelAnimationFrame() {},
  getComputedStyle() {
    return {
      display: 'flex', visibility: 'visible', opacity: '1',
      animationName: 'none', zIndex: '20', pointerEvents: 'auto',
    };
  },
  setInterval() { return 0; },
  clearInterval() {},
  setTimeout(fn) { try { fn(); } catch (_) {} return 0; },
  clearTimeout() {},
  performance: { now: () => 0 },
  console,
  location: {
    href: 'https://brennyz.github.io/stickman-fighter/',
    hostname: 'brennyz.github.io',
    protocol: 'https:',
    search: '',
    pathname: '/stickman-fighter/',
    origin: 'https://brennyz.github.io',
  },
  navigator: { onLine: true, userAgent: 'Chrome', maxTouchPoints: 0, platform: 'Linux', vibrate() {} },
  localStorage: {
    store: {},
    getItem(k) { return this.store[k] ?? null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; },
  },
  sfTunnelBoot: Promise.resolve(),
  dispatchEvent() {},
  AudioContext: class {
    constructor() {
      this.state = 'running';
      this.destination = {};
      this.currentTime = 0;
      this.sampleRate = 44100;
    }
    createGain() {
      return { connect() { return this; }, gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} } };
    }
    createOscillator() {
      return {
        connect() { return this; }, start() {}, stop() {}, type: 'sine',
        frequency: { value: 440, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      };
    }
    createBuffer() { return { getChannelData: () => new Float32Array(8) }; }
    createBufferSource() { return { connect() { return this; }, start() {}, buffer: null }; }
    createBiquadFilter() { return { connect() { return this; }, type: '', frequency: { value: 0 } }; }
    resume() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
  },
};
ctx.window = ctx;
ctx.globalThis = ctx;
ctx.self = ctx;
ctx.webkitAudioContext = ctx.AudioContext;

try {
  vm.runInContext(code, vm.createContext(ctx), { filename: 'game.js' });
} catch (e) {
  console.error('SMOKE_FAIL', e.message);
  process.exit(1);
}

// const/let zitten niet op window — bewijs via side-effect na boot
Promise.resolve().then(() => {
  if (!ctx.__sfBooted) {
    console.error('SMOKE_FAIL bootGame did not run (__sfBooted unset)');
    process.exit(1);
  }
  const tFn = ctx.t;
  const set = ctx.setLang;
  if (typeof tFn !== 'function' || typeof set !== 'function') {
    console.error('SMOKE_FAIL t/setLang not in boot scope');
    process.exit(1);
  }
  set('en');
  if (tFn('menu.adventure') !== 'Adventure') {
    console.error('SMOKE_FAIL EN menu.adventure leftover', tFn('menu.adventure'));
    process.exit(1);
  }
  if (tFn('ui.weaponHead') !== 'Weapons' || /Wapens|Avontuur|Verzameld/.test(tFn('ui.weaponSummary', {
    unlocked: 1, total: 2, usable: 1, name: 'Fists', cap: 10,
  }))) {
    console.error('SMOKE_FAIL EN weapons chrome leftover Dutch', tFn('ui.weaponHead'), tFn('ui.weaponSummary', {
      unlocked: 1, total: 2, usable: 1, name: 'Fists', cap: 10,
    }));
    process.exit(1);
  }
  if (tFn('ui.summonPull') !== 'Open chest' || /kist|vandaag/i.test(tFn('ui.summonQuota', { left: 3, total: 10 }))) {
    console.error('SMOKE_FAIL EN summon chrome leftover Dutch');
    process.exit(1);
  }
  if (/Golf /.test(tFn('hud.levelWave', { n: 1, wv: 1, total: 3 }))) {
    console.error('SMOKE_FAIL EN HUD still Dutch Golf');
    process.exit(1);
  }
  set('de');
  if (tFn('menu.adventure') !== 'Abenteuer') {
    console.error('SMOKE_FAIL DE menu.adventure leftover', tFn('menu.adventure'));
    process.exit(1);
  }
  if (tFn('ui.weaponHead') !== 'Waffen' || /Wapens|Avontuur|Verzameld/.test(tFn('ui.weaponSummary', {
    unlocked: 1, total: 2, usable: 1, name: 'Fäuste', cap: 10,
  }))) {
    console.error('SMOKE_FAIL DE weapons chrome leftover Dutch');
    process.exit(1);
  }
  if (!/Heute/.test(tFn('ui.summonQuota', { left: 3, total: 10 })) || /Vandaag/.test(tFn('ui.summonQuota', { left: 3, total: 10 }))) {
    console.error('SMOKE_FAIL DE summon quota leftover Dutch', tFn('ui.summonQuota', { left: 3, total: 10 }));
    process.exit(1);
  }
  if (/Golf /.test(tFn('hud.levelWave', { n: 1, wv: 1, total: 3 })) || !/Welle/.test(tFn('hud.levelWave', { n: 1, wv: 1, total: 3 }))) {
    console.error('SMOKE_FAIL DE HUD not German', tFn('hud.levelWave', { n: 1, wv: 1, total: 3 }));
    process.exit(1);
  }
  set('nl');
  if (tFn('menu.adventure') !== 'Avontuur' || tFn('ui.weaponHead') !== 'Wapens') {
    console.error('SMOKE_FAIL NL chrome drifted', tFn('menu.adventure'), tFn('ui.weaponHead'));
    process.exit(1);
  }
  if (tFn('result.advLose') !== 'VERLOREN') {
    console.error('SMOKE_FAIL NL lose copy drifted', tFn('result.advLose'));
    process.exit(1);
  }

  function flatten(obj, prefix = '', out = {}) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return out;
    for (const [k, v] of Object.entries(obj)) {
      const p = prefix ? prefix + '.' + k : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, p, out);
      else if (typeof v === 'string') out[p] = v;
    }
    return out;
  }
  const CHROME_NS = ['ui', 'hud', 'combat', 'toast', 'missionsUi', 'menu', 'hub', 'settings', 'pause', 'result', 'banner', 'net', 'modes', 'common', 'back', 'pets', 'dex', 'egg'];
  const DUTCH_MARK = /(Avontuur|Verzameld|Collectie|Vandaag|Uitrusten|Overslaan|Instellingen|Missies|Monsterboek|Gooi &|Laatste modus|Verse versie|Spiraal Orb|Bliksemprik|Leegteblik|Eigen vechters|Terug naar menu|Getemd ·|Temmen:|Kies een eiland|Dagelijkse kist|Muur Slopen|Verder spelen|Dag-ei|Cosmetisch metgezel|Alle types|Alle biomen|Export bevat|Laatst opgeslagen|Nog niet uitgekomen|Nog niet verslagen|Gratis Pull|Gratis arcade|Verschijnt in avontuur)/;
  /** Retired Versus / 2P chrome — DE may omit; t() falls back to EN, never NL. */
  const RETIRED_VS = /^(menu\.versus|hub\.versus|hub\.fightersLocal|hub\.vsRecord|modes\.versus|pause\.vs|result\.vs|banner\.round|combat\.vs|toast\.char|hud\.(roundWinner|roundSkip|matchPoint|vsTot|vsFatality|p1Line|p2Line|hintDual|nextRound|spawnP1|spawnP2|spawnGrace|decisiveRound|timeHpWin|roundInfo))/;
  const I18N = ctx.__sfI18N || ctx.I18N;
  if (!I18N || !I18N.nl || !I18N.en || !I18N.de) {
    console.error('SMOKE_FAIL I18N tables missing after boot');
    process.exit(1);
  }
  const nl = flatten(I18N.nl);
  const en = flatten(I18N.en);
  const de = flatten(I18N.de);
  const chromeKeys = Object.keys(nl).filter((k) => CHROME_NS.some((n) => k === n || k.startsWith(n + '.')));
  const missEn = chromeKeys.filter((k) => en[k] == null);
  const missDe = chromeKeys.filter((k) => de[k] == null && !RETIRED_VS.test(k));
  const enDutch = chromeKeys.filter((k) => en[k] && DUTCH_MARK.test(en[k]));
  const deDutch = chromeKeys.filter((k) => de[k] && DUTCH_MARK.test(de[k]));
  if (missEn.length || missDe.length || enDutch.length || deDutch.length) {
    if (missEn.length) console.error('SMOKE_FAIL EN missing chrome keys', missEn.join(', '));
    if (missDe.length) console.error('SMOKE_FAIL DE missing chrome keys', missDe.join(', '));
    if (enDutch.length) console.error('SMOKE_FAIL EN leftover Dutch', enDutch.map((k) => k + '=' + en[k]).join(' | '));
    if (deDutch.length) console.error('SMOKE_FAIL DE leftover Dutch', deDutch.map((k) => k + '=' + de[k]).join(' | '));
    process.exit(1);
  }

  console.log('SMOKE_OK game.js loaded + bootGame + EN/DE/NL chrome');
}).catch((e) => {
  console.error('SMOKE_FAIL', e.message);
  process.exit(1);
});
