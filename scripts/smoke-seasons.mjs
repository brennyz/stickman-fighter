#!/usr/bin/env node
/**
 * Smoke: seasonal CSS overlay — slots, no tap-blocking, persist + i18n.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

const seasonsJs = fs.readFileSync(path.join(root, 'src/systems/seasons.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/seasons.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'src/core/storage.js'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
const audio = fs.readFileSync(path.join(root, 'src/systems/audio.js'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const loop = fs.readFileSync(path.join(root, 'src/boot/loop.js'), 'utf8');

must(/SEASON_IDS = \['classic', 'jungle', 'halloween', 'winter', 'summer'\]/.test(seasonsJs),
  'SEASON_IDS must list classic + jungle + halloween + winter/summer hooks');
must(/function calendarSeasonId/.test(seasonsJs), 'calendarSeasonId missing');
must(/function setSeasonPref/.test(seasonsJs), 'setSeasonPref missing');
must(/function currentSeasonId/.test(seasonsJs), 'currentSeasonId missing');
must(/sf-season-change/.test(seasonsJs), 'audio hook event missing');
must(/seasonPref/.test(storage) && /seasonPref: 'auto'/.test(storage),
  'save.seasonPref default auto missing');

must(/id="seasonOverlay"/.test(index), 'seasonOverlay missing in index.html');
must(/id="seasonSwitchBar"/.test(index), 'season settings bar missing');
must(/id="seasonMenuBlurb"/.test(index), 'menu flavor blurb missing');
must(/data-season-slot="vignette"/.test(index), 'vignette slot missing');
must(/data-season-slot="motif"/.test(index), 'motif slot missing');
must(/data-season-slot="corner-tl"/.test(index), 'corner-tl slot missing');
must(/data-season-slot="corner-tr"/.test(index), 'corner-tr slot missing');
must(/data-season-slot="corner-bl"/.test(index), 'corner-bl slot missing');
must(/data-season-slot="corner-br"/.test(index), 'corner-br slot missing');
must(/data-season-slot="banner"/.test(index), 'banner slot missing');
must(/styles\/seasons\.css/.test(index), 'seasons.css not linked');

const overlayAt = index.indexOf('id="seasonOverlay"');
const canvasAt = index.indexOf('<canvas id="game"');
must(overlayAt !== -1 && canvasAt !== -1, 'seasonOverlay / canvas missing');
must((index.match(/id="seasonOverlay"/g) || []).length === 1, 'exactly one #seasonOverlay');
must(!/class="screen/.test(index.slice(Math.min(overlayAt, canvasAt), Math.max(overlayAt, canvasAt) + 400)),
  'do not wrap season overlay in a .screen');

must(/pointer-events:\s*none\s*!important/.test(css),
  'overlay must use pointer-events:none !important');
must(/--season-safe-bottom/.test(css) && /--season-safe-right/.test(css),
  'safe-zone tokens missing');
must(/html\[data-season="jungle"\]/.test(css), 'jungle theme tokens missing');
must(/html\[data-season="halloween"\]/.test(css), 'halloween theme tokens missing');
must(/html\[data-season="winter"\]/.test(css), 'winter hook missing');
must(/html\[data-season="summer"\]/.test(css), 'summer hook missing');
must(/html\[data-season="classic"\] \.season-overlay/.test(css),
  'classic must hide overlay');
must(/--season-art-corner-tl/.test(css), 'art-slot CSS variables missing');
must(/z-index:\s*22/.test(css), 'overlay z-index should sit under toast/pause');

must(/season: \{/.test(i18n), 'i18n season block missing');
must(/blurb: \{/.test(i18n) && /jungle:/.test(i18n), 'season blurbs missing');
['nl', 'en', 'de', 'fr', 'es'].forEach((lang) => {
  const idx = i18n.indexOf(`  ${lang}: {`);
  must(idx !== -1, `lang ${lang} missing`);
  const slice = i18n.slice(idx, idx + 24000);
  must(/title: 'Seizoen'|title: 'Season'|title: 'Saison'|title: 'Temporada'/.test(slice),
    `season.title missing for ${lang}`);
});

must(/seasonId\(\)/.test(audio), 'AudioSys.seasonId hook missing');
must(/src\/systems\/seasons\.js/.test(manifest), 'manifest missing seasons.js');
must(/styles\/seasons\.css/.test(sw), 'sw.js must precache seasons.css');
must(/initSeasonTheme/.test(loop), 'boot must apply season theme');
must(!/versus/i.test(seasonsJs), 'season module must not revive Versus');

const docs = fs.readFileSync(path.join(root, 'SEASON-OVERLAY.md'), 'utf8');
must(/corner-tl\.png/.test(docs) && /pixel-art/.test(docs),
  'SEASON-OVERLAY.md must name art slots for the pixel-art agent');

console.log('SMOKE_OK seasons overlay');
