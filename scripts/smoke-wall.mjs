#!/usr/bin/env node
/** Wall mode: timer tick, brick smash, combo milestones, finish — no freeze. */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const outDir = '/tmp/sf-wall';
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
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('PAGE_ERR', msg.text());
  });
  const base = process.argv[2] || smokeBaseUrl(8787);
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 20000 });

  const result = await page.evaluate(() => {
    const errors = [];
    const origErr = console.error;
    console.error = (...args) => {
      errors.push(args.map(String).join(' '));
      origErr.apply(console, args);
    };

    save.bestWall = 40;
    startGame('wall');
    const g = game;
    if (!g || g.mode !== 'wall' || !g.bricks?.length) {
      return { ok: false, why: 'wall not started', errors };
    }

    const t0 = g.wallTimer;
    try { g.updateWall(0.4); } catch (e) { return { ok: false, why: 'updateWall:' + e, errors }; }
    const timerTicked = g.wallTimer < t0;

    // Smash one brick → score + combo
    const live = g.bricks.find((b) => b.hp > 0);
    if (!live) return { ok: false, why: 'no live brick', errors };
    live.hp = 0;
    g.score++;
    g.combo = 3;
    g.comboT = g.wallComboWindow || 1.4;
    g.noteCombo();

    const paceFn = typeof wallRecordPaceDelta === 'function';
    const paceDelta = paceFn ? wallRecordPaceDelta(g) : null;
    const pauseLine = typeof wallPauseSubtitle === 'function' ? wallPauseSubtitle(g) : '';

    g.wallTimer = 40;
    g.score = 20;
    const proj = typeof wallProjectedScore === 'function' ? wallProjectedScore(g) : null;
    const paceNow = wallRecordPaceDelta(g);
    const onPaceEarly = typeof wallHudOnPace === 'function' ? wallHudOnPace(g) : null;
    const paceEqualsProj = proj === Math.round((20 / 20) * 60);

    // Fast-forward to time-up
    g.wallTimer = 0.05;
    g.over = false;
    g.inputLocked = false;
    try { g.updateWall(0.1); } catch (e) { return { ok: false, why: 'finish:' + e, errors }; }

    return {
      ok: g.over === true && g.score >= 1 && timerTicked && pauseLine.length > 3
        && proj === 60 && paceNow === 7 && onPaceEarly === true && paceEqualsProj,
      timerTicked,
      score: g.score,
      over: g.over,
      paceFn,
      paceDelta,
      pauseLine: pauseLine.slice(0, 80),
      combo10Hint: !!(g.wallHints && 'combo10' in g.wallHints),
      proj,
      paceNow,
      onPaceEarly,
      paceEqualsProj,
      errors,
    };
  });

  await browser.close();
  if (server) server.close();

  if (!result.ok) {
    console.error('SMOKE_FAIL wall-mode', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('SMOKE_OK wall-mode', JSON.stringify(result));
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
