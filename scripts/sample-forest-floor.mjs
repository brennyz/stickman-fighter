#!/usr/bin/env node
/**
 * Sample real pixels from forest-floor photos into patch strings.
 * Usage:
 *   node scripts/sample-forest-floor.mjs [dir]
 * Looks for JPG/PNG in assets/forest-floor/ (or given dir).
 * Prints FOREST_FLOOR_PATCH_STRS you can paste into src/render/forest-floor.js.
 *
 * Requires: no native deps — uses pure decode via `sharp` if installed,
 * otherwise prints the current hand-sampled palette reminder.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.resolve(process.argv[2] || path.join(root, 'assets', 'forest-floor'));

const PAL = [
  '#2c2822', '#3a342c', '#4a4438', '#c4a46a', '#a88848', '#8a6438', '#d4b878',
  '#6a6458', '#8a8478', '#4a463c', '#3a3028', '#2e5a28', '#4a7a38', '#1e4020',
  '#6a8a30', '#8aaa40', '#8a8a84', '#a8a89e',
];

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const PAL_RGB = PAL.map(hexToRgb);

function nearestIdx(r, g, b) {
  let best = 0, bestD = 1e12;
  for (let i = 0; i < PAL_RGB.length; i++) {
    const [pr, pg, pb] = PAL_RGB[i];
    const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

function idxChar(i) {
  return i < 10 ? String(i) : String.fromCharCode(97 + (i - 10));
}

async function trySharpSample(file) {
  let sharp;
  try { sharp = (await import('sharp')).default; } catch {
    return null;
  }
  const { data, info } = await sharp(file)
    .resize(16, 8, { fit: 'cover' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let out = '';
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const o = (y * info.width + x) * info.channels;
      out += idxChar(nearestIdx(data[o], data[o + 1], data[o + 2]));
    }
  }
  return out;
}

const files = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).slice(0, 4)
  : [];

if (!files.length) {
  console.log('No photos in', dir);
  console.log('Drop 1–4 JPG/PNG forest-floor shots there, then re-run.');
  console.log('Game already ships hand-sampled patches from the three bosbodem photos.');
  process.exit(0);
}

const patches = [];
for (const f of files) {
  const abs = path.join(dir, f);
  const str = await trySharpSample(abs);
  if (!str) {
    console.error('Install sharp to sample:', 'npm i -D sharp');
    process.exit(1);
  }
  patches.push({ file: f, str });
  console.log('//', f);
  console.log("'" + str + "',");
}
console.log('\nPaste into FOREST_FLOOR_PATCH_STRS in src/render/forest-floor.js');
