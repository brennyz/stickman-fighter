#!/usr/bin/env node
/**
 * #343 P2 + #338: FOMO auto-sheet after first-punch HOME return.
 * Reliable open on portrait HOME XOR skip if sheet would block play.
 * Continue must not permanently skip the island beat for new players.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error('SMOKE_FAIL fomo-home:', msg);
  process.exit(1);
}

const ui = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');
const missions = fs.readFileSync(path.join(root, 'src/systems/missions.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

if (!/maybeAutoShowFomoRitual/.test(ui)) fail('UI.maybeAutoShowFomoRitual missing');
if (!/id === 'menuScreen'[\s\S]{0,120}maybeAutoShowFomoRitual/.test(ui)) {
  fail('UI.show(menuScreen) must flush FOMO after HOME is .active');
}
if (!/this\.maybeAutoShowFomoRitual\(!!this\._fomoRitualForce\)/.test(ui)) {
  fail('renderMenu must go through maybeAutoShowFomoRitual');
}
if (!/_fomoRitualWanted = true/.test(ui)) {
  fail('showFomoRitual must queue wanted when menu is not .active (no silent drop)');
}
if (!/function fomoRitualWouldBlockPlay/.test(missions)) fail('fomoRitualWouldBlockPlay missing');
if (!/max-height: 420px/.test(missions)) fail('landscape skip must use short 420px height');
if (!/function islandPickPending/.test(missions)) fail('islandPickPending missing');
if (!/islandPickPending[\s\S]{0,220}safeOpen\('levelScreen'/.test(missions)) {
  fail('resumeLastPlay must open island while islandPickPending');
}
if (!/feltFirstPunch\) return true/.test(missions)) {
  fail('fomoRitualHubReady must treat feltFirstPunch as HOME-ready');
}
if (!/id="fomoRitual"/.test(html)) fail('#fomoRitual missing');
if (/data-hub="versus"/.test(html)) fail('Versus must stay retired');

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) {
  console.log('SMOKE_OK fomo-home static (no chrome)');
  process.exit(0);
}

const outDir = '/tmp/sf-fomo-home';
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

async function run() {
  let server = null;
  try { server = await ensureSmokeServer(8794); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=390,844'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto(smokeBaseUrl(8794, '/index.html?nosplash=1'), { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });

  const portrait = await page.evaluate(() => {
    try { if (typeof enterHubFromTitle === 'function') enterHubFromTitle({}); } catch (_) {}
    const splash = document.getElementById('sfSplash');
    if (splash) splash.classList.add('is-done');
    save.feltFirstPunch = true;
    save.lastPlay = { mode: 'adventure', level: 1 };
    save.tipsSeen = {};
    save.fomo = Object.assign({}, (typeof defaultFomoBag === 'function') ? defaultFomoBag() : {}, {
      ritualSeenDate: null, lastOpenDate: null,
    });
    save.chestDaily = { date: (typeof todayKey === 'function') ? todayKey() : '2026-09-18', left: 10, pulls: [] };
    persist();
    UI._fomoRitualHide = false;
    UI._fomoRitualForce = false;
    UI._fomoRitualWanted = false;

    const pending = typeof fomoRitualPending === 'function' && fomoRitualPending();
    const island = typeof islandPickPending === 'function' && islandPickPending();
    const block = typeof fomoRitualWouldBlockPlay === 'function' && fomoRitualWouldBlockPlay();

    const menu = document.getElementById('menuScreen');
    if (menu) menu.classList.remove('active');
    UI.renderMenu();
    const afterRender = {
      wanted: !!UI._fomoRitualWanted,
      open: typeof fomoRitualIsOpen === 'function' && fomoRitualIsOpen(),
    };
    UI.show('menuScreen');
    const sheet = document.getElementById('fomoRitual');
    const afterShow = {
      menuOn: !!(menu && menu.classList.contains('active')),
      open: typeof fomoRitualIsOpen === 'function' && fomoRitualIsOpen(),
      hidden: !!(sheet && sheet.hidden),
      isFomo: !!(document.body && document.body.classList.contains('is-fomo')),
    };

    const resumed = typeof resumeLastPlay === 'function' && resumeLastPlay();
    const levelOn = !!(document.getElementById('levelScreen') && document.getElementById('levelScreen').classList.contains('active'));
    const islandsSeen = !!(save.tipsSeen && save.tipsSeen.islands);
    const islandAfter = typeof islandPickPending === 'function' && islandPickPending();

    return { pending, island, block, afterRender, afterShow, resumed, levelOn, islandsSeen, islandAfter };
  });

  const land = await browser.newPage();
  await land.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true });
  await land.goto(smokeBaseUrl(8794, '/index.html?nosplash=1'), { waitUntil: 'load', timeout: 30000 });
  await land.waitForFunction(() => window.__sfBooted, { timeout: 25000 });
  const landscape = await land.evaluate(() => {
    try { if (typeof enterHubFromTitle === 'function') enterHubFromTitle({}); } catch (_) {}
    const splash = document.getElementById('sfSplash');
    if (splash) splash.classList.add('is-done');
    save.feltFirstPunch = true;
    save.lastPlay = { mode: 'adventure', level: 1 };
    save.tipsSeen = {};
    save.fomo = Object.assign({}, (typeof defaultFomoBag === 'function') ? defaultFomoBag() : {}, {
      ritualSeenDate: null, lastOpenDate: null,
    });
    save.chestDaily = { date: (typeof todayKey === 'function') ? todayKey() : '2026-09-18', left: 10, pulls: [] };
    persist();
    UI._fomoRitualHide = false;
    UI._fomoRitualForce = false;
    UI._fomoRitualWanted = false;
    const wouldBlock = typeof fomoRitualWouldBlockPlay === 'function' && fomoRitualWouldBlockPlay();
    UI.show('menuScreen');
    UI.renderMenu();
    const sheet = document.getElementById('fomoRitual');
    const chrome = document.querySelector('#menuScreen .menu-chrome');
    return {
      wouldBlock,
      open: typeof fomoRitualIsOpen === 'function' && fomoRitualIsOpen(),
      hidden: !!(sheet && sheet.hidden),
      inert: !!(chrome && chrome.hasAttribute('inert')),
      hide: !!UI._fomoRitualHide,
    };
  });

  await browser.close();
  try { if (server && server.close) server.close(); } catch (_) {}

  if (pageErrors.length) fail('pageerror ' + pageErrors[0]);
  if (!portrait.pending) fail('FOMO must be pending after first punch');
  if (!portrait.island) fail('islandPickPending must be true before island seen');
  if (portrait.block) fail('390×844 must not treat FOMO as blocking play');
  if (!portrait.afterRender.wanted) fail('renderMenu before HOME .active must queue FOMO, not drop it');
  if (portrait.afterRender.open) fail('FOMO must not open on a non-active HOME');
  if (!portrait.afterShow.menuOn) fail('HOME must be .active after show');
  if (!portrait.afterShow.open || portrait.afterShow.hidden) fail('FOMO must open after HOME show flush');
  if (!portrait.afterShow.isFomo) fail('is-fomo lock missing after reliable open');
  if (!portrait.resumed) fail('Verder spelen must resume');
  if (!portrait.levelOn) fail('Verder spelen must open Kies een eiland for new players');
  if (!portrait.islandsSeen) fail('opening island must stamp tipsSeen.islands');
  if (portrait.islandAfter) fail('islandPickPending must clear after island seen');
  if (!landscape.wouldBlock) fail('844×390 must skip auto-sheet (would block play)');
  if (landscape.open || !landscape.hidden) fail('landscape auto-sheet must stay closed');
  if (landscape.inert) fail('landscape skip must not leave HOME inert');
  if (!landscape.hide) fail('landscape skip must session-hide so it does not flap');

  console.log('SMOKE_OK fomo-home portrait-open XOR landscape-skip + island Continue');
}

run().catch((err) => fail(err && err.stack ? err.stack : String(err)));
