#!/usr/bin/env node
/**
 * Training hit-feel: first punch must chip RabbitRobot HP and read on HUD.
 * Static source guards + Chrome punch-connect (the live “100% HP / no hit” hole).
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

const input = fs.readFileSync(path.join(root, 'src/systems/input.js'), 'utf8');
const fighter = fs.readFileSync(path.join(root, 'src/entities/fighter.js'), 'utf8');
const game = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const catalog = fs.readFileSync(path.join(root, 'src/i18n/catalog.js'), 'utf8');

must(/function meleeHitsBody\(/.test(input), 'meleeHitsBody helper missing');
must(/function trainingStartGap\(/.test(input), 'trainingStartGap helper missing');
must(/Math\.min\(w \* 0\.24, 104\)/.test(input), 'training gap must cap at punch-connect range');
must(/hpGhostT/.test(fighter), 'fighter missing Street Fighter-style HP ghost');
must(/noteMeleeWhiff/.test(fighter), 'player melee must call noteMeleeWhiff on empty swing');
must(/trainingStartGap\(W\)/.test(game), 'startRound must use trainingStartGap');
must(/slack = \(this\.mode === 'training' && f\.isPlayer\) \? 22/.test(game), 'training player melee slack missing');
must(/this\.hitReadT = 0\.45/.test(game), 'hitReadT flash missing after fighter melee');
must(/noteMeleeWhiff\(f, spec\)/.test(game), 'Game.noteMeleeWhiff missing');
must(/hud\.rabbitRobotHp/.test(game), 'training HUD must show rabbit HP numbers');
must(/rabbitRobotHp:/.test(catalog), 'catalog missing hud.rabbitRobotHp');
must(/72 \+ save\.lvl \* 6/.test(game), 'first-fight robot HP should be readable (72+lvl*6)');

const outDir = '/tmp/sf-hit-feel';
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
    executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  const base = process.argv[2] || smokeBaseUrl(8787);
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 20000 });

  const result = await page.evaluate(() => {
    try {
      if (typeof meleeHitsBody !== 'function') return { ok: false, why: 'meleeHitsBody not global' };
      if (typeof trainingStartGap !== 'function') return { ok: false, why: 'trainingStartGap not global' };
      const gapPhone = trainingStartGap(390);
      const gapDesk = trainingStartGap(1400);
      if (gapPhone > 104 || gapDesk > 104) return { ok: false, why: 'gap too wide', gapPhone, gapDesk };
      if (gapDesk < 84) return { ok: false, why: 'desktop gap collapsed', gapDesk };

      startGame('training');
      const g = game;
      if (!g || g.mode !== 'training' || !g.robot) {
        return { ok: false, why: 'training not started' };
      }
      g.phase = 'fight';
      g.phaseT = 2;
      g.inputLocked = false;
      g.over = false;
      g.trainDummyGrace = 3;
      g.player.onGround = true;
      g.player.invulnT = 0;
      g.player.attack = null;
      g.robot.invulnT = 0;
      g.robot.blocking = false;
      g.robot.blockT = 0;
      g.robot.attack = null;
      g.floaters = [];

      const hp0 = g.robot.hp;
      const max0 = g.robot.maxhp;
      const spawnGap = Math.abs(g.robot.x - g.player.x);
      const dummy = {
        bodyX: g.robot.x, bodyY: g.robot.y - 45, bodyR: 30,
      };
      const spec = g.player.attackSpec('punch');
      const hp = meleeHitPoint(g.player, spec);
      const inRange = meleeHitsBody(hp.hx, hp.hy, spec.r, dummy, 22);

      g.player.startAttack('punch', g);
      if (!g.player.attack) return { ok: false, why: 'punch did not start' };

      let hit = false;
      for (let i = 0; i < 40; i++) {
        const rx = g.robot.x;
        g.update(1 / 60);
        g.robot.x = rx;
        g.robot.vx = 0;
        if (g.robot.hp < hp0) { hit = true; break; }
      }

      const dmgTxt = (g.floaters || []).some((f) => /-\d+/.test(String(f.txt || f.text || '')));
      const ghostHeld = (g.robot.hpGhost || 0) >= g.robot.hp && (g.robot.hpGhostT || 0) > 0;
      const readFlash = (g.hitReadT || 0) > 0;

      return {
        ok: hit && g.robot.hp < hp0 && inRange && dmgTxt && ghostHeld && readFlash,
        hit,
        inRange,
        dmgTxt,
        ghostHeld,
        readFlash,
        hp0,
        hp: g.robot.hp,
        max0,
        spawnGap,
        gapPhone,
        gapDesk,
        hitReadT: g.hitReadT,
        hpGhost: g.robot.hpGhost,
      };
    } catch (e) {
      return { ok: false, why: String(e && e.stack || e) };
    }
  });

  await browser.close();
  if (server) server.close();

  if (!result.ok) {
    console.error('SMOKE_FAIL hit-feel', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('SMOKE_OK hit-feel', JSON.stringify(result));
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
