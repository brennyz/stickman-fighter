#!/usr/bin/env node
/**
 * P0–P3 UI/UX leftovers: HOME upgrades, online save primary,
 * Options strip, i18n wiring, 390px overflow, combat kb i18n.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error('SMOKE_FAIL', msg);
  process.exit(1);
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
const catalog = fs.readFileSync(path.join(root, 'src/i18n/catalog.js'), 'utf8');
const de = fs.readFileSync(path.join(root, 'src/i18n/catalog-de.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');
const game = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const start = fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8');
const missions = fs.readFileSync(path.join(root, 'src/systems/missions.js'), 'utf8');
const themes = fs.readFileSync(path.join(root, 'src/systems/audio-themes.js'), 'utf8');
const seasons = fs.readFileSync(path.join(root, 'src/systems/seasons.js'), 'utf8');

if (!/id="btnUpgradesHome"/.test(html)) fail('HOME Upgrades tile missing');
if (!/id="settingsSaveAutoCard"/.test(html)) fail('online save card missing');
if (!/id="settingsSaveSyncPill"/.test(html)) fail('online save pill missing');
if (!/id="setMusicVolName"/.test(html) || !/id="setSfxVolName"/.test(html)) {
  fail('Settings volume names must be spannable for i18n');
}
if (!/id="pauseMusicVolName"/.test(html) || !/id="pauseSfxVolName"/.test(html)) {
  fail('Pause volume names must be spannable for i18n');
}
if (!/id="settingsDiagBlock"/.test(html)) fail('Fresh version must live in hidden diagnostic block');
if (html.indexOf('id="settingsHelpFold"') > html.indexOf('id="btnForceFresh"')) {
  fail('Fresh version must stay inside Help fold');
}
if (html.indexOf('id="settingsDiagBlock"') > html.indexOf('id="btnForceFresh"')) {
  fail('btnForceFresh must sit inside settingsDiagBlock');
}
if (!/class="[^"]*menu-ver-line/.test(html)) fail('HOME version line must be player-hidden');

if (!/overflow-x:\s*hidden/.test(css)) fail('screens must clip horizontal overflow');
if (!/#settingsScreen\s*\{\s*overflow-x:\s*hidden/.test(css)) fail('#settingsScreen must clip x-overflow');
if (!/\.audio-theme-bar \.dex-filter-btn[^{]*\{[^}]*min-width:\s*0/.test(css)) {
  fail('audio theme chips must shrink at 390px');
}
if (!/\.card \.right\.picked/.test(css)) fail('weapon chosen state must not be color-only');
if (!/\.settings-home-tile/.test(css)) fail('online save must use HOME-tile settings card');
if (!/\.settings-tile-tog/.test(css)) fail('settings toggles must use HOME-tile rows');

if (!/profileAria: 'Profiel en missies'/.test(i18n)) fail('NL profile aria missing');
if (!/profileAria: 'Profile and missions'/.test(i18n)) fail('EN profile aria missing');
if (!/profileAria: 'Profil und Missionen'/.test(i18n)) fail('DE profile aria missing');
if (!/summons: 'Oproepen'/.test(i18n)) fail('NL HOME summons must be Oproepen');
if (!/summons: 'Beschwörungen'/.test(i18n)) fail('DE HOME summons must be Beschwörungen');
if (!/options: 'Settings'/.test(i18n)) fail('EN drawer must say Settings (one term)');
if (!/saveOnlineLine:/.test(i18n) || !/saveWhenJustNow:/.test(i18n)) fail('online save i18n keys missing');
if (!/setText\('setMusicVolName', 'settings\.music'\)/.test(i18n)) fail('applyLang must set Music label');
if (!/setText\('setSfxVolName', 'settings\.sfx'\)/.test(i18n)) fail('applyLang must set Effects label');
if (!/menu\.profileAria/.test(i18n)) fail('applyLang must set profile aria-label');
if (!/vrij Lv \{unlocked\}/.test(i18n)) fail('NL island progress still says unlock Lv');
if (/progress: 'Eiland[^\n]*unlock Lv/.test(i18n)) fail('NL island.progress still has English unlock');

if (!/kbPunch: 'stamp'/.test(catalog)) fail('NL combat kb punch must be Dutch');
if (!/kbPunch: 'punch'/.test(catalog)) fail('EN combat kb punch missing');
if (!/kbPunch: 'Schlag'/.test(de)) fail('DE combat kb punch missing');
if (/hintKb: 'A\/D lopen[^\n]*stomp/.test(catalog)) fail('NL hintKb still has English stomp');
if (/U technique/.test(catalog.split('const CATALOG_EN')[0])) fail('NL first-minute still says technique');

if (!/onlineSaveStatusLine/.test(missions) || !/onlineSaveStatusLine/.test(ui)) {
  fail('Settings must render online save status from stamp');
}
if (!/weaponSummonBadge/.test(ui) || !/weaponZoneDrop/.test(ui)) fail('weapons leftover EN strings');
if (!/className = 'right'/.test(ui) || !/' picked'/.test(ui)) fail('weapon chosen pill class missing');
if (!/tOr\('hud\.' \+ key/.test(game)) fail('keyboard legend must use hud.* i18n');
if (/lab: 'stomp'/.test(game) || /lab: 'technique'/.test(game)) fail('keyboard legend still hardcodes EN/NL mix');
if (!/function audioThemeLabel/.test(themes)) fail('audio theme labels must be i18n');
if (/UI\.toast\('Sfeer:/.test(themes)) fail('audio theme toast still hardcoded Dutch');
if (!/bindPlayerDiagUnlock/.test(start)) fail('Fresh version unlock gesture missing');
if (!/__sfSeason\.apply/.test(seasons)) fail('season pref must sync overlay apply()');
if (!/rarity\.' \+ rar/.test(ui)) fail('gear slot rarity must use i18n');

const menuChunk = html.slice(html.indexOf('id="menuScreen"'), html.indexOf('id="modeHubScreen"'));
if (/id="btnInstallApp"/.test(menuChunk)) fail('install CTA must not sit on HOME');
if (!/menu-sr-only[\s\S]*menuLangBar/.test(menuChunk)) fail('5-lang switcher must stay off visible HOME');

console.log('SMOKE_OK p0p3-uiux: HOME upgrades + online save + i18n leftovers + overflow');
