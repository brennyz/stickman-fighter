#!/usr/bin/env node
/**
 * MASTERGAME first-30s: first Avontuur = punch, not a text wall.
 * Aim tutorial stays for later fights. FOMO/HOME landscape untouched.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error('SMOKE_FAIL first30-teach:', msg);
  process.exit(1);
}

const teach = fs.readFileSync(path.join(root, 'src/systems/first-punch-teach.js'), 'utf8');
const aim = fs.readFileSync(path.join(root, 'src/systems/aim-tutorial.js'), 'utf8');
const start = fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8');
const game = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const missions = fs.readFileSync(path.join(root, 'src/systems/missions.js'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8');
const fomoCss = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

if (!manifest.includes('src/systems/first-punch-teach.js')) fail('manifest missing first-punch-teach.js');
if (!/function updateFirstPunchTeach/.test(teach)) fail('updateFirstPunchTeach missing');
if (!/function firstPunchTeachShouldPulsePunch/.test(teach)) fail('punch pulse helper missing');
if (!/FIRST_PUNCH_NUDGE_DELAY_FIRST = 0\.85/.test(teach)) fail('first-adventure nudge must be 0.85s');
if (!/juice\.strikeNudge/.test(teach)) fail('teach must use short strike nudge');
if (!/firstPunchPending/.test(aim)) fail('aim tutorial must honor firstPunchPending');
if (!/updateFirstPunchTeach/.test(game)) fail('Game.update must call updateFirstPunchTeach');
if (!/firstPunchTeachShouldPulsePunch/.test(game)) fail('punch button must pulse on first teach');
if (!/startFirstPunchAdventure/.test(start)) fail('first Avontuur helper missing');
if (!/g\._juiceTeach = true/.test(missions)) fail('onboarding must still teach by doing');
if (!/firstPunchPending/.test(missions)) fail('pause onboard must honor firstPunchPending');
if (/g\.hint = 8/.test(missions)) fail('first-minute 8s wall must stay off');
if (!/data-hub="adventure"/.test(html)) fail('HOME Avontuur tile missing');
if (/data-hub="versus"/.test(html)) fail('Versus must stay retired');
if (!/#menuScreen #fomoRitual \{\s*align-items: flex-end;[\s\S]*pointer-events: none;/.test(fomoCss)) {
  fail('do not restage FOMO overlay pointer-events');
}
if (!/max-height: min\(44vh, 340px\)/.test(fomoCss)) fail('do not restage FOMO 390 compact max-height');
if (/\.screen\s*\{\s*display:\s*none\s*!important/.test(fomoCss)) fail('nuclear .screen hide forbidden');

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) {
  console.log('SMOKE_OK first30-teach static (no chrome)');
  process.exit(0);
}

const outDir = '/tmp/sf-first30-teach';
fs.mkdirSync(outDir, { recursive: true });

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
  try { server = await ensureSmokeServer(8788); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto(smokeBaseUrl(8788) + '/index.html?nosplash=1', { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });

  const result = await page.evaluate(() => {
    const need = [
      'firstPunchPending', 'startFirstPunchAdventure', 'updateFirstPunchTeach',
      'firstPunchTeachPending', 'firstPunchTeachNudgeDelay', 'firstPunchTeachShouldPulsePunch',
      'aimTutorialShouldOffer', 'aimTutorialActive',
    ];
    const missing = need.filter((n) => typeof globalThis[n] !== 'function');
    if (missing.length) return { ok: false, why: 'missing:' + missing.join(',') };

    try {
      save.feltFirstPunch = false;
      save.tipsSeen = {};
      persist();
    } catch (e) {
      return { ok: false, why: 'persist:' + e };
    }

    if (!firstPunchPending()) return { ok: false, why: 'fresh save must firstPunchPending' };
    if (aimTutorialShouldOffer('adventure')) return { ok: false, why: 'aim wall offered on first Avontuur' };
    if (!aimTutorialShouldOffer('training')) return { ok: false, why: 'training lost aim tutorial' };

    startFirstPunchAdventure();
    const g = game;
    if (!g || g.mode !== 'adventure') return { ok: false, why: 'first punch did not start adventure' };
    if (g.level && g.level.n !== 1) return { ok: false, why: 'first punch must be lv1' };
    if (g.gambleRoll) return { ok: false, why: 'first punch must skip gamble' };
    if (aimTutorialActive(g)) return { ok: false, why: 'aim text wall opened on first Avontuur' };
    if (!g._juiceTeach) return { ok: false, why: '_juiceTeach not armed' };

    const delay = firstPunchTeachNudgeDelay(g);
    if (delay > 1) return { ok: false, why: 'first-adventure nudge delay too slow: ' + delay };

    g.t = 0.2;
    g.hint = 0;
    updateFirstPunchTeach(g);
    if (g._juiceNudged || g.hint > 0) return { ok: false, why: 'nudge fired before 0.85s' };

    g.t = 1.0;
    updateFirstPunchTeach(g);
    if (!g._juiceNudged) return { ok: false, why: 'short nudge did not fire' };
    if (g._juiceTaught) return { ok: false, why: 'nudge must not mark taught until punch' };
    const line = String(g.modeHintLine || '');
    if (!/Tik slaan|Tap strike|Druk J|Press J|Tippe|Tape|Toca/i.test(line)) {
      return { ok: false, why: 'nudge line not punch-only: ' + line };
    }
    if (/energy|SUPER|joystick|kick|wapen|special/i.test(line)) {
      return { ok: false, why: 'nudge still a text wall: ' + line };
    }
    if (!firstPunchTeachShouldPulsePunch(g)) return { ok: false, why: 'punch pulse off while waiting' };

    g.combo = 1;
    updateFirstPunchTeach(g);
    if (!g._juiceTaught) return { ok: false, why: 'landed punch must mark taught' };
    if (firstPunchTeachShouldPulsePunch(g)) return { ok: false, why: 'pulse must stop after punch' };

    try { save.feltFirstPunch = true; persist(); } catch (e) {
      return { ok: false, why: 'mark punch:' + e };
    }
    if (firstPunchPending()) return { ok: false, why: 'feltFirstPunch did not clear pending' };
    if (!aimTutorialShouldOffer('adventure')) return { ok: false, why: 'later Avontuur lost aim tutorial' };

    const versusGone = !document.querySelector('[data-hub="versus"]');
    return { ok: true, delay, line, versusGone, reset: typeof window.__sf.resetFirstPunchTeach === 'function' };
  });

  await browser.close();
  try { if (server && server.close) server.close(); } catch (_) {}

  if (pageErrors.length) fail('pageerror ' + pageErrors[0]);
  if (!result || !result.ok) fail(result && result.why ? result.why : 'evaluate failed');
  if (!result.versusGone) fail('Versus tile must stay retired');
  if (!result.reset) fail('__sf.resetFirstPunchTeach missing');
  console.log('SMOKE_OK first30-teach', result.line, 'delay', result.delay);
}

run().catch((err) => fail(err && err.stack ? err.stack : String(err)));
