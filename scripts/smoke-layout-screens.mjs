#!/usr/bin/env node
/**
 * Layout lane: HOME / Collectie / factories / gear / summons / pets
 * must not stack texts/buttons, keep sticky wallets under back, honor
 * safe-area tokens, and stay inside ~390px + desktop. No Versus.
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'src/core/storage.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

must(/--z-back:/.test(css) && /--z-sticky:/.test(css) && /--z-sheet:/.test(css),
  'missing layout z-index tokens');
must(/--z-fomo:/.test(css) && /--z-toast:/.test(css), 'missing FOMO/toast z tokens (EX-021)');
must(/#menuScreen\.is-fomo/.test(css) && /_syncFomoHubLock/.test(fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8')),
  'FOMO hub lock (is-fomo + _syncFomoHubLock) missing');
must(/\.hub-tile-featured::before[\s\S]{0,180}right:\s*36px/.test(css),
  'featured hub badge must sit left of the › column');
must(/\.settings-home-tile[\s\S]{0,160}minmax\(0,\s*1fr\)/.test(css),
  'settings home tile must shrink columns on narrow rails');
must(/\.style-card-tip[\s\S]{0,80}-webkit-line-clamp:\s*3/.test(css),
  'style card copy must clamp instead of overflowing');
must(/EX-021/.test(css), 'EX-021 FOMO overlay contract missing from CSS');
must(/id="resCtaDock"/.test(html) && /result-cta-primary/.test(css) && /min-height:\s*84px/.test(css),
  'result Flappy retry dock / 84px primary missing');
must(/RESULT_SHOW_LOSE_MS = 700/.test(fs.readFileSync(path.join(root, 'src/systems/missions.js'), 'utf8')),
  'lose result delay must be 700ms (<3s)');
must(/sticky-under-back\) \+ 54px/.test(css), 'toast must sit under factory/settings titles');
must(/orientation: landscape\) and \(max-height: 420px\)/.test(css),
  'landscape 844×390 hub breakpoint missing');
must(!/data-hub="versus"/.test(html), 'versus hub tile must stay retired');
must(/--sticky-under-back:/.test(css), 'missing --sticky-under-back token');
must(/\.hub-tile \{[\s\S]*?overflow:\s*hidden/.test(css), 'hub tiles must clip overflow');
must(/-webkit-line-clamp:\s*2/.test(css), 'hub tile titles/subs must clamp');
must(/#buildingsScreen \.buildings-wallet[\s\S]{0,220}var\(--sticky-under-back\)/.test(css)
  || /#buildingsWallet\.buildings-wallet[\s\S]{0,180}var\(--sticky-under-back\)/.test(css),
  'factory wallet must stick under the back button');
must(/#buildingsUpgradeSheet[\s\S]{0,160}var\(--z-sheet\)/.test(css),
  'factory upgrade sheet must use --z-sheet');
must(/gear-filter-dock/.test(css) && /id="gearFilterDock"/.test(html),
  'gear filter dock wrapper required so chips do not stack at the same sticky top');
must(/#petTabBar[\s\S]{0,180}var\(--sticky-under-back\)/.test(css),
  'pets tabs must stick under back');
must(!/data-hub="versus"/.test(html), 'versus hub tile must stay retired');
must(/id="menuScreen"/.test(html) && /id="modeHubScreen"/.test(html), 'HOME + Collectie hubs missing');
must(/id="buildingsScreen"/.test(html) && /id="gearScreen"/.test(html), 'factories/gear screens missing');
must(/id="summonScreen"/.test(html) && /id="petScreen"/.test(html), 'summons/pets screens missing');
must(/id="buildingsWallet"/.test(html), 'sticky factory wallet missing');
must(/id="buildingsUpgradeSheet"/.test(html), 'factory sheet missing');
must(!/\.screen\s*\{\s*display:\s*none\s*!important/.test(css), 'nuclear .screen hide forbidden');
must(/@media \(max-width: 420px\)/.test(css), 'phone ~390 layout breakpoint missing');
must(/@media \(min-width: 860px\)/.test(css), 'desktop gear/factory layout breakpoint missing');

const rev = storage.match(/SW_CACHE_REV\s*=\s*(\d+)/);
const cache = sw.match(/stickfighter-app-v(\d+)/);
must(rev && cache && rev[1] === cache[1], `SW mismatch storage=${rev && rev[1]} sw=${cache && cache[1]}`);

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) {
  console.log('SMOKE_OK layout-screens (static only, no chrome)');
  process.exit(0);
}

const outDir = '/tmp/sf-layout-ui';
fs.mkdirSync(outDir, { recursive: true });

async function getPuppeteer() {
  try { return await import('puppeteer-core'); } catch (_) {
    await new Promise((res, rej) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], { cwd: outDir, stdio: 'inherit' });
      p.on('exit', (c) => (c === 0 ? res() : rej(new Error('npm'))));
    });
    return import(path.join(outDir, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'));
  }
}

function overlapPairs(page, selectors) {
  return page.evaluate((sels) => {
    const hits = [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const visBox = (el) => {
      let r = el.getBoundingClientRect();
      let clip = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      let p = el.parentElement;
      while (p && p !== document.body) {
        const st = getComputedStyle(p);
        if (/(auto|scroll|hidden)/.test((st.overflow || '') + (st.overflowY || '') + (st.overflowX || ''))) {
          const pr = p.getBoundingClientRect();
          clip = {
            left: Math.max(clip.left, pr.left),
            right: Math.min(clip.right, pr.right),
            top: Math.max(clip.top, pr.top),
            bottom: Math.min(clip.bottom, pr.bottom),
          };
        }
        p = p.parentElement;
      }
      clip.left = Math.max(clip.left, 0);
      clip.top = Math.max(clip.top, 0);
      clip.right = Math.min(clip.right, vw);
      clip.bottom = Math.min(clip.bottom, window.innerHeight);
      if (clip.right - clip.left < 2 || clip.bottom - clip.top < 2) return null;
      return clip;
    };
    const nodes = [];
    for (const sel of sels) {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.hidden || el.getAttribute('aria-hidden') === 'true') return;
        const st = getComputedStyle(el);
        if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return;
        const r = visBox(el);
        if (!r) return;
        nodes.push({ sel, el, r });
      });
    }
    const overflow = nodes.filter(({ r }) => r.left < -2 || r.right > vw + 2).map(({ sel, r }) => ({
      sel, left: Math.round(r.left), right: Math.round(r.right), vw,
    }));
    const overlap = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const ar = a.r;
        const br = b.r;
        const slop = 3;
        const hit = ar.left < br.right - slop && ar.right > br.left + slop
          && ar.top < br.bottom - slop && ar.bottom > br.top + slop;
        if (!hit) continue;
        const ix = Math.min(ar.right, br.right) - Math.max(ar.left, br.left);
        const iy = Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top);
        if (ix * iy < 36) continue;
        overlap.push({
          a: a.sel, b: b.sel,
          ix: Math.round(ix), iy: Math.round(iy),
        });
      }
    }
    return { overflow, overlap, vh };
  }, selectors);
}

async function openQuietHome(page) {
  await page.evaluate(() => {
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
  });
}

async function runAt(browser, width, height, label) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: width <= 420, hasTouch: width <= 420 });
  await page.goto(smokeBaseUrl(port) + '?nosplash=1', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 45000 });
  await openQuietHome(page);

  const report = { label, width, fails: [] };

  const home = await overlapPairs(page, [
    '#menuScreen .hub-tile',
    '#menuScreen .menu-dock .btn.tog',
    '#menuScreen .menu-title-glass',
  ]);
  if (home.overflow.length) report.fails.push({ where: 'HOME overflow', home });
  const homeTileHits = home.overlap.filter((p) => p.a.includes('hub-tile') && p.b.includes('hub-tile'));
  if (homeTileHits.length) report.fails.push({ where: 'HOME tiles overlap', homeTileHits });

  await page.evaluate(() => {
    if (typeof UI === 'object' && UI.openModeHub) UI.openModeHub('collect');
  });
  const collect = await overlapPairs(page, [
    '#modeHubScreen .hub-tile',
    '#modeHubScreen .back-btn',
    '#modeHubScreen .mode-hub-head',
  ]);
  const collectTileHits = collect.overlap.filter((p) => p.a.includes('hub-tile') && p.b.includes('hub-tile'));
  if (collect.overflow.length) report.fails.push({ where: 'Collectie overflow', collect });
  if (collectTileHits.length) report.fails.push({ where: 'Collectie tiles overlap', collectTileHits });

  await page.evaluate(() => {
    if (typeof UI === 'object' && UI.openBuildings) UI.openBuildings();
  });
  const buildings = await page.evaluate(() => {
    const back = document.querySelector('#buildingsScreen .back-btn');
    const wallet = document.getElementById('buildingsWallet');
    const chips = wallet ? [...wallet.querySelectorAll('.buildings-wallet-chip')] : [];
    const rows = [...document.querySelectorAll('#buildingsList .buildings-row')];
    const br = back && back.getBoundingClientRect();
    const wr = wallet && wallet.getBoundingClientRect();
    const vs = !document.querySelector('[data-hub="versus"]');
    const chipOverflow = chips.filter((c) => {
      const r = c.getBoundingClientRect();
      return r.right > window.innerWidth + 2 || r.left < -2;
    }).length;
    const rowHits = [];
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const a = rows[i].getBoundingClientRect();
        const b = rows[j].getBoundingClientRect();
        if (a.left < b.right - 3 && a.right > b.left + 3 && a.top < b.bottom - 3 && a.bottom > b.top + 3) {
          rowHits.push([rows[i].dataset.factoryId, rows[j].dataset.factoryId]);
        }
      }
    }
    const walletUnderBack = !!(br && wr && wr.top + 1 >= br.bottom);
    if (typeof UI.buildingsShowUpgradeStep === 'function') UI.buildingsShowUpgradeStep();
    const sheet = document.getElementById('buildingsUpgradeSheet');
    const sheetOpen = !!(sheet && !sheet.hidden);
    const panel = sheet && sheet.querySelector('.buildings-sheet-panel');
    const pr = panel && panel.getBoundingClientRect();
    const sheetOverflow = !!(pr && (pr.right > window.innerWidth + 2 || pr.left < -2));
    if (typeof UI.buildingsShowList === 'function') UI.buildingsShowList();
    return {
      chips: chips.length,
      chipOverflow,
      rowHits,
      walletUnderBack,
      vs,
      sheetOpen,
      sheetOverflow,
      walletTop: wr && Math.round(wr.top),
      backBottom: br && Math.round(br.bottom),
    };
  });
  if (!buildings.vs) report.fails.push({ where: 'versus tile returned' });
  if (buildings.chips < 6) report.fails.push({ where: 'wallet chips', buildings });
  if (buildings.chipOverflow) report.fails.push({ where: 'wallet chip overflow', buildings });
  if (buildings.rowHits.length) report.fails.push({ where: 'factory rows overlap', buildings });
  if (!buildings.walletUnderBack) report.fails.push({ where: 'wallet stacked on back', buildings });
  if (!buildings.sheetOpen) report.fails.push({ where: 'upgrade sheet did not open', buildings });
  if (buildings.sheetOverflow) report.fails.push({ where: 'upgrade sheet overflow', buildings });

  await page.evaluate(() => {
    if (typeof UI === 'object' && UI.safeOpen) UI.safeOpen('gearScreen', () => UI.renderGear());
  });
  const gear = await page.evaluate(() => {
    const back = document.querySelector('#gearScreen .back-btn');
    const dock = document.getElementById('gearFilterDock');
    const slots = [...document.querySelectorAll('#gearSlotList [data-slot]')];
    const br = back && back.getBoundingClientRect();
    const dr = dock && dock.getBoundingClientRect();
    const slotHits = [];
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = slots[i].getBoundingClientRect();
        const b = slots[j].getBoundingClientRect();
        if (a.left < b.right - 3 && a.right > b.left + 3 && a.top < b.bottom - 3 && a.bottom > b.top + 3) {
          slotHits.push([slots[i].getAttribute('data-slot'), slots[j].getAttribute('data-slot')]);
        }
      }
    }
    const overflow = [back, dock, ...slots].filter(Boolean).some((el) => {
      const r = el.getBoundingClientRect();
      return r.right > window.innerWidth + 2 || r.left < -2;
    });
    const dockUnderBack = !!(br && dr && dr.top + 1 >= br.bottom);
    const doll = document.getElementById('gearDollCanvas');
    const dh = doll && doll.getBoundingClientRect().height;
    return {
      slots: slots.length,
      slotHits,
      overflow,
      dockUnderBack,
      dollH: dh && Math.round(dh),
    };
  });
  if (gear.slots !== 5) report.fails.push({ where: 'gear slots', gear });
  if (gear.slotHits.length) report.fails.push({ where: 'gear slots overlap', gear });
  if (gear.overflow) report.fails.push({ where: 'gear overflow', gear });
  if (!gear.dockUnderBack) report.fails.push({ where: 'gear filters stacked on back', gear });
  if (!(gear.dollH >= 170)) report.fails.push({ where: 'gear doll too small', gear });

  await page.evaluate(() => {
    if (typeof UI === 'object' && UI.openSummonHub) UI.openSummonHub();
  });
  const summon = await overlapPairs(page, [
    '#summonScreen .back-btn',
    '#summonScreen .head',
    '#btnChestPull',
    '#btnSummonGotoWeapons',
    '#btnSummonGotoPets',
    '#summonScreen .sub-home-bar',
  ]);
  if (summon.overflow.length) report.fails.push({ where: 'summon overflow', summon });
  if (summon.overlap.length) report.fails.push({ where: 'summon controls overlap', summon });

  await page.evaluate(() => {
    if (typeof UI === 'object' && UI.safeOpen) UI.safeOpen('petScreen', () => UI.renderPets());
  });
  const pets = await page.evaluate(() => {
    const back = document.querySelector('#petScreen .back-btn');
    const tabs = document.getElementById('petTabBar');
    const cards = [...document.querySelectorAll('#petList .card')].slice(0, 8);
    const br = back && back.getBoundingClientRect();
    const tr = tabs && tabs.getBoundingClientRect();
    const overflow = [back, tabs, ...cards].filter(Boolean).some((el) => {
      const r = el.getBoundingClientRect();
      return r.right > window.innerWidth + 2 || r.left < -2;
    });
    const cardHits = [];
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const a = cards[i].getBoundingClientRect();
        const b = cards[j].getBoundingClientRect();
        if (a.left < b.right - 3 && a.right > b.left + 3 && a.top < b.bottom - 3 && a.bottom > b.top + 3) {
          cardHits.push(i + '/' + j);
        }
      }
    }
    const tabsUnderBack = !!(br && tr && tr.top + 1 >= br.bottom);
    return { cards: cards.length, overflow, cardHits, tabsUnderBack };
  });
  if (pets.overflow) report.fails.push({ where: 'pets overflow', pets });
  if (pets.cardHits.length) report.fails.push({ where: 'pet cards overlap', pets });
  if (!pets.tabsUnderBack) report.fails.push({ where: 'pet tabs stacked on back', pets });

  await page.evaluate(() => {
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    const menu = document.getElementById('menuScreen');
    if (menu) menu.classList.add('active');
    if (typeof UI === 'object' && UI) {
      UI._fomoRitualHide = false;
      UI._fomoRitualForce = true;
      if (UI.showFomoRitual) UI.showFomoRitual(true);
    }
  });
  const fomo = await page.evaluate(() => {
    const overlay = document.getElementById('fomoRitual');
    const sheet = overlay && overlay.querySelector('.fomo-ritual-sheet');
    const x = document.getElementById('fomoRitualDismiss');
    const menu = document.getElementById('menuScreen');
    const chrome = menu && menu.querySelector('.menu-chrome');
    const tile = document.getElementById('btnAdventure');
    const toast = document.getElementById('toastHost');
    const xr = x && x.getBoundingClientRect();
    const sr = sheet && sheet.getBoundingClientRect();
    const tr = tile && tile.getBoundingClientRect();
    const hitAt = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const node = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return node && (node.id || node.className || node.tagName);
    };
    const tileHit = tr
      ? document.elementFromPoint(tr.left + tr.width / 2, tr.top + Math.min(24, tr.height / 2))
      : null;
    const tileSteals = !!(tileHit && tile && (tile === tileHit || tile.contains(tileHit)
      || (tileHit.closest && tileHit.closest('.hub-tile, .menu-dock, .menu-chrome'))));
    const zFomo = overlay ? Number(getComputedStyle(overlay).zIndex) || 0 : 0;
    const zMenu = menu ? Number(getComputedStyle(menu).zIndex) || 0 : 0;
    const zToast = toast ? Number(getComputedStyle(toast).zIndex) || 0 : 0;
    return {
      open: !!(overlay && !overlay.hidden),
      isFomo: !!(menu && menu.classList.contains('is-fomo')),
      chromeInert: !!(chrome && chrome.hasAttribute('inert')),
      xHit: hitAt(x),
      tileBlocked: !tileSteals,
      sheetBottom: sr && Math.round(sr.bottom),
      vh: window.innerHeight,
      safeGap: sr ? Math.round(window.innerHeight - sr.bottom) : 0,
      zFomo,
      zMenu,
      zToast,
      xOverflow: !!(xr && (xr.right > window.innerWidth + 2 || xr.left < -2)),
    };
  });
  if (!fomo.open) report.fails.push({ where: 'FOMO sheet did not open', fomo });
  if (!fomo.isFomo || !fomo.chromeInert) report.fails.push({ where: 'EX-021 FOMO hub lock', fomo });
  if (fomo.xOverflow) report.fails.push({ where: 'FOMO X overflow', fomo });
  if (fomo.safeGap < 20) report.fails.push({ where: 'FOMO sheet too close to gesture strip', fomo });
  if (!(fomo.zMenu >= fomo.zToast || fomo.zFomo >= fomo.zToast)) {
    report.fails.push({ where: 'FOMO under toast', fomo });
  }
  if (fomo.open && !fomo.tileBlocked) report.fails.push({ where: 'HOME tile click-through FOMO', fomo });

  await page.evaluate(() => {
    if (typeof dismissFomoRitual === 'function') dismissFomoRitual();
    else if (typeof UI === 'object' && UI.hideFomoRitual) UI.hideFomoRitual();
  });
  const fomoClosed = await page.evaluate(() => {
    const overlay = document.getElementById('fomoRitual');
    const menu = document.getElementById('menuScreen');
    const chrome = menu && menu.querySelector('.menu-chrome');
    return {
      hidden: !!(overlay && overlay.hidden),
      isFomo: !!(menu && menu.classList.contains('is-fomo')),
      chromeInert: !!(chrome && chrome.hasAttribute('inert')),
    };
  });
  if (!fomoClosed.hidden || fomoClosed.isFomo || fomoClosed.chromeInert) {
    report.fails.push({ where: 'FOMO dismiss did not unlock HOME', fomoClosed });
  }

  await page.evaluate(() => {
    if (typeof UI === 'object' && UI.safeOpen) UI.safeOpen('settingsScreen', () => UI.renderSettings && UI.renderSettings());
    const fold = document.getElementById('settingsShareFold');
    if (fold) fold.open = true;
  });
  const settings = await page.evaluate(() => {
    const nodes = [
      document.getElementById('settingsSaveAutoCard'),
      document.getElementById('settingsShareFold'),
      document.getElementById('settingsSaveFold'),
      document.getElementById('hostingLink'),
      ...document.querySelectorAll('#settingsScreen .settings-card'),
      ...document.querySelectorAll('#settingsScreen .settings-fold'),
    ].filter(Boolean);
    const overflow = nodes.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.right > window.innerWidth + 2 || r.left < -2;
    }).map((el) => el.id || el.className);
    return { overflow, count: nodes.length };
  });
  if (settings.overflow.length) report.fails.push({ where: 'settings overflow', settings });

  await page.evaluate(() => {
    if (typeof UI === 'object' && UI.safeOpen) UI.safeOpen('styleScreen', () => UI.renderStyle());
  });
  const style = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#styleGrid .style-card')];
    const overflow = [document.getElementById('styleGrid'), ...cards].filter(Boolean).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.right > window.innerWidth + 2 || r.left < -2;
    }).length;
    const hits = [];
    for (let i = 0; i < Math.min(cards.length, 8); i++) {
      for (let j = i + 1; j < Math.min(cards.length, 8); j++) {
        const a = cards[i].getBoundingClientRect();
        const b = cards[j].getBoundingClientRect();
        if (a.left < b.right - 3 && a.right > b.left + 3 && a.top < b.bottom - 3 && a.bottom > b.top + 3) {
          hits.push(i + '/' + j);
        }
      }
    }
    return { cards: cards.length, overflow, hits };
  });
  if (style.overflow) report.fails.push({ where: 'style cards overflow', style });
  if (style.hits.length) report.fails.push({ where: 'style cards overlap', style });
  if (!(style.cards >= 4)) report.fails.push({ where: 'style cards missing', style });

  await page.evaluate(() => {
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    if (typeof UI === 'object' && UI.showResult) {
      UI.showResult(false, {
        mode: 'adventure', level: 1, win: false, xp: 0, stars: 0,
        titleKey: 'result.advLose', title: 'VERLOREN',
      });
    }
  });
  const result = await page.evaluate(() => {
    const screen = document.getElementById('resultScreen');
    const again = document.getElementById('resAgain');
    const dock = document.getElementById('resCtaDock');
    const ar = again && again.getBoundingClientRect();
    const overflow = [screen, again, dock].filter(Boolean).some((el) => {
      const r = el.getBoundingClientRect();
      return r.right > window.innerWidth + 2 || r.left < -2;
    });
    return {
      active: !!(screen && screen.classList.contains('active')),
      lose: !!(screen && screen.classList.contains('is-lose') && screen.classList.contains('is-adventure')),
      againH: ar && Math.round(ar.height),
      dock: !!(dock && !dock.hidden),
      overflow,
      label: again && (again.querySelector('div') || again).textContent,
    };
  });
  if (!result.active || !result.lose) report.fails.push({ where: 'result lose screen', result });
  if (width <= 420 && !(result.againH >= 72)) report.fails.push({ where: 'result CTA not huge', result });
  if (result.overflow) report.fails.push({ where: 'result overflow', result });

  await page.evaluate(() => {
    if (typeof UI === 'object' && UI.openBuildings) UI.openBuildings();
    if (typeof UI === 'object' && UI.toast) UI.toast('Welkom — tik een melding weg · Tips in het menu', 8000);
  });
  const toastTitle = await page.evaluate(() => {
    const toast = document.querySelector('#toastHost .toast');
    const head = document.getElementById('buildingsScreenHead')
      || document.querySelector('#buildingsScreen .head');
    const tr = toast && toast.getBoundingClientRect();
    const hr = head && head.getBoundingClientRect();
    const overlap = !!(tr && hr
      && tr.left < hr.right - 2 && tr.right > hr.left + 2
      && tr.top < hr.bottom - 2 && tr.bottom > hr.top + 2);
    return {
      hasToast: !!toast,
      hasHead: !!head,
      overlap,
      toastTop: tr && Math.round(tr.top),
      headBottom: hr && Math.round(hr.bottom),
    };
  });
  if (toastTitle.hasToast && toastTitle.hasHead && toastTitle.overlap) {
    report.fails.push({ where: 'welcome toast covers factory title', toastTitle });
  }

  await page.close();
  return report;
}

async function runLandscapeHub(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true });
  await page.goto(smokeBaseUrl(port) + '?nosplash=1', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 45000 });
  await openQuietHome(page);
  const hub = await page.evaluate(() => {
    const tiles = [...document.querySelectorAll('#menuScreen .hub-tile')];
    const footer = document.querySelector('#menuScreen .menu-landing-footer, #menuScreen .menu-dock');
    const title = document.querySelector('#menuScreen .menu-title-glass, #menuScreen h1.title');
    const nodes = [...tiles, footer, title].filter(Boolean);
    const overflow = nodes.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.right > window.innerWidth + 2 || r.left < -2
        || r.bottom > window.innerHeight + 2 || r.top < -2;
    }).map((el) => el.id || el.className);
    const versus = !!document.querySelector('[data-hub="versus"]');
    return {
      tiles: tiles.length,
      overflow,
      versus,
      scrollW: document.documentElement.scrollWidth,
      vh: window.innerHeight,
      vw: window.innerWidth,
    };
  });
  await page.close();
  const fails = [];
  if (hub.versus) fails.push({ where: 'versus tile on landscape hub', hub });
  if (hub.overflow.length) fails.push({ where: 'landscape 844×390 hub overflow', hub });
  if (hub.scrollW > 846) fails.push({ where: 'landscape page scroll width', hub });
  if (!(hub.tiles >= 4)) fails.push({ where: 'landscape hub tiles missing', hub });
  return { label: 'land844x390', width: 844, fails };
}

const port = Number(process.env.SF_LAYOUT_PORT || 8794);

async function run() {
  let server = null;
  try { server = await ensureSmokeServer(port); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,800'],
  });
  try {
    const phone = await runAt(browser, 390, 844, 'phone390');
    const desktop = await runAt(browser, 1280, 800, 'desktop');
    const land = await runLandscapeHub(browser);
    const fails = [...phone.fails, ...desktop.fails, ...land.fails];
    if (fails.length) {
      console.error('SMOKE_FAIL layout', JSON.stringify({ phone, desktop, land }, null, 2));
      process.exit(1);
    }
    console.log('SMOKE_OK layout-screens 390 + desktop + land844 (HOME/Collectie/factories/gear/summons/pets)');
  } finally {
    await browser.close();
    if (server) try { server.close(); } catch (_) {}
  }
}

run().catch((err) => {
  console.error('SMOKE_FAIL layout', err);
  process.exit(1);
});
