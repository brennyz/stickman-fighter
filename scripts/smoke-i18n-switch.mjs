#!/usr/bin/env node
/**
 * Locale switch: HOME tiles, dock Tips, weapons/settings heads
 * stay in EN / DE / NL with no leftover Dutch on EN/DE.
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.log('SMOKE_OK i18n-switch (static only, no chrome)'); process.exit(0); }

const outDir = '/tmp/sf-i18n-switch';
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
  const port = Number(process.env.SF_I18N_SWITCH_PORT || 8798);
  let server = null;
  try { server = await ensureSmokeServer(port); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  await page.goto(smokeBaseUrl(port) + '?nosplash=1', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 45000 });

  const result = await page.evaluate(() => {
    const DUTCH = /(Avontuur|Collectie|Instellingen|Wapens|Vandaag|Verzameld|Uitrusten|Dag-ei|muur |× vandaag|Alle types|Alle biomen|Export bevat|Laatst opgeslagen|Cosmetisch metgezel|Nog niet uitgekomen|Volgende prestatie|prestaties|soorten in monsterboek|Muziek|Effecten|Profiel en missies|Zet in app-lade|unlock Lv)/;
    function txt(id) { return (document.getElementById(id) || {}).textContent || ''; }
    function snap(lang) {
      if (typeof setLang === 'function') setLang(lang);
      else if (typeof save !== 'undefined') {
        save.lang = lang;
        if (typeof persist === 'function') persist();
        if (typeof applyLang === 'function') applyLang();
      }
      try { if (UI.renderDex) UI.renderDex(); } catch (_) {}
      try { if (UI.renderPets) UI.renderPets(); } catch (_) {}
      try { if (UI.renderSettings) UI.renderSettings(); } catch (_) {}
      const adv = (document.querySelector('.hub-tile-adventure .hub-tile-title') || {}).textContent || '';
      const collect = (document.querySelector('.hub-tile-collect .hub-tile-title') || {}).textContent || '';
      const help = (document.getElementById('btnHelp') || {}).title || (document.getElementById('btnHelp') || {}).textContent || '';
      const weapons = txt('weaponScreenHead');
      const settings = txt('settingsHead');
      const dexSum = txt('dexSummary');
      const dexTypes = txt('dexTypeFilterBar');
      const eggBtn = txt('eggCrackBtn');
      const exportHint = txt('saveExportHint');
      const tAdv = typeof t === 'function' ? t('menu.adventure') : '';
      const tHud = typeof t === 'function' ? t('hud.levelWave', { n: 1, wv: 1, total: 3 }) : '';
      const musicName = txt('setMusicVolName');
      const sfxName = txt('setSfxVolName');
      const profileAria = (document.getElementById('menuProfileBar') || {}).getAttribute('aria-label') || '';
      const summons = (document.querySelector('.hub-tile-summon .hub-tile-title') || {}).textContent || '';
      const buildings = (document.querySelector('#btnBuildings .hub-tile-title') || {}).textContent || '';
      const buildingsAria = (document.getElementById('btnBuildings') || {}).getAttribute('aria-label') || '';
      const backHome = Array.from(document.querySelectorAll('.sub-home-btn .sub-home-label'))
        .map((el) => (el.textContent || '').trim())
        .filter(Boolean);
      const leftover = [adv, collect, weapons, settings, dexSum, dexTypes, eggBtn, exportHint, musicName, sfxName, profileAria, buildings, buildingsAria].join(' ');
      return { lang, adv, collect, help, weapons, settings, dexSum, dexTypes, eggBtn, exportHint, musicName, sfxName, profileAria, summons, buildings, buildingsAria, backHome, tAdv, tHud, leftover };
    }
    const en = snap('en');
    const de = snap('de');
    const nl = snap('nl');
    const enOk = /Adventure/i.test(en.adv) && /Collection/i.test(en.collect)
      && /Weapons/i.test(en.weapons) && /Settings|Options/i.test(en.settings)
      && /Tips/i.test(en.help) && !DUTCH.test(en.leftover)
      && /Wave/.test(en.tHud) && !/Golf/.test(en.tHud)
      && /Book|All types|All biomes/i.test(en.dexSum + ' ' + en.dexTypes)
      && /Music/i.test(en.musicName) && /Effect/i.test(en.sfxName)
      && /Profile/i.test(en.profileAria)
      && /Factor/i.test(en.buildings) && /Factor/i.test(en.buildingsAria)
      && !/Fabriek/i.test(en.buildings + ' ' + en.buildingsAria)
      && en.backHome.length > 0 && en.backHome.every((s) => /Back to menu/i.test(s));
    const deOk = /Abenteuer/i.test(de.adv) && /Sammlung/i.test(de.collect)
      && /Waffen/i.test(de.weapons) && /Einstellungen/i.test(de.settings)
      && /Tipp/i.test(de.help) && !DUTCH.test(de.leftover)
      && /Welle/.test(de.tHud) && !/Golf/.test(de.tHud) && !/Vandaag/.test(de.tHud)
      && /Buch|Alle Typen|Alle Biome/i.test(de.dexSum + ' ' + de.dexTypes)
      && /Musik/i.test(de.musicName) && /Effekt/i.test(de.sfxName)
      && /Profil/i.test(de.profileAria)
      && /Beschwörung/i.test(de.summons);
    const nlOk = /Avontuur/.test(nl.adv) && /Collectie/.test(nl.collect)
      && /Wapens/.test(nl.weapons) && /Instellingen/.test(nl.settings)
      && /Tips/.test(nl.help) && /Boek|Alle types/.test(nl.dexSum + ' ' + nl.dexTypes)
      && /Oproepen/.test(nl.summons);
    return { ok: !!(enOk && deOk && nlOk), en, de, nl, enOk, deOk, nlOk };
  });

  await browser.close();
  if (server) server.close();
  if (!result.ok) {
    console.error('SMOKE_FAIL i18n-switch', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('SMOKE_OK i18n-switch', JSON.stringify({ en: result.en, de: result.de, nl: result.nl }));
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
