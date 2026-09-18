#!/usr/bin/env node
/**
 * Pause sheet clip: tall dex must scroll; Resume + last action (Quit)
 * stay fully visible and ≥44px on ~390×844 and short landscape.
 * Layout/clipping only — no Versus.
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

must(/id="pauseScreen"/.test(html) && /class="pause-main"/.test(html) && /class="pause-actions"/.test(html),
  'pause-main / pause-actions wrappers missing');
must(/id="pauseResume"/.test(html) && /id="pauseQuit"/.test(html),
  'pause Resume/Quit missing');
must(/#pauseScreen \.pause-actions[\s\S]{0,180}flex:\s*0\s+0\s+auto/.test(css),
  'pause-actions must stay flex-shrink 0');
must(/\.run-loot-panel\.pause-loot[\s\S]{0,220}overflow-y:\s*auto/.test(css),
  'dex/stats box must scroll inside pause-loot');
must(/#pauseScreen\.active[\s\S]{0,280}safe-area-inset-bottom/.test(css),
  'pause sheet must pad safe-area / Android nav bottom');
must(/#pauseScreen \.pause-actions \.mode-btn[\s\S]{0,160}min-height:\s*max\(44px/.test(css),
  'pause action buttons must be ≥44px');
must(/#pauseScreen #pauseResume[\s\S]{0,80}display:\s*flex/.test(css),
  'Resume must stay visible (not display:none)');
must(/#pauseScreen \.pause-ui-layer[\s\S]{0,160}flex-direction:\s*row/.test(css),
  'short landscape pause must go two-column');
must(!/data-hub="versus"/.test(html), 'versus hub must stay retired');

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) {
  console.log('SMOKE_OK pause-sheet (static only, no chrome)');
  process.exit(0);
}

const outDir = '/tmp/sf-pause-sheet';
fs.mkdirSync(outDir, { recursive: true });
const shotDir = '/opt/cursor/artifacts/screenshots';
try { fs.mkdirSync(shotDir, { recursive: true }); } catch (_) {}

async function getPuppeteer() {
  try { return await import('puppeteer-core'); } catch (_) {
    await new Promise((res, rej) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], { cwd: outDir, stdio: 'inherit' });
      p.on('exit', (c) => (c === 0 ? res() : rej(new Error('npm puppeteer-core'))));
    });
    return import(path.join(outDir, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'));
  }
}

function tallLootHtml() {
  const rows = [];
  const names = [
    'Koninginneangel (Legendary)', 'Zeeeegel (Common)', 'Schroefbot (Uncommon)',
    'Nachtmerrie-Mijt (Nightmare)', 'Reveneling (Common)', 'Knipzaag (Rare)',
    'Spookvis (Epic)', 'Botkraker (Uncommon)', 'IJzerwesp (Rare)', 'Grotkrab (Common)',
  ];
  for (const name of names) {
    rows.push(`<div class="run-loot-row"><span class="run-loot-ico">📖</span><span class="run-loot-txt">Dex: ${name}</span></div>`);
  }
  rows.push('<div class="run-loot-row"><span class="run-loot-ico">❤</span><span class="run-loot-txt">+69 max HP from dex</span></div>');
  rows.push('<div class="run-loot-row"><span class="run-loot-ico">💚</span><span class="run-loot-txt">+HP ×3</span></div>');
  return `<div class="run-loot-head">This run</div><div class="run-loot-lines">${rows.join('')}</div>`;
}

async function openPauseWithTallDex(page) {
  await page.evaluate((lootHtml) => {
    document.body.classList.add('big-touch');
    const splash = document.getElementById('sfSplash');
    if (splash) {
      splash.classList.add('is-done');
      splash.setAttribute('hidden', '');
      try { splash.remove(); } catch (_) {}
    }
    const fomo = document.getElementById('fomoRitual');
    if (fomo) { fomo.hidden = true; fomo.setAttribute('hidden', ''); }
    const toast = document.getElementById('toastHost');
    if (toast) {
      toast.innerHTML = '';
      toast.hidden = true;
      toast.style.display = 'none';
    }
    document.querySelectorAll('.toast, #netStatus').forEach((el) => {
      el.style.display = 'none';
    });
    if (typeof UI === 'object' && UI && typeof UI.show === 'function') {
      try { UI.show('pauseScreen'); } catch (_) {}
    }
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    const scr = document.getElementById('pauseScreen');
    if (scr) scr.classList.add('active');
    const loot = document.getElementById('pauseRunLoot');
    if (loot) {
      loot.innerHTML = lootHtml;
      loot.style.display = 'block';
    }
    const vsA = document.getElementById('pauseVsRestart');
    const vsB = document.getElementById('pauseVsSwap');
    if (vsA) vsA.style.display = 'none';
    if (vsB) vsB.style.display = 'none';
  }, tallLootHtml());
}

function measurePause(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const box = (el) => {
      if (!el) return null;
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.left),
        y: Math.round(r.top),
        w: Math.round(r.width),
        h: Math.round(r.height),
        b: Math.round(r.bottom),
        r: Math.round(r.right),
      };
    };
    const ids = ['pauseHead', 'pauseResume', 'pauseQuit', 'pauseTogMusic', 'pauseTogSfx', 'pausePetChip'];
    const chrome = {};
    for (const id of ids) chrome[id] = box(document.getElementById(id));
    const loot = document.getElementById('pauseRunLoot');
    const lootBox = box(loot);
    const lootScroll = loot ? {
      scrollH: loot.scrollHeight,
      clientH: loot.clientHeight,
      overflowY: getComputedStyle(loot).overflowY,
    } : null;
    const clipped = [];
    const small = [];
    const missing = [];
    for (const id of ids) {
      const r = chrome[id];
      if (!r) { missing.push(id); continue; }
      if (r.y < -1 || r.b > vh + 1 || r.x < -2 || r.r > vw + 2) clipped.push({ id, ...r, vh, vw });
      if (id !== 'pauseHead' && (r.h < 44 || r.w < 44)) small.push({ id, ...r });
    }
    const resumeHidden = !chrome.pauseResume;
    return {
      vw, vh, chrome, lootBox, lootScroll, clipped, small, missing, resumeHidden,
      versusVisible: !!(chrome.pauseVsRestart || chrome.pauseVsSwap),
    };
  });
}

const port = Number(process.env.SF_PAUSE_PORT || 8796);

async function runAt(browser, width, height, label) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: height >= width, hasTouch: true });
  await page.goto(smokeBaseUrl(port) + '?nosplash=1', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 45000 });
  await openPauseWithTallDex(page);
  await page.waitForSelector('#pauseScreen.active', { timeout: 8000 });
  const report = await measurePause(page);
  const shotName = `pause-sheet-${label}.png`;
  const tmpShot = path.join(outDir, shotName);
  await page.screenshot({ path: tmpShot, fullPage: false });
  try { fs.copyFileSync(tmpShot, path.join(shotDir, shotName)); } catch (_) {}
  await page.close();
  const fails = [];
  if (report.resumeHidden) fails.push({ where: 'Resume hidden', report });
  if (report.missing.length) fails.push({ where: 'pause chrome missing', missing: report.missing });
  if (report.clipped.length) fails.push({ where: 'pause chrome clipped', clipped: report.clipped });
  if (report.small.length) fails.push({ where: 'pause chrome <44px', small: report.small });
  if (report.lootScroll && report.lootScroll.scrollH > report.lootScroll.clientH + 8) {
    if (!/auto|scroll/.test(report.lootScroll.overflowY || '')) {
      fails.push({ where: 'tall dex not scrollable', loot: report.lootScroll });
    }
  }
  return { label, width, height, fails, report, shot: tmpShot };
}

async function run() {
  let server = null;
  try { server = await ensureSmokeServer(port); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,800'],
  });
  try {
    const phone = await runAt(browser, 390, 844, '390x844');
    const land = await runAt(browser, 844, 390, '844x390');
    const fails = [...phone.fails, ...land.fails];
    if (fails.length) {
      console.error('SMOKE_FAIL pause-sheet', JSON.stringify({ phone, land }, null, 2));
      process.exit(1);
    }
    console.log(JSON.stringify({
      ok: true,
      phone: { quit: phone.report.chrome.pauseQuit, resume: phone.report.chrome.pauseResume, loot: phone.report.lootScroll },
      land: { quit: land.report.chrome.pauseQuit, resume: land.report.chrome.pauseResume },
      shots: [phone.shot, land.shot],
    }));
    console.log('SMOKE_OK pause-sheet 390×844 + 844×390 chrome visible ≥44px');
  } finally {
    await browser.close();
    if (server) try { server.close(); } catch (_) {}
  }
}

run().catch((err) => {
  console.error('SMOKE_FAIL pause-sheet', err);
  process.exit(1);
});
