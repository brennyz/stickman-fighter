#!/usr/bin/env node
/**
 * Training feel only: ghost HP + gold flash + RABBIT n/max.
 * Must NOT rewrite #259 hit-reg (capsule / facing / spawn gap).
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

const fighter = fs.readFileSync(path.join(root, 'src/entities/fighter.js'), 'utf8');
const game = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const input = fs.readFileSync(path.join(root, 'src/systems/input.js'), 'utf8');
const catalog = fs.readFileSync(path.join(root, 'src/i18n/catalog.js'), 'utf8');

must(/hpGhostT/.test(fighter), 'fighter missing HP ghost timer');
must(/this\.hpGhost = Math\.max/.test(fighter), 'takeDamage must latch ghost HP');
must(/this\.hitReadT = 0\.45/.test(game), 'melee confirm must flash hitReadT');
must(/hud\.rabbitRobotHp/.test(game), 'training HUD must show RABBIT n/max');
must(/rabbitRobotHp:/.test(catalog), 'catalog missing hud.rabbitRobotHp');
must(/W \* 0\.25/.test(game) && /W \* 0\.75/.test(game), 'must keep #259 training spawn (no gap rewrite)');
must(!/function trainingStartGap/.test(input), 'do not add a second spawn-gap helper');
must(/function meleeHitsTrainTarget/.test(input), '#259 train capsule must stay');
must(!/slack = \(this\.mode === 'training' && f\.isPlayer\) \? 22/.test(game), 'do not add a second training slack');

const outDir = '/tmp/sf-ghost-hp';
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
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  const base = process.argv[2] || (smokeBaseUrl(8787) + '?nosplash=1');
  page.setDefaultNavigationTimeout(60000);
  await page.goto(base, { waitUntil: 'load', timeout: 60000 });
  try {
    await page.waitForFunction(() => window.__sfBooted, { timeout: 45000 });
  } catch (e) {
    const snap = await page.evaluate(() => ({
      booted: !!window.__sfBooted,
      href: location.href,
      title: document.title,
    })).catch(() => ({}));
    await browser.close();
    if (server) server.close();
    console.error('SMOKE_FAIL ghost-hp boot', JSON.stringify(snap), String(e && e.message || e));
    process.exit(1);
  }

  const result = await page.evaluate(() => {
    try {
      startGame('training');
      const g = game;
      if (!g || !g.robot) return { ok: false, why: 'no training robot' };
      g.phase = 'fight';
      g.phaseT = 2;
      g.inputLocked = false;
      g.trainDummyGrace = 3;
      const hp0 = g.robot.hp;
      g.robot.takeDamage(9, 0, g, { attacker: g.player, kind: 'punch' });
      const ghostHeld = (g.robot.hpGhost || 0) > g.robot.hp && (g.robot.hpGhostT || 0) > 0;
      const dropped = g.robot.hp < hp0;
      const label = (typeof tOr === 'function')
        ? tOr('hud.rabbitRobotHp', 'RABBIT {hp}/{max}', { hp: Math.round(g.robot.hp), max: Math.round(g.robot.maxhp) })
        : '';
      g.hitReadT = 0.45;
      return {
        ok: dropped && ghostHeld && /RABBIT/.test(label) && /\d+\/\d+/.test(label),
        dropped, ghostHeld, label,
        hp0, hp: g.robot.hp, ghost: g.robot.hpGhost,
        spawnPx: Math.abs(g.robot.x - g.player.x),
      };
    } catch (e) {
      return { ok: false, why: String(e && e.stack || e) };
    }
  });

  await browser.close();
  if (server) server.close();

  if (!result.ok) {
    console.error('SMOKE_FAIL ghost-hp', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('SMOKE_OK ghost-hp', JSON.stringify(result));
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
