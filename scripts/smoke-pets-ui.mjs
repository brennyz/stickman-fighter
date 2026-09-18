#!/usr/bin/env node
/**
 * Pets first-class catch-up: wallet, hero, next-goal, list→detail, filters.
 * No Versus. speel.html share URL unchanged.
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/ui/pets-ui.js'), 'utf8');
const data = fs.readFileSync(path.join(root, 'src/data/pets.js'), 'utf8');
const start = fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8');
const coreUi = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs/PETS-UI.md'), 'utf8');

must(/id="petScreen"/.test(html), 'missing #petScreen');
must(/id="petsWallet"/.test(html), 'missing #petsWallet');
must(/id="petsHero"/.test(html) && /id="petsHeroCanvas"/.test(html), 'missing pets hero');
must(/id="petsNext"/.test(html), 'missing #petsNext');
must(/id="petDetail"/.test(html), 'missing #petDetail');
must(/id="petFilterBar"/.test(html), 'missing #petFilterBar');
must(/id="petList"/.test(html) && /id="eggList"/.test(html), 'missing pet/egg lists');
must(/id="eggCrackBtn"/.test(html), 'missing #eggCrackBtn');
must(html.indexOf('id="eggCrackBtn"') < html.indexOf('id="petEggPanel"'),
  'daily-egg CTA must sit in pets chrome, not inside the egg panel');
must(/id="btnPetsHome"/.test(html) && /data-hub="pets"/.test(html), 'HOME pets tile missing');
must(/id="pausePetChip"/.test(html), 'pause pet chip missing');
must(html.indexOf('id="petDetail"') < html.indexOf('id="petList"'),
  'detail must sit above the list on Android');
must(/id="btnPets"/.test(html) && /hub-tile-pets/.test(html), 'collection pets tile missing');
must(!/data-hub="versus"/.test(html), 'versus hub tile must stay retired');

must(/#petScreen\.pets-screen/.test(css), 'missing #petScreen pets-screen CSS');
must(/pets-wallet-chip/.test(css), 'missing wallet chip CSS');
must(/pets-cta/.test(css), 'missing pets CTA CSS');
must(/data-pets-pane/.test(css), 'list/detail pane CSS missing');
must(!/\.screen\s*\{\s*display:\s*none\s*!important/.test(css), 'nuclear .screen hide forbidden');

must(ui.includes('openPets') && ui.includes('renderPets'), 'pets-ui missing open/render');
must(ui.includes('petsShowDetail') && ui.includes('petsShowList'), 'list→detail flow missing');
must(ui.includes('paintPetsWallet') && ui.includes('paintPetsHero'), 'wallet/hero painters missing');
must(ui.includes('paintPetsNext'), 'next-goal strip missing');
must(ui.includes('paintPetsCrackCta') && ui.includes('doCrackDailyEgg'), 'chrome daily-egg CTA missing');
must(ui.includes('paintPausePetChip'), 'pause equip chip painter missing');
must(ui.includes('listLocked') || data.includes('listLocked'), 'short locked-list i18n missing');
must(ui.includes('claimPetFromDex') || data.includes('claimPetFromDex'), 'claim-if-kills-ready missing');
must(data.includes('function petsHubStatLine'), 'hub next-step helper missing');
must(data.includes('function petStatusOf'), 'petStatusOf missing');
must(data.includes('function petsNextGoal'), 'petsNextGoal missing');
must(data.includes('function cycleCombatPet') && data.includes('function tamedPetIds'),
  'pause cycle helpers missing');
must(data.includes("tOr('pets.lineNeed'"), 'petProgressLine must use i18n pets.lineNeed');
must(start.includes('UI.openPets'), 'start.js must open pets via openPets');
must(start.includes("hub === 'pets'") && start.includes('pausePetChip'),
  'HOME hub pets + pause chip binds missing');
must(coreUi.includes('petsGoBack'), 'goBack must pop pets detail first');
must(/pets:\s*\{/.test(i18n) && /doesTitle/.test(i18n), 'i18n missing pets doesTitle');
must(/filterReady/.test(i18n) && /crackWait/.test(i18n), 'i18n missing filter/crack-wait copy');
must(/listLocked/.test(i18n) && /pauseEquip/.test(i18n) && /ritualCtaEgg/.test(i18n),
  'i18n missing locked-list / pause / FOMO egg CTA');
must(/emptyFirst/.test(i18n) && /emptyFilterAct/.test(i18n) && /pauseNoneHint/.test(i18n),
  'i18n missing 390 empty/equip copy');
must(/emptyFirst/.test(ui) && /pets-empty-btn/.test(ui), 'empty-state CTA missing');
must(/overflow-y:\s*auto/.test(css) && /#petScreen \.pets-list/.test(css),
  '390 list must scroll independently');
must(manifest.includes('src/ui/pets-ui.js'), 'manifest missing pets-ui');
must(/No Versus/.test(docs), 'docs must keep Versus retired');
must(/speel\.html/.test(docs), 'docs must keep speel.html share URL');

console.log('SMOKE_OK pets-ui: static wallet + list/detail + i18n');

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) process.exit(0);

const outDir = '/tmp/sf-pets-ui';
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

async function runBrowser() {
  const port = Number(process.env.SF_PETS_UI_PORT || 8797);
  let server = null;
  try { server = await ensureSmokeServer(port); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(smokeBaseUrl(port) + '?nosplash=1', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 20000 });

  const result = await page.evaluate(() => {
    try {
      if (typeof petStatusOf !== 'function' || typeof petsNextGoal !== 'function') {
        return { ok: false, why: 'view-model helpers missing' };
      }
      if (typeof UI.openPets !== 'function' || typeof UI.renderPets !== 'function') {
        return { ok: false, why: 'pets UI missing' };
      }
      const tile = document.getElementById('btnPets');
      if (!tile) return { ok: false, why: 'btnPets missing' };
      if (!document.getElementById('btnPetsHome')) return { ok: false, why: 'HOME pets tile missing' };
      if (!document.getElementById('pausePetChip')) return { ok: false, why: 'pause pet chip missing' };
      UI.openPets();
      const screen = document.getElementById('petScreen');
      if (!screen || !screen.classList.contains('active')) return { ok: false, why: 'petScreen not active' };
      if (screen.getAttribute('data-pets-pane') !== 'list') return { ok: false, why: 'must start on list' };
      const wallet = document.getElementById('petsWallet');
      if (!wallet || !wallet.querySelector('.pets-wallet-chip')) return { ok: false, why: 'wallet chips missing' };
      const hero = document.getElementById('petsHeroCanvas');
      const heroBox = hero && hero.getBoundingClientRect();
      if (!heroBox || heroBox.height < 60) return { ok: false, why: 'hero too small', h: heroBox && heroBox.height };
      const next = document.getElementById('petsNext');
      if (!next || !(next.textContent || '').trim()) return { ok: false, why: 'next-goal empty' };
      const heroPerk = (document.getElementById('petsHeroPerk') || {}).textContent || '';
      if (/tik een rij|tap a row/i.test(heroPerk)) {
        return { ok: false, why: 'empty hero still says tap a row', heroPerk };
      }
      UI.petFilter = 'tamed';
      UI.renderPets();
      const empty = document.querySelector('#petList .pets-empty');
      if (!empty) return { ok: false, why: 'tamed-filter empty state missing' };
      if (!/Tem via|Tame via|Zähmen|Dompte|Doma/i.test(empty.textContent || '')) {
        return { ok: false, why: 'emptyFirst copy missing', text: empty.textContent };
      }
      if (!empty.querySelector('.pets-empty-btn')) return { ok: false, why: 'empty Show-all CTA missing' };
      const listEl = document.getElementById('petList');
      const ov = listEl ? getComputedStyle(listEl).overflowY : '';
      if (ov !== 'auto' && ov !== 'scroll') {
        return { ok: false, why: 'list not independently scrollable', ov };
      }
      UI.petFilter = 'all';
      UI.renderPets();
      const cards = [...document.querySelectorAll('#petList [data-pet-id]')];
      if (cards.length < 12) return { ok: false, why: 'need 12 dex pets', n: cards.length };
      const tooSmall = cards.filter((c) => c.getBoundingClientRect().height < 44);
      if (tooSmall.length) return { ok: false, why: 'touch <44', h: tooSmall[0].getBoundingClientRect().height };
      const perkOnList = cards.some((c) => c.querySelector('.cinfo:not(.pets-status)'));
      if (perkOnList) return { ok: false, why: 'list cards still show perk wall' };
      const crack = document.getElementById('eggCrackBtn');
      if (!crack) return { ok: false, why: 'eggCrackBtn missing' };
      if (crack.closest('#petEggPanel')) return { ok: false, why: 'egg CTA still buried in egg panel' };
      const eggReady = typeof canCrackDailyEgg === 'function' && canCrackDailyEgg();
      if (eggReady && crack.hidden) return { ok: false, why: 'egg CTA hidden when ready' };
      if (eggReady && crack.getBoundingClientRect().height < 40) {
        return { ok: false, why: 'egg CTA not visible', h: crack.getBoundingClientRect().height };
      }
      const first = cards[0];
      first.click();
      if (screen.getAttribute('data-pets-pane') !== 'detail') return { ok: false, why: 'tap did not open detail' };
      const detail = document.getElementById('petDetail');
      if (!detail || !detail.querySelector('.pets-cta')) return { ok: false, why: 'detail CTA missing' };
      if (!/Wat doet|What does|Was macht|Ça fait|Qué hace/i.test(detail.textContent || '')) {
        return { ok: false, why: 'what-does-this-do missing', text: detail.textContent };
      }
      const versus = document.querySelector('[data-hub="versus"]');
      if (versus) return { ok: false, why: 'versus tile must stay gone' };
      return { ok: true, n: cards.length, next: next.textContent };
    } catch (err) {
      return { ok: false, why: String(err && err.message || err) };
    }
  });

  await browser.close();
  if (server) try { server.close(); } catch (_) {}
  if (!result.ok) {
    console.error('SMOKE_FAIL pets-ui browser', result);
    process.exit(1);
  }
  console.log('SMOKE_OK pets-ui browser', result);
}

runBrowser().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
