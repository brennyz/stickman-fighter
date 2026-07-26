#!/usr/bin/env node
/**
 * Smoke: summons screen — no blue-screen regression.
 * Open hub → summonScreen active (fullscreen), canvas hidden, not is-playing.
 * Pull random → counters drop, no spoiler toast, center card after delay, is-pulling.
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
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(smokeBaseUrl(8787) + '?sfsmoke=1', { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__sfBooted && typeof UI !== 'undefined' && typeof openChestSummon === 'function', { timeout: 30000 });

    const openSnap = await page.evaluate(() => {
      UI.openSummonHub();
      const summon = document.getElementById('summonScreen');
      const game = document.getElementById('game');
      const actives = [...document.querySelectorAll('.screen.active')].map((s) => s.id);
      const rect = summon ? summon.getBoundingClientRect() : null;
      return {
        active: actives,
        summonActive: !!(summon && summon.classList.contains('active')),
        canvasVis: game ? game.style.visibility : null,
        isPlaying: document.body.classList.contains('is-playing'),
        state: typeof state !== 'undefined' ? state : null,
        where: !!(document.getElementById('summonWhereStrip')),
        centerCard: !!(document.getElementById('summonCenterCard')),
        left: typeof chestSummonsLeft === 'function' ? chestSummonsLeft() : -1,
        fullW: rect ? Math.round(rect.width) : 0,
        fullH: rect ? Math.round(rect.height) : 0,
        hasPull: !!document.getElementById('btnChestPull'),
      };
    });
    must(openSnap.summonActive, 'summonScreen not active: ' + JSON.stringify(openSnap.active));
    must(openSnap.active.length === 1 && openSnap.active[0] === 'summonScreen', 'expected only summonScreen: ' + JSON.stringify(openSnap.active));
    must(openSnap.canvasVis === 'hidden' || openSnap.canvasVis === '', 'canvas should be hidden on UI: ' + openSnap.canvasVis);
    must(!openSnap.isPlaying, 'body.is-playing must be false on summon screen');
    must(openSnap.state === 'menu', 'state should be menu, got ' + openSnap.state);
    must(openSnap.where && openSnap.centerCard, 'missing where-strip or center card');
    must(openSnap.left === 10, 'expected 10 summons, got ' + openSnap.left);
    must(openSnap.hasPull, 'missing btnChestPull');
    must(openSnap.fullW >= 360 && openSnap.fullH >= 700, 'summon screen not fullscreen-ish: ' + JSON.stringify(openSnap));

    const pullSnap = await page.evaluate(async () => {
      const before = chestSummonsLeft();
      const toastBefore = (document.getElementById('toastHost') || {}).textContent || '';
      UI.doChestPull('random');
      const midText = (document.getElementById('summonRevealText') || {}).textContent || '';
      const toastMid = (document.getElementById('toastHost') || {}).textContent || '';
      const pulling = !!(document.getElementById('summonScreen') || {}).classList?.contains?.('is-pulling')
        || document.getElementById('summonScreen')?.classList.contains('is-pulling');
      // Wait past card reveal (last 2s of ~10s Gemini clip)
      await new Promise((r) => setTimeout(r, 8500));
      const reveal = document.getElementById('summonReveal');
      const card = document.getElementById('summonCenterCard');
      const stage = document.getElementById('summonStage');
      const rail = document.querySelector('.summon-rail');
      const screen = document.getElementById('summonScreen');
      const actives = [...document.querySelectorAll('.screen.active')].map((s) => s.id);
      const stageRect = stage ? stage.getBoundingClientRect() : null;
      const railRect = rail ? rail.getBoundingClientRect() : null;
      const toastAfter = (document.getElementById('toastHost') || {}).textContent || '';
      return {
        before,
        after: chestSummonsLeft(),
        cardShow: !!(reveal && reveal.classList.contains('is-card-show')),
        cardOpacity: card ? getComputedStyle(card).opacity : null,
        cardName: (document.getElementById('summonCardName') || {}).textContent || '',
        stillSummon: actives[0] === 'summonScreen' && actives.length === 1,
        isPlaying: document.body.classList.contains('is-playing'),
        rarity: reveal ? reveal.dataset.rarity : null,
        stageW: stageRect ? Math.round(stageRect.width) : 0,
        stageH: stageRect ? Math.round(stageRect.height) : 0,
        railW: railRect ? Math.round(railRect.width) : 0,
        hasVideo: !!(screen && screen.classList.contains('has-video')),
        pulling: !!(screen && screen.classList.contains('is-pulling')),
        videoDisplay: (() => {
          const v = document.getElementById('summonVideo');
          return v ? getComputedStyle(v).display : null;
        })(),
        fallbackOk: (() => {
          const f = document.getElementById('summonStageFallback');
          return !!(f && getComputedStyle(f).display !== 'none');
        })(),
        midText,
        toastMid,
        toastAfter,
        toastBefore,
        endText: (document.getElementById('summonRevealText') || {}).textContent || '',
      };
    });
    must(pullSnap.after === pullSnap.before - 1, 'counter did not drop: ' + JSON.stringify(pullSnap));
    must(pullSnap.stillSummon, 'summon screen lost during pull');
    must(!pullSnap.isPlaying, 'is-playing flipped during pull');
    must(pullSnap.cardShow, 'center card not shown after ~3s');
    must(pullSnap.cardName.length > 0, 'empty center card name');
    must(pullSnap.pulling, 'expected is-pulling immersive mode');
    must(/kist opent/i.test(pullSnap.midText), 'expected neutral mid text, got: ' + pullSnap.midText);
    // No spoiler toast during reveal (toast host should stay empty / unchanged vs result text)
    must(!pullSnap.toastMid || pullSnap.toastMid === pullSnap.toastBefore,
      'spoiler toast during reveal: ' + pullSnap.toastMid);
    must(pullSnap.stageW >= 280, 'summon stage too narrow: ' + pullSnap.stageW);
    must(pullSnap.videoDisplay === 'block' || pullSnap.fallbackOk, 'video not visible and no fallback: ' + JSON.stringify(pullSnap));
    if (pullSnap.videoDisplay === 'block') {
      must(pullSnap.hasVideo, 'expected has-video fullscreen class');
      must(pullSnap.stageH >= 700, 'fullscreen video stage too short: ' + pullSnap.stageH);
    }

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
    must(playSnap.actives.length === 0, 'screens still active in play: ' + JSON.stringify(playSnap.actives));
    must(playSnap.isPlaying, 'body.is-playing missing after adventure start');
    must(playSnap.state === 'play', 'state not play');
    must(playSnap.canvasVis === 'visible' || playSnap.canvasVis === '', 'canvas not visible in play');
    must(playSnap.hasGame, 'game instance missing');

    const blocked = await page.evaluate(() => {
      UI.openSummonHub();
      const actives = [...document.querySelectorAll('.screen.active')].map((s) => s.id);
      return {
        actives,
        stillPlay: typeof state !== 'undefined' ? state === 'play' : false,
        isPlaying: document.body.classList.contains('is-playing'),
      };
    });
    must(blocked.actives.length === 0, 'summon opened mid-fight: ' + JSON.stringify(blocked));
    must(blocked.stillPlay && blocked.isPlaying, 'fight state lost when summon blocked');

    console.log('SMOKE_OK summon-screen', JSON.stringify({ openSnap, pullSnap, playSnap, blocked }));
  } finally {
    await browser.close();
    if (server && server.close) try { server.close(); } catch (_) {}
  }
}

run().catch((e) => {
  console.error('SMOKE_FAIL', e);
  process.exit(1);
});
