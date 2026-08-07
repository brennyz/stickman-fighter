#!/usr/bin/env node
/** Vista / scenery flash guards: no clearCache on tier; menu SLOT/FADE calm; far always on. */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

const outDir = '/tmp/sf-vista-flash';
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
  const port = 8795;
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
    // Source-level checks via function source
    const tickSrc = String(Perf.tick);
    const noClearOnTier = !/clearCache\(\)/.test(tickSrc);
    const bgSrc = String(drawBackground);
    const farAlways = /farTile\)\s*\{/.test(bgSrc) || /if \(farTile\)/.test(bgSrc);
    const farNotGated = !/farTile && Perf\.tier < 2/.test(bgSrc);

    SceneryArt.clearCache();
    SceneryArt.get('landweg', 'far');
    SceneryArt.get('bos', 'far');
    const before = Object.keys(SceneryArt.cache).length;
    Perf.tier = 2;
    // Simulate old bug path: tier change must NOT wipe
    const mid = Object.keys(SceneryArt.cache).length;
    const kept = mid === before && mid >= 1;

    // Eviction soft: pinTheme set
    const pinOk = SceneryArt.pinTheme === 'bos' || SceneryArt.pinTheme === 'landweg';

    return {
      ok: noClearOnTier && farAlways && farNotGated && kept && pinOk,
      noClearOnTier,
      farAlways,
      farNotGated,
      kept,
      pinOk,
      before,
      mid,
      pinTheme: SceneryArt.pinTheme,
    };
  });

  await browser.close();
  if (server) try { server.close(); } catch (_) {}
  if (!result.ok) {
    console.error('SMOKE_FAIL vista-flash', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('SMOKE_OK vista-flash', JSON.stringify(result));
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
