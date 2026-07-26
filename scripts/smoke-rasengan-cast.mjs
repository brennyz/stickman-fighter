#!/usr/bin/env node
/** Rasengan: horizontaal + dual(Lv4) + triple(Lv8) multi-shot. */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

const outDir = '/tmp/sf-rasengan';
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
    const castAndCount = () => {
      const p = game.player;
      p.energy = 100;
      p.x = 200;
      game.inputLocked = false;
      // Aim omhoog — Rasengan moet dit negeren (horizontaal)
      if (typeof Input !== 'undefined') {
        try { Input.moveY = -1; Input.aimY = -1; } catch (_) {}
      }
      p.startAttack('special', game);
      for (let i = 0; i < 45; i++) {
        try { game.update(DT); } catch (e) { errors.push(String(e)); }
        if (p.attack?.fired) break;
      }
      return game.projectiles.filter((x) => x.kind === 'rasengan' && x.from === 'player');
    };

    startGame('adventure', { level: 1, gamble: null });
    if (!save.skillUpgrades) save.skillUpgrades = {};
    save.skillUpgrades.rasengan = { level: 0, shards: 0 };
    save.skill = 'rasengan';
    save.activeJutsu = 'rasengan';

    const lv0 = castAndCount();
    const horiz = lv0.length >= 1 && lv0.every((o) => Math.abs(o.vy) < 1 && Math.abs(o.vx) > 50);
    const noAimTilt = lv0.length >= 1 && lv0.every((o) => Math.abs(o.vy) < 8);

    save.skillUpgrades.rasengan = { level: 4, shards: 0 };
    startGame('adventure', { level: 1, gamble: null });
    const lv4 = castAndCount();
    const dualOk = lv4.length >= 2
      && lv4.some((o) => o.curl < 0)
      && lv4.some((o) => o.curl > 0)
      && lv4.every((o) => Math.abs(o.vx) > 50);

    // ↓-krul bereikt snel de grond — vroeger stierf die daar; nu moet die blijven leven
    let downAliveAtGround = false;
    let sawSplit = false;
    for (let i = 0; i < 36; i++) {
      try { game.update(DT); } catch (e) { errors.push(String(e)); }
      const alive = game.projectiles.filter((x) => x.kind === 'rasengan' && x.from === 'player');
      if (alive.length >= 2) {
        const ys = alive.map((o) => o.y);
        if (Math.max(...ys) - Math.min(...ys) > 24) sawSplit = true;
      }
      const nearFloor = alive.filter((o) => o.y >= game.ground - 40);
      if (nearFloor.length >= 1 && nearFloor.some((o) => o.life > 0.2)) downAliveAtGround = true;
    }
    const curled = sawSplit || lv4.some((o) => Math.abs(o.vy0 || 0) > 40);
    const downSurvived = downAliveAtGround;

    save.skillUpgrades.rasengan = { level: 8, shards: 0 };
    startGame('adventure', { level: 1, gamble: null });
    const lv8 = castAndCount();
    const tripleOk = lv8.length >= 3
      && lv8.some((o) => !o.curl)
      && lv8.some((o) => o.curl < 0)
      && lv8.some((o) => o.curl > 0)
      && lv8.every((o) => Math.abs(o.vx) > 50);

    return {
      ok: errors.length === 0 && horiz && noAimTilt && dualOk && curled && tripleOk && downSurvived
        && rasenganShotMode(0) === 'single'
        && rasenganShotMode(4) === 'dual'
        && rasenganShotMode(8) === 'triple'
        && skillMaxLevel('rasengan') >= 8,
      errors: errors.slice(0, 5),
      lv0: lv0.length,
      lv4: lv4.length,
      lv8: lv8.length,
      horiz,
      noAimTilt,
      dualOk,
      curled,
      tripleOk,
      downSurvived,
      sawSplit,
      modes: [rasenganShotMode(0), rasenganShotMode(4), rasenganShotMode(8)],
    };
  });

  await browser.close();
  if (server) try { server.close(); } catch (_) {}
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('SMOKE_OK rasengan-cast');
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
