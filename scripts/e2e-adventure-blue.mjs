#!/usr/bin/env node
/**
 * Headless Chrome: start adventure and dump play-layer state.
 * Usage: node scripts/e2e-adventure-blue.mjs [baseUrl]
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = process.argv[2] || 'http://127.0.0.1:8787/index.html?sfdebug=1';
const outDir = '/tmp/sf-e2e';
fs.mkdirSync(outDir, { recursive: true });

const chrome =
  process.env.CHROME_PATH ||
  ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome', '/usr/bin/chromium-browser']
    .find((p) => fs.existsSync(p));

if (!chrome) {
  console.error('E2E_FAIL no chrome');
  process.exit(1);
}

const userData = path.join(outDir, 'chrome-profile');
fs.mkdirSync(userData, { recursive: true });

const dumpJs = `
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const waitBoot = async () => {
    for (let i = 0; i < 80; i++) {
      if (window.__sf && window.__sfBooted) return true;
      await sleep(100);
    }
    return false;
  };
  const dump = (label) => {
    const d = typeof sfDebugScreen === 'function' ? sfDebugScreen({ toast: false }) : null;
    const active = [...document.querySelectorAll('.screen.active')].map((s) => s.id);
    const canvasEl = document.getElementById('game');
    const g = typeof game !== 'undefined' ? game : null;
    const flash = document.getElementById('levelRollFlash');
    const stage = document.querySelector('#menuScreen .menu-stage');
    const cs = canvasEl ? getComputedStyle(canvasEl) : null;
    return {
      label,
      booted: !!window.__sfBooted,
      state: typeof state !== 'undefined' ? state : null,
      hasGame: !!(g && g.player),
      mode: (g && g.mode) || null,
      isPlaying: document.body.classList.contains('is-playing'),
      menuHubLive: document.body.classList.contains('menu-hub-live'),
      activeScreens: active,
      playBroken: typeof playLayerBroken === 'function' ? playLayerBroken() : null,
      canvas: canvasEl ? {
        visStyle: canvasEl.style.visibility,
        visComp: cs.visibility,
        display: cs.display,
        z: cs.zIndex,
        opacity: cs.opacity,
        pe: cs.pointerEvents,
        w: typeof W !== 'undefined' ? W : 0,
        h: typeof H !== 'undefined' ? H : 0,
        rect: canvasEl.getBoundingClientRect(),
      } : null,
      flash: flash ? {
        hidden: flash.hidden,
        visibleClass: flash.classList.contains('visible'),
        display: getComputedStyle(flash).display,
        z: getComputedStyle(flash).zIndex,
      } : null,
      menuStage: stage ? {
        hidden: stage.hidden,
        vis: getComputedStyle(stage).visibility,
        display: getComputedStyle(stage).display,
      } : null,
      menuActive: !!document.getElementById('menuScreen')?.classList.contains('active'),
      levelActive: !!document.getElementById('levelScreen')?.classList.contains('active'),
      debug: d,
      err: window.__sfLoopErr || null,
    };
  };

  const booted = await waitBoot();
  const before = dump('boot');
  let startErr = null;
  try {
    if (typeof startGame === 'function') {
      startGame('adventure', { level: 1, gamble: null });
    } else {
      startErr = 'no startGame';
    }
  } catch (e) {
    startErr = String(e && e.stack || e);
  }
  await sleep(200);
  const after200 = dump('after200');
  await sleep(800);
  const after1s = dump('after1s');
  const result = { booted, startErr, before, after200, after1s };
  document.title = 'SF_E2E_DONE';
  window.__sfE2E = result;
  const pre = document.createElement('pre');
  pre.id = 'sfE2EDump';
  pre.textContent = JSON.stringify(result, null, 2);
  document.body.appendChild(pre);
})();
`;

fs.writeFileSync(path.join(outDir, 'inject.js'), dumpJs);

// Use chrome with remote debugging + puppeteer-core via CDP is heavy.
// Simpler: open page with --dump-dom after delay using a data URL wrapper — unreliable.
// Use chrome --headless=new with virtual time? Better: node with playwright if not available use CDP fetch.

async function run() {
  // Dynamic import puppeteer-core if present, else spawn chrome remote debugging
  let puppeteer;
  try {
    puppeteer = await import('puppeteer-core');
  } catch (_) {
    puppeteer = null;
  }

  if (!puppeteer) {
    // Install puppeteer-core quickly without downloading chrome
    await new Promise((resolve, reject) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], {
        cwd: outDir,
        stdio: 'inherit',
      });
      p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('npm install failed'))));
    });
    puppeteer = await import(path.join(outDir, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js')).catch(() => null);
    if (!puppeteer) {
      puppeteer = await import(path.join(outDir, 'node_modules/puppeteer-core/lib/cjs/puppeteer/puppeteer-core.js'));
    }
  }

  const browser = await puppeteer.default.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=390,844'],
    userDataDir: userData,
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const logs = [];
  page.on('console', (msg) => logs.push(['console', msg.type(), msg.text()]));
  page.on('pageerror', (err) => logs.push(['pageerror', String(err)]));
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  for (let i = 0; i < 50; i++) {
    const ok = await page.evaluate(() => !!(window.__sfBooted && typeof window.startGame === 'function'));
    if (ok) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  await page.evaluate(dumpJs);
  await page.waitForFunction('window.__sfE2E', { timeout: 15000 });
  const result = await page.evaluate(() => window.__sfE2E);
  await page.screenshot({ path: path.join(outDir, 'after-adventure.png'), fullPage: true });
  fs.writeFileSync(path.join(outDir, 'dump.json'), JSON.stringify({ result, logs: logs.slice(-40) }, null, 2));
  await browser.close();

  console.log(JSON.stringify(result, null, 2));
  const bad = [];
  for (const key of ['after200', 'after1s']) {
    const s = result[key];
    if (!s) continue;
    if (s.state !== 'play') bad.push(`${key}:state=${s.state}`);
    if (!s.isPlaying) bad.push(`${key}:not-isPlaying`);
    if (s.activeScreens && s.activeScreens.length) bad.push(`${key}:screens=${s.activeScreens.join(',')}`);
    if (s.playBroken) bad.push(`${key}:playBroken`);
    if (s.canvas && s.canvas.visComp === 'hidden') bad.push(`${key}:canvas-hidden`);
    if (s.flash && s.flash.visibleClass) bad.push(`${key}:flash-visible`);
  }
  if (result.startErr) bad.push('startErr:' + result.startErr);
  if (bad.length) {
    console.error('E2E_BLUE_SUSPECT', bad.join(' | '));
    process.exit(2);
  }
  console.log('E2E_OK adventure play layer looks healthy');
}

run().catch((err) => {
  console.error('E2E_FAIL', err);
  process.exit(1);
});
