#!/usr/bin/env node
/**
 * Monster catalog W2+W3: 54 art slots, 432 expanded species, unlocks, spawn wiring.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const catalog = fs.readFileSync(path.join(root, 'src/data/monster-catalog.js'), 'utf8');
const slotsDoc = fs.readFileSync(path.join(root, 'docs/MONSTER-ART-SLOTS.md'), 'utf8');
const maps = fs.readFileSync(path.join(root, 'src/data/monster-pixel-maps.js'), 'utf8');

const P1 = [
  'wolf', 'owl', 'frog', 'snake', 'boar',
  'skeleton', 'mummy', 'beetle', 'wasp', 'spider',
  'drone', 'bot', 'scrapdog', 'penguin', 'yeti',
  'crab', 'turtle', 'squid',
];
const P2P3 = [
  'raven', 'moose', 'beaver', 'badger', 'stag', 'lynx',
  'wisp', 'gargoyle', 'lich', 'cog', 'turret', 'rivet', 'piston',
  'walrus', 'ray', 'mole', 'junkbat', 'seal',
];

function fail(why) {
  console.error('SMOKE_FAIL monster-catalog:', why);
  process.exit(1);
}

if (!game.includes('MONSTER_ART_SLOTS')) fail('game.js missing MONSTER_ART_SLOTS');
if (!game.includes('drawCatalogStubArt')) fail('game.js missing drawCatalogStubArt');
if (!game.includes('woodsWave')) fail('game.js missing woodsWave banner');
if (!game.includes('frostWave')) fail('game.js missing frostWave banner');
if (!game.includes('reefWave')) fail('game.js missing reefWave banner');
if (!game.includes("meta.trait = 'woods'")) fail('buildLevel missing woods trait');
if (!game.includes("meta.trait = 'crypt'")) fail('buildLevel missing crypt trait');
if (!game.includes("meta.trait = 'scrap'")) fail('buildLevel missing scrap trait');
if (!game.includes("meta.trait = 'frost'")) fail('buildLevel missing frost trait');
if (!game.includes("meta.trait = 'reef'")) fail('buildLevel missing reef trait');
if (!game.includes('voidyeti')) fail('BOSS_AT missing catalog boss voidyeti');
if (!game.includes('voidhavik')) fail('BOSS_AT missing W3 boss voidhavik');
if (!game.includes('voidmanmoet')) fail('BOSS_AT missing W3 boss voidmanmoet');
if (!slotsDoc.includes('wolf') || !slotsDoc.includes('pixelStatus')) fail('art-slots doc incomplete');
if (!slotsDoc.includes('hawk') || !slotsDoc.includes('mammoth')) fail('art-slots doc missing W3');

const monstersSrc = fs.readFileSync(path.join(root, 'src/data/monsters.js'), 'utf8');
const existing = new Set();
const body = monstersSrc.slice(monstersSrc.indexOf('const SPECIES = {'), monstersSrc.indexOf('const MONSTER_CATALOG_W2_EXPANDED'));
for (const m of body.matchAll(/^\s+([A-Za-z][A-Za-z0-9_]*):\s*\{/gm)) existing.add(m[1]);

const rarityMap = {
  common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythic: 5, nightmare: 6, hell: 7,
};
const ctx = {
  SPECIES: {},
  rarityOf: (id) => ({ order: rarityMap[id] != null ? rarityMap[id] : 0 }),
  console,
};
vm.createContext(ctx);
vm.runInContext(
  catalog +
  '\nthis.__out = expandMonsterCatalog(allMonsterCatalogFamilies());' +
  '\nthis.__slots = MONSTER_ART_SLOTS;' +
  '\nthis.__arts = Object.keys(MONSTER_ART_SLOTS);' +
  '\nthis.__alias = MONSTER_PIXEL_ALIAS;' +
  '\nthis.__prov = MONSTER_PIXEL_PROVISIONAL_SET;' +
  '\nthis.__w2 = MONSTER_FAMILIES_W2.length;' +
  '\nthis.__w3 = MONSTER_FAMILIES_W3.length;',
  ctx
);

const out = ctx.__out;
const arts = ctx.__arts;
if (!out || out.speciesCount !== 432) fail('expected 432 expanded species, got ' + (out && out.speciesCount));
if (!arts || arts.length !== 54) fail('expected 54 art slots, got ' + (arts && arts.length));
if (out.familyCount !== 54) fail('expected 54 families, got ' + out.familyCount);
if (ctx.__w2 !== 36) fail('expected 36 W2 families, got ' + ctx.__w2);
if (ctx.__w3 !== 18) fail('expected 18 W3 families, got ' + ctx.__w3);

const ids = Object.keys(out.species);
const uniq = new Set(ids);
if (uniq.size !== ids.length) fail('duplicate expanded ids');
const clash = ids.filter((id) => existing.has(id));
if (clash.length) fail('id collision with live SPECIES: ' + clash.join(','));
if (existing.size < 200) fail('failed to parse existing SPECIES: ' + existing.size);

let stub = 0;
let pixel = 0;
for (const art of arts) {
  if (!slotsDoc.includes('`' + art + '`') && !slotsDoc.includes('| `' + art + '`')) {
    fail('art slot not documented: ' + art);
  }
  if (ctx.__slots[art].pixelStatus === 'stub') stub++;
  if (ctx.__slots[art].pixelStatus === 'pixel') pixel++;
}
if (pixel !== 36) fail('expected 36 dedicated W2 pixel slots, got ' + pixel);
if (stub !== 18) fail('expected 18 leftover W3 stubs, got ' + stub);

const prov = ctx.__prov;
const alias = ctx.__alias;
if (!prov || prov.size < 60) fail('provisional pixel set missing');
for (const art of P1.concat(P2P3)) {
  if (ctx.__slots[art].pixelStatus !== 'pixel') fail('W2 art not pixel: ' + art);
  if (!maps.includes(art + ':')) fail('W2 map missing in monster-pixel-maps.js: ' + art);
}
for (const art of arts) {
  if (ctx.__slots[art].pixelStatus === 'pixel') continue;
  const a = alias[art];
  if (!a || !a.pixel) fail('stub art missing pixel alias: ' + art);
  if (!prov.has(a.pixel)) fail('alias not in #282 map: ' + art + ' → ' + a.pixel);
  if (a.high && !prov.has(a.high)) fail('high alias not in #282 map: ' + art + ' → ' + a.high);
}
let strayAlias = 0;
let missingPixel = 0;
for (const id of ids) {
  const sp = out.species[id];
  if (sp.pixelStatus === 'pixel') {
    if (sp.pixel) strayAlias++;
  } else if (!sp.pixel || !prov.has(sp.pixel)) {
    missingPixel++;
  }
}
if (strayAlias) fail('dedicated W2 species still carry .pixel alias: ' + strayAlias);
if (missingPixel) fail('stub species missing #282 pixel alias: ' + missingPixel);

if (!game.includes('drawMonsterPixelArt')) fail('game.js missing drawMonsterPixelArt');
if (!game.includes('MONSTER_PIXEL_ART')) fail('game.js missing MONSTER_PIXEL_ART');

if (!game.includes('Object.assign(SPECIES, MONSTER_CATALOG_W2_EXPANDED.species')) {
  fail('SPECIES merge missing');
}
if (!game.includes('Object.assign(UNLOCK_AT, (MONSTER_CATALOG_W2_EXPANDED')) {
  fail('UNLOCK_AT merge missing');
}
const sampleIds = ['wolfling', 'helwolf', 'voidyeti', 'krabling', 'tandwieling', 'havikpup', 'voidmanmoet', 'zeeegel'];
for (const id of sampleIds) {
  if (!out.species[id]) fail('expanded missing ' + id);
  if (!game.includes("'" + id + "'") && !game.includes(id)) fail('bundle missing id ' + id);
}

const book = existing.size + out.speciesCount;
if (book < 700) fail('expected book 700+, got classic+catalog ' + book);

console.log(JSON.stringify({
  ok: true,
  families: out.familyCount,
  w2: ctx.__w2,
  w3: ctx.__w3,
  newSpecies: out.speciesCount,
  classicSpecies: existing.size,
  bookEstimate: book,
  artSlots: arts.length,
  pixelSlots: pixel,
  stubSlots: stub,
  pixelAliased: ids.length - strayAlias - (ids.filter((id) => out.species[id].pixelStatus === 'pixel').length),
  provisionalIds: prov.size,
}, null, 2));
console.log('SMOKE_OK monster-catalog');
