#!/usr/bin/env node
/**
 * Flappy-feel P0: Adventure death → huge “nog één keer” in <3s, no dice maze, no FOMO.
 * Does not own #316 juice (toasts / KO floaters / empty tiles).
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = '/tmp/sf-flappy-retry';
fs.mkdirSync(outDir, { recursive: true });

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

const missions = fs.readFileSync(path.join(root, 'src/systems/missions.js'), 'utf8');
const start = fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8');
const game = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');

must(/RESULT_SHOW_LOSE_MS = 700/.test(missions), 'lose delay must be 700ms');
must(/function adventureResultDelayMs/.test(missions), 'missing adventureResultDelayMs');
must(/function restartAdventureInstant/.test(missions), 'missing restartAdventureInstant');
must(/restartAdventureInstant/.test(start) && !/if \(d\.mode === 'adventure'\) gokGooiStartLevel\(d\.level\)/.test(start),
  'resAgain adventure must skip dice maze');
must(/adventureResultDelayMs\(win\)/.test(game), 'finishAdventure must use adventureResultDelayMs');
must(/result\.onceMore/.test(ui) && /is-lose/.test(ui), 'showResult must paint onceMore + lose class');
must(/hideFomoRitual/.test(ui) && /showResult/.test(ui), 'result must hide FOMO');
must(/id="resCtaDock"/.test(html) && /Nog één keer/.test(html), 'result dock / onceMore HTML missing');
must(/result-cta-primary/.test(css) && /min-height:\s*84px/.test(css), 'huge 390px CTA missing');
must(/body:has\(#resultScreen\.active\) #fomoRitual/.test(css), 'FOMO must hide on result');
must(/onceMore: 'Nog één keer'/.test(i18n) && /onceMore: 'One more go'/.test(i18n),
  'onceMore NL/EN missing');
must(/onceMore: 'Noch einmal'/.test(i18n) && /onceMore: 'Encore une fois'/.test(i18n) && /onceMore: 'Una más'/.test(i18n),
  'onceMore DE/FR/ES missing');
must(!/payments|stripe|iap/i.test(missions + start + ui), 'no payments on this lane');

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
    await page.waitForFunction(() => window.__sfBooted && typeof UI !== 'undefined' && typeof startGame === 'function', { timeout: 30000 });

    const layout = await page.evaluate(() => {
      try {
        document.getElementById('sfSplash')?.setAttribute('hidden', '');
        document.getElementById('fomoRitual')?.setAttribute('hidden', '');
      } catch (_) {}
      UI.showResult(false, {
        mode: 'adventure', level: 1, win: false, xp: 0, difficulty: 'normal',
        titleKey: 'result.advLose', detail: 'test',
      });
      const again = document.getElementById('resAgain');
      const next = document.getElementById('resNext');
      const menu = document.getElementById('resMenu');
      const fomo = document.getElementById('fomoRitual');
      const screen = document.getElementById('resultScreen');
      const ar = again ? again.getBoundingClientRect() : null;
      return {
        active: !!(screen && screen.classList.contains('active')),
        lose: !!(screen && screen.classList.contains('is-lose') && screen.classList.contains('is-adventure')),
        label: ((again && again.querySelector('div')) || again || {}).textContent || '',
        againH: ar ? Math.round(ar.height) : 0,
        againW: ar ? Math.round(ar.width) : 0,
        againY: ar ? Math.round(ar.bottom) : 0,
        vh: window.innerHeight,
        nextHidden: !!(next && (next.style.display === 'none' || next.hidden)),
        menuQuiet: !!(menu && menu.classList.contains('result-cta-quiet')),
        fomoHidden: !!(fomo && (fomo.hidden || getComputedStyle(fomo).display === 'none')),
        primary: !!(again && again.classList.contains('result-cta-primary')),
        vw: window.innerWidth,
      };
    });
    must(layout.vw === 390, 'expected 390px viewport, got ' + layout.vw);
    must(layout.active && layout.lose, 'lose adventure result not active: ' + JSON.stringify(layout));
    must(/nog één keer|one more go/i.test(layout.label), 'onceMore label missing: ' + layout.label);
    must(layout.againH >= 72 && layout.againW >= 300, 'retry CTA not huge on 390px: ' + JSON.stringify(layout));
    must(layout.againY <= layout.vh + 4, 'retry CTA below fold: ' + JSON.stringify(layout));
    must(layout.nextHidden && layout.menuQuiet && layout.primary, 'lose should be one primary CTA: ' + JSON.stringify(layout));
    must(layout.fomoHidden, 'FOMO must not fight result: ' + JSON.stringify(layout));

    const timed = await page.evaluate(async () => {
      UI.goMenu();
      startGame('adventure', { level: 1, difficulty: 'normal' });
      const t0 = performance.now();
      try {
        game.player.hp = 0;
        game.player.alive = false;
        game.finishAdventure(false);
      } catch (e) {
        return { err: String(e && e.message || e) };
      }
      const deadline = t0 + 3200;
      while (performance.now() < deadline) {
        const sc = document.getElementById('resultScreen');
        const again = document.getElementById('resAgain');
        if (sc && sc.classList.contains('active') && again && !again.hidden) {
          return {
            ms: Math.round(performance.now() - t0),
            state: typeof state !== 'undefined' ? state : null,
            label: ((again.querySelector('div') || again).textContent || ''),
          };
        }
        await new Promise((r) => setTimeout(r, 40));
      }
      return { ms: 9999, state: typeof state !== 'undefined' ? state : null, label: '' };
    });
    must(!timed.err, 'finishAdventure failed: ' + timed.err);
    must(timed.ms < 3000 && timed.state === 'result',
      'retry CTA not visible in <3s: ' + JSON.stringify(timed));
    must(/nog één keer|one more go/i.test(timed.label), 'timed lose label wrong: ' + timed.label);

    const retry = await page.evaluate(() => {
      const again = document.getElementById('resAgain');
      if (again) again.click();
      const gamble = document.getElementById('gambleScreen');
      const fomo = document.getElementById('fomoRitual');
      const result = document.getElementById('resultScreen');
      return {
        state: typeof state !== 'undefined' ? state : null,
        isPlaying: document.body.classList.contains('is-playing'),
        gambleActive: !!(gamble && gamble.classList.contains('active')),
        resultActive: !!(result && result.classList.contains('active')),
        fomoOpen: !!(fomo && !fomo.hidden && document.body.classList.contains('fomo-open')),
        level: game && game.level ? game.level.n : null,
        mode: game ? game.mode : null,
      };
    });
    must(retry.state === 'play' && retry.isPlaying && retry.mode === 'adventure',
      'retry did not start fight: ' + JSON.stringify(retry));
    must(!retry.gambleActive && !retry.resultActive && !retry.fomoOpen,
      'retry must skip dice/FOMO/menu maze: ' + JSON.stringify(retry));

    await page.screenshot({ path: path.join(outDir, 'flappy-retry-390.png') });
    console.log('SMOKE_OK flappy-retry', JSON.stringify({ layout, timed, retry }));
  } finally {
    await browser.close();
    if (server && server.close) try { server.close(); } catch (_) {}
  }
}

run().catch((err) => {
  console.error('SMOKE_FAIL', err);
  process.exit(1);
});
