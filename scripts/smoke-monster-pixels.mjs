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
  'wolf', 'owl', 'frog', 'snake', 'boar',
  'skeleton', 'mummy', 'beetle', 'wasp', 'spider',
  'drone', 'bot', 'scrapdog', 'penguin', 'yeti',
  'crab', 'turtle', 'squid',
  'raven', 'moose', 'beaver', 'badger', 'stag', 'lynx',
  'wisp', 'gargoyle', 'lich', 'cog', 'turret', 'rivet', 'piston',
  'walrus', 'ray', 'mole', 'junkbat', 'seal',
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
  fs.readFileSync(mapsPath, 'utf8') + '\n' + fs.readFileSync(paintPath, 'utf8') + '\nthis.MONSTER_PIXEL_ART=MONSTER_PIXEL_ART;this.MONSTER_PIXEL_SPECIES=MONSTER_PIXEL_SPECIES;this.drawMonsterPixelArt=drawMonsterPixelArt;this.monsterPixelMotion=monsterPixelMotion;this.monsterPixelFeel=monsterPixelFeel;\n',
  ctx,
  { filename: 'monster-pixels.js' }
);

const art = ctx.MONSTER_PIXEL_ART;
const species = ctx.MONSTER_PIXEL_SPECIES;
if (!art || !species) fail('maps missing');

