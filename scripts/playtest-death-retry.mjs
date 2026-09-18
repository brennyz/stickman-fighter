#!/usr/bin/env node
/**
 * PLAYTEST BOT 5/9 — DEATH→RETRY (LIVE v1.18.190 / SW 400)
 * Portrait + landscape: die → fat Nog één keer <3s → same-level rematch → killer tip.
 * Versus out. Draft measurements only.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const outDir = process.env.SF_PLAYTEST_OUT || '/tmp/sf-playtest-5';
const shotDir = process.env.SF_PLAYTEST_SHOTS || '/opt/cursor/artifacts/screenshots';
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(shotDir, { recursive: true });

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.error('PLAYTEST_FAIL no chrome'); process.exit(1); }

function fail(msg, extra) {
  console.error('PLAYTEST_FAIL', msg);
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

function clipInfo(el, vw, vh) {
  if (!el) return null;
  return {
    x: Math.round(el.x),
    y: Math.round(el.y),
    w: Math.round(el.width),
    h: Math.round(el.height),
    offLeft: el.x < -2,
    offRight: el.x + el.width > vw + 2,
    offTop: el.y < -2,
    offBottom: el.y + el.height > vh + 2,
  };
}

async function measureResult(page, t0) {
  return page.evaluate((t0) => {
    const again = document.getElementById('resAgain');
    const safe = document.getElementById('resRetrySafe');
    const rs = document.getElementById('resultScreen');
    const tip = document.getElementById('resTip');
    const killer = document.getElementById('resKiller');
    const title = document.getElementById('resTitle');
    const menu = document.getElementById('resMenu');
    const flash = document.getElementById('levelRollFlash');
    const fomo = document.getElementById('fomoRitual');
    const dock = document.getElementById('resCtaDock');
    const aRect = again ? again.getBoundingClientRect() : null;
    const kRect = killer && !killer.hidden ? killer.getBoundingClientRect() : null;
    const tRect = tip ? tip.getBoundingClientRect() : null;
    const mRect = menu ? menu.getBoundingClientRect() : null;
    const dRect = dock ? dock.getBoundingClientRect() : null;
    const titleRect = title ? title.getBoundingClientRect() : null;
    const cs = again ? getComputedStyle(again) : null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const overflow = [];
    const check = (name, r) => {
      if (!r) return;
      if (r.bottom > vh + 2) overflow.push(name + ':below');
      if (r.top < -2) overflow.push(name + ':above');
      if (r.right > vw + 2) overflow.push(name + ':right');
      if (r.left < -2) overflow.push(name + ':left');
    };
    check('again', aRect);
    check('killer', kRect);
    check('tip', tRect);
    check('menu', mRect);
    check('title', titleRect);
    check('dock', dRect);
    return {
      delayMs: Math.round(performance.now() - t0),
      state: typeof state !== 'undefined' ? state : null,
      version: (typeof APP_VERSION !== 'undefined') ? APP_VERSION : null,
      sw: (typeof SW_CACHE_REV !== 'undefined') ? SW_CACHE_REV : null,
      label: again && again.querySelector('div') ? again.querySelector('div').textContent.trim() : '',
      loseRetry: !!(rs && rs.classList.contains('lose-retry')),
      isLose: !!(rs && rs.classList.contains('is-lose')),
      isAdventure: !!(rs && rs.classList.contains('is-adventure')),
      juice: !!(again && again.classList.contains('juice-cta-primary')),
      againH: aRect ? Math.round(aRect.height) : 0,
      againW: aRect ? Math.round(aRect.width) : 0,
      againY: aRect ? Math.round(aRect.y) : 0,
      minHeight: cs ? cs.minHeight : '',
      bg: cs ? cs.backgroundImage.slice(0, 80) : '',
      tip: tip ? tip.textContent : '',
      killer: killer && !killer.hidden ? killer.textContent : '',
      title: title ? title.textContent : '',
      flashOn: !!(flash && flash.classList.contains('visible')),
      fomo: !!(fomo && !fomo.hidden && getComputedStyle(fomo).display !== 'none'),
      hasSafe: !!safe && !safe.hidden,
      overflow,
      bigTouch: !!(document.body && document.body.classList.contains('big-touch')),
      vw, vh,
    };
  }, t0);
}

async function seedLose(page, level, opts) {
  return page.evaluate((level, opts) => {
    try { if (typeof UI !== 'undefined' && UI.hideFomoRitual) UI.hideFomoRitual(); } catch (_) {}
    try { if (typeof save !== 'undefined' && save) save.feltFirstPunch = true; } catch (_) {}
    startGame('adventure', { level: level, gamble: null });
    const g = game;
    if (!g || !g.player) return { ok: false, why: 'no game' };
    g.lastFailTele = opts.failTele || 'slam';
    g.lastHurtBy = opts.hurt || { name: 'SlamToad', slam: true, type: 'tank' };
    if (opts.realHit && g.player && typeof g.player.takeDamage === 'function') {
      try {
        const dummy = (g.monsters && g.monsters[0]) || { name: 'SlamToad', sp: { type: 'tank', name: 'SlamToad' }, flying: false };
        g.player.hp = 1;
        g.player.takeDamage(999, dummy);
      } catch (e) {
        try { g.finishAdventure(false); } catch (e2) { return { ok: false, why: String(e2) }; }
      }
    } else {
      try { g.finishAdventure(false); } catch (e) { return { ok: false, why: String(e) }; }
    }
    return {
      ok: true,
      t0: performance.now(),
      over: !!g.over,
      loseMs: (typeof combatLoseResultMs === 'function') ? combatLoseResultMs() : null,
      showMs: (typeof resultShowDelayMs === 'function') ? resultShowDelayMs(false, 'adventure') : null,
      level: g.level && g.level.n,
    };
  }, level, opts);
}

async function runViewport(browser, base, vp) {
  const page = await browser.newPage();
  await page.setViewport({
    width: vp.w, height: vp.h, deviceScaleFactor: vp.mobile ? 2 : 1,
    isMobile: !!vp.mobile, hasTouch: !!vp.mobile,
  });
  if (vp.mobile) {
    await page.emulate({
      viewport: { width: vp.w, height: vp.h, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    });
  }
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 20000 });

  const seeded = await seedLose(page, vp.level || 1, {
    failTele: vp.failTele || 'slam',
    hurt: vp.hurt || { name: 'SlamToad', slam: true, type: 'tank' },
    realHit: !!vp.realHit,
  });
  if (!seeded.ok) fail(vp.id + ' seed failed', seeded);

  const shown = await page.waitForFunction(() => {
    return typeof state !== 'undefined' && state === 'result'
      && document.getElementById('resultScreen')
      && document.getElementById('resultScreen').classList.contains('active');
  }, { timeout: 3500 }).then(() => true).catch(() => false);
  if (!shown) fail(vp.id + ' result screen did not appear in 3.5s');

  const ui = await measureResult(page, seeded.t0);
  const shotA = path.join(shotDir, `playtest5-${vp.id}-result.png`);
  await page.screenshot({ path: shotA, fullPage: false });
  fs.copyFileSync(shotA, path.join(outDir, `${vp.id}-result.png`));

  const checks = {
    under3s: ui.delayMs < 3000,
    fat: ui.againH >= (vp.minFat || 64),
    gold: /linear-gradient/i.test(ui.bg || ''),
    label: /nog één keer|one more|noch einmal|encore une fois|una más|una vez/i.test(ui.label),
    loseRetry: !!ui.loseRetry,
    killer: /slamtoad|slam/i.test(ui.killer || ui.title || ''),
    cueTip: /SLAM|CHARGE|vlieger|flyer|SCHIET|VUUR|slam/i.test(ui.tip || ''),
    retryWord: /nog één keer|one more|noch einmal|encore|una más/i.test(ui.tip || ''),
    noFomo: !ui.fomo,
    noDice: !ui.flashOn,
    noOverflow: (ui.overflow || []).length === 0,
    hasSafe: !!ui.hasSafe,
  };

  const after = await page.evaluate(() => {
    const t1 = performance.now();
    const btn = document.getElementById('resAgain');
    if (btn) btn.click();
    return t1;
  });
  const playing = await page.waitForFunction(() => {
    return typeof state !== 'undefined' && state === 'play' && game && game.player && !game.over;
  }, { timeout: 2500 }).then(() => true).catch(() => false);

  const rematch = playing ? await page.evaluate((t1, expectLevel) => {
    const flash = document.getElementById('levelRollFlash');
    return {
      playMs: Math.round(performance.now() - t1),
      state: typeof state !== 'undefined' ? state : null,
      mode: game && game.mode,
      level: game && game.level && game.level.n,
      over: !!(game && game.over),
      flashOn: !!(flash && flash.classList.contains('visible')),
      sameLevel: game && game.level && game.level.n === expectLevel,
    };
  }, after, vp.level || 1) : { playMs: null, sameLevel: false, flashOn: null };

  checks.rematchPlay = !!playing && rematch.playMs != null && rematch.playMs < 1500;
  checks.sameLevel = !!rematch.sameLevel && rematch.mode === 'adventure';
  checks.rematchNoDice = !rematch.flashOn;

  if (playing) {
    const shotB = path.join(shotDir, `playtest5-${vp.id}-rematch.png`);
    await page.screenshot({ path: shotB, fullPage: false });
    fs.copyFileSync(shotB, path.join(outDir, `${vp.id}-rematch.png`));
  }

  await page.close();
  return {
    id: vp.id,
    w: vp.w,
    h: vp.h,
    delayMs: ui.delayMs,
    loseMs: seeded.loseMs,
    showMs: seeded.showMs,
    againH: ui.againH,
    againW: ui.againW,
    label: ui.label,
    tip: ui.tip,
    killer: ui.killer,
    title: ui.title,
    overflow: ui.overflow,
    playMs: rematch.playMs,
    version: ui.version,
    sw: ui.sw,
    bigTouch: ui.bigTouch,
    checks,
    shots: [shotA],
  };
}

async function run() {
  let server = null;
  try { server = await ensureSmokeServer(8788); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new',
    args: ['--no-sandbox', '--window-size=1280,800'],
  });
  const base = process.argv[2] || smokeBaseUrl(8788);
  const vps = [
    { id: 'phone-portrait-390', w: 390, h: 844, mobile: true, minFat: 72 },
    { id: 'phone-landscape-844', w: 844, h: 390, mobile: true, minFat: 64 },
    { id: 'phone-landscape-realhit', w: 844, h: 390, mobile: true, minFat: 64, realHit: true, failTele: 'charge',
      hurt: { name: 'ChargeBoar', slam: false, type: 'charge' } },
    { id: 'tablet-portrait-834', w: 834, h: 1194, mobile: true, minFat: 64 },
    { id: 'tablet-landscape-1194', w: 1194, h: 834, mobile: true, minFat: 64 },
    { id: 'desktop-1280', w: 1280, h: 800, mobile: false, minFat: 56 },
  ];
  const rows = [];
  try {
    for (const vp of vps) {
      const row = await runViewport(browser, base, vp);
      rows.push(row);
      const failKeys = Object.entries(row.checks).filter(([, v]) => !v).map(([k]) => k);
      console.log('PLAYTEST5', row.id, {
        delayMs: row.delayMs, againH: row.againH, playMs: row.playMs,
        killer: row.killer, tip: (row.tip || '').slice(0, 80),
        overflow: row.overflow, fail: failKeys,
      });
    }
  } finally {
    await browser.close();
    if (server) try { server.close(); } catch (_) {}
  }
  const report = {
    lane: 'PLAYTEST BOT 5/9 DEATH→RETRY',
    build: 'LIVE main c9a29fc v1.18.190 SW400',
    at: new Date().toISOString(),
    rows,
  };
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log('PLAYTEST5_REPORT', path.join(outDir, 'report.json'));
  const hard = rows.filter((r) => !r.checks.under3s || !r.checks.rematchPlay || !r.checks.sameLevel);
  if (hard.length) {
    console.error('PLAYTEST5_HARD_FAIL', hard.map((r) => r.id));
    process.exit(2);
  }
  console.log('PLAYTEST5_OK');
}

run().catch((e) => fail(e && e.message ? e.message : String(e)));
