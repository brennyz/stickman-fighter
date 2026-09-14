#!/usr/bin/env node
/**
 * Smoke: jungle + halloween PNGs on #277 SEASON-OVERLAY slots.
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
const slots = ['vignette', 'motif', 'corner-tl', 'corner-tr', 'corner-bl', 'corner-br', 'banner'];
const packs = ['jungle', 'halloween'];

for (const pack of packs) {
  for (const slot of slots) {
    const rel = `assets/seasons/${pack}/${slot}.png`;
    const abs = path.join(root, rel);
    must(fs.existsSync(abs), `missing ${rel}`);
    const buf = fs.readFileSync(abs);
    must(buf.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      `${rel} is not a PNG`);
    must(sw.includes(`./${rel}`), `sw.js precache missing ${rel}`);
    const re = new RegExp(`--season-art-${slot}:\\s*url\\('\\.\\./${rel}'\\)`);
    must(re.test(css), `styles/seasons.css must uncomment --season-art-${slot} for ${pack}`);
    must(!new RegExp(`/\\*\\s*--season-art-${slot}:\\s*url\\('\\.\\./${rel}'\\)`).test(css),
      `${pack} --season-art-${slot} must not stay commented`);
  }
}

must(/\/\* --season-art-corner-tl: url\('\.\.\/assets\/seasons\/winter\//.test(css),
  'winter art tokens stay commented until art exists');
must(/\/\* --season-art-corner-tl: url\('\.\.\/assets\/seasons\/summer\//.test(css),
  'summer art tokens stay commented until art exists');

console.log('SMOKE_OK season-art: jungle+halloween PNGs wired to #277 slots');
