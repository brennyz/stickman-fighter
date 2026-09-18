#!/usr/bin/env node
/**
 * Adventure lose on phone: fail telegraph → Nog één keer, CTA < 3s, instant rematch.
 * Desktop stay 1.0 and still rematch without dice.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const outDir = '/tmp/sf-lose-retry';
fs.mkdirSync(outDir, { recursive: true });
const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.error('SMOKE_FAIL no chrome'); process.exit(1); }

function fail(msg, extra) {
  console.error('SMOKE_FAIL', msg);
  if (extra !== undefined) console.error(extra);
  process.exit(1);
}

async function getPuppeteer() {
  try { return await import('puppeteer-core'); } catch (_) {
    await new Promise((res, rej) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], { cwd: outDir, stdio: 'inherit' });
      p.on('exit', (c) => (c === 0 ? res() : rej(new Error('npm'))));
    });
    return import(path.join(outDir, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'));
  }
}

async function runViewport(browser, base, vp) {
  const page = await browser.newPage();
  await page.setViewport({
    width: vp.w, height: vp.h, deviceScaleFactor: vp.mobile ? 2 : 1,
    isMobile: !!vp.mobile, hasTouch: !!vp.mobile,
  });
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 20000 });

  const seeded = await page.evaluate((level) => {
    try { if (typeof UI !== 'undefined' && UI.hideFomoRitual) UI.hideFomoRitual(); } catch (_) {}
    startGame('adventure', { level: level, gamble: null });
    const g = game;
    if (!g || !g.player) return { ok: false, why: 'no game' };
    const dens = (typeof combatDensityProfile === 'function') ? combatDensityProfile() : null;
    g.lastFailTele = 'slam';
    const t0 = performance.now();
    try { g.finishAdventure(false); } catch (e) { return { ok: false, why: String(e) }; }
    return {
      ok: true, t0, dens, loseMs: (typeof combatLoseResultMs === 'function') ? combatLoseResultMs() : null,
      over: !!g.over,
    };
  }, 1);
  if (!seeded.ok) fail(vp.id + ' seed failed', seeded);

  const shown = await page.waitForFunction(() => {
    return typeof state !== 'undefined' && state === 'result'
      && document.getElementById('resultScreen')
      && document.getElementById('resultScreen').classList.contains('active');
  }, { timeout: 3500 }).then(() => true).catch(() => false);
  if (!shown) fail(vp.id + ' result screen did not appear in 3.5s');

  const ui = await page.evaluate((t0) => {
    const again = document.getElementById('resAgain');
    const rs = document.getElementById('resultScreen');
    const tip = document.getElementById('resTip');
    const flash = document.getElementById('levelRollFlash');
    const rect = again ? again.getBoundingClientRect() : null;
    return {
      delayMs: Math.round(performance.now() - t0),
      state: typeof state !== 'undefined' ? state : null,
      label: again && again.querySelector('div') ? again.querySelector('div').textContent.trim() : '',
      loseRetry: !!(rs && rs.classList.contains('lose-retry')),
      againH: rect ? Math.round(rect.height) : 0,
      tip: tip ? tip.textContent : '',
      flashOn: !!(flash && flash.classList.contains('visible')),
      fomo: !!(document.getElementById('fomoRitual') && !document.getElementById('fomoRitual').hidden),
    };
  }, seeded.t0);

  if (ui.delayMs >= 3000) fail(vp.id + ' death→CTA must be under 3s', ui);
  if (!ui.loseRetry) fail(vp.id + ' resultScreen missing lose-retry', ui);
  if (!/nog één keer|one more time|noch einmal|encore une fois|una vez más/i.test(ui.label)) {
    fail(vp.id + ' retry label must be Nog één keer (or locale)', ui);
  }
  if (vp.mobile && ui.againH < 64) fail(vp.id + ' retry button not fat enough', ui);
  if (!/SLAM|CHARGE|vlieger|flyer|Nog één keer|One more time/i.test(ui.tip)) {
    fail(vp.id + ' tip must name fail cue or retry', ui);
  }
  if (ui.fomo) fail(vp.id + ' FOMO should hide on result', ui);

  const after = await page.evaluate(() => {
    const t1 = performance.now();
    const btn = document.getElementById('resAgain');
    if (btn) btn.click();
    return t1;
  });
  const playing = await page.waitForFunction(() => {
    return typeof state !== 'undefined' && state === 'play' && game && game.player && !game.over;
  }, { timeout: 2500 }).then(() => true).catch(() => false);
  if (!playing) fail(vp.id + ' rematch did not return to play', { after });

  const rematch = await page.evaluate((t1) => {
    const flash = document.getElementById('levelRollFlash');
    const dens = (typeof combatDensityProfile === 'function') ? combatDensityProfile() : null;
    return {
      playMs: Math.round(performance.now() - t1),
      state: typeof state !== 'undefined' ? state : null,
      mode: game && game.mode,
      level: game && game.level && game.level.n,
      over: !!(game && game.over),
      flashOn: !!(flash && flash.classList.contains('visible')),
      scale: dens && dens.scale,
      maxAlive: dens && dens.maxAlive,
    };
  }, after);

  if (rematch.playMs >= 1500) fail(vp.id + ' rematch click→play too slow (dice?)', rematch);
  if (rematch.mode !== 'adventure' || rematch.level !== 1) fail(vp.id + ' rematch not same adventure level', rematch);
  if (rematch.flashOn) fail(vp.id + ' dice flash must stay off on lose rematch', rematch);
  if (vp.expectScale != null && rematch.scale !== vp.expectScale) {
    fail(vp.id + ' density scale drifted', rematch);
  }
  if (vp.expectMaxAlive != null && rematch.maxAlive !== vp.expectMaxAlive) {
    fail(vp.id + ' maxAlive drifted', rematch);
  }

  await page.close();
  return {
    id: vp.id,
    delayMs: ui.delayMs,
    againH: ui.againH,
    label: ui.label,
    tip: ui.tip,
    playMs: rematch.playMs,
    scale: rematch.scale,
    maxAlive: rematch.maxAlive,
    loseMs: seeded.loseMs,
  };
}

async function run() {
  let server = null;
  try { server = await ensureSmokeServer(8788); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=1280,800'],
  });
  const base = process.argv[2] || smokeBaseUrl(8788);
  try {
    const phone = await runViewport(browser, base, {
      id: 'phone-390', w: 390, h: 844, mobile: true, expectScale: 0.5, expectMaxAlive: 12,
    });
    const desk = await runViewport(browser, base, {
      id: 'desktop-1280', w: 1280, h: 800, mobile: false, expectScale: 1, expectMaxAlive: 78,
    });
    if (phone.delayMs >= desk.delayMs + 50) fail('phone lose CTA should not be slower than desktop', { phone, desk });
    console.log('LOSE_RETRY', { phone, desk });
    console.log('SMOKE_OK lose-retry');
  } finally {
    await browser.close();
    if (server) try { server.close(); } catch (_) {}
  }
}

run().catch((e) => fail(e && e.message ? e.message : String(e)));
