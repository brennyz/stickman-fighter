#!/usr/bin/env node
/** Adventure BG drop: never skip fight draw; canvas resize ignores Perf.tier. */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

const outDir = '/tmp/sf-adv-bg';
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
  const port = 8796;
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
    const skipAlwaysFalse = Perf.skipHeavyDraw() === false;
    Perf.tier = 2;
    Perf.frames = 100;
    const prevState = typeof state !== 'undefined' ? state : 'menu';
    try { state = 'play'; } catch (_) {}
    const stillFalse = Perf.skipHeavyDraw() === false;
    const hasLight = typeof Perf.lightFxFrame === 'function';
    const lightOn = hasLight && Perf.lightFxFrame() === true;
    try { state = prevState; } catch (_) {}

    const resizeSrc = String(resize);
    // sizeKey must not bake Perf.tier (comment mentioning tier is ok)
    const noTierInKey = !/sizeKey\s*=\s*[^;]*Perf\.tier/.test(resizeSrc)
      && !/\+ 't' \+\s*Perf\.tier/.test(resizeSrc)
      && !/@' \+ newDpr \+ 't'/.test(resizeSrc);

    const c = document.createElement('canvas');
    c.width = 320; c.height = 200;
    const ctx = c.getContext('2d');
    drawBackground(ctx, 'landweg', 1, 140, 80, { pr: 0.6, part: 2, boss: false });
    const d = ctx.getImageData(40, 40, 1, 1).data;
    const skyOk = d[2] > 80 || d[1] > 60;

    return {
      ok: skipAlwaysFalse && stillFalse && hasLight && lightOn && noTierInKey && skyOk,
      skipAlwaysFalse,
      stillFalse,
      hasLight,
      lightOn,
      noTierInKey,
      skyOk,
      skySample: [d[0], d[1], d[2]],
    };
  });

  await browser.close();
  if (server) try { server.close(); } catch (_) {}
  if (!result.ok) {
    console.error('SMOKE_FAIL adventure-bg-drop', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('SMOKE_OK adventure-bg-drop', JSON.stringify(result));
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
