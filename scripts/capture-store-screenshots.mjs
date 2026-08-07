#!/usr/bin/env node
/**
 * Capture landscape store screenshots (phone + tablet) via headless Chrome.
 *
 * Usage:
 *   node scripts/capture-store-screenshots.mjs
 *   node scripts/capture-store-screenshots.mjs http://127.0.0.1:8787/index.html
 *   OUT_DIR=/tmp/sf-store-shots node scripts/capture-store-screenshots.mjs
 *
 * Default output: docs/store/screenshots/ (PNGs gitignored — see README).
 * Requires system Chrome + puppeteer-core (auto-installs to /tmp if missing).
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultOut = path.join(root, 'docs/store/screenshots');
const outDir = process.env.OUT_DIR
  ? path.resolve(process.env.OUT_DIR)
  : defaultOut;
const puppeteerInstallDir = '/tmp/sf-store-shots-deps';

const VIEWPORTS = [
  // Google Play phone landscape (16:9)
  { id: 'play-phone-1920x1080', width: 1920, height: 1080, deviceScaleFactor: 1 },
  // Apple iPhone 6.5" landscape
  { id: 'ios-iphone-2688x1242', width: 2688, height: 1242, deviceScaleFactor: 1 },
  // Android / Play 10" tablet landscape
  { id: 'play-tablet-1920x1200', width: 1920, height: 1200, deviceScaleFactor: 1 },
  // Apple iPad Pro 12.9" landscape
  { id: 'ios-ipad-2732x2048', width: 2732, height: 2048, deviceScaleFactor: 1 },
];

const SCENES = [
  { id: '01-menu', label: 'main menu', setup: setupMenu },
  { id: '02-levels', label: 'level select', setup: setupLevels },
  { id: '03-adventure', label: 'adventure fight', setup: setupAdventure },
  { id: '04-versus-ready', label: 'versus / char path', setup: setupVersusReady },
];

const chrome = [
  process.env.CHROME_PATH,
  '/usr/local/bin/google-chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/opt/google/chrome/chrome',
].find((p) => p && fs.existsSync(p));

if (!chrome) {
  console.error('CAPTURE_FAIL no chrome — set CHROME_PATH');
  process.exit(1);
}

async function getPuppeteer() {
  try {
    return await import('puppeteer-core');
  } catch (_) {
    fs.mkdirSync(puppeteerInstallDir, { recursive: true });
    await new Promise((resolve, reject) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], {
        cwd: puppeteerInstallDir,
        stdio: 'inherit',
      });
      p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('npm install puppeteer-core failed'))));
    });
    return import(
      path.join(puppeteerInstallDir, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js')
    );
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitBoot(page) {
  await page.waitForFunction(
    () => window.__sfBooted || (typeof UI !== 'undefined' && document.getElementById('menuScreen')),
    { timeout: 25000 }
  );
  await sleep(400);
}

async function setupMenu(page) {
  await page.evaluate(() => {
    try {
      if (typeof recoverToMenu === 'function') recoverToMenu({ force: true });
    } catch (_) {}
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    const menu = document.getElementById('menuScreen');
    if (menu) menu.classList.add('active');
    document.body.classList.remove('is-playing');
  });
  await sleep(500);
}

async function setupLevels(page) {
  await page.evaluate(() => {
    try {
      if (typeof recoverToMenu === 'function') recoverToMenu({ force: true });
    } catch (_) {}
    if (typeof UI !== 'undefined' && UI.safeOpen) {
      UI.safeOpen('levelScreen', () => {
        if (typeof UI.renderLevels === 'function') UI.renderLevels();
      });
    } else {
      document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
      document.getElementById('levelScreen')?.classList.add('active');
    }
  });
  await sleep(600);
}

async function setupAdventure(page) {
  await page.evaluate(() => {
    try {
      if (typeof cancelGambleStart === 'function') cancelGambleStart();
    } catch (_) {}
    try {
      if (typeof startGame === 'function') {
        startGame('adventure', { level: 1, gamble: null, difficulty: 'normal' });
      } else if (typeof gokGooiStartLevel === 'function') {
        window.__sfSkipGamble = true;
        gokGooiStartLevel(1);
      }
    } catch (err) {
      console.warn('adventure setup', err);
    }
  });
  await sleep(1200);
  await page.evaluate(() => {
    try {
      if (typeof game !== 'undefined' && game && game.player) {
        game.player.x = Math.max(80, (typeof W !== 'undefined' ? W : 800) * 0.25);
      }
    } catch (_) {}
  });
  await sleep(400);
}

async function setupVersusReady(page) {
  await page.evaluate(() => {
    try {
      if (typeof recoverToMenu === 'function') recoverToMenu({ force: true });
    } catch (_) {}
    if (typeof UI !== 'undefined' && UI.safeOpen) {
      const modeHub = document.getElementById('modeHubScreen');
      if (modeHub) {
        UI.safeOpen('modeHubScreen', () => {});
        return;
      }
      const vs = document.getElementById('charScreen') || document.getElementById('versusScreen');
      if (vs) {
        document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
        vs.classList.add('active');
        return;
      }
    }
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    document.getElementById('menuScreen')?.classList.add('active');
  });
  await sleep(500);
}

async function captureOne(page, vp, scene) {
  await page.setViewport({
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: vp.deviceScaleFactor || 1,
  });
  await page.evaluate(() => {
    try {
      window.dispatchEvent(new Event('resize'));
    } catch (_) {}
    try {
      if (typeof resizeCanvas === 'function') resizeCanvas();
    } catch (_) {}
  });
  await sleep(200);
  await scene.setup(page);
  const file = path.join(outDir, `${vp.id}__${scene.id}.png`);
  await page.screenshot({ path: file, type: 'png', fullPage: false });
  const size = fs.statSync(file).size;
  console.log('OK', path.relative(root, file), `(${size} bytes)`, scene.label);
  return file;
}

async function run() {
  fs.mkdirSync(outDir, { recursive: true });
  const keep = path.join(defaultOut, '.gitkeep');
  if (outDir === defaultOut && !fs.existsSync(keep)) {
    fs.writeFileSync(keep, '');
  }

  let server = null;
  try {
    server = await ensureSmokeServer(8787);
  } catch (_) {}

  const base = process.argv[2] || smokeBaseUrl(8787, '/index.html');
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--window-size=1920,1080',
    ],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  await page.goto(base, { waitUntil: 'load', timeout: 45000 });
  await waitBoot(page);

  const written = [];
  for (const vp of VIEWPORTS) {
    for (const scene of SCENES) {
      try {
        written.push(await captureOne(page, vp, scene));
      } catch (err) {
        console.error('CAPTURE_WARN', vp.id, scene.id, err && err.message ? err.message : err);
      }
    }
  }

  await browser.close();
  if (server) server.close();

  if (!written.length) {
    console.error('CAPTURE_FAIL no screenshots written');
    process.exit(1);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    base,
    outDir,
    count: written.length,
    files: written.map((f) => path.basename(f)),
  };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('CAPTURE_OK', written.length, '→', outDir);
}

run().catch((err) => {
  console.error('CAPTURE_FAIL', err);
  process.exit(1);
});