for (const id of NEED_ART) {
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

const W2_P1_DEDICATED = [
  'wolf', 'owl', 'frog', 'snake', 'boar',
  'skeleton', 'mummy', 'beetle', 'wasp', 'spider',
  'drone', 'bot', 'scrapdog', 'penguin', 'yeti',
  'crab', 'turtle', 'squid',
];
for (const art of W2_P1_DEDICATED) {
  const paintedP1 = [];
  const p1Stub = {
    imageSmoothingEnabled: true,
    fillStyle: '',
    fillRect(x, y, w, h) { paintedP1.push([x, y, w, h, this.fillStyle]); },
  };
  const okP1 = ctx.drawMonsterPixelArt(p1Stub, { art, c1: '#c98850', c2: '#6b4a28' }, 20, 0, false, false);
  if (!okP1) fail('W2 P1 dedicated should paint without .pixel alias: ' + art);
  if (paintedP1.length < 6) fail('W2 P1 painted too few rects: ' + art + ' ' + paintedP1.length);
}

const W2_P2P3_DEDICATED = [
  'raven', 'moose', 'beaver', 'badger', 'stag', 'lynx',
  'wisp', 'gargoyle', 'lich', 'cog', 'turret', 'rivet', 'piston',
  'walrus', 'ray', 'mole', 'junkbat', 'seal',
];
for (const art of W2_P2P3_DEDICATED) {
  const paintedP2 = [];
  const p2Stub = {
    imageSmoothingEnabled: true,
    fillStyle: '',
    fillRect(x, y, w, h) { paintedP2.push([x, y, w, h, this.fillStyle]); },
  };
  const okP2 = ctx.drawMonsterPixelArt(p2Stub, { art, c1: '#c98850', c2: '#6b4a28' }, 20, 0, false, false);
  if (!okP2) fail('W2 P2/P3 dedicated should paint without .pixel alias: ' + art);
  if (paintedP2.length < 6) fail('W2 P2/P3 painted too few rects: ' + art + ' ' + paintedP2.length);
}

const W3_ALIAS_PAINT = {
  hawk: 'bat', ram: 'goat', cougar: 'tiger', weasel: 'fox', porcupine: 'hedgehog',
  toad: 'slime', ghoul: 'ghost', wraith: 'ghost', bonehound: 'fox', revenant: 'golem',
  shade: 'ghost', welder: 'can', sawbot: 'can', rustmite: 'hedgehog', furnace: 'golem',
  coil: 'can', mammoth: 'elephant', urchin: 'hedgehog',
};
for (const [w3, pixel] of Object.entries(W3_ALIAS_PAINT)) {
  const okAlias = ctx.drawMonsterPixelArt(stub, { art: w3, pixel, c1: '#c98850', c2: '#6b4a28' }, 20, 0, false, false);
  if (!okAlias) fail('catalog alias should paint ' + w3 + ' → ' + pixel);
}

const W2_OLD_ALIAS = {
  wolf: 'fox', owl: 'bat', frog: 'slime', snake: 'croc', boar: 'pig',
  skeleton: 'ghost', mummy: 'golem', beetle: 'hedgehog', wasp: 'bat', spider: 'octo',
  drone: 'can', bot: 'can', scrapdog: 'fox', penguin: 'duck', yeti: 'bear',
  crab: 'hedgehog', turtle: 'golem', squid: 'octo',
  raven: 'bat', moose: 'cow', beaver: 'pig', badger: 'hedgehog', stag: 'horse',
  lynx: 'tiger', mole: 'slime', wisp: 'ghost', gargoyle: 'dragon', lich: 'ghost',
  cog: 'can', turret: 'can', rivet: 'golem', junkbat: 'bat', piston: 'golem',
  walrus: 'hippo', seal: 'duck', ray: 'shark',
};
for (const [w2, old] of Object.entries(W2_OLD_ALIAS)) {
  if (!art[w2] || !art[old]) fail('uniqueness compare missing map ' + w2 + '/' + old);
  if (art[w2] === art[old]) fail('W2 map still equals old alias: ' + w2 + ' === ' + old);
}
const w2Ids = W2_P1_DEDICATED.concat(W2_P2P3_DEDICATED);
for (let i = 0; i < w2Ids.length; i++) {
  for (let j = i + 1; j < w2Ids.length; j++) {
    if (art[w2Ids[i]] === art[w2Ids[j]]) fail('W2 maps not unique: ' + w2Ids[i] + ' === ' + w2Ids[j]);
  }
}

function paintYs(sp, t, telegraph, motion) {
  const ys = [];
  const s = {
    imageSmoothingEnabled: true,
    fillStyle: '',
    fillRect(x, y) { ys.push(y); },
  };
  ctx.drawMonsterPixelArt(s, sp, 32, t, false, telegraph, motion);
  return ys;
}
const wolfSp = { id: 'wolfling', art: 'wolf', type: 'charge', shape: 'quad', c1: '#c98850', c2: '#6b4a28' };
const yIdle0 = paintYs(wolfSp, 0, false, { hopT: 0 });
const yIdle1 = paintYs(wolfSp, Math.PI / 9.6, false, { hopT: 0 });
if (!yIdle0.length || yIdle0[0] === yIdle1[0]) fail('idle bob should shift paint y');
const flyFeel = ctx.monsterPixelFeel({ art: 'owl', type: 'fly', shape: 'flyer' });
const tankFeel = ctx.monsterPixelFeel({ art: 'yeti', type: 'tank', shape: 'tank' });
if (!(flyFeel.amp > tankFeel.amp)) fail('flyer bob should exceed tank bob');
const idleM = ctx.monsterPixelMotion(wolfSp, 20, 0, false, { hopT: 0.1 });
const windM = ctx.monsterPixelMotion(wolfSp, 20, 0, true, { hopT: 0.1, telegraphT: 0.1, telegraphMax: 0.4 });
if (!(windM.sx > idleM.sx && windM.sy < idleM.sy && windM.ox < idleM.ox)) {
  fail('telegraph wind-up should squash and lean');
}
const preview = fs.readFileSync(path.join(dir, 'preview.html'), 'utf8');
if (!preview.includes('pixel-bob-md')) fail('preview missing idle-bob animation');
if (!preview.includes('scaleX(1.08)')) fail('preview missing telegraph hover');

if (!fs.existsSync(path.join(dir, 'preview.html'))) fail('preview.html missing');
if (!fs.existsSync(path.join(root, 'MONSTER-PIXEL-MAP.md'))) fail('MONSTER-PIXEL-MAP.md missing');

console.log('SMOKE_OK monster-pixels art=' + Object.keys(art).length + ' species=' + Object.keys(species).length + ' paint=' + painted.length);
