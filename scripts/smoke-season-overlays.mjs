#!/usr/bin/env node
/** Smoke: seasonal overlay slots, packs, and combat-safe CSS. */
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
  ['seasonSlotRailL', 'rail-l'],
  ['seasonSlotRailR', 'rail-r'],
  ['seasonSlotCornerBL', 'corner-bl'],
  ['seasonSlotCornerBR', 'corner-br'],
  ['seasonSlotCrest', 'crest'],
];
for (const [id, slot] of slots) {
  must(html.includes(`id="${id}"`), `missing #${id}`);
  must(html.includes(`data-season-slot="${slot}"`), `missing data-season-slot=${slot}`);
  must(css.includes(`--season-art-${slot}`), `css missing --season-art-${slot}`);
}

const packs = ['jungle', 'halloween'];
const files = ['corner-tl', 'corner-tr', 'rail-l', 'rail-r', 'corner-bl', 'corner-br', 'crest'];
for (const pack of packs) {
  for (const file of files) {
    const rel = `assets/seasons/${pack}/${file}.svg`;
    const abs = path.join(root, rel);
    must(fs.existsSync(abs), `missing ${rel}`);
    const svg = fs.readFileSync(abs, 'utf8');
    must(svg.includes('shape-rendering="crispEdges"'), `${rel} must be crisp pixel SVG`);
    must(svg.includes('viewBox='), `${rel} missing viewBox`);
    must(fs.statSync(abs).size < 12000, `${rel} too large for overlay pack`);
    must(sw.includes(`./${rel}`), `sw.js precache missing ${rel}`);
  }
}

must(/pointer-events:\s*none\s*!important/.test(css), 'overlay must be pointer-events:none');
must(/body\.is-playing #seasonOverlay/.test(css), 'must hide overlay during play');
must(/max-width:\s*559px/.test(css), 'Android-first: hide rails on narrow viewports');
must(/image-rendering:\s*pixelated/.test(css), 'pixelated rendering for retina-safe scale');
must(js.includes("SEASON_PACKS") && js.includes('halloween') && js.includes('jungle'), 'JS must know both packs');
must(js.includes("location.search") && js.includes('sfSeason'), 'JS must honor ?season= and localStorage');
must(!/startGame\(|versusRoster|btnVersus/.test(js), 'season overlay JS must not touch Versus');

const canvasIdx = html.indexOf('<canvas id="game"');
const overlayIdx = html.indexOf('id="seasonOverlay"');
must(overlayIdx !== -1 && canvasIdx !== -1 && overlayIdx < canvasIdx, '#seasonOverlay must stay a closed body sibling before #game');

console.log('SMOKE_OK season overlays · 7 slots · jungle+halloween packs · play-safe');
