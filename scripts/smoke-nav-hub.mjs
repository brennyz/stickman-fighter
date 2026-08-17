#!/usr/bin/env node
/** Arcade fight exits land on Arcade hub; adventure still lands on KIES JE PAD. */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const outDir = '/tmp/sf-nav-hub';
fs.mkdirSync(outDir, { recursive: true });
const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.error('SMOKE_FAIL no chrome'); process.exit(1); }

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
  try { server = await ensureSmokeServer(8787); } catch (_) {}

  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  const base = process.argv[2] || smokeBaseUrl(8787);
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 20000 });

  const result = await page.evaluate(() => {
    const snap = () => {
      const menu = document.getElementById('menuScreen');
      const hub = document.getElementById('modeHubScreen');
      return {
        menu: !!(menu && menu.classList.contains('active')),
        hub: !!(hub && hub.classList.contains('active')),
        hubId: (typeof UI !== 'undefined' && UI.modeHubId) || '',
      };
    };
    try {
      startGame('training');
      if (!game || game.mode !== 'training') return { ok: false, why: 'training not started' };
      UI.goMenu({ fromPlay: true });
      const afterTrain = snap();
      if (!afterTrain.hub || afterTrain.menu || afterTrain.hubId !== 'arcade') {
        return { ok: false, why: 'training fromPlay did not land on arcade hub', afterTrain };
      }

      startGame('wall');
      UI.goMenu({ hub: 'arcade' });
      const afterWall = snap();
      if (!afterWall.hub || afterWall.hubId !== 'arcade') {
        return { ok: false, why: 'wall hub:arcade did not land on arcade hub', afterWall };
      }

      startGame('adventure', { level: 1, gamble: null });
      if (!game || game.mode !== 'adventure') return { ok: false, why: 'adventure not started' };
      UI.goMenu({ fromPlay: true });
      const afterAdv = snap();
      if (!afterAdv.menu || afterAdv.hub) {
        return { ok: false, why: 'adventure fromPlay should land on landing', afterAdv };
      }

      UI.lastResult = { mode: 'training', win: true };
      UI.goMenu();
      const leftover = snap();
      if (!leftover.menu || leftover.hub) {
        return { ok: false, why: 'plain goMenu must ignore leftover lastResult', leftover };
      }

      return { ok: true, afterTrain, afterWall, afterAdv, leftover };
    } catch (e) {
      return { ok: false, why: String(e && e.stack || e) };
    }
  });

  await browser.close();
  if (server) server.close();

  if (!result.ok) {
    console.error('SMOKE_FAIL nav-hub', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('SMOKE_OK nav-hub', JSON.stringify(result));
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
