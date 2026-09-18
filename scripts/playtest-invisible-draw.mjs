#!/usr/bin/env node
/**
 * PLAYTEST BOT 1/9 — INVISIBLE / DRAW probe (Adventure only).
 * Portrait + landscape: spawn, hit, rotate, death. Screenshots + pixel samples.
 * Findings only — does not patch gameplay.
 * Pixel "lit" scores are sky-biased on landweg; visual PNGs are canonical.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ensureSmokeServer, smokeBaseUrl, repoRoot } from './smoke-static-server.mjs';

const outDir = path.join(repoRoot(), 'docs/playtest-invisible-draw');
fs.mkdirSync(outDir, { recursive: true });

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.error('PLAYTEST_FAIL no chrome'); process.exit(1); }

async function getPuppeteer() {
  const cache = '/tmp/sf-adv-run';
  const cached = path.join(cache, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js');
  if (fs.existsSync(cached)) return import(cached);
  try { return await import('puppeteer-core'); } catch (_) {
    const npmCli = '/home/ubuntu/.nvm/versions/node/v22.22.2/lib/node_modules/npm/bin/npm-cli.js';
    const nodeBin = fs.existsSync('/exec-daemon/node') ? '/exec-daemon/node' : 'node';
    await new Promise((res, rej) => {
      const p = spawn(nodeBin, [npmCli, 'install', '--no-save', 'puppeteer-core@23'], {
        cwd: cache,
        stdio: 'inherit',
      });
      p.on('exit', (c) => (c === 0 ? res() : rej(new Error('npm puppeteer-core'))));
    });
    return import(cached);
  }
}

function emptyReport() {
  return { ok: true, app: null, sw: null, cases: [], failures: [], notes: [] };
}

async function run() {
  const report = emptyReport();
  let server = null;
  try { server = await ensureSmokeServer(8788); } catch (_) {}

  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  page.on('pageerror', (e) => report.notes.push('pageerror:' + String(e).slice(0, 220)));

  const base = process.argv[2] || smokeBaseUrl(8788, '/index.html?sfdebug=1');

  async function shot(name) {
    const file = path.join(outDir, name + '.png');
    await page.screenshot({ path: file, fullPage: false });
    return path.relative(repoRoot(), file);
  }

  async function setVp(w, h) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.evaluate(() => {
      try { if (typeof forceGameResize === 'function') forceGameResize(); else if (typeof resize === 'function') resize(); } catch (_) {}
    });
    await new Promise((r) => setTimeout(r, 80));
  }

  async function probe(label, extra) {
    const data = await page.evaluate((extraIn) => {
      const g = typeof game !== 'undefined' ? game : null;
      const canvas = document.getElementById('game');
      const c = canvas && canvas.getContext && canvas.getContext('2d');
      const Wnow = typeof W === 'number' ? W : (canvas ? canvas.width : 0);
      const Hnow = typeof H === 'number' ? H : (canvas ? canvas.height : 0);
      const bodyPlay = !!(document.body && document.body.classList.contains('is-playing'));
      const activeScreens = [...document.querySelectorAll('.screen.active')].map((el) => el.id);
      const vis = canvas ? getComputedStyle(canvas).visibility : 'missing';
      const st = typeof state !== 'undefined' ? state : null;

      function boxScore(x, y, bw, bh) {
        if (!c || !Number.isFinite(x) || !Number.isFinite(y)) return { ok: false, why: 'no-pos', lit: 0, n: 0 };
        const left = Math.max(0, Math.round(x - bw / 2));
        const top = Math.max(0, Math.round(y - bh));
        const w = Math.max(4, Math.min(bw, Wnow - left));
        const h = Math.max(4, Math.min(bh, Hnow - top));
        if (w < 4 || h < 4) return { ok: false, why: 'offscreen', lit: 0, n: 0, left, top, w, h };
        let img;
        try { img = c.getImageData(left, top, w, h); } catch (e) {
          return { ok: false, why: 'getImageData:' + String(e && e.message || e), lit: 0, n: 0 };
        }
        const d = img.data;
        let lit = 0, n = d.length / 4, dark = 0;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], gch = d[i + 1], b = d[i + 2], a = d[i + 3];
          if (a < 20) continue;
          const lum = 0.2126 * r + 0.7152 * gch + 0.0722 * b;
          if (lum > 55) lit++;
          if (lum < 28) dark++;
        }
        const frac = n ? lit / n : 0;
        return { ok: frac >= 0.012 && lit >= 18, lit, n, frac: Math.round(frac * 1000) / 1000, dark, left, top, w, h };
      }

      const p = g && g.player;
      const mobs = (g && g.monsters) ? g.monsters.filter((m) => m) : [];
      const liveMobs = mobs.filter((m) => m.alive);
      const deadMobs = mobs.filter((m) => !m.alive);
      const pick = liveMobs[0] || deadMobs[0] || null;

      try { if (g && typeof g.draw === 'function' && c) g.draw(c); } catch (e) {
        return { drawThrow: String(e && (e.stack || e.message || e)) };
      }

      const playerScore = p ? boxScore(p.x, p.y, 56, 92) : { ok: false, why: 'no-player' };
      const mobScore = pick ? boxScore(pick.x, pick.y, 64, 80) : { ok: false, why: 'no-mob' };
      const onField = (f) => !!f && Number.isFinite(f.x) && Number.isFinite(f.y)
        && f.x >= -8 && f.x <= Wnow + 8 && f.y >= 8 && f.y <= Hnow + 24;

      return {
        app: typeof APP_VERSION !== 'undefined' ? APP_VERSION : null,
        sw: typeof SW_CACHE_REV !== 'undefined' ? SW_CACHE_REV : null,
        state: st,
        bodyPlay,
        activeScreens,
        canvasVis: vis,
        W: Wnow,
        H: Hnow,
        ground: g ? g.ground : null,
        player: p ? {
          x: Math.round(p.x), y: Math.round(p.y), hp: p.hp, alive: p.alive,
          deadT: Math.round((p.deadT || 0) * 100) / 100,
          hitFlashT: Math.round((p.hitFlashT || 0) * 100) / 100,
          invulnT: Math.round((p.invulnT || 0) * 100) / 100,
          onField: onField(p),
          scale: p.scale,
        } : null,
        mob: pick ? {
          x: Math.round(pick.x), y: Math.round(pick.y), hp: pick.hp, alive: pick.alive,
          deadT: Math.round((pick.deadT || 0) * 100) / 100,
          flashT: Math.round((pick.flashT || 0) * 100) / 100,
          onField: onField(pick),
          size: pick.size,
          id: pick.sp && (pick.sp.id || pick.sp.name),
        } : null,
        liveMobs: liveMobs.length,
        playerScore,
        mobScore,
        extra: extraIn || null,
      };
    }, extra || null);
    return data;
  }

  function record(id, data, shotPath, expect) {
    const fails = [];
    if (!data) fails.push('no-data');
    else {
      if (data.drawThrow) fails.push('drawThrow');
      if (expect.play !== false) {
        if (data.state !== 'play') fails.push('state=' + data.state);
        if (!data.bodyPlay) fails.push('no-is-playing');
        if (data.canvasVis !== 'visible') fails.push('canvas=' + data.canvasVis);
        if (data.activeScreens && data.activeScreens.length) fails.push('screens=' + data.activeScreens.join(','));
      }
      if (expect.player) {
        if (!data.player) fails.push('no-player');
        else {
          if (!data.player.onField) fails.push('player-off-field');
          if (expect.playerAlive && !data.player.alive) fails.push('player-dead');
          if (expect.playerPixels && data.playerScore && !data.playerScore.ok) {
            fails.push('player-pixels:' + (data.playerScore.why || ('frac=' + data.playerScore.frac)));
          }
        }
      }
      if (expect.mob) {
        if (!data.mob) fails.push('no-mob');
        else {
          if (!data.mob.onField) fails.push('mob-off-field');
          if (expect.mobAlive && !data.mob.alive) fails.push('mob-dead');
          if (expect.mobPixels && data.mobScore && !data.mobScore.ok) {
            fails.push('mob-pixels:' + (data.mobScore.why || ('frac=' + data.mobScore.frac)));
          }
        }
      }
    }
    const row = { id, ok: fails.length === 0, fails, shot: shotPath, data };
    report.cases.push(row);
    if (fails.length) {
      report.ok = false;
      report.failures.push({ id, fails, shot: shotPath });
    }
    return row;
  }

  try {
    await setVp(390, 844);
    await page.goto(base, { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(() => window.__sfBooted, { timeout: 20000 });

    await page.evaluate(() => {
      try { if (UI && UI.hideFomoRitual) UI.hideFomoRitual(); } catch (_) {}
      try { if (UI && UI._fomoRitualHide !== undefined) UI._fomoRitualHide = true; } catch (_) {}
      try { localStorage.setItem('sf-fomo-hide', '1'); } catch (_) {}
      try { if (typeof save !== 'undefined' && save) {
        save.tipsSeen = save.tipsSeen || {};
        save.tipsSeen.moveBarAim = true;
        save.tipsSeen.firstPunch = true;
      } } catch (_) {}
      try {
        const start = document.getElementById('sfTitleStart');
        if (start) start.click();
      } catch (_) {}
    });
    await new Promise((r) => setTimeout(r, 250));

    const bootShot = await shot('00-speel-boot-portrait');
    const bootMeta = await page.evaluate(() => ({
      app: typeof APP_VERSION !== 'undefined' ? APP_VERSION : null,
      sw: typeof SW_CACHE_REV !== 'undefined' ? SW_CACHE_REV : null,
    }));
    report.app = bootMeta.app;
    report.sw = bootMeta.sw;
    report.notes.push('boot-shot ' + bootShot + ' app=' + bootMeta.app + ' sw=' + bootMeta.sw);

    await page.evaluate(() => {
      startGame('adventure', { level: 1, gamble: null });
      const g = game;
      if (!g) return;
      g.inputLocked = false;
      try { if (typeof maybeStartAimTutorial === 'function') { /* already maybe-started */ } } catch (_) {}
      for (let i = 0; i < 240 && (!g.monsters || !g.monsters.some((m) => m && m.alive)); i++) {
        if (g.betweenT > 0) g.betweenT = Math.min(g.betweenT, 1 / 30);
        try { g.update(1 / 30); } catch (_) {}
      }
      try { g.draw(typeof ctx !== 'undefined' ? ctx : document.getElementById('game').getContext('2d')); } catch (_) {}
    });
    await new Promise((r) => setTimeout(r, 80));

    let data = await probe('portrait-spawn');
    record('A-portrait-spawn', data, await shot('01-portrait-spawn'), {
      player: true, playerAlive: true, playerPixels: true,
      mob: true, mobAlive: true, mobPixels: true,
    });

    await page.evaluate(() => {
      const g = game;
      const p = g && g.player;
      const m = g && g.monsters && g.monsters.find((x) => x && x.alive);
      if (p && typeof p.takeDamage === 'function') p.takeDamage(12, 1, g);
      if (m && typeof m.takeDamage === 'function') m.takeDamage(18, -1, g);
      try { g.draw(typeof ctx !== 'undefined' ? ctx : document.getElementById('game').getContext('2d')); } catch (_) {}
    });
    data = await probe('portrait-after-hit');
    record('B-portrait-after-hit', data, await shot('02-portrait-after-hit'), {
      player: true, playerAlive: true, playerPixels: true,
      mob: true, mobPixels: true,
    });

    await setVp(844, 390);
    await page.evaluate(() => {
      try { if (typeof forceGameResize === 'function') forceGameResize(); } catch (_) {}
      const g = game;
      try { g.draw(typeof ctx !== 'undefined' ? ctx : document.getElementById('game').getContext('2d')); } catch (_) {}
    });
    data = await probe('landscape-after-rotate');
    record('C-landscape-after-rotate', data, await shot('03-landscape-after-rotate'), {
      player: true, playerAlive: true, playerPixels: true,
      mob: true, mobPixels: true,
    });

    await page.evaluate(() => {
      const g = game;
      const p = g && g.player;
      const m = g && g.monsters && g.monsters.find((x) => x && x.alive);
      if (p && typeof p.takeDamage === 'function') p.takeDamage(14, -1, g);
      if (m && typeof m.takeDamage === 'function') m.takeDamage(22, 1, g);
      try { g.draw(typeof ctx !== 'undefined' ? ctx : document.getElementById('game').getContext('2d')); } catch (_) {}
    });
    data = await probe('landscape-after-hit');
    record('D-landscape-after-hit', data, await shot('04-landscape-after-hit'), {
      player: true, playerAlive: true, playerPixels: true,
      mob: true, mobPixels: true,
    });

    await setVp(390, 844);
    await page.evaluate(() => {
      try { if (typeof forceGameResize === 'function') forceGameResize(); } catch (_) {}
      const g = game;
      try { g.draw(typeof ctx !== 'undefined' ? ctx : document.getElementById('game').getContext('2d')); } catch (_) {}
    });
    data = await probe('portrait-rotate-back');
    record('E-portrait-rotate-back', data, await shot('05-portrait-rotate-back'), {
      player: true, playerAlive: true, playerPixels: true,
      mob: true, mobPixels: true,
    });

    await page.evaluate(() => {
      const g = game;
      const m = g && g.monsters && g.monsters.find((x) => x && x.alive);
      if (m && typeof m.takeDamage === 'function') m.takeDamage(9999, 0, g);
      if (m) m.deadT = 0.25;
      try { g.draw(typeof ctx !== 'undefined' ? ctx : document.getElementById('game').getContext('2d')); } catch (_) {}
    });
    data = await probe('enemy-death-midfade');
    record('F-enemy-death-midfade', data, await shot('06-enemy-death-midfade'), {
      player: true, playerAlive: true, playerPixels: true,
      mob: true, mobAlive: false, mobPixels: true,
    });

    await page.evaluate(() => {
      const g = game;
      const p = g && g.player;
      if (p && typeof p.takeDamage === 'function') p.takeDamage(9999, 0, g);
      if (p) { p.hp = 0; p.deadT = 0.35; }
      try { g.draw(typeof ctx !== 'undefined' ? ctx : document.getElementById('game').getContext('2d')); } catch (_) {}
    });
    data = await probe('player-death-pose');
    record('G-player-death-pose', data, await shot('07-player-death-pose'), {
      player: true, playerAlive: false, playerPixels: true,
    });

    await setVp(844, 390);
    await page.evaluate(() => {
      try { if (typeof forceGameResize === 'function') forceGameResize(); } catch (_) {}
      const g = game;
      if (g && g.player) g.player.deadT = 0.55;
      try { g.draw(typeof ctx !== 'undefined' ? ctx : document.getElementById('game').getContext('2d')); } catch (_) {}
    });
    data = await probe('player-death-after-rotate');
    record('H-player-death-after-rotate', data, await shot('08-player-death-after-rotate'), {
      player: true, playerAlive: false, playerPixels: true,
    });

    await page.evaluate(() => {
      startGame('adventure', { level: 1, gamble: null });
      const g = game;
      if (g) {
        g.inputLocked = false;
        for (let i = 0; i < 240 && (!g.monsters || !g.monsters.some((m) => m && m.alive)); i++) {
          if (g.betweenT > 0) g.betweenT = Math.min(g.betweenT, 1 / 30);
          try { g.update(1 / 30); } catch (_) {}
        }
      }
    });
    await setVp(844, 390);
    await page.evaluate(() => {
      try { if (typeof forceGameResize === 'function') forceGameResize(); } catch (_) {}
      try { game.draw(typeof ctx !== 'undefined' ? ctx : document.getElementById('game').getContext('2d')); } catch (_) {}
    });
    data = await probe('landscape-fresh-spawn');
    record('I-landscape-fresh-spawn', data, await shot('09-landscape-fresh-spawn'), {
      player: true, playerAlive: true, playerPixels: true,
      mob: true, mobAlive: true, mobPixels: true,
    });
  } catch (err) {
    report.ok = false;
    report.failures.push({ id: 'runner', fails: [String(err && (err.stack || err.message || err))] });
  }

  await browser.close();
  if (server) try { server.close(); } catch (_) {}

  const jsonPath = path.join(outDir, 'report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({
    ok: report.ok,
    app: report.app,
    sw: report.sw,
    cases: report.cases.map((c) => ({ id: c.id, ok: c.ok, fails: c.fails })),
    failures: report.failures,
  }, null, 2));
  process.exit(report.ok ? 0 : 2);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
