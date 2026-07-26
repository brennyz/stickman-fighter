#!/usr/bin/env node
/** Pickups spawn with finite life (GENERIC_PICKUP_LIFE / SHARD_PICKUP_LIFE defined). */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = '/tmp/sf-pickup-life';
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
    startGame('adventure', { level: 1, gamble: null });
    const g = game;
    const errors = [];
    try {
      g.spawnPickup(50, g.ground - 40, {});
      g.spawnPickup(90, g.ground - 40, { skillId: 'rasengan' });
      if (g.player) g.player.x = 320;
    } catch (e) { errors.push(String(e)); }
    const generic = g.pickups.find((p) => p.kind !== 'skill_shard' && p.kind !== 'item_shard');
    const shard = g.pickups.find((p) => p.kind === 'skill_shard');
    const DT = 1 / 30;
    for (let i = 0; i < 10; i++) {
      try { g.update(DT); } catch (e) { errors.push('update:' + e); }
    }
    const still = g.pickups.length;
    return {
      ok: errors.length === 0 && generic && generic.life > 10 && shard && shard.life > 20 && still >= 1,
      errors,
      genericLife: generic?.life,
      shardLife: shard?.life,
      still,
      constants: { generic: typeof GENERIC_PICKUP_LIFE !== 'undefined' ? GENERIC_PICKUP_LIFE : null, shard: typeof SHARD_PICKUP_LIFE !== 'undefined' ? SHARD_PICKUP_LIFE : null },
    };
  });

  await browser.close();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('SMOKE_OK pickup-life');
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
