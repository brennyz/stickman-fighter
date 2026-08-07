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
      if (typeof satanHeatTier !== 'function' || satanHeatTier(9) !== 'danger') {
        throw new Error('satanHeatTier(9) should be danger');
      }
      if (satanHeatTier(10) !== 'satan') throw new Error('satanHeatTier(10) should be satan');
      if (!satanHeatForLevel) throw new Error('satanHeatForLevel missing');

      save.advFails = save.advFails || {};
      save.advFails[1] = 9;
      save.advSatanAt = {};
      persist();
      const heat9 = satanHeatForLevel(1);
      if (!heat9.bang || heat9.tier !== 'danger' || !heat9.danger) {
        throw new Error('heat at 9 fails not danger: ' + JSON.stringify(heat9));
      }
      if (typeof UI !== 'undefined' && typeof renderAdvHeatMeter === 'function') {
        const html = renderAdvHeatMeter(heat9);
        if (!html.includes('adv-heat') || !html.includes('adv-heat-bang') || !html.includes('!')) {
          throw new Error('heat meter HTML missing danger bang');
        }
        UI.advIslandPick = 1;
        try { UI.renderLevels(); } catch (e) { throw new Error('renderLevels: ' + e); }
        const info = document.getElementById('levelIslandInfo');
        if (!info || !info.innerHTML.includes('adv-heat')) {
          throw new Error('levelIslandInfo missing heat meter');
        }
        if (!info.innerHTML.includes('adv-heat-bang')) {
          throw new Error('levelIslandInfo missing danger bang at 9 fails');
        }
        if (!info.innerHTML.includes('adv-satan-card') || !info.innerHTML.includes('satan.svg')) {
          throw new Error('levelIslandInfo missing Satan portrait card/svg');
        }
      }

      save.advFails[1] = 10;
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
      const minHalf = Math.min(W, H) * 0.15;
      if (!(mon.size >= minHalf) || mon.size < 70) {
        throw new Error('Satan not half-screen sized: ' + mon.size + ' vs min ' + minHalf);
      }
      if (typeof satanCombatSize !== 'function') throw new Error('satanCombatSize missing');
      if (typeof SATAN_SVG_URL !== 'string' || !SATAN_SVG_URL.includes('satan.svg')) {
        throw new Error('SATAN_SVG_URL missing');
      }
      try { ensureSatanSvg(); } catch (e) { throw new Error('ensureSatanSvg: ' + e); }
      try { refreshSatanCombatScale(game); } catch (e) { throw new Error('refreshSatanCombatScale: ' + e); }

      // Nightmare/Hell per-diff fails bag
      if (typeof ensureAdvHardBag === 'function') {
        save.advCleared = save.advCleared || {};
        save.advCleared.normal = true;
        const bag = ensureAdvHardBag('nightmare');
        bag.fails = bag.fails || {};
        bag.fails[1] = 10;
        bag.satanAt = {};
        persist();
        if (!shouldTriggerSatan(1, 'nightmare')) throw new Error('nightmare satan trigger failed');
      }

      // After-clear card still explains Satan
      save.advCleared = save.advCleared || {};
      save.advCleared.normal = true;
      save.advFails[2] = 0;
      persist();
      UI.advIslandPick = 1;
      try { UI.renderLevels(); } catch (e) { throw new Error('renderLevels after-clear: ' + e); }
      const info2 = document.getElementById('levelIslandInfo');
      if (!info2 || !info2.innerHTML.includes('adv-satan-card')) {
        throw new Error('after-clear missing satan card');
      }
      const blurb = typeof advDiffBlurb === 'function' ? advDiffBlurb('normal') : '';
      if (!blurb || blurb.indexOf('Satan') < 0 && blurb.indexOf('Hitte') < 0 && blurb.indexOf('Heat') < 0) {
        // NL/EN both mention Hitte/Satan or Heat/Satan
        if (!/Satan|Hitte|Heat/i.test(blurb)) throw new Error('diff blurb missing after-clear satan hint: ' + blurb);
      }

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
        heatTier9: heat9.tier,
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
