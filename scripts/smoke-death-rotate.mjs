#!/usr/bin/env node
/**
 * P1 playtest #336: after DEATH, portrait↔landscape must keep the fallen
 * player on the visible floor. Alive rotate is covered by smoke:fighters-visible.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = '/tmp/sf-death-rotate';
const artDir = '/opt/cursor/artifacts/screenshots';
fs.mkdirSync(outDir, { recursive: true });
try { fs.mkdirSync(artDir, { recursive: true }); } catch (_) {}

function fail(msg) {
  console.error('SMOKE_FAIL', msg);
  process.exit(1);
}

const canvasSrc = fs.readFileSync(path.join(root, 'src/core/canvas.js'), 'utf8');
const gameSrc = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const inputSrc = fs.readFileSync(path.join(root, 'src/systems/input.js'), 'utf8');
const fighterSrc = fs.readFileSync(path.join(root, 'src/entities/fighter.js'), 'utf8');

if (!/function\s+pinDeadFighterPose\s*\(/.test(canvasSrc)) fail('pinDeadFighterPose missing');
if (!/function\s+visiblePlayfieldBox\s*\(/.test(canvasSrc)) fail('visiblePlayfieldBox missing');
if (!/fighterIsDead\(f\)/.test(canvasSrc)) fail('pin must special-case dead fighters');
if (!/player && !\(this\.player\.hp > 0\)/.test(gameSrc)) fail('onResize must re-pin dead player');
if (!/const dead = !\(f\.hp > 0\)/.test(inputSrc)) fail('alignCombatPlayfield must treat dead as grounded');
if (!/this\.y > visH - 4/.test(fighterSrc)) fail('dead update must snap below visible H');
if (!/if \(dead\) c\.rotate\(-1\.45\)/.test(canvasSrc)) fail('fallback must paint fallen pose');

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) fail('no chrome binary');

async function getPuppeteer() {
  try { return await import('puppeteer-core'); } catch (_) {
    await new Promise((res, rej) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], { cwd: outDir, stdio: 'inherit' });
      p.on('exit', (c) => (c === 0 ? res() : rej(new Error('npm puppeteer'))));
    });
    return import(path.join(outDir, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'));
  }
}

async function run() {
  let server = null;
  try { server = await ensureSmokeServer(8799); } catch (_) {}

  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  const base = smokeBaseUrl(8799, '/index.html?nosplash=1');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });

  async function bootFight(w, h) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    return page.evaluate((wIn, hIn) => {
      const vv = window.visualViewport;
      if (vv) {
        try { Object.defineProperty(vv, 'width', { value: wIn, configurable: true }); } catch (_) {}
        try { Object.defineProperty(vv, 'height', { value: hIn, configurable: true }); } catch (_) {}
      }
      try {
        if (typeof save === 'object' && save) {
          save.tipsSeen = save.tipsSeen || {};
          save.tipsSeen.moveBarAim = 1;
          save.tipsSeen.firstPunch = 1;
        }
      } catch (_) {}
      try { if (UI && UI.hideFomoRitual) UI.hideFomoRitual(); } catch (_) {}
      try {
        const splash = document.getElementById('sfSplash');
        if (splash) { splash.classList.add('is-done'); splash.hidden = true; splash.style.display = 'none'; }
      } catch (_) {}
      if (typeof forceGameResize === 'function') forceGameResize();
      startGame('adventure', { level: 1, gamble: null, difficulty: 'normal' });
      const g = (window.__sf && window.__sf.game) || window.game;
      if (!g || !g.player) return { ok: false, why: 'no player' };
      if (g.aimTut) {
        if (typeof finishAimTutorial === 'function') finishAimTutorial(g, 'smoke');
        else g.aimTut = null;
      }
      g.inputLocked = false;
      if (typeof pinPlayfieldBodies === 'function') pinPlayfieldBodies(g);
      for (let i = 0; i < 60; i++) {
        try { g.update(1 / 30); } catch (_) {}
      }
      document.body.classList.add('is-playing');
      document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
      return { ok: true, w: typeof W === 'number' ? W : wIn, h: typeof H === 'number' ? H : hIn };
    }, w, h);
  }

  async function killPlayer() {
    return page.evaluate(() => {
      const g = (window.__sf && window.__sf.game) || window.game;
      const p = g && g.player;
      if (!p) return { ok: false, why: 'no player' };
      try { if (typeof p.takeDamage === 'function') p.takeDamage(9999, 0, g); } catch (_) {}
      p.hp = 0;
      p.deadT = 0.45;
      p.vy = 0;
      p.onGround = true;
      if (g.ground != null) p.y = g.ground;
      if (typeof pinPlayfieldBodies === 'function') pinPlayfieldBodies(g);
      try { g.draw(typeof ctx !== 'undefined' ? ctx : document.getElementById('game').getContext('2d')); } catch (e) {
        return { ok: false, why: 'draw-death:' + e };
      }
      return {
        ok: true,
        alive: p.alive,
        hp: p.hp,
        deadT: p.deadT,
        x: p.x,
        y: p.y,
        ground: g.ground,
        W: typeof W === 'number' ? W : 0,
        H: typeof H === 'number' ? H : 0,
      };
    });
  }

  async function rotateTo(w, h) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    return page.evaluate((wIn, hIn) => {
      const vv = window.visualViewport;
      if (vv) {
        try { Object.defineProperty(vv, 'width', { value: wIn, configurable: true }); } catch (_) {}
        try { Object.defineProperty(vv, 'height', { value: hIn, configurable: true }); } catch (_) {}
      }
      try {
        if (typeof innerWidth === 'number') {
          try { Object.defineProperty(window, 'innerWidth', { value: wIn, configurable: true }); } catch (_) {}
          try { Object.defineProperty(window, 'innerHeight', { value: hIn, configurable: true }); } catch (_) {}
        }
      } catch (_) {}
      if (typeof forceGameResize === 'function') forceGameResize();
      else if (typeof resize === 'function') resize();
      const g = (window.__sf && window.__sf.game) || window.game;
      const p = g && g.player;
      if (!p) return { ok: false, why: 'lost player' };
      p.hp = 0;
      p.deadT = 0.55;
      if (typeof pinPlayfieldBodies === 'function') pinPlayfieldBodies(g);
      if (g && typeof g.onResize === 'function') g.onResize();
      const canvas = document.getElementById('game');
      const c = canvas && canvas.getContext('2d');
      try { if (g && c) g.draw(c); } catch (e) {
        return { ok: false, why: 'draw-rotate:' + e };
      }
      const dpr = (typeof DPR === 'number' && DPR > 0) ? DPR : (c ? c.canvas.width / Math.max(1, wIn) : 2);
      const sample = (x, y) => {
        const ix = Math.max(0, Math.min(c.canvas.width - 1, Math.round(x * dpr)));
        const iy = Math.max(0, Math.min(c.canvas.height - 1, Math.round(y * dpr)));
        const d = c.getImageData(ix, iy, 1, 1).data;
        return [d[0], d[1], d[2], d[3]];
      };
      // Fallen pose lies ~70px toward -face, ~8px above feet.
      const face = (p.face || 1) >= 0 ? 1 : -1;
      const cx = p.x - face * 36;
      const cy = p.y - 10;
      let bright = 0;
      const pts = [];
      for (let ox = -40; ox <= 40; ox += 4) {
        for (let oy = -18; oy <= 8; oy += 3) {
          const px = sample(cx + ox, cy + oy);
          pts.push(px);
          if (px[0] + px[1] + px[2] > 300 && px[3] > 80) bright++;
        }
      }
      const png = canvas.toDataURL('image/png');
      return {
        ok: true,
        W: typeof W === 'number' ? W : wIn,
        H: typeof H === 'number' ? H : hIn,
        ground: g.ground,
        player: { x: p.x, y: p.y, hp: p.hp, deadT: p.deadT, face: p.face, onGround: p.onGround },
        visH: hIn,
        visW: wIn,
        bright,
        sampleN: pts.length,
        canvas: { cw: c.canvas.width, ch: c.canvas.height, dpr },
        png,
      };
    }, w, h);
  }

  function assertDeadOnFloor(label, snap, w, h) {
    if (!snap || !snap.ok) fail(label + ' failed: ' + JSON.stringify(snap && { why: snap.why }));
    if (snap.player.hp > 0) fail(label + ' player not dead');
    if (!(snap.player.y > 8) || snap.player.y > h + 2) {
      fail(label + ' dead y off canvas ' + snap.player.y + ' H=' + h);
    }
    if (Math.abs(snap.player.y - snap.ground) > 6) {
      fail(label + ' dead pose not on floor y=' + snap.player.y + ' ground=' + snap.ground);
    }
    if (snap.player.x < 8 || snap.player.x > w - 8) {
      fail(label + ' dead x off canvas ' + snap.player.x);
    }
    if (snap.bright < 3) {
      fail(label + ' no contrasting pixels on fallen pose ' + JSON.stringify({
        bright: snap.bright, player: snap.player, ground: snap.ground, W: snap.W, H: snap.H,
      }));
    }
  }

  async function saveShot(snap, name) {
    const destA = path.join(outDir, name + '.png');
    const destB = path.join(artDir, name + '.png');
    if (snap.png && snap.png.startsWith('data:image/png')) {
      fs.writeFileSync(destA, Buffer.from(snap.png.replace(/^data:image\/png;base64,/, ''), 'base64'));
    }
    delete snap.png;
    try { fs.copyFileSync(destA, destB); } catch (_) {}
    return destA;
  }

  const bootP = await bootFight(390, 844);
  if (!bootP.ok) fail('portrait boot: ' + JSON.stringify(bootP));
  const dieP = await killPlayer();
  if (!dieP.ok || dieP.hp > 0) fail('portrait death: ' + JSON.stringify(dieP));
  const deathPortrait = await rotateTo(390, 844);
  assertDeadOnFloor('portrait-death', deathPortrait, 390, 844);
  const shotG = await saveShot(deathPortrait, 'death-rotate-portrait-pose');

  const afterLand = await rotateTo(844, 390);
  assertDeadOnFloor('death-then-landscape', afterLand, 844, 390);
  const shotH = await saveShot(afterLand, 'death-rotate-portrait-to-landscape');

  const bootL = await bootFight(844, 390);
  if (!bootL.ok) fail('landscape boot: ' + JSON.stringify(bootL));
  const dieL = await killPlayer();
  if (!dieL.ok || dieL.hp > 0) fail('landscape death: ' + JSON.stringify(dieL));
  const deathLand = await rotateTo(844, 390);
  assertDeadOnFloor('landscape-death', deathLand, 844, 390);
  const shotL = await saveShot(deathLand, 'death-rotate-landscape-pose');

  const afterPort = await rotateTo(390, 844);
  assertDeadOnFloor('death-then-portrait', afterPort, 390, 844);
  const shotE = await saveShot(afterPort, 'death-rotate-landscape-to-portrait');

  await browser.close();
  if (server) try { server.close(); } catch (_) {}

  const report = {
    ok: true,
    app: '1.18.191',
    cases: {
      'G-portrait-death': { y: Math.round(deathPortrait.player.y), ground: Math.round(deathPortrait.ground), bright: deathPortrait.bright, shot: shotG },
      'H-death-to-landscape': { y: Math.round(afterLand.player.y), ground: Math.round(afterLand.ground), bright: afterLand.bright, shot: shotH },
      'L-landscape-death': { y: Math.round(deathLand.player.y), ground: Math.round(deathLand.ground), bright: deathLand.bright, shot: shotL },
      'E-death-to-portrait': { y: Math.round(afterPort.player.y), ground: Math.round(afterPort.ground), bright: afterPort.bright, shot: shotE },
    },
    pageErrors: pageErrors.slice(0, 4),
  };
  console.log(JSON.stringify(report, null, 2));
  console.log('SMOKE_OK death-rotate portrait↔landscape');
}

run().catch((e) => {
  console.error('SMOKE_FAIL', e && e.stack || e);
  process.exit(1);
});
