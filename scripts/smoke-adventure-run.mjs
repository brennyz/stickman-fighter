#!/usr/bin/env node
/**
 * Simuleert een volledig avontuur-level in headless Chrome:
 * start → golven → checkpoint-lopen → level-klaar.
 * Vangt ReferenceErrors / update-crashes / vastzittende states.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const outDir = '/tmp/sf-adv-run';
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
  page.on('console', (msg) => {
    if (msg.type() === 'error' && String(msg.text()).includes('[Stickman]')) {
      pageErrors.push(msg.text());
    }
  });

  const base = process.argv[2] || smokeBaseUrl(8787);
  const levelN = Number(process.argv[3]) || 1;
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 20000 });

  const result = await page.evaluate((lv) => {
    const DT = 1 / 30;
    const MAX_FRAMES = 5000;
    const STUCK_FRAMES = 180;
    const log = [];
    const errors = [];
    const milestones = [];

    function snap(label) {
      const g = game;
      milestones.push({
        label,
        t: g ? Math.round(g.t * 10) / 10 : 0,
        waveIdx: g?.waveIdx,
        stagePart: g?.stagePart,
        partGate: !!g?.partGate,
        wavePause: g?.wavePause ? Math.round(g.wavePause * 100) / 100 : 0,
        over: !!g?.over,
        inputLocked: !!g?.inputLocked,
        monsters: g ? g.monsters.filter((m) => m.alive).length : 0,
        spawnQ: g?.spawnQueue?.length || 0,
        state: typeof state !== 'undefined' ? state : null,
      });
    }

    function walkRight(on) {
      if (typeof Input === 'undefined') return;
      Input.move = on ? 1 : 0;
      Input.keys = Input.keys || {};
      Input.keys.d = !!on;
      Input.keys.arrowright = !!on;
    }

    function killAll(g) {
      for (const m of g.monsters) {
        if (!m.alive) continue;
        try { m.takeDamage(999999, 0, g); } catch (e) { errors.push('kill:' + e); }
      }
    }

    startGame('adventure', { level: lv, gamble: null });
    const g = game;
    if (!g || !g.player) return { ok: false, why: 'no game after start' };

    g.inputLocked = false;
    g.over = false;
    if (!save.stats) save.stats = {};
    if (!save.dex) save.dex = {};
    walkRight(false);
    snap('start');

    let stuck = 0;
    let lastSig = '';
    let frames = 0;
    let updateThrows = 0;
    let prevWave = g.waveIdx;
    let prevPart = !!g.partGate;
    let prevStage = g.stagePart;

    for (let i = 0; i < MAX_FRAMES; i++) {
      frames++;
      if (g.over) break;

      // Versnel wachttijden tussen golven
      if (g.betweenT > 0) g.betweenT = Math.min(g.betweenT, DT);
      if (g.partGate) walkRight(true);
      else walkRight(false);

      if (!g.partGate && g.monsters.some((m) => m.alive)) killAll(g);

      try {
        g.update(DT);
      } catch (e) {
        updateThrows++;
        if (errors.length < 8) errors.push('update:' + String(e && (e.stack || e.message || e)));
      }

      if (g.waveIdx !== prevWave) {
        snap('wave-' + g.waveIdx);
        prevWave = g.waveIdx;
      }
      if (!!g.partGate !== prevPart) {
        snap(g.partGate ? 'partGate-open' : 'partGate-done');
        prevPart = !!g.partGate;
      }
      if (g.stagePart !== prevStage) {
        snap('stagePart-' + g.stagePart);
        prevStage = g.stagePart;
      }

      const sig = [g.waveIdx, g.stagePart, !!g.partGate, g.wavePause > 0 ? 1 : 0, g.monsters.filter((m) => m.alive).length, g.spawnQueue.length].join('|');
      if (sig === lastSig) stuck++;
      else { stuck = 0; lastSig = sig; }

      if (stuck >= STUCK_FRAMES) {
        errors.push('stuck:' + sig);
        break;
      }
    }

    walkRight(false);
    snap('end');

    const waves = g.level?.waves?.length || 0;
    const won = g.over && g.player?.alive;
    const ok = won && updateThrows === 0 && errors.length === 0 && state === 'play';

    return {
      ok,
      level: lv,
      waves,
      won,
      frames,
      updateThrows,
      kills: g.kills,
      finalWaveIdx: g.waveIdx,
      stagePart: g.stagePart,
      inputLocked: g.inputLocked,
      state,
      errors: errors.slice(0, 10),
      milestones,
      appVersion: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '?',
    };
  }, levelN);

  result.pageErrors = pageErrors.slice(0, 10);
  if (result.pageErrors.length) result.ok = false;

  await browser.close();
  if (server) server.close();
  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    console.error('SMOKE_FAIL adventure-run level', levelN);
    process.exit(1);
  }
  console.log('SMOKE_OK adventure-run level', levelN);
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
