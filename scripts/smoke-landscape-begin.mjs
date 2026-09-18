#!/usr/bin/env node
/**
 * P0: Begin/HOME landscape — SPELEN / Play CTA fully visible + tappable (≥44px).
 * Viewports: 844×390 landscape phone + 390×844 portrait (no regress).
 * Versus stays retired. Share URL remains speel.html.
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

must(/P0 landscape begin: title-gate \+ HOME SPELEN/.test(css),
  'missing P0 landscape begin title-gate block');
must(/grid-template-columns:\s*minmax\(0,\s*1\.2fr\)\s+minmax\(220px,\s*40vw\)/.test(css),
  'title-gate landscape must be vista | SPELEN columns');
must(/max\(48px,\s*env\(safe-area-inset-right/.test(css),
  'landscape begin must letterbox Android nav (48px / safe-area-right)');
must(/--sf-land-gutter-right:/.test(css),
  'missing --sf-land-gutter-right token');
must(/#menuScreen\.menu-video-overhaul \.menu-chrome \{[\s\S]{0,220}grid-template-columns:\s*minmax\(140px,\s*28%\)/.test(css),
  'HOME landscape must put title left + Play tiles right');
must(/id="sfTitleStart"/.test(html) && /id="btnAdventure"/.test(html),
  'SPELEN gate + HOME Avontuur missing');
must(!/data-hub="versus"/.test(html), 'versus hub tile must stay retired');

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) {
  console.log('SMOKE_OK landscape-begin (static only, no chrome)');
  process.exit(0);
}

const outDir = '/tmp/sf-landscape-begin';
fs.mkdirSync(outDir, { recursive: true });
const shotDirs = [outDir];
for (const extra of ['/opt/cursor/artifacts/screenshots']) {
  try {
    fs.mkdirSync(extra, { recursive: true });
    shotDirs.push(extra);
  } catch (_) {}
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

function boxInView(r, vw, vh, slop = 2) {
  const w = r.w != null ? r.w : r.width;
  const h = r.h != null ? r.h : r.height;
  return r.top >= -slop
    && r.left >= -slop
    && r.bottom <= vh + slop
    && r.right <= vw + slop
    && w >= 8
    && h >= 8;
}

async function measureBeginHome(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const splash = document.getElementById('sfSplash');
    const start = document.getElementById('sfTitleStart');
    const title = document.querySelector('.sf-splash-title');
    const play = document.getElementById('btnAdventure');
    const homeTitle = document.querySelector('#menuScreen .menu-title-glass, #menuScreen h1.title');
    const vs = document.querySelector('[data-hub="versus"]');
    const box = (el) => {
      if (!el) return null;
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return null;
      const r = el.getBoundingClientRect();
      return {
        top: r.top, left: r.left, right: r.right, bottom: r.bottom,
        w: r.width, h: r.height,
      };
    };
    return {
      vw, vh,
      splashTitle: !!(splash && splash.classList.contains('is-title')),
      versus: !!vs,
      start: box(start),
      splashH1: box(title),
      play: box(play),
      homeTitle: box(homeTitle),
    };
  });
}

async function shot(page, name) {
  const buf = await page.screenshot({ type: 'png', fullPage: false });
  for (const dir of shotDirs) {
    try { fs.writeFileSync(path.join(dir, name), buf); } catch (_) {}
  }
}

async function openTitleGate(page) {
  await page.waitForFunction(() => {
    const s = document.getElementById('sfSplash');
    const b = document.getElementById('sfTitleStart');
    const g = document.getElementById('sfTitleGate');
    return !!(s && s.classList.contains('is-title') && b && g && !g.hidden);
  }, { timeout: 20000 });
}

async function enterHome(page) {
  await page.evaluate(() => {
    try {
      if (typeof enterHubFromTitle === 'function') enterHubFromTitle({});
      else if (typeof dismissSplashOverlay === 'function') dismissSplashOverlay();
    } catch (_) {}
    const splash = document.getElementById('sfSplash');
    if (splash) {
      splash.classList.add('is-done');
      try { splash.remove(); } catch (_) { splash.style.display = 'none'; }
    }
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    const menu = document.getElementById('menuScreen');
    if (menu) menu.classList.add('active');
    if (typeof UI === 'object' && UI && typeof UI.renderMenu === 'function') {
      try { UI.renderMenu(); } catch (_) {}
    }
  });
  await page.waitForSelector('#menuScreen.active', { timeout: 8000 });
}

async function runAt(browser, width, height, label) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(smokeBaseUrl(port), { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 45000 });
  await openTitleGate(page);
  const begin = await measureBeginHome(page);
  await shot(page, `${label}-begin.png`);

  const fails = [];
  const land = width > height;
  const edge = land ? 36 : 8;
  if (begin.versus) fails.push({ where: `${label} versus tile`, begin });
  if (!begin.splashTitle) fails.push({ where: `${label} title-gate not shown`, begin });
  if (!begin.start) fails.push({ where: `${label} SPELEN missing`, begin });
  else {
    if (begin.start.h < 44) fails.push({ where: `${label} SPELEN shorter than 44px`, begin });
    if (!boxInView(begin.start, begin.vw, begin.vh)) {
      fails.push({ where: `${label} SPELEN clipped / off-screen`, begin });
    }
    if (begin.start.right > begin.vw - edge) {
      fails.push({ where: `${label} SPELEN overlaps right nav gutter`, begin });
    }
  }
  if (begin.splashH1 && !boxInView(begin.splashH1, begin.vw, begin.vh, 6)) {
    fails.push({ where: `${label} splash title clipped`, begin });
  }

  await enterHome(page);
  const home = await measureBeginHome(page);
  await shot(page, `${label}-home.png`);
  if (!home.play) fails.push({ where: `${label} HOME Play/Avontuur missing`, home });
  else {
    if (home.play.h < 44) fails.push({ where: `${label} HOME Play shorter than 44px`, home });
    if (!boxInView(home.play, home.vw, home.vh)) {
      fails.push({ where: `${label} HOME Play clipped / off-screen`, home });
    }
    if (home.play.right > home.vw - edge) {
      fails.push({ where: `${label} HOME Play overlaps right nav gutter`, home });
    }
  }
  if (home.homeTitle && !boxInView(home.homeTitle, home.vw, home.vh, 6)) {
    fails.push({ where: `${label} HOME title clipped`, home });
  }

  await page.close();
  return { label, width, height, fails, begin, home };
}

const port = Number(process.env.SF_LANDSCAPE_BEGIN_PORT || 8796);

async function run() {
  let server = null;
  try { server = await ensureSmokeServer(port); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,800'],
  });
  try {
    const land = await runAt(browser, 844, 390, 'land844x390');
    const port390 = await runAt(browser, 390, 844, 'port390x844');
    const fails = [...land.fails, ...port390.fails];
    if (fails.length) {
      console.error('SMOKE_FAIL landscape-begin', JSON.stringify({ land, port390 }, null, 2));
      process.exit(1);
    }
    console.log('SMOKE_OK landscape-begin 844×390 + 390×844 (SPELEN + HOME Play visible ≥44px)');
  } finally {
    await browser.close();
    if (server) try { server.close(); } catch (_) {}
  }
}

run().catch((err) => {
  console.error('SMOKE_FAIL landscape-begin', err);
  process.exit(1);
});
