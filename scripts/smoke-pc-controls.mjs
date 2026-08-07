#!/usr/bin/env node
/** PC keyboard legend + touch-pad device gate. */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

const outDir = '/tmp/sf-pc-controls';
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
  const port = 8794;
  let server = null;
  try { server = await startStaticServer(root, port); } catch (_) {}

  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=1280,800'],
  });
  const page = await browser.newPage();
  await page.goto(process.argv[2] || `http://127.0.0.1:${port}/index.html`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });

  const result = await page.evaluate(() => {
    const hasHelpers = typeof useTouchFightPads === 'function' && typeof useKbFightLegend === 'function';
    const autoPads = useTouchFightPads();
    const autoLegend = useKbFightLegend();
    // Simulate PC: force pads off
    const prev = save.showTouchPads;
    save.showTouchPads = false;
    const forceKb = useTouchFightPads() === false && useKbFightLegend() === true;
    save.showTouchPads = true;
    const forcePads = useTouchFightPads() === true;
    save.showTouchPads = prev;

    const line = typeof modeFirstMinuteLine === 'function' ? modeFirstMinuteLine('adventure') : '';
    const kbLine = /A\/D|WASD|J\/K/.test(line) || (!autoPads && line.length > 10);

    const hasDraw = typeof Game !== 'undefined'
      && Game.prototype
      && typeof Game.prototype.drawKeyboardLegend === 'function';

    const setKb = !!document.getElementById('setKbLegend');
    const setPads = !!document.getElementById('setShowTouchPads');

    return {
      ok: hasHelpers && forceKb && forcePads && hasDraw && setKb && setPads
        && typeof autoPads === 'boolean' && typeof autoLegend === 'boolean'
        && (autoPads !== autoLegend || save.showTouchPads != null),
      hasHelpers,
      autoPads,
      autoLegend,
      forceKb,
      forcePads,
      hasDraw,
      setKb,
      setPads,
      line,
      kbLine,
      isTouch: !!IS_TOUCH,
    };
  });

  await browser.close();
  if (server) try { server.close(); } catch (_) {}
  if (!result.ok) {
    console.error('SMOKE_FAIL pc-controls', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('SMOKE_OK pc-controls', JSON.stringify(result));
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
