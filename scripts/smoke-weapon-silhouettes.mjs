#!/usr/bin/env node
/** Weapon silhouettes: only spear-family thrusts; slash finisher is overhead; idle angles differ. */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

const outDir = '/tmp/sf-weapon-sil';
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
  const port = 8792;
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
    const spearOnly = ['speer', 'drietand', 'bostaf'].every((id) => weaponMoveFamily(id) === 'spear');
    const slashNotSpeer = ['zwaard', 'kunai', 'tanto', 'laser'].every((id) => weaponMoveFamily(id) !== 'spear');
    const slashFin = weaponMoveDef('zwaard', 2);
    const spearFirst = weaponMoveDef('speer', 0);
    const idleSpeer = weaponIdleAngle('speer');
    const idleZwaard = weaponIdleAngle('zwaard');
    const idleKnuppel = weaponIdleAngle('knuppel');
    const biasSlash = weaponGripBias('zwaard', { pose: 'slash' });
    const biasThrust = weaponGripBias('speer', { pose: 'thrust' });
    return {
      ok: spearOnly && slashNotSpeer
        && slashFin && slashFin.pose === 'overhead'
        && spearFirst && spearFirst.pose === 'thrust'
        && Math.abs(idleSpeer) < 0.25
        && idleZwaard < -0.5
        && idleKnuppel < -0.9
        && biasSlash < -0.3
        && biasThrust === 0,
      spearOnly,
      slashNotSpeer,
      slashFinPose: slashFin && slashFin.pose,
      spearFirstPose: spearFirst && spearFirst.pose,
      idleSpeer,
      idleZwaard,
      idleKnuppel,
      biasSlash,
      biasThrust,
    };
  });

  await browser.close();
  if (server) try { server.close(); } catch (_) {}
  if (!result.ok) {
    console.error('SMOKE_FAIL weapon-silhouettes', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('SMOKE_OK weapon-silhouettes', JSON.stringify(result));
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
