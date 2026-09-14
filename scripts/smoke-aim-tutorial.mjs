#!/usr/bin/env node
/**
 * First-combat move-bar aim tutorial: shows once, skippable, persist flag.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error('SMOKE_FAIL', msg);
  process.exit(1);
}

const src = fs.readFileSync(path.join(root, 'src/systems/aim-tutorial.js'), 'utf8');
const catalog = fs.readFileSync(path.join(root, 'src/i18n/catalog.js'), 'utf8');
const start = fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8');
const game = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const canvas = fs.readFileSync(path.join(root, 'src/core/canvas.js'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8');

if (!manifest.includes('src/systems/aim-tutorial.js')) fail('manifest missing aim-tutorial.js');
if (!/function beginAimTutorial/.test(src)) fail('beginAimTutorial missing');
if (!/function resetAimTutorialFlag/.test(src)) fail('resetAimTutorialFlag missing');
if (!/AIM_TUTORIAL_TIP = 'moveBarAim'/.test(src)) fail('persist key must be tipsSeen.moveBarAim');
if (!/maybeStartAimTutorial/.test(start)) fail('startGame must offer the tutorial');
if (!/drawAimTutorial/.test(game)) fail('Game.draw must paint the overlay');
if (!/handleAimTutorialPointer/.test(canvas)) fail('canvas must hit-test skip/got-it');
if (!/title: 'MIK MET DE LOOPBALK'/.test(catalog)) fail('NL aimTut.title missing');
if (!/title: 'AIM WITH THE MOVE BAR'/.test(catalog)) fail('EN aimTut.title missing');
if (/settings\.(aimTut|moveBar|tutorial)/.test(catalog + src)) fail('do not add Settings clutter');

const outDir = '/tmp/sf-aim-tutorial';
fs.mkdirSync(outDir, { recursive: true });
const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) fail('no chrome');

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
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  const base = process.argv[2] || smokeBaseUrl(8787);
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });

  const result = await page.evaluate(() => {
    const need = [
      'beginAimTutorial', 'maybeStartAimTutorial', 'aimTutorialActive',
      'aimTutorialSeen', 'resetAimTutorialFlag', 'finishAimTutorial',
      'handleAimTutorialPointer', 'drawAimTutorial',
    ];
    const missing = need.filter((n) => typeof globalThis[n] !== 'function');
    if (missing.length) return { ok: false, why: 'missing:' + missing.join(',') };

    try {
      save.tipsSeen = {};
      persist();
    } catch (e) {
      return { ok: false, why: 'persist:' + e };
    }

    if (aimTutorialSeen()) return { ok: false, why: 'fresh save already marked seen' };
    if (aimTutorialShouldOffer('wall') || aimTutorialShouldOffer('coinrun')) {
      return { ok: false, why: 'wall/coinrun must not offer tutorial' };
    }
    if (!aimTutorialShouldOffer('adventure') || !aimTutorialShouldOffer('training')) {
      return { ok: false, why: 'adventure/training should offer on first run' };
    }

    startGame('training');
    const g1 = game;
    if (!g1 || !aimTutorialActive(g1)) return { ok: false, why: 'training did not show tutorial' };
    if (typeof t === 'function') {
      const nlOk = true;
      const title = t('aimTut.title');
      if (!title || title === 'aimTut.title') return { ok: false, why: 'aimTut.title missing in runtime i18n' };
    }
    g1.draw(ctx);
    const lay = g1.aimTut && g1.aimTut.layout;
    if (!lay || !(lay.gotW > 20) || !(lay.skipW > 20)) return { ok: false, why: 'layout buttons missing' };

    const skipHit = handleAimTutorialPointer(lay.skipX + 4, lay.skipY + 4, g1);
    if (!skipHit || aimTutorialActive(g1)) return { ok: false, why: 'skip did not dismiss' };
    if (!aimTutorialSeen()) return { ok: false, why: 'skip did not persist tipsSeen.moveBarAim' };

    startGame('adventure', { level: 1, gamble: null });
    if (aimTutorialActive(game)) return { ok: false, why: 'tutorial shown again after skip' };

    if (!resetAimTutorialFlag() || aimTutorialSeen()) return { ok: false, why: 'resetAimTutorialFlag failed' };
    startGame('adventure', { level: 1, gamble: null });
    if (!aimTutorialActive(game)) return { ok: false, why: 'reset did not re-show tutorial' };

    const g3 = game;
    g3.draw(ctx);
    const lay3 = g3.aimTut.layout;
    handleAimTutorialPointer(lay3.gotX + lay3.gotW / 2, lay3.gotY + lay3.gotH / 2, g3);
    if (aimTutorialActive(g3) || !aimTutorialSeen()) return { ok: false, why: 'got-it did not persist' };

    startGame('wall');
    if (aimTutorialActive(game)) return { ok: false, why: 'wall started tutorial' };

    const enTitle = (I18N.en.aimTut && I18N.en.aimTut.title) || '';
    const nlTitle = (I18N.nl.aimTut && I18N.nl.aimTut.title) || '';
    if (!/AIM/i.test(enTitle) || !/MIK|LOOPBALK/i.test(nlTitle)) {
      return { ok: false, why: 'NL/EN titles weak: ' + nlTitle + ' / ' + enTitle };
    }

    return {
      ok: true,
      titleNl: nlTitle,
      titleEn: enTitle,
      reset: typeof window.__sf.resetAimTutorial === 'function',
    };
  });

  await browser.close();
  try { if (server && server.close) server.close(); } catch (_) {}

  if (pageErrors.length) fail('pageerror ' + pageErrors[0]);
  if (!result || !result.ok) fail(result && result.why ? result.why : 'evaluate failed');
  if (!result.reset) fail('__sf.resetAimTutorial missing');
  console.log('SMOKE_OK aim-tutorial', result.titleNl, '/', result.titleEn);
}

run().catch((err) => fail(err && err.stack ? err.stack : String(err)));
