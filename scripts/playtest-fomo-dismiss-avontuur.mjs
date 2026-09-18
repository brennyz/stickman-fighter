#!/usr/bin/env node
/**
 * PLAYTEST BOT 2/9 extra: landscape FOMO dismiss (×) → Avontuur pointer tap.
 * 844×390 only. Findings — no game-code changes.
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.SF_FOMO_DISMISS_PORT || 8799);
const liveBase = process.env.SF_LIVE_BASE || 'https://brennyz.github.io/stickman-fighter';
const outDir = path.join(root, 'docs/playtest/bot2-landscape-home');
const artDir = '/opt/cursor/artifacts/screenshots';
const tmpDir = '/tmp/sf-playtest-land-home';
for (const dir of [outDir, artDir, tmpDir]) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
}

async function getPuppeteer() {
  try { return await import('puppeteer-core'); } catch (_) {
    await new Promise((res, rej) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], { cwd: tmpDir, stdio: 'inherit' });
      p.on('exit', (c) => (c === 0 ? res() : rej(new Error('npm puppeteer-core'))));
    });
    return import(path.join(tmpDir, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'));
  }
}

async function shot(page, name) {
  const buf = await page.screenshot({ type: 'png', fullPage: false });
  for (const dir of [outDir, artDir]) {
    try { fs.writeFileSync(path.join(dir, name), buf); } catch (_) {}
  }
  return name;
}

async function pointerTap(page, sel, padY) {
  const box = await page.evaluate((id, yPad) => {
    const el = document.getElementById(id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return null;
    return {
      x: r.left + r.width / 2,
      y: r.top + Math.min(yPad || 18, r.height / 2),
      w: Math.round(r.width),
      h: Math.round(r.height),
      left: Math.round(r.left),
      top: Math.round(r.top),
    };
  }, sel, padY);
  if (!box) return { ok: false, sel };
  await page.mouse.click(box.x, box.y, { delay: 40 });
  await new Promise((r) => setTimeout(r, 350));
  return { ok: true, sel, box };
}

async function snap(page) {
  return page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const st = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        top: Math.round(r.top), left: Math.round(r.left),
        right: Math.round(r.right), bottom: Math.round(r.bottom),
        w: Math.round(r.width), h: Math.round(r.height),
        visibility: st.visibility, pointerEvents: st.pointerEvents,
        painted: st.display !== 'none' && st.visibility !== 'hidden' && Number(st.opacity) > 0.2,
      };
    };
    const fomo = document.getElementById('fomoRitual');
    const play = document.getElementById('btnAdventure');
    const chrome = document.querySelector('#menuScreen .menu-chrome');
    const x = document.getElementById('fomoRitualDismiss');
    const fomoCs = fomo ? getComputedStyle(fomo) : null;
    return {
      vw: window.innerWidth,
      vh: window.innerHeight,
      app: typeof APP_VERSION !== 'undefined' ? APP_VERSION : null,
      sw: typeof SW_CACHE_REV !== 'undefined' ? SW_CACHE_REV : null,
      menu: !!(document.getElementById('menuScreen') && document.getElementById('menuScreen').classList.contains('active')),
      fomoOpen: !!(fomo && !fomo.hidden && fomoCs && fomoCs.display !== 'none'),
      chromeInert: !!(chrome && chrome.hasAttribute('inert')),
      playInert: !!(play && play.closest('[inert]')),
      play: box(play),
      dismiss: box(x),
      playing: !!(document.body.classList.contains('is-playing') || document.body.dataset.state === 'play'),
      level: !!(document.getElementById('levelScreen') && document.getElementById('levelScreen').classList.contains('active')),
    };
  });
}

async function bootHome(page, base) {
  await page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(`${base.replace(/\/$/, '')}/index.html`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 45000 });
  await page.evaluate(() => {
    try {
      if (typeof enterHubFromTitle === 'function') enterHubFromTitle({});
      else if (typeof dismissSplashOverlay === 'function') dismissSplashOverlay();
    } catch (_) {}
    const splash = document.getElementById('sfSplash');
    if (splash) {
      splash.classList.add('is-done');
      try { splash.remove(); } catch (_) {}
    }
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    const menu = document.getElementById('menuScreen');
    if (menu) menu.classList.add('active');
    if (typeof UI === 'object' && UI) {
      try { if (UI.renderMenu) UI.renderMenu(); } catch (_) {}
      UI._fomoRitualHide = true;
      UI._fomoRitualForce = false;
      if (UI.hideFomoRitual) UI.hideFomoRitual();
    }
  });
  await page.waitForSelector('#menuScreen.active', { timeout: 8000 });
}

async function forceFomo(page) {
  await page.evaluate(() => {
    if (typeof UI === 'object' && UI) {
      UI._fomoRitualHide = false;
      UI._fomoRitualForce = true;
      if (UI.showFomoRitual) UI.showFomoRitual(true);
    }
  });
  await page.waitForFunction(() => {
    const el = document.getElementById('fomoRitual');
    return !!(el && !el.hidden);
  }, { timeout: 4000 });
}

async function runPath(browser, base, label) {
  const page = await browser.newPage();
  const issues = [];
  const note = (sev, id, text, extra) => issues.push({ sev, id, text, extra });
  try {
    await bootHome(page, base);
    await forceFomo(page);
    const open = await snap(page);
    const openShot = await shot(page, `${label}-dismiss-1-fomo-open.png`);
    if (!open.fomoOpen) note('P1', 'fomo-miss', 'Vandaag did not open', open);
    if (!open.play || !open.play.painted) note('P0', 'play-hidden', 'Avontuur hidden under FOMO', open);
    if (open.chromeInert !== true) note('P2', 'no-inert', 'Expected inert while FOMO open', open);

    const xTap = await pointerTap(page, 'fomoRitualDismiss', 16);
    const afterX = await snap(page);
    const afterXShot = await shot(page, `${label}-dismiss-2-after-x.png`);
    if (afterX.fomoOpen) note('P1', 'x-no-close', 'Pointer tap on × did not close Vandaag', { xTap, afterX });
    if (afterX.chromeInert || afterX.playInert) {
      note('P1', 'inert-stuck', 'HOME chrome still inert after × dismiss', afterX);
    }
    if (!afterX.play || !afterX.play.painted || afterX.play.h < 44) {
      note('P0', 'play-after-x', 'Avontuur not fully visible after dismiss', afterX);
    }
    if (afterX.play && afterX.play.pointerEvents === 'none') {
      note('P1', 'pe-none', 'Avontuur pointer-events:none after dismiss', afterX);
    }

    const advTap = await pointerTap(page, 'btnAdventure', 22);
    const afterAdv = await snap(page);
    const afterAdvShot = await shot(page, `${label}-dismiss-3-avontuur-tap.png`);
    const started = !!(afterAdv.playing || afterAdv.level);
    if (!started) note('P0', 'adv-no-start', 'After × dismiss, Avontuur pointer tap did not start play', { advTap, afterAdv });

    return {
      label, issues,
      open: { ...open, shot: openShot },
      afterX: { ...afterX, shot: afterXShot, xTap },
      afterAdv: { ...afterAdv, shot: afterAdvShot, advTap, started },
    };
  } finally {
    await page.close();
  }
}

async function run() {
  const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
  if (!chrome) throw new Error('google-chrome missing');
  let server = null;
  try { server = await ensureSmokeServer(port); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=844,390'],
  });
  const localBase = smokeBaseUrl(port, '').replace(/\/$/, '');
  try {
    const local = await runPath(browser, localBase, 'local');
    let live = null;
    try { live = await runPath(browser, liveBase, 'live'); } catch (err) {
      live = { error: String(err) };
    }
    const issues = [...local.issues, ...((live && live.issues) || [])];
    const p0 = issues.filter((i) => i.sev === 'P0').length;
    const p1 = issues.filter((i) => i.sev === 'P1').length;
    const report = {
      bot: '2/9 extra',
      focus: 'FOMO × dismiss → Avontuur tap @ 844×390',
      at: new Date().toISOString(),
      verdict: p0 ? 'FAIL-P0' : (p1 ? 'FAIL-P1' : 'PASS'),
      p0, p1,
      issues: issues.map((i) => `${i.sev} ${i.id}: ${i.text}`),
      local, live,
    };
    fs.writeFileSync(path.join(outDir, 'dismiss-path.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      verdict: report.verdict, p0, p1, issues: report.issues,
      localStarted: local.afterAdv && local.afterAdv.started,
      liveStarted: live && live.afterAdv && live.afterAdv.started,
      localApp: local.open && local.open.app,
    }, null, 2));
    if (p0) process.exitCode = 2;
  } finally {
    await browser.close();
    if (server) try { server.close(); } catch (_) {}
  }
}

run().catch((err) => {
  console.error('PLAYTEST_FAIL fomo-dismiss-avontuur', err);
  process.exit(1);
});
