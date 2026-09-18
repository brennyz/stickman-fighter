#!/usr/bin/env node
/**
 * P0 landscape combat camera/canvas: world, floor, and entities must sit
 * inside the visible canvas at 844×390 and 390×844. No Versus.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = '/tmp/sf-landscape-combat';
fs.mkdirSync(outDir, { recursive: true });

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

const input = fs.readFileSync(path.join(root, 'src/systems/input.js'), 'utf8');
const canvasSrc = fs.readFileSync(path.join(root, 'src/core/canvas.js'), 'utf8');
const startSrc = fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8');
const gameSrc = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');

must(/function\s+alignCombatPlayfield\s*\(/.test(input), 'alignCombatPlayfield missing');
must(/function\s+combatViewAlign\s*\(/.test(input), 'combatViewAlign missing');
must(/pinCanvasCssBox/.test(canvasSrc), 'pinCanvasCssBox missing');
must(/offsetX \|\| 0\) \+ ',' \+ \(vp\.offsetY/.test(canvasSrc), 'resize sizeKey must include visualViewport offset');
must(/forceGameResize[\s\S]{0,180}new Game/.test(startSrc), 'startGame must resize before spawn');
must(/alignCombatPlayfield\(this\)/.test(gameSrc), 'Game.onResize must align playfield');
must(/#game \{[^}]*--vv-w/.test(css) && /#game \{[^}]*--vv-h/.test(css),
  '#game CSS must follow visual viewport vars');
must(!/mode === 'versus'[\s\S]{0,40}alignCombat/.test(gameSrc), 'must not rewrite Versus HUD/arena');

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

function assertView(label, snap) {
  must(snap && snap.ok, label + ' evaluate failed: ' + (snap && snap.why));
  must(Math.abs(snap.w - snap.vpW) <= 2, label + ' W!=vp ' + JSON.stringify(snap));
  must(Math.abs(snap.h - snap.vpH) <= 2, label + ' H!=vp ' + JSON.stringify(snap));
  must(Math.abs(snap.cssW - snap.vpW) <= 4, label + ' canvas CSS w ' + JSON.stringify(snap));
  must(Math.abs(snap.cssH - snap.vpH) <= 4, label + ' canvas CSS h ' + JSON.stringify(snap));
  must(snap.ground > 8 && snap.ground < snap.h, label + ' ground off canvas ' + JSON.stringify(snap));
  must(snap.player, label + ' no player');
  must(snap.player.x >= 0 && snap.player.x <= snap.w, label + ' player X dead zone ' + JSON.stringify(snap.player));
  must(snap.player.y > 8 && snap.player.y <= snap.h + 1, label + ' player Y dead zone ' + JSON.stringify(snap.player));
  must(Math.abs(snap.player.y - snap.ground) <= 6, label + ' player not on floor ' + JSON.stringify(snap));
  must(snap.aligned, label + ' combatViewAlign.aligned=false ' + JSON.stringify(snap));
}

async function run() {
  let server = null;
  try { server = await ensureSmokeServer(8787); } catch (_) {}

  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=844,390'],
  });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true });
  const base = process.argv[2] || smokeBaseUrl(8787);
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });

  const land = await page.evaluate(() => {
    try { startGame('adventure', { level: 1, gamble: null }); } catch (e) {
      return { ok: false, why: 'start:' + e };
    }
    if (typeof forceGameResize === 'function') forceGameResize();
    const g = game;
    if (!g || !g.player) return { ok: false, why: 'no game' };
    const snap = (typeof combatViewAlign === 'function') ? combatViewAlign(g) : null;
    if (!snap) return { ok: false, why: 'no combatViewAlign' };
    return Object.assign({ ok: true, mode: g.mode }, snap);
  });
  assertView('landscape 844×390', land);
  must(land.w >= 800 && land.h <= 430, 'expected short landscape, got ' + land.w + 'x' + land.h);

  try {
    await page.screenshot({ path: path.join(outDir, 'landscape-844x390.png') });
  } catch (_) {}

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: false });
  const port = await page.evaluate(() => {
    try {
      if (typeof forceGameResize === 'function') forceGameResize();
      else if (typeof resize === 'function') resize();
    } catch (e) { return { ok: false, why: 'resize:' + e }; }
    const g = game;
    if (!g || !g.player) return { ok: false, why: 'no game after portrait' };
    const snap = combatViewAlign(g);
    return Object.assign({ ok: true, mode: g.mode }, snap);
  });
  assertView('portrait 390×844 after rotate', port);
  must(port.w <= 430 && port.h >= 700, 'expected tall portrait, got ' + port.w + 'x' + port.h);

  try {
    await page.screenshot({ path: path.join(outDir, 'portrait-390x844.png') });
  } catch (_) {}

  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true });
  const back = await page.evaluate(() => {
    const g = game;
    if (!g || !g.player) return { ok: false, why: 'lost game' };
    // Simulate the mega-merge bug: portrait floor leftover on a landscape canvas.
    g.player.y = 616;
    g.player.x = 97;
    g.ground = 616;
    if (g.robot) { g.robot.y = 616; g.robot.x = 900; }
    if (Array.isArray(g.monsters)) {
      for (const m of g.monsters) { if (m) { m.y = 600; m.x = 980; } }
    }
    try {
      if (typeof forceGameResize === 'function') forceGameResize();
      else g.onResize();
    } catch (e) { return { ok: false, why: 'realign:' + e }; }
    const snap = combatViewAlign(g);
    const robot = g.robot ? { x: g.robot.x, y: g.robot.y } : null;
    const monOff = (g.monsters || []).some((m) => m && (m.x < 0 || m.x > W || m.y < 8 || m.y > H));
    return Object.assign({ ok: true, robot, monOff }, snap);
  });
  assertView('landscape after stale-portrait realign', back);
  must(!back.monOff, 'monster still in dead zone after realign');
  if (back.robot) {
    must(back.robot.x >= 0 && back.robot.x <= back.w, 'robot X dead zone ' + JSON.stringify(back.robot));
    must(back.robot.y > 8 && back.robot.y <= back.h + 1, 'robot Y dead zone ' + JSON.stringify(back.robot));
  }

  const versusGuard = await page.evaluate(() => {
    return {
      startBlocksVersus: (function () {
        const src = String(startGame);
        return /versus/.test(src) && /toastVersusRetired|retired/.test(src);
      })(),
    };
  });
  must(versusGuard.startBlocksVersus, 'startGame must keep Versus retired');

  if (pageErrors.length) {
    console.error('SMOKE_FAIL pageerror', pageErrors[0]);
    process.exit(1);
  }

  await browser.close();
  if (server && server.close) try { server.close(); } catch (_) {}

  console.log(JSON.stringify({
    ok: true,
    landscape: { w: land.w, h: land.h, ground: Math.round(land.ground), player: land.player },
    portrait: { w: port.w, h: port.h, ground: Math.round(port.ground), player: port.player },
    realign: { w: back.w, h: back.h, ground: Math.round(back.ground), player: back.player },
  }));
  console.log('SMOKE_OK landscape-combat 844×390 + 390×844');
}

run().catch((e) => {
  console.error('SMOKE_FAIL', e && e.stack || e);
  process.exit(1);
});
