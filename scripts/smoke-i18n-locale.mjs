#!/usr/bin/env node
/**
 * Locale chrome: dock label is Tips (not raw menu.tips),
 * NL lose copy is VERLOREN, no leftover PICK AN ISLAND,
 * version banner is dismissible and hidden during play.
 * Coverage (#273) + Z→A polish overlays (#283).
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
const locales = fs.readFileSync(path.join(root, 'src/i18n/catalog-locales.js'), 'utf8');
const start = fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8');
const deChrome = fs.readFileSync(path.join(root, 'src/i18n/catalog-de.js'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8');
const catalogEn = catalog.split('const CATALOG_EN')[1] || '';
const i18nEs = (i18n.split(/\n\s+es:\s+\{/)[1] || '').split(/\n\s+zh:\s+\{/)[0];

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

if (!manifest.includes('src/i18n/catalog-de.js')) fail('manifest must load catalog-de.js');
if (!manifest.includes('src/i18n/catalog-locales.js')) fail('manifest must load catalog-locales.js');
if (!/CATALOG_DE_CHROME/.test(catalog)) fail('mergeI18nCatalogs must merge CATALOG_DE_CHROME');
if (!/applyLocaleOverlays/.test(catalog)) fail('mergeI18nCatalogs must re-apply locale overlays after chrome');
if (!/function applyLocaleOverlays/.test(locales)) fail('applyLocaleOverlays missing in catalog-locales.js');
if (!/const CATALOG_DE_CHROME/.test(deChrome)) fail('CATALOG_DE_CHROME missing');
for (const ns of ['ui:', 'hud:', 'combat:', 'toast:', 'missionsUi:']) {
  if (!deChrome.includes(ns)) fail('DE chrome missing namespace ' + ns);
}
if (!/lang !== 'en'/.test(i18n) || !/lang !== 'nl'/.test(i18n)) fail('t() must prefer EN over NL when locale is not Dutch');
if (!/Non-NL missing keys fall back to EN first/.test(i18n)) fail('t() must fall back to EN before NL for non-NL');
if (!/order = lang === 'nl' \? \['nl', 'en'\] : \[lang, 'en', 'nl'\]/.test(catalog)) fail('i18nList must prefer EN over NL for non-NL');
if (!/summons: 'Summons'/.test(i18n) || !/summonsSub: 'Tägliche Kiste/.test(i18n)) {
  fail('DE menu.summons chrome missing');
}
if (!/setText\('summonScreenHead', 'ui\.summonHead'\)/.test(i18n)) fail('applyLang must set summon chrome');
if (!/renderSummon/.test(i18n) || !/renderUpgrades/.test(i18n)) {
  fail('applyLang must re-render summon and upgrades on locale switch');
}

if (!/overlayI18nCatalog\(CATALOG_FR/.test(locales)) fail('FR overlay missing');
if (!/overlayI18nCatalog\(CATALOG_ES/.test(locales)) fail('ES overlay missing');
if (!/overlayI18nCatalog\(CATALOG_DE/.test(locales)) fail('DE overlay missing');

for (const loc of ['FR', 'ES', 'DE']) {
  if (!new RegExp(`overlayI18nCatalog\\(CATALOG_${loc}[\\s\\S]*toast:\\s*\\{`).test(locales)) fail(loc + ' toast overlay missing');
  if (!new RegExp(`overlayI18nCatalog\\(CATALOG_${loc}[\\s\\S]*combat:\\s*\\{`).test(locales)) fail(loc + ' combat overlay missing');
  if (!new RegExp(`overlayI18nCatalog\\(CATALOG_${loc}[\\s\\S]*hud:\\s*\\{`).test(locales)) fail(loc + ' hud overlay missing');
}

if (/Lande 3 finishers/.test(catalog + locales)) fail('FR still has machine-Dutch Lande 3 finishers');
if (/Aterriza 3 finishers/.test(catalog + locales)) fail('ES still has machine-English Aterriza 3 finishers');
if (/Schlacker/.test(catalog + locales)) fail('DE wall100 still has garbled Schlacker');
if (/DANNeben/.test(locales)) fail('DE miss typo DANNeben');
if (!/Place 3 finishers/.test(locales)) fail('FR finisher3 not polished');
if (!/Asesta 3 finishers/.test(locales)) fail('ES finisher3 not polished');
if (!/Abrissprofi/.test(locales)) fail('DE wall100 not polished to Abrissprofi');

if (/charBig5Hint: 'Eigen vechters/.test(catalogEn)) fail('EN catalog still has Dutch charBig5Hint');
if (/spiral_orb: 'Spiraal Orb'/.test(catalogEn)) fail('EN catalog still has Dutch Spiraal Orb skill name');
if (/charBig5Hint: 'Own fighters/.test(catalogEn)) fail('EN charBig5Hint should be Your fighters (polish)');
if (!/charBig5Hint: 'Your fighters · quick pick'/.test(catalogEn)) fail('EN charBig5Hint polish missing');
if (!/charLocked: 'Vergrendeld'/.test(catalog)) fail('NL charLocked must be Vergrendeld');
if (!/charHead: 'KIES VECHTER'/.test(catalog)) fail('NL charHead must be KIES VECHTER');
if (/satanAfterClear: 'Adventure gehaald/.test(catalog)) fail('NL satanAfterClear still has English Adventure');

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

if (!/updateReady: 'Nouvelle version prête/.test(i18n)) fail('FR net chrome missing');
if (!/updateReady: 'Nueva versión lista/.test(i18n)) fail('ES net chrome missing');
if (!/summons: 'Summons', summonsSub: 'Coffre du jour/.test(i18n)) fail('FR summons chrome missing');
if (!/summons: 'Summons', summonsSub: 'Cofre diario/.test(i18n)) fail('ES summons chrome missing');
if (/teens\+/.test(i18nEs)) fail('ES ageHint still has English teens+');
if (/Version fraîche/.test(i18n)) fail('FR still has calque Version fraîche');

if (!/ui\.dexAppear/.test(ui) && !/ui\.dexAppears/.test(ui)) fail('dex card still hardcodes appear line');
if (!/ui\.dexNotBeaten/.test(ui) && !/ui\.dexNotSeen/.test(ui)) fail('dex card still hardcodes Dutch not-seen');
if (!/ui\.dexPlayAdv/.test(ui)) fail('dex card still hardcodes Speel avontuur');
if (!/ui\.errLoadAdventure/.test(start)) fail('adventure load error still hardcoded Dutch');
if (!/ui\.errLoadHelp/.test(start)) fail('help load error still hardcoded Dutch');

console.log('SMOKE_OK i18n-locale: Tips/VERLOREN + #273 coverage + #283 overlays (EN-first, no Dutch leak stubs)');
