#!/usr/bin/env node
/** Rinnegan: tweerichtings lichtschits-golf met taperende strook. */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

const outDir = '/tmp/sf-rinnegan';
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

function startStaticServer(root, port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let rel = decodeURIComponent((req.url || '/').split('?')[0]);
      if (rel === '/') rel = '/index.html';
      const file = path.join(root, rel.replace(/^\//, ''));
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('no'); return;
      }
      const ext = path.extname(file);
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.once('error', (err) => {
      if (err && err.code === 'EADDRINUSE') resolve(null);
      else reject(err);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function run() {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const port = 8787;
  let server = null;
  try {
    server = await startStaticServer(root, port);
  } catch (_) {
    /* already running */
  }

  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  const base = process.argv[2] || `http://127.0.0.1:${port}/index.html`;
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });

  const result = await page.evaluate(() => {
    const DT = 1 / 30;
    const errors = [];
    const sk = skillById('rinnegan');
    if (!sk || sk.behavior !== 'slash') {
      return { ok: false, reason: 'behavior', behavior: sk && sk.behavior, dmgMul: sk && sk.dmgMul };
    }

    try {
      save.skill = 'rinnegan';
      save.activeJutsu = 'rinnegan';
      save.lvl = 30;
    } catch (_) {}

    startGame('adventure', { level: 1, gamble: null });

    const p = game.player;
    p.energy = 100;
    p.x = 200;
    game.inputLocked = false;
    game.projectiles = [];

    // Direct cast (equip-gate kan in smoke Lv1 adventure blokkeren)
    try { game.spawnJutsu(p, { jutsu: 'rinnegan', dmg: 40 }); }
    catch (e) { errors.push('spawn:' + String(e)); }

    const wave0 = game.projectiles.find((pr) => pr.kind === 'rinnegan' && pr.slashWave) || null;
    for (let i = 0; i < 12; i++) {
      try { game.update(DT); } catch (e) { errors.push(String(e)); }
    }

    const wave = game.projectiles.find((pr) => pr.kind === 'rinnegan' && pr.slashWave) || wave0;
    const midH = slashWaveHalfHeight({ r0: 42, slashMaxReach: 460 }, 0);
    const halfH = slashWaveHalfHeight({ r0: 42, slashMaxReach: 460 }, 230);
    const tipH = slashWaveHalfHeight({ r0: 42, slashMaxReach: 460 }, 460);

    let leftHit = false, rightHit = false, farMiss = true, aboveMiss = true;
    if (wave) {
      leftHit = projHitsTarget(wave, wave.x - wave.slashReach * 0.65, wave.y, 18);
      rightHit = projHitsTarget(wave, wave.x + wave.slashReach * 0.65, wave.y, 18);
      farMiss = projHitsTarget(wave, wave.x + wave.slashReach + 90, wave.y, 18);
      aboveMiss = projHitsTarget(wave, wave.x + wave.slashReach * 0.5, wave.y - 180, 10);
    }

    const kbL = projKnockDir(wave || { slashWave: true, x: 200 }, 50);
    const kbR = projKnockDir(wave || { slashWave: true, x: 200 }, 350);

    return {
      ok: !!(
        sk.behavior === 'slash'
        && sk.dmgMul >= 2.9
        && wave
        && (wave.slashReach || 0) > 80
        && leftHit
        && rightHit
        && !farMiss
        && !aboveMiss
        && midH > halfH
        && halfH > tipH
        && kbL < 0
        && kbR > 0
        && typeof drawRinneganSlashWave === 'function'
        && errors.length === 0
      ),
      behavior: sk.behavior,
      dmgMul: sk.dmgMul,
      reach: wave && wave.slashReach,
      r0: wave && wave.r0,
      leftHit,
      rightHit,
      farMiss,
      aboveMiss,
      midH,
      halfH,
      tipH,
      kbL,
      kbR,
      hasDraw: typeof drawRinneganSlashWave === 'function',
      errors,
    };
  });

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (server) server.close();
  if (!result.ok) {
    console.error('SMOKE_FAIL rinnegan-slash');
    process.exit(1);
  }
  console.log('SMOKE_OK rinnegan-slash');
}

run().catch((e) => {
  console.error('SMOKE_FAIL', e);
  process.exit(1);
});
