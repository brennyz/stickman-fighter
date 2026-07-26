#!/usr/bin/env node
/**
 * Smoke: 10× fails → Satan spawn + reflect damage path (headless).
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const outDir = '/tmp/sf-satan';
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
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  const base = process.argv[2] || smokeBaseUrl(8787);
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 20000 });

  const result = await page.evaluate(() => {
    const errors = [];
    try {
      if (typeof shouldTriggerSatan !== 'function') throw new Error('shouldTriggerSatan missing');
      if (typeof SATAN_REFLECT_RATIO !== 'number' || SATAN_REFLECT_RATIO < 0.8) {
        throw new Error('SATAN_REFLECT_RATIO invalid');
      }
      save.advFails = save.advFails || {};
      save.advFails[1] = 10;
      save.advSatanAt = {};
      persist();
      if (!shouldTriggerSatan(1)) throw new Error('shouldTriggerSatan(1) false at 10 fails');

      startGame('adventure', { level: 1 });
      if (!game || !game.satanPending) throw new Error('satanPending not set on start');

      // Skip delay → spawn
      game.satanDelayT = 0;
      game.startSatanEncounter();
      if (!game.satanActive || !game.satanMon) throw new Error('Satan did not spawn');
      const mon = game.satanMon;
      if (!mon.satanBoss || !(mon.reflectRatio > 0)) throw new Error('Satan flags missing');

      const hpBefore = game.player.hp;
      const satanHpBefore = mon.hp;
      mon.takeDamage(40, 100, game, { crit: false });
      const reflected = hpBefore > game.player.hp;
      const satanHurt = mon.hp < satanHpBefore;
      if (!satanHurt) throw new Error('Satan took no damage');
      if (!reflected) throw new Error('Reflect did not damage player');
      const lost = hpBefore - game.player.hp;
      if (lost < 30 || lost > 40) throw new Error('Reflect amount off: ' + lost);

      // Killing blow should not reflect (player HP must not drop)
      mon.hp = 20;
      const hp2 = game.player.hp;
      mon.takeDamage(50, 100, game, {});
      if (mon.alive) throw new Error('Satan should be dead');
      if (game.player.hp < hp2) throw new Error('Killing blow should not reflect');

      return {
        ok: true,
        reflectLost: lost,
        satanHp: mon.maxhp,
        playerMax: game.player.maxhp,
        errors,
      };
    } catch (err) {
      errors.push(String(err && err.message || err));
      return { ok: false, errors };
    }
  });

  await browser.close();
  try { if (server && server.close) server.close(); } catch (_) {}

  if (pageErrors.length) {
    console.error('SMOKE_FAIL pageerrors', pageErrors.slice(0, 5));
    process.exit(1);
  }
  if (!result.ok) {
    console.error('SMOKE_FAIL satan', result);
    process.exit(1);
  }
  console.log('SMOKE_OK satan-encounter', JSON.stringify(result));
}

run().catch((err) => {
  console.error('SMOKE_FAIL', err);
  process.exit(1);
});
