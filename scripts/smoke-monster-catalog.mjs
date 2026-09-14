#!/usr/bin/env node
/**
 * Monster catalog W2: ~2× roster, 36 art slots, unlocks, spawn wiring.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const catalog = fs.readFileSync(path.join(root, 'src/data/monster-catalog.js'), 'utf8');
const slotsDoc = fs.readFileSync(path.join(root, 'docs/MONSTER-ART-SLOTS.md'), 'utf8');

function fail(why) {
  console.error('SMOKE_FAIL monster-catalog:', why);
  process.exit(1);
}

if (!game.includes('MONSTER_ART_SLOTS')) fail('game.js missing MONSTER_ART_SLOTS');
if (!game.includes('drawCatalogStubArt')) fail('game.js missing drawCatalogStubArt');
if (!game.includes('woodsWave')) fail('game.js missing woodsWave banner');
if (!game.includes("meta.trait = 'woods'")) fail('buildLevel missing woods trait');
if (!game.includes("meta.trait = 'crypt'")) fail('buildLevel missing crypt trait');
if (!game.includes("meta.trait = 'scrap'")) fail('buildLevel missing scrap trait');
if (!game.includes('voidyeti')) fail('BOSS_AT missing catalog boss voidyeti');
if (!slotsDoc.includes('wolf') || !slotsDoc.includes('pixelStatus')) fail('art-slots doc incomplete');

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
  '\nthis.__out = expandMonsterCatalog(MONSTER_FAMILIES_W2);' +
  '\nthis.__slots = MONSTER_ART_SLOTS;' +
  '\nthis.__arts = Object.keys(MONSTER_ART_SLOTS);' +
  '\nthis.__alias = MONSTER_PIXEL_ALIAS;' +
  '\nthis.__prov = MONSTER_PIXEL_PROVISIONAL_SET;',
  ctx
);

const out = ctx.__out;
const arts = ctx.__arts;
if (!out || out.speciesCount !== 288) fail('expected 288 expanded species, got ' + (out && out.speciesCount));
if (!arts || arts.length !== 36) fail('expected 36 art slots, got ' + (arts && arts.length));
if (out.familyCount !== 36) fail('expected 36 families, got ' + out.familyCount);

const ids = Object.keys(out.species);
const uniq = new Set(ids);
if (uniq.size !== ids.length) fail('duplicate expanded ids');
const clash = ids.filter((id) => existing.has(id));
if (clash.length) fail('id collision with live SPECIES: ' + clash.join(','));
if (existing.size < 200) fail('failed to parse existing SPECIES: ' + existing.size);

let stub = 0;
for (const art of arts) {
  if (!slotsDoc.includes('`' + art + '`') && !slotsDoc.includes('| `' + art + '`')) {
    fail('art slot not documented: ' + art);
  }
  if (ctx.__slots[art].pixelStatus === 'stub') stub++;
}
if (stub < 30) fail('expected stub placeholders for pixel partner');

const prov = ctx.__prov;
const alias = ctx.__alias;
if (!prov || prov.size < 60) fail('provisional pixel set missing');
for (const art of arts) {
  const a = alias[art];
  if (!a || !a.pixel) fail('W2 art missing pixel alias: ' + art);
  if (!prov.has(a.pixel)) fail('alias not in #282 map: ' + art + ' → ' + a.pixel);
  if (a.high && !prov.has(a.high)) fail('high alias not in #282 map: ' + art + ' → ' + a.high);
}
let missingPixel = 0;
for (const id of ids) {
  const px = out.species[id].pixel;
  if (!px || !prov.has(px)) missingPixel++;
}
if (missingPixel) fail('species missing #282 pixel alias: ' + missingPixel);

if (!game.includes('drawMonsterPixelArt')) fail('game.js missing drawMonsterPixelArt');
if (!game.includes('MONSTER_PIXEL_ART')) fail('game.js missing MONSTER_PIXEL_ART');

if (!game.includes('Object.assign(SPECIES, MONSTER_CATALOG_W2_EXPANDED.species')) {
  fail('SPECIES merge missing');
}
if (!game.includes('Object.assign(UNLOCK_AT, (MONSTER_CATALOG_W2_EXPANDED')) {
  fail('UNLOCK_AT merge missing');
}
const sampleIds = ['wolfling', 'helwolf', 'voidyeti', 'krabling', 'tandwieling'];
for (const id of sampleIds) {
  if (!out.species[id]) fail('expanded missing ' + id);
  if (!game.includes("'" + id + "'") && !game.includes(id)) fail('bundle missing id ' + id);
}

console.log(JSON.stringify({
  ok: true,
  families: out.familyCount,
  newSpecies: out.speciesCount,
  artSlots: arts.length,
  stubSlots: stub,
  pixelAliased: ids.length - missingPixel,
  provisionalIds: prov.size,
}, null, 2));
console.log('SMOKE_OK monster-catalog');
