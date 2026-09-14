#!/usr/bin/env node
/**
 * All menu screens share HOME tile chrome (solid #162033 + muted ink).
 * Do not use nuclear display:none on every .screen.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error('SMOKE_FAIL', msg);
  process.exit(1);
}

const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

if (!/:root[\s\S]*--menu-tile-solid:\s*#162033/.test(css)) {
  fail('HOME --menu-tile-solid token must live on :root so every screen can use it');
}
if (!/\.b-adventure\s*\{[^}]*var\(--menu-tile-solid\)/.test(css)) {
  fail('mode-btn adventure must use HOME solid tile, not only the old green gradient');
}
if (!/\.island-tab,\s*\n\s*\.diff-tab\s*\{[\s\S]*?var\(--menu-tile-solid\)/.test(css)
    && !/\.island-tab[\s\S]{0,80}var\(--menu-tile-solid\)/.test(css)) {
  fail('Adventure island tabs must use HOME solid tiles');
}
if (!/\.settings-card[\s\S]{0,120}var\(--menu-tile-solid\)/.test(css)) {
  fail('Settings cards must use HOME solid tiles');
}
if (!/#pauseScreen \.mode-btn[\s\S]{0,80}var\(--menu-tile-solid\)/.test(css)
    && !/#pauseScreen \.mode-btn/.test(css)) {
  fail('Pause mode-btns must inherit HOME tile chrome');
}
if (!/#resultScreen \.mode-btn/.test(css)) {
  fail('Result mode-btns must inherit HOME tile chrome');
}
if (!/\.gear-hero[\s\S]{0,160}var\(--menu-tile-solid\)/.test(css)
    && !/\.gear-slot-card[\s\S]{0,160}var\(--menu-tile-solid\)/.test(css)) {
  fail('Gear screen cards must use HOME solid tiles');
}
if (/\.screen\s*\{\s*display:\s*none\s*!important/.test(css)
    || /display:\s*none\s*!important[\s\S]{0,40}all \.screen/.test(css)) {
  fail('nuclear display:none on .screen is forbidden');
}

['levelScreen', 'weaponScreen', 'settingsScreen', 'pauseScreen', 'resultScreen', 'gearScreen'].forEach((id) => {
  if (!new RegExp(`id="${id}"`).test(html)) fail(`missing #${id}`);
});
if (!/id="sfTitleStart"/.test(html) || /id="sfTitleName"/.test(html)) {
  fail('title gate must be SPELEN-first without a name field');
}
if (!/id="btnUpgradesHome"/.test(html)) fail('Upgrades must have a HOME tile on start');
if (!/id="settingsSaveAutoCard"/.test(html)) fail('settings auto-save primary missing');
if (!/id="settingsHelpFold"/.test(html)) fail('settings help fold missing');
const menuChunk = html.slice(html.indexOf('id="menuScreen"'), html.indexOf('id="modeHubScreen"'));
if (/id="btnInstallApp"/.test(menuChunk)) fail('install CTA must not sit on HOME');
if (/menu-lang-wrap/.test(menuChunk) && !/menu-sr-only[\s\S]*menuLangBar/.test(menuChunk)) {
  fail('5-lang switcher must leave visible HOME');
}
if (/id="btnVerseVersie"/.test(menuChunk) && menuChunk.indexOf('menu-sr-only') < 0) {
  fail('Fresh version must not be a visible HOME dock button');
}
if (!/id="togMusic"/.test(menuChunk) || !/id="btnMissions"/.test(menuChunk) || !/id="btnSettings"/.test(menuChunk) || !/id="btnHelp"/.test(menuChunk)) {
  fail('HOME drawer must keep Music, Missions, Settings, Tips');
}
if (!/id="btnUpgrades"/.test(html)) fail('Upgrades collect tile missing');
if (/\.card\s*\{[^}]*background:rgba\(255,255,255,\.06\)/.test(css)) {
  fail('weapon/collection cards still use low-contrast gray wash');
}
if (!/\.card\s*\{[\s\S]{0,220}var\(--menu-tile-solid\)/.test(css)) {
  fail('collection cards must use HOME solid tiles');
}
if (/\.mission-card \.claim-btn[\s\S]{0,160}linear-gradient\(180deg,#ffe259/.test(css)) {
  fail('mission claim leftover candy gold');
}

const start = fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8');
if (!/btnUpgradesHome/.test(start)) fail('start HOME upgrades tile must be bound');
if (!/function openUpgradesHub/.test(start)
    || !/bindPress\(document\.getElementById\('btnUpgradesHome'\),\s*openUpgradesHub\)/.test(start)) {
  fail('HOME Upgrades tile must open upgrades in one tap');
}

const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
if (!/options: 'Opties'/.test(i18n) || !/tips: 'Tips'/.test(i18n) || !/music: 'Muziek'/.test(i18n)) {
  fail('HOME drawer NL labels must stay short (Muziek / Opties / Tips)');
}
if (!(/fresh: 'Vers'/.test(i18n) || /fresh: 'Verse versie'/.test(i18n))
    || !(/install: 'App'/.test(i18n) || /install: 'Zet in app-lade'/.test(i18n))
    || !(/installSub: 'Lade'/.test(i18n) || /installSub: 'Één icoon/.test(i18n))) {
  fail('App/drawer leftover labels must stay short or keep locale-quality copy');
}

if (!/\.weapon-preview[\s\S]{0,220}var\(--menu-tile-solid\)/.test(css)) {
  fail('weapon preview must use HOME solid tiles, not gray-flat');
}
if (!/\.statbar[\s\S]{0,160}var\(--menu-tile-solid\)/.test(css)) {
  fail('statbars must use HOME solid tiles');
}
if (!/\.upgrade-polish-card[\s\S]{0,520}var\(--menu-tile-solid\)/.test(css)) {
  fail('upgrade cards must use HOME solid tiles');
}
if (!/\.sub-home-bar\s*\{[^}]*position:\s*relative/.test(css)) {
  fail('Terug naar menu must stay in-flow so it does not cover cards');
}

console.log('SMOKE_OK unify-ui: HOME tiles + upgrades entry + readable cards');
