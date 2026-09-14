#!/usr/bin/env node
/**
 * Smoke: coordinator-named jungle + halloween PNGs wired to #277 --season-art-* hooks.
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
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

must(/id="seasonOverlay"/.test(index), 'must consume #277 #seasonOverlay (do not invent #sfSeasonOverlay)');
must(/data-season-slot="corner-tl"/.test(index), 'must consume #277 data-season-slot hooks');
must(/pointer-events:\s*none\s*!important/.test(css), 'overlay stays pointer-events:none');
must(!/#sfSeasonOverlay/.test(index) && !/\.sf-season-slot/.test(css),
  'do not invent #sfSeasonOverlay / .sf-season-slot — #277 uses #seasonOverlay');

const files = [
  ['jungle', 'corner-tl'],
  ['jungle', 'corner-tr'],
  ['jungle', 'corner-bl'],
  ['jungle', 'corner-br'],
  ['jungle', 'banner'],
  ['halloween', 'corner-tl'],
  ['halloween', 'corner-tr'],
  ['halloween', 'corner-bl'],
  ['halloween', 'corner-br'],
  ['halloween', 'banner'],
];

for (const [pack, slot] of files) {
  const name = `season-${pack}-${slot}.png`;
  const rel = `assets/seasons/${name}`;
  const abs = path.join(root, rel);
  must(fs.existsSync(abs), `missing ${rel}`);
  const buf = fs.readFileSync(abs);
  must(buf.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${rel} is not a PNG`);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  if (slot === 'banner') {
    must(w <= 320 && h <= 64, `${rel} banner must be ≤320×64 (got ${w}×${h})`);
  } else {
    must(w === 96 && h === 96, `${rel} corner must be 96×96 (got ${w}×${h})`);
  }
  must(sw.includes(`./${rel}`), `sw.js precache missing ${rel}`);
  const token = slot === 'banner' ? 'banner' : slot;
  const re = new RegExp(`--season-art-${token}:\\s*url\\('\\.\\./${rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\)`);
  must(re.test(css), `--season-art-${token} must point at ${rel}`);
}

must(!/versus/i.test(fs.readFileSync(path.join(root, 'src/systems/seasons.js'), 'utf8')),
  'season module must not revive Versus');

console.log('SMOKE_OK season-art: 10 coordinator PNGs wired to #277 --season-art-*');
