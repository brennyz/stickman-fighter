#!/usr/bin/env node
/** Smoke: seasonal overlay slots aligned with #279 + jungle/halloween packs. */
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

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/season-overlays.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'src/ui/season-overlay.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8');

must(html.includes('id="seasonOverlay"'), 'missing #seasonOverlay host');
must(!/id="seasonOverlay"[^>]*class="[^"]*\bscreen\b/.test(html), '#seasonOverlay must not be a .screen');
must(html.includes('styles/season-overlays.css'), 'index.html must link season-overlays.css');
must(manifest.includes('src/ui/season-overlay.js'), 'manifest missing season-overlay.js');

const slots = [
  ['seasonSlotCornerTL', 'corner-tl'],
  ['seasonSlotCornerTR', 'corner-tr'],
  ['seasonSlotCornerBL', 'corner-bl'],
  ['seasonSlotCornerBR', 'corner-br'],
  ['seasonSlotBanner', 'banner'],
  ['seasonSlotGroundTrim', 'ground-trim'],
  ['seasonSlotMotif', 'motif'],
];
for (const [id, slot] of slots) {
  must(html.includes(`id="${id}"`), `missing #${id}`);
  must(html.includes(`data-season-slot="${slot}"`), `missing data-season-slot=${slot}`);
  must(css.includes(`--season-art-${slot}`), `css missing --season-art-${slot}`);
}
must(html.includes('data-season-slot="vignette"'), 'missing vignette slot');
must(css.includes('--season-art-vignette'), 'css missing vignette token');

const packs = ['jungle', 'halloween'];
const files = ['corner-tl', 'corner-tr', 'corner-bl', 'corner-br', 'banner', 'vignette', 'ground-trim', 'motif'];
for (const pack of packs) {
  for (const file of files) {
    const rel = `assets/seasons/${pack}/${file}.png`;
    const abs = path.join(root, rel);
    must(fs.existsSync(abs), `missing ${rel}`);
    must(fs.statSync(abs).size < 8000, `${rel} too large for overlay pack`);
    must(sw.includes(`./${rel}`), `sw.js precache missing ${rel}`);
    const svg = path.join(root, `assets/seasons/${pack}/${file}.svg`);
    must(fs.existsSync(svg), `missing SVG source for ${pack}/${file}`);
  }
}

must(/pointer-events:\s*none\s*!important/.test(css), 'overlay must be pointer-events:none');
must(/body\.is-playing #seasonOverlay/.test(css), 'must hide overlay during play');
must(/--season-safe-bottom/.test(css), 'must keep ground/corners above Android pads');
must(/image-rendering:\s*pixelated/.test(css), 'pixelated rendering for retina-safe scale');
must(js.includes('SEASON_ART_PRESENT') && js.includes('halloween') && js.includes('jungle'), 'JS must list both packs');
must(js.includes('__sfSeasonArtPresent'), 'JS must export present map for CSS pair');
must(js.includes("location.search") && js.includes('sfSeason'), 'JS must honor ?season= and localStorage');
must(!/startGame\(|versusRoster|btnVersus/.test(js), 'season overlay JS must not start Versus');

const canvasIdx = html.indexOf('<canvas id="game"');
const overlayIdx = html.indexOf('id="seasonOverlay"');
must(overlayIdx !== -1 && canvasIdx !== -1 && overlayIdx < canvasIdx, '#seasonOverlay must stay a closed body sibling before #game');

console.log('SMOKE_OK season overlays · 8 contract slots · jungle+halloween PNG · play-safe');
