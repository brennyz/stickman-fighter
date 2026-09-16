#!/usr/bin/env node
/**
 * Android 390×844 screenshots for gear UX before/after.
 * Usage: node scripts/capture-gear-ux.mjs [before|after]
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tag = (process.argv[2] || 'shot').replace(/[^a-z0-9_-]/gi, '') || 'shot';
const outDir = process.env.GEAR_SHOT_DIR
  || '/opt/cursor/artifacts/screenshots';
const repoShotDir = path.join(root, 'docs/gear-ux');

function mustChrome() {
  return ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
}

async function getPuppeteer(outTmp) {
  try { return await import('puppeteer-core'); } catch (_) {
    await new Promise((res, rej) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], { cwd: outTmp, stdio: 'inherit' });
      p.on('exit', (c) => (c === 0 ? res() : rej(new Error('npm puppeteer-core'))));
    });
    return import(path.join(outTmp, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'));
  }
}

async function shot(page, name) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(repoShotDir, { recursive: true });
  const file = `${tag}-${name}.png`;
  const abs = path.join(outDir, file);
  await page.screenshot({ path: abs, fullPage: false });
  fs.copyFileSync(abs, path.join(repoShotDir, file));
  console.log('SHOT', abs);
}

async function run() {
  const chrome = mustChrome();
  if (!chrome) {
    console.error('NO_CHROME');
    process.exit(2);
  }
  const tmp = '/tmp/sf-gear-ui';
  fs.mkdirSync(tmp, { recursive: true });
  const port = Number(process.env.SF_GEAR_PORT || 8798);
  let server = null;
  try { server = await ensureSmokeServer(port); } catch (_) {}
  const puppeteer = await getPuppeteer(tmp);
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(smokeBaseUrl(port) + '?nosplash=1', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 20000 });
  await page.waitForFunction(() => {
    const splash = document.getElementById('sfSplash');
    return !splash || splash.classList.contains('is-done') || splash.getAttribute('hidden') != null;
  }, { timeout: 25000 });
  await page.evaluate(() => {
    const splash = document.getElementById('sfSplash');
    if (splash) {
      splash.classList.add('is-done');
      splash.setAttribute('hidden', '');
    }
    if (typeof UI !== 'undefined' && UI.renderMenu) {
      UI.renderMenu();
      UI.show('menuScreen');
    }
  });
  await page.waitForSelector('#menuScreen.active', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 500));
  await shot(page, '01-home');

  await page.evaluate(() => {
    UI.openModeHub('collect');
  });
  await page.waitForSelector('#modeHubScreen.active', { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 250));
  await shot(page, '02-collect-hub');

  await page.evaluate(() => {
    const host = document.getElementById('toastHost');
    if (host) host.innerHTML = '';
    UI.safeOpen('gearScreen', () => UI.renderGear());
  });
  await page.waitForSelector('#gearScreen.active', { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 300));
  await shot(page, '03-gear-top');

  await page.evaluate(() => {
    const el = document.getElementById('gearScreen');
    if (el) el.scrollTop = Math.min(el.scrollHeight, 520);
  });
  await new Promise((r) => setTimeout(r, 200));
  await shot(page, '04-gear-scroll');

  if (tag === 'after') {
    await page.evaluate(() => {
      const el = document.getElementById('gearScreen');
      if (el) el.scrollTop = 0;
      if (typeof grantStarterGear === 'function') grantStarterGear(save);
      if (typeof gearGrantItem === 'function') {
        try { gearGrantItem('head_visor_neon', 'shot', save, Date.now()); } catch (_) {}
      }
      if (save.gear && save.gear.owned) {
        save.gear.owned.head_visor_neon = save.gear.owned.head_visor_neon || { at: Date.now(), src: 'shot' };
      }
      save.lvl = Math.max(save.lvl || 1, 20);
      if (typeof gearEquipItem === 'function') gearEquipItem('head_visor_neon');
      try {
        document.querySelectorAll('.sf-toast, .toast, [data-toast]').forEach((n) => { n.remove(); });
      } catch (_) {}
      UI.gearSlotPick = 'head';
      UI.renderGear();
      UI.renderMenu();
    });
    await new Promise((r) => setTimeout(r, 250));
    await shot(page, '05-gear-equipped');

    await page.evaluate(() => {
      if (typeof setLang === 'function') setLang('en');
      else if (typeof applyLang === 'function') {
        try { save.lang = 'en'; applyLang(); } catch (_) {}
      }
      UI.renderGear();
    });
    await new Promise((r) => setTimeout(r, 250));
    await shot(page, '06-gear-en');

    await page.evaluate(() => {
      UI.renderMenu();
      UI.show('menuScreen');
    });
    await page.waitForSelector('#menuScreen.active', { timeout: 8000 });
    await new Promise((r) => setTimeout(r, 300));
    await shot(page, '07-home-after');
  }

  await browser.close();
  try { if (server && server.close) server.close(); } catch (_) {}
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
