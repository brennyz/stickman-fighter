#!/usr/bin/env node
/**
 * Smoke: nested season PNGs wired to --season-art-* (canon: assets/seasons/<id>/).
 * Flat season-*-corner-*.png paths are deprecated.
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

const css = fs.readFileSync(path.join(root, 'styles/seasons.css'), 'utf8');
const overlays = fs.readFileSync(path.join(root, 'styles/season-overlays.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

must(/id="seasonOverlay"/.test(index), 'must consume #277 #seasonOverlay (do not invent #sfSeasonOverlay)');
must(/data-season-slot="corner-tl"/.test(index), 'must consume #277 data-season-slot hooks');
must(/pointer-events:\s*none\s*!important/.test(css), 'overlay stays pointer-events:none');
must(!/#sfSeasonOverlay/.test(index) && !/\.sf-season-slot/.test(css),
  'do not invent #sfSeasonOverlay / .sf-season-slot — #277 uses #seasonOverlay');
must(!/season-jungle-corner|season-halloween-corner|season-jungle-banner|season-halloween-banner/.test(css),
  'flat coordinator PNG urls are deprecated — use assets/seasons/<id>/');
must(!/season-jungle-corner|season-halloween-corner/.test(overlays),
  'season-overlays.css must not revive flat coordinator PNG urls');

const files = [
  ['jungle', 'corner-tl'],
  ['jungle', 'corner-tr'],
  ['jungle', 'corner-bl'],
  ['jungle', 'corner-br'],
  ['jungle', 'banner'],
  ['jungle', 'vignette'],
  ['jungle', 'motif'],
  ['jungle', 'ground-trim'],
  ['halloween', 'corner-tl'],
  ['halloween', 'corner-tr'],
  ['halloween', 'corner-bl'],
  ['halloween', 'corner-br'],
  ['halloween', 'banner'],
  ['halloween', 'vignette'],
  ['halloween', 'motif'],
  ['halloween', 'ground-trim'],
];

for (const [pack, slot] of files) {
  const rel = `assets/seasons/${pack}/${slot}.png`;
  const abs = path.join(root, rel);
  must(fs.existsSync(abs), `missing ${rel}`);
  const buf = fs.readFileSync(abs);
  must(buf.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${rel} is not a PNG`);
  must(sw.includes(`./${rel}`), `sw.js precache missing ${rel}`);
  const token = slot === 'ground-trim' ? 'ground-trim' : slot;
  must(css.includes(`--season-art-${token}: url('../${rel}')`),
    `--season-art-${token} must point at ${rel}`);
}

must(!/versus/i.test(fs.readFileSync(path.join(root, 'src/systems/seasons.js'), 'utf8')),
  'season module must not revive Versus');

console.log('SMOKE_OK season-art: nested jungle+halloween PNGs wired in seasons.css');
