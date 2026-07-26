#!/usr/bin/env node
/** Pet tame (Slymo) on last kill of wave 1 + wave clear — must not lock fight. */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const outDir = '/tmp/sf-petwave';
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

    startGame('adventure', { level: 1, gamble: null });
    const g = game;
    if (!g || !g.player) return { ok: false, why: 'no game' };

    // One kill shy of Slymo tame threshold (common = 12)
    if (!save.dex) save.dex = {};
    save.dex.slymo = 11;
    if (!save.pets) save.pets = {};
    delete save.pets.pet_slymo;
    save.activePet = null;
    save.stats = save.stats || {};

    g.inputLocked = false;
    g.over = false;
    g.waveIdx = 0;
    g.wavePause = 0;
    g.spawnQueue = [];
    g.monsters = [];

    // Simulate last monster of wave 0
    const m = {
      spId: 'slymo',
      sp: SPECIES.slymo,
      x: 400, y: g.ground, size: 17,
      alive: false, elite: false, giant: false, superBoss: false,
    };
    try { g.onMonsterKilled(m); } catch (e) { return { ok: false, why: 'onMonsterKilled:' + e }; }

    const tamed = !!(save.pets && save.pets.pet_slymo);
    const hasPet = !!g.pet;

    // Wave 0 clear state
    g.monsters = [];
    g.spawnQueue = [];
    g.wavePause = 0;

    let updateThrows = 0;
    let firstUpdateErr = null;
    let frames = 0;
    for (let i = 0; i < 120; i++) {
      try {
        g.update(1 / 30);
        frames++;
      } catch (e) {
        updateThrows++;
        if (!firstUpdateErr) firstUpdateErr = String(e && (e.stack || e.message || e));
        errors.push('update:' + String(e));
      }
    }

    const stickErrors = errors.filter((e) => e.includes('[Stickman]'));
    const partGateStarted = !!g.partGate || (g.wavePause > 0 && g.stagePart === 1 && g.waveIdx === 0);
    return {
      ok: tamed && hasPet && !g.inputLocked && !g.over && state === 'play' && frames === 120
        && updateThrows === 0 && (g.waveIdx >= 1 || (g.wavePause > 0 && !g.partGate)),
      tamed,
      hasPet,
      activePet: save.activePet,
      waveIdx: g.waveIdx,
      partGate: !!g.partGate,
      wavePause: g.wavePause,
      inputLocked: g.inputLocked,
      over: g.over,
      state,
      frames,
      updateThrows,
      firstUpdateErr,
      stickErrors: stickErrors.slice(0, 5),
      bannerPet: (g.banners || []).some((b) => String(b.txt || '').toLowerCase().includes('slymo')),
    };
  });

  await browser.close();
  if (server) server.close();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('SMOKE_OK pet-wave');
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
