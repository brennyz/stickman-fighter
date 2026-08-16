#!/usr/bin/env node
/**
 * Mobile fight buttons after versus-retire merge.
 *
 * Adventure tags the player rosterId 'hero'. vsRosterEntry() is a null stub.
 * combatEntryFor used to dereference that null inside attackSpec — punch /
 * weapon / kick then threw every frame (joystick still moved).
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const outDir = '/tmp/sf-touch-buttons';
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
  try { server = await ensureSmokeServer(8788); } catch (_) {}

  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  await page.emulate({
    viewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  const base = process.argv[2] || smokeBaseUrl(8788);
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });

  const result = await page.evaluate(() => {
    const errors = [];
    const note = (label, e) => errors.push(label + ':' + (e && e.message ? e.message : e));

    let profile = null;
    try {
      profile = combatEntryFor({ rosterId: 'hero', isPlayer: true });
    } catch (e) {
      return { ok: false, why: 'combatEntryFor(hero) threw', err: String(e) };
    }
    if (!profile || typeof profile.crit !== 'number') {
      return { ok: false, why: 'combatEntryFor(hero) missing crit', profile };
    }

    startGame('adventure', { level: 1, gamble: null });
    const g = game;
    if (!g || !g.player) return { ok: false, why: 'no game' };

    g.inputLocked = false;
    g.partGate = null;
    g.traveling = false;
    g.over = false;
    g.player.invulnT = 0;
    g.player.hurtT = 0;
    g.player.attack = null;
    g.player.state = 'idle';
    Input.suppressUntil = 0;
    Input.dualMode = false;
    if (typeof Input.layout === 'function') Input.layout(W, H);

    const ids = (Input.buttons || []).map((b) => b.id);
    const need = ['punch', 'weapon', 'kick'];
    const missingBtns = need.filter((id) => !ids.includes(id));

    const fire = (action) => {
      g.player.attack = null;
      g.player.state = 'idle';
      g.player.invulnT = 0;
      Input.suppressUntil = 0;
      Input.pressed = {};
      const btn = (Input.buttons || []).find((b) => b.id === action);
      try {
        if (btn) {
          Input.onDown(btn.x, btn.y, 700 + action.length);
          Input.onUp(700 + action.length);
        } else {
          Input.press(action);
        }
      } catch (e) {
        note(action + '.down', e);
        return { kind: null, threw: true };
      }
      try {
        g.update(1 / 30);
      } catch (e) {
        note(action + '.update', e);
        return { kind: null, threw: true };
      }
      return {
        kind: g.player.attack && g.player.attack.kind,
        threw: false,
        pressedLeft: !!(Input.pressed && Input.pressed[action]),
      };
    };

    const punch = fire('punch');
    const kick = fire('kick');
    const weapon = fire('weapon');

    // Canvas-coord path: punch button mapped through pointerGameCoords identity
    let canvasPunch = { kind: null, threw: false };
    try {
      g.player.attack = null;
      g.player.state = 'idle';
      g.player.invulnT = 0;
      Input.suppressUntil = 0;
      Input.pressed = {};
      const punchBtn = (Input.buttons || []).find((b) => b.id === 'punch');
      if (punchBtn && typeof pointerGameCoords === 'function' && canvas) {
        const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
        const clientX = rect.left + (punchBtn.x / Math.max(1, W)) * (rect.width || W);
        const clientY = rect.top + (punchBtn.y / Math.max(1, H)) * (rect.height || H);
        const p = pointerGameCoords(clientX, clientY);
        Input.onDown(p.x, p.y, 801);
        Input.onUp(801);
        g.update(1 / 30);
        canvasPunch = { kind: g.player.attack && g.player.attack.kind, threw: false };
      }
    } catch (e) {
      note('canvasPunch', e);
      canvasPunch = { kind: null, threw: true };
    }

    const punchOk = punch.kind === 'punch' && !punch.threw;
    const kickOk = kick.kind === 'kick' && !kick.threw;
    // vuist weapon maps to punch; any started attack counts
    const weaponOk = !!weapon.kind && !weapon.threw;
    const canvasOk = !canvasPunch.threw && (canvasPunch.kind === 'punch' || canvasPunch.kind == null);

    const ok = punchOk && kickOk && weaponOk && !canvasPunch.threw
      && missingBtns.length === 0
      && errors.length === 0
      && g.player.rosterId === 'hero';

    return {
      ok,
      punch,
      kick,
      weapon,
      canvasPunch,
      canvasOk,
      punchOk,
      kickOk,
      weaponOk,
      missingBtns,
      ids,
      rosterId: g.player.rosterId,
      profile,
      errors: errors.slice(0, 8),
      app: typeof APP_VERSION !== 'undefined' ? APP_VERSION : null,
      sw: typeof SW_CACHE_REV !== 'undefined' ? SW_CACHE_REV : null,
    };
  });

  await browser.close();
  if (server) try { server.close(); } catch (_) {}

  if (pageErrors.length) {
    result.pageErrors = pageErrors.slice(0, 5);
    result.ok = false;
  }

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('SMOKE_OK touch-buttons');
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
