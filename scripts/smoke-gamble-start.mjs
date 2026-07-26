#!/usr/bin/env node
/** Smoke: dice roll must actually start adventure from menu-continue and level-tap. */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = '/tmp/sf-gamble-smoke';
fs.mkdirSync(outDir, { recursive: true });

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome', '/usr/bin/chromium-browser']
  .find((p) => fs.existsSync(p));
if (!chrome) {
  console.error('SMOKE_FAIL no chrome');
  process.exit(1);
}

async function getPuppeteer() {
  try {
    return await import('puppeteer-core');
  } catch (_) {
    await new Promise((resolve, reject) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], { cwd: outDir, stdio: 'inherit' });
      p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('npm install failed'))));
    });
    return import(path.join(outDir, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'));
  }
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
  const page = await browser.newPage();
  const base = process.argv[2] || smokeBaseUrl(8787);
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted && typeof gokGooiStartLevel === 'function', { timeout: 20000 });

  const dump = async (label) => page.evaluate((label) => {
    const flash = document.getElementById('levelRollFlash');
    return {
      label,
      state: typeof state !== 'undefined' ? state : null,
      hasGame: !!(typeof game !== 'undefined' && game && game.player),
      levelActive: !!document.getElementById('levelScreen')?.classList.contains('active'),
      menuActive: !!document.getElementById('menuScreen')?.classList.contains('active'),
      gamblePending: typeof gamblePending === 'function' ? gamblePending() : null,
      flashVisible: !!(flash && flash.classList.contains('visible')),
    };
  }, label);

  const fails = [];

  // Case 1: level screen tap path
  await page.evaluate(() => {
    UI.safeOpen('levelScreen', () => UI.renderLevels());
    gokGooiStartLevel(1);
  });
  await new Promise((r) => setTimeout(r, 600));
  const levelTap = await dump('level-tap');
  if (levelTap.state !== 'play' || !levelTap.hasGame) fails.push('level-tap:' + JSON.stringify(levelTap));

  await page.evaluate(() => { try { recoverToMenu({ force: true }); } catch (_) {} });
  await new Promise((r) => setTimeout(r, 200));

  // Case 2: continue from menu (resume path)
  await page.evaluate(() => {
    save.lastPlay = { mode: 'adventure', level: 1 };
    gokGooiStartLevel(1);
  });
  await new Promise((r) => setTimeout(r, 600));
  const menuContinue = await dump('menu-continue');
  if (menuContinue.state !== 'play' || !menuContinue.hasGame) fails.push('menu-continue:' + JSON.stringify(menuContinue));

  // Case 3: result screen again
  await page.evaluate(() => { try { recoverToMenu({ force: true }); } catch (_) {} });
  await new Promise((r) => setTimeout(r, 200));
  await page.evaluate(() => {
    state = 'result';
    game = { mode: 'adventure', over: true, player: {} };
    UI.lastResult = { mode: 'adventure', level: 1, win: true };
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    document.getElementById('resultScreen')?.classList.add('active');
    gokGooiStartLevel(1);
  });
  await new Promise((r) => setTimeout(r, 600));
  const resultAgain = await dump('result-again');
  if (resultAgain.state !== 'play' || !resultAgain.hasGame) fails.push('result-again:' + JSON.stringify(resultAgain));

  if (fails.length) {
    console.error('SMOKE_FAIL', fails.join(' | '));
    await browser.close();
    process.exit(1);
  }

  console.log('SMOKE_OK gamble-start', JSON.stringify({ levelTap, menuContinue }));
  await browser.close();
  if (server) server.close();
}

run().catch((err) => {
  console.error('SMOKE_FAIL', err);
  process.exit(1);
});
