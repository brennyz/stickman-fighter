#!/usr/bin/env node
/**
 * Seasonal CSS overlay: tokens, pointer-events none, selectable seasons,
 * persist field, art-slot docs, no Versus wiring.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error('SMOKE_FAIL', msg);
  process.exit(1);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const css = read('styles/main.css');
const html = read('index.html');
const seasons = read('src/systems/seasons.js');
const storage = read('src/core/storage.js');
const manifest = read('src/manifest.json');
const i18n = read('src/i18n/i18n.js');
const ui = read('src/ui/ui.js');
const loop = read('src/boot/loop.js');
const audio = read('src/systems/audio.js');
const slots = read('docs/SEASON-ASSET-SLOTS.md');
const assetReadme = read('assets/seasons/README.md');

if (!manifest.includes('src/systems/seasons.js')) fail('manifest missing seasons.js');

for (const id of ['classic', 'jungle', 'halloween', 'winter', 'summer']) {
  if (!seasons.includes("'" + id + "'")) fail('SEASON_IDS missing ' + id);
  if (!css.includes('data-season="' + id + '"') && id !== 'classic') {
    if (!css.includes('[data-season="' + id + '"]')) fail('CSS missing [data-season=' + id + ']');
  }
}

if (!/\.season-overlay\s*,\s*\n\s*\.season-overlay \*/.test(css) && !/\.season-overlay \*/.test(css)) {
  fail('season overlay children must also be pointer-events none');
}
if (!/pointer-events:\s*none\s*!important/.test(css)) fail('season overlay must force pointer-events:none');
if (!/--season-accent/.test(css)) fail('missing --season-accent token');
if (!/--season-safe-bottom/.test(css)) fail('missing --season-safe-bottom combat safe zone');
if (!/#seasonOverlay/.test(css) && !/\.season-overlay/.test(css)) fail('missing .season-overlay rules');
if (!/z-index:\s*21/.test(css)) fail('season overlay z-index must sit below pause/toast (21)');
if (!/min-height:\s*var\(--touch-min\)/.test(css) || !/season-chip/.test(css)) {
  fail('season chips must honor --touch-min for Android');
}

if (!/id="seasonOverlay"/.test(html)) fail('index.html missing #seasonOverlay');
if (!/id="seasonSwitchBar"/.test(html)) fail('settings missing season picker');
if (!/data-season-flavor/.test(html)) fail('missing flavor line hook');
if (!/data-season-story/.test(html)) fail('missing story line hook');

const overlayIdx = html.indexOf('id="seasonOverlay"');
const canvasIdx = html.indexOf('<canvas id="game"');
const overlayBlock = html.slice(overlayIdx, html.indexOf('</div>', overlayIdx) + 6);
if (/class="screen/.test(overlayBlock)) fail('season overlay must not live inside a .screen');
if (overlayIdx < 0 || canvasIdx < 0) fail('overlay or canvas missing');

if (!/season:\s*'classic'/.test(storage)) fail('DEFAULT_SAVE.season missing');
if (!/normalizeSeasonId/.test(storage)) fail('sanitizeSave must normalize season');

if (!/function applySeasonTheme/.test(seasons)) fail('applySeasonTheme missing');
if (!/function setSeason/.test(seasons)) fail('setSeason missing');
if (!/function getSeasonId/.test(seasons)) fail('getSeasonId missing');
if (!/function hardenSeasonPointerEvents/.test(seasons)) fail('runtime pointer-events harden missing');
if (!/SEASON_ART_SLOTS/.test(seasons)) fail('SEASON_ART_SLOTS missing');
if (!/SEASON_ART_PRESENT/.test(seasons)) fail('must gate PNG urls so Android does not 404-prefetch');
if (!/persist\(\)/.test(seasons)) fail('setSeason must persist preference');
if (!/save\.season\s*=/.test(seasons)) fail('setSeason must write save.season');

if (!/settings\.season/.test(i18n)) fail('i18n settings.season missing');
if (!/season:\s*\{/.test(i18n)) fail('i18n season catalog missing');
if (!/jungle:/.test(i18n) || !/halloween:/.test(i18n)) fail('i18n missing jungle/halloween flavor');

if (!/renderSeasonSwitch/.test(ui)) fail('renderSettings must call renderSeasonSwitch');
if (!/applySeasonTheme/.test(loop)) fail('boot must apply season theme');
if (!/get season\(\)/.test(loop) && !/\.season/.test(loop)) fail('__sf.season hook missing');
if (!/seasonId:/.test(audio)) fail('AudioSys must expose seasonId');

for (const slot of ['corner-tl', 'corner-tr', 'corner-bl', 'corner-br', 'banner', 'vignette', 'ground-trim', 'motif']) {
  if (!slots.includes(slot + '.png')) fail('docs missing slot ' + slot);
  if (!assetReadme.includes(slot + '.png')) fail('assets/seasons README missing ' + slot);
}

if (/versus.*season|season.*versus/i.test(seasons)) fail('seasons.js must not wire Versus');

console.log('SMOKE_OK season-overlay: tokens, pointer-events, persist, art slots, no Versus');
