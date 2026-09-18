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
if (!/advLose: 'YOU LOSE'/.test(catalogEn)) fail('EN result.advLose must be YOU LOSE');
if (/advLose: 'VERLOREN'/.test((catalogEn.split('const CATALOG_DE')[0] || ''))) fail('EN result.advLose still Dutch VERLOREN');
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
if (!/Off-HOME: stay quiet/.test(loop) && !/el\.hidden = true;\s*showNetDismiss\(el, false\);/.test(loop)) {
  fail('update banner must stay hidden off HOME hub');
}
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
if (!/ui\.saveExportContains/.test(ui) && !/exportHint\.textContent = saveExportSummaryLine\(\)/.test(ui)) {
  fail('settings export must use t() or #269 summary line');
}
const missions = fs.readFileSync(path.join(root, 'src/systems/missions.js'), 'utf8');
if (/boek \$\{dexCountFromSave/.test(missions) || /\$\{[^}]+\} prestaties/.test(missions)) fail('save export summary still hardcodes Dutch');
if (/ · gear \$\{/.test(missions) || / · fabriek \+/.test(missions)) fail('save export still hardcodes gear/fabriek');
if (!/ui\.saveHealthGear/.test(missions) || !/ui\.saveHealthFactory/.test(missions)) fail('save export gear/factory must use t()');
if (/Volgende prestatie/.test(missions)) fail('dex next achievement still hardcodes Dutch');
if (!/pets\.crackEgg/.test(ui)) fail('egg crack must use pets.crackEgg');
if (!/egg\.dailyReady/.test(fs.readFileSync(path.join(root, 'src/data/egg-pets.js'), 'utf8'))) {
  fail('egg daily status must use egg.* keys');
}
if (/Gratis Pull/.test(i18n)) fail('DE pets.crackEggSub still has leftover Dutch Gratis');

if (!/updateReady: 'Nouvelle version prête/.test(i18n)) fail('FR net chrome missing');
if (!/updateReady: 'Nueva versión lista/.test(i18n)) fail('ES net chrome missing');
if (!/summons: 'Coffres', summonsSub: 'Coffre du jour/.test(i18n)) fail('FR summons chrome missing');
if (!/summons: 'Cofres', summonsSub: 'Cofre diario/.test(i18n)) fail('ES summons chrome missing');
if (/teens\+/.test(i18nEs)) fail('ES ageHint still has English teens+');
if (/Version fraîche/.test(i18n)) fail('FR still has calque Version fraîche');

if (!/ui\.dexAppear/.test(ui) && !/ui\.dexAppears/.test(ui)) fail('dex card still hardcodes appear line');
if (!/ui\.dexNotBeaten/.test(ui) && !/ui\.dexNotSeen/.test(ui)) fail('dex card still hardcodes Dutch not-seen');
if (!/ui\.dexPlayAdv/.test(ui)) fail('dex card still hardcodes Speel avontuur');
if (!/ui\.errLoadAdventure/.test(start)) fail('adventure load error still hardcoded Dutch');
if (!/ui\.errLoadHelp/.test(start)) fail('help load error still hardcoded Dutch');

if (!/function welcomeToastOnHub/.test(missions)) fail('welcome toast must gate on HOME hub');
if (!/screen\.active:not\(#menuScreen\)/.test(missions)) fail('welcome toast must skip other screens');
if (/userToast\(t\('toast\.welcome'\), 3800\)/.test(missions)) fail('welcome toast still uses 3800ms overlay');

if (/this\.banner\('TRIPLE SPIRAL ORB!'/.test(game)) fail('triple orb banner still hardcoded EN');
if (/this\.banner\('DUAL SPIRAL ORB!'/.test(game)) fail('dual orb banner still hardcoded EN');
if (/const lbl = j === 'lightning_pierce' \? 'LIGHTNING PIERCE!'/.test(game)) fail('enemy technique floater still hardcoded EN');
if (!/tOr\('technique\.' \+ j/.test(game)) fail('enemy technique floater must use technique.* i18n');
if (!/wave_cannon: 'WAVE CANNON!'/.test(catalog) && !/wave_cannon: 'GOLFKANON!'/.test(catalog)) {
  fail('technique.wave_cannon missing from catalog');
}
if (!/summonNoMore:/.test(catalog) && !/summonPullEmpty:/.test(catalog)) fail('summon empty copy must be i18n');
if (!/summonQuota:/.test(catalog)) fail('summon quota copy must be i18n');
if (!/ui\.summonQuota/.test(ui)) fail('renderSummon quota must use i18n');
if (!/ui\.summonLogEmpty/.test(ui) && !/ui\.summonNoPulls/.test(ui)) fail('summon log empty state must use i18n');

const speel = fs.readFileSync(path.join(root, 'speel.html'), 'utf8');
if (!/id="stepsIos"/.test(speel)) fail('speel.html must restore #stepsIos for iPhone/iPad');
if (/getElementById\('stepsIos'\)\.classList\.remove/.test(speel)) {
  fail('speel.html must not unhide iOS steps via literal getElementById(stepsIos)');
}
if (!/var stepEl = document\.getElementById\(stepId\)/.test(speel)) fail('speel.html must null-guard install step card');
if (!/var SPEEL_I18N = \{/.test(speel)) fail('speel.html must wire landing i18n');
for (const loc of ['nl:', 'en:', 'de:', 'fr:', 'es:']) {
  if (!speel.includes(loc)) fail('speel.html SPEEL_I18N missing ' + loc);
}
if (!/ritualTitle: 'Heute'/.test(i18n + locales + deChrome)) fail('DE fomo.ritualTitle still English Today');
if (!/ritualTitle: 'Aujourd/.test(i18n + locales)) fail('FR fomo.ritualTitle still English Today');
if (!/ritualTitle: 'Hoy'/.test(i18n + locales)) fail('ES fomo.ritualTitle still English Today');
if (/name: 'Fists'/.test(locales)) fail('FR/ES weapon overlay still has English Fists');
if (/name: 'Ninja sword'/.test(locales)) fail('FR/ES weapon overlay still has English Ninja sword');
if (/name: 'Energy blade'/.test(locales)) fail('FR/ES weapon overlay still has English Energy blade');
if (!/name: 'Poings'/.test(locales)) fail('FR weapon vuist should be Poings');
if (!/name: 'Puños'/.test(locales)) fail('ES weapon vuist should be Puños');
if (!/continueLastMode: 'Dernier mode'/.test(locales)) fail('FR ui.continueLastMode missing');
if (!/continueLastMode: 'Último modo'/.test(locales)) fail('ES ui.continueLastMode missing');
if (!/Usine Allume-Bâton/.test(i18n)) fail('FR factory names still leftover English');
if (!/Fábrica Palo-Mechero/.test(i18n)) fail('ES factory names still leftover English');
if (!/Stock-Anzünder-Fabrik/.test(i18n)) fail('DE factory names still leftover English');
if (/titleGreet: 'Hi, \{name\}'/.test((i18n.split(/\n\s+de:\s+\{/)[1] || '').split(/\n\s+fr:\s+\{/)[0] || '')) {
  fail('DE menu.titleGreet still English Hi');
}
if (!/titleGreet: 'Hallo, \{name\}'/.test(i18n)) fail('DE menu.titleGreet must be Hallo');
if (!/sfx: 'Ton'/.test(i18n)) fail('DE pause.sfx must be Ton not Sound');
if (!/pressStart: 'Münze einwerfen'/.test(i18n)) fail('DE pressStart still insert coin');
if (!/Energie-Spezials/.test(i18n)) fail('DE hub.skillsSub still English Energy specials');
if (/install: \{ title: 'App'/.test(i18n)) fail('FR/ES/DE install.title still short App');
if (!/Ajouter comme app/.test(i18n)) fail('FR install.title must be longer than App');
if (!/Añadir como app/.test(i18n)) fail('ES install.title must be longer than App');
if (/help: \{ title: 'Tips & controls' \}/.test(i18n.split(/\n\s+en:\s+\{/)[0])) fail('NL help.title still English Tips & controls');
if (/playLinkOk:/.test(i18n.split(/\n\s+fr:\s+\{/)[1] || '') === false) fail('FR settings.playLinkOk missing');
if (!/wild: 'Woods'/.test(catalog)) fail('EN dexBiome.wild must be Woods (no Dutch Woud leak)');
if (!/wild: 'Wald'/.test(deChrome + locales)) fail('DE dexBiome.wild must be Wald');
if (!/wild: 'Bois'/.test(locales)) fail('FR dexBiome.wild must be Bois');
if (!/wild: 'Bosque'/.test(locales)) fail('ES dexBiome.wild must be Bosque');
if (!/scrap: 'Scrap'/.test(catalog)) fail('EN dexBiome.scrap missing');
if (!/scrap: 'Schrott'/.test(deChrome + locales)) fail('DE dexBiome.scrap must not stay Dutch Schroot');

if (/Naar summons/.test(catalog + i18n)) fail('NL FOMO still says Naar summons');
if (/Zu Summons/.test(i18n + locales + deChrome)) fail('DE FOMO still says Zu Summons');
if (/A summons/.test(i18n + locales)) fail('ES FOMO still says A summons');
if (/Vers les summons/.test(i18n + locales)) fail('FR FOMO still says Vers les summons');
if (!/produceLocked:/.test(i18n)) fail('buildings.desc.produceLocked missing — Dutch fallback would leak');
if (!/nameShort: 'Aansteker'/.test(i18n)) fail('NL factory nameShort missing (Android card overflow)');
if (!/nameShort: 'Stock-Anzünder'/.test(i18n)) fail('DE factory nameShort missing');
if (!/nameShort: 'Allume-Bâton'/.test(i18n)) fail('FR factory nameShort missing');
if (!/nameShort: 'Palo-Mechero'/.test(i18n)) fail('ES factory nameShort missing');
if (!/nameShort: 'Stick-Lighter'/.test(i18n)) fail('EN factory nameShort missing');
if (/sfxOff: 'Sound aus'/.test(i18n)) fail('DE audio.sfxOff still English Sound');
if (/audioSfxOnly: 'Nur Sound'/.test(i18n)) fail('DE pause.audioSfxOnly still English Sound');
if (!/sfxOff: 'Ton aus'/.test(i18n)) fail('DE audio.sfxOff must be Ton aus');
if (/kickTele: 'KICK — spring/.test(locales)) fail('DE HUD kickTele overlay still English KICK');
if (/kickTele: 'KICK — saute/.test(locales)) fail('FR HUD kickTele overlay still English KICK');
if (/kickTele: 'KICK — ¡salta/.test(locales)) fail('ES HUD kickTele overlay still English KICK');
if (!/kickTele: 'TRITT — spring/.test(locales + deChrome)) fail('DE HUD kickTele must be TRITT');
if (!/kickTele: 'PIED — saute/.test(locales)) fail('FR HUD kickTele must be PIED');
if (!/kickTele: 'PATADA — ¡salta/.test(locales)) fail('ES HUD kickTele must be PATADA');
if (!/summonHead: 'Coffres'/.test(locales)) fail('FR ui.summonHead missing');
if (!/summonHead: 'Cofres'/.test(locales)) fail('ES ui.summonHead missing');
if (!/islandFallback: 'island \{n\}'/.test(i18n)) fail('EN buildings.islandFallback missing (Dutch eiland leak)');
if (!/islandFallback: 'Insel \{n\}'/.test(i18n)) fail('DE buildings.islandFallback missing');
if (/upgrade: 'Upgrade'/.test((i18n.split(/\n\s+de:\s+\{/)[1] || '').split(/\n\s+fr:\s+\{/)[0] || '')) {
  fail('DE buildings.upgrade still leftover English Upgrade');
}

if (!/petKillsLeft:/.test(catalog + locales + deChrome)) fail('ui.petKillsLeft missing — hardcoded kills leak');
if (!/function petPerkLabel/.test(fs.readFileSync(path.join(root, 'src/data/pets.js'), 'utf8'))) {
  fail('pet perks must go through petPerkLabel');
}
if (!/function eggPetName/.test(fs.readFileSync(path.join(root, 'src/data/egg-pets.js'), 'utf8'))) {
  fail('egg names must go through eggPetName');
}
if (/\`\$\{need - kills\} kills\`/.test(ui) || /\$\{need - kills\} kills/.test(ui)) {
  fail('pets sheet still hardcodes "kills" in the right column');
}
if (/Pet · \$\{need\} kills/.test(fs.readFileSync(path.join(root, 'src/data/pets.js'), 'utf8'))) {
  fail('petProgressLine still hardcodes Pet · N kills');
}
if (!/ui\.petKillsLeft/.test(ui)) fail('pets right column must use ui.petKillsLeft');
if (!/petPerkLabel\(def\)/.test(ui)) fail('pets sheet must use petPerkLabel');
if (!/eggPetName\(def\)/.test(ui) && !/eggPetName\(res\.def\)/.test(ui)) fail('egg sheet must use eggPetName');
if (!/eggPerkLabel\(def\)/.test(ui)) fail('egg sheet must use eggPerkLabel');
if (!/pet_slymo: 'Hop assist/.test(i18n)) fail('EN pets.perk.pet_slymo missing');
if (!/pet_slymo: 'Sprung-Assist/.test(i18n)) fail('DE pets.perk.pet_slymo missing');
if (!/pet_slymo: 'Aide saut/.test(i18n)) fail('FR pets.perk.pet_slymo missing');
if (!/pet_slymo: 'Ayuda salto/.test(i18n)) fail('ES pets.perk.pet_slymo missing');
if (!/egg_pebble: 'Pebble'/.test(catalog)) fail('EN egg.name.egg_pebble missing');
if (!/egg_pebble: 'Kiesel'/.test(locales + deChrome)) fail('DE egg.name.egg_pebble missing');
if (!/egg_pebble: 'Galet'/.test(locales)) fail('FR egg.name.egg_pebble missing');
if (!/egg_pebble: 'Guijarro'/.test(locales)) fail('ES egg.name.egg_pebble missing');
const catalogEnOnly = catalogEn.split('const CATALOG_DE')[0] || '';
if ((catalogEnOnly.match(/\bgear:\s*\{/g) || []).length > 1) fail('CATALOG_EN has two gear: blocks — the second wipes EN lock keys to NL');
if (!/lockOwned: 'Not found yet'/.test(catalogEnOnly)) fail('EN gear.lockOwned missing — Dutch fallback leak');
if (!/lockOwned: 'Pas encore trouvé'/.test(catalog)) fail('FR gear.lockOwned missing');
if (!/lockOwned: 'Aún no hallado'/.test(catalog)) fail('ES gear.lockOwned missing');
if (!/lockOwned: 'Noch nicht gefunden'/.test(deChrome)) fail('DE gear.lockOwned missing');
if (!/lockAdv: 'Aventure Nv/.test(catalog)) fail('FR gear.lockAdv missing');
if (!/lockAdv: 'Aventura Nv/.test(catalog)) fail('ES gear.lockAdv missing');
if (!/lockAdv: 'Abenteuer Lv/.test(deChrome)) fail('DE gear.lockAdv missing');
if (!/petSummaryTamed: 'Apprivoisés/.test(locales)) fail('FR ui.petSummaryTamed missing — EN leak');
if (!/petSummaryTamed: 'Domados/.test(locales)) fail('ES ui.petSummaryTamed missing — EN leak');
if (!/petSummaryTamed: 'Gezähmt/.test(locales + deChrome)) fail('DE ui.petSummaryTamed missing — EN leak');
if (/Bleibt in Sammlung → Waffen/.test(deChrome + locales)) fail('DE weaponAsideHint still overflows on 390px');
if (!/weaponAsideHint: 'Sammlung · kein 6. Slot'/.test(deChrome)) fail('DE weaponAsideHint must be short');
if (/killsNeed: 'Pet · \{need\} kills'/.test(locales)) fail('FR/ES pet.killsNeed still leftover English kills');
if (!/card-info/.test(css)) fail('card-info min-width missing (390px overlap)');
if (!/-webkit-line-clamp: 2/.test(css) || !/\.card \.cname/.test(css)) fail('card name clamp missing');
if (!/overflow-wrap:anywhere/.test(css.replace(/\s/g, '')) && !/overflow-wrap:\s*anywhere/.test(css)) {
  fail('toast/card overflow-wrap missing for 390px');
}
if (/persistOrToast\('stijl'\)/.test(ui)) fail('persistOrToast still interpolates Dutch stijl');
if (/persistOrToast\('wapen'\)/.test(ui + missions)) fail('persistOrToast still interpolates Dutch wapen');
if (/Preview: \$\{/.test(missions) || /Import 2× om te laden/.test(missions)) {
  fail('settings import preview still hardcodes EN Preview / NL Import 2×');
}
if (!/ui\.importPreview/.test(missions)) fail('settings import preview must use ui.importPreview');
if (!/style-card-tip/.test(css) || !/style-card-name/.test(css)) fail('style-card clamp classes missing');
if (!/#seasonHubBeat/.test(css) && !/#seasonBlurb/.test(css)) fail('season blurb clamp missing');
if (/Random-Summons/.test(deChrome + locales)) fail('DE summonQuota still says Random-Summons');
if (/Keine Summons mehr/.test(deChrome + locales)) fail('DE summonNoMore still says Summons');
if (!/summonQuota: 'Heute: \{left\}\/\{total\} Kisten'/.test(deChrome + locales)) fail('DE summonQuota must be Kisten');
if (!/summonQuota: 'Aujourd/.test(locales)) fail('FR ui.summonQuota missing — EN Today leak');
if (!/summonQuota: 'Hoy:/.test(locales)) fail('ES ui.summonQuota missing — EN Today leak');
if (!/saveHealthStats: 'Nv \{lvl\} · libre/.test(locales)) fail('FR/ES saveHealthStats missing');
if (/kickTele: 'TRITT — spring\/block!'/.test(deChrome)) fail('DE kickTele still English block');
if (!/kickTele: 'TRITT — spring\/blocken!'/.test(deChrome + locales)) fail('DE kickTele must say blocken');
if (/block: 'BLOCK!'/.test(locales.split('overlayI18nCatalog(CATALOG_DE')[1] || '')) {
  fail('DE fighter.block overlay still English BLOCK');
}
if (!/persistCtxWeapon:/.test(catalog + locales + deChrome)) fail('toast.persistCtxWeapon missing');
if (!/errSummonLoad:/.test(catalog + locales)) fail('ui.errSummonLoad missing');
if (!/function persistContextLabel/.test(fs.readFileSync(path.join(root, 'src/core/storage.js'), 'utf8'))) {
  fail('persistOrToast must localize context via persistContextLabel');
}
if (/syncFailed: 'Sync fallida/.test(locales)) fail('ES toast.syncFailed still English Sync');
if (/syncFailed: 'Sync fehlgeschlagen/.test(locales + deChrome)) fail('DE toast.syncFailed still English Sync');
if (/syncConfirm: 'Sync overschrijft/.test(catalog.split('const CATALOG_EN')[0] || '')) {
  fail('NL toast.syncConfirm still English Sync');
}

console.log('SMOKE_OK i18n-locale: Tips/VERLOREN + #273 coverage + #283 overlays + 2026-09-18 HUD/settings');
