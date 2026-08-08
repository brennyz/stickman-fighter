#!/usr/bin/env node
/**
 * Harden guard: Input.move getter + fighter-move helpers must work.
 * Catches the versus-retire footgun where padDigitalMove vanished and
 * every combat frame threw — smokes that assign Input.move= mask that.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const outDir = '/tmp/sf-fighter-move';
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
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });

  const result = await page.evaluate(() => {
    const errors = [];
    const need = [
      'padDigitalMove', 'joyMoveAxis', 'applyFighterMove',
      'clampFighterX', 'fighterMoveXBounds', 'playerWalkInput',
    ];
    const missing = need.filter((n) => typeof globalThis[n] !== 'function');
    if (missing.length) return { ok: false, why: 'missing:' + missing.join(',') };

    // Getter must still be a getter — assigning Input.move breaks real pads.
    const desc = Object.getOwnPropertyDescriptor(Input, 'move');
    const moveIsGetter = !!(desc && typeof desc.get === 'function');
    if (!moveIsGetter) {
      return { ok: false, why: 'Input.move is not a getter (overwritten?)', desc: String(desc && desc.value) };
    }

    Input.releaseAll?.();
    Input.keys = Input.keys || {};
    Input.keys.d = false;
    Input.keys.arrowright = false;
    Input.keys.a = false;
    Input.keys.arrowleft = false;

    let idleMove = 0;
    try { idleMove = Input.move; } catch (e) { errors.push('idle:' + e); }

    Input.keys.d = true;
    Input.keys.arrowright = true;
    let rightMove = 0;
    try { rightMove = Input.move; } catch (e) { errors.push('right:' + e); }

    Input.keys.d = false;
    Input.keys.arrowright = false;
    Input.keys.a = true;
    Input.keys.arrowleft = true;
    let leftMove = 0;
    try { leftMove = Input.move; } catch (e) { errors.push('left:' + e); }

    Input.keys.a = false;
    Input.keys.arrowleft = false;

    // Joy axis path
    Input.joy.active = true;
    Input.joy.dx = 40;
    Input.joy.dy = 0;
    let joyMove = 0;
    try { joyMove = Input.move; } catch (e) { errors.push('joy:' + e); }
    Input.releaseJoy?.();

    const walk = typeof playerWalkInput === 'function' ? playerWalkInput() : null;

    // Live adventure: keys drive vx via real getter (no Input.move= assign).
    startGame('adventure', { level: 1, gamble: null });
    const g = game;
    if (!g || !g.player) return { ok: false, why: 'no game', errors };
    g.inputLocked = false;
    const x0 = g.player.x;
    Input.keys.d = true;
    Input.keys.arrowright = true;
    const DT = 1 / 30;
    for (let i = 0; i < 45; i++) {
      try { g.update(DT); } catch (e) { errors.push('update:' + e); break; }
    }
    const x1 = g.player.x;
    const vx = g.player.vx;
    Input.keys.d = false;
    Input.keys.arrowright = false;

    // Touch pad press path (punch button) — clear startGame input suppress.
    let punchOk = false;
    try {
      Input.suppressUntil = 0;
      if (typeof Input.layout === 'function') Input.layout(W, H);
      const punch = (Input.buttons || []).find((b) => b.id === 'punch');
      if (punch) {
        Input.onDown(punch.x, punch.y, 91);
        punchOk = !!(punch.held || Input.pressed?.punch);
        if (!punchOk) {
          Input.press('punch');
          punchOk = !!Input.pressed?.punch;
        }
        Input.onUp(91);
      } else {
        Input.press('punch');
        punchOk = !!Input.pressed?.punch;
      }
      if (punchOk) Input.take('punch');
    } catch (e) {
      errors.push('touch:' + e);
    }

    const moved = (x1 - x0) > 4 || vx > 20;
    const ok = missing.length === 0
      && moveIsGetter
      && Math.abs(idleMove) < 0.05
      && rightMove > 0.5
      && leftMove < -0.5
      && joyMove > 0.2
      && moved
      && punchOk
      && errors.length === 0;

    return {
      ok,
      moveIsGetter,
      idleMove,
      rightMove,
      leftMove,
      joyMove,
      walk,
      x0, x1, vx,
      moved,
      punchOk,
      errors: errors.slice(0, 8),
      app: typeof APP_VERSION !== 'undefined' ? APP_VERSION : null,
      sw: typeof SW_CACHE_REV !== 'undefined' ? SW_CACHE_REV : null,
    };
  });

  await browser.close();
  if (server) server.close();

  if (pageErrors.length) {
    result.pageErrors = pageErrors.slice(0, 5);
    result.ok = false;
  }

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('SMOKE_OK fighter-move');
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
