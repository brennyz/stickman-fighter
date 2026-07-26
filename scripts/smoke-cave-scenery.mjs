#!/usr/bin/env node
/** Cave pixel scenery: grot theme uses cave floor + menu vista exists. */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

const outDir = '/tmp/sf-cave-scenery';
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
  const port = 8793;
  let server = null;
  try { server = await startStaticServer(root, port); } catch (_) {}

  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  await page.goto(process.argv[2] || `http://127.0.0.1:${port}/index.html`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });

  const result = await page.evaluate(() => {
    const th = THEMES && THEMES.grot;
    const hasPal = typeof CAVE_PAL !== 'undefined' && CAVE_PAL.amber === '#c48840';
    const hasFloor = typeof drawCaveFloorGround === 'function';
    const hasDecor = typeof drawCaveStalactiteDecor === 'function';
    const hasVista = typeof drawMenuCaveVista === 'function';
    const hasWater = typeof drawCaveWaterBand === 'function';
    const c = document.createElement('canvas');
    c.width = 200; c.height = 160;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 200, 160);
    drawBackground(ctx, 'grot', 1.2, 110, 40, null);
    const d = ctx.getImageData(0, 0, 200, 160).data;
    let amberN = 0, darkN = 0, mineralN = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
      if (a < 20) continue;
      if (r > 140 && g > 90 && g < 180 && b < 100) amberN++;
      if (r < 50 && g < 55 && b < 70) darkN++;
      if (r > 180 && g > 170 && b > 150 && Math.abs(r - g) < 40) mineralN++;
    }
    return {
      ok: !!(th && hasPal && hasFloor && hasDecor && hasVista && hasWater
        && amberN > 40 && darkN > 200 && mineralN > 20
        && th.sky1 === '#07090e'),
      hasPal, hasFloor, hasDecor, hasVista, hasWater,
      amberN, darkN, mineralN,
      sky1: th && th.sky1,
      deco: th && th.deco,
    };
  });

  await browser.close();
  if (server) try { server.close(); } catch (_) {}
  if (!result.ok) {
    console.error('SMOKE_FAIL cave-scenery', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('SMOKE_OK cave-scenery', JSON.stringify(result));
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
