#!/usr/bin/env node
/**
 * Buildings HOME tile + list/detail screen (batch 2 of 4).
 * No Versus. Stub API allowed until systems PR merges.
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
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8');
const bridge = fs.readFileSync(path.join(root, 'src/systems/buildings-bridge.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/ui/buildings-ui.js'), 'utf8');
const start = fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
const coreUi = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');

must(/data-hub="buildings"/.test(html), 'HOME missing data-hub=buildings tile');
must(/hub-tile-buildings/.test(html), 'HOME buildings tile must use hub-tile-buildings');
must(/id="btnBuildings"/.test(html), 'missing #btnBuildings');
must(/id="buildingsScreen"/.test(html), 'missing #buildingsScreen');
must(/id="buildingsList"/.test(html), 'missing #buildingsList');
must(/id="buildingsDetail"/.test(html), 'missing #buildingsDetail');
must(/id="buildingsWallet"/.test(html), 'missing #buildingsWallet');
must(html.indexOf('id="buildingsDetail"') < html.indexOf('id="buildingsList"'),
  'detail must sit above the list on Android');
must(/id="buildingsApiNote"/.test(html), 'missing stub/live API note');
must(/assets\/buttons\/hub\/buildings\.svg/.test(html), 'hub buildings.svg not wired');
must(!/data-hub="versus"/.test(html), 'versus hub tile must stay retired');
for (const id of ['stick_lighter', 'woodchip_glue', 'chipping_wood', 'bamboo_boesa', 'echo_whistle']) {
  must(html.includes('data-factory-id="' + id + '"'), 'HTML stub missing data-factory-id=' + id);
}

must(/hub-tile-buildings/.test(css), 'missing .hub-tile-buildings style');
must(/#buildingsScreen/.test(css), 'missing #buildingsScreen CSS');
must(/buildings-cta/.test(css), 'missing collect/upgrade CTA CSS');
must(/buildings-wallet-chip/.test(css), 'missing readable wallet chip CSS');
must(/data-buildings-pane/.test(css) || /buildings-pane-detail/.test(css), 'list/detail pane CSS missing');
must(/buildings-cta-stack/.test(css), 'collect/upgrade must stack, not mash in one grid');
must(!/\.screen\s*\{\s*display:\s*none\s*!important/.test(css), 'nuclear .screen hide forbidden');

must(bridge.includes('BuildingsStub'), 'bridge must ship a stub');
must(bridge.includes('buildingsHasSystemsApi'), 'bridge must detect partner systems API');
must(bridge.includes("sf-buildings-stub-v1"), 'stub must use its own localStorage key');
for (const id of ['stick_lighter', 'woodchip_glue', 'chipping_wood', 'bamboo_boesa', 'echo_whistle']) {
  must(bridge.includes("'" + id + "'") || bridge.includes('"' + id + '"'), 'factory id missing: ' + id);
  const rel = 'assets/buildings/' + id + '.svg';
  must(fs.existsSync(path.join(root, rel)), 'missing ' + rel);
  must(sw.includes('./' + rel) || sw.includes(rel), 'sw.js missing ' + rel);
}
must(!bridge.includes("'mill'") && !bridge.includes('"mill"'), 'bridge must not keep mill as a factory id');
must(!bridge.includes("'forge'") && !bridge.includes('"forge"'), 'bridge must not keep forge as a factory id');

must(ui.includes('openBuildings') && ui.includes('renderBuildings'), 'buildings-ui missing open/render');
must(ui.includes('doBuildingCollect') && ui.includes('doBuildingUpgrade'), 'missing collect/upgrade CTAs');
must(ui.includes('buildingsShowDetail') && ui.includes('buildingsShowList'), 'list→detail flow missing');
must(ui.includes('buildingsShowUpgradeStep'), 'upgrade must be a separate step');
must(ui.includes('paintBuildingsWallet'), 'wallet painter missing');
must(ui.includes('whatItDoes') || ui.includes('buildingsEffectHtml'), 'power/effect copy missing');
must(ui.includes('data-factory-id'), 'rows must bind data-factory-id');
must(bridge.includes('buildingsWalletModel'), 'bridge must expose wallet model');
must(bridge.includes('buildingTooltipModel'), 'bridge must prefer live tooltip model');
must(start.includes("hub === 'buildings'"), 'start.js must route buildings hub tile');
must(coreUi.includes("'buildingsScreen'"), 'UI.screens must include buildingsScreen');
must(/case 'buildings'/.test(coreUi), 'hubTileStatLine must handle buildings');

must(/menu\.buildings/.test(i18n), 'i18n missing menu.buildings');
must(/buildings:\s*\{/.test(i18n), 'i18n missing buildings namespace');
must(/whatItDoes/.test(i18n), 'i18n missing what-does-this-do copy');
must(/upgradeOpen/.test(i18n), 'i18n missing separate upgrade-step copy');
must(manifest.includes('src/systems/buildings-bridge.js'), 'manifest missing buildings-bridge');
must(manifest.includes('src/ui/buildings-ui.js'), 'manifest missing buildings-ui');
must(sw.includes('./assets/buttons/hub/buildings.svg'), 'sw.js missing hub buildings.svg');

must(fs.existsSync(path.join(root, 'docs/BUILDINGS-UI.md')), 'missing docs/BUILDINGS-UI.md');
must(/No Versus/.test(fs.readFileSync(path.join(root, 'docs/BUILDINGS-UI.md'), 'utf8')),
  'docs must keep Versus retired');

console.log('SMOKE_OK buildings-ui: HOME tile + list/detail + stub API');

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) process.exit(0);

const outDir = '/tmp/sf-buildings-ui';
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
  const port = Number(process.env.SF_BUILDINGS_UI_PORT || 8798);
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
  await page.waitForFunction(() => window.__sfBooted, { timeout: 45000 });

  const result = await page.evaluate(() => {
    try {
      try { localStorage.removeItem('sf-buildings-stub-v1'); } catch (_) {}
      if (typeof setLang === 'function') setLang('nl');
      const tile = document.querySelector('[data-hub="buildings"]');
      if (!tile) return { ok: false, why: 'no HOME buildings tile' };
      if (typeof UI.openBuildings === 'function') UI.openBuildings();
      else tile.click();
      const scr = document.getElementById('buildingsScreen');
      const list = document.getElementById('buildingsList');
      const detail = document.getElementById('buildingsDetail');
      const rows = list ? [...list.querySelectorAll('[data-building-id]')] : [];
      const ids = rows.map((r) => r.dataset.buildingId);
      const lighter = rows.find((r) => r.dataset.buildingId === 'stick_lighter');
      const millCopy = rows.find((r) => r.dataset.buildingId === 'mill' || r.dataset.buildingId === 'forge');
      const echo = rows.find((r) => r.dataset.buildingId === 'echo_whistle');
      const lighterLocked = !!(lighter && lighter.classList.contains('buildings-row-locked'));
      const echoLocked = !!(echo && echo.classList.contains('buildings-row-locked'));
      const collect = document.getElementById('btnBuildingCollect');
      const upgrade = document.getElementById('btnBuildingUpgrade');
      const paneList = (scr && scr.getAttribute('data-buildings-pane')) === 'list';
      const factoryIds = list ? [...list.querySelectorAll('[data-factory-id]')].map((r) => r.getAttribute('data-factory-id')) : [];
      const wallet = document.getElementById('buildingsWallet');
      const chips = wallet ? [...wallet.querySelectorAll('[data-res]')].map((c) => c.getAttribute('data-res')) : [];
      if (typeof UI.buildingsShowDetail === 'function') UI.buildingsShowDetail('stick_lighter');
      const paneDetail = (scr && scr.getAttribute('data-buildings-pane')) === 'detail';
      const effect = document.querySelector('[data-buildings-effect="stick_lighter"]');
      const overview = document.getElementById('btnBuildingsOverview');
      if (typeof save !== 'undefined') {
        save.unlocked = 70;
        if (typeof persist === 'function') persist();
      }
      if (typeof UI.renderBuildings === 'function') UI.renderBuildings();
      const echo2 = document.querySelector('[data-building-id="echo_whistle"]');
      const echoOpen = !!(echo2 && !echo2.classList.contains('buildings-row-locked'));
      const versusGone = !document.querySelector('[data-hub="versus"]');
      const apiLive = typeof buildingsHasSystemsApi === 'function' && buildingsHasSystemsApi();
      const mashed = !!(collect && upgrade && collect.parentElement && collect.parentElement === upgrade.parentElement
        && getComputedStyle(collect.parentElement).gridTemplateColumns.split(' ').length > 1
        && getComputedStyle(collect.parentElement).display === 'grid');
      if (typeof save !== 'undefined') {
        save.petCoins = Math.max(save.petCoins || 0, 80);
        save.buildings = save.buildings || { schema: 1, factories: {}, wallet: {} };
        save.buildings.schema = 1;
        save.buildings.factories = save.buildings.factories || {};
        save.buildings.wallet = save.buildings.wallet || {};
        save.buildings.factories.stick_lighter = { level: 3, lastTickAt: Date.now() - 4 * 3600000, stored: 12 };
        if (typeof persist === 'function') persist();
      }
      if (typeof UI.renderBuildings === 'function') UI.renderBuildings();
      const sparkBefore = (typeof buildingWallet === 'function') ? Number(buildingWallet('spark') || 0) : 0;
      if (typeof UI.doBuildingCollect === 'function') UI.doBuildingCollect('stick_lighter');
      const sparkAfter = (typeof buildingWallet === 'function') ? Number(buildingWallet('spark') || 0) : 0;
      const collected = sparkAfter > sparkBefore;
      const flash = !!document.querySelector('.buildings-collect-flash, .buildings-wallet-chip.is-flash');
      if (typeof UI.buildingsShowUpgradeStep === 'function') UI.buildingsShowUpgradeStep();
      const upgradeConfirm = document.getElementById('btnBuildingUpgradeConfirm');
      const collectGoneOnUpgrade = !document.getElementById('btnBuildingCollect');
      if (typeof UI.buildingsShowList === 'function') UI.buildingsShowList();
      const backToList = (scr && scr.getAttribute('data-buildings-pane')) === 'list';
      return {
        ok: !!(scr && scr.classList.contains('active')
          && ids.length === 5
          && ids.includes('stick_lighter') && ids.includes('echo_whistle')
          && factoryIds.includes('stick_lighter') && factoryIds.includes('echo_whistle')
          && !ids.includes('mill') && !ids.includes('forge')
          && !lighterLocked && echoLocked
          && !millCopy
          && collect && upgrade
          && paneList && paneDetail
          && effect && overview
          && chips.includes('spark') && chips.includes('echo') && chips.includes('petCoins')
          && !mashed
          && collected && flash && upgradeConfirm && collectGoneOnUpgrade && backToList
          && echoOpen
          && versusGone
          && apiLive),
        ids,
        factoryIds,
        chips,
        lighterLocked,
        echoLocked,
        echoOpen,
        paneList,
        paneDetail,
        hasEffect: !!effect,
        versusGone,
        apiLive,
        mashed,
        collected,
        flash,
        upgradeConfirm: !!upgradeConfirm,
        collectGoneOnUpgrade,
        backToList,
        head: (document.getElementById('buildingsScreenHead') || {}).textContent || '',
      };
    } catch (e) {
      return { ok: false, why: String(e && e.stack || e) };
    }
  });

  await browser.close();
  if (server) server.close();
  if (!result.ok) {
    console.error('SMOKE_FAIL buildings-ui browser', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('SMOKE_OK buildings-ui browser', JSON.stringify(result));
}

runBrowser().catch((e) => { console.error('SMOKE_FAIL buildings-ui browser', e); process.exit(1); });
