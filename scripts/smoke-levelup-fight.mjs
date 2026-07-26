#!/usr/bin/env node
/** Mid-fight Lv-up (knuppel @7): grantXP + loop frames must not freeze input. */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = '/tmp/sf-lvlup';
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
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8787/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 20000 });

  const result = await page.evaluate(() => {
    startGame('adventure', { level: 1, gamble: null });
    const g = game;
    if (!g || !g.player) return { ok: false, why: 'no game' };
    save.lvl = 6;
    save.xp = xpNeed(6) - 1;
    g.inputLocked = false;
    g.over = false;
    try { g.grantXP(50); } catch (e) { return { ok: false, why: 'grantXP:' + String(e) }; }
    const afterLvl = save.lvl;
    let frames = 0;
    for (let i = 0; i < 40; i++) {
      try { g.update(1 / 60); frames++; } catch (_) {}
    }
    const bannerHasKnuppel = (g.banners || []).some((b) => String(b.text || '').toLowerCase().includes('knuppel')
      || String(b.text || '').toLowerCase().includes('club'));
    return {
      ok: afterLvl >= 7 && !g.inputLocked && !g.over && state === 'play' && frames === 40,
      afterLvl,
      inputLocked: g.inputLocked,
      state,
      frames,
      bannerHasKnuppel,
    };
  });

  await browser.close();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('SMOKE_OK levelup-fight');
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
