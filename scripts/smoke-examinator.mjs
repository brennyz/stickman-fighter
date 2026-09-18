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
if (!/DELEGATED #313/.test(exam)) fail('EX-010 must be DELEGATED #313');
if (!/DELEGATED #315/.test(exam)) fail('EX-011 must be DELEGATED #315');
if (!/DELEGATED #314/.test(exam)) fail('EX-012 HUD must be DELEGATED #314');
if (!/DELEGATED #312/.test(exam)) fail('EX-016 must be DELEGATED #312');
if (!/DELEGATED #318/.test(exam)) fail('EX-017/018 must be DELEGATED #318');
if (!/function speciesLabel/.test(catalog)) fail('speciesLabel helper missing');
if (!/piepvleugel: 'Peepwing'/.test(catalog)) fail('EN species.piepvleugel must be Peepwing');
if (!/t\('gamble\.' \+ out/.test(monsters)) fail('gambleOutcomeLabel must use t(gamble.*)');
if (/if \(g\.outcome === 'superBoss'\) return 'Pech!/.test(monsters)) fail('gambleOutcomeLabel still hardcoded Dutch first');
if (!/pressStart: 'insère une pièce'/.test(i18n)) fail('FR pressStart must be insère une pièce');
if (!/pressStart: 'inserta una moneda'/.test(i18n)) fail('ES pressStart must be inserta una moneda');
if (i18n.match(/pressStart: 'insert coin'/g)?.length > 1) fail('FR/ES pressStart still insert coin');
if (!/EX-021: compact FOMO/.test(css)) fail('390 FOMO compact comment missing');
if (!/#menuScreen #fomoRitual \{\s*align-items: flex-end;[\s\S]*pointer-events: none;/.test(css)) {
  fail('390 FOMO overlay must be pointer-events none so tiles stay tappable');
}
if (!/max-height: min\(44vh, 340px\)/.test(css)) fail('390 FOMO sheet must be compact max-height');
if (!/FEEL bar/.test(exam)) fail('EXAMINATOR.md must keep FEEL bar');
if (!/EX-022/.test(exam)) fail('EXAMINATOR.md must rank EX-022 retry');
if (!/DELEGATED #323/.test(exam)) fail('EX-022 must be DELEGATED #323');
if (!/EX-023/.test(exam) || !/feltFirstPunch/.test(exam)) fail('EXAMINATOR.md must keep EX-023 first punch');
if (!/first-punch-teach\.js/.test(fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8'))) {
  fail('manifest must keep first-punch-teach.js');
}
if (!/firstPunchPending\(\)/.test(fs.readFileSync(path.join(root, 'src/systems/aim-tutorial.js'), 'utf8'))) {
  fail('aim tutorial must defer while firstPunchPending');
}
if (!/EX-024/.test(exam) || !/advLoseBy/.test(exam)) fail('EXAMINATOR.md must keep EX-024 killer name');
if (!/EX-026/.test(exam) || !/IAP out of scope/.test(exam)) fail('EXAMINATOR.md must note IAP out of scope');
if (/win \? 1600 : 380/.test(game) || /win \? 1400 : 380/.test(game)) {
  fail('lose 380ms retry belongs to #323 — do not keep EX-022 delays');
}
if (!/resultShowDelayMs/.test(game)) fail('adventure/training delay must defer to #323 resultShowDelayMs');
if (/#resultScreen.is-lose #resAgain/.test(css) || /#resultScreen.is-lose #resMenu/.test(css)) {
  fail('is-lose Opnieuw/Menu CSS fights #323 — remove it');
}
const startJs = fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8');
const missions = fs.readFileSync(path.join(root, 'src/systems/missions.js'), 'utf8');
if (/function retryLastFight/.test(startJs)) fail('retryLastFight must stay off #320 (EX-022 is #323)');
if (!/function firstPunchPending/.test(startJs)) fail('firstPunchPending helper missing');
if (!/function startFirstPunchAdventure/.test(startJs)) fail('startFirstPunchAdventure helper missing');
if (!/function markFeltFirstPunch/.test(startJs)) fail('markFeltFirstPunch helper missing');
if (!/feltFirstPunch/.test(fs.readFileSync(path.join(root, 'src/core/storage.js'), 'utf8'))) {
  fail('DEFAULT_SAVE must keep feltFirstPunch');
}
if (!/firstPunchPending\(\)/.test(missions)) fail('fomoRitualPending / gokGooiStartLevel must honor firstPunchPending');
if (!/function notePlayerHurtSource/.test(game)) fail('notePlayerHurtSource helper missing');
if (!/function adventureLoseCopy/.test(game)) fail('adventureLoseCopy helper missing');
if (!/lastHurtBy/.test(game)) fail('game.lastHurtBy must be tracked');
if (!/advLoseBy: 'VERLOREN · \{name\}'/.test(catalog)) fail('NL result.advLoseBy missing');
if (!/advLoseBy: 'YOU LOSE · \{name\}'/.test(catalog)) fail('EN result.advLoseBy missing');
if (!/killedByFlyer/.test(catalog)) fail('result.killedByFlyer missing');
if (!/titleParams/.test(ui)) fail('showResult must pass titleParams for killer name');
if (!/EX-027/.test(exam)) fail('EXAMINATOR.md must rank EX-027 first-loss tip');
if (!/EX-028/.test(exam)) fail('EXAMINATOR.md must rank EX-028 killer line');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!/id="resKiller"/.test(html)) fail('index.html must have #resKiller');
if (!/#resultScreen \.res-killer/.test(css)) fail('result killer line CSS missing');
if (!/Skip gamble lecture until first punch/.test(game)) {
  fail('lose tip must skip gamble lecture until first punch');
}

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
      piep: typeof speciesLabel === 'function' ? speciesLabel('piepvleugel') : null,
      gamble: typeof gambleOutcomeLabel === 'function' ? gambleOutcomeLabel({ outcome: 'superBoss' }) : null,
      firstPunch: typeof firstPunchPending === 'function' ? firstPunchPending() : null,
      loseBy: typeof t === 'function' ? t('result.advLoseBy', { name: 'Peepwing' }) : null,
      killedBy: typeof t === 'function' ? t('result.killedBy', { name: 'Peepwing', prog: '1/3' }) : null,
      fomoSheet: (() => {
        const el = document.querySelector('#fomoRitual .fomo-ritual-sheet');
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { maxH: cs.maxHeight, pad: cs.paddingTop };
      })(),
      fomoOverlay: (() => {
        const el = document.getElementById('fomoRitual');
        if (!el) return null;
        return { pe: getComputedStyle(el).pointerEvents };
      })(),
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
const phoneFr = await snap(browser, 390, 844, 'fr');
const phoneEs = await snap(browser, 390, 844, 'es');
const phoneDe = await snap(browser, 390, 844, 'de');
const feelPage = await browser.newPage();
await feelPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await feelPage.goto(smokeBaseUrl(8793), { waitUntil: 'load', timeout: 30000 });
await feelPage.waitForFunction(() => window.__sfBooted, { timeout: 25000 });
const feel = await feelPage.evaluate(() => {
  try { if (typeof enterHubFromTitle === 'function') enterHubFromTitle({}); } catch (_) {}
  const pending = typeof firstPunchPending === 'function' ? firstPunchPending() : null;
  const fomoOff = typeof fomoRitualPending === 'function' ? fomoRitualPending() : null;
  UI.showResult(false, {
    mode: 'adventure', level: 1, win: false, xp: 0,
    titleKey: 'result.advLoseBy', titleParams: { name: 'Peepwing' },
    detail: 'feel', tip: 'jump',
  });
  const title = document.getElementById('resTitle');
  const killer = document.getElementById('resKiller');
  return {
    pending,
    fomoOff,
    title: title ? title.textContent : '',
    killer: killer ? killer.textContent : '',
    killerOn: !!(killer && !killer.hidden),
    hasRetry: typeof retryLastFight === 'function',
    hasFirst: typeof startFirstPunchAdventure === 'function',
    hasHurt: typeof notePlayerHurtSource === 'function',
  };
});
await feelPage.evaluate(() => {
  try { if (typeof save !== 'undefined' && save) { save.feltFirstPunch = false; persist(); } } catch (_) {}
  startFirstPunchAdventure();
});
await feelPage.waitForFunction(() => game && game.monsters && game.monsters.some((m) => m && m.alive), { timeout: 8000 });
const first30 = await feelPage.evaluate(() => ({
  aim: typeof aimTutorialActive === 'function' && aimTutorialActive(game),
  teach: !!(game && game._juiceTeach),
  taught: !!(game && game._juiceTaught),
  pending: typeof firstPunchPending === 'function' && firstPunchPending(),
}));
if (first30.aim) fail('first Avontuur must not open aim text wall');
if (!first30.teach) fail('first Avontuur must start punch teach');
if (!first30.pending) fail('first Avontuur must stay firstPunchPending until a punch');
await feelPage.evaluate(() => {
  const m = game.monsters.find((x) => x && x.alive);
  game.player.takeDamage(9999, 20, game, { attacker: m });
  if (!game.over) game.finishAdventure(false);
});
await feelPage.waitForFunction(() => typeof state !== 'undefined' && state === 'result', { timeout: 4000 });
const feelLose = await feelPage.evaluate(() => ({
  title: document.getElementById('resTitle') && document.getElementById('resTitle').textContent,
  killer: document.getElementById('resKiller') && document.getElementById('resKiller').textContent,
  tip: document.getElementById('resTip') && document.getElementById('resTip').textContent,
  pending: typeof firstPunchPending === 'function' && firstPunchPending(),
  name: game && game.lastHurtBy && game.lastHurtBy.name,
}));
await feelPage.close();
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
if (phone.piep !== 'Peepwing') fail('EN piepvleugel: ' + phone.piep);
if (phoneNl.piep !== 'Piepvleugel') fail('NL piepvleugel must stay Dutch: ' + phoneNl.piep);
if (phoneDe.piep !== 'Piepflügel') fail('DE piepvleugel: ' + phoneDe.piep);
if (phoneFr.piep !== 'Ailepiou') fail('FR piepvleugel: ' + phoneFr.piep);
if (phoneEs.piep !== 'Alippiío') fail('ES piepvleugel: ' + phoneEs.piep);
if (!phone.gamble || /Pech!|Super-baas/.test(phone.gamble)) fail('EN gamble still Dutch: ' + phone.gamble);
if (phoneFr.press !== 'insère une pièce') fail('FR pressStart: ' + phoneFr.press);
if (phoneEs.press !== 'inserta una moneda') fail('ES pressStart: ' + phoneEs.press);
if (phone.fomoOverlay && phone.fomoOverlay.pe !== 'none') {
  fail('390 FOMO overlay pointer-events must be none, got ' + phone.fomoOverlay.pe);
}
if (feel.hasRetry) fail('retryLastFight must not exist on #320 (owned by #323)');
if (!feel.hasFirst) fail('startFirstPunchAdventure must exist');
if (!feel.hasHurt) fail('notePlayerHurtSource must exist');
if (feel.pending !== true) fail('fresh save must firstPunchPending');
if (feel.fomoOff !== false) fail('FOMO must stay off until first punch, got ' + feel.fomoOff);
if (!/VERLOREN|YOU LOSE|DÉFAITE|DERROTA/.test(feel.title || '')) fail('lose title must stay short, got ' + feel.title);
if (feel.title && /Peepwing/.test(feel.title)) fail('killer must not wrap inside Bangers title: ' + feel.title);
if (!feel.killerOn || feel.killer !== 'Peepwing') fail('resKiller must show Peepwing, got ' + feel.killer);
if (!phone.loseBy || !/Peepwing/.test(phone.loseBy)) fail('EN advLoseBy: ' + phone.loseBy);
if (!phoneNl.loseBy || !/VERLOREN/.test(phoneNl.loseBy)) fail('NL advLoseBy: ' + phoneNl.loseBy);
if (!phoneDe.loseBy || !/VERLOREN/.test(phoneDe.loseBy)) fail('DE advLoseBy: ' + phoneDe.loseBy);
if (!phoneFr.loseBy || !/DÉFAITE/.test(phoneFr.loseBy)) fail('FR advLoseBy: ' + phoneFr.loseBy);
if (!phoneEs.loseBy || !/DERROTA/.test(phoneEs.loseBy)) fail('ES advLoseBy: ' + phoneEs.loseBy);
if (!feelLose.name || (feelLose.killer || '') !== feelLose.name) {
  fail('live lose #resKiller must name killer: ' + feelLose.killer + ' vs ' + feelLose.name);
}
if (feelLose.title && feelLose.name && feelLose.title.indexOf(feelLose.name) >= 0) {
  fail('live lose Bangers title must stay short, got ' + feelLose.title);
}
if (/dobbelen|gamble|parier|würfeln|apostar/i.test(feelLose.tip || '')) {
  fail('first-punch lose tip must not lecture gamble: ' + feelLose.tip);
}
if (feelLose.name && !(feelLose.tip || '').includes(feelLose.name)) {
  fail('first-punch lose tip must lead with killer: ' + feelLose.tip);
}

console.log('SMOKE_OK examinator: phone', phone.lv10total, '/', phone.lv20total, 'desk', desk.lv10total, '/', desk.lv20total);
