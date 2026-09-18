#!/usr/bin/env node
/**
 * PLAYTEST BOT 8/9 — META MENUS at 390×844 (LIVE v1.18.190 / SW 400).
 * Draft findings harness. Does not fail CI. Writes JSON + screenshots.
 * No Versus. No main.
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

const PAGE_HELPERS = `(() => {
  window.__ptQuietHome = function () {
    const fomo = document.getElementById('fomoRitual');
    if (fomo) { fomo.hidden = true; fomo.setAttribute('hidden', ''); }
    const splash = document.getElementById('sfSplash');
    if (splash) {
      splash.classList.add('is-done');
      splash.setAttribute('hidden', '');
      try { splash.remove(); } catch (_) {}
    }
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    const menu = document.getElementById('menuScreen');
    if (menu) menu.classList.add('active');
    if (typeof UI === 'object' && UI && typeof UI.renderMenu === 'function') {
      try { UI.renderMenu(); } catch (_) {}
    }
  };
  window.__ptBox = function (sel) {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!el) return null;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    return {
      id: el.id || '',
      cls: String(el.className || '').slice(0, 80),
      x: Math.round(r.left),
      y: Math.round(r.top),
      w: Math.round(r.width),
      h: Math.round(r.height),
      right: Math.round(r.right),
      bottom: Math.round(r.bottom),
      overflowX: el.scrollWidth - el.clientWidth > 2,
      overflowY: el.scrollHeight - el.clientHeight > 2,
      text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 140),
      tapOk: r.width >= 44 && r.height >= 40,
    };
  };
  window.__ptScan = function (rootSel) {
    const rootEl = document.querySelector(rootSel);
    if (!rootEl) return { missing: rootSel };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const overflow = [];
    const textClip = [];
    const smallTap = [];
    const nodes = rootEl.querySelectorAll('button, a, h2, h3, .subtitle, .hub-tile, [role="list"] > *, .statbar, .back-btn');
    nodes.forEach((el) => {
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      if (r.left < -3 || r.right > vw + 3) {
        overflow.push({
          id: el.id || el.className,
          left: Math.round(r.left),
          right: Math.round(r.right),
          text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
        });
      }
      if (el.scrollWidth > el.clientWidth + 3 && r.width > 20) {
        textClip.push({
          id: el.id || el.className,
          scroll: el.scrollWidth,
          client: el.clientWidth,
          text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
        });
      }
      if ((el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') && (r.width < 40 || r.height < 36)) {
        smallTap.push({
          id: el.id || el.className,
          w: Math.round(r.width),
          h: Math.round(r.height),
          text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 60),
        });
      }
    });
    return {
      active: rootEl.classList.contains('active'),
      scrollH: rootEl.scrollHeight,
      clientH: rootEl.clientHeight,
      scrollNeed: rootEl.scrollHeight > vh + 8,
      overflow,
      textClip: textClip.slice(0, 12),
      smallTap: smallTap.slice(0, 12),
      vsTile: !!document.querySelector('[data-hub="versus"]'),
    };
  };
})();`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedSave(page, mode) {
  return page.evaluate((mode) => {
    if (typeof save !== 'object' || !save) return { ok: false, why: 'no save' };
    save.feltFirstPunch = true;
    save.lang = 'nl';
    save.tipsSeen = save.tipsSeen || {};
    save.tipsSeen.summonChest = true;
    if (mode === 'fresh') {
      save.lvl = 1;
      save.unlocked = 1;
      save.petCoins = 0;
      save.stats = save.stats || {};
      save.stats.advWins = 0;
      save.stats.kills = 0;
      save.pets = {};
      save.activePet = null;
      save.dex = {};
    } else {
      save.lvl = 18;
      save.unlocked = 7;
      save.petCoins = 640;
      save.createdAt = Date.now() - 90 * 86400000;
      save.stats = save.stats || {};
      save.stats.advWins = 14;
      save.stats.kills = 420;
      save.stats.petsTamed = 3;
      save.pets = {
        pet_slymo: { at: Date.now(), coins: 0 },
        pet_bubbel: { at: Date.now(), coins: 40 },
        pet_flapper: { at: Date.now(), coins: 40 },
      };
      save.activePet = 'pet_slymo';
      save.dex = { slymo: 40, bubbel: 12, flapper: 6, stekelra: 3 };
      if (typeof GEAR_ITEMS !== 'undefined' && typeof gearGrantItem === 'function') {
        GEAR_ITEMS.slice(0, 48).forEach((it) => {
          try { gearGrantItem(it.id, 'playtest'); } catch (_) {}
        });
      }
      save.buildings = save.buildings || { schema: 1, factories: {}, wallet: {} };
      save.buildings.factories = {
        stick_lighter: { level: 3, lastTickAt: Date.now() - 90 * 60 * 1000, stored: 18 },
        woodchip_glue: { level: 2, lastTickAt: Date.now() - 40 * 60 * 1000, stored: 6 },
        chipping_wood: { level: 1, lastTickAt: Date.now() - 10 * 60 * 1000, stored: 2 },
        bamboo_boesa: { level: 0, lastTickAt: 0, stored: 0 },
        echo_whistle: { level: 0, lastTickAt: 0, stored: 0 },
      };
      save.buildings.wallet = { spark: 24, glue: 8, chip: 3, steam: 0, echo: 0 };
    }
    try { persist(); } catch (_) {}
    return {
      ok: true,
      mode,
      lvl: save.lvl,
      pc: save.petCoins,
      pets: Object.keys(save.pets || {}).length,
      gear: save.gear && save.gear.owned ? Object.keys(save.gear.owned).length : 0,
    };
  }, mode);
}

async function shot(page, name) {
  const file = path.join(outDir, name + '.png');
  await page.screenshot({ path: file, fullPage: false });
  return path.relative(root, file);
}

async function runMode(browser, mode) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(smokeBaseUrl(8787) + '?nosplash=1&sfplaytest=1', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__sfBooted && typeof UI !== 'undefined', { timeout: 45000 });
  await page.addScriptTag({ content: PAGE_HELPERS });
  const seed = await seedSave(page, mode);
  await page.evaluate(() => window.__ptQuietHome());

  const report = {
    mode,
    seed,
    version: await page.evaluate(() => ({
      app: typeof APP_VERSION !== 'undefined' ? APP_VERSION : null,
      sw: typeof SW_CACHE_REV !== 'undefined' ? SW_CACHE_REV : null,
      versus: !!document.querySelector('[data-hub="versus"]'),
    })),
    shots: {},
    screens: {},
  };

  report.shots.home = await shot(page, mode + '-00-home');
  report.screens.home = await page.evaluate(() => {
    const tiles = ['btnBuildings', 'btnGearHome', 'btnPetsHome', 'btnSummons'].map((id) => {
      const el = document.getElementById(id);
      return { id, box: window.__ptBox(el), text: el ? (el.innerText || '').replace(/\s+/g, ' ').trim() : null };
    });
    return { scan: window.__ptScan('#menuScreen'), tiles };
  });

  // ——— FACTORIES ———
  const t0 = Date.now();
  await page.evaluate(() => UI.openBuildings());
  await page.waitForFunction(() => document.getElementById('buildingsScreen')?.classList.contains('active'), { timeout: 8000 });
  const factoriesOpenMs = Date.now() - t0;
  report.shots.factoriesList = await shot(page, mode + '-10-factories-list');
  report.screens.factories = await page.evaluate((factoriesOpenMs) => {
    const cards = [...document.querySelectorAll('#buildingsList .buildings-card, #buildingsList .buildings-row, #buildingsList [data-factory-id]')]
      .filter((el) => getComputedStyle(el).display !== 'none')
      .map((el) => ({
        id: el.getAttribute('data-factory-id'),
        box: window.__ptBox(el),
        name: (el.querySelector('.buildings-card-name, .hub-tile-title') || el).innerText.replace(/\s+/g, ' ').trim().slice(0, 80),
        does: (el.querySelector('.buildings-card-does') || {}).innerText || '',
      }));
    const first = document.querySelector('#buildingsList .buildings-card, #buildingsList [data-factory-id]');
    if (first) first.click();
    return {
      openMs: factoriesOpenMs,
      scan: window.__ptScan('#buildingsScreen'),
      wallet: window.__ptBox('#buildingsWallet'),
      back: window.__ptBox('#buildingsScreen .back-btn'),
      cards,
      pane: document.getElementById('buildingsScreen')?.getAttribute('data-buildings-pane'),
    };
  }, factoriesOpenMs);
  await delay(120);
  if (await page.evaluate(() => document.getElementById('buildingsScreen')?.getAttribute('data-buildings-pane') === 'detail')) {
    report.shots.factoriesDetail = await shot(page, mode + '-11-factories-detail');
    report.screens.factories.detail = await page.evaluate(() => {
      const out = {
        scan: window.__ptScan('#buildingsScreen'),
        name: document.querySelector('#buildingsDetail .buildings-detail-name')?.innerText || '',
        blurb: document.querySelector('#buildingsDetail .buildings-detail-blurb')?.innerText || '',
        powers: [...document.querySelectorAll('#buildingsDetail .buildings-power')].map((el) => el.innerText.replace(/\s+/g, ' ').trim().slice(0, 120)),
        collect: window.__ptBox('[data-buildings-collect]'),
        upgrade: window.__ptBox('#buildingsDetail .buildings-cta, [data-buildings-upgrade]'),
      };
      if (typeof UI.buildingsShowUpgradeStep === 'function') UI.buildingsShowUpgradeStep();
      return out;
    });
    await delay(80);
    report.shots.factoriesSheet = await shot(page, mode + '-12-factories-sheet');
    report.screens.factories.sheet = await page.evaluate(() => {
      const sheet = document.getElementById('buildingsUpgradeSheet');
      const panel = sheet && sheet.querySelector('.buildings-sheet-panel, .buildings-sheet');
      const r = panel && panel.getBoundingClientRect();
      return {
        open: !!(sheet && !sheet.hidden),
        panel: window.__ptBox(panel || sheet),
        overflow: !!(r && (r.left < -2 || r.right > window.innerWidth + 2 || r.bottom > window.innerHeight + 8)),
        text: (sheet && sheet.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 240),
      };
    });
    await page.evaluate(() => { if (UI.buildingsShowList) UI.buildingsShowList(); });
  }

  // ——— GEAR ———
  const g0 = Date.now();
  await page.evaluate(() => {
    if (UI.safeOpen) UI.safeOpen('gearScreen', () => UI.renderGear());
    else UI.openGear && UI.openGear();
  });
  await page.waitForFunction(() => document.getElementById('gearScreen')?.classList.contains('active'), { timeout: 8000 });
  const gearOpenMs = Date.now() - g0;
  report.shots.gear = await shot(page, mode + '-20-gear');
  report.screens.gear = await page.evaluate((gearOpenMs) => {
    const slots = [...document.querySelectorAll('#gearSlotList [data-slot], #gearSlotList .gear-slot-card')].map((el) => ({
      slot: el.getAttribute('data-slot'),
      box: window.__ptBox(el),
      text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80),
    }));
    const picker = document.getElementById('gearPicker');
    const chips = [...document.querySelectorAll('#gearFilterBar button, #gearFilterBar .chip, #gearRarityBar button')].map((el) => ({
      text: (el.innerText || '').replace(/\s+/g, ' ').trim(),
      box: window.__ptBox(el),
    }));
    const firstSlot = document.querySelector('#gearSlotList [data-slot], #gearSlotList button, #gearSlotList .gear-slot-card');
    if (firstSlot) firstSlot.click();
    return {
      openMs: gearOpenMs,
      scan: window.__ptScan('#gearScreen'),
      doll: window.__ptBox('#gearDollCanvas'),
      hunt: window.__ptBox('#gearHuntCta'),
      unequip: window.__ptBox('#gearUnequipAll'),
      slots,
      chips,
      pickerRows: picker ? picker.children.length : 0,
      pickerH: picker ? Math.round(picker.getBoundingClientRect().height) : 0,
      filterDock: !!document.getElementById('gearFilterDock'),
      sheetTools: window.__ptBox('#gearSheetTools'),
      primaryBelowFold: (() => {
        const slot = firstSlot && firstSlot.getBoundingClientRect();
        return !!(slot && slot.top > window.innerHeight - 80);
      })(),
    };
  }, gearOpenMs);
  await delay(160);
  report.shots.gearSlot = await shot(page, mode + '-21-gear-slot');
  report.screens.gear.afterSlot = await page.evaluate(() => {
    const picker = document.getElementById('gearPicker');
    const rows = picker ? [...picker.children].slice(0, 8).map((el) => ({
      text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 90),
      h: Math.round(el.getBoundingClientRect().height),
      tapOk: el.getBoundingClientRect().height >= 40,
    })) : [];
    const t0 = performance.now();
    if (typeof UI.renderGear === 'function') UI.renderGear();
    const renderMs = Math.round(performance.now() - t0);
    return {
      scan: window.__ptScan('#gearScreen'),
      pickerRows: picker ? picker.children.length : 0,
      rows,
      renderMs,
      hint: document.getElementById('gearSheetHint')?.innerText || '',
      count: document.getElementById('gearFilterCount')?.innerText || '',
      huntCopy: document.getElementById('gearHuntCopy')?.innerText || '',
    };
  });

  // ——— PETS ———
  const p0 = Date.now();
  await page.evaluate(() => {
    if (UI.openPets) UI.openPets();
    else if (UI.safeOpen) UI.safeOpen('petScreen', () => UI.renderPets());
  });
  await page.waitForFunction(() => document.getElementById('petScreen')?.classList.contains('active'), { timeout: 8000 });
  const petsOpenMs = Date.now() - p0;
  report.shots.pets = await shot(page, mode + '-30-pets');
  report.screens.pets = await page.evaluate((petsOpenMs) => {
    const cards = [...document.querySelectorAll('#petList .card, #petList [data-pet-id], #petList [role="listitem"]')]
      .filter((el) => getComputedStyle(el).display !== 'none')
      .map((el) => ({
        id: el.getAttribute('data-pet-id') || el.getAttribute('data-id'),
        box: window.__ptBox(el),
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 100),
      }));
    const first = document.querySelector('#petList .card, #petList [data-pet-id]');
    if (first) first.click();
    return {
      openMs: petsOpenMs,
      scan: window.__ptScan('#petScreen'),
      wallet: window.__ptBox('#petsWallet'),
      hero: window.__ptBox('#petsHero'),
      next: window.__ptBox('#petsNext'),
      crack: window.__ptBox('#eggCrackBtn'),
      tabs: window.__ptBox('#petTabBar'),
      filters: window.__ptBox('#petFilterBar'),
      cards: cards.slice(0, 8),
      cardCount: cards.length,
      pane: document.getElementById('petScreen')?.getAttribute('data-pets-pane'),
    };
  }, petsOpenMs);
  await delay(140);
  if (await page.evaluate(() => document.getElementById('petScreen')?.getAttribute('data-pets-pane') === 'detail'
    || document.querySelector('#petDetail')?.innerText)) {
    report.shots.petsDetail = await shot(page, mode + '-31-pets-detail');
    report.screens.pets.detail = await page.evaluate(() => ({
      scan: window.__ptScan('#petScreen'),
      text: (document.getElementById('petDetail')?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 280),
      cta: [...document.querySelectorAll('#petDetail button')].map((el) => ({
        text: el.innerText.replace(/\s+/g, ' ').trim(),
        box: window.__ptBox(el),
      })),
    }));
  }

  // ——— SUMMONS ———
  const s0 = Date.now();
  await page.evaluate(() => UI.openSummonHub());
  await page.waitForFunction(() => document.getElementById('summonScreen')?.classList.contains('active'), { timeout: 8000 });
  const summonOpenMs = Date.now() - s0;
  report.shots.summons = await shot(page, mode + '-40-summons');
  report.screens.summons = await page.evaluate((summonOpenMs) => {
    const stage = document.getElementById('summonStage');
    const cta = document.getElementById('btnChestPull');
    const sr = stage && stage.getBoundingClientRect();
    const cr = cta && cta.getBoundingClientRect();
    return {
      openMs: summonOpenMs,
      scan: window.__ptScan('#summonScreen'),
      stage: window.__ptBox(stage),
      cta: window.__ptBox(cta),
      cancel: window.__ptBox('#btnSummonCancel'),
      gotoW: window.__ptBox('#btnSummonGotoWeapons'),
      gotoP: window.__ptBox('#btnSummonGotoPets'),
      quota: document.getElementById('summonQuota')?.innerText || '',
      odds: document.getElementById('summonOdds')?.innerText || '',
      where: document.getElementById('summonWhereStrip')?.innerText || '',
      whereHidden: (() => {
        const el = document.getElementById('summonWhereStrip');
        if (!el) return true;
        const st = getComputedStyle(el);
        return st.display === 'none' || el.hidden || el.getAttribute('aria-hidden') === 'true';
      })(),
      stageVsCta: sr && cr ? Math.round(sr.height / Math.max(1, cr.height) * 10) / 10 : null,
      ctaBelowFold: !!(cr && cr.top > window.innerHeight - 24),
      videoSrc: document.getElementById('summonVideo')?.getAttribute('data-src') || '',
    };
  }, summonOpenMs);

  if (mode === 'veteran') {
    const pullT0 = Date.now();
    await page.evaluate(() => {
      const btn = document.getElementById('btnChestPull');
      if (btn && !btn.disabled) btn.click();
    });
    await delay(2200);
    const pullMs = Date.now() - pullT0;
    report.shots.summonsPull = await shot(page, mode + '-41-summons-pull');
    report.screens.summons.pull = await page.evaluate((pullMs) => {
      const screen = document.getElementById('summonScreen');
      const card = document.getElementById('summonCenterCard');
      const st = card && getComputedStyle(card);
      return {
        pullMs,
        pulling: !!(screen && screen.classList.contains('is-pulling')),
        cardShow: !!(card && st && st.display !== 'none' && Number(st.opacity) > 0.2),
        card: window.__ptBox(card),
        skip: document.getElementById('summonSkipHint')?.innerText || '',
        reveal: document.getElementById('summonRevealText')?.innerText || '',
      };
    }, pullMs);
  }

  if (mode === 'fresh') {
    await page.evaluate(() => {
      if (typeof chestSummonsLeft === 'function' && typeof save === 'object') {
        save.chestDaily = { dateKey: (typeof todayKey === 'function' ? todayKey() : ''), used: 10, log: [] };
        try { persist(); } catch (_) {}
        if (UI.renderSummon) UI.renderSummon();
      }
    });
    await delay(80);
    report.shots.summonsEmpty = await shot(page, mode + '-42-summons-empty');
    report.screens.summons.empty = await page.evaluate(() => ({
      quota: document.getElementById('summonQuota')?.innerText || '',
      cta: window.__ptBox('#btnChestPull'),
      ctaText: document.getElementById('btnChestPull')?.innerText.replace(/\s+/g, ' ').trim() || '',
      disabled: !!document.getElementById('btnChestPull')?.disabled,
      hint: document.getElementById('summonRevealText')?.innerText || '',
    }));
  }

  await page.close();
  return report;
}

async function run() {
  let server = null;
  try { server = await ensureSmokeServer(8787); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=390,844'],
  });
  const out = {
    at: new Date().toISOString(),
    build: 'c9a29fc v1.18.190 SW400',
    viewport: '390x844',
    versus: 'retired',
    modes: {},
  };
  try {
    out.modes.fresh = await runMode(browser, 'fresh');
    out.modes.veteran = await runMode(browser, 'veteran');
  } finally {
    await browser.close();
    if (server && typeof server.close === 'function') server.close();
  }
  const jsonPath = path.join(outDir, 'report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2));
  console.log('PLAYTEST_OK meta-menus-390 →', path.relative(root, jsonPath));
  console.log(JSON.stringify({
    version: out.modes.fresh.version,
    factoriesOpen: out.modes.fresh.screens.factories?.openMs,
    gearOpen: out.modes.fresh.screens.gear?.openMs,
    petsOpen: out.modes.fresh.screens.pets?.openMs,
    summonOpen: out.modes.fresh.screens.summons?.openMs,
    summonPull: out.modes.veteran.screens.summons?.pull?.pullMs,
    gearRows: out.modes.veteran.screens.gear?.afterSlot?.pickerRows,
    versus: out.modes.fresh.version.versus,
  }, null, 2));
}

run().catch((err) => {
  console.error('PLAYTEST_FAIL', err);
  process.exit(1);
});
