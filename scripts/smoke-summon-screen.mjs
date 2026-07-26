#!/usr/bin/env node
/**
 * Smoke: summons screen — no blue-screen regression.
 * Open hub → summonScreen active, canvas hidden, not is-playing.
 * Pull weapon → counters drop, center card shows after delay.
 * Leave to adventure → screens cleared, is-playing.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = '/tmp/sf-summon-smoke';
fs.mkdirSync(outDir, { recursive: true });

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome', '/usr/bin/chromium-browser']
  .find((p) => fs.existsSync(p));
if (!chrome) {
  console.error('SMOKE_FAIL no chrome');
  process.exit(1);
}

async function getPuppeteer() {
  try {
    return await import('puppeteer-core');
  } catch (_) {
    await new Promise((resolve, reject) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], { cwd: outDir, stdio: 'inherit' });
      p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('npm install failed'))));
    });
    return import(path.join(outDir, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'));
  }
}

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
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
  try {
    const page = await browser.newPage();
    await page.goto(smokeBaseUrl(8787) + '?sfsmoke=1', { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__sfBooted && typeof UI !== 'undefined' && typeof openChestSummon === 'function', { timeout: 30000 });

    const openSnap = await page.evaluate(() => {
      UI.openSummonHub();
      const summon = document.getElementById('summonScreen');
      const game = document.getElementById('game');
      const actives = [...document.querySelectorAll('.screen.active')].map((s) => s.id);
      return {
        active: actives,
        summonActive: !!(summon && summon.classList.contains('active')),
        canvasVis: game ? game.style.visibility : null,
        isPlaying: document.body.classList.contains('is-playing'),
        state: typeof state !== 'undefined' ? state : null,
        where: !!(document.getElementById('summonWhereStrip')),
        centerCard: !!(document.getElementById('summonCenterCard')),
        wLeft: typeof chestWeaponLeft === 'function' ? chestWeaponLeft() : -1,
      };
    });
    must(openSnap.summonActive, 'summonScreen not active: ' + JSON.stringify(openSnap.active));
    must(openSnap.active.length === 1 && openSnap.active[0] === 'summonScreen', 'expected only summonScreen: ' + JSON.stringify(openSnap.active));
    must(openSnap.canvasVis === 'hidden' || openSnap.canvasVis === '', 'canvas should be hidden on UI: ' + openSnap.canvasVis);
    must(!openSnap.isPlaying, 'body.is-playing must be false on summon screen');
    must(openSnap.state === 'menu', 'state should be menu, got ' + openSnap.state);
    must(openSnap.where && openSnap.centerCard, 'missing where-strip or center card');
    must(openSnap.wLeft === 5, 'expected 5 weapon summons, got ' + openSnap.wLeft);

    const pullSnap = await page.evaluate(async () => {
      const before = chestWeaponLeft();
      UI.doChestPull('weapon');
      // Wait past card reveal (last 2s of 4s timeline) — use short path via timers already scheduled
      await new Promise((r) => setTimeout(r, 2200));
      const reveal = document.getElementById('summonReveal');
      const card = document.getElementById('summonCenterCard');
      const actives = [...document.querySelectorAll('.screen.active')].map((s) => s.id);
      return {
        before,
        after: chestWeaponLeft(),
        cardShow: !!(reveal && reveal.classList.contains('is-card-show')),
        cardOpacity: card ? getComputedStyle(card).opacity : null,
        cardName: (document.getElementById('summonCardName') || {}).textContent || '',
        stillSummon: actives[0] === 'summonScreen' && actives.length === 1,
        isPlaying: document.body.classList.contains('is-playing'),
        rarity: reveal ? reveal.dataset.rarity : null,
      };
    });
    must(pullSnap.after === pullSnap.before - 1, 'counter did not drop: ' + JSON.stringify(pullSnap));
    must(pullSnap.stillSummon, 'summon screen lost during pull');
    must(!pullSnap.isPlaying, 'is-playing flipped during pull');
    must(pullSnap.cardShow, 'center card not shown after ~2s');
    must(pullSnap.cardName.length > 0, 'empty center card name');

    const playSnap = await page.evaluate(() => {
      UI.goMenu();
      try {
        startGame('adventure', { level: 1 });
      } catch (e) {
        return { err: String(e && e.message || e) };
      }
      const actives = [...document.querySelectorAll('.screen.active')].map((s) => s.id);
      const canvas = document.getElementById('game');
      return {
        actives,
        isPlaying: document.body.classList.contains('is-playing'),
        state: typeof state !== 'undefined' ? state : null,
        canvasVis: canvas ? canvas.style.visibility : null,
        hasGame: !!game,
      };
    });
    must(!playSnap.err, 'adventure start failed: ' + playSnap.err);
    must(playSnap.state === 'play' && playSnap.hasGame, 'expected play+game: ' + JSON.stringify(playSnap));
    must(playSnap.actives.length === 0, 'screens still active in play (blue risk): ' + JSON.stringify(playSnap.actives));
    must(playSnap.isPlaying, 'body.is-playing missing in play');
    must(playSnap.canvasVis === 'visible', 'canvas not visible in play: ' + playSnap.canvasVis);

    // Mid-fight summon must be blocked
    const blocked = await page.evaluate(() => {
      UI.openSummonHub();
      const actives = [...document.querySelectorAll('.screen.active')].map((s) => s.id);
      return {
        actives,
        stillPlay: state === 'play' && !!game,
        isPlaying: document.body.classList.contains('is-playing'),
      };
    });
    must(blocked.stillPlay && blocked.isPlaying, 'openSummonHub broke play: ' + JSON.stringify(blocked));
    must(!blocked.actives.includes('summonScreen'), 'summon opened during fight');

    console.log('SMOKE_OK summon-screen', JSON.stringify({ openSnap, pullSnap, playSnap, blocked }));
  } finally {
    await browser.close();
    if (server) try { server.close(); } catch (_) {}
  }
}

run().catch((err) => {
  console.error('SMOKE_FAIL', err);
  process.exit(1);
});
