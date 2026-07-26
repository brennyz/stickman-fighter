#!/usr/bin/env node
/** Boemerang: throw weapon, L-shape art, flies out then returns (not spear melee). */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

const outDir = '/tmp/sf-boomerang';
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
  const port = 8791;
  let server = null;
  try { server = await startStaticServer(root, port); } catch (_) {}

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
    const isThrow = typeof isThrowWeapon === 'function' && isThrowWeapon('boemerang');
    const isSpeerThrow = typeof isThrowWeapon === 'function' && isThrowWeapon('speer');
    const famBoom = typeof weaponMoveFamily === 'function' ? weaponMoveFamily('boemerang') : 'n/a';
    const famSpeer = typeof weaponMoveFamily === 'function' ? weaponMoveFamily('speer') : 'n/a';

    try {
      save.lvl = 20;
      save.unlocked = 20;
      save.weapon = 'boemerang';
    } catch (e) { errors.push('save:' + String(e)); }

    try {
      startGame('adventure', { level: 1, gamble: null });
    } catch (e) { errors.push('start:' + String(e)); }

    const p = game && game.player;
    if (!p) {
      return { ok: false, errors: errors.concat(['no player']), isThrow, famBoom, famSpeer, isSpeerThrow };
    }

    p.weapon = (typeof applySummonTier === 'function'
      ? applySummonTier(weaponById('boemerang'))
      : weaponById('boemerang'));
    p._shurikenCd = 0;
    p._boomerOut = false;
    p._shurikenBurst = [];
    p.x = 180;
    p.face = 1;
    game.inputLocked = false;
    game.projectiles = [];

    try { game.throwShuriken(p); } catch (e) { errors.push('throw:' + String(e)); }

    const afterThrow = game.projectiles.filter(x => x.kind === 'boemerang');
    if (!afterThrow.length) {
      return {
        ok: false,
        errors: errors.concat(['no boom proj']),
        isThrow, famBoom, famSpeer, isSpeerThrow,
        boomerOut: !!p._boomerOut,
      };
    }

    let sawReturning = false;
    let sawCaught = false;
    let maxX = afterThrow[0].x;
    for (let i = 0; i < 90; i++) {
      try { game.update(DT); } catch (e) { errors.push('upd:' + String(e)); break; }
      const boom = game.projectiles.find(x => x.kind === 'boemerang');
      if (boom) {
        maxX = Math.max(maxX, boom.x);
        if (boom.returning) sawReturning = true;
      } else if (sawReturning) {
        sawCaught = true;
        break;
      }
    }

    return {
      ok: isThrow && !isSpeerThrow && famBoom == null && famSpeer === 'spear'
        && afterThrow.length === 1 && sawReturning && (sawCaught || !p._boomerOut)
        && errors.length === 0,
      isThrow,
      isSpeerThrow,
      famBoom,
      famSpeer,
      threw: afterThrow.length,
      sawReturning,
      sawCaught,
      boomerOut: !!p._boomerOut,
      maxX,
      errors: errors.slice(0, 8),
    };
  });

  await browser.close();
  if (server) server.close();

  if (!result.ok) {
    console.error('SMOKE_FAIL boomerang', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('SMOKE_OK boomerang-return', JSON.stringify(result));
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
