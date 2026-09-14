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

const missions = fs.readFileSync(path.join(root, 'src/systems/missions.js'), 'utf8');
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
if (!/summonNoMore:/.test(catalog)) fail('summon empty copy must be i18n');
if (!/summonQuota:/.test(catalog)) fail('summon quota copy must be i18n');
if (!/tOr\('ui\.summonQuota'/.test(ui)) fail('renderSummon quota must use i18n');
if (!/tOr\('ui\.summonNoPulls'/.test(ui)) fail('summon log empty state must use i18n');

console.log('SMOKE_OK i18n-locale: Tips label, VERLOREN, hub welcome, technique banners, summon i18n');
