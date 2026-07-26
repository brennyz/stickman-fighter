#!/usr/bin/env node
/**
 * Sample real pixels from cave photos into patch strings.
 * Usage:
 *   node scripts/sample-cave-floor.mjs [dir]
 * Looks for JPG/PNG in assets/cave/ (or given dir).
 * Prints CAVE_FLOOR_PATCH_STRS you can paste into src/render/cave-scenery.js.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.resolve(process.argv[2] || path.join(root, 'assets', 'cave'));

const PAL = [
  '#07090e', '#10141c', '#1a2028', '#2a323c', '#3a4450', '#4a3a2c',
  '#c48840', '#e8a858', '#8a5a28', '#a87848', '#c4a878', '#e8e0d0',
  '#f4f0e4', '#121828', '#0c1420', '#2a3850', '#a8c840', '#d0e868',
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
  console.log('Drop 1–4 JPG/PNG cave shots there, then re-run.');
  console.log('Game already ships hand-mapped patches from the four grotte refs.');
  process.exit(0);
}

const patches = [];
for (const f of files) {
  const abs = path.join(dir, f);
  const str = await trySharpSample(abs);
  if (!str) {
    console.log('Need sharp: npm i -D sharp');
    process.exit(1);
  }
  patches.push(str);
  console.log('//', f);
  console.log("'" + str.slice(0, 16) + "' +");
  for (let row = 1; row < 8; row++) {
    const line = str.slice(row * 16, row * 16 + 16);
    console.log("'" + line + "'" + (row === 7 ? ',' : " +"));
  }
}
console.log('patches:', patches.length);
