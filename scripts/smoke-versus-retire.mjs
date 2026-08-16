#!/usr/bin/env node
/**
 * Versus-retire leftovers after local 2P was stubbed.
 *
 * 1) combatEntryFor must survive rosterId 'hero' (vsRosterEntry() is null).
 *    That throw killed punch/weapon/kick in attackSpec.
 * 2) Dead versus UI / init must not throw (trackVsRosterUse, renderCharSelect,
 *    startGame('versus'), lastPlay resume, vsFighterStats(null)).
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const outDir = '/tmp/sf-versus-retire';
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
  try { server = await ensureSmokeServer(8789); } catch (_) {}

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

  const base = process.argv[2] || smokeBaseUrl(8789);
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });

  const result = await page.evaluate(() => {
    const errors = [];
    const note = (label, e) => errors.push(label + ':' + (e && e.message ? e.message : e));

    const need = ['combatEntryFor', 'vsRosterName', 'trackVsRosterUse', 'vsFighterStats', 'toastVersusRetired'];
    const missing = need.filter((n) => typeof globalThis[n] !== 'function');
    if (missing.length) return { ok: false, why: 'missing:' + missing.join(',') };

    let profile = null;
    try {
      profile = combatEntryFor({ rosterId: 'hero', isPlayer: true });
    } catch (e) {
      return { ok: false, why: 'combatEntryFor(hero) threw', err: String(e) };
    }
    if (!profile || typeof profile.crit !== 'number') {
      return { ok: false, why: 'combatEntryFor(hero) missing crit', profile };
    }

    let statsNull = null;
    try {
      statsNull = vsFighterStats(null);
    } catch (e) {
      return { ok: false, why: 'vsFighterStats(null) threw', err: String(e) };
    }
    if (!statsNull || typeof statsNull.str !== 'number') {
      return { ok: false, why: 'vsFighterStats(null) incomplete', statsNull };
    }

    try { trackVsRosterUse('hero', 'hero'); } catch (e) { note('trackVsRosterUse', e); }
    let rosterName = null;
    try { rosterName = vsRosterName('hero'); } catch (e) { note('vsRosterName', e); }
    if (rosterName == null) rosterName = '';

    let versusStartOk = false;
    try {
      startGame('versus', { p1: 'hero', p2: 'ryu' });
      versusStartOk = !game || game.mode !== 'versus' || !game.player;
    } catch (e) {
      note('startVersus', e);
    }

    let charSelectOk = false;
    try {
      UI.renderCharSelect();
      charSelectOk = true;
    } catch (e) {
      note('renderCharSelect', e);
    }

    let dockOk = false;
    try {
      if (typeof updateCharFightDock === 'function') updateCharFightDock();
      dockOk = true;
    } catch (e) {
      note('updateCharFightDock', e);
    }

    let resumeOk = false;
    try {
      save.lastPlay = { mode: 'versus', p1: 'hero', p2: 'ryu' };
      const resumed = resumeLastPlay();
      resumeOk = resumed === false;
    } catch (e) {
      note('resumeLastPlay', e);
    }

    startGame('adventure', { level: 1, gamble: null });
    const g = game;
    if (!g || !g.player) return { ok: false, why: 'no adventure', errors };

    g.inputLocked = false;
    g.partGate = null;
    g.traveling = false;
    g.over = false;
    Input.suppressUntil = 0;
    Input.dualMode = false;

    const fire = (action) => {
      g.player.attack = null;
      g.player.state = 'idle';
      g.player.invulnT = 0;
      Input.suppressUntil = 0;
      Input.pressed = {};
      try {
        Input.press(action);
        g.update(1 / 30);
      } catch (e) {
        note(action + '.update', e);
        return { kind: null, threw: true };
      }
      return { kind: g.player.attack && g.player.attack.kind, threw: false };
    };

    const punch = fire('punch');
    const kick = fire('kick');
    const weapon = fire('weapon');

    const punchOk = punch.kind === 'punch' && !punch.threw;
    const kickOk = kick.kind === 'kick' && !kick.threw;
    const weaponOk = !!weapon.kind && !weapon.threw;

    const ok = missing.length === 0
      && punchOk && kickOk && weaponOk
      && versusStartOk && charSelectOk && dockOk && resumeOk
      && errors.length === 0;

    return {
      ok,
      punch, kick, weapon,
      punchOk, kickOk, weaponOk,
      versusStartOk, charSelectOk, dockOk, resumeOk,
      rosterName, profile, statsNull,
      rosterId: g.player.rosterId,
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
  console.log('SMOKE_OK versus-retire leftovers');
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
