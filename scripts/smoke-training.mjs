#!/usr/bin/env node
/** Training vs RabbitRobot: one telegraph at a time, Pierce bar matches windup. */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const outDir = '/tmp/sf-training';
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
  const base = process.argv[2] || smokeBaseUrl(8787);
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 20000 });

  const result = await page.evaluate(() => {
    try {
      startGame('training');
      const g = game;
      if (!g || g.mode !== 'training' || !g.robot) {
        return { ok: false, why: 'training not started' };
      }
      g.phase = 'fight';
      g.phaseT = 2;
      g.inputLocked = false;
      g.over = false;
      g.trainDummyGrace = 0;
      g.player.onGround = true;

      g.trainLaserTelegraph = 0.8;
      g.robot.startAttack('special', g);
      if (!g.robot.attack || g.robot.attack.kind !== 'special') {
        return { ok: false, why: 'robot special did not start (energy gate?)' };
      }
      for (let i = 0; i < 8; i++) g.update(1 / 60);
      const laserCancelled = g.trainLaserTelegraph === 0;

      g.startRound();
      g.phase = 'fight';
      g.phaseT = 2;
      g.inputLocked = false;
      g.trainDummyGrace = 0;
      g.player.onGround = true;
      g.trainLaserTelegraph = 0;
      g.trainLaserCd = 9;
      g.robot.startAttack('special', g);

      let sawTele = false;
      let teleLeqRemain = true;
      let teleMaxOk = true;
      let fired = false;
      for (let i = 0; i < 90; i++) {
        g.update(1 / 60);
        const a = g.robot.attack;
        if (a && a.kind === 'special' && a._telegraphed && !a.fired) {
          sawTele = true;
          const remain = Math.max(0, a.windup - a.t);
          if (g.trainTelegraphT > remain + 0.05) teleLeqRemain = false;
          if ((g.trainPierceTeleMax || 0) < 0.2) teleMaxOk = false;
        }
        if (a && a.fired) { fired = true; break; }
        if (!a && sawTele) { fired = true; break; }
      }
      const barCleared = (g.trainTelegraphT || 0) === 0;

      const lossTip = typeof t === 'function' ? t('combat.trainLossTip') : '';
      const noDuckLie = !/duck/i.test(lossTip);

      return {
        ok: laserCancelled && sawTele && teleLeqRemain && teleMaxOk && fired && barCleared && noDuckLie,
        laserCancelled,
        sawTele,
        teleLeqRemain,
        teleMaxOk,
        fired,
        barCleared,
        noDuckLie,
        trainTelegraphT: g.trainTelegraphT,
      };
    } catch (e) {
      return { ok: false, why: String(e && e.stack || e) };
    }
  });

  await browser.close();
  if (server) server.close();

  if (!result.ok) {
    console.error('SMOKE_FAIL training-telegraph', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('SMOKE_OK training-telegraph', JSON.stringify(result));
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
