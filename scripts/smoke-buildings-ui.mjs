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
must(html.indexOf('id="buildingsDetail"') < html.indexOf('id="buildingsList"'),
  'detail must sit above the list on Android');
must(/id="buildingsApiNote"/.test(html), 'missing stub/live API note');
must(/assets\/buttons\/hub\/buildings\.svg/.test(html), 'hub buildings.svg not wired');
must(!/data-hub="versus"/.test(html), 'versus hub tile must stay retired');

must(/hub-tile-buildings/.test(css), 'missing .hub-tile-buildings style');
must(/#buildingsScreen/.test(css), 'missing #buildingsScreen CSS');
must(/buildings-cta/.test(css), 'missing collect/upgrade CTA CSS');
must(!/\.screen\s*\{\s*display:\s*none\s*!important/.test(css), 'nuclear .screen hide forbidden');

must(bridge.includes('BuildingsStub'), 'bridge must ship a stub');
must(bridge.includes('buildingsHasSystemsApi'), 'bridge must detect partner systems API');
must(bridge.includes("sf-buildings-stub-v1"), 'stub must use its own localStorage key');
for (const id of ['mill', 'forge', 'ranch', 'shrine', 'foundry']) {
  must(bridge.includes("'" + id + "'") || bridge.includes('"' + id + '"'), 'factory id missing: ' + id);
  const rel = 'assets/buildings/' + id + '.svg';
  must(fs.existsSync(path.join(root, rel)), 'missing ' + rel);
  must(sw.includes('./' + rel) || sw.includes(rel), 'sw.js missing ' + rel);
}

must(ui.includes('openBuildings') && ui.includes('renderBuildings'), 'buildings-ui missing open/render');
must(ui.includes('doBuildingCollect') && ui.includes('doBuildingUpgrade'), 'missing collect/upgrade CTAs');
must(start.includes("hub === 'buildings'"), 'start.js must route buildings hub tile');
must(coreUi.includes("'buildingsScreen'"), 'UI.screens must include buildingsScreen');
must(/case 'buildings'/.test(coreUi), 'hubTileStatLine must handle buildings');

must(/menu\.buildings/.test(i18n), 'i18n missing menu.buildings');
must(/buildings:\s*\{/.test(i18n), 'i18n missing buildings namespace');
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
      const mill = rows.find((r) => r.dataset.buildingId === 'mill');
      const foundry = rows.find((r) => r.dataset.buildingId === 'foundry');
      const millLocked = !!(mill && mill.classList.contains('buildings-row-locked'));
      const foundryLocked = !!(foundry && foundry.classList.contains('buildings-row-locked'));
      const collect = document.getElementById('btnBuildingCollect');
      const upgrade = document.getElementById('btnBuildingUpgrade');
      let collected = false;
      if (collect && !collect.disabled && typeof UI.doBuildingCollect === 'function') {
        UI.doBuildingCollect('mill');
        collected = true;
      }
      const after = (typeof buildingsGet === 'function') ? buildingsGet('mill') : null;
      if (typeof save !== 'undefined') {
        save.unlocked = 70;
        if (typeof persist === 'function') persist();
      }
      if (typeof UI.renderBuildings === 'function') UI.renderBuildings();
      const foundry2 = document.querySelector('[data-building-id="foundry"]');
      const foundryOpen = !!(foundry2 && !foundry2.classList.contains('buildings-row-locked'));
      const versusGone = !document.querySelector('[data-hub="versus"]');
      const apiLive = typeof buildingsHasSystemsApi === 'function' && buildingsHasSystemsApi();
      return {
        ok: !!(scr && scr.classList.contains('active')
          && ids.length === 5
          && ids.includes('mill') && ids.includes('foundry')
          && !millLocked && foundryLocked
          && collect && upgrade
          && collected && after && after.pending === 0
          && foundryOpen
          && versusGone
          && !apiLive),
        ids,
        millLocked,
        foundryLocked,
        foundryOpen,
        collected,
        pendingAfter: after && after.pending,
        versusGone,
        apiLive,
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
