#!/usr/bin/env node
/** Lv1 golf 1/2 → 2/2 zonder checkpoint: geen partGate, waveIdx moet naar 1. */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = '/tmp/sf-wave12';
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
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  const base = process.argv[2] || 'http://127.0.0.1:8787/index.html';
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });

  const result = await page.evaluate(() => {
    const DT = 1 / 30;
    startGame('adventure', { level: 1, gamble: null });
    const g = game;
    g.inputLocked = false;
    let errors = [];
    let sawWaveClear = false;
    let frames = 0;
    for (let i = 0; i < 800; i++) {
      frames++;
      if (g.betweenT > 0) g.betweenT = Math.min(g.betweenT, DT);
      Input.move = 0;
      if (Input.keys) { Input.keys.d = false; Input.keys.arrowright = false; }
      for (const m of g.monsters) if (m.alive) try { m.takeDamage(999999, 0, g); } catch (e) { errors.push(String(e)); }
      try { g.update(DT); } catch (e) { errors.push('update:' + e); }
      if (g.wavePause > 0 && !g.partGate) sawWaveClear = true;
      if (g.waveIdx >= 1) break;
    }
    const deadLeft = g.monsters.filter((m) => !m.alive).length;
    return {
      ok: g.waveIdx >= 1 && !g.partGate && sawWaveClear && errors.length === 0 && deadLeft === 0,
      waveIdx: g.waveIdx,
      partGate: !!g.partGate,
      wavePause: g.wavePause,
      sawWaveClear,
      deadLeft,
      waves: g.level?.waves?.length,
      boundary: typeof partBoundaryWaveIdx === 'function' ? partBoundaryWaveIdx(g.level.waves.length, 1) : null,
      errors: errors.slice(0, 5),
      frames,
    };
  });

  await browser.close();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('SMOKE_OK wave1-to-2');
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
