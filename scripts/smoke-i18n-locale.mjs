#!/usr/bin/env node
/**
 * Locale chrome: dock label is Tips (not raw menu.tips),
 * NL lose copy is VERLOREN, no leftover PICK AN ISLAND,
 * version banner is dismissible and hidden during play.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error('SMOKE_FAIL', msg);
  process.exit(1);
}

const catalog = fs.readFileSync(path.join(root, 'src/i18n/catalog.js'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
const loop = fs.readFileSync(path.join(root, 'src/boot/loop.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const game = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');

if (/I18N\.nl\.menu\.tips\s*=\s*\[/.test(catalog)) fail('NL menu.tips must stay the dock label, not a tip array');
if (!/I18N\.nl\.menu\.tipList\s*=\s*\[/.test(catalog)) fail('NL tip list must live on menu.tipList');
if (/menu: \{ tips: \[/.test(catalog)) fail('EN catalog still overwrites menu.tips with an array');
if (!/menu: \{ tipList: \[/.test(catalog)) fail('EN tip list must live on menu.tipList');
if (!/i18nList\('menu\.tipList'\)/.test(catalog)) fail('menuTipAt must read menu.tipList');
if (/i18nList\('menu\.tips'\)/.test(catalog)) fail('menuTipAt still reads menu.tips array key');

if (!/tips: 'Tips'/.test(i18n)) fail('menu.tips label string missing');
if (!/setTitle\('btnHelp', 'menu\.tips'\)/.test(i18n)) fail('help tooltip must use menu.tips label');

if (!/advLose: 'VERLOREN'/.test(catalog)) fail('NL result.advLose must be VERLOREN');
if (!/lost: 'VERLOREN'/.test(catalog)) fail('NL banner.lost must be VERLOREN');
if (!/titleKey: win \? 'result\.advWin' : 'result\.advLose'/.test(game)) fail('adventure result must pass titleKey');
if (!/tOr\(titleKey/.test(ui)) fail('showResult must re-translate title from titleKey (lang switch)');
if (!/result\.trainDetailWin/.test(game)) fail('training detail still hardcoded Dutch/EN mix');

if (/levelHead: 'Pick an island'/.test(catalog)) fail('PICK AN ISLAND leftover in catalog');
if (!/levelHead: 'Kies een eiland'/.test(catalog)) fail('NL island head missing');
if (!/levelHead: 'Choose an island'/.test(catalog)) fail('EN island head should be Choose an island');

if (!/id="netStatusDismiss"/.test(html)) fail('version banner missing dismiss control');
if (!/id="netStatusMsg"/.test(html)) fail('version banner missing msg span');
if (!/__sfNetQuietUpdate/.test(loop)) fail('dismiss must quiet the update banner for the session');
if (!/body\.is-playing #netStatus\.sw-update/.test(css)) fail('update banner must hide during play');
if (!/id="sfTitleStart"/.test(html) || /id="sfTitleName"/.test(html)) fail('name field must stay off the title gate');

const deChrome = fs.readFileSync(path.join(root, 'src/i18n/catalog-de.js'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8');
if (!manifest.includes('src/i18n/catalog-de.js')) fail('manifest must load catalog-de.js');
if (!/CATALOG_DE_CHROME/.test(catalog)) fail('mergeI18nCatalogs must merge CATALOG_DE_CHROME');
if (!/const CATALOG_DE_CHROME/.test(deChrome)) fail('CATALOG_DE_CHROME missing');
for (const ns of ['ui:', 'hud:', 'combat:', 'toast:', 'missionsUi:']) {
  if (!deChrome.includes(ns)) fail('DE chrome missing namespace ' + ns);
}
if (!/lang !== 'nl'/.test(i18n)) fail('t() must prefer EN over NL when locale is not Dutch');
if (!/summons: 'Summons'/.test(i18n) || !/summonsSub: 'Tägliche Kiste/.test(i18n)) {
  fail('DE menu.summons chrome missing');
}
if (!/setText\('summonScreenHead', 'ui\.summonHead'\)/.test(i18n)) fail('applyLang must set summon chrome');
if (!/renderSummon/.test(i18n) || !/renderUpgrades/.test(i18n)) {
  fail('applyLang must re-render summon and upgrades on locale switch');
}

if (/charBig5Hint: 'Eigen vechters/.test(catalog.split('const CATALOG_EN')[1] || '')) {
  fail('EN catalog still has Dutch charBig5Hint');
}
if (/spiral_orb: 'Spiraal Orb'/.test(catalog.split('const CATALOG_EN')[1] || '')) {
  fail('EN catalog still has Dutch Spiraal Orb skill name');
}
if (!/continueLastMode: 'Laatste modus'/.test(catalog)) fail('NL continueLastMode missing');
if (!/continueLastMode: 'Last mode'/.test(catalog)) fail('EN continueLastMode missing');
if (!/continueLastMode: 'Letzter Modus'/.test(deChrome)) fail('DE continueLastMode missing');

if (/muur \$\{save\.bestWall\}/.test(ui)) fail('HOME arcade tile still hardcodes muur');
if (/n\}× vandaag/.test(ui) || /Op · morgen weer/.test(ui)) fail('HOME summon tile still hardcodes Dutch');
if (/label: 'Avontuur'/.test(ui)) fail('help/tutorial chips still hardcode Avontuur');
if (!/t\('modes\.adventure'\)/.test(ui)) fail('help chips must use modes.adventure');
if (!/ui\.summonQuota/.test(ui)) fail('summon quota must use t()');
if (!/ui\.weaponSummary/.test(ui)) fail('weapon summary must use t()');
if (!/ui\.upgradeLevelsTotal/.test(ui)) fail('upgrade summary must use t()');
if (!/ui\.hubStatOutfits/.test(ui)) fail('collection hub outfits must use t()');
if (/Vandaag: \$\{left\}/.test(ui)) fail('summon quota still hardcoded Dutch');
if (/Verzameld <b>/.test(ui)) fail('collection summary still hardcoded Dutch Verzameld');
if (!/ui\.eggSummary/.test(ui)) fail('egg summary must use t()');
if (!/ui\.styleSummary/.test(ui)) fail('style summary must use t()');
if (/Dag-ei openen/.test(ui)) fail('egg crack button still hardcodes Dag-ei');
if (/Alle types/.test(ui) || /Alle biomen/.test(ui)) fail('dex filters still hardcode Dutch');
if (/Export bevat:/.test(ui)) fail('settings export hint still hardcodes Dutch');
if (/Laatst opgeslagen:/.test(ui)) fail('settings save stamp still hardcodes Dutch');
if (/Cosmetisch metgezel/.test(ui) || /Nog niet uitgekomen/.test(ui)) fail('egg pet chrome still hardcodes Dutch');
if (!/ui\.dexSummary/.test(ui) || !/ui\.dexAllTypes/.test(ui)) fail('dex chrome must use t()');
if (!/ui\.saveExportContains/.test(ui)) fail('settings export must use t()');
const missions = fs.readFileSync(path.join(root, 'src/systems/missions.js'), 'utf8');
if (/boek \$\{dexCountFromSave/.test(missions) || /\$\{[^}]+\} prestaties/.test(missions)) fail('save export summary still hardcodes Dutch');
if (/Volgende prestatie/.test(missions)) fail('dex next achievement still hardcodes Dutch');
if (!/pets\.crackEgg/.test(ui)) fail('egg crack must use pets.crackEgg');
if (!/egg\.dailyReady/.test(fs.readFileSync(path.join(root, 'src/data/egg-pets.js'), 'utf8'))) {
  fail('egg daily status must use egg.* keys');
}
if (/Gratis Pull/.test(i18n)) fail('DE pets.crackEggSub still has leftover Dutch Gratis');

console.log('SMOKE_OK i18n-locale: Tips, VERLOREN, EN/DE chrome catalogs, no leftover Dutch tiles');
