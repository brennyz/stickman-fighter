#!/usr/bin/env node
/**
 * Arcade STEP 2 pick-mode: HOME hub-tile chrome + chrome i18n follows game lang.
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

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
const loop = fs.readFileSync(path.join(root, 'src/boot/loop.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');

const hubBlock = html.match(/id="modeHubScreen"[\s\S]*?id="charSelectScreen"/)?.[0] || '';
must(/mode-hub-home/.test(hubBlock), 'modeHubScreen must use mode-hub-home');
must(/hub-tile-grid/.test(hubBlock), 'pick-mode must use hub-tile-grid');
must(/id="btnTraining"/.test(hubBlock) && /hub-tile-featured/.test(hubBlock), 'Training must stay a featured hub tile');
must(/id="btnWall"/.test(hubBlock) && /id="btnMatsCoins"/.test(hubBlock), 'Wall + Coin tiles missing');
must(/id="btnWeapons"/.test(hubBlock), 'Weapons tile missing on collect panel');
must(!/hub-mode-row/.test(hubBlock), 'ugly hub-mode-row leftover on pick-mode');
must(!/class="btn mode-btn/.test(hubBlock), 'pick-mode must not reuse fat mode-btn rows');
must(/hub-tile-title/.test(hubBlock) && /hub-tile-sub/.test(hubBlock), 'HOME title/sub chrome missing');

must(/hub-tile-grid\[hidden\]/.test(css), 'hidden collect panel must not leak under display:grid');
must(/#modeHubScreen\.mode-hub-home \.hub-tile/.test(css), 'HOME tile tokens missing on mode hub');
must(/--menu-tile-solid/.test(css.match(/#modeHubScreen\.mode-hub-home \{[\s\S]*?\}/)?.[0] || ''), 'mode hub missing HOME tile tokens');
must(/orientation: landscape[\s\S]*mode-hub-home \.hub-tile-grid \.hub-tile-featured/.test(css), 'Android landscape density missing');
must(!/\.screen\s*\{[^}]*display:\s*none\s*!important/.test(css), 'must not use nuclear display:none on .screen');

must(/querySelector\('\.hub-tile-title'\)/.test(i18n), 'i18n must paint hub-tile-title');
must(/btnUpgrades',\s*'hub\.upgrades'/.test(i18n), 'upgrades tile must be i18n-wired');
must(/updateReady: 'New version ready/.test(i18n), 'EN net.updateReady missing');
must(/updateWait: 'New version — loads in the menu'/.test(i18n), 'EN net.updateWait missing');
must(/tOr\('net\.updateWait'/.test(loop), 'SW wait banner must follow game language');
must(/tOr\('net\.updateReady'/.test(loop), 'SW ready banner must follow game language');
must(/tOr\('hub\.loadFail'/.test(ui), 'hub load fail toast must be i18n');
must(/setTitle\('togMusic', 'menu\.music'\)/.test(i18n), 'dock tooltips must follow game language');
must(/setTitle\('btnVerseVersie', 'settings\.freshHint'\)/.test(i18n), 'fresh-version tooltip must follow game language');
must(/updateNetStatus\(\)/.test(i18n), 'lang switch must refresh SW/offline chrome');
must(!/data-hub="versus"/.test(html), 'versus stays retired');

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.log('SMOKE_OK arcade-pick (static only, no chrome)'); process.exit(0); }

const outDir = '/tmp/sf-arcade-pick';
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
  const port = Number(process.env.SF_ARCADE_PICK_PORT || 8796);
  let server = null;
  try { server = await ensureSmokeServer(port); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  await page.goto(smokeBaseUrl(port) + '?nosplash=1', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 45000 });

  const result = await page.evaluate(() => {
    try {
      if (typeof setLang === 'function') setLang('en');
      else if (typeof save !== 'undefined') { save.lang = 'en'; persist(); if (typeof applyLang === 'function') applyLang(); }
      UI.openModeHub('arcade');
      const hub = document.getElementById('modeHubScreen');
      const arcade = document.querySelector('[data-hub-panel="arcade"]');
      const collect = document.querySelector('[data-hub-panel="collect"]');
      const tiles = arcade ? [...arcade.querySelectorAll('.hub-tile')].map((b) => b.id) : [];
      const titles = arcade ? [...arcade.querySelectorAll('.hub-tile-title')].map((el) => el.textContent) : [];
      const step = (document.getElementById('modeHubStep') || {}).textContent || '';
      const waitCopy = (typeof tOr === 'function') ? tOr('net.updateWait', '') : '';
      const readyCopy = (typeof tOr === 'function') ? tOr('net.updateReady', '') : '';
      const hubOpen = !!(hub && hub.classList.contains('active') && hub.classList.contains('mode-hub-home'));
      if (typeof startGame === 'function') startGame('training');
      const started = !!(typeof game !== 'undefined' && game && game.mode === 'training');
      const musicTip = (document.getElementById('togMusic') || {}).title || '';
      const freshTip = (document.getElementById('btnVerseVersie') || {}).title || '';
      return {
        ok: !!(hubOpen
          && tiles.includes('btnTraining') && tiles.includes('btnWall') && tiles.includes('btnMatsCoins')
          && /Pick mode/i.test(step) && /Training/.test(titles.join(' '))
          && /loads in the menu/.test(waitCopy) && !/laadt in het menu/.test(waitCopy)
          && /tap to load/.test(readyCopy)
          && /Music/i.test(musicTip) && !/Muziek/.test(musicTip)
          && /newest version/i.test(freshTip) && !/Oude cache/.test(freshTip)
          && collect && collect.hidden && getComputedStyle(collect).display === 'none'
          && started),
        tiles, titles, step, waitCopy, readyCopy, started, musicTip, freshTip,
        collectHidden: !!(collect && collect.hidden),
      };
    } catch (e) {
      return { ok: false, why: String(e && e.stack || e) };
    }
  });

  await browser.close();
  if (server) server.close();
  if (!result.ok) {
    console.error('SMOKE_FAIL arcade-pick', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('SMOKE_OK arcade-pick', JSON.stringify(result));
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
