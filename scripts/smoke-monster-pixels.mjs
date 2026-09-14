#!/usr/bin/env node
/** Pixel roster: maps exist, charset valid, every farm/zoo art slot wired, paint stub. */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapsPath = path.join(root, 'src', 'data', 'monster-pixel-maps.js');
const paintPath = path.join(root, 'src', 'render', 'monster-pixel.js');
const monstersPath = path.join(root, 'src', 'data', 'monsters.js');
const dir = path.join(root, 'assets', 'monsters');

const NEED_ART = [
  'slime', 'bat', 'hedgehog', 'ghost', 'can', 'fox', 'golem', 'dragon', 'shark', 'octo',
  'cow', 'pig', 'chicken', 'sheep', 'horse', 'goat', 'duck', 'rooster', 'donkey', 'goose',
  'elephant', 'lion', 'tiger', 'giraffe', 'hippo', 'rhino', 'gorilla', 'zebra', 'bear', 'croc',
  'kangaroo', 'panda', 'flamingo', 'camel',
];
const NEED_P1 = [
  'wolf', 'owl', 'frog', 'snake', 'boar',
  'skeleton', 'mummy', 'beetle', 'wasp', 'spider',
  'drone', 'bot', 'scrapdog',
  'penguin', 'yeti',
  'crab', 'turtle', 'squid',
];
const NEED_SP = [
  'holkoe', 'razendzwijn', 'kipophol', 'razendeschaap', 'holpaard', 'kopstootgeit',
  'kwakophol', 'haanophol', 'koppigeezel', 'gansophol',
  'reuzenolifant', 'razendeleeuw', 'razendetijger', 'langegiraffe', 'razendnijlpaard',
  'razendeneushoorn', 'woestegorilla', 'razendezebra', 'razendebeer', 'razendekrokodil',
  'razendekangoeroe', 'woestepanda', 'razendeflamingo', 'razendekameel',
];
const CHARSET = new Set(['.', 'B', 'D', 'W', 'K', 'A', 'H', 'P', 'O', 'N']);

function fail(why) {
  console.error('SMOKE_FAIL monster-pixels: ' + why);
  process.exit(1);
}

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync(mapsPath, 'utf8') + '\n' + fs.readFileSync(paintPath, 'utf8') +
  '\nthis.MONSTER_ART_SLOTS={' + NEED_P1.map((id) => id + ':{pixelStatus:"pixel"}').join(',') + '};' +
  '\nthis.MONSTER_PIXEL_ART=MONSTER_PIXEL_ART;this.MONSTER_PIXEL_SPECIES=MONSTER_PIXEL_SPECIES;this.drawMonsterPixelArt=drawMonsterPixelArt;\n',
  ctx,
  { filename: 'monster-pixels.js' }
);

const art = ctx.MONSTER_PIXEL_ART;
const species = ctx.MONSTER_PIXEL_SPECIES;
if (!art || !species) fail('maps missing');

for (const id of NEED_ART.concat(NEED_P1)) {
  if (typeof art[id] !== 'string') fail('missing art map ' + id);
  if (art[id].length !== 32 * 32) fail('art size ' + id + ' ' + art[id].length);
  for (const ch of art[id]) if (!CHARSET.has(ch)) fail('bad char ' + ch + ' in art ' + id);
  const svg = path.join(dir, 'art-' + id + '.svg');
  if (!fs.existsSync(svg)) fail('missing ' + svg);
  if (fs.statSync(svg).size > 14000) fail('svg too large ' + id + ' ' + fs.statSync(svg).size);
}
for (const id of NEED_SP) {
  if (typeof species[id] !== 'string') fail('missing species map ' + id);
  if (species[id].length !== 32 * 32) fail('species size ' + id);
  const svg = path.join(dir, 'sp-' + id + '.svg');
  if (!fs.existsSync(svg)) fail('missing ' + svg);
}

const src = fs.readFileSync(monstersPath, 'utf8');
const farm = ['cow', 'pig', 'chicken', 'sheep', 'horse', 'goat', 'duck', 'rooster', 'donkey', 'goose'];
const zoo = ['elephant', 'lion', 'tiger', 'giraffe', 'hippo', 'rhino', 'gorilla', 'zebra', 'bear', 'croc', 'kangaroo', 'panda', 'flamingo', 'camel'];
for (const a of farm.concat(zoo)) {
  if (!src.includes("art: '" + a + "'") && !src.includes('art: "' + a + '"')) fail('monsters.js lost art ' + a);
  if (!art[a]) fail('no pixel for farm/zoo art ' + a);
}

const painted = [];
const stub = {
  imageSmoothingEnabled: true,
  fillStyle: '',
  fillRect(x, y, w, h) {
    painted.push([x, y, w, h, this.fillStyle]);
  },
};
const ok = ctx.drawMonsterPixelArt(stub, { id: 'holkoe', art: 'cow', c1: '#c98850', c2: '#6b4a28' }, 34, 1.2, false, false);
if (!ok) fail('draw holkoe returned false');
if (painted.length < 8) fail('draw painted too few rects: ' + painted.length);

const artOnly = ctx.drawMonsterPixelArt(stub, { art: 'elephant', c1: '#43b25b', c2: '#1e4a28' }, 43, 0.4, false, false);
if (!artOnly) fail('draw elephant art fallback false');

const miss = ctx.drawMonsterPixelArt(stub, { art: 'nope-pixel' }, 20, 0, false, false);
if (miss) fail('unknown art should fallback');

const wolfPaint = ctx.drawMonsterPixelArt(stub, { art: 'wolf', pixel: 'fox', c1: '#8a8478', c2: '#3a3830' }, 22, 0.2, false, false);
if (!wolfPaint) fail('draw wolf art returned false');

if (!fs.existsSync(path.join(dir, 'preview.html'))) fail('preview.html missing');
if (!fs.existsSync(path.join(root, 'MONSTER-PIXEL-MAP.md'))) fail('MONSTER-PIXEL-MAP.md missing');

console.log('SMOKE_OK monster-pixels art=' + Object.keys(art).length + ' species=' + Object.keys(species).length + ' paint=' + painted.length);
