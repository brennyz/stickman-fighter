#!/usr/bin/env node
/**
 * EXAMINATOR P0 guards: viewport horde scale, factory ids, i18n pills, pet follow.
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error('SMOKE_FAIL examinator:', msg);
  process.exit(1);
}

const monsters = fs.readFileSync(path.join(root, 'src/data/monsters.js'), 'utf8');
const game = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const pet = fs.readFileSync(path.join(root, 'src/entities/pet.js'), 'utf8');
const egg = fs.readFileSync(path.join(root, 'src/entities/egg-pet.js'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
const catalog = fs.readFileSync(path.join(root, 'src/i18n/catalog.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const exam = fs.readFileSync(path.join(root, 'EXAMINATOR.md'), 'utf8');

if (!/function adventureHordeProfile/.test(monsters)) fail('adventureHordeProfile missing');
if (!/function adventureMaxAlive/.test(monsters)) fail('adventureMaxAlive missing');
if (!/band: 'phone'/.test(monsters)) fail('phone horde band missing');
if (!/maxAlive: 8/.test(monsters)) fail('phone maxAlive must be 8');
if (!/maxPerWave: 12/.test(monsters)) fail('phone maxPerWave must be 12');
if (!/adventureMaxAlive/.test(game)) fail('spawn must use adventureMaxAlive');
if (!/stick_lighter/.test(monsters) && !fs.readFileSync(path.join(root, 'src/data/buildings.js'), 'utf8').includes('stick_lighter')) {
  fail('factory id stick_lighter missing from data');
}
for (const id of ['stick_lighter', 'woodchip_glue', 'chipping_wood', 'bamboo_boesa', 'echo_whistle']) {
  const data = fs.readFileSync(path.join(root, 'src/data/buildings.js'), 'utf8');
  if (!data.includes(id)) fail('locked factory id missing: ' + id);
}
if (/follow = g\.traveling \? 11 : 8/.test(pet)) fail('pet follow still laggy 8/11');
if (!/follow = g\.traveling \? 20 : 16/.test(pet)) fail('pet follow must be 16/20');
if (!/follow = g\.traveling \? 18 : 15/.test(egg)) fail('egg-pet follow must be 15/18');
if (!/pillVanity: 'SIER'/.test(i18n)) fail('NL gear pill must be SIER');
if (!/wearing: 'on'/.test(i18n)) fail('EN gear.wearing must be on');
if (!/pressStart: 'gooi een munt'/.test(i18n)) fail('NL pressStart still insert coin');
if (!/tOr\('ui\.summonLoadFail'/.test(ui)) fail('summon load fail must use tOr');
if (!/tOr\('ui\.summonEgg'/.test(ui)) fail('summon egg title must use tOr');
if (!/list XOR detail/.test(css)) fail('buildings dual-pane comment/guard missing');
if (/#buildingsScreen\[data-buildings-pane="list"\] \.buildings-detail \{ display: flex; \}/.test(css)) {
  fail('landscape dual-pane must stay off');
}
if (!/EX-001/.test(exam)) fail('EXAMINATOR.md must keep ranked EX ids');
if (!/speel\.html/.test(exam)) fail('EXAMINATOR.md must keep speel.html');
if (!/No Versus|Versus:\s*retired/.test(exam)) fail('EXAMINATOR.md must keep Versus retired');

console.log('SMOKE_OK examinator: static P0 guards');

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) process.exit(0);

const outDir = '/tmp/sf-examinator';
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

async function snap(browser, w, h, lang) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: w <= 440, hasTouch: w <= 440 });
  await page.goto(smokeBaseUrl(8793), { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });
  const data = await page.evaluate((wantLang, wantW) => {
    try {
      if (typeof W !== 'undefined') W = wantW;
      if (typeof setLang === 'function') setLang(wantLang);
    } catch (_) {}
    const profile = typeof adventureHordeProfile === 'function' ? adventureHordeProfile() : null;
    const lv10 = typeof buildLevel === 'function' ? buildLevel(10, 'normal') : null;
    const lv20 = typeof buildLevel === 'function' ? buildLevel(20, 'normal') : null;
    const sum = (lv) => (lv && lv.waves) ? lv.waves.reduce((s, w) => s + w.length, 0) : null;
    const maxWave = (lv) => (lv && lv.waves) ? Math.max(...lv.waves.map((w) => w.length)) : null;
    return {
      W: typeof W !== 'undefined' ? W : wantW,
      lang: typeof getLang === 'function' ? getLang() : null,
      profile,
      lv10total: sum(lv10),
      lv10max: maxWave(lv10),
      lv20total: sum(lv20),
      lv20max: maxWave(lv20),
      wearing: typeof t === 'function' ? t('gear.wearing') : null,
      pill: typeof t === 'function' ? t('gear.pillVanity') : null,
      press: typeof t === 'function' ? t('menu.pressStart') : null,
    };
  }, lang, w);
  await page.close();
  return data;
}

const port = 8793;
let server = null;
try { server = await ensureSmokeServer(port); } catch (_) {}
const puppeteer = await getPuppeteer();
const browser = await puppeteer.default.launch({
  executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=390,844'],
});
const phone = await snap(browser, 390, 844, 'en');
const desk = await snap(browser, 1280, 800, 'en');
const phoneNl = await snap(browser, 390, 844, 'nl');
await browser.close();
if (server && server.close) try { server.close(); } catch (_) {}

if (!phone.profile || phone.profile.band !== 'phone') fail('390px profile.band must be phone, got ' + JSON.stringify(phone.profile));
if (phone.profile.maxAlive > 8) fail('phone maxAlive ' + phone.profile.maxAlive);
if (phone.lv10max > 12) fail('phone Lv10 wave still huge: ' + phone.lv10max);
if (phone.lv20total > 120) fail('phone Lv20 total still desk-sized: ' + phone.lv20total);
if (!desk.profile || desk.profile.band !== 'desk') fail('1280 profile.band must be desk');
if (desk.profile.maxAlive < 36) fail('desk horde was over-nerfed: ' + desk.profile.maxAlive);
if (phone.wearing !== 'on') fail('EN wearing leak: ' + phone.wearing);
if (phoneNl.pill !== 'SIER') fail('NL vanity pill: ' + phoneNl.pill);
if (phoneNl.press !== 'gooi een munt') fail('NL pressStart: ' + phoneNl.press);

console.log('SMOKE_OK examinator: phone', phone.lv10total, '/', phone.lv20total, 'desk', desk.lv10total, '/', desk.lv20total);
