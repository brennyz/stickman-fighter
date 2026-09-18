#!/usr/bin/env node
/**
 * PLAYTEST BOT 2/9 — landscape HOME/BEGIN at 844×390.
 * Measures SPELEN + Avontuur visibility/tappability and FOMO overlap.
 * Writes JSON + PNG evidence. Does not mutate game code.
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.SF_LANDSCAPE_HOME_PORT || 8798);
const liveBase = process.env.SF_LIVE_BASE || 'https://brennyz.github.io/stickman-fighter';
const outDir = path.join(root, 'docs/playtest/bot2-landscape-home');
const artDir = '/opt/cursor/artifacts/screenshots';
const tmpDir = '/tmp/sf-playtest-land-home';

for (const dir of [outDir, artDir, tmpDir]) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
}

function inView(b, vw, vh, slop = 2) {
  return !!(b && b.painted
    && b.top >= -slop && b.left >= -slop
    && b.bottom <= vh + slop && b.right <= vw + slop
    && b.w >= 8 && b.h >= 8);
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

function tapVerdict(box, vw, vh, extra = {}) {
  const visible = inView(box, vw, vh);
  const tall = !!(box && box.h >= 44);
  const gutterOk = !!(box && box.right <= vw - 36);
  return {
    visible,
    tallEnough: tall,
    clearOfRightGutter: gutterOk,
    tappableGeom: !!(visible && tall && gutterOk),
    ...extra,
  };
}

async function runSpeelLanding(browser, baseUrl, label) {
  const page = await browser.newPage();
  await page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const url = `${baseUrl.replace(/\/$/, '')}/speel.html`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const data = await page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const play = document.getElementById('btnPlay');
    const versus = /versus/i.test(document.body.innerText) && !!document.querySelector('[data-hub="versus"], #btnVersus');
    const box = (el) => {
      if (!el) return null;
      const st = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        top: Math.round(r.top), left: Math.round(r.left),
        right: Math.round(r.right), bottom: Math.round(r.bottom),
        w: Math.round(r.width), h: Math.round(r.height),
        display: st.display, visibility: st.visibility,
        opacity: Number(st.opacity), pointerEvents: st.pointerEvents,
        painted: st.display !== 'none' && st.visibility !== 'hidden' && Number(st.opacity) > 0.2,
      };
    };
    const b = box(play);
    const hit = document.elementFromPoint((b && b.left + b.w / 2) || 0, (b && b.top + b.h / 2) || 0);
    return {
      vw, vh, href: play && play.getAttribute('href'),
      play: b,
      hitIsPlay: !!(hit && play && (hit === play || play.contains(hit))),
      versus,
    };
  });
  const shotName = await shot(page, `${label}-speel.png`);
  await page.close();
  const verdict = tapVerdict(data.play, data.vw, data.vh, {
    hitIsPlay: data.hitIsPlay,
    href: data.href,
    versus: data.versus,
  });
  return { label: `${label}-speel`, url, shot: shotName, data, verdict };
}

async function openTitleGate(page) {
  await page.waitForFunction(() => window.__sfBooted, { timeout: 45000 });
  await page.waitForFunction(() => {
    const s = document.getElementById('sfSplash');
    const b = document.getElementById('sfTitleStart');
    const g = document.getElementById('sfTitleGate');
    return !!(s && s.classList.contains('is-title') && b && g && !g.hidden);
  }, { timeout: 20000 });
}

async function measureBegin(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const splash = document.getElementById('sfSplash');
    const start = document.getElementById('sfTitleStart');
    const title = document.querySelector('.sf-splash-title');
    const fomo = document.getElementById('fomoRitual');
    const box = (el) => {
      if (!el) return null;
      const st = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        top: Math.round(r.top), left: Math.round(r.left),
        right: Math.round(r.right), bottom: Math.round(r.bottom),
        w: Math.round(r.width), h: Math.round(r.height),
        display: st.display, visibility: st.visibility,
        opacity: Number(st.opacity), pointerEvents: st.pointerEvents,
        painted: st.display !== 'none' && st.visibility !== 'hidden' && Number(st.opacity) > 0.2,
      };
    };
    const b = box(start);
    const hit = b ? document.elementFromPoint(b.left + b.w / 2, b.top + Math.min(20, b.h / 2)) : null;
    const fomoCs = fomo ? getComputedStyle(fomo) : null;
    return {
      vw, vh,
      app: (typeof APP_VERSION !== 'undefined') ? APP_VERSION : null,
      sw: (typeof SW_CACHE_REV !== 'undefined') ? SW_CACHE_REV : null,
      splashTitle: !!(splash && splash.classList.contains('is-title')),
      start: b,
      title: box(title),
      fomoShown: !!(fomo && !fomo.hidden && fomoCs && fomoCs.display !== 'none'),
      versus: !!document.querySelector('[data-hub="versus"]'),
      hitIsStart: !!(hit && start && (hit === start || start.contains(hit))),
    };
  });
}

async function tapBeginSpelen(page) {
  const before = await page.evaluate(() => ({
    splash: !!document.getElementById('sfSplash'),
    splashDone: !!(document.getElementById('sfSplash') && document.getElementById('sfSplash').classList.contains('is-done')),
    menu: !!(document.getElementById('menuScreen') && document.getElementById('menuScreen').classList.contains('active')),
  }));
  await page.evaluate(() => {
    const start = document.getElementById('sfTitleStart');
    if (start) start.click();
  });
  await page.waitForFunction(() => {
    const splash = document.getElementById('sfSplash');
    const menu = document.getElementById('menuScreen');
    return !!(!splash || splash.classList.contains('is-done') || splash.classList.contains('is-out'))
      && !!(menu && menu.classList.contains('active'));
  }, { timeout: 8000 }).catch(() => {});
  const after = await page.evaluate(() => ({
    splash: !!document.getElementById('sfSplash'),
    splashDone: !!(document.getElementById('sfSplash') && document.getElementById('sfSplash').classList.contains('is-done')),
    menu: !!(document.getElementById('menuScreen') && document.getElementById('menuScreen').classList.contains('active')),
    play: !!document.getElementById('btnAdventure'),
  }));
  return { before, after, openedHome: !!(after.menu && after.play) };
}

async function measureHome(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const play = document.getElementById('btnAdventure');
    const homeTitle = document.querySelector('#menuScreen .menu-title-glass, #menuScreen h1.title');
    const chrome = document.querySelector('#menuScreen .menu-chrome');
    const landing = document.querySelector('#menuScreen .menu-landing-body');
    const fomo = document.getElementById('fomoRitual');
    const sheet = fomo && fomo.querySelector('.fomo-ritual-sheet');
    const cta = document.getElementById('fomoRitualCta');
    const box = (el) => {
      if (!el) return null;
      const st = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        top: Math.round(r.top), left: Math.round(r.left),
        right: Math.round(r.right), bottom: Math.round(r.bottom),
        w: Math.round(r.width), h: Math.round(r.height),
        display: st.display, visibility: st.visibility,
        opacity: Number(st.opacity), pointerEvents: st.pointerEvents,
        painted: st.display !== 'none' && st.visibility !== 'hidden' && Number(st.opacity) > 0.2,
      };
    };
    const overlap = (p, q) => !!(p && q
      && p.left < q.right - 3 && p.right > q.left + 3
      && p.top < q.bottom - 3 && p.bottom > q.top + 3);
    const pb = box(play);
    const sb = box(sheet);
    const hit = pb ? document.elementFromPoint(pb.left + pb.w / 2, pb.top + Math.min(20, pb.h / 2)) : null;
    const fomoCs = fomo ? getComputedStyle(fomo) : null;
    const landingCs = landing ? getComputedStyle(landing) : null;
    return {
      vw, vh,
      play: pb,
      homeTitle: box(homeTitle),
      sheet: sb,
      cta: box(cta),
      fomoOpen: !!(fomo && !fomo.hidden && fomoCs && fomoCs.display !== 'none'),
      fomoPointer: fomoCs && fomoCs.pointerEvents,
      landingVis: landingCs && landingCs.visibility,
      landingPE: landingCs && landingCs.pointerEvents,
      chromeInert: !!(chrome && chrome.hasAttribute('inert')),
      playClosestInert: !!(play && play.closest('[inert]')),
      hitTag: hit && (hit.id || hit.className || hit.tagName),
      hitIsPlay: !!(hit && play && (hit === play || play.contains(hit))),
      overlapPlay: overlap(sb, pb),
      versus: !!document.querySelector('[data-hub="versus"]'),
      bodyFomo: document.body.classList.contains('fomo-open'),
    };
  });
}

async function forceFomo(page) {
  await page.evaluate(() => {
    const splash = document.getElementById('sfSplash');
    if (splash) {
      splash.classList.add('is-done');
      try { splash.remove(); } catch (_) {}
    }
    if (typeof UI === 'object' && UI) {
      UI._fomoRitualHide = false;
      UI._fomoRitualForce = true;
      if (UI.showFomoRitual) UI.showFomoRitual(true);
    }
  });
  await page.waitForFunction(() => {
    const el = document.getElementById('fomoRitual');
    return !!(el && !el.hidden);
  }, { timeout: 4000 }).catch(() => {});
}

async function tapAdventure(page) {
  const before = await page.evaluate(() => ({
    menu: !!(document.getElementById('menuScreen') && document.getElementById('menuScreen').classList.contains('active')),
    level: !!(document.getElementById('levelScreen') && document.getElementById('levelScreen').classList.contains('active')),
    fomo: (() => {
      const el = document.getElementById('fomoRitual');
      return !!(el && !el.hidden);
    })(),
  }));
  await page.evaluate(() => {
    const play = document.getElementById('btnAdventure');
    if (play) play.click();
  });
  await new Promise((r) => setTimeout(r, 250));
  const after = await page.evaluate(() => ({
    menu: !!(document.getElementById('menuScreen') && document.getElementById('menuScreen').classList.contains('active')),
    level: !!(document.getElementById('levelScreen') && document.getElementById('levelScreen').classList.contains('active')),
    island: !!(document.getElementById('islandScreen') && document.getElementById('islandScreen').classList.contains('active')),
    fomo: (() => {
      const el = document.getElementById('fomoRitual');
      return !!(el && !el.hidden);
    })(),
  }));
  return {
    before,
    after,
    openedPlay: !!(!after.menu && (after.level || after.island)),
    stayedOnHome: !!(after.menu && !after.level && !after.island),
  };
}

async function runGame(browser, baseUrl, label) {
  const page = await browser.newPage();
  await page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const url = `${baseUrl.replace(/\/$/, '')}/index.html`;
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await openTitleGate(page);
  const begin = await measureBegin(page);
  const beginShot = await shot(page, `${label}-begin.png`);
  const beginTap = await tapBeginSpelen(page);
  const homeAfterTap = await measureHome(page);
  const homeShot = await shot(page, `${label}-home.png`);
  const homeTapQuiet = homeAfterTap.fomoOpen ? null : await tapAdventure(page);
  if (homeTapQuiet && homeTapQuiet.openedPlay) {
    await page.evaluate(() => {
      try {
        if (typeof UI === 'object' && UI.show) UI.show('menuScreen');
        else {
          document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
          const menu = document.getElementById('menuScreen');
          if (menu) menu.classList.add('active');
        }
        if (typeof UI === 'object' && UI.renderMenu) UI.renderMenu();
      } catch (_) {}
    });
    await page.waitForSelector('#menuScreen.active', { timeout: 4000 }).catch(() => {});
  }
  await forceFomo(page);
  const fomo = await measureHome(page);
  const fomoShot = await shot(page, `${label}-fomo.png`);
  const fomoTap = await tapAdventure(page);
  const fomoAfterTapShot = await shot(page, `${label}-fomo-after-avontuur-tap.png`);
  await page.close();
  return {
    label,
    url,
    begin: {
      ...begin,
      shot: beginShot,
      verdict: tapVerdict(begin.start, begin.vw, begin.vh, {
        hitIsStart: begin.hitIsStart,
        fomoShownOnGate: begin.fomoShown,
        versus: begin.versus,
        tapOpenedHome: beginTap.openedHome,
      }),
      tap: beginTap,
    },
    home: {
      ...homeAfterTap,
      shot: homeShot,
      verdict: tapVerdict(homeAfterTap.play, homeAfterTap.vw, homeAfterTap.vh, {
        hitIsPlay: homeAfterTap.hitIsPlay,
        chromeInert: homeAfterTap.chromeInert,
        fomoOpen: homeAfterTap.fomoOpen,
        versus: homeAfterTap.versus,
        tapOpenedPlay: homeTapQuiet && homeTapQuiet.openedPlay,
      }),
      tap: homeTapQuiet,
    },
    fomo: {
      ...fomo,
      shot: fomoShot,
      afterTapShot: fomoAfterTapShot,
      verdict: tapVerdict(fomo.play, fomo.vw, fomo.vh, {
        hitIsPlay: fomo.hitIsPlay,
        chromeInert: fomo.chromeInert,
        playClosestInert: fomo.playClosestInert,
        overlapPlay: fomo.overlapPlay,
        fomoOpen: fomo.fomoOpen,
        landingVis: fomo.landingVis,
        landingPE: fomo.landingPE,
        tapOpenedPlay: fomoTap.openedPlay,
        stayedOnHome: fomoTap.stayedOnHome,
      }),
      tap: fomoTap,
    },
  };
}

function findingsFrom(local, live, speelLocal, speelLive) {
  const issues = [];
  const note = (sev, id, text, extra) => issues.push({ sev, id, text, extra });

  const checkSpeel = (pack, id) => {
    if (!pack.verdict.visible) note('P0', id + '-hidden', 'speel.html SPELEN not fully visible at 844×390', pack);
    else if (!pack.verdict.tappableGeom || !pack.verdict.hitIsPlay) note('P1', id + '-tap', 'speel.html SPELEN not tappable at 844×390', pack);
  };
  checkSpeel(speelLocal, 'speel-local');
  if (speelLive) checkSpeel(speelLive, 'speel-live');

  const checkBegin = (pack, id) => {
    if (pack.begin.versus) note('P0', id + '-versus', 'Versus tile present on begin/HOME', pack.begin);
    if (!pack.begin.verdict.visible) note('P0', id + '-begin-hidden', 'Begin SPELEN not fully visible at 844×390', pack.begin);
    else if (!pack.begin.verdict.tappableGeom) note('P1', id + '-begin-geom', 'Begin SPELEN geometry not ≥44px / in-view / clear of nav gutter', pack.begin);
    if (pack.begin.fomoShown) note('P1', id + '-begin-fomo', 'FOMO shown over Begin SPELEN gate', pack.begin);
    if (!pack.begin.tap.openedHome) note('P0', id + '-begin-tap', 'Tapping Begin SPELEN did not open HOME', pack.begin);
  };
  checkBegin(local, 'local');
  if (live) checkBegin(live, 'live');

  const checkHome = (pack, id) => {
    if (!pack.home.verdict.visible) note('P0', id + '-home-hidden', 'HOME Avontuur not fully visible at 844×390', pack.home);
    else if (!pack.home.verdict.tappableGeom) note('P1', id + '-home-geom', 'HOME Avontuur geometry not ≥44px / in-view / clear of nav gutter', pack.home);
    if (pack.home.tap && !pack.home.tap.openedPlay && !pack.home.fomoOpen) {
      note('P0', id + '-home-tap', 'Tapping HOME Avontuur (FOMO closed) did not leave HOME', pack.home);
    }
  };
  checkHome(local, 'local');
  if (live) checkHome(live, 'live');

  const checkFomo = (pack, id) => {
    if (!pack.fomo.fomoOpen) note('P2', id + '-fomo-miss', 'Could not force-open Vandaag/FOMO for overlap check', pack.fomo);
    if (pack.fomo.overlapPlay) note('P0', id + '-fomo-cover', 'FOMO sheet geometrically covers Avontuur', pack.fomo);
    if (pack.fomo.play && pack.fomo.play.visibility === 'hidden') {
      note('P0', id + '-fomo-hide', 'FOMO hides Avontuur (visibility:hidden)', pack.fomo);
    } else if (pack.fomo.verdict && !pack.fomo.verdict.visible) {
      note('P0', id + '-fomo-clip', 'Avontuur not fully visible while FOMO is open', pack.fomo);
    }
    if (pack.fomo.chromeInert || pack.fomo.playClosestInert || pack.fomo.landingPE === 'none') {
      note('P1', id + '-fomo-inert',
        'FOMO leaves Avontuur painted but not tappable (inert / pointer-events:none on HOME chrome)',
        pack.fomo);
    }
    if (pack.fomo.tap && pack.fomo.tap.openedPlay) {
      /* unexpected but good — tile still activated */
    } else if (pack.fomo.cta && pack.fomo.cta.painted && pack.fomo.cta.h >= 44) {
      note('P2', id + '-fomo-cta-only',
        'Play path while FOMO open is the Vandaag CTA, not the Avontuur tile (tile inert)',
        { cta: pack.fomo.cta, tap: pack.fomo.tap });
    }
  };
  checkFomo(local, 'local');
  if (live) checkFomo(live, 'live');

  const p0 = issues.filter((i) => i.sev === 'P0').length;
  const p1 = issues.filter((i) => i.sev === 'P1').length;
  return { issues, p0, p1, verdict: p0 ? 'FAIL-P0' : (p1 ? 'FAIL-P1' : 'PASS') };
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
  const report = {
    bot: '2/9',
    focus: 'LANDSCAPE HOME/BEGIN 844×390',
    target: 'LIVE main c9a29fc v1.18.190 SW400',
    at: new Date().toISOString(),
  };
  try {
    const speelLocal = await runSpeelLanding(browser, localBase, 'local');
    let speelLive = null;
    try { speelLive = await runSpeelLanding(browser, liveBase, 'live'); } catch (err) {
      speelLive = { error: String(err) };
    }
    const local = await runGame(browser, localBase, 'local');
    let live = null;
    try { live = await runGame(browser, liveBase, 'live'); } catch (err) {
      live = { error: String(err) };
    }
    const findings = findingsFrom(local, live && !live.error ? live : null, speelLocal, speelLive && !speelLive.error ? speelLive : null);
    Object.assign(report, { findings, speelLocal, speelLive, local, live });
    fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      verdict: findings.verdict,
      p0: findings.p0,
      p1: findings.p1,
      issues: findings.issues.map((i) => `${i.sev} ${i.id}: ${i.text}`),
      localApp: local.begin.app,
      localSw: local.begin.sw,
      liveApp: live && live.begin && live.begin.app,
      liveSw: live && live.begin && live.begin.sw,
    }, null, 2));
    if (findings.p0) process.exitCode = 2;
  } finally {
    await browser.close();
    if (server) try { server.close(); } catch (_) {}
  }
}

run().catch((err) => {
  console.error('PLAYTEST_FAIL landscape-home-bot2', err);
  process.exit(1);
});
