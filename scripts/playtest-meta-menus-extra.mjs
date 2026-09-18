#!/usr/bin/env node
/**
 * PLAYTEST BOT 8/9 extra pass — tablet 834×1194 + landscape 844×390.
 * Veteran save only. Draft findings. No Versus. No main.
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs/playtest-meta-390');
fs.mkdirSync(outDir, { recursive: true });

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome', '/usr/bin/chromium-browser']
  .find((p) => fs.existsSync(p));
if (!chrome) {
  console.error('PLAYTEST_FAIL no chrome');
  process.exit(1);
}

const VIEWS = [
  { id: 'tab834', width: 834, height: 1194, isMobile: true, isLandscape: false },
  { id: 'land844', width: 844, height: 390, isMobile: true, isLandscape: true },
];

async function getPuppeteer() {
  const tmp = '/tmp/sf-playtest-meta';
  fs.mkdirSync(tmp, { recursive: true });
  try { return await import('puppeteer-core'); } catch (_) {
    await new Promise((res, rej) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], { cwd: tmp, stdio: 'inherit' });
      p.on('exit', (c) => (c === 0 ? res() : rej(new Error('npm'))));
    });
    return import(path.join(tmp, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'));
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const HELPERS = `(() => {
  window.__ptBox = function (sel) {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!el) return null;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    return {
      id: el.id || '', y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
      bottom: Math.round(r.bottom), text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 120),
    };
  };
  window.__ptScan = function (rootSel) {
    const el = document.querySelector(rootSel);
    if (!el) return { missing: rootSel };
    const vh = window.innerHeight, vw = window.innerWidth;
    const overflow = [];
    el.querySelectorAll('button, h2, .subtitle, .hub-tile, .statbar').forEach((n) => {
      const st = getComputedStyle(n);
      if (st.display === 'none') return;
      const r = n.getBoundingClientRect();
      if (r.width < 2) return;
      if (r.left < -3 || r.right > vw + 3) overflow.push({ id: n.id || n.className, left: Math.round(r.left), right: Math.round(r.right) });
    });
    return {
      active: el.classList.contains('active'),
      scrollH: el.scrollHeight, clientH: el.clientH || el.clientHeight, vh, vw,
      scrollNeed: el.scrollHeight > vh + 8,
      overflow,
      vs: !!document.querySelector('[data-hub="versus"]'),
    };
  };
})();`;

async function seedVeteran(page) {
  return page.evaluate(() => {
    save.feltFirstPunch = true;
    save.lang = 'nl';
    save.lvl = 18;
    save.unlocked = 18;
    save.petCoins = 640;
    save.createdAt = Date.now() - 90 * 86400000;
    save.stats = Object.assign({}, save.stats || {}, { advWins: 14, kills: 420, petsTamed: 3 });
    save.pets = { pet_slymo: { at: Date.now() }, pet_bubbel: { at: Date.now() }, pet_flapper: { at: Date.now() } };
    save.activePet = 'pet_slymo';
    save.dex = { slymo: 40, bubbel: 12, flapper: 6 };
    if (typeof GEAR_ITEMS !== 'undefined' && typeof gearGrantItem === 'function') {
      GEAR_ITEMS.slice(0, 48).forEach((it) => { try { gearGrantItem(it.id, 'playtest'); } catch (_) {} });
    }
    save.buildings = { schema: 1, factories: {
      stick_lighter: { level: 3, lastTickAt: Date.now() - 90 * 60 * 1000, stored: 18 },
      woodchip_glue: { level: 2, lastTickAt: Date.now() - 40 * 60 * 1000, stored: 6 },
    }, wallet: { spark: 24, glue: 8, chip: 3, steam: 0, echo: 0 } };
    try { persist(); } catch (_) {}
    const fomo = document.getElementById('fomoRitual');
    if (fomo) { fomo.hidden = true; fomo.setAttribute('hidden', ''); }
    const splash = document.getElementById('sfSplash');
    if (splash) { try { splash.remove(); } catch (_) {} }
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    const menu = document.getElementById('menuScreen');
    if (menu) menu.classList.add('active');
    if (UI && UI.renderMenu) try { UI.renderMenu(); } catch (_) {}
    return { ok: true, vw: innerWidth, vh: innerHeight };
  });
}

async function snap(page, name) {
  const file = path.join(outDir, name + '.png');
  await page.screenshot({ path: file, fullPage: false });
  return path.relative(root, file);
}

async function runView(browser, view) {
  const page = await browser.newPage();
  await page.setViewport({
    width: view.width, height: view.height, isMobile: view.isMobile,
    hasTouch: true, isLandscape: view.isLandscape, deviceScaleFactor: 2,
  });
  await page.goto(smokeBaseUrl(8787) + '?nosplash=1&sfplaytest=1', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__sfBooted && typeof UI !== 'undefined', { timeout: 45000 });
  await page.addScriptTag({ content: HELPERS });
  const seed = await seedVeteran(page);
  const prefix = view.id + '-vet';
  const out = { view, seed, shots: {}, screens: {}, version: await page.evaluate(() => ({
    app: APP_VERSION, sw: SW_CACHE_REV, versus: !!document.querySelector('[data-hub="versus"]'),
  })) };

  out.shots.home = await snap(page, prefix + '-00-home');
  out.screens.home = await page.evaluate(() => {
    const tiles = ['btnBuildings', 'btnGearHome', 'btnPetsHome', 'btnSummons'].map((id) => {
      const b = window.__ptBox('#' + id);
      return { id, y: b && b.y, h: b && b.h, text: b && b.text };
    });
    return { scan: window.__ptScan('#menuScreen'), tiles };
  });

  await page.evaluate(() => UI.openBuildings());
  await page.waitForFunction(() => document.getElementById('buildingsScreen')?.classList.contains('active'));
  out.shots.factories = await snap(page, prefix + '-10-factories');
  out.screens.factories = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#buildingsList .buildings-card')].filter((el) => getComputedStyle(el).display !== 'none');
    const first = cards[0];
    if (first) first.click();
    return {
      scan: window.__ptScan('#buildingsScreen'),
      wallet: window.__ptBox('#buildingsWallet'),
      cardN: cards.length,
      first: first && (first.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 100),
    };
  });
  await delay(100);
  out.shots.factoriesDetail = await snap(page, prefix + '-11-factories-detail');
  out.screens.factories.detail = await page.evaluate(() => {
    if (UI.buildingsShowUpgradeStep) UI.buildingsShowUpgradeStep();
    return {
      scan: window.__ptScan('#buildingsScreen'),
      name: document.querySelector('#buildingsDetail .buildings-detail-name')?.innerText || '',
      upgrade: window.__ptBox('#btnBuildingUpgrade'),
    };
  });
  await delay(60);
  out.shots.factoriesSheet = await snap(page, prefix + '-12-factories-sheet');
  out.screens.factories.sheet = await page.evaluate(() => {
    const sheet = document.getElementById('buildingsUpgradeSheet');
    const panel = sheet && sheet.querySelector('.buildings-sheet-panel');
    const r = panel && panel.getBoundingClientRect();
    return {
      open: !!(sheet && !sheet.hidden),
      panel: window.__ptBox(panel),
      overflow: !!(r && (r.left < -2 || r.right > innerWidth + 2 || r.bottom > innerHeight + 12)),
    };
  });

  await page.evaluate(() => UI.safeOpen('gearScreen', () => UI.renderGear()));
  await page.waitForFunction(() => document.getElementById('gearScreen')?.classList.contains('active'));
  out.shots.gear = await snap(page, prefix + '-20-gear');
  out.screens.gear = await page.evaluate(() => {
    const slots = [...document.querySelectorAll('#gearSlotList [data-slot]')].map((el) => ({
      slot: el.getAttribute('data-slot'), y: Math.round(el.getBoundingClientRect().top),
    }));
    const first = document.querySelector('#gearSlotList [data-slot]');
    if (first) first.click();
    return {
      scan: window.__ptScan('#gearScreen'),
      doll: window.__ptBox('#gearDollCanvas'),
      tools: window.__ptBox('#gearSheetTools'),
      slots,
      layout: getComputedStyle(document.getElementById('gearLayout') || document.body).gridTemplateColumns,
    };
  });
  await delay(120);
  out.shots.gearSlot = await snap(page, prefix + '-21-gear-slot');
  out.screens.gear.after = await page.evaluate(() => {
    const picker = document.getElementById('gearPicker');
    return {
      scan: window.__ptScan('#gearScreen'),
      rows: picker ? picker.children.length : 0,
      pickerH: picker ? Math.round(picker.getBoundingClientRect().height) : 0,
      count: document.getElementById('gearFilterCount')?.innerText || '',
    };
  });

  await page.evaluate(() => UI.openPets());
  await page.waitForFunction(() => document.getElementById('petScreen')?.classList.contains('active'));
  out.shots.pets = await snap(page, prefix + '-30-pets');
  out.screens.pets = await page.evaluate(() => {
    const first = document.querySelector('#petList .card, #petList [data-pet-id]');
    const cards = [...document.querySelectorAll('#petList .card, #petList [data-pet-id]')];
    const vis = cards.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight - 8 && getComputedStyle(el).display !== 'none';
    }).length;
    if (first) first.click();
    return {
      scan: window.__ptScan('#petScreen'),
      wallet: window.__ptBox('#petsWallet'),
      hero: window.__ptBox('#petsHero'),
      next: window.__ptBox('#petsNext'),
      crack: window.__ptBox('#eggCrackBtn'),
      tabs: window.__ptBox('#petTabBar'),
      cards: cards.length,
      cardsOnFold: vis,
      firstCardY: first ? Math.round(first.getBoundingClientRect().top) : null,
    };
  });
  await delay(100);
  out.shots.petsDetail = await snap(page, prefix + '-31-pets-detail');
  out.screens.pets.detail = await page.evaluate(() => {
    const cta = document.querySelector('#petDetail .pets-cta, #petDetail button.btn');
    return {
      scan: window.__ptScan('#petScreen'),
      cta: window.__ptBox(cta),
      text: (document.getElementById('petDetail')?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 160),
    };
  });

  await page.evaluate(() => UI.openSummonHub());
  await page.waitForFunction(() => document.getElementById('summonScreen')?.classList.contains('active'));
  out.shots.summons = await snap(page, prefix + '-40-summons');
  out.screens.summons = await page.evaluate(() => {
    const stage = window.__ptBox('#summonStage');
    const cta = window.__ptBox('#btnChestPull');
    return {
      scan: window.__ptScan('#summonScreen'),
      stage, cta,
      quota: document.getElementById('summonQuota')?.innerText || '',
      ctaBelow: !!(cta && cta.y > innerHeight - 20),
      ratio: stage && cta ? Math.round(stage.h / Math.max(1, cta.h) * 10) / 10 : null,
    };
  });
  const p0 = Date.now();
  await page.evaluate(() => { const b = document.getElementById('btnChestPull'); if (b && !b.disabled) b.click(); });
  await delay(1600);
  out.screens.summons.pull = { pullMs: Date.now() - p0 };
  out.shots.summonsPull = await snap(page, prefix + '-41-summons-pull');
  out.screens.summons.pull.after = await page.evaluate(() => ({
    quota: document.getElementById('summonQuota')?.innerText || '',
    card: window.__ptBox('#summonCenterCard'),
    log: (document.getElementById('summonLog')?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80),
  }));

  await page.close();
  return out;
}

async function run() {
  let server = null;
  try { server = await ensureSmokeServer(8787); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=834,1194'],
  });
  const extra = { at: new Date().toISOString(), build: 'c9a29fc v1.18.190 SW400', versus: 'retired', views: {} };
  try {
    for (const view of VIEWS) extra.views[view.id] = await runView(browser, view);
  } finally {
    await browser.close();
    if (server && typeof server.close === 'function') server.close();
  }
  const jsonPath = path.join(outDir, 'extra-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(extra, null, 2));
  const brief = {};
  for (const [k, v] of Object.entries(extra.views)) {
    brief[k] = {
      vw: v.seed.vw, vh: v.seed.vh, versus: v.version.versus,
      gearScroll: v.screens.gear?.scan?.scrollH,
      gearLayout: v.screens.gear?.layout,
      petsFold: v.screens.pets?.cardsOnFold,
      petsFirstY: v.screens.pets?.firstCardY,
      petsCtaY: v.screens.pets?.detail?.cta?.y,
      factOverflow: v.screens.factories?.scan?.overflow?.length,
      sheetOverflow: v.screens.factories?.sheet?.overflow,
      summonCtaBelow: v.screens.summons?.ctaBelow,
      summonRatio: v.screens.summons?.ratio,
      pullMs: v.screens.summons?.pull?.pullMs,
    };
  }
  console.log('PLAYTEST_OK extra →', path.relative(root, jsonPath));
  console.log(JSON.stringify(brief, null, 2));
}

run().catch((err) => {
  console.error('PLAYTEST_FAIL', err);
  process.exit(1);
});
