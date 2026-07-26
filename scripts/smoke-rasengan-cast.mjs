#!/usr/bin/env node
/** Rasengan cast: geen ReferenceError (jb/jutsu regressie), orb beweegt. */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = '/tmp/sf-rasengan';
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
  const base = process.argv[2] || 'http://127.0.0.1:8787/index.html';
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });

  const result = await page.evaluate(() => {
    const DT = 1 / 30;
    startGame('adventure', { level: 1, gamble: null });
    const g = game;
    const p = g.player;
    p.energy = 100;
    p.x = 200;
    g.inputLocked = false;
    const errors = [];
    const cast = () => {
      p.startAttack('special', g);
      for (let i = 0; i < 40; i++) {
        try { g.update(DT); } catch (e) { errors.push('update:' + e); }
        if (p.attack?.fired) break;
      }
    };
    cast();
    const afterFirst = g.projectiles.filter((x) => x.kind === 'rasengan' && x.from === 'player').length;
    const x0 = g.projectiles.find((x) => x.kind === 'rasengan')?.x;
    for (let i = 0; i < 30; i++) {
      try { g.update(DT); } catch (e) { errors.push('tick:' + e); }
    }
    const orb = g.projectiles.find((x) => x.kind === 'rasengan' && x.from === 'player');
    const moved = orb && x0 != null && Math.abs(orb.x - x0) > 8;
    p.energy = 100;
    cast();
    const afterSecond = g.projectiles.filter((x) => x.kind === 'rasengan' && x.from === 'player').length;
    return {
      ok: errors.length === 0 && afterFirst >= 1 && moved && afterSecond >= 1,
      errors: errors.slice(0, 5),
      afterFirst,
      afterSecond,
      moved,
      orbX: orb?.x,
      x0,
      orbVx: orb?.vx,
    };
  });

  await browser.close();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('SMOKE_OK rasengan-cast');
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
