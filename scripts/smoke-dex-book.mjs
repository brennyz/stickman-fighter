#!/usr/bin/env node
/**
 * d12: monsterboek biome filter + flavor blurbs + live species count.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const outDir = '/tmp/sf-dex-book';
fs.mkdirSync(outDir, { recursive: true });
const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.error('SMOKE_FAIL no chrome'); process.exit(1); }

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
    const need = ['speciesBlurb', 'speciesBiomeId', 'dexBiomeDiscovered', 'dexBiomeTotals', 'dexSortedIds', 'dexSecretHint'];
    const missing = need.filter((n) => typeof globalThis[n] !== 'function');
    if (missing.length) return { ok: false, why: 'missing:' + missing.join(',') };

    const n = SPECIES_ORDER.length;
    if (n < 200) return { ok: false, why: 'species-count-low:' + n };

    const slymo = speciesBlurb('slymo');
    const cowArt = Object.keys(SPECIES).find((id) => SPECIES[id].art === 'cow');
    const cowBlurb = cowArt ? speciesBlurb(cowArt) : '';
    const swimOk = MONSTER_TYPE_LABEL.swim === 'Zee';

    save.dex = save.dex || {};
    save.dex.slymo = 3;
    if (cowArt) save.dex[cowArt] = 2;
    const seaId = SPECIES_ORDER.find((id) => speciesBiomeId(SPECIES[id], id) === 'sea');
    if (seaId) save.dex[seaId] = 1;

    const farmN = dexBiomeDiscovered('farm');
    const seaN = dexBiomeDiscovered('sea');
    const farmIds = dexSortedIds('all', 'all', 'book', 'farm');
    const allFarm = farmIds.every((id) => speciesBiomeId(SPECIES[id], id) === 'farm');
    const satanHint = dexSecretHint('satan');

    const discover = ['wolfling', 'havikpup', 'rammelbeen', 'ghoulling', 'pinguinkuiken', 'manmoetpup'];
    for (const id of discover) if (SPECIES[id]) save.dex[id] = 2;

    if (typeof applyI18n === 'function') applyI18n();
    UI.dexBiomeFilter = 'all';
    UI.renderDex();
    const bar = document.getElementById('dexBiomeFilterBar');
    const list = document.getElementById('dexList');
    const hasBiomeBar = !!(bar && bar.querySelector('[data-dex-biome-filter="farm"]'));
    const hasFrostChip = !!(bar && bar.querySelector('[data-dex-biome-filter="frost"]'));
    const hasWildChip = !!(bar && bar.querySelector('[data-dex-biome-filter="wild"]'));
    const hasBlurb = !!(list && list.querySelector('.dex-blurb'));
    const hubDex = document.querySelector('#btnDex .hub-tile-sub') || document.querySelector('#btnDex small');
    const hubCountOk = !!(hubDex && hubDex.textContent && !hubDex.textContent.includes('114') && !hubDex.textContent.includes('126') && hubDex.textContent.includes(String(n)));

    const tot = dexBiomeTotals();
    UI.dexBiomeFilter = 'wild';
    UI.renderDex();
    const wildNames = [...document.querySelectorAll('#dexList .cname')].map((el) => el.textContent);
    const wildHasWolf = wildNames.some((s) => s.includes('Wolfling') || s.includes('Havikpup'));
    const wildHasCrypt = wildNames.some((s) => s.includes('Rammelbeen') || s.includes('Ghoulling'));
    UI.dexBiomeFilter = 'crypt';
    UI.renderDex();
    const cryptNames = [...document.querySelectorAll('#dexList .cname')].map((el) => el.textContent);
    const cryptHasBone = cryptNames.some((s) => s.includes('Rammelbeen') || s.includes('Ghoulling'));
    const cryptHasWolf = cryptNames.some((s) => s.includes('Wolfling'));
    UI.dexBiomeFilter = 'all';
    UI.renderDex();

    const achFarm = ACHIEVEMENTS.find((a) => a.id === 'dexFarm');
    const achZoo = ACHIEVEMENTS.find((a) => a.id === 'dexZoo');
    const achSea = ACHIEVEMENTS.find((a) => a.id === 'dexSea');
    const achFrost = ACHIEVEMENTS.find((a) => a.id === 'dexFrost');
    const w3ok = !!(SPECIES.havikpup && SPECIES.voidmanmoet && SPECIES.zeeegel && SPECIES.maanhavik);

    return {
      ok: missing.length === 0
        && n >= 700
        && slymo.includes('starter')
        && cowBlurb.length > 8
        && swimOk
        && farmN >= 1
        && seaN >= 1
        && allFarm
        && farmIds.length > 10
        && /Geheim/.test(satanHint)
        && hasBiomeBar
        && hasFrostChip
        && hasWildChip
        && hasBlurb
        && hubCountOk
        && (tot.wild || 0) >= 140
        && (tot.crypt || 0) >= 100
        && (tot.scrap || 0) >= 100
        && (tot.frost || 0) >= 32
        && wildHasWolf && !wildHasCrypt
        && cryptHasBone && !cryptHasWolf
        && w3ok
        && !!(achFarm && achZoo && achSea && achFrost),
      n,
      slymo,
      cowArt,
      cowBlurb,
      swimOk,
      farmN,
      seaN,
      farmIds: farmIds.length,
      satanHint,
      hasBiomeBar,
      hasFrostChip,
      hasBlurb,
      hubSub: hubDex ? hubDex.textContent : null,
      biomeTotals: tot,
      wildHasWolf,
      cryptHasBone,
      w3ok,
      missing,
    };
  });

  await browser.close();
  if (server) server.close();
  if (pageErrors.length) {
    result.pageErrors = pageErrors.slice(0, 5);
    result.ok = false;
  }
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('SMOKE_OK dex-book');
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
